// components/CompanyRoleInfo.tsx
import React from "react";
import { Briefcase, ChevronDown, ChevronUp } from "lucide-react";
import { FormData, ColorScheme, ExpandedSections } from "./lib/types";

interface CompanyRoleInfoProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  expandedSections: ExpandedSections;
  toggleSection: (section: keyof ExpandedSections) => void;
  currentColors: ColorScheme;
}

const CompanyRoleInfo: React.FC<CompanyRoleInfoProps> = ({
  formData,
  updateFormData,
  expandedSections,
  toggleSection,
}) => {
  return (
    <div className="mb-6 bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/60 transition-all">
      <div
        className="flex justify-between items-center mb-4 cursor-pointer select-none"
        onClick={() => toggleSection("company")}
      >
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 m-0">
          <Briefcase size={20} />
          Company & Role Information
          <span className="text-red-600 text-sm font-normal">(Required)</span>
        </h3>
        <div className="transition-transform duration-300">
          {expandedSections.company ? (
            <ChevronUp size={20} className="text-gray-600" />
          ) : (
            <ChevronDown size={20} className="text-gray-600" />
          )}
        </div>
      </div>

      {expandedSections.company && (
        <div className="space-y-5">
          {/* Company Description */}
          <div>
            <label
              htmlFor="companyDescription"
              className="block mb-2 font-medium text-gray-900 text-sm"
            >
              Company Description
            </label>
            <textarea
              id="companyDescription"
              value={formData.companyDescription}
              onChange={(e) =>
                updateFormData({ companyDescription: e.target.value })
              }
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg text-base min-h-[120px] resize-vertical transition-all focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="Describe your company, its mission, values, and culture..."
              required
            />
          </div>

          {/* Job Role Description */}
          <div>
            <label
              htmlFor="jobRoleDescription"
              className="block mb-2 font-medium text-gray-900 text-sm"
            >
              Job Role Description
            </label>
            <textarea
              id="jobRoleDescription"
              value={formData.jobRoleDescription}
              onChange={(e) =>
                updateFormData({ jobRoleDescription: e.target.value })
              }
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg text-base min-h-[120px] resize-vertical transition-all focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="Describe the specific role, responsibilities, and requirements..."
              required
            />
          </div>

          {/* Salary Range */}
          <div>
            <label
              htmlFor="salary"
              className="block mb-2 font-medium text-gray-900 text-sm"
            >
              Salary Range (Optional)
            </label>
            <input
              id="salary"
              type="text"
              value={formData.salary}
              onChange={(e) => updateFormData({ salary: e.target.value })}
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg text-base transition-all focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="e.g., $80,000 - $120,000 per year"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyRoleInfo;
