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

    const data = interviewDoc.data();

    return NextResponse.json({
      interviewId: interviewDoc.id,
      prequalificationAnalysis: data?.prequalificationAnalysis || null,
      summary: data?.summary || null,
      behavioralInsights: data?.behavioralInsights || null,
      analysisCompletedAt: data?.analysisCompletedAt || null,
      hasAnalysis: !!(
        data?.prequalificationAnalysis ||
        data?.summary ||
        data?.behavioralInsights
      ),
    });
  } catch (error) {
    console.error("Error fetching analysis:", error);
    return NextResponse.json(
      { error: "Failed to fetch analysis" },
      { status: 500 },
    );
  }
}
