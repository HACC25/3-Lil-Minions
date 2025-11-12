/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore, getStorage } from "@/lib/firebase-admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import type {
  ExtendedApplication,
  ApplicationStatus,
} from "@/types/application";
import type { Job } from "@/types/job";
import { processApplicationBackground } from "@/utils/application-processor";
import { sendApplicationConfirmation } from "@/lib/email/applicationConfirmation";

// // Maximum file size: 5MB
// const MAX_FILE_SIZE = 5 * 1024 * 1024;

// // Allowed file type: PDF only
// const ALLOWED_FILE_TYPE = "application/pdf";

interface CreateApplicationResponse {
  success: boolean;
  applicationId?: string;
  message?: string;
  error?: string;
}

/**
 * POST /api/applications
 * Submit a new job application (public endpoint, no auth required)
 */
/**
 * POST /api/applications
 * Submit a new job application (public endpoint, no auth required)
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<CreateApplicationResponse>> {
  try {
    // Parse FormData
    const formData = await request.formData();

    // Get application data JSON
    const applicationDataStr = formData.get("applicationData") as string;
    const jobId = formData.get("jobId") as string;

    if (!applicationDataStr || !jobId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: applicationData and jobId are required",
        },
        { status: 400 },
      );
    }

    // Parse application data
    let applicationData;
    try {
      applicationData = JSON.parse(applicationDataStr);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid application data format",
        },
        { status: 400 },
      );
    }

    // Validate basic required fields from application data
    const { firstName, lastName, email } = applicationData;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and email are required",
        },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format",
        },
        { status: 400 },
      );
    }

    const firestore = await getAdminFirestore();

    // Step 1: Fetch and validate job
    const jobDoc = await firestore.collection("jobs").doc(jobId).get();

    if (!jobDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 },
      );
    }

    const job = jobDoc.data();

    // Validate job is active
    if (job?.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error: "This job is no longer accepting applications",
        },
        { status: 400 },
      );
    }

    const companyId = job.companyId;
    const jobTitle = job.title;
    const companyName = job.companyName || "State of Hawaii";
    const requiredDocuments = job.requiredDocuments || [];

    // Step 2: Check for duplicate application
    // Prevent the same email from applying to the same job twice
    const normalizedEmail = email.toLowerCase().trim();
    const existingApplications = await firestore
      .collection("applications")
      .where("jobId", "==", jobId)
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (!existingApplications.empty) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You have already submitted an application for this position. Please check your email for confirmation.",
        },
        { status: 400 },
      );
    }

    // Step 3: Check if Resume is required and validate
    const resumeFile = formData.get("Resume") as File | null;
    let resumeUrl = "";
    let resumeFileName = "";
    let resumeBuffer: Buffer | null = null;

    // Only validate Resume if it's in requiredDocuments
    if (requiredDocuments.includes("Resume")) {
      if (!resumeFile || resumeFile.size === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Resume file is required for this position",
          },
          { status: 400 },
        );
      }

      // Validate file size (10MB max)
      if (resumeFile.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            error: "Resume file must be less than 10MB",
          },
          { status: 400 },
        );
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(resumeFile.type)) {
        return NextResponse.json(
          {
            success: false,
            error: "Resume must be a PDF or Word document",
          },
          { status: 400 },
        );
      }
    }

    // Step 4: Create application document (to get ID)
    const applicationRef = firestore.collection("applications").doc();
    const applicationId = applicationRef.id;

    // Step 5: Upload Resume to Firebase Storage (if provided)
    if (resumeFile && resumeFile.size > 0) {
      const storage = getStorage();
      const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

      if (!bucketName) {
        throw new Error("Storage bucket not configured");
      }

      const bucket = storage.bucket(bucketName);

      // Create storage path: /resumes/{companyId}/{jobId}/{applicationId}_resume.{ext}
      const sanitizedFileName = `${applicationId}_${firstName}_${lastName}.pdf`;
      const filePath = `resumes/${companyId}/${jobId}/${sanitizedFileName}`;

      // Convert File to Buffer
      const fileBuffer = await resumeFile.arrayBuffer();
      resumeBuffer = Buffer.from(fileBuffer);

      // Upload to Storage
      const file = bucket.file(filePath);

      try {
        await file.save(resumeBuffer, {
          metadata: {
            contentType: resumeFile.type,
            metadata: {
              applicationId,
              originalFileName: resumeFile.name,
              uploadedAt: new Date().toISOString(),
            },
          },
        });

        // Make file publicly accessible
        await file.makePublic();

        // Get public URL
        resumeUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        resumeFileName = resumeFile.name;
      } catch (error: any) {
        console.error("❌ Error uploading resume:", error);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to upload resume",
          },
          { status: 500 },
        );
      }
    }

    // Step 6: Store non-Resume documents as metadata only (no storage upload)
    const otherDocuments: Record<
      string,
      { fileName: string; uploaded: boolean }
    > = {};

    for (const documentType of requiredDocuments) {
      if (documentType === "Resume") continue; // Skip Resume, already handled

      const file = formData.get(documentType) as File | null;

      if (file && file.size > 0) {
        // Store metadata only - file is not uploaded to storage
        otherDocuments[documentType] = {
          fileName: file.name,
          uploaded: true, // Mark as provided by user
        };
      } else {
        // Document was required but not provided
        return NextResponse.json(
          {
            success: false,
            error: `Missing required document: ${documentType}`,
          },
          { status: 400 },
        );
      }
    }

    // Ensure Resume is explicitly added to the `documents` field if uploaded
    if (resumeFile && resumeFile.size > 0) {
      otherDocuments["Resume"] = {
        fileName: resumeFileName,
        uploaded: true,
      };
    }

    // Step 7: Create application document and update job/company in transaction
    const finalApplicationData: Omit<ExtendedApplication, "id"> & {
      id: string;
    } = {
      id: applicationId,
      jobId,
      companyId,

      // Applicant details
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: applicationData.phone?.trim() || "",
      dateOfBirth: applicationData.dateOfBirth || "",

      // Complete form data (work history, education, skills, languages, references, etc.)
      applicationData: applicationData,

      // Resume (saved to storage)
      resumeUrl,
      resumeFileName,

      // Other documents metadata (NOT saved to storage, just metadata)
      documents: otherDocuments,

      // Denormalized data
      jobTitle,
      companyName,

      // Status
      status: "pending" as ApplicationStatus,
      notes: "",

      // Resume processing
      processingStatus: "pending",
      scoringVersion: "v1-simple-llm",

      // Timestamps
      appliedAt: Timestamp.now(),
      lastModified: Timestamp.now(),

      // Access tracking
      accessCount: 0,
    };

    try {
      await firestore.runTransaction(async (transaction) => {
        // Create application
        transaction.set(applicationRef, finalApplicationData);

        // Update job: Add to applications array, increment count
        const jobRef = firestore.collection("jobs").doc(jobId);
        transaction.update(jobRef, {
          applications: FieldValue.arrayUnion(applicationId),
          applicants: FieldValue.increment(1),
        });

        // Update company: Increment counts
        const companyRef = firestore.collection("companies").doc(companyId);
        transaction.update(companyRef, {
          totalApplications: FieldValue.increment(1),
          pendingApplications: FieldValue.increment(1),
          updatedAt: Timestamp.now(),
        });
      });
    } catch (error: any) {
      console.error("❌ Error creating application:", error);

      // Rollback: Delete uploaded resume if exists
      if (resumeUrl) {
        try {
          const storage = getStorage();
          const bucket = storage.bucket(
            process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
          );
          const fileExtension = resumeFileName.split(".").pop() || "pdf";
          const filePath = `resumes/${companyId}/${jobId}/${applicationId}_resume.${fileExtension}`;
          await bucket.file(filePath).delete();
        } catch (deleteError) {
          console.error("❌ Failed to rollback resume upload:", deleteError);
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: "Failed to submit application",
        },
        { status: 500 },
      );
    }

    // ========================================
    // BACKGROUND PROCESSING (Fire-and-forget)
    // ========================================
    // Trigger async resume processing if Resume was uploaded
    if (resumeBuffer && resumeUrl) {
      processApplicationBackground(applicationId, resumeBuffer, job as Job, {
        scoringVersion: "v2-enhanced-llm",
        threshold: 70,
        applicationData: applicationData,
      }).catch((err) => {
        console.error(`[${applicationId}] Background processing error:`, err);
      });
    }

    // ========================================
    // SEND CONFIRMATION EMAIL
    // ========================================
    // Send confirmation email to applicant (fire-and-forget)
    try {
      const applicantName = `${firstName} ${lastName}`;
      await sendApplicationConfirmation(
        email,
        applicantName,
        jobTitle,
        companyName,
        applicationId,
      );
      console.log(`[${applicationId}] ✅ Confirmation email sent to ${email}`);
    } catch (emailError) {
      // Don't fail the entire process if email fails
      console.error(
        `[${applicationId}] ❌ Failed to send confirmation email:`,
        emailError,
      );
      // Continue - email failure shouldn't block the application submission
    }

    // Success response
    return NextResponse.json(
      {
        success: true,
        applicationId,
        message: "Application submitted successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("❌ Unexpected error in create application:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while submitting your application",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/applications?companyId=X&jobId=Y&status=Z
 * Fetch applications for a company (protected endpoint)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // TODO: Verify Firebase Auth token and role
    // For now, we'll implement basic parameter validation
    // In a real implementation, you would check:
    // const token = request.headers.get('authorization');
    // Verify token and ensure role === 'company'

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const jobId = searchParams.get("jobId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "100");

    // Validate companyId is provided
    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          error: "Company ID is required",
        },
        { status: 400 },
      );
    }

    const firestore = await getAdminFirestore();
    let query: any = firestore.collection("applications");

    // Filter by companyId
    query = query.where("companyId", "==", companyId);

    // Filter by jobId if provided
    if (jobId) {
      query = query.where("jobId", "==", jobId);
    }

    // Filter by status if provided
    if (status) {
      query = query.where("status", "==", status);
    }

    // Order by appliedAt descending
    query = query.orderBy("appliedAt", "desc");

    // Apply limit
    query = query.limit(limit);

    const snapshot = await query.get();

    const applications = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to ISO strings
        appliedAt: data.appliedAt?.toDate?.()?.toISOString() || data.appliedAt,
        lastModified:
          data.lastModified?.toDate?.()?.toISOString() || data.lastModified,
        lastAccessedAt:
          data.lastAccessedAt?.toDate?.()?.toISOString() || data.lastAccessedAt,
      };
    });

    return NextResponse.json(
      {
        success: true,
        applications,
        count: applications.length,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ Error fetching applications:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch applications",
      },
      { status: 500 },
    );
  }
}
