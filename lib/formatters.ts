/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Shared formatting utilities for the application
 * Handles date, salary, and other display formatting
 */

/**
 * Formats a date value (Firestore Timestamp, ISO string, or Date) into a readable string
 * @param date - The date to format (can be Firestore Timestamp, string, or Date)
 * @param format - The format type: 'relative' (default) or 'full'
 * @returns Formatted date string or fallback value
 */
export function formatDate(
  date?: any,
  format: "relative" | "full" = "relative",
  fallback: string = "N/A",
): string {
  if (!date) return fallback;

  let jsDate: Date;

  // Handle Firestore Timestamp
  if (date?.toDate && typeof date.toDate === "function") {
    jsDate = date.toDate();
  }
  // Handle Firestore timestamp with seconds
  else if (date?.seconds) {
    jsDate = new Date(date.seconds * 1000);
  }
  // Handle ISO string or other string formats
  else if (typeof date === "string") {
    jsDate = new Date(date);
  }
  // Handle Date object
  else {
    jsDate = new Date(date);
  }

  // Validate the date
  if (isNaN(jsDate.getTime())) {
    return fallback;
  }

  // Return full date format
  if (format === "full") {
    return jsDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  // Return relative time format
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - jsDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return jsDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats a salary object into a readable string
 * @param salary - Salary object with min, max, currency, and period
 * @returns Formatted salary string or null
 */
export function formatSalary(salary?: {
  min?: number;
  max?: number;
  currency?: string;
  period?: "hourly" | "yearly" | "monthly";
}): string | null {
  if (!salary) return null;

  const { min, max, currency = "USD", period = "yearly" } = salary;
  const currencySymbol = currency === "USD" ? "$" : currency;

  if (min && max) {
    return `${currencySymbol}${min.toLocaleString()} - ${currencySymbol}${max.toLocaleString()} / ${period}`;
  } else if (min) {
    return `${currencySymbol}${min.toLocaleString()} / ${period}`;
  } else if (max) {
    return `Up to ${currencySymbol}${max.toLocaleString()} / ${period}`;
  }

  return null;
}

/**
 * Capitalizes the first letter of a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalizeFirst(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formats a location with location type
 * @param location - Location string
 * @param locationType - Type (onsite, remote, hybrid)
 * @returns Formatted location string
 */
export function formatLocation(
  location: string,
  locationType: "onsite" | "remote" | "hybrid",
): string {
  return `${location} (${capitalizeFirst(locationType)})`;
}

/**
 * Application-specific formatters
 */

/**
 * Formats applicant's full name
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Full name string
 */
export function formatApplicantName(
  firstName: string,
  lastName: string,
): string {
  return `${firstName} ${lastName}`;
}

/**
 * Formats application status into display text
 * @param status - Application status
 * @returns Human-readable status string
 */
export function formatApplicationStatus(
  status: "pending" | "reviewing" | "accepted" | "rejected",
): string {
  const statusMap = {
    pending: "Pending Review",
    reviewing: "Under Review",
    accepted: "Accepted",
    rejected: "Not Selected",
  };
  return statusMap[status] || status;
}

/**
 * Gets Tailwind CSS classes for application status badge
 * @param status - Application status
 * @returns Tailwind CSS class string
 */
export function getApplicationStatusColor(
  status: "pending" | "reviewing" | "accepted" | "rejected",
): string {
  const colorMap = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    reviewing: "bg-blue-100 text-blue-800 border-blue-200",
    accepted: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colorMap[status] || "bg-gray-100 text-gray-800 border-gray-200";
}

/**
 * Formats a date as relative time (e.g., "2 hours ago", "3 days ago")
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatRelativeDate(date: any): string {
  if (!date) return "N/A";

  let jsDate: Date;

  // Handle Firestore Timestamp
  if (date?.toDate && typeof date.toDate === "function") {
    jsDate = date.toDate();
  } else if (date?.seconds) {
    jsDate = new Date(date.seconds * 1000);
  } else if (typeof date === "string") {
    jsDate = new Date(date);
  } else {
    jsDate = new Date(date);
  }

  if (isNaN(jsDate.getTime())) {
    return "N/A";
  }

  const now = new Date();
  const diffMs = now.getTime() - jsDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60)
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

  return formatDate(date, "full");
}

/**
 * Formats a salary range for government job postings
 * @param salaryRange - Salary range object with min, max, and frequency
 * @returns Formatted salary range string or null
 */
export function formatSalaryRange(salaryRange?: {
  min?: number;
  max?: number;
  frequency?: string;
}): string | null {
  if (!salaryRange) return null;
  const { min, max, frequency } = salaryRange;
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)} ${frequency || ""}`;
  } else if (min) {
    return `${formatter.format(min)}+ ${frequency || ""}`;
  } else if (max) {
    return `Up to ${formatter.format(max)} ${frequency || ""}`;
  }
  return null;
}

/**
 * Formats a date range for government job postings (opening - closing dates)
 * @param openingDate - Opening date
 * @param closingDate - Closing date (can be "continuous" string)
 * @returns Formatted date range string or null
 */
export function formatDateRange(
  openingDate: any,
  closingDate: any,
): string | null {
  const formatDateLocal = (date: any) => {
    if (!date) return null;
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return null;
    }
  };

  if (!openingDate && !closingDate) return null;

  const opening = formatDateLocal(openingDate);
  const closing = formatDateLocal(closingDate);

  // Check if the closing date is marked as continuous or missing (for continuous jobs)
  if (closingDate === "continuous" || !closingDate) {
    return opening ? `${opening} - Present` : "Open to Present";
  }

  // Both dates present
  if (opening && closing) {
    return `${opening} - ${closing}`;
  } else if (opening) {
    return `${opening} - Present`;
  } else if (closing) {
    return `Until ${closing}`;
  }
  return null;
}
