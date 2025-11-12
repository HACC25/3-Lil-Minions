"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardBody,
  Button,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Video,
  Send,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import {
  formatRelativeDate,
  formatApplicationStatus,
  getApplicationStatusColor,
} from "@/lib/formatters";
import { logger } from "@/lib/logger";
import type { Application, ApplicationStatus } from "@/types/application";
import { useJob } from "@/hooks/useJob";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard";
import { LoadingCard } from "@/app/jobs/company/[companyId]/page";

function ApplicantsPageContent() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const { user } = useAuth();

  const { job, loading: jobLoading } = useJob(jobId);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [requirementsFilter, setRequirementsFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("score");
  const [eligibilityMap, setEligibilityMap] = useState<Record<string, boolean>>(
    {},
  );
  const [sendingInterview, setSendingInterview] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [selectedApplicants, setSelectedApplicants] = useState<Set<string>>(
    new Set(),
  );
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid && jobId) {
      fetchApplications();
    }
  }, [user, jobId]);

  useEffect(() => {
    if (applications.length > 0) {
      fetchEligibilityStatus();
    }
  }, [applications]);

  const fetchEligibilityStatus = async () => {
    try {
      const eligibilityPromises = applications.map(async (app) => {
        const response = await fetch(`/api/applications/${app.id}`);
        const data = await response.json();
        return {
          id: app.id,
          eligible: data.application?.eligibleForSecondRound || false,
        };
      });

      const results = await Promise.all(eligibilityPromises);
      const newEligibilityMap: Record<string, boolean> = {};
      results.forEach((result) => {
        newEligibilityMap[result.id] = result.eligible;
      });
      setEligibilityMap(newEligibilityMap);
    } catch (error) {
      logger.error("Error fetching eligibility status:", error);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        companyId: user!.uid,
        jobId: jobId,
        limit: "100",
      });

      const url = `/api/applications?${params}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setApplications(data.applications);
        logger.info("Applications loaded:", data.applications.length);
      } else {
        logger.error("API returned error:", data.error);
      }
    } catch (error) {
      logger.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInterview = async (
    applicationId: string,
    applicantName: string,
  ) => {
    try {
      setSendingInterview(applicationId);

      const response = await fetch(
        `/api/applications/${applicationId}/send-interview`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (data.success) {
        setNotification({
          type: "success",
          message:
            data.message || `Interview invitation sent to ${applicantName}`,
        });
        // Refresh applications to update any tracking fields
        await fetchApplications();
        // Auto-hide notification after 5 seconds
        setTimeout(() => setNotification(null), 5000);
      } else {
        setNotification({
          type: "error",
          message: data.error || "Failed to send invitation. Please try again.",
        });
        // Auto-hide error after 7 seconds
        setTimeout(() => setNotification(null), 7000);
      }
    } catch (error) {
      logger.error("Error sending interview invitation:", error);
      setNotification({
        type: "error",
        message: "An unexpected error occurred. Please try again.",
      });
      setTimeout(() => setNotification(null), 7000);
    } finally {
      setSendingInterview(null);
    }
  };

  const handleSelectApplicant = (applicationId: string) => {
    setSelectedApplicants((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(applicationId)) {
        newSet.delete(applicationId);
      } else {
        newSet.add(applicationId);
      }
      return newSet;
    });
  };

  const toggleExpandRow = (applicationId: string) => {
    setExpandedRow((prev) => (prev === applicationId ? null : applicationId));
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setScoreFilter("all");
    setRequirementsFilter("all");
    setSortBy("score");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "all" ||
    scoreFilter !== "all" ||
    requirementsFilter !== "all" ||
    sortBy !== "score";

  // Filter and sort applications
  const filteredApplications = applications
    .filter((app) => {
      const matchesSearch =
        searchQuery === "" ||
        app.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || app.status === statusFilter;

      const matchesScore =
        scoreFilter === "all" ||
        (scoreFilter === "high" && (app.fitScore ?? 0) >= 80) ||
        (scoreFilter === "medium" &&
          (app.fitScore ?? 0) >= 60 &&
          (app.fitScore ?? 0) < 80) ||
        (scoreFilter === "low" && (app.fitScore ?? 0) < 60);

      const matchesRequirements =
        requirementsFilter === "all" ||
        (requirementsFilter === "met" && eligibilityMap[app.id]) ||
        (requirementsFilter === "not-met" && !eligibilityMap[app.id]);

      return (
        matchesSearch && matchesStatus && matchesScore && matchesRequirements
      );
    })
    .sort((a, b) => {
      if (sortBy === "score") {
        // Sort by fit score: highest to lowest
        const scoreA = a.fitScore ?? -1;
        const scoreB = b.fitScore ?? -1;
        return scoreB - scoreA;
      } else if (sortBy === "recent") {
        // Sort by most recent: newest to oldest
        const dateA = new Date(a.appliedAt).getTime();
        const dateB = new Date(b.appliedAt).getTime();
        return dateB - dateA;
      }
      return 0;
    });

  const handleSelectAll = () => {
    const currentFilteredIds = filteredApplications.map((app) => app.id);
    const allSelected = currentFilteredIds.every((id) =>
      selectedApplicants.has(id),
    );

    if (allSelected) {
      setSelectedApplicants((prev) => {
        const newSet = new Set(prev);
        currentFilteredIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } else {
      setSelectedApplicants((prev) => {
        const newSet = new Set(prev);
        currentFilteredIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (bulkUpdating) return;

    try {
      setBulkUpdating(true);
      const selectedIds = Array.from(selectedApplicants);

      // Update all selected applications
      const updatePromises = selectedIds.map(async (applicationId) => {
        const response = await fetch(`/api/applications/${applicationId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update ${applicationId}`);
        }

        return response.json();
      });

      const results = await Promise.allSettled(updatePromises);
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (failed > 0) {
        setNotification({
          type: "error",
          message: `Updated ${succeeded} application(s). ${failed} failed to update.`,
        });
        setTimeout(() => setNotification(null), 7000);
      } else {
        setNotification({
          type: "success",
          message: `Successfully updated ${succeeded} application(s) to ${newStatus}`,
        });
        setTimeout(() => setNotification(null), 5000);
      }

      // Refresh applications and clear selection
      await fetchApplications();
      setSelectedApplicants(new Set());
    } catch (error) {
      logger.error("Error updating application statuses:", error);
      setNotification({
        type: "error",
        message: "Failed to update application statuses. Please try again.",
      });
      setTimeout(() => setNotification(null), 7000);
    } finally {
      setBulkUpdating(false);
    }
  };

  if (loading || jobLoading) {
    return <LoadingCard desc="Loading applicants, please wait..." />;
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-red-600">Job not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Back button and Header */}
        <div className="mb-6">
          <Button
            variant="light"
            startContent={<ArrowLeft size={16} />}
            onPress={() => router.push("/dashboard/companies/jobs")}
            className="mb-4 cursor-pointer text-black/80 hover:text-black -ml-2"
          >
            Back to Jobs
          </Button>
          <h1 className="text-3xl font-bold text-black">{job.title}</h1>
          <p className="text-black/80 mt-1">
            Manage applications for this job posting
          </p>
        </div>

        {/* Notification */}
        {notification && (
          <Card
            className={`mb-6 ${
              notification.type === "success"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            } border-2`}
          >
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      notification.type === "success"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  <p
                    className={`text-sm font-medium ${
                      notification.type === "success"
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {notification.message}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => setNotification(null)}
                  className={
                    notification.type === "success"
                      ? "text-green-800"
                      : "text-red-800"
                  }
                >
                  ✕
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Filters */}
        <div className="flex gap-4 flex-wrap mb-6">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              classNames={{
                input: "text-sm text-black",
                inputWrapper: "h-10 bg-white/30 rounded-lg border-white/30",
              }}
            />
          </div>

          {/* Status Filter */}
          <div className="w-48">
            <Dropdown
              classNames={{
                content: "rounded-md bg-white",
              }}
            >
              <DropdownTrigger>
                <Button
                  variant="flat"
                  className="w-full rounded-md h-10 justify-between text-sm text-black bg-white/10 border border-white/30 font-medium"
                  endContent={<ChevronDown className="w-4 h-4 text-black" />}
                >
                  {statusFilter === "all"
                    ? "All Status"
                    : statusFilter === "pending"
                      ? "Pending"
                      : statusFilter === "reviewing"
                        ? "Reviewing"
                        : statusFilter === "accepted"
                          ? "Accepted"
                          : "Rejected"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Status filter"
                selectedKeys={[statusFilter]}
                selectionMode="single"
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setStatusFilter(selected);
                }}
              >
                <DropdownItem
                  key="all"
                  className="text-black hover:bg-gray-100 text-sm transition-all duration-200"
                >
                  All Status
                </DropdownItem>
                <DropdownItem
                  key="pending"
                  className="text-black hover:bg-gray-100 text-sm transition-all duration-200"
                >
                  Pending
                </DropdownItem>
                <DropdownItem
                  key="reviewing"
                  className="text-black hover:bg-gray-100 text-sm transition-all duration-200"
                >
                  Reviewing
                </DropdownItem>
                <DropdownItem
                  key="accepted"
                  className="text-black hover:bg-gray-100 text-sm transition-all duration-200"
                >
                  Accepted
                </DropdownItem>
                <DropdownItem
                  key="rejected"
                  className="text-black hover:bg-gray-100 text-sm transition-all duration-200"
                >
                  Rejected
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          {/* Score Filter */}
          <div className="w-48">
            <Dropdown
              classNames={{
                content: "rounded-md bg-white",
              }}
            >
              <DropdownTrigger>
                <Button
                  variant="flat"
                  className="w-full rounded-md h-10 justify-between text-sm text-black bg-white/10 border border-white/30 font-medium"
                  endContent={<ChevronDown className="w-4 h-4 text-black" />}
                >
                  {scoreFilter === "all"
                    ? "All Scores"
                    : scoreFilter === "high"
                      ? "High (80%+)"
                      : scoreFilter === "medium"
                        ? "Medium (60-79%)"
                        : "Low (<60%)"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Score filter"
                selectedKeys={[scoreFilter]}
                selectionMode="single"
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setScoreFilter(selected);
                }}
              >
                <DropdownItem
                  key="all"
                  className="text-black hover:bg-gray-100 text-sm transition-all duration-200"
                >
                  All Scores
                </DropdownItem>
                <DropdownItem
                  key="high"
                  className="text-black hover:bg-gray-100 text-sm transition-all duration-200"
                >
                  High (80%+)
                </DropdownItem>
                <DropdownItem
                  key="medium"
                  className="text-black hover:bg-gray-100 text-sm transition-all duration-200"
                >
                  Medium (60-79%)
                </DropdownItem>
                <DropdownItem
                  key="low"
                  className="text-black hover:bg-gray-100 text-sm transition-all duration-200"
                >
                  Low (&lt;60%)
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          {/* Requirements Filter */}
          <div className="w-48">
            <Dropdown
              classNames={{
                content: "rounded-md bg-white",
              }}
            >
              <DropdownTrigger>
                <Button
                  variant="flat"
                  className="w-full h-10 rounded-md justify-between text-sm text-black bg-white/10 border border-white/30 font-medium"
                  endContent={<ChevronDown className="w-4 h-4 text-black" />}
                >
                  {requirementsFilter === "all"
                    ? "All Requirements"
                    : requirementsFilter === "met"
                      ? "Requirements Met"
                      : "Requirements Not Met"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Requirements filter"
                selectedKeys={[requirementsFilter]}
                selectionMode="single"
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setRequirementsFilter(selected);
                }}
              >
                <DropdownItem
                  key="all"
                  className="text-black hover:bg-gray-100 text-sm transition-all duration-200"
                >
                  All Requirements
                </DropdownItem>
                <DropdownItem
                  key="met"
                  className="text-black hover:bg-gray-100 text-sm transition-all duration-200"
                >
                  Requirements Met
                </DropdownItem>
                <DropdownItem
                  key="not-met"
                  className="text-black hover:bg-gray-100 text-sm transition-all duration-200"
                >
                  Requirements Not Met
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          {/* Sort By */}
          <div className="w-48">
            <Dropdown
              classNames={{
                content: "rounded-md bg-white",
              }}
            >
              <DropdownTrigger>
                <Button
                  variant="flat"
                  className="w-full h-10 rounded-md justify-between text-sm text-black bg-white/10 border border-white/30 font-medium"
                  endContent={<ChevronDown className="w-4 h-4 text-black" />}
                >
                  {sortBy === "score" ? "Sort by Score" : "Sort by Recent"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Sort by"
                selectedKeys={[sortBy]}
                selectionMode="single"
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setSortBy(selected);
                }}
              >
                <DropdownItem
                  key="score"
                  className="text-black hover:bg-gray-100 text-sm transition-all duration-200"
                >
                  Sort by Score
                </DropdownItem>
                <DropdownItem
                  key="recent"
                  className="text-black hover:bg-gray-100  text-sm transition-all duration-200"
                >
                  Sort by Recent
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-black">
              Showing {filteredApplications.length} of {applications.length}{" "}
              applicants
            </div>
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="light"
                onPress={handleResetFilters}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* Applications Table */}
        {filteredApplications.length === 0 ? (
          <Card className="bg-white/20 backdrop-blur-md border rounded-md border-white/30">
            <CardBody className="p-12 text-center">
              <p className="text-black">
                {applications.length === 0
                  ? "No applications yet. Applications will appear here once candidates apply to this job."
                  : "No applications match your filters."}
              </p>
            </CardBody>
          </Card>
        ) : (
          <Card className="bg-white/20 backdrop-blur-md border rounded-lg  border-white/30">
            <CardBody className="p-0">
              {/* Bulk Actions Bar */}
              {selectedApplicants.size > 0 && (
                <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedApplicants.size} selected
                    </span>
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => setSelectedApplicants(new Set())}
                      className="text-xs text-blue-700 hover:text-blue-900"
                    >
                      Deselect all
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <Dropdown>
                      <DropdownTrigger>
                        <Button
                          size="sm"
                          variant="flat"
                          className="text-xs text-black bg-white/10 hover:bg-white/20 border border-gray-900 font-medium"
                          endContent={
                            <ChevronDown className="w-3 h-3 text-black" />
                          }
                          isDisabled={bulkUpdating}
                        >
                          {bulkUpdating ? "Updating..." : "Change Status"}
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label="Bulk status change"
                        className="bg-white/60 backdrop-blur-md rounded-lg p-1 border border-white/30"
                        onAction={(key) =>
                          handleBulkStatusChange(key as string)
                        }
                      >
                        <DropdownItem
                          key="pending"
                          className="text-black hover:bg-white/40 text-sm"
                        >
                          Mark as Pending
                        </DropdownItem>
                        <DropdownItem
                          key="reviewing"
                          className="text-black hover:bg-white/40 text-sm"
                        >
                          Mark as Reviewing
                        </DropdownItem>
                        <DropdownItem
                          key="accepted"
                          className="text-black hover:bg-white/40 text-sm"
                        >
                          Mark as Accepted
                        </DropdownItem>
                        <DropdownItem
                          key="rejected"
                          className="text-black hover:bg-white/40 text-sm"
                        >
                          Mark as Rejected
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto ">
                <table className="w-full ">
                  <thead className="bg-white/30 border-b border-white/20">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            filteredApplications.length > 0 &&
                            selectedApplicants.size ===
                              filteredApplications.length
                          }
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        Applicant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        Fit Score
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
                        Min. Requirements
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        Applied
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        Resume
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                        Actions
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/30">
                    {filteredApplications.map((app) => (
                      <React.Fragment key={app.id}>
                        <tr
                          className="hover:bg-white/40 cursor-pointer bg-white/20 transition-colors"
                          onClick={() => toggleExpandRow(app.id)}
                        >
                          <td
                            className="px-6 py-4 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={selectedApplicants.has(app.id)}
                              onChange={() => handleSelectApplicant(app.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <div className="text-sm font-medium text-black">
                                {app.firstName} {app.lastName}
                              </div>
                              <div className="text-sm text-black/90">
                                {app.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getApplicationStatusColor(
                                app.status as ApplicationStatus,
                              )}`}
                            >
                              {formatApplicationStatus(
                                app.status as ApplicationStatus,
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {app.fitScore !== undefined &&
                            app.fitScore !== null ? (
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold ${
                                  app.fitScore >= 80
                                    ? "bg-green-100 text-green-800"
                                    : app.fitScore >= 60
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {app.fitScore}%
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {eligibilityMap[app.id] ? (
                              <div className="px-3 py-1 w-fit rounded-full bg-green-100 text-green-800 flex items-center justify-center gap-2 mx-auto">
                                <CheckCircle className="w-4 h-4 text-green-700" />
                                <span className="text-xs   text-green-700">
                                  Met
                                </span>
                              </div>
                            ) : (
                              <div className="flex w-fit mx-auto items-center justify-center gap-2 rounded-full py-1 px-3 bg-red-100 ">
                                <XCircle className="w-4 h-4 text-red-600" />
                                <span className="text-xs  text-red-700">
                                  Not Met
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {formatRelativeDate(app.appliedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button
                              as="a"
                              href={app.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="sm"
                              variant="flat"
                              className="text-xs rounded-md text-black bg-white/10 hover:bg-white/20 border border-white/30 font-medium"
                              startContent={
                                <Download className="w-3 h-3 text-black" />
                              }
                            >
                              View
                            </Button>
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Dropdown placement="bottom-end">
                              <DropdownTrigger>
                                <Button
                                  size="sm"
                                  variant="flat"
                                  className="text-xs rounded-md text-black bg-white/10 hover:bg-white/20 border border-white/30 font-medium"
                                  endContent={
                                    <ChevronDown className="w-3 h-3 text-black" />
                                  }
                                >
                                  Actions
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu
                                aria-label="Application actions"
                                className="bg-white/60 backdrop-blur-md rounded-lg p-1 border border-white/30"
                              >
                                <DropdownItem
                                  key="details"
                                  href={`/dashboard/companies/applications/${app.id}`}
                                  startContent={
                                    <FileText className="w-4 h-4 text-black/85" />
                                  }
                                  className="text-black hover:bg-white/40 rounded-md text-sm"
                                >
                                  View Application Details
                                </DropdownItem>
                                {eligibilityMap[app.id] ? (
                                  <DropdownItem
                                    key="interview"
                                    href={`/interviews/end/${app.id}`}
                                    startContent={
                                      <Video className="w-4 h-4 text-black/85" />
                                    }
                                    className="text-black hover:bg-white/40 rounded-md text-sm"
                                  >
                                    View Interview Details
                                  </DropdownItem>
                                ) : (
                                  <DropdownItem
                                    key="send-interview"
                                    startContent={
                                      <Send className="w-4 h-4 text-black/85" />
                                    }
                                    className="text-black hover:bg-white/40 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    onPress={() => {
                                      const applicantName = `${app.firstName} ${app.lastName}`;
                                      handleSendInterview(
                                        app.id,
                                        applicantName,
                                      );
                                    }}
                                    isDisabled={sendingInterview === app.id}
                                  >
                                    {sendingInterview === app.id
                                      ? "Sending..."
                                      : "Send Interview"}
                                  </DropdownItem>
                                )}
                              </DropdownMenu>
                            </Dropdown>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {expandedRow === app.id ? (
                              <ChevronUp className="w-4 h-4 text-black/80 mx-auto" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-black/80 mx-auto" />
                            )}
                          </td>
                        </tr>
                        {/* Expanded Quick View Row */}
                        <AnimatePresence>
                          {expandedRow === app.id && (
                            <motion.tr
                              key={`${app.id}-expanded`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <td colSpan={9} className="px-0 py-0">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{
                                    duration: 0.3,
                                    ease: "easeInOut",
                                  }}
                                  className="overflow-hidden"
                                >
                                  <div className="bg-white/20 border-t  border-white/20 px-8 py-6">
                                    <div className="w-full flex gap-6">
                                      {/* Fit Score Analysis */}
                                      {app.fitScoreBreakdown && (
                                        <div className="w-3/4  border-white/20 pb-6">
                                          <h3 className="text-sm font-semibold text-black mb-3 uppercase tracking-wide flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4" />
                                            Fit Score Analysis
                                          </h3>
                                          <div className="bg-white/50 rounded-lg p-4 space-y-4">
                                            {/* Score and Recommendation */}
                                            <div className="flex items-center justify-between">
                                              <div>
                                                <div className="text-xs text-black/85 mb-1">
                                                  Overall Recommendation
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <span
                                                    className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                                                      app.fitScoreBreakdown
                                                        .recommendation ===
                                                      "strong-fit"
                                                        ? "bg-green-100 text-green-800"
                                                        : app.fitScoreBreakdown
                                                              .recommendation ===
                                                            "good-fit"
                                                          ? "bg-blue-300 text-blue-800"
                                                          : app
                                                                .fitScoreBreakdown
                                                                .recommendation ===
                                                              "possible-fit"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}
                                                  >
                                                    {app.fitScoreBreakdown.recommendation.replace(
                                                      "-",
                                                      " ",
                                                    )}
                                                  </span>
                                                </div>
                                              </div>
                                              <div className="text-right">
                                                <div className="text-xs text-black/85 mb-1">
                                                  Fit Score
                                                </div>
                                                <div
                                                  className={`text-3xl font-bold ${
                                                    app.fitScore! >= 80
                                                      ? "text-green-700"
                                                      : app.fitScore! >= 60
                                                        ? "text-yellow-700"
                                                        : "text-red-700"
                                                  }`}
                                                >
                                                  {app.fitScore}%
                                                </div>
                                              </div>
                                            </div>

                                            {/* AI Reasoning */}
                                            {app.fitScoreBreakdown
                                              .reasoning && (
                                              <div className="bg-white/30 rounded-md p-3">
                                                <div className="text-xs font-medium text-black mb-1">
                                                  AI Analysis
                                                </div>
                                                <p className="text-sm text-black/90 leading-relaxed">
                                                  {
                                                    app.fitScoreBreakdown
                                                      .reasoning
                                                  }
                                                </p>
                                              </div>
                                            )}

                                            <div className="grid md:grid-cols-2 gap-4">
                                              {/* Strengths */}
                                              {app.fitScoreBreakdown
                                                .strengths &&
                                                app.fitScoreBreakdown.strengths
                                                  .length > 0 && (
                                                  <div>
                                                    <div className="flex items-center gap-2 text-xs font-medium text-green-800 mb-2">
                                                      <CheckCircle className="w-4 h-4" />
                                                      Strengths
                                                    </div>
                                                    <ul className="space-y-1">
                                                      {app.fitScoreBreakdown.strengths.map(
                                                        (strength, idx) => (
                                                          <li
                                                            key={idx}
                                                            className="text-sm text-black/90 flex items-start gap-2"
                                                          >
                                                            <span className="text-green-600 mt-1">
                                                              •
                                                            </span>
                                                            <span>
                                                              {strength}
                                                            </span>
                                                          </li>
                                                        ),
                                                      )}
                                                    </ul>
                                                  </div>
                                                )}

                                              {/* Concerns */}
                                              {app.fitScoreBreakdown.concerns &&
                                                app.fitScoreBreakdown.concerns
                                                  .length > 0 && (
                                                  <div>
                                                    <div className="flex items-center gap-2 text-xs font-medium text-amber-800 mb-2">
                                                      <AlertCircle className="w-4 h-4" />
                                                      Concerns
                                                    </div>
                                                    <ul className="space-y-1">
                                                      {app.fitScoreBreakdown.concerns.map(
                                                        (concern, idx) => (
                                                          <li
                                                            key={idx}
                                                            className="text-sm text-black/90 flex items-start gap-2"
                                                          >
                                                            <span className="text-amber-600 mt-1">
                                                              •
                                                            </span>
                                                            <span>
                                                              {concern}
                                                            </span>
                                                          </li>
                                                        ),
                                                      )}
                                                    </ul>
                                                  </div>
                                                )}
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4 pt-3 border-t border-white/10">
                                              {/* Skills Matched */}
                                              <div>
                                                <div className="flex items-center gap-2 text-xs font-medium text-black mb-2">
                                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                                  Matched Skills (
                                                  {
                                                    app.fitScoreBreakdown
                                                      .skillsMatched.length
                                                  }
                                                  )
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                  {app.fitScoreBreakdown.skillsMatched
                                                    .slice(0, 8)
                                                    .map((skill, idx) => (
                                                      <span
                                                        key={idx}
                                                        className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded"
                                                      >
                                                        {skill}
                                                      </span>
                                                    ))}
                                                  {app.fitScoreBreakdown
                                                    .skillsMatched.length >
                                                    8 && (
                                                    <span className="px-2 py-0.5 bg-gray-100 text-black/80 text-xs rounded">
                                                      +
                                                      {app.fitScoreBreakdown
                                                        .skillsMatched.length -
                                                        8}{" "}
                                                      more
                                                    </span>
                                                  )}
                                                </div>
                                              </div>

                                              {/* Skills Missing */}
                                              {app.fitScoreBreakdown
                                                .skillsMissing.length > 0 && (
                                                <div>
                                                  <div className="flex items-center gap-2 text-xs font-medium text-black mb-2">
                                                    <XCircle className="w-4 h-4 text-red-600" />
                                                    Missing Skills (
                                                    {
                                                      app.fitScoreBreakdown
                                                        .skillsMissing.length
                                                    }
                                                    )
                                                  </div>
                                                  <div className="flex flex-wrap gap-1">
                                                    {app.fitScoreBreakdown.skillsMissing
                                                      .slice(0, 8)
                                                      .map((skill, idx) => (
                                                        <span
                                                          key={idx}
                                                          className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded"
                                                        >
                                                          {skill}
                                                        </span>
                                                      ))}
                                                    {app.fitScoreBreakdown
                                                      .skillsMissing.length >
                                                      8 && (
                                                      <span className="px-2 py-0.5 bg-gray-100 text-black/80 text-xs rounded">
                                                        +
                                                        {app.fitScoreBreakdown
                                                          .skillsMissing
                                                          .length - 8}{" "}
                                                        more
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                            </div>

                                            {/* Minimum Requirements */}
                                            <div className="bg-white/30 rounded-md p-3 border-t border-white/10">
                                              <div className="flex items-center gap-2 text-xs font-medium text-black mb-2">
                                                {eligibilityMap[app.id] ? (
                                                  <>
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                    <span className="text-green-800">
                                                      Meets Minimum Requirements
                                                    </span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <XCircle className="w-4 h-4 text-red-600" />
                                                    <span className="text-red-800">
                                                      Does Not Meet Minimum
                                                      Requirements
                                                    </span>
                                                  </>
                                                )}
                                              </div>
                                              <p className="text-xs text-black/85">
                                                {eligibilityMap[app.id]
                                                  ? "This candidate is eligible for the second round interview process."
                                                  : "This candidate does not meet the minimum qualification requirements for this position."}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Right Column: Contact Info & Experience */}
                                      <div className="flex flex-col w-1/4 space-y-6">
                                        {/* Contact Information */}
                                        <div>
                                          <h3 className="text-sm font-semibold text-black mb-3 uppercase tracking-wide">
                                            Contact Information
                                          </h3>
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-black/90">
                                              <Mail className="w-4 h-4 text-black/80" />
                                              <span>{app.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-black/90">
                                              <Phone className="w-4 h-4 text-black/80" />
                                              <span>
                                                {app.parsedResume?.structured
                                                  ?.basics?.phone ||
                                                  "Not provided"}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-black/90">
                                              <MapPin className="w-4 h-4 text-black/80" />
                                              <span>
                                                {app.parsedResume?.structured
                                                  ?.basics?.location ||
                                                  "Not provided"}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-black/90">
                                              <Calendar className="w-4 h-4 text-black/80" />
                                              <span>
                                                Applied{" "}
                                                {formatRelativeDate(
                                                  app.appliedAt,
                                                )}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Experience Summary */}
                                        <div>
                                          <h3 className="text-sm font-semibold text-black mb-3 uppercase tracking-wide">
                                            Experience Summary
                                          </h3>
                                          <div className="space-y-2">
                                            <div className="flex items-start gap-2 text-sm text-black/90">
                                              <Briefcase className="w-4 h-4 text-black/80 mt-0.5" />
                                              <div>
                                                <div className="font-medium">
                                                  Work History
                                                </div>
                                                <div className="text-black/85">
                                                  {app.parsedResume?.structured
                                                    ?.experience?.positions
                                                    ?.length || 0}{" "}
                                                  position
                                                  {app.parsedResume?.structured
                                                    ?.experience?.positions
                                                    ?.length !== 1
                                                    ? "s"
                                                    : ""}{" "}
                                                  listed
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex items-start gap-2 text-sm text-black/90">
                                              <GraduationCap className="w-4 h-4 text-black/80 mt-0.5" />
                                              <div>
                                                <div className="font-medium">
                                                  Education
                                                </div>
                                                <div className="text-black/85">
                                                  {app.parsedResume?.structured
                                                    ?.education
                                                    ? "1"
                                                    : "0"}{" "}
                                                  listed
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="flex gap-3 pt-2">
                                          <Button
                                            as="a"
                                            href={`/dashboard/companies/applications/${app.id}`}
                                            size="sm"
                                            variant="flat"
                                            className="text-xs text-black rounded-md bg-white/20 hover:bg-white/30 border border-white/20 font-medium"
                                            startContent={
                                              <FileText className="w-4 h-4" />
                                            }
                                          >
                                            Full Application
                                          </Button>
                                          <Button
                                            as="a"
                                            href={app.resumeUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            size="sm"
                                            variant="flat"
                                            className="text-xs text-black rounded-md bg-white/20 hover:bg-white/30 border border-white/30 font-medium"
                                            startContent={
                                              <Download className="w-4 h-4" />
                                            }
                                          >
                                            Download Resume
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Skills */}
                                      {app.parsedResume?.structured?.skills &&
                                        app.parsedResume.structured.skills
                                          .length > 0 && (
                                          <div className="md:col-span-2">
                                            <h3 className="text-sm font-semibold text-black mb-3 uppercase tracking-wide">
                                              Skills
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                              {app.parsedResume.structured.skills
                                                .slice(0, 10)
                                                .map(
                                                  (
                                                    skill: string,
                                                    idx: number,
                                                  ) => (
                                                    <span
                                                      key={idx}
                                                      className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                                                    >
                                                      {skill}
                                                    </span>
                                                  ),
                                                )}
                                              {app.parsedResume.structured
                                                .skills.length > 10 && (
                                                <span className="px-3 py-1 bg-gray-100 text-black/80 text-xs font-medium rounded-full">
                                                  +
                                                  {app.parsedResume.structured
                                                    .skills.length - 10}{" "}
                                                  more
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function ApplicantsPage() {
  return (
    <ProtectedRoute requiredRole="company">
      <ApplicantsPageContent />
    </ProtectedRoute>
  );
}
