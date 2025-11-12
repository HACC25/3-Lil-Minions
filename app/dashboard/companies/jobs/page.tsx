/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { cn } from "@/utils/styles";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { DashboardLayout, JobsList } from "@/components/dashboard";
import { DeleteConfirmModal } from "@/components/modals";
import { Button, Input } from "@nextui-org/react";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useJobs } from "@/hooks/useJobs";
import { logger } from "@/lib/logger";
import { frostedGlassBg } from "@/utils/styles";
import { LoadingCard } from "@/app/jobs/company/[companyId]/page";

function JobsPageContent() {
  const { user } = useAuth();
  const router = useRouter();

  const {
    company: companyData,
    loading: companyLoading,
    error: companyError,
  } = useCompanyData(user?.uid);
  const {
    jobs,
    loading: jobsLoading,
    refetch: refetchJobs,
  } = useJobs({ companyId: user?.uid });

  const loading = companyLoading || jobsLoading;
  const error = companyError || "";

  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateJob = () => {
    router.push("/dashboard/companies/jobs/create");
  };

  const handleEditJob = (jobId: string) => {
    router.push(`/dashboard/companies/jobs/${jobId}/edit`);
  };

  const handleViewJob = (jobId: string) => {
    router.push(`/dashboard/companies/jobs/${jobId}`);
  };

  const handleViewApplicants = (jobId: string) => {
    router.push(`/dashboard/companies/jobs/${jobId}/applicants`);
  };

  const handleEditInterviewBot = (jobId: string) => {
    router.push(`/dashboard/companies/jobs/${jobId}/agent`);
  };

  const handleDeleteJob = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      setJobToDelete({ id: jobId, title: job.title });
      setIsDeleteModalOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/jobs/${jobToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete job");
      }

      logger.success("Job deleted successfully");

      // Refetch jobs to update the list
      refetchJobs();

      // Close modal
      setIsDeleteModalOpen(false);
      setJobToDelete(null);
    } catch (error) {
      logger.error("Error deleting job:", error);
      alert("Failed to delete job. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter jobs based on search query
  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return <LoadingCard desc="Loading your job postings, please wait..." />;
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-red-600">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Postings</h1>
            <p className="text-black/80 mt-1">
              Manage all your posted listings
            </p>
          </div>
          <Button
            as={Link}
            href="/dashboard/companies/jobs/create"
            startContent={<Plus size={18} />}
            className={cn(
              frostedGlassBg,
              " text-black border border-white/10 hover:bg-white  h-9 rounded-lg font-medium text-sm normal-case",
            )}
          >
            Post New Job
          </Button>
        </div>

        {/* Search and Filters */}
        {jobs.length > 0 && (
          <div className="mb-6">
            <Input
              placeholder=" Search jobs by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<Search size={18} className="text-gray-400" />}
              classNames={{
                input: "text-sm text-black ",
                inputWrapper: "h-10 bg-white/40 rounded-md shadow-none",
              }}
              className="max-w-md"
            />
          </div>
        )}

        {/* Jobs List */}
        <JobsList
          jobs={filteredJobs}
          onCreateJob={handleCreateJob}
          onEditJob={handleEditJob}
          onViewJob={handleViewJob}
          onViewApplicants={handleViewApplicants}
          onDeleteJob={handleDeleteJob}
          onEditInterviewBot={handleEditInterviewBot}
        />

        {/* No results message */}
        {searchQuery && filteredJobs.length === 0 && jobs.length > 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">
              No jobs found matching "{searchQuery}"
            </p>
            <Button
              variant="light"
              onPress={() => setSearchQuery("")}
              className="mt-4 text-sm"
            >
              Clear search
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setJobToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Job Posting"
        message="Are you sure you want to delete this job posting? All applicant data will be permanently removed."
        itemName={jobToDelete?.title}
        isDeleting={isDeleting}
      />
    </DashboardLayout>
  );
}

export default function JobsPage() {
  return (
    <ProtectedRoute requiredRole="company">
      <JobsPageContent />
    </ProtectedRoute>
  );
}
