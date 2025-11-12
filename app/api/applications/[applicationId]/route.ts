/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore, getStorage } from "@/lib/firebase-admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import type { ApplicationStatus } from "@/types/application";

/**
 * GET /api/applications/[applicationId]
 * Get single application for company (protected endpoint)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
): Promise<NextResponse> {
  try {
    // TODO: Verify Firebase Auth token and role
    const { applicationId } = await params;
    const firestore = await getAdminFirestore();
    const appDoc = await firestore
      .collection("applications")
      .doc(applicationId)
      .get();

    if (!appDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Application not found",
        },
        { status: 404 },
      );
    }

    const data = appDoc.data();

    // Convert timestamps
    const application = {
      id: appDoc.id,
      ...data,
      appliedAt: data?.appliedAt?.toDate?.()?.toISOString() || data?.appliedAt,
      lastModified:
        data?.lastModified?.toDate?.()?.toISOString() || data?.lastModified,
      lastAccessedAt:
        data?.lastAccessedAt?.toDate?.()?.toISOString() || data?.lastAccessedAt,
    };

    return NextResponse.json(
      {
        success: true,
        application,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ Error fetching application:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch application",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/applications/[applicationId]
 * Update application status and notes (protected endpoint)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
): Promise<NextResponse> {
  try {
    // TODO: Verify Firebase Auth token and role
    const { applicationId } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const firestore = await getAdminFirestore();

    // Fetch current application
    const appDoc = await firestore
      .collection("applications")
      .doc(applicationId)
      .get();

    if (!appDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Application not found",
        },
        { status: 404 },
      );
    }

    const application = appDoc.data();
    const oldStatus = application?.status;

    // If only notes changed, just update notes
    if (!status || status === oldStatus) {
      await firestore
        .collection("applications")
        .doc(applicationId)
        .update({
          notes: notes || application?.notes || "",
          lastModified: Timestamp.now(),
        });

      return NextResponse.json(
        {
          success: true,
          message: "Application updated successfully",
        },
        { status: 200 },
      );
    }

    // Status changed - need transaction to update company counts
    const newStatus = status as ApplicationStatus;
    const companyId = application?.companyId;

    await firestore.runTransaction(async (transaction) => {
      // Update application
      const appRef = firestore.collection("applications").doc(applicationId);
      transaction.update(appRef, {
        status: newStatus,
        notes: notes || application?.notes || "",
        lastModified: Timestamp.now(),
      });

      // Update company counts
      const companyRef = firestore.collection("companies").doc(companyId);
      const oldStatusField = `${oldStatus}Applications`;
      const newStatusField = `${newStatus}Applications`;

      transaction.update(companyRef, {
        [oldStatusField]: FieldValue.increment(-1),
        [newStatusField]: FieldValue.increment(1),
        updatedAt: Timestamp.now(),
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Application updated successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ Error updating application:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update application",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/applications/[applicationId]
 * Delete application (protected endpoint)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
): Promise<NextResponse> {
  try {
    // TODO: Verify Firebase Auth token and role
    const { applicationId } = await params;
    const firestore = await getAdminFirestore();

    // Fetch application
    const appDoc = await firestore
      .collection("applications")
      .doc(applicationId)
      .get();

    if (!appDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Application not found",
        },
        { status: 404 },
      );
    }

    const application = appDoc.data();
    const resumeUrl = application?.resumeUrl;
    const jobId = application?.jobId;
    const companyId = application?.companyId;
    const status = application?.status;

    // Delete resume from Storage
    if (resumeUrl) {
      try {
        const storage = getStorage();
        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

        if (!bucketName) {
          console.error("Storage bucket not configured");
        } else {
          const bucket = storage.bucket(bucketName);

          // Extract file path from URL
          const filePath = resumeUrl.split(`${bucket.name}/`)[1];

          if (filePath) {
            await bucket.file(filePath).delete();
          }
        }
      } catch (error: any) {
        console.error("❌ Error deleting resume:", error);
        // Continue with application deletion even if resume delete fails
      }
    }

    // Delete application and update job/company in transaction
    await firestore.runTransaction(async (transaction) => {
      // Delete application
      const appRef = firestore.collection("applications").doc(applicationId);
      transaction.delete(appRef);

      // Update job: Remove from array, decrement count
      const jobRef = firestore.collection("jobs").doc(jobId);
      transaction.update(jobRef, {
        applications: FieldValue.arrayRemove(applicationId),
        applicants: FieldValue.increment(-1),
      });

      // Update company: Decrement counts
      const companyRef = firestore.collection("companies").doc(companyId);
      const statusField = `${status}Applications`;

      transaction.update(companyRef, {
        totalApplications: FieldValue.increment(-1),
        [statusField]: FieldValue.increment(-1),
        updatedAt: Timestamp.now(),
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Application deleted successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ Error deleting application:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete application",
      },
      { status: 500 },
    );
  }
}
