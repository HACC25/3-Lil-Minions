/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Shared Job type definitions
 * Used across the application for type safety and consistency
 */

export type JobStatus = "active" | "draft" | "closed";

export type LocationType = "onsite" | "remote" | "hybrid";

export type JobType = "Full-time" | "Part-time" | "Contract" | "Internship";

export type SalaryPeriod = "hourly" | "yearly" | "monthly";

export interface Salary {
  min?: number;
  max?: number;
  currency?: string;
  period?: SalaryPeriod;
}

export interface SalaryRange {
  min: number;
  max: number;
  frequency: string;
}

export interface MinimumQualifications {
  education: string;
  experience: string;
  specialRequirements: string[];
}

export interface Contact {
  name: string;
  email: string;
  phone: string;
}

export type SupplementalQuestionType = "short_answer" | "dropdown" | "checkbox";

export interface SupplementalQuestion {
  id: string;
  question: string;
  type: SupplementalQuestionType;
  required: boolean;
  options?: string[]; // For dropdown and checkbox types
}

/**
 * Complete Job interface with all fields
 */
export interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  locationType: LocationType;
  type: JobType;
  salary?: Salary;
  category?: string;
  requirements?: string[];
  status: JobStatus;
  companyId: string;
  companyName?: string;
  companyWebsite?: string;
  postedDate?: any; // Firestore Timestamp or ISO string
  createdAt?: any; // Firestore Timestamp or ISO string
  lastModified?: any; // Firestore Timestamp or ISO string

  // Application tracking
  applications?: string[]; // Array of application IDs
  applicants?: number; // Count (matches array length)
  interviewBotId?: string; // Linked interview bot ID

  expiresDate?: any; // Firestore Timestamp or ISO string
  responsibilities?: string[];
  views?: number;
  searchKeywords?: string[];

  // Government job posting specific fields
  positionNumber?: string;
  recruitmentType?: string;
  department?: string;
  division?: string;
  island?: string;
  salaryRange?: SalaryRange;
  openingDate?: string;
  closingDate?: string;
  positionCount?: number;
  minimumQualifications?: MinimumQualifications;
  duties?: string[];
  supplementalInfo?: string;
  requiredDocuments?: string[];
  contact?: Contact;
  examType?: string;
  employmentType?: string;
  workSchedule?: string;
  supplementalQuestions?: SupplementalQuestion[];
}

export interface JobFormData {
  title: string;
  positionNumber: string;
  recruitmentType: string;
  department: string;
  division: string;
  location: string;
  island: string;
  salaryRange: {
    min: number;
    max: number;
    frequency: string;
  };
  openingDate: string;
  closingDate: string;
  positionCount: number;
  minimumQualifications: {
    education: string;
    experience: string;
    specialRequirements: string[];
  };
  duties: string[];
  supplementalInfo: string;
  requiredDocuments: string[];
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  examType: string;
  employmentType: string;
  workSchedule: string;
  supplementalQuestions?: SupplementalQuestion[];
  status?: JobStatus; // Optional for form, set programmatically
}
