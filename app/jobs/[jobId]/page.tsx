"use client";

import { useParams } from "next/navigation";
import { Card, CardBody, Button } from "@nextui-org/react";
import {
  MapPin,
  DollarSign,
  Briefcase,
  ArrowLeft,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { bgUrl, frostedGlassBg } from "@/utils/styles";
import Link from "next/link";
import { useJob } from "@/hooks/useJob";
import { formatSalaryRange, formatDateRange } from "@/lib/formatters";
import { cn } from "@/utils/styles";
import { LoadingCard } from "../company/[companyId]/page";
import { useState, useEffect } from "react";

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const { job, loading } = useJob(jobId);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Fetch company logo
  useEffect(() => {
    const fetchCompanyLogo = async () => {
      if (!job?.companyId) return;

      try {
        const response = await fetch(`/api/companies/${job.companyId}`);
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
  }, [job?.companyId]);

  if (loading) {
    return <LoadingCard desc="Please wait while we load the job details..." />;
  }

  if (!job) {
    return (
      <div
        className="min-h-screen flex items-center justify-center relative"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=2070')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-2">Job Not Found</h2>
          <p className="text-black/80 mb-4">
            The job posting you're looking for doesn't exist.
          </p>
          <Button
            as={Link}
            href="/jobs"
            className="bg-white/40  border border-white/10 text-black hover:bg-white/30"
          >
            Browse All Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: ` url(${bgUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(1px)",
        }}
      />
      {/* <BgOverlay /> */}

      {/* Content */}
      <div className={cn("relative z-10")}>
        {/* Header */}
        <div className="px-8 py-6">
          <div className="max-w-[1000px] mx-auto">
            <button
              onClick={() => window.history.back()}
              className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-black hover:text-black transition-colors mb-4"
            >
              <ArrowLeft size={16} />
              Back to Browse
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={cn(frostedGlassBg, "max-w-[1000px] mx-auto px-8 pb-8")}>
          {/* Job Header */}
          <Card className="  border-white/10 mb-6">
            <CardBody className="p-8">
              {job.companyName && (
                <div className="flex items-center gap-3 mb-3">
                  {logoUrl && (
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
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
                  <span className="text-lg font-medium text-black">
                    {job.companyName}
                  </span>
                  {job.companyWebsite && (
                    <a
                      href={job.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-black hover:text-black"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              )}

              <h1 className="text-3xl font-bold text-black mb-2">
                {job.title}
              </h1>

              {job.positionNumber && (
                <p className="text-sm text-black mb-4">
                  Position #{job.positionNumber}
                </p>
              )}

              {/* Job Meta */}
              <div className="flex flex-wrap gap-4 text-black/90 mb-6">
                {job.department && (
                  <div className="flex items-center gap-2">
                    <span>{job.department}</span>
                  </div>
                )}
                {job.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={20} className="text-black/90" />
                    <span>
                      {job.location}
                      {job.island && `, ${job.island}`}
                    </span>
                  </div>
                )}
                {job.employmentType && (
                  <div className="flex items-center gap-2">
                    <Briefcase size={20} className="text-black/90" />
                    <span>{job.employmentType}</span>
                  </div>
                )}
                {formatSalaryRange(job.salaryRange) && (
                  <div className="flex items-center gap-2">
                    <DollarSign size={20} className="text-black/90" />
                    <span>{formatSalaryRange(job.salaryRange)}</span>
                  </div>
                )}
                {formatDateRange(job.openingDate, job.closingDate) && (
                  <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-black/90" />
                    <span>
                      {formatDateRange(job.openingDate, job.closingDate)}
                    </span>
                  </div>
                )}
              </div>

              {/* Apply Button */}
              <div className="flex gap-3">
                <Button
                  as={Link}
                  href={`/jobs/${jobId}/apply`}
                  className="bg-white/40 border border-white/10 text-black hover:bg-white/50 h-11 rounded-lg font-medium text-sm normal-case px-8"
                  size="lg"
                >
                  Apply Now
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Application Period */}
          {/* {(job.openingDate || job.closingDate) && (
          <Card className="border  rounded-md bg-white/80 mb-6">
            <CardBody className="p-6">
              <h2 className="text-lg font-semibold text-black mb-4">
                Application Period
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {job.openingDate && (
                  <div>
                    <p className="text-sm text-black/70 mb-1">Opening Date</p>
                    <p className="text-lg font-semibold text-black">
                      {new Date(job.openingDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-black/70 mb-1">Closing Date</p>
                  <p className="text-lg font-semibold text-black">
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
            </CardBody>
          </Card>
        )} */}

          {/* Position Details */}
          {(job.positionCount || job.recruitmentType) && (
            <Card className="border border-white/10 bg-white/40 rounded-md mb-6">
              <CardBody className="p-8">
                <h2 className="text-xl font-semibold text-black mb-4">
                  Position Details
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {job.positionCount && (
                    <div>
                      <p className="text-sm text-black/70 mb-1">
                        Positions Available
                      </p>
                      <p className="text-lg font-semibold text-black">
                        {job.positionCount}
                      </p>
                    </div>
                  )}
                  {job.recruitmentType && (
                    <div>
                      <p className="text-sm text-black/70 mb-1">
                        Recruitment Type
                      </p>
                      <p className="text-lg font-semibold text-black">
                        {job.recruitmentType}
                      </p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Duties and Responsibilities */}
          {job.duties && job.duties.length > 0 && (
            <Card className="border bg-white/40 rounded-md border-white/10   mb-6">
              <CardBody className="p-8">
                <h2 className="text-xl font-semibold text-black mb-4">
                  Duties and Responsibilities
                </h2>
                <ul className="space-y-2">
                  {job.duties.map((duty, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-black mt-1">•</span>
                      <span className="text-black/90">{duty}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}

          {/* Minimum Qualifications */}
          {job.minimumQualifications && (
            <Card className="border border-white/10 bg-white/40 rounded-md  mb-6">
              <CardBody className="p-8">
                <h2 className="text-xl font-semibold text-black mb-4">
                  Minimum Qualifications
                </h2>
                <div className="space-y-4">
                  {job.minimumQualifications.education && (
                    <div>
                      <h3 className="text-sm font-semibold text-black mb-2">
                        Education
                      </h3>
                      <p className="text-black/90">
                        {job.minimumQualifications.education}
                      </p>
                    </div>
                  )}
                  {job.minimumQualifications.experience && (
                    <div>
                      <h3 className="text-sm font-semibold text-black mb-2">
                        Experience
                      </h3>
                      <p className="text-black/90">
                        {job.minimumQualifications.experience}
                      </p>
                    </div>
                  )}
                  {job.minimumQualifications.specialRequirements &&
                    job.minimumQualifications.specialRequirements.length >
                      0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-black mb-2">
                          Special Requirements
                        </h3>
                        <ul className="space-y-2">
                          {job.minimumQualifications.specialRequirements.map(
                            (req, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <span className="text-black mt-1">•</span>
                                <span className="text-black/90">{req}</span>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Supplemental Information */}
          {job.supplementalInfo && (
            <Card className="border border-white/10 bg-white/40 rounded-md mb-6">
              <CardBody className="p-8">
                <h2 className="text-xl font-semibold text-black mb-4">
                  Supplemental Information
                </h2>
                <p className="text-black/90 whitespace-pre-wrap leading-relaxed">
                  {job.supplementalInfo}
                </p>
              </CardBody>
            </Card>
          )}

          {/* Required Documents */}
          {job.requiredDocuments && job.requiredDocuments.length > 0 && (
            <Card className="border border-white/10 bg-white/40 rounded-md  mb-6">
              <CardBody className="p-8">
                <h2 className="text-xl font-semibold text-black mb-4">
                  Required Application Documents
                </h2>
                <ul className="space-y-2">
                  {job.requiredDocuments.map((doc, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-black mt-1">•</span>
                      <span className="text-black/90">{doc}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}

          {/* Additional Information */}
          <Card className="border border-white/10 bg-white/40 rounded-md mb-6">
            <CardBody className="p-8">
              <h2 className="text-xl font-semibold text-black mb-4">
                Additional Information
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {job.division && (
                  <div>
                    <p className="text-sm text-black/70 mb-1">Division</p>
                    <p className="text-black font-medium">{job.division}</p>
                  </div>
                )}
                {job.workSchedule && (
                  <div>
                    <p className="text-sm text-black/70 mb-1">Work Schedule</p>
                    <p className="text-black font-medium">{job.workSchedule}</p>
                  </div>
                )}
                {job.examType && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-black/70 mb-1">
                      Examination Type
                    </p>
                    <p className="text-black font-medium">{job.examType}</p>
                  </div>
                )}
                {job.contact && (
                  <>
                    {job.contact.name && (
                      <div>
                        <p className="text-sm text-black/70 mb-1">
                          Contact Name
                        </p>
                        <p className="text-black font-medium">
                          {job.contact.name}
                        </p>
                      </div>
                    )}
                    {job.contact.email && (
                      <div>
                        <p className="text-sm text-black/70 mb-1">
                          Contact Email
                        </p>
                        <p className="text-black font-medium">
                          <a
                            href={`mailto:${job.contact.email}`}
                            className="text-blue-900 hover:underline"
                          >
                            {job.contact.email}
                          </a>
                        </p>
                      </div>
                    )}
                    {job.contact.phone && (
                      <div>
                        <p className="text-sm text-black/70 mb-1">
                          Contact Phone
                        </p>
                        <p className="text-black font-medium">
                          <a
                            href={`tel:${job.contact.phone}`}
                            className="text-blue-900 hover:underline"
                          >
                            {job.contact.phone}
                          </a>
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Apply CTA */}
          <Card className="bg-white/40 border border-white/10 rounded-lg">
            <CardBody className="p-6 text-center">
              <h3 className="text-xl font-semibold text-black mb-3">
                Ready to Apply?
              </h3>
              <p className="text-black/80 mb-4">
                Submit your application for this position
              </p>
              <Button
                as={Link}
                href={`/jobs/${jobId}/apply`}
                className="bg-white/40 border border-white/10 text-black hover:bg-white/50 h-11 rounded-lg font-medium text-sm normal-case px-8"
                size="lg"
              >
                Apply Now
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
