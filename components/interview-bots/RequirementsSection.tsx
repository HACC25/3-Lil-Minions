// RequirementsSection.tsx
import React, { useState } from "react";
import {
  Target,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  ClipboardList,
} from "lucide-react";
import { ExpandedSections, ScoringCriteria } from "./lib/types";

interface RequirementsSectionProps {
  scoringCriteria: ScoringCriteria[];
  setScoringCriteria: React.Dispatch<React.SetStateAction<ScoringCriteria[]>>;
  expandedSections: ExpandedSections;
  toggleSection: (section: keyof ExpandedSections) => void;
}

// Default scoring criteria
export const DEFAULT_SCORING_CRITERIA: ScoringCriteria[] = [
  {
    id: "communication",
    title: "Communication & Clarity",
    description:
      "How well the candidate explains their thoughts, ideas, and answers. Includes listening, structure, and professionalism.",
  },
  {
    id: "problem_solving",
    title: "Problem-Solving & Critical Thinking",
    description:
      "Ability to analyze the question, break down the problem, and give logical reasoning. Creativity and structured approach count.",
  },
  {
    id: "technical_knowledge",
    title: "Technical / Role-Specific Knowledge",
    description:
      "Depth of knowledge in the relevant subject (coding, writing, business, etc.). Ability to apply knowledge to real-world or situational questions.",
  },
  {
    id: "experience_examples",
    title: "Experience & Examples (Behavioral)",
    description:
      "Use of STAR (Situation, Task, Action, Result) or similar to back up answers. Relevance and impact of experiences shared.",
  },
  {
    id: "cultural_fit",
    title: "Cultural Fit & Collaboration",
    description:
      "Alignment with company values/mission. Teamwork, adaptability, and interpersonal style.",
  },
  {
    id: "motivation",
    title: "Motivation & Interest",
    description: "Why they want the role. Enthusiasm and long-term potential.",
  },
];

