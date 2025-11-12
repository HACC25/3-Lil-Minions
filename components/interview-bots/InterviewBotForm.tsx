/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle,
  Info,
} from "lucide-react";
import { ConfirmModal } from "@/components/modals";

// Import sub-components
import BasicInformation from "./BasicInformation";
import AvatarConfiguration from "./AvatarConfiguration";
import CompanyRoleInfo from "./CompanyRoleInfo";
import BotPersonality from "./BotPersonality";
import QuestionsSection from "./QuestionsSection";
import ProgressBar from "./ProgressBar";
import RequirementsSection, {
  DEFAULT_SCORING_CRITERIA,
} from "./RequirementsSection";
import { useThemeColors } from "./hooks/useThemeColors";
import { Question, FormData, ScoringCriteria } from "./lib/types";

interface InterviewBotFormProps {
  isLightMode: boolean;
  companyId: string;
  companyName: string;
  prefilledData?: any;
  onSuccess?: (botId: string) => void;
  onCancel?: () => void;
  embedded?: boolean;
  hideHeader?: boolean;
  jobPostingData?: any;
  jobId?: string; // Add jobId prop
  existingBotId?: string; // ID of bot being edited (for updates)
}

const STEPS = [
  { id: 1, title: "Info", description: "" },
  { id: 2, title: "Avatar", description: "" },
  // { id: 3, title: "Company", description: "" }, // Commented out - prefilled from job listing
  { id: 3, title: "Personality", description: "" },
  { id: 4, title: "Questions", description: "" },
  { id: 5, title: "Requirements", description: "" },
  { id: 6, title: "Review", description: "" },
];

