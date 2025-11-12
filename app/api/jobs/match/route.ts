/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { processJobMatching } from "@/utils/matching-processor";
import type { MatchingConfig } from "@/utils/matching/types";

/**
 * Response interface for job matching
 */
interface JobMatchingResponse {
  success: boolean;
  matches?: any[];
  totalJobsAnalyzed?: number;
  processingTime?: number;
  method?: string;
  sessionId?: string;
  cached?: boolean;
  error?: string;
}

/**
 * POST /api/jobs/match
 * Match a candidate's resume with available jobs
 * Public endpoint - allows candidates to upload resume and get matched jobs
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<JobMatchingResponse>> {
  console.log("🎯 Job matching API called");

  try {
    // Parse FormData
    const formData = await request.formData();

    // Get required fields
    const resumeFile = formData.get("resume") as File | null;
    const companyId = formData.get("companyId") as string;
    const interestsStr = formData.get("interests") as string;

    // Optional fields
    const userId = formData.get("userId") as string | null;
    const sessionId = formData.get("sessionId") as string | null;
    const configStr = formData.get("config") as string | null;

    // Validate required fields
    if (!resumeFile || resumeFile.size === 0) {
      console.log("❌ Missing resume file");
      return NextResponse.json(
        {
          success: false,
          error: "Resume file is required",
        },
        { status: 400 },
      );
    }

    if (!companyId) {
      console.log("❌ Missing companyId");
      return NextResponse.json(
        {
          success: false,
          error: "Company ID is required",
        },
        { status: 400 },
      );
    }

    // Validate file size (10MB max)
    if (resumeFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: "Resume file must be less than 10MB",
        },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(resumeFile.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Resume must be a PDF or Word document",
        },
        { status: 400 },
      );
    }

    // Parse interests
    let interests: string[] = [];
    try {
      interests = interestsStr ? JSON.parse(interestsStr) : [];
    } catch (error) {
      console.error("Failed to parse interests:", error);
      interests = [];
    }

    // Parse config (optional)
    let config: MatchingConfig | undefined;
    try {
      config = configStr ? JSON.parse(configStr) : undefined;
    } catch (error) {
      console.error("Failed to parse config:", error);
      config = undefined;
    }

    console.log(
      `📄 Processing resume: ${resumeFile.name} (${resumeFile.size} bytes)`,
    );
    console.log(`🏢 Company ID: ${companyId}`);
    console.log(`💼 Interests: ${interests.join(", ")}`);

    // Convert File to Buffer
    const fileBuffer = await resumeFile.arrayBuffer();
    const resumeBuffer = Buffer.from(fileBuffer);

    console.log("🚀 Starting job matching process...");

    // Process job matching
    const result = await processJobMatching(resumeBuffer, interests, {
      userId: userId || undefined,
      companyId,
      config,
      cacheResults: true,
      sessionId: sessionId || undefined,
    });

    console.log(
      `✅ Matching complete! Found ${result.results.matches.length} matches in ${result.results.processingTime}ms`,
    );

    return NextResponse.json(
      {
        success: true,
        matches: result.results.matches,
        totalJobsAnalyzed: result.results.totalJobsAnalyzed,
        processingTime: result.results.processingTime,
        method: result.results.method,
        sessionId: result.sessionId,
        cached: result.cached,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Job matching failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during job matching",
      },
      { status: 500 },
    );
  }
}
