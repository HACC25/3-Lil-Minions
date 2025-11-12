"use client";

import { DashboardLayout } from "@/components/dashboard";
import { useForm, useFieldArray } from "react-hook-form";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { logger } from "@/lib/logger";
import { useAuth } from "@/lib/AuthContext";
import { useJob } from "@/hooks/useJob";
import Link from "next/link";
import { JobFormData, JobStatus, SupplementalQuestion } from "@/types/job";
import { cn, frostedGlassBg } from "@/utils/styles";
import { LoadingCard } from "@/app/jobs/company/[companyId]/page";

export default function EditJobContent() {
  const [isSubmittingPublish, setIsSubmittingPublish] = useState(false);
  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isContinuous, setIsContinuous] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;

  const { job, loading: fetchingJob, error: fetchError } = useJob(jobId);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<JobFormData>({
    defaultValues: {
      title: "",
      positionNumber: "",
      recruitmentType: "Open Competitive",
      department: "",
      division: "",
      location: "",
      island: "Oahu",
      salaryRange: {
        min: 0,
        max: 0,
        frequency: "Monthly",
      },
      openingDate: "",
      closingDate: "",
      positionCount: 1,
      minimumQualifications: {
        education: "",
        experience: "",
        specialRequirements: [],
      },
      duties: [""],
      supplementalInfo: "",
      requiredDocuments: ["Resume", "Cover Letter"],
      supplementalQuestions: [],
      contact: {
        name: "",
        email: "",
        phone: "",
      },
      examType: "Unassembled",
      employmentType: "Full-Time",
      workSchedule: "8:00 AM - 4:30 PM",
    },
  });

  /* eslint-disable @typescript-eslint/ban-ts-comment */
  const {
    fields: dutyFields,
    append: appendDuty,
    remove: removeDuty,
  } = useFieldArray({
    control,
    // @ts-ignore
    name: "duties",
  });

  const {
    fields: reqFields,
    append: appendReq,
    remove: removeReq,
  } = useFieldArray({
    control,
    // @ts-ignore
    name: "minimumQualifications.specialRequirements",
  });

  const {
    fields: docFields,
    append: appendDoc,
    remove: removeDoc,
  } = useFieldArray({
    control,
    // @ts-ignore
    name: "requiredDocuments",
  });

  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({
    control,
    // @ts-ignore
    name: "supplementalQuestions",
  });
  /* eslint-enable @typescript-eslint/ban-ts-comment */

  // Populate form when job data is loaded
  useEffect(() => {
    if (job) {
      logger.debug("Populating form with job data:", job);

      // Check if closing date is continuous
      const isContinuousDate = job.closingDate === "continuous";
      setIsContinuous(isContinuousDate);

      // Helper function to convert ISO string to YYYY-MM-DD format for date inputs
      const formatDateForInput = (
        dateString: string | null | undefined,
      ): string => {
        if (!dateString) return "";
        try {
          // Handle ISO string format from API
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return "";
          // Return in YYYY-MM-DD format
          return date.toISOString().split("T")[0];
        } catch {
          return "";
        }
      };

      // Reset form with job data
      reset({
        title: job.title || "",
        positionNumber: job.positionNumber || "",
        recruitmentType: job.recruitmentType || "Open Competitive",
        department: job.department || "",
        division: job.division || "",
        location: job.location || "",
        island: job.island || "Oahu",
        salaryRange: {
          min: job.salaryRange?.min || 0,
          max: job.salaryRange?.max || 0,
          frequency: job.salaryRange?.frequency || "Monthly",
        },
        openingDate: formatDateForInput(job.openingDate),
        closingDate: isContinuousDate
          ? ""
          : formatDateForInput(job.closingDate),
        positionCount: job.positionCount || 1,
        minimumQualifications: {
          education: job.minimumQualifications?.education || "",
          experience: job.minimumQualifications?.experience || "",
          specialRequirements:
            job.minimumQualifications?.specialRequirements || [],
        },
        duties:
          Array.isArray(job.duties) && job.duties.length > 0
            ? job.duties
            : [""],
        supplementalInfo: job.supplementalInfo || "",
        requiredDocuments:
          Array.isArray(job.requiredDocuments) &&
          job.requiredDocuments.length > 0
            ? job.requiredDocuments
            : ["Resume", "Cover Letter"],
        supplementalQuestions:
          Array.isArray(job.supplementalQuestions) &&
          job.supplementalQuestions.length > 0
            ? job.supplementalQuestions.map((q) => {
                // Handle options that might be stored as string in Firestore
                const options = Array.isArray(q.options)
                  ? q.options
                  : typeof q.options === "string"
                    ? (q.options as string)
                        .split("\n")
                        .map((s: string) => s.trim())
                        .filter(Boolean)
                    : [];

                return {
                  ...q,
                  options,
                } as SupplementalQuestion;
              })
            : [],
        contact: {
          name: job.contact?.name || "",
          email: job.contact?.email || "",
          phone: job.contact?.phone || "",
        },
        examType: job.examType || "Unassembled",
        employmentType: job.employmentType || "Full-Time",
        workSchedule: job.workSchedule || "8:00 AM - 4:30 PM",
      });
    }
  }, [job, reset]);

  const submitWithStatus = async (data: JobFormData, status: JobStatus) => {
    if (isContinuous) {
      const opening = new Date(data.openingDate);
      const closing = new Date(data.closingDate);
      if (closing <= opening) {
        alert(
          "Warning: Closing date is not after opening date, even though 'continuous' is checked.",
        );
        return;
      }
    }

    // Set the appropriate loading state based on status
    if (status === "active") {
      setIsSubmittingPublish(true);
    } else {
      setIsSubmittingDraft(true);
    }

    console.log("Form Data:", data);

    // Transform supplemental questions: convert options from string to array
    const transformedData = {
      ...data,
      supplementalQuestions: data.supplementalQuestions?.map((question) => {
        const options = question.options;
        return {
          ...question,
          options:
            question.type === "dropdown" || question.type === "checkbox"
              ? Array.isArray(options)
                ? options
                : []
              : [],
        } as SupplementalQuestion;
      }),
    };

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...transformedData,
          status,
          companyId: user?.uid,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Show the actual error message from the API
        throw new Error(result.error || "Failed to update job");
      }

      logger.success("Job updated:", result);

      router.push("/dashboard/companies/jobs");
    } catch (error) {
      logger.error("Error updating job:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update job. Please try again.";
      alert(errorMessage);
    } finally {
      // Reset the appropriate loading state
      if (status === "active") {
        setIsSubmittingPublish(false);
      } else {
        setIsSubmittingDraft(false);
      }
    }
  };

  const onSubmit = async (data: JobFormData) => {
    await submitWithStatus(data, "active");
    setSubmitSuccess(true);
  };

  const onSubmitDraft = async (data: JobFormData) => {
    await submitWithStatus(data, "draft");
    setSubmitSuccess(true);
  };

  if (fetchingJob) {
    return <LoadingCard desc="Loading job data, please wait..." />;
  }

  if (fetchError) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div
            className={cn(
              frostedGlassBg,
              "text-center border border-white/20 rounded-2xl p-8 shadow-2xl",
            )}
          >
            <p className="text-red-700 font-semibold mb-4">
              Error loading job data
            </p>
            <Link
              href="/dashboard/companies/jobs"
              className="inline-flex items-center gap-2 text-cyan-700 font-semibold hover:text-cyan-900 hover:underline transition-colors"
            >
              Back to Jobs
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1000px] mx-auto">
          <div
            className={cn(
              frostedGlassBg,
              "border border-white/20 shadow-2xl rounded-2xl overflow-hidden",
            )}
          >
            {/* Header */}
            <div className="px-6 p-8 border-b border-white/30 bg-gradient-to-br from-white/40 to-white/20">
              <Link
                href="/dashboard/companies/jobs"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-cyan-700 transition-colors mb-4 group"
              >
                <svg
                  className="h-4 w-4 group-hover:-translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Jobs
              </Link>
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">
                    Edit Job Posting
                  </h1>
                  <p className="text-gray-700">
                    Update your job posting details
                  </p>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {submitSuccess && (
              <div className="bg-gradient-to-r from-green-50/90 to-emerald-50/90 backdrop-blur-sm border-l-4 border-green-500 p-4 m-6 rounded-xl shadow-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-semibold text-green-900">
                      Job posting updated successfully! Redirecting...
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="p-6 sm:p-8 space-y-10"
            >
              {/* Section 1: Basic Information */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gradient-to-r from-cyan-500 to-teal-500 flex items-center gap-3">
                  <span className="text-black">01</span>
                  Basic Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Job Title *
                    </label>
                    <input
                      {...register("title", {
                        required: "Job title is required",
                      })}
                      type="text"
                      placeholder="e.g., Human Services Professional I"
                      className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                    />
                    {errors.title && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <span>⚠</span> {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Position Number *
                    </label>
                    <input
                      {...register("positionNumber", {
                        required: "Position number is required",
                      })}
                      type="text"
                      placeholder="e.g., 12345"
                      className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                    />
                    {errors.positionNumber && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <span>⚠</span> {errors.positionNumber.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Job Type *
                    </label>
                    <select
                      {...register("recruitmentType", { required: true })}
                      className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 transition-all shadow-sm hover:shadow-md"
                    >
                      <option value="Open Competitive">Open Competitive</option>
                      <option value="Various">Various</option>
                      <option value="Promotional">Promotional</option>
                      <option value="Transfer">Transfer</option>
                      <option value="Reemployment">Reemployment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Department *
                    </label>
                    <input
                      {...register("department", {
                        required: "Department is required",
                      })}
                      type="text"
                      placeholder="e.g., Department of Public Safety"
                      className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                    />
                    {errors.department && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <span>⚠</span> {errors.department.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Division
                    </label>
                    <input
                      {...register("division")}
                      type="text"
                      placeholder="e.g., Corrections Division"
                      className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Location *
                    </label>
                    <input
                      {...register("location", {
                        required: "Location is required",
                      })}
                      type="text"
                      placeholder="e.g., Statewide"
                      className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                    />
                    {errors.location && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <span>⚠</span> {errors.location.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Island *
                    </label>
                    <select
                      {...register("island", { required: true })}
                      className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 transition-all shadow-sm hover:shadow-md"
                    >
                      <option value="Oahu">Oahu</option>
                      <option value="Maui">Maui</option>
                      <option value="Hawaii">Hawaii (Big Island)</option>
                      <option value="Kauai">Kauai</option>
                      <option value="Molokai">Molokai</option>
                      <option value="Lanai">Lanai</option>
                      <option value="Statewide">Statewide</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Section 2: Salary and Schedule */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gradient-to-r from-cyan-500 to-teal-500 flex items-center gap-3">
                  <span className="text-black">02</span>
                  Salary & Schedule
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Minimum Salary *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-black">
                        $
                      </span>
                      <input
                        {...register("salaryRange.min", {
                          required: "Minimum salary is required",
                          min: { value: 0, message: "Salary must be positive" },
                        })}
                        type="number"
                        className="w-full pl-8 pr-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                      />
                    </div>
                    {errors.salaryRange?.min && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        {errors.salaryRange.min.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Maximum Salary *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-black">
                        $
                      </span>
                      <input
                        {...register("salaryRange.max", {
                          required: "Maximum salary is required",
                          min: { value: 0, message: "Salary must be positive" },
                        })}
                        type="number"
                        className="w-full pl-8 pr-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                      />
                    </div>
                    {errors.salaryRange?.max && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        {errors.salaryRange.max.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Pay Frequency *
                    </label>
                    <select
                      {...register("salaryRange.frequency", { required: true })}
                      className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Bi-Weekly">Bi-Weekly</option>
                      <option value="Annual">Annual</option>
                      <option value="Hourly">Hourly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Employment Type *
                    </label>
                    <select
                      {...register("employmentType", { required: true })}
                      className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                    >
                      <option value="Full-Time">Full-Time</option>
                      <option value="Part-Time">Part-Time</option>
                      <option value="Temporary">Temporary</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Work Schedule
                    </label>
                    <input
                      {...register("workSchedule")}
                      type="text"
                      placeholder="e.g., 8:00 AM - 4:30 PM, Mon-Fri"
                      className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                    />
                  </div>
                </div>
              </section>

              {/* Section 3: Application Dates */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gradient-to-r from-cyan-500 to-teal-500 flex items-center gap-3">
                  <span className="text-black">03</span>
                  Application Period
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Opening Date *
                    </label>
                    <input
                      {...register("openingDate", {
                        required: "Opening date is required",
                      })}
                      type="date"
                      className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                    />
                    {errors.openingDate && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        {errors.openingDate.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Closing Date *
                    </label>

                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="continuousCheck"
                        checked={isContinuous}
                        disabled={
                          !!(
                            watch("closingDate") &&
                            watch("closingDate") !== "continuous"
                          )
                        }
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsContinuous(checked);

                          if (checked) {
                            setValue("closingDate", "continuous");
                          } else {
                            setValue("closingDate", "");
                          }
                        }}
                        className="h-4 w-4 text-black border-gray-300 rounded focus:ring-cyan-500"
                      />
                      <label
                        htmlFor="continuousCheck"
                        className="text-sm text-gray-900 font-medium"
                      >
                        Dates are continuous
                      </label>
                    </div>

                    <input
                      {...register("closingDate", {
                        required: !isContinuous
                          ? "Closing date is required"
                          : false,
                      })}
                      type="date"
                      disabled={isContinuous}
                      className="w-full mt-2 px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md disabled:bg-gray-200/50 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    {errors.closingDate && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        {errors.closingDate.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Number of Positions *
                    </label>
                    <input
                      {...register("positionCount", {
                        required: "Number of positions is required",
                        min: { value: 1, message: "Must be at least 1" },
                      })}
                      type="number"
                      min="1"
                      className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                    />
                    {errors.positionCount && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        {errors.positionCount.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Section 4: Minimum Qualifications */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gradient-to-r from-cyan-500 to-teal-500 flex items-center gap-3">
                  <span className="text-black">04</span>
                  Minimum Qualifications
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Education Requirements *
                    </label>
                    <textarea
                      {...register("minimumQualifications.education", {
                        required: "Education requirements are required",
                      })}
                      rows={4}
                      placeholder="e.g., Graduation from an accredited four (4) year college or university with a bachelor's degree in social work, psychology, counseling, education or closely related field..."
                      className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                    />
                    {errors.minimumQualifications?.education && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        {errors.minimumQualifications.education.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Experience Requirements *
                    </label>
                    <textarea
                      {...register("minimumQualifications.experience", {
                        required: "Experience requirements are required",
                      })}
                      rows={4}
                      placeholder="e.g., Minimum of one (1) year of professional work experience in social work, counseling, or related field..."
                      className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                    />
                    {errors.minimumQualifications?.experience && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        {errors.minimumQualifications.experience.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-semibold text-gray-900">
                        Special Requirements
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          // @ts-expect-error - appendReq expects string
                          appendReq("");
                        }}
                        className="text-sm font-semibold text-cyan-700 hover:text-cyan-900 transition-colors"
                      >
                        + Add Requirement
                      </button>
                    </div>
                    <div className="space-y-3">
                      {reqFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2">
                          <input
                            {...register(
                              `minimumQualifications.specialRequirements.${index}` as const,
                            )}
                            placeholder="e.g., Valid driver's license, Security clearance, etc."
                            className="flex-1 px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeReq(index)}
                            className="px-4 py-2 text-red-700 font-semibold hover:text-red-900 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 5: Duties and Responsibilities */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gradient-to-r from-cyan-500 to-teal-500 flex items-center gap-3">
                  <span className="text-black">05</span>
                  Duties and Responsibilities
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-gray-900">
                      List of Duties *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        // @ts-expect-error - appendDuty expects string
                        appendDuty("");
                      }}
                      className="text-sm font-semibold text-cyan-700 hover:text-cyan-900 transition-colors"
                    >
                      + Add Duty
                    </button>
                  </div>

                  {dutyFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <span className="text-gray-900 font-semibold mt-3">
                        {index + 1}.
                      </span>
                      <textarea
                        {...register(`duties.${index}` as const, {
                          required: "Duty description is required",
                        })}
                        rows={2}
                        placeholder="Enter duty description..."
                        className="flex-1 px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md resize-none"
                      />
                      {dutyFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDuty(index)}
                          className="px-4 py-2 text-red-700 font-semibold hover:text-red-900 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 6: Exam Type */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gradient-to-r from-cyan-500 to-teal-500 flex items-center gap-3">
                  <span className="text-black">06</span>
                  Testing Information
                </h2>

                <div>
                  <textarea
                    {...register("examType", { required: true })}
                    rows={6}
                    placeholder="The examination for this recruitment will be conducted on an unassembled basis where the examination score is based on an evaluation and rating of your education and experience."
                    className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md resize-none"
                  />
                </div>
              </section>

              {/* Section 7: Required Documents */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gradient-to-r from-cyan-500 to-teal-500 flex items-center gap-3">
                  <span className="text-black">07</span>
                  Required Application Documents
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-base text-black">
                      Documents to Submit *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        // @ts-expect-error - appendDoc expects string
                        appendDoc("");
                      }}
                      className="text-sm font-semibold text-gray-900"
                    >
                      + Add Document
                    </button>
                  </div>

                  {docFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <input
                        {...register(`requiredDocuments.${index}` as const, {
                          required: "Document name is required",
                        })}
                        placeholder="e.g., Resume, Cover Letter, Transcripts..."
                        className="flex-1 px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                      />
                      {docFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDoc(index)}
                          className="px-4 py-2 text-red-700 font-semibold hover:text-red-900 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 8: Supplemental Information */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gradient-to-r from-cyan-500 to-teal-500 flex items-center gap-3">
                  <span className="text-black">08</span>
                  Supplemental Information
                </h2>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Additional Information
                  </label>
                  <textarea
                    {...register("supplementalInfo")}
                    rows={6}
                    placeholder="Include any additional information about benefits, working conditions, career advancement opportunities, etc."
                    className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                  />
                </div>
              </section>

              {/* Section 8.5: Supplemental Questions */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gradient-to-r from-cyan-500 to-teal-500 flex items-center gap-3">
                  <span className="text-black">09</span>
                  Supplemental Questions
                </h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-600">
                      Add custom questions for applicants to answer during the
                      application process
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        appendQuestion({
                          id: `q_${Date.now()}`,
                          question: "",
                          type: "short_answer",
                          required: false,
                          options: [],
                        });
                      }}
                      className="text-sm  text-black font-bold text-base whitespace-nowrap"
                    >
                      + Add Question
                    </button>
                  </div>

                  {questionFields.map((field, index) => {
                    const questionType = watch(
                      `supplementalQuestions.${index}.type`,
                    );

                    return (
                      <div
                        key={field.id}
                        className="p-6 border border-white/50 rounded-xl bg-white/30 backdrop-blur-md shadow-md hover:shadow-lg transition-shadow"
                      >
                        <div className="space-y-4">
                          {/* Question Text */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                              Question {index + 1}
                            </label>
                            <textarea
                              {...register(
                                `supplementalQuestions.${index}.question` as const,
                                {
                                  required: "Question text is required",
                                },
                              )}
                              rows={2}
                              placeholder="Enter your question here..."
                              className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                            />
                          </div>

                          {/* Question Type and Required */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Question Type
                              </label>
                              <select
                                {...register(
                                  `supplementalQuestions.${index}.type` as const,
                                )}
                                className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                              >
                                <option value="short_answer">
                                  Short Answer
                                </option>
                                <option value="dropdown">
                                  Dropdown (Single Choice)
                                </option>
                                <option value="checkbox">
                                  Checkbox (Multiple Choice)
                                </option>
                              </select>
                            </div>

                            <div className="flex items-center">
                              <input
                                {...register(
                                  `supplementalQuestions.${index}.required` as const,
                                )}
                                type="checkbox"
                                id={`required-${index}`}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <label
                                htmlFor={`required-${index}`}
                                className="ml-2 text-sm text-black"
                              >
                                Required question
                              </label>
                            </div>
                          </div>

                          {/* Options for dropdown/checkbox */}
                          {(questionType === "dropdown" ||
                            questionType === "checkbox") && (
                            <div>
                              <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Options (one per line)
                              </label>
                              <textarea
                                {...register(
                                  `supplementalQuestions.${index}.options` as const,
                                )}
                                rows={4}
                                placeholder="Enter options separated by new lines&#10;Option 1&#10;Option 2&#10;Option 3"
                                className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 font-normal placeholder:text-gray-600 transition-all font-mono text-sm"
                              />
                              <p className="mt-1 text-xs text-black">
                                Each line will become a separate option
                              </p>
                            </div>
                          )}

                          {/* Remove Button */}
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeQuestion(index)}
                              className="px-4 py-2 text-sm text-red-900 font-semibold"
                            >
                              Remove Question
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {questionFields.length === 0 && (
                    <div className="text-center py-8 text-black">
                      No supplemental questions added yet. Click "Add Question"
                      to create one.
                    </div>
                  )}
                </div>
              </section>

              {/* Section 9: Contact Information */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gradient-to-r from-cyan-500 to-teal-500 flex items-center gap-3">
                  <span className="text-black">10</span>
                  Contact Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Contact Name *
                    </label>
                    <input
                      {...register("contact.name", {
                        required: "Contact name is required",
                      })}
                      type="text"
                      placeholder="e.g., John Doe"
                      className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                    />
                    {errors.contact?.name && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        {errors.contact.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Email *
                    </label>
                    <input
                      {...register("contact.email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      })}
                      type="email"
                      placeholder="contact@hawaii.gov"
                      className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                    />
                    {errors.contact?.email && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        {errors.contact.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Phone *
                    </label>
                    <input
                      {...register("contact.phone", {
                        required: "Phone is required",
                      })}
                      type="tel"
                      placeholder="(808) 123-4567"
                      className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/50 text-gray-900 placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md"
                    />
                    {errors.contact?.phone && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        {errors.contact.phone.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Submit Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-4 pt-8 border-t border-white/40">
                <Link
                  href="/dashboard/companies/jobs"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white/60 backdrop-blur-md border-2 border-white/70 text-gray-900 rounded-xl font-semibold hover:bg-white/80 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all transform hover:scale-105"
                >
                  Cancel
                </Link>

                <button
                  type="button"
                  onClick={handleSubmit(onSubmitDraft)}
                  disabled={isSubmittingDraft || isSubmittingPublish}
                  className="flex-1 cursor-pointer bg-gradient-to-r from-gray-600 to-gray-700 backdrop-blur-sm text-white py-3 px-6 rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100"
                >
                  {isSubmittingDraft ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    "Save as Draft"
                  )}
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingPublish || isSubmittingDraft}
                  className="flex-1 cursor-pointer bg-gradient-to-r from-cyan-600 to-teal-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-cyan-700 hover:to-teal-700 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100"
                >
                  {isSubmittingPublish ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Publishing...
                    </span>
                  ) : (
                    "Publish Job Posting"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Help Text */}
          <div
            className={cn(
              frostedGlassBg,
              "mt-8 text-center text-sm text-white/90 rounded-xl p-4 border border-white/20",
            )}
          >
            <p className="font-medium">
              * Required fields must be completed before submitting
            </p>
            <p className="mt-2">
              For assistance, contact DHRD at{" "}
              <a
                href="mailto:dhrd.recruitment@hawaii.gov"
                className="text-white font-semibold hover:text-cyan-300 hover:underline transition-colors"
              >
                dhrd.recruitment@hawaii.gov
              </a>
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
