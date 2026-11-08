import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function roundCurrency(val: number): number {
  if (!Number.isFinite(val)) return 0;
  return Math.round(val * 100) / 100;
}

export function formatPrice(price: number | string | undefined | null): string {
  const num = typeof price === "string" ? parseFloat(price) : Number(price ?? 0);
  const safe = Number.isFinite(num) ? roundCurrency(num) : 0;
  if (safe < 0) return `-$${Math.abs(safe).toFixed(2)}`;
  return `$${safe.toFixed(2)}`;
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
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Strips non-digits and normalizes SG +65 prefix so "91234567" matches "+65 9123 4567". */
export function normalizePhoneDigits(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("65")) {
    return digits.slice(2);
  }
  return digits;
}

export function phoneMatchesQuery(phone: string, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  if ((phone || "").toLowerCase().includes(q.toLowerCase())) return true;
  const qDigits = normalizePhoneDigits(q);
  if (!qDigits) return false;
  const pDigits = normalizePhoneDigits(phone);
  return pDigits.includes(qDigits) || (phone || "").replace(/\D/g, "").includes(q.replace(/\D/g, ""));
}

/** Deterministic SHA-256 hex digest (works on both HTTP LAN and HTTPS without crypto.subtle). */
export function sha256Hex(message: string): string {
  const bytes = new TextEncoder().encode(message);
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const bitLen = bytes.length * 8;
  const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(paddedLen - 4, bitLen >>> 0, false);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Int32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getInt32(offset + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + temp1) | 0;
      d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((v) => (v >>> 0).toString(16).padStart(8, "0"))
    .join("");
}

export function hashStaffPin(staffId: string, pin: string): string {
  return `sha256:${sha256Hex(`nimbus:${staffId}:${pin.trim()}`)}`;
}

export function getVaccinationStatus(expiryDate?: string): {
  status: "NONE" | "EXPIRED" | "EXPIRING_SOON" | "VALID";
  label: string;
  daysLeft?: number;
} {
  if (!expiryDate) return { status: "NONE", label: "Not recorded" };
  const parts = expiryDate.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return { status: "VALID", label: `Valid until: ${expiryDate}` };
  }
  const exp = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.ceil((exp.getTime() - todayStart.getTime()) / 86400000);
  if (diffDays < 0) {
    return { status: "EXPIRED", label: `Expired (${expiryDate})`, daysLeft: diffDays };
  }
  if (diffDays <= 30) {
    return { status: "EXPIRING_SOON", label: `Expiring soon (${expiryDate})`, daysLeft: diffDays };
  }
  return { status: "VALID", label: `Valid until: ${expiryDate}`, daysLeft: diffDays };
}

export async function compressImageToDataUrl(
  file: File,
  maxDim: number = 320,
  quality: number = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image file"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
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

export const COAT_TYPES = [
  { value: "SHORT", label: "Short / Smooth" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LONG", label: "Long / Silky" },
  { value: "DOUBLE", label: "Double Coat" },
  { value: "WIRE", label: "Wire / Coarse" },
  { value: "CURLY", label: "Curly / Wool" },
] as const;

export const SKIN_CONDITIONS = [
  "Normal",
  "Dry",
  "Red / Irritation",
  "Rashes",
  "Hot Spots",
  "Fleas / Ticks",
  "Matting",
  "Dandruff",
  "Bald Patches",
] as const;

export const ISSUE_LOCATIONS = [
  "Ears",
  "Belly",
  "Paws / Pads",
  "Legs",
  "Tail",
  "Face / Eyes",
  "Back / Spine",
  "Neck / Chest",
] as const;

export const PRESET_WARNINGS = [
  "Bites when paws touched",
  "Anxious with loud dryer noises",
  "Sensitive skin / Allergies",
  "Elderly / Hip dysplasia",
  "Aggressive with other dogs",
  "Cannot stand for long periods",
  "Collapsed trachea — handle neck gently",
] as const;

export const REFERRAL_SOURCES = [
  "Google",
  "Instagram",
  "Facebook",
  "Friend/Family",
  "Walk-in",
  "Flyer/Brochure",
  "Other",
] as const;
