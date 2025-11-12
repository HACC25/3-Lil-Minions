"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useRef } from "react";
import TropicalScene from "@/components/home/TropicalScene";
import HowItWorks from "@/components/home/HowItWorks";
import Card3D from "@/components/home/Card3D";
import { bgUrl, frostedGlassBg } from "@/utils/styles";
export default function HawaiiAIScreeningLanding() {
  const [bananas, setBananas] = useState<
    { id: number; x: number; delay: number }[]
  >([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/minion-theme.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log("Audio play error:", err));
    }
  };

  const makeBananaRain = () => {
    const newBananas = Array.from({ length: 50 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
    }));
    setBananas(newBananas);

    // Play Minion music
    if (!audioRef.current) {
      audioRef.current = new Audio("/minion-theme.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
    }

    // Always try to play when button is clicked
    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
        console.log("Music started playing");
      })
      .catch((err) => {
        console.log("Audio play error:", err);
        setIsPlaying(false);
      });

    // Clear bananas after animation
    setTimeout(() => setBananas([]), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-blue-50 overflow-x-hidden flex flex-col">
      {/* Banana Rain */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {bananas.map((banana) => (
          <motion.div
            key={banana.id}
            initial={{ y: -100, x: `${banana.x}vw`, rotate: 0 }}
            animate={{
              y: "110vh",
              rotate: 360,
            }}
            transition={{
              duration: 2 + banana.delay,
              delay: banana.delay,
              ease: "linear",
            }}
            className="absolute text-4xl"
          >
            🍌
          </motion.div>
        ))}
      </div>

      <section className="relative min-h-screen pt-20 pb-32 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.85) blur(2px)",
            zIndex: 0,
          }}
        />

        <div
          className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-blue-900/30"
          style={{ zIndex: 1 }}
        ></div>

        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
          className="hidden lg:block absolute inset-0 pointer-events-none"
          style={{ zIndex: 2 }}
        >
          <TropicalScene />
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-200px)]">
            {/* Left Side - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1"
            >
              <motion.h1
                className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                KEEP LOCAL
                <br />
                TALENT
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
                  {" "}
                  LOCAL
                </span>
                <sup className="text-xl lg:text-2xl">®</sup>
              </motion.h1>

              <motion.p
                className="text-lg sm:text-xl text-yellow-100 mb-8 font-bold italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Minions with Banana AI, transforming Hawaii hiring!
              </motion.p>

              <div className="flex flex-col gap-y-8 items-start">
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  {/* link to primary company id, change to dhrd?? */}
                  <Link href="/jobs/company/mE9pbwo7p5PUtUw574hLvEr92Qz2">
                    <motion.button
                      className="w-full sm:w-auto px-6 py-3 bg-white/30 backdrop-blur-md text-white rounded-full text-sm sm:text-base font-bold hover:shadow-2xl cursor-pointer transition-all duration-300 transform hover:bg-white/40 whitespace-nowrap"
                      initial={{ opacity: 0, y: 0 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      FIND CAREERS
                    </motion.button>
                  </Link>
                  <Link href="/jobs">
                    <motion.button
                      className="w-full sm:w-auto px-6 py-3 bg-white/30 backdrop-blur-md text-white rounded-full text-sm sm:text-base font-bold hover:shadow-2xl cursor-pointer transition-all duration-300 transform hover:bg-white/40 whitespace-nowrap"
                      initial={{ opacity: 0, y: 0 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      VIEW COMPANIES
                    </motion.button>
                  </Link>
                  <Link href="/sign-up">
                    <motion.button
                      className="w-full sm:w-auto px-6 py-3 bg-white/30 backdrop-blur-md text-white rounded-full text-sm sm:text-base font-bold hover:shadow-2xl cursor-pointer transition-all duration-300 transform hover:bg-white/40 whitespace-nowrap"
                      initial={{ opacity: 0, y: 0 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      UPLOAD JOBS
                    </motion.button>
                  </Link>
                </div>
                <img
                  src="/dhrd-logo-monochrome.png"
                  style={{ filter: "invert(1)" }}
                  className="h-32 w-32 sm:h-40 sm:w-40 lg:h-52 lg:w-52"
                  alt="DHRD Logo"
                />
              </div>
            </motion.div>

            {/* Right Side - Video Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="order-1 lg:order-2 lg:mt-80"
            >
              <Card3D
                src="https://jobs.hawaii.gov/wp-content/uploads/2024/01/DHRD-banner-compressed.mp4"
                alt="Hawaii Department of Human Resources Development"
                width={700}
                height={600}
                isVideo={true}
              />
            </motion.div>
          </div>
        </div>

        {/* Smooth bottom transition to blend into HowItWorks */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10">
          <svg
            className="relative block w-full h-32"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            style={{ transform: "rotate(180deg)" }}
          >
            <path
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
              className="fill-yellow-50"
            ></path>
          </svg>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Impact Section */}
      <section className="py-32 relative overflow-hidden flex-grow">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 bg-gradient-to-br from-amber-700/50 to-blue-900/70"
        ></motion.div>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1528844433838-6115c9c13a14?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1740')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ amount: 0.3 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                {/* What Makes Us Different Section */}
                <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <div className="mb-6">
                    <h3 className="text-3xl font-bold text-white mb-2">
                      Our Platform Advantage
                    </h3>
                    <div className="w-20 h-1 bg-yellow-400 rounded-full"></div>
                  </div>
                  <p className="text-yellow-50 text-lg leading-relaxed mb-6">
                    Complete end-to-end recruitment powered by AI
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-amber-900 text-sm font-bold">
                          1
                        </span>
                      </div>
                      <p className="text-yellow-50">
                        <span className="font-bold text-white">
                          Job Posting
                        </span>{" "}
                        - Streamlined listing interface
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-amber-900 text-sm font-bold">
                          2
                        </span>
                      </div>
                      <p className="text-yellow-50">
                        <span className="font-bold text-white">
                          Instant AI Screening
                        </span>{" "}
                        - Real-time candidate evaluation
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-amber-900 text-sm font-bold">
                          3
                        </span>
                      </div>
                      <p className="text-yellow-50">
                        <span className="font-bold text-white">
                          Second Round AI Interviews
                        </span>{" "}
                        - Automated candidate assessments
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-amber-900 text-sm font-bold">
                          4
                        </span>
                      </div>
                      <p className="text-yellow-50">
                        <span className="font-bold text-white">
                          Applicant Tracking
                        </span>{" "}
                        - Complete management dashboard
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-yellow-300/20">
                    <p className="text-yellow-100 font-semibold">
                      Save time, reduce bias, keep Hawaii's talent local.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ amount: 0.3 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-6xl font-bold text-white mb-6 drop-shadow-lg">
                <span className="text-yellow-300">IMUA</span>
                <br />
                GROW LOCAL
                <br />
                EMPOWER HAWAI'I
                {/* <span className="text-yellow-300"> PARADISE!</span> */}
              </h2>
              <p className="text-yellow-50 text-lg font-medium">
                Bello! Click{" "}
                <span className="text-yellow-300 font-extrabold">below</span>{" "}
                for BANANA surprise! Hehe!
              </p>
              <img
                src={"/minion-outline.png"}
                height={200}
                width={200}
                className="-mt-3 ml-2"
              />
              <motion.button
                onClick={isPlaying ? toggleAudio : makeBananaRain}
                className={`px-8 w-[220px]  rounded-full font-bold ${frostedGlassBg}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isPlaying ? "🔇 STOP MUSIC" : "YES TO BANANA!"}
              </motion.button>
            </motion.div>
          </div>

          {/* Footer */}
          <footer className="text-white mt-20">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <span className="text-2xl font-bold">
                    <span className="text-white">BANANA</span> AI
                  </span>
                </div>
                <p className="text-white text-base font-medium mb-8">
                  Keeping Hawaii's talent through smart{" "}
                  <span className="font-bold text-yellow-300">BANANA</span>
                  -powered screening!
                </p>
                <div className="border-t border-white pt-8 text-white text-sm">
                  <p className="font-medium">
                    © 2025 Hawai'i Annual Coding Challenge
                    <br />
                    <span className="text-yellow-300 font-bold text-lg">
                      Powered by BANANA AI System
                    </span>
                    <br />
                    All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
