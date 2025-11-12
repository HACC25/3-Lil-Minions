import React, { useEffect, useState, useRef } from "react";

interface VoiceActivityIndicatorProps {
  isActive: boolean;
  volume: number;
  isRecording?: boolean;
  avatarSpeaking?: boolean;
  disabled?: boolean;
  className?: string;
  isLightMode?: boolean; // Optional prop to control light mode
}

const VoiceActivityIndicator: React.FC<VoiceActivityIndicatorProps> = ({
  isActive,
  volume,
  isRecording = false,
  avatarSpeaking = false,
  disabled = false,
  className = "",
  isLightMode = false, // ✅ FIXED: Default to boolean false, not string
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0); // ✅ Add frame counter for slower updates
  const audioDataRef = useRef<number[]>([]);
  const [isDetectingSpeech, setIsDetectingSpeech] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 60 });

  // Initialize audio data array
  useEffect(() => {
    audioDataRef.current = new Array(400).fill(0); // ✅ MORE data points for slower movement
  }, []);

  // Handle canvas resizing
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth - 16; // Account for padding
        setCanvasSize({
          width: Math.max(400, containerWidth), // Minimum width of 400px
          height: 60,
        });
      }
    };

    // Initial size
    handleResize();

    // Listen for window resize
    window.addEventListener("resize", handleResize);

    // Use ResizeObserver if available for more accurate container size tracking
    let resizeObserver: ResizeObserver | null = null;
    if (window.ResizeObserver && containerRef.current) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // Update canvas size when canvasSize changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
    }
  }, [canvasSize]);

  // Update speech detection state
  useEffect(() => {
    setIsDetectingSpeech(
      isActive && !avatarSpeaking && !disabled && volume > 0.1,
    );
  }, [isActive, avatarSpeaking, disabled, volume]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      frameCountRef.current++;

      // ✅ Only update waveform data every 3 frames for slower movement
      if (frameCountRef.current % 3 === 0) {
        // Shift existing data left
        audioDataRef.current.shift();

        // Add new data point
        if (isDetectingSpeech) {
          // Generate realistic speech waveform
          const baseAmplitude = volume * 0.7;
          const noise = (Math.random() - 0.5) * 0.4;
          const speechPattern = Math.sin(Date.now() * 0.004) * 0.3; // ✅ Slower speech pattern
          const newValue =
            (baseAmplitude + noise + speechPattern) *
            (Math.random() * 0.9 + 0.5);
          audioDataRef.current.push(Math.max(-1, Math.min(1, newValue)));
        } else {
          // Low amplitude noise when not speaking
          const noise = (Math.random() - 0.5) * 0.08;
          audioDataRef.current.push(noise);
        }
      }

      // ✅ FIXED: Canvas background with proper light mode support
      ctx.fillStyle = isLightMode ? "#f8fafc" : "#1A1A2E";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw waveform
      drawWaveform(ctx, canvas.width, canvas.height);

      // Draw speech detection overlay
      drawSpeechDetection(ctx, canvas.width, canvas.height);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDetectingSpeech, volume, canvasSize, isLightMode]); // ✅ Added isLightMode dependency

  const drawWaveform = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    const centerY = height / 2;
    const amplitudeScale = height * 0.35;

    // ✅ FIXED: Waveform turns GREEN when speaking
    if (isDetectingSpeech) {
      // Green when speaking (both light and dark mode)
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 4; // ✅ BOLDER when speaking
      ctx.shadowColor = "#22c55e";
      ctx.shadowBlur = 8;
    } else {
      // Default colors when not speaking
      if (isLightMode) {
        ctx.strokeStyle = "#64748b"; // Slate for light mode
      } else {
        ctx.strokeStyle = "#94a3b8"; // Light slate for dark mode
      }
      ctx.lineWidth = 2; // Normal thickness when not speaking
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();

    audioDataRef.current.forEach((value, index) => {
      const x = (index / audioDataRef.current.length) * width;
      const y = centerY + value * amplitudeScale;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  };

  const drawSpeechDetection = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    const centerY = height / 2;
    const threshold = 0.12;
    const thresholdY1 = centerY - threshold * height * 0.35;
    const thresholdY2 = centerY + threshold * height * 0.35;

    // Draw threshold lines (green dashed)
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    ctx.beginPath();
    ctx.moveTo(0, thresholdY1);
    ctx.lineTo(width, thresholdY1);
    ctx.moveTo(0, thresholdY2);
    ctx.lineTo(width, thresholdY2);
    ctx.stroke();

    ctx.setLineDash([]);

    // ✅ REMOVED: Green outline and background overlay when speaking
    // Now only the waveform itself turns green
  };

  const getStatusText = () => {
    if (disabled) return "Voice detection disabled";
    if (!isRecording) return "Not recording          ";
    if (avatarSpeaking) return "AI speaking           ";
    if (isDetectingSpeech) return "Speech detected       ";
    return "Listening for speech  ";
  };

  const getStatusColor = () => {
    if (disabled) return "#ef4444";
    if (!isRecording) return "#6b7280";
    if (avatarSpeaking) return "#3b82f6";
    if (isDetectingSpeech) return "#22c55e";
    return "#f59e0b";
  };

  return (
    <div
      ref={containerRef}
      className={`voice-indicator ${className}`}
      style={{
        width: "100%", // Take full width of container
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        padding: "12px",
        background: "transparent",
        borderRadius: "12px",
        backdropFilter: "blur(16px)",
        marginTop: "-20px",
      }}
    >
      {/* Waveform Canvas - Full Width */}
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          borderRadius: "8px",
          display: "block",
          width: "100%", // Make canvas take full width
          height: "40px", // Fixed height
          maxWidth: "100%",
        }}
      />

      {/* Status Row */}
      <div
        style={{
          position: "fixed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "4px 12px",
          borderRadius: "8px",
          // ✅ FIXED: Proper background colors for light/dark mode
          backgroundColor: isLightMode
            ? "rgba(248, 250, 252, 0.95)"
            : "rgba(26, 26, 46, 0.95)",
          border: isLightMode
            ? "1px solid rgba(0, 0, 0, 0.1)"
            : "1px solid rgba(255, 255, 255, 0.1)",
          width: "fit-content",
          right: "10px",
          bottom: "-20px",
          zIndex: 1000,
        }}
      >
        {/* Status Dot */}
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: getStatusColor(),
            boxShadow: `0 0 12px ${getStatusColor()}`,
            animation: isDetectingSpeech ? "pulse 1.5s infinite" : "none",
          }}
        />

        {/* Status Text */}
        <span
          style={{
            fontSize: "12px",
            fontWeight: "500",
            // ✅ FIXED: Text colors for light/dark mode
            color: isLightMode
              ? getStatusColor() === "#6b7280"
                ? "#374151"
                : getStatusColor()
              : getStatusColor(),
            fontFamily: "system-ui, -apple-system, sans-serif",
            textShadow: isLightMode ? "none" : "0 1px 2px rgba(0, 0, 0, 0.5)",
            whiteSpace: "nowrap",
          }}
        >
          {getStatusText()}
        </span>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.4);
          }
        }
      `}</style>
    </div>
  );
};

export default VoiceActivityIndicator;
