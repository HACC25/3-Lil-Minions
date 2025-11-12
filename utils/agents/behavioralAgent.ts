/* eslint-disable no-control-regex */
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

export interface BehavioralInsights {
  communicationStyle: {
    clarity: "excellent" | "good" | "fair" | "poor";
    professionalism: "excellent" | "good" | "fair" | "poor";
    enthusiasm: "high" | "moderate" | "low";
    articulation: string; // Description of how they express themselves
  };
  personality: {
    confidence: "high" | "moderate" | "low";
    adaptability: "high" | "moderate" | "low";
    creativity: "high" | "moderate" | "low";
    traits: string[]; // List of observed personality traits
  };
  engagement: {
    responsiveness: "excellent" | "good" | "fair" | "poor";
    thoughtfulness: "high" | "moderate" | "low";
    interestLevel:
      | "very interested"
      | "interested"
      | "neutral"
      | "disinterested";
    examples: string[]; // Specific examples of engagement
  };
  strengths: string[]; // Top 3-5 behavioral strengths
  developmentAreas: string[]; // Areas for improvement
  culturalFit: {
    teamOrientation: "high" | "moderate" | "low";
    initiative: "high" | "moderate" | "low";
    alignment: string; // How well they align with company culture
    fitScore: number; // 0-100
  };
  redFlags: string[]; // Any concerning behaviors or responses
  standoutMoments: string[]; // Memorable positive moments
  overallAssessment: string; // Brief overall behavioral assessment
  timestamp: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function convertToGroqMessages(
  messages: ChatMessage[],
): ChatCompletionMessageParam[] {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  })) as ChatCompletionMessageParam[];
}

