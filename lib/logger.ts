/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Environment-aware logger utility
 * Only logs in development mode to keep production clean
 */

const isDevelopment = process.env.NODE_ENV === "development";

export const logger = {
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log("🔍", ...args);
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log("ℹ️", ...args);
    }
  },

  success: (...args: any[]) => {
    if (isDevelopment) {
      console.log("✅", ...args);
    }
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn("⚠️", ...args);
    }
  },

  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error("❌", ...args);
  },
};
