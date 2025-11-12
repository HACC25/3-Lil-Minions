import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import {
  analyzePrequalifications,
  generateTranscriptSummary,
  analyzeBehavioralInsights,
} from "@/utils/agents";

export async function POST(request: NextRequest) {
  try {
    const { interviewId, transcript } = await request.json();

    if (!interviewId) {
      return NextResponse.json(
        { error: "Interview ID is required" },
        { status: 400 },
      );
    }

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 },
      );
    }

    console.log(`Running complete analysis for interview: ${interviewId}...`);

    // Run all analyses in parallel for faster processing
    const [prequalificationAnalysis, summary, behavioralInsights] =
      await Promise.all([
        analyzePrequalifications(transcript),
        generateTranscriptSummary(transcript),
        analyzeBehavioralInsights(transcript),
      ]);

    // Save all results to Firestore
    const db = await getAdminFirestore();
    const interviewRef = db.collection("interviews").doc(interviewId);

    await interviewRef.set(
      {
        prequalificationAnalysis,
        summary,
        behavioralInsights,
        analysisCompletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    console.log(`✅ Complete analysis saved for interview: ${interviewId}`);

    return NextResponse.json({
      success: true,
      interviewId,
      analysis: {
        prequalificationAnalysis,
        summary,
        behavioralInsights,
      },
    });
  } catch (error) {
    console.error("Error running complete analysis:", error);
    return NextResponse.json(
      {
        error: "Failed to complete analysis",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
