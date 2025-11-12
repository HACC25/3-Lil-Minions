"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { motion } from "framer-motion";
import { bgUrl } from "@/utils/styles";
interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarOpen");
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  // Persist sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  return (
    <div className="relative min-h-screen">
      <motion.div
        // initial={{ opacity: 0 }}
        // whileInView={{ opacity: 1 }}
        // viewport={{ amount: 0.3 }}
        // transition={{ duration: 1 }}
        className="fixed inset-0"
        style={{
          backgroundImage: `url(${bgUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 0,
        }}
      />
      <BgOverlay />

      <div className="relative flex h-screen" style={{ zIndex: 10 }}>
        {/* Sidebar */}
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Content Area */}

        <main className="flex-1 overflow-auto">
          <div className="h-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

export function BgOverlay() {
  return (
    <div
      className="fixed inset-0 bg-gradient-to-r from-blue-500/20 to-teal-600/40"
      style={{ zIndex: 1 }}
    ></div>
  );
}
