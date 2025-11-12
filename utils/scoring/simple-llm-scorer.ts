import Groq from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import type { Job } from "@/types/job";
import type { ParsedResumeData, FitScoreBreakdown } from "@/types/application";
import type { ScoringEngine } from "./types";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * V1: Simple LLM-based scoring (MVP)
 *
 * Uses Groq API with GPT-OSS-120B model for scoring
 * Sends resume text + job description to LLM in one call.
 * LLM does all the analysis: parsing, matching, scoring.
 *
 * Pros:
 * - Simple implementation
 * - LLM sees full context
 * - Fast to build
 * - GPT-OSS-120B provides strong reasoning
 *
 * Cons:
 * - Less consistent than rule-based
 * - Black box scoring
 *
 * Extension point: Replace with HybridScorer for v2
 */
export class SimpleLLMScorer implements ScoringEngine {
  version = "v1-simple-llm" as const;

  async calculateFit(
    resumeData: ParsedResumeData,
    job: Job,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    applicationData?: any,
  ): Promise<FitScoreBreakdown> {
    const prompt = this.buildPrompt(resumeData, job);

    try {
      // Use Groq with GPT-OSS-120B for scoring
      const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content:
              "You are an expert recruiter analyzing candidate fit for job positions. Return only valid JSON responses.",
          },
          {
            role: "user",
            content: prompt,
          },
        ] as ChatCompletionMessageParam[],
        temperature: 0.2, // Low temperature for consistent scoring
      });

      const content = response.choices[0].message.content || "{}";

      // Clean response (remove markdown code blocks if present)
      const cleaned = content
        .trim()
        .replace(/^```json\s*/gi, "")
        .replace(/^```\s*/g, "")
        .replace(/\s*```$/g, "");

      const analysis = JSON.parse(cleaned);

      // Return in extensible format
      return {
        overallScore: analysis.overallScore || 0,
        recommendation: analysis.recommendation || "poor-fit",
        skillsMatched: analysis.skillsMatched || [],
        skillsMissing: analysis.skillsMissing || [],
        strengths: analysis.strengths || [],
        concerns: analysis.concerns || [],
        reasoning: analysis.reasoning || "",

        // Include scoring method metadata for transparency
        scoringMethod: {
          version: this.version,
          aiWeight: 1.0,
          deterministicWeight: 0.0,
        },
      };
    } catch (error) {
      console.error("[SimpleLLMScorer] Analysis failed:", error);

      // Fallback to low score on error
      return {
        overallScore: 0,
        recommendation: "poor-fit",
        skillsMatched: [],
        skillsMissing: [],
        strengths: [],
        concerns: ["Failed to analyze resume - system error"],
        reasoning: "Error during analysis",
        scoringMethod: {
          version: this.version,
        },
      };
    }
  }

  /**
   * Build the prompt for LLM analysis
   * Extension point: Can enhance prompt in v2 for better results
   */
  private buildPrompt(resumeData: ParsedResumeData, job: Job): string {
    return `You are an expert recruiter. Compare this resume to the job posting and provide a detailed fit analysis.

**RESUME:**
${resumeData.resumeText}

**JOB POSTING:**
Title: ${job.title}
Type: ${job.type}
Category: ${job.category || "Not specified"}

Description:
${job.description}

Requirements:
${job.requirements?.join("\n") || "Not specified"}

Responsibilities:
${job.responsibilities?.join("\n") || "Not specified"}

**YOUR TASK:**
Analyze how well this candidate fits this job. Consider:
1. **Skills match**: Do they have the required technical/professional skills?
2. **Experience match**: Years of experience, relevant roles, industry background
3. **Education match**: Degree level and field of study (if required)
4. **Overall fit**: Holistic assessment of candidate potential

**SCORING GUIDE:**
- 85-100: Strong fit - excellent match, highly qualified, exceeds requirements
- 70-84: Good fit - meets core requirements, eligible for interview
- 50-69: Possible fit - has some relevant skills but notable gaps
- 0-49: Poor fit - significant mismatches, major skill/experience gaps

**IMPORTANT:**
- Be objective and fair
- Match skills semantically (e.g., "React" and "React.js" are the same)
- Consider transferable skills from related fields
- For career changers, look for evidence of learning/transition

**RETURN ONLY VALID JSON (no markdown, no explanations):**
{
  "overallScore": 85,
  "skillsMatched": ["JavaScript", "React", "Node.js"],
  "skillsMissing": ["AWS", "Docker"],
  "strengths": [
    "6 years experience exceeds 5 year requirement",
    "Strong background in similar roles",
    "Relevant education in Computer Science"
  ],
  "concerns": [
    "No cloud deployment experience mentioned",
    "Missing DevOps skills"
  ],
  "recommendation": "strong-fit",
  "reasoning": "Candidate has all core technical skills (JavaScript, React, Node.js) and 6 years of relevant experience, exceeding the 5-year requirement. Education background in CS is a strong match. Main gap is cloud/DevOps experience, but these can be learned on the job. Overall, this is a strong candidate who meets all essential requirements."
}`;
  }
}
