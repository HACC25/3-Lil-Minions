/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { logger } from "@/lib/logger";
import { useJob } from "@/hooks/useJob";
import type { ApplicationFormData } from "@/types/application";
import { ResumeUploadPrefill } from "@/components/apply/ResumeUploadPrefill";
import type { PrefilledApplicationData } from "@/utils/resume-parser";
import { hasStoredResume, getResumeFromStorage } from "@/utils/resumeStorage";
import { bgUrl } from "@/utils/styles";

export default function HawaiiJobApplicationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showResumePrefill, setShowResumePrefill] = useState(false);
  const [resumeDataLoaded, setResumeDataLoaded] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;
  const { job } = useJob(jobId);

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const handleFileUpload = (
    documentType: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFiles((prev) => ({
      ...prev,
      [documentType]: file,
    }));
  };

  const handleRemoveFile = (documentType: string) => {
    setUploadedFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[documentType];
      return newFiles;
    });
  };
  const {
    register,
    control,
    handleSubmit,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      phone: "",
      email: "",
      dateOfBirth: "",
      workHistory: [],
      education: [],
      certifications: [],
      veteranStatus: "",
      skills: [],
      languages: [],
      references: [],

      q01_careerOpportunities: [],
      q02_readUnderstoodAgreed: false,
      q03_acknowledgeContinued: false,
      q04_minimumQualifications: false,
    },
  });

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

  // Check for resume in localStorage on mount
  useEffect(() => {
    if (hasStoredResume() && !resumeDataLoaded) {
      const { metadata } = getResumeFromStorage();
      if (metadata) {
        console.log("📄 Found stored resume:", metadata.fileName);
        // Auto-show the prefill modal if resume exists
        setShowResumePrefill(true);
      }
    }
  }, [resumeDataLoaded]);

  // Auto-populate resume in required documents if needed
  useEffect(() => {
    if (job?.requiredDocuments && hasStoredResume()) {
      const { file: storedFile } = getResumeFromStorage();

      if (storedFile) {
        // Check if resume/CV is in required documents
        const resumeDocTypes = job.requiredDocuments.filter(
          (doc) =>
            doc.toLowerCase().includes("resume") ||
            doc.toLowerCase().includes("cv") ||
            doc.toLowerCase() === "resume/cv",
        );

        // Auto-populate the resume for all matching document types
        if (
          resumeDocTypes.length > 0 &&
          Object.keys(uploadedFiles).length === 0
        ) {
          console.log(
            "📎 Auto-populating resume for required documents:",
            resumeDocTypes,
          );

          const newFiles: Record<string, File> = {};
          resumeDocTypes.forEach((docType) => {
            newFiles[docType] = storedFile;
          });

          setUploadedFiles(newFiles);
        }
      }
    }
  }, [job, uploadedFiles]); // Handle resume prefill
  const handleResumePrefill = (data: PrefilledApplicationData) => {
    console.log("📝 Applying prefilled data to form:", data);

    // Reset form with prefilled data
    reset({
      ...data,
      // Keep the supplemental questions from default values
      q01_careerOpportunities: [],
      q02_readUnderstoodAgreed: false,
      q03_acknowledgeContinued: false,
      q04_minimumQualifications: false,
      q05_generalExperience: "",
      q06_specializedExperience: "",
    } as ApplicationFormData);

    setResumeDataLoaded(true);
    setShowResumePrefill(false);

    // Show success message
    alert(
      "✅ Resume data has been loaded! Please review and edit any fields before submitting.",
    );
  };

  const {
    fields: workFields,
    append: appendWork,
    remove: removeWork,
  } = useFieldArray({
    control,
    name: "workHistory",
  });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({
    control,
    name: "education",
  });

  const {
    fields: certificationFields,
    append: appendCertification,
    remove: removeCertification,
  } = useFieldArray({
    control,
    name: "certifications",
  });

  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({
    control,
    name: "skills",
  });

  const {
    fields: languageFields,
    append: appendLanguage,
    remove: removeLanguage,
  } = useFieldArray({
    control,
    name: "languages",
  });

  const {
    fields: referenceFields,
    append: appendReference,
    remove: removeReference,
  } = useFieldArray({
    control,
    name: "references",
  });

  const totalSteps = 9;

  // Step validation: define which fields are required for each step
  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: string[] = [];

    switch (step) {
      case 1: // General Information
        fieldsToValidate = [
          "firstName",
          "lastName",
          "email",
          "phone",
          "city",
          "address",
          "state",
          "dateOfBirth",
          "zipCode",
          "country",
        ];
        break;
      case 2: // Work History
        return true;
      case 3: // Education
        // Validate at least one education entry
        return true; // Optional, users can skip
      case 4: // Additional Information (Certifications, Veteran Status)
        fieldsToValidate = ["veteranStatus"];
        break;
      case 5: // Skills
        return true; // Optional
      case 6: // Languages
        return true; // Optional
      case 7: // References
        return true; // Optional
      case 8: // Attachments
        // Validate required documents are uploaded
        if (job?.requiredDocuments && job.requiredDocuments.length > 0) {
          const missingDocuments = job.requiredDocuments.filter(
            (doc) => !uploadedFiles[doc],
          );
          if (missingDocuments.length > 0) {
            alert(
              `Please upload all required documents: ${missingDocuments.join(", ")}`,
            );
            return false;
          }
        }
        return true;
      case 9: // Supplemental Questions
        // Validate required supplemental questions
        return true; // Validation happens on submit
      default:
        return true;
    }

    const result = await trigger(fieldsToValidate as any);
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

  const onSubmit = async (data: ApplicationFormData) => {
    // Validate all required documents
    if (job?.requiredDocuments && job.requiredDocuments.length > 0) {
      const missingDocuments = job.requiredDocuments.filter(
        (doc) => !uploadedFiles[doc],
      );

      if (missingDocuments.length > 0) {
        alert(
          `Please upload all required documents: ${missingDocuments.join(", ")}`,
        );
        setCurrentStep(8); // Go to attachments step
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Create FormData for file uploads
      const formData = new FormData();

      // Add form data as JSON string
      formData.append("applicationData", JSON.stringify(data));
      formData.append("jobId", jobId);

      // Add all uploaded files
      Object.entries(uploadedFiles).forEach(([documentType, file]) => {
        formData.append(documentType, file);
      });

      // Log what we're sending (for debugging)
      logger.info(
        "Submitting application with files:",
        Object.keys(uploadedFiles),
      );

      const response = await fetch("/api/applications", {
        method: "POST",

        body: formData, //
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit application");
      }

      logger.success("Application submitted successfully:", result);
      setSubmitSuccess(true);

      // Redirect to confirmation page with applicationId
      const applicationId = result.applicationId;
      console.log("Redirecting to confirmation page:", { applicationId });

      router.push(
        `/jobs/${jobId}/apply/confirmation?applicationId=${applicationId}`,
      );
    } catch (error) {
      logger.error("Error submitting application:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to submit application. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    "General Information",
    "Work History",
    "Education",
    "Additional Information",
    "Skills",
    "Languages",
    "References",
    "Attachments",
    "Supplemental Questions",
  ];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative">
      {/* Blurred Background Layer */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, -1)), url(${bgUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          filter: "blur(2px)",
        }}
      />
      {/* <BgOverlay /> */}
      {/* Resume Upload Prefill Modal */}
      {showResumePrefill && (
        <ResumeUploadPrefill
          onPrefillComplete={handleResumePrefill}
          onClose={() => setShowResumePrefill(false)}
        />
      )}

      <div className="max-w-[1000px] mx-auto relative z-10">
        <div className="border border-white/10 bg-white/20 backdrop-blur-md shadow-xl rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-green-800/20 border-b border-green-800/30 px-6 py-8">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                {logoUrl && (
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
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
                <h1 className="text-3xl font-bold text-black">{job?.title}</h1>
              </div>
              {!resumeDataLoaded && (
                <button
                  onClick={() => setShowResumePrefill(true)}
                  className="px-4 py-3 bg-white/60 backdrop-blur-md border border-white/40 text-black rounded-lg font-medium hover:bg-white/40 transition-colors text-sm flex items-center space-x-2 whitespace-nowrap"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span>Auto-Fill from Resume</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white/10 px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-black">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm text-black/80">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-green-800 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
            <div className="mt-3 text-sm font-medium text-black">
              {steps[currentStep - 1]}
            </div>
          </div>

          {/* Success Message */}
          {submitSuccess && (
            <div className="bg-emerald-500/20 border border-emerald-400/30 p-4 m-6 rounded-lg">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-green-900"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="ml-3 text-sm font-medium text-black">
                  Application submitted successfully! Preparing your
                  confirmation...
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
            <p className="text-sm text-black/80">
              Fields marked with an asterisk (*) are required
            </p>

            {/* Step 1: General Information */}
            {currentStep === 1 && (
              <section>
                <h2 className="text-2xl font-bold text-black mb-6">
                  General Information
                </h2>

                {/* Contact Information */}
                <div className="bg-white/60 p-6 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold text-black mb-4">
                    Contact Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        First Name *
                      </label>
                      <input
                        {...register("firstName", {
                          required: "First name is required",
                        })}
                        type="text"
                        placeholder="First Name"
                        className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                      />
                      {errors.firstName && (
                        <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Last Name *
                      </label>
                      <input
                        {...register("lastName", {
                          required: "Last name is required",
                        })}
                        type="text"
                        placeholder="Last Name"
                        className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                      />
                      {errors.lastName && (
                        <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-black mb-2">
                        Address *
                      </label>
                      <input
                        {...register("address", {
                          required: "Address is required",
                        })}
                        type="text"
                        className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                      />
                      {errors.address && (
                        <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                          {errors.address.message}
                        </p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-black mb-2">
                        City *
                      </label>
                      <input
                        {...register("city", {
                          required: "City is required",
                        })}
                        type="text"
                        className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                      />
                      {errors.city && (
                        <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                          {errors.city.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        State *
                      </label>
                      <select
                        {...register("state", {
                          required: "State is required",
                        })}
                        className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black"
                      >
                        <option value="HI">Hawaii</option>
                        <option value="AL">Alabama</option>
                        <option value="CA">California</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        ZIP *
                      </label>
                      <input
                        {...register("zipCode", {
                          required: "ZIP is required",
                        })}
                        type="text"
                        className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                      />
                      {errors.zipCode && (
                        <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                          {errors.zipCode.message}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Add country field */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Country *
                      </label>
                      <input
                        {...register("country", {
                          required: "Country is required",
                        })}
                        type="text"
                        placeholder="e.g., United States"
                        className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                      />
                      {errors.country && (
                        <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                          {errors.country.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Phone *
                    </label>
                    <input
                      {...register("phone", {
                        required: "Phone is required",
                      })}
                      type="tel"
                      className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                    />
                    {errors.phone && (
                      <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Email *
                    </label>
                    <input
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email",
                        },
                      })}
                      type="email"
                      className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                    />
                    {errors.email && (
                      <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-white/60 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-black mb-4">
                    Personal Information
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Date of Birth *
                    </label>
                    <input
                      {...register("dateOfBirth", {
                        required: "Date of birth is required",
                      })}
                      type="date"
                      className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                    />
                    {errors.dateOfBirth && (
                      <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                        {errors.dateOfBirth.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Step 2: Work History */}
            {currentStep === 2 && (
              <section>
                <h2 className="text-2xl font-bold text-black mb-6">
                  Work History
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    appendWork({
                      employerName: "",
                      employerType: "",
                      startDate: "",
                      endDate: "",
                      stillEmployed: false,
                      hoursPerWeek: 40,
                      jobTitle: "",
                      salary: "",
                      address: "",
                      city: "",
                      state: "",
                      zipCode: "",
                      country: "US",
                      supervisorName: "",
                      supervisorTitle: "",
                      mayContactEmployer: true,
                      reasonForLeaving: "",
                      duties: "",
                    })
                  }
                  className="mb-6 cursor-pointer py-1 bg-white/60 px-3 rounded-md  text-black font-medium text-sm"
                >
                  + Add Work Experience
                </button>

                <p className="text-sm text-black/80 mb-6">
                  Fields marked with an asterisk (*) are required
                </p>

                {workFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="bg-white/60 p-6 rounded-lg mb-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-black">
                        Work Experience {index + 1}
                      </h3>
                      {workFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeWork(index)}
                          className="text-black cursor-pointer py-1 bg-white/60 px-3 rounded-md  text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            Employer Name *
                          </label>
                          <input
                            {...register(
                              `workHistory.${index}.employerName` as const,
                              { required: true },
                            )}
                            type="text"
                            className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                          />
                          {(errors as any).workHistory?.[index]
                            ?.employerName && (
                            <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                              {(errors as any).workHistory?.[index]
                                ?.employerName?.message ||
                                "Employer name is required"}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            Job Title *
                          </label>
                          <input
                            {...register(
                              `workHistory.${index}.jobTitle` as const,
                              { required: true },
                            )}
                            type="text"
                            className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                          />
                          {(errors as any).workHistory?.[index]?.jobTitle && (
                            <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                              {(errors as any).workHistory?.[index]?.jobTitle
                                ?.message || "Job title is required"}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            Start Date *
                          </label>
                          <input
                            {...register(
                              `workHistory.${index}.startDate` as const,
                              { required: true },
                            )}
                            type="date"
                            className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                          />
                          {(errors as any).workHistory?.[index]?.startDate && (
                            <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                              {(errors as any).workHistory?.[index]?.startDate
                                ?.message || "Start date is required"}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            End Date
                          </label>
                          <input
                            {...register(
                              `workHistory.${index}.endDate` as const,
                            )}
                            type="date"
                            disabled={watch(
                              `workHistory.${index}.stillEmployed`,
                            )}
                            className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg disabled:bg-white/5 disabled:opacity-60 text-black placeholder:text-black/50"
                          />
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          {...register(
                            `workHistory.${index}.stillEmployed` as const,
                          )}
                          type="checkbox"
                          className="h-4 w-4 text-emerald-500 rounded bg-white/60 border-white/30"
                        />
                        <label className="ml-2 text-sm text-black">
                          I currently work here
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Hours Per Week *
                        </label>
                        <input
                          {...register(
                            `workHistory.${index}.hoursPerWeek` as const,
                            { required: true },
                          )}
                          type="number"
                          className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                        />
                        {(errors as any).workHistory?.[index]?.hoursPerWeek && (
                          <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                            {(errors as any).workHistory?.[index]?.hoursPerWeek
                              ?.message || "Hours per week is required"}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Supervisor Name
                        </label>
                        <input
                          {...register(
                            `workHistory.${index}.supervisorName` as const,
                          )}
                          type="text"
                          className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          May we contact this employer?
                        </label>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center text-black">
                            <input
                              {...register(
                                `workHistory.${index}.mayContactEmployer` as const,
                              )}
                              type="radio"
                              value="true"
                              className="mr-2"
                            />
                            Yes
                          </label>
                          <label className="flex items-center text-black">
                            <input
                              {...register(
                                `workHistory.${index}.mayContactEmployer` as const,
                              )}
                              type="radio"
                              value="false"
                              className="mr-2"
                            />
                            No
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Reason for Leaving
                        </label>
                        <input
                          {...register(
                            `workHistory.${index}.reasonForLeaving` as const,
                          )}
                          type="text"
                          className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Job Duties *
                        </label>
                        <textarea
                          {...register(`workHistory.${index}.duties` as const, {
                            required: true,
                          })}
                          rows={4}
                          className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                        />
                        {(errors as any).workHistory?.[index]?.duties && (
                          <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                            {(errors as any).workHistory?.[index]?.duties
                              ?.message || "Job duties are required"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Step 3: Education */}
            {currentStep === 3 && (
              <section>
                <h2 className="text-2xl font-bold text-black mb-6">
                  Education
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    appendEducation({
                      institutionName: "",
                      major: "",
                      degree: "",
                      city: "",
                      state: "",
                      credits: "",
                      graduated: false,
                      graduationDate: "",
                    })
                  }
                  className="mb-6 cursor-pointer py-1 bg-white/60 px-3 rounded-md  text-black font-medium text-sm"
                >
                  + Add Education
                </button>

                {educationFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="bg-white/60 p-6 rounded-lg mb-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-black">
                        Education {index + 1}
                      </h3>
                      {educationFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEducation(index)}
                          className="text-black cursor-pointer py-1 bg-white/60 px-3 rounded-md  text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Institution Name *
                        </label>
                        <input
                          {...register(
                            `education.${index}.institutionName` as const,
                            { required: true },
                          )}
                          type="text"
                          className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                        />
                        {(errors as any).education?.[index]
                          ?.institutionName && (
                          <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                            {(errors as any).education?.[index]?.institutionName
                              ?.message || "Institution name is required"}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            Major
                          </label>
                          <input
                            {...register(`education.${index}.major` as const)}
                            type="text"
                            className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            Degree *
                          </label>
                          <select
                            {...register(`education.${index}.degree` as const, {
                              required: true,
                            })}
                            className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black"
                          >
                            <option value="">Select a Degree</option>
                            <option value="High School">High School</option>
                            <option value="Associate">Associate's</option>
                            <option value="Bachelor">Bachelor's</option>
                            <option value="Master">Master's</option>
                            <option value="Doctorate">Doctorate</option>
                          </select>
                          {(errors as any).education?.[index]?.degree && (
                            <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                              {(errors as any).education?.[index]?.degree
                                ?.message || "Degree is required"}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          {...register(`education.${index}.graduated` as const)}
                          type="checkbox"
                          className="h-4 w-4 text-emerald-500 rounded bg-white/60 border-white/30"
                        />
                        <label className="ml-2 text-sm text-black">
                          Did you graduate?
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Step 4: Additional Information */}
            {currentStep === 4 && (
              <section>
                <h2 className="text-2xl font-bold text-black mb-6">
                  Additional Information
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-black mb-4">
                      Certifications and Licenses
                    </h3>
                    <button
                      type="button"
                      onClick={() => appendCertification({ name: "" })}
                      className="mb-4 cursor-pointer py-1 bg-white/60 px-3 rounded-md  text-black text-sm"
                    >
                      + Add certificate and license
                    </button>

                    {certificationFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 mb-3">
                        <input
                          {...register(`certifications.${index}.name` as const)}
                          type="text"
                          className="flex-1 px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                        />
                        <button
                          type="button"
                          onClick={() => removeCertification(index)}
                          className="text-black cursor-pointer py-1 bg-white/60 px-3 rounded-md "
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Veteran Status *
                    </label>
                    <select
                      {...register("veteranStatus", {
                        required: "Veteran status is required",
                      })}
                      className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black"
                    >
                      <option value="">Select your veteran status</option>
                      <option value="Veteran">Veteran</option>
                      <option value="Non-Veteran">Non-Veteran</option>
                    </select>
                    {errors.veteranStatus && (
                      <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                        {errors.veteranStatus.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Step 5: Skills */}
            {currentStep === 5 && (
              <section>
                <h2 className="text-2xl font-bold text-black mb-6">Skills</h2>

                <button
                  type="button"
                  onClick={() =>
                    appendSkill({
                      name: "",
                      experience: "",
                      experienceMonths: "",
                      level: "Beginner",
                    })
                  }
                  className="mb-6 cursor-pointer py-1 bg-white/60 px-3 rounded-md  text-black text-sm"
                >
                  + Add Skills
                </button>

                {skillFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="bg-white/60 p-6 rounded-lg mb-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-black">
                        Skill {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="text-black cursor-pointer py-1 bg-white/60 px-3 rounded-md  text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Name *
                        </label>
                        <input
                          {...register(`skills.${index}.name` as const, {
                            required: true,
                          })}
                          type="text"
                          className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                        />
                        {(errors as any).skills?.[index]?.name && (
                          <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                            {(errors as any).skills?.[index]?.name?.message ||
                              "Skill name is required"}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            Years *
                          </label>
                          <input
                            {...register(
                              `skills.${index}.experience` as const,
                              {
                                required: "Years of experience is required",
                              },
                            )}
                            type="number"
                            className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                          />
                          {(errors as any).skills?.[index]?.experience && (
                            <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                              {(errors as any).skills?.[index]?.experience
                                ?.message || "Years of experience is required"}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            Months *
                          </label>
                          <input
                            {...register(
                              `skills.${index}.experienceMonths` as const,
                              { required: "Months of experience is required" },
                            )}
                            type="number"
                            max="11"
                            className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                          />
                          {(errors as any).skills?.[index]
                            ?.experienceMonths && (
                            <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                              {(errors as any).skills?.[index]?.experienceMonths
                                ?.message || "Months of experience is required"}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Level
                        </label>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center text-black">
                            <input
                              {...register(`skills.${index}.level` as const)}
                              type="radio"
                              value="Beginner"
                              className="mr-2"
                            />
                            Beginner
                          </label>
                          <label className="flex items-center text-black">
                            <input
                              {...register(`skills.${index}.level` as const)}
                              type="radio"
                              value="Intermediate"
                              className="mr-2"
                            />
                            Intermediate
                          </label>
                          <label className="flex items-center text-black">
                            <input
                              {...register(`skills.${index}.level` as const)}
                              type="radio"
                              value="Expert"
                              className="mr-2"
                            />
                            Expert
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Step 6: Languages */}
            {currentStep === 6 && (
              <section>
                <h2 className="text-2xl font-bold text-black mb-6">
                  Languages
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    appendLanguage({
                      language: "",
                      speak: false,
                      read: false,
                      write: false,
                    })
                  }
                  className="mb-6 cursor-pointer py-1 bg-white/60 px-3 rounded-md  text-black text-sm"
                >
                  + Add Language
                </button>

                {languageFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="bg-white/60 p-6 rounded-lg mb-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-black">
                        Language {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeLanguage(index)}
                        className="text-black cursor-pointer py-1 bg-white/60 px-3 rounded-md  text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Language *
                        </label>
                        <select
                          {...register(`languages.${index}.language` as const, {
                            required: true,
                          })}
                          className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black"
                        >
                          <option value="">Select a language</option>
                          <option value="English">English</option>
                          <option value="Spanish">Spanish</option>
                          <option value="Hawaiian">Hawaiian</option>
                          <option value="Japanese">Japanese</option>
                          <option value="Chinese">Chinese</option>
                          <option value="Korean">Korean</option>
                          <option value="Filipino">Filipino</option>
                        </select>
                        {(errors as any).languages?.[index]?.language && (
                          <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                            {(errors as any).languages?.[index]?.language
                              ?.message || "Language is required"}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input
                            {...register(`languages.${index}.speak` as const)}
                            type="checkbox"
                            className="h-4 w-4 text-emerald-500 rounded bg-white/60 border-white/30"
                          />
                          <label className="ml-2 text-sm text-black">
                            Speak
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            {...register(`languages.${index}.read` as const)}
                            type="checkbox"
                            className="h-4 w-4 text-emerald-500 rounded bg-white/60 border-white/30"
                          />
                          <label className="ml-2 text-sm text-black">
                            Read
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            {...register(`languages.${index}.write` as const)}
                            type="checkbox"
                            className="h-4 w-4 text-emerald-500 rounded bg-white/60 border-white/30"
                          />
                          <label className="ml-2 text-sm text-black">
                            Write
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Step 7: References */}
            {currentStep === 7 && (
              <section>
                <h2 className="text-2xl font-bold text-black mb-6">
                  Supplemental Information - References
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    appendReference({
                      type: "Professional",
                      firstName: "",
                      lastName: "",
                      title: "",
                      phone: "",
                      email: "",
                      address: "",
                      addressLine2: "",
                      city: "",
                      state: "",
                      zipCode: "",
                      country: "US",
                    })
                  }
                  className="mb-6 text-black  cursor-pointer py-1 bg-white/60 px-3 rounded-md  text-sm"
                >
                  + Add Reference
                </button>

                {referenceFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="bg-white/60 p-6 rounded-lg mb-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-black">
                        Reference {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeReference(index)}
                        className="text-black cursor-pointer py-1 bg-white/60 px-3 rounded-md  text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Reference Type *
                        </label>
                        <div className="flex space-x-4">
                          <label className="flex items-center text-black">
                            <input
                              {...register(
                                `references.${index}.type` as const,
                                { required: "Reference type is required" },
                              )}
                              type="radio"
                              value="Professional"
                              className="mr-2"
                            />
                            Professional
                          </label>
                          <label className="flex items-center text-black">
                            <input
                              {...register(
                                `references.${index}.type` as const,
                                { required: "Reference type is required" },
                              )}
                              type="radio"
                              value="Personal"
                              className="mr-2"
                            />
                            Personal
                          </label>
                        </div>
                        {(errors as any).references?.[index]?.type && (
                          <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                            {(errors as any).references?.[index]?.type
                              ?.message || "Reference type is required"}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            First *
                          </label>
                          <input
                            {...register(
                              `references.${index}.firstName` as const,
                              { required: true },
                            )}
                            type="text"
                            className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                          />
                          {(errors as any).references?.[index]?.firstName && (
                            <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                              {(errors as any).references?.[index]?.firstName
                                ?.message || "First name is required"}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            Last *
                          </label>
                          <input
                            {...register(
                              `references.${index}.lastName` as const,
                              { required: true },
                            )}
                            type="text"
                            className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                          />
                          {(errors as any).references?.[index]?.lastName && (
                            <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                              {(errors as any).references?.[index]?.lastName
                                ?.message || "Last name is required"}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Title
                        </label>
                        <input
                          {...register(`references.${index}.title` as const)}
                          type="text"
                          className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            Phone *
                          </label>
                          <input
                            {...register(`references.${index}.phone` as const, {
                              required: true,
                            })}
                            type="tel"
                            className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                          />
                          {(errors as any).references?.[index]?.phone && (
                            <p className=" text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                              {(errors as any).references?.[index]?.phone
                                ?.message || "Phone is required"}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            Email
                          </label>
                          <input
                            {...register(`references.${index}.email` as const)}
                            type="email"
                            className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Step 8: Attachments */}
            {currentStep === 8 && (
              <section>
                <h2 className="text-2xl font-bold text-black mb-6">
                  Required Attachments
                </h2>

                {job?.requiredDocuments && job.requiredDocuments.length > 0 ? (
                  <>
                    <div className="bg-emerald-800/20 border-l-4 border-emerald-800 p-4 mb-6 backdrop-blur-sm">
                      <p className="text-sm text-black mb-2">
                        <strong>Please upload the following documents:</strong>
                      </p>
                      <ul className="list-disc list-inside text-sm text-black/90 space-y-1">
                        {job.requiredDocuments.map((doc, index) => (
                          <li key={index}>{doc}</li>
                        ))}
                      </ul>
                    </div>

                    <p className="text-sm text-black/80 mb-6">
                      Supported file types: doc, docx, xls, xlsx, pdf, jpg, rtf,
                      txt (Max 10MB per file)
                    </p>

                    <div className="space-y-6">
                      {job.requiredDocuments.map((documentType) => (
                        <div
                          key={documentType}
                          className="bg-white/60 p-6 rounded-lg border-2 border-white/30"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-black">
                              {documentType}{" "}
                              <span className="text-red-900 font-semibold cursor-pointer py-1 rounded-md w-fit mt-2">
                                *
                              </span>
                            </h3>
                            {uploadedFiles[documentType] && (
                              <span className="text-sm text-green-900 font-medium flex items-center gap-1">
                                <svg
                                  className="w-4 h-4"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Uploaded
                              </span>
                            )}
                          </div>

                          {uploadedFiles[documentType] ? (
                            // Show uploaded file
                            <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg border border-white/30">
                              <div className="flex items-center space-x-3">
                                <svg
                                  className="h-8 w-8 text-emerald-800 flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                  />
                                </svg>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-black truncate">
                                    {uploadedFiles[documentType].name}
                                  </p>
                                  <p className="text-xs text-black/60">
                                    {(
                                      uploadedFiles[documentType].size / 1024
                                    ).toFixed(2)}{" "}
                                    KB
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(documentType)}
                                className="text-black cursor-pointer py-1 bg-white/60 px-3 rounded-md  p-2 hover:bg-white/60 rounded-lg transition-colors"
                              >
                                <svg
                                  className="h-5 w-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            // Show upload area
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/30 rounded-lg cursor-pointer bg-white/5 hover:bg-white/60 hover:border-emerald-400 transition-all">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg
                                  className="h-10 w-10 text-black/60 mb-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                  />
                                </svg>
                                <p className="mb-2 text-sm text-black">
                                  <span className="font-semibold">
                                    Click to upload
                                  </span>{" "}
                                  or drag and drop
                                </p>
                                <p className="text-xs text-black/60">
                                  PDF, DOC, DOCX, JPG, TXT (MAX. 10MB)
                                </p>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                accept=".doc,.docx,.xls,.xlsx,.pdf,.jpg,.jpeg,.rtf,.txt"
                                onChange={(e) =>
                                  handleFileUpload(documentType, e)
                                }
                              />
                            </label>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="bg-yellow-500/20 border-l-4 border-yellow-400 p-4 mt-6 backdrop-blur-sm">
                      <p className="text-sm text-black">
                        <strong>Note:</strong> All required documents must be
                        uploaded before you can submit your application.
                      </p>
                    </div>
                  </>
                ) : (
                  // No required documents
                  <div className="bg-white/60 p-6 rounded-lg text-center">
                    <p className="text-black/80">
                      No attachments required for this position.
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Step 9: Supplemental Questions */}
            {currentStep === 9 && (
              <section>
                <h2 className="text-2xl font-bold text-black mb-6">
                  Supplemental Questions
                </h2>

                <div className="space-y-8">
                  {/* Question 01 */}
                  <div className="bg-red-500/20 border-l-4 border-red-400 p-4 backdrop-blur-sm">
                    <p className="text-sm font-semibold text-black mb-2">*01</p>
                    <p className="text-sm text-black mb-4">
                      RECRUITMENT SURVEY (MANDATORY): What led you to explore
                      career opportunities with the State of Hawaii?
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          {...register("q01_careerOpportunities")}
                          type="checkbox"
                          value="State Recruiting Office"
                          className="mr-2 h-4 w-4 text-emerald-500 rounded bg-white/60 border-white/30"
                        />
                        <span className="text-sm text-black">
                          State Recruiting Office
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          {...register("q01_careerOpportunities")}
                          type="checkbox"
                          value="Job Fairs"
                          className="mr-2 h-4 w-4 text-emerald-500 rounded bg-white/60 border-white/30"
                        />
                        <span className="text-sm text-black">Job Fairs</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          {...register("q01_careerOpportunities")}
                          type="checkbox"
                          value="LinkedIn"
                          className="mr-2 h-4 w-4 text-emerald-500 rounded bg-white/60 border-white/30"
                        />
                        <span className="text-sm text-black">LinkedIn</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          {...register("q01_careerOpportunities")}
                          type="checkbox"
                          value="Governmentjobs.com"
                          className="mr-2 h-4 w-4 text-emerald-500 rounded bg-white/60 border-white/30"
                        />
                        <span className="text-sm text-black">
                          Governmentjobs.com
                        </span>
                      </label>
                    </div>
                    {(errors as any).q01_careerOpportunities && (
                      <p className="mt-2 text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                        {(errors as any).q01_careerOpportunities?.message ||
                          "Please select at least one option"}
                      </p>
                    )}
                  </div>

                  {/* Question 02 */}
                  <div className="bg-red-500/20 border-l-4 border-red-400 p-4 backdrop-blur-sm">
                    <p className="text-sm font-semibold text-black mb-2">*02</p>
                    <p className="text-sm text-black mb-4">
                      APPLICANT'S ACKNOWLEDGMENT: I acknowledge that I have
                      read, understand and agree to all of the above.
                    </p>
                    <label className="flex items-center">
                      <input
                        {...register("q02_readUnderstoodAgreed", {
                          required: true,
                        })}
                        type="checkbox"
                        className="mr-2 h-4 w-4 text-emerald-500 rounded bg-white/60 border-white/30"
                      />
                      <span className="text-sm text-black">
                        I acknowledge that I have read, understand and agree to
                        all of the above
                      </span>
                    </label>
                    {errors.q02_readUnderstoodAgreed && (
                      <p className="mt-2 text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                        This acknowledgment is required
                      </p>
                    )}
                  </div>

                  {/* Question 03 */}
                  <div className="bg-red-500/20 border-l-4 border-red-400 p-4 backdrop-blur-sm">
                    <p className="text-sm font-semibold text-black mb-2">*03</p>
                    <p className="text-sm text-black mb-4">
                      APPLICANT'S ACKNOWLEDGMENT (Continued): Applicants must
                      meet all the requirements for the position...
                    </p>
                    <label className="flex items-center">
                      <input
                        {...register("q03_acknowledgeContinued", {
                          required: true,
                        })}
                        type="checkbox"
                        className="mr-2 h-4 w-4 text-emerald-500 rounded bg-white/60 border-white/30"
                      />
                      <span className="text-sm text-black">
                        I acknowledge that I have read, understand and agree to
                        all of the above
                      </span>
                    </label>
                    {errors.q03_acknowledgeContinued && (
                      <p className="mt-2 text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                        This acknowledgment is required
                      </p>
                    )}
                  </div>

                  {/* Question 04 */}
                  <div className="bg-red-500/20 border-l-4 border-red-400 p-4 backdrop-blur-sm">
                    <p className="text-sm font-semibold text-black mb-2">*04</p>
                    <p className="text-sm text-black mb-4">
                      APPLICANT'S ACKNOWLEDGMENT - MINIMUM QUALIFICATION
                      REQUIREMENTS: I acknowledge that I have accessed and read
                      the complete Minimum Qualification Requirements via the
                      live link provided in the job announcement.
                    </p>
                    <label className="flex items-center">
                      <input
                        {...register("q04_minimumQualifications", {
                          required: true,
                        })}
                        type="checkbox"
                        className="mr-2 h-4 w-4 text-emerald-500 rounded bg-white/60 border-white/30"
                      />
                      <span className="text-sm text-black">
                        I acknowledge that I have accessed and read the complete
                        Minimum Qualification Requirements
                      </span>
                    </label>
                    {errors.q04_minimumQualifications && (
                      <p className="mt-2 text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                        This acknowledgment is required
                      </p>
                    )}
                  </div>

                  {/* Question 05 - General Experience */}
                  <div className="bg-red-500/20 border-l-4 border-red-400 p-4 backdrop-blur-sm">
                    <p className="text-sm font-semibold text-black mb-2">*05</p>
                    <p className="text-sm text-black mb-4">
                      GENERAL EXPERIENCE REQUIREMENT: Do you possess SIX (6)
                      MONTHS of the General Experience Requirement as stated in
                      the Minimum Qualification Requirements?
                    </p>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center text-black">
                        <input
                          {...register("q05_generalExperience", {
                            required: true,
                          })}
                          type="radio"
                          value="yes"
                          className="mr-2"
                        />
                        Yes
                      </label>

                      <label className="flex items-center text-black">
                        <input
                          {...register("q05_generalExperience", {
                            required: true,
                          })}
                          type="radio"
                          value="no"
                          className="mr-2"
                        />
                        No
                      </label>
                    </div>
                    {errors.q05_generalExperience && (
                      <p className="mt-2 text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                        Please select an option
                      </p>
                    )}
                  </div>

                  {/* Question 06 - Specialized Experience */}
                  <div className="bg-red-500/20 border-l-4 border-red-400 p-4 backdrop-blur-sm">
                    <p className="text-sm font-semibold text-black mb-2">*06</p>
                    <p className="text-sm text-black mb-4">
                      SPECIALIZED EXPERIENCE REQUIREMENT: Do you possess TWO (2)
                      YEARS of the Specialized Experience Requirement as
                      described in the Minimum Qualification Requirements?
                    </p>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center text-black">
                        <input
                          {...register("q06_specializedExperience", {
                            required: true,
                          })}
                          type="radio"
                          value="yes"
                          className="mr-2"
                        />
                        Yes
                      </label>

                      <label className="flex items-center text-black">
                        <input
                          {...register("q06_specializedExperience", {
                            required: true,
                          })}
                          type="radio"
                          value="no"
                          className="mr-2"
                        />
                        No
                      </label>
                    </div>
                    {errors.q06_specializedExperience && (
                      <p className="mt-2 text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                        Please select an option
                      </p>
                    )}
                  </div>

                  {/* Dynamic Supplemental Questions from Job Posting */}
                  {job?.supplementalQuestions &&
                    job.supplementalQuestions.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-white/20">
                        <h3 className="text-lg font-semibold text-black mb-6">
                          Position-Specific Questions
                        </h3>

                        {job.supplementalQuestions.map((question, index) => (
                          <div
                            key={question.id}
                            className={`${
                              question.required
                                ? "bg-red-500/20 border-l-4 border-red-400"
                                : "bg-white/60 border-l-4 border-white/30"
                            } p-4 mb-6 backdrop-blur-sm`}
                          >
                            <p className="text-sm font-semibold text-black mb-2">
                              {question.required ? "*" : ""}
                              Question {index + 1}
                            </p>
                            <p className="text-sm font-medium text-black mb-4">
                              {question.question}
                            </p>

                            {/* Short Answer */}
                            {question.type === "short_answer" && (
                              <textarea
                                {...register(
                                  `supplementalAnswers.${question.id}` as const,
                                  {
                                    required: question.required
                                      ? "This question is required"
                                      : false,
                                  },
                                )}
                                rows={4}
                                placeholder="Enter your answer..."
                                className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black placeholder:text-black/50"
                              />
                            )}

                            {/* Dropdown */}
                            {question.type === "dropdown" &&
                              question.options && (
                                <select
                                  {...register(
                                    `supplementalAnswers.${question.id}` as const,
                                    {
                                      required: question.required
                                        ? "This question is required"
                                        : false,
                                    },
                                  )}
                                  className="w-full px-4 py-2 border border-white/30 bg-white/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black"
                                >
                                  <option value="">Select an option...</option>
                                  {question.options.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              )}

                            {/* Checkbox */}
                            {question.type === "checkbox" &&
                              question.options && (
                                <div className="space-y-2">
                                  {question.options.map((option) => (
                                    <label
                                      key={option}
                                      className="flex items-center"
                                    >
                                      <input
                                        {...register(
                                          `supplementalAnswers.${question.id}` as const,
                                          {
                                            required: question.required
                                              ? "Please select at least one option"
                                              : false,
                                          },
                                        )}
                                        type="checkbox"
                                        value={option}
                                        className="mr-2 h-4 w-4 text-emerald-500 rounded bg-white/60 border-white/30"
                                      />
                                      <span className="text-sm text-black">
                                        {option}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              )}

                            {errors.supplementalAnswers?.[question.id] && (
                              <p className="mt-2 text-sm text-red-900 font-semibold cursor-pointer py-1 bg-white/60 px-3 rounded-md w-fit mt-2">
                                {
                                  errors.supplementalAnswers[question.id]
                                    ?.message
                                }
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </section>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-white/20">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 bg-white/60 backdrop-blur-md border border-white/40 text-black rounded-lg font-medium hover:bg-white cursor-pointer"
                >
                  Back
                </button>
              )}

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="ml-auto px-6 py-3 cursor-pointer bg-emerald-500/30 backdrop-blur-md border border-emerald-400/40 text-black rounded-lg font-medium hover:bg-emerald-500/80"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="ml-auto px-6 py-3 bg-emerald-800/30 backdrop-blur-md border cursor-pointer border-emerald-800/40 text-black rounded-lg font-medium hover:bg-emerald-500/40 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
