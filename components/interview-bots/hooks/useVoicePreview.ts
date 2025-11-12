import { useState, useRef, useCallback } from "react";

interface VoicePreviewState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  currentVoiceId: string | null;
}

export const useVoicePreview = () => {
  const [state, setState] = useState<VoicePreviewState>({
    isPlaying: false,
    isLoading: false,
    error: null,
    currentVoiceId: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const currentVoiceIdRef = useRef<string | null>(null);

  const stopAllAudio = useCallback(() => {
    // Stop HTML audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    // Stop synthetic audio
    if (synthSourceRef.current) {
      try {
        synthSourceRef.current.stop();
      } catch {
        // Source might already be stopped
      }
      synthSourceRef.current = null;
    }
  }, []);

  const playVoicePreview = useCallback(
    async (voiceId: string) => {
      try {
        // Stop any currently playing audio immediately
        stopAllAudio();

        // If the same voice is playing, just stop it
        if (currentVoiceIdRef.current === voiceId && state.isPlaying) {
          setState((prev) => ({
            ...prev,
            isPlaying: false,
            currentVoiceId: null,
          }));
          currentVoiceIdRef.current = null;
          return;
        }

        // Set loading state immediately for better UX
        setState((prev) => ({
          ...prev,
          isLoading: true,
          isPlaying: false,
          error: null,
          currentVoiceId: voiceId,
        }));

        currentVoiceIdRef.current = voiceId;

        // Sample text for voice preview
        const previewText =
          "Hello! This is a preview of my voice. I'm excited to help you with your interview process.";

        // Call our API endpoint
        const response = await fetch("/api/voice-preview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            voiceId,
            text: previewText,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate voice preview");
        }

        const data = await response.json();

        // Handle mock responses for placeholder voices
        if (data.mockPreview) {
          console.log(data.message);
          setState((prev) => ({
            ...prev,
            isLoading: false,
            isPlaying: true,
          }));

          // Generate synthetic audio for mock preview
          try {
            const audioContext = new (window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext })
                .webkitAudioContext)();
            const duration = 3; // 3 seconds
            const sampleRate = audioContext.sampleRate;
            const buffer = audioContext.createBuffer(
              1,
              duration * sampleRate,
              sampleRate,
            );
            const bufferData = buffer.getChannelData(0);

            // Generate voice-like synthetic audio with varying frequency
            for (let i = 0; i < bufferData.length; i++) {
              const time = i / sampleRate;
              const baseFreq = 150 + Math.sin(time * 2) * 50; // Voice-like frequency range
              const amplitude = Math.sin((time * Math.PI) / duration) * 0.1; // Fade in/out
              bufferData[i] =
                amplitude * Math.sin(2 * Math.PI * baseFreq * time);
            }

            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);

            // Store reference for cleanup
            synthSourceRef.current = source;

            source.onended = () => {
              if (currentVoiceIdRef.current === voiceId) {
                setState((prev) => ({
                  ...prev,
                  isPlaying: false,
                  currentVoiceId: null,
                }));
                currentVoiceIdRef.current = null;
              }
              synthSourceRef.current = null;
            };

            source.start();
          } catch (error) {
            console.error("Error generating synthetic audio:", error);
            // Fallback to timer-based simulation
            setTimeout(() => {
              if (currentVoiceIdRef.current === voiceId) {
                setState((prev) => ({
                  ...prev,
                  isPlaying: false,
                  currentVoiceId: null,
                }));
                currentVoiceIdRef.current = null;
              }
            }, 2500);
          }

          return;
        }

        // Create audio element and play
        const audio = new Audio();

        if (data.audioUrl) {
          audio.src = data.audioUrl;
        } else if (data.audioData) {
          // If base64 encoded
          audio.src = `data:audio/mp3;base64,${data.audioData}`;
        } else {
          throw new Error("No audio data received");
        }

        audioRef.current = audio;

        // Set a 2.5-second timeout to stop the audio
        const timeoutId = setTimeout(() => {
          if (currentVoiceIdRef.current === voiceId && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setState((prev) => ({
              ...prev,
              isPlaying: false,
              currentVoiceId: null,
            }));
            currentVoiceIdRef.current = null;
            audioRef.current = null;
          }
        }, 3000);

        audio.onloadeddata = () => {
          if (currentVoiceIdRef.current === voiceId) {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              isPlaying: true,
            }));
            audio.play();
          }
        };

        audio.onended = () => {
          clearTimeout(timeoutId);
          if (currentVoiceIdRef.current === voiceId) {
            setState((prev) => ({
              ...prev,
              isPlaying: false,
              currentVoiceId: null,
            }));
            currentVoiceIdRef.current = null;
          }
          audioRef.current = null;
        };

        audio.onerror = () => {
          clearTimeout(timeoutId);
          if (currentVoiceIdRef.current === voiceId) {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              isPlaying: false,
              error: "Failed to play audio",
              currentVoiceId: null,
            }));
            currentVoiceIdRef.current = null;
          }
          audioRef.current = null;
        };
      } catch (error) {
        if (currentVoiceIdRef.current === voiceId) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            isPlaying: false,
            error: (error as Error).message,
            currentVoiceId: null,
          }));
          currentVoiceIdRef.current = null;
        }
      }
    },
    [stopAllAudio, state.isPlaying],
  );

  const stopVoicePreview = useCallback(() => {
    stopAllAudio();
    setState((prev) => ({
      ...prev,
      isPlaying: false,
      currentVoiceId: null,
    }));
    currentVoiceIdRef.current = null;
  }, [stopAllAudio]);

  return {
    playVoicePreview,
    stopVoicePreview,
    isPlaying: state.isPlaying,
    isLoading: state.isLoading,
    error: state.error,
    currentVoiceId: state.currentVoiceId,
  };
};
