"use client";
import { Trash2, Eye, Sparkles, X, FileText } from "lucide-react";
import type { ResumeMetadata } from "@/utils/resumeStorage";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ResumeSidebarProps {
  resumeMetadata: ResumeMetadata | null;
  onResumeDelete: () => void;
  onViewResume: () => void;
  onToggleSidebar: () => void;
  onFindMatches?: () => void;
  hasMatches: boolean;
}

import { cn } from "@/utils/styles";
import React, { useState } from "react";
import { Tooltip } from "@nextui-org/react";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { frostedGlassBg } from "@/utils/styles";

interface SidebarProps {
  open?: boolean;
  onToggle?: () => void;
  resumeMetadata: ResumeMetadata | null;
  onResumeDelete: () => void;
  onViewResume: () => void;
  onFindMatches?: () => void;
  hasMatches: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

export const ResumeSidebar: React.FC<SidebarProps> = ({
  open: controlledOpen,
  onToggle,
  resumeMetadata,
  onResumeDelete,
  onFindMatches,
}) => {
  const [internalOpen, setInternalOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string>("");
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleToggle = onToggle || (() => setInternalOpen(!internalOpen));

  const [toggleHovered, setToggleHovered] = useState(false);

  // Handle opening modal and loading resume
  const handleViewResume = () => {
    const base64 = localStorage.getItem("user_resume");
    if (base64) {
      setResumeUrl(base64);
      setIsModalOpen(true);
    }
  };

  // Cleanup resume URL when modal closes
  React.useEffect(() => {
    if (!isModalOpen && resumeUrl) {
      setResumeUrl("");
    }
  }, [isModalOpen, resumeUrl]);

  return (
    <>
      <div
        className={cn(
          frostedGlassBg,
          "rounded-2xl ml-3 my-3 mb-3 transition-all duration-300 ease-in-out flex-shrink-0 relative hover:scale-100 h-fit",
        )}
        style={{
          width: isOpen ? "280px" : "60px",
        }}
      >
        <div className="w-full h-fit flex flex-col">
          {/* Header with Toggle */}
          <div
            className={`flex items-center ${
              isOpen ? "justify-between px-4" : "justify-center px-2"
            } h-[60px]`}
          >
            {isOpen && (
              <h2 className="text-xs font-semibold text-black uppercase tracking-wide">
                UPLOAD YOUR RESUME
              </h2>
            )}
            <button
              onClick={handleToggle}
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

          {/* Menu Items */}
          {/* <nav className="flex-1 px-2 py-4 overflow-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                {!isOpen ? (
                  <Tooltip
                    className="px-3 rounded-full ml-3 bg-white/30 shadow-sm"
                    content={item.label}
                    placement="right"
                  >
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                        ${
                          isActive(item.href)
                            ? "bg-black/5 text-black font-medium"
                            : "text-black hover:bg-black/5"
                        }
                        justify-center
                      `}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                    </Link>
                  </Tooltip>
                ) : (
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                      ${
                        isActive(item.href)
                          ? "bg-black/5 text-black font-medium"
                          : "text-zinc-700 hover:bg-black/5"
                      }
                    `}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                      {item.label}
                    </span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav> */}
          {/* <div className="my-5 ml-5 rounded-lg flex flex-col bg-white/10 backdrop-blur-md border-r border-white/20"> */}
          {/* Header */}

          {/* Content */}
          <div
            className={`flex-1 overflow-y-auto space-y-4 ${isOpen ? "p-4" : "p-2"}`}
          >
            {isOpen ? (
              resumeMetadata ? (
                <>
                  {/* Resume Info */}
                  <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-lg p-3 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-black truncate flex-1">
                        {resumeMetadata.fileName}
                      </p>
                      <div className="flex items-center gap-1 ml-2">
                        {resumeMetadata.fileType === "application/pdf" && (
                          <button
                            onClick={handleViewResume}
                            className="cursor-pointer p-1.5 hover:bg-white/20 rounded transition-colors"
                            title="View Resume"
                          >
                            <Eye size={16} className="text-black" />
                          </button>
                        )}
                        <button
                          onClick={onResumeDelete}
                          className="p-1.5 cursor-pointer hover:bg-red-500/20 rounded transition-colors"
                          title="Delete Resume"
                        >
                          <Trash2 size={16} className="text-red-700" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-black">
                      {formatFileSize(resumeMetadata.fileSize)} •{" "}
                      {formatDate(resumeMetadata.uploadedAt)}
                    </p>
                  </div>
                </>
              ) : (
                <button
                  onClick={onFindMatches}
                  className="w-full cursor-pointer text-center py-6 px-2 border border-white/30 rounded-lg transition-all duration-300 hover:bg-white/10"
                >
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center border border-white/30">
                      <Sparkles size={28} className="text-black" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-black mb-2">
                    Find Your Perfect Match
                  </h3>
                  <p className="text-xs text-black/70 leading-relaxed">
                    Upload your resume and let our AI discover roles that align
                    with your skills and experience
                  </p>
                </button>
              )
            ) : (
              <Tooltip
                classNames={{ content: "text-black" }}
                className="ml-4 rounded-full bg-white/60 backdrop-blur-md shadow-sm border border-white/30"
                content={resumeMetadata?.fileName || "Upload Resume"}
                placement="right"
              >
                <button
                  onClick={handleToggle}
                  className="w-full p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center justify-center"
                >
                  <FileText size={20} className="text-black" />
                </button>
              </Tooltip>
            )}
          </div>
          {/* </div> */}

          {/* Footer - Can add user profile or settings here later */}
          <div className="p-4 border-gray-200">
            {isOpen ? (
              <div className="text-xs text-black text-center">Banana AI</div>
            ) : (
              <div className="text-xs text-black text-center">BAI</div>
            )}
          </div>
        </div>
      </div>

      {/* Resume Modal - Rendered at root level */}
      {isModalOpen && resumeMetadata && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] m-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {resumeMetadata.fileName}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              <iframe
                src={resumeUrl}
                className="w-full h-[calc(90vh-120px)] border-0"
                title="Resume Preview"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
