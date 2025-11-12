"use client";

import { useState, useEffect } from "react";
import { cn } from "@/utils/styles";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard";
import { useAuth } from "@/lib/AuthContext";
import { DeleteConfirmModal } from "@/components/modals";
import { Button, Chip } from "@nextui-org/react";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Edit,
  Trash2,
  Briefcase,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { logger } from "@/lib/logger";
import { useJob } from "@/hooks/useJob";
import { formatSalaryRange, formatDateRange } from "@/lib/formatters";
import { frostedGlassBg } from "@/utils/styles";
import { LoadingCard } from "@/app/jobs/company/[companyId]/page";

function ViewJobContent() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;
  const { user } = useAuth();

  const { job, loading } = useJob(jobId);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Fetch company logo
  useEffect(() => {
    const fetchCompanyLogo = async () => {
      if (!user?.uid) return;

      try {
        const response = await fetch(`/api/companies/${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          if (data.logoUrl && typeof data.logoUrl === "string") {
            setLogoUrl(data.logoUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching company logo:", error);
        // Silently fail - logo is optional
        setLogoUrl(null);
      }
    };

    fetchCompanyLogo();
  }, [user]);

  const getStatusColor = (status: string) => {
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

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete job");
      }

      logger.success("Job deleted successfully");
      router.push("/dashboard/companies/jobs");
    } catch (error) {
      logger.error("Error deleting job:", error);
      alert("Failed to delete job. Please try again.");
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <LoadingCard desc="Please wait while we load the job details..." />;
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-black">Job not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div
        className={cn(
          frostedGlassBg,
          "min-h-screen mx-auto my-5 border max-w-[1000px] border-white/20 ",
        )}
      >
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/dashboard/companies/jobs"
              className="inline-flex items-center gap-2 text-sm font-medium text-black hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Jobs
            </Link>
          </div>

          {/* Job Header */}
          <div className={cn(" rounded-lg p-8 mb-6")}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {job.title}
                  </h1>
                  <Chip
                    size="lg"
                    color={getStatusColor(job.status)}
                    variant="flat"
                    className={`px-3 rounded-lg capitalize ${
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
                {job.companyName && (
                  <div className="flex items-center gap-3">
                    {logoUrl && (
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
                        <img
                          src={logoUrl}
                          alt="Company Logo"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            setLogoUrl(null);
                          }}
                        />
                      </div>
                    )}
                    <p className="text-lg text-black">{job.companyName}</p>
                  </div>
                )}
                {job.positionNumber && (
                  <p className="text-sm text-black mt-1">
                    Position #{job.positionNumber}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  as={Link}
                  href={`/dashboard/companies/jobs/${jobId}/edit`}
                  startContent={<Edit size={18} />}
                  className="bg-black text-white hover:bg-black/85 h-9 rounded-lg font-medium text-sm normal-case"
                >
                  Edit
                </Button>
                <Button
                  onPress={handleDeleteClick}
                  startContent={<Trash2 size={18} />}
                  className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 h-9 rounded-lg font-medium text-sm normal-case"
                >
                  Delete
                </Button>
              </div>
            </div>

            {/* Job Meta */}
            <div className="flex flex-wrap gap-6 text-black">
              {job.department && (
                <div className="flex items-center gap-2">
                  <span>{job.department}</span>
                </div>
              )}
              {job.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={20} />
                  <span>
                    {job.location}
                    {job.island && `, ${job.island}`}
                  </span>
                </div>
              )}
              {job.employmentType && (
                <div className="flex items-center gap-2">
                  <Briefcase size={20} />
                  <span>{job.employmentType}</span>
                </div>
              )}
              {formatSalaryRange(job.salaryRange) && (
                <div className="flex items-center gap-2">
                  <DollarSign size={20} />
                  <span>{formatSalaryRange(job.salaryRange)}</span>
                </div>
              )}
              {formatDateRange(job.openingDate, job.closingDate) && (
                <div className="flex items-center gap-2">
                  <Calendar size={20} />
                  <span>
                    {formatDateRange(job.openingDate, job.closingDate)}
                  </span>
                </div>
              )}
            </div>

            {/* Key Information Grid */}
            <div className="mt-6 pt-6 border-t border-gray-200 grid gap-4 sm:grid-cols-3">
              {job.applicants !== undefined && (
                <div>
                  <p className="text-sm text-black">Total Applicants</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {job.applicants}
                  </p>
                </div>
              )}
              {job.positionCount && (
                <div>
                  <p className="text-sm text-black">Positions Available</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {job.positionCount}
                  </p>
                </div>
              )}
              {job.recruitmentType && (
                <div>
                  <p className="text-sm text-black">Recruitment Type</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {job.recruitmentType}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Application Period */}
          {/* {(job.openingDate || job.closingDate) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Application Period
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {job.openingDate && (
                  <div>
                    <p className="text-sm text-black mb-1">Opening Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(job.openingDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-black mb-1">Closing Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {job.closingDate === "continuous" || !job.closingDate ? (
                      <span className="text-green-800">
                        Continuous (Open Until Filled)
                      </span>
                    ) : (
                      new Date(job.closingDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    )}
                  </p>
                </div>
              </div>
            </div>
          )} */}

          {/* Duties and Responsibilities */}
          {job.duties && job.duties.length > 0 && (
            <div
              className={cn(
                frostedGlassBg,
                " rounded-lg border border-white/10 p-8 mb-6",
              )}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Duties and Responsibilities
              </h2>
              <ul className="space-y-2">
                {job.duties.map((duty, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-gray-900 mt-1">•</span>
                    <span className="text-black text-base font-normal">
                      {duty}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Minimum Qualifications */}
          {job.minimumQualifications && (
            <div
              className={cn(
                frostedGlassBg,
                " rounded-lg border border-white/20 p-8 mb-6",
              )}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Minimum Qualifications
              </h2>
              <div className="space-y-4">
                {job.minimumQualifications.education && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Education
                    </h3>
                    <p className="text-black font-normal text-base">
                      {job.minimumQualifications.education}
                    </p>
                  </div>
                )}
                {job.minimumQualifications.experience && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Experience
                    </h3>
                    <p className="text-black font-normal text-base">
                      {job.minimumQualifications.experience}
                    </p>
                  </div>
                )}
                {job.minimumQualifications.specialRequirements &&
                  job.minimumQualifications.specialRequirements.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">
                        Special Requirements
                      </h3>
                      <ul className="space-y-2">
                        {job.minimumQualifications.specialRequirements.map(
                          (req, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-gray-900 mt-1">•</span>
                              <span className="text-black">{req}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Supplemental Information */}
          {job.supplementalInfo && (
            <div className=" rounded-lg border border-gray-200 p-8 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Supplemental Information
              </h2>
              <p className="text-black whitespace-pre-wrap leading-relaxed">
                {job.supplementalInfo}
              </p>
            </div>
          )}

          {/* Application Requirements */}
          {job.requiredDocuments && job.requiredDocuments.length > 0 && (
            <div className=" bg-white/50 rounded-lg border border-gray-200 p-8 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Required Application Documents
              </h2>
              <ul className="space-y-2">
                {job.requiredDocuments.map((doc, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-gray-900 mt-1">•</span>
                    <span className="text-black">{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Additional Information */}
          <div className=" bg-white/50 rounded-lg border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Additional Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {job.salaryRange &&
                (job.salaryRange.min || job.salaryRange.max) && (
                  <div>
                    <p className="text-sm text-black mb-1">Salary Range</p>
                    <p className="text-gray-900 font-medium">
                      {formatSalaryRange(job.salaryRange)}
                    </p>
                  </div>
                )}
              {job.division && (
                <div>
                  <p className="text-sm text-black mb-1">Division</p>
                  <p className="text-gray-900 font-medium">{job.division}</p>
                </div>
              )}
              {job.workSchedule && (
                <div>
                  <p className="text-sm text-black mb-1">Work Schedule</p>
                  <p className="text-gray-900 font-medium">
                    {job.workSchedule}
                  </p>
                </div>
              )}
              {job.examType && (
                <div className="sm:col-span-2">
                  <p className="text-sm text-black mb-1">Examination Type</p>
                  <p className="text-gray-900 font-medium">{job.examType}</p>
                </div>
              )}
              {job.contact && (
                <>
                  {job.contact.name && (
                    <div>
                      <p className="text-sm text-black mb-1">Contact Name</p>
                      <p className="text-gray-900 font-medium">
                        {job.contact.name}
                      </p>
                    </div>
                  )}
                  {job.contact.email && (
                    <div>
                      <p className="text-sm text-black mb-1">Contact Email</p>
                      <p className="text-gray-900 font-medium">
                        <a
                          href={`mailto:${job.contact.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {job.contact.email}
                        </a>
                      </p>
                    </div>
                  )}
                  {job.contact.phone && (
                    <div>
                      <p className="text-sm text-black mb-1">Contact Phone</p>
                      <p className="text-gray-900 font-medium">
                        <a
                          href={`tel:${job.contact.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {job.contact.phone}
                        </a>
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Job Posting"
        message="Are you sure you want to delete this job posting? All applicant data will be permanently removed."
        itemName={job?.title}
        isDeleting={isDeleting}
      />
    </DashboardLayout>
  );
}

export default function ViewJobPage() {
  return (
    <ProtectedRoute requiredRole="company">
      <ViewJobContent />
    </ProtectedRoute>
  );
}
