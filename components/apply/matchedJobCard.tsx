"use client";

import { Card, CardBody } from "@nextui-org/react";
import { MapPin, DollarSign, Clock, Briefcase, Pencil } from "lucide-react";
import Link from "next/link";
import type { JobMatchResult } from "@/utils/matching/types";
import { formatDate } from "@/lib/formatters";
import { frostedGlassBg, cn } from "@/utils/styles";

interface MatchedJobCardProps {
  match: JobMatchResult;
  showMatchScore?: boolean;
}

export default function MatchedJobCard({
  match,
  showMatchScore = true,
}: MatchedJobCardProps) {
  const { job, matchScore, reasoning, recommendation } = match;

  // Convert Firestore Timestamp to ISO string if needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getDateValue = (date: any) => {
    if (!date) return null;

    // Handle Firestore Timestamp with _seconds property
    if (date._seconds) {
      return new Date(date._seconds * 1000).toISOString();
    }

    // Handle Firestore Timestamp with seconds property
    if (date.seconds) {
      return new Date(date.seconds * 1000).toISOString();
    }

    // Already a string or Date
    return date;
  };

  const displayDate =
    getDateValue(job.openingDate) || getDateValue(job.createdAt);

  // Determine match display based on recommendation
  const getMatchDisplay = () => {
    if (recommendation === "strong-match") {
      return {
        label: "STRONG MATCH",
        bgColor:
          "bg-gradient-to-br from-emerald-600/90 to-emerald-700/90 backdrop-blur-md",
        ringColor: "stroke-emerald-200",
        textColor: "text-emerald-50",
        badgeColor: "text-emerald-100",
      };
    } else if (recommendation === "good-match") {
      return {
        label: "GOOD MATCH",
        bgColor:
          "bg-gradient-to-br from-blue-600/90 to-blue-700/90 backdrop-blur-md",
        ringColor: "stroke-blue-200",
        textColor: "text-blue-50",
        badgeColor: "text-blue-100",
      };
    } else if (recommendation === "possible-match") {
      return {
        label: "POSSIBLE MATCH",
        bgColor:
          "bg-gradient-to-br from-slate-600/90 to-slate-700/90 backdrop-blur-md",
        ringColor: "stroke-slate-200",
        textColor: "text-slate-50",
        badgeColor: "text-slate-100",
      };
    } else {
      return {
        label: "MATCH",
        bgColor:
          "bg-gradient-to-br from-gray-600/90 to-gray-700/90 backdrop-blur-md",
        ringColor: "stroke-gray-200",
        textColor: "text-gray-50",
        badgeColor: "text-gray-100",
      };
    }
  };

  const matchDisplay = getMatchDisplay();

  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <Card
        className={cn(
          frostedGlassBg,
          "border bg-white/45 border-white/10 hover:shadow-sm transition-all duration-300 hover:scale-[1.01] rounded-lg cursor-pointer",
        )}
      >
        <CardBody className="p-0">
          <div className="flex">
            {/* Left side - Job Details */}
            <div className="flex-1 p-6 flex flex-col">
              {/* Department & Match Reason */}
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                {job.department && (
                  <span className="px-3 py-1 bg-blue-500/40 text-black text-xs font-semibold rounded-full backdrop-blur-sm">
                    {job.department}
                  </span>
                )}
              </div>

              {/* Job Title */}
              <h3 className="text-2xl font-bold text-black mb-2  transition-colors cursor-pointer">
                {job.title}
              </h3>

              {/* Match Reason */}
              <p className="text-sm text-black font-medium mb-4">{reasoning}</p>

              {/* Position Number */}
              {job.positionNumber && (
                <p className="text-black text-sm mb-4">
                  Position #{job.positionNumber}
                </p>
              )}

              {/* Job Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {job.location && (
                  <div className="flex items-center gap-2 text-sm text-black">
                    <MapPin size={16} className="text-black flex-shrink-0" />
                    <span className="truncate">
                      {job.location}
                      {job.island && ` • ${job.island}`}
                    </span>
                  </div>
                )}

                {job.employmentType && (
                  <div className="flex items-center gap-2 text-sm text-black">
                    <Clock size={16} className="text-black flex-shrink-0" />
                    <span>{job.employmentType}</span>
                  </div>
                )}

                {job.type && (
                  <div className="flex items-center gap-2 text-sm text-black">
                    <Briefcase size={16} className="text-black flex-shrink-0" />
                    <span>{job.type}</span>
                  </div>
                )}

                {job.salaryRange && (
                  <div className="flex items-center gap-2 text-sm text-black">
                    <DollarSign
                      size={16}
                      className="text-black flex-shrink-0"
                    />
                    <span className="truncate">
                      ${job.salaryRange.min.toLocaleString()} - $
                      {job.salaryRange.max.toLocaleString()} /{" "}
                      {job.salaryRange.frequency}
                    </span>
                  </div>
                )}
              </div>

              {/* Job Description Preview */}
              {job.description && (
                <p className="text-sm text-black line-clamp-2 mb-4">
                  {job.description}
                </p>
              )}

              {/* Footer Info */}
              <div className="pt-4 mt-auto">
                <div className="flex items-center gap-4 text-xs text-black">
                  <span>Posted {formatDate(displayDate, "full")}</span>
                  {job.positionCount && job.positionCount > 1 && (
                    <span className="text-black font-medium">
                      {job.positionCount} openings
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Match Score */}
            {showMatchScore && (
              <div className="w-44 flex flex-col items-center justify-center px-6 mr-6 rounded-lg">
                {/* Circular Progress */}
                <div className="relative w-32 h-32 mb-4">
                  <svg
                    className="w-full h-full transform -rotate-90"
                    viewBox="0 0 120 120"
                  >
                    {/* Background circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="8"
                      fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      className={matchDisplay.ringColor}
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(matchScore / 100) * 339.292} 339.292`}
                      strokeLinecap="round"
                      style={{
                        transition: "stroke-dasharray 1s ease-out",
                      }}
                    />
                  </svg>

                  {/* Score Text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-4xl font-bold text-black">
                        {matchScore}
                      </span>
                      <span className="text-xl text-black">%</span>
                    </div>
                  </div>
                </div>

                {/* Match Label */}
                <div
                  className={`${matchDisplay.textColor} text-center font-bold text-sm tracking-wide mb-2`}
                >
                  {matchDisplay.label}
                </div>

                {/* Additional Badge */}
                {matchScore >= 90 && (
                  <div
                    className={`mt-2 text-xs ${matchDisplay.badgeColor} font-medium flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm`}
                  >
                    <span className="text-lg">✓</span>
                    Top Interest
                  </div>
                )}

                {matchScore >= 85 && matchScore < 90 && (
                  <div
                    className={`mt-2 text-xs ${matchDisplay.badgeColor} font-medium bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm`}
                  >
                    Highly Recommended
                  </div>
                )}

                {/* Apply Now Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = `/jobs/${job.id}`;
                  }}
                  className="mt-6 items-center px-6 py-2 w-fit flex cursor-pointer bg-white/40 hover:bg-white text-gray-900 font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md "
                >
                  <Pencil size={18} className="inline mr-2" />
                  <span className="whitespace-nowrap">Apply Now</span>
                </button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
