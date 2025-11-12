"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { Search, Download, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import {
  formatRelativeDate,
  formatApplicationStatus,
  getApplicationStatusColor,
} from "@/lib/formatters";
import { logger } from "@/lib/logger";
import type { Application, ApplicationStatus } from "@/types/application";
import { LoadingCard } from "@/app/jobs/company/[companyId]/page";
export default function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (user?.uid) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        companyId: user!.uid,
        limit: "100",
      });

      const url = `/api/applications?${params}`;
      console.log("🔍 Fetching applications from:", url);
      console.log("🔍 Company ID:", user!.uid);

      const response = await fetch(url);
      const data = await response.json();

      console.log("📦 Response data:", data);

      if (data.success) {
        setApplications(data.applications);
        logger.info("Applications loaded:", data.applications.length);
      } else {
        console.error("❌ API returned error:", data.error);
      }
    } catch (error) {
      logger.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      searchQuery === "" ||
      app.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingCard desc="Loading applications, please wait..." />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-600 mt-1">
          Manage all applications across your job postings
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardBody className="p-4">
          <div className="flex gap-4 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by name, email, or job..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<Search className="w-4 h-4 text-gray-400" />}
                classNames={{
                  input: "text-sm",
                  inputWrapper: "h-10",
                }}
              />
            </div>

            {/* Status Filter */}
            <div className="w-48">
              <Select
                placeholder="Filter by status"
                selectedKeys={[statusFilter]}
                onChange={(e) => setStatusFilter(e.target.value)}
                classNames={{
                  trigger: "h-10",
                }}
              >
                <SelectItem key="all" value="all">
                  All Status
                </SelectItem>
                <SelectItem key="pending" value="pending">
                  Pending
                </SelectItem>
                <SelectItem key="reviewing" value="reviewing">
                  Reviewing
                </SelectItem>
                <SelectItem key="accepted" value="accepted">
                  Accepted
                </SelectItem>
                <SelectItem key="rejected" value="rejected">
                  Rejected
                </SelectItem>
              </Select>
            </div>

            <div className="text-sm text-gray-600 flex items-center">
              Showing {filteredApplications.length} of {applications.length}{" "}
              applications
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Applications Table */}
      {filteredApplications.length === 0 ? (
        <Card>
          <CardBody className="p-12 text-center">
            <p className="text-gray-600">
              {applications.length === 0
                ? "No applications yet. Applications will appear here once candidates apply to your jobs."
                : "No applications match your filters."}
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resume
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {app.firstName} {app.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {app.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {app.jobTitle}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                          className="text-xs"
                          startContent={<Download className="w-3 h-3" />}
                        >
                          View
                        </Button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          as="a"
                          href={`/dashboard/companies/applications/${app.id}`}
                          size="sm"
                          variant="light"
                          className="text-blue-600 hover:text-blue-700"
                          endContent={<ExternalLink className="w-3 h-3" />}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
