/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import {
  getAdminAuth,
  getAdminFirestore,
  getStorage,
} from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];

    // Verify token and get user
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Verify user has company role
    if (decodedToken.role !== "company") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Company role required" },
        { status: 403 },
      );
    }

    // Parse form data
    const formData = await request.formData();
    const logoFile = formData.get("logo") as File;

    if (!logoFile) {
      return NextResponse.json(
        { success: false, error: "Logo file is required" },
        { status: 400 },
      );
    }

    // Validate file type (only images)
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(logoFile.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Please upload a JPG, PNG, or WebP image",
        },
        { status: 400 },
      );
    }

    // Validate file size (5MB max)
    if (logoFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size must be less than 5MB" },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const bytes = await logoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Firebase Storage
    const storage = getStorage();
    const bucket = storage.bucket();
    const fileExtension = logoFile.name.split(".").pop();
    const fileName = `company-logos/${uid}.${fileExtension}`;
    const file = bucket.file(fileName);

    await file.save(buffer, {
      metadata: {
        contentType: logoFile.type,
      },
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Update Firestore company document
    const firestore = await getAdminFirestore();
    await firestore.collection("companies").doc(uid).update({
      logoUrl: publicUrl,
      updatedAt: Timestamp.now(),
    });

    console.log(`✅ Logo uploaded successfully for company: ${uid}`);

    return NextResponse.json(
      {
        success: true,
        logoUrl: publicUrl,
        message: "Logo uploaded successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ Error uploading logo:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to upload logo",
      },
      { status: 500 },
    );
  }
}
