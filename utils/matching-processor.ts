/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAdminFirestore } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { extractTextFromPdf } from "./adobe-pdf-extractor";
import { LLMJobMatcher } from "./matching";
import type { Job } from "@/types/job";
import type {
  UserMatchingProfile,
  MatchingConfig,
  MatchingResults,
  CachedJobScore,
} from "./matching/types";

/**
 * Options for matching processing
 */
export interface MatchingProcessingOptions {
  /** User ID if authenticated (enables cached scores) */
  userId?: string;

  /** Company ID to filter jobs */
  companyId: string;

  /** Matching configuration */
  config?: MatchingConfig;

  /** Whether to cache results for future use */
  cacheResults?: boolean;

  /** Session ID for tracking anonymous users */
  sessionId?: string;
}

/**
 * Result of the matching process
 */
export interface MatchingProcessingResult {
  results: MatchingResults;
  sessionId?: string;
  cached: boolean;
}

/**
 * Main matching processor for server-side operations
 * Orchestrates: Resume parsing → Job fetching → Matching → Optional caching
 *
 * EXTENSION POINTS:
 * - Line 75: Add structured resume parsing
 * - Line 95: Swap matching engine
 * - Line 140: Add analytics tracking
 */
export async function processJobMatching(
  resumeBuffer: Buffer,
  interests: string[],
  options: MatchingProcessingOptions,
): Promise<MatchingProcessingResult> {
  const firestore = await getAdminFirestore();
  const { userId, companyId, config, cacheResults = true, sessionId } = options;

  const trackingId = userId || sessionId || `anon-${Date.now()}`;

  try {
    console.log(`[${trackingId}] Job matching started`);

    // ========================================
    // STEP 1: EXTRACT RESUME TEXT
    // ========================================
    console.log(`[${trackingId}] Extracting resume text...`);
    const resumeText = await extractTextFromPdf(resumeBuffer);

    // ========================================
    // STEP 2: BUILD USER PROFILE
    // EXTENSION POINT: Add structured parsing here
    // ========================================
    const profile: UserMatchingProfile = {
      resumeText,
      interests,
      userId,
    };

    // ========================================
    // STEP 3: FETCH ACTIVE JOBS
    // ========================================
    console.log(`[${trackingId}] Fetching active jobs for company...`);
    const jobsSnapshot = await firestore
      .collection("jobs")
      .where("companyId", "==", companyId)
      .where("status", "==", "active")
      .get();

    const jobs: Job[] = jobsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Job[];

    console.log(`[${trackingId}] Found ${jobs.length} active jobs`);

    // ========================================
    // STEP 4: FETCH CACHED SCORES (if user authenticated)
    // ========================================
    let cachedScores: CachedJobScore[] = [];
    if (userId) {
      console.log(`[${trackingId}] Fetching cached scores for user...`);
      cachedScores = await fetchUserCachedScores(userId, companyId);
      console.log(`[${trackingId}] Found ${cachedScores.length} cached scores`);
    }

    // ========================================
    // STEP 5: RUN MATCHING ENGINE
    // EXTENSION POINT: Swap matching engine here
    // ========================================
    console.log(`[${trackingId}] Running matching algorithm...`);
    const matcher = new LLMJobMatcher();

    const results = await matcher.matchJobs(jobs, profile, {
      minScoreThreshold: config?.minScoreThreshold ?? 30,
      maxResults: config?.maxResults,
      useCachedScores: config?.useCachedScores ?? true,
      useLLMEnhancement: config?.useLLMEnhancement ?? false,
      llmEnhancementLimit: config?.llmEnhancementLimit ?? 5,
    });

    console.log(
      `[${trackingId}] ✅ Matching complete! Found ${results.matches.length} matches in ${results.processingTime}ms`,
    );

    // ========================================
    // STEP 6: CACHE RESULTS (if enabled)
    // ========================================
    if (cacheResults) {
      await cacheMatchingResults(trackingId, companyId, results, userId);
    }

    // ========================================
    // STEP 7: TRACK ANALYTICS
    // EXTENSION POINT: Add analytics tracking
    // ========================================
    await trackMatchingEvent(trackingId, companyId, {
      jobsAnalyzed: results.totalJobsAnalyzed,
      matchesFound: results.matches.length,
      processingTime: results.processingTime,
      method: results.method,
      userId,
      interests,
    });

    return {
      results,
      sessionId: sessionId || trackingId,
      cached: false,
    };
  } catch (error) {
    console.error(`[${trackingId}] ❌ Matching failed:`, error);

    // Track error
    await trackMatchingError(trackingId, companyId, error);

    throw error;
  }
}

/**
 * Process matching with resume file path from storage
 * Useful for processing resumes already uploaded to Firebase Storage
 */
export async function processJobMatchingFromStorage(
  _resumeStoragePath: string,
  _interests: string[],
  _options: MatchingProcessingOptions,
): Promise<MatchingProcessingResult> {
  // TODO: Implement storage fetch
  // const { getStorage } = await import("firebase-admin/storage");
  // const bucket = getStorage().bucket();
  // const file = bucket.file(resumeStoragePath);
  // const [buffer] = await file.download();

  throw new Error("Storage-based matching not yet implemented");
}

/**
 * Fetch cached scores from previous applications
 */
