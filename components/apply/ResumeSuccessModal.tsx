"use client";

import { CheckCircle, X } from "lucide-react";

interface ResumeSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResumeSuccessModal({
  isOpen,
  onClose,
}: ResumeSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <h2 className="text-xl font-bold text-black">
              Resume Data Loaded!
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700">
            Your resume data has been successfully loaded into the application
            form.
          </p>
          <p className="text-gray-600 mt-3">
            Please review and edit any fields before submitting your
            application.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Continue to Application
        </button>
      </div>
    </div>
  );
}
