// app/api/auth/firebase-fallback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "../../../lib/firebase-admin";
import * as admin from "firebase-admin";

export async function POST(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const idToken = authHeader.substring(7);

    // Initialize Firebase Admin if not already done
    if (!admin.apps.length) {
      await getAdminFirestore(); // This initializes admin
    }

    // Verify the Firebase ID token server-side
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const uid = decodedToken.uid;
    const email = decodedToken.email || "";

    // Create a consistent password from UID (matching your backend logic)
    const derivePasswordFromUid = (firebaseUid: string): string => {
      let hash = 0;
      for (let i = 0; i < firebaseUid.length; i++) {
        const char = firebaseUid.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      const salt = "hexcelerate_auth_salt_2024";
      const saltedString = firebaseUid + salt;
      let saltedHash = 0;
      for (let i = 0; i < saltedString.length; i++) {
        const char = saltedString.charCodeAt(i);
        saltedHash = (saltedHash << 5) - saltedHash + char;
        saltedHash = saltedHash & saltedHash;
      }
      return Math.abs(saltedHash).toString(36).padStart(12, "0");
    };

    const consistentPassword = derivePasswordFromUid(uid);

    // Call your backend's login endpoint
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const queryParams = new URLSearchParams();
    queryParams.append("email", email);
    queryParams.append("password", consistentPassword);

    const backendResponse = await fetch(
      `${backendUrl}/auth/login?${queryParams.toString()}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!backendResponse.ok) {
      const error = await backendResponse.json();
      return NextResponse.json(
        { error: "Backend authentication failed", details: error },
        { status: 401 },
      );
    }

    const tokenData = await backendResponse.json();

    // Return the backend tokens
    return NextResponse.json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      user_id: tokenData.user_id,
      source: "server-fallback",
    });
  } catch (error) {
    console.error("Server-side auth fallback error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Authentication failed", details: errorMessage },
      { status: 500 },
    );
  }
}
