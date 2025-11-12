"use client";

import React, { useState, useEffect } from "react";
import { TranscriptDisplay } from "./TranscriptDisplay";
import { cn } from "@/utils/styles";
import { frostedGlassBg } from "@/utils/styles";

interface TranscriptSectionProps {
  interviewId: string;
  applicantName?: string;
}

export const TranscriptSection: React.FC<TranscriptSectionProps> = ({
  interviewId,
  applicantName,
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
          Interview Transcript {applicantName && `with ${applicantName}`}
        </h1>
        <p className="text-black">
          Complete conversation from your interview session
        </p>
      </div>

      <div className={cn(frostedGlassBg, "bg-white/65 rounded-2xl p-6")}>
        <TranscriptDisplay interviewId={interviewId} />
      </div>
    </div>
  );
};
