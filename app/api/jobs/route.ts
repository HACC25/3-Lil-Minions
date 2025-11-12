/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// Request body interface
// interface CreateJobRequest {
//   companyId: string;
//   title: string;
//   description: string;
//   location: string;
//   locationType: "onsite" | "remote" | "hybrid";
//   type: "Full-time" | "Part-time" | "Contract" | "Internship";
//   salaryMin?: string;
//   salaryMax?: string;
//   salaryCurrency: string;
//   salaryPeriod: "hourly" | "yearly" | "monthly";
//   category?: string;
//   requirements?: string;
//   responsibilities?: string;
//   status: "draft" | "active";
// }
interface CreateJobRequest {
  // Basic Information
  companyId: string;
  title: string;
  positionNumber: string;
  recruitmentType: string;
  department: string;
  division: string;
  location: string;
  island: string;

  // Salary and Benefits
  salaryRange: {
    min: number;
    max: number;
    frequency: string;
  };

  // Position Details
  openingDate: string;
  closingDate: string;
  positionCount: number;

  // Requirements
  minimumQualifications: {
    education: string;
    experience: string;
    specialRequirements: string[];
  };

  // Duties and Responsibilities
  duties: string[];

  // Supplemental Information
  supplementalInfo: string;

  // Application Requirements
  requiredDocuments: string[];

  // Contact Information
  contact: {
    name: string;
    email: string;
    phone: string;
  };

  // Additional
  examType: string;
  employmentType: string;
  workSchedule: string;
  status: "draft" | "active";

  // Supplemental Questions
  supplementalQuestions?: Array<{
    id: string;
    question: string;
    type: "short_answer" | "dropdown" | "checkbox";
    required: boolean;
    options?: string[];
  }>;
}

