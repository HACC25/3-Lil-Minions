"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ApplicationFormData } from "@/types/application";

export default function ApplicationConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applicationData, setApplicationData] =
    useState<ApplicationFormData | null>(null);
  const [jobTitle, setJobTitle] = useState<string>("");
  const [applicationId, setApplicationId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchApplication = async () => {
      // Get applicationId from URL query params
      const appId = searchParams.get("applicationId");

      if (!appId) {
        console.log("No applicationId in URL, redirecting to /jobs");
        router.push("/jobs");
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching application:", appId);

        // Fetch application from API
        const response = await fetch(`/api/applications/${appId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch application");
        }

        const result = await response.json();

        if (!result.success || !result.application) {
          throw new Error("Application not found");
        }

        const app = result.application;
        console.log("Successfully fetched application data");

        // Set the application data
        setApplicationData(app.applicationData);
        setJobTitle(app.jobTitle || "Position");
        setApplicationId(app.id);
      } catch (err) {
        console.error("Error fetching application:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load application data",
        );
        // Redirect after a brief delay to show error
        setTimeout(() => router.push("/jobs"), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="text-center bg-white/80 backdrop-blur-md p-6 rounded-lg shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-900 font-medium">
            Loading confirmation...
          </p>
        </div>
      </div>
    );
  }

  if (error || !applicationData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-500/20 backdrop-blur-md border border-red-500/40 p-4 mb-4 rounded-lg">
            <p className="text-gray-900 font-medium">
              {error || "Unable to load application"}
            </p>
            <p className="text-gray-800 text-sm mt-2">
              Redirecting to jobs page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="border border-white/40 bg-white/80 backdrop-blur-md shadow-xl rounded-lg overflow-hidden mb-6">
          <div className="bg-emerald-500/20 border-b border-emerald-400/30 px-6 py-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-emerald-500/20 backdrop-blur-md rounded-full p-3">
                <svg
                  className="h-12 w-12 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 text-center">
              Application Submitted Successfully!
            </h1>
            <p className="text-gray-800 text-center mt-2">
              Thank you for applying to {jobTitle}
            </p>
            {applicationId && (
              <p className="text-gray-700 text-center mt-1 text-sm">
                Application ID: {applicationId}
              </p>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-white/60 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              What Happens Next?
            </h2>

            <ol className="space-y-4">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  1
                </span>
                <div>
                  <p className="font-semibold text-gray-900">
                    AI Screening (Instant)
                  </p>
                  <p className="text-sm text-gray-800">
                    Your application has been automatically screened by our AI
                    system. You should have received a confirmation email at{" "}
                    <strong className="text-emerald-600">
                      {applicationData.email}
                    </strong>
                    .
                  </p>
                  <p className="text-sm text-emerald-700 font-medium mt-2">
                    ✓ If you passed, you've already received an interview
                    invitation (skip to Step 3).
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  2
                </span>
                <div>
                  <p className="font-semibold text-gray-900">
                    Human Review (2-3 weeks)
                  </p>
                  <p className="text-sm text-gray-800">
                    If you didn't receive an immediate interview invitation, our
                    hiring team will still review your application in detail and
                    may extend an invitation after their review.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  3
                </span>
                <div>
                  <p className="font-semibold text-gray-900">AI Interview</p>
                  <p className="text-sm text-gray-800">
                    If you received an interview invitation (either immediately
                    or after human review), complete the AI-conducted interview
                    via the link sent to{" "}
                    <strong className="text-emerald-600">
                      {applicationData.email}
                    </strong>
                    .
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  4
                </span>
                <div>
                  <p className="font-semibold text-gray-900">Final Decision</p>
                  <p className="text-sm text-gray-800">
                    You will be notified of the final hiring decision via email,
                    regardless of the outcome.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* Application Summary */}
        <div className="border border-white/40 bg-white/80 backdrop-blur-md shadow-xl rounded-lg overflow-hidden">
          <div className="bg-white/60 px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Your Application Summary
            </h2>
            <p className="text-sm text-gray-700 mt-1">
              Review the information you submitted
            </p>
          </div>

          <div className="p-6 space-y-8">
            {/* Personal Information */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="font-medium text-gray-900">
                    {applicationData.firstName} {applicationData.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">
                    {applicationData.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">
                    {applicationData.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="font-medium text-gray-900">
                    {applicationData.dateOfBirth}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium text-gray-900">
                    {applicationData.address}, {applicationData.city},{" "}
                    {applicationData.state} {applicationData.zipCode},{" "}
                    {applicationData.country}
                  </p>
                </div>
              </div>
            </section>{" "}
            {/* Work History */}
            {applicationData.workHistory &&
              applicationData.workHistory.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                    Work History ({applicationData.workHistory.length})
                  </h3>
                  <div className="space-y-4">
                    {applicationData.workHistory.map((work, index) => (
                      <div
                        key={index}
                        className="bg-white/60 p-4 rounded-lg border border-gray-200"
                      >
                        <p className="font-semibold text-gray-900">
                          {work.jobTitle} at {work.employerName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {work.startDate} -{" "}
                          {work.stillEmployed ? "Present" : work.endDate}
                        </p>
                        <p className="text-sm text-gray-800 mt-2">
                          {work.duties}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            {/* Education */}
            {applicationData.education &&
              applicationData.education.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                    Education ({applicationData.education.length})
                  </h3>
                  <div className="space-y-3">
                    {applicationData.education.map((edu, index) => (
                      <div
                        key={index}
                        className="bg-white/60 p-4 rounded-lg border border-gray-200"
                      >
                        <p className="font-semibold text-gray-900">
                          {edu.institutionName}
                        </p>
                        <p className="text-sm text-gray-800">
                          {edu.degree}
                          {edu.major && ` in ${edu.major}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {edu.graduated ? "Graduated" : "Not Graduated"}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            {/* Skills */}
            {applicationData.skills && applicationData.skills.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                  Skills ({applicationData.skills.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {applicationData.skills.map((skill, index) => (
                    <div
                      key={index}
                      className="bg-white/60 p-3 rounded-lg border border-gray-200"
                    >
                      <p className="font-semibold text-gray-900">
                        {skill.name}
                      </p>
                      <p className="text-sm text-gray-800">
                        Experience: {skill.experience} years,{" "}
                        {skill.experienceMonths} months
                      </p>
                      <p className="text-sm text-gray-600">
                        Level: {skill.level}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {/* Languages */}
            {applicationData.languages &&
              applicationData.languages.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                    Languages ({applicationData.languages.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {applicationData.languages.map((lang, index) => (
                      <div
                        key={index}
                        className="bg-white/60 p-3 rounded-lg border border-gray-200"
                      >
                        <p className="font-semibold text-gray-900">
                          {lang.language}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {lang.speak && (
                            <span className="text-xs bg-emerald-500/20 text-emerald-700 px-2 py-1 rounded border border-emerald-300">
                              Speak
                            </span>
                          )}
                          {lang.read && (
                            <span className="text-xs bg-emerald-500/20 text-emerald-700 px-2 py-1 rounded border border-emerald-300">
                              Read
                            </span>
                          )}
                          {lang.write && (
                            <span className="text-xs bg-emerald-500/20 text-emerald-700 px-2 py-1 rounded border border-emerald-300">
                              Write
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            {/* References */}
            {applicationData.references &&
              applicationData.references.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                    References ({applicationData.references.length})
                  </h3>
                  <div className="space-y-3">
                    {applicationData.references.map((ref, index) => (
                      <div
                        key={index}
                        className="bg-white/60 p-4 rounded-lg border border-gray-200"
                      >
                        <p className="font-semibold text-gray-900">
                          {ref.firstName} {ref.lastName}
                        </p>
                        <p className="text-sm text-gray-800">
                          {ref.type} Reference
                        </p>
                        <p className="text-sm text-gray-600">
                          {ref.phone} {ref.email && `• ${ref.email}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            {/* Additional Information */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                Additional Information
              </h3>
              <div className="space-y-3">
                {applicationData.veteranStatus && (
                  <div>
                    <p className="text-sm text-gray-600">Veteran Status</p>
                    <p className="font-medium text-gray-900">
                      {applicationData.veteranStatus}
                    </p>
                  </div>
                )}
                {applicationData.certifications &&
                  applicationData.certifications.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600">Certifications</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {applicationData.certifications.map((cert, index) => (
                          <span
                            key={index}
                            className="bg-emerald-500/20 text-emerald-700 px-3 py-1 rounded-full text-sm border border-emerald-300"
                          >
                            {cert.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </section>
            {/* Supplemental Questions */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                Supplemental Responses
              </h3>
              <div className="space-y-3">
                <div className="bg-white/60 p-3 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    Career Opportunities Source
                  </p>
                  <p className="font-medium text-gray-900">
                    {applicationData.q01_careerOpportunities?.join(", ") ||
                      "N/A"}
                  </p>
                </div>
                <div className="bg-white/60 p-3 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    General Experience (6 months)
                  </p>
                  <p className="font-medium text-gray-900">
                    {applicationData.q05_generalExperience === "yes"
                      ? "Yes"
                      : "No"}
                  </p>
                </div>
                <div className="bg-white/60 p-3 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    Specialized Experience (2 years)
                  </p>
                  <p className="font-medium text-gray-900">
                    {applicationData.q06_specializedExperience === "yes"
                      ? "Yes"
                      : "No"}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Action Buttons */}
          <div className="bg-white/60 px-6 py-4 border-t border-gray-200 flex justify-center gap-4">
            <Link
              href="/jobs"
              className="px-6 py-3 bg-emerald-500 border border-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors shadow-sm"
            >
              Browse More Jobs
            </Link>
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              Print Summary
            </button>
          </div>
        </div>

        {/* Important Notice */}
        <div className="mt-6 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/40 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-yellow-900 mb-2">
            Important Reminders
          </h3>
          <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
            <li>Keep your contact information up to date</li>
            <li>Check your email regularly for updates on your application</li>
            <li>
              If you don't hear from us within 4 weeks, feel free to follow up
            </li>
            <li>Save your Application ID for reference</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
