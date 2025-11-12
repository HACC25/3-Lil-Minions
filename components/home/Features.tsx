"use client";

import React from "react";
import { Zap, Shield, Sparkles } from "lucide-react";

const features = [
  {
    icon: Zap,
    label: "Lightning fast",
  },
  {
    icon: Shield,
    label: "Secure & reliable",
  },
  {
    icon: Sparkles,
    label: "Easy to customize",
  },
];

export default function Features() {
  return (
    <div className="flex justify-center gap-8 mb-12">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <div key={index} className="flex items-center gap-2 text-gray-600">
            <Icon className="w-4 h-4" />
            <span className="text-sm">{feature.label}</span>
          </div>
        );
      })}
    </div>
  );
}
