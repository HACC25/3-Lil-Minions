"use client";

import React from "react";
import { InterviewSidebar } from "./InterviewSidebar";
import { bgUrl } from "@/utils/styles";

interface InterviewEndLayoutProps {
  children: React.ReactNode;
  interviewId: string;
  activeSection: "transcript" | "analysis" | "summary" | "insights";
  onSectionChange: (
    section: "transcript" | "analysis" | "summary" | "insights",
  ) => void;
  isAnalyzing?: boolean;
  analysisError?: string | null;
  applicantName?: string;
}

export const InterviewEndLayout: React.FC<InterviewEndLayoutProps> = ({
  children,
  interviewId,
  activeSection,
  onSectionChange,
  isAnalyzing = false,
  analysisError = null,
  applicantName,
}) => {
  return (
    <div className="relative min-h-screen">
      {/* Background Image with Overlay */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: ` url(${bgUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          zIndex: 0,
          filter: "blur(1px)",
        }}
      />

      <div className="relative flex h-screen" style={{ zIndex: 10 }}>
        {/* Sidebar - Always visible but collapsible */}
        <InterviewSidebar
          interviewId={interviewId}
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          isAnalyzing={isAnalyzing}
          analysisError={analysisError}
          applicantName={applicantName}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto relative">
          {/* Header with Applicant Name */}

          <div className="h-full">{children}</div>
        </main>
      </div>
    </div>
  );
};
