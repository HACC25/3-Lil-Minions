import { sendEmail, getFromEmail } from "./client";

/**
 * Send interview invitation email to qualified applicant
 */
export async function sendInterviewInvitation(
  applicantEmail: string,
  applicantName: string,
  jobTitle: string,
  companyName: string,
  interviewLink: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fitScore: number,
): Promise<void> {
  const subject = `Interview Invitation: ${jobTitle}`;

  const text = `
Dear ${applicantName},

Congratulations! You passed the AI screening for the ${jobTitle} position at ${companyName}!

NEXT STEP - AI INTERVIEW
Please complete your interview by clicking the link below:
${interviewLink}

The interview is available 24/7 and can be completed at your convenience. Please complete it within the next 7 days.

WHAT TO EXPECT
- The interview will be conducted with an AI interviewer
- Questions will assess your qualifications and fit for the position
- The process typically takes 20-30 minutes
- You cannot pause during the interview, so please find a time to complete it fully

WHAT HAPPENS AFTER YOUR INTERVIEW?
After you complete the AI interview, our hiring team will review your application and interview performance. This process typically takes 2-3 weeks. You will be notified of the final hiring decision via email, regardless of the outcome.

If you have any technical issues accessing the interview, please contact us immediately.

We look forward to learning more about you!

Best regards,
${companyName} Talent Acquisition Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
        <table role="presentation" style="width: 600px; margin: 0 auto; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <h1 style="margin: 0; color: #333333; font-size: 28px; font-weight: bold;">
                Congratulations!
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Dear <strong>${applicantName}</strong>,
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6;">
                We are pleased to inform you that you have been selected for an interview for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6;">
                We would like to move forward with the next step in our hiring process. Please click the button below to start your AI-powered interview:
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px 40px; text-align: center;">
              <a href="${interviewLink}" style="display: inline-block; padding: 15px 40px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                Start Interview
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <h3 style="margin: 0 0 10px 0; color: #333333; font-size: 18px;">What to Expect:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 1.8;">
                <li>The interview will be conducted with an AI interviewer</li>
                <li>Questions will assess your qualifications and fit for the position</li>
                <li>The process typically takes 20-30 minutes</li>
                <li>You <strong>cannot pause</strong> during the interview, so please find a time to complete it fully</li>
                <li>The interview is available 24/7 - complete it within the next 7 days</li>
              </ul>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px 40px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px; margin: 0 40px;">
              <h3 style="margin: 15px 0 10px 0; color: #333333; font-size: 18px;">What Happens After Your Interview?</h3>
              <p style="margin: 0 0 15px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                After you complete the AI interview, our hiring team will review your application and interview performance. This process typically takes <strong>2-3 weeks</strong>. You will be notified of the final hiring decision via email, regardless of the outcome.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 40px 40px;">
              <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Best of luck!
              </p>
              <p style="margin: 10px 0 0 0; color: #666666; font-size: 16px; font-weight: bold;">
                ${companyName} Hiring Team
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #999999; font-size: 12px; text-align: center; line-height: 1.4;">
                If the button above doesn't work, copy and paste this link into your browser:<br>
                <a href="${interviewLink}" style="color: #007bff; text-decoration: none;">${interviewLink}</a>
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
