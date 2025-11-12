import Groq from "groq-sdk";
import type {
  JobMatcher,
  UserMatchingProfile,
  MatchingConfig,
  MatchingResults,
  JobMatchResult,
  CachedJobScore,
} from "./types";
import type { Job } from "@/types/job";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * LLM-based job matcher for public portal
 *
 * Uses lightweight LLM calls to match job titles to user interests
 * Much faster and cheaper than full resume analysis
 *
 * Strategy:
 * 1. Use title-only matching for initial filtering (fast, free)
 * 2. Optionally enhance with LLM for top matches (accurate, low cost)
 * 3. Leverage cached scores when available (instant, free)
 */
export class LLMJobMatcher implements JobMatcher {
  /**
   * Match jobs to user profile
   */
  async matchJobs(
    jobs: Job[],
    profile: UserMatchingProfile,
    config: MatchingConfig = {},
  ): Promise<MatchingResults> {
    const startTime = Date.now();

    // Apply defaults
    const {
      minScoreThreshold: _minScoreThreshold = 30, // Not used - showing all jobs with scores
      maxResults = Infinity,
      useCachedScores = true,
      useLLMEnhancement = false,
      llmEnhancementLimit = 5,
    } = config;

    // Step 1: Get cached scores if available
    const cachedScores =
      useCachedScores && profile.userId
        ? await this.fetchCachedScores(
            profile.userId,
            jobs.map((j) => j.id),
          )
        : new Map<string, CachedJobScore>();

    // Step 2: Match jobs
    const matchResults: JobMatchResult[] = [];

    for (const job of jobs) {
      // Check if we have a cached score
      const cached = cachedScores.get(job.id);

      if (cached) {
        // Use cached score
        matchResults.push({
          job,
          matchScore: cached.score,
          recommendation: this.getRecommendation(cached.score),
          reasoning: "Based on your previous application analysis",
          matchDetails: {
            titleMatch: cached.score,
            interestAlignment: this.findBestInterestMatch(
              job.title,
              profile.interests,
            ),
            confidence:
              cached.score >= 85
                ? "high"
                : cached.score >= 70
                  ? "medium"
                  : "low",
          },
        });
      } else {
        // Calculate new score using title-based matching
        const titleScore = this.calculateTitleMatch(
          job.title,
          profile.interests,
        );

        // Always add to results (remove minScoreThreshold filter)
        // We'll apply threshold later if needed, but for now show all jobs
        matchResults.push({
          job,
          matchScore: titleScore,
          recommendation: this.getRecommendation(titleScore),
          reasoning: this.generateReasoning(job.title, profile.interests),
          matchDetails: {
            titleMatch: titleScore,
            interestAlignment: this.findBestInterestMatch(
              job.title,
              profile.interests,
            ),
            confidence:
              titleScore >= 85 ? "high" : titleScore >= 70 ? "medium" : "low",
          },
        });
      }
    }

    // Step 3: Sort by score
    matchResults.sort((a, b) => b.matchScore - a.matchScore);

    // Step 4: Optionally enhance top matches with LLM
    let method: "title-based" | "llm-enhanced" | "cached" =
      cachedScores.size > 0 ? "cached" : "title-based";

    if (useLLMEnhancement && matchResults.length > 0) {
      const topMatches = matchResults.slice(0, llmEnhancementLimit);

      // Only enhance matches that aren't cached
      const toEnhance = topMatches.filter((m) => !cachedScores.has(m.job.id));

      if (toEnhance.length > 0) {
        await this.enhanceMatchesWithLLM(toEnhance, profile);
        method = "llm-enhanced";
      }
    }

    // Step 5: Apply result limit and return
    const finalMatches = matchResults.slice(0, maxResults);

    return {
      matches: finalMatches,
      totalJobsAnalyzed: jobs.length,
      processingTime: Date.now() - startTime,
      method,
    };
  }

