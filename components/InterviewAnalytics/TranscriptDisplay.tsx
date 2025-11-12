"use client";

import React, { useEffect, useState } from "react";
import { FaExclamationCircle } from "react-icons/fa";
import { BiTime } from "react-icons/bi";

interface TranscriptMessage {
  type: "user" | "ai";
  content: string;
}

interface TranscriptData {
  interviewId: string;
  transcript: string;
  botName: string;
  interviewType: string;
  duration: number;
  timestamp: { toDate?: () => Date } | string | null;
  applicantName?: string;
}

interface TranscriptDisplayProps {
  interviewId: string;
}

export function TranscriptDisplay({ interviewId }: TranscriptDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(
    null,
  );
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);

  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/get-transcript?interviewId=${interviewId}`,
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch transcript");
        }

        const data: TranscriptData = await response.json();
        setTranscriptData(data);

        // Parse the transcript
        if (data.transcript) {
          const parsedMessages = parseTranscript(data.transcript);
          setMessages(parsedMessages);
        }
      } catch (err) {
        console.error("Error fetching transcript:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load transcript",
        );
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) {
      fetchTranscript();
    }
  }, [interviewId]);

  const parseTranscript = (transcript: string): TranscriptMessage[] => {
    const lines = transcript.split("\n");
    const parsedMessages: TranscriptMessage[] = [];

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      if (trimmedLine.startsWith("User:")) {
        parsedMessages.push({
          type: "user",
          content: trimmedLine.substring(5).trim(),
        });
      } else if (trimmedLine.startsWith("AI:")) {
        parsedMessages.push({
          type: "ai",
          content: trimmedLine.substring(3).trim(),
        });
      }
    });

    return parsedMessages;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatTimestamp = (
    timestamp: { toDate?: () => Date } | string | null,
  ) => {
    if (!timestamp) return "N/A";

    try {
      let date: Date;
      if (typeof timestamp === "object" && timestamp.toDate) {
        date = timestamp.toDate();
      } else if (typeof timestamp === "string") {
        date = new Date(timestamp);
      } else {
        return "N/A";
      }

      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    } catch {
      return "N/A";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
          <p className="text-black/65">Loading transcript, please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-5">
        <div className="text-center">
          <FaExclamationCircle className="mb-3 text-red-400" size={32} />
          <p className="text-red-300 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!transcriptData || messages.length === 0) {
    return (
      <div className="flex items-center justify-center p-5">
        <div className="text-center">
          <p className="text-black/65">No transcript available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header Info */}
      <div className="mb-4 pb-3 border-b border-white/80">
        <div className="flex flex-wrap gap-3 text-sm text-black/75">
          <div className="flex items-center gap-2">
            <span>{transcriptData.botName}</span>
          </div>
          <div className="flex items-center gap-2">
            <BiTime size={14} />
            <span>{formatDuration(transcriptData.duration)}</span>
          </div>
          {transcriptData.timestamp && (
            <div>
              <span>{formatTimestamp(transcriptData.timestamp)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`rounded-xl p-4 mb-4 ${
              message.type === "user" ? "bg-green-900/20 " : "bg-blue-900/20 "
            }`}
          >
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold mb-2 ${
                message.type === "user"
                  ? "bg-green-700/50 text-white"
                  : "bg-blue-700/50 text-white"
              }`}
            >
              {message.type === "user" ? (
                <span>{transcriptData.applicantName || "Applicant"}</span>
              ) : (
                <span>AI</span>
              )}
            </div>
            <p className="mb-0 leading-relaxed text-black">{message.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
