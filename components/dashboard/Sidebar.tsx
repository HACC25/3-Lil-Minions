"use client";
import { cn } from "@/utils/styles";
import React, { useState, useEffect } from "react";
import { Tooltip } from "@nextui-org/react";
import {
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Menu,
  Settings,
  Home,
  Globe,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { frostedGlassBg } from "@/utils/styles";

interface SidebarProps {
  open?: boolean;
  onToggle?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  open: controlledOpen,
  onToggle,
}) => {
  const [internalOpen, setInternalOpen] = useState(true);
  const pathname = usePathname();
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleToggle = onToggle || (() => setInternalOpen(!internalOpen));

  const [toggleHovered, setToggleHovered] = useState(false);

  // Fetch company logo
  useEffect(() => {
    const fetchCompanyLogo = async () => {
      if (!user?.uid) return;

      try {
        const response = await fetch(`/api/companies/${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          if (data.logoUrl && typeof data.logoUrl === "string") {
            setLogoUrl(data.logoUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching company logo:", error);
        // Silently fail - logo is optional
        setLogoUrl(null);
      }
    };

    fetchCompanyLogo();
  }, [user]);

  const menuItems: MenuItem[] = [
    {
      id: "home",
      label: "Home",
      icon: <Home size={20} />,
      href: "/dashboard/companies",
    },
    {
      id: "jobs",
      label: "Jobs",
      icon: <Briefcase size={20} />,
      href: "/dashboard/companies/jobs",
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings size={20} />,
      href: "/dashboard/companies/settings",
    },
  ];

  const publicPortalUrl = `/jobs/company/${user?.uid || ""}`;

  const isActive = (href: string) => {
    // For the home page, use exact match to avoid highlighting when on nested routes
    if (href === "/dashboard/companies") {
      return pathname === href;
    }
    // For jobs page, also highlight when viewing applicants (nested route)
    if (href === "/dashboard/companies/jobs") {
      return pathname?.startsWith(href) || pathname?.includes("/applicants");
    }
    // For other pages, check if pathname starts with href (to handle nested routes)
    return pathname?.startsWith(href);
  };

  return (
    <div
      className={cn(
        frostedGlassBg,
        "rounded-2xl ml-3 my-3 mb-3 h-fit transition-all duration-300 ease-in-out flex-shrink-0 relative hover:scale-100",
      )}
      style={{
        width: isOpen ? "280px" : "60px",
        // height: "calc(100vh - 1.5rem)",
      }}
    >
      <div className="w-full h-full flex flex-col">
        {/* Header with Toggle */}
        <div
          className={`flex items-center ${
            isOpen ? "justify-between px-4" : "justify-center px-2"
          } h-[60px]`}
        >
          {isOpen && (
            <div className="flex items-center gap-3">
              {logoUrl && (
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
                  <img
                    src={logoUrl}
                    alt="Company Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      setLogoUrl(null);
                    }}
                  />
                </div>
              )}
              <h2 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">
                Dashboard
              </h2>
            </div>
          )}
          <button
            onClick={handleToggle}
            onMouseEnter={() => setToggleHovered(true)}
            onMouseLeave={() => setToggleHovered(false)}
            className="p-2 rounded-lg text-gray-600 hover:bg-black/10 transition-colors"
          >
            {isOpen ? (
              <ChevronLeft size={20} />
            ) : toggleHovered ? (
              <ChevronRight size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-2 py-4 overflow-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                {!isOpen ? (
                  <Tooltip
                    className="px-3 rounded-full ml-3 bg-white shadow-sm"
                    classNames={{
                      content: "text-black",
                    }}
                    content={item.label}
                    placement="right"
                  >
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                        ${
                          isActive(item.href)
                            ? "bg-black/5 text-black font-medium"
                            : "text-black hover:bg-black/5"
                        }
                        justify-center
                      `}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                    </Link>
                  </Tooltip>
                ) : (
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                      ${
                        isActive(item.href)
                          ? "bg-black/5 text-black font-medium"
                          : "text-zinc-700 hover:bg-black/5"
                      }
                    `}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                      {item.label}
                    </span>
                  </Link>
                )}
              </li>
            ))}

            {/* Public Portal - External Link */}
            <li>
              {!isOpen ? (
                <Tooltip
                  className="px-3 rounded-full ml-3 bg-white shadow-sm"
                  classNames={{
                    content: "text-black",
                  }}
                  content="Public Portal (Opens in new tab)"
                  placement="right"
                >
                  <a
                    href={publicPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-black hover:bg-black/5 justify-center"
                  >
                    <span className="flex-shrink-0">
                      <Globe size={20} />
                    </span>
                  </a>
                </Tooltip>
              ) : (
                <a
                  href={publicPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-zinc-700 hover:bg-black/5"
                >
                  <span className="flex-shrink-0">
                    <Globe size={20} />
                  </span>
                  <span className="text-sm overflow-hidden text-ellipsis whitespace-nowrap flex-1">
                    Public Portal
                  </span>
                  <ExternalLink
                    size={14}
                    className="flex-shrink-0 text-zinc-500"
                  />
                </a>
              )}
            </li>
          </ul>
        </nav>

        {/* Footer - Can add user profile or settings here later */}
        <div className="p-4 border-gray-200">
          {isOpen ? (
            <div className="text-xs text-zinc-600 text-center">Banana AI</div>
          ) : (
            <div className="text-xs text-zinc-600 text-center">BAI</div>
          )}
        </div>
      </div>
    </div>
  );
};
