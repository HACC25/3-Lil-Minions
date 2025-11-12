/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskMode,
  TaskType,
  VoiceEmotion,
  STTProvider,
  StartAvatarRequest,
} from "@heygen/streaming-avatar";
import { useEffect, useRef, useState } from "react";
import { Spinner } from "@nextui-org/react";

const cleanAvatarResponse = (response: string): string => {
  if (!response) return response;

  const patternsToRemove = [
    /\b(?:Overview|Introduction|Technical|Behavioral|Conclusion|Pre_?Qualification)_?Flow\(\)/gi,
    /\b(?:Overview|Introduction|Technical|Behavioral|Conclusion|Pre_?Qualification)\s+Flow\b/gi,
    /\$\{PLAYBOOK:\s*[^}]*\}/g,
    /\$PLAYBOOK:\s*\S+/g,
    /DO NOT SHARE BOT PERSONALITY/gi,
    /Do not say the Playbook name/gi,
    /gently transition to:/gi,
    /Without waiting for a response/gi,
    /set: \$session\.params\.interviewEnd = true/gi,
    /\[Internal Context\]/gi,
    /\[Personality Instructions\]/gi,
    /\[Interview Instructions\]/gi,
    /\[Opening Statement\]/gi,
    /^\s*-\s*(?:Transition|End of|Opening Statement).*$/gm,
    /\s+/g,
  ];

  let cleaned = response;

  for (let i = 0; i < patternsToRemove.length - 1; i++) {
    const pattern = patternsToRemove[i];
    cleaned = cleaned.replace(pattern, "");
  }

  cleaned = cleaned.replace(/\s+/g, " ").trim();

  if (!cleaned || cleaned.length < 10) {
    console.warn(
      "⚠️ [HeyGen Avatar] Response became empty after cleaning, using fallback",
    );
    return "Let me continue with the interview.";
  }

  return cleaned;
};

interface InteractiveAvatarProps {
  sessionStarted: boolean;
  dialogflowResponse: string[];
  onAvatarSpeakingChange: (speaking: boolean) => void;
  onAvatarReady?: (ready: boolean) => void;
  isLoading?: boolean;
  interviewId?: string;
  onError?: (error: Error) => void;
}

