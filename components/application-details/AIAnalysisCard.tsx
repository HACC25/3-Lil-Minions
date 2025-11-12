"use client";

import { Card, CardBody } from "@nextui-org/react";

interface AIAnalysisCardProps {
  strengths?: string[];
  concerns?: string[];
  reasoning?: string;
}

export function AIAnalysisCard({
  strengths,
  concerns,
  reasoning,
}: AIAnalysisCardProps) {
  if (!strengths?.length && !concerns?.length) {
    return null;
  }

  return (
    <Card className="bg-white/30 backdrop-blur-md rounded-md">
      <CardBody className="p-6">
        <h3 className="text-lg font-semibold text-black mb-4">Analysis</h3>
        <div className="space-y-4">
          {strengths && strengths.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-black mb-2">Strengths</p>
              <ul className="space-y-2">
                {strengths.map((strength: string, i: number) => (
                  <li
                    key={i}
                    className="text-sm text-black pl-3 border-l-2 border-green-700"
                  >
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {concerns && concerns.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-black mb-2">Concerns</p>
              <ul className="space-y-2">
                {concerns.map((concern: string, i: number) => (
                  <li
                    key={i}
                    className="text-sm text-black pl-3 border-l-2 border-red-700"
                  >
                    {concern}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {reasoning && (
            <div>
              <p className="text-sm font-semibold text-black mb-2">Reasoning</p>
              <p className="text-sm text-black pl-3 border-l-2 border-blue-800">
                {reasoning}
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
