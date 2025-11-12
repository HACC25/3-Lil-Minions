/**
 * Resume Parser Index
 * Main exports for resume parsing and application prefill functionality
 */

export * from "./types";
export * from "./pdf-extractor";
export * from "./prefill-processor";

// Re-export main functions for convenience
export { extractResumeText } from "./pdf-extractor";
export {
  parseResumeWithAI,
  processResumeForPrefill,
  transformToApplicationData,
} from "./prefill-processor";
