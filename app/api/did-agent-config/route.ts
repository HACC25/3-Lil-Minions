// /app/api/did-avatar-config/route.ts (Next.js App Router)

import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../../../firebaseConfig/firebase";

interface DIDConfigResponse {
  agentId: string;
  clientKey: string;
  metadata: {
    botName: string;
    interviewType: string;
    avatarType: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { interviewId } = await request.json();

    if (!interviewId) {
      return NextResponse.json(
        { error: "Interview ID is required" },
        { status: 400 },
      );
    }

    console.log("🔍 Processing DID avatar config request:", {
      interviewId: interviewId.slice(0, 8) + "...",
    });

    // Step 1: Fetch interview data from Firebase
    const docRef = doc(firestore, "InterviewBots", interviewId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.error(`❌ Interview document not found: ${interviewId}`);
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 },
      );
    }

    const sessionData = docSnap.data();

    console.log("📋 Interview session data found:", {
      interviewType: sessionData.interviewType,
      botName: sessionData.botName,
      hasDIDConfig: !!sessionData["DID-avatarConfig"],
    });

    // Step 2: Extract agentId from DID-avatarConfig field
    const agentId = sessionData["DID-avatarConfig"];

    if (!agentId || typeof agentId !== "string") {
      console.warn(
        `⚠️ No valid DID-avatarConfig found for interview: ${interviewId}`,
      );
      return NextResponse.json(
        { error: "No D-ID avatar configured for this interview" },
        { status: 404 },
      );
    }

    console.log("🔍 Found agentId:", {
      agentId: agentId.slice(0, 8) + "...",
    });

    // Step 3: Fetch clientKey from DID-Avatars collection
    const avatarDocRef = doc(firestore, "DID-Avatars", agentId);
    const avatarDocSnap = await getDoc(avatarDocRef);

    if (!avatarDocSnap.exists()) {
      console.error(`❌ D-ID avatar not found: ${agentId}`);
      return NextResponse.json(
        {
          error: `D-ID avatar '${agentId}' not found in DID-Avatars collection`,
        },
        { status: 404 },
      );
    }

    const avatarData = avatarDocSnap.data();

    if (!avatarData.clientKey) {
      console.error(
        `❌ Invalid avatar configuration for ${agentId}: missing clientKey`,
      );
      return NextResponse.json(
        { error: "Invalid D-ID avatar configuration: missing clientKey" },
        { status: 400 },
      );
    }

    console.log("✅ Found clientKey for agent:", {
      agentId: agentId.slice(0, 8) + "...",
      hasClientKey: !!avatarData.clientKey,
    });

    // Step 4: Build response
    const configResponse: DIDConfigResponse = {
      agentId: agentId,
      clientKey: avatarData.clientKey,
      metadata: {
        botName: sessionData.botName || "Interview Assistant",
        interviewType: sessionData.interviewType || "General",
        avatarType: sessionData.avatarType || "hr_interviewer",
      },
    };

    console.log("📤 Returning DID avatar configuration:", {
      agentId: configResponse.agentId.slice(0, 8) + "...",
      botName: configResponse.metadata.botName,
      avatarType: configResponse.metadata.avatarType,
    });

    return NextResponse.json(configResponse);
  } catch (error) {
    console.error("❌ Error fetching DID avatar config:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 },
    );
  }
}

// GET method for testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const interviewId = searchParams.get("interviewId");

  if (!interviewId) {
    return NextResponse.json(
      { error: "Interview ID is required as query parameter" },
      { status: 400 },
    );
  }

  // Reuse the POST logic
  const mockRequest = {
    json: async () => ({ interviewId }),
  } as NextRequest;

  return POST(mockRequest);
}

// Force dynamic rendering
export const dynamic = "force-dynamic";
