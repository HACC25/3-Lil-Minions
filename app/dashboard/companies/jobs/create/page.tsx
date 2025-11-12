"use client";
import { DashboardLayout } from "@/components/dashboard";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Control } from "react-hook-form";

import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";
import { useAuth } from "@/lib/AuthContext";
import { JobStatus, JobFormData, SupplementalQuestion } from "@/types/job";
import { cn, frostedGlassBg } from "@/utils/styles";
import InterviewBotForm from "@/components/interview-bots/InterviewBotForm";

export default function JobPostingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  const [jobFormData, setJobFormData] = useState<JobFormData | null>(null);
  const [showBotSelection, setShowBotSelection] = useState(true); // Show selection by default on step 11
  const [selectedBotOption, setSelectedBotOption] = useState<
    "general" | "custom" | null
  >(null);
  const { user } = useAuth();
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    trigger,
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
  } = useFieldArray<JobFormData>({
    control: control as Control<JobFormData>,
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

  // Add this state at the top of your component
  const [isContinuous, setIsContinuous] = useState(false);

  const totalSteps = 11; // Updated from 10 to 11

  // Debug: Log when step 11 is reached with jobId
  useEffect(() => {
    if (currentStep === 11) {
      console.log("🎯 Step 11 reached with createdJobId:", createdJobId);
      console.log("📋 jobFormData available:", !!jobFormData);
      console.log("🔍 Typeof createdJobId:", typeof createdJobId);
      console.log("🔍 CreatedJobId is null?", createdJobId === null);
    }
  }, [currentStep, createdJobId, jobFormData]);

  // Step validation: define which fields are required for each step
  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof JobFormData)[] = [];

    switch (step) {
      case 1: // Basic Information
        fieldsToValidate = ["title", "department", "location"];
        break;
      case 2: // Salary and Schedule
        fieldsToValidate = ["employmentType", "workSchedule"];
        break;
      case 3: // Application Dates
        fieldsToValidate = ["openingDate", "positionCount"];
        break;
      case 4: // Minimum Qualifications
        fieldsToValidate = ["minimumQualifications"];
        break;
      case 5: // Duties
        fieldsToValidate = ["duties"];
        break;
      case 6: // Exam Type
        fieldsToValidate = ["examType"];
        break;
      case 7: // Required Documents
        fieldsToValidate = ["requiredDocuments"];
        break;
      case 8: // Supplemental Information
        // No required fields
        return true;
      case 9: // Supplemental Questions
        // Validate that if questions exist, they have required fields filled
        return true;
      case 10: // Contact Information
        fieldsToValidate = ["contact"];
        break;
      case 11: // Interview Bot - optional, no validation needed
        return true;
      default:
        return true;
    }

    const result = await trigger(fieldsToValidate);
    return result;
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Scroll to first error
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        const element = document.getElementsByName(firstError)[0];
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitWithStatus = async (data: JobFormData, status: JobStatus) => {
    // Prevent duplicate submissions
    if (isSubmitting) {
      console.log("⚠️ Submission already in progress, ignoring duplicate");
      return;
    }

    // Prevent re-submission if job already created
    if (createdJobId) {
      console.log("⚠️ Job already created, moving to step 11");
      setCurrentStep(11);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

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

    setIsSubmitting(true);

    console.log("Form Data:", data);

    // Transform supplemental questions: convert options from string to array
    const transformedData = {
      ...data,
      supplementalQuestions: data.supplementalQuestions?.map((question) => {
        // Handle options that might be in string format (from textarea input)
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
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...transformedData,
          status,
          companyId: user?.uid,
          applicationMethod: "platform", // Always use platform
        }),
      });

      const result = await response.json(); // Changed from 'data' to 'result'

      if (!response.ok) {
        // Show the actual error message from the API
        throw new Error(result.error || "Failed to create job");
      }

      logger.success("Job created:", result);

      // Store the job data and ID for the interview bot step
      setJobFormData(transformedData);
      setCreatedJobId(result.jobId); // API returns 'jobId', not 'id'
      console.log("✅ Job ID stored for bot creation:", result.jobId);

      setSubmitSuccess(true);

      // Move to step 11 (Interview Bot) regardless of status (active or draft)
      setCurrentStep(11);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      logger.error("Error creating job:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create job. Please try again.";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: JobFormData) => {
    setActiveButton("submit"); // Set active button to 'submit'
    await submitWithStatus(data, "active");
    setActiveButton(null); // Reset active button
  };

  const onSubmitDraft = async (data: JobFormData) => {
    setActiveButton("draft"); // Set active button to 'draft'
    await submitWithStatus(data, "draft");
    setActiveButton(null); // Reset active button
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1000px] mx-auto">
          <div
            className={cn(
              frostedGlassBg,
              "border border-white/20 shadow-xl rounded-lg overflow-hidden",
            )}
          >
            {/* Header */}
            <div className="px-6 py-8 border-b border-white/30">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Create Job Posting
                  </h1>
                  <p className="text-gray-800 mt-1">
                    State of Hawaii Department of Human Resources
                  </p>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {submitSuccess && (
              <div className="bg-green-100/80 backdrop-blur-sm border-l-4 border-green-600 p-4 m-6 rounded-lg">
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
                    <p className="text-sm font-medium text-green-900">
                      Job posting created successfully!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Indicator */}
            <div className="px-6 pt-6 pb-4 border-b border-white/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  Step {currentStep} of {totalSteps}
                </span>
                <span className="text-sm text-gray-700">
                  {Math.round((currentStep / totalSteps) * 100)}% Complete
                </span>
              </div>
              <div className="w-full bg-white/40 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-cyan-600 to-teal-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
              <div className="mt-3 text-sm font-medium text-gray-900">
                {currentStep === 1 && "Basic Information"}
                {currentStep === 2 && "Salary and Schedule"}
                {currentStep === 3 && "Application Dates"}
                {currentStep === 4 && "Minimum Qualifications"}
                {currentStep === 5 && "Duties and Responsibilities"}
                {currentStep === 6 && "Exam Type"}
                {currentStep === 7 && "Required Documents"}
                {currentStep === 8 && "Supplemental Information"}
                {currentStep === 9 && "Supplemental Questions"}
                {currentStep === 10 && "Contact Information"}
                {currentStep === 11 && "Interview Bot Setup"}
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
              {/* Section 1: Basic Information */}
              {currentStep === 1 && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-cyan-600">
                    Basic Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Title *
                      </label>
                      <input
                        {...register("title", {
                          required: "Job title is required",
                        })}
                        type="text"
                        placeholder="e.g., Human Services Professional I"
                        className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-800">
                          {errors.title.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Position Number *
                      </label>
                      <input
                        {...register("positionNumber", {
                          required: "Position number is required",
                        })}
                        type="text"
                        placeholder="e.g., 12345"
                        className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                      />
                      {errors.positionNumber && (
                        <p className="mt-1 text-sm text-red-800">
                          {errors.positionNumber.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Type *
                      </label>
                      <select
                        {...register("recruitmentType", { required: true })}
                        className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                      >
                        <option value="Open Competitive">
                          Open Competitive
                        </option>
                        <option value="Various">Various</option>
                        <option value="Promotional">Promotional</option>
                        <option value="Transfer">Transfer</option>
                        <option value="Reemployment">Reemployment</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department *
                      </label>
                      <input
                        {...register("department", {
                          required: "Department is required",
                        })}
                        type="text"
                        placeholder="e.g., Department of Public Safety"
                        className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                      />
                      {errors.department && (
                        <p className="mt-1 text-sm text-red-800">
                          {errors.department.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Division
                      </label>
                      <input
                        {...register("division")}
                        type="text"
                        placeholder="e.g., Corrections Division"
                        className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location *
                      </label>
                      <input
                        {...register("location", {
                          required: "Location is required",
                        })}
                        type="text"
                        placeholder="e.g., Statewide"
                        className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                      />
                      {errors.location && (
                        <p className="mt-1 text-sm text-red-800">
                          {errors.location.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black-700 mb-2">
                        Island *
                      </label>
                      <select
                        {...register("island", { required: true })}
                        className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
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
              )}

              {/* Section 2: Salary and Schedule */}
              {currentStep === 2 && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-cyan-600">
                    Salary & Schedule
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Salary *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">
                          $
                        </span>
                        <input
                          {...register("salaryRange.min", {
                            required: "Minimum salary is required",
                            min: {
                              value: 0,
                              message: "Salary must be positive",
                            },
                          })}
                          type="number"
                          className="w-full pl-8 pr-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                        />
                      </div>
                      {errors.salaryRange?.min && (
                        <p className="mt-1 text-sm text-red-800">
                          {errors.salaryRange.min.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Salary *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">
                          $
                        </span>
                        <input
                          {...register("salaryRange.max", {
                            required: "Maximum salary is required",
                            min: {
                              value: 0,
                              message: "Salary must be positive",
                            },
                          })}
                          type="number"
                          className="w-full pl-8 pr-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                        />
                      </div>
                      {errors.salaryRange?.max && (
                        <p className="mt-1 text-sm text-red-800">
                          {errors.salaryRange.max.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pay Frequency *
                      </label>
                      <select
                        {...register("salaryRange.frequency", {
                          required: true,
                        })}
                        className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Bi-Weekly">Bi-Weekly</option>
                        <option value="Annual">Annual</option>
                        <option value="Hourly">Hourly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Employment Type *
                      </label>
                      <select
                        {...register("employmentType", { required: true })}
                        className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                      >
                        <option value="Full-Time">Full-Time</option>
                        <option value="Part-Time">Part-Time</option>
                        <option value="Temporary">Temporary</option>
                        <option value="Contract">Contract</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Work Schedule
                      </label>
                      <input
                        {...register("workSchedule")}
                        type="text"
                        placeholder="e.g., 8:00 AM - 4:30 PM, Mon-Fri"
                        className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* Section 3: Application Dates */}
              {currentStep === 3 && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-cyan-600">
                    Application Period
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Opening Date *
                      </label>
                      <input
                        {...register("openingDate", {
                          required: "Opening date is required",
                        })}
                        type="date"
                        className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                      />
                      {errors.openingDate && (
                        <p className="mt-1 text-sm text-red-800">
                          {errors.openingDate.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          } // disable if date entered
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setIsContinuous(checked);

                            if (checked) {
                              setValue("closingDate", "continuous"); // mark as continuous
                            } else {
                              setValue("closingDate", ""); // allow date input again
                            }
                          }}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor="continuousCheck"
                          className="text-sm text-gray-700"
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
                        disabled={isContinuous} // disable date input if continuous
                        className="w-full mt-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                      />

                      {errors.closingDate && (
                        <p className="mt-1 text-sm text-red-800">
                          {errors.closingDate.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Positions *
                      </label>
                      <input
                        {...register("positionCount", {
                          required: "Number of positions is required",
                          min: { value: 1, message: "Must be at least 1" },
                        })}
                        type="number"
                        min="1"
                        className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                      />
                      {errors.positionCount && (
                        <p className="mt-1 text-sm text-red-800">
                          {errors.positionCount.message}
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Section 4: Minimum Qualifications */}
              {currentStep === 4 && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-cyan-600">
                    Minimum Qualifications
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Education Requirements *
                      </label>
                      <textarea
                        {...register("minimumQualifications.education", {
                          required: "Education requirements are required",
                        })}
                        rows={4}
                        placeholder="e.g., Graduation from an accredited four (4) year college or university with a bachelor's degree in social work, psychology, counseling, education or closely related field..."
                        className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                      />
                      {errors.minimumQualifications?.education && (
                        <p className="mt-1 text-sm text-red-800">
                          {errors.minimumQualifications.education.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience Requirements *
                      </label>
                      <textarea
                        {...register("minimumQualifications.experience", {
                          required: "Experience requirements are required",
                        })}
                        rows={4}
                        placeholder="e.g., Minimum of one (1) year of professional work experience in social work, counseling, or related field..."
                        className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                      />
                      {errors.minimumQualifications?.experience && (
                        <p className="mt-1 text-sm text-red-800">
                          {errors.minimumQualifications.experience.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Special Requirements
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            // @ts-expect-error - appendReq expects string
                            appendReq("");
                          }}
                          className="text-sm text-cyan-700 hover:text-cyan-800 font-medium transition-colors"
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
                              className="flex-1 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => removeReq(index)}
                              className="px-4 py-2 text-red-800 hover:text-red-700 font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Section 5: Duties and Responsibilities */}
              {currentStep === 5 && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-cyan-600">
                    Duties and Responsibilities
                  </h2>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        List of Duties *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                          // @ts-ignore
                          appendDuty("");
                        }}
                        className="text-sm text-cyan-700 hover:text-cyan-800 font-medium transition-colors"
                      >
                        + Add Duty
                      </button>
                    </div>

                    {dutyFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <span className="text-gray-500 mt-2">{index + 1}.</span>
                        <textarea
                          {...register(`duties.${index}` as const, {
                            required: "Duty description is required",
                          })}
                          rows={2}
                          placeholder="Enter duty description..."
                          className="flex-1 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                        />
                        {dutyFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDuty(index)}
                            className="px-4 py-2 text-red-800 hover:text-red-700 font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Section 6: Exam Type */}
              {currentStep === 6 && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-cyan-600">
                    Testing Information
                  </h2>

                  <div>
                    <textarea
                      {...register("examType", { required: true })}
                      rows={6}
                      placeholder="The examination for this recruitment will be conducted on an unassembled basis where the examination score is based on an evaluation and rating of your education and experience."
                      className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 placeholder:text-gray-600 transition-all"
                    />
                  </div>
                </section>
              )}

              {/* Section 7: Required Documents */}
              {currentStep === 7 && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-cyan-600">
                    Required Application Documents
                  </h2>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Documents to Submit *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          // @ts-expect-error - appendDoc expects string
                          appendDoc("");
                        }}
                        className="text-sm text-cyan-700 hover:text-cyan-800 font-medium transition-colors"
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
                          className="flex-1 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                        />
                        {docFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDoc(index)}
                            className="px-4 py-2 text-red-800 hover:text-red-700 font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Section 8: Supplemental Information */}
              {currentStep === 8 && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-cyan-600">
                    Supplemental Information
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Information
                    </label>
                    <textarea
                      {...register("supplementalInfo")}
                      rows={6}
                      placeholder="Include any additional information about benefits, working conditions, career advancement opportunities, etc."
                      className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 placeholder:text-gray-600 transition-all"
                    />
                  </div>
                </section>
              )}

              {/* Section 8.5: Supplemental Questions */}
              {currentStep === 9 && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-cyan-600">
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
                        className="text-sm text-cyan-700 hover:text-cyan-800 font-medium whitespace-nowrap transition-colors"
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
                          className="p-4 border border-white/60 rounded-lg bg-white/40 backdrop-blur-sm"
                        >
                          <div className="space-y-4">
                            {/* Question Text */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                              />
                            </div>

                            {/* Question Type and Required */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Question Type
                                </label>
                                <select
                                  {...register(
                                    `supplementalQuestions.${index}.type` as const,
                                  )}
                                  className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
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
                                  className="ml-2 text-sm text-gray-700"
                                >
                                  Required question
                                </label>
                              </div>
                            </div>

                            {/* Options for dropdown/checkbox */}
                            {(questionType === "dropdown" ||
                              questionType === "checkbox") && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Options (one per line)
                                </label>
                                <textarea
                                  {...register(
                                    `supplementalQuestions.${index}.options` as const,
                                  )}
                                  rows={4}
                                  placeholder="Enter options separated by new lines&#10;Option 1&#10;Option 2&#10;Option 3"
                                  className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 font-normal placeholder:text-gray-600 font-mono text-sm transition-all"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                  Each line will become a separate option
                                </p>
                              </div>
                            )}

                            {/* Remove Button */}
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeQuestion(index)}
                                className="px-4 py-2 text-sm text-red-800 hover:text-red-700 font-medium"
                              >
                                Remove Question
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {questionFields.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No supplemental questions added yet. Click "Add
                        Question" to create one.
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Section 10: Contact Information */}
              {currentStep === 10 && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-cyan-600">
                    Contact Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Name *
                      </label>
                      <input
                        {...register("contact.name", {
                          required: "Contact name is required",
                        })}
                        type="text"
                        placeholder="e.g., John Doe"
                        className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                      />
                      {errors.contact?.name && (
                        <p className="mt-1 text-sm text-red-800">
                          {errors.contact.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                      />
                      {errors.contact?.email && (
                        <p className="mt-1 text-sm text-red-800">
                          {errors.contact.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone *
                      </label>
                      <input
                        {...register("contact.phone", {
                          required: "Phone is required",
                        })}
                        type="tel"
                        placeholder="(808) 123-4567"
                        className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white/30 text-gray-900 text-base font-normal placeholder:text-gray-600 transition-all"
                      />
                      {errors.contact?.phone && (
                        <p className="mt-1 text-sm text-red-800">
                          {errors.contact.phone.message}
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Section 11: Interview Bot Setup */}
              {currentStep === 11 && (
                <section>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 pb-2 border-b-2 border-cyan-600">
                      Second Round Interview Setup
                    </h2>
                    <p className="text-sm text-gray-700 mt-2">
                      Create an AI-powered interview for this position. The bot
                      will conduct preliminary interviews with candidates
                      automatically.
                    </p>
                  </div>

                  {jobFormData && user?.uid && (
                    <>
                      {/* Bot Selection UI */}
                      {showBotSelection && (
                        <div className="space-y-6">
                          <div className="text-center mb-8">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              Choose Your Second Round AI Interview
                            </h3>
                            <p className="text-sm text-gray-600">
                              Select the type of interview bot you want to use
                              for this position
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* General Interviewer Option */}
                            <div
                              onClick={() => {
                                setSelectedBotOption("general");
                                // Redirect immediately since general bot is already hardcoded
                                router.push("/dashboard/companies/jobs");
                              }}
                              className="cursor-pointer group relative bg-white/50 backdrop-blur-sm border-2 border-white/60 rounded-xl p-8 hover:border-cyan-500 hover:bg-white/70 transition-all hover:shadow-xl"
                            >
                              <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <svg
                                    className="w-8 h-8 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                                    Use General Interviewer
                                  </h4>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    Quick and easy setup using our
                                    pre-configured general interview bot with
                                    standard questions.
                                  </p>
                                </div>
                                <div className="mt-4 space-y-2 text-left w-full">
                                  <div className="flex items-center text-sm text-gray-700">
                                    <svg
                                      className="w-4 h-4 text-green-600 mr-2"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <span>Ready to use immediately</span>
                                  </div>
                                  <div className="flex items-center text-sm text-gray-700">
                                    <svg
                                      className="w-4 h-4 text-green-600 mr-2"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <span>No configuration needed</span>
                                  </div>
                                  <div className="flex items-center text-sm text-gray-700">
                                    <svg
                                      className="w-4 h-4 text-green-600 mr-2"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <span>Standard interview questions</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Custom Interviewer Option */}
                            <div
                              onClick={() => {
                                setSelectedBotOption("custom");
                                setShowBotSelection(false);
                              }}
                              className="cursor-pointer group relative bg-white/50 backdrop-blur-sm border-2 border-white/60 rounded-xl p-8 hover:border-purple-500 hover:bg-white/70 transition-all hover:shadow-xl"
                            >
                              <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <svg
                                    className="w-8 h-8 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                                    />
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                                    Create Custom Bot
                                  </h4>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    Fully customize your interview bot with
                                    position-specific questions and
                                    requirements.
                                  </p>
                                </div>
                                <div className="mt-4 space-y-2 text-left w-full">
                                  <div className="flex items-center text-sm text-gray-700">
                                    <svg
                                      className="w-4 h-4 text-purple-600 mr-2"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <span>Tailored to this position</span>
                                  </div>
                                  <div className="flex items-center text-sm text-gray-700">
                                    <svg
                                      className="w-4 h-4 text-purple-600 mr-2"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <span>Custom questions & scoring</span>
                                  </div>
                                  <div className="flex items-center text-sm text-gray-700">
                                    <svg
                                      className="w-4 h-4 text-purple-600 mr-2"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <span>AI-powered prefill available</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Custom Bot Form */}
                      {!showBotSelection && selectedBotOption === "custom" && (
                        <InterviewBotForm
                          key={createdJobId || "no-job"}
                          isLightMode={false}
                          companyId={user.uid}
                          companyName={user.displayName || "State of Hawaii"}
                          jobId={createdJobId || undefined}
                          jobPostingData={{
                            jobTitle: jobFormData.title,
                            title: jobFormData.title,
                            jobDescription:
                              jobFormData.duties?.join("\n\n") || "",
                            description: jobFormData.duties?.join("\n\n") || "",
                            requirements:
                              jobFormData.minimumQualifications?.education ||
                              "",
                            responsibilities:
                              jobFormData.minimumQualifications?.experience ||
                              "",
                            companyDescription: jobFormData.department || "",
                            companyIndustry: "Government",
                            industry: "Government",
                            salary: `$${jobFormData.salaryRange?.min} - $${jobFormData.salaryRange?.max} ${jobFormData.salaryRange?.frequency}`,
                            salaryRange: `$${jobFormData.salaryRange?.min} - $${jobFormData.salaryRange?.max}`,
                            location: jobFormData.location,
                            employmentType: jobFormData.employmentType,
                            type: jobFormData.employmentType,
                            department: jobFormData.department,
                            minimumQualifications:
                              jobFormData.minimumQualifications?.education ||
                              "",
                            duties: jobFormData.duties || [],
                          }}
                          onSuccess={(botId: string) => {
                            logger.success("Interview bot created:", botId);
                            // Redirect to jobs dashboard after successful bot creation
                            router.push("/dashboard/companies/jobs");
                          }}
                          onCancel={() => {
                            // Go back to selection or skip to dashboard
                            setShowBotSelection(true);
                            setSelectedBotOption(null);
                          }}
                          embedded={true}
                          hideHeader={true}
                        />
                      )}
                    </>
                  )}

                  {!jobFormData && (
                    <div className="text-center py-12">
                      <p className="text-gray-600">
                        Please complete the previous steps to create the job
                        posting first.
                      </p>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(10)}
                        className="mt-4 px-6 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-all"
                      >
                        Go Back to Step 10
                      </button>
                    </div>
                  )}
                </section>
              )}

              {/* Navigation Buttons */}
              {currentStep !== 11 && (
                <div className="flex justify-between gap-4 pt-6 border-t border-white/30">
                  {/* Previous Button */}
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-6 py-3 bg-white/50 backdrop-blur-sm border border-white/60 text-gray-900 rounded-lg font-semibold hover:bg-white/70 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all"
                    >
                      Previous
                    </button>
                  )}

                  <div className="flex-1"></div>

                  {/* Next or Submit Buttons */}
                  {currentStep < 10 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-teal-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all"
                    >
                      Next
                    </button>
                  ) : (
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={handleSubmit((data) => onSubmitDraft(data))}
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-gray-700/80 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-gray-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {activeButton === "draft"
                          ? "Publishing Draft..."
                          : "Save as Draft"}
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit((data) => onSubmit(data))}
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-teal-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {activeButton === "submit" ? "Publishing..." : "Submit"}
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => reset()}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-white/50 backdrop-blur-sm border-2 border-white/60 text-gray-900 rounded-lg font-semibold hover:bg-white/70 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Clear Form
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center text-sm text-white">
            <p>* Required fields must be completed before submitting</p>
            <p className="mt-2">
              For assistance, contact DHRD at{" "}
              <a
                href="mailto:dhrd.recruitment@hawaii.gov"
                className="text-white font-semibold hover:text-cyan-800 font-medium hover:underline transition-colors"
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
