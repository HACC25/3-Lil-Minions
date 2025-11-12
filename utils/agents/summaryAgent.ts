import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

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

export async function generateTranscriptSummary(
  transcript: string,
): Promise<string> {
  const systemPrompt = `You are an expert interview analyst who creates comprehensive, well-structured summaries of interview conversations.

Your task is to analyze the interview transcript and create a detailed summary in Markdown format based on what was ACTUALLY discussed in the interview.

SUMMARY STRUCTURE (use Markdown formatting - adapt based on actual content):
1. **Overview** - Brief 2-3 sentence overview of the conversation
2. **Key Discussion Points** - Main topics that were actually covered (use bullet points)
3. **Candidate Background** - Information about the candidate's experience and skills mentioned
4. **Role-Specific Discussion** - Details about the specific role, responsibilities, or skills discussed (use a section title that matches the actual discussion topic - e.g., "Technical Skills Discussion", "Leadership Experience", "Project Management", etc. - NOT a generic placeholder)
5. **Notable Highlights** - Important moments, standout responses, or unique insights
6. **Areas of Concern** (if any) - Any red flags or areas needing clarification (omit if none)
7. **Next Steps** - Recommended actions based on the conversation

CRITICAL INSTRUCTIONS:
- DO NOT force content into sections if that topic wasn't discussed
- DO NOT use generic placeholder section titles like "Event Planning Discussion" unless the interview was actually about event planning
- Adapt section 4's title to match what was ACTUALLY discussed (e.g., "Software Development Experience", "Sales Strategy Discussion", "Customer Service Approach", etc.)
- If a topic wasn't covered, skip that section or briefly note it wasn't discussed
- Be ACCURATE and SPECIFIC to the actual interview content

FORMATTING GUIDELINES:
- Use proper Markdown headers (##, ###)
- Use bullet points for lists
- Use **bold** for emphasis on key points
- Keep it professional and objective
- Include specific quotes when relevant (use > for blockquotes)
- Aim for 300-500 words total
- Make it scannable and easy to read

CRITICAL: Return ONLY the Markdown-formatted summary. No JSON, no code blocks wrapping it, just the raw Markdown text.`;

  const userPrompt = `Create a comprehensive summary of this interview transcript:

${transcript}

Remember to format the summary in clean Markdown and cover all key aspects of the conversation.`;

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
      temperature: 0.5,
      max_tokens: 2000,
    });

    let summary = response.choices[0].message.content || "";
    console.log("Raw summary response:", summary.substring(0, 200));

    // Remove markdown code blocks if present
    if (summary.startsWith("```markdown")) {
      summary = summary.replace(/^```markdown\s*/, "").replace(/\s*```$/, "");
    } else if (summary.startsWith("```md")) {
      summary = summary.replace(/^```md\s*/, "").replace(/\s*```$/, "");
    } else if (summary.startsWith("```")) {
      summary = summary.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const cleanedSummary = summary.trim();

    if (!cleanedSummary || cleanedSummary.length < 50) {
      console.warn("Summary too short, returning fallback");
      throw new Error("Summary generation produced insufficient content");
    }

    return cleanedSummary;
  } catch (error) {
    console.error("Error generating summary:", error);

    // Return a fallback summary
    return `## Interview Summary

**Overview**
Unable to generate automated summary. Please review the full transcript for details.

**Recommendation**
Manual review required to assess candidate qualifications and fit.`;
  }
}
