/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AudioRecorder from "../../../../components/InterviewSession/AudioRecorder";
import AvatarLoadingOverlay from "@/components/HeyGenAvatar/AvatarLoadingOverlay2";
import VoiceActivityIndicator from "../../../../components/HeyGenAvatar/VoiceActivityIndicator";
import { useCameraContext } from "../../../../components/InterviewSession/CameraContext";
import { FaCamera, FaVideoSlash, FaPhoneSlash } from "react-icons/fa";
import { BiTime } from "react-icons/bi";
import "bootstrap/dist/css/bootstrap.min.css";

// Hardcoded bot information - used as fallback for general interviewer
const HARDCODED_BOT = {
  agent_id: "6629f62e-0cac-45fd-b4ae-541840a92240",
  botName: "Second Round Interview",
  interviewType: "AI-Powered Behavioral Interview",
};

interface BotConfig {
  agent_id: string;
  botName: string;
  description?: string;
  interviewType: string;
  botPersonality?: string;
  companyDescription?: string;
  jobRoleDescription?: string;
  avatarConfig?: any;
}

export const InterviewSessionPage: React.FC = () => {
  const params = useParams();
  const { id } = params as { id: string };
  const router = useRouter();

  const { videoRef, isCameraOn, toggleCamera, getStream } = useCameraContext();

  // Bot configuration state
  const [botConfig, setBotConfig] = useState<BotConfig>(HARDCODED_BOT);
  const [loadingBotConfig, setLoadingBotConfig] = useState(true);

  // Interview state
  const [showInstructions, setShowInstructions] = useState(true);
  const [countdown, setCountdown] = useState(10);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Transcript state
  const [transcript, setTranscript] = useState("");
  const [dialogflowResponse, setDialogflowResponse] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [completeTranscript, setCompleteTranscript] = useState<string[]>([]);

  // End interview state
  const [isEndingInterview, setIsEndingInterview] = useState(false);
  const [stoppedRecording, setStoppedRecording] = useState(false);

  // Voice activity
  const [voiceActivity, setVoiceActivity] = useState({
    isActive: false,
    volume: 0,
  });
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);

  // Refs
  const endInterviewInProgress = useRef(false);
  const sessionDurationRef = useRef(0);
  const completeTranscriptRef = useRef<string[]>([]);
  const previousTranscripts = useRef<string[]>([]);
  const pendingUserResponseRef = useRef<string>("");
  const isWaitingForAIResponseRef = useRef<boolean>(false);

  // Update refs
  useEffect(() => {
    completeTranscriptRef.current = completeTranscript;
  }, [completeTranscript]);

  useEffect(() => {
    sessionDurationRef.current = sessionDuration;
  }, [sessionDuration]);

  // Fetch bot configuration based on application
  useEffect(() => {
    const fetchBotConfig = async () => {
      try {
        setLoadingBotConfig(true);
        const response = await fetch(
          `/api/applications/${id}/interview-config`,
        );

        if (response.ok) {
          const data = await response.json();

          if (data.useHardcodedBot) {
            // Use hardcoded bot (general interviewer)
            setBotConfig(HARDCODED_BOT);
          } else if (data.config) {
            // Use custom bot configuration
            setBotConfig(data.config);
          }
        } else {
          console.error("Failed to fetch bot config, using hardcoded bot");
          setBotConfig(HARDCODED_BOT);
        }
      } catch (error) {
        console.error("Error fetching bot config:", error);
        setBotConfig(HARDCODED_BOT);
      } finally {
        setLoadingBotConfig(false);
      }
    };

    if (id) {
      fetchBotConfig();
    }
  }, [id]);

  // Save transcript to Interviews collection via API
  const saveTranscriptToInterviews = async (transcriptText: string) => {
    try {
      console.log("Saving transcript to Interviews collection...");

      const response = await fetch("/api/save-transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interviewId: id,
          transcript: transcriptText,
          botName: botConfig.botName,
          interviewType: botConfig.interviewType,
          duration: sessionDurationRef.current,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save transcript");
      }

      const result = await response.json();
      console.log(
        `✅ Transcript saved successfully with ID: ${result.interviewId}`,
      );
      return result.interviewId;
    } catch (error) {
      console.error("❌ Error saving transcript:", error);
      return null;
    }
  };

  // Simplified end interview function
  const endInterview = useCallback(async () => {
    if (endInterviewInProgress.current) {
      return;
    }

    console.log("=== ENDING INTERVIEW ===");
    endInterviewInProgress.current = true;
    setIsEndingInterview(true);

    try {
      // Step 1: Stop recording first and wait for cleanup
      console.log("Step 1: Stopping recording...");
      setStoppedRecording(true);

      // Wait for recording to cleanup (give it time to stop avatar and close websocket)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 2: Stop camera stream
      console.log("Step 2: Stopping camera...");
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }

      const contextStream = getStream();
      if (contextStream) {
        contextStream.getTracks().forEach((track) => track.stop());
      }

      // Step 3: Save transcript if exists
      console.log("Step 3: Saving transcript...");
      const currentTranscript = completeTranscriptRef.current;
      if (currentTranscript.length > 0) {
        const transcriptText = currentTranscript.join("\n\n");
        await saveTranscriptToInterviews(transcriptText);
      }

      // Step 4: Send interview completion email
      console.log("Step 4: Sending interview completion email...");
      try {
        // Fetch application data to get candidate email and name
        const appResponse = await fetch(`/api/applications/${id}`);
        if (appResponse.ok) {
          const appData = await appResponse.json();
          const application = appData.application;

          if (application?.email && application?.firstName) {
            const candidateName = `${application.firstName}${application.lastName ? ` ${application.lastName}` : ""}`;

            const emailResponse = await fetch(
              "/api/send-interview-completion",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  candidateEmail: application.email,
                  candidateName: candidateName,
                  jobTitle: application.jobTitle || botConfig.interviewType,
                  companyName: application.companyName || "State of Hawaii",
                  interviewId: id,
                }),
              },
            );

            if (!emailResponse.ok) {
              console.warn("Failed to send interview completion email");
            } else {
              console.log("✅ Interview completion email sent successfully");
            }
          } else {
            console.warn(
              "Missing email or name in application data, skipping email",
            );
          }
        } else {
          console.warn("Failed to fetch application data, skipping email");
        }
      } catch (emailError) {
        console.error("Error sending interview completion email:", emailError);
        // Don't block navigation if email fails
      }

      // Step 5: Wait a bit more for final cleanup
      console.log("Step 5: Final cleanup wait...");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 6: Navigate to congrats page
      console.log("Step 6: Navigating to congrats page...");
      router.push(`/interviews/congrats/${id}`);
    } catch (error) {
      console.error("Error in endInterview:", error);
      // Wait before force navigation on error
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push(`/interviews/congrats/${id}`);
    } finally {
      endInterviewInProgress.current = false;
    }
  }, [id, router, videoRef, getStream]);

  // Handle voice activity
  const handleVoiceActivityChange = useCallback(
    (isActive: boolean, volume: number) => {
      setVoiceActivity({ isActive, volume });
    },
    [],
  );

  const handleAvatarSpeakingChange = useCallback((speaking: boolean) => {
    setAvatarSpeaking(speaking);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (showInstructions && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && showInstructions) {
      setShowInstructions(false);
      setInterviewStarted(true);
    }
  }, [countdown, showInstructions]);

  // Session duration timer
  useEffect(() => {
    if (interviewStarted && !stoppedRecording) {
      const timer = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [interviewStarted, stoppedRecording]);

  // Handle transcript changes
  const handleTranscriptChange = (
    transcriptText: string,
    isInterim: boolean,
  ) => {
    if (isInterim) {
      setLiveTranscript(transcriptText);
      setIsTranscribing(true);
    } else {
      setTranscript(transcriptText);
      setLiveTranscript("");
      setIsTranscribing(false);

      if (transcriptText && transcriptText.trim()) {
        const trimmedTranscript = transcriptText.trim();
        const allPreviousText = previousTranscripts.current.join(" ").trim();

        let newContent = "";

        if (allPreviousText && trimmedTranscript.startsWith(allPreviousText)) {
          newContent = trimmedTranscript
            .substring(allPreviousText.length)
            .trim()
            .replace(/^[.,!?;:\s]+/, "");
        } else if (!allPreviousText) {
          newContent = trimmedTranscript;
        } else {
          const isDuplicate = previousTranscripts.current.some(
            (prev) =>
              prev.trim().toLowerCase() === trimmedTranscript.toLowerCase(),
          );
          if (!isDuplicate) {
            newContent = trimmedTranscript;
          }
        }

        if (newContent && newContent.length > 2) {
          const normalizedContent = newContent.toLowerCase().trim();
          const isDuplicate = previousTranscripts.current.some(
            (prev) => prev.trim().toLowerCase() === normalizedContent,
          );

          if (!isDuplicate) {
            pendingUserResponseRef.current = newContent;
            isWaitingForAIResponseRef.current = true;
            setCompleteTranscript((prev) => [...prev, `User: ${newContent}`]);
            previousTranscripts.current = [
              ...previousTranscripts.current,
              newContent,
            ];
          }
        }
      }
    }
  };

  // Handle Dialogflow response
  const handleDialogflowResponse = (
    response: string[],
    sessionParams?: any,
  ) => {
    setIsProcessingAI(false);
    const joinedResponse = response.join(" ");
    setDialogflowResponse(joinedResponse);

    // Check for interview end signal
    if (sessionParams?.interviewEnd) {
      setTimeout(() => {
        if (!endInterviewInProgress.current && !isEndingInterview) {
          endInterview();
        }
      }, 2000);
    }

    if (response && response.length > 0) {
      if (isWaitingForAIResponseRef.current) {
        isWaitingForAIResponseRef.current = false;
        pendingUserResponseRef.current = "";
      }

      setCompleteTranscript((prev) => [
        ...prev,
        ...response.map((r) => `AI: ${r}`),
      ]);
    }
  };

  // Format duration helper
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Styles
  const containerStyle = {
    minHeight: "100vh",
    color: "#fff",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };

  const cardStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    color: "#000",
    borderRadius: "1rem",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
  };

  const videoContainerStyle = {
    ...cardStyle,
    overflow: "hidden",
    position: "relative" as const,
    backgroundColor: "#000",
    minHeight: "350px",
  };

  const controlButtonStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "50%",
    width: "64px",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.3s ease",
    color: "#fff",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
  };

  // Show loading state while fetching bot configuration
  if (loadingBotConfig) {
    return (
      <div style={containerStyle}>
        <div className="d-flex align-items-center justify-content-center min-vh-100">
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "1rem",
              padding: "2rem",
              maxWidth: "350px",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              className="spinner-border mb-3"
              style={{ color: "#3b82f6", width: "2.5rem", height: "2.5rem" }}
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <p
              className="mb-0"
              style={{
                color: "#000",
                fontSize: "0.95rem",
                fontWeight: "500",
              }}
            >
              Loading interview configuration...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Main Content */}
      <div className="px-4 pb-4 pt-3">
        {/* Header Row - Timer, Title, and Toggle Button */}
        <div className="row mb-3 align-items-center">
          {/* Title and Timer - Left */}
          <div className="col">
            <div className="d-flex align-items-center gap-3">
              <div>
                <h4
                  className="mb-0"
                  style={{
                    fontWeight: "600",
                    fontSize: "1.1rem",
                    color: "#000",
                  }}
                >
                  {botConfig.botName}
                </h4>
                <small style={{ color: "#333", fontSize: "0.85rem" }}>
                  {botConfig.interviewType} •{" "}
                  {interviewStarted ? "In Progress" : "Starting Soon"}
                </small>
              </div>
              {interviewStarted && (
                <div
                  className="d-flex align-items-center gap-2"
                  style={{
                    borderLeft: "1px solid rgba(0, 0, 0, 0.2)",
                    paddingLeft: "1rem",
                  }}
                >
                  <BiTime size={20} style={{ color: "#333" }} />
                  <span
                    style={{
                      color: "#000",
                      fontSize: "1rem",
                      fontWeight: "600",
                    }}
                  >
                    {formatDuration(sessionDuration)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Toggle Transcript Button - Right */}
          <div className="col-auto">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="btn"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(0, 0, 0, 0.2)",
                borderRadius: "8px",
                padding: "8px 16px",
                color: "#000",
                fontSize: "0.85rem",
                fontWeight: "500",
              }}
            >
              {showTranscript ? "Hide" : "Show"} Transcript
            </button>
          </div>
        </div>

        <div className="row g-2">
          {/* Video Section */}
          <div className={showTranscript ? "col-lg-8" : "col-12"}>
            <div
              style={{
                ...videoContainerStyle,
                height: showTranscript ? "700px" : "900px",
                width: "100%",
                transition: "all 0.3s ease",
              }}
            >
              {/* Main AI Video */}
              <div className="w-100 h-100">
                <AudioRecorder
                  agentId={botConfig.agent_id}
                  interviewId={id}
                  autoStart={!showInstructions}
                  stoppedRecording={stoppedRecording}
                  onTranscriptChange={handleTranscriptChange}
                  onDialogflowResponseChange={handleDialogflowResponse}
                  onProcessingStart={() => setIsProcessingAI(true)}
                  onRestartConnection={() => {}}
                  onVoiceActivityChange={handleVoiceActivityChange}
                  onAvatarSpeakingChange={handleAvatarSpeakingChange}
                />
              </div>

              {/* User Video Overlay */}
              <div
                className="position-absolute"
                style={{
                  bottom: "20px",
                  left: "20px",
                  width: "200px",
                  height: "150px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.6)",
                  backgroundColor: "#000",
                  zIndex: 10,
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />

                {!isCameraOn && (
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      color: "#fff",
                    }}
                  >
                    <FaCamera size={24} className="mb-2" />
                    <p style={{ fontSize: "0.75rem", margin: 0 }}>Camera off</p>
                  </div>
                )}
              </div>

              {/* Instructions Overlay */}
              <AvatarLoadingOverlay
                isVisible={showInstructions}
                onComplete={() => {
                  setShowInstructions(false);
                  setInterviewStarted(true);
                }}
              />
            </div>
          </div>

          {/* Transcript Section */}
          {showTranscript && (
            <div className="col-lg-4">
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  color: "#000",
                  borderRadius: "1rem",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                  height: "700px",
                  maxHeight: "700px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
                className="p-3"
              >
                <h6
                  className="mb-3 text-center font-weight-bold"
                  style={{ fontSize: "0.9rem", color: "#000" }}
                >
                  Live Transcript
                </h6>

                <div style={{ flex: 1, overflow: "auto", paddingRight: "8px" }}>
                  {/* User Transcript */}
                  <div className="mb-2">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <div className="d-flex align-items-center">
                        <span
                          className="badge me-1"
                          style={{
                            fontSize: "0.7rem",
                            backgroundColor: "rgba(34, 197, 94, 0.2)",
                            color: "#16a34a",
                            border: "1px solid rgba(34, 197, 94, 0.4)",
                          }}
                        >
                          You
                        </span>
                        {isTranscribing && (
                          <div
                            className="spinner-border spinner-border-sm ms-1"
                            style={{
                              width: "10px",
                              height: "10px",
                              color: "#16a34a",
                            }}
                          />
                        )}
                      </div>
                      {liveTranscript && !avatarSpeaking && (
                        <button
                          onClick={() => {
                            // Trigger end of speech by forcing final transcript
                            if (liveTranscript) {
                              setTranscript(liveTranscript);
                              setLiveTranscript("");
                              setIsTranscribing(false);
                            }
                          }}
                          style={{
                            fontSize: "0.65rem",
                            padding: "2px 8px",
                            backgroundColor: "#dc3545",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: "500",
                          }}
                        >
                          Done Speaking
                        </button>
                      )}
                    </div>
                    <div
                      className="p-2 rounded"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.7)",
                        backdropFilter: "blur(5px)",
                        minHeight: "80px",
                        border: "1px solid rgba(34, 197, 94, 0.4)",
                        fontSize: "0.8rem",
                      }}
                    >
                      {liveTranscript && (
                        <p
                          className="mb-1"
                          style={{
                            color: "#16a34a",
                            fontStyle: "italic",
                          }}
                        >
                          {liveTranscript}
                        </p>
                      )}
                      {transcript && (
                        <p
                          className="mb-0"
                          style={{
                            color: "#000",
                          }}
                        >
                          {transcript}
                        </p>
                      )}
                      {!isTranscribing && !liveTranscript && !transcript && (
                        <p
                          className="mb-0"
                          style={{
                            color: "#64748b",
                            fontStyle: "italic",
                          }}
                        >
                          Start speaking...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* AI Response */}
                  <div>
                    <div className="d-flex align-items-center mb-1 mt-2">
                      <span
                        className="badge me-1"
                        style={{
                          fontSize: "0.7rem",
                          backgroundColor: "rgba(59, 130, 246, 0.2)",
                          color: "#2563eb",
                          border: "1px solid rgba(59, 130, 246, 0.4)",
                        }}
                      >
                        AI
                      </span>
                      {isProcessingAI && (
                        <span
                          style={{
                            color: "#2563eb",
                            fontSize: "0.7rem",
                            fontStyle: "italic",
                          }}
                        >
                          listening...
                        </span>
                      )}
                    </div>
                    <div
                      className="p-2 rounded"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.7)",
                        backdropFilter: "blur(5px)",
                        minHeight: "80px",
                        border: "1px solid rgba(59, 130, 246, 0.4)",
                        fontSize: "0.8rem",
                      }}
                    >
                      {dialogflowResponse ? (
                        <p
                          className="mb-0"
                          style={{
                            color: "#000",
                          }}
                        >
                          {dialogflowResponse}
                        </p>
                      ) : (
                        <p
                          className="mb-0"
                          style={{
                            color: "#64748b",
                            fontStyle: "italic",
                          }}
                        >
                          AI response will appear here...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Voice Activity Indicator */}
        {interviewStarted && !showInstructions && (
          <div className="row mb-3 mt-3">
            <div className="col-12">
              <VoiceActivityIndicator
                isActive={voiceActivity.isActive}
                volume={voiceActivity.volume}
                isRecording={interviewStarted && !stoppedRecording}
                avatarSpeaking={avatarSpeaking}
                disabled={false}
                isLightMode={false}
              />
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="row mb-4 mt-4">
          <div className="col-12">
            <div className="d-flex justify-content-center gap-3">
              <button
                onClick={toggleCamera}
                style={{
                  ...controlButtonStyle,
                  backgroundColor: !isCameraOn
                    ? "rgba(220, 53, 69, 0.9)"
                    : "#3F51B5",
                  width: "56px",
                  height: "56px",
                }}
                disabled={isEndingInterview}
              >
                {isCameraOn ? (
                  <FaCamera size={18} />
                ) : (
                  <FaVideoSlash size={18} />
                )}
              </button>

              <button
                onClick={endInterview}
                style={{
                  ...controlButtonStyle,
                  backgroundColor: "rgba(220, 53, 69, 0.9)",
                  width: "56px",
                  height: "56px",
                  opacity: isEndingInterview ? 0.6 : 1,
                }}
                disabled={isEndingInterview}
              >
                {isEndingInterview ? (
                  <div
                    className="spinner-border spinner-border-sm"
                    style={{ width: "18px", height: "18px", color: "#fff" }}
                  />
                ) : (
                  <FaPhoneSlash size={18} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default InterviewSessionPage;
