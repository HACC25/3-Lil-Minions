// app/api/check-eligibility/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "../../../lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { applicantId } = await req.json();

    if (!applicantId) {
      return NextResponse.json(
        { error: "Applicant ID is required" },
        { status: 400 },
      );
    }

    console.log("🔍 Checking eligibility for applicant:", applicantId);

    // Get Firestore instance
    const db = await getAdminFirestore();

    // Get applicant document
    const applicantDoc = await db
      .collection("applications")
      .doc(applicantId)
      .get();

    if (!applicantDoc.exists) {
      console.warn("⚠️ Applicant not found:", applicantId);
      return NextResponse.json(
        {
          eligible: false,
          error: "Applicant not found",
        },
        { status: 404 },
      );
    }

    const applicantData = applicantDoc.data();
    const eligibleForSecondRound =
      applicantData?.eligibleForSecondRound === true;
    const interviewCompleted = applicantData?.interviewCompleted === true;

    console.log(
      `${eligibleForSecondRound ? "✅" : "❌"} Applicant eligibility:`,
      eligibleForSecondRound,
    );
    console.log(
      `${interviewCompleted ? "✅" : "❌"} Interview completed:`,
      interviewCompleted,
    );

    // If interview is already completed, they cannot access it again
    if (interviewCompleted) {
      return NextResponse.json(
        {
          eligible: false,
          interviewCompleted: true,
          error: "Interview has already been completed",
          applicantId: applicantId,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        eligible: eligibleForSecondRound,
        interviewCompleted: false,
        applicantId: applicantId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Error checking eligibility:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: "Failed to check eligibility",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
