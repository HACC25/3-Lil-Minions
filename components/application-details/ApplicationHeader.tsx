"use client";

import { useState } from "react";
import { Button, Card, CardBody } from "@nextui-org/react";
import { ArrowLeft, Download, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatRelativeDate } from "@/lib/formatters";
import { logger } from "@/lib/logger";

interface ApplicationHeaderProps {
  application: {
    id: string;
    firstName: string;
    lastName: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appliedAt: any;
    resumeUrl?: string;
    jobId: string;
    eligibleForSecondRound?: boolean;
  };
  onRefresh?: () => void;
}

export function ApplicationHeader({
  application,
  onRefresh,
}: ApplicationHeaderProps) {
  const router = useRouter();
  const [sendingInterview, setSendingInterview] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSendInterview = async () => {
    try {
      setSendingInterview(true);

      const response = await fetch(
        `/api/applications/${application.id}/send-interview`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (data.success) {
        setNotification({
          type: "success",
          message:
            data.message ||
            `Interview invitation sent to ${application.firstName} ${application.lastName}`,
        });
        setTimeout(() => setNotification(null), 5000);

        // Refetch application data to update eligibleForSecondRound status
        if (onRefresh) {
          onRefresh();
        }
      } else {
        setNotification({
          type: "error",
          message: data.error || "Failed to send invitation. Please try again.",
        });
        setTimeout(() => setNotification(null), 7000);
      }
    } catch (error) {
      logger.error("Error sending interview invitation:", error);
      setNotification({
        type: "error",
        message: "An unexpected error occurred. Please try again.",
      });
      setTimeout(() => setNotification(null), 7000);
    } finally {
      setSendingInterview(false);
    }
  };

  return (
    <div className="mb-6">
      <Button
        variant="light"
        startContent={<ArrowLeft size={16} />}
        onPress={() => {
          if (application.jobId) {
            router.push(
              `/dashboard/companies/jobs/${application.jobId}/applicants`,
            );
          } else {
            router.back();
          }
        }}
        className="mb-4 text-gray-700 hover:text-gray-900 -ml-2"
      >
        Back to Applicants
      </Button>

      {notification && (
        <Card
          className={`mb-4 ${
            notification.type === "success"
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          } border-2`}
        >
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    notification.type === "success"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    notification.type === "success"
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {notification.message}
                </p>
              </div>
              <Button
                size="sm"
                variant="light"
                onPress={() => setNotification(null)}
                className={
                  notification.type === "success"
                    ? "text-green-800"
                    : "text-red-800"
                }
              >
                ✕
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">
            {application.firstName} {application.lastName}
          </h1>
          <p className="text-black/70 mt-1">
            Applied {formatRelativeDate(application.appliedAt)}
          </p>
        </div>

        <div className="flex gap-3">
          {application.resumeUrl && (
            <Button
              as="a"
              href={application.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="flat"
              startContent={<Download size={16} />}
              className="bg-white/20 rounded-md backdrop-blur-md border border-white/30 text-black hover:bg-white/30"
            >
              Resume
            </Button>
          )}
          {application.eligibleForSecondRound ? (
            <Button
              as="a"
              href={`/interviews/end/${application.id}`}
              className="bg-gray-900 text-white rounded-md hover:bg-gray-800"
              startContent={<Mail size={16} />}
            >
              View Interview
            </Button>
          ) : (
            <Button
              className="bg-gray-900 text-white hover:bg-gray-800"
              startContent={<Mail size={16} />}
              onPress={handleSendInterview}
              isDisabled={sendingInterview}
            >
              {sendingInterview ? "Sending..." : "Send Interview"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
