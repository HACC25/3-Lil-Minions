/* eslint-disable @typescript-eslint/no-unused-vars */
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

export interface ChatMessage {
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

export interface JobPostingInput {
  jobTitle: string;
  jobDescription?: string;
  requirements?: string;
  responsibilities?: string;
  companyDescription?: string;
  companyIndustry?: string;
  salary?: string;
  location?: string;
  employmentType?: string;
  companyName: string;
  department?: string;
  minimumQualifications?: {
    education?: string;
    experience?: string;
    specialRequirements?: string[];
  };
  duties?: string[];
}

export interface InterviewBotConfiguration {
  botName: string;
  description: string;
  interviewType: string;
  companyDescription: string;
  companyIndustry: string;
  jobRoleDescription: string;
  salary: string;
  botPersonality: string;
  selectedAvatar: string;
  selectedEmotion: string;
  questions: {
    preQualification: Array<{ id: string; question: string; type: string }>;
    technical: Array<{ id: string; question: string; type: string }>;
    general: Array<{ id: string; question: string; type: string }>;
    behavioral: Array<{ id: string; question: string; type: string }>;
  };
  scoringCriteria: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}

/**
 * Generate unique ID for questions to prevent duplicate key issues
 */
function generateQuestionId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique ID for scoring criteria
 */
function generateCriteriaId(): string {
  return `sc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract and generate interview bot configuration from job posting data
 */
export async function generateInterviewBotFromJobPosting(
  jobData: JobPostingInput,
): Promise<InterviewBotConfiguration> {
  console.log("🤖 Generating interview bot configuration from job posting...");

  // Build a comprehensive description of the job
  const jobContext = buildJobContext(jobData);

  const prompt = `You are an expert at creating professional, government-appropriate interview bot configurations for State of Hawaii positions.

IMPORTANT: This is for the State of Hawaii Department of Human Resources. All configurations should reflect professional government standards.

Job Posting Information:
${jobContext}

Your task is to create a comprehensive interview bot configuration that:
1. Reflects the professional standards of Hawaii state government
2. Creates relevant questions based on the actual job requirements
3. Ensures appropriate screening for government positions
4. Maintains a welcoming but professional tone

Generate a JSON object with this EXACT structure:

{
  "botName": "Professional title like 'Hawaii State HR Interview Assistant for [Position]'",
  "description": "Professional description emphasizing thorough, fair evaluation for state employment",
  "interviewType": "Choose from: Technical, Behavioral, General, Pre-Screening, or Mixed (based on the position)",
  "companyDescription": "Professional description of the State of Hawaii department and its mission",
  "companyIndustry": "Government/Public Service",
  "jobRoleDescription": "Comprehensive description combining job title, duties, and responsibilities",
  "salary": "${jobData.salary || "Competitive state government salary"}",
  "botPersonality": "Professional government interviewer personality - thorough, fair, welcoming but maintains appropriate formality for state employment",
  "selectedAvatar": "June_HR_public",
  "selectedEmotion": "Friendly",
  "questions": {
    "preQualification": [
      {"question": "Pre-qualification question 1 - verify basic requirements", "type": "pre-qualification"},
      {"question": "Pre-qualification question 2 - verify work authorization/availability", "type": "pre-qualification"},
      {"question": "Pre-qualification question 3 - verify location/logistics", "type": "pre-qualification"}
    ],
    "technical": [
      {"question": "Technical/job-specific question 1", "type": "technical"},
      {"question": "Technical/job-specific question 2", "type": "technical"},
    ],
    "general": [
      {"question": "General question 1 - motivation for public service", "type": "general"},
      {"question": "General question 2 - interest in Hawaii/department", "type": "general"},
      {"question": "General question 3 - career goals in public sector", "type": "general"}
    ],
    "behavioral": [
      {"question": "Behavioral question 1 using STAR method", "type": "behavioral"},
      {"question": "Behavioral question 2 - teamwork/collaboration", "type": "behavioral"},
      {"question": "Behavioral question 3 - problem-solving", "type": "behavioral"},
    ]
  },
  "scoringCriteria": [
    {
      "title": "Job-Specific Competency 1",
      "description": "What to evaluate based on job requirements"
    },
    {
      "title": "Communication Skills",
      "description": "Clear, professional communication appropriate for government work"
    },
    {
      "title": "Cultural Fit & Public Service Commitment",
      "description": "Alignment with state values and commitment to serving Hawaii's community"
    },
    {
      "title": "Problem-Solving & Critical Thinking",
      "description": "Ability to handle complex situations relevant to the role"
    }
  ]
}

CRITICAL GUIDELINES:
1. **Pre-qualification questions**: Focus on basic requirements from the job posting
   - Work authorization for Hawaii
   - Availability and start date
   - Required certifications or clearances
   - Specific experience thresholds

2. **Technical questions**: Must be specific to this role
   - Based on actual duties and responsibilities listed
   - Test job-specific knowledge and skills
   - Include scenario-based questions relevant to the work
   - For non-technical roles, ask about job-specific procedures/knowledge

3. **General questions**: Should assess fit for state government work
   - Interest in public service
   - Understanding of department's mission
   - Career goals aligned with government work
   - Commitment to serving Hawaii's community

4. **Behavioral questions**: Use STAR method format
   - Teamwork in diverse environments
   - Problem-solving under government constraints
   - Handling difficult situations professionally
   - Adaptability and initiative

5. **Scoring Criteria**: Create 4-5 criteria that align with:
   - Specific job competencies from the posting
   - Communication and professionalism
   - Cultural fit and public service values
   - Problem-solving and critical thinking
   - Any specialized skills required for the role

6. **Avatar & Voice**:
   - Always use "Kayla-incasualsuit-20220818" (professional female avatar)
   - Always use "Friendly" emotion for a welcoming government interview

7. **Bot Personality**: Should be:
   - Professional and thorough
   - Welcoming but maintains appropriate formality
   - Fair and objective
   - Respectful of Hawaii's diverse community
   - Representative of state government standards

IMPORTANT:
- Generate 2-3 questions per category (pre-qualification, technical, general, behavioral)
- Make questions specific to THIS job, not generic templates
- Reflect the actual requirements and responsibilities from the job posting
- Use professional, inclusive language appropriate for government work
- Consider Hawaii-specific context where relevant (island logistics, diverse communities, etc.)

RETURN ONLY THE JSON OBJECT. NO MARKDOWN, NO EXPLANATIONS, JUST THE JSON.`;

  try {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `You are an expert at creating interview bot configurations for Hawaii State Government positions. You understand government hiring practices, public service values, and the importance of fair, thorough candidate evaluation.

CRITICAL: Return ONLY valid JSON. No markdown formatting, no explanations, no text outside the JSON object.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: convertToGroqMessages(messages),
      temperature: 0.3,
    });

    const responseText = response.choices[0].message.content || "";

    // Clean up the response - remove markdown code blocks if present
    const cleanedResponse = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    let botConfig: InterviewBotConfiguration;
    try {
      botConfig = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", cleanedResponse);
      throw new Error("Failed to parse interview bot configuration");
    }

    // Add unique IDs to all questions
    const addIdsToQuestions = (
      questions: Array<{ question: string; type: string }>,
    ) => {
      return questions.map((q) => ({
        id: generateQuestionId(),
        question: q.question,
        type: q.type,
      }));
    };

    // Add unique IDs to all scoring criteria
    const addIdsToCriteria = (
      criteria: Array<{ title: string; description: string }>,
    ) => {
      return criteria.map((c) => ({
        id: generateCriteriaId(),
        title: c.title,
        description: c.description,
      }));
    };

    // Ensure all question categories exist and have IDs
    botConfig.questions = {
      preQualification: addIdsToQuestions(
        botConfig.questions.preQualification || [],
      ),
      technical: addIdsToQuestions(botConfig.questions.technical || []),
      general: addIdsToQuestions(botConfig.questions.general || []),
      behavioral: addIdsToQuestions(botConfig.questions.behavioral || []),
    };

    // Ensure scoring criteria has IDs
    botConfig.scoringCriteria = addIdsToCriteria(
      botConfig.scoringCriteria || [],
    );

    // Ensure avatar and emotion are set
    if (!botConfig.selectedAvatar) {
      botConfig.selectedAvatar = "June_HR_public";
    }
    if (!botConfig.selectedEmotion) {
      botConfig.selectedEmotion = "Friendly";
    }

    console.log(
      "✅ Successfully generated interview bot configuration with unique question IDs and criteria IDs",
    );
    return botConfig;
  } catch (error) {
    console.error("Error generating interview bot configuration:", error);

    // Return a professional fallback configuration for Hawaii state government
    return createFallbackConfiguration(jobData);
  }
}

