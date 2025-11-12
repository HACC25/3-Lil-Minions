"use client";

import { Card, CardBody } from "@nextui-org/react";

interface ApplicationStatusCardProps {
  status: string;
  jobTitle: string;
}

export function ApplicationStatusCard({
  status,
  jobTitle,
}: ApplicationStatusCardProps) {
  return (
    <Card className="bg-white/30 backdrop-blur-md rounded-md">
      <CardBody className="p-6">
        <h3 className="text-lg font-semibold text-black mb-4">
          Application Status
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-black/70 mb-2">Current Status</p>
            <span className="px-3 py-1 bg-white/30 text-black text-sm font-medium rounded-md border border-white/30 capitalize">
              {status}
            </span>
          </div>
          <div>
            <p className="text-xs text-black/70 mb-1">Position</p>
            <p className="text-black font-medium">{jobTitle}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
