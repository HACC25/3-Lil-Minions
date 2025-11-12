/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Spinner } from "@nextui-org/react";

// Import the existing components
import InteractiveAvatar from "./InteractiveAvatar"; // HeyGen component
import DIDInteractiveAvatar from "./DIDInteractiveAvatar"; // D-ID component
import SimpleFallbackAvatar from "./SimpleFallbackAvatar"; // TTS component

interface UnifiedAvatarProps {
  sessionStarted: boolean;
  dialogflowResponse: string[];
  onAvatarSpeakingChange: (speaking: boolean) => void;
  onAvatarReady?: (ready: boolean) => void;
  onSessionExpired?: () => void;
  isLoading?: boolean;
  interviewId?: string;
}

type AvatarMode = "heygen" | "did" | "simple" | "failed";

const UnifiedAvatar: React.FC<UnifiedAvatarProps> = ({
  sessionStarted,
  dialogflowResponse,
  onAvatarSpeakingChange,
  onAvatarReady,
  onSessionExpired,
  isLoading = false,
  interviewId,
}) => {
  // State management
  const [currentMode, setCurrentMode] = useState<AvatarMode>("heygen");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [avatarReadyStates, setAvatarReadyStates] = useState({
    heygen: false,
    did: false,
    simple: false,
  });
  const [avatarErrors, setAvatarErrors] = useState({
    heygen: null as Error | null,
    did: null as Error | null,
    simple: null as Error | null,
  });

  // Refs to track component state
  const componentIdRef = useRef(crypto.randomUUID());
  const currentModeRef = useRef<AvatarMode>("heygen");
  const transitionInProgressRef = useRef(false);
  const errorHandledRef = useRef({
    heygen: false,
    did: false,
    simple: false,
  });

  const logWithMode = (message: string, ...args: any[]) => {
    // console.log(
    //   `[UnifiedAvatar ${componentIdRef.current.slice(
    //     0,
    //     8
    //   )} | ${currentModeRef.current.toUpperCase()}] ${message}`,
    //   ...args
    // );
  };

  // Handle avatar ready events from child components
  const handleAvatarReady = (ready: boolean, mode: AvatarMode) => {
    if (mode !== currentModeRef.current) {
      logWithMode(`Ignoring ready signal from inactive mode: ${mode}`);
      return;
    }

    setAvatarReadyStates((prev) => ({ ...prev, [mode]: ready }));

    if (ready) {
      logWithMode(`✅ ${mode.toUpperCase()} avatar ready`);

      // Signal to parent that avatar is ready
      if (onAvatarReady) {
        onAvatarReady(true);
      }
    } else {
      logWithMode(`⚠️ ${mode.toUpperCase()} avatar not ready`);
    }
  };

  // Handle errors from child components
  const handleAvatarError = (error: Error, mode: AvatarMode) => {
    // Ignore errors from inactive modes
    if (mode !== currentModeRef.current) {
      logWithMode(
        `Ignoring error from inactive mode: ${mode} - ${error.message}`,
      );
      return;
    }

    // Ignore if we already handled an error for this mode
    if (mode !== "failed" && errorHandledRef.current[mode]) {
      logWithMode(`Already handled error for ${mode}, ignoring duplicate`);
      return;
    }

    // Ignore if we're already transitioning
    if (transitionInProgressRef.current) {
      logWithMode(`Transition in progress, queueing error from ${mode}`);
      return;
    }

    logWithMode(`❌ Error from ${mode.toUpperCase()}: ${error.message}`);

    // Mark error as handled (only for modes that have error tracking)
    if (mode !== "failed") {
      errorHandledRef.current[mode] = true;
    }

    // Store the error (only for modes that have error tracking)
    if (mode !== "failed") {
      setAvatarErrors((prev) => ({ ...prev, [mode]: error }));
    }

    // Trigger fallback
    fallbackToNextMode(error.message, mode);
  };

  // Enhanced fallback logic with seamless transitions
  const fallbackToNextMode = (reason: string, fromMode: AvatarMode) => {
    if (transitionInProgressRef.current) {
      logWithMode("Transition already in progress, ignoring duplicate request");
      return;
    }

    transitionInProgressRef.current = true;
    setIsTransitioning(true);

    logWithMode(`💥 ${fromMode.toUpperCase()} failed: ${reason}`);

    // Determine next mode
    let nextMode: AvatarMode;
    if (fromMode === "heygen") {
      nextMode = "did";
      logWithMode("🔄 Falling back from HeyGen to D-ID Avatar");
    } else if (fromMode === "did") {
      nextMode = "simple";
      logWithMode("🔄 Falling back from D-ID to Simple TTS Avatar");
    } else {
      nextMode = "failed";
      logWithMode(
        "❌ All avatar modes failed - interview can continue without avatar",
      );
    }

    // Perform transition
    setTimeout(() => {
      setCurrentMode(nextMode);
      currentModeRef.current = nextMode;

      // Reset transition flag after a delay
      setTimeout(() => {
        transitionInProgressRef.current = false;
        setIsTransitioning(false);
        logWithMode(`✅ Transitioned to ${nextMode.toUpperCase()} mode`);
      }, 300);
    }, 200);
  };

  // Handle retry
  const handleRetry = () => {
    logWithMode("🔄 Manual retry requested");

    // Reset all states
    transitionInProgressRef.current = false;
    errorHandledRef.current = {
      heygen: false,
      did: false,
      simple: false,
    };
    setAvatarErrors({
      heygen: null,
      did: null,
      simple: null,
    });
    setAvatarReadyStates({
      heygen: false,
      did: false,
      simple: false,
    });
    setCurrentMode("heygen");
    currentModeRef.current = "heygen";
    setIsTransitioning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      logWithMode("🧹 UnifiedAvatar component unmounting");
    };
  }, []);

  // Log mode changes
  useEffect(() => {
    currentModeRef.current = currentMode;
    logWithMode(`🎭 Avatar mode changed to: ${currentMode.toUpperCase()}`);
  }, [currentMode]);

  // Render based on current mode
  const renderAvatar = () => {
    switch (currentMode) {
      case "heygen":
        return (
          <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <InteractiveAvatar
              sessionStarted={sessionStarted}
              dialogflowResponse={dialogflowResponse}
              onAvatarSpeakingChange={onAvatarSpeakingChange}
              onAvatarReady={(ready) => handleAvatarReady(ready, "heygen")}
              isLoading={isLoading}
              interviewId={interviewId}
              onError={(error) => handleAvatarError(error, "heygen")}
            />
          </div>
        );

      case "did":
        return (
          <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <DIDInteractiveAvatar
              sessionStarted={sessionStarted}
              dialogflowResponse={dialogflowResponse}
              onAvatarSpeakingChange={onAvatarSpeakingChange}
              onAvatarReady={(ready) => handleAvatarReady(ready, "did")}
              onSessionExpired={onSessionExpired}
              isLoading={isLoading}
              interviewId={interviewId}
              onError={(error) => handleAvatarError(error, "did")}
            />
          </div>
        );

      case "simple":
        return (
          <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <SimpleFallbackAvatar
              sessionStarted={sessionStarted}
              dialogflowResponse={dialogflowResponse}
              onAvatarSpeakingChange={onAvatarSpeakingChange}
              onAvatarReady={(ready) => handleAvatarReady(ready, "simple")}
              isLoading={isLoading}
              interviewId={interviewId}
              onError={(error) => handleAvatarError(error, "simple")}
            />
          </div>
        );

      case "failed":
        return (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#1f2937",
              color: "#ef4444",
              padding: "2rem",
              textAlign: "center",
              minHeight: "400px",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🎤</div>
            <h3 style={{ margin: "0 0 1rem 0", color: "#ef4444" }}>
              Avatar System Unavailable
            </h3>
            <p
              style={{
                margin: "0 0 1.5rem 0",
                color: "#9ca3af",
                maxWidth: "400px",
              }}
            >
              All avatar systems failed to initialize, but your interview can
              continue. You&apos;ll still be able to speak and hear responses
              through your device&apos;s audio system.
            </p>
            <div
              style={{
                fontSize: "14px",
                color: "#6b7280",
                fontFamily: "monospace",
                marginBottom: "1.5rem",
                lineHeight: "1.6",
              }}
            >
              <div style={{ marginBottom: "0.5rem" }}>
                <strong>Error Summary:</strong>
              </div>
              {avatarErrors.heygen && (
                <div style={{ marginBottom: "0.25rem", fontSize: "12px" }}>
                  HeyGen: {avatarErrors.heygen.message}
                </div>
              )}
              {avatarErrors.did && (
                <div style={{ marginBottom: "0.25rem", fontSize: "12px" }}>
                  D-ID: {avatarErrors.did.message}
                </div>
              )}
              {avatarErrors.simple && (
                <div style={{ marginBottom: "0.25rem", fontSize: "12px" }}>
                  Simple TTS: {avatarErrors.simple.message}
                </div>
              )}
            </div>
            <button
              onClick={handleRetry}
              style={{
                padding: "12px 24px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#2563eb";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#3b82f6";
              }}
            >
              Retry Avatar System
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // Show transition loading
  if (isTransitioning) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f172a",
          color: "#94a3b8",
          padding: "2rem",
          textAlign: "center",
          minHeight: "400px",
        }}
      >
        <Spinner color="primary" size="lg" />
        <div style={{ marginTop: "1rem", fontSize: "16px", fontWeight: "500" }}>
          Switching Avatar System...
        </div>
        <div style={{ marginTop: "0.5rem", fontSize: "14px", opacity: 0.7 }}>
          {currentMode === "did" && "Loading D-ID Avatar"}
          {currentMode === "simple" && "Loading Voice-Only Mode"}
          {currentMode === "heygen" && "Loading HeyGen Avatar"}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Current avatar component */}
      {renderAvatar()}

      {/* Mode indicator for development */}
      {process.env.NODE_ENV === "development" && (
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
            background:
              currentMode === "heygen"
                ? "rgba(34, 197, 94, 0.9)"
                : currentMode === "did"
                  ? "rgba(59, 130, 246, 0.9)"
                  : currentMode === "simple"
                    ? "rgba(245, 158, 11, 0.9)"
                    : "rgba(239, 68, 68, 0.9)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: "600",
            zIndex: 100,
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          {currentMode === "heygen" && "🎥 HEYGEN"}
          {currentMode === "did" && "🤖 D-ID"}
          {currentMode === "simple" && "🔵 SIMPLE TTS"}
          {currentMode === "failed" && "❌ FAILED"}
          <div style={{ fontSize: "10px", marginTop: "2px", opacity: 0.9 }}>
            Ready:{" "}
            {avatarReadyStates[currentMode as keyof typeof avatarReadyStates]
              ? "✅"
              : "⏳"}
          </div>
          {avatarErrors[currentMode as keyof typeof avatarErrors] && (
            <div
              style={{
                fontSize: "9px",
                marginTop: "2px",
                opacity: 0.8,
                maxWidth: "150px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={
                avatarErrors[currentMode as keyof typeof avatarErrors]?.message
              }
            >
              Error:{" "}
              {avatarErrors[currentMode as keyof typeof avatarErrors]?.message}
            </div>
          )}
        </div>
      )}

      {/* Status indicator for production */}
      {/* {currentMode !== "heygen" && currentMode !== "failed" && (
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "12px",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {currentMode === "did" && (
            <>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#3b82f6",
                  animation: "pulse 2s infinite",
                }}
              />
              Using D-ID Avatar
              {avatarErrors.heygen && (
                <span style={{ opacity: 0.7, fontSize: "11px" }}>
                  (HeyGen: {avatarErrors.heygen.message.split(":")[0]})
                </span>
              )}
            </>
          )}
          {currentMode === "simple" && (
            <>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#f59e0b",
                  animation: "pulse 2s infinite",
                }}
              />
              Voice-Only Mode
              {(avatarErrors.heygen || avatarErrors.did) && (
                <span style={{ opacity: 0.7, fontSize: "11px" }}>
                  (Video avatars unavailable)
                </span>
              )}
            </>
          )}
        </div>
      )} */}

      {/* CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default UnifiedAvatar;
