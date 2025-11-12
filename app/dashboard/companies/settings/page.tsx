"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard";
import { Card, CardBody, Button } from "@nextui-org/react";
import { LogOut, Upload, Image as ImageIcon } from "lucide-react";
import { logger } from "@/lib/logger";
import { frostedGlassBg } from "@/utils/styles";
import { cn } from "@/utils/styles";
import { auth } from "@/firebaseConfig/firebase";
function SettingsContent() {
  const { signOut, user } = useAuth();
  const router = useRouter();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch current logo on mount
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!user?.uid) return;

      try {
        const response = await fetch(`/api/companies/${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          if (data.logoUrl) {
            setCurrentLogoUrl(data.logoUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
      }
    };

    fetchCompanyData();
  }, [user]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setUploadError("Please upload a JPG, PNG, or WebP image");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("File size must be less than 5MB");
        return;
      }

      setUploadError(null);
      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setUploadError("Please upload a JPG, PNG, or WebP image");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("File size must be less than 5MB");
        return;
      }

      setUploadError(null);
      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;

    setIsUploadingLogo(true);
    setUploadError(null);

    try {
      // Get auth token
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Create form data
      const formData = new FormData();
      formData.append("logo", logoFile);

      // Upload logo
      const response = await fetch("/api/companies/upload-logo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload logo");
      }

      // Update current logo
      setCurrentLogoUrl(data.logoUrl);
      setLogoFile(null);
      setLogoPreview(null);

      logger.success("Logo uploaded successfully!");
    } catch (error) {
      logger.error("Error uploading logo:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload logo",
      );
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      logger.error("Error signing out:", error);
      alert("Failed to sign out. Please try again.");
    }
  };

  return (
    <DashboardLayout>
      <div className={cn("min-h-screen ")}>
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-2 text-gray-600">Manage your account settings</p>
          </div>

          <div className={cn(frostedGlassBg, "space-y-6")}>
            {/* Company Logo Section */}
            <Card className="">
              <CardBody className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-black mb-1">
                    Company Logo
                  </h2>
                  <p className="text-sm text-black">
                    Upload your company logo to personalize your profile
                  </p>
                </div>

                {/* Current Logo Display */}
                {currentLogoUrl && (
                  <div className="mb-4">
                    <p className="text-sm text-black mb-2 font-medium">
                      Current Logo:
                    </p>
                    <div className="w-32 h-32 border-2 border-white/30 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                      <img
                        src={currentLogoUrl}
                        alt="Company Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Logo Preview */}
                {logoPreview && (
                  <div className="mb-4">
                    <p className="text-sm text-black mb-2 font-medium">
                      Preview:
                    </p>
                    <div className="w-32 h-32 border-2 border-cyan-700 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {uploadError && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
                    <p className="text-red-900 text-sm font-medium">
                      {uploadError}
                    </p>
                  </div>
                )}

                {/* Drag & Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`mb-4 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
                      ? "border-black bg-black/5"
                      : "border-white/30 bg-white/5 hover:border-black/50 hover:bg-white/10"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <ImageIcon size={40} className="text-black/60" />
                    <div>
                      <p className="text-black font-medium mb-1">
                        Drop your logo here or click to browse
                      </p>
                      <p className="text-xs text-black/70">
                        JPG, PNG, or WebP (Max 5MB)
                      </p>
                    </div>
                  </label>
                  {logoFile && (
                    <p className="mt-3 text-sm text-black font-medium">
                      Selected: {logoFile.name}
                    </p>
                  )}
                </div>

                {/* Upload Button */}
                {logoFile && (
                  <Button
                    startContent={<Upload size={18} />}
                    className="bg-black text-white hover:bg-gray-800 w-fit h-10 rounded-lg font-medium text-sm normal-case"
                    onPress={handleUploadLogo}
                    isLoading={isUploadingLogo}
                    isDisabled={isUploadingLogo}
                  >
                    {isUploadingLogo ? "Uploading..." : "Submit"}
                  </Button>
                )}

                <p className="text-xs text-black mt-3">
                  Accepted formats: JPG, PNG, WebP (Max 5MB)
                </p>
              </CardBody>
            </Card>

            {/* Sign Out Section */}
            <Card className="">
              <CardBody className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    Account
                  </h2>
                  <p className="text-sm text-gray-600">
                    Sign out of your account
                  </p>
                </div>

                <Button
                  startContent={<LogOut size={18} />}
                  className={cn(
                    frostedGlassBg,
                    " text-red-600 hover:shadow-none hover:bg-white w-fit h-10 rounded-lg font-medium text-sm normal-case",
                  )}
                  onPress={handleSignOut}
                >
                  Sign Out
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredRole="company">
      <SettingsContent />
    </ProtectedRoute>
  );
}
