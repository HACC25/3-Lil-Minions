/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Custom hook for fetching company data
 * Replaces repetitive useEffect patterns in dashboard pages
 */

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/firebaseConfig/firebase";
import type { Company } from "@/types/company";
import { logger } from "@/lib/logger";

interface UseCompanyDataReturn {
  company: Company | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCompanyData(
  userId: string | undefined,
): UseCompanyDataReturn {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let aborted = false;

    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        setError(null);

        logger.debug("Fetching company data for UID:", userId);

        const companyDoc = await getDoc(doc(firestore, "companies", userId));

        if (!aborted) {
          if (companyDoc.exists()) {
            const data = companyDoc.data() as Company;
            setCompany(data);
            logger.success("Company data loaded:", data.companyName);
          } else {
            throw new Error("Company profile not found");
          }
        }
      } catch (err: any) {
        if (!aborted) {
          logger.error("Error fetching company data:", err);
          setError(err.message || "Failed to load company data");
        }
      } finally {
        if (!aborted) {
          setLoading(false);
        }
      }
    };

    fetchCompanyData();

    return () => {
      aborted = true;
    };
  }, [userId, refetchTrigger]);

  const refetch = () => setRefetchTrigger((prev) => prev + 1);

  return { company, loading, error, refetch };
}
