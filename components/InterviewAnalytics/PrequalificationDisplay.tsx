"use client";

import React, { useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

interface PrequalificationRequirement {
  requirement: string;
  description: string;
  met: boolean;
  evidence: string;
  confidence: "high" | "medium" | "low";
}

interface PrequalificationAnalysis {
  overallQualified: boolean;
  qualificationScore: number;
  requirementsMet: number;
  totalRequirements: number;
  requirements: PrequalificationRequirement[];
  recommendations: string[];
  timestamp: string;
}

interface PrequalificationDisplayProps {
  interviewId: string;
}

export function PrequalificationDisplay({
  interviewId,
}: PrequalificationDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PrequalificationAnalysis | null>(
    null,
  );

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/get-analysis?interviewId=${interviewId}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch analysis");
        }

        const data = await response.json();

        if (data.prequalificationAnalysis) {
          setAnalysis(data.prequalificationAnalysis);
        } else {
          setError("Analysis not yet available");
        }
      } catch (err) {
        console.error("Error fetching prequalification analysis:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load analysis",
        );
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) {
      fetchAnalysis();
    }
  }, [interviewId]);

  const getConfidenceColorClass = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case "high":
        return "bg-green-700";
      case "medium":
        return "bg-yellow-400";
      case "low":
        return "bg-red-400";
      default:
        return "bg-white/30";
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 75) return "bg-green-700";
    if (score >= 50) return "bg-yellow-400";
    return "bg-red-400";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
          <p className="text-black/65">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex items-center justify-center p-5">
        <div className="text-center">
          <FaExclamationTriangle className="mb-3 text-red-400" size={32} />
          <p className="text-red-300 font-medium">
            {error || "No analysis available"}
          </p>
          <p className="text-black/65 text-sm mt-2">
            Analysis may still be processing. Please refresh in a moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-black">
      {/* Overall Score Header */}
      <div className="bg-white/30 border border-white/20 rounded-xl p-6 mb-6">
        <h4 className="mb-3">
          {analysis.overallQualified ? (
            <span className="text-green-700">✓ Qualified</span>
          ) : (
            <span className="text-red-700">✗ Not Qualified</span>
          )}
        </h4>
        <p className="text-black/85 text-[0.95rem] mb-2">
          <strong>{analysis.requirementsMet}</strong> of{" "}
          <strong>{analysis.totalRequirements}</strong> requirements met
        </p>
        <div className="w-full h-2 bg-white/10 rounded overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getScoreColorClass(analysis.qualificationScore)}`}
            style={{
              width: `${(analysis.requirementsMet / analysis.totalRequirements) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Requirements List */}
      <h5 className="mb-3">Requirements Assessment</h5>
      {analysis.requirements.length === 0 ? (
        <div className="bg-white/10 border border-white/20 rounded-xl p-8 text-center">
          <FaExclamationTriangle
            size={32}
            color="#93c5fd"
            className="mb-3 mx-auto"
          />
          <p className="text-black/95 mb-0">
            No specific pre-qualification requirements were discussed in this
            interview.
          </p>
          <p className="text-black/65 text-sm mt-2">
            The interviewer did not ask about specific technical skills,
            experience, or qualifications.
          </p>
        </div>
      ) : (
        analysis.requirements.map((req, index) => (
          <div
            key={index}
            className={`rounded-xl p-4 mb-4 ${
              req.met
                ? "bg-green-700 border border-green-300/30"
                : "bg-red-400/10 border border-red-400/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 pt-1">
                {req.met ? (
                  <FaCheckCircle size={24} color="#86efac" />
                ) : (
                  <FaTimesCircle size={24} color="#f87171" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h6 className="mb-0">{req.requirement}</h6>
                  <span
                    className={`${getConfidenceColorClass(req.confidence)} text-black px-3 py-1 rounded-xl text-xs font-semibold uppercase`}
                  >
                    {req.confidence}
                  </span>
                </div>
                <p className="text-black/85 text-sm mb-3">{req.description}</p>
                {req.evidence && (
                  <div
                    className={`bg-white/5 p-3 rounded-lg ${
                      req.met
                        ? "border-l-[3px] border-l-green-300"
                        : "border-l-[3px] border-l-red-400"
                    }`}
                  >
                    <p className="text-black/95 text-[0.85rem] mb-0 italic">
                      "{req.evidence}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="mt-4">
          <h5 className="mb-3">Recommendations</h5>
          {analysis.recommendations.map((rec, index) => (
            <div
              key={index}
              className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4 mb-2"
            >
              <div className="flex items-start gap-2">
                <FaExclamationTriangle
                  size={16}
                  color="#fbbf24"
                  className="mt-1 shrink-0"
                />
                <p className="text-black/95 text-sm mb-0">{rec}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timestamp */}
      {analysis.timestamp && (
        <p className="text-black/65 text-xs mt-6 text-center">
          Analyzed on{" "}
          {new Date(analysis.timestamp).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      )}
    </div>
  );
}
