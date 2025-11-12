import sgMail from "@sendgrid/mail";

// Initialize SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
  console.error("⚠️ SENDGRID_API_KEY not found in environment variables");
} else {
  sgMail.setApiKey(apiKey);
}

/**
 * Email configuration interface
 */
export interface EmailConfig {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(config: EmailConfig): Promise<void> {
  if (!apiKey) {
    throw new Error("SendGrid API key is not configured");
  }

  try {
    await sgMail.send({
      ...config,
      trackingSettings: {
        clickTracking: {
          enable: false,
          enableText: false,
        },
        openTracking: {
          enable: false,
        },
      },
    });
    console.log(`✅ Email sent successfully to ${config.to}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
}

/**
 * Get the configured "from" email address
 */
export function getFromEmail(): string {
  return process.env.SENDGRID_FROM_EMAIL || "noreply@hexcelerate.app";
}
