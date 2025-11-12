/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebaseConfig/firebase";
import { useAuth } from "@/lib/AuthContext";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { logger } from "@/lib/logger";
import { motion } from "framer-motion";
import TropicalScene from "@/components/home/TropicalScene";
import { bgUrl, frostedGlassBg } from "@/utils/styles";
import { cn } from "@/utils/styles";

export default function CompanySignUpPage() {
  const router = useRouter();
  const { refreshUserRole } = useAuth();
  const { loading: authLoading, shouldShowForm } = useAuthRedirect();

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    companyName: "",
    website: "",
    industry: "",
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError("");
  };

  // Handle next button (Step 1 -> Step 2)
  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate step 1 fields
    if (!formData.companyName.trim()) {
      setError("Company name is required");
      return;
    }

    setError("");
    setStep(2);
  };

  // Handle back button (Step 2 -> Step 1)
  const handleBack = () => {
    setError("");
    setStep(1);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      logger.debug("Submitting company signup...");

      // Step 1: Call our API to create the company account
      const response = await fetch("/api/auth/company-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          companyName: formData.companyName,
          website: formData.website || undefined,
          industry: formData.industry || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      logger.success(" Company account created:", data);

      // Step 2: Sign in the user
      logger.debug("= Signing in user...");
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      // Step 3: Force token refresh to get custom claims
      logger.debug("= Refreshing token to get custom claims...");
      await userCredential.user.getIdToken(true);

      // Step 4: Refresh role in AuthContext
      await refreshUserRole();

      logger.success(" Sign up and sign in complete!");

      // Step 5: Redirect to company dashboard
      router.push("/dashboard/companies");
    } catch (err: any) {
      logger.error("Signup error:", err);
      setError(err.message || "An error occurred during signup");
      setLoading(false);
    }
  };

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <section className="relative min-h-screen  overflow-hidden">
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
        <div
          className="relative flex items-center justify-center min-h-screen"
          style={{ zIndex: 50 }}
        >
          <div className="bg-white/20 backdrop-blur-md rounded-3xl shadow-2xl p-8">
            <p className="text-white text-lg">Loading...</p>
          </div>
        </div>
      </section>
    );
  }

  // Don't render form if user is logged in (will redirect)
  if (!shouldShowForm) {
    return null;
  }

  return (
    <>
      <section className="relative min-h-screen py-20 overflow-hidden">
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

        {/* Sign Up Form */}
        <div
          className={cn(frostedGlassBg, "relative max-w-[1000px]")}
          style={{
            margin: "50px auto",
            padding: "40px",
            zIndex: 50,
            position: "relative",
          }}
        >
          <h1
            style={{
              marginBottom: "8px",
              color: "#000",
              fontSize: "28px",
              fontWeight: 600,
            }}
          >
            Company Sign Up
          </h1>
          <p style={{ color: "#000", marginBottom: "40px", fontSize: "15px" }}>
            Create your company account to get started
          </p>

          {/* Step Indicator - Enterprise Style */}
          <div
            style={{
              marginBottom: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
              paddingTop: "8px",
              paddingBottom: "8px",
            }}
          >
            {/* Progress Line */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "40px",
                right: "40px",
                height: "2px",
                backgroundColor: "#e5e7eb",
                zIndex: 0,
                transform: "translateY(-50%)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: step === 2 ? "100%" : "0%",
                  backgroundColor: "#000",
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            {/* Step 1 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flex: 1,
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: step >= 1 ? "#000" : "#fff",
                  border: step >= 1 ? "2px solid #000" : "2px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: step >= 1 ? "#fff" : "#000",
                  transition: "all 0.3s ease",
                }}
              >
                1
              </div>
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#000",
                  }}
                >
                  Company Info
                </div>
                <div style={{ fontSize: "12px", color: "#000" }}>
                  Basic details
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flex: 1,
                zIndex: 1,
                justifyContent: "flex-end",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#000",
                    textAlign: "right",
                  }}
                >
                  Account Details
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#000",
                    textAlign: "right",
                  }}
                >
                  Login credentials
                </div>
              </div>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: step === 2 ? "#000" : "#fff",
                  border: step === 2 ? "2px solid #000" : "2px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: step === 2 ? "#fff" : "#000",
                  transition: "all 0.3s ease",
                }}
              >
                2
              </div>
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "14px 16px",
                marginBottom: "24px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                color: "#dc2626",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "16px" }}>⚠️</span>
              {error}
            </div>
          )}

          {/* Step 1: Company Information */}
          {step === 1 && (
            <form onSubmit={handleNext}>
              {/* Company Name */}
              <div style={{ marginBottom: "24px" }}>
                <label
                  htmlFor="companyName"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 500,
                    color: "#111827",
                    fontSize: "14px",
                  }}
                >
                  Company Name *
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="bg-white/50"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "15px",
                    borderRadius: "6px",
                    color: "#000",
                    border: "1px solid #e5e7eb",
                    transition: "all 0.2s ease",
                  }}
                  placeholder="Enter company name"
                  autoFocus
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#000";
                    e.currentTarget.style.outline = "none";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }}
                />
              </div>

              {/* Website (Optional) */}
              <div style={{ marginBottom: "24px" }}>
                <label
                  htmlFor="website"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 500,
                    color: "#111827",
                    fontSize: "14px",
                  }}
                >
                  Website{" "}
                  <span style={{ color: "#000", fontWeight: 400 }}>
                    (Optional)
                  </span>
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="bg-white/50"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "15px",
                    borderRadius: "6px",
                    color: "#000",
                    border: "1px solid #e5e7eb",
                    transition: "all 0.2s ease",
                  }}
                  placeholder="https://yourcompany.com"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#000";
                    e.currentTarget.style.outline = "none";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }}
                />
              </div>

              {/* Industry (Optional) */}
              <div style={{ marginBottom: "32px" }}>
                <label
                  htmlFor="industry"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 500,
                    color: "#111827",
                    fontSize: "14px",
                  }}
                >
                  Industry{" "}
                  <span style={{ color: "#000", fontWeight: 400 }}>
                    (Optional)
                  </span>
                </label>
                <select
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="bg-white/50"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "15px",
                    borderRadius: "6px",
                    color: "#000",
                    border: "1px solid #e5e7eb",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#000";
                    e.currentTarget.style.outline = "none";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }}
                >
                  <option value="">Select an industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Education">Education</option>
                  <option value="Retail">Retail</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Next Button */}
              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "14px 24px",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#fff",
                  backgroundColor: "#000",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  letterSpacing: "0.3px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#1f2937";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#000";
                }}
              >
                Continue →
              </button>
            </form>
          )}

          {/* Step 2: Account Details */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div style={{ marginBottom: "24px" }}>
                <label
                  htmlFor="email"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 500,
                    color: "#111827",
                    fontSize: "14px",
                  }}
                >
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="bg-white/50"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "15px",
                    borderRadius: "6px",
                    color: "#000",
                    border: "1px solid #e5e7eb",
                    transition: "all 0.2s ease",
                  }}
                  placeholder="company@example.com"
                  autoFocus
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#000";
                    e.currentTarget.style.outline = "none";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: "32px" }}>
                <label
                  htmlFor="password"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 500,
                    color: "#111827",
                    fontSize: "14px",
                  }}
                >
                  Password *
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    disabled={loading}
                    className="bg-white/50"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      paddingRight: "60px",
                      fontSize: "15px",
                      borderRadius: "6px",
                      color: "#000",
                      border: "1px solid #e5e7eb",
                      transition: "all 0.2s ease",
                    }}
                    placeholder="Min 8 characters"
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#000";
                      e.currentTarget.style.outline = "none";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#e5e7eb";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: "#000",
                      fontWeight: 500,
                      padding: "4px 8px",
                    }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <small
                  style={{
                    color: "#000",
                    fontSize: "13px",
                    marginTop: "6px",
                    display: "block",
                  }}
                >
                  Minimum 8 characters
                </small>
              </div>

              {/* Navigation Buttons */}
              <div style={{ display: "flex", gap: "12px", marginTop: "30px" }}>
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  style={{
                    flex: "0 0 120px",
                    padding: "14px 24px",
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "#000",
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    letterSpacing: "0.3px",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                      e.currentTarget.style.borderColor = "#d1d5db";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = "#fff";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                    }
                  }}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "14px 24px",
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "#fff",
                    backgroundColor: loading ? "#666" : "#000",
                    border: "none",
                    borderRadius: "6px",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    letterSpacing: "0.3px",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = "#1f2937";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = "#000";
                    }
                  }}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </form>
          )}

          {/* Sign In Link */}
          <div
            style={{
              marginTop: "32px",
              textAlign: "center",
              paddingTop: "24px",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <p style={{ color: "#000", fontSize: "14px" }}>
              Already have an account?{" "}
              <a
                href="/sign-in"
                style={{
                  color: "#000",
                  textDecoration: "none",
                  fontWeight: 500,
                  transition: "opacity 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.7";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                Sign In →
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
