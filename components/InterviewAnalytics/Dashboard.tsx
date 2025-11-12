"use client";

import React, { useState } from "react";
import { TranscriptDisplay } from "./TranscriptDisplay";
import { PrequalificationDisplay } from "./PrequalificationDisplay";
import { SummaryDisplay } from "./SummaryDisplay";
import { BehavioralDisplay } from "./BehavioralDisplay";

interface DashboardProps {
  interviewId: string;
}

export function Dashboard({ interviewId }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<string>("transcript");

  const tabs = [
    {
      id: "transcript",
      label: "Transcript",
    },
    {
      id: "analysis",
      label: "Requirements",
    },
    {
      id: "summary",
      label: "Summary",
    },
    {
      id: "insights",
      label: "Behavioral Fit",
    },
  ];

  // Styles
  const containerStyle = {
    backgroundColor: "#040411",
    border: "1px solid #444",
    borderRadius: "1rem",
    color: "#fff",
    overflow: "hidden",
  };

  const tabBarStyle = {
    borderBottom: "1px solid #444",
    backgroundColor: "rgba(63, 81, 181, 0.05)",
    padding: "0.5rem 1rem",
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap" as const,
  };

  const getTabStyle = (isActive: boolean) => ({
    backgroundColor: isActive ? "#3F51B5" : "transparent",
    border: "none",
    borderRadius: "8px",
    padding: "0.75rem 1.5rem",
    color: isActive ? "#fff" : "#aaa",
    fontSize: "0.9rem",
    fontWeight: isActive ? "600" : "500",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
  });

  const contentStyle = {
    padding: "1.5rem",
    minHeight: "400px",
  };

  return (
    <div style={containerStyle}>
      {/* Tab Bar */}
      <div style={tabBarStyle}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={getTabStyle(activeTab === tab.id)}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.color = "#fff";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#aaa";
              }
            }}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={contentStyle}>
        {activeTab === "transcript" && (
          <TranscriptDisplay interviewId={interviewId} />
        )}

        {activeTab === "analysis" && (
          <PrequalificationDisplay interviewId={interviewId} />
        )}

        {activeTab === "summary" && (
          <SummaryDisplay interviewId={interviewId} />
        )}

        {activeTab === "insights" && (
          <BehavioralDisplay interviewId={interviewId} />
        )}
      </div>
    </div>
  );
}
