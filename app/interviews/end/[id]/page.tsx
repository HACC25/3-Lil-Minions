"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { InterviewEndLayout } from "@/components/InterviewAnalytics/InterviewEndLayout";
import { TranscriptSection } from "@/components/InterviewAnalytics/TranscriptSection";
import { AnalysisSection } from "@/components/InterviewAnalytics/AnalysisSection";
import { SummarySection } from "@/components/InterviewAnalytics/SummarySection";
import { InsightsSection } from "@/components/InterviewAnalytics/InsightsSection";
import TropicalScene from "@/components/home/TropicalScene";
import { bgUrl, frostedGlassBg } from "@/utils/styles";
import { cn } from "@/utils/styles";
import "bootstrap/dist/css/bootstrap.min.css";
export const InterviewEndPage: React.FC = () => {
  const params = useParams();
  const { id } = params as { id: string };
  const [activeSection, setActiveSection] = useState<
    "transcript" | "analysis" | "summary" | "insights"
  >("transcript");
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [applicantName, setApplicantName] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [transcriptNotFound, setTranscriptNotFound] = useState(false);

  useEffect(() => {
    // Fetch applicant name and check if analysis exists
    const initializePage = async () => {
      if (!id) return;

      try {
        setIsInitializing(true);
        setTranscriptNotFound(false);

        // Fetch the transcript to get applicant name
        const transcriptResponse = await fetch(
          `/api/get-transcript?interviewId=${id}`,
        );

        if (transcriptResponse.ok) {
          const transcriptData = await transcriptResponse.json();

          // Check if transcript is missing or empty
          if (
            !transcriptData.transcript ||
            transcriptData.transcript.trim() === ""
          ) {
            setTranscriptNotFound(true);
            setIsInitializing(false);
            return;
          }

          if (transcriptData.applicantName) {
            setApplicantName(transcriptData.applicantName);
          }

          // Check if analysis already exists
          const analysisResponse = await fetch(
            `/api/get-analysis?interviewId=${id}`,
          );

          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();

            // Only run analysis if it doesn't exist yet
            if (!analysisData.hasAnalysis) {
              console.log("Analysis not found, running analysis...");
              await runAnalysis(transcriptData.transcript);
            } else {
              console.log("Analysis already exists, skipping...");
            }
          } else {
            // If we can't fetch analysis data, try to run it anyway
            console.log("Could not fetch analysis, attempting to run...");
            await runAnalysis(transcriptData.transcript);
          }
        } else {
          // Transcript not found
          setTranscriptNotFound(true);
        }
      } catch (error) {
        console.error("Error initializing page:", error);
        setTranscriptNotFound(true);
      } finally {
        setIsInitializing(false);
      }
    };

    const runAnalysis = async (transcript: string) => {
      try {
        setAnalysisError(null);

        // Call the combined analysis endpoint with the transcript
        const response = await fetch("/api/analyze-interview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            interviewId: id,
            transcript: transcript,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to analyze interview");
        }

        const result = await response.json();
        console.log("Analysis completed:", result);

        // Trigger refetch of all sections by incrementing refreshKey
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        console.error("Error analyzing interview:", error);
        setAnalysisError(
          error instanceof Error
            ? error.message
            : "Failed to analyze interview",
        );
      }
    };

    initializePage();
  }, [id]);

  const handleSectionChange = (
    section: "transcript" | "analysis" | "summary" | "insights",
  ) => {
    setActiveSection(section);
  };

  return (
    <ProtectedRoute requiredRole="company" fallbackPath="/sign-in">
      {transcriptNotFound ? (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${bgUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "brightness(0.85) blur(2px)",
              zIndex: 0,
            }}
          />

          <div
            className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-blue-900/30"
            style={{ zIndex: 1 }}
          ></div>

          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
            className="hidden lg:block absolute inset-0 pointer-events-none"
            style={{ zIndex: 2 }}
          >
            <TropicalScene />
          </motion.div>

          <div
            className={cn(
              frostedGlassBg,
              "relative max-w-md w-full mx-4 text-center",
            )}
            style={{
              padding: "40px",
              zIndex: 10,
            }}
          >
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-black mb-3">
                Not Completed Yet
              </h2>
              <p className="text-black mb-6">
                The applicant has not completed this interview yet. Please check
                back later to view the transcript and analysis.
              </p>
              <div className="pt-4 border-t border-black/20">
                <p className="text-sm text-black">
                  Interview ID: <span className="font-mono">{id}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => window.history.back()}
              className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium"
            >
              Go Back
            </button>
          </div>
        </section>
      ) : (
        <InterviewEndLayout
          interviewId={id}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          isAnalyzing={false}
          analysisError={analysisError}
          applicantName={applicantName}
        >
          {/* Conditionally render only the active section */}
          {!isInitializing && (
            <>
              {activeSection === "transcript" && (
                <TranscriptSection
                  key={`transcript-${refreshKey}`}
                  interviewId={id}
                  applicantName={applicantName}
                />
              )}
              {activeSection === "analysis" && (
                <AnalysisSection
                  key={`analysis-${refreshKey}`}
                  interviewId={id}
                />
              )}
              {activeSection === "summary" && (
                <SummarySection
                  key={`summary-${refreshKey}`}
                  interviewId={id}
                />
              )}
              {activeSection === "insights" && (
                <InsightsSection
                  key={`insights-${refreshKey}`}
                  interviewId={id}
                />
              )}
            </>
          )}
        </InterviewEndLayout>
      )}
    </ProtectedRoute>
  );
};

export default InterviewEndPage;
