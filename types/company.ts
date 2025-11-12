/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Shared Company type definitions
 */

export interface Company {
  id?: string; // Document ID from Firestore
  companyName: string;
  email: string;
  website?: string;
  industry?: string;
  jobs: string[]; // Array of job IDs
  profileComplete: boolean;
  verified: boolean;
  activeJobsCount?: number;
  totalJobsCount?: number;

  // Application tracking (counts only, no array)
  totalApplications?: number;
  pendingApplications?: number;
  reviewingApplications?: number;
  acceptedApplications?: number;
  rejectedApplications?: number;

  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}
