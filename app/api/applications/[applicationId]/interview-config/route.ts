import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  try {
    const { applicationId } = await params;

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 },
      );
    }

    const db = await getAdminFirestore();

    // 1. Fetch the application to get the jobId
    const applicationDoc = await db
      .collection("applications")
      .doc(applicationId)
      .get();

    if (!applicationDoc.exists) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    const applicationData = applicationDoc.data();
    const jobId = applicationData?.jobId;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID not found in application" },
        { status: 404 },
      );
    }

    // 2. Fetch the job to get the interviewBotId
    const jobDoc = await db.collection("jobs").doc(jobId).get();

    if (!jobDoc.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const jobData = jobDoc.data();
    const interviewBotId = jobData?.interviewBotId;

    // 3. If no interviewBotId, return null to indicate use hardcoded bot
    if (!interviewBotId) {
      return NextResponse.json({
        useHardcodedBot: true,
        interviewBotId: null,
        config: null,
      });
    }

    // 4. Fetch the interview bot configuration
    const botDoc = await db
      .collection("interviewBots")
      .doc(interviewBotId)
      .get();

    if (!botDoc.exists) {
      return NextResponse.json(
        { error: "Interview bot not found" },
        { status: 404 },
      );
    }

    const botData = botDoc.data();

    // 5. Return the bot configuration
    return NextResponse.json({
      useHardcodedBot: false,
      interviewBotId,
      config: {
        agent_id: botData?.agent_id,
        botName: botData?.botName,
        description: botData?.description,
        interviewType: botData?.interviewType,
        // Include other relevant fields
        botPersonality: botData?.botPersonality,
        companyDescription: botData?.companyDescription,
        jobRoleDescription: botData?.jobRoleDescription,
        avatarConfig: botData?.avatarConfig,
      },
    });
  } catch (error) {
    console.error("Error fetching interview config:", error);
    return NextResponse.json(
      { error: "Failed to fetch interview configuration" },
      { status: 500 },
    );
  }
}
