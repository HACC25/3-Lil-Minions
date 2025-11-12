/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from "react";

interface SimpleFallbackAvatarProps {
  sessionStarted: boolean;
  dialogflowResponse: string[];
  onAvatarSpeakingChange: (speaking: boolean) => void;
  onAvatarReady?: (ready: boolean) => void;
  isLoading?: boolean;
  interviewId?: string;
  onError?: (error: Error) => void;
}

const SimpleFallbackAvatar: React.FC<SimpleFallbackAvatarProps> = ({
  sessionStarted,
  dialogflowResponse,
  onAvatarSpeakingChange,
  onAvatarReady,
  isLoading = false,
  interviewId,
  onError,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(0);

  // Audio and speech synthesis refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef<boolean>(false);
  const elevenLabsKeyRef = useRef<string>("");
  const processedResponsesRef = useRef<Set<string>>(new Set()); // ✅ FIXED: Track processed responses

  // Animation refs
  const animationFrameRef = useRef<number | undefined>(undefined);
  const volumeRef = useRef<number>(0);
  const targetVolumeRef = useRef<number>(0);

  // Configuration - Updated for 2025 with optimized model selection
  const ELEVENLABS_VOICE_ID = "aEO01A4wXwd1O8GPgGlF"; // Arabella voice ID
  const ELEVENLABS_MODEL = "eleven_flash_v2_5"; // Ultra-low latency for real-time (~75ms)
  // Alternative options:
  // "eleven_flash_v2_5" - Ultra-low latency for real-time (~75ms)
  // "eleven_multilingual_v2" - High quality (default, ~500ms)
  // "eleven_turbo_v2_5" - Balanced speed/quality (~250-300ms)

  // Initialize component
  useEffect(() => {
    const initialize = async () => {
      try {
        // Your existing ElevenLabs key fetch code here...
        try {
          const response = await fetch("/api/get-elevenlabs-key", {
            method: "POST",
          });
          if (response.ok) {
            const key = await response.text();
            if (!key || key.trim().length === 0) {
              throw new Error("Empty ElevenLabs API key received");
            }
            elevenLabsKeyRef.current = key;
          } else {
            throw new Error(`API key fetch failed: ${response.status}`);
          }
        } catch (error: any) {
          console.warn("⚠️ ElevenLabs API key fetch failed:", error);
          // Report as warning since browser TTS can still work
          handleError(
            new Error(`ElevenLabs unavailable: ${error.message}`),
            "warning",
          );
        }

        // Test browser TTS availability
        if (!window.speechSynthesis) {
          throw new Error("Speech synthesis not supported in this browser");
        }

        setIsInitialized(true);
        if (onAvatarReady) {
          onAvatarReady(true);
        }
        startAnimationLoop();
      } catch (error: any) {
        console.error("❌ SimpleFallbackAvatar initialization failed:", error);

        // Check if we have any TTS capabilities at all
        const hasAnyTTS = !!(
          window.speechSynthesis || elevenLabsKeyRef.current
        );

        if (hasAnyTTS) {
          // Partial functionality - continue but warn
          setIsInitialized(true);
          if (onAvatarReady) {
            onAvatarReady(true);
          }
          startAnimationLoop();
          handleError(error, "warning");
        } else {
          // Complete failure - report critical error
          handleError(
            new Error(`SimpleFallbackAvatar failed: ${error.message}`),
            "critical",
          );
        }
      }
    };

    initialize();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // ✅ FIXED: Stop any ongoing speech synthesis
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // When an error occurs:
  const handleError = useCallback(
    (error: Error, severity: "warning" | "critical" = "critical") => {
      console.error(`SimpleFallbackAvatar ${severity}:`, error);

      // Always notify parent of errors for UnifiedAvatar integration
      if (onError) {
        onError(error);
      }

      // For critical errors, mark as not ready
      if (severity === "critical" && onAvatarReady) {
        onAvatarReady(false);
      }
    },
    [onError, onAvatarReady],
  );

  // Animation loop for smooth volume transitions
  const startAnimationLoop = useCallback(() => {
    const animate = () => {
      // Smooth volume transitions
      const diff = targetVolumeRef.current - volumeRef.current;
      volumeRef.current += diff * 0.15; // Smooth interpolation

      setCurrentVolume(volumeRef.current);

      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, []);

  // Update speaking state and notify parent
  const updateSpeakingState = useCallback(
    (speaking: boolean) => {
      setIsSpeaking(speaking);
      isSpeakingRef.current = speaking;
      onAvatarSpeakingChange(speaking);

      // Update target volume for animation
      targetVolumeRef.current = speaking ? 0.8 + Math.random() * 0.2 : 0;
    },
    [onAvatarSpeakingChange],
  );

  // Text normalization helper (recommended for Flash models)
  const normalizeText = useCallback((text: string): string => {
    // Basic text normalization for optimal Flash model performance
    return text
      .trim()
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/([.!?])\s*([A-Z])/g, "$1 $2") // Ensure space after punctuation
      .replace(/\n+/g, ". ") // Convert line breaks to periods
      .replace(/\s*([.!?])\s*/g, "$1 "); // Clean up punctuation spacing
  }, []);

  // ✅ FIXED: Enhanced process queue with better duplicate prevention
  const processQueue = useCallback(async () => {
    if (
      isSpeakingRef.current ||
      speechQueueRef.current.length === 0 ||
      !sessionStarted
    ) {
      return;
    }

    const nextText = speechQueueRef.current.shift();
    if (!nextText) return;

    // ✅ FIXED: Skip if already processed (prevents double speech)
    const textHash = `${nextText.trim()}-${nextText.length}`;
    if (processedResponsesRef.current.has(textHash)) {
      //   console.log("🔄 Skipping duplicate text in fallback avatar");
      setTimeout(() => processQueue(), 100); // Continue with next item
      return;
    }

    try {
      processedResponsesRef.current.add(textHash);
      updateSpeakingState(true);

      // Always try ElevenLabs first, fallback to browser TTS only if it fails
      const success = await speakWithElevenLabs(nextText);
      if (!success) {
        console.warn("🔄 ElevenLabs failed, falling back to browser TTS");
        await speakWithBrowserTTS(nextText);
      }
    } catch (error) {
      console.error("❌ Error in speech synthesis:", error);
      updateSpeakingState(false);
      // Continue processing queue even if one item fails
      setTimeout(() => processQueue(), 300);
    }
  }, [sessionStarted, updateSpeakingState]);

  // ElevenLabs text-to-speech with 2025 Flash v2.5 model and optimized settings
  const speakWithElevenLabs = useCallback(
    async (text: string): Promise<boolean> => {
      if (!elevenLabsKeyRef.current) {
        console.warn("❌ No ElevenLabs API key available");
        return false;
      }

      // Check text length limits - Flash v2.5 supports up to 40,000 characters
      const maxLength = 40000;
      if (text.length > maxLength) {
        console.warn(
          `⚠️ Text too long (${text.length} chars), truncating to ${maxLength}`,
        );
        text = text.substring(0, maxLength - 3) + "...";
      }

      try {
        // console.log(
        //   `🎵 Using ElevenLabs TTS (Arabella/Flash v2.5) for:`,
        //   text.substring(0, 50) + "..."
        // );

        // Normalize text for optimal Flash model performance
        const normalizedText = normalizeText(text);

        const requestBody: any = {
          text: normalizedText,
          model_id: ELEVENLABS_MODEL, // Using Flash v2.5 model
          voice_settings: {
            stability: 0.6, // Optimized for Flash model consistency
            similarity_boost: 0.8, // High similarity for Arabella
            style: 0.2, // Moderate style for interview context
            use_speaker_boost: true,
            speed: 1.0, // New parameter for 2025
          },
          // Enhanced 2025 parameters
          language_code: "en", // Enforce English processing for Flash/Turbo models
          apply_text_normalization: "auto", // Let ElevenLabs handle additional normalization
          // Optional: Add pronunciation dictionary
          pronunciation_dictionary_locators: [],
        };

        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
          {
            method: "POST",
            headers: {
              Accept: "audio/mpeg",
              "Content-Type": "application/json",
              "xi-api-key": elevenLabsKeyRef.current,
            },
            body: JSON.stringify(requestBody),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `❌ ElevenLabs API error: ${response.status} - ${errorText}`,
          );

          if (response.status === 401) {
            elevenLabsKeyRef.current = ""; // Invalidate key
            handleError(new Error("ElevenLabs API key invalid"), "warning");
          } else if (response.status === 429) {
            console.warn("⚠️ ElevenLabs rate limited");
            // Don't report rate limits as errors - just fall back
          }

          throw new Error(`ElevenLabs API error: ${response.status}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        return new Promise((resolve) => {
          const audio = new Audio(audioUrl);
          audioRef.current = audio;

          // Set volume to maximum for clear audio
          audio.volume = 1.0;

          audio.onloadeddata = () => {
            // Start volume animation when audio is ready
            const duration = audio.duration * 1000; // Convert to milliseconds
            animateVolumeForDuration(duration);
          };

          audio.onended = () => {
            updateSpeakingState(false);
            URL.revokeObjectURL(audioUrl);
            audioRef.current = null;
            resolve(true);
            // Process next item in queue immediately (faster for Flash model)
            setTimeout(() => processQueue(), 150);
          };

          audio.onerror = (error) => {
            console.warn("⚠️ ElevenLabs audio playback failed:", error);
            updateSpeakingState(false);
            URL.revokeObjectURL(audioUrl);
            audioRef.current = null;
            resolve(false);
          };

          // Start playback
          audio.play().catch((error) => {
            console.warn("⚠️ Error playing ElevenLabs audio:", error);
            updateSpeakingState(false);
            URL.revokeObjectURL(audioUrl);
            resolve(false);
          });
        });
      } catch (error) {
        console.error("❌ ElevenLabs synthesis error:", error);
        // ONLY report authentication errors as warnings
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("invalid") || errorMessage.includes("401")) {
          handleError(
            new Error(`ElevenLabs auth failed: ${errorMessage}`),
            "warning",
          );
        }
        return false;
      }
    },
    [updateSpeakingState, processQueue, normalizeText, handleError],
  );

  // ✅ FIXED: Enhanced browser TTS with better cleanup
  const speakWithBrowserTTS = useCallback(
    async (text: string): Promise<void> => {
      //   console.log(
      //     "🔊 Using Browser TTS fallback for:",
      //     text.substring(0, 50) + "..."
      //   );

      return new Promise((resolve, reject) => {
        if (!window.speechSynthesis) {
          reject(new Error("Speech synthesis not supported"));
          return;
        }

        // ✅ FIXED: Cancel any ongoing speech before starting new one
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Wait for voices to load if needed
        const setVoiceAndSpeak = () => {
          const voices = window.speechSynthesis.getVoices();

          // Prefer high-quality voices
          const preferredVoice =
            voices.find(
              (voice) =>
                voice.name.includes("Premium") && voice.lang.startsWith("en"),
            ) ||
            voices.find(
              (voice) =>
                voice.name.includes("Enhanced") && voice.lang.startsWith("en"),
            ) ||
            voices.find(
              (voice) =>
                voice.name.includes("Google") && voice.lang.startsWith("en"),
            ) ||
            voices.find(
              (voice) =>
                voice.name.includes("Microsoft") && voice.lang.startsWith("en"),
            ) ||
            voices.find((voice) => voice.lang.startsWith("en-US")) ||
            voices.find((voice) => voice.lang.startsWith("en")) ||
            voices[0];

          if (preferredVoice) {
            utterance.voice = preferredVoice;
            // console.log("🔊 Using browser voice:", preferredVoice.name);
          }

          // Optimize settings for interview context
          utterance.rate = 0.95; // Slightly slower for clarity
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          utterance.onstart = () => {
            // Animate volume for estimated duration
            const estimatedDuration = text.length * 55; // More accurate estimate
            animateVolumeForDuration(estimatedDuration);
          };

          utterance.onend = () => {
            updateSpeakingState(false);
            resolve();
            // Process next item in queue
            setTimeout(() => processQueue(), 200);
          };

          utterance.onerror = (event) => {
            console.error("❌ Browser TTS error:", event.error);
            updateSpeakingState(false);
            reject(new Error(`Speech synthesis error: ${event.error}`));
          };

          // ✅ FIXED: Additional check before speaking
          if (!isSpeakingRef.current) {
            // console.log("⚠️ Speaking state changed, cancelling browser TTS");
            resolve();
            return;
          }

          window.speechSynthesis.speak(utterance);
        };

        // Check if voices are already loaded
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setVoiceAndSpeak();
        } else {
          // Wait for voices to load
          window.speechSynthesis.onvoiceschanged = () => {
            setVoiceAndSpeak();
          };
        }
      });
    },
    [updateSpeakingState, processQueue],
  );

  // Animate volume for a specific duration
  const animateVolumeForDuration = useCallback((duration: number) => {
    const startTime = Date.now();
    const baseVolume = 0.65; // Slightly higher base volume
    const variationAmount = 0.25; // Reduced variation for smoother animation

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1 && isSpeakingRef.current) {
        // Create realistic speech-like volume variations
        const noise = (Math.random() - 0.5) * variationAmount;
        const speechPattern = Math.sin(elapsed * 0.006) * 0.15; // Slower, smoother pattern
        const envelope = Math.sin(progress * Math.PI) * 0.85 + 0.15; // Smoother fade

        targetVolumeRef.current = Math.max(
          0.25,
          Math.min(1, (baseVolume + noise + speechPattern) * envelope),
        );

        requestAnimationFrame(animate);
      } else {
        targetVolumeRef.current = 0;
      }
    };

    animate();
  }, []);

  // ✅ FIXED: Enhanced response handling with better duplicate prevention
  useEffect(() => {
    if (dialogflowResponse && dialogflowResponse.length > 0 && sessionStarted) {
      const newResponses = dialogflowResponse
        .filter((response) => response && response.trim().length > 0)
        .map((response) => response.trim());

      if (newResponses.length > 0) {
        // console.log(
        //   "🔵 Fallback avatar received Dialogflow responses:",
        //   newResponses.length,
        //   "- Processing with duplicate prevention"
        // );

        // ✅ FIXED: Filter out already processed responses
        const uniqueResponses = newResponses.filter((response) => {
          const textHash = `${response.trim()}-${response.length}`;
          return !processedResponsesRef.current.has(textHash);
        });

        if (uniqueResponses.length === 0) {
          //   console.log("🔄 All responses already processed, skipping");
          return;
        }

        // Add unique responses to queue
        speechQueueRef.current.push(...uniqueResponses);

        // console.log(
        //   "📤 Added to speech queue. Total queue length:",
        //   speechQueueRef.current.length,
        //   "Unique new items:",
        //   uniqueResponses.length
        // );

        // Start processing if not already speaking
        if (!isSpeakingRef.current) {
          processQueue();
        }
      }
    }
  }, [dialogflowResponse, sessionStarted, processQueue]);

  // ✅ FIXED: Clear processed responses when session restarts
  useEffect(() => {
    if (sessionStarted) {
      processedResponsesRef.current.clear();
      //   console.log("🔄 Cleared processed responses for new session");
    }
  }, [sessionStarted]);

  // Calculate pulsing animation values - Enhanced for better visual feedback
  const getPulseStyle = () => {
    const baseSize = 180;
    const pulseIntensity = currentVolume;
    const size = baseSize + pulseIntensity * 90; // Slightly more dramatic pulse
    const opacity = 0.75 + pulseIntensity * 0.25;
    const glowIntensity = pulseIntensity * 30;

    return {
      width: `${size}px`,
      height: `${size}px`,
      opacity,
      boxShadow: `
        0 0 ${20 + glowIntensity}px rgba(59, 130, 246, ${0.65 + pulseIntensity * 0.35}),
        0 0 ${40 + glowIntensity * 2}px rgba(59, 130, 246, ${0.45 + pulseIntensity * 0.25}),
        0 0 ${80 + glowIntensity * 3}px rgba(59, 130, 246, ${0.25 + pulseIntensity * 0.15}),
        inset 0 0 ${12 + glowIntensity}px rgba(147, 197, 253, ${0.35 + pulseIntensity * 0.15})
      `,
      transform: `scale(${1 + pulseIntensity * 0.18})`,
    };
  };

  if (isLoading || !isInitialized) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          minHeight: "400px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid #3b82f6",
              borderTop: "3px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <div style={{ color: "#94a3b8", fontSize: "14px" }}>
            Initializing AI Assistant (Arabella Flash v2.5)...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: "#0f172a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        overflow: "hidden",
      }}
    >
      {/* Enhanced background gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
          radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 65%),
          radial-gradient(circle at 25% 75%, rgba(147, 51, 234, 0.06) 0%, transparent 55%),
          radial-gradient(circle at 75% 25%, rgba(59, 130, 246, 0.04) 0%, transparent 45%)
        `,
          animation: "backgroundShift 30s ease-in-out infinite",
        }}
      />

      {/* Main avatar orb */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Outer pulse rings - More pronounced when speaking */}
        {isSpeaking &&
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                borderRadius: "50%",
                border: `${2 + i}px solid rgba(59, 130, 246, ${0.4 - i * 0.08})`,
                animation: `ripple ${1.8 + i * 0.4}s ease-out infinite`,
                animationDelay: `${i * 0.15}s`,
                opacity: 0.8 - i * 0.15,
              }}
            />
          ))}

        {/* Main pulsing orb */}
        <div
          style={{
            ...getPulseStyle(),
            borderRadius: "50%",
            background: `
              radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.35), transparent 45%),
              radial-gradient(circle at 50% 50%, rgba(147, 197, 253, 0.95), rgba(59, 130, 246, 1))
            `,
            transition: "all 0.08s ease-out", // Smoother transitions
            position: "relative",
            zIndex: 2,
            border: "4px solid rgba(147, 197, 253, 0.5)",
          }}
        >
          {/* Inner highlight - More dynamic */}
          <div
            style={{
              position: "absolute",
              top: "12%",
              left: "12%",
              width: "40%",
              height: "40%",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.7)",
              filter: "blur(15px)",
              opacity: 0.85 + currentVolume * 0.15,
            }}
          />
        </div>

        {/* Enhanced speaking indicator bars */}
        {isSpeaking && (
          <div
            style={{
              position: "absolute",
              bottom: "-55px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "8px",
              zIndex: 3,
            }}
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: "8px",
                  height: "28px",
                  borderRadius: "4px",
                  background:
                    "linear-gradient(to top, rgba(59, 130, 246, 1), rgba(147, 197, 253, 0.8))",
                  animation: `soundBars 0.7s ease-in-out infinite`,
                  animationDelay: `${i * 0.08}s`,
                  transform: `scaleY(${0.35 + currentVolume * 0.65})`,
                  boxShadow: `0 0 12px rgba(59, 130, 246, ${0.6 + currentVolume * 0.4})`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Enhanced status text */}
      {/* <div
        style={{
          position: "absolute",
          bottom: "25px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#94a3b8",
          fontSize: "16px",
          fontWeight: "500",
          textAlign: "center",
          zIndex: 3,
          textShadow: "0 2px 6px rgba(0, 0, 0, 0.6)",
        }}
      >
        {isSpeaking ? (
          <span style={{ color: "#60a5fa" }}>🎤 Arabella is speaking...</span>
        ) : (
          <span>🤖 AI Assistant Ready (Arabella Flash)</span>
        )}
      </div> */}

      {/* Enhanced development debug info */}
      {process.env.NODE_ENV === "development" && (
        <div
          style={{
            position: "absolute",
            top: "15px",
            left: "15px",
            background: "rgba(0,0,0,0.85)",
            color: "white",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "12px",
            zIndex: 10,
            fontFamily: "monospace",
            border: "1px solid rgba(59, 130, 246, 0.3)",
          }}
        >
          <div>
            🔵 <strong>Fallback Avatar (Arabella Flash v2.5)</strong>
          </div>
          <div>Speaking: {isSpeaking ? "🗣️" : "🤐"}</div>
          <div>Volume: {(currentVolume * 100).toFixed(0)}%</div>
          <div>Queue: {speechQueueRef.current.length} items</div>
          <div>Processed: {processedResponsesRef.current.size} responses</div>
          <div>
            ElevenLabs: {elevenLabsKeyRef.current ? "✅ Flash v2.5" : "❌"}
          </div>
          <div>Voice ID: {ELEVENLABS_VOICE_ID.slice(0, 8)}...</div>
          <div>Model: {ELEVENLABS_MODEL}</div>
          <div>Latency: ~75ms</div>
          {interviewId && <div>Interview: {interviewId.slice(0, 8)}...</div>}
        </div>
      )}

      {/* CSS Animations - Enhanced */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes ripple {
          0% {
            width: 180px;
            height: 180px;
            opacity: 0.9;
          }
          100% {
            width: 400px;
            height: 400px;
            opacity: 0;
          }
        }

        @keyframes soundBars {
          0%,
          100% {
            transform: scaleY(0.35);
            opacity: 0.8;
          }
          50% {
            transform: scaleY(1.3);
            opacity: 1;
          }
        }

        @keyframes backgroundShift {
          0%,
          100% {
            transform: rotate(0deg) scale(1);
          }
          25% {
            transform: rotate(90deg) scale(1.02);
          }
          50% {
            transform: rotate(180deg) scale(0.98);
          }
          75% {
            transform: rotate(270deg) scale(1.02);
          }
        }
      `}</style>
    </div>
  );
};

export default SimpleFallbackAvatar;
