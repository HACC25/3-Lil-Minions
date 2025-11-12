import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { bgUrl } from "@/utils/styles";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
}); // src/app/layout.tsx
import React from "react";
import { CameraProvider } from "@/components/InterviewSession/CameraContext";
import { AuthProvider } from "@/lib/AuthContext";
export const metadata = {
  title: "Banana AI",
  description:
    "We automate early-stage screening to improve hiring outcomes and reduce bias.",
  openGraph: {
    images: [
      {
        url: "/homepage.png",
        width: 1200,
        height: 630,
        alt: "Banana AI - Agentic AI Interviews",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/homepage.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <style>{`
          :root {
            background-color: white;
          }
          body {
            background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0)), url(${bgUrl});
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            background-repeat: no-repeat;
            min-height: 100vh;
          }
        `}</style>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased light-mode`}
      >
        <AuthProvider>
          <CameraProvider>{children}</CameraProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
