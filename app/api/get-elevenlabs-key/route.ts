// app/api/get-elevenlabs-key/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Get the ElevenLabs API key from environment variables
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenLabsKey) {
      console.warn("ElevenLabs API key not found in environment variables");
      return new NextResponse("", { status: 404 });
    }

    return new NextResponse(elevenLabsKey, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error retrieving ElevenLabs API key:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
