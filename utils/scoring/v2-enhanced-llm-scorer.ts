import Groq from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import type { Job } from "@/types/job";
import type {
  ParsedResumeData,
  FitScoreBreakdown,
  ApplicationFormData,
} from "@/types/application";
import type { ScoringEngine } from "./types";
import { formatApplicationDataForScoring } from "../format-application-data";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export class EnhancedLLMScorer implements ScoringEngine {
  version = "v2-enhanced-llm" as const;

  async calculateFit(
    resumeData: ParsedResumeData,
    job: Job,
    applicationData?: ApplicationFormData,
  ): Promise<FitScoreBreakdown> {
    const prompt = this.buildPrompt(resumeData, job, applicationData);

    try {
      const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content:
              "You are an expert recruiter analyzing candidate fit for job positions. Prioritize verified application data over resume claims. Return only valid JSON responses.",
          },
          {
            role: "user",
            content: prompt,
          },
        ] as ChatCompletionMessageParam[],
        temperature: 0.2,
      });

      const content = response.choices?.[0]?.message?.content || "{}";

      const cleaned = content
        .trim()
        .replace(/^```json\s*/gi, "")
        .replace(/^```\s*/g, "")
        .replace(/\s*```$/g, "");

      const analysis = JSON.parse(cleaned);

      return {
        overallScore: analysis.overallScore || 0,
        recommendation: analysis.recommendation || "poor-fit",
        skillsMatched: analysis.skillsMatched || [],
        skillsMissing: analysis.skillsMissing || [],
        strengths: analysis.strengths || [],
        concerns: analysis.concerns || [],
        reasoning: analysis.reasoning || "",

        componentScores: {
          relevanceScore: analysis.componentScores?.relevanceScore || 0,
          qualificationScore: analysis.componentScores?.qualificationScore || 0,
        },

        scoringMethod: {
          version: this.version,
          aiWeight: 1.0,
          deterministicWeight: 0.0,
        },
      };
    } catch (error) {
      console.error("[EnhancedLLMScorer] Analysis failed:", error);

      return {
        overallScore: 0,
        recommendation: "poor-fit",
        skillsMatched: [],
        skillsMissing: [],
        strengths: [],
        concerns: ["Failed to analyze application - system error"],
        reasoning: "Error during analysis",
        scoringMethod: {
          version: this.version,
        },
      };
    }
  }

  private buildPrompt(
    resumeData: ParsedResumeData,
    job: Job,
    applicationData?: ApplicationFormData,
  ): string {
    const formattedAppData = applicationData
      ? formatApplicationDataForScoring(applicationData)
      : null;

    return `You are an expert recruiter. Analyze this candidate's fit for the job posting.

**CANDIDATE INFORMATION:**

${
  formattedAppData
    ? `Structured Application Data:
${formattedAppData}

Resume Document:
${resumeData.resumeText}
`
    : `Resume Document:
${resumeData.resumeText}

(No structured application data provided)
`
}

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
Analyze this candidate's fit using a THREE-STEP process. Apply the same evaluation standards regardless of whether information comes from structured application data or resume.

**STEP 1: IDENTIFY TRANSFERABLE & RELEVANT QUALIFICATIONS**

Analyze what the candidate CAN bring to this role:

1. **Direct Skills Match (for skillsMatched field)**:
   - ONLY include skills/tools that are explicitly mentioned in the job posting (requirements, description, or responsibilities)
   - Must be exact matches or close technical variants (e.g., "React" = "React.js", "JavaScript" = "JS")
   - Examples of what to match: "ICD-10 coding", "Epic EMR", "Medical terminology", "Python", "AWS"
   - DO NOT include generic soft skills here (communication, organization, problem-solving, etc.)
   - If no direct technical/domain skills match, skillsMatched should be empty []

2. **Transferable Skills (for strengths field)**:
   - Soft skills and general competencies (communication, organization, problem-solving, attention to detail, etc.)
   - These belong in the strengths array, NOT in skillsMatched

3. **Adjacent Experience**: Any work that touches similar problems, even from different industries?

4. **Education/Certifications**: Relevant degrees or credentials that apply?

**STEP 2: ASSESS CAREER FIT & DOMAIN RELEVANCE**

Evaluate career trajectory and domain match:
1. **Domain Match**: Same industry/field vs. different domain
2. **Role Similarity**: Similar responsibilities vs. completely different work
3. **Career Logic**: Natural progression vs. career change

Calculate relevanceScore (0-100):
- 90-100: Perfect domain match, natural career progression
- 70-89: Same industry, some relevant background
- 50-69: Adjacent field or transferable skills present
- 30-49: Different domain, but some overlap
- 10-29: Minimal overlap, mostly irrelevant background

**STEP 3: CALCULATE FINAL SCORE**

Use WEIGHTED FORMULA to ensure non-zero scores:
- Base score from transferable/relevant qualifications (30% weight)
- Domain/career relevance bonus (70% weight)

Formula: overallScore = (qualificationScore × 0.3) + (relevanceScore × 0.7)

This ensures:
- Candidates with NO relevant background still get 10-25 points for transferable skills
- Candidates with perfect domain fit get 85-100
- Most candidates fall in 20-80 range with meaningful differentiation

**SCORING GUIDE:**
- 85-100: Perfect match - same domain + meets/exceeds requirements
- 70-84: Good match - relevant background + core qualifications
- 50-69: Moderate match - some relevant experience OR strong transferable skills
- 30-49: Weak match - different domain but transferable skills present
- 10-29: Poor match - minimal relevance, mostly different background

**EXAMPLES:**
- Medical Records Clerk → Medical Abstractor = 75-85 (same domain, natural fit)
- Healthcare Admin → Medical Abstractor = 55-65 (adjacent, some overlap)
- Software Engineer → Medical Abstractor = 15-25 (different domain, but attention to detail/data skills transferable)
- Teacher → Medical Abstractor = 20-30 (different, but organization/documentation skills)
- Junior Developer → Senior Developer = 80-90 (same domain, progression)

**IMPORTANT RULES:**
- Focus on what they CAN do, not just what they lack
- Domain mismatch lowers score significantly, but doesn't eliminate it
- Give credit for applicable transferable skills in the strengths field
- skillsMatched must ONLY contain skills explicitly mentioned in the job posting
- It is acceptable for skillsMatched to be empty [] if no job-specific skills match
- Generic soft skills (attention to detail, communication, etc.) belong in strengths, NOT skillsMatched
- Close technical variants are acceptable (e.g., "React" matches "React.js")

**REASONING FIELD REQUIREMENTS:**
The reasoning should provide a detailed, recruiter-perspective explanation of the candidate's fit. Include:
- Why the score makes sense given their background
- What makes them a strong/weak fit for this specific role
- Assessment of domain knowledge and career trajectory
- Training/onboarding implications (can they hit the ground running, or need extensive training?)
- Risk assessment (low-risk hire vs. high-risk career change)
- DO NOT include weighted formula calculations or mathematical explanations
- Write 3-5 sentences minimum with specific, thoughtful analysis

**RETURN ONLY VALID JSON (no markdown, no explanations):**

EXAMPLE - STRONG DOMAIN MATCH:
{
  "componentScores": {
    "relevanceScore": 80,
    "qualificationScore": 85
  },
  "overallScore": 73,
  "skillsMatched": ["[skill from job posting]", "[another job-specific skill]"],
  "skillsMissing": ["[optional skill they lack]"],
  "strengths": [
    "Direct experience in same/similar role",
    "Natural career progression within domain",
    "Demonstrated proficiency in core job requirements"
  ],
  "concerns": [
    "Missing specific tool/certification (if applicable)"
  ],
  "recommendation": "good-fit",
  "reasoning": "Explain why their background directly aligns with job requirements. Discuss their domain knowledge, relevant experience, and what makes this a natural fit. Note that any gaps are minor and can be addressed through training. Assess onboarding timeline and risk level."
}

EXAMPLE - CAREER CHANGE / DOMAIN MISMATCH:
{
  "componentScores": {
    "relevanceScore": 15,
    "qualificationScore": 35
  },
  "overallScore": 21,
  "skillsMatched": [],
  "skillsMissing": ["[domain-specific requirement]", "[technical skill from job]"],
  "strengths": [
    "Transferable soft skills (attention to detail, communication, etc.)",
    "General competencies applicable across industries"
  ],
  "concerns": [
    "No experience in target industry/domain",
    "Complete career change from unrelated field",
    "Missing fundamental domain knowledge required for role"
  ],
  "recommendation": "poor-fit",
  "reasoning": "Explain why this represents a significant career transition. Discuss the domain knowledge gap and what specialized knowledge the job requires that they lack. Note that while they have transferable skills, they would need extensive training in industry fundamentals before being productive. Assess the learning curve and resource investment required."
}`;
  }
}