async function fetchUserCachedScores(
  userId: string,
  companyId: string,
): Promise<CachedJobScore[]> {
  const firestore = await getAdminFirestore();

  try {
    const applicationsSnapshot = await firestore
      .collection("applications")
      .where("userId", "==", userId)
      .where("companyId", "==", companyId)
      .where("processingStatus", "==", "completed")
      .get();

    const scores: CachedJobScore[] = [];

    applicationsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.fitScore && data.jobId) {
        scores.push({
          jobId: data.jobId,
          score: data.fitScore,
          timestamp: data.appliedAt?.toDate() || new Date(),
          source: "application",
        });
      }
    });

    return scores;
  } catch (error) {
    console.error("Failed to fetch cached scores:", error);
    return [];
  }
}

/**
 * Cache matching results for future reference
 */
async function cacheMatchingResults(
  trackingId: string,
  companyId: string,
  results: MatchingResults,
  userId?: string,
): Promise<void> {
  const firestore = await getAdminFirestore();

  try {
    await firestore
      .collection("matchingSessions")
      .doc(trackingId)
      .set({
        companyId,
        userId: userId || null,
        matchesFound: results.matches.length,
        topMatches: results.matches.slice(0, 10).map((m) => ({
          jobId: m.job.id,
          jobTitle: m.job.title,
          matchScore: m.matchScore,
          recommendation: m.recommendation,
        })),
        method: results.method,
        processingTime: results.processingTime,
        totalJobsAnalyzed: results.totalJobsAnalyzed,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromMillis(
          Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        ),
      });

    console.log(`[${trackingId}] Results cached successfully`);
  } catch (error) {
    console.error(`[${trackingId}] Failed to cache results:`, error);
    // Don't throw - caching failure shouldn't break the process
  }
}

/**
 * Track matching analytics event
 */
async function trackMatchingEvent(
  trackingId: string,
  companyId: string,
  data: {
    jobsAnalyzed: number;
    matchesFound: number;
    processingTime: number;
    method: string;
    userId?: string;
    interests: string[];
  },
): Promise<void> {
  const firestore = await getAdminFirestore();

  try {
    await firestore.collection("matchingAnalytics").add({
      trackingId,
      companyId,
      userId: data.userId ?? null,
      eventType: "matching_completed",
      jobsAnalyzed: data.jobsAnalyzed,
      matchesFound: data.matchesFound,
      processingTime: data.processingTime,
      method: data.method,
      interests: data.interests,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error("Failed to track analytics:", error);
    // Don't throw - analytics failure shouldn't break the process
  }
}

/**
 * Track matching error event
 */
async function trackMatchingError(
  trackingId: string,
  companyId: string,
  error: unknown,
): Promise<void> {
  const firestore = await getAdminFirestore();

  try {
    await firestore.collection("matchingAnalytics").add({
      trackingId,
      companyId,
      eventType: "matching_failed",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: Timestamp.now(),
    });
  } catch (analyticsError) {
    console.error("Failed to track error:", analyticsError);
  }
}

/**
 * Get cached matching results if available
 */
export async function getCachedMatchingResults(
  sessionId: string,
): Promise<MatchingProcessingResult | null> {
  const firestore = await getAdminFirestore();

  try {
    const sessionDoc = await firestore
      .collection("matchingSessions")
      .doc(sessionId)
      .get();

    if (!sessionDoc.exists) {
      return null;
    }

    const data = sessionDoc.data();

    // Check if expired
    if (data?.expiresAt && data.expiresAt.toMillis() < Date.now()) {
      return null;
    }

    // Fetch full job details for cached matches
    const jobIds = data?.topMatches?.map((m: any) => m.jobId) || [];
    const jobs = await fetchJobsByIds(jobIds);

    // Reconstruct results
    const matches = data?.topMatches
      ?.map((m: any) => {
        const job = jobs.find((j) => j.id === m.jobId);
        if (!job) return null;

        return {
          job,
          matchScore: m.matchScore,
          recommendation: m.recommendation,
          reasoning: `Cached match result`,
          matchDetails: {
            titleMatch: m.matchScore,
            interestAlignment: "cached",
            confidence: "medium" as const,
          },
        };
      })
      .filter(Boolean);

    return {
      results: {
        matches: matches || [],
        totalJobsAnalyzed: data?.totalJobsAnalyzed || 0,
        processingTime: 0, // Cached
        method: "cached",
      },
      sessionId,
      cached: true,
    };
  } catch (error) {
    console.error("Failed to get cached results:", error);
    return null;
  }
}

/**
 * Fetch jobs by IDs
 */
async function fetchJobsByIds(jobIds: string[]): Promise<Job[]> {
  if (jobIds.length === 0) return [];

  const firestore = await getAdminFirestore();
  const jobs: Job[] = [];

  // Firestore 'in' queries support max 10 items
  const chunks = chunkArray(jobIds, 10);

  for (const chunk of chunks) {
    const snapshot = await firestore
      .collection("jobs")
      .where("__name__", "in", chunk)
      .get();

    snapshot.docs.forEach((doc) => {
      jobs.push({
        id: doc.id,
        ...doc.data(),
      } as Job);
    });
  }

  return jobs;
}

/**
 * Utility: Chunk array into smaller arrays
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * EXTENSION POINT: Reprocess matching with different configuration
 * Useful for testing different matching strategies
 */
export async function reprocessMatching(
  sessionId: string,
  _newConfig: MatchingConfig,
): Promise<MatchingProcessingResult> {
  const firestore = await getAdminFirestore();

  // Fetch original session
  const sessionDoc = await firestore
    .collection("matchingSessions")
    .doc(sessionId)
    .get();

  if (!sessionDoc.exists) {
    throw new Error(`Session ${sessionId} not found`);
  }

  // TODO: Implement reprocessing with stored resume text
  throw new Error("Reprocessing not yet implemented");
}
