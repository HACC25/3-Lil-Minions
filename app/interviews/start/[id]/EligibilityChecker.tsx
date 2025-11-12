"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaLock, FaHome } from "react-icons/fa";
import { LoadingCard } from "@/app/jobs/company/[companyId]/page";

interface EligibilityCheckerProps {
  children: React.ReactNode;
}

export default function EligibilityChecker({
  children,
}: EligibilityCheckerProps) {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };

  const [isChecking, setIsChecking] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewCompleted, setInterviewCompleted] = useState(false);

  useEffect(() => {
    const checkEligibility = async () => {
      try {
        const response = await fetch("/api/check-eligibility", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applicantId: id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to check eligibility");
          setIsEligible(false);
          setInterviewCompleted(false);
        } else if (data.interviewCompleted) {
          setIsEligible(false);
          setInterviewCompleted(true);
          setError("This interview has already been completed");
        } else if (data.eligible) {
          setIsEligible(true);
          setInterviewCompleted(false);
        } else {
          setIsEligible(false);
          setInterviewCompleted(false);
          setError("You are not eligible for the second round interview");
        }
      } catch (err) {
        console.error("Error checking eligibility:", err);
        setError("Failed to verify eligibility");
        setIsEligible(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkEligibility();
  }, [id]);

  // Styles
  const containerStyle = {
    minHeight: "100vh",
    color: "#fff",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  };

  const cardStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#fff",
    borderRadius: "1rem",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    padding: "3rem",
    maxWidth: "500px",
    textAlign: "center" as const,
  };

  const buttonStyle = {
    backgroundColor: "#3F51B5",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "1rem",
    boxShadow: "0 4px 12px rgba(63, 81, 181, 0.4)",
  };

  // Show loading state
  if (isChecking) {
    return (
      <LoadingCard desc="Verifying your eligibility for the interview, please wait..." />
    );
  }

  // Show error/not eligible state
  if (!isEligible || error) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <FaLock
            size={64}
            color={interviewCompleted ? "#ffc107" : "#dc3545"}
            className="mb-4"
          />
          <h2 className="mb-3" style={{ color: "#fff", fontWeight: "600" }}>
            {interviewCompleted ? "Interview Completed" : "Access Denied"}
          </h2>
          <p
            style={{
              color: "#b0b0b0",
              fontSize: "1.1rem",
              marginBottom: "1rem",
            }}
          >
            {error || "You are not eligible for this interview"}
          </p>
          <p style={{ color: "#888", fontSize: "0.9rem" }}>
            Please contact support if you believe this is an error.
          </p>
          <button
            onClick={() => router.push("/")}
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#5567BD";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#3F51B5";
            }}
          >
            <FaHome size={18} />
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Show the interview if eligible
  return <>{children}</>;
}