// Response interface
interface CreateJobResponse {
  success: boolean;
  jobId?: string;
  message?: string;
  error?: string;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<CreateJobResponse>> {
  console.log("🚀 Create job API called");

  try {
    // Parse request body
    const body: CreateJobRequest = await request.json();
    const {
      companyId,
      title,
      positionNumber,
      recruitmentType,
      department,
      division,
      location,
      island,
      salaryRange,
      openingDate,
      closingDate,
      positionCount,
      minimumQualifications,
      duties,
      supplementalInfo,
      requiredDocuments,
      contact,
      examType,
      employmentType,
      workSchedule,
      status,
      supplementalQuestions,
    } = body;

    // Validate required fields
    if (!companyId || !title || !department || !location) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: companyId, title, department, and location are required",
        },
        { status: 400 },
      );
    }

    // Validate job title length
    if (title.trim().length < 3) {
      return NextResponse.json(
        {
          success: false,
          error: "Job title must be at least 3 characters long",
        },
        { status: 400 },
      );
    }

    // Validate duties
    if (!duties || duties.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one duty must be specified",
        },
        { status: 400 },
      );
    }

    // Validate dates
    if (openingDate && closingDate) {
      const opening = new Date(openingDate);
      const closing = new Date(closingDate);
      if (closing <= opening) {
        return NextResponse.json(
          {
            success: false,
            error: "Closing date must be after opening date",
          },
          { status: 400 },
        );
      }
    }

    const firestore = await getAdminFirestore();

    // Step 1: Verify company exists
    const companyDoc = await firestore
      .collection("companies")
      .doc(companyId)
      .get();

    if (!companyDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Company not found",
        },
        { status: 404 },
      );
    }

    const companyData = companyDoc.data();

    // Step 2: Create job document
    const jobRef = firestore.collection("jobs").doc();
    const jobId = jobRef.id;

    // Generate search keywords for better searchability
    const searchKeywords = [
      title.toLowerCase(),
      ...(department ? [department.toLowerCase()] : []),
      ...(division ? [division.toLowerCase()] : []),
      ...(recruitmentType ? [recruitmentType.toLowerCase()] : []),
      location.toLowerCase(),
      ...(island ? [island.toLowerCase()] : []),
      ...(employmentType ? [employmentType.toLowerCase()] : []),
    ];

    // Build job data object
    const jobData: any = {
      id: jobId,
      companyId,

      // Denormalized company data
      companyName: companyData?.companyName || "",
      companyWebsite: companyData?.website || null,

      // Basic Information
      title: title.trim(),
      positionNumber: positionNumber || null,
      recruitmentType: recruitmentType || null,
      department: department.trim(),
      division: division?.trim() || null,
      location: location.trim(),
      island: island?.trim() || null,

      // Salary and Benefits
      salaryRange: salaryRange
        ? {
            min: Number(salaryRange.min) || 0,
            max: Number(salaryRange.max) || 0,
            frequency: salaryRange.frequency || "Monthly",
          }
        : null,

      // Position Details
      openingDate: openingDate
        ? Timestamp.fromDate(new Date(openingDate))
        : null,
      closingDate:
        closingDate && closingDate !== "continuous"
          ? Timestamp.fromDate(new Date(closingDate))
          : closingDate === "continuous"
            ? "continuous"
            : null,
      positionCount: Number(positionCount) || 1,

      // Requirements
      minimumQualifications: minimumQualifications
        ? {
            education: minimumQualifications.education || "",
            experience: minimumQualifications.experience || "",
            specialRequirements:
              minimumQualifications.specialRequirements || [],
          }
        : {
            education: "",
            experience: "",
            specialRequirements: [],
          },

      // Duties and Responsibilities
      duties: duties || [],

      // Supplemental Information
      supplementalInfo: supplementalInfo?.trim() || null,

      // Application Requirements
      requiredDocuments: requiredDocuments || [],

      // Contact Information
      contact: contact
        ? {
            name: contact.name || "",
            email: contact.email || "",
            phone: contact.phone || "",
          }
        : null,

      // Additional
      examType: examType || null,
      employmentType: employmentType || null,
      workSchedule: workSchedule || null,

      // Supplemental Questions
      supplementalQuestions: supplementalQuestions || [],

      // Status & Metadata
      status: status || "draft",
      applicants: 0,
      views: 0,

      // Dates
      postedDate: status === "active" ? Timestamp.now() : null,
      lastModified: Timestamp.now(),
      createdAt: Timestamp.now(),

      // Search
      searchKeywords,
    };

    try {
      await jobRef.set(jobData);
      console.log(`✅ Job document created: ${jobId}`);
    } catch (error: any) {
      console.error("❌ Error creating job document:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create job posting",
        },
        { status: 500 },
      );
    }

    // Step 3: Update company document
    try {
      const companyJobs = companyData?.jobs || [];
      const activeJobsCount = companyData?.activeJobsCount || 0;
      const totalJobsCount = companyData?.totalJobsCount || 0;

      await firestore
        .collection("companies")
        .doc(companyId)
        .update({
          jobs: [...companyJobs, jobId],
          activeJobsCount:
            status === "active" ? activeJobsCount + 1 : activeJobsCount,
          totalJobsCount: totalJobsCount + 1,
          updatedAt: Timestamp.now(),
        });

      console.log(`✅ Company document updated: ${companyId}`);
    } catch (error) {
      console.error("❌ Error updating company document:", error);

      // Rollback: delete the job document
      try {
        await jobRef.delete();
        console.log("🔄 Rolled back job creation");
      } catch (deleteError) {
        console.error("❌ Failed to rollback job creation:", deleteError);
      }

      return NextResponse.json(
        {
          success: false,
          error: "Failed to update company profile",
        },
        { status: 500 },
      );
    }

    // Success response
    console.log(`✅ Job created successfully: ${jobId}`);
    return NextResponse.json(
      {
        success: true,
        jobId,
        message: `Job ${status === "active" ? "published" : "saved as draft"} successfully`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("❌ Unexpected error in create job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while creating the job",
      },
      { status: 500 },
    );
  }
}

// GET endpoint to fetch jobs
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "100");

    console.log("🔍 Fetching jobs with filters:", { companyId, status, limit });

    const firestore = await getAdminFirestore();
    let query = firestore.collection("jobs");

    // Filter by companyId if provided
    if (companyId) {
      query = query.where("companyId", "==", companyId) as any;
    }

    // Filter by status if provided
    if (status) {
      query = query.where("status", "==", status) as any;
    }

    // Only add orderBy and limit if no filters (to avoid composite index requirement)
    if (!companyId && !status) {
      query = query.orderBy("createdAt", "desc").limit(limit) as any;
    }

    const snapshot = await query.get();
    console.log(`✅ Found ${snapshot.docs.length} jobs`);

    const jobs = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to ISO strings for serialization
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        postedDate:
          data.postedDate?.toDate?.()?.toISOString() || data.postedDate,
        lastModified:
          data.lastModified?.toDate?.()?.toISOString() || data.lastModified,
        expiresDate:
          data.expiresDate?.toDate?.()?.toISOString() || data.expiresDate,
        openingDate:
          data.openingDate?.toDate?.()?.toISOString() || data.openingDate,
        closingDate:
          data.closingDate === "continuous"
            ? "continuous"
            : data.closingDate?.toDate?.()?.toISOString() || data.closingDate,
      };
    });

    // Sort in memory if we have filters
    if (companyId || status) {
      jobs.sort((a: any, b: any) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    }

    return NextResponse.json(
      {
        success: true,
        jobs,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ Error fetching jobs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch jobs",
      },
      { status: 500 },
    );
  }
}
