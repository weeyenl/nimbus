import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  return `$${num.toFixed(2)}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  BOOKED: "bg-blue-100 text-blue-800",
  ARRIVED: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  DONE: "bg-green-100 text-green-800",
  NO_SHOW: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  BOOKED: "Booked",
  ARRIVED: "Arrived",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  NO_SHOW: "No Show",
  CANCELLED: "Cancelled",
};

export const PET_SIZE_LABELS: Record<string, string> = {
  SMALL: "Small (< 5kg)",
  MEDIUM: "Medium (5-15kg)",
  LARGE: "Large (15-30kg)",
  EXTRA_LARGE: "Extra Large (> 30kg)",
};

export const REFERRAL_SOURCES = [
  "Google",
  "Instagram",
  "Facebook",
  "Friend/Family",
  "Walk-in",
  "Flyer/Brochure",
  "Other",
] as const;
