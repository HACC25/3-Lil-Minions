/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/utils/adobePdfExtractor.ts
// Simplified version following Adobe documentation exactly

const ADOBE_BASE_URL = "https://pdf-services.adobe.io";

interface AdobeCredentials {
  client_id: string;
  client_secret: string;
}

const getCredentials = (): AdobeCredentials => {
  const client_id = process.env.ADOBE_CLIENT_ID;
  const client_secret = process.env.ADOBE_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    throw new Error(
      "Adobe credentials not configured. Please set ADOBE_CLIENT_ID and ADOBE_CLIENT_SECRET environment variables.",
    );
  }
  return { client_id, client_secret };
};

/**
 * Step 1: Get access token
 */
async function getAccessToken(): Promise<string> {
  const { client_id, client_secret } = getCredentials();

  console.log("Step 1: Getting access token...");

  const response = await fetch(`${ADOBE_BASE_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id,
      client_secret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Token error:", error);
    throw new Error(
      `Failed to get access token: ${response.status} - ${error}`,
    );
  }

  const data = await response.json();
  console.log("✓ Access token obtained");
  return data.access_token;
}

/**
 * Step 2: Upload asset
 */
async function uploadAsset(
  pdfBuffer: Buffer,
  token: string,
  clientId: string,
): Promise<string> {
  console.log("Step 2: Uploading asset...");

  // First, get upload URI
  const uploadResponse = await fetch(`${ADOBE_BASE_URL}/assets`, {
    method: "POST",
    headers: {
      "X-API-Key": clientId,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mediaType: "application/pdf",
    }),
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new Error(
      `Failed to get upload URI: ${uploadResponse.status} - ${error}`,
    );
  }

  const { uploadUri, assetID } = await uploadResponse.json();
  console.log("Got asset ID:", assetID);

  // Upload the actual file
  const putResponse = await fetch(uploadUri, {
    method: "PUT",
    headers: {
      "Content-Type": "application/pdf",
    },
    body: pdfBuffer as unknown as BodyInit,
  });

  if (!putResponse.ok) {
    throw new Error(`Failed to upload PDF: ${putResponse.status}`);
  }

  console.log("✓ Asset uploaded");
  return assetID;
}

/**
 * Step 3: Create extraction job
 */
async function createExtractJob(
  assetID: string,
  token: string,
  clientId: string,
): Promise<string> {
  console.log("Step 3: Creating extraction job...");

  // Try the simpler format first
  const response = await fetch(`${ADOBE_BASE_URL}/operation/extractpdf`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-api-key": clientId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assetID: assetID,
    }),
  });

  console.log("Create job response status:", response.status);

  if (!response.ok) {
    const error = await response.text();
    console.error("Create job error:", error);

    // If simple format fails, try with more parameters
    console.log("Trying alternative format...");
    const altResponse = await fetch(`${ADOBE_BASE_URL}/operation/extractpdf`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": clientId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          assetID: assetID,
        },
      }),
    });

    if (!altResponse.ok) {
      const altError = await altResponse.text();
      throw new Error(`Failed to create extraction job: ${altError}`);
    }

    const location = altResponse.headers.get("location");
    if (!location) {
      throw new Error("No location header in response");
    }
    return location;
  }

  const location = response.headers.get("location");
  if (!location) {
    throw new Error("No location header in response");
  }

  console.log("✓ Job created, location:", location);
  return location;
}

/**
 * Step 4: Poll job status
 */
async function pollJobStatus(
  location: string,
  token: string,
  clientId: string,
): Promise<any> {
  console.log("Step 4: Polling job status...");

  const maxAttempts = 60;
  let attempt = 0;

  while (attempt < maxAttempts) {
    const response = await fetch(location, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": clientId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to check status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`Status: ${result.status} (attempt ${attempt + 1})`);

    if (result.status === "done") {
      console.log("✓ Job completed");
      return result;
    }

    if (result.status === "failed") {
      throw new Error("Extraction job failed");
    }

    // Wait 2 seconds before next poll
    await new Promise((resolve) => setTimeout(resolve, 2000));
    attempt++;
  }

  throw new Error("Job timed out");
}

/**
 * Step 5: Download result
 */
async function downloadResult(downloadUri: string): Promise<string> {
  console.log("Step 5: Downloading result...");

  const response = await fetch(downloadUri);
  if (!response.ok) {
    throw new Error(`Failed to download result: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const text = new TextDecoder().decode(buffer);

  console.log("Downloaded content type:", response.headers.get("content-type"));
  console.log("Content preview:", text.substring(0, 200));

  let extractedText = "";

  try {
    // If it's JSON, parse it directly
    const data = JSON.parse(text);

    if (data.elements) {
      // Extract text from elements array
      extractedText = data.elements
        .filter((el: any) => el.Text)
        .map((el: any) => el.Text)
        .join(" ");
      console.log(`Extracted ${data.elements.length} text elements`);
    } else if (data.content) {
      // Sometimes the structure is nested
      extractedText = JSON.stringify(data.content);
    }
  } catch (e) {
    console.log("Not JSON format, trying pattern matching...");

    // Fallback to pattern matching for ZIP or other formats
    const patterns = [
      /"Text"\s*:\s*"([^"]+)"/g,
      /"text"\s*:\s*"([^"]+)"/g,
      /"Text"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/g, // Handle escaped quotes
    ];

    for (const pattern of patterns) {
      const matches: RegExpExecArray[] = [];
      let match;
      while ((match = pattern.exec(text)) !== null) {
        matches.push(match);
      }
      if (matches.length > 0) {
        extractedText = matches
          .map((match) => match[1])
          .map((text) => text.replace(/\\n/g, " ").replace(/\\"/g, '"'))
          .join(" ");
        console.log(`Extracted ${matches.length} text matches using pattern`);
        break;
      }
    }
  }

  // Clean up the extracted text
  extractedText = extractedText
    .replace(/\\n/g, " ")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  console.log(`✓ Extracted ${extractedText.length} characters`);

  if (extractedText.length < 10) {
    console.error("Full content sample:", text.substring(0, 1000));
    throw new Error("No text content found");
  }

  return extractedText;
}