  /**
   * Calculate title-based match score (0-100)
   * This is fast and free - no API calls
   */
  private calculateTitleMatch(jobTitle: string, interests: string[]): number {
    const normalizedJobTitle = jobTitle.toLowerCase().trim();
    let maxScore = 0;

    for (const interest of interests) {
      const normalizedInterest = interest.toLowerCase().trim();

      // Exact match
      if (normalizedJobTitle === normalizedInterest) {
        return 100;
      }

      // Job title contains interest
      if (normalizedJobTitle.includes(normalizedInterest)) {
        maxScore = Math.max(maxScore, 90);
        continue;
      }

      // Interest contains job title
      if (normalizedInterest.includes(normalizedJobTitle)) {
        maxScore = Math.max(maxScore, 85);
        continue;
      }

      // Keyword matching
      const keywordScore = this.calculateKeywordOverlap(
        normalizedJobTitle,
        normalizedInterest,
      );
      maxScore = Math.max(maxScore, keywordScore);
    }

    return Math.round(maxScore);
  }

  /**
   * Calculate keyword overlap between job title and interest
   */
  private calculateKeywordOverlap(jobTitle: string, interest: string): number {
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "from",
      "as",
    ]);

    const getKeywords = (text: string) =>
      text
        .split(/\W+/)
        .filter((word) => word.length > 2 && !stopWords.has(word));

    const jobKeywords = new Set(getKeywords(jobTitle));
    const interestKeywords = getKeywords(interest);

    if (interestKeywords.length === 0) return 0;

    let matchCount = 0;
    for (const word of interestKeywords) {
      if (jobKeywords.has(word)) {
        matchCount++;
      } else {
        // Check for partial matches (e.g., "engineer" vs "engineering")
        for (const jobWord of jobKeywords) {
          if (
            (word.length > 4 && jobWord.startsWith(word.slice(0, -1))) ||
            (jobWord.length > 4 && word.startsWith(jobWord.slice(0, -1)))
          ) {
            matchCount += 0.5;
            break;
          }
        }
      }
    }

    const matchRatio = matchCount / interestKeywords.length;

    // Convert ratio to score
    if (matchRatio >= 0.8) return 80;
    if (matchRatio >= 0.6) return 70;
    if (matchRatio >= 0.4) return 60;
    if (matchRatio >= 0.2) return 50;
    if (matchRatio > 0) return 40;

    return 0;
  }

  /**
   * Find which interest best matches this job title
   */
  private findBestInterestMatch(jobTitle: string, interests: string[]): string {
    const normalizedJobTitle = jobTitle.toLowerCase();

    for (const interest of interests) {
      const normalizedInterest = interest.toLowerCase();

      if (
        normalizedJobTitle === normalizedInterest ||
        normalizedJobTitle.includes(normalizedInterest) ||
        normalizedInterest.includes(normalizedJobTitle)
      ) {
        return interest;
      }
    }

    // Return first interest as fallback
    return interests[0] || "your interests";
  }

  /**
   * Generate human-readable reasoning for the match
   */
  private generateReasoning(jobTitle: string, interests: string[]): string {
    const normalizedJobTitle = jobTitle.toLowerCase();
    const bestMatch = this.findBestInterestMatch(jobTitle, interests);
    const normalizedMatch = bestMatch.toLowerCase();

    if (normalizedJobTitle === normalizedMatch) {
      return `Exact match for ${bestMatch}`;
    }

    if (normalizedJobTitle.includes(normalizedMatch)) {
      return `Strong match for ${bestMatch}`;
    }

    if (normalizedMatch.includes(normalizedJobTitle)) {
      return `Closely related to ${bestMatch}`;
    }

    return `Matches your interest in ${bestMatch}`;
  }

  /**
   * Convert score to recommendation level
   */
  private getRecommendation(
    score: number,
  ): "strong-match" | "good-match" | "possible-match" | "poor-match" {
    if (score >= 85) return "strong-match";
    if (score >= 70) return "good-match";
    if (score >= 50) return "possible-match";
    return "poor-match";
  }

  /**
   * Enhance top matches with LLM for more accurate scoring
   * This is optional and only used for top N matches to control cost
   */
  private async enhanceMatchesWithLLM(
    matches: JobMatchResult[],
    profile: UserMatchingProfile,
  ): Promise<void> {
    // Batch process to save on API calls
    const prompt = this.buildBatchMatchingPrompt(matches, profile);

    try {
      const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content:
              "You are a job matching expert. Analyze job titles against candidate interests and provide match scores. Return only valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
      });

      const content = response.choices[0].message.content || "{}";
      const cleaned = content
        .trim()
        .replace(/^```json\s*/gi, "")
        .replace(/^```\s*/g, "")
        .replace(/\s*```$/g, "");

      const enhancedScores = JSON.parse(cleaned);

      // Update matches with LLM scores
      for (let i = 0; i < matches.length; i++) {
        const enhanced = enhancedScores[i];
        if (enhanced && enhanced.score !== undefined) {
          matches[i].matchScore = enhanced.score;
          matches[i].reasoning = enhanced.reasoning || matches[i].reasoning;
          matches[i].recommendation = this.getRecommendation(enhanced.score);
          matches[i].matchDetails.confidence = "high";
        }
      }
    } catch (error) {
      console.error("[LLMJobMatcher] LLM enhancement failed:", error);
      // Fall back to title-based scores (already set)
    }
  }

  /**
   * Build prompt for batch LLM matching
   */
  private buildBatchMatchingPrompt(
    matches: JobMatchResult[],
    profile: UserMatchingProfile,
  ): string {
    const jobsList = matches.map((m, i) => `${i}. "${m.job.title}"`).join("\n");

    return `You are matching job titles to a candidate's interests. Provide accurate match scores.

**CANDIDATE INTERESTS:**
${profile.interests.map((i) => `- ${i}`).join("\n")}

**JOB TITLES TO SCORE:**
${jobsList}

**SCORING CRITERIA:**
- 90-100: Exact or near-exact match to interests
- 80-89: Strong alignment with interests
- 70-79: Good match, relevant role
- 60-69: Moderate match, some overlap
- Below 60: Weak match

**RETURN ONLY VALID JSON ARRAY (no markdown):**
[
  {"score": 95, "reasoning": "Exact match for Software Engineer"},
  {"score": 82, "reasoning": "Strong alignment with AI Engineer interest"},
  ...
]`;
  }

  /**
   * Fetch cached scores from Firestore
   * This avoids re-computation for users who have applied before
   */
  private async fetchCachedScores(
    userId: string,
    jobIds: string[],
  ): Promise<Map<string, CachedJobScore>> {
    const scores = new Map<string, CachedJobScore>();

    if (jobIds.length === 0) {
      return scores;
    }

    try {
      const { getAdminFirestore } = await import("@/lib/firebase-admin");
      const firestore = await getAdminFirestore();

      // Firestore 'in' queries support max 10 items, so we need to chunk
      const chunks = this.chunkArray(jobIds, 10);

      for (const chunk of chunks) {
        const snapshot = await firestore
          .collection("applications")
          .where("userId", "==", userId)
          .where("jobId", "in", chunk)
          .where("processingStatus", "==", "completed")
          .get();

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.fitScore && data.jobId) {
            scores.set(data.jobId, {
              jobId: data.jobId,
              score: data.fitScore,
              timestamp: data.appliedAt?.toDate() || new Date(),
              source: "application",
            });
          }
        });
      }

      console.log(
        `[LLMJobMatcher] Fetched ${scores.size} cached scores for user ${userId}`,
      );
    } catch (error) {
      console.error("[LLMJobMatcher] Failed to fetch cached scores:", error);
    }

    return scores;
  }

  /**
   * Utility: Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Export singleton instance
export const jobMatcher = new LLMJobMatcher();
