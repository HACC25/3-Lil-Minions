"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, FileText, Loader2, CheckCircle, X } from "lucide-react";
import type { PrefilledApplicationData } from "@/utils/resume-parser";
import { hasStoredResume, getResumeFromStorage } from "@/utils/resumeStorage";

interface ResumeUploadPrefillProps {
  onPrefillComplete: (data: PrefilledApplicationData) => void;
  onClose: () => void;
}

export function ResumeUploadPrefill({
  onPrefillComplete,
  onClose,
}: ResumeUploadPrefillProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [confidence, setConfidence] = useState<number>(0);
  const [showStoredResumePrompt, setShowStoredResumePrompt] = useState(false);
  const [storedResumeInfo, setStoredResumeInfo] = useState<{
    file: File;
    fileName: string;
  } | null>(null);
  const hasProcessedRef = useRef(false);

  // Check for stored resume on mount
  useEffect(() => {
    if (hasStoredResume() && !hasProcessedRef.current) {
      const { file: storedFile, metadata } = getResumeFromStorage();
      if (storedFile && metadata) {
        console.log("📄 Found stored resume:", metadata.fileName);
        setStoredResumeInfo({
          file: storedFile,
          fileName: metadata.fileName,
        });
        setShowStoredResumePrompt(true);
      }
    }
  }, []);

  const handleUseStoredResume = () => {
    if (storedResumeInfo) {
      console.log("✅ User approved using stored resume");
      setFile(storedResumeInfo.file);
      setShowStoredResumePrompt(false);
      hasProcessedRef.current = true;
      processStoredResume(storedResumeInfo.file);
    }
  };

  const handleUploadNewResume = () => {
    console.log("📤 User chose to upload new resume");
    setShowStoredResumePrompt(false);
    setStoredResumeInfo(null);
  };

  const processStoredResume = async (storedFile: File) => {
    if (hasProcessedRef.current && isProcessing) {
      console.log("⏭️ Already processing, skipping duplicate call");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      console.log("🚀 Auto-processing stored resume...");

      // Create FormData to send file to server
      const formData = new FormData();
      formData.append("file", storedFile);

      // Call server-side API route
      const response = await fetch("/api/resume-prefill", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || "Failed to process resume");
      }

      console.log("✅ Resume processed successfully:", result);
      setConfidence(result.confidence || 0);
      setSuccess(true);

      // Wait a moment to show success state
      setTimeout(() => {
        if (result.data) {
          onPrefillComplete(result.data);
        }
      }, 1000);
    } catch (err) {
      console.error("❌ Error processing stored resume:", err);
      setError(err instanceof Error ? err.message : "Failed to process resume");
      hasProcessedRef.current = false; // Reset on error so user can retry
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ["application/pdf"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF file");
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
    setError("");
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError("");

    try {
      console.log("🚀 Processing resume for prefill...");

      // Create FormData to send file to server
      const formData = new FormData();
      formData.append("file", file);

      // Call server-side API route
      const response = await fetch("/api/resume-prefill", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || "Failed to process resume");
      }

      console.log("✅ Resume processed successfully:", result);
      setConfidence(result.confidence || 0);
      setSuccess(true);

      // Wait a moment to show success state
      setTimeout(() => {
        if (result.data) {
          onPrefillComplete(result.data);
        }
      }, 1000);
    } catch (err) {
      console.error("❌ Error processing resume:", err);
      setError(err instanceof Error ? err.message : "Failed to process resume");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError("");
    setSuccess(false);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-black">
              Auto-Fill from Resume
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Upload your resume to automatically populate the form
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stored Resume Prompt */}
        {showStoredResumePrompt && storedResumeInfo && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Previously Uploaded Resume Found
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  We found your resume:{" "}
                  <span className="font-medium">
                    {storedResumeInfo.fileName}
                  </span>
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleUseStoredResume}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Use This Resume
                  </button>
                  <button
                    onClick={handleUploadNewResume}
                    className="px-4 py-2 bg-white text-blue-600 border border-blue-300 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                  >
                    Upload Different Resume
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Area */}
        {!file && !showStoredResumePrompt ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-sm font-medium text-black mb-1">
                Click to upload your resume
              </p>
              <p className="text-xs text-gray-500">PDF only (Max 10MB)</p>
            </label>
          </div>
        ) : file ? (
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-black">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              {!isProcessing && !success && (
                <button
                  onClick={handleRemoveFile}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Processing Message */}
            {isProcessing && (
              <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Processing your resume...
                  </p>
                  <p className="text-xs text-blue-700">
                    Extracting data with AI, this may take a moment
                  </p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center space-x-2 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">
                    Resume processed successfully!
                  </p>
                  <p className="text-xs text-green-700">
                    Confidence: {confidence}% • Applying data...
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-900">{error}</p>
                <button
                  onClick={() => {
                    setError("");
                    if (file) processStoredResume(file);
                  }}
                  className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Manual Process Button (only show if not auto-processing and no success/error) */}
            {!success && !isProcessing && !error && (
              <button
                onClick={handleProcess}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>Auto-Fill Application</span>
              </button>
            )}
          </div>
        ) : null}

        {/* Info Text */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-900">
            <strong>Note:</strong> AI will extract information from your resume
            to prefill the form. You can review and edit all fields before
            submitting.
          </p>
        </div>
      </div>
    </div>
  );
}
