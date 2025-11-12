"use client";

import { Card, CardBody } from "@nextui-org/react";

interface EducationItem {
  degree: string;
  major?: string;
  institutionName: string;
  graduationDate?: string;
  graduated?: boolean;
}

interface EducationSectionProps {
  education: EducationItem[];
}

export function EducationSection({ education }: EducationSectionProps) {
  return (
    <Card className="bg-white/50 rounded-md backdrop-blur-md border border-white/30">
      <CardBody className="p-6">
        <h3 className="text-lg font-semibold text-black mb-4">Education</h3>
        {!education || education.length === 0 ? (
          <p className="text-sm text-black/70 italic">
            No education history provided. Check resume for details.
          </p>
        ) : (
          <div className="space-y-4">
            {education.map((edu, i) => (
              <div key={i} className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-black">
                    {edu.degree} {edu.major ? `in ${edu.major}` : ""}
                  </h4>
                  <p className="text-black/70">{edu.institutionName}</p>
                </div>
                <div className="text-right">
                  {edu.graduationDate && (
                    <p className="text-sm text-black font-medium">
                      {edu.graduationDate}
                    </p>
                  )}
                  {edu.graduated !== undefined && (
                    <span className="text-xs px-2 py-1 bg-white/30 text-black font-medium rounded border border-white/30">
                      {edu.graduated ? "Graduated" : "In Progress"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
