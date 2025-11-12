/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

interface ApplicationSummary {
  id: string;
  jobTitle: string;
  companyName: string;
  status: string;
  appliedAt: string;
}

interface ByEmailResponse {
  success: boolean;
  applications?: ApplicationSummary[];
  count?: number;
  error?: string;
}

/**
 * GET /api/applications/by-email?email=john@example.com
 * Search applications by email (public endpoint for /track page)
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<ByEmailResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    // Validate email parameter
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Email parameter is required",
        },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format",
        },
        { status: 400 },
      );
    }
    const firestore = await getAdminFirestore();

    // Query applications by email
    const snapshot = await firestore
      .collection("applications")
      .where("email", "==", email.toLowerCase().trim())
      .orderBy("appliedAt", "desc")
      .get();

    // Map to summary format (don't expose full details)
    const applications: ApplicationSummary[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        jobTitle: data.jobTitle || "Unknown Position",
        companyName: data.companyName || "Unknown Company",
        status: data.status || "pending",
        appliedAt: data.appliedAt?.toDate?.()?.toISOString() || data.appliedAt,
      };
    });

    return NextResponse.json(
      {
        success: true,
        applications,
        count: applications.length,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ Error searching applications:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to search applications",
      },
      { status: 500 },
    );
  }
}
