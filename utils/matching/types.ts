import type { Job } from "@/types/job";

/**
 * User's interests and resume data for matching
 */
export interface UserMatchingProfile {
  resumeText: string;
  interests: string[]; // Job titles they're interested in
  userId?: string; // Optional: for fetching existing scores
}

/**
 * Result of matching a single job
 */
export interface JobMatchResult {
  job: Job;
  matchScore: number; // 0-100
  recommendation:
    | "strong-match"
    | "good-match"
    | "possible-match"
    | "poor-match";
  reasoning: string;
  matchDetails: {
    titleMatch: number; // How well job title matches interests (0-100)
    interestAlignment: string; // Which interest this matches
    confidence: "high" | "medium" | "low";
  };
}

/**
 * Batch matching results
 */
export interface MatchingResults {
  matches: JobMatchResult[];
  totalJobsAnalyzed: number;
  processingTime: number; // milliseconds
  method: "title-based" | "llm-enhanced" | "cached";
}

/**
 * Configuration for the matching engine
 */
export interface MatchingConfig {
  /** Minimum score threshold to include in results (default: 30) */
  minScoreThreshold?: number;

  /** Maximum number of results to return (default: unlimited) */
  maxResults?: number;

  /** Use cached scores from previous applications if available */
  useCachedScores?: boolean;

  /** Use LLM for enhanced matching (more accurate but slower/costly) */
  useLLMEnhancement?: boolean;

  /** Only match top N candidates with LLM to save cost */
  llmEnhancementLimit?: number;
}

/**
 * Cached score from a previous application
 */
export interface CachedJobScore {
  jobId: string;
  score: number;
  timestamp: Date;
  source: "application" | "screening" | "manual";
}

/**
 * Interface for matching engines
 */
export interface JobMatcher {
  /**
   * Match jobs to a user profile
   */
  matchJobs(
    jobs: Job[],
    profile: UserMatchingProfile,
    config?: MatchingConfig,
  ): Promise<MatchingResults>;
}
