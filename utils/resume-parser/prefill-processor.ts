/**
 * AI-Powered Resume Prefill Processor
 * Uses Groq to intelligently extract and map resume data to application form fields
 */

import Groq from "groq-sdk";
import { extractResumeText } from "./pdf-extractor";
import type {
  ExtractedResumeData,
  PrefilledApplicationData,
  PrefillResult,
  ExtractedResumeResult,
} from "./types";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const PREFILL_SYSTEM_PROMPT = `You are an expert resume parser and data extraction assistant. Your job is to analyze resume text and extract structured information to prefill a job application form.

Extract the following information from the resume:
1. Personal Information: name, email, phone, address, city, state, zip code, country
2. Work History: employer name, job title, dates, location, duties/responsibilities, hours per week
3. Education: institution name, degree, major, graduation date, location
4. Skills: technical and soft skills with experience levels
5. Languages: spoken/written languages with proficiency
6. Certifications: professional certifications and licenses

Important guidelines:
- Extract dates in YYYY-MM-DD format
- Infer missing information reasonably (e.g., hoursPerWeek = 40 for full-time)
- For work history duties, extract comprehensive bullet points
- Estimate skill levels based on context (Beginner/Intermediate/Expert)
- If information is not available, use empty strings or reasonable defaults
- Return ONLY valid JSON format matching the schema (no markdown code blocks)

Be thorough and accurate. This data will be used to help applicants complete government job applications.`;

/**
 * Use Groq AI to intelligently parse resume text and extract structured data
 */
export async function parseResumeWithAI(
  resumeText: string,
): Promise<ExtractedResumeResult> {
  try {
    const userPrompt = `Please analyze the following resume and extract structured information in JSON format:

Resume Text:
${resumeText}

Return a JSON object with the following structure:
{
  "personalInfo": {
    "firstName": "",
    "lastName": "",
    "email": "",
    "phone": "",
    "address": "",
    "city": "",
    "state": "",
    "zipCode": "",
    "country": ""
  },
  "workHistory": [
    {
      "employerName": "",
      "jobTitle": "",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD or empty if current",
      "stillEmployed": boolean,
      "location": "",
      "duties": "Comprehensive description",
      "hoursPerWeek": 40
    }
  ],
  "education": [
    {
      "institutionName": "",
      "degree": "",
      "major": "",
      "graduationDate": "YYYY-MM-DD",
      "graduated": boolean,
      "city": "",
      "state": ""
    }
  ],
  "skills": [
    {
      "name": "",
      "experience": "years as number",
      "experienceMonths": "months as number",
      "level": "Beginner|Intermediate|Expert"
    }
  ],
  "languages": [
    {
      "language": "",
      "speak": boolean,
      "read": boolean,
      "write": boolean
    }
  ],
  "certifications": [
    {
      "name": ""
    }
  ],
  "references": [
    {
      "type": "Professional|Personal",
      "firstName": "",
      "lastName": "",
      "title": "",
      "phone": "",
      "email": ""
    }
  ]
}

Extract as much information as possible. For missing data, use empty strings or reasonable defaults.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: PREFILL_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.2,
    });

    const content = completion.choices[0]?.message?.content || "{}";

    // Clean the response to extract JSON (remove markdown code blocks if present)
    const cleaned = content
      .trim()
      .replace(/^```json\s*/gi, "")
      .replace(/^```\s*/g, "")
      .replace(/\s*```$/g, "");

    const parsedData = JSON.parse(cleaned) as ExtractedResumeData;

    // Calculate confidence based on data completeness
    const confidence = calculateConfidence(parsedData);

    return {
      success: true,
      data: parsedData,
      confidence,
    };
  } catch (error) {
    console.error("Error parsing resume with AI:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse resume",
    };
  }
}

/**
 * Calculate confidence score based on data completeness
 */
function calculateConfidence(data: ExtractedResumeData): number {
  let score = 0;
  let maxScore = 0;

  // Personal info (30 points)
  maxScore += 30;
  if (data.personalInfo.firstName) score += 5;
  if (data.personalInfo.lastName) score += 5;
  if (data.personalInfo.email) score += 10;
  if (data.personalInfo.phone) score += 5;
  if (data.personalInfo.city) score += 3;
  if (data.personalInfo.state) score += 2;

  // Work history (40 points)
  maxScore += 40;
  if (data.workHistory && data.workHistory.length > 0) {
    score += 20;
    if (data.workHistory.some((w) => w.duties)) score += 20;
  }

  // Education (20 points)
  maxScore += 20;
  if (data.education && data.education.length > 0) {
    score += 10;
    if (data.education.some((e) => e.major)) score += 10;
  }

  // Skills (10 points)
  maxScore += 10;
  if (data.skills && data.skills.length > 0) score += 10;

  return Math.round((score / maxScore) * 100);
}

