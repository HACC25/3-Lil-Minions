import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getStorage as getAdminStorage } from "firebase-admin/storage";

let adminApp: App | null = null;
let adminFirestore: Firestore | null = null;
let adminAuth: Auth | null = null;

function initializeFirebaseAdmin(): App {
  console.log("🔧 Initializing Firebase Admin...");

  try {
    // Check if app already exists
    const existingApps = getApps();
    if (existingApps.length > 0) {
      console.log("✅ Using existing Firebase Admin app");
      adminApp = existingApps[0];
      return adminApp;
    }

    // Get environment variables
    const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    console.log("🔍 Environment check:", {
      hasPrivateKey: !!privateKeyBase64,
      hasClientEmail: !!clientEmail,
      hasProjectId: !!projectId,
      privateKeyLength: privateKeyBase64?.length || 0,
      clientEmail: clientEmail || "missing",
      projectId: projectId || "missing",
    });

    if (!privateKeyBase64 || !clientEmail || !projectId) {
      throw new Error(
        `Missing Firebase env vars: privateKey=${!!privateKeyBase64}, clientEmail=${!!clientEmail}, projectId=${!!projectId}`,
      );
    }

    // Decode the base64 private key
    console.log("🔍 Decoding base64 private key...");
    let privateKey: string;
    try {
      privateKey = Buffer.from(privateKeyBase64, "base64").toString("utf8");
      console.log("✅ Successfully decoded base64 private key");
    } catch {
      throw new Error("Failed to decode base64 private key");
    }

    console.log("🔍 Decoded key validation:", {
      hasBeginMarker: privateKey.includes("-----BEGIN PRIVATE KEY-----"),
      hasEndMarker: privateKey.includes("-----END PRIVATE KEY-----"),
      length: privateKey.length,
    });

    if (
      !privateKey.includes("-----BEGIN PRIVATE KEY-----") ||
      !privateKey.includes("-----END PRIVATE KEY-----")
    ) {
      throw new Error("Invalid private key format after base64 decode");
    }

    // Initialize Firebase Admin
    console.log("🔧 Creating Firebase Admin app...");
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

    adminApp = initializeApp({
      credential: cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey,
      }),
      storageBucket: storageBucket,
    });

    console.log("✅ Firebase Admin initialized successfully");
    return adminApp;
  } catch (error) {
    console.error("❌ Firebase Admin initialization failed:");
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

export async function getAdminFirestore(): Promise<Firestore> {
  console.log("🔥 getAdminFirestore called");

  if (!adminFirestore) {
    console.log("📦 Creating new Firestore instance...");
    const app = initializeFirebaseAdmin();
    adminFirestore = getFirestore(app);
    console.log("✅ Firestore instance created");
  }

  return adminFirestore;
}

export function getAdminAuth(): Auth {
  console.log("🔐 getAdminAuth called");

  if (!adminAuth) {
    console.log("📦 Creating new Auth instance...");
    const app = initializeFirebaseAdmin();
    adminAuth = getAuth(app);
    console.log("✅ Auth instance created");
  }

  return adminAuth;
}

export function getStorage() {
  console.log("💾 getStorage called");
  const app = initializeFirebaseAdmin();
  return getAdminStorage(app);
}
