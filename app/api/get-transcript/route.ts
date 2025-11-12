import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const interviewId = searchParams.get("interviewId");

    if (!interviewId) {
      return NextResponse.json(
        { error: "Interview ID is required" },
        { status: 400 },
      );
    }

    const db = await getAdminFirestore();
    const interviewRef = db.collection("interviews").doc(interviewId);
    const interviewDoc = await interviewRef.get();

    if (!interviewDoc.exists) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 },
      );
    }

    const interviewData = interviewDoc.data();

    // Try to fetch applicant name from applications collection
    let applicantName = "Applicant";
    try {
      const applicationRef = db.collection("applications").doc(interviewId);
      const applicationDoc = await applicationRef.get();

      if (applicationDoc.exists) {
        const appData = applicationDoc.data();
        if (appData?.firstName && appData?.lastName) {
          applicantName = `${appData.firstName} ${appData.lastName}`;
        } else if (appData?.firstName) {
          applicantName = appData.firstName;
        }
      }
    } catch (error) {
      console.warn("Could not fetch applicant name:", error);
      // Continue with default name
    }

    return NextResponse.json({
      interviewId: interviewDoc.id,
      transcript: interviewData?.transcript || "",
      botName: interviewData?.botName || "Unknown",
      interviewType: interviewData?.interviewType || "Unknown",
      duration: interviewData?.duration || 0,
      timestamp: interviewData?.timestamp || null,
      applicantName,
    });
  } catch (error) {
    console.error("Error fetching transcript:", error);
    return NextResponse.json(
      { error: "Failed to fetch transcript" },
      { status: 500 },
    );
  }
}
