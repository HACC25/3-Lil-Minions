/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import type { ApplicantSession } from "@/types/application";

interface TrackResponse {
  success: boolean;
  application?: any;
  error?: string;
}

/**
 * GET /api/applications/track/[applicationId]
 * Get application details for applicant (requires session validation)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
): Promise<NextResponse<TrackResponse>> {
  try {
    const { applicationId } = await params;

    // Get session from header
    const sessionHeader = request.headers.get("x-applicant-session");

    if (!sessionHeader) {
      return NextResponse.json(
        {
          success: false,
          error: "Session required",
        },
        { status: 401 },
      );
    }

    // Parse and validate session
    let session: ApplicantSession;
    try {
      session = JSON.parse(sessionHeader);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid session format",
        },
        { status: 401 },
      );
    }

    // Validate session matches applicationId
    if (session.applicationId !== applicationId) {
      return NextResponse.json(
        {
          success: false,
          error: "Session does not match application",
        },
        { status: 401 },
      );
    }

    // Check session expiry
    if (new Date(session.expiresAt) < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: "Session expired",
        },
        { status: 401 },
      );
    }

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

    // CRITICAL: Verify email matches session
    if (application?.email.toLowerCase() !== session.email.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized access",
        },
        { status: 403 },
      );
    }

    // Update access tracking
    await firestore
      .collection("applications")
      .doc(applicationId)
      .update({
        lastAccessedAt: Timestamp.now(),
        accessCount: FieldValue.increment(1),
      });

    // Sanitize data: Remove company notes
    const { notes, ...publicData } = application;

    // Convert timestamps for serialization
    const sanitized = {
      ...publicData,
      appliedAt:
        publicData.appliedAt?.toDate?.()?.toISOString() || publicData.appliedAt,
      lastModified:
        publicData.lastModified?.toDate?.()?.toISOString() ||
        publicData.lastModified,
      lastAccessedAt:
        publicData.lastAccessedAt?.toDate?.()?.toISOString() ||
        publicData.lastAccessedAt,
    };

    return NextResponse.json(
      {
        success: true,
        application: sanitized,
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
