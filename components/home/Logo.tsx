"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export default function Logo() {
  return (
    <div className="absolute top-8 left-8">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-medium text-gray-900">Your Brand</span>
      </div>
    </div>
  );
}
