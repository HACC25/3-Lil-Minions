"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  FileText,
  ClipboardList,
  BarChart3,
  Brain,
} from "lucide-react";
import { Tooltip } from "@nextui-org/react";
import { cn } from "@/utils/styles";
import { frostedGlassBg } from "@/utils/styles";

// Interview sidebar for navigating between different sections
interface InterviewSidebarProps {
  interviewId: string;
  activeSection: "transcript" | "analysis" | "summary" | "insights";
  onSectionChange: (
    section: "transcript" | "analysis" | "summary" | "insights",
  ) => void;
  isAnalyzing?: boolean;
  analysisError?: string | null;
  applicantName?: string;
}

const InterviewSidebar: React.FC<InterviewSidebarProps> = ({
  interviewId: _interviewId,
  activeSection,
  onSectionChange,
  isAnalyzing = false,
  analysisError = null,
  applicantName,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [toggleHovered, setToggleHovered] = useState(false);

  const sections = [
    {
      id: "transcript" as const,
      label: "Transcript",
      icon: FileText,
    },
    {
      id: "analysis" as const,
      label: "Requirements",
      icon: ClipboardList,
    },
    {
      id: "summary" as const,
      label: "Summary",
      icon: BarChart3,
    },
    {
      id: "insights" as const,
      label: "Behavioral Fit",
      icon: Brain,
    },
  ];

  return (
    <div
      className={cn(
        frostedGlassBg,
        "rounded-2xl ml-3 my-3 mb-3 h-fit transition-all duration-300 ease-in-out flex-shrink-0 relative hover:scale-100",
      )}
      style={{
        width: isOpen ? "280px" : "60px",
        // height: "calc(100vh - 1.5rem)",
      }}
    >
      <div className="w-full h-full flex flex-col">
        {/* Header with Toggle */}
        <div
          className={`flex items-center ${
            isOpen ? "justify-between px-4" : "justify-center px-2"
          } h-[60px]`}
        >
          {isOpen && (
            <div className="text-sm  items-start justify-start flex size-full flex-col text-wrap text-black ">
              <p className="font-bold mb-0">Interview Results</p>
              <p className="font-light">Applicant: {applicantName}</p>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            onMouseEnter={() => setToggleHovered(true)}
            onMouseLeave={() => setToggleHovered(false)}
            className="p-2 rounded-lg text-black hover:bg-black/10 transition-colors"
          >
            {isOpen ? (
              <ChevronLeft size={20} />
            ) : toggleHovered ? (
              <ChevronRight size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>
        </div>

        {/* Status Indicators - Only show when open */}
        {isOpen && (isAnalyzing || analysisError) && (
          <div className="px-4 py-3 border-b border-white/20">
            {isAnalyzing && (
              <div className="flex items-center gap-2">
                <div
                  className="spinner-border spinner-border-sm"
                  role="status"
                  style={{
                    color: "#000000",
                    width: "0.875rem",
                    height: "0.875rem",
                  }}
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
                <span className="text-black text-xs">Analyzing...</span>
              </div>
            )}

            {analysisError && (
              <div className="mt-2">
                <p className="text-red-600 text-xs">{analysisError}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="flex-1 px-2  overflow-auto">
          <div className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              const isDisabled = isAnalyzing;

              if (!isOpen) {
                return (
                  <Tooltip
                    key={section.id}
                    className="px-3 rounded-full ml-3 bg-white shadow-sm"
                    classNames={{
                      content: "text-black",
                    }}
                    content={
                      isDisabled ? "Analysis in progress..." : section.label
                    }
                    placement="right"
                  >
                    <button
                      onClick={() => !isDisabled && onSectionChange(section.id)}
                      disabled={isDisabled}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                        ${
                          isDisabled
                            ? "opacity-40 cursor-not-allowed"
                            : isActive
                              ? "bg-black/5 text-black font-medium"
                              : "text-black hover:bg-black/5"
                        }
                        justify-center
                      `}
                    >
                      <span className="flex-shrink-0">
                        <Icon size={20} />
                      </span>
                    </button>
                  </Tooltip>
                );
              }

              return (
                <button
                  key={section.id}
                  onClick={() => !isDisabled && onSectionChange(section.id)}
                  disabled={isDisabled}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                    ${
                      isDisabled
                        ? "opacity-40 cursor-not-allowed"
                        : isActive
                          ? "bg-black/5 text-black font-medium"
                          : "text-black hover:bg-black/5"
                    }
                  `}
                >
                  <span className="flex-shrink-0">
                    <Icon size={20} />
                  </span>
                  <span className="text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                    {section.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-gray-200">
          {isOpen ? (
            <div className="text-xs text-black text-center">Banana AI</div>
          ) : (
            <div className="text-xs text-black text-center">BAI</div>
          )}
        </div>
      </div>
    </div>
  );
};

export { InterviewSidebar };
export default InterviewSidebar;
