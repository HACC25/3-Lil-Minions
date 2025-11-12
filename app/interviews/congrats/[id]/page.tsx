"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { FaCheckCircle, FaTimes } from "react-icons/fa";
import { bgUrl } from "@/utils/styles";
import "bootstrap/dist/css/bootstrap.min.css";

export const InterviewCongratsPage: React.FC = () => {
  const params = useParams();
  const { id } = params as { id: string };
  const [isVisible, setIsVisible] = useState(false);
  const [speechFinished, setSpeechFinished] = useState(false);
  const hasSpokenRef = useRef(false);

  useEffect(() => {
    // Trigger fade-in animation
    setTimeout(() => setIsVisible(true), 100);

    // ElevenLabs text-to-speech congratulations message
    const speakCongrats = async () => {
      if (hasSpokenRef.current) return; // Skip if already spoken
      hasSpokenRef.current = true;

      try {
        const response = await fetch("/api/text-to-speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: "Congratulations on completing your interview! Your responses have been recorded and our team will review them carefully. Feel free to close this browser, and we'll be in touch soon. Thank you!",
          }),
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.volume = 0.8;
          await audio.play();

          // Cleanup and show button when done
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            setSpeechFinished(true);
          };
        } else {
          // If speech fails, show button anyway
          setSpeechFinished(true);
        }
      } catch (error) {
        console.error("Failed to play congratulations message:", error);
        // Show button even if speech fails
        setSpeechFinished(true);
      }
    };

    // Wait a bit for page to load, then speak
    setTimeout(speakCongrats, 1500);
  }, [id]);

  const handleCloseTab = () => {
    // Close the current tab/window
    window.close();

    // Fallback: If window.close() doesn't work (some browsers block it),
    // show a message after a short delay
    setTimeout(() => {
      alert(
        "Please close this tab manually. If you need assistance, contact support.",
      );
    }, 500);
  };

  // Styles - matching the interview page
  const containerStyle = {
    backgroundImage: `url(${bgUrl})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    minHeight: "100vh",
    color: "#000",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const cardStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    color: "#000",
    borderRadius: "1.5rem",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    padding: "3rem",
    maxWidth: "600px",
    textAlign: "center" as const,
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateY(0)" : "translateY(20px)",
    transition: "all 0.6s ease",
  };

  const buttonStyle = {
    backgroundColor: "#3F51B5",
    border: "none",
    borderRadius: "12px",
    padding: "14px 32px",
    color: "#fff",
    fontSize: "1.1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "1.5rem",
    boxShadow: "0 4px 12px rgba(63, 81, 181, 0.4)",
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Success Icon with Animation */}
        <div
          style={{
            animation: "pulse 2s ease-in-out infinite",
            display: "inline-block",
          }}
        >
          <FaCheckCircle size={80} color="#4caf50" className="mb-4" />
        </div>

        {/* Main Heading */}
        <h1 className="mb-3" style={{ fontSize: "2.5rem", fontWeight: "700" }}>
          Congratulations!
        </h1>

        {/* Thank You Message */}
        <h4 className="mb-4" style={{ color: "#333", fontWeight: "400" }}>
          Thank you for completing the interview
        </h4>

        {/* Body Text */}
        <p
          style={{
            color: "#444",
            fontSize: "1.05rem",
            lineHeight: "1.6",
            marginBottom: "1.5rem",
          }}
        >
          We appreciate the time you took to complete this interview. Your
          responses have been successfully recorded and will be carefully
          reviewed by our team.
        </p>

        <p
          style={{
            color: "#444",
            fontSize: "1.05rem",
            lineHeight: "1.6",
            marginBottom: "0.5rem",
          }}
        >
          You will receive an email confirmation shortly with next steps.
        </p>

        {/* Close Button - only show after speech finishes */}
        {speechFinished && (
          <button
            onClick={handleCloseTab}
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#5567BD";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#3F51B5";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <FaTimes size={20} />
            Close This Tab
          </button>
        )}

        {/* Footer Info */}
        <div
          className="mt-4 pt-3"
          style={{ borderTop: "1px solid rgba(0, 0, 0, 0.1)" }}
        >
          <p style={{ color: "#666", fontSize: "0.85rem", margin: 0 }}>
            Need help? Contact us at{" "}
            <a
              href="mailto:support@3lilminions.com"
              style={{ color: "#3b82f6", textDecoration: "none" }}
            >
              support@3lilminions.com
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default InterviewCongratsPage;
