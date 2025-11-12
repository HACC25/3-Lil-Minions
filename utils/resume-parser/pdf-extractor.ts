/**
 * PDF Text Extractor
 * Extracts raw text from PDF files using Adobe PDF Extract API (same as matching processor)
 */

import { extractTextFromPdf } from "../adobe-pdf-extractor";
import type { ParsedResumeResult } from "./types";

/**
 * Extract text from resume file (supports PDF, DOC, DOCX)
 * @param file - The resume file
 * @returns Promise with extracted text and initial data structure
 */
export async function extractResumeText(
  file: File,
): Promise<ParsedResumeResult> {
  try {
    const fileType = file.type;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = "";

    // Use Adobe PDF extractor for PDFs
    if (fileType === "application/pdf") {
      console.log("📄 Extracting text from PDF using Adobe...");
      text = await extractTextFromPdf(buffer);
    } else if (
      fileType === "application/msword" ||
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // For DOC/DOCX, we'll use a simpler extraction or convert to PDF first
      console.log("📄 DOC/DOCX detected - using fallback text extraction...");
      // For now, return error asking for PDF
      return {
        success: false,
        error:
          "DOC/DOCX files are not yet supported. Please upload a PDF version of your resume.",
      };
    } else {
      return {
        success: false,
        error: "Unsupported file type. Please upload a PDF, DOC, or DOCX file.",
      };
    }

    // Clean up the text
    text = text
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\n{3,}/g, "\n\n") // Remove excessive blank lines
      .trim();

    if (!text || text.length < 50) {
      return {
        success: false,
        error:
          "Could not extract sufficient text from the document. Please ensure the PDF is not scanned or image-based.",
      };
    }

    console.log(`✅ Extracted ${text.length} characters from resume`);

    return {
      success: true,
      data: {
        personalInfo: {},
        workHistory: [],
        education: [],
        skills: [],
        languages: [],
        certifications: [],
        references: [],
        rawText: text,
      },
    };
  } catch (error) {
    console.error("Error extracting resume text:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to extract resume text",
    };
  }
}
