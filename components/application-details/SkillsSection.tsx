"use client";

import { useState } from "react";
import { Card, CardBody } from "@nextui-org/react";
import { ChevronDown } from "lucide-react";

interface Skill {
  name: string;
  level?: string;
  experience?: string;
  experienceMonths?: string;
}

interface SkillsSectionProps {
  skills: Skill[];
}

export function SkillsSection({ skills }: SkillsSectionProps) {
  const [showAllSkills, setShowAllSkills] = useState(false);

  return (
    <Card className="bg-white/50 rounded-md backdrop-blur-md border border-white/30">
      <CardBody className="p-6">
        <h3 className="text-lg font-semibold text-black mb-4">
          Skills & Proficiency
        </h3>
        {!skills || skills.length === 0 ? (
          <p className="text-sm text-black/70 italic">
            No skills listed. Review resume for candidate qualifications.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {(showAllSkills ? skills : skills.slice(0, 4)).map((skill, i) => (
                <div key={i} className="border border-white/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-black">{skill.name}</p>
                    {skill.level && (
                      <span className="text-xs px-2 py-1 bg-white/30 text-black font-medium rounded border border-white/30">
                        {skill.level}
                      </span>
                    )}
                  </div>
                  {(skill.experience || skill.experienceMonths) && (
                    <p className="text-xs text-black/70">
                      {skill.experience && `${skill.experience} years`}
                      {skill.experience && skill.experienceMonths && " "}
                      {skill.experienceMonths &&
                        `${skill.experienceMonths} months`}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {skills.length > 4 && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setShowAllSkills(!showAllSkills)}
                  className="flex items-center gap-2 text-sm font-medium text-black/70 hover:text-black transition-colors group"
                >
                  <span>
                    {showAllSkills
                      ? "Show less"
                      : `Show ${skills.length - 4} more skills`}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${showAllSkills ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
