/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import type { ApplicantSession } from "@/types/application";

const TOKEN_EXPIRY_DAYS = 90;

interface VerifyRequest {
  applicationId: string;
  email: string;
}

interface VerifyResponse {
  success: boolean;
  session?: ApplicantSession;
  message?: string;
  error?: string;
}

/**
 * POST /api/applications/verify
 * Verify applicant's email matches an application
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<VerifyResponse>> {
  try {
    const body: VerifyRequest = await request.json();
    const { applicationId, email } = body;

    // Validate required fields
    if (!applicationId || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Application ID and email are required",
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

    // Verify email matches (case-insensitive)
    if (application?.email.toLowerCase() !== email.toLowerCase().trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Email does not match this application",
        },
        { status: 401 },
      );
    }

    // Create session object
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    const session: ApplicantSession = {
      applicationId,
      email: email.toLowerCase().trim(),
      verifiedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        session,
        message: "Access verified successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ Error verifying access:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to verify access",
      },
      { status: 500 },
    );
  }
}
