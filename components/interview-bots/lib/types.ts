// types.ts
export interface Question {
  id: string;
  question: string;
  type: "technical" | "general" | "behavioral" | "pre-qualification";
}

export interface FormData {
  botName: string;
  description: string;
  interviewType: string;
  companyDescription: string;
  companyIndustry: string; // Added company industry
  jobRoleDescription: string;
  salary: string;
  botPersonality: string;
  selectedAvatar: string;
  selectedEmotion: string;
}

export interface AvatarOption {
  value: string;
  label: string;
  imageUrl?: string;
  voiceId?: string;
}

export interface EmotionOption {
  value: string;
  label: string;
}

export interface ColorScheme {
  textPrimary: string;
  background: string;
  cardBackground: string;
  text: string;
  textSecondary: string;
  inputBackground: string;
  inputBorder: string;
  inputFocus: string;
  buttonPrimary: string;
  buttonSecondary: string;
  buttonText: string;
  buttonTextSecondary: string;
  success: string;
  successBg: string;
  accent: string;
  shadow: string;
  borderAccent: string;
  warning: string;
  warningBg: string;
  sectionBg: string;
  divider: string;
}

export interface ExpandedSections {
  basic: boolean;
  avatar: boolean;
  company: boolean;
  personality: boolean;
  technical: boolean;
  general: boolean;
  behavioral: boolean;
  preQualification: boolean;
  requirements: boolean;
}

export interface ScoringCriteria {
  id: string;
  title: string;
  description: string;
  isEditing?: boolean;
}