/**
 * Build comprehensive job context from job posting data
 */
function buildJobContext(jobData: JobPostingInput): string {
  const sections: string[] = [];

  sections.push(`Position: ${jobData.jobTitle}`);
  sections.push(`Department: ${jobData.department || jobData.companyName}`);
  sections.push(`Location: ${jobData.location || "Hawaii"}`);
  sections.push(
    `Employment Type: ${jobData.employmentType || "Full-Time State Employee"}`,
  );

  if (jobData.salary) {
    sections.push(`Salary: ${jobData.salary}`);
  }

  if (jobData.companyDescription) {
    sections.push(`\nDepartment Description:\n${jobData.companyDescription}`);
  }

  if (jobData.jobDescription) {
    sections.push(`\nJob Description:\n${jobData.jobDescription}`);
  }

  if (jobData.minimumQualifications) {
    sections.push(`\nMinimum Qualifications:`);
    if (jobData.minimumQualifications.education) {
      sections.push(`Education: ${jobData.minimumQualifications.education}`);
    }
    if (jobData.minimumQualifications.experience) {
      sections.push(`Experience: ${jobData.minimumQualifications.experience}`);
    }
    if (jobData.minimumQualifications.specialRequirements?.length) {
      sections.push(
        `Special Requirements: ${jobData.minimumQualifications.specialRequirements.join(", ")}`,
      );
    }
  }

  if (jobData.duties?.length) {
    sections.push(`\nDuties and Responsibilities:`);
    jobData.duties.forEach((duty, index) => {
      sections.push(`${index + 1}. ${duty}`);
    });
  }

  if (jobData.responsibilities) {
    sections.push(`\nResponsibilities:\n${jobData.responsibilities}`);
  }

  if (jobData.requirements) {
    sections.push(`\nRequirements:\n${jobData.requirements}`);
  }

  return sections.join("\n");
}

