/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import UnifiedAvatar from "../HeyGenAvatar/UnifiedAvatar";

interface AudioRecorderProps {
  agentId: string;
  autoStart?: boolean;
  stoppedRecording?: boolean;
  onTranscriptChange?: (transcript: string, isInterim: boolean) => void;
  onDialogflowResponseChange?: (
    response: string[],
    sessionParams?: any,
  ) => void;
  onVoiceActivityChange?: (isActive: boolean, volume: number) => void;
  onProcessingChange?: (isProcessing: boolean) => void;
  onProcessingStart?: () => void;
  onAvatarSpeakingChange?: (isSpeaking: boolean) => void;
  initializeAvatar?: boolean;
  enableRecording?: boolean;
  interviewId?: string;
  onRestartConnection?: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  agentId,
  autoStart = false,
  stoppedRecording = false,
  onTranscriptChange,
  onDialogflowResponseChange,
  onVoiceActivityChange,
  onProcessingChange,
  onProcessingStart,
  initializeAvatar = true,
  enableRecording = true,
  interviewId,
  onRestartConnection,
  onAvatarSpeakingChange = () => {},
}) => {
  const [recording, setRecording] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [avatarInitialized, setAvatarInitialized] = useState(false);
  const [avatarReady, setAvatarReady] = useState(false);
  const [dialogflowResponse, setDialogflowResponse] = useState<string[]>([]);
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);
  const [avatarHasSpokenFirst, setAvatarHasSpokenFirst] = useState(false);
  const [waitingForInitialResponse, setWaitingForInitialResponse] =
    useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderNodeRef = useRef<AudioWorkletNode | null>(null);
  const vadNodeRef = useRef<AudioWorkletNode | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const userStartedSpeakingRef = useRef<boolean>(false);
  const workletUrlsRef = useRef<string[]>([]);
  const isCleaningUpRef = useRef<boolean>(false);
  const audioBufferRef = useRef<ArrayBuffer[]>([]);
  const isBufferingRef = useRef<boolean>(false);
  const lastInterimTranscriptRef = useRef<string>("");
  const lastFinalTranscriptRef = useRef<string>("");
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const avatarSpeakingWatcherRef = useRef<NodeJS.Timeout | null>(null);
  const avatarHasSpokenFirstRef = useRef<boolean>(false);
  const currentConversationIdRef = useRef<string>("");
  const connectionValidRef = useRef<boolean>(true);

  // Generate a simple anonymous user ID
  const userId = `anonymous_${Math.random().toString(36).substring(7)}`;

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const wsProtocol = backendUrl.startsWith("https") ? "wss" : "ws";
  const strippedUrl = backendUrl.replace(/^https?:\/\//, "");

  const convertFloat32ToInt16 = (buffer: Float32Array): ArrayBuffer => {
    const len = buffer.length;
    const result = new Int16Array(len);
    for (let i = 0; i < len; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      result[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return result.buffer;
  };

  // Avatar speaking effect
  useEffect(() => {
    isSpeakingRef.current = avatarSpeaking;

    if (onAvatarSpeakingChange) {
      onAvatarSpeakingChange(avatarSpeaking);
    }

    if (avatarSpeaking) {
      if (!avatarHasSpokenFirstRef.current) {
        avatarHasSpokenFirstRef.current = true;
        setAvatarHasSpokenFirst(true);
        setWaitingForInitialResponse(false);
      }

      isBufferingRef.current = true;
      audioBufferRef.current = [];

      if (onVoiceActivityChange) {
        onVoiceActivityChange(false, 0);
      }

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      userStartedSpeakingRef.current = false;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        sendWebSocketMessage({ event: "pause_recognition" });
      }
    } else {
      isBufferingRef.current = false;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        sendWebSocketMessage({ event: "resume_recognition" });
        audioBufferRef.current = [];
      }
    }
  }, [avatarSpeaking, onVoiceActivityChange]);

  // Update worklets when avatar has spoken
  useEffect(() => {
    if (avatarHasSpokenFirst && recorderNodeRef.current && vadNodeRef.current) {
      if (recorderNodeRef.current) {
        recorderNodeRef.current.port.postMessage({
          type: "avatar_spoken",
          value: true,
        });
      }

      if (vadNodeRef.current) {
        vadNodeRef.current.port.postMessage({
          type: "avatar_spoken",
          value: true,
        });
      }
    }
  }, [avatarHasSpokenFirst]);

  const cleanupResources = useCallback(() => {
    if (isCleaningUpRef.current || !connectionValidRef.current) {
      return;
    }

    isCleaningUpRef.current = true;

    try {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current);
        transcriptTimeoutRef.current = null;
      }

      if (wsRef.current) {
        const wsState = wsRef.current.readyState;
        if (wsState === WebSocket.OPEN) {
          try {
            // Send end signal first
            wsRef.current.send(
              JSON.stringify({
                event: "end_of_speech",
                agentId: agentId,
              }),
            );

            // Wait a moment for the message to be sent
            setTimeout(() => {
              if (
                wsRef.current &&
                wsRef.current.readyState === WebSocket.OPEN
              ) {
                wsRef.current.close(1000, `Session ended for agent ${agentId}`);
              }
              wsRef.current = null;
            }, 100);
          } catch (e) {
            console.warn("Failed to send end_of_speech message:", e);
            // Close immediately on error
            if (wsRef.current) {
              wsRef.current.close(1000, `Session ended for agent ${agentId}`);
              wsRef.current = null;
            }
          }
        } else {
          // If not open, just clean up the reference
          wsRef.current = null;
        }
      }

      if (mediaStreamRef.current) {
        try {
          mediaStreamRef.current.getTracks().forEach((track) => {
            track.stop();
          });
          mediaStreamRef.current = null;
        } catch (e) {
          console.warn("Error stopping media tracks:", e);
        }
      }

      try {
        if (recorderNodeRef.current) {
          recorderNodeRef.current.disconnect();
          recorderNodeRef.current = null;
        }

        if (vadNodeRef.current) {
          vadNodeRef.current.disconnect();
          vadNodeRef.current = null;
        }
      } catch (e) {
        console.warn("Error disconnecting audio nodes:", e);
      }

      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        try {
          audioContextRef.current.close();
          audioContextRef.current = null;
        } catch (e) {
          console.warn("Error closing audio context:", e);
        }
      }

      workletUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.warn("Error revoking worklet URL:", e);
        }
      });
      workletUrlsRef.current = [];

      lastInterimTranscriptRef.current = "";
      lastFinalTranscriptRef.current = "";
      processedMessagesRef.current.clear();
      audioBufferRef.current = [];
      avatarHasSpokenFirstRef.current = false;
      setAvatarHasSpokenFirst(false);
      setWaitingForInitialResponse(false);
    } catch (error) {
      console.error(`Error during cleanup for agent ${agentId}:`, error);
    } finally {
      isCleaningUpRef.current = false;
    }
  }, [agentId]);

  useEffect(() => {
    connectionValidRef.current = true;
    return () => {
      connectionValidRef.current = false;
    };
  }, []);

  const sendWebSocketMessage = useCallback(
    (message: any) => {
      if (
        wsRef.current?.readyState === WebSocket.OPEN &&
        !isCleaningUpRef.current
      ) {
        try {
          const messageWithContext = {
            ...message,
            agentId: agentId,
            userId: userId,
            conversationId: currentConversationIdRef.current,
            timestamp: Date.now(),
          };
          wsRef.current.send(JSON.stringify(messageWithContext));
        } catch (error) {
          console.error(`Failed to send message for agent ${agentId}:`, error);
        }
      }
    },
    [agentId, userId],
  );

  const startRecording = async () => {
    try {
      // Clean up any existing resources first
      cleanupResources();

      setWaitingForInitialResponse(true);

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;

      // Create AudioContext
      audioContextRef.current = new AudioContext({
        latencyHint: "interactive",
      });

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      const actualSampleRate = audioContextRef.current.sampleRate;
      console.log(`AudioContext sample rate: ${actualSampleRate}Hz`);

      // Create WebSocket connection - NO AUTH NEEDED
      const wsUrl = `${wsProtocol}://${strippedUrl}/ws/transcribe?agent_id=${agentId}&user_id=${userId}&sample_rate=${actualSampleRate}`;

      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.binaryType = "arraybuffer";

      // Wait for connection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("WebSocket connection timeout"));
        }, 5000);

        if (!wsRef.current) {
          clearTimeout(timeout);
          reject(new Error("WebSocket reference is null"));
          return;
        }

        wsRef.current.onopen = () => {
          clearTimeout(timeout);
          console.log("WebSocket connected successfully");
          // NO AUTHENTICATION MESSAGE NEEDED
          resolve(true);
        };

        wsRef.current.onerror = (error) => {
          clearTimeout(timeout);
          console.error("WebSocket error:", error);
          reject(error);
        };
      });

      // WebSocket message handler
      wsRef.current.onmessage = (event) => {
        if (!connectionValidRef.current || isCleaningUpRef.current) {
          return;
        }

        try {
          const data = JSON.parse(event.data);

          if (!currentConversationIdRef.current && data.conversation_id) {
            currentConversationIdRef.current = data.conversation_id;
          }

          // Process user transcripts
          if (data.userTranscript !== undefined && data.userTranscript !== "") {
            if (avatarHasSpokenFirstRef.current) {
              if (data.isInterim) {
                if (data.userTranscript !== lastInterimTranscriptRef.current) {
                  lastInterimTranscriptRef.current = data.userTranscript;

                  if (onProcessingChange) onProcessingChange(true);
                  if (onProcessingStart) onProcessingStart();

                  if (onTranscriptChange) {
                    onTranscriptChange(data.userTranscript, true);
                  }

                  // Reset transcript timeout - user is still speaking
                  if (transcriptTimeoutRef.current) {
                    clearTimeout(transcriptTimeoutRef.current);
                  }

                  // Start new timeout - if no transcript updates for 3 seconds, end speech
                  transcriptTimeoutRef.current = setTimeout(() => {
                    if (
                      wsRef.current &&
                      wsRef.current.readyState === WebSocket.OPEN &&
                      !isSpeakingRef.current
                    ) {
                      console.log(
                        "🔇 No transcript updates for 3 seconds, sending end_of_speech",
                      );
                      sendWebSocketMessage({ event: "end_of_speech" });
                    }
                    transcriptTimeoutRef.current = null;
                  }, 3000);
                }
              } else {
                const transcriptHash = `${data.userTranscript.trim()}-${
                  data.userTranscript.length
                }`;

                if (
                  data.userTranscript !== lastFinalTranscriptRef.current &&
                  !processedMessagesRef.current.has(transcriptHash)
                ) {
                  lastFinalTranscriptRef.current = data.userTranscript;
                  processedMessagesRef.current.add(transcriptHash);

                  if (onProcessingChange) onProcessingChange(false);

                  if (onTranscriptChange) {
                    onTranscriptChange(data.userTranscript, false);
                  }

                  lastInterimTranscriptRef.current = "";

                  // Clear transcript timeout when final transcript received
                  if (transcriptTimeoutRef.current) {
                    clearTimeout(transcriptTimeoutRef.current);
                    transcriptTimeoutRef.current = null;
                  }
                }
              }
            }
          }

          // Handle dialogflow response
          if (data.dialogflowResponse) {
            const responses = Array.isArray(data.dialogflowResponse)
              ? data.dialogflowResponse
              : [data.dialogflowResponse];

            setDialogflowResponse(responses);

            if (
              data.isInitialGreeting ||
              (!avatarHasSpokenFirstRef.current && responses.length > 0)
            ) {
              setWaitingForInitialResponse(false);
            }

            if (onDialogflowResponseChange) {
              onDialogflowResponseChange(responses, data.sessionParams || {});
            }

            if (onProcessingChange) onProcessingChange(false);
          }
        } catch (e) {
          console.error("Error parsing message:", e);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        lastInterimTranscriptRef.current = "";
        lastFinalTranscriptRef.current = "";
        processedMessagesRef.current.clear();

        if (!isCleaningUpRef.current && event.code !== 1000) {
          setTimeout(() => {
            if (recording) {
              console.log("Attempting to reconnect...");
              startRecording();
            }
          }, 1000);
        }
      };

      // Set up audio worklets
      const source = audioContextRef.current.createMediaStreamSource(stream);

      // Recorder worklet
      const recorderWorkletCode = `
        class RecorderProcessor extends AudioWorkletProcessor {
          constructor() {
            super();
            this.isProcessing = true;
            this.isMuted = false;
            this.avatarHasSpokenFirst = false;
            
            this.port.onmessage = (event) => {
              if (event.data.type === 'mute') {
                this.isMuted = event.data.value;
              } else if (event.data.type === 'avatar_spoken') {
                this.avatarHasSpokenFirst = event.data.value;
              }
            };
          }

          process(inputs, outputs, parameters) {
            if (!this.isProcessing) return false;
            
            const input = inputs[0];
            if (input && input[0] && input[0].length > 0 && !this.isMuted && this.avatarHasSpokenFirst) {
              this.port.postMessage({type: 'audio', data: input[0]});
            } else {
              this.port.postMessage({type: 'audio', data: new Float32Array(128).fill(0)});
            }
            return true;
          }
        }
        registerProcessor('recorder-processor', RecorderProcessor);
      `;

      const recorderBlob = new Blob([recorderWorkletCode], {
        type: "application/javascript",
      });
      const recorderUrl = URL.createObjectURL(recorderBlob);
      workletUrlsRef.current.push(recorderUrl);

      await audioContextRef.current.audioWorklet.addModule(recorderUrl);

      const recorderNode = new AudioWorkletNode(
        audioContextRef.current,
        "recorder-processor",
      );
      recorderNodeRef.current = recorderNode;

      recorderNode.port.onmessage = (event) => {
        if (event.data.type === "audio") {
          const float32Samples = event.data.data;
          const pcmData = convertFloat32ToInt16(float32Samples);

          if (!avatarHasSpokenFirstRef.current) {
            return;
          }

          if (isSpeakingRef.current || isBufferingRef.current) {
            return;
          }

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(pcmData);
          }
        }
      };

      source.connect(recorderNode);

      // VAD worklet
      const vadWorkletCode = `
        class AudioLevelProcessor extends AudioWorkletProcessor {
          constructor() {
            super();
            this.volume = 0;
            this.interval = 25;
            this.nextFrame = this.interval;
            this.isProcessing = true;
            this.isMuted = false;
            this.avatarHasSpokenFirst = false;
            this.noiseFloor = 0;
            this.noiseFloorSamples = 0;
            this.maxNoiseFloorSamples = 100;
            
            this.port.onmessage = (event) => {
              if (event.data.type === 'mute') {
                this.isMuted = event.data.value;
              } else if (event.data.type === 'avatar_spoken') {
                this.avatarHasSpokenFirst = event.data.value;
              }
            };
          }
            
          get intervalInFrames() {
            return (this.interval / 1000) * sampleRate;
          }
          
          process(inputList) {
            if (!this.isProcessing || this.isMuted || !this.avatarHasSpokenFirst) {
              this.port.postMessage({ volume: 0 });
              return true;
            }
            
            const firstInput = inputList[0];
            if (firstInput && firstInput.length > 0) {
              const inputData = firstInput[0];
              let total = 0;
              for (let i = 0; i < inputData.length; i++) {
                total += Math.abs(inputData[i]);
              }
              const rms = Math.sqrt(total / inputData.length);
              
              if (this.noiseFloorSamples < this.maxNoiseFloorSamples) {
                this.noiseFloor = (this.noiseFloor * this.noiseFloorSamples + rms) / (this.noiseFloorSamples + 1);
                this.noiseFloorSamples++;
              }

              const adjustedRms = Math.max(0, rms - this.noiseFloor);
              this.volume = Math.max(0, Math.min(1, adjustedRms * 3));

              this.nextFrame -= inputData.length;
              if (this.nextFrame < 0) {
                this.nextFrame += this.intervalInFrames;
                this.port.postMessage({ 
                  volume: this.volume, 
                  noiseFloor: this.noiseFloor,
                  rawRms: rms 
                });
              }
            }
            return true;
          }
        }
        registerProcessor('audiolevel', AudioLevelProcessor);
      `;

      const vadBlob = new Blob([vadWorkletCode], {
        type: "application/javascript",
      });
      const vadUrl = URL.createObjectURL(vadBlob);
      workletUrlsRef.current.push(vadUrl);

      await audioContextRef.current.audioWorklet.addModule(vadUrl);

      const vadNode = new AudioWorkletNode(
        audioContextRef.current,
        "audiolevel",
      );
      vadNodeRef.current = vadNode;

      const updateWorkletState = (muted: boolean, avatarHasSpoken: boolean) => {
        if (recorderNodeRef.current) {
          recorderNodeRef.current.port.postMessage({
            type: "mute",
            value: muted,
          });
          recorderNodeRef.current.port.postMessage({
            type: "avatar_spoken",
            value: avatarHasSpoken,
          });
        }
        if (vadNodeRef.current) {
          vadNodeRef.current.port.postMessage({
            type: "mute",
            value: muted,
          });
          vadNodeRef.current.port.postMessage({
            type: "avatar_spoken",
            value: avatarHasSpoken,
          });
        }
      };

      const avatarSpeakingWatcher = setInterval(() => {
        updateWorkletState(
          isSpeakingRef.current,
          avatarHasSpokenFirstRef.current,
        );
      }, 50);

      vadNode.port.onmessage = (event) => {
        if (!avatarHasSpokenFirstRef.current) {
          if (onVoiceActivityChange) {
            onVoiceActivityChange(false, 0);
          }
          return;
        }

        if (isSpeakingRef.current) {
          if (onVoiceActivityChange) {
            onVoiceActivityChange(false, 0);
          }
          return;
        }

        const { volume, noiseFloor } = event.data;

        const getOptimalThreshold = (noiseFloor: number) => {
          if (noiseFloor > 0.05) {
            return Math.max(0.08, noiseFloor * 1.5);
          } else {
            return Math.max(0.15, noiseFloor * 4.0);
          }
        };
        const silenceThreshold = getOptimalThreshold(noiseFloor);

        // Only report voice activity status - don't trigger end_of_speech
        // End of speech is now handled by transcript timeout
        if (volume >= silenceThreshold) {
          if (onVoiceActivityChange) {
            onVoiceActivityChange(true, volume);
          }
        } else {
          if (onVoiceActivityChange) {
            onVoiceActivityChange(false, 0);
          }
        }
      };

      source.connect(vadNode);

      // Heartbeat
      heartbeatRef.current = setInterval(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          sendWebSocketMessage({ event: "heartbeat" });
        }
      }, 3000);

      avatarSpeakingWatcherRef.current = avatarSpeakingWatcher;

      setRecording(true);
      setSessionStarted(true);
      console.log("Recording started successfully");
    } catch (error) {
      console.error("Error starting recording:", error);
      cleanupResources();
    }
  };

  const stopRecording = useCallback(async () => {
    console.log("🛑 Stopping recording...");
    setRecording(false);
    setSessionStarted(false);

    if (avatarSpeakingWatcherRef.current) {
      clearInterval(avatarSpeakingWatcherRef.current);
      avatarSpeakingWatcherRef.current = null;
    }

    if (onVoiceActivityChange) {
      onVoiceActivityChange(false, 0);
    }
    if (onProcessingChange) {
      onProcessingChange(false);
    }

    // Clean up resources and wait for completion
    cleanupResources();

    // Give cleanup more time to complete gracefully (includes WebSocket close delay)
    await new Promise((resolve) => setTimeout(resolve, 800));

    console.log("✅ Recording stopped and cleaned up");
  }, [cleanupResources, onVoiceActivityChange, onProcessingChange]);

  // Handle stop recording prop
  useEffect(() => {
    if (stoppedRecording && recording) {
      stopRecording();
    }
  }, [stoppedRecording, recording, stopRecording]);

  // Initialize avatar
  useEffect(() => {
    if (initializeAvatar) {
      setAvatarInitialized(true);
    }
  }, [initializeAvatar]);

  // Auto-start recording
  useEffect(() => {
    if (
      enableRecording &&
      autoStart &&
      !recording &&
      !sessionStarted &&
      avatarReady
    ) {
      startRecording();
    }
  }, [enableRecording, autoStart, avatarReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (avatarSpeakingWatcherRef.current) {
        clearInterval(avatarSpeakingWatcherRef.current);
        avatarSpeakingWatcherRef.current = null;
      }
      cleanupResources();
    };
  }, [cleanupResources]);

  const handleAvatarReady = useCallback(() => {
    console.log("Avatar is ready!");
    setAvatarReady(true);
  }, []);

  const handleManualStart = useCallback(() => {
    if (avatarReady && enableRecording) {
      startRecording();
    }
  }, [avatarReady, enableRecording]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).audioRecorderManualStart = handleManualStart;
    }
  }, [handleManualStart]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {avatarInitialized && (
        <UnifiedAvatar
          sessionStarted={sessionStarted}
          dialogflowResponse={dialogflowResponse}
          onAvatarSpeakingChange={setAvatarSpeaking}
          onAvatarReady={handleAvatarReady}
          interviewId={interviewId}
        />
      )}

      {/* Waiting indicator */}
      {waitingForInitialResponse && recording && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid #f3f3f3",
              borderTop: "3px solid #3498db",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 15px",
            }}
          />
          <div>Waiting for AI to start the interview...</div>
          <div style={{ fontSize: "14px", opacity: 0.8, marginTop: "8px" }}>
            Please wait for the interviewer to speak first
          </div>

          {onRestartConnection && (
            <button
              onClick={onRestartConnection}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.9rem",
                borderRadius: "4px",
                border: "none",
                background: "#ff7755",
                color: "white",
                cursor: "pointer",
                marginTop: "15px",
              }}
            >
              Waiting for more than 30 seconds?
            </button>
          )}
        </div>
      )}

      {/* CSS for spinner */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default AudioRecorder;
