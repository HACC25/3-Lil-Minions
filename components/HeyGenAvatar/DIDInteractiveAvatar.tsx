/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { Spinner } from "@nextui-org/react";

interface InteractiveAvatarProps {
  sessionStarted: boolean;
  dialogflowResponse: string[];
  onAvatarSpeakingChange: (speaking: boolean) => void;
  onAvatarReady?: (ready: boolean) => void;
  onSessionExpired?: () => void;
  isLoading?: boolean;
  interviewId?: string;
  onError?: (error: Error) => void; // New error callback
}

interface DIDConfig {
  agentId: string;
  clientKey: string;
  metadata?: {
    botName: string;
    interviewType: string;
    avatarType: string;
  };
}

// Clean avatar response function
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
  ];

  let cleaned = response;
  for (const pattern of patternsToRemove) {
    cleaned = cleaned.replace(pattern, "");
  }

  cleaned = cleaned.replace(/\s+/g, " ").trim();

  if (!cleaned || cleaned.length < 10) {
    console.warn(
      "⚠️ [D-ID Avatar] Response became empty after cleaning, using fallback",
    );
    return "Let me continue with the interview.";
  }

  return cleaned;
};

export default function DIDInteractiveAvatar({
  sessionStarted,
  dialogflowResponse,
  onAvatarSpeakingChange,
  onAvatarReady,
  onSessionExpired,
  interviewId,
  onError,
}: InteractiveAvatarProps) {
  // States
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [connectionLabel, setConnectionLabel] = useState("Initializing...");
  const [streamType, setStreamType] = useState<string>("Legacy");
  const [avatarConfig, setAvatarConfig] = useState<DIDConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [hasReportedError, setHasReportedError] = useState(false);

  // Refs
  const streamVideoRef = useRef<HTMLVideoElement>(null);
  const idleVideoRef = useRef<HTMLVideoElement>(null);
  const agentManagerRef = useRef<any>(null);
  const srcObjectRef = useRef<MediaStream | null>(null);
  const queueRef = useRef<string[]>([]);
  const isProcessingRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const hasIdleVideoRef = useRef<boolean>(false);
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const INITIALIZATION_TIMEOUT = 20000; // 20 seconds

  // Enhanced error reporting
  const reportError = (error: Error) => {
    if (!hasReportedError && onError) {
      console.error("❌ D-ID Avatar Error:", error);
      setHasReportedError(true);
      onError(error);
    }
  };

  // Fetch D-ID agent configuration
  const fetchAvatarConfig = async () => {
    try {
      setConfigLoading(true);

      if (!interviewId) {
        // Use default configuration if no interviewId
        const error = new Error("Interview does not exist");
        reportError(error);
        return;
      }

      // console.log("🔄 Fetching D-ID agent configuration...", { interviewId });

      const response = await fetch("/api/did-agent-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const configData = await response.json();

      // Check if we got valid config data
      if (!configData.agentId || !configData.clientKey) {
        throw new Error(
          "Invalid D-ID configuration: missing agentId or clientKey",
        );
      }

      setAvatarConfig(configData);
      // console.log("✅ D-ID agent configuration loaded successfully");
    } catch (err) {
      console.error("❌ Failed to fetch D-ID config:", err);
      const error = new Error(
        `D-ID configuration failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      reportError(error);
    } finally {
      setConfigLoading(false);
    }
  };

  // Process the speech queue
  const processSpeechQueue = async () => {
    if (
      isProcessingRef.current ||
      !agentManagerRef.current ||
      queueRef.current.length === 0 ||
      hasReportedError
    ) {
      return;
    }

    isProcessingRef.current = true;
    const text = queueRef.current.shift();

    if (text && text.length > 2) {
      try {
        // console.log("🗣️ D-ID Speaking:", text.substring(0, 50) + "...");

        // Send speak command and let D-ID handle the video transitions
        await agentManagerRef.current.speak({
          type: "text",
          input: text,
        });
      } catch (error) {
        console.error("❌ Error speaking:", error);
        isProcessingRef.current = false;
        const err = new Error(
          `D-ID speaking error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        reportError(err);
      }
    } else {
      isProcessingRef.current = false;
      // Process next item in queue
      setTimeout(() => processSpeechQueue(), 100);
    }
  };

  // Initialize D-ID agent
  const initializeAgent = async () => {
    if (isInitializing || !avatarConfig || hasReportedError) return;

    setIsInitializing(true);
    // console.log("🎭 Initializing D-ID Agent...");

    // Set initialization timeout
    initializationTimeoutRef.current = setTimeout(() => {
      if (!isConnected && !hasReportedError) {
        const error = new Error(
          "D-ID initialization timeout - no response from service",
        );
        reportError(error);
      }
    }, INITIALIZATION_TIMEOUT);

    try {
      // Import D-ID SDK
      const { createAgentManager } = await import("@d-id/client-sdk");

      // Define callbacks
      const callbacks = {
        onSrcObjectReady(value: MediaStream) {
          // console.log("✅ D-ID SrcObject Ready");
          srcObjectRef.current = value;

          // Keep the stream video ready but hidden
          if (streamVideoRef.current) {
            streamVideoRef.current.srcObject = value;
            // Pre-warm the video element
            streamVideoRef.current.load();
          }
          return value;
        },

        onConnectionStateChange(state: string) {
          // console.log("🔗 D-ID Connection State:", state);
          setConnectionLabel(
            state === "connecting"
              ? "Connecting..."
              : state === "connected"
                ? "Connected"
                : state,
          );

          if (state === "connecting") {
            // Get agent info to set up videos
            if (agentManagerRef.current?.agent) {
              const presenter = agentManagerRef.current.agent.presenter;

              // Check if idle video exists
              if (presenter?.idle_video) {
                hasIdleVideoRef.current = true;

                // Set idle video source
                if (idleVideoRef.current) {
                  idleVideoRef.current.src = presenter.idle_video;
                  idleVideoRef.current.load();
                }
              }

              // Set background thumbnail to avoid flickering
              const videoWrapper = document.getElementById("did-video-wrapper");
              if (videoWrapper && presenter?.thumbnail) {
                videoWrapper.style.backgroundImage = `url(${presenter.thumbnail})`;
                videoWrapper.style.backgroundSize = "cover";
                videoWrapper.style.backgroundPosition = "center";
              }
            }

            // Initial state: hide both videos
            if (streamVideoRef.current) {
              streamVideoRef.current.style.opacity = "0";
            }
            if (idleVideoRef.current) {
              idleVideoRef.current.style.opacity = "0";
            }
          } else if (state === "connected") {
            // Clear initialization timeout
            if (initializationTimeoutRef.current) {
              clearTimeout(initializationTimeoutRef.current);
              initializationTimeoutRef.current = null;
            }

            setIsConnected(true);

            // Get actual stream type
            const currentStreamType =
              agentManagerRef.current?.getStreamType?.() || "Legacy";
            setStreamType(String(currentStreamType));
            // console.log("🎥 D-ID Stream Type:", currentStreamType);

            // Remove blur and show appropriate video
            const videoWrapper = document.getElementById("did-video-wrapper");
            if (videoWrapper) {
              videoWrapper.style.filter = "blur(0px)";
            }

            // Show idle video if available, otherwise keep stream video ready
            if (hasIdleVideoRef.current && idleVideoRef.current) {
              idleVideoRef.current.style.opacity = "1";
              idleVideoRef.current.play().catch(console.warn);
            } else if (streamVideoRef.current) {
              // No idle video, show stream video
              streamVideoRef.current.style.opacity = "1";
            }

            // Notify parent component
            if (onAvatarReady) {
              onAvatarReady(true);
            }
          } else if (state === "disconnected" || state === "closed") {
            setIsConnected(false);
            setConnectionLabel("Disconnected");

            if (onSessionExpired) {
              onSessionExpired();
            }

            // Report disconnection as error
            if (!hasReportedError) {
              const error = new Error(`D-ID connection ${state}`);
              reportError(error);
            }
          }
        },

        onVideoStateChange(state: string) {
          // console.log("📺 D-ID Video State:", state);

          // Legacy mode video switching
          if (state === "START") {
            // console.log("🎬 D-ID START speaking");
            isSpeakingRef.current = true;
            onAvatarSpeakingChange(true);

            // Show stream video
            if (streamVideoRef.current) {
              streamVideoRef.current.muted = false;
              streamVideoRef.current.style.opacity = "1";
              streamVideoRef.current.play().catch(console.warn);
            }

            // Hide idle video if it exists
            if (hasIdleVideoRef.current && idleVideoRef.current) {
              idleVideoRef.current.style.opacity = "0";
            }
          } else if (state === "STOP" || state === "IDLE") {
            // console.log("🎬 D-ID STOP speaking");
            isSpeakingRef.current = false;
            onAvatarSpeakingChange(false);
            isProcessingRef.current = false;

            // If we have an idle video, switch to it
            if (hasIdleVideoRef.current && idleVideoRef.current) {
              // Hide stream video
              if (streamVideoRef.current) {
                streamVideoRef.current.style.opacity = "0";
              }

              // Show idle video
              idleVideoRef.current.style.opacity = "1";
              idleVideoRef.current.play().catch(console.warn);
            } else {
              // No idle video, keep stream video visible
              if (streamVideoRef.current) {
                streamVideoRef.current.style.opacity = "1";
              }
            }

            // Process next item in queue
            setTimeout(() => processSpeechQueue(), 250);
          }
        },

        onNewMessage(messages: any[], type: string) {
          // console.log("💬 D-ID New Message:", { type, count: messages.length });
        },

        onAgentActivityStateChange(state: string) {
          // console.log("🎭 D-ID Agent Activity State:", state);
        },

        onError(error: any, errorData: any) {
          console.error("❌ D-ID Error:", error, errorData);
          setConnectionLabel("Error occurred");
          isProcessingRef.current = false;

          // Clear initialization timeout
          if (initializationTimeoutRef.current) {
            clearTimeout(initializationTimeoutRef.current);
            initializationTimeoutRef.current = null;
          }

          const err = new Error(
            `D-ID error: ${error.message || "Unknown error"}`,
          );
          reportError(err);
        },
      };

      // Define stream options
      const streamOptions = {
        compatibilityMode: "on",
        streamWarmup: true, // Keep connection warm
        fluent: false,
      };

      // Check if we have valid credentials
      if (!avatarConfig.clientKey || avatarConfig.clientKey === "undefined") {
        throw new Error("Invalid D-ID client key");
      }

      // Create agent manager with config from API
      const agentManager = await createAgentManager(avatarConfig.agentId, {
        mode: "stream",
        auth: {
          type: "key",
          clientKey: avatarConfig.clientKey,
        },
        callbacks,
        streamOptions,
      } as any);

      agentManagerRef.current = agentManager;
      // console.log("✅ D-ID Agent Manager created:", agentManager);

      // Connect to agent
      // console.log("🔌 Connecting to D-ID Agent ID:", avatarConfig.agentId);
      await agentManager.connect();

      setIsInitializing(false);
    } catch (error) {
      console.error("❌ Failed to initialize D-ID agent:", error);
      setConnectionLabel("Failed to initialize");
      setIsInitializing(false);

      // Clear initialization timeout
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
        initializationTimeoutRef.current = null;
      }

      const err = new Error(
        `D-ID initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      reportError(err);
    }
  };

  // Fetch config on mount
  useEffect(() => {
    fetchAvatarConfig();
  }, [interviewId]);

  // Initialize agent when config is ready
  useEffect(() => {
    if (!configLoading && avatarConfig && !hasReportedError) {
      initializeAgent().catch(console.error);
    }
  }, [configLoading, avatarConfig, hasReportedError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (agentManagerRef.current) {
        // console.log("🔌 Disconnecting D-ID agent...");
        agentManagerRef.current.disconnect?.();
      }
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
      }
    };
  }, []);

  // Handle Dialogflow responses
  useEffect(() => {
    if (
      !sessionStarted ||
      !isConnected ||
      !dialogflowResponse ||
      dialogflowResponse.length === 0 ||
      hasReportedError
    ) {
      return;
    }

    // console.log(
    //   "📨 D-ID Processing Dialogflow responses:",
    //   dialogflowResponse.length
    // );

    // Clean and queue responses
    const cleanedResponses = dialogflowResponse
      .filter((response) => response && response.trim().length > 0)
      .map((response) => cleanAvatarResponse(response))
      .filter((response) => response && response.trim().length > 0);

    if (cleanedResponses.length > 0) {
      // Add all responses to queue
      queueRef.current.push(...cleanedResponses);

      // Start processing queue
      processSpeechQueue().catch(console.error);
    }
  }, [dialogflowResponse, sessionStarted, isConnected, hasReportedError]);

  // Don't render error state - let parent handle it
  if (hasReportedError) {
    return null;
  }

  // Show loading while fetching config
  if (configLoading) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spinner color="primary" size="lg" />
        <div style={{ marginLeft: "1rem", fontSize: "14px", color: "#666" }}>
          Loading D-ID avatar configuration...
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Video wrapper with background image */}
      <div
        id="did-video-wrapper"
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          filter: isConnected ? "blur(0px)" : "blur(5px)",
          transition: "filter 0.5s ease",
          backgroundColor: "#000",
        }}
      >
        {/* Stream video element - for speaking */}
        <video
          ref={streamVideoRef}
          autoPlay
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            position: "absolute",
            top: 0,
            left: 0,
            opacity: 0,
            transition: "opacity 0.4s ease",
            zIndex: 2,
          }}
        />

        {/* Idle video element - for idle state */}
        <video
          ref={idleVideoRef}
          autoPlay
          playsInline
          muted
          loop
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            position: "absolute",
            top: 0,
            left: 0,
            opacity: 0,
            transition: "opacity 0.4s ease",
            zIndex: 1,
          }}
        />
      </div>

      {/* Loading overlay */}
      {!isConnected && !hasReportedError && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            gap: "1rem",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            zIndex: 10,
          }}
        >
          <Spinner color="primary" size="lg" />
          <div style={{ fontSize: "14px", color: "#666" }}>
            {connectionLabel}
          </div>
        </div>
      )}

      {/* Debug info (development only) */}
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
            zIndex: 100,
          }}
        >
          <div>
            <strong>🤖 D-ID Avatar Debug</strong>
          </div>
          <div>Status: {connectionLabel}</div>
          <div>Stream: {streamType}</div>
          <div>Speaking: {isSpeakingRef.current ? "Yes" : "No"}</div>
          <div>Queue: {queueRef.current.length}</div>
          <div>Processing: {isProcessingRef.current ? "Yes" : "No"}</div>
          <div>Has Idle: {hasIdleVideoRef.current ? "Yes" : "No"}</div>
          <div>Config: {avatarConfig ? "Loaded" : "None"}</div>
          <div>Error: {hasReportedError ? "Yes" : "No"}</div>
          {avatarConfig && (
            <div>Agent: {avatarConfig.agentId.slice(0, 12)}...</div>
          )}
        </div>
      )}
    </div>
  );
}
