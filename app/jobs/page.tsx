"use client";

import { useState } from "react";
import { Card, CardBody } from "@nextui-org/react";
import { Search, Building2, Briefcase, Globe } from "lucide-react";
import Link from "next/link";
import { useAllCompanies } from "@/hooks/useAllCompanies";
import { bgUrl } from "@/utils/styles";

export default function JobsPage() {
  const { companies, loading } = useAllCompanies();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");

  // Extract unique industries from companies
  const industries = Array.from(
    new Set(
      companies
        .map((company) => company.industry)
        .filter((industry): industry is string => Boolean(industry)),
    ),
  ).sort();

  // Filter companies based on search query and industry
  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesIndustry =
      selectedIndustry === "all" || company.industry === selectedIndustry;

    return matchesSearch && matchesIndustry;
  });

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center relative"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${bgUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <p className="text-white text-lg">Loading jobs...</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${bgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Header */}
      <div className="px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">
            Browse Companies
          </h1>
          <p className="text-white/90">
            Explore {companies.length} compan
            {companies.length !== 1 ? "ies" : "y"} hiring on our platform
          </p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="px-8 pb-4">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
              <input
                type="text"
                placeholder="Search companies by name, industry, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors text-xl"
                >
                  ×
                </button>
              )}
            </div>

            {/* Industry Filter Dropdown */}
            {industries.length > 0 && (
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="px-4 py-3 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all appearance-none cursor-pointer min-w-[200px]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1rem center",
                }}
              >
                <option value="all" className="bg-gray-800 text-white">
                  All Industries
                </option>
                {industries.map((industry) => (
                  <option
                    key={industry}
                    value={industry}
                    className="bg-gray-800 text-white"
                  >
                    {industry}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Companies List */}
      <div className="px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-lg font-semibold text-white mb-2">
                {searchQuery ? "No companies found" : "No companies available"}
              </h3>
              <p className="text-white/80">
                {searchQuery
                  ? `No companies match "${searchQuery}"`
                  : "Check back later for new companies"}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCompanies.map((company) => (
                <Link
                  key={company.id || company.companyName}
                  href={`/jobs/company/${company.id}`}
                >
                  <Card className="border border-white/30 bg-white/20 backdrop-blur-md hover:bg-white/25 hover:shadow-xl transition-all cursor-pointer h-full">
                    <CardBody className="p-6">
                      {/* Company Name */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-full bg-white/10">
                          <Building2 size={24} className="text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-white line-clamp-2">
                          {company.companyName}
                        </h3>
                      </div>

                      {/* Company Details */}
                      <div className="space-y-2 mb-4">
                        {company.industry && (
                          <div className="flex items-center gap-2 text-sm text-white/90">
                            <Briefcase size={16} className="text-white/70" />
                            <span>{company.industry}</span>
                          </div>
                        )}

                        {company.website && (
                          <div className="flex items-center gap-2 text-sm text-white/90">
                            <Globe size={16} className="text-white/70" />
                            <span className="truncate">{company.website}</span>
                          </div>
                        )}
                      </div>

                      {/* Job Stats */}
                      <div className="pt-4 border-t border-white/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/70">
                            Active Jobs
                          </span>
                          <span className="text-sm font-semibold text-emerald-300">
                            {company.activeJobsCount || 0}
                          </span>
                        </div>

                        {company.totalApplications !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white/70">
                              Total Applications
                            </span>
                            <span className="text-sm font-medium text-white">
                              {company.totalApplications}
                            </span>
                          </div>
                        )}

                        {company.verified && (
                          <div className="pt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">
                              ✓ Verified
                            </span>
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
