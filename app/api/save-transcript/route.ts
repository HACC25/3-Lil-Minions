// app/api/save-transcript/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "../../../lib/firebase-admin";

interface TranscriptData {
  interviewId: string;
  transcript: string;
  botName: string;
  interviewType: string;
  duration: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: TranscriptData = await req.json();

    const { interviewId, transcript, botName, interviewType, duration } = body;

    // Validate required fields
    if (!interviewId || !transcript) {
      return NextResponse.json(
        { error: "Interview ID and transcript are required" },
        { status: 400 },
      );
    }

    console.log("💾 Saving transcript for interview:", interviewId);

    // Get Firestore instance
    const db = await getAdminFirestore();

    // Create document reference using interviewId as document ID
    const docRef = db.collection("interviews").doc(interviewId);

    // Prepare data to save
    const dataToSave = {
      eventId: interviewId,
      transcript: transcript,
      botName: botName || "Event Planning Assistant",
      interviewType: interviewType || "Event Planning Consultation",
      duration: duration || 0,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    // Save to Firestore using Admin SDK
    await docRef.set(dataToSave);

    console.log(`✅ Transcript saved successfully with ID: ${interviewId}`);

    // Update the application document with interviewCompleted: true
    try {
      const applicationRef = db.collection("applications").doc(interviewId);
      const applicationDoc = await applicationRef.get();

      if (applicationDoc.exists) {
        await applicationRef.update({
          interviewCompleted: true,
          interviewCompletedAt: new Date().toISOString(),
        });
        console.log(
          `✅ Application ${interviewId} marked as interview completed`,
        );
      } else {
        console.warn(
          `⚠️ Application document ${interviewId} not found for interview completion update`,
        );
      }
    } catch (appError) {
      console.error(
        "❌ Error updating application interviewCompleted field:",
        appError,
      );
      // Don't fail the entire request if application update fails
    }

    return NextResponse.json(
      {
        success: true,
        interviewId: interviewId,
        message: "Transcript saved successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Error saving transcript:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: "Failed to save transcript",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