const generateQuestionId = (): string => {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const calculateInterviewTime = (totalQuestions: number): string => {
  const totalMinutes = totalQuestions * 5;
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0
      ? `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minutes`
      : `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return `${totalMinutes} minutes`;
};

const InterviewBotForm: React.FC<InterviewBotFormProps> = ({
  isLightMode,
  companyId,
  companyName,
  prefilledData,
  onSuccess,
  onCancel,
  embedded = false,
  hideHeader = false,
  jobPostingData,
  jobId, // Add jobId parameter
  existingBotId, // Add existingBotId parameter
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    botName: "",
    description: "",
    interviewType: "",
    companyDescription: "",
    companyIndustry: "",
    jobRoleDescription: "",
    salary: "",
    botPersonality: "",
    selectedAvatar: "",
    selectedEmotion: "",
  });

  const [technicalQuestions, setTechnicalQuestions] = useState<Question[]>([]);
  const [generalQuestions, setGeneralQuestions] = useState<Question[]>([]);
  const [behavioralQuestions, setBehavioralQuestions] = useState<Question[]>(
    [],
  );
  const [preQualificationQuestions, setPreQualificationQuestions] = useState<
    Question[]
  >([]);
  const [scoringCriteria, setScoringCriteria] = useState<ScoringCriteria[]>(
    DEFAULT_SCORING_CRITERIA,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPrefilled, setIsPrefilled] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Track if we've already extracted data from job posting
  const hasExtractedRef = useRef(false);

  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    avatar: true,
    company: true,
    personality: true,
    technical: true,
    general: true,
    behavioral: true,
    preQualification: true,
    requirements: true,
  });

  const currentColors = useThemeColors(isLightMode);

  // Debug: Log jobId when component receives it
  useEffect(() => {
    console.log("🔗 InterviewBotForm received jobId prop:", jobId);
    console.log("🔗 Type of jobId:", typeof jobId);
    console.log("🔗 jobId is null?", jobId === null);
    console.log("🔗 jobId is undefined?", jobId === undefined);
  }, [jobId]);

  // Extract data from job posting ONCE when component mounts (only if not already extracted)
  useEffect(() => {
    if (jobPostingData && !prefilledData && !hasExtractedRef.current) {
      console.log(
        "🎯 Extracting interview data from job posting (first time only)",
      );
      hasExtractedRef.current = true; // Mark as extracted
      extractFromJobPosting(jobPostingData);
    }
  }, []); // Run only once on mount

  // Populate form with prefilled data
  useEffect(() => {
    if (prefilledData) {
      populateFormData(prefilledData);
    }
  }, [prefilledData]);

  const extractFromJobPosting = async (jobData: any) => {
    setIsExtracting(true);
    try {
      const response = await fetch("/api/extract-interview-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: jobData.jobTitle || jobData.title,
          jobDescription: jobData.jobDescription || jobData.description,
          requirements: jobData.requirements,
          responsibilities: jobData.responsibilities,
          companyDescription: jobData.companyDescription,
          companyIndustry: jobData.companyIndustry || jobData.industry,
          salary: jobData.salary || jobData.salaryRange,
          location: jobData.location,
          employmentType: jobData.employmentType || jobData.type,
          companyName: companyName,
          department: jobData.department,
          minimumQualifications: jobData.minimumQualifications,
          duties: jobData.duties,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract interview data");
      }

      const extractedData = await response.json();
      populateFormData(extractedData.interviewBotData);
      setIsPrefilled(true);
      setTimeout(() => setIsPrefilled(false), 3000);
    } catch (error) {
      console.error("Error extracting interview data:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  const populateFormData = (data: any) => {
    setFormData((prev: any) => ({
      ...prev,
      botName: data.botName || "",
      description: data.description || "",
      interviewType: data.interviewType || "",
      companyDescription: data.companyDescription || "",
      companyIndustry: data.companyIndustry || "",
      jobRoleDescription: data.jobRoleDescription || "",
      salary: data.salary || "",
      botPersonality: data.botPersonality || "",
      selectedAvatar: data.selectedAvatar || "",
      selectedEmotion: data.selectedEmotion || "",
    }));

    const convertAIQuestionsToFrontend = (
      aiQuestions: Array<{ id?: string; question: string; type: string }>,
    ): Question[] => {
      return aiQuestions.map((q) => ({
        id: q.id || generateQuestionId(),
        question: q.question,
        type: q.type as
          | "technical"
          | "general"
          | "behavioral"
          | "pre-qualification",
      }));
    };

    if (data.questions) {
      if (data.questions.technical?.length) {
        setTechnicalQuestions(
          convertAIQuestionsToFrontend(data.questions.technical),
        );
      }
      if (data.questions.general?.length) {
        setGeneralQuestions(
          convertAIQuestionsToFrontend(data.questions.general),
        );
      }
      if (data.questions.behavioral?.length) {
        setBehavioralQuestions(
          convertAIQuestionsToFrontend(data.questions.behavioral),
        );
      }
      if (data.questions.preQualification?.length) {
        setPreQualificationQuestions(
          convertAIQuestionsToFrontend(data.questions.preQualification),
        );
      }
    }

    if (data.scoringCriteria?.length) {
      setScoringCriteria(data.scoringCriteria);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev: any) => ({ ...prev, ...updates }));
  };

  const isValidSelection = (
    value: string,
    fieldType: "interviewType" | "companyIndustry",
  ): boolean => {
    if (!value || value.trim() === "") return false;

    const placeholders = {
      interviewType: [
        "Select interview type",
        "Select type",
        "Choose interview type",
        "select interview type",
        "",
        " ",
      ],
      companyIndustry: [
        "Select industry",
        "Select company industry",
        "Choose industry",
        "select industry",
        "",
        " ",
      ],
    };

    const trimmedValue = value.trim();
    return !placeholders[fieldType].includes(trimmedValue);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.botName.trim() &&
          formData.description.trim() &&
          isValidSelection(formData.interviewType, "interviewType")
        );
      case 2:
        return !!(formData.selectedAvatar && formData.selectedEmotion);
      // case 3: // Company step - commented out (prefilled from job listing)
      //   return !!(
      //     formData.companyDescription.trim() &&
      //     isValidSelection(formData.companyIndustry, "companyIndustry") &&
      //     formData.jobRoleDescription.trim()
      //   );
      case 3: // Personality
        return !!formData.botPersonality.trim();
      case 4: {
        // Questions
        const totalQuestions =
          technicalQuestions.length +
          generalQuestions.length +
          behavioralQuestions.length +
          preQualificationQuestions.length;
        return totalQuestions > 0;
      }
      case 5: // Requirements
        return scoringCriteria.length > 0;
      default:
        return true;
    }
  };

  const isStepComplete = (step: number): boolean => {
    return validateStep(step);
  };

  const canProceedToStep = (step: number): boolean => {
    if (step <= currentStep) return true;
    for (let i = 1; i < step; i++) {
      if (!isStepComplete(i)) return false;
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep < STEPS.length && validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (canProceedToStep(step)) {
      setCurrentStep(step);
    }
  };

  const calculateProgress = () => {
    let completed = 0;
    const total = 10;

    if (
      formData.botName &&
      formData.description &&
      isValidSelection(formData.interviewType, "interviewType")
    )
      completed++;
    if (formData.selectedAvatar && formData.selectedEmotion) completed++;
    if (
      formData.companyDescription &&
      isValidSelection(formData.companyIndustry, "companyIndustry") &&
      formData.jobRoleDescription
    )
      completed++;
    if (formData.botPersonality) completed++;
    if (technicalQuestions.length > 0) completed++;
    if (generalQuestions.length > 0) completed++;
    if (behavioralQuestions.length > 0) completed++;
    if (preQualificationQuestions.length > 0) completed++;
    if (scoringCriteria.length > 0) completed++;

    const totalQuestions =
      technicalQuestions.length +
      generalQuestions.length +
      behavioralQuestions.length +
      preQualificationQuestions.length;
    if (totalQuestions > 0) completed++;

    return { completed, total };
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.botName.trim()) errors.push("Bot Name is required");
    if (!formData.description.trim())
      errors.push("Bot Description is required");
    if (!isValidSelection(formData.interviewType, "interviewType"))
      errors.push("Interview Type must be selected");
    if (!formData.selectedAvatar) errors.push("Avatar selection is required");
    if (!formData.selectedEmotion)
      errors.push("Avatar Voice Emotion is required");
    if (!formData.companyDescription.trim())
      errors.push("Company Description is required");
    if (!isValidSelection(formData.companyIndustry, "companyIndustry"))
      errors.push("Company Industry must be selected");
    if (!formData.jobRoleDescription.trim())
      errors.push("Job Role Description is required");
    if (!formData.botPersonality.trim())
      errors.push("Bot Personality is required");
    if (scoringCriteria.length === 0) {
      errors.push("At least one scoring criteria is recommended");
    }

    const totalQuestions =
      technicalQuestions.length +
      generalQuestions.length +
      behavioralQuestions.length +
      preQualificationQuestions.length;
    if (totalQuestions === 0) {
      errors.push(
        "At least one question is required (Pre-Qualification, General, Technical, or Behavioral)",
      );
    }

    return errors;
  };

  const createDialogflowAgent = async (
    botData: any,
  ): Promise<string | null> => {
    try {
      setUploadProgress(10);

      const agentPayload = {
        display_name: botData.botName,
        meta: {
          description: botData.description,
          interviewType: botData.interviewType,
          company: companyName,
          avatar: botData.selectedAvatar,
          emotion: botData.selectedEmotion,
        },
        playbook_goal: `Conduct a ${botData.interviewType.toLowerCase()} interview for the position of ${
          botData.jobRoleDescription
        }. ${botData.botPersonality}`,
        customization: {
          position_data: {
            position_title: `${botData.interviewType} - ${botData.botName}`,
            job_description: botData.jobRoleDescription,
            job_salary: botData.salary || "competitive salary",
          },
          company_data: {
            company_name: companyName,
            company_industry: botData.companyIndustry || "Technology",
            company_description: botData.companyDescription,
            company_mission: botData.companyDescription,
          },
          bot_personality: botData.botPersonality,
          introduction_questions: botData.allQuestions
            .filter((q: Question) => q.type === "general")
            .map((q: Question) => q.question),
          technical_questions: botData.allQuestions
            .filter((q: Question) => q.type === "technical")
            .map((q: Question) => q.question),
          behavioral_questions: botData.allQuestions
            .filter((q: Question) => q.type === "behavioral")
            .map((q: Question) => q.question),
          prequalification_questions: botData.allQuestions
            .filter((q: Question) => q.type === "pre-qualification")
            .map((q: Question) => q.question),
          company_overview: botData.companyDescription,
        },
      };

      setUploadProgress(25);
      const backendUrl =
        process.env.NEXT_PUBLIC_AGENT_CREATION || "http://localhost:8000";

      const response = await fetch(`${backendUrl}/dialogflow/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agentPayload),
      });

      setUploadProgress(50);

      if (!response.ok) {
        let errorDetails = "";
        try {
          const errorData = await response.json();
          errorDetails = JSON.stringify(errorData, null, 2);
        } catch (_e) {
          const errorText = await response.text();
          errorDetails = errorText;
        }

        if (response.status === 401) {
          throw new Error("Authentication failed. Please try again.");
        }
        throw new Error(`Failed to create agent: ${errorDetails}`);
      }

      const result = await response.json();
      setUploadProgress(75);

      if (result.ok && result.agent_id) {
        return result.agent_id;
      } else {
        throw new Error("Failed to get agent_id from response");
      }
    } catch (error) {
      console.error("Error creating Dialogflow agent:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert(
        "Please fix the following errors:\n\n" + validationErrors.join("\n"),
      );
      return;
    }

    const totalQuestions =
      technicalQuestions.length +
      generalQuestions.length +
      behavioralQuestions.length +
      preQualificationQuestions.length;

    const estimatedTime = calculateInterviewTime(totalQuestions);

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);

    const totalQuestions =
      technicalQuestions.length +
      generalQuestions.length +
      behavioralQuestions.length +
      preQualificationQuestions.length;

    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      const allQuestions = [
        ...technicalQuestions,
        ...generalQuestions,
        ...behavioralQuestions,
        ...preQualificationQuestions,
      ];

      const botData = {
        ...formData,
        questions: {
          technical: technicalQuestions,
          general: generalQuestions,
          behavioral: behavioralQuestions,
          preQualification: preQualificationQuestions,
        },
        allQuestions,
      };

      let agent_id = null;
      try {
        agent_id = await createDialogflowAgent(botData);
      } catch (agentError: any) {
        let alertMessage = agentError.message;
        try {
          const parsed = JSON.parse(alertMessage);
          if (parsed.detail) {
            alertMessage = parsed.detail;
          }
        } catch {}
        alert(alertMessage);
        return;
      }

      const avatarConfig = {
        avatarName: formData.selectedAvatar,
        quality: "medium",
        voice: { rate: 1.2, emotion: formData.selectedEmotion },
        language: "en",
        sttSettings: { provider: "deepgram" },
        disableIdleTimeout: true,
        avatarType: formData.interviewType.toLowerCase().replace(/\s+/g, "_"),
      };

      console.log("🔍 About to create payload with jobId:", jobId);
      console.log("🔍 jobId type:", typeof jobId);

      const payload: any = {
        author_id: companyId,
        botName: formData.botName,
        description: formData.description,
        interviewType: formData.interviewType,
        companyDescription: formData.companyDescription,
        companyIndustry: formData.companyIndustry,
        jobRoleDescription: formData.jobRoleDescription,
        salary: formData.salary,
        botPersonality: formData.botPersonality,
        questions: {
          technical: technicalQuestions,
          general: generalQuestions,
          behavioral: behavioralQuestions,
          preQualification: preQualificationQuestions,
        },
        scoringCriteria: scoringCriteria,
        allQuestions,
        avatarConfig,
        agent_id,
        "DID-avatarConfig": "v2_agt_sPmnoiGp",
        created_by: companyName,
        jobId: jobId || null, // Link to job posting
      };

      if (prefilledData?.metadata) {
        payload.extractionMetadata = prefilledData.metadata;
      }

      console.log(
        "📤 Sending interview bot payload with jobId:",
        payload.jobId,
      );
      console.log("📋 Full payload:", payload);

      // Determine if we're updating or creating
      const isUpdate = !!existingBotId;
      const apiUrl = isUpdate
        ? `/api/interview-bots/${existingBotId}`
        : "/api/interview-bots";
      const method = isUpdate ? "PUT" : "POST";

      console.log(`🔄 ${isUpdate ? "Updating" : "Creating"} interview bot...`);

      // Call API to create or update interview bot
      const response = await fetch(apiUrl, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const apiResult = await response.json();

      if (!response.ok) {
        throw new Error(
          apiResult.error ||
            `Failed to ${isUpdate ? "update" : "create"} interview bot`,
        );
      }

      // Get the bot ID (for updates, use existing ID, for creates, use returned ID)
      const resultBotId = isUpdate ? existingBotId : apiResult.id;

      // If jobId exists, update the job document with the interview bot ID
      if (jobId && resultBotId) {
        try {
          const updateJobResponse = await fetch(`/api/jobs/${jobId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              interviewBotId: resultBotId,
            }),
          });

          if (!updateJobResponse.ok) {
            console.error("Failed to update job with interview bot ID");
          }
        } catch (error) {
          console.error("Error updating job with interview bot ID:", error);
          // Don't fail the entire operation if this update fails
        }
      }

      setIsSuccess(true);

      if (onSuccess) {
        onSuccess(resultBotId);
      }

      if (!embedded) {
        resetForm();
      }
    } catch (error) {
      console.error("Error creating interview agent:", error);
      alert(
        `Error creating interview agent: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please try again.`,
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setFormData({
      botName: "",
      description: "",
      interviewType: "",
      companyDescription: "",
      companyIndustry: "",
      jobRoleDescription: "",
      salary: "",
      botPersonality: "",
      selectedAvatar: "",
      selectedEmotion: "",
    });
    setScoringCriteria(DEFAULT_SCORING_CRITERIA);
    setTechnicalQuestions([]);
    setGeneralQuestions([]);
    setBehavioralQuestions([]);
    setPreQualificationQuestions([]);
    setUploadProgress(0);
    setCurrentStep(1);
  };

  const renderStepContent = () => {
    const { completed, total } = calculateProgress();

    switch (currentStep) {
      case 1:
        return (
          <BasicInformation
            formData={formData}
            updateFormData={updateFormData}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            currentColors={currentColors}
            uploadProgress={uploadProgress}
          />
        );
      case 2:
        return (
          <AvatarConfiguration
            formData={formData}
            updateFormData={updateFormData}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            currentColors={currentColors}
          />
        );
      // case 3: // Company step - commented out (prefilled from job listing)
      //   return (
      //     <CompanyRoleInfo
      //       formData={formData}
      //       updateFormData={updateFormData}
      //       expandedSections={expandedSections}
      //       toggleSection={toggleSection}
      //       currentColors={currentColors}
      //     />
      //   );
      case 3: // Personality
        return (
          <BotPersonality
            formData={formData}
            updateFormData={updateFormData}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            currentColors={currentColors}
          />
        );
      case 4: // Questions
        return (
          <QuestionsSection
            technicalQuestions={technicalQuestions}
            generalQuestions={generalQuestions}
            behavioralQuestions={behavioralQuestions}
            preQualificationQuestions={preQualificationQuestions}
            setTechnicalQuestions={setTechnicalQuestions}
            setGeneralQuestions={setGeneralQuestions}
            setBehavioralQuestions={setBehavioralQuestions}
            setPreQualificationQuestions={setPreQualificationQuestions}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            currentColors={currentColors}
          />
        );
      case 5: // Requirements
        return (
          <RequirementsSection
            scoringCriteria={scoringCriteria}
            setScoringCriteria={setScoringCriteria}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
        );
      case 6: // Review
        return (
          <div className="p-6">
            <ProgressBar
              completed={completed}
              total={total}
              currentColors={currentColors}
            />
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Review Your Interview Agent
            </h3>

            {/* Agent Information */}
            <div className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-xl p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Agent Information
              </h4>
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  <strong className="font-semibold">Name:</strong>{" "}
                  {formData.botName}
                </p>
                <p className="text-sm text-gray-700">
                  <strong className="font-semibold">Type:</strong>{" "}
                  {formData.interviewType}
                </p>
                <p className="text-sm text-gray-700">
                  <strong className="font-semibold">Description:</strong>{" "}
                  {formData.description}
                </p>
                <p className="text-sm text-gray-700">
                  <strong className="font-semibold">Avatar:</strong>{" "}
                  {formData.selectedAvatar}
                </p>
                <p className="text-sm text-gray-700">
                  <strong className="font-semibold">Voice Emotion:</strong>{" "}
                  {formData.selectedEmotion}
                </p>
              </div>
            </div>

            {/* Company & Role */}
            {/* <div className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-xl p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Company & Role
              </h4>
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  <strong className="font-semibold">Industry:</strong>{" "}
                  {formData.companyIndustry}
                </p>
                <p className="text-sm text-gray-700">
                  <strong className="font-semibold">Role:</strong>{" "}
                  {formData.jobRoleDescription}
                </p>
                <p className="text-sm text-gray-700">
                  <strong className="font-semibold">Salary:</strong>{" "}
                  {formData.salary || "Not specified"}
                </p>
              </div>
            </div> */}

            {/* Questions Summary */}
            <div className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-xl p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Questions Summary
              </h4>

              {/* Estimated Interview Time */}
              <div className="bg-cyan-50 border-2 border-cyan-400 rounded-lg p-4 mb-6 text-center">
                <div className="text-base font-bold text-cyan-700 mb-1">
                  Estimated Interview Time
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {calculateInterviewTime(
                    technicalQuestions.length +
                      generalQuestions.length +
                      behavioralQuestions.length +
                      preQualificationQuestions.length,
                  )}
                </div>
              </div>

              {/* Question Count Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 text-center border border-gray-300">
                  <div className="text-2xl font-bold text-cyan-600">
                    {technicalQuestions.length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Technical</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center border border-gray-300">
                  <div className="text-2xl font-bold text-cyan-600">
                    {generalQuestions.length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">General</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center border border-gray-300">
                  <div className="text-2xl font-bold text-cyan-600">
                    {behavioralQuestions.length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Behavioral</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center border border-gray-300">
                  <div className="text-2xl font-bold text-cyan-600">
                    {preQualificationQuestions.length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Pre-qualification
                  </div>
                </div>
              </div>
            </div>

            {/* Scoring Criteria */}
            <div className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Scoring Criteria ({scoringCriteria.length})
              </h4>

              {scoringCriteria.length > 0 ? (
                <div className="space-y-3">
                  {scoringCriteria.map((criteria, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-300 rounded-lg p-4"
                    >
                      <div className="font-semibold text-sm text-gray-900 mb-2">
                        {criteria.title}
                      </div>
                      <div className="text-xs text-gray-600 leading-relaxed">
                        {criteria.description}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 italic">
                  No scoring criteria defined
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <div
        className={
          embedded ? "bg-white/50 backdrop-blur-sm p-6 rounded-xl" : ""
        }
      >
        {/* Alert Messages */}
        {isExtracting && (
          <div className="bg-cyan-50 border-l-4 border-cyan-500 p-4 mb-6 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-600" />
              <div>
                <p className="font-semibold text-cyan-900">
                  Extracting interview data from job posting... ✨
                </p>
                <p className="text-sm text-cyan-700 mt-1">
                  This may take a few seconds
                </p>
              </div>
            </div>
          </div>
        )}

        {isSuccess && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={24} />
              <span className="font-semibold text-green-900">
                Interview Agent created successfully!
              </span>
            </div>
          </div>
        )}

        {isPrefilled && (
          <div className="bg-cyan-50 border-l-4 border-cyan-500 p-4 mb-6 rounded-lg">
            <div className="flex items-center gap-3">
              <Info className="text-cyan-600" size={24} />
              <div>
                <p className="font-semibold text-cyan-900">
                  Form auto-populated from job posting! ✨
                </p>
                <p className="text-sm text-cyan-700 mt-1">
                  Please review and edit the information below to ensure
                  accuracy.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex justify-center items-center py-6 border-b border-white/30 flex-wrap gap-2">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={`flex items-center gap-2 mx-1 ${
                  canProceedToStep(step.id)
                    ? "cursor-pointer"
                    : "cursor-default opacity-50"
                }`}
                onClick={() => canProceedToStep(step.id) && goToStep(step.id)}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    isStepComplete(step.id)
                      ? "bg-green-500 text-white border-2 border-green-500"
                      : step.id === currentStep
                        ? "bg-cyan-600 text-white border-2 border-cyan-600"
                        : "bg-white/50 text-gray-600 border-2 border-white/60"
                  }`}
                >
                  {isStepComplete(step.id) ? <Check size={18} /> : step.id}
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-900">
                    {step.title}
                  </div>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-8 h-0.5 ${
                    isStepComplete(step.id) ? "bg-green-500" : "bg-white/30"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className={embedded ? "py-4" : "px-6 py-4"}>
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center gap-4 pt-6 border-t border-white/30 mt-6">
          {onCancel && currentStep === 1 ? (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-white/50 backdrop-blur-sm border border-white/60 text-gray-900 rounded-lg font-semibold hover:bg-white/70 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-3 bg-white/50 backdrop-blur-sm border border-white/60 text-gray-900 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                currentStep === 1
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-white/70 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              }`}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
          )}

          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
              className={`px-8 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg font-semibold flex items-center gap-2 transition-all ${
                !validateStep(currentStep)
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:from-cyan-700 hover:to-teal-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              }`}
            >
              Next
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-8 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg font-semibold flex items-center gap-2 transition-all ${
                isSubmitting
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:from-cyan-700 hover:to-teal-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  {embedded ? "Create Interview & Finish" : "Create Agent"}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmit}
        title="Confirm Interview Creation"
        message={`
          <div style="text-align: left; font-size: 14px;">
            <p><strong>Total Questions:</strong> ${
              technicalQuestions.length +
              generalQuestions.length +
              behavioralQuestions.length +
              preQualificationQuestions.length
            }</p>
            <div style="background: #f0f9ff; padding: 12px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; font-weight: 600; color: #1e40af;">
                ⏱️ Estimated Interview Duration: ${calculateInterviewTime(
                  technicalQuestions.length +
                    generalQuestions.length +
                    behavioralQuestions.length +
                    preQualificationQuestions.length,
                )}
              </p>
            </div>
            <p style="color: #64748b; font-size: 13px;">
              Are you sure you want to create this interview agent?
            </p>
          </div>
        `}
        confirmText="Yes, Create Agent"
        cancelText="No, Cancel"
        confirmColor="#3b82f6"
        isProcessing={false}
      />
    </>
  );
};

export default InterviewBotForm;
