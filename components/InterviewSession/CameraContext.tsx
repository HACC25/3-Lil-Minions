"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";

interface CameraContextType {
  cameraStream: MediaStream | null;
  getStream: () => MediaStream | null;
  initializeStream: (
    videoDeviceId: string,
    audioDeviceId: string,
  ) => Promise<MediaStream | null>;
  videoDeviceId: string;
  audioInputDeviceId: string;
  audioOutputDeviceId: string;
  setVideoDeviceId: (id: string) => void;
  setAudioInputDeviceId: (id: string) => void;
  setAudioOutputDeviceId: (id: string) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraError: string | null;
  isCameraOn: boolean;
  toggleCamera: () => Promise<void>;
  ensureVideoConnection: () => void;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const useCameraContext = () => {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error("useCameraContext must be used within a CameraProvider");
  }
  return context;
};

interface CameraProviderProps {
  children: ReactNode;
}

export const CameraProvider: React.FC<CameraProviderProps> = ({ children }) => {
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDeviceId, setVideoDeviceId] = useState<string>("");
  const [audioInputDeviceId, setAudioInputDeviceId] = useState<string>("");
  const [audioOutputDeviceId, setAudioOutputDeviceId] = useState<string>("");

  const getStream = () => cameraStream;

  const initializeStream = async (videoId: string, audioId: string) => {
    try {
      // console.log(
      //   "Initializing stream with video:",
      //   videoId,
      //   "audio:",
      //   audioId
      // );

      // Stop existing stream
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: videoId ? { deviceId: { exact: videoId } } : true,
        audio: audioId ? { deviceId: { exact: audioId } } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      setIsCameraOn(true);
      setCameraError(null);

      // Immediately connect to video element if available
      if (videoRef.current) {
        connectStreamToVideo(stream);
      }

      return stream;
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError(
        `Failed to access camera: ${err instanceof Error ? err.message : String(err)}`,
      );
      setIsCameraOn(false);
      setCameraStream(null);
      return null;
    }
  };

  const connectStreamToVideo = (stream: MediaStream) => {
    if (videoRef.current && stream) {
      // console.log("Connecting stream to video element");
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = async () => {
        try {
          await videoRef.current?.play();
          // console.log("Video playback started successfully");
        } catch (error) {
          console.error("Error playing video:", error);
        }
      };
    }
  };

  const ensureVideoConnection = () => {
    if (cameraStream && videoRef.current && isCameraOn) {
      // Check if video element has the stream
      if (videoRef.current.srcObject !== cameraStream) {
        // console.log("Reconnecting stream to video element");
        connectStreamToVideo(cameraStream);
      }
    }
  };

  const toggleCamera = async () => {
    // console.log("Toggle camera called, current state:", isCameraOn);

    if (isCameraOn && cameraStream) {
      // Turn off camera - disable video tracks
      cameraStream.getVideoTracks().forEach((track) => (track.enabled = false));
      setIsCameraOn(false);
    } else if (cameraStream) {
      // Turn on camera - enable video tracks
      cameraStream.getVideoTracks().forEach((track) => (track.enabled = true));
      setIsCameraOn(true);

      // Ensure video element is connected
      setTimeout(() => {
        ensureVideoConnection();
      }, 100);
    } else {
      // No stream exists, initialize new one
      await initializeStream(videoDeviceId, audioInputDeviceId);
    }
  };

  // REMOVED: Auto-initialize camera on mount - this was causing the issue

  // Ensure video connection whenever stream or camera state changes
  useEffect(() => {
    if (cameraStream && isCameraOn) {
      ensureVideoConnection();
    }
  }, [cameraStream, isCameraOn]);

  // Monitor video element changes and reconnect if needed
  useEffect(() => {
    const checkVideoConnection = () => {
      if (videoRef.current && cameraStream && isCameraOn) {
        if (videoRef.current.srcObject !== cameraStream) {
          // console.log("Video element lost connection, reconnecting...");
          connectStreamToVideo(cameraStream);
        }
      }
    };

    // Check connection periodically
    const interval = setInterval(checkVideoConnection, 2000);

    return () => clearInterval(interval);
  }, [cameraStream, isCameraOn]);

  const value: CameraContextType = {
    cameraStream,
    getStream,
    initializeStream,
    videoDeviceId,
    audioInputDeviceId,
    audioOutputDeviceId,
    setVideoDeviceId,
    setAudioInputDeviceId,
    setAudioOutputDeviceId,
    videoRef,
    cameraError,
    isCameraOn,
    toggleCamera,
    ensureVideoConnection,
  };

  return (
    <CameraContext.Provider value={value}>{children}</CameraContext.Provider>
  );
};
