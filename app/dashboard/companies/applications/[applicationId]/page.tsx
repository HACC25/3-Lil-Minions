"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard";
import {
  DetailedApplicationView,
  SimplifiedApplicationView,
} from "@/components/application-details";
import { LoadingCard } from "@/app/jobs/company/[companyId]/page";

function ApplicationDetailsContent() {
  const params = useParams();
  const applicationId = params.applicationId as string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (applicationId) {
      fetchApplicationDetails();
    }
  }, [applicationId]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/applications/${applicationId}`);
      const data = await response.json();

      if (data.success && data.application) {
        setApplication(data.application);
      } else {
        setError(data.error || "Failed to load application");
      }
    } catch (err) {
      setError("An error occurred while loading the application");
      console.error("Error fetching application:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingCard desc="Loading application details, please wait..." />;
  }

  if (error || !application) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-red-600">{error || "Application not found"}</p>
        </div>
      </DashboardLayout>
    );
  }

  // Toggle between views - change to SimplifiedApplicationView for simplified layout
  const useSimplifiedView = false;

  return (
    <DashboardLayout>
      {useSimplifiedView ? (
        <SimplifiedApplicationView
          application={application}
          onRefresh={fetchApplicationDetails}
        />
      ) : (
        <DetailedApplicationView
          application={application}
          onRefresh={fetchApplicationDetails}
        />
      )}
    </DashboardLayout>
  );
}

export default function ApplicationDetailsPage() {
  return (
    <ProtectedRoute requiredRole="company">
      <ApplicationDetailsContent />
    </ProtectedRoute>
  );
}
