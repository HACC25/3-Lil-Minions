/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("📥 Interview bot API received jobId:", body.jobId);
    console.log("📋 Full request body keys:", Object.keys(body));

    // Validate required fields
    const requiredFields = [
      "author_id",
      "botName",
      "description",
      "interviewType",
      "companyDescription",
      "companyIndustry",
      "jobRoleDescription",
      "botPersonality",
      "agent_id",
      "created_by",
    ];

    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate questions
    if (
      !body.questions ||
      !body.questions.technical ||
      !body.questions.general ||
      !body.questions.behavioral ||
      !body.questions.preQualification
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Questions object with all categories is required",
        },
        { status: 400 },
      );
    }

    // Validate avatarConfig
    if (!body.avatarConfig || !body.avatarConfig.avatarName) {
      return NextResponse.json(
        {
          success: false,
          error: "Avatar configuration is required",
        },
        { status: 400 },
      );
    }

    // Prepare the document data
    const docData: any = {
      author_id: body.author_id,
      botName: body.botName,
      description: body.description,
      interviewType: body.interviewType,
      logo: body.logo || null,
      companyDescription: body.companyDescription,
      companyIndustry: body.companyIndustry,
      jobRoleDescription: body.jobRoleDescription,
      salary: body.salary || "",
      botPersonality: body.botPersonality,
      questions: {
        technical: body.questions.technical || [],
        general: body.questions.general || [],
        behavioral: body.questions.behavioral || [],
        preQualification: body.questions.preQualification || [],
      },
      scoringCriteria: body.scoringCriteria || [],
      allQuestions: body.allQuestions || [],
      avatarConfig: body.avatarConfig,
      agent_id: body.agent_id,
      "DID-avatarConfig": body["DID-avatarConfig"] || "v2_agt_sPmnoiGp",
      created_at: FieldValue.serverTimestamp(),
      created_by: body.created_by,
      jobId: body.jobId || null, // Link to job posting
    };

    // Add optional fields if present
    if (body.restricted !== undefined) {
      docData.restricted = body.restricted;
    }

    if (body.extractionMetadata) {
      docData.extractionMetadata = body.extractionMetadata;
    }

    console.log("💾 About to save interview bot with jobId:", docData.jobId);

    // Add to Firestore
    const firestore = await getAdminFirestore();
    const docRef = await firestore.collection("interviewBots").add(docData);

    console.log("✅ Interview bot created successfully:", docRef.id);
    console.log("🔗 Linked to job:", docData.jobId);

    return NextResponse.json(
      {
        success: true,
        id: docRef.id,
        message: "Interview bot created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("❌ Error creating interview bot:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create interview bot",
      },
      { status: 500 },
    );
  }
}

// Optional: GET endpoint to fetch all interview bots for a company
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const authorId = searchParams.get("authorId");

    if (!authorId) {
      return NextResponse.json(
        { success: false, error: "Author ID is required" },
        { status: 400 },
      );
    }

    const firestore = await getAdminFirestore();
    const botsSnapshot = await firestore
      .collection("interviewBots")
      .where("author_id", "==", authorId)
      .orderBy("created_at", "desc")
      .get();

    const bots = botsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(
      {
        success: true,
        bots,
        count: bots.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Error fetching interview bots:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch interview bots",
      },
      { status: 500 },
    );
  }
}
