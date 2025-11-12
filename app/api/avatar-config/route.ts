// /app/api/avatar-config/route.ts (Next.js App Router)

import { NextRequest, NextResponse } from "next/server";

interface AvatarConfigResponse {
  avatarName: string;
  quality: string;
  voice: {
    rate: number;
    emotion: string;
    model?: string;
  };
  language: string;
  sttSettings: {
    provider: string;
  };
  disableIdleTimeout: boolean;
  metadata: {
    botName: string;
    interviewType: string;
    avatarType: string;
  };
}

// Default configuration
const DEFAULT_CONFIG: AvatarConfigResponse = {
  avatarName: "June_HR_public",
  quality: "low",
  voice: {
    rate: 1.5,
    emotion: "friendly",
    model: "eleven_flash_v2_5",
  },
  language: "en",
  sttSettings: {
    provider: "deepgram",
  },
  disableIdleTimeout: true,
  metadata: {
    botName: "Event Planning Assistant",
    interviewType: "Event Planning Consultation",
    avatarType: "event_planner",
  },
};

export async function POST(request: NextRequest) {
  try {
    const { interviewId } = await request.json();

    console.log("🔍 Processing avatar config request:", {
      interviewId: interviewId ? interviewId.slice(0, 8) + "..." : "N/A",
    });

    console.log("✅ Returning default avatar configuration");

    return NextResponse.json(DEFAULT_CONFIG);
  } catch (error) {
    console.error("❌ Error processing avatar config request:", error);

    // Return default configuration on error
    return NextResponse.json(DEFAULT_CONFIG, { status: 200 });
  }
}
