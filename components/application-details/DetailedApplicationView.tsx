"use client";

import { frostedGlassBg } from "@/utils/styles";
import {
  ApplicationHeader,
  FitScoreSection,
  ContactInfoCard,
  ApplicationStatusCard,
  AIAnalysisCard,
  WorkExperienceSection,
  SkillsSection,
  EducationSection,
  CertificationsLanguagesGrid,
} from "./index";
import { cn } from "@/utils/styles";
interface DetailedApplicationViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  application: any;
  onRefresh?: () => void;
}

export function DetailedApplicationView({
  application,
  onRefresh,
}: DetailedApplicationViewProps) {
  const appData = application.applicationData || {};
  const fitBreakdown = application.fitScoreBreakdown || {};

  return (
    <div className={cn("p-6 max-w-7xl mx-auto")}>
      <ApplicationHeader application={application} onRefresh={onRefresh} />

      <FitScoreSection
        fitScore={application.fitScore}
        fitBreakdown={fitBreakdown}
      />

      <div className={cn(frostedGlassBg, "grid grid-cols-3 gap-6")}>
        {/* Left Column */}
        <div className="space-y-6 pl-4">
          <ContactInfoCard
            email={application.email}
            phone={appData.phone}
            address={appData.address}
            city={appData.city}
            state={appData.state}
            zipCode={appData.zipCode}
          />

          <ApplicationStatusCard
            status={application.status}
            jobTitle={application.jobTitle}
          />

          <AIAnalysisCard
            strengths={fitBreakdown.strengths}
            concerns={fitBreakdown.concerns}
            reasoning={fitBreakdown.reasoning}
          />
        </div>

        {/* Right Column */}
        <div className="col-span-2 space-y-6 pr-4">
          <WorkExperienceSection workHistory={appData.workHistory} />

          <SkillsSection skills={appData.skills} />

          <EducationSection education={appData.education} />

          <CertificationsLanguagesGrid
            certifications={appData.certifications}
            languages={appData.languages}
          />
        </div>
      </div>
    </div>
  );
}
