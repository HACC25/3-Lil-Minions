"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { frostedGlassBg } from "@/utils/styles";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { DashboardLayout, RecentJobs } from "@/components/dashboard";
import { Button } from "@nextui-org/react";
import { Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useJobs } from "@/hooks/useJobs";
import { logger } from "@/lib/logger";
import { cn } from "@/utils/styles";
import { LoadingCard } from "@/app/jobs/company/[companyId]/page";
function CompanyDashboardContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const {
    company: companyData,
    loading: companyLoading,
    error: companyError,
  } = useCompanyData(user?.uid);
  const { jobs, loading: jobsLoading } = useJobs({ companyId: user?.uid });

  const loading = companyLoading || jobsLoading;
  const error = companyError || "";

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/sign-in");
    } catch (error) {
      logger.error("Sign out error:", error);
    }
  };

  // // Calculate stats from jobs
  // const totalJobs = jobs.length;
  // const activeJobs = jobs.filter((job) => job.status === "active").length;
  // const draftJobs = jobs.filter((job) => job.status === "draft").length;
  // const totalApplications = jobs.reduce(
  //   (sum, job) => sum + (job.applicants || 0),
  //   0
  // );

  if (loading) {
    return (
      <LoadingCard desc="Loading your company dashboard, please wait..." />
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div style={{ padding: "20px", color: "#000" }}>
          <h1>Error</h1>
          <p style={{ color: "#c00" }}>{error}</p>
          <button
            onClick={handleSignOut}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {companyData?.companyName}!
            </h1>
            <p className="text-zinc-800 mt-1">
              Here's what's happening with your job postings
            </p>
          </div>
        </div>
        {/* Quick Actions */}
        {jobs.length > 0 && (
          <div
            className={cn(
              frostedGlassBg,
              " mb-7 border border-white/50 hover:shadow-none border-dashed hover:border-solid mt-8 p-6 ",
            )}
          >
            <h3 className="text-lg font-semibold text-black mb-2">
              Quick Actions
            </h3>
            <p className="text-black text-sm mb-4">
              Manage your hiring process efficiently
            </p>
            <div className="flex gap-3">
              <Button
                as={Link}
                href="/dashboard/companies/jobs/create"
                className={cn(
                  frostedGlassBg,
                  " text-black h-9 rounded-lg hover:bg-white font-medium text-sm normal-case",
                )}
                startContent={<Plus size={16} />}
              >
                Post New Job
              </Button>
              <Button
                as={Link}
                href="/dashboard/companies/jobs"
                variant="bordered"
                className="border-gray-300 text-white bg-cyan-800/80  hover:bg-cyan-900 h-9 rounded-lg font-medium text-sm normal-case"
              >
                Manage All Jobs
              </Button>
            </div>
          </div>
        )}
        {/* Recent Jobs Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Recent Job Postings
            </h2>
            {jobs.length > 0 && (
              <Button
                as={Link}
                href="/dashboard/companies/jobs"
                variant="light"
                className={cn(
                  frostedGlassBg,
                  "text-gray-900 hover:bg-white hover:text-gray-900 font-medium text-sm",
                )}
                endContent={<ArrowRight size={16} />}
              >
                View All
              </Button>
            )}
          </div>
          <RecentJobs jobs={jobs} limit={3} />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function CompanyDashboardPage() {
  return (
    <ProtectedRoute requiredRole="company">
      <CompanyDashboardContent />
    </ProtectedRoute>
  );
}
