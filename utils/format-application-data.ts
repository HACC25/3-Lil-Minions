import type { ApplicationFormData } from "@/types/application";

export function formatApplicationDataForScoring(
  data: ApplicationFormData,
): string | null {
  const hasRealData =
    data.workHistory?.length > 0 ||
    data.skills?.length > 0 ||
    data.education?.length > 0 ||
    data.certifications?.length > 0 ||
    data.languages?.length > 0;

  if (!hasRealData) {
    return null;
  }

  const sections: string[] = [];

  sections.push("=== VERIFIED APPLICATION DATA ===\n");

  if (data.workHistory && data.workHistory.length > 0) {
    sections.push("WORK HISTORY:");
    data.workHistory.forEach((work, i) => {
      const duration = work.stillEmployed
        ? `${work.startDate} - Present`
        : `${work.startDate} - ${work.endDate}`;
      sections.push(
        `  ${i + 1}. ${work.jobTitle} at ${work.employerName} (${duration})`,
      );
      sections.push(`     Hours/Week: ${work.hoursPerWeek}`);
      sections.push(`     Duties: ${work.duties}`);
      if (work.reasonForLeaving) {
        sections.push(`     Reason for Leaving: ${work.reasonForLeaving}`);
      }
    });
    sections.push("");
  }

  if (data.skills && data.skills.length > 0) {
    sections.push("SKILLS & PROFICIENCY:");
    data.skills.forEach((skill) => {
      const totalMonths =
        parseInt(skill.experience || "0") * 12 +
        parseInt(skill.experienceMonths || "0");
      const years = Math.floor(totalMonths / 12);
      const months = totalMonths % 12;
      const exp =
        years > 0
          ? `${years}y ${months > 0 ? months + "m" : ""}`
          : `${months}m`;
      sections.push(`  - ${skill.name}: ${skill.level} (${exp.trim()})`);
    });
    sections.push("");
  }

  if (data.education && data.education.length > 0) {
    sections.push("EDUCATION:");
    data.education.forEach((edu) => {
      const status = edu.graduated ? "Graduated" : "Attended";
      sections.push(
        `  - ${edu.degree}${edu.major ? ` in ${edu.major}` : ""} - ${edu.institutionName} (${status})`,
      );
    });
    sections.push("");
  }

  if (data.certifications && data.certifications.length > 0) {
    sections.push("CERTIFICATIONS & LICENSES:");
    data.certifications.forEach((cert) => {
      sections.push(`  - ${cert.name}`);
    });
    sections.push("");
  }

  if (data.languages && data.languages.length > 0) {
    sections.push("LANGUAGES:");
    data.languages.forEach((lang) => {
      const abilities = [];
      if (lang.speak) abilities.push("Speak");
      if (lang.read) abilities.push("Read");
      if (lang.write) abilities.push("Write");
      sections.push(`  - ${lang.language}: ${abilities.join(", ")}`);
    });
    sections.push("");
  }

  sections.push("SUPPLEMENTAL QUESTION RESPONSES:");
  if (data.q05_generalExperience) {
    sections.push(
      `  General Experience Requirement Met: ${data.q05_generalExperience.toUpperCase()}`,
    );
  }
  if (data.q06_specializedExperience) {
    sections.push(
      `  Specialized Experience Requirement Met: ${data.q06_specializedExperience.toUpperCase()}`,
    );
  }

  if (
    data.supplementalAnswers &&
    Object.keys(data.supplementalAnswers).length > 0
  ) {
    Object.entries(data.supplementalAnswers).forEach(([questionId, answer]) => {
      const answerText = Array.isArray(answer) ? answer.join(", ") : answer;
      if (answerText) {
        sections.push(`  Q${questionId}: ${answerText}`);
      }
    });
  }

  return sections.join("\n");
}
