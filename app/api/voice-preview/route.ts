import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { voiceId, text } = await request.json();

    if (!voiceId || !text) {
      return NextResponse.json(
        { error: "Voice ID and text are required" },
        { status: 400 },
      );
    }

    // HeyGen API configuration
    const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

    // Use HeyGen Streaming Avatar API for actual voice previews
    if (HEYGEN_API_KEY) {
      try {
        // Note: We don't need token for voices API, removing unused variable

        // Try to get voice preview from HeyGen's voices API
        const voicesResponse = await fetch("https://api.heygen.com/v2/voices", {
          method: "GET",
          headers: {
            "X-Api-Key": HEYGEN_API_KEY,
            Accept: "application/json",
          },
        });

        if (!voicesResponse.ok) {
          throw new Error(`HeyGen voices API error: ${voicesResponse.status}`);
        }

        const voicesData = await voicesResponse.json();

        // Find the voice by ID and get its preview audio
        const voice = voicesData.data?.voices?.find(
          (v: { voice_id: string; preview_audio?: string; name?: string }) =>
            v.voice_id === voiceId,
        );

        if (voice && voice.preview_audio) {
          return NextResponse.json({
            success: true,
            audioUrl: voice.preview_audio,
            audioData: null,
            voiceName: voice.name,
            message: `Real HeyGen voice preview for ${voice.name}`,
          });
        } else {
          throw new Error(`Voice ID ${voiceId} not found in HeyGen voices`);
        }
      } catch (error) {
        console.error("HeyGen voice preview error:", error);
        // Fall back to mock response
        return NextResponse.json({
          success: true,
          audioUrl: null,
          audioData: null,
          mockPreview: true,
          message: `Voice preview for ${voiceId} (HeyGen error: ${(error as Error).message})`,
        });
      }
    } else {
      // No API key available, use mock response
      return NextResponse.json({
        success: true,
        audioUrl: null,
        audioData: null,
        mockPreview: true,
        message: `Voice preview for ${voiceId} (no API key)`,
      });
    }
  } catch (error) {
    console.error("Voice preview error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate voice preview",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