export default function InteractiveAvatar({
  sessionStarted,
  dialogflowResponse,
  onAvatarSpeakingChange,
  onAvatarReady,
  isLoading = false,
  interviewId,
  onError,
}: InteractiveAvatarProps) {
  // Core states
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  const [debug, setDebug] = useState<string>("");
  const [hasReportedError, setHasReportedError] = useState(false);

  // Session tracking
  const [trackedSessionId, setTrackedSessionId] = useState<string | null>(null);

  // Refs
  const mediaStream = useRef<HTMLVideoElement>(null);
  const avatar = useRef<StreamingAvatar | null>(null);
  const tokenRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced billing protection refs
  const initializationAttemptedRef = useRef<boolean>(false);
  const sessionCreatedRef = useRef<boolean>(false);
  const componentIdRef = useRef(crypto.randomUUID());
  const initDelay = useRef(Math.random() * 1000 + 200);
  const isIntentionallyEndingRef = useRef<boolean>(false);

  // Queue for HeyGen avatar
  const queueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef<boolean>(false);

  // Configuration constants
  const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000;
  const KEEPALIVE_INTERVAL = 30 * 1000;
  const MAX_QUEUE_SIZE = 50;
  const SPEAK_DELAY = 100;
  const INITIALIZATION_TIMEOUT = 30000; // 30 seconds

  // Default configuration
  const DEFAULT_CONFIG: StartAvatarRequest = {
    avatarName: "June_HR_public",
    quality: AvatarQuality.Medium,
    knowledgeId: "",
    voice: {
      rate: 1.2,
      emotion: VoiceEmotion.FRIENDLY,
    },
    language: "en",
    sttSettings: {
      provider: STTProvider.DEEPGRAM,
    },
    disableIdleTimeout: true,
  };

  // Enhanced error reporting
  const reportError = (error: Error) => {
    if (!hasReportedError && onError) {
      console.error("❌ HeyGen Avatar Error:", error);
      setHasReportedError(true);
      onError(error);
    }
  };

  const logWithSession = (message: string, ...args: any[]) => {
    const sessionInfo = "Interview Assistant | HR";

    console.log(
      `[HeyGen Avatar ${componentIdRef.current.slice(0, 8)} | ${sessionInfo}] ${message}`,
      ...args,
    );
  };

  // Enhanced access token fetch
  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", { method: "POST" });

      if (!response.ok) {
        throw new Error(`Failed to fetch token: ${response.status}`);
      }

      const token = await response.text();

      if (!token || token.trim() === "" || token === "undefined") {
        throw new Error("Empty or invalid token received");
      }

      logWithSession("✅ Access token fetched successfully");
      return token;
    } catch (error) {
      console.error("❌ Error fetching access token:", error);
      setDebug("Error fetching access token");
      throw error;
    }
  }

  // Enhanced initialization
  async function initializeAvatar() {
    if (
      initializationAttemptedRef.current ||
      sessionCreatedRef.current ||
      hasReportedError
    ) {
      logWithSession(
        "Avatar initialization skipped - already attempted or failed",
      );
      return;
    }

    logWithSession("🎭 Attempting HeyGen avatar initialization...");

    initializationAttemptedRef.current = true;
    setIsLoadingSession(true);

    // Set initialization timeout
    initializationTimeoutRef.current = setTimeout(() => {
      if (!isInitialized && !hasReportedError) {
        logWithSession("⏰ HeyGen initialization timeout");
        const error = new Error(
          "HeyGen initialization timeout - no response from service",
        );
        reportError(error);
      }
    }, INITIALIZATION_TIMEOUT);

    try {
      const token = await fetchAccessToken();
      if (!token) {
        clearTimeout(initializationTimeoutRef.current!);
        logWithSession("No token available");
        throw new Error("No HeyGen API access token available");
      }

      if (sessionCreatedRef.current || hasReportedError) {
        clearTimeout(initializationTimeoutRef.current!);
        logWithSession("Session already created or initialization failed");
        return;
      }

      avatar.current = new StreamingAvatar({ token });
      sessionCreatedRef.current = true;

      logWithSession("🏗️ HeyGen session created - this will be billed");

      // Enhanced event listeners
      avatar.current.on(StreamingEvents.AVATAR_START_TALKING, () => {
        if (!hasReportedError) {
          logWithSession("🗣️ Avatar started talking");
          onAvatarSpeakingChange(true);
          isSpeakingRef.current = true;
        }
      });

      avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, async () => {
        if (!hasReportedError) {
          logWithSession("🤐 Avatar stopped talking");
          onAvatarSpeakingChange(false);
          isSpeakingRef.current = false;
          await processQueue();
        }
      });

      avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, async () => {
        // Only report error if we're not intentionally ending the session
        if (!hasReportedError && !isIntentionallyEndingRef.current) {
          logWithSession("🔌 Stream disconnected unexpectedly");
          const error = new Error("HeyGen stream disconnected unexpectedly");
          reportError(error);
        } else if (isIntentionallyEndingRef.current) {
          logWithSession(
            "🔌 Stream disconnected (intentional - ending session)",
          );
        }
      });

      avatar.current.on(StreamingEvents.STREAM_READY, (event) => {
        if (!hasReportedError) {
          clearTimeout(initializationTimeoutRef.current!);
          logWithSession("✅ HeyGen stream ready");
          setStream(event.detail);
          setIsInitialized(true);

          if (onAvatarReady) {
            onAvatarReady(true);
          }
        }
      });

      avatar.current.on("error", (error) => {
        clearTimeout(initializationTimeoutRef.current!);
        console.error("❌ HeyGen stream error:", error);
        if (!hasReportedError) {
          const err = new Error(
            `HeyGen error: ${error.message || "Unknown error"}`,
          );
          reportError(err);
        }
      });

      logWithSession("🚀 Creating HeyGen avatar...");
      await avatar.current.createStartAvatar(DEFAULT_CONFIG);

      logWithSession("✅ HeyGen avatar created successfully");
      setDebug(`HeyGen avatar initialized: ${DEFAULT_CONFIG.avatarName}`);
    } catch (error: any) {
      clearTimeout(initializationTimeoutRef.current!);
      console.error("❌ Error initializing HeyGen avatar:", error);

      logWithSession("❌ HeyGen initialization failed");

      // Reset flags for clean state
      initializationAttemptedRef.current = false;
      sessionCreatedRef.current = false;

      // Check for specific error types
      let errorMessage = "HeyGen initialization failed";
      if (error.message?.includes("token")) {
        errorMessage = "HeyGen API token error - missing or invalid token";
      } else if (error.message?.includes("credit")) {
        errorMessage = "HeyGen credits exhausted";
      } else if (error.message?.includes("rate")) {
        errorMessage = "HeyGen rate limit exceeded";
      } else if (error.message) {
        errorMessage = `HeyGen error: ${error.message}`;
      }

      const err = new Error(errorMessage);
      reportError(err);
    } finally {
      if (!hasReportedError) {
        setIsLoadingSession(false);
      }
    }
  }

  // Start session features - only for HeyGen
  async function startSessionFeatures() {
    if (hasReportedError) {
      logWithSession("🔵 HeyGen failed - no session features needed");
      return;
    }

    if (!avatar.current || !isInitialized) {
      logWithSession("⚠️ HeyGen avatar not ready for session features");
      return;
    }

    logWithSession("🚀 Starting HeyGen session features...");

    try {
      if (sessionStarted && avatar.current && !hasReportedError) {
        // Token refresh with session isolation
        setTimeout(() => {
          if (sessionStarted && avatar.current && !hasReportedError) {
            tokenRefreshIntervalRef.current = setInterval(async () => {
              try {
                const newToken = await fetchAccessToken();
                logWithSession("🔄 Token refreshed");
              } catch (error) {
                console.error("❌ Error refreshing token:", error);
              }
            }, TOKEN_REFRESH_INTERVAL);
          }
        }, Math.random() * 5000);

        // Keepalive with session isolation
        setTimeout(() => {
          if (sessionStarted && avatar.current && !hasReportedError) {
            keepAliveIntervalRef.current = setInterval(() => {
              logWithSession("💓 Sending keepalive signal");
            }, KEEPALIVE_INTERVAL);
          }
        }, Math.random() * 3000);
      }

      setDebug("HeyGen avatar session active");
      logWithSession("✅ HeyGen session features started");
    } catch (error: any) {
      console.error("❌ Error starting session features:", error);
      setDebug(
        `Error starting session features: ${error.message || "Unknown error"}`,
      );
    }
  }

  // End session
  async function endSession() {
    logWithSession("🛑 Ending session...");

    // Mark as intentionally ending to prevent disconnect error
    isIntentionallyEndingRef.current = true;

    try {
      // Clear all timers first
      [
        tokenRefreshIntervalRef,
        keepAliveIntervalRef,
        initializationTimeoutRef,
      ].forEach((ref) => {
        if (ref.current) {
          clearTimeout(ref.current);
          clearInterval(ref.current);
          ref.current = null;
        }
      });

      // Stop avatar gracefully
      if (avatar.current && !hasReportedError) {
        logWithSession("Stopping HeyGen avatar...");
        await avatar.current.stopAvatar();
        logWithSession("✅ HeyGen avatar stopped successfully");
      }
    } catch (error) {
      console.error("❌ Error stopping avatar:", error);
      // Don't throw - continue cleanup
    }

    // Reset all states
    setStream(undefined);
    setDebug("");
    setIsInitialized(false);
    queueRef.current = [];
    isSpeakingRef.current = false;

    if (onAvatarReady) {
      onAvatarReady(false);
    }

    avatar.current = null;
    sessionCreatedRef.current = false;

    logWithSession("✅ Session cleanup complete");
  } // Process HeyGen speech queue
  async function processQueue() {
    if (hasReportedError) {
      // Don't process if failed
      return;
    }

    if (
      isSpeakingRef.current ||
      !avatar.current ||
      !stream ||
      !sessionStarted
    ) {
      return;
    }

    if (queueRef.current.length === 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, SPEAK_DELAY));

    const nextText = queueRef.current.shift();
    if (!nextText) return;

    try {
      isSpeakingRef.current = true;
      logWithSession(
        "🗣️ HeyGen avatar speaking:",
        nextText.substring(0, 50) + "...",
      );

      await avatar.current.speak({
        text: nextText,
        taskType: TaskType.REPEAT,
        taskMode: TaskMode.SYNC,
      });
    } catch (error: any) {
      console.error("❌ Error speaking:", error);
      isSpeakingRef.current = false;

      if (
        error.message?.toLowerCase().includes("disconnect") ||
        error.message?.toLowerCase().includes("connection")
      ) {
        logWithSession("❌ HeyGen speaking error - connection lost");
        queueRef.current.unshift(nextText); // Put text back in queue
        const err = new Error("HeyGen speaking error - connection lost");
        reportError(err);
      } else {
        await processQueue();
      }
    }
  }

  // Initialize with staggered delay
  useEffect(() => {
    logWithSession("🎭 HeyGen InteractiveAvatar component mounted");

    const delayedInit = setTimeout(() => {
      logWithSession(
        `Starting initialization after ${initDelay.current}ms delay`,
      );
      if (!hasReportedError) {
        initializeAvatar().catch(console.error);
      } else {
        logWithSession("Initialization failed");
      }
    }, initDelay.current);

    return () => {
      clearTimeout(delayedInit);
    };
  }, []);

  // Handle session start/stop
  useEffect(() => {
    if (sessionStarted && isInitialized && !hasReportedError) {
      startSessionFeatures();
    } else if (!sessionStarted) {
      // Clean up intervals when session stops
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
        tokenRefreshIntervalRef.current = null;
      }
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }

      setDebug("HeyGen session paused");
      logWithSession("HeyGen session paused");
    }
  }, [sessionStarted, isInitialized, hasReportedError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      logWithSession(
        "🧹 HeyGen InteractiveAvatar component unmounting, cleaning up...",
      );

      // Mark as intentionally ending to prevent disconnect error on unmount
      isIntentionallyEndingRef.current = true;

      // Clear all timers immediately
      [
        tokenRefreshIntervalRef,
        keepAliveIntervalRef,
        initializationTimeoutRef,
      ].forEach((ref) => {
        if (ref.current) {
          clearTimeout(ref.current);
          clearInterval(ref.current);
          ref.current = null;
        }
      });

      // Stop avatar without waiting (fire and forget on unmount)
      if (avatar.current) {
        avatar.current
          .stopAvatar()
          .then(() => logWithSession("✅ Avatar stopped on unmount"))
          .catch((error) =>
            console.error("❌ Error stopping avatar on unmount:", error),
          );
      }

      // Clear references
      avatar.current = null;
      sessionCreatedRef.current = false;
    };
  }, []); // Handle video stream for HeyGen
  useEffect(() => {
    if (stream && mediaStream.current && !hasReportedError) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = async () => {
        try {
          // Video element already has muted attribute, so it will autoplay
          await mediaStream.current!.play();
          console.log("✅ Video playback started (muted for autoplay)");

          // Add user interaction listener to unmute
          const handleFirstInteraction = () => {
            if (mediaStream.current && !mediaStream.current.muted) {
              return; // Already unmuted
            }

            if (mediaStream.current) {
              mediaStream.current.muted = false;
              console.log("✅ Video unmuted after user interaction");
            }

            // Remove listeners after first interaction
            document.removeEventListener("click", handleFirstInteraction);
            document.removeEventListener("touchstart", handleFirstInteraction);
            document.removeEventListener("keydown", handleFirstInteraction);
          };

          // Listen for any user interaction to unmute
          document.addEventListener("click", handleFirstInteraction, {
            once: true,
          });
          document.addEventListener("touchstart", handleFirstInteraction, {
            once: true,
          });
          document.addEventListener("keydown", handleFirstInteraction, {
            once: true,
          });
        } catch (error: any) {
          console.error("Video playback error:", error);
          if (error.name === "NotAllowedError") {
            console.warn("⚠️ Autoplay blocked - waiting for user interaction");
          }
        }
      };
    }
  }, [stream, hasReportedError]);

  // Auto-unmute when session starts (countdown finished = user gesture occurred)
  useEffect(() => {
    if (sessionStarted && mediaStream.current && mediaStream.current.muted) {
      // Session started means countdown ended, which counts as user interaction
      mediaStream.current.muted = false;
      console.log("✅ Video auto-unmuted when session started");
    }
  }, [sessionStarted]);

  // Handle dialogflow responses
  useEffect(() => {
    if (
      dialogflowResponse &&
      dialogflowResponse.length > 0 &&
      sessionStarted &&
      !hasReportedError
    ) {
      logWithSession(
        "📨 Received dialogflow responses:",
        dialogflowResponse.length,
      );

      const cleanedResponses = dialogflowResponse
        .filter((response) => response && response.trim().length > 0)
        .map((response, index) => {
          const cleaned = cleanAvatarResponse(response);
          if (response !== cleaned) {
            logWithSession(`🧹 Cleaned response ${index + 1}`);
          }
          return cleaned;
        })
        .filter((response) => response && response.trim().length > 0);

      if (cleanedResponses.length === 0) {
        logWithSession("⚠️ All responses filtered out after cleaning");
        return;
      }

      if (isInitialized && avatar.current) {
        // HeyGen avatar queue processing
        const combinedResponse = cleanedResponses.join(" ");
        const availableSpace = MAX_QUEUE_SIZE - queueRef.current.length;
        if (availableSpace > 0) {
          queueRef.current.push(combinedResponse);
          logWithSession("📤 Added response to HeyGen queue");
          processQueue().catch(console.error);
        } else {
          logWithSession("⚠️ HeyGen queue is full, cannot add response");
        }
      } else {
        logWithSession("⚠️ No avatar ready to handle response");
      }
    }
  }, [dialogflowResponse, sessionStarted, hasReportedError, isInitialized]);

  // Handle session tracking callbacks
  const handleSessionTracked = (sessionId: string) => {
    setTrackedSessionId(sessionId);
    logWithSession("📊 Avatar session tracked:", sessionId);
  };

  const handleSessionEnded = (sessionData: any) => {
    logWithSession("📊 Avatar session ended:", {
      sessionId: sessionData.id,
      duration: `${Math.round(sessionData.duration / 1000)}s`,
      creditsUsed: sessionData.creditsUsed,
    });
  };

  // Don't render error state - let parent handle it
  if (hasReportedError) {
    return null;
  }

  // Determine what to show
  const shouldShowSpinner =
    (isLoading || isLoadingSession) && !hasReportedError;
  const shouldShowVideo = stream && isInitialized && !hasReportedError;

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {/* Include session tracking only for HeyGen */}

      {/* Show HeyGen video avatar */}
      {shouldShowVideo && (
        <video
          ref={mediaStream}
          autoPlay
          playsInline
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}

      {/* Show loading spinner */}
      {shouldShowSpinner && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <Spinner color="primary" size="lg" />
          <div style={{ fontSize: "14px", color: "#666" }}>
            {isLoadingSession
              ? "Initializing Avatar..."
              : isLoading
                ? "Loading..."
                : "Preparing avatar..."}
          </div>
        </div>
      )}

      {/* Show debug message if no other content */}
      {!shouldShowVideo && !shouldShowSpinner && debug && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            padding: "1rem",
            textAlign: "center",
            color: "#666",
          }}
        >
          {debug}
        </div>
      )}

      {/* Development debug info */}
      {process.env.NODE_ENV === "development" && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "8px",
            borderRadius: "4px",
            fontSize: "11px",
            fontFamily: "monospace",
            maxWidth: "250px",
            zIndex: 10,
          }}
        >
          <div>
            <strong>🎥 HeyGen Avatar Debug</strong>
          </div>
          <div>Ready: {isInitialized ? "✅" : "⏳"}</div>
          <div>Session: {sessionStarted ? "🟢" : "⚫"}</div>
          <div>Stream: {stream ? "📺" : "❌"}</div>
          <div>Queue: {queueRef.current.length} items</div>
          <div>Speaking: {isSpeakingRef.current ? "🗣️" : "🤐"}</div>
          <div>Created: {sessionCreatedRef.current ? "💰" : "💸"}</div>
          <div>Error: {hasReportedError ? "❌" : "✅"}</div>
          {trackedSessionId && (
            <div>Tracked: {trackedSessionId.slice(0, 8)}...</div>
          )}
          {interviewId && <div>Interview: {interviewId.slice(0, 8)}...</div>}
          <div style={{ fontSize: "10px", color: "#888", marginTop: "4px" }}>
            Component: {componentIdRef.current.slice(0, 8)}
          </div>
        </div>
      )}
    </div>
  );
}
