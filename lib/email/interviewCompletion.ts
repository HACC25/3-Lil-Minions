import { sendEmail, getFromEmail } from "./client";

/**
 * Send interview completion confirmation email to candidate
 */
export async function sendInterviewCompletionEmail(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  companyName: string,
  interviewId: string,
): Promise<void> {
  const subject = `Thank you for completing your interview with ${companyName}`;

  const text = `
Dear ${candidateName},

Thank you for taking the time to complete your interview for the ${jobTitle} position at ${companyName}. 
We appreciate your interest in joining our team and the effort you put into the interview process.

Our Human Resources team is currently reviewing all candidates and will be in contact with you regarding 
next steps in the hiring process. This review typically takes 3-5 business days.

We value the time you invested in learning about our organization and sharing your qualifications with us. 
If you have any questions in the meantime, please feel free to reach out to our HR department.

Thank you again for your interest in ${companyName}. We look forward to connecting with you soon.

Best regards,
${companyName} Human Resources Team

Interview Reference: ${interviewId}
  `.trim();

  const html = `<p>Dear ${candidateName},</p>

<p>Thank you for taking the time to complete your interview for the <strong>${jobTitle}</strong> position at ${companyName}. 
We appreciate your interest in joining our team and the effort you put into the interview process.</p>

<p>Our Human Resources team is currently reviewing all candidates and will be in contact with you regarding 
next steps in the hiring process. This review typically takes 3-5 business days.</p>

<p>We value the time you invested in learning about our organization and sharing your qualifications with us. 
If you have any questions in the meantime, please feel free to reach out to our HR department.</p>

<p>Thank you again for your interest in ${companyName}. We look forward to connecting with you soon.</p>

<p>Best regards,<br>
${companyName} Human Resources Team</p>

<p><small>Interview Reference: ${interviewId}</small></p>

<hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">

<p><small style="color: #6b7280;">Please Note: This is an automated message. Please do not reply to this email. For questions regarding your interview or application status, please contact ${companyName} Human Resources directly.</small></p>`;

  await sendEmail({
    to: candidateEmail,
    from: getFromEmail(),
    subject,
    text,
    html,
  });
}
