// components/AvatarConfiguration.tsx
import React from "react";
import { Bot, ChevronDown, ChevronUp, Info } from "lucide-react";
import { FormData, ColorScheme, ExpandedSections } from "./lib/types";
import { AVATAR_OPTIONS, EMOTION_OPTIONS } from "./lib/constants";
import AudioVisualizer from "./AudioVisualizer";
import { useVoicePreview } from "./hooks/useVoicePreview";

interface AvatarConfigurationProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  expandedSections: ExpandedSections;
  toggleSection: (section: keyof ExpandedSections) => void;
  currentColors: ColorScheme;
}

const AvatarConfiguration: React.FC<AvatarConfigurationProps> = ({
  formData,
  updateFormData,
  expandedSections,
  toggleSection,
}) => {
  const { playVoicePreview, isPlaying, isLoading, error, currentVoiceId } =
    useVoicePreview();

  // Avatar grid styles
  const avatarGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "12px",
    marginBottom: "16px",
  };

  const avatarCardStyle = {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: "#ffffff",
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "center" as const,
    position: "relative" as const,
  };

  const getSelectedAvatarStyle = () => ({
    ...avatarCardStyle,
    border: "2px solid #06b6d4",
    backgroundColor: "#ecfeff",
    transform: "scale(1.02)",
    boxShadow: "0 0 0 3px rgba(6, 182, 212, 0.1)",
  });

  const avatarImageStyle = {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    objectFit: "cover" as const,
    marginBottom: "8px",
  };

  const avatarLabelStyle = {
    fontSize: "12px",
    fontWeight: "500",
    color: "#111827",
    margin: "0 0 8px 0",
    textAlign: "center" as const,
  };

  const bottomControlsStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: "auto",
    padding: "8px 0",
  };

  const sectionStyle = {
    marginBottom: "24px",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(8px)",
    borderRadius: "12px",
    padding: "24px",
    border: "1px solid rgba(255, 255, 255, 0.6)",
    transition: "all 0.3s ease",
  };

  const sectionHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    cursor: "pointer",
    userSelect: "none" as const,
  };

  const sectionTitleStyle = {
    color: "#111827",
    fontSize: "18px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: 0,
  };

  const formGroupStyle = {
    marginBottom: "20px",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontWeight: "500",
    color: "#111827",
    fontSize: "14px",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: "#ffffff",
    color: "#111827",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "16px",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
  };

  const selectStyle = {
    ...inputStyle,
    cursor: "pointer",
  };

  const infoBoxStyle = {
    backgroundColor: "#ecfeff",
    border: "1px solid #a5f3fc",
    borderRadius: "8px",
    padding: "12px 16px",
    marginBottom: "16px",
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  };

  return (
    <>
      <style>
        {`
          .input-focus:focus {
            outline: none !important;
            border-color: #06b6d4 !important;
            box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2) !important;
          }

          .collapse-icon {
            transition: transform 0.3s ease;
          }

          .collapsed {
            transform: rotate(-90deg);
          }

          @keyframes pulse {
            0% { transform: scaleY(0.3); }
            100% { transform: scaleY(1); }
          }
        `}
      </style>

      <div style={sectionStyle}>
        <div style={sectionHeaderStyle} onClick={() => toggleSection("avatar")}>
          <h3 style={sectionTitleStyle}>
            <Bot size={20} />
            Avatar Configuration
            <span
              style={{
                color: "red",
                fontSize: "14px",
                fontWeight: "normal",
              }}
            >
              (Required)
            </span>
          </h3>
          <div
            className={`collapse-icon ${
              !expandedSections.avatar ? "collapsed" : ""
            }`}
          >
            {expandedSections.avatar ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </div>
        </div>

        {expandedSections.avatar && (
          <div>
            <div style={infoBoxStyle}>
              <Info size={16} color="#0891b2" style={{ flexShrink: 0 }} />
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "#0891b2",
                }}
              >
                Choose an avatar to represent your interview.
              </p>
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Select Avatar</label>
              <div style={avatarGridStyle}>
                {AVATAR_OPTIONS.map((avatar) => (
                  <div
                    key={avatar.value}
                    style={
                      formData.selectedAvatar === avatar.value
                        ? getSelectedAvatarStyle()
                        : avatarCardStyle
                    }
                    onClick={() =>
                      updateFormData({ selectedAvatar: avatar.value })
                    }
                  >
                    <img
                      src={avatar.imageUrl}
                      alt={avatar.label}
                      style={avatarImageStyle}
                    />
                    <p style={avatarLabelStyle}>{avatar.label}</p>

                    <div style={bottomControlsStyle}>
                      <AudioVisualizer
                        isPlaying={
                          currentVoiceId === avatar.voiceId && isPlaying
                        }
                        onToggle={() => {
                          if (avatar.voiceId) {
                            playVoicePreview(avatar.voiceId);
                          }
                        }}
                        disabled={isLoading}
                        size="sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
              {!formData.selectedAvatar && (
                <p
                  style={{
                    color: "red",
                    fontSize: "14px",
                    margin: "8px 0 0 0",
                  }}
                >
                  Please select an avatar
                </p>
              )}
              {error && (
                <p
                  style={{
                    color: "red",
                    fontSize: "12px",
                    margin: "8px 0 0 0",
                  }}
                >
                  Voice preview error: {error}
                </p>
              )}
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="selectedEmotion">
                Avatar Voice Emotion
              </label>
              <select
                id="selectedEmotion"
                value={formData.selectedEmotion}
                onChange={(e) =>
                  updateFormData({ selectedEmotion: e.target.value })
                }
                style={selectStyle}
                className="input-focus"
                required
              >
                <option value="">Select emotion</option>
                {EMOTION_OPTIONS.map(
                  (emotion: { value: string; label: string }) => (
                    <option key={emotion.value} value={emotion.value}>
                      {emotion.label}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AvatarConfiguration;
