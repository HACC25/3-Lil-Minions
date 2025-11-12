"use client";

import React from "react";

export default function Footer() {
  return (
    <>
      {/* Bottom corner info */}
      <div className="absolute bottom-8 left-8 text-xs text-gray-500">
        Free • Open source
      </div>

      <div className="absolute bottom-8 right-8 text-xs text-gray-500">
        Built with Next.js
      </div>
    </>
  );
}
