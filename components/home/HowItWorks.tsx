"use client";

import { motion } from "framer-motion";
import Card3D from "./Card3D";

const steps = [
  {
    label: "STEP 1",
    title: "Post Jobs and AI Interviews",
    description:
      "Employers post their job opportunities on the platform with detailed requirements and qualifications. They also create unique AI interview agents that will conduct second round screening for each listing.",
    image: "https://cloudflare.hexcelerate.app/step1-job-upload%20(2).mov",
  },
  {
    label: "STEP 2",
    title: "AI Initial Screening (Instant)",
    description:
      "Applicants submit their applications and are immediately screened by AI against job requirements. Results are instant.",
    image: "https://cloudflare.hexcelerate.app/step2-Apply%20(1).mov",
  },
  {
    label: "STEP 3",
    title: "AI Second Round Interview",
    description:
      "Qualified applicants receive an email invitation to conduct a second-round AI interview where an AI agent assesses their fit for the role while saving companies valuable time.",
    image: "https://cloudflare.hexcelerate.app/step3-AI.mov",
  },
  {
    label: "LASTLY",
    title: "Review & Hire",
    description:
      "Hiring teams review AI screening and interview data, track all applicants, and make well-informed hiring decisions. Teams can even send interview invitations to those who didn't initially pass.",
    image: "https://cloudflare.hexcelerate.app/step4-LASTLY.mov",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-yellow-50 via-blue-50 to-amber-50">
      {/* Background Image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1542259009477-d625272157b7?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2069')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      ></div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-50 via-blue-50/60 to-amber-50/70"></div>

      {/* Background decoration with tropical theme */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-amber-400 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl md:text-6xl font-bold text-black mb-6">
            How{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-amber-500 to-blue-600">
              BANANA AI
            </span>{" "}
            Works
          </h2>
          <p className="text-xl text-black max-w-3xl mx-auto font-medium">
            3 step end-to-end solution for job listing, AI screening,
            second-round interviewing, applicant tracking, and data-driven
            hiring decisions — all in one platform.
          </p>
        </motion.div>

        {/* Steps with 3D Cards */}
        <div className="space-y-70">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`grid md:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              {/* Content Side */}
              <motion.div
                className={`flex flex-col gap-4 ${
                  index % 2 === 1 ? "md:order-2" : ""
                }`}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ amount: 0.3 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 px-4 py-2 rounded-full flex-shrink-0">
                    <span className="text-sm font-bold text-black uppercase">
                      {step.label}
                    </span>
                  </div>

                  <div className="flex flex-col gap-4">
                    <h3 className="text-4xl font-bold text-black leading-tight">
                      {step.title}
                    </h3>

                    <p className="text-lg text-black leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* 3D Card Side */}
              <motion.div
                className={index % 2 === 1 ? "md:order-1" : ""}
                initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card3D
                  src={step.image}
                  alt={step.title}
                  width={700}
                  height={450}
                  playbackSpeed={4}
                  autoPlay={false}
                  showDuration={true}
                />
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
