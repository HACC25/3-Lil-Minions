"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { FaExclamationTriangle } from "react-icons/fa";

interface SummaryDisplayProps {
  interviewId: string;
}

export function SummaryDisplay({ interviewId }: SummaryDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/get-analysis?interviewId=${interviewId}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch summary");
        }

        const data = await response.json();

        if (data.summary) {
          setSummary(data.summary);
        } else {
          setError("Summary not yet available");
        }
      } catch (err) {
        console.error("Error fetching summary:", err);
        setError(err instanceof Error ? err.message : "Failed to load summary");
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) {
      fetchSummary();
    }
  }, [interviewId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
          <p className="text-black/65">Generating summary...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex items-center justify-center p-5">
        <div className="text-center">
          <FaExclamationTriangle className="mb-3 text-red-400" size={32} />
          <p className="text-red-300 font-medium">
            {error || "No summary available"}
          </p>
          <p className="text-black/65 text-sm mt-2">
            Summary may still be processing. Please refresh in a moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-black">
      <div className="markdown-content  rounded-xl p-8 leading-relaxed">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-black mb-4 text-3xl">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-black mt-6 mb-3 text-2xl border-b-2 border-black/30 pb-2">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-black mt-5 mb-2 text-xl">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="text-black/95 mb-4 text-[0.95rem]">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="text-black/95 mb-4 pl-6">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="text-black/95 mb-4 pl-6">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="mb-2 text-black/95">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="text-black font-semibold">{children}</strong>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-blue-700 pl-4 ml-0 mb-4 italic text-black/85 bg-white/20 p-3 rounded">
                {children}
              </blockquote>
            ),
            code: ({ children }) => (
              <code className="bg-white/10 px-1.5 py-1 rounded text-sm text-green-300 font-mono">
                {children}
              </code>
            ),
          }}
        >
          {summary}
        </ReactMarkdown>
      </div>
    </div>
  );
}
