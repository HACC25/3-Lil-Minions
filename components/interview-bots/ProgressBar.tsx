// components/ProgressBar.tsx
import React from "react";
import { ColorScheme } from "./lib/types";

interface ProgressBarProps {
  completed: number;
  total: number;
  currentColors: ColorScheme;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ completed, total }) => {
  const progressBarStyle = {
    width: "100%",
    display: "flex",
    gap: "8px",
    marginBottom: "32px",
    padding: "16px",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(8px)",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.6)",
  };

  const progressStepStyle = (isActive: boolean, isCompleted: boolean) => ({
    flex: 1,
    height: "8px",
    borderRadius: "4px",
    backgroundColor: isCompleted ? "#10b981" : isActive ? "#06b6d4" : "#e5e7eb",
    transition: "all 0.3s ease",
  });

  return (
    <div style={progressBarStyle}>
      {[...Array(total)].map((_, index) => (
        <div
          key={index}
          style={progressStepStyle(index === completed, index < completed)}
        />
      ))}
    </div>
  );
};

export default ProgressBar;
