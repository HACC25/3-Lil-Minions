/**
 * Custom hook for handling authentication redirects
 * Automatically redirects authenticated users to dashboard
 * Replaces repetitive auth redirect logic in SignIn/SignUp pages
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { logger } from "@/lib/logger";

interface UseAuthRedirectOptions {
  requiredRole?: "company" | "user";
  redirectPath?: string;
}

interface UseAuthRedirectReturn {
  loading: boolean;
  shouldShowForm: boolean;
}

export function useAuthRedirect(
  options: UseAuthRedirectOptions = {},
): UseAuthRedirectReturn {
  const { requiredRole = "company", redirectPath = "/dashboard/companies" } =
    options;
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user && role === requiredRole) {
      logger.debug("User already logged in, redirecting to dashboard...");
      router.push(redirectPath);
    }
  }, [user, role, authLoading, router, requiredRole, redirectPath]);

  const shouldShowForm = !authLoading && !(user && role === requiredRole);

  return {
    loading: authLoading,
    shouldShowForm,
  };
}
