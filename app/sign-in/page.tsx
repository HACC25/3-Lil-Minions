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
export default function CompanySignInPage() {
  const router = useRouter();
  const { refreshUserRole } = useAuth();
  const { loading: authLoading, shouldShowForm } = useAuthRedirect();

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError("");
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      logger.debug("Signing in user...");

      // Step 1: Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      logger.success("User signed in:", userCredential.user.uid);

      // Step 2: Get the user's custom claims (role)
      const idTokenResult = await userCredential.user.getIdTokenResult();
      const role = idTokenResult.claims.role;

      logger.debug("User role:", role);

      // Step 3: Check if user has company role
      if (role !== "company") {
        logger.error("User is not a company. Role:", role);
        setError(
          "This account is not registered as a company. Please sign up as a company.",
        );
        // Sign out the user since they don't have the right role
        await auth.signOut();
        setLoading(false);
        return;
      }

      // Step 4: Refresh role in AuthContext
      await refreshUserRole();

      logger.success("Sign in complete! Redirecting to dashboard...");

      // Step 5: Redirect to company dashboard
      router.push("/dashboard/companies");
    } catch (err: any) {
      logger.error("Sign in error:", err);

      // Handle specific Firebase Auth errors
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError(err.message || "An error occurred during sign in");
      }

      setLoading(false);
    }
  };

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div
        style={{
          maxWidth: "500px",
          margin: "50px auto",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#000" }}>Loading...</p>
      </div>
    );
  }

  // Don't render form if user is logged in (will redirect)
  if (!shouldShowForm) {
    return null;
  }

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
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

        {/* <div
          className="size-full relative md:absolute md:inset-0 flex items-center pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="grid justify-end gap-12 items-center">
              <div className="size-full md:mt-40 relative md:absolute md:w-2/5 md:h-[470px] md:right-30  bg-white/20 backdrop-blur-md rounded-3xl shadow-2xl" />
            </div>
          </div>
        </div> */}

        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
          className="hidden lg:block absolute inset-0 pointer-events-none"
          style={{ zIndex: 2 }}
        >
          <TropicalScene />
        </motion.div>

        {/* Sign In Form */}
        <div
          className={cn(frostedGlassBg, "relative max-w-[500px] w-full mx-4")}
          style={{
            padding: "40px",
            zIndex: 10,
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
            Company Sign In
          </h1>
          <p style={{ color: "#000", marginBottom: "40px", fontSize: "15px" }}>
            Sign in to your company account
          </p>

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
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: "15px",
                  borderRadius: "6px",
                  color: "#000",
                  border: "1px solid #e5e7eb",
                  transition: "all 0.2s ease",
                }}
                className="bg-white/50"
                placeholder="company@example.com"
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
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className="bg-white/50"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
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
                  placeholder="Enter your password"
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
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
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Sign Up Link */}
          <div
            style={{
              marginTop: "32px",
              textAlign: "center",
              paddingTop: "24px",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <p style={{ color: "#000", fontSize: "14px" }}>
              Don't have an account?{" "}
              <a
                href="/sign-up"
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
                Sign Up →
              </a>
            </p>
          </div>

          {/* Forgot Password (placeholder) */}
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert("Password reset feature coming soon!");
              }}
              style={{
                color: "#000",
                textDecoration: "none",
                fontSize: "13px",
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.7";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              Forgot password?
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
