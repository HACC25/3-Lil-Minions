"use client";

import React from "react";
import { X, Info } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  icon?: React.ReactNode;
  isProcessing?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "#3b82f6",
  icon,
  isProcessing = false,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!isProcessing) {
      onConfirm();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Dialog */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "500px",
          margin: "0 16px",
          transform: "translateZ(0)",
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              {icon || (
                <Info
                  style={{ width: "24px", height: "24px", color: confirmColor }}
                />
              )}
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#111827",
                  margin: 0,
                }}
              >
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              style={{
                background: "none",
                border: "none",
                color: "#9ca3af",
                cursor: isProcessing ? "not-allowed" : "pointer",
                padding: "4px",
                borderRadius: "4px",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.color = "#6b7280";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#9ca3af";
              }}
            >
              <X style={{ width: "20px", height: "20px" }} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: "20px" }}>
            <div
              style={{
                color: "#374151",
                lineHeight: "1.6",
                fontSize: "14px",
              }}
              dangerouslySetInnerHTML={{ __html: message }}
            />
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "12px",
              padding: "16px 20px",
              backgroundColor: "#f9fafb",
            }}
          >
            <button
              onClick={onClose}
              disabled={isProcessing}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                backgroundColor: "#ffffff",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                cursor: isProcessing ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ffffff";
              }}
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "500",
                borderRadius: "8px",
                cursor: isProcessing ? "not-allowed" : "pointer",
                border: "none",
                transition: "all 0.2s ease",
                backgroundColor: confirmColor,
                color: "#ffffff",
              }}
              onMouseEnter={(e) => {
                if (!isProcessing) {
                  // Darken the color slightly
                  e.currentTarget.style.opacity = "0.9";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              {isProcessing ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid #ffffff",
                      borderTop: "2px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <span>Processing...</span>
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
