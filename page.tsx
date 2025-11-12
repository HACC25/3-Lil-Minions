"use client";

import React, { useState, useEffect } from "react";
import Logo from "@/components/home/Logo";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import BackgroundPattern from "@/components/home/BackgroundPattern";
import Footer from "@/components/home/Footer";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div
      className="h-screen w-screen bg-white flex items-center justify-center overflow-hidden"
      style={{
        fontFamily:
          '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <Logo />

      <div className="max-w-3xl px-8 text-center">
        <Hero isVisible={isVisible} />
        <div
          className={`transition-all duration-1000 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Features />
        </div>
      </div>

      <Footer />
      <BackgroundPattern />
    </div>
  );
}
