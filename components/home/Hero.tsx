"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  isVisible: boolean;
}

export default function Hero({ isVisible }: HeroProps) {
  return (
    <div
      className={`max-w-3xl px-8 text-center transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Main heading */}
      <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
        Build something
        <span className="block mt-2">amazing</span>
      </h1>

      {/* Subheading */}
      <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto font-light">
        A beautiful landing page template built with Next.js, React, and
        Tailwind CSS. Customize it to create your perfect website.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
        <a
          href="/interviews/LxritOM9JKqOK63w9y4c"
          className="group bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-3 min-w-[200px] justify-center"
        >
          <span>Get started</span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </a>

        <button className="text-gray-600 hover:text-gray-900 px-8 py-4 text-lg transition-colors">
          Learn more
        </button>
      </div>

      {/* Simple footer text */}
    </div>
  );
}
