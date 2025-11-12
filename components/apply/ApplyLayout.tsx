"use client";

import React, { useState } from "react";
import { ResumeSidebar } from "./ResumeSidebar";
import type { ResumeMetadata } from "@/utils/resumeStorage";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { bgUrl } from "@/utils/styles";

interface ApplyLayoutProps {
  children: React.ReactNode;
  resumeMetadata: ResumeMetadata | null;
  onResumeDelete: () => void;
  onViewResume: () => void;
  showResumePreview?: boolean;
  resumePreviewUrl?: string | null;
  onClosePreview?: () => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: (open: boolean) => void;
  onFindMatches?: () => void;
  hasMatches?: boolean;
}

export const ApplyLayout: React.FC<ApplyLayoutProps> = ({
  children,
  resumeMetadata,
  onResumeDelete,
  onViewResume,
  showResumePreview = false,
  resumePreviewUrl = null,
  onClosePreview,
  sidebarOpen: externalSidebarOpen,
  onToggleSidebar: externalOnToggleSidebar,
  onFindMatches,
  hasMatches = false,
}: ApplyLayoutProps) => {
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(true);

  // Use external sidebar state if provided, otherwise use internal
  const sidebarOpen = externalSidebarOpen ?? internalSidebarOpen;
  const setSidebarOpen = (open: boolean) => {
    if (externalOnToggleSidebar) {
      externalOnToggleSidebar(open);
    } else {
      setInternalSidebarOpen(open);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Image with Overlay */}
      <motion.div
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
        {/* Sidebar - Always rendered, changes width */}
        <ResumeSidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          resumeMetadata={resumeMetadata}
          onResumeDelete={onResumeDelete}
          onViewResume={onViewResume}
          onFindMatches={onFindMatches}
          hasMatches={hasMatches}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto relative">
          {/* Resume Preview Overlay - Covers the entire main content */}
          {showResumePreview && resumePreviewUrl ? (
            <div className="absolute inset-0 bg-white z-10 flex flex-col">
              {/* Preview Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                <h2 className="text-lg font-semibold text-gray-900"></h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClosePreview}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Close Preview"
                  >
                    <X size={20} className="text-gray-600" />
                  </button>
                </div>
              </div>
              {/* Preview Content */}
              <div className="flex-1 overflow-hidden bg-gray-100">
                <iframe
                  src={resumePreviewUrl}
                  className="w-full h-full"
                  title="Resume Preview"
                />
              </div>
            </div>
          ) : (
            <div className="h-full">{children}</div>
          )}
        </main>
      </div>
    </div>
  );
};
