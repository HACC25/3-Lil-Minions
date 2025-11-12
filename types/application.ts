/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Shared Application type definitions
 * Used across the application for type safety and consistency
 */

export type ApplicationStatus =
  | "pending"
  | "reviewing"
  | "accepted"
  | "rejected";

/**
 * Processing versions - tracks which scoring algorithm was used
 * v1: Simple LLM-based scoring (MVP)
 * v2: Enhanced LLM with application data
 * v3: Full deterministic with dynamic weights
 */
export type ScoringVersion =
  | "v1-simple-llm"
  | "v2-enhanced-llm"
  | "v3-deterministic";

/**
 * Processing status for background resume analysis
 */
export type ProcessingStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

/**
 * Resume data - supports both simple text and rich structured data
 * v1: Only resumeText populated
 * v2+: Both resumeText and structured populated for advanced matching
 */
export interface ParsedResumeData {
  // Simple (always present)
  resumeText: string; // Raw extracted text from PDF

  // Rich structured data (optional, for future versions)
  structured?: {
    basics?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      location?: string;
      headline?: string;
      summary?: string;
    };

    skills?: string[];

    experience?: {
      totalYears?: number;
      positions?: Array<{
        title: string;
        company: string;
        duration?: string;
      }>;
    };

    education?: {
      level?: string;
      degree?: string;
      field?: string;
    };

    // Future expansion: certifications, projects, etc.
    certifications?: string[];
    projects?: any[];
  };

  // Metadata
  parsingQuality?: "full" | "partial" | "text-only" | "failed";
  parsedAt: string; // ISO timestamp
  parsingError?: string;
}

/**
 * Fit score breakdown - extensible structure for different scoring versions
 * v1: Basic LLM analysis (score, matched/missing, reasoning)
 * v2+: Add component scores, weights, advanced analytics
 */
export interface FitScoreBreakdown {
  // Core fields (always present)
  overallScore: number; // 0-100
  recommendation: "strong-fit" | "good-fit" | "possible-fit" | "poor-fit";

  // Analysis (v1 fields)
  skillsMatched: string[];
  skillsMissing: string[];
  strengths: string[];
  concerns: string[];
  reasoning: string; // LLM's explanation

  // Advanced scoring (optional, for future versions)
  componentScores?: {
    relevanceScore?: number; // 0-100 (v2+: career trajectory / domain match)
    qualificationScore?: number; // 0-100 (v2+: raw qualifications before relevance multiplier)
    skillsScore?: number; // 0-100
    experienceScore?: number; // 0-100
    educationScore?: number; // 0-100
    keywordsScore?: number; // 0-100
  };

  scoringMethod?: {
    version: ScoringVersion;
    deterministicWeight?: number; // e.g., 0.70 for hybrid
    aiWeight?: number; // e.g., 0.30 for hybrid
    weights?: {
      // Dynamic weights per component
      skills?: number;
      experience?: number;
      education?: number;
    };
  };

  // Future expansion: mismatch detection, career signals, etc.
  mismatchSeverity?: "none" | "low" | "moderate" | "severe";
  careerChangerSignals?: string[];
}

/**
 * Complete Application interface with all fields
 */
export interface Application {
  id: string;
  jobId: string;
  companyId: string;

  // Applicant details
  firstName: string;
  lastName: string;
  email: string;
  resumeUrl: string;
  resumeFileName: string;

  // Denormalized job data
  jobTitle: string;
  companyName: string;

  // Status tracking
  status: ApplicationStatus;
  notes?: string; // Company internal notes
  eligibleForSecondRound?: boolean; // Set by AI evaluation logic
  fitScore?: number; // AI-calculated fit score (0-100)

  // Resume processing (NEW)
  parsedResume?: ParsedResumeData;

  // Fit scoring (NEW)
  fitScoreBreakdown?: FitScoreBreakdown;

  // Processing metadata (NEW)
  processingStatus?: ProcessingStatus;
  processingError?: string;
  processingStartedAt?: any; // Firestore Timestamp or ISO string
  processingCompletedAt?: any; // Firestore Timestamp or ISO string

  // Versioning (NEW)
  scoringVersion?: ScoringVersion; // Track which algorithm was used

  // Manual invite tracking (NEW)
  manualInviteSent?: boolean; // True if company manually sent interview invite
  manualInviteSentAt?: any; // Firestore Timestamp or ISO string

  // Timestamps
  appliedAt: any; // Firestore Timestamp or ISO string
  lastModified: any; // Firestore Timestamp or ISO string

  // Access tracking (for applicant tracking page)
  lastAccessedAt?: any; // Firestore Timestamp or ISO string
  accessCount?: number;
}

/**
 * Work History entry
 */
export interface WorkHistory {
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
}

/**
 * Education entry
 */
export interface Education {
  institutionName: string;
  major: string;
  degree: string;
  city: string;
  state: string;
  credits: string;
  graduated: boolean;
  graduationDate: string;
}

/**
 * Certification entry
 */
export interface Certification {
  name: string;
}

/**
 * Skill entry
 */
export interface Skill {
  name: string;
  experience: string; // Years
  experienceMonths: string; // Months
  level: "Beginner" | "Intermediate" | "Expert";
}

/**
 * Language proficiency entry
 */
export interface Language {
  language: string;
  speak: boolean;
  read: boolean;
  write: boolean;
}

/**
 * Reference entry
 */
export interface Reference {
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
}

/**
 * Complete application form data (Hawaii State application)
 */
export interface ApplicationFormData {
  // General Information - Contact
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

  // Work History
  workHistory: WorkHistory[];

  // Education
  education: Education[];

  // Additional Information
  certifications: Certification[];
  veteranStatus: string;

  // Skills
  skills: Skill[];

  // Languages
  languages: Language[];

  // References
  references: Reference[];

  // Supplemental Questions
  q01_careerOpportunities: string[];
  q02_readUnderstoodAgreed: boolean;
  q03_acknowledgeContinued: boolean;
  q04_minimumQualifications: boolean;
  q05_generalExperience: string;
  q06_specializedExperience: string;

  // Dynamic Supplemental Questions (from job posting)
  supplementalAnswers?: Record<string, string | string[]>;
}

/**
 * Application filters (for queries)
 */
export interface ApplicationFilters {
  jobId?: string;
  companyId?: string;
  status?: ApplicationStatus;
  limit?: number;
}

/**
 * Applicant session (for passwordless tracking)
 */
export interface ApplicantSession {
  applicationId: string;
  email: string;
  verifiedAt: string; // ISO string
  expiresAt: string; // ISO string
}

export interface SupplementalQuestionAnswer {
  questionId: string;
  question: string;
  type: "short_answer" | "dropdown" | "checkbox";
  answer: string | string[]; // string for short_answer and dropdown, string[] for checkbox
}

export interface ExtendedApplication extends Omit<Application, "id"> {
  phone?: string;
  dateOfBirth?: string;
  applicationData?: any;
  documents?: Record<string, { fileName: string; uploaded: boolean }>;
  supplementalAnswers?: SupplementalQuestionAnswer[];
}
