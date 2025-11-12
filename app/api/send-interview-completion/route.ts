import { NextRequest, NextResponse } from "next/server";
import { sendInterviewCompletionEmail } from "@/lib/email/interviewCompletion";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      candidateEmail,
      candidateName,
      jobTitle,
      companyName,
      interviewId,
    } = body;

    // Validate required fields
    if (
      !candidateEmail ||
      !candidateName ||
      !jobTitle ||
      !companyName ||
      !interviewId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    console.log(
      `📧 Sending interview completion email to ${candidateEmail}...`,
    );

    // Send the email
    await sendInterviewCompletionEmail(
      candidateEmail,
      candidateName,
      jobTitle,
      companyName,
      interviewId,
    );

    console.log("✅ Interview completion email sent successfully");

    return NextResponse.json(
      { success: true, message: "Interview completion email sent" },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Error sending interview completion email:", error);

    return NextResponse.json(
      {
        error: "Failed to send interview completion email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
