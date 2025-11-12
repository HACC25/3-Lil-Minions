import React from "react";
import { Play, Pause } from "lucide-react";

interface AudioVisualizerProps {
  isPlaying: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  onToggle,
  disabled = false,
  size = "md",
  className = "",
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      buttonSize: 24,
      iconSize: 12,
      barWidth: 2,
      barGap: 1,
      containerHeight: 20,
      barCount: 18,
    },
    md: {
      buttonSize: 32,
      iconSize: 16,
      barWidth: 3,
      barGap: 2,
      containerHeight: 24,
      barCount: 24,
    },
    lg: {
      buttonSize: 40,
      iconSize: 20,
      barWidth: 4,
      barGap: 3,
      containerHeight: 28,
      barCount: 30,
    },
  };

  const config = sizeConfig[size];

  // Generate random bar heights for visualizer
  const generateBarHeights = () => {
    return Array.from({ length: config.barCount }, (_, i) => {
      const baseHeight = Math.random() * 0.8 + 0.2; // 0.2 to 1.0
      const variation = Math.sin(i * 0.5) * 0.3; // Add some wave pattern
      return Math.max(0.1, baseHeight + variation);
    });
  };

  const barHeights = generateBarHeights();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
      className={className}
    >
      {/* Play/Pause Button */}
      <button
        onClick={onToggle}
        disabled={disabled}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: config.buttonSize,
          height: config.buttonSize,
          borderRadius: "50%",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          transition: "all 0.2s ease-out",
          background: isPlaying
            ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
            : "linear-gradient(135deg, #6b7280, #4b5563)",
          boxShadow: isPlaying
            ? "0 4px 12px rgba(59, 130, 246, 0.25)"
            : "0 2px 4px rgba(0, 0, 0, 0.1)",
          transform: "scale(1)",
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = "scale(1.05)";
            if (!isPlaying) {
              e.currentTarget.style.background =
                "linear-gradient(135deg, #9ca3af, #6b7280)";
            }
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = "scale(1)";
            if (!isPlaying) {
              e.currentTarget.style.background =
                "linear-gradient(135deg, #6b7280, #4b5563)";
            }
          }
        }}
        title={isPlaying ? "Pause preview" : "Play preview"}
      >
        {/* Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isPlaying ? (
            <Pause
              size={config.iconSize}
              style={{ color: "white", fill: "white" }}
            />
          ) : (
            <Play
              size={config.iconSize}
              style={{ color: "white", fill: "white", marginLeft: "2px" }}
            />
          )}
        </div>

        {/* Ripple effect when playing */}
        {isPlaying && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              animation: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
            }}
          />
        )}
      </button>

      {/* Audio Visualizer */}
      <div
        style={{
          display: "flex",
          alignItems: "end",
          gap: "2px",
          height: config.containerHeight,
        }}
      >
        {barHeights.map((height, index) => (
          <div
            key={index}
            style={{
              width: config.barWidth,
              height: isPlaying
                ? `${height * config.containerHeight}px`
                : `${config.containerHeight * 0.2}px`,
              borderRadius: "2px",
              background: isPlaying
                ? "linear-gradient(to top, #3b82f6, #8b5cf6)"
                : "#9ca3af",
              transition: "all 0.15s ease-out",
              animationDelay: isPlaying ? `${index * 0.05}s` : "0s",
              animation: isPlaying
                ? "audioWave 0.6s ease-in-out infinite alternate"
                : "none",
            }}
          />
        ))}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes audioWave {
          0% {
            transform: scaleY(0.3);
            opacity: 0.7;
          }
          100% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
        @keyframes ping {
          75%,
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default AudioVisualizer;