export async function analyzeBehavioralInsights(
  transcript: string,
): Promise<BehavioralInsights> {
  const systemPrompt = `You are a STRICT expert behavioral psychologist and senior HR specialist with 20+ years of experience analyzing candidate interviews for high-performance teams.

Your analysis must be RIGOROUS, EVIDENCE-BASED, and UNBIASED. Do not inflate scores or overlook red flags. Be honest and critical where warranted.

CRITICAL INSTRUCTIONS:
1. Base ALL ratings on CONCRETE EVIDENCE from the transcript
2. Quote specific examples to support your assessments
3. Be CONSERVATIVE with "excellent" and "high" ratings - reserve these for truly exceptional performance
4. Actively look for red flags and inconsistencies
5. If evidence is limited, use "fair" or "moderate" ratings
6. DO NOT be overly positive - maintain professional skepticism

STRICT RATING CRITERIA:

**Communication Style:**
- clarity: 
  * "excellent" = Complex ideas explained simply, zero ambiguity, perfect structure
  * "good" = Generally clear with minor instances of confusion
  * "fair" = Some unclear responses, moderate structure issues
  * "poor" = Frequently confusing, disorganized, hard to follow
  
- professionalism:
  * "excellent" = Impeccable tone, appropriate language, highly professional demeanor
  * "good" = Professional with minor lapses
  * "fair" = Occasional unprofessional moments or inappropriate language
  * "poor" = Unprofessional behavior, inappropriate language, poor demeanor
  
- enthusiasm:
  * "high" = Consistent energy, passionate, genuinely excited about role/company
  * "moderate" = Some interest shown but not exceptional
  * "low" = Minimal energy, going through motions, appears disengaged

**Personality Traits:**
- confidence:
  * "high" = Assertive without arrogance, owns accomplishments, decisive
  * "moderate" = Some confidence but with hesitation or self-doubt
  * "low" = Frequent hedging, uncertain, lacks conviction
  
- adaptability:
  * "high" = Handles curveballs well, flexible thinking, embraces change
  * "moderate" = Some flexibility but prefers structure
  * "low" = Rigid thinking, struggles with unexpected questions
  
- creativity:
  * "high" = Original solutions, innovative thinking, unique perspectives
  * "moderate" = Some creative moments but mostly conventional
  * "low" = Purely conventional thinking, no original ideas

**Engagement:**
- responsiveness:
  * "excellent" = Directly answers questions, stays on topic, no rambling
  * "good" = Generally responsive with minor tangents
  * "fair" = Sometimes misses the point or goes off-topic
  * "poor" = Frequently evasive, doesn't answer questions, rambles
  
- thoughtfulness:
  * "high" = Deep consideration, nuanced answers, asks clarifying questions
  * "moderate" = Surface-level thinking, adequate depth
  * "low" = Shallow responses, no critical thinking evident

**Cultural Fit Score (0-100):**
- 90-100: Exceptional fit, rare find, highly recommend
- 75-89: Strong fit, good alignment
- 60-74: Moderate fit, some concerns
- 40-59: Poor fit, significant misalignment
- 0-39: Very poor fit, do not recommend

**RED FLAGS TO ACTIVELY LOOK FOR:**
- Negativity about past employers or colleagues
- Evasiveness or dishonesty
- Lack of preparation or knowledge about the role
- Unprofessional language or behavior
- Inconsistent stories or contradictions
- Excessive focus on compensation/benefits over the work
- Poor listening skills
- Blaming others for failures
- Lack of self-awareness
- Entitlement or arrogance
- No questions about the role or company

MANDATORY JSON FORMAT - Return ONLY this structure, NO other text:
{
  "communicationStyle": {
    "clarity": "excellent" | "good" | "fair" | "poor",
    "professionalism": "excellent" | "good" | "fair" | "poor",
    "enthusiasm": "high" | "moderate" | "low",
    "articulation": "2-3 sentences with specific examples from transcript"
  },
  "personality": {
    "confidence": "high" | "moderate" | "low",
    "adaptability": "high" | "moderate" | "low",
    "creativity": "high" | "moderate" | "low",
    "traits": ["trait1", "trait2", "trait3"] (minimum 3, maximum 6)
  },
  "engagement": {
    "responsiveness": "excellent" | "good" | "fair" | "poor",
    "thoughtfulness": "high" | "moderate" | "low",
    "interestLevel": "very interested" | "interested" | "neutral" | "disinterested",
    "examples": ["Quote specific moments showing engagement/disengagement"]
  },
  "strengths": ["3-5 specific behavioral strengths with context"],
  "developmentAreas": ["2-4 honest areas for improvement - be candid"],
  "culturalFit": {
    "teamOrientation": "high" | "moderate" | "low",
    "initiative": "high" | "moderate" | "low",
    "alignment": "2-3 sentences on cultural fit with evidence",
    "fitScore": 0-100 (be realistic, not inflated)
  },
  "redFlags": ["List ALL concerns - empty array only if genuinely none"],
  "standoutMoments": ["Only truly exceptional moments - empty if none"],
  "overallAssessment": "3-4 sentences: honest, balanced, actionable summary",
  "timestamp": "ISO 8601 timestamp"
}`;

  const userPrompt = `Analyze this interview transcript with STRICT, EVIDENCE-BASED evaluation:

${transcript}

REQUIREMENTS:
1. Be CRITICAL and HONEST - do not inflate ratings
2. Every rating must have supporting evidence from the transcript
3. Actively identify red flags and areas for improvement
4. Use "excellent"/"high" ratings ONLY when truly deserved
5. Be specific in your examples and assessments
6. Provide actionable, candid feedback

Return ONLY the JSON object, no other text.`;

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: userPrompt,
    },
  ];

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: convertToGroqMessages(messages),
      temperature: 0.3, // Lower temperature for more consistent, strict evaluation
      max_tokens: 3500,
    });

    const content = response.choices[0].message.content || "{}";
    console.log("Raw behavioral analysis response:", content.substring(0, 200));

    // Clean the response more aggressively
    let cleanedContent = content.trim();

    // Remove markdown code blocks
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "");
    } else if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "");
    }

    // Remove control characters and fix common issues
    cleanedContent = cleanedContent
      .replace(/[\x00-\x1F\x7F]/g, "")
      .replace(/"/g, '"')
      .replace(/"/g, '"')
      .replace(/'/g, "'")
      .replace(/,(\s*[}\]])/g, "$1"); // Remove trailing commas

    let insights: BehavioralInsights;

    try {
      insights = JSON.parse(cleanedContent) as BehavioralInsights;
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError);
      console.error("Cleaned content:", cleanedContent);
      throw new Error(
        `Failed to parse AI response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
      );
    }

    // Add timestamp if not present
    if (!insights.timestamp) {
      insights.timestamp = new Date().toISOString();
    }

    // STRICT VALIDATION - Ensure quality of analysis
    try {
      validateBehavioralInsights(insights);
    } catch (validationError) {
      console.warn("Validation warning:", validationError);
      // Continue anyway - don't fail on validation
    }

    return insights;
  } catch (error) {
    console.error("Error analyzing behavioral insights:", error);

    // Return fallback structure
    return {
      communicationStyle: {
        clarity: "fair",
        professionalism: "fair",
        enthusiasm: "moderate",
        articulation: "Unable to assess - analysis failed",
      },
      personality: {
        confidence: "moderate",
        adaptability: "moderate",
        creativity: "moderate",
        traits: ["Unable to determine"],
      },
      engagement: {
        responsiveness: "fair",
        thoughtfulness: "moderate",
        interestLevel: "neutral",
        examples: ["Analysis incomplete"],
      },
      strengths: ["Manual review required"],
      developmentAreas: ["Manual review required"],
      culturalFit: {
        teamOrientation: "moderate",
        initiative: "moderate",
        alignment: "Unable to assess - analysis failed",
        fitScore: 50,
      },
      redFlags: [],
      standoutMoments: [],
      overallAssessment:
        "Unable to complete automated behavioral analysis. Manual review of transcript recommended.",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Validates behavioral insights to ensure quality and completeness
 * Logs warnings instead of throwing errors to allow partial results
 */
function validateBehavioralInsights(insights: BehavioralInsights): void {
  const warnings: string[] = [];

  // Validate communication style
  if (
    !insights.communicationStyle?.articulation ||
    insights.communicationStyle.articulation.length < 20
  ) {
    warnings.push(
      "Articulation description too brief - needs specific examples",
    );
  }

  // Validate personality traits
  if (!insights.personality?.traits || insights.personality.traits.length < 3) {
    warnings.push("Should identify at least 3 personality traits");
  }

  // Validate engagement examples
  if (
    !insights.engagement?.examples ||
    insights.engagement.examples.length === 0
  ) {
    warnings.push("Should provide engagement examples");
  }

  // Validate strengths
  if (!insights.strengths || insights.strengths.length < 2) {
    warnings.push("Should identify at least 2 strengths");
  }

  // Validate development areas - CRITICAL: Must have at least one
  if (!insights.developmentAreas || insights.developmentAreas.length < 1) {
    warnings.push(
      "Should identify at least 1 development area - no candidate is perfect",
    );
  }

  // Validate cultural fit
  if (
    !insights.culturalFit?.alignment ||
    insights.culturalFit.alignment.length < 30
  ) {
    warnings.push("Cultural fit alignment needs detailed explanation");
  }

  if (
    insights.culturalFit.fitScore < 0 ||
    insights.culturalFit.fitScore > 100
  ) {
    warnings.push("Fit score must be between 0 and 100");
  }

  // Validate overall assessment
  if (!insights.overallAssessment || insights.overallAssessment.length < 50) {
    warnings.push("Overall assessment too brief - needs comprehensive summary");
  }

  // Strict validation: Ensure realistic scoring
  // If fit score is over 85, should have at least one standout moment
  if (
    insights.culturalFit.fitScore > 85 &&
    (!insights.standoutMoments || insights.standoutMoments.length === 0)
  ) {
    warnings.push(
      "High fit scores (>85) should have at least one standout moment as evidence",
    );
  }

  // If fit score is under 60, should have red flags or development areas
  if (
    insights.culturalFit.fitScore < 60 &&
    (!insights.redFlags || insights.redFlags.length === 0) &&
    insights.developmentAreas.length < 2
  ) {
    warnings.push(
      "Low fit scores (<60) should have red flags or multiple development areas",
    );
  }

  // Log all warnings
  if (warnings.length > 0) {
    console.warn("Behavioral analysis validation warnings:", warnings);
  }
}
