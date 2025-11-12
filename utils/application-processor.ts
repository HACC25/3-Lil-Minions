import { getAdminFirestore } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { extractTextFromPdf } from "./adobe-pdf-extractor";
import { createScoringEngine } from "./scoring";
import { sendInterviewInvitation } from "@/lib/email/interviewInvitation";
import type { Job } from "@/types/job";
import type {
  ParsedResumeData,
  ScoringVersion,
  ApplicationFormData,
} from "@/types/application";

/**
 * Options for application processing
 */
export interface ProcessingOptions {
  scoringVersion?: ScoringVersion;
  threshold?: number; // Minimum score for second round (default: 70)
  applicationData?: ApplicationFormData; // Pass application data to avoid re-fetching
}

/**
 * Main application processor
 * Orchestrates: PDF extraction → Resume parsing → Scoring → Firestore update
 *
 * EXTENSION POINTS:
 * - Line 45: Add structured resume parsing (Llama extraction)
 * - Line 55: Swap scoring engine version
 * - Line 85: Add post-processing hooks
 */
export async function processApplicationBackground(
  applicationId: string,
  resumeBuffer: Buffer,
  job: Job,
  options?: ProcessingOptions,
): Promise<void> {
  const firestore = await getAdminFirestore();
  const appRef = firestore.collection("applications").doc(applicationId);

  const scoringVersion = options?.scoringVersion || "v2-enhanced-llm";
  const threshold = options?.threshold || 70;

  try {
    console.log(
      `[${applicationId}] Processing started (version: ${scoringVersion})`,
    );

    // Update status to processing
    await appRef.update({
      processingStatus: "processing",
      processingStartedAt: Timestamp.now(),
    });

    // ========================================
    // STEP 1: PDF EXTRACTION
    // ========================================
    console.log(`[${applicationId}] Extracting PDF text...`);
    const resumeText = await extractTextFromPdf(resumeBuffer);

    // ========================================
    // STEP 2: RESUME PARSING
    // EXTENSION POINT: Add structured parsing here for v2+
    // ========================================
    console.log(`[${applicationId}] Parsing resume...`);
    const parsedResume: ParsedResumeData = {
      resumeText,
      parsedAt: new Date().toISOString(),
      parsingQuality: "text-only", // v1: text only

      // EXTENSION POINT: v2+ can populate structured data
      // structured: await extractStructuredData(resumeText),
    };

    // ========================================
    // STEP 3: SCORING (SWAPPABLE ENGINE)
    // EXTENSION POINT: Change scoring version here
    // ========================================
    console.log(`[${applicationId}] Calculating fit score...`);

    const scoringEngine = createScoringEngine({
      version: scoringVersion,
      threshold,
    });

    const applicationData = options?.applicationData;

    const fitScoreBreakdown = await scoringEngine.calculateFit(
      parsedResume,
      job,
      applicationData,
    );

    // ========================================
    // STEP 4: SAVE RESULTS TO FIRESTORE
    // ========================================
    console.log(`[${applicationId}] Saving results...`);

    await appRef.update({
      // Resume data
      parsedResume,

      // Scoring results
      fitScore: fitScoreBreakdown.overallScore,
      fitScoreBreakdown,
      scoringVersion,

      // Auto-computed fields
      eligibleForSecondRound: fitScoreBreakdown.overallScore >= threshold,

      // Processing metadata
      processingStatus: "completed",
      processingCompletedAt: Timestamp.now(),
      lastModified: Timestamp.now(),
    });

    console.log(
      `[${applicationId}] ✅ Processing complete! Score: ${fitScoreBreakdown.overallScore}`,
    );

    // ========================================
    // STEP 5: SEND INTERVIEW INVITATION IF QUALIFIED
    // ========================================
    if (fitScoreBreakdown.overallScore >= 70) {
      try {
        console.log(
          `[${applicationId}] Applicant scored ${fitScoreBreakdown.overallScore} >= ${threshold}. Sending interview invitation...`,
        );

        // Get the application data to retrieve email and name
        const appSnapshot = await appRef.get();
        const appData = appSnapshot.data();

        if (appData?.email && appData?.firstName && appData?.lastName) {
          const applicantName = `${appData.firstName} ${appData.lastName}`;
          const jobTitle = job.title || "the position";
          const companyName = job.companyName || "our company";

          // Generate interview link
          const baseUrl = "https://banana.hexcelerate.app";
          const interviewLink = `${baseUrl}/interviews/setup/${applicationId}`;

          // Send the email
          await sendInterviewInvitation(
            appData.email,
            applicantName,
            jobTitle,
            companyName,
            interviewLink,
            fitScoreBreakdown.overallScore,
          );

          console.log(
            `[${applicationId}] ✅ Interview invitation sent to ${appData.email}`,
          );
        } else {
          console.warn(
            `[${applicationId}] ⚠️ Missing applicant email or name. Cannot send invitation.`,
          );
        }
      } catch (emailError) {
        // Don't fail the entire process if email fails
        console.error(
          `[${applicationId}] ❌ Failed to send interview invitation:`,
          emailError,
        );
        // Continue processing - email failure shouldn't block the application
      }
    } else {
      console.log(
        `[${applicationId}] Score ${fitScoreBreakdown.overallScore} < ${threshold}. No interview invitation sent.`,
      );
    }

    // EXTENSION POINT: Post-processing hook
    // await onProcessingComplete(applicationId, fitScoreBreakdown);
  } catch (error) {
    console.error(`[${applicationId}] ❌ Processing failed:`, error);

    // Update with error status
    await appRef.update({
      processingStatus: "failed",
      processingError: error instanceof Error ? error.message : "Unknown error",
      processingCompletedAt: Timestamp.now(),
    });

    // EXTENSION POINT: Error handling hook
    // await onProcessingError(applicationId, error);
  }
}

