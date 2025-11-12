import { NextRequest, NextResponse } from "next/server";
import { generateInterviewBotFromJobPosting } from "@/utils/agents/interviewBotExtractor";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.jobTitle && !body.title) {
      return NextResponse.json(
        {
          success: false,
          error: "Job title is required",
        },
        { status: 400 },
      );
    }

    if (!body.companyName) {
      return NextResponse.json(
        {
          success: false,
          error: "Company/Department name is required",
        },
        { status: 400 },
      );
    }

    // Prepare job posting data
    const jobPostingData = {
      jobTitle: body.jobTitle || body.title,
      jobDescription: body.jobDescription || body.description,
      requirements: body.requirements,
      responsibilities: body.responsibilities,
      companyDescription: body.companyDescription,
      companyIndustry: body.companyIndustry || body.industry,
      salary: body.salary || body.salaryRange,
      location: body.location,
      employmentType: body.employmentType || body.type,
      companyName: body.companyName,
      department: body.department,
      minimumQualifications: body.minimumQualifications,
      duties: body.duties,
    };

    console.log("📋 Processing job posting for interview bot creation:", {
      jobTitle: jobPostingData.jobTitle,
      department: jobPostingData.department,
    });

    // Generate interview bot configuration
    const interviewBotData =
      await generateInterviewBotFromJobPosting(jobPostingData);

    console.log(
      "✅ Successfully generated interview bot configuration:",
      interviewBotData.botName,
    );

    return NextResponse.json(
      {
        success: true,
        interviewBotData,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Error extracting interview data:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract interview data",
      },
      { status: 500 },
    );
  }
}
