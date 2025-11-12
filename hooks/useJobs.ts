/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Custom hook for fetching jobs with optional filters
 * Replaces repetitive useEffect patterns across job listing pages
 */

import { useState, useEffect } from "react";
import type { Job, JobStatus } from "@/types/job";
import { logger } from "@/lib/logger";

interface UseJobsOptions {
  companyId?: string;
  status?: JobStatus;
}

interface UseJobsReturn {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useJobs(options: UseJobsOptions = {}): UseJobsReturn {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const { companyId, status } = options;

  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();

    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query params
        const params = new URLSearchParams();
        if (companyId) params.append("companyId", companyId);
        if (status) params.append("status", status);

        const url = `/api/jobs?${params.toString()}`;

        logger.debug("Fetching jobs:", url);

        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch jobs");
        }

        const data = await response.json();

        if (!aborted && data.success && data.jobs) {
          setJobs(data.jobs);
          logger.success("Jobs loaded:", data.jobs.length);
        }
      } catch (err: any) {
        if (!aborted && err.name !== "AbortError") {
          logger.error("Error fetching jobs:", err);
          setError(err.message || "Failed to fetch jobs");
        }
      } finally {
        if (!aborted) {
          setLoading(false);
        }
      }
    };

    fetchJobs();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [companyId, status, refetchTrigger]);

  const refetch = () => setRefetchTrigger((prev) => prev + 1);

  return { jobs, loading, error, refetch };
}
