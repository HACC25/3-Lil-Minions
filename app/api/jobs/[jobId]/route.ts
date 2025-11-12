/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

// GET endpoint to fetch a single job by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
): Promise<NextResponse> {
  try {
    const { jobId } = await params;

    console.log("🔍 Fetching job:", jobId);

    const firestore = await getAdminFirestore();
    const jobDoc = await firestore.collection("jobs").doc(jobId).get();

    if (!jobDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 },
      );
    }

    const data = jobDoc.data();
    const job = {
      id: jobDoc.id,
      ...data,
      // Convert Firestore Timestamps to ISO strings for serialization
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || data?.createdAt,
      postedDate:
        data?.postedDate?.toDate?.()?.toISOString() || data?.postedDate,
      lastModified:
        data?.lastModified?.toDate?.()?.toISOString() || data?.lastModified,
      expiresDate:
        data?.expiresDate?.toDate?.()?.toISOString() || data?.expiresDate,
      openingDate:
        data?.openingDate?.toDate?.()?.toISOString() || data?.openingDate,
      closingDate:
        data?.closingDate?.toDate?.()?.toISOString() || data?.closingDate,
    };

    console.log("✅ Job found:", jobId);

    return NextResponse.json(
      {
        success: true,
        job,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ Error fetching job:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch job",
      },
      { status: 500 },
    );
  }
}

// PUT endpoint to update a job by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
): Promise<NextResponse> {
  try {
    const { jobId } = await params;
    const body = await request.json();

    console.log("🔄 Updating job:", jobId);

    const {
      companyId,
      // Basic Information
      title,
      positionNumber,
      recruitmentType,
      department,
      division,
      location,
      island,
      // Salary and Benefits
      salaryRange,
      // Position Details
      openingDate,
      closingDate,
      positionCount,
      // Requirements
      minimumQualifications,
      // Duties and Responsibilities
      duties,
      // Supplemental Information
      supplementalInfo,
      // Application Requirements
      requiredDocuments,
      // Contact Information
      contact,
      // Additional
      examType,
      employmentType,
      workSchedule,
      status,
      // Supplemental Questions
      supplementalQuestions,
    } = body;

    // Validate required fields
    if (!companyId || !title || !location || !department) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: companyId, title, location, and department are required",
        },
        { status: 400 },
      );
    }

    const firestore = await getAdminFirestore();

    // Check if job exists and belongs to the company
    const jobDoc = await firestore.collection("jobs").doc(jobId).get();

    if (!jobDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 },
      );
    }

    const existingJob = jobDoc.data();
    if (existingJob?.companyId !== companyId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized to update this job",
        },
        { status: 403 },
      );
    }

    // Generate search keywords for better searchability
    const searchKeywords = [
      title.toLowerCase(),
      positionNumber?.toLowerCase(),
      department.toLowerCase(),
      division?.toLowerCase(),
      location.toLowerCase(),
      island?.toLowerCase(),
      recruitmentType?.toLowerCase(),
      employmentType?.toLowerCase(),
    ].filter(Boolean);

    // Prepare update data
    const updateData: any = {
      title: title.trim(),
      positionNumber: positionNumber?.trim() || null,
      recruitmentType: recruitmentType || "Open Competitive",
      department: department.trim(),
      division: division?.trim() || null,
      location: location.trim(),
      island: island || "Oahu",
      salaryRange: salaryRange
        ? {
            min: Number(salaryRange.min) || 0,
            max: Number(salaryRange.max) || 0,
            frequency: salaryRange.frequency || "Monthly",
          }
        : null,
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
      minimumQualifications: minimumQualifications || {
        education: "",
        experience: "",
        specialRequirements: [],
      },
      duties: Array.isArray(duties) ? duties : [],
      supplementalInfo: supplementalInfo || "",
      requiredDocuments: Array.isArray(requiredDocuments)
        ? requiredDocuments
        : [],
      contact: contact || { name: "", email: "", phone: "" },
      examType: examType || "",
      employmentType: employmentType || "Full-Time",
      workSchedule: workSchedule || "",
      supplementalQuestions: supplementalQuestions || [],
      status: status || "draft",
      lastModified: Timestamp.now(),
      searchKeywords,
      // Update postedDate if status changed to active
      ...(status === "active" && existingJob?.status !== "active"
        ? { postedDate: Timestamp.now() }
        : {}),
    };

    await firestore.collection("jobs").doc(jobId).update(updateData);

    // Update company counters if status changed
    const oldStatus = existingJob?.status;
    if (oldStatus !== status) {
      const companyUpdateData: any = {};

      // If changing from non-active to active
      if (status === "active" && oldStatus !== "active") {
        companyUpdateData.activeJobsCount = FieldValue.increment(1);
      }
      // If changing from active to non-active
      else if (status !== "active" && oldStatus === "active") {
        companyUpdateData.activeJobsCount = FieldValue.increment(-1);
      }

      // Update company document if there are changes
      if (Object.keys(companyUpdateData).length > 0) {
        await firestore
          .collection("companies")
          .doc(companyId)
          .update(companyUpdateData);
        console.log("✅ Company counters updated for status change");
      }
    }

    console.log("✅ Job updated successfully:", jobId);

    return NextResponse.json(
      {
        success: true,
        jobId,
        message: "Job updated successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ Error updating job:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update job",
      },
      { status: 500 },
    );
  }
}

// PATCH endpoint for partial updates (e.g., linking interview bot)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
): Promise<NextResponse> {
  try {
    const { jobId } = await params;
    const body = await request.json();

    console.log("🔄 Patching job:", jobId, body);

    const firestore = await getAdminFirestore();

    // Check if job exists
    const jobDoc = await firestore.collection("jobs").doc(jobId).get();

    if (!jobDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 },
      );
    }

    // Prepare update data - only update fields that are provided
    const updateData: any = {
      lastModified: Timestamp.now(),
    };

    // Add interviewBotId if provided
    if (body.interviewBotId !== undefined) {
      updateData.interviewBotId = body.interviewBotId;
    }

    // Update the job document
    await firestore.collection("jobs").doc(jobId).update(updateData);

    console.log("✅ Job patched successfully:", jobId);

    return NextResponse.json(
      {
        success: true,
        jobId,
        message: "Job updated successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ Error patching job:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update job",
      },
      { status: 500 },
    );
  }
}

// DELETE endpoint to delete a job by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
): Promise<NextResponse> {
  try {
    const { jobId } = await params;

    console.log("🗑️ Deleting job:", jobId);

    const firestore = await getAdminFirestore();

    // Check if job exists and get job data
    const jobDoc = await firestore.collection("jobs").doc(jobId).get();

    if (!jobDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 },
      );
    }

    const jobData = jobDoc.data();
    const companyId = jobData?.companyId;
    const jobStatus = jobData?.status;

    // Delete the job
    await firestore.collection("jobs").doc(jobId).delete();

    // Update company document: remove job from array and decrement counters
    if (companyId) {
      const updateData: any = {
        jobs: FieldValue.arrayRemove(jobId),
        totalJobsCount: FieldValue.increment(-1),
      };

      // Decrement active job counter if the deleted job was active
      if (jobStatus === "active") {
        updateData.activeJobsCount = FieldValue.increment(-1);
      }

      await firestore.collection("companies").doc(companyId).update(updateData);

      console.log(
        "✅ Job removed from company and counters updated:",
        companyId,
      );
    }

    console.log("✅ Job deleted successfully:", jobId);

    return NextResponse.json(
      {
        success: true,
        message: "Job deleted successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ Error deleting job:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete job",
      },
      { status: 500 },
    );
  }
}
