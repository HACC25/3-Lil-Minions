import { sendEmail, getFromEmail } from "./client";

/**
 * Send application confirmation email to applicant
 */
export async function sendApplicationConfirmation(
  applicantEmail: string,
  applicantName: string,
  jobTitle: string,
  companyName: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  applicationId: string,
): Promise<void> {
  const subject = `Thank you for applying to ${companyName}!`;

  const text = `
Dear ${applicantName},

Thank you for your application to the ${jobTitle} position at ${companyName}! Your application has been received and is being processed.

WHAT HAPPENS NEXT?

1. AI Screening (Completed)
   Your application has been automatically screened by our AI system. This process was instant.

2. Interview Invitation (If You Passed AI Screening)
   If you passed the AI screening, you will receive an interview invitation within the next few minutes. Check your email!

3. Human Review (2-3 weeks)
   If you didn't receive an immediate interview invitation, our hiring team will still review your application in detail and may extend an invitation after their review.

4. Final Decision
   You will be notified of the final hiring decision via email, regardless of the outcome.

Please retain this email for your records and check your inbox regularly for updates.

Thank you for your interest in ${companyName}. We appreciate the time and effort you invested in your application.

Sincerely,
${companyName} Talent Acquisition Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0; text-align: center;">
        <table role="presentation" style="width: 600px; margin: 0 auto; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <h1 style="margin: 0 0 20px 0; color: #10b981; font-size: 28px; text-align: center;">Application Received!</h1>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Dear <strong>${applicantName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Thank you for your application to the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>! Your application has been received and is being processed.
              </p>
              
              <h2 style="margin: 30px 0 15px 0; color: #333333; font-size: 20px;">What Happens Next?</h2>
              
              <div style="margin: 20px 0; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #333333; font-size: 16px; font-weight: bold;">1. AI Screening (Completed)</p>
                <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                  Your application has been automatically screened by our AI system. This process was instant.
                </p>
              </div>
              
              <div style="margin: 20px 0; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #333333; font-size: 16px; font-weight: bold;">2. Interview Invitation (If You Passed AI Screening)</p>
                <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                  <strong style="color: #10b981;">✓ If you passed the AI screening</strong>, you will receive an interview invitation within the next few minutes. Check your email!
                </p>
              </div>
              
              <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-left: 4px solid #6b7280; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #333333; font-size: 16px; font-weight: bold;">3. Human Review (2-3 weeks)</p>
                <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                  If you didn't receive an immediate interview invitation, our hiring team will still review your application in detail and may extend an invitation after their review.
                </p>
              </div>
              
              <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-left: 4px solid #6b7280; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #333333; font-size: 16px; font-weight: bold;">4. Final Decision</p>
                <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                  You will be notified of the final hiring decision via email, regardless of the outcome.
                </p>
              </div>
              
              <p style="margin: 30px 0 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Please retain this email for your records and check your inbox regularly for updates.
              </p>
              
              <p style="margin: 20px 0 0 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Thank you for your interest in ${companyName}. We appreciate the time and effort you invested in your application.
              </p>
              
              <p style="margin: 20px 0 0 0; color: #666666; font-size: 16px; font-weight: bold;">
                Sincerely,<br>
                ${companyName} Talent Acquisition Team
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #999999; font-size: 12px; text-align: center; line-height: 1.4;">
                <em>Please Note: This is an automated message. Please do not reply to this email. For questions regarding your application, please contact ${companyName} directly.</em>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await sendEmail({
    to: applicantEmail,
    from: getFromEmail(),
    subject,
    text,
    html,
  });
}
