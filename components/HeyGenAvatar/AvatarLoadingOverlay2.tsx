import React, { useState, useEffect } from "react";
import { Brain, Zap, MessageSquare, Sparkles } from "lucide-react";

interface AvatarLoadingOverlayProps {
  isVisible: boolean;
  onComplete: () => void;
}

const AvatarLoadingOverlay: React.FC<AvatarLoadingOverlayProps> = ({
  isVisible,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);

  const steps = [
    { icon: Brain, text: "Initializing AI Neural Networks", color: "#FFD700" },
    { icon: Zap, text: "Calibrating Speech Recognition", color: "#FFC107" },
    {
      icon: MessageSquare,
      text: "Loading Conversational Models",
      color: "#FFEB3B",
    },
    {
      icon: Sparkles,
      text: "Preparing Interactive Experience",
      color: "#FFB300",
    },
  ];

  useEffect(() => {
    if (!isVisible) return;

    let stepIndex = 0;

    const nextStep = () => {
      if (stepIndex < steps.length - 1) {
        stepIndex += 1;
        setCurrentStep(stepIndex);
        setTimeout(nextStep, 1500); // 1.5 seconds per step
      } else {
        // All steps complete - show welcome screen
        setShowWelcome(true);
        // Complete after welcome animation
        setTimeout(() => {
          onComplete();
        }, 3000); // 3 seconds for welcome celebration
      }
    };

    // Start with first step, then move to next
    setTimeout(nextStep, 1000);

    return () => {};
  }, []);

  if (!isVisible) return null;

  const CurrentIcon = steps[currentStep]?.icon || Brain;
  const currentColor = steps[currentStep]?.color || "#FFD700";

  // Theme-based colors - matching scenic background with glassmorphism
  const backgroundColor = "rgba(0, 0, 0, 1)"; // Dark overlay to match other pages
  const textColor = "white";
  const subtleTextColor = "rgba(255, 255, 255, 0.7)";
  const borderColor = "rgba(255, 255, 255, 0.1)";
  const gridOpacity = 0.3;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: backgroundColor,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        border: `1px solid ${borderColor}`,
        boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Welcome Screen */}
      {showWelcome && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: backgroundColor,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1010,
            borderRadius: "24px",
          }}
        >
          {/* Same Tech Background Grid */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                linear-gradient(#FFD70020 1px, transparent 1px),
                linear-gradient(90deg, #FFD70020 1px, transparent 1px)
              `,
              backgroundSize: "30px 30px",
              animation: "gridMove 15s linear infinite",
              opacity: gridOpacity,
            }}
          />

          {/* Bright Welcome Fireflies */}
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: `radial-gradient(circle, #FFD700, #FFD70080, transparent)`,
                boxShadow: `
                  0 0 15px #FFD700,
                  0 0 30px #FFD70080,
                  0 0 45px #FFD70030
                `,
                // Distributed across entire component
                left: `${10 + i * 8.5 + (i % 3) * 7}%`,
                top: `${15 + i * 7.5 + (i % 4) * 12}%`,
                animation: `welcomeFirefly${i % 4} ${8 + i * 1.2}s ease-in-out infinite`,
                opacity: 0.9,
              }}
            />
          ))}

          {/* Welcome Content */}
          <div style={{ textAlign: "center", zIndex: 1020 }}>
            {/* Introducing Text */}
            <div
              style={{
                fontSize: "18px",
                fontWeight: "500",
                color: subtleTextColor,
                marginBottom: "16px",
                animation: "fadeInUp 1s ease-out",
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              Introducing
            </div>

            {/* 3LilMinions Text */}
            <div
              style={{
                fontSize: "48px",
                fontWeight: "700",
                color: textColor,
                textShadow: "0 0 20px rgba(255, 215, 0, 0.5)",
                animation: "fadeInScale 1.2s ease-out 0.3s both",
                marginBottom: "8px",
                letterSpacing: "1px",
                background: "linear-gradient(135deg, #FFD700, #FFC107)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Banana AI
            </div>

            {/* Subtle Tech Ring */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "180px",
                height: "180px",
                border: "1px solid rgba(255, 215, 0, 0.3)",
                borderRadius: "50%",
                animation: "techRing 2s ease-out infinite",
              }}
            />
          </div>
        </div>
      )}

      {/* Regular Loading Content */}
      {!showWelcome && (
        <>
          {/* Animated Background Grid */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                linear-gradient(${currentColor}20 1px, transparent 1px),
                linear-gradient(90deg, ${currentColor}20 1px, transparent 1px)
              `,
              backgroundSize: "30px 30px",
              animation: "gridMove 15s linear infinite",
              opacity: gridOpacity,
            }}
          />

          {/* Bright Natural Fireflies */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${currentColor}, ${currentColor}80, transparent)`,
                boxShadow: `
                  0 0 12px ${currentColor},
                  0 0 24px ${currentColor}80,
                  0 0 36px ${currentColor}40
                `,
                // Distributed across entire component
                left: `${8 + i * 7.5 + (i % 3) * 8}%`,
                top: `${12 + i * 8 + (i % 4) * 10}%`,
                animation: `naturalFirefly${i % 4} ${7 + i * 1.1}s ease-in-out infinite`,
                opacity: 0.85,
              }}
            />
          ))}

          {/* Main Content */}
          <div
            style={{
              textAlign: "center",
              zIndex: 10,
              maxWidth: "400px",
              padding: "0 20px",
            }}
          >
            {/* Central Icon Container */}
            <div style={{ position: "relative", marginBottom: "32px" }}>
              {/* Outer Rotating Ring */}
              <div
                style={{
                  position: "absolute",
                  top: "-15px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "110px",
                  height: "110px",
                  border: "2px solid transparent",
                  borderTopColor: currentColor,
                  borderRightColor: `${currentColor}60`,
                  borderRadius: "50%",
                  animation: "rotate 2s linear infinite",
                }}
              />

              {/* Inner Rotating Ring */}
              <div
                style={{
                  position: "absolute",
                  top: "-5px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "90px",
                  height: "90px",
                  border: "1px solid transparent",
                  borderBottomColor: `${currentColor}80`,
                  borderLeftColor: `${currentColor}40`,
                  borderRadius: "50%",
                  animation: "rotateReverse 1.5s linear infinite",
                }}
              />

              {/* Central Icon */}
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  animation: "iconPulse 2s ease-in-out infinite",
                }}
              >
                <CurrentIcon size={36} color={textColor} />
              </div>
            </div>

            {/* Loading Text with Typewriter Effect */}
            <h3
              key={currentStep}
              style={{
                color: textColor,
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "32px",
                animation: "typewriter 0.5s ease-out",
                textShadow: `0 0 10px ${currentColor}80`,
              }}
            >
              {currentStep === steps.length - 1
                ? "Almost Ready..."
                : steps[currentStep]?.text}
            </h3>

            {/* Step Indicators */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              {steps.map((step, index) => (
                <div
                  key={index}
                  style={{
                    position: "relative",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor:
                      index <= currentStep
                        ? step.color
                        : "rgba(255, 255, 255, 0.2)",
                    transition: "all 0.3s ease",
                    animation:
                      index === currentStep
                        ? "stepPulse 1s ease-in-out infinite"
                        : "none",
                    boxShadow:
                      index <= currentStep
                        ? `0 0 10px ${step.color}80`
                        : "none",
                  }}
                >
                  {index === currentStep && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-4px",
                        left: "-4px",
                        width: "20px",
                        height: "20px",
                        border: `2px solid ${step.color}60`,
                        borderRadius: "50%",
                        animation: "ripple 1s ease-out infinite",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes techRing {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.3);
            opacity: 0;
          }
        }

        @keyframes gridMove {
          0% {
            transform: translate(0, 0);
            opacity: ${gridOpacity};
          }
          50% {
            opacity: ${gridOpacity * 1.5};
          }
          100% {
            transform: translate(30px, 30px);
            opacity: ${gridOpacity};
          }
        }

        @keyframes rotate {
          0% {
            transform: translateX(-50%) rotate(0deg);
          }
          100% {
            transform: translateX(-50%) rotate(360deg);
          }
        }

        @keyframes rotateReverse {
          0% {
            transform: translateX(-50%) rotate(360deg);
          }
          100% {
            transform: translateX(-50%) rotate(0deg);
          }
        }

        @keyframes iconPulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes typewriter {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes stepPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
        }

        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        /* Natural Firefly Movements - Distributed Across Component */
        @keyframes naturalFirefly0 {
          0%,
          100% {
            transform: translate(0px, 0px);
            opacity: 0.5;
          }
          25% {
            transform: translate(40px, -30px);
            opacity: 1;
          }
          50% {
            transform: translate(-25px, -45px);
            opacity: 0.6;
          }
          75% {
            transform: translate(-35px, 20px);
            opacity: 0.9;
          }
        }

        @keyframes naturalFirefly1 {
          0%,
          100% {
            transform: translate(0px, 0px);
            opacity: 0.6;
          }
          30% {
            transform: translate(-50px, 35px);
            opacity: 0.9;
          }
          60% {
            transform: translate(30px, -40px);
            opacity: 1;
          }
          80% {
            transform: translate(45px, 25px);
            opacity: 0.5;
          }
        }

        @keyframes naturalFirefly2 {
          0%,
          100% {
            transform: translate(0px, 0px);
            opacity: 0.7;
          }
          40% {
            transform: translate(35px, 40px);
            opacity: 1;
          }
          70% {
            transform: translate(-40px, -15px);
            opacity: 0.6;
          }
        }

        @keyframes naturalFirefly3 {
          0%,
          100% {
            transform: translate(0px, 0px);
            opacity: 0.8;
          }
          35% {
            transform: translate(-30px, -35px);
            opacity: 1;
          }
          65% {
            transform: translate(50px, 30px);
            opacity: 0.5;
          }
          85% {
            transform: translate(15px, -50px);
            opacity: 0.9;
          }
        }

        /* Welcome Screen Fireflies */
        @keyframes welcomeFirefly0 {
          0%,
          100% {
            transform: translate(0px, 0px);
            opacity: 0.6;
          }
          50% {
            transform: translate(60px, -50px);
            opacity: 1;
          }
        }

        @keyframes welcomeFirefly1 {
          0%,
          100% {
            transform: translate(0px, 0px);
            opacity: 0.7;
          }
          50% {
            transform: translate(-45px, 55px);
            opacity: 1;
          }
        }

        @keyframes welcomeFirefly2 {
          0%,
          100% {
            transform: translate(0px, 0px);
            opacity: 0.8;
          }
          50% {
            transform: translate(35px, -40px);
            opacity: 1;
          }
        }

        @keyframes welcomeFirefly3 {
          0%,
          100% {
            transform: translate(0px, 0px);
            opacity: 0.5;
          }
          50% {
            transform: translate(-30px, -35px);
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
};

export default AvatarLoadingOverlay;
