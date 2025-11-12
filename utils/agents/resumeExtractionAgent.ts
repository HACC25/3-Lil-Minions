import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Import types from Groq SDK
import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

// Define our simplified message type for internal use
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Helper function to convert our message format to Groq's expected format
function convertToGroqMessages(
  messages: ChatMessage[],
): ChatCompletionMessageParam[] {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  })) as ChatCompletionMessageParam[];
}

export async function extractResumeFieldData(prompt: string) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are an expert document analyzer specializing in extracting data from resumes and CVs. Your task is to analyze resumes and extract structured information with high accuracy and attention to detail.

Your task is to extract structured job-related information from resumes, including work experience, education, skills, certifications, and other relevant details.

EXTRACTION GUIDELINES:
- Extract only factual information present in the resume, DO NOT infer or fabricate details
- Focus on key sections: work experience, education, skills, certifications, and any additional relevant sections
- Use clear, structured field names for each section
- For resume data, be professional but don't fabricate specific details not in the document
- Focus on accuracy over completeness

OUTPUT REQUIREMENTS:
- Return ONLY a valid JSON object
- MAP the extracted data to the required formatting structure
- No markdown formatting, explanations, or additional text
- Ensure all required fields are present with appropriate values
- Use empty strings or empty arrays for missing information rather than null
- Ensure the output is structured with clear field names and types
- Include fields for work experience, education, skills, certifications, and any other relevant sections`,
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  console.log("Starting resume extraction...");

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: convertToGroqMessages(messages),
    temperature: 0.1, // Very low temperature for consistent, factual extraction
  });

  console.log("Response: ", response);
  console.log("Raw response content: ", response.choices[0].message.content);
  console.log("Resume extraction complete");

  return response.choices[0].message.content;
}
