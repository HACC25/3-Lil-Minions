"use client";

import React from "react";
import { cn } from "@/utils/styles";
import { Card, CardBody, Chip, Button, Tooltip } from "@nextui-org/react";
import {
  MapPin,
  DollarSign,
  Clock,
  Eye,
  Edit,
  Trash2,
  Briefcase,
  Users,
  Bot,
} from "lucide-react";
import type { Job } from "@/types/job";
import { formatDate, formatSalary } from "@/lib/formatters";
import { frostedGlassBg } from "@/utils/styles";

interface JobsListProps {
  jobs: Job[];
  onCreateJob: () => void;
  onEditJob?: (jobId: string) => void;
  onViewJob?: (jobId: string) => void;
  onDeleteJob?: (jobId: string) => void;
  onViewApplicants?: (jobId: string) => void;
  onEditInterviewBot?: (jobId: string) => void;
}

export const JobsList: React.FC<JobsListProps> = ({
  jobs,
  onCreateJob,
  onEditJob,
  onViewJob,
  onDeleteJob,
  onViewApplicants,
  onEditInterviewBot,
}) => {
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

  // Empty state
  if (jobs.length === 0) {
    return (
      <div
        className={cn(
          frostedGlassBg,
          "flex flex-col items-center justify-center py-16 px-4",
        )}
      >
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Briefcase size={40} className="text-black" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No job postings yet
        </h3>
        <p className="text-black mb-6 text-center max-w-md">
          Get started by creating your first job posting. Attract top talent and
          grow your team.
        </p>
        <Button
          onPress={onCreateJob}
          className="bg-black text-white hover:bg-black/85 h-9 rounded-lg font-medium text-sm normal-case px-6"
        >
          Create Your First Job
        </Button>
      </div>
    );
  }

  // Jobs list
  return (
    <div className={"space-y-4"}>
      {jobs.map((job) => (
        <Card
          key={job.id}
          className={cn(
            frostedGlassBg,
            "border hover:scale-[1.005]  ease-in-out duration-300 border-white/20",
          )}
        >
          <CardBody className="p-6 cursor-auto">
            <div className="flex items-start justify-between">
              {/* Left side - Job info */}
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {job.title}
                      </h3>
                      <Chip
                        size="sm"
                        color={getStatusColor(job.status)}
                        variant="flat"
                        className={cn(
                          "capitalize p-3 text-base text-white",
                          job.status === "draft" && " bg-red-900/60",
                          job.status === "active" && " bg-green-800/80",
                        )}
                      >
                        {job.status}
                      </Chip>
                    </div>
                    {job.description && (
                      <p className="text-black text-sm mb-3 line-clamp-2">
                        {job.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Job details */}
                <div className="flex flex-wrap gap-4 text-sm text-black">
                  {job.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={16} />
                      <span>{job.location}</span>
                    </div>
                  )}
                  {formatSalary(job.salary) && (
                    <div className="flex items-center gap-1.5">
                      <DollarSign size={16} />
                      <span>{formatSalary(job.salary)}</span>
                    </div>
                  )}
                  {job.type && (
                    <div className="flex items-center gap-1.5">
                      <Clock size={16} />
                      <span>{job.type}</span>
                    </div>
                  )}
                  {(job.postedDate || job.createdAt) && (
                    <div className="flex items-center gap-1.5">
                      <span>
                        {job.status === "draft" ? "Created" : "Posted"}{" "}
                        {formatDate(job.postedDate || job.createdAt)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Applicants count */}
                {job.applicants !== undefined && (
                  <div className="mt-3 text-sm">
                    <span className="font-medium text-black">
                      {job.applicants} applicant
                      {job.applicants !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Right side - Actions */}
              <div className="flex gap-2 ml-4">
                {onEditInterviewBot && (
                  <Tooltip
                    content={
                      job.interviewBotId
                        ? "Edit Interview Agent"
                        : "Create Interview Agent"
                    }
                    className="px-3 text-sm rounded-full bg-white"
                    classNames={{
                      content: "text-black",
                    }}
                  >
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onEditInterviewBot(job.id)}
                      className={cn(
                        "rounded-md cursor-pointer transition-colors",
                        job.interviewBotId
                          ? "text-black hover:bg-purple-600/20 hover:text-purple-700"
                          : "text-black hover:bg-cyan-600/20 hover:text-cyan-700",
                      )}
                    >
                      <Bot size={18} />
                    </Button>
                  </Tooltip>
                )}
                {onViewApplicants && (
                  <Tooltip
                    content="View Applicants"
                    className="px-3 text-sm rounded-full bg-white"
                    classNames={{
                      content: "text-black",
                    }}
                  >
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onViewApplicants(job.id)}
                      className="text-black hover:bg-black/10 rounded-md cursor-pointer hover:text-white transition-colors"
                    >
                      <Users size={18} />
                    </Button>
                  </Tooltip>
                )}
                {onViewJob && (
                  <Tooltip
                    className="px-3 text-sm rounded-full bg-white"
                    classNames={{
                      content: "text-black",
                    }}
                    content="View Job Details"
                  >
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onViewJob(job.id)}
                      className="text-black hover:bg-black/10 rounded-md cursor-pointer hover:text-white transition-colors"
                    >
                      <Eye size={18} />
                    </Button>
                  </Tooltip>
                )}
                {onEditJob && (
                  <Tooltip
                    className="px-3 text-sm rounded-full bg-white"
                    classNames={{
                      content: "text-black",
                    }}
                    content="Edit Job"
                  >
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onEditJob(job.id)}
                      className="text-black hover:bg-black/10 rounded-md cursor-pointer hover:text-white transition-colors"
                    >
                      <Edit size={18} />
                    </Button>
                  </Tooltip>
                )}
                {onDeleteJob && (
                  <Tooltip
                    className="px-3 text-sm rounded-full bg-white"
                    classNames={{
                      content: "text-black",
                    }}
                    content="Delete Job"
                  >
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onDeleteJob(job.id)}
                      className="text-black  hover:bg-red-600/20 hover:text-red-900 rounded-md cursor-pointer transition-colors"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </Tooltip>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};
