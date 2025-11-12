"use client";

import React, { useState, useEffect } from "react";
import { SummaryDisplay } from "./SummaryDisplay";
import { cn } from "@/utils/styles";
import { frostedGlassBg } from "@/utils/styles";

interface SummarySectionProps {
  interviewId: string;
}

export const SummarySection: React.FC<SummarySectionProps> = ({
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
          Interview Summary
        </h1>
        <p className="text-black">
          Key highlights and overview of the interview session
        </p>
      </div>

      <div className={cn(frostedGlassBg, "rounded-2xl p-6 bg-white/50")}>
        <SummaryDisplay interviewId={interviewId} />
      </div>
    </div>
  );
};
