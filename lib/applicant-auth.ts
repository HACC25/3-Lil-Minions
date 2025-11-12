/**
 * Applicant authentication utilities
 * Handles passwordless session management using localStorage
 */

import { logger } from "./logger";
import type { ApplicantSession } from "@/types/application";

const TOKEN_PREFIX = "applicant_token_";
const TOKEN_EXPIRY_DAYS = 90;

/**
 * Store applicant session in localStorage
 * @param session - Session data to store
 */
export function storeApplicantSession(session: ApplicantSession): void {
  try {
    const key = `${TOKEN_PREFIX}${session.applicationId}`;
    localStorage.setItem(key, JSON.stringify(session));
    logger.info("Applicant session stored:", session.applicationId);
  } catch (error) {
    logger.error("Failed to store applicant session:", error);
  }
}

/**
 * Get applicant session from localStorage
 * @param applicationId - Application ID to retrieve session for
 * @returns Session object or null if not found/expired
 */
export function getApplicantSession(
  applicationId: string,
): ApplicantSession | null {
  try {
    const key = `${TOKEN_PREFIX}${applicationId}`;
    const stored = localStorage.getItem(key);

    if (!stored) return null;

    const session: ApplicantSession = JSON.parse(stored);

    // Check if expired
    if (new Date(session.expiresAt) < new Date()) {
      logger.info("Applicant session expired:", applicationId);
      removeApplicantSession(applicationId);
      return null;
    }

    return session;
  } catch (error) {
    logger.error("Failed to get applicant session:", error);
    return null;
  }
}

/**
 * Remove applicant session from localStorage
 * @param applicationId - Application ID to remove session for
 */
export function removeApplicantSession(applicationId: string): void {
  try {
    const key = `${TOKEN_PREFIX}${applicationId}`;
    localStorage.removeItem(key);
    logger.info("Applicant session removed:", applicationId);
  } catch (error) {
    logger.error("Failed to remove applicant session:", error);
  }
}

/**
 * Check if a valid session exists for an application
 * @param applicationId - Application ID to check
 * @returns True if valid session exists, false otherwise
 */
export function isSessionValid(applicationId: string): boolean {
  const session = getApplicantSession(applicationId);
  return session !== null;
}

/**
 * Get all stored application IDs from localStorage
 * @returns Array of application IDs with valid sessions
 */
export function getAllStoredApplications(): string[] {
  try {
    const keys = Object.keys(localStorage);
    return keys
      .filter((key) => key.startsWith(TOKEN_PREFIX))
      .map((key) => key.replace(TOKEN_PREFIX, ""))
      .filter((appId) => isSessionValid(appId)); // Only return valid sessions
  } catch (error) {
    logger.error("Failed to get stored applications:", error);
    return [];
  }
}

/**
 * Create a new applicant session
 * @param applicationId - Application ID
 * @param email - Applicant email
 * @returns New session object
 */
export function createApplicantSession(
  applicationId: string,
  email: string,
): ApplicantSession {
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );

  return {
    applicationId,
    email,
    verifiedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}
