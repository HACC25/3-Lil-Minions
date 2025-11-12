// components/BotPersonality.tsx
import React from "react";
import { Brain, ChevronDown, ChevronUp, Info } from "lucide-react";
import { FormData, ColorScheme, ExpandedSections } from "./lib/types";

interface BotPersonalityProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  expandedSections: ExpandedSections;
  toggleSection: (section: keyof ExpandedSections) => void;
  currentColors: ColorScheme;
}

const BotPersonality: React.FC<BotPersonalityProps> = ({
  formData,
  updateFormData,
  expandedSections,
  toggleSection,
}) => {
  return (
    <div className="mb-6 bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/60 transition-all">
      <div
        className="flex justify-between items-center mb-4 cursor-pointer select-none"
        onClick={() => toggleSection("personality")}
      >
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 m-0">
          <Brain size={20} />
          Agent Personality & Behavior
          <span className="text-red-600 text-sm font-normal">(Required)</span>
        </h3>
        <div className="transition-transform duration-300">
          {expandedSections.personality ? (
            <ChevronUp size={20} className="text-gray-600" />
          ) : (
            <ChevronDown size={20} className="text-gray-600" />
          )}
        </div>
      </div>

      {expandedSections.personality && (
        <div>
          {/* Info Box */}
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-5 flex gap-3 items-start">
            <Info size={16} className="text-cyan-600 flex-shrink-0 mt-0.5" />
            <p className="m-0 text-sm text-cyan-900">
              Define how your agent should interact with candidates. This helps
              create a consistent interview experience that matches your company
              culture.
            </p>
          </div>

          {/* Personality Prompt */}
          <div>
            <label
              htmlFor="botPersonality"
              className="block mb-2 font-medium text-gray-900 text-sm"
            >
              Agent Personality Prompt
            </label>
            <textarea
              id="botPersonality"
              value={formData.botPersonality}
              onChange={(e) =>
                updateFormData({ botPersonality: e.target.value })
              }
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg text-base min-h-[120px] resize-vertical transition-all focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="Example: Be professional but friendly, ask follow-up questions to understand the candidate's thought process, provide encouragement when appropriate, focus on problem-solving approach rather than just correct answers..."
              required
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BotPersonality;
