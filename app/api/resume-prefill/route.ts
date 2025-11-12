/**
 * Resume Prefill API Route
 * Server-side endpoint for processing resume uploads and extracting data for form prefill
 */

import { NextRequest, NextResponse } from "next/server";
import { processResumeForPrefill } from "@/utils/resume-parser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, error: "Only PDF files are supported" },
        { status: 400 },
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size must be less than 10MB" },
        { status: 400 },
      );
    }

    console.log("📄 Processing resume upload:", file.name);

    // Process the resume (server-side with Groq API)
    const result = await processResumeForPrefill(file);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to process resume" },
        { status: 500 },
      );
    }

    console.log("✅ Resume processed successfully");

    return NextResponse.json({
      success: true,
      data: result.data,
      confidence: result.confidence,
    });
  } catch (error) {
    console.error("❌ Error in resume-prefill route:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process resume upload",
      },
      { status: 500 },
    );
  }
}
