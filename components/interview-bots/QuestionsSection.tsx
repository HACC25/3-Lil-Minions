// QuestionsSection.tsx - Updated with preset "Tell us about yourself" question

import React, { useState } from "react";
import {
  Target,
  MessageSquare,
  Users,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Question, ColorScheme, ExpandedSections } from "./lib/types";

interface QuestionsSectionProps {
  technicalQuestions: Question[];
  generalQuestions: Question[];
  behavioralQuestions: Question[];
  preQualificationQuestions: Question[];
  setTechnicalQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setGeneralQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setBehavioralQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setPreQualificationQuestions: React.Dispatch<
    React.SetStateAction<Question[]>
  >;
  expandedSections: ExpandedSections;
  toggleSection: (section: keyof ExpandedSections) => void;
  currentColors: ColorScheme;
}

// Move this outside the component to avoid recreation on every render
const generateQuestionId = (): string => {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Preset questions with their categories (We/Us perspective) - REMOVED "Tell us about yourself" from here
const PRESET_QUESTIONS = [
  {
    text: "What skills do you bring to our position that other applicants aren't likely to offer?",
    type: "general" as const,
  },
  {
    text: "What motivates you to do this kind of work?",
    type: "general" as const,
  },
  {
    text: "Pick one word that describes you and tell us why you picked that word.",
    type: "general" as const,
  },
  { text: "What are your strengths?", type: "general" as const },
  { text: "What is a weakness that you have?", type: "general" as const },
  {
    text: "Describe a new skill you learned. How did it help you?",
    type: "behavioral" as const,
  },
  {
    text: "If we called your former boss, what would he/she say about you?",
    type: "general" as const,
  },
  {
    text: "What did you NOT like about your past jobs?",
    type: "general" as const,
  },
  {
    text: "Why do you want to work for our company?",
    type: "general" as const,
  },
  {
    text: "Explain the gaps in your work history or reason for leaving.",
    type: "general" as const,
  },
  {
    text: "Describe a time when you have creatively overcome a challenge.",
    type: "behavioral" as const,
  },
  {
    text: "Describe a time when you had to assist a co-worker.",
    type: "behavioral" as const,
  },
  {
    text: "Describe a time when you worked under pressure.",
    type: "behavioral" as const,
  },
  { text: "Why should we hire you?", type: "general" as const },
];

const QuestionsSection: React.FC<QuestionsSectionProps> = ({
  technicalQuestions,
  generalQuestions,
  behavioralQuestions,
  preQualificationQuestions,
  setTechnicalQuestions,
  setGeneralQuestions,
  setBehavioralQuestions,
  setPreQualificationQuestions,
  expandedSections,
  toggleSection,
}) => {
  // New question inputs
  const [newTechnicalQuestion, setNewTechnicalQuestion] = useState("");
  const [newGeneralQuestion, setNewGeneralQuestion] = useState("");
  const [newBehavioralQuestion, setNewBehavioralQuestion] = useState("");
  const [newPreQualificationQuestion, setNewPreQualificationQuestion] =
    useState("");

  // Quick Add section state
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Helper function to get display title for question types
  const getDisplayTitle = (
    type: "technical" | "general" | "behavioral" | "pre-qualification",
  ) => {
    if (type === "general") {
      return "Introductory Questions";
    }
    if (type === "pre-qualification") {
      return "Pre-Qualification Questions";
    }
    return type.charAt(0).toUpperCase() + type.slice(1) + " Questions";
  };

  const addQuestion = (
    type: "technical" | "general" | "behavioral" | "pre-qualification",
  ) => {
    let questionText = "";
    let setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
    let setNewQuestion: React.Dispatch<React.SetStateAction<string>>;

    switch (type) {
      case "technical":
        questionText = newTechnicalQuestion;
        setQuestions = setTechnicalQuestions;
        setNewQuestion = setNewTechnicalQuestion;
        break;
      case "general":
        questionText = newGeneralQuestion;
        setQuestions = setGeneralQuestions;
        setNewQuestion = setNewGeneralQuestion;
        break;
      case "behavioral":
        questionText = newBehavioralQuestion;
        setQuestions = setBehavioralQuestions;
        setNewQuestion = setNewBehavioralQuestion;
        break;
      case "pre-qualification":
        questionText = newPreQualificationQuestion;
        setQuestions = setPreQualificationQuestions;
        setNewQuestion = setNewPreQualificationQuestion;
        break;
    }

    if (questionText.trim()) {
      const newQuestion: Question = {
        id: generateQuestionId(),
        question: questionText.trim(),
        type: type,
      };
      setQuestions((prev) => [...prev, newQuestion]);
      setNewQuestion("");
    }
  };

  // Add a preset question to the appropriate category
  const addPresetQuestion = (
    questionText: string,
    type: "technical" | "general" | "behavioral" | "pre-qualification",
  ) => {
    let setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
    let existingQuestions: Question[];

    switch (type) {
      case "technical":
        setQuestions = setTechnicalQuestions;
        existingQuestions = technicalQuestions;
        break;
      case "general":
        setQuestions = setGeneralQuestions;
        existingQuestions = generalQuestions;
        break;
      case "behavioral":
        setQuestions = setBehavioralQuestions;
        existingQuestions = behavioralQuestions;
        break;
      case "pre-qualification":
        setQuestions = setPreQualificationQuestions;
        existingQuestions = preQualificationQuestions;
        break;
    }

    // Check if question already exists
    const alreadyExists = existingQuestions.some(
      (q) => q.question.toLowerCase() === questionText.toLowerCase(),
    );

    if (!alreadyExists) {
      const newQuestion: Question = {
        id: generateQuestionId(),
        question: questionText,
        type: type,
      };
      setQuestions((prev) => [...prev, newQuestion]);
    }
  };

  const removeQuestion = (
    id: string,
    type: "technical" | "general" | "behavioral" | "pre-qualification",
  ) => {
    switch (type) {
      case "technical":
        setTechnicalQuestions((prev) => prev.filter((q) => q.id !== id));
        break;
      case "general":
        setGeneralQuestions((prev) => prev.filter((q) => q.id !== id));
        break;
      case "behavioral":
        setBehavioralQuestions((prev) => prev.filter((q) => q.id !== id));
        break;
      case "pre-qualification":
        setPreQualificationQuestions((prev) => prev.filter((q) => q.id !== id));
        break;
    }
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

  const buttonSecondaryStyle = {
    backgroundColor: "#06b6d4",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 20px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const questionItemStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    color: "#111827",
    padding: "16px 20px",
    borderRadius: "8px",
    marginBottom: "12px",
    border: "1px solid #d1d5db",
    transition: "all 0.2s ease",
  };

  const getTotalQuestions = () => {
    return (
      technicalQuestions.length +
      generalQuestions.length +
      behavioralQuestions.length +
      preQualificationQuestions.length
    );
  };

  const renderQuestionSection = (
    title: string,
    icon: React.ReactNode,
    type: "technical" | "general" | "behavioral" | "pre-qualification",
    questions: Question[],
    newQuestion: string,
    setNewQuestion: (value: string) => void,
    sectionKey: keyof ExpandedSections,
  ) => {
    // Special handling for general questions to show preset intro
    const isGeneralSection = type === "general";
    const displayQuestionCount = isGeneralSection
      ? questions.length + 1
      : questions.length;

    return (
      <div style={sectionStyle}>
        <div
          style={sectionHeaderStyle}
          onClick={() => toggleSection(sectionKey)}
        >
          <h3 style={sectionTitleStyle}>
            {icon}
            {title}
            {displayQuestionCount > 0 && (
              <span
                style={{
                  backgroundColor: "#06b6d4",
                  color: "#fff",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  marginLeft: "8px",
                }}
              >
                {displayQuestionCount}
              </span>
            )}
          </h3>
          <div
            className={`collapse-icon ${
              !expandedSections[sectionKey] ? "collapsed" : ""
            }`}
          >
            {expandedSections[sectionKey] ? (
              <ChevronUp size={20} style={{ color: "#111827" }} />
            ) : (
              <ChevronDown size={20} style={{ color: "#111827" }} />
            )}
          </div>
        </div>

        {expandedSections[sectionKey] && (
          <div>
            <div style={formGroupStyle}>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                  className="input-focus"
                  placeholder={`Enter ${
                    type === "general"
                      ? "an additional introductory"
                      : type === "pre-qualification"
                        ? "a pre-qualification"
                        : `a ${type}`
                  } question...`}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addQuestion(type);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addQuestion(type)}
                  style={buttonSecondaryStyle}
                  className="button-hover"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>

              {/* Show preset intro question for general section */}
              {isGeneralSection && (
                <div
                  style={{
                    ...questionItemStyle,
                    backgroundColor: "#ecfeff",
                    border: "2px solid #a5f3fc",
                  }}
                >
                  <span style={{ color: "#111827", flex: 1 }}>
                    Let's start with getting to know you better. Could you tell
                    us about yourself?
                  </span>
                  <span
                    style={{
                      backgroundColor: "#06b6d4",
                      color: "#fff",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    Always Included
                  </span>
                </div>
              )}

              {questions.length > 0 && (
                <div>
                  {questions.map((question) => (
                    <div
                      key={question.id}
                      style={questionItemStyle}
                      className="question-item"
                    >
                      <span style={{ color: "#111827", flex: 1 }}>
                        {question.question}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeQuestion(question.id, type)}
                        style={{
                          backgroundColor: "transparent",
                          color: "#EF4444",
                          border: "none",
                          cursor: "pointer",
                          padding: "8px",
                          borderRadius: "50%",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#FEE2E2";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
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
          
          .button-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(6, 182, 212, 0.3);
            background-color: #0891b2;
          }
          
          .preset-button-hover:hover {
            transform: translateX(4px);
            box-shadow: 0 4px 12px rgba(6, 182, 212, 0.2);
            background-color: #ecfeff;
          }
          
          .question-item:hover {
            border-color: #06b6d4;
            transform: translateX(4px);
          }
          
          .collapse-icon {
            transition: transform 0.3s ease;
          }
          
          .collapsed {
            transform: rotate(-90deg);
          }
        `}
      </style>

      {/* Questions Status Header */}
      <div
        style={{
          backgroundColor: getTotalQuestions() === 0 ? "#fef3c7" : "#d1fae5",
          color: getTotalQuestions() === 0 ? "#92400e" : "#065f46",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "16px",
          marginTop: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          border: `2px solid ${
            getTotalQuestions() === 0 ? "#fbbf24" : "#34d399"
          }`,
        }}
      >
        {getTotalQuestions() === 0 ? (
          <AlertCircle size={16} />
        ) : (
          <CheckCircle size={16} />
        )}
        <span style={{ fontSize: "14px", fontWeight: "600" }}>
          {getTotalQuestions() === 0
            ? "⚠️ At least one question is required to create the interview bot (in addition to the preset intro)"
            : `✅ ${getTotalQuestions()} question${
                getTotalQuestions() === 1 ? "" : "s"
              } added (plus the preset intro question)`}
        </span>
      </div>

      {/* Quick Add Questions Section */}
      <div style={sectionStyle}>
        <div
          style={sectionHeaderStyle}
          onClick={() => setShowQuickAdd(!showQuickAdd)}
        >
          <h3 style={sectionTitleStyle}>
            Quick Add Common Questions
            <span
              style={{
                backgroundColor: "#06b6d4",
                color: "#fff",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "12px",
                marginLeft: "8px",
              }}
            >
              {PRESET_QUESTIONS.length}
            </span>
          </h3>
          <div className={`collapse-icon ${!showQuickAdd ? "collapsed" : ""}`}>
            {showQuickAdd ? (
              <ChevronUp size={20} style={{ color: "#111827" }} />
            ) : (
              <ChevronDown size={20} style={{ color: "#111827" }} />
            )}
          </div>
        </div>

        {showQuickAdd && (
          <div>
            <p
              style={{
                color: "#111827",
                marginBottom: "16px",
                fontSize: "14px",
                opacity: 0.7,
              }}
            >
              Click any question below to add it to the appropriate category.
              Questions you've already added won't be duplicated.
            </p>

            {/* Group questions by type */}
            {["general", "behavioral"].map((category) => {
              const categoryQuestions = PRESET_QUESTIONS.filter(
                (q) => q.type === category,
              );

              if (categoryQuestions.length === 0) return null;

              return (
                <div key={category} style={{ marginBottom: "20px" }}>
                  <h4
                    style={{
                      color: "#111827",
                      fontSize: "14px",
                      fontWeight: "600",
                      marginBottom: "12px",
                      textTransform: "capitalize",
                    }}
                  >
                    {category === "general"
                      ? "Introductory Questions"
                      : `${category} Questions`}
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {categoryQuestions.map((preset, index) => {
                      const allQuestions = [
                        ...technicalQuestions,
                        ...generalQuestions,
                        ...behavioralQuestions,
                        ...preQualificationQuestions,
                      ];
                      const isAdded = allQuestions.some(
                        (q) =>
                          q.question.toLowerCase() ===
                          preset.text.toLowerCase(),
                      );

                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() =>
                            addPresetQuestion(preset.text, preset.type)
                          }
                          disabled={isAdded}
                          style={{
                            backgroundColor: isAdded ? "#f3f4f6" : "#ffffff",
                            color: "#111827",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            padding: "12px 16px",
                            fontSize: "14px",
                            cursor: isAdded ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            textAlign: "left",
                            opacity: isAdded ? 0.5 : 1,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                          className={!isAdded ? "preset-button-hover" : ""}
                        >
                          <span>{preset.text}</span>
                          {isAdded && (
                            <CheckCircle
                              size={16}
                              style={{ color: "#10b981" }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pre-Qualification Questions Section - FIRST (most important screening) */}
      {renderQuestionSection(
        getDisplayTitle("pre-qualification"),
        <CheckCircle size={20} />,
        "pre-qualification",
        preQualificationQuestions,
        newPreQualificationQuestion,
        setNewPreQualificationQuestion,
        "preQualification",
      )}

      {/* Introductory Questions Section (formerly General) - SECOND */}
      {renderQuestionSection(
        getDisplayTitle("general"),
        <MessageSquare size={20} />,
        "general",
        generalQuestions,
        newGeneralQuestion,
        setNewGeneralQuestion,
        "general",
      )}

      {/* Behavioral Questions Section - THIRD */}
      {renderQuestionSection(
        getDisplayTitle("behavioral"),
        <Users size={20} />,
        "behavioral",
        behavioralQuestions,
        newBehavioralQuestion,
        setNewBehavioralQuestion,
        "behavioral",
      )}

      {/* Technical Questions Section - FOURTH */}
      {renderQuestionSection(
        getDisplayTitle("technical"),
        <Target size={20} />,
        "technical",
        technicalQuestions,
        newTechnicalQuestion,
        setNewTechnicalQuestion,
        "technical",
      )}

      {/* Info Box about Questions */}
      <div
        style={{
          backgroundColor: "#fef3c7",
          color: "#92400e",
          padding: "16px 20px",
          borderRadius: "8px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          border: "2px solid #fbbf24",
        }}
      >
        <AlertCircle size={20} style={{ marginTop: "2px", flexShrink: 0 }} />
        <div style={{ fontSize: "14px" }}>
          <p style={{ margin: "0 0 8px 0", fontWeight: "600" }}>
            Questions Required
          </p>
          <p style={{ margin: 0 }}>
            <strong>At least one question is required</strong> from any category
            (Pre-Qualification, Introductory, Behavioral, or Technical) in
            addition to the preset "Tell us about yourself" intro. The bot will
            intelligently select and ask questions from all categories based on
            the interview type and candidate responses. Add at least 3-5
            questions per category for the best experience.
          </p>
        </div>
      </div>
    </>
  );
};

export default QuestionsSection;
