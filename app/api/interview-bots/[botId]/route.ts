import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

// GET /api/interview-bots/[botId] - Get interview bot by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> },
) {
  try {
    const { botId } = await params;

    if (!botId) {
      return NextResponse.json(
        { error: "Bot ID is required" },
        { status: 400 },
      );
    }

    // Fetch the interview bot from Firestore
    const adminDb = await getAdminFirestore();
    const botDoc = await adminDb.collection("interviewBots").doc(botId).get();

    if (!botDoc.exists) {
      return NextResponse.json(
        { error: "Interview bot not found" },
        { status: 404 },
      );
    }

    const botData = botDoc.data();

    return NextResponse.json({
      id: botDoc.id,
      ...botData,
    });
  } catch (error) {
    console.error("Error fetching interview bot:", error);
    return NextResponse.json(
      { error: "Failed to fetch interview bot" },
      { status: 500 },
    );
  }
}

// PUT /api/interview-bots/[botId] - Update interview bot
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> },
) {
  try {
    const { botId } = await params;

    if (!botId) {
      return NextResponse.json(
        { error: "Bot ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();

    // Update the interview bot in Firestore
    const adminDb = await getAdminFirestore();
    await adminDb
      .collection("interviewBots")
      .doc(botId)
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      message: "Interview bot updated successfully",
      botId,
    });
  } catch (error) {
    console.error("Error updating interview bot:", error);
    return NextResponse.json(
      { error: "Failed to update interview bot" },
      { status: 500 },
    );
  }
}
