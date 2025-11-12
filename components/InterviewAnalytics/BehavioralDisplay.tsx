"use client";

import React, { useEffect, useState } from "react";
import {
  FaExclamationTriangle,
  FaCheckCircle,
  FaStar,
  FaLightbulb,
} from "react-icons/fa";

interface BehavioralInsights {
  communicationStyle: {
    clarity: "excellent" | "good" | "fair" | "poor";
    professionalism: "excellent" | "good" | "fair" | "poor";
    enthusiasm: "high" | "moderate" | "low";
    articulation: string;
  };
  personality: {
    confidence: "high" | "moderate" | "low";
    adaptability: "high" | "moderate" | "low";
    creativity: "high" | "moderate" | "low";
    traits: string[];
  };
  engagement: {
    responsiveness: "excellent" | "good" | "fair" | "poor";
    thoughtfulness: "high" | "moderate" | "low";
    interestLevel:
      | "very interested"
      | "interested"
      | "neutral"
      | "disinterested";
    examples: string[];
  };
  strengths: string[];
  developmentAreas: string[];
  culturalFit: {
    teamOrientation: "high" | "moderate" | "low";
    initiative: "high" | "moderate" | "low";
    alignment: string;
    fitScore: number;
  };
  redFlags: string[];
  standoutMoments: string[];
  overallAssessment: string;
  timestamp: string;
}

interface BehavioralDisplayProps {
  interviewId: string;
}

