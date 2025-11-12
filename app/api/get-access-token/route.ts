// app/api/get-access-token/route.ts
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

export async function POST() {
  try {
    if (!HEYGEN_API_KEY) {
      throw new Error("API key is missing from .env");
    }

    const res = await fetch(
      "https://api.heygen.com/v1/streaming.create_token",
      {
        method: "POST",
        headers: {
          "x-api-key": HEYGEN_API_KEY,
        },
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("HeyGen API error:", res.status, errorText);
      throw new Error(`HeyGen API returned ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    console.log("HeyGen API response:", data);

    // Check if the response has the expected structure
    if (!data || !data.data || !data.data.token) {
      console.error("Unexpected API response structure:", data);
      throw new Error("Invalid response from HeyGen API - missing token");
    }

    return new Response(data.data.token, {
      status: 200,
    });
  } catch (error) {
    console.error("Error retrieving access token:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to retrieve access token",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
