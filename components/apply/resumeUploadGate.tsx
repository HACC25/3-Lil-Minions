/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardBody, Button, Input } from "@nextui-org/react";
import { X, FileText, Loader2 } from "lucide-react";
import { cn } from "@/utils/styles";
interface ResumeUploadGateProps {
  companyName: string;
  companyId: string;
  userId?: string;
  onComplete: (results: any, sessionId: string, resumeFile?: File) => void;
}

const COMMON_OCCUPATIONS = [
  "Software Engineer",
  "AI Engineer",
  "Machine Learning Engineer",
  "Data Scientist",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "DevOps Engineer",
  "Product Manager",
  "UX/UI Designer",
  "Data Analyst",
  "Business Analyst",
  "Project Manager",
  "QA Engineer",
  "Marketing Manager",
  "Sales Representative",
  "Customer Success Manager",
  "HR Manager",
  "Finance Analyst",
  "Operations Manager",
];

export default function ResumeUploadGate({
  companyName,
  companyId,
  userId,
  onComplete,
}: ResumeUploadGateProps) {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Validate file type
    const validTypes = ["application/pdf"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a PDF document");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setError(null);
    setResumeFile(file);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      if (selectedInterests.length < 5) {
        setSelectedInterests([...selectedInterests, interest]);
      } else {
        setError("You can select up to 5 interests");
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const addCustomInterest = () => {
    if (customInterest.trim() && selectedInterests.length < 5) {
      setSelectedInterests([...selectedInterests, customInterest.trim()]);
      setCustomInterest("");
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!resumeFile || selectedInterests.length === 0) {
      setError("Please upload your resume and select at least one interest");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("companyId", companyId);
      formData.append("interests", JSON.stringify(selectedInterests));

      if (userId) {
        formData.append("userId", userId);
      }

      // Generate session ID for tracking
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      formData.append("sessionId", sessionId);

      // Call the matching API
      const response = await fetch("/api/jobs/match", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to match jobs");
      }

      if (!data.success) {
        throw new Error(data.error || "Matching failed");
      }

      console.log("✅ Matching successful:", data);

      // Call onComplete with the results, session ID, and resume file
      onComplete(data, data.sessionId || sessionId, resumeFile);
    } catch (err) {
      console.error("❌ Matching error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred during matching",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-full flex items-center justify-center p-8">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .no-scale-card,
        .no-scale-card:hover,
        .no-scale-card:active,
        .no-scale-card:focus {
          transform: scale(1) !important;
          transition: none !important;
          cursor: default !important;
          box-shadow: none !important;
        }
      `,
        }}
      />
      {/* Loading State */}
      {isSubmitting && (
        <div className="fixed inset-0 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="text-center bg-white/10 backdrop-blur-md border border-white/30 rounded-lg p-8">
            {/* PDF Icon */}
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-700 to-cyan-700 rounded-2xl flex items-center justify-center shadow-xl">
                <FileText className="text-white" size={48} />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Analyzing Your Resume
            </h2>
            <p className="text-white/90 mb-1">
              Finding your best matches at {companyName}...
            </p>
            <p className="text-sm text-white/70 mb-4">
              This may take a few moments
            </p>

            {/* Spinning loader at bottom */}
            <div className="flex justify-center mt-6">
              <Loader2
                className="text-cyan-700 animate-spin"
                size={32}
                strokeWidth={2}
              />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-black mb-2">
            Join {companyName}
          </h1>
          <p className="text-black">
            Upload your resume and select your interests to discover the perfect
            role for you
          </p>
        </div>

        <Card
          className="border border-white/30 rounded-md bg-white/20 backdrop-blur-md py-4"
          disableAnimation
          shadow="none"
          isHoverable={false}
          isPressable={false}
          style={{ transform: "none !important", cursor: "default" }}
        >
          <CardBody className="p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-500/20 border border-red-400/30 rounded-lg backdrop-blur-md">
                <p className="text-red-900 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Resume Upload Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-lg font-semibold text-black">
                  Resume Upload
                </h2>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                  isDragging
                    ? "border-cyan-700 bg-cyan-700/10 scale-[1.02]"
                    : "border-white/30 hover:border-white/50 bg-white/5"
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="resume-upload"
                />
                <label
                  htmlFor="resume-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-black rounded-lg transition-colors border border-white/30"
                >
                  <FileText size={20} />
                  Choose File
                </label>
                {resumeFile ? (
                  <p className="mt-2 text-sm text-black">{resumeFile.name}</p>
                ) : (
                  <p className="mt-2 text-xs text-black/70">
                    or drag and drop your PDF here
                  </p>
                )}
              </div>
            </div>

            {/* Interest Areas */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-lg font-semibold text-black">
                  What are you interested in?
                </h2>
              </div>
              <p className="text-sm text-black mb-4">
                Select up to 5 roles you're interested in
              </p>

              {/* Selected Interests */}
              {selectedInterests.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 p-3 bg-white/10   rounded-lg backdrop-blur-md">
                  {selectedInterests.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 bg-cyan-700 text-white rounded-md text-xs font-medium hover:bg-cyan-800 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {interest}
                      <X size={14} />
                    </button>
                  ))}
                </div>
              )}

              {/* Occupation Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4 max-h-60 overflow-y-auto p-2 bg-white/5 border border-white/20 rounded-lg backdrop-blur-sm">
                {COMMON_OCCUPATIONS.map((occupation) => (
                  <button
                    key={occupation}
                    onClick={() => toggleInterest(occupation)}
                    disabled={
                      (selectedInterests.length >= 5 &&
                        !selectedInterests.includes(occupation)) ||
                      isSubmitting
                    }
                    className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      selectedInterests.includes(occupation)
                        ? "bg-cyan-700 text-white"
                        : "bg-white/10 text-black hover:bg-white/20 border border-white/30"
                    } ${
                      (selectedInterests.length >= 5 &&
                        !selectedInterests.includes(occupation)) ||
                      isSubmitting
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {occupation}
                  </button>
                ))}
              </div>

              {/* Custom Interest */}
              <div className="flex gap-2">
                <Input
                  placeholder="Or type a custom role..."
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      addCustomInterest();
                    }
                  }}
                  classNames={{
                    input: "text-sm text-black placeholder:text-black/50",
                    inputWrapper:
                      "h-10 bg-white/10 rounded-md border border-white/30",
                  }}
                  disabled={isSubmitting}
                />
                <Button
                  className="h-10 px-4 rounded-md cursor-pointer  bg-cyan-900 hover:bg-cyan-800 text-white font-medium active:scale-[0.95] transition-all duration-200"
                  onPress={addCustomInterest}
                  isDisabled={
                    !customInterest.trim() ||
                    selectedInterests.length >= 5 ||
                    isSubmitting
                  }
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6 pt-6 border-t border-white/20">
              <Button
                size="lg"
                className={cn(
                  resumeFile
                    ? "pointer-events-auto opacity-100 cursor-pointer"
                    : "pointer-events-none opacity-50 ",
                  "w-full rounded-md font-semibold h-11 bg-gradient-to-r from-cyan-700 to-cyan-700 hover:from-cyan-800 hover:to-cyan-800 text-white active:scale-[0.98] transition-all duration-200",
                )}
                onPress={handleSubmit}
                isLoading={isSubmitting}
                isDisabled={!resumeFile || selectedInterests.length === 0}
              >
                {isSubmitting
                  ? "Finding Your Matches..."
                  : "Find My Best Matches"}
              </Button>

              <p className="text-xs text-black text-center mt-3">
                We'll analyze your resume and show you the most relevant
                positions
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
