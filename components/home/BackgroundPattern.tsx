"use client";

import React from "react";

export default function BackgroundPattern() {
  return (
    <div className="absolute inset-0 -z-10">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gray-50 rounded-full filter blur-3xl opacity-50 animate-pulse" />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-50 rounded-full filter blur-3xl opacity-50 animate-pulse"
        style={{ animationDelay: "2s" }}
      />
    </div>
  );
}
