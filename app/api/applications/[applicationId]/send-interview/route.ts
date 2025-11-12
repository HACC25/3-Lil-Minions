import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { sendInterviewInvitation } from "@/lib/email/interviewInvitation";

interface SendInterviewResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * POST /api/applications/[applicationId]/send-interview
 * Manually send interview invitation to an applicant
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
): Promise<NextResponse<SendInterviewResponse>> {
  try {
    const { applicationId } = await params;

    if (!applicationId) {
      return NextResponse.json(
        {
          success: false,
          error: "Application ID is required",
        },
        { status: 400 },
      );
    }

    console.log(`[${applicationId}] Manual interview invitation requested`);

    const firestore = await getAdminFirestore();

    // Step 1: Fetch the application
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

    const appData = appDoc.data();

    // Step 2: Validate required data
    if (!appData?.email || !appData?.firstName || !appData?.lastName) {
      return NextResponse.json(
        {
          success: false,
          error: "Application is missing required applicant information",
        },
        { status: 400 },
      );
    }

    // Step 3: Fetch job details for email
    const jobDoc = await firestore.collection("jobs").doc(appData.jobId).get();

    if (!jobDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Associated job not found",
        },
        { status: 404 },
      );
    }

    const jobData = jobDoc.data();

    // Step 4: Generate interview link
    const baseUrl = "https://banana.hexcelerate.app";
    const interviewLink = `${baseUrl}/interviews/setup/${applicationId}`;

    // Step 5: Prepare email data
    const applicantName = `${appData.firstName} ${appData.lastName}`;
    const jobTitle = jobData?.title || "the position";
    const companyName = jobData?.companyName || "our company";
    const fitScore = appData.fitScore || 0;

    console.log(
      `[${applicationId}] Sending manual interview invitation to ${appData.email}`,
    );

    // Step 6: Send the email
    try {
      await sendInterviewInvitation(
        appData.email,
        applicantName,
        jobTitle,
        companyName,
        interviewLink,
        fitScore,
      );

      console.log(`[${applicationId}] ✅ Interview invitation sent`);
    } catch (emailError) {
      console.error(`[${applicationId}] ❌ Failed to send email:`, emailError);
      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to send email. Please check SendGrid configuration and try again.",
        },
        { status: 500 },
      );
    }

    // Step 7: Update application with manual invite tracking and eligibility
    await appDoc.ref.update({
      manualInviteSent: true,
      manualInviteSentAt: Timestamp.now(),
      eligibleForSecondRound: true, // Mark as eligible so they can access interview
      lastModified: Timestamp.now(),
    });

    console.log(
      `[${applicationId}] ✅ Manual invitation tracking updated and marked as eligible`,
    );

    return NextResponse.json(
      {
        success: true,
        message: `Interview invitation sent to ${applicantName} (${appData.email})`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Error in send-interview endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while sending the invitation",
      },
      { status: 500 },
    );
  }
}