/**
 * Create fallback configuration for Hawaii state government positions
 */
function createFallbackConfiguration(
  jobData: JobPostingInput,
): InterviewBotConfiguration {
  const positionTitle = jobData.jobTitle || "State Employee";
  const department = jobData.department || jobData.companyName;

  return {
    botName: `Hawaii State Interview Assistant for ${positionTitle}`,
    description: `Professional interview bot for evaluating candidates for ${positionTitle} position with the State of Hawaii. Conducts thorough, fair assessments aligned with state government hiring standards.`,
    interviewType: "Mixed",
    companyDescription:
      jobData.companyDescription ||
      `The State of Hawaii ${department} is committed to serving the community with excellence, integrity, and aloha. We seek qualified professionals dedicated to public service and improving the lives of Hawaii's residents.`,
    companyIndustry: "Government/Public Service",
    jobRoleDescription:
      jobData.jobDescription ||
      `${positionTitle} position with the State of Hawaii ${department}. This role involves serving the community, upholding government standards, and contributing to the department's mission.`,
    salary:
      jobData.salary || "Competitive state government salary with benefits",
    botPersonality:
      "Professional government interviewer who conducts thorough, fair evaluations while maintaining a welcoming atmosphere. Experienced in assessing candidates for public service roles and committed to finding individuals who will serve Hawaii's diverse community with excellence.",
    selectedAvatar: "June_HR_public",
    selectedEmotion: "Friendly",
    questions: {
      preQualification: [
        {
          id: generateQuestionId(),
          question:
            "Are you authorized to work in the United States and able to provide proof of eligibility for state employment?",
          type: "pre-qualification",
        },
        {
          id: generateQuestionId(),
          question: `Are you available to work in ${jobData.location || "Hawaii"} and able to start within the required timeframe?`,
          type: "pre-qualification",
        },
        {
          id: generateQuestionId(),
          question:
            "Do you meet the minimum qualifications outlined in the job posting, including any required education and experience?",
          type: "pre-qualification",
        },
      ],
      technical: [
        {
          id: generateQuestionId(),
          question: `What experience do you have that directly relates to the responsibilities of a ${positionTitle}?`,
          type: "technical",
        },
        {
          id: generateQuestionId(),
          question:
            "Describe your approach to managing multiple priorities and deadlines in a professional environment.",
          type: "technical",
        },
        {
          id: generateQuestionId(),
          question:
            "What methods do you use to ensure accuracy and attention to detail in your work?",
          type: "technical",
        },
      ],
      general: [
        {
          id: generateQuestionId(),
          question:
            "What interests you about working for the State of Hawaii in this department?",
          type: "general",
        },
        {
          id: generateQuestionId(),
          question:
            "How do you see yourself contributing to our mission of serving Hawaii's community?",
          type: "general",
        },
        {
          id: generateQuestionId(),
          question:
            "What do you know about our department and the work we do for Hawaii's residents?",
          type: "general",
        },
      ],
      behavioral: [
        {
          id: generateQuestionId(),
          question:
            "Tell me about a time when you had to work effectively with people from diverse backgrounds. How did you ensure successful collaboration?",
          type: "behavioral",
        },
        {
          id: generateQuestionId(),
          question:
            "Describe a situation where you had to solve a complex problem with limited resources. What was your approach and what was the outcome?",
          type: "behavioral",
        },
        {
          id: generateQuestionId(),
          question:
            "Tell me about a time when you had to maintain professionalism in a challenging situation involving a difficult colleague or customer.",
          type: "behavioral",
        },
      ],
    },
    scoringCriteria: [
      {
        id: generateCriteriaId(),
        title: "Job-Specific Knowledge & Skills",
        description: `Demonstrates understanding of ${positionTitle} responsibilities and possesses relevant technical skills and experience.`,
      },
      {
        id: generateCriteriaId(),
        title: "Communication & Professionalism",
        description:
          "Communicates clearly and professionally, appropriate for government work environment. Shows respect and courtesy in all interactions.",
      },
      {
        id: generateCriteriaId(),
        title: "Public Service Commitment & Cultural Fit",
        description:
          "Demonstrates genuine interest in public service and alignment with state values. Shows understanding and appreciation for Hawaii's diverse community.",
      },
      {
        id: generateCriteriaId(),
        title: "Problem-Solving & Adaptability",
        description:
          "Shows ability to think critically, solve problems effectively, and adapt to changing circumstances in a government setting.",
      },
    ],
  };
}