export function BehavioralDisplay({ interviewId }: BehavioralDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<BehavioralInsights | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/get-analysis?interviewId=${interviewId}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch behavioral insights");
        }

        const data = await response.json();

        if (data.behavioralInsights) {
          setInsights(data.behavioralInsights);
        } else {
          setError("Behavioral insights not yet available");
        }
      } catch (err) {
        console.error("Error fetching behavioral insights:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load insights",
        );
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) {
      fetchInsights();
    }
  }, [interviewId]);

  const getRatingColor = (
    rating:
      | "excellent"
      | "good"
      | "fair"
      | "poor"
      | "high"
      | "moderate"
      | "low",
  ) => {
    if (rating === "excellent" || rating === "high") return "#86efac";
    if (rating === "good" || rating === "moderate") return "#fbbf24";
    return "#f87171";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
          <p className="text-black/65">Analyzing behavioral insights...</p>
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="flex items-center justify-center p-5">
        <div className="text-center">
          <FaExclamationTriangle className="mb-3 text-red-400" size={32} />
          <p className="text-red-300 font-medium">
            {error || "No insights available"}
          </p>
          <p className="text-black/65 text-sm mt-2">
            Analysis may still be processing. Please refresh in a moment.
          </p>
        </div>
      </div>
    );
  }

  const cardStyle = {
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
  };

  const badgeStyle = (color: string) => ({
    backgroundColor: color,
    color: "rgba(0, 0, 0, 1)",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.8rem",
    fontWeight: "600",
    textTransform: "uppercase" as const,
  });

  return (
    <div style={{ color: "rgba(0, 0, 0, 1)" }}>
      {/* Overall Assessment - Move to top for immediate context */}
      <div
        style={{
          // backgroundColor: "rgba(255, 255, 255, 0.1)",
          // border: "1px solid rgba(255, 255, 255, 0.2)",
          // borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <h5 className="">Overall Assessment</h5>
        <p
          style={{
            color: "rgba(0, 0, 0, 0.95)",
            marginBottom: 0,
            lineHeight: "1.6",
          }}
        >
          {insights.overallAssessment}
        </p>
      </div>

      {/* Key Strengths & Development Areas */}
      <div className="row g-3 mb-4 ">
        <div className="col-md-6">
          <div className="bg-white/80" style={cardStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <FaCheckCircle size={20} className="text-green-700" />
              <h6
                className="text-green-700"
                style={{ margin: 0, fontSize: "1.1rem" }}
              >
                Key Strengths
              </h6>
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: "1.25rem",
                color: "rgba(0, 0, 0, 0.95)",
                listStyle: "none",
              }}
            >
              {insights.strengths.map((strength, idx) => (
                <li
                  key={idx}
                  style={{
                    marginBottom: "0.75rem",
                    fontSize: "0.95rem",
                    position: "relative",
                    paddingLeft: "1.5rem",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: "0",
                      color: "#86efac",
                    }}
                  >
                    ✓
                  </span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-md-6">
          <div className="bg-white/80" style={cardStyle}>
            <div
              className=""
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <FaLightbulb size={20} color="#fbbf24" />
              <h6 style={{ margin: 0, fontSize: "1.1rem" }}>
                Development Areas
              </h6>
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: "1.25rem",
                color: "rgba(0, 0, 0, 0.95)",
                listStyle: "none",
              }}
            >
              {insights.developmentAreas.map((area, idx) => (
                <li
                  key={idx}
                  style={{
                    marginBottom: "0.75rem",
                    fontSize: "0.95rem",
                    position: "relative",
                    paddingLeft: "1.5rem",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: "0",
                      color: "#fbbf24",
                    }}
                  >
                    •
                  </span>
                  {area}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Key Personality Traits */}
      {insights.personality.traits.length > 0 && (
        <div
          className="bg-white/80"
          style={{ ...cardStyle, marginBottom: "1.5rem" }}
        >
          <h6
            style={{
              marginBottom: "1rem",
              fontSize: "1.1rem",
            }}
          >
            Personality Traits
          </h6>
          <div className="d-flex flex-wrap gap-2">
            {insights.personality.traits.map((trait, idx) => (
              <span
                key={idx}
                style={{
                  backgroundColor: "rgba(147, 197, 253, 0.15)",

                  padding: "0.6rem 1.2rem",
                  borderRadius: "20px",
                  fontSize: "0.95rem",
                  border: "1px solid rgba(147, 197, 253, 0.3)",
                }}
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick Ratings Grid */}
      <div className="bg-white/80" style={cardStyle}>
        <h6
          style={{
            marginBottom: "1.25rem",
            fontSize: "1.1rem",
          }}
        >
          Performance Ratings
        </h6>
        <div className="row g-4">
          <div className="col-md-4">
            <div>
              <small
                style={{
                  color: "rgba(0, 0, 0, 0.75)",
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  fontWeight: "600",
                  letterSpacing: "0.5px",
                }}
              >
                Communication
              </small>
              <div style={{ marginTop: "0.5rem" }}>
                <span
                  style={{
                    ...badgeStyle(
                      getRatingColor(insights.communicationStyle.clarity),
                    ),
                    fontSize: "0.85rem",
                  }}
                >
                  {insights.communicationStyle.clarity}
                </span>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div>
              <small
                style={{
                  color: "rgba(0, 0, 0, 0.75)",
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  fontWeight: "600",
                  letterSpacing: "0.5px",
                }}
              >
                Professionalism
              </small>
              <div style={{ marginTop: "0.5rem" }}>
                <span
                  style={{
                    ...badgeStyle(
                      getRatingColor(
                        insights.communicationStyle.professionalism,
                      ),
                    ),
                    fontSize: "0.85rem",
                  }}
                >
                  {insights.communicationStyle.professionalism}
                </span>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div>
              <small
                style={{
                  color: "rgba(0, 0, 0, 0.75)",
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  fontWeight: "600",
                  letterSpacing: "0.5px",
                }}
              >
                Enthusiasm
              </small>
              <div style={{ marginTop: "0.5rem" }}>
                <span
                  style={{
                    ...badgeStyle(
                      getRatingColor(insights.communicationStyle.enthusiasm),
                    ),
                    fontSize: "0.85rem",
                  }}
                >
                  {insights.communicationStyle.enthusiasm}
                </span>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div>
              <small
                style={{
                  color: "rgba(0, 0, 0, 0.75)",
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  fontWeight: "600",
                  letterSpacing: "0.5px",
                }}
              >
                Confidence
              </small>
              <div style={{ marginTop: "0.5rem" }}>
                <span
                  style={{
                    ...badgeStyle(
                      getRatingColor(insights.personality.confidence),
                    ),
                    fontSize: "0.85rem",
                  }}
                >
                  {insights.personality.confidence}
                </span>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div>
              <small
                style={{
                  color: "rgba(0, 0, 0, 0.75)",
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  fontWeight: "600",
                  letterSpacing: "0.5px",
                }}
              >
                Adaptability
              </small>
              <div style={{ marginTop: "0.5rem" }}>
                <span
                  style={{
                    ...badgeStyle(
                      getRatingColor(insights.personality.adaptability),
                    ),
                    fontSize: "0.85rem",
                  }}
                >
                  {insights.personality.adaptability}
                </span>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div>
              <small
                style={{
                  color: "rgba(0, 0, 0, 0.75)",
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  fontWeight: "600",
                  letterSpacing: "0.5px",
                }}
              >
                Engagement
              </small>
              <div style={{ marginTop: "0.5rem" }}>
                <span
                  style={{
                    ...badgeStyle(
                      getRatingColor(insights.engagement.responsiveness),
                    ),
                    fontSize: "0.85rem",
                  }}
                >
                  {insights.engagement.responsiveness}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Standout Moments - Only if present */}
      {insights.standoutMoments.length > 0 && (
        <div
          style={{
            backgroundColor: "rgba(134, 239, 172, 0.1)",
            border: "1px solid rgba(134, 239, 172, 0.3)",
            borderRadius: "12px",
            padding: "1.5rem",
            marginTop: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <FaStar size={20} color="#86efac" />
            <h6 style={{ margin: 0, color: "#86efac", fontSize: "1.1rem" }}>
              Standout Moments
            </h6>
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: "1.25rem",
              color: "rgba(134, 239, 172, 0.95)",
              listStyle: "none",
            }}
          >
            {insights.standoutMoments.map((moment, idx) => (
              <li
                key={idx}
                style={{
                  marginBottom: "0.75rem",
                  fontSize: "0.95rem",
                  position: "relative",
                  paddingLeft: "1.5rem",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: "0",
                    color: "#86efac",
                  }}
                >
                  ★
                </span>
                {moment}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Red Flags - Only if present */}
      {insights.redFlags.length > 0 && (
        <div
          className="bg-white/80"
          style={{
            border: "1px solid rgba(248, 113, 113, 0.3)",
            borderRadius: "12px",
            padding: "1.5rem",
            marginTop: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <FaExclamationTriangle size={20} color="#f87171" />
            <h6 style={{ margin: 0, fontSize: "1.1rem" }}>Areas of Concern</h6>
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: "1.25rem",
              // color: "rgba(248, 113, 113, 0.95)",
              listStyle: "none",
            }}
          >
            {insights.redFlags.map((flag, idx) => (
              <li
                key={idx}
                style={{
                  marginBottom: "0.75rem",
                  fontSize: "0.95rem",
                  position: "relative",
                  paddingLeft: "1.5rem",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: "0",
                    color: "#f87171",
                  }}
                >
                  ⚠
                </span>
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Timestamp */}
      {insights.timestamp && (
        <p
          style={{
            color: "rgba(0, 0, 0, 0.55)",
            fontSize: "0.75rem",
            marginTop: "2rem",
            textAlign: "center",
          }}
        >
          Analyzed on{" "}
          {new Date(insights.timestamp).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      )}
    </div>
  );
}
