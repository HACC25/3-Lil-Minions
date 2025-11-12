/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Custom hook for fetching all companies data
 * Fetches the entire companies collection from Firestore
 */

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "@/firebaseConfig/firebase";
import type { Company } from "@/types/company";
import { logger } from "@/lib/logger";

interface UseAllCompaniesReturn {
  companies: Company[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAllCompanies(): UseAllCompaniesReturn {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let aborted = false;

    const fetchAllCompanies = async () => {
      try {
        setLoading(true);
        setError(null);

        logger.debug("Fetching all companies data");

        const companiesCollection = collection(firestore, "companies");
        const companiesSnapshot = await getDocs(companiesCollection);

        if (!aborted) {
          const companiesData = companiesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Company),
          }));

          setCompanies(companiesData);
          logger.success(`Loaded ${companiesData.length} companies`);
        }
      } catch (err: any) {
        if (!aborted) {
          logger.error("Error fetching companies data:", err);
          setError(err.message || "Failed to load companies data");
        }
      } finally {
        if (!aborted) {
          setLoading(false);
        }
      }
    };

    fetchAllCompanies();

    return () => {
      aborted = true;
    };
  }, [refetchTrigger]);

  const refetch = () => setRefetchTrigger((prev) => prev + 1);

  return { companies, loading, error, refetch };
}
