/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

// Response interface
interface VerifyCompanyResponse {
  valid: boolean;
  uid?: string;
  email?: string;
  role?: string;
  error?: string;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<VerifyCompanyResponse>> {
  console.log("🔐 Verify company token API called");

  try {
    // Extract Authorization header
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      console.log("❌ No Authorization header found");
      return NextResponse.json(
        {
          valid: false,
          error: "No authorization token provided",
        },
        { status: 401 },
      );
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      console.log("❌ Token is empty");
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid authorization token format",
        },
        { status: 401 },
      );
    }

    console.log("🔍 Verifying token...");

    // Verify the ID token
    const auth = getAdminAuth();
    let decodedToken;

    try {
      decodedToken = await auth.verifyIdToken(token);
      console.log(`✅ Token verified for user: ${decodedToken.uid}`);
    } catch (error: any) {
      console.error("❌ Token verification failed:", error);

      // Handle specific token errors
      if (error.code === "auth/id-token-expired") {
        return NextResponse.json(
          {
            valid: false,
            error: "Token has expired. Please sign in again.",
          },
          { status: 401 },
        );
      } else if (error.code === "auth/id-token-revoked") {
        return NextResponse.json(
          {
            valid: false,
            error: "Token has been revoked. Please sign in again.",
          },
          { status: 401 },
        );
      } else if (error.code === "auth/argument-error") {
        return NextResponse.json(
          {
            valid: false,
            error: "Invalid token format",
          },
          { status: 401 },
        );
      } else {
        return NextResponse.json(
          {
            valid: false,
            error: "Token verification failed",
          },
          { status: 401 },
        );
      }
    }

    // Check if user has company role
    const role = decodedToken.role as string | undefined;

    if (role !== "company") {
      console.log(
        `❌ User does not have company role. Current role: ${role || "none"}`,
      );
      return NextResponse.json(
        {
          valid: false,
          error: "Access denied. User is not registered as a company.",
        },
        { status: 403 },
      );
    }

    console.log(
      `✅ Company verification successful for user: ${decodedToken.uid}`,
    );

    // Return success response with user data
    return NextResponse.json(
      {
        valid: true,
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: role,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Unexpected error in verify-company:", error);
    return NextResponse.json(
      {
        valid: false,
        error: "An unexpected error occurred during verification",
      },
      { status: 500 },
    );
  }
}
