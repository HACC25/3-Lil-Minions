"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/utils/styles";
import { frostedGlassBg } from "@/utils/styles";
import { DashboardLayout } from "@/components/dashboard";
import InterviewBotForm from "@/components/interview-bots/InterviewBotForm";
import Link from "next/link";
import { logger } from "@/lib/logger";
import { useJob } from "@/hooks/useJob";

interface InterviewBot {
  id: string;
  botName: string;
  description: string;
  interviewType: string;
  companyDescription: string;
  companyIndustry: string;
  jobRoleDescription: string;
  salary: string;
  botPersonality: string;
  selectedAvatar: string;
  selectedEmotion: string;
  questions: {
    technical: Array<{ id: string; question: string; type: string }>;
    general: Array<{ id: string; question: string; type: string }>;
    behavioral: Array<{ id: string; question: string; type: string }>;
    preQualification: Array<{ id: string; question: string; type: string }>;
  };
  scoringCriteria: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  avatarConfig?: {
    avatarName?: string;
    voice?: {
      emotion?: string;
      rate?: number;
    };
    quality?: string;
    language?: string;
    [key: string]: unknown;
  };
  agent_id?: string;
}

function LoadingCard({ desc }: { desc: string }) {
  return (
    <DashboardLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div
          className={cn(
            frostedGlassBg,
            "text-center border border-white/20 rounded-2xl p-8 shadow-2xl",
          )}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold">{desc}</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function EditInterviewBotPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;

  const { job, loading: fetchingJob, error: jobError } = useJob(jobId);
  const [interviewBot, setInterviewBot] = useState<InterviewBot | null>(null);
  const [extractedData, setExtractedData] =
    useState<Partial<InterviewBot> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [shouldExtract, setShouldExtract] = useState(false);

  const isEditMode = !!job?.interviewBotId;

  // Helper function to add version number to bot name
  const addVersionToBotName = (botName: string): string => {
    // Check if the name already has a version pattern like "(version X)"
    const versionPattern = /\(version (\d+)\)$/i;
    const match = botName.match(versionPattern);

    if (match) {
      // Increment existing version number
      const currentVersion = parseInt(match[1], 10);
      const newVersion = currentVersion + 1;
      return botName.replace(versionPattern, `(version ${newVersion})`);
    } else {
      // Add version 2 for first edit
      return `${botName} (version 2)`;
    }
  };

  // Set loading to false when job is loaded for create mode
  useEffect(() => {
    if (job && !job.interviewBotId) {
      setLoading(false);
    }
  }, [job]);

  // Extract interview data from job posting for CREATE mode
  useEffect(() => {
    const extractFromJobPosting = async () => {
      if (!job || job.interviewBotId || !shouldExtract) {
        return;
      }

      setIsExtracting(true);
      try {
        const response = await fetch("/api/extract-interview-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle: job.title,
            jobDescription: job.duties?.join("\n\n") || "",
            requirements: job.minimumQualifications?.education || "",
            responsibilities: job.minimumQualifications?.experience || "",
            companyDescription: job.department || "",
            companyIndustry: "Government",
            salary: `$${job.salaryRange?.min} - $${job.salaryRange?.max} ${job.salaryRange?.frequency}`,
            location: job.location,
            employmentType: job.employmentType,
            companyName: user?.displayName || "State of Hawaii",
            department: job.department,
            minimumQualifications: job.minimumQualifications?.education || "",
            duties: job.duties || [],
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to extract interview data");
        }

        const result = await response.json();
        setExtractedData(result.interviewBotData);
      } catch (err) {
        console.error("Error extracting interview data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to extract interview data",
        );
      } finally {
        setIsExtracting(false);
      }
    };

    if (shouldExtract) {
      extractFromJobPosting();
    }
  }, [job, user, shouldExtract]);

  // Fetch interview bot data for EDIT mode
  useEffect(() => {
    const fetchInterviewBot = async () => {
      if (!job?.interviewBotId) {
        return;
      }

      try {
        const response = await fetch(
          `/api/interview-bots/${job.interviewBotId}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch interview bot");
        }

        const data = await response.json();
        setInterviewBot(data);
      } catch (err) {
        console.error("Error fetching interview bot:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load interview bot",
        );
      } finally {
        setLoading(false);
      }
    };

    if (job && job.interviewBotId) {
      fetchInterviewBot();
    }
  }, [job]);

  if (fetchingJob || loading || isExtracting) {
    return (
      <LoadingCard
        desc={
          isExtracting
            ? "Extracting interview data from job posting..."
            : "Loading interview bot configuration..."
        }
      />
    );
  }

  if (jobError || error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div
            className={cn(
              frostedGlassBg,
              "text-center border border-white/20 rounded-2xl p-8 shadow-2xl",
            )}
          >
            <p className="text-red-700 font-semibold mb-4">
              {jobError || error}
            </p>
            <Link
              href="/dashboard/companies/jobs"
              className="inline-flex items-center gap-2 text-cyan-700 font-semibold hover:text-cyan-900 hover:underline transition-colors"
            >
              Back to Jobs
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div
            className={cn(
              frostedGlassBg,
              "text-center border border-white/20 rounded-2xl p-8 shadow-2xl",
            )}
          >
            <p className="text-gray-700 font-semibold mb-4">Job not found</p>
            <Link
              href="/dashboard/companies/jobs"
              className="inline-flex items-center gap-2 text-cyan-700 font-semibold hover:text-cyan-900 hover:underline transition-colors"
            >
              Back to Jobs
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1000px] mx-auto">
          <div
            className={cn(
              frostedGlassBg,
              "border border-white/20 shadow-2xl rounded-2xl overflow-hidden",
            )}
          >
            {/* Header */}
            <div className="px-6 py-8 bg-gradient-to-br from-white/40 to-white/20">
              <Link
                href="/dashboard/companies/jobs"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-cyan-700 transition-colors mb-4 group"
              >
                <svg
                  className="h-4 w-4 group-hover:-translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Jobs
              </Link>
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">
                    {isEditMode
                      ? "Edit Second Round Interview"
                      : "Create Second Round Interview"}
                  </h1>
                  <p className="text-gray-700">{job?.title}</p>
                </div>
              </div>
            </div>

            {/* Interview Bot Form */}
            <div className="p-6">
              {/* Confirmation UI for Create Mode */}
              {!isEditMode && !extractedData && !isExtracting && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <p className="text-base text-gray-700 max-w-2xl mx-auto leading-relaxed">
                      This job posting is currently using our General
                      Interviewer bot with standard questions. Are you sure you
                      want to create a custom interview bot specifically for
                      this position?
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {/* Keep General Option */}
                    <div
                      onClick={() => router.push("/dashboard/companies/jobs")}
                      className="cursor-pointer group relative bg-white/50 backdrop-blur-sm border-2 border-white/60 rounded-xl p-6 hover:border-cyan-500 hover:bg-white/70 transition-all hover:shadow-xl"
                    >
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg
                            className="w-7 h-7 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 mb-2">
                            Keep General Interviewer
                          </h4>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            Continue using the standard interview bot. No
                            changes will be made to your current setup.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Create Custom Option */}
                    <div
                      onClick={() => setShouldExtract(true)}
                      className="cursor-pointer group relative bg-white/50 backdrop-blur-sm border-2 border-white/60 rounded-xl p-6 hover:border-purple-500 hover:bg-white/70 transition-all hover:shadow-xl"
                    >
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg
                            className="w-7 h-7 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 mb-2">
                            Create Custom Bot
                          </h4>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            Create a tailored interview bot with
                            position-specific questions and requirements.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Interview Bot Form - Only show after confirmation or in edit mode */}
              {user?.uid && (isEditMode ? interviewBot : extractedData) && (
                <InterviewBotForm
                  key={isEditMode ? interviewBot?.id : "new-bot"}
                  isLightMode={false}
                  companyId={user.uid}
                  companyName={user.displayName || "State of Hawaii"}
                  jobId={jobId}
                  existingBotId={isEditMode ? interviewBot?.id : undefined}
                  prefilledData={
                    isEditMode && interviewBot
                      ? {
                          botName: addVersionToBotName(interviewBot.botName),
                          description: interviewBot.description,
                          interviewType: interviewBot.interviewType,
                          companyDescription: interviewBot.companyDescription,
                          companyIndustry: interviewBot.companyIndustry,
                          jobRoleDescription: interviewBot.jobRoleDescription,
                          salary: interviewBot.salary,
                          botPersonality: interviewBot.botPersonality,
                          selectedAvatar:
                            interviewBot.selectedAvatar ||
                            interviewBot.avatarConfig?.avatarName ||
                            "",
                          selectedEmotion:
                            interviewBot.selectedEmotion ||
                            interviewBot.avatarConfig?.voice?.emotion ||
                            "",
                          questions: interviewBot.questions,
                          scoringCriteria: interviewBot.scoringCriteria,
                          metadata: {
                            originalBotId: interviewBot.id,
                            originalAgentId: interviewBot.agent_id,
                            isEdit: true,
                          },
                        }
                      : extractedData
                  }
                  onSuccess={(botId: string) => {
                    logger.success(
                      `Interview bot ${isEditMode ? "updated" : "created"}:`,
                      botId,
                    );
                    router.push("/dashboard/companies/jobs");
                  }}
                  onCancel={() => {
                    router.push("/dashboard/companies/jobs");
                  }}
                  embedded={true}
                  hideHeader={true}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
