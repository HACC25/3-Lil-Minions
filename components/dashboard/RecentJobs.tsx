"use client";

import React from "react";
import { Card, CardBody, Chip, Button } from "@nextui-org/react";
import { MapPin, Clock, ArrowRight, Briefcase, Users } from "lucide-react";
import Link from "next/link";
import type { Job } from "@/types/job";
import { formatDate } from "@/lib/formatters";
import { frostedGlassBg } from "@/utils/styles";
import { cn } from "@/utils/styles";
interface RecentJobsProps {
  jobs: Job[];
  limit?: number;
}

export const RecentJobs: React.FC<RecentJobsProps> = ({ jobs, limit = 3 }) => {
  const getStatusColor = (status: Job["status"]) => {
    switch (status) {
      case "active":
        return "success";
      case "draft":
        return "warning";
      case "closed":
        return "default";
      default:
        return "default";
    }
  };

  const recentJobs = jobs.slice(0, limit);

  // Empty state
  if (jobs.length === 0) {
    return (
      <Card className={cn(frostedGlassBg)}>
        <CardBody className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Briefcase size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No job postings yet
            </h3>
            <p className="text-gray-500 mb-4 max-w-sm">
              Start attracting top talent by posting your first job opening.
            </p>
            <Button
              as={Link}
              href="/dashboard/companies/jobs/create"
              className="bg-black text-white hover:bg-black/85 h-9 rounded-lg font-medium text-sm normal-case"
            >
              Post Your First Job
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {recentJobs.map((job) => (
        <Link
          key={job.id}
          href={`/dashboard/companies/jobs/${job.id}`}
          className="block"
        >
          <Card
            className={cn(
              frostedGlassBg,
              "w-full border border-white/10 hover:scale-[1.005] ease-in-out duration-300 cursor-pointer",
            )}
          >
            <CardBody className="p-5">
              <div className="flex items-start justify-between">
                {/* Job Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {job.title}
                    </h3>
                    <Chip
                      size="sm"
                      color={getStatusColor(job.status)}
                      variant="flat"
                      className={`px-3 text-white text-base capitalize flex-shrink-0 ${
                        job.status === "draft"
                          ? "bg-orange-700"
                          : job.status === "active"
                            ? "bg-green-700"
                            : ""
                      }`}
                    >
                      {job.status}
                    </Chip>
                  </div>

                  {/* Job Meta */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-900 mb-3">
                    {job.location && (
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span>{job.location}</span>
                      </div>
                    )}
                    {job.type && (
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{job.type}</span>
                      </div>
                    )}
                    {job.postedDate && (
                      <div className="flex items-center gap-1">
                        <span>Posted {formatDate(job.postedDate)}</span>
                      </div>
                    )}
                  </div>

                  {/* Applicants */}
                  {job.applicants !== undefined && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Users size={14} className="text-gray-900" />
                      <span className="text-gray-700 font-medium">
                        {job.applicants} applicant
                        {job.applicants !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* Arrow Icon */}
                <div className="flex-shrink-0 text-gray-800">
                  <ArrowRight size={18} />
                </div>
              </div>
            </CardBody>
          </Card>
        </Link>
      ))}

      {/* View All Button */}
      {jobs.length > limit && (
        <div className="pt-2">
          <Button
            as={Link}
            href="/dashboard/companies/jobs"
            variant="light"
            className="w-full text-gray-00 hover:text-gray-900 font-medium"
            endContent={<ArrowRight size={16} />}
          >
            View All Jobs ({jobs.length})
          </Button>
        </div>
      )}
    </div>
  );
};
