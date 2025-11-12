/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// Request body interface
interface CompanySignupRequest {
  email: string;
  password: string;
  companyName: string;
  website?: string;
  industry?: string;
}

// Response interface
interface CompanySignupResponse {
  success: boolean;
  uid?: string;
  email?: string;
  message?: string;
  error?: string;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<CompanySignupResponse>> {
  console.log("🚀 Company signup API called");

  try {
    // Parse request body
    const body: CompanySignupRequest = await request.json();
    const { email, password, companyName, website, industry } = body;

    // Validate required fields
    if (!email || !password || !companyName) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: email, password, and companyName are required",
        },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("❌ Invalid email format");
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format",
        },
        { status: 400 },
      );
    }

    // Validate password strength (min 8 characters)
    if (password.length < 8) {
      console.log("❌ Password too weak");
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters long",
        },
        { status: 400 },
      );
    }

    // Validate company name
    if (companyName.trim().length < 2) {
      console.log("❌ Company name too short");
      return NextResponse.json(
        {
          success: false,
          error: "Company name must be at least 2 characters long",
        },
        { status: 400 },
      );
    }

    // Validate website URL if provided
    if (website) {
      try {
        new URL(website);
      } catch {
        console.log("❌ Invalid website URL");
        return NextResponse.json(
          {
            success: false,
            error: "Invalid website URL format",
          },
          { status: 400 },
        );
      }
    }

    console.log("✅ Validation passed, creating user...");

    // Step 1: Create Firebase Auth user
    const auth = getAdminAuth();
    let userRecord;

    try {
      userRecord = await auth.createUser({
        email: email.toLowerCase().trim(),
        password: password,
        emailVerified: false,
        disabled: false,
      });
      console.log(`✅ User created with UID: ${userRecord.uid}`);
    } catch (error: any) {
      console.error("❌ Error creating user:", error);

      // Handle specific Firebase Auth errors
      if (error.code === "auth/email-already-exists") {
        return NextResponse.json(
          {
            success: false,
            error: "An account with this email already exists",
          },
          { status: 400 },
        );
      } else if (error.code === "auth/invalid-password") {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid password format",
          },
          { status: 400 },
        );
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create user account",
          },
          { status: 500 },
        );
      }
    }

    // Step 2: Set custom claims (role: company)
    try {
      await auth.setCustomUserClaims(userRecord.uid, {
        role: "company",
      });
      console.log(`✅ Custom claims set for user: ${userRecord.uid}`);
    } catch (error) {
      console.error("❌ Error setting custom claims:", error);

      // Rollback: delete the user if custom claims fail
      try {
        await auth.deleteUser(userRecord.uid);
        console.log("🔄 Rolled back user creation");
      } catch (deleteError) {
        console.error("❌ Failed to rollback user creation:", deleteError);
      }

      return NextResponse.json(
        {
          success: false,
          error: "Failed to set user permissions",
        },
        { status: 500 },
      );
    }

    // Step 3: Create Firestore document in companies collection
    try {
      const firestore = await getAdminFirestore();
      const companyData = {
        companyName: companyName.trim(),
        email: email.toLowerCase().trim(),
        website: website?.trim() || null,
        industry: industry?.trim() || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        jobs: [],
        activeJobsCount: 0,
        totalJobsCount: 0,
        profileComplete: false,
        verified: false,
      };

      await firestore
        .collection("companies")
        .doc(userRecord.uid)
        .set(companyData);

      console.log(
        `✅ Company document created in Firestore: ${userRecord.uid}`,
      );
    } catch (error) {
      console.error("❌ Error creating Firestore document:", error);

      // Rollback: delete the user and custom claims
      try {
        await auth.deleteUser(userRecord.uid);
        console.log("🔄 Rolled back user creation due to Firestore error");
      } catch (deleteError) {
        console.error("❌ Failed to rollback user creation:", deleteError);
      }

      return NextResponse.json(
        {
          success: false,
          error: "Failed to create company profile",
        },
        { status: 500 },
      );
    }

    // Success response
    console.log(`✅ Company signup completed successfully for ${email}`);
    return NextResponse.json(
      {
        success: true,
        uid: userRecord.uid,
        email: userRecord.email,
        message: "Company account created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("❌ Unexpected error in company signup:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred during signup",
      },
      { status: 500 },
    );
  }
}
