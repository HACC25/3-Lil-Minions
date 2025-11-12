// components/BasicInformation.tsx
import React from "react";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { FormData, ColorScheme, ExpandedSections } from "./lib/types";

interface BasicInformationProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  expandedSections: ExpandedSections;
  toggleSection: (section: keyof ExpandedSections) => void;
  currentColors: ColorScheme;
  uploadProgress: number;
}

const BasicInformation: React.FC<BasicInformationProps> = ({
  formData,
  updateFormData,
  expandedSections,
  toggleSection,
}) => {
  //   const interviewTypes = [
  //     "General",
  //     "Technical",
  //     "Behavioral",
  //     "Leadership",
  //     "Sales",
  //     "Customer Service",
  //     "Engineering",
  //     "Design",
  //     "Marketing",
  //     "Product Management",
  //     "Data Science",
  //     "Finance",
  //     "HR",
  //     "Operations",
  //   ];

  return (
    <div className="mb-6 bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/60 transition-all">
      <div
        className="flex justify-between items-center mb-4 cursor-pointer select-none"
        onClick={() => toggleSection("basic")}
      >
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 m-0">
          <AlertCircle size={20} />
          Basic Information
          <span className="text-red-600 text-sm font-normal">(Required)</span>
        </h3>
        <div className="transition-transform duration-300">
          {expandedSections.basic ? (
            <ChevronUp size={20} className="text-gray-600" />
          ) : (
            <ChevronDown size={20} className="text-gray-600" />
          )}
        </div>
      </div>

      {expandedSections.basic && (
        <div className="space-y-5">
          {/* Agent Name */}
          <div>
            <label
              htmlFor="botName"
              className="block mb-2 font-medium text-gray-900 text-sm"
            >
              Agent Name
            </label>
            <input
              id="botName"
              type="text"
              value={formData.botName}
              onChange={(e) => updateFormData({ botName: e.target.value })}
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg text-base transition-all focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="e.g., Senior Developer Interview Bot"
              required
            />
          </div>

          {/* Agent Description */}
          <div>
            <label
              htmlFor="description"
              className="block mb-2 font-medium text-gray-900 text-sm"
            >
              Agent Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg text-base min-h-[120px] resize-vertical transition-all focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="Describe what this interview bot does and its purpose..."
              required
            />
          </div>

          {/* Interview Type */}
          {/* <div>
            <label
              htmlFor="interviewType"
              className="block mb-2 font-medium text-gray-900 text-sm"
            >
              Interview Type
            </label>
            <select
              id="interviewType"
              value={formData.interviewType}
              onChange={(e) =>
                updateFormData({ interviewType: e.target.value })
              }
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg text-base cursor-pointer transition-all focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              required
            >
              <option value="">Select interview type</option>
              {interviewTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div> */}
        </div>
      )}
    </div>
  );
};

export default BasicInformation;
