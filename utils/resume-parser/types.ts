/**
 * Resume Parser Types
 * Defines types for extracted resume data and AI-prefilled application data
 */

export interface ExtractedResumeData {
  // Personal Information
  personalInfo: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    dateOfBirth?: string;
  };

  // Work Experience
  workHistory: Array<{
    employerName: string;
    jobTitle: string;
    startDate: string;
    endDate?: string;
    stillEmployed: boolean;
    location?: string;
    duties: string;
    hoursPerWeek?: number;
  }>;

  // Education
  education: Array<{
    institutionName: string;
    degree: string;
    major?: string;
    graduationDate?: string;
    graduated: boolean;
    city?: string;
    state?: string;
  }>;

  // Skills
  skills: Array<{
    name: string;
    experience?: string;
    experienceMonths?: string;
    level?: "Beginner" | "Intermediate" | "Expert";
  }>;

  // Languages
  languages: Array<{
    language: string;
    speak: boolean;
    read: boolean;
    write: boolean;
  }>;

  // Certifications
  certifications: Array<{
    name: string;
  }>;

  // References (often not in resume, but we'll try)
  references: Array<{
    type: "Professional" | "Personal";
    firstName: string;
    lastName: string;
    title?: string;
    phone?: string;
    email?: string;
  }>;

  // Raw text for additional processing
  rawText: string;
}

export interface PrefilledApplicationData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  veteranStatus: string;
  workHistory: Array<{
    employerName: string;
    employerType: string;
    startDate: string;
    endDate: string;
    stillEmployed: boolean;
    hoursPerWeek: number;
    jobTitle: string;
    salary: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    supervisorName: string;
    supervisorTitle: string;
    mayContactEmployer: boolean;
    reasonForLeaving: string;
    duties: string;
  }>;
  education: Array<{
    institutionName: string;
    major: string;
    degree: string;
    city: string;
    state: string;
    credits: string;
    graduated: boolean;
    graduationDate: string;
  }>;
  certifications: Array<{
    name: string;
  }>;
  skills: Array<{
    name: string;
    experience: string;
    experienceMonths: string;
    level: "Beginner" | "Intermediate" | "Expert";
  }>;
  languages: Array<{
    language: string;
    speak: boolean;
    read: boolean;
    write: boolean;
  }>;
  references: Array<{
    type: "Professional" | "Personal";
    firstName: string;
    lastName: string;
    title: string;
    phone: string;
    email: string;
    address: string;
    addressLine2: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }>;
}

export interface ParsedResumeResult {
  success: boolean;
  data?: ExtractedResumeData;
  error?: string;
}

export interface PrefillResult {
  success: boolean;
  data?: PrefilledApplicationData;
  error?: string;
  confidence?: number; // 0-100, how confident the AI is about the extraction
}

export interface ExtractedResumeResult {
  success: boolean;
  data?: ExtractedResumeData;
  error?: string;
  confidence?: number; // 0-100, how confident the AI is about the extraction
}
