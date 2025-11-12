/* eslint-disable no-control-regex */
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

export interface PrequalificationRequirement {
  requirement: string;
  description: string;
  met: boolean;
  evidence: string;
  confidence: "high" | "medium" | "low";
}

export interface PrequalificationAnalysis {
  overallQualified: boolean;
  qualificationScore: number; // 0-100
  requirementsMet: number;
  totalRequirements: number;
  requirements: PrequalificationRequirement[];
  recommendations: string[];
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

export async function analyzePrequalifications(
  transcript: string,
): Promise<PrequalificationAnalysis> {
  const systemPrompt = `You are an expert HR analyst specializing in candidate pre-qualification assessment.

Your task is to analyze interview transcripts and identify ONLY the requirements that were EXPLICITLY discussed or asked about during the interview.

CRITICAL INSTRUCTIONS:
1. ONLY identify requirements that are CLEARLY mentioned in the transcript by the interviewer
2. DO NOT assume or add generic requirements (like "communication skills" or "team collaboration") unless they were specifically asked about
3. If the interviewer asks "Do you have experience with X?", that's a requirement
4. If the interviewer discusses "We're looking for someone who can Y", that's a requirement
5. Extract requirements from questions like "Can you tell me about your experience with Z?"
6. If NO specific requirements are mentioned in the transcript, return an EMPTY requirements array

ANALYSIS PROCESS:
1. Read through the entire transcript carefully
2. Identify each requirement the interviewer explicitly asks about or mentions
3. For each identified requirement:
   - Name it clearly based on what was asked
   - Determine if the candidate met it based on their response
   - Provide specific evidence (quotes) from the candidate's answer
   - Assign confidence: "high" (clear evidence), "medium" (some evidence), "low" (weak/no evidence)
4. Calculate the qualification score as: (requirements met / total requirements) * 100
5. If requirements met > 50%, set overallQualified to true
6. Provide recommendations based on what was discussed

EXAMPLES:

Example 1 - Requirements mentioned:
Interviewer: "Do you have experience with Python?"
Candidate: "Yes, I've been using Python for 3 years..."
→ Requirement: "Python Experience" - met: true

Example 2 - No specific requirements:
Interviewer: "Tell me about yourself"
Candidate: "I'm a developer..."
→ requirements: [] (empty array - no specific requirements asked)

Example 3 - Multiple requirements:
Interviewer: "We need someone with React and TypeScript. Do you have those skills?"
→ Requirement 1: "React Skills"
→ Requirement 2: "TypeScript Skills"

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no text outside the JSON object.

Return JSON matching this exact structure:
{
  "overallQualified": true,
  "qualificationScore": 75,
  "requirementsMet": 3,
  "totalRequirements": 4,
  "requirements": [
    {
      "requirement": "Name of requirement as asked by interviewer",
      "description": "Brief description of what was assessed",
      "met": true,
      "evidence": "Specific quote or paraphrase from candidate's response",
      "confidence": "high"
    }
  ],
  "recommendations": [
    "Specific recommendation based on analysis"
  ],
  "timestamp": "ISO 8601 timestamp"
}

If NO requirements were discussed, return:
{
  "overallQualified": true,
  "qualificationScore": 100,
  "requirementsMet": 0,
  "totalRequirements": 0,
  "requirements": [],
  "recommendations": ["No specific pre-qualification requirements were discussed in this interview."],
  "timestamp": "ISO 8601 timestamp"
}`;

  const userPrompt = `Analyze this interview transcript and identify ONLY the specific requirements that were explicitly mentioned or asked about by the interviewer:

${transcript}

IMPORTANT:
- Only extract requirements that the interviewer specifically asked about or mentioned
- Do NOT add generic requirements that weren't discussed
- If no specific requirements were mentioned, return an empty requirements array
- Provide evidence from the candidate's responses for each requirement identified

Return ONLY the JSON object.`;

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
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content || "{}";
    console.log("Raw prequalification response:", content.substring(0, 200));

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

    let analysis: PrequalificationAnalysis;

    try {
      analysis = JSON.parse(cleanedContent) as PrequalificationAnalysis;
    } catch (parseError) {
      console.error("Prequalification JSON parsing failed:", parseError);
      console.error("Cleaned content:", cleanedContent);
      throw new Error(
        `Failed to parse prequalification response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
      );
    }

    // Add timestamp if not present
    if (!analysis.timestamp) {
      analysis.timestamp = new Date().toISOString();
    }

    // Validate required fields
    if (!analysis.requirements || analysis.requirements.length === 0) {
      console.warn("No requirements in prequalification analysis");
    }

    return analysis;
  } catch (error) {
    console.error("Error analyzing prequalifications:", error);

    // Return fallback structure
    return {
      overallQualified: false,
      qualificationScore: 0,
      requirementsMet: 0,
      totalRequirements: 10,
      requirements: [],
      recommendations: [
        "Unable to complete analysis. Please review transcript manually.",
      ],
      timestamp: new Date().toISOString(),
    };
  }
}
