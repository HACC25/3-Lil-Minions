"use client";

import { Card, CardBody } from "@nextui-org/react";

interface WorkHistoryItem {
  jobTitle: string;
  employerName: string;
  startDate: string;
  endDate?: string;
  stillEmployed: boolean;
  hoursPerWeek?: number;
  duties?: string;
}

interface WorkExperienceSectionProps {
  workHistory: WorkHistoryItem[];
}

export function WorkExperienceSection({
  workHistory,
}: WorkExperienceSectionProps) {
  return (
    <Card className="bg-white/50  rounded-md backdrop-blur-md border border-white/30">
      <CardBody className="p-6">
        <h3 className="text-lg font-semibold text-black mb-4">
          Work Experience
        </h3>
        {!workHistory || workHistory.length === 0 ? (
          <p className="text-sm text-black/70 italic">
            No work experience provided. Check resume for details.
          </p>
        ) : (
          <div className="space-y-6">
            {workHistory.map((work, i) => (
              <div
                key={i}
                className="pb-6 border-b border-white/20 last:border-0 last:pb-0"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-black">
                      {work.jobTitle}
                    </h4>
                    <p className="text-black/70">{work.employerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-black font-medium">
                      {work.startDate} -{" "}
                      {work.stillEmployed ? "Present" : work.endDate}
                    </p>
                    {work.hoursPerWeek && (
                      <p className="text-xs text-black/70">
                        {work.hoursPerWeek} hrs/week
                      </p>
                    )}
                  </div>
                </div>
                {work.duties && (
                  <p className="text-sm text-black">{work.duties}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
