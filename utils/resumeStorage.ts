/**
 * LocalStorage utility for resume and matching data
 * Persists user's resume and job matches across sessions
 */

import type { JobMatchResult } from "./matching/types";

const STORAGE_KEYS = {
  RESUME: "user_resume",
  RESUME_METADATA: "user_resume_metadata",
  MATCHES: "job_matches",
  INTERESTS: "user_interests",
  SESSION_ID: "matching_session_id",
  COMPANY_ID: "current_company_id",
} as const;

export interface ResumeMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

export interface StoredMatchData {
  matches: JobMatchResult[];
  companyId: string;
  interests: string[];
  sessionId: string;
  matchedAt: string;
  stats?: {
    totalJobsAnalyzed: number;
    processingTime: number;
    method: string;
  };
}

/**
 * Save resume file to localStorage (as base64)
 */
export function saveResumeToStorage(file: File): void {
  const reader = new FileReader();

  reader.onload = () => {
    const base64 = reader.result as string;

    // Save file data
    localStorage.setItem(STORAGE_KEYS.RESUME, base64);

    // Save metadata
    const metadata: ResumeMetadata = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
    };
    localStorage.setItem(
      STORAGE_KEYS.RESUME_METADATA,
      JSON.stringify(metadata),
    );
  };

  reader.readAsDataURL(file);
}

/**
 * Get resume from localStorage
 */
export function getResumeFromStorage(): {
  file: File | null;
  metadata: ResumeMetadata | null;
} {
  try {
    const base64 = localStorage.getItem(STORAGE_KEYS.RESUME);
    const metadataStr = localStorage.getItem(STORAGE_KEYS.RESUME_METADATA);

    if (!base64 || !metadataStr) {
      return { file: null, metadata: null };
    }

    const metadata: ResumeMetadata = JSON.parse(metadataStr);

    // Convert base64 back to File
    const byteString = atob(base64.split(",")[1]);
    const mimeString = base64.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], metadata.fileName, {
      type: metadata.fileType,
    });

    return { file, metadata };
  } catch (error) {
    console.error("Failed to retrieve resume from localStorage:", error);
    return { file: null, metadata: null };
  }
}

/**
 * Save matching results to localStorage
 */
export function saveMatchesToStorage(data: StoredMatchData): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(data));
    localStorage.setItem(
      STORAGE_KEYS.INTERESTS,
      JSON.stringify(data.interests),
    );
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, data.sessionId);
    localStorage.setItem(STORAGE_KEYS.COMPANY_ID, data.companyId);
  } catch (error) {
    console.error("Failed to save matches to localStorage:", error);
  }
}

/**
 * Get matching results from localStorage
 */
export function getMatchesFromStorage(
  companyId: string,
): StoredMatchData | null {
  try {
    const matchesStr = localStorage.getItem(STORAGE_KEYS.MATCHES);
    const storedCompanyId = localStorage.getItem(STORAGE_KEYS.COMPANY_ID);

    if (!matchesStr || storedCompanyId !== companyId) {
      return null;
    }

    const data: StoredMatchData = JSON.parse(matchesStr);
    return data;
  } catch (error) {
    console.error("Failed to retrieve matches from localStorage:", error);
    return null;
  }
}

/**
 * Clear all resume and matching data
 */
export function clearStoredData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

/**
 * Check if user has stored resume
 */
export function hasStoredResume(): boolean {
  return !!localStorage.getItem(STORAGE_KEYS.RESUME);
}

/**
 * Get just the interests
 */
export function getStoredInterests(): string[] {
  try {
    const interestsStr = localStorage.getItem(STORAGE_KEYS.INTERESTS);
    return interestsStr ? JSON.parse(interestsStr) : [];
  } catch {
    return [];
  }
}
