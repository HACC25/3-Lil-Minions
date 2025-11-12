"use client";

import React from "react";
import { X, Trash2 } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!isDeleting) {
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
              <Trash2
                style={{ width: "24px", height: "24px", color: "#ef4444" }}
              />
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
              disabled={isDeleting}
              style={{
                background: "none",
                border: "none",
                color: "#9ca3af",
                cursor: isDeleting ? "not-allowed" : "pointer",
                padding: "4px",
                borderRadius: "4px",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isDeleting) {
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
          <div style={{ padding: "16px 20px" }}>
            <p
              style={{
                color: "#6b7280",
                lineHeight: "1.6",
                margin: 0,
                fontSize: "14px",
              }}
            >
              {message}
            </p>
            {itemName && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    margin: "0 0 4px 0",
                  }}
                >
                  Item to delete:
                </p>
                <p
                  style={{
                    fontWeight: "500",
                    color: "#111827",
                    margin: 0,
                    fontSize: "14px",
                  }}
                >
                  {itemName}
                </p>
              </div>
            )}
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
              disabled={isDeleting}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                backgroundColor: "#ffffff",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                cursor: isDeleting ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ffffff";
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "500",
                borderRadius: "8px",
                cursor: isDeleting ? "not-allowed" : "pointer",
                border: "none",
                transition: "all 0.2s ease",
                backgroundColor: "#dc2626",
                color: "#ffffff",
              }}
              onMouseEnter={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = "#b91c1c";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#dc2626";
              }}
            >
              {isDeleting ? (
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
                  <span>Deleting...</span>
                </div>
              ) : (
                "Delete"
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
