"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@nextui-org/react";
import type { SupplementalQuestion } from "@/types/job";

interface SupplementalQuestionsCardProps {
  jobId: string;
  supplementalAnswers?: Record<string, string | string[]>;
}

export function SupplementalQuestionsCard({
  jobId,
  supplementalAnswers,
}: SupplementalQuestionsCardProps) {
  const [questions, setQuestions] = useState<SupplementalQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJob() {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        const data = await response.json();
        if (data.success && data.job?.supplementalQuestions) {
          setQuestions(data.job.supplementalQuestions);
        }
      } catch (error) {
        console.error("Error fetching job:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchJob();
  }, [jobId]);

  if (loading) return null;
  if (!supplementalAnswers || Object.keys(supplementalAnswers).length === 0) {
    return null;
  }

  return (
    <Card className="bg-white/60 backdrop-blur-md border border-white/30">
      <CardBody className="p-6">
        <h3 className="text-lg font-semibold text-black mb-4">
          Supplemental Questions
        </h3>
        <div className="space-y-4">
          {Object.entries(supplementalAnswers).map(([questionId, answer]) => {
            const answerText = Array.isArray(answer)
              ? answer.join(", ")
              : answer;
            if (!answerText) return null;

            const question = questions.find((q) => q.id === questionId);
            const questionText = question?.question || `Question ${questionId}`;

            return (
              <div key={questionId}>
                <p className="text-xs text-black/70 mb-1">{questionText}</p>
                <p className="text-black font-medium">{answerText}</p>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
