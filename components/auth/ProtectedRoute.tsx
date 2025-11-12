"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { LoadingCard } from "@/app/jobs/company/[companyId]/page";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: "company" | "admin" | "candidate";
  fallbackPath?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  fallbackPath = "/sign-in",
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    // If no user, redirect to sign in
    if (!user) {
      console.log("❌ No user found, redirecting to sign in");
      router.push(fallbackPath);
      return;
    }

    // If user doesn't have required role, show access denied or redirect
    if (role !== requiredRole) {
      console.log(
        `❌ Access denied. Required: ${requiredRole}, User has: ${role || "none"}`,
      );
      router.push(fallbackPath);
      return;
    }

    console.log(`✅ Access granted. User has required role: ${requiredRole}`);
  }, [user, role, loading, requiredRole, router, fallbackPath]);

  // Show loading card while checking auth
  if (loading) {
    return <LoadingCard desc="Authenticating, please wait..." />;
  }

  // If no user or wrong role, show nothing (redirect is happening)
  if (!user || role !== requiredRole) {
    return null;
  }

  // User is authenticated and has correct role
  return <>{children}</>;
}
