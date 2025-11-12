"use client";

import { Card, CardBody } from "@nextui-org/react";
import type { FitScoreBreakdown } from "@/types/application";

interface FitScoreSectionProps {
  fitScore: number;
  fitBreakdown: FitScoreBreakdown;
}

export function FitScoreSection({
  fitScore,
  fitBreakdown,
}: FitScoreSectionProps) {
  if (fitScore === undefined || fitScore === null) {
    return null;
  }

  return (
    <Card className="mb-6 bg-white/45 rounded-md backdrop-blur-md border border-white/30">
      <CardBody className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-black/70 mb-2">Overall Fit Score</p>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold text-black">{fitScore}%</span>
              <span className="text-lg text-black font-medium">
                {fitScore >= 80
                  ? "Strong Match"
                  : fitScore >= 60
                    ? "Good Match"
                    : "Moderate Match"}
              </span>
            </div>
          </div>

          {fitBreakdown.componentScores && (
            <div className="flex gap-8">
              {fitBreakdown.componentScores.relevanceScore !== undefined && (
                <div>
                  <p className="text-sm text-black/70 mb-1">Career Relevance</p>
                  <p className="text-2xl font-bold text-black">
                    {fitBreakdown.componentScores.relevanceScore}%
                  </p>
                </div>
              )}
              {fitBreakdown.componentScores.qualificationScore !==
                undefined && (
                <div>
                  <p className="text-sm text-black/70 mb-1">Skills Fit</p>
                  <p className="text-2xl font-bold text-black">
                    {fitBreakdown.componentScores.qualificationScore}%
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {(fitBreakdown.skillsMatched?.length > 0 ||
          fitBreakdown.skillsMissing?.length > 0) && (
          <div className="pt-6 border-t border-white">
            <div className="grid grid-cols-2 gap-6">
              {fitBreakdown.skillsMatched?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-black mb-3">
                    Skills Matched ({fitBreakdown.skillsMatched.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {fitBreakdown.skillsMatched.map(
                      (skill: string, i: number) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-white/30 text-black font-medium text-sm rounded-md border border-white/30"
                        >
                          {skill}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}
              {fitBreakdown.skillsMissing?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-black mb-3">
                    Skills Missing ({fitBreakdown.skillsMissing.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {fitBreakdown.skillsMissing.map(
                      (skill: string, i: number) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-white/30 text-black/70 text-sm rounded-md border border-white/30"
                        >
                          {skill}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