const generateCriteriaId = (): string => {
  return `criteria_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const RequirementsSection: React.FC<RequirementsSectionProps> = ({
  scoringCriteria,
  setScoringCriteria,
  expandedSections,
  toggleSection,
}) => {
  const [newCriteriaTitle, setNewCriteriaTitle] = useState("");
  const [newCriteriaDescription, setNewCriteriaDescription] = useState("");
  const [showRubric, setShowRubric] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<{
    [key: string]: { title: string; description: string };
  }>({});

  const addCriteria = () => {
    if (newCriteriaTitle.trim() && newCriteriaDescription.trim()) {
      const newCriteria: ScoringCriteria = {
        id: generateCriteriaId(),
        title: newCriteriaTitle.trim(),
        description: newCriteriaDescription.trim(),
      };
      setScoringCriteria((prev) => [...prev, newCriteria]);
      setNewCriteriaTitle("");
      setNewCriteriaDescription("");
    }
  };

  const removeCriteria = (id: string) => {
    setScoringCriteria((prev) => prev.filter((c) => c.id !== id));
    // Remove from editing state if it was being edited
    setEditingCriteria((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const startEditing = (criteria: ScoringCriteria) => {
    setEditingCriteria((prev) => ({
      ...prev,
      [criteria.id]: {
        title: criteria.title,
        description: criteria.description,
      },
    }));
  };

  const cancelEditing = (id: string) => {
    setEditingCriteria((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const saveEditing = (id: string) => {
    const editData = editingCriteria[id];
    if (editData && editData.title.trim() && editData.description.trim()) {
      setScoringCriteria((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                title: editData.title.trim(),
                description: editData.description.trim(),
              }
            : c,
        ),
      );
      cancelEditing(id);
    }
  };

  const updateEditingCriteria = (
    id: string,
    field: "title" | "description",
    value: string,
  ) => {
    setEditingCriteria((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
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

  const textareaStyle = {
    ...inputStyle,
    minHeight: "80px",
    resize: "vertical" as const,
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

  const criteriaItemStyle = {
    backgroundColor: "#ffffff",
    color: "#111827",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "16px",
    border: "1px solid #d1d5db",
    transition: "all 0.2s ease",
  };

  const rubricStyle = {
    backgroundColor: "#fef3c7",
    color: "#111827",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "24px",
    border: "2px solid #fbbf24",
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
          
          .criteria-item:hover {
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

      {/* Requirements Status Header */}
      <div
        style={{
          backgroundColor: scoringCriteria.length === 0 ? "#fef3c7" : "#d1fae5",
          color: scoringCriteria.length === 0 ? "#92400e" : "#065f46",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "16px",
          marginTop: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          border: `2px solid ${
            scoringCriteria.length === 0 ? "#fbbf24" : "#34d399"
          }`,
        }}
      >
        {scoringCriteria.length === 0 ? (
          <AlertCircle size={16} />
        ) : (
          <CheckCircle size={16} />
        )}
        <span style={{ fontSize: "14px", fontWeight: "600" }}>
          {scoringCriteria.length === 0
            ? "⚠️ At least one scoring criteria is recommended"
            : `✅ ${scoringCriteria.length} scoring criteria defined`}
        </span>
      </div>

      {/* 4-Point Scale Rubric - Collapsible */}
      <div style={rubricStyle}>
        <div
          onClick={() => setShowRubric(!showRubric)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            userSelect: "none" as const,
          }}
        >
          <h4
            style={{
              margin: 0,
              color: "#111827",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Target size={20} />
            4-Point Scale Rubric
          </h4>
          <div
            className={`collapse-icon ${!showRubric ? "collapsed" : ""}`}
            style={{ color: "#111827" }}
          >
            {showRubric ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>

        {showRubric && (
          <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                backgroundColor: "#10B981",
                color: "#FFFFFF",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              <span>4 – Excellent</span>
              <span>
                Exceeds expectations; strong, clear, compelling examples; stands
                out from typical candidates.
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                backgroundColor: "#3B82F6",
                color: "#FFFFFF",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              <span>3 – Good</span>
              <span>
                Meets expectations; solid, clear responses; may have minor gaps
                but overall strong.
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                backgroundColor: "#F59E0B",
                color: "#FFFFFF",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              <span>2 – Fair</span>
              <span>
                Partially meets expectations; vague, incomplete, or inconsistent
                answers; requires coaching.
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                backgroundColor: "#EF4444",
                color: "#FFFFFF",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              <span>1 – Poor</span>
              <span>
                Does not meet expectations; weak communication, irrelevant or
                missing examples, lack of preparation.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Scoring Criteria Section */}
      <div style={sectionStyle}>
        <div
          style={sectionHeaderStyle}
          onClick={() => toggleSection("requirements")}
        >
          <h3 style={sectionTitleStyle}>
            <ClipboardList size={20} />
            Interview Scoring Criteria
            {scoringCriteria.length > 0 && (
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
                {scoringCriteria.length}
              </span>
            )}
          </h3>
          <div
            className={`collapse-icon ${
              !expandedSections.requirements ? "collapsed" : ""
            }`}
          >
            {expandedSections.requirements ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </div>
        </div>

        {expandedSections.requirements && (
          <div>
            {/* Add New Criteria Form */}
            <div
              style={{
                marginBottom: "24px",
                padding: "20px",
                backgroundColor: "#f9fafb",
                borderRadius: "12px",
                border: "1px solid #d1d5db",
              }}
            >
              <h4
                style={{
                  color: "#111827",
                  marginBottom: "16px",
                  fontSize: "16px",
                  fontWeight: "600",
                }}
              >
                Add New Scoring Criteria
              </h4>
              <div style={{ marginBottom: "16px" }}>
                <input
                  type="text"
                  value={newCriteriaTitle}
                  onChange={(e) => setNewCriteriaTitle(e.target.value)}
                  style={inputStyle}
                  className="input-focus"
                  placeholder="Enter criteria title (e.g., 'Leadership Skills')"
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <textarea
                  value={newCriteriaDescription}
                  onChange={(e) => setNewCriteriaDescription(e.target.value)}
                  style={textareaStyle}
                  className="input-focus"
                  placeholder="Enter criteria description (what will be evaluated and how)"
                />
              </div>
              <button
                type="button"
                onClick={addCriteria}
                style={buttonSecondaryStyle}
                className="button-hover"
                disabled={
                  !newCriteriaTitle.trim() || !newCriteriaDescription.trim()
                }
              >
                <Plus size={16} />
                Add Criteria
              </button>
            </div>

            {/* Existing Criteria */}
            {scoringCriteria.length > 0 && (
              <div>
                <h4
                  style={{
                    color: "#111827",
                    marginBottom: "16px",
                    fontSize: "16px",
                    fontWeight: "600",
                  }}
                >
                  Current Scoring Criteria
                </h4>
                {scoringCriteria.map((criteria) => (
                  <div
                    key={criteria.id}
                    style={criteriaItemStyle}
                    className="criteria-item"
                  >
                    {editingCriteria[criteria.id] ? (
                      // Edit Mode
                      <div>
                        <div style={{ marginBottom: "12px" }}>
                          <input
                            type="text"
                            value={editingCriteria[criteria.id].title}
                            onChange={(e) =>
                              updateEditingCriteria(
                                criteria.id,
                                "title",
                                e.target.value,
                              )
                            }
                            style={{ ...inputStyle, marginBottom: "8px" }}
                            className="input-focus"
                          />
                          <textarea
                            value={editingCriteria[criteria.id].description}
                            onChange={(e) =>
                              updateEditingCriteria(
                                criteria.id,
                                "description",
                                e.target.value,
                              )
                            }
                            style={textareaStyle}
                            className="input-focus"
                          />
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => saveEditing(criteria.id)}
                            style={{
                              ...buttonSecondaryStyle,
                              backgroundColor: "#10B981",
                              color: "#FFFFFF",
                              border: "none",
                            }}
                          >
                            <Save size={14} />
                            Save
                          </button>
                          <button
                            onClick={() => cancelEditing(criteria.id)}
                            style={{
                              ...buttonSecondaryStyle,
                              backgroundColor: "#6B7280",
                              color: "#FFFFFF",
                              border: "none",
                            }}
                          >
                            <X size={14} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "8px",
                          }}
                        >
                          <h5
                            style={{
                              color: "#111827",
                              margin: 0,
                              fontSize: "16px",
                              fontWeight: "600",
                              flex: 1,
                            }}
                          >
                            {criteria.title}
                          </h5>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              marginLeft: "12px",
                            }}
                          >
                            <button
                              onClick={() => startEditing(criteria)}
                              style={{
                                backgroundColor: "transparent",
                                color: "#06b6d4",
                                border: "none",
                                cursor: "pointer",
                                padding: "8px",
                                borderRadius: "50%",
                                transition: "all 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#ecfeff";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                              }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => removeCriteria(criteria.id)}
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
                                e.currentTarget.style.backgroundColor =
                                  "#FEE2E2";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <p
                          style={{
                            color: "#6b7280",
                            margin: 0,
                            fontSize: "14px",
                            lineHeight: "1.5",
                          }}
                        >
                          {criteria.description}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Info Box */}
            <div
              style={{
                backgroundColor: "#fef3c7",
                color: "#92400e",
                padding: "16px 20px",
                borderRadius: "12px",
                marginTop: "20px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                border: "2px solid #fbbf24",
              }}
            >
              <AlertCircle
                size={20}
                style={{ marginTop: "2px", flexShrink: 0 }}
              />
              <div style={{ fontSize: "14px" }}>
                <p style={{ margin: "0 0 8px 0", fontWeight: "600" }}>
                  Scoring Criteria Guidelines
                </p>
                <p style={{ margin: 0 }}>
                  These criteria will be used to evaluate candidates during
                  interviews. Each criteria will be scored on a 4-point scale
                  (1-Poor, 2-Fair, 3-Good, 4-Excellent). Define clear, specific
                  criteria that align with your role requirements for consistent
                  evaluation.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default RequirementsSection;
