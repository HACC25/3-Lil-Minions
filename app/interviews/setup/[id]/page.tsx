"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaTrophy, FaArrowRight } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import EligibilityChecker from "../../start/[id]/EligibilityChecker";

export default function InterviewSetupPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const [isVisible, setIsVisible] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const hasSpokenRef = useRef(false);

  useEffect(() => {
    // Trigger fade-in animation
    setTimeout(() => setIsVisible(true), 100);

    // Try to play background music after a slight delay
    const playMusic = async () => {
      if (audioRef.current) {
        try {
          audioRef.current.volume = 0.3; // Set volume to 30%
          await audioRef.current.play();
          setMusicPlaying(true);
          console.log("✅ Music playing successfully");
        } catch (error) {
          console.log("⚠️ Audio autoplay prevented by browser:", error);
          setMusicPlaying(false);
          // Try again after a small delay
          setTimeout(async () => {
            try {
              if (audioRef.current) {
                await audioRef.current.play();
                setMusicPlaying(true);
                console.log("✅ Music playing after retry");
              }
            } catch {
              console.log("❌ Music still blocked, showing button");
            }
          }, 1000);
        }
      }
    };

    // Delay music start slightly to ensure page is interactive
    setTimeout(playMusic, 500);

    // Add event listeners to play music on any user interaction
    const playOnInteraction = () => {
      if (audioRef.current && !musicPlaying) {
        audioRef.current
          .play()
          .then(() => {
            setMusicPlaying(true);
            console.log("✅ Music playing after user interaction");
          })
          .catch((err) => console.log("Could not play:", err));
      }
    };

    // Listen for various user interactions
    document.addEventListener("click", playOnInteraction);
    document.addEventListener("keydown", playOnInteraction);
    document.addEventListener("touchstart", playOnInteraction);
    document.addEventListener("mousemove", playOnInteraction, { once: true });

    return () => {
      document.removeEventListener("click", playOnInteraction);
      document.removeEventListener("keydown", playOnInteraction);
      document.removeEventListener("touchstart", playOnInteraction);
      document.removeEventListener("mousemove", playOnInteraction);
    };
  }, [musicPlaying]);

  // ElevenLabs text-to-speech - trigger only after music starts
  useEffect(() => {
    if (!musicPlaying) return;

    const speakCongrats = async () => {
      if (hasSpokenRef.current) return; // Skip if already spoken
      hasSpokenRef.current = true;
      setIsSpeaking(true);

      try {
        const response = await fetch("/api/text-to-speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: "Congratulations! You've been selected for the second round interview. Make sure you're in a quiet space with a working camera and microphone. When you're ready, click proceed to begin. Good luck!",
          }),
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.volume = 0.8;
          await audio.play();

          // Cleanup
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            setIsSpeaking(false);
          };
        } else {
          setIsSpeaking(false);
        }
      } catch (error) {
        console.error("Failed to play congratulations message:", error);
        setIsSpeaking(false);
      }
    };

    // Wait a bit after music starts, then speak
    setTimeout(speakCongrats, 1000);
  }, [musicPlaying]);

  const handleProceed = () => {
    setIsNavigating(true);
    // Try to play audio again on user interaction
    if (audioRef.current && !musicPlaying) {
      audioRef.current
        .play()
        .then(() => setMusicPlaying(true))
        .catch((err) => console.log("Audio play error:", err));
    }
    router.push(`/interviews/${id}`);
  };

  const handlePlayMusic = () => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => setMusicPlaying(true))
        .catch((err) => console.log("Could not play music:", err));
    }
  };

  // Styles
  const containerStyle = {
    minHeight: "100vh",
    color: "#000",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  };

  const cardStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#000",
    borderRadius: "1.5rem",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    padding: "3rem",
    maxWidth: "800px",
    width: "100%",
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateY(0)" : "translateY(20px)",
    transition: "all 0.6s ease",
  };

  const buttonStyle = {
    backgroundColor: "#3F51B5",
    border: "none",
    borderRadius: "12px",
    padding: "16px 40px",
    color: "#fff",
    fontSize: "1.15rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "2rem",
    boxShadow: "0 4px 12px rgba(63, 81, 181, 0.4)",
    opacity: isNavigating || isSpeaking ? 0.6 : 1,
  };

  const featureCardStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(5px)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "1rem",
    transition: "all 0.3s ease",
  };

  return (
    <EligibilityChecker>
      <div style={containerStyle}>
        {/* Background Music */}
        <audio ref={audioRef} loop preload="auto" autoPlay muted={false}>
          <source
            src="https://www.bensound.com/bensound-music/bensound-slowmotion.mp3"
            type="audio/mpeg"
          />
          <source
            src="https://www.bensound.com/bensound-music/bensound-inspire.mp3"
            type="audio/mpeg"
          />
        </audio>

        {/* Music Play Button (if autoplay blocked) */}
        {!musicPlaying && (
          <button
            onClick={handlePlayMusic}
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              backgroundColor: "rgba(255, 193, 7, 0.9)",
              border: "none",
              borderRadius: "50%",
              width: "50px",
              height: "50px",
              color: "#fff",
              fontSize: "1.2rem",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              zIndex: 1000,
            }}
            title="Play Background Music"
          >
            🎵
          </button>
        )}

        <div style={cardStyle}>
          {/* Success Icon with Animation */}
          <div className="text-center mb-4">
            <div
              style={{
                animation: "bounce 1s ease-in-out infinite",
                display: "inline-block",
              }}
            >
              <FaTrophy size={70} color="#ffd700" />
            </div>
          </div>

          {/* Main Heading */}
          <h1
            className="text-center mb-3"
            style={{ fontSize: "2.5rem", fontWeight: "700" }}
          >
            Congratulations!
          </h1>

          {/* Subheading */}
          <h4
            className="text-center mb-4"
            style={{ color: "#333", fontWeight: "400" }}
          >
            You've Been Selected for the Second Round Interview
          </h4>

          {/* Introduction Text */}
          <p
            className="text-center mb-4"
            style={{
              color: "#444",
              fontSize: "1.05rem",
              lineHeight: "1.6",
            }}
          >
            Based on your application, you have been selected to advance to the
            next stage of our hiring process. This round will help us better
            understand your qualifications and fit for the role.
          </p>

          {/* Divider */}
          <hr
            style={{
              border: "none",
              borderTop: "1px solid rgba(255, 255, 255, 0.2)",
              margin: "2rem 0",
            }}
          />

          {/* What to Expect Section */}
          <h5 className="mb-3" style={{ fontWeight: "600", color: "#000" }}>
            What to Expect in This Round:
          </h5>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <div style={featureCardStyle}>
                <div className="d-flex align-items-start gap-3">
                  <div>
                    <h6 style={{ color: "#000", marginBottom: "0.5rem" }}>
                      Preliminary Questions
                    </h6>
                    <p
                      style={{
                        color: "#333",
                        fontSize: "0.9rem",
                        margin: 0,
                      }}
                    >
                      Verify your qualifications and ensure you meet the
                      prerequisites for this role.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div style={featureCardStyle}>
                <div className="d-flex align-items-start gap-3">
                  <div>
                    <h6 style={{ color: "#000", marginBottom: "0.5rem" }}>
                      AI-Powered Interview
                    </h6>
                    <p
                      style={{
                        color: "#333",
                        fontSize: "0.9rem",
                        margin: 0,
                      }}
                    >
                      Engage with our AI interviewer to assess your behavioral
                      fit and competencies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div
            style={{
              backgroundColor: "rgba(255, 193, 7, 0.15)",
              border: "1px solid rgba(255, 193, 7, 0.3)",
              borderRadius: "12px",
              padding: "1.25rem",
              marginTop: "1.5rem",
            }}
          >
            <h6 style={{ color: "#d97706", marginBottom: "0.75rem" }}>
              Before You Begin:
            </h6>
            <ul
              className="mb-0"
              style={{
                color: "#000",
                fontSize: "0.95rem",
                paddingLeft: "1.25rem",
              }}
            >
              <li>Find a quiet, well-lit space</li>
              <li>Ensure your camera and microphone are working</li>
            </ul>
          </div>

          {/* Proceed Button */}
          <div className="text-center">
            {musicPlaying ? (
              <button
                onClick={handleProceed}
                style={buttonStyle}
                disabled={isNavigating || isSpeaking}
                onMouseEnter={(e) => {
                  if (!isNavigating && !isSpeaking) {
                    e.currentTarget.style.backgroundColor = "#5567BD";
                    e.currentTarget.style.transform = "scale(1.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#3F51B5";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {isNavigating ? (
                  <>
                    <div
                      className="spinner-border spinner-border-sm"
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Proceeding...
                  </>
                ) : isSpeaking ? (
                  <>
                    <div
                      className="spinner-border spinner-border-sm"
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Please wait...
                  </>
                ) : (
                  <>
                    Proceed
                    <FaArrowRight size={18} />
                  </>
                )}
              </button>
            ) : (
              <div
                style={{
                  marginTop: "2rem",
                  padding: "16px 40px",
                  color: "#666",
                  fontSize: "1rem",
                  fontStyle: "italic",
                }}
              >
                Click anywhere to begin
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          @keyframes bounce {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-15px);
            }
          }
        `}</style>
      </div>
    </EligibilityChecker>
  );
}
