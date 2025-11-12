/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCameraContext } from "../../../components/InterviewSession/CameraContext";
import { FaCamera, FaVideoSlash } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import EligibilityChecker from "../start/[id]/EligibilityChecker";

// Hardcoded bot information - used as fallback for general interviewer
const HARDCODED_BOT = {
  agent_id: "6629f62e-0cac-45fd-b4ae-541840a92240",
  botName: "Second Round Interview",
  description:
    "I'll help assess your behavioral fit and competencies for this role. We'll have a conversation about your experiences, skills, and motivations to better understand your qualifications and suitability for the position.",
  interviewType: "AI-Powered Behavioral Interview",
};

interface BotConfig {
  agent_id: string;
  botName: string;
  description: string;
  interviewType: string;
  botPersonality?: string;
  companyDescription?: string;
  jobRoleDescription?: string;
  avatarConfig?: any;
}

interface DeviceOption {
  deviceId: string;
  label: string;
}

export default function InterviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params?.id as string;
  const cameraContext = useCameraContext();
  const { videoRef } = cameraContext; // Use videoRef from context

  // Bot configuration state
  const [botConfig, setBotConfig] = useState<BotConfig>(HARDCODED_BOT);
  const [loadingBotConfig, setLoadingBotConfig] = useState(true);

  // Device selection state
  const [videoDevices, setVideoDevices] = useState<DeviceOption[]>([]);
  const [audioInputDevices, setAudioInputDevices] = useState<DeviceOption[]>(
    [],
  );
  const [audioOutputDevices, setAudioOutputDevices] = useState<DeviceOption[]>(
    [],
  );
  const [selectedVideo, setSelectedVideo] = useState<string>("");
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>("");
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>("");

  // Dropdown state
  const [micDropdownOpen, setMicDropdownOpen] = useState(false);
  const [speakerDropdownOpen, setSpeakerDropdownOpen] = useState(false);
  const [cameraDropdownOpen, setCameraDropdownOpen] = useState(false);

  // Camera preview and stream reference
  const [hasStream, setHasStream] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [cameraInitializing, setCameraInitializing] = useState(false);

  // Camera states - sync with context's isCameraOn
  const [cameraOn, setCameraOn] = useState(false);

  // Sync local cameraOn state with context's isCameraOn
  useEffect(() => {
    if (cameraContext.isCameraOn !== cameraOn) {
      setCameraOn(cameraContext.isCameraOn);
    }
    const streamExists = cameraContext.cameraStream !== null;
    if (streamExists !== hasStream) {
      setHasStream(streamExists);
    }
  }, [cameraContext.isCameraOn, cameraContext.cameraStream]);

  // Voice detection states
  const [voiceDetected, setVoiceDetected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Refs for closing dropdowns
  const micDropdownRef = useRef<HTMLDivElement>(null);
  const speakerDropdownRef = useRef<HTMLDivElement>(null);
  const cameraDropdownRef = useRef<HTMLDivElement>(null);

  const [startingInterview, setStartingInterview] = useState(false);
  const hasSpokenRef = useRef(false);

  // Fetch bot configuration based on application
  useEffect(() => {
    const fetchBotConfig = async () => {
      try {
        setLoadingBotConfig(true);
        const response = await fetch(
          `/api/applications/${applicationId}/interview-config`,
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

    if (applicationId) {
      fetchBotConfig();
    }
  }, [applicationId]);

  // Simplified styles
  const containerStyle = {
    minHeight: "100vh",
    color: "#000",
    paddingBottom: "2rem",
  };

  const cardStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    color: "#000",
    borderRadius: "1rem",
  };

  const buttonStyle = {
    backgroundColor: "#3b82f6",
    backdropFilter: "blur(10px)",
    border: "none",
    color: "#fff",
    fontWeight: "600",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
  };

  const dropdownButtonStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(5px)",
    border: "1px solid rgba(0, 0, 0, 0.2)",
    color: "#000",
    borderRadius: "8px",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  const dropdownMenuStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(0, 0, 0, 0.2)",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
    position: "absolute" as const,
    top: "100%",
    left: 0,
    right: 0,
    zIndex: 1000,
    marginTop: "4px",
    maxHeight: "200px",
    overflowY: "auto" as const,
  };

  const dropdownItemStyle = {
    backgroundColor: "transparent",
    border: "none",
    color: "#000",
    padding: "12px 16px",
    width: "100%",
    textAlign: "left" as const,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  };

  // Voice detection function
  const startVoiceDetection = async () => {
    try {
      setIsListening(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedAudioInput || undefined },
        video: false,
      });

      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;

      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const detectVoice = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        setAudioLevel(average);

        if (average > 15) {
          setVoiceDetected(true);
          stopVoiceDetection();
        } else {
          animationFrameRef.current = requestAnimationFrame(detectVoice);
        }
      };

      detectVoice();
    } catch (error) {
      console.error("Error accessing microphone for voice detection:", error);
      setIsListening(false);
    }
  };

  const stopVoiceDetection = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsListening(false);
  };

  // Cleanup voice detection on unmount
  useEffect(() => {
    return () => {
      stopVoiceDetection();
    };
  }, []);

  // Close dropdowns if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        micDropdownRef.current &&
        !micDropdownRef.current.contains(event.target as Node)
      ) {
        setMicDropdownOpen(false);
      }
      if (
        speakerDropdownRef.current &&
        !speakerDropdownRef.current.contains(event.target as Node)
      ) {
        setSpeakerDropdownOpen(false);
      }
      if (
        cameraDropdownRef.current &&
        !cameraDropdownRef.current.contains(event.target as Node)
      ) {
        setCameraDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Request permissions and enumerate devices
  const requestPermissionsAndEnumerateDevices = async () => {
    try {
      setCameraInitializing(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      stream.getTracks().forEach((track) => track.stop());

      setPermissionsGranted(true);

      const devices = await navigator.mediaDevices.enumerateDevices();

      const videoOpts = devices
        .filter((d) => d.kind === "videoinput")
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${d.deviceId.slice(0, 5)}...`,
        }));

      const audioInputOpts = devices
        .filter((d) => d.kind === "audioinput")
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Mic ${d.deviceId.slice(0, 5)}...`,
        }));

      const audioOutputOpts = devices
        .filter((d) => d.kind === "audiooutput")
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Speaker ${d.deviceId.slice(0, 5)}...`,
        }));

      setVideoDevices(videoOpts);
      setAudioInputDevices(audioInputOpts);
      setAudioOutputDevices(audioOutputOpts);
      setCameraAvailable(videoOpts.length > 0);

      // Auto-select first devices
      if (videoOpts.length > 0) {
        setSelectedVideo(videoOpts[0].deviceId);
        cameraContext.setVideoDeviceId(videoOpts[0].deviceId);
      }
      if (audioInputOpts.length > 0) {
        setSelectedAudioInput(audioInputOpts[0].deviceId);
        cameraContext.setAudioInputDeviceId(audioInputOpts[0].deviceId);
      }
      if (audioOutputOpts.length > 0) {
        setSelectedAudioOutput(audioOutputOpts[0].deviceId);
        cameraContext.setAudioOutputDeviceId(audioOutputOpts[0].deviceId);
      }

      // Auto-start camera
      if (videoOpts.length > 0 && audioInputOpts.length > 0) {
        await cameraContext.initializeStream(
          videoOpts[0].deviceId,
          audioInputOpts[0].deviceId,
        );
        // States will be synced via useEffect
      }
    } catch (error) {
      console.error("Error requesting permissions:", error);
      setCameraAvailable(false);
    } finally {
      setCameraInitializing(false);
    }
  };

  // Initialize devices on component mount
  useEffect(() => {
    requestPermissionsAndEnumerateDevices();

    // ElevenLabs text-to-speech welcome message - only once
    const speakWelcome = async () => {
      if (hasSpokenRef.current) return; // Skip if already spoken
      hasSpokenRef.current = true;

      try {
        const response = await fetch("/api/text-to-speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: "Click Start Microphone Test to begin the interview",
          }),
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.volume = 0.8;
          await audio.play();

          // Cleanup
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
          };
        }
      } catch (error) {
        console.error("Failed to play welcome message:", error);
      }
    };

    // Wait a bit for page to load, then speak
    setTimeout(speakWelcome, 1000);

    return () => {
      // Cleanup on unmount (no speech to cancel with ElevenLabs)
    };
  }, []);

  // Start camera function
  const startCamera = async () => {
    try {
      setCameraInitializing(true);
      await cameraContext.initializeStream(selectedVideo, selectedAudioInput);
      // States will be synced via useEffect
    } catch (error) {
      console.error("Error accessing devices:", error);
      setCameraAvailable(false);
    } finally {
      setCameraInitializing(false);
    }
  };

  // Toggle camera
  const toggleCamera = async () => {
    const stream = cameraContext.getStream();

    // If no stream exists, start the camera
    if (!stream || !hasStream) {
      await startCamera();
      return;
    }

    // If stream exists, use context's toggle
    await cameraContext.toggleCamera();
  };

  const getSelectedDeviceLabel = (
    devices: DeviceOption[],
    selectedId: string,
  ) => {
    const device = devices.find((d) => d.deviceId === selectedId);
    return device ? device.label : "Select device";
  };

  // Handle device selection change
  // Updates both local state and context so device selections persist to interview page
  const handleDeviceChange = async (
    type: "video" | "audioInput",
    deviceId: string,
  ) => {
    if (type === "video") {
      setSelectedVideo(deviceId);
      cameraContext.setVideoDeviceId(deviceId);
    } else {
      setSelectedAudioInput(deviceId);
      cameraContext.setAudioInputDeviceId(deviceId);
    }

    // Reinitialize stream with new device if camera is already on
    if (hasStream) {
      const videoId = type === "video" ? deviceId : selectedVideo;
      const audioId = type === "audioInput" ? deviceId : selectedAudioInput;

      await cameraContext.initializeStream(videoId, audioId);
    }
  };

  const handleStartInterview = async () => {
    if (voiceDetected) {
      setStartingInterview(true);
      try {
        const key = `interview_${applicationId}_authorized`;
        sessionStorage.setItem(key, "true");

        await new Promise((resolve) => setTimeout(resolve, 100));

        // Use the application ID to route to the interview
        router.replace(`/interviews/start/${applicationId}`);
      } catch (error) {
        console.error("Error starting interview:", error);
        setStartingInterview(false);
      }
    }
  };

  // Show loading state while fetching bot configuration
  if (loadingBotConfig) {
    return (
      <EligibilityChecker>
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
      </EligibilityChecker>
    );
  }

  return (
    <EligibilityChecker>
      <div style={containerStyle}>
        <div className="container-fluid py-4 px-5">
          {/* Back Button */}
          <div className="row mb-3">
            <div className="col-12">
              <button
                className="btn"
                onClick={() => router.back()}
                style={{
                  color: "#000",
                  fontWeight: "500",
                }}
              >
                ← Back
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="row">
            {/* Left Column - Camera Preview */}
            <div className="col-md-8">
              <div style={cardStyle} className="p-4 mb-4">
                <h1 className="mb-3 font-weight-bold" style={{ color: "#000" }}>
                  {botConfig.botName}
                </h1>
                <p className="mb-4" style={{ color: "#333" }}>
                  {botConfig.description}
                </p>

                {/* Camera Preview */}
                <div
                  className="position-relative rounded mb-4"
                  style={{
                    width: "100%",
                    maxWidth: "900px",
                    height: "475px",
                    backgroundColor: "#000",
                    borderRadius: "1rem",
                    overflow: "hidden",
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

                  {/* Camera Off Overlay */}
                  {!(hasStream && cameraOn) && (
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                      style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
                    >
                      <FaCamera size={48} className="mb-3" />
                      <p className="mb-0">
                        {cameraInitializing
                          ? "Initializing camera..."
                          : !cameraAvailable
                            ? "Camera not available"
                            : !permissionsGranted
                              ? "Camera permission needed"
                              : "Camera is off"}
                      </p>
                      {cameraAvailable && !cameraInitializing && (
                        <button
                          onClick={toggleCamera}
                          className="btn mt-3"
                          style={buttonStyle}
                          disabled={cameraInitializing}
                        >
                          {cameraInitializing
                            ? "Starting..."
                            : "Turn On Camera"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Camera Toggle Button */}
                  {hasStream && (
                    <button
                      onClick={toggleCamera}
                      disabled={cameraInitializing}
                      style={{
                        position: "absolute",
                        bottom: "20px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: cameraOn
                          ? "#3b82f6"
                          : "rgba(220, 53, 69, 0.8)",
                        backdropFilter: "blur(10px)",
                        color: "#fff",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        borderRadius: "50%",
                        width: "60px",
                        height: "60px",
                        cursor: cameraInitializing ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
                        opacity: cameraInitializing ? 0.6 : 1,
                      }}
                    >
                      {cameraOn ? (
                        <FaCamera size={20} />
                      ) : (
                        <FaVideoSlash size={20} />
                      )}
                    </button>
                  )}
                </div>

                {/* Device Selectors */}
                <div className="row g-3">
                  {/* Microphone */}
                  <div
                    className="col-md-4"
                    ref={micDropdownRef}
                    style={{ position: "relative" }}
                  >
                    <label className="small mb-2" style={{ color: "#333" }}>
                      Microphone
                    </label>
                    <button
                      style={dropdownButtonStyle}
                      onClick={() => {
                        setMicDropdownOpen(!micDropdownOpen);
                        setSpeakerDropdownOpen(false);
                        setCameraDropdownOpen(false);
                      }}
                    >
                      <span className="text-truncate">
                        {getSelectedDeviceLabel(
                          audioInputDevices,
                          selectedAudioInput,
                        )}
                      </span>
                    </button>
                    {micDropdownOpen && (
                      <div style={dropdownMenuStyle}>
                        {audioInputDevices.map((device) => (
                          <button
                            key={device.deviceId}
                            style={dropdownItemStyle}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "rgba(94, 7, 255, 0.15)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }}
                            onClick={() => {
                              handleDeviceChange("audioInput", device.deviceId);
                              setMicDropdownOpen(false);
                            }}
                          >
                            {device.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Speaker */}
                  <div
                    className="col-md-4"
                    ref={speakerDropdownRef}
                    style={{ position: "relative" }}
                  >
                    <label className="small mb-2" style={{ color: "#333" }}>
                      Speaker
                    </label>
                    <button
                      style={dropdownButtonStyle}
                      onClick={() => {
                        setSpeakerDropdownOpen(!speakerDropdownOpen);
                        setMicDropdownOpen(false);
                        setCameraDropdownOpen(false);
                      }}
                    >
                      <span className="text-truncate">
                        {getSelectedDeviceLabel(
                          audioOutputDevices,
                          selectedAudioOutput,
                        )}
                      </span>
                    </button>
                    {speakerDropdownOpen && (
                      <div style={dropdownMenuStyle}>
                        {audioOutputDevices.map((device) => (
                          <button
                            key={device.deviceId}
                            style={dropdownItemStyle}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "rgba(94, 7, 255, 0.15)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }}
                            onClick={() => {
                              setSelectedAudioOutput(device.deviceId);
                              cameraContext.setAudioOutputDeviceId(
                                device.deviceId,
                              );
                              setSpeakerDropdownOpen(false);
                            }}
                          >
                            {device.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Camera */}
                  <div
                    className="col-md-4"
                    ref={cameraDropdownRef}
                    style={{ position: "relative" }}
                  >
                    <label className="small mb-2" style={{ color: "#333" }}>
                      Camera
                    </label>
                    <button
                      style={dropdownButtonStyle}
                      onClick={() => {
                        setCameraDropdownOpen(!cameraDropdownOpen);
                        setMicDropdownOpen(false);
                        setSpeakerDropdownOpen(false);
                      }}
                    >
                      <span className="text-truncate">
                        {getSelectedDeviceLabel(videoDevices, selectedVideo)}
                      </span>
                    </button>
                    {cameraDropdownOpen && (
                      <div style={dropdownMenuStyle}>
                        {videoDevices.map((device) => (
                          <button
                            key={device.deviceId}
                            style={dropdownItemStyle}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "rgba(94, 7, 255, 0.15)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }}
                            onClick={() => {
                              handleDeviceChange("video", device.deviceId);
                              setCameraDropdownOpen(false);
                            }}
                          >
                            {device.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Join Interview */}
            <div className="col-md-4">
              <div style={cardStyle} className="p-4 text-center">
                <h2 className="mb-4 font-weight-bold" style={{ color: "#000" }}>
                  Join Interview
                </h2>

                {/* Voice Detection */}
                {!voiceDetected && (
                  <div className="mb-4">
                    <div
                      className="p-3 rounded mb-3"
                      style={{
                        backgroundColor: "rgba(59, 130, 246, 0.15)",
                        backdropFilter: "blur(5px)",
                        border: "1px solid rgba(59, 130, 246, 0.4)",
                      }}
                    >
                      <p className="mb-3" style={{ color: "#000" }}>
                        Test your microphone before starting
                      </p>

                      {!isListening ? (
                        <button
                          onClick={startVoiceDetection}
                          className="btn"
                          style={buttonStyle}
                        >
                          Start Microphone Test
                        </button>
                      ) : (
                        <div>
                          <p className="mb-2" style={{ color: "#000" }}>
                            Listening... Say something!
                          </p>
                          <div
                            style={{
                              width: "100%",
                              height: "8px",
                              backgroundColor: "rgba(0, 0, 0, 0.3)",
                              borderRadius: "4px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(audioLevel * 3, 100)}%`,
                                height: "100%",
                                backgroundColor:
                                  audioLevel > 15 ? "#4caf50" : "#2196f3",
                                transition: "width 0.1s ease",
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Success Message & Start Button */}
                {voiceDetected && (
                  <div>
                    <div
                      className="p-3 rounded mb-4"
                      style={{
                        backgroundColor: "rgba(76, 175, 80, 0.15)",
                        backdropFilter: "blur(5px)",
                        border: "1px solid rgba(76, 175, 80, 0.4)",
                      }}
                    >
                      <p className="mb-0" style={{ color: "#000" }}>
                        ✓ Microphone working properly!
                      </p>
                    </div>

                    <button
                      className="btn btn-lg w-100"
                      style={buttonStyle}
                      onClick={handleStartInterview}
                      disabled={!voiceDetected || startingInterview}
                    >
                      {startingInterview
                        ? "Starting Interview..."
                        : "Start Interview"}
                    </button>
                  </div>
                )}

                {/* Interview Type */}
                <div className="mt-4">
                  <div
                    className="p-3 rounded"
                    style={{
                      backgroundColor: "rgba(23, 162, 184, 0.15)",
                      backdropFilter: "blur(5px)",
                      border: "1px solid rgba(23, 162, 184, 0.4)",
                    }}
                  >
                    <h6 style={{ color: "#000" }}>Interview Type</h6>
                    <p className="mb-0 small" style={{ color: "#333" }}>
                      {botConfig.interviewType}
                    </p>
                  </div>
                </div>
              </div>

              {/* Setup Tips */}
              <div style={cardStyle} className="p-4 mt-3">
                <h5 className="mb-3 font-weight-bold" style={{ color: "#000" }}>
                  Setup Tips
                </h5>
                <ul className="small ps-3" style={{ color: "#333" }}>
                  <li>Use Chrome or Edge browser</li>
                  <li>Find a quiet environment</li>
                  <li>Set volume to 50-70%</li>
                  <li>Pause 2-3 seconds after speaking</li>
                  <li>Ensure stable internet connection</li>
                  <li>Don't refresh during the interview</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EligibilityChecker>
  );
}
