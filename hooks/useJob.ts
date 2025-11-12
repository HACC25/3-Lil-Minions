/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Custom hook for fetching a single job by ID
 * Replaces repetitive useEffect patterns across job detail pages
 */

import { useState, useEffect } from "react";
import type { Job } from "@/types/job";
import { logger } from "@/lib/logger";

interface UseJobReturn {
  job: Job | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useJob(jobId: string | undefined): UseJobReturn {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (!jobId) {
      setLoading(false);
      return;
    }

    let aborted = false;
    const controller = new AbortController();

    const fetchJob = async () => {
      try {
        setLoading(true);
        setError(null);

        logger.debug("Fetching job:", jobId);

        const response = await fetch(`/api/jobs/${jobId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch job");
        }

        const data = await response.json();

        if (!aborted && data.success && data.job) {
          setJob(data.job);
          logger.success("Job loaded:", jobId);
        } else if (!aborted) {
          throw new Error("Job not found");
        }
      } catch (err: any) {
        if (!aborted && err.name !== "AbortError") {
          logger.error("Error fetching job:", err);
          setError(err.message || "Failed to fetch job");
        }
      } finally {
        if (!aborted) {
          setLoading(false);
        }
      }
    };

    fetchJob();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [jobId, refetchTrigger]);

  const refetch = () => setRefetchTrigger((prev) => prev + 1);

  return { job, loading, error, refetch };
}
