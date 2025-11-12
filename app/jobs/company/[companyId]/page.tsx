"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { useCompanyData } from "@/hooks/useCompanyData";
import ResumeUploadGate from "@/components/apply/resumeUploadGate";
import MatchedJobCard from "@/components/apply/matchedJobCard";
import { ApplyLayout } from "@/components/apply/ApplyLayout";
import type { JobMatchResult } from "@/utils/matching/types";
import { cn, bgUrl } from "@/utils/styles";
import {
  saveResumeToStorage,
  saveMatchesToStorage,
  getResumeFromStorage,
  getMatchesFromStorage,
  clearStoredData,
  type ResumeMetadata,
} from "@/utils/resumeStorage";
import { BgOverlay } from "@/components/dashboard/DashboardLayout";

export default function CompanyJobsPage() {
  const params = useParams();
  const companyId = params.companyId as string;

  const { jobs, loading: jobsLoading } = useJobs({
    companyId,
    status: "active",
  });
  const { company, loading: companyLoading } = useCompanyData(companyId);

  const [showUploadGate, setShowUploadGate] = useState(false);
  const [matchedJobs, setMatchedJobs] = useState<JobMatchResult[]>([]);
  const [_userInterests, setUserInterests] = useState<string[]>([]);
  const [_sessionId, setSessionId] = useState<string | null>(null);
  const [_matchingStats, setMatchingStats] = useState<{
    totalJobsAnalyzed: number;
    processingTime: number;
    method: string;
  } | null>(null);
  const [resumeMetadata, setResumeMetadata] = useState<ResumeMetadata | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"all" | "matched">("all"); // Toggle between all jobs and matched jobs
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumePreviewUrl, setResumePreviewUrl] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const loading = jobsLoading || companyLoading;

  // Extract unique departments from jobs (using department as filter instead of category)
  const departments = Array.from(
    new Set(
      jobs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((job) => (job as any).department)
        .filter((dept): dept is string => Boolean(dept)),
    ),
  ).sort();

  // Load cached data on mount
  useEffect(() => {
    const { metadata } = getResumeFromStorage();
    const cachedMatches = getMatchesFromStorage(companyId);

    if (metadata) {
      setResumeMetadata(metadata);
    }

    if (cachedMatches) {
      setMatchedJobs(cachedMatches.matches);
      setUserInterests(cachedMatches.interests);
      setSessionId(cachedMatches.sessionId);
      setMatchingStats(cachedMatches.stats || null);
      // If they have matches, show matched view by default
      setViewMode("matched");
    }
  }, [companyId]);

  // Fetch company logo
  useEffect(() => {
    const fetchCompanyLogo = async () => {
      if (!companyId) return;

      try {
        const response = await fetch(`/api/companies/${companyId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.logoUrl && typeof data.logoUrl === "string") {
            setLogoUrl(data.logoUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching company logo:", error);
        // Silently fail - logo is optional
        setLogoUrl(null);
      }
    };

    fetchCompanyLogo();
  }, [companyId]);

  const handleMatchingComplete = async (
    data: {
      success: boolean;
      matches?: JobMatchResult[];
      totalJobsAnalyzed?: number;
      processingTime?: number;
      method?: string;
    },
    completedSessionId: string,
    resumeFile?: File,
  ) => {
    console.log("🎯 Matching completed, session ID:", completedSessionId);
    setSessionId(completedSessionId);

    if (data.success && data.matches) {
      setMatchedJobs(data.matches);
      setMatchingStats({
        totalJobsAnalyzed: data.totalJobsAnalyzed || 0,
        processingTime: data.processingTime || 0,
        method: data.method || "unknown",
      });

      // Extract interests from first match
      const interests = Array.from(
        new Set(
          data.matches
            .map((m: JobMatchResult) => m.matchDetails?.interestAlignment)
            .filter(Boolean),
        ),
      ) as string[];
      setUserInterests(interests);

      // Save to localStorage
      saveMatchesToStorage({
        matches: data.matches,
        companyId,
        interests,
        sessionId: completedSessionId,
        matchedAt: new Date().toISOString(),
        stats: {
          totalJobsAnalyzed: data.totalJobsAnalyzed || 0,
          processingTime: data.processingTime || 0,
          method: data.method || "unknown",
        },
      });

      // Save resume if provided
      if (resumeFile) {
        saveResumeToStorage(resumeFile);
        setResumeMetadata({
          fileName: resumeFile.name,
          fileSize: resumeFile.size,
          fileType: resumeFile.type,
          uploadedAt: new Date().toISOString(),
        });
      }

      setShowUploadGate(false);
      setViewMode("matched");
      setSidebarOpen(true);
    }
  };

  const handleResumeDelete = () => {
    if (
      confirm(
        "Are you sure you want to delete your resume? This will also clear your matches.",
      )
    ) {
      clearStoredData();
      setResumeMetadata(null);
      setShowUploadGate(false);
      setMatchedJobs([]);
      setUserInterests([]);
      setSessionId(null);
      setMatchingStats(null);
      setViewMode("all");
    }
  };

  const handleViewResume = () => {
    const { file } = getResumeFromStorage();
    if (file) {
      const url = URL.createObjectURL(file);
      setResumePreviewUrl(url);
      setShowResumeModal(true);
    }
  };

  const handleCloseResumeModal = () => {
    if (resumePreviewUrl) {
      URL.revokeObjectURL(resumePreviewUrl);
      setResumePreviewUrl(null);
    }
    setShowResumeModal(false);
  };

  const handleViewModeChange = (mode: "all" | "matched") => {
    setViewMode(mode);
    setShowUploadGate(false);
  };

  const handleFindMatches = () => {
    setShowUploadGate(true);
  };

  if (loading) {
    return (
      <LoadingCard desc="Please wait while we fetch the company information" />
    );
  }

  // Show message if no jobs available
  if (jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {company?.companyName || "Company"}
              </h1>
              <p className="text-lg text-gray-600">No positions available</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No jobs available
            </h3>
            <p className="text-gray-500">
              {company?.companyName || "This company"} has no open positions at
              this time
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show upload gate as overlay when requested
  if (showUploadGate) {
    return (
      <ApplyLayout
        resumeMetadata={resumeMetadata}
        onResumeDelete={handleResumeDelete}
        onViewResume={handleViewResume}
        showResumePreview={showResumeModal}
        resumePreviewUrl={resumePreviewUrl}
        onClosePreview={handleCloseResumeModal}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={setSidebarOpen}
        onFindMatches={handleFindMatches}
        hasMatches={matchedJobs.length > 0}
      >
        <ResumeUploadGate
          companyName={company?.companyName || "This Company"}
          companyId={companyId}
          onComplete={handleMatchingComplete}
        />
      </ApplyLayout>
    );
  }

  // Determine which jobs to display
  const displayedJobs =
    viewMode === "matched" && matchedJobs.length > 0
      ? matchedJobs
          .filter((match) => match.job.status === "active")
          .slice(0, 10)
      : jobs
          .filter((job) => {
            // Apply search filter when viewing all jobs
            if (viewMode === "all" && searchQuery.trim()) {
              const matchesSearch = job.title
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
              if (!matchesSearch) return false;
            }
            // Apply department filter when viewing all jobs
            if (viewMode === "all" && selectedDepartment !== "all") {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return (job as any).department === selectedDepartment;
            }
            return true;
          })
          .map((job) => ({
            job,
            matchScore: 0,
            recommendation: "poor-match" as const,
            reasoning: "Not yet matched",
            matchDetails: {
              titleMatch: 0,
              interestAlignment: "No interests selected",
              confidence: "low" as const,
            },
          }));

  // Show matched jobs or all jobs
  return (
    <ApplyLayout
      resumeMetadata={resumeMetadata}
      onResumeDelete={handleResumeDelete}
      onViewResume={handleViewResume}
      showResumePreview={showResumeModal}
      resumePreviewUrl={resumePreviewUrl}
      onClosePreview={handleCloseResumeModal}
      sidebarOpen={sidebarOpen}
      onToggleSidebar={setSidebarOpen}
      onFindMatches={handleFindMatches}
      hasMatches={matchedJobs.length > 0}
    >
      {/* Header */}
      <div className="px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            {logoUrl && (
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
                <img
                  src={logoUrl}
                  alt="Company Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    setLogoUrl(null);
                  }}
                />
              </div>
            )}
            <h1 className="text-3xl font-bold text-black">
              {company?.companyName || ""} Careers
            </h1>
          </div>
          <p className="text-black">
            {viewMode === "matched"
              ? `Showing ${matchedJobs.filter((match) => match.job.status === "active").length} personalized ${matchedJobs.filter((match) => match.job.status === "active").length === 1 ? "match" : "matches"}`
              : `Browse ${jobs.length} available ${jobs.length === 1 ? "position" : "positions"}`}
          </p>
        </div>
      </div>

      {/* View Toggle Bar and Search/Filters */}
      <div className="px-8 pb-4">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Toggle Bar - Only show if resume uploaded */}
          {resumeMetadata && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleViewModeChange("matched")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                  viewMode === "matched"
                    ? "bg-white/20 backdrop-blur-md text-black shadow-lg border border-white/30"
                    : "bg-white/10 hover:bg-white/15 text-black/80 border border-white/20",
                )}
                disabled={matchedJobs.length === 0}
              >
                Matched Jobs (
                {
                  matchedJobs.filter((match) => match.job.status === "active")
                    .length
                }
                )
              </button>
              <button
                onClick={() => handleViewModeChange("all")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                  viewMode === "all"
                    ? "bg-white/20 backdrop-blur-md text-black shadow-lg border border-white/30"
                    : "bg-white/10 hover:bg-white/15 text-black/80 border border-white/20",
                )}
              >
                All Jobs ({jobs.length})
              </button>
            </div>
          )}

          {/* Search Bar and Category Filters - Show when no resume OR when viewing all jobs */}
          {(!resumeMetadata || viewMode === "all") && (
            <>
              {/* Search Bar and Department Filter */}
              <div className="flex gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black z-10  w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search jobs by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/50 backdrop-blur-md border border-white/30 text-black placeholder-black/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:text-white transition-colors text-xl"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Department Filter Dropdown */}
                {departments.length > 0 && (
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="px-4 py-3 rounded-lg bg-white/50 backdrop-blur-md border border-white/30 text-black focus:outline-none focus:ring-2 focus:ring-white/50 transition-all appearance-none cursor-pointer min-w-[200px]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 1rem center",
                    }}
                  >
                    <option value="all" className="bg-gray-800 text-white">
                      All Departments
                    </option>
                    {departments.map((department) => (
                      <option
                        key={department}
                        value={department}
                        className="bg-gray-800 text-white"
                      >
                        {department}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Jobs List */}
      <div className="px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {displayedJobs.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-lg font-semibold text-white mb-2">
                No Jobs Found
              </h3>
              <p className="text-white/80 mb-6">
                {viewMode === "matched"
                  ? "Upload your resume to find personalized matches."
                  : "No jobs are currently available."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedJobs.map((match) => (
                <MatchedJobCard
                  key={match.job.id}
                  match={match}
                  showMatchScore={viewMode === "matched"}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ApplyLayout>
  );
}

export function LoadingCard({ desc }: { desc: string }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${bgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <BgOverlay />
      <div className="text-center bg-white/20 backdrop-blur-md border border-white/30 rounded-xl p-8 shadow-xl">
        <div className="inline-block relative">
          <Loader2 className="w-16 h-16 text-white animate-spin" />
        </div>
        <p className="text-white mt-4 font-medium">Loading...</p>
        <p className="text-white/80 text-sm mt-1">{desc}</p>
      </div>
    </div>
  );
}