/**
 * Main extraction function
 */
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  try {
    const { client_id } = getCredentials();

    // Step 1: Get token
    const token = await getAccessToken();

    // Step 2: Upload asset
    const assetID = await uploadAsset(pdfBuffer, token, client_id);

    // Step 3: Create job
    const location = await createExtractJob(assetID, token, client_id);

    // Step 4: Poll status
    const result = await pollJobStatus(location, token, client_id);

    // Step 5: Download result
    // Adobe returns download URIs in different locations depending on the operation
    let downloadUri = "";

    // For extract operations, prefer content.downloadUri (JSON metadata) over resource.downloadUri (ZIP)
    if (result.content?.downloadUri) {
      downloadUri = result.content.downloadUri;
      console.log("Using content.downloadUri (JSON metadata)");
    } else if (result.resource?.downloadUri) {
      downloadUri = result.resource.downloadUri;
      console.log("Using resource.downloadUri (ZIP file)");
    } else if (result.downloadUri) {
      downloadUri = result.downloadUri;
      console.log("Using root downloadUri");
    } else if (result.asset?.downloadUri) {
      downloadUri = result.asset.downloadUri;
      console.log("Using asset.downloadUri");
    }

    if (!downloadUri) {
      console.error("Result structure:", JSON.stringify(result, null, 2));
      throw new Error("No download URI found in result");
    }

    const text = await downloadResult(downloadUri);

    console.log("=== Extraction complete ===");
    return text;
  } catch (error) {
    console.error("PDF extraction failed:", error);
    throw error;
  }
}
