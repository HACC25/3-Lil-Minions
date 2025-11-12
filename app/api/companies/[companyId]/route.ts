import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  try {
    const { companyId } = await params;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Company ID is required" },
        { status: 400 },
      );
    }

    // Get company data from Firestore
    const firestore = await getAdminFirestore();
    const companyDoc = await firestore
      .collection("companies")
      .doc(companyId)
      .get();

    if (!companyDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 },
      );
    }

    const companyData = companyDoc.data();

    return NextResponse.json(
      {
        success: true,
        ...companyData,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Error fetching company:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch company data",
      },
      { status: 500 },
    );
  }
}