/**
 * Transform extracted resume data into application form format
 */
export function transformToApplicationData(
  extracted: ExtractedResumeData,
): PrefilledApplicationData {
  return {
    // Personal Information
    firstName: extracted.personalInfo.firstName || "",
    lastName: extracted.personalInfo.lastName || "",
    email: extracted.personalInfo.email || "",
    phone: extracted.personalInfo.phone || "",
    address: extracted.personalInfo.address || "",
    city: extracted.personalInfo.city || "",
    state: extracted.personalInfo.state || "",
    zipCode: extracted.personalInfo.zipCode || "",
    country: extracted.personalInfo.country || "US",
    dateOfBirth: extracted.personalInfo.dateOfBirth || "",
    veteranStatus: "", // Cannot be inferred, must be manually selected

    // Work History
    workHistory: extracted.workHistory.map((work) => ({
      employerName: work.employerName,
      employerType: "", // Cannot be inferred
      startDate: work.startDate,
      endDate: work.endDate || "",
      stillEmployed: work.stillEmployed,
      hoursPerWeek: work.hoursPerWeek || 40,
      jobTitle: work.jobTitle,
      salary: "",
      address: work.location?.split(",")[0]?.trim() || "",
      city: extractCity(work.location || ""),
      state: extractState(work.location || ""),
      zipCode: "",
      country: "US",
      supervisorName: "",
      supervisorTitle: "",
      mayContactEmployer: true,
      reasonForLeaving: "",
      duties: work.duties,
    })),

    // Education
    education: extracted.education.map((edu) => ({
      institutionName: edu.institutionName,
      major: edu.major || "",
      degree: edu.degree,
      city: edu.city || "",
      state: edu.state || "",
      credits: "",
      graduated: edu.graduated,
      graduationDate: edu.graduationDate || "",
    })),

    // Certifications
    certifications: extracted.certifications,

    // Skills
    skills: extracted.skills.map((skill) => ({
      name: skill.name,
      experience: skill.experience || "0",
      experienceMonths: skill.experienceMonths || "0",
      level: skill.level || "Intermediate",
    })),

    // Languages
    languages: extracted.languages,

    // References
    references: extracted.references.map((ref) => ({
      type: ref.type,
      firstName: ref.firstName,
      lastName: ref.lastName,
      title: ref.title || "",
      phone: ref.phone || "",
      email: ref.email || "",
      address: "",
      addressLine2: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US",
    })),
  };
}

/**
 * Helper function to extract city from location string
 */
function extractCity(location: string): string {
  const parts = location.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return "";
}

/**
 * Helper function to extract state from location string
 */
function extractState(location: string): string {
  const parts = location.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1];
    // Extract state abbreviation (2 letters before zip code)
    const stateMatch = lastPart.match(/([A-Z]{2})/);
    return stateMatch ? stateMatch[1] : "";
  }
  return "";
}

/**
 * Main function to process resume and generate prefilled application data
 */
export async function processResumeForPrefill(
  file: File,
): Promise<PrefillResult> {
  try {
    console.log("🚀 Starting resume prefill process...");

    // Step 1: Extract text from PDF using Adobe extractor
    console.log("📄 Extracting text from resume...");
    const extractResult = await extractResumeText(file);

    if (!extractResult.success || !extractResult.data) {
      throw new Error(extractResult.error || "Failed to extract resume text");
    }

    const resumeText = extractResult.data.rawText;

    if (!resumeText || resumeText.trim().length === 0) {
      throw new Error("No text could be extracted from the document");
    }

    console.log(`✅ Extracted ${resumeText.length} characters from resume`);

    // Step 2: Parse with AI
    console.log("🤖 Parsing resume with AI...");
    const aiResult = await parseResumeWithAI(resumeText);

    if (!aiResult.success || !aiResult.data) {
      throw new Error(aiResult.error || "AI parsing failed");
    }

    console.log(
      `✅ Resume parsed successfully with ${aiResult.confidence}% confidence`,
    );

    // Step 3: Transform to application data format
    const prefilledData = transformToApplicationData(aiResult.data);

    return {
      success: true,
      data: prefilledData,
      confidence: aiResult.confidence,
    };
  } catch (error) {
    console.error("❌ Error processing resume for prefill:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to process resume for prefill",
    };
  }
}