/**
 * EXTENSION POINT: Reprocess application with new scoring version
 * Useful for migrating old applications to new algorithms
 *
 * Usage:
 * await reprocessApplication("app123", { scoringVersion: "v2-hybrid" });
 */
export async function reprocessApplication(
  applicationId: string,
  options?: ProcessingOptions,
): Promise<void> {
  const firestore = await getAdminFirestore();

  // Fetch application
  const appDoc = await firestore
    .collection("applications")
    .doc(applicationId)
    .get();

  if (!appDoc.exists) {
    throw new Error(`Application ${applicationId} not found`);
  }

  const app = appDoc.data();

  // Get resume from storage
  // Note: You'd need to implement fetching the resume buffer from Storage
  // For now, throw error if parsedResume doesn't exist
  if (!app?.parsedResume?.resumeText) {
    throw new Error("No resume text found - cannot reprocess");
  }

  // Get job
  const jobDoc = await firestore.collection("jobs").doc(app.jobId).get();
  if (!jobDoc.exists) {
    throw new Error(`Job ${app.jobId} not found`);
  }
  const job = jobDoc.data() as Job;

  // Reprocess just the scoring (skip PDF extraction)
  const scoringVersion = options?.scoringVersion || "v2-enhanced-llm";
  const threshold = options?.threshold || 70;

  try {
    console.log(
      `[${applicationId}] Reprocessing with version: ${scoringVersion}`,
    );

    await appDoc.ref.update({
      processingStatus: "processing",
    });

    const scoringEngine = createScoringEngine({
      version: scoringVersion,
      threshold,
    });

    const applicationData = app.applicationData;

    const fitScoreBreakdown = await scoringEngine.calculateFit(
      app.parsedResume,
      job,
      applicationData,
    );

    await appDoc.ref.update({
      fitScore: fitScoreBreakdown.overallScore,
      fitScoreBreakdown,
      scoringVersion,
      eligibleForSecondRound: fitScoreBreakdown.overallScore >= threshold,
      processingStatus: "completed",
      lastModified: Timestamp.now(),
    });

    console.log(`[${applicationId}] ✅ Reprocessing complete!`);
  } catch (error) {
    console.error(`[${applicationId}] ❌ Reprocessing failed:`, error);

    await appDoc.ref.update({
      processingStatus: "failed",
      processingError: error instanceof Error ? error.message : "Unknown error",
    });

    throw error;
  }
}
