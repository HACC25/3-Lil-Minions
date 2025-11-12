"use client";

import React, { useState, useEffect } from "react";
import { BehavioralDisplay } from "./BehavioralDisplay";
import { cn } from "@/utils/styles";
import { frostedGlassBg } from "@/utils/styles";

interface InsightsSectionProps {
  interviewId: string;
}

export const InsightsSection: React.FC<InsightsSectionProps> = ({
  interviewId,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="p-8 space-y-6"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.5s ease",
      }}
    >
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">
          Behavioral Fit Analysis
        </h1>
        <p className="text-black">
          Personality traits and behavioral insights from the interview
        </p>
      </div>

      <div className={cn(frostedGlassBg, "rounded-2xl p-6 bg-white/50")}>
        <BehavioralDisplay interviewId={interviewId} />
      </div>
    </div>
  );
};
