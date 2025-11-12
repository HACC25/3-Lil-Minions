import type { Job } from "@/types/job";
import type {
  ParsedResumeData,
  FitScoreBreakdown,
  ScoringVersion,
  ApplicationFormData,
} from "@/types/application";

/**
 * Base interface for all scoring engines
 * This contract ensures any scoring implementation can be swapped in
 *
 * Extension point: Implement this interface for v2, v3, etc.
 */
export interface ScoringEngine {
  version: ScoringVersion;

  /**
   * Calculate fit score between resume and job
   * @param resumeData - Parsed resume data
   * @param job - Job posting from Firestore
   * @param applicationData - Optional structured application data (v2+)
   * @returns Detailed fit score breakdown
   */
  calculateFit(
    resumeData: ParsedResumeData,
    job: Job,
    applicationData?: ApplicationFormData,
  ): Promise<FitScoreBreakdown>;
}

/**
 * Configuration for scoring engine
 *
 * Extension point: Add more config options as needed
 */
export interface ScoringConfig {
  version: ScoringVersion;
  threshold?: number; // Minimum score for second round (default: 70)

  // Future expansion
  enableCaching?: boolean;
  enableMismatchDetection?: boolean;
  customWeights?: {
    skills?: number;
    experience?: number;
    education?: number;
  };
}
