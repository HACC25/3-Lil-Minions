"use client";

import {
  ApplicationHeader,
  FitScoreSection,
  ContactInfoCard,
  ApplicationStatusCard,
  AIAnalysisCard,
} from "./index";

interface SimplifiedApplicationViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  application: any;
  onRefresh?: () => void;
}

export function SimplifiedApplicationView({
  application,
  onRefresh,
}: SimplifiedApplicationViewProps) {
  const appData = application.applicationData || {};
  const fitBreakdown = application.fitScoreBreakdown || {};

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ApplicationHeader application={application} onRefresh={onRefresh} />

      <FitScoreSection
        fitScore={application.fitScore}
        fitBreakdown={fitBreakdown}
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Contact & Status Only */}
        <div className="space-y-6">
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
        </div>

        {/* Right Column - Expanded AI Analysis */}
        <div className="col-span-2">
          <AIAnalysisCard
            strengths={fitBreakdown.strengths}
            concerns={fitBreakdown.concerns}
            reasoning={fitBreakdown.reasoning}
          />
        </div>
      </div>
    </div>
  );
}
