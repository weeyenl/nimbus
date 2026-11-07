// Shared data store. Runs on browser-local mock data in demo mode, or syncs to
// Supabase when NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are set.
// Covers V1.1 (Booking & Customers) and V1.2 (Pricing, Memberships, Grooming Records, Payments & Reports)

import { supabase, isSupabaseConfigured } from "./supabase";

export interface MockAppointment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  petId: string;
  petName: string;
  petBreed: string;
  petSize: "SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE";
  petCoatType?: string;
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number;
  groomerId: string;
  groomerName: string;
  status: "BOOKED" | "ARRIVED" | "IN_PROGRESS" | "DONE" | "NO_SHOW" | "CANCELLED";
  isWalkIn: boolean;
  notes?: string;
  dateStr: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  addOns?: { id: string; name: string; price: number }[];
  isPaid?: boolean;
}

export interface MockStaff {
  id: string;
  name: string;
  role: "OWNER" | "GROOMER" | "RECEPTIONIST";
  phone: string;
  email: string;
  pin?: string;
  isActive: boolean;
  schedule: Record<string, string>;
}

export interface MockPet {
  id: string;
  name: string;
  breed: string;
  age: number;
  size: "SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE";
  weight: number;
  coatType: "SHORT" | "MEDIUM" | "LONG" | "DOUBLE" | "WIRE" | "CURLY";
  warnings: string[];
  vaccinationExpiry?: string;
}

export interface MockCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  referralSource?: string;
  notes?: string;
  pets: MockPet[];
}

export interface MockService {
  id: string;
  name: string;
  category?: string;
  duration: number; // in mins
  basePrice: number;
  price: number;
  description: string;
  /** Fixed price: no pet size / coat surcharges (training, daycare, custom services). */
  flatRate?: boolean;
}

export interface MockAddon {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface MembershipTier {
  id: string;
  name: "BASIC" | "STANDARD" | "VIP" | "SVIP";
  displayName: string;
  price: number;
  bonusCredits: number;
  totalCredits: number;
  validityMonths: number;
  hasQueuePriority: boolean;
  color: string;
  includedBenefits: string[];
}

export interface CustomerMembership {
  id: string;
  customerId: string;
  tierName: "BASIC" | "STANDARD" | "VIP" | "SVIP";
  displayName: string;
  purchaseDate: string;
  expiryDate: string;
  remainingCredits: number;
  totalCredits: number;
  hasQueuePriority: boolean;
  bonusAllowances: {
    id: string;
    name: string;
    total: number;
    remaining: number;
  }[];
}

export interface GroomingRecord {
  id: string;
  appointmentId: string;
  petId: string;
  dateStr: string;
  groomerName: string;
  serviceDone: string;
  haircutStyle?: string;
  bladeGuardLength?: string;
  skinConditions: string[]; // e.g. ["NORMAL", "DRY", "RED", "RASHES", "FLEAS_TICKS", "MATTING", "DANDRUFF"]
  skinConditionNotes?: string;
  issueLocations: string[]; // e.g. ["EARS", "BELLY", "LEGS", "TAIL", "PAWS"]
  healthObservations?: string;
  behaviour?: string;
  recommendationToOwner?: string;
}

export interface PaymentRecord {
  id: string;
  appointmentId: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  petName: string;
  serviceName: string;
  servicePrice: number;
  addOns: { name: string; price: number }[];
  discountAmount: number;
  discountNote?: string;
  subtotal: number;
  totalAmount: number;
  paymentMethod: "CASH" | "CARD" | "PAYNOW" | "MEMBERSHIP_CREDIT";
  membershipCreditsDeducted?: number;
  paidAt: string;
  status: "PAID" | "PENDING";
}

// Date helpers (local time — toISOString() is UTC and gives the wrong day in Singapore before 8am)
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getPaymentDateStr(paidAt?: string, fallbackAptDate?: string): string | null {
  if (fallbackAptDate) return fallbackAptDate;
  if (!paidAt) return null;
  const isoMatch = paidAt.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const ddmmyyyyMatch = paidAt.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (ddmmyyyyMatch) {
    const [, d, m, y] = ddmmyyyyMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

export function isPaymentFromDate(paidAt: string | undefined, targetDateStr: string): boolean {
  if (!paidAt) return false;
  // targetDateStr is "YYYY-MM-DD" e.g. "2026-11-07"
  if (paidAt.includes(targetDateStr)) return true;

  // Handle DD/MM/YYYY or D/M/YYYY formats (e.g. "07/11/2026" or "7/11/2026")
  const parts = targetDateStr.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    const ddmmyyyy = `${d}/${m}/${y}`;
    const dmmyyyy = `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
    if (paidAt.includes(ddmmyyyy) || paidAt.includes(dmmyyyy)) return true;
  }

  return false;
}

function getTodayOffsetStr(daysOffset: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return localDateStr(d);
}

const todayStr = getTodayOffsetStr(0);
const tomorrowStr = getTodayOffsetStr(1);
const yesterdayStr = getTodayOffsetStr(-1);

// 1. SERVICES CATALOGUE
export const MOCK_SERVICES: MockService[] = [
  { id: "s1", name: "Full Grooming", category: "Grooming", duration: 120, basePrice: 85, price: 85, description: "Full styling, bath, fluff dry, sanitary shave, paw pads, ear cleaning, and nail trim." },
  { id: "s2", name: "Basic Grooming", category: "Grooming", duration: 75, basePrice: 55, price: 55, description: "Bath, fluff dry, sanitary clip, paw pad trim, nail clipping, and ear cleaning." },
  { id: "s3", name: "Shower Only", category: "Grooming", duration: 45, basePrice: 35, price: 35, description: "Gentle shampoo bath and thorough blow dry." },
  { id: "s4", name: "Express Grooming", category: "Grooming", duration: 60, basePrice: 95, price: 95, description: "Fast turnaround, single-groomer dedicated priority session." },
  { id: "s5", name: "Medicated Treatment", category: "Spa & Treatment", duration: 45, basePrice: 50, price: 50, description: "Specialized anti-bacterial or soothing medicated soak for skin issues." },
  { id: "s6", name: "Nail Trim", category: "Hygiene & Maintenance", duration: 15, basePrice: 15, price: 15, description: "Clipping and smoothing edges." },
  { id: "s7", name: "Teeth Cleaning", category: "Hygiene & Maintenance", duration: 20, basePrice: 25, price: 25, description: "Ultrasonic / oral brushing and fresh breath gel." },
  { id: "s8", name: "De-shedding", category: "Grooming", duration: 60, basePrice: 65, price: 65, description: "High-velocity undercoat blowout and thorough brush out." },
  { id: "s9", name: "Puppy Basic Obedience & Socialization", category: "Training & Behavior", duration: 60, basePrice: 120, price: 120, description: "Core commands (sit, down, stay, recall), loose-leash walking, and puppy socialization." },
  { id: "s10", name: "1-on-1 Behavioral Consultation", category: "Training & Behavior", duration: 90, basePrice: 160, price: 160, description: "Private coaching for anxiety, reactivity, excessive barking, or grooming desensitization." },
];

// 2. ADD-ONS LIST
export const MOCK_ADDONS: MockAddon[] = [
  { id: "add_1", name: "Matted Fur Surcharge", price: 20, description: "Careful de-matting and detangling." },
  { id: "add_2", name: "Aggressive / Difficult Handling", price: 25, description: "Extra handler assistance and gentle pacing." },
  { id: "add_3", name: "Spa Therapy Add-on", price: 30, description: "Micro-bubble ozone spa treatment." },
  { id: "add_4", name: "Medicated Treatment Add-on", price: 25, description: "Targeted medicated skin wash." },
  { id: "add_5", name: "Nose & Paw Defense", price: 15, description: "Hydrating organic balm application." },
  { id: "add_6", name: "Tear Stain Lift", price: 15, description: "Facial brightening cleanse." },
  { id: "add_7", name: "Flea & Tick Treatment", price: 25, description: "Specialist parasite elimination bath." },
];

// DYNAMIC PRICING MATRIX CALCULATION
export function calculateServicePrice(
  serviceId: string,
  petSize: "SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE" = "SMALL",
  coatType: string = "SHORT"
): number {
  const services = typeof window !== "undefined" ? getServices() : MOCK_SERVICES;
  const service = services.find((s) => s.id === serviceId) || services[0] || MOCK_SERVICES[0];
  let price = service.basePrice;

  // Fixed-price services (e.g. Training, Daycare, custom) have no size/coat surcharges
  if (isFlatRate(service)) {
    return price;
  }

  // Small is base
  if (petSize === "MEDIUM") price += 20;
  if (petSize === "LARGE") price += 45;
  if (petSize === "EXTRA_LARGE") price += 75;

  // Coat difficulty modifier (curly, long, double take longer)
  if (["CURLY", "LONG", "DOUBLE"].includes(coatType) && (!service.category || service.category === "Grooming")) {
    price += 10;
  }

  return price;
}

// 3. CLUB MEMBERSHIP TIERS (from client screenshot)
export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: "tier_basic",
    name: "BASIC",
    displayName: "Basic Membership",
    price: 480,
    bonusCredits: 20,
    totalCredits: 500,
    validityMonths: 6,
    hasQueuePriority: false,
    color: "bg-emerald-50 text-emerald-800 border-emerald-300",
    includedBenefits: [
      "1× Spa Therapy Add-on or Medicated Treatment Add-on",
      "6 Month Validity",
    ],
  },
  {
    id: "tier_standard",
    name: "STANDARD",
    displayName: "Standard Membership",
    price: 760,
    bonusCredits: 40,
    totalCredits: 800,
    validityMonths: 6,
    hasQueuePriority: false,
    color: "bg-sky-50 text-sky-800 border-sky-300",
    includedBenefits: [
      "2× Spa Therapy Add-on or Medicated Treatment Add-on",
      "6 Month Validity",
    ],
  },
  {
    id: "tier_vip",
    name: "VIP",
    displayName: "VIP Membership",
    price: 1400,
    bonusCredits: 100,
    totalCredits: 1500,
    validityMonths: 12,
    hasQueuePriority: true,
    color: "bg-purple-50 text-purple-800 border-purple-300",
    includedBenefits: [
      "4× Spa Therapy Add-on or Medicated Treatment Add-on",
      "2× Nose & Paw Defense or Tear Stain Lift",
      "+ Queue Priority",
      "12 Month Validity",
    ],
  },
  {
    id: "tier_svip",
    name: "SVIP",
    displayName: "SVIP Membership",
    price: 2300,
    bonusCredits: 200,
    totalCredits: 2500,
    validityMonths: 12,
    hasQueuePriority: true,
    color: "bg-amber-50 text-amber-800 border-amber-300",
    includedBenefits: [
      "8× Spa Therapy Add-on or Medicated Treatment Add-on",
      "4× Nose & Paw Defense or Tear Stain Lift",
      "+ Queue Priority",
      "12 Month Validity",
    ],
  },
];

// Initial Customer Memberships
export const INITIAL_MEMBERSHIPS: CustomerMembership[] = [
  {
    id: "mem_c1",
    customerId: "c1", // Sarah Tan
    tierName: "VIP",
    displayName: "VIP Membership",
    purchaseDate: "2024-01-01",
    expiryDate: "2024-12-31",
    remainingCredits: 1280,
    totalCredits: 1500,
    hasQueuePriority: true,
    bonusAllowances: [
      { id: "ba1", name: "Spa Therapy or Medicated Treatment", total: 4, remaining: 3 },
      { id: "ba2", name: "Nose & Paw Defense or Tear Stain Lift", total: 2, remaining: 2 },
    ],
  },
  {
    id: "mem_c2",
    customerId: "c2", // James Wong
    tierName: "STANDARD",
    displayName: "Standard Membership",
    purchaseDate: "2024-02-15",
    expiryDate: "2024-08-15",
    remainingCredits: 420,
    totalCredits: 800,
    hasQueuePriority: false,
    bonusAllowances: [
      { id: "ba3", name: "Spa Therapy or Medicated Treatment", total: 2, remaining: 1 },
    ],
  },
];

// Initial Grooming Records
export const INITIAL_GROOMING_RECORDS: GroomingRecord[] = [
  {
    id: "gr_1",
    appointmentId: "a7",
    petId: "p1",
    dateStr: yesterdayStr,
    groomerName: "Amy Chen",
    serviceDone: "Full Grooming",
    haircutStyle: "Teddy Bear Cut, rounded muzzle, bell-bottom legs",
    bladeGuardLength: "#10 body, 1/2 inch guard face, #30 sanitary",
    skinConditions: ["DRY", "DANDRUFF"],
    skinConditionNotes: "Flaking around upper back and behind right ear.",
    issueLocations: ["EARS", "BACK"],
    healthObservations: "Slight ear discharge in left ear, nails trimmed cleanly.",
    behaviour: "Good, slightly anxious with high velocity dryer near paws.",
    recommendationToOwner: "Apply moisturizing skin spray; recommend medicated bath next month.",
  },
  {
    id: "gr_2",
    appointmentId: "a2_prev",
    petId: "p2",
    dateStr: "2024-01-10",
    groomerName: "Ben Tan",
    serviceDone: "Basic Grooming",
    haircutStyle: "Sanitary shave, trimmed eyes, shaped ears",
    bladeGuardLength: "#10 sanitary, scissor face only",
    skinConditions: ["NORMAL"],
    issueLocations: [],
    healthObservations: "Healthy pink skin, no fleas or ticks.",
    behaviour: "Very calm and patient throughout.",
    recommendationToOwner: "Routine grooming every 4-5 weeks recommended.",
  },
];

// Initial Payments
export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: "pay_1",
    appointmentId: "a7",
    invoiceNumber: "INV-2024-1001",
    customerName: "Sarah Tan",
    customerPhone: "+65 9123 4567",
    petName: "Mochi",
    serviceName: "Full Grooming",
    servicePrice: 85,
    addOns: [{ name: "Spa Therapy Add-on", price: 0 }],
    discountAmount: 0,
    subtotal: 85,
    totalAmount: 85,
    paymentMethod: "MEMBERSHIP_CREDIT",
    membershipCreditsDeducted: 85,
    paidAt: `${yesterdayStr} 11:45`,
    status: "PAID",
  },
  {
    id: "pay_2",
    appointmentId: "a8",
    invoiceNumber: "INV-2024-1002",
    customerName: "James Wong",
    customerPhone: "+65 8234 5678",
    petName: "Cooper",
    serviceName: "De-shedding & Bath",
    servicePrice: 95,
    addOns: [{ name: "Matted Fur Surcharge", price: 20 }],
    discountAmount: 10,
    discountNote: "Promo: WELCOME10",
    subtotal: 115,
    totalAmount: 105,
    paymentMethod: "PAYNOW",
    paidAt: `${yesterdayStr} 14:15`,
    status: "PAID",
  },
];

// CUSTOMERS
export const MOCK_CUSTOMERS_DATA: MockCustomer[] = [
  {
    id: "c1",
    name: "Sarah Tan",
    phone: "+65 9123 4567",
    email: "sarah.tan@email.com",
    address: "Blk 123 Toa Payoh Lorong 1, #05-123",
    referralSource: "Instagram",
    notes: "Preferred contact via WhatsApp",
    pets: [
      {
        id: "p1",
        name: "Mochi",
        breed: "Toy Poodle",
        age: 3,
        size: "SMALL",
        weight: 4.2,
        coatType: "CURLY",
        warnings: ["Sensitive around paws", "Anxious with loud noises"],
        vaccinationExpiry: "2024-06-01",
      },
      {
        id: "p2",
        name: "Biscuit",
        breed: "Shih Tzu",
        age: 5,
        size: "SMALL",
        weight: 5.8,
        coatType: "LONG",
        warnings: [],
        vaccinationExpiry: "2024-03-01",
      },
    ],
  },
  {
    id: "c2",
    name: "James Wong",
    phone: "+65 8234 5678",
    email: "james.wong@email.com",
    address: "12 Bishan St 22, #10-45",
    referralSource: "Google",
    pets: [
      {
        id: "p3",
        name: "Cooper",
        breed: "Golden Retriever",
        age: 4,
        size: "LARGE",
        weight: 32.5,
        coatType: "DOUBLE",
        warnings: [],
        vaccinationExpiry: "2024-11-15",
      },
    ],
  },
  {
    id: "c3",
    name: "Linda Lim",
    phone: "+65 9345 6789",
    email: "linda.lim@email.com",
    referralSource: "Friend/Family",
    pets: [
      {
        id: "p4",
        name: "Coco",
        breed: "Maltese",
        age: 2,
        size: "SMALL",
        weight: 3.5,
        coatType: "LONG",
        warnings: ["Cannot stand for long periods"],
        vaccinationExpiry: "2024-08-20",
      },
    ],
  },
  {
    id: "c4",
    name: "Marcus Koh",
    phone: "+65 9888 1234",
    referralSource: "Walk-in",
    pets: [
      {
        id: "p5",
        name: "Brownie",
        breed: "Cavapoo",
        age: 1,
        size: "SMALL",
        weight: 6.2,
        coatType: "CURLY",
        warnings: [],
        vaccinationExpiry: "2025-01-10",
      },
    ],
  },
];

// STAFF
export const MOCK_STAFF_DATA: MockStaff[] = [
  {
    id: "g1",
    name: "Amy Chen",
    role: "GROOMER",
    phone: "+65 9111 2222",
    email: "amy@doglab.com",
    isActive: true,
    schedule: {
      Mon: "09:00-18:00",
      Tue: "09:00-18:00",
      Wed: "OFF",
      Thu: "09:00-18:00",
      Fri: "09:00-18:00",
      Sat: "09:00-14:00",
      Sun: "OFF",
    },
  },
  {
    id: "g2",
    name: "Ben Tan",
    role: "GROOMER",
    phone: "+65 9222 3333",
    email: "ben@doglab.com",
    isActive: true,
    schedule: {
      Mon: "09:00-18:00",
      Tue: "09:00-18:00",
      Wed: "09:00-18:00",
      Thu: "OFF",
      Fri: "09:00-18:00",
      Sat: "09:00-14:00",
      Sun: "OFF",
    },
  },
  {
    id: "g3",
    name: "Cindy Ong",
    role: "RECEPTIONIST",
    phone: "+65 9333 4444",
    email: "cindy@doglab.com",
    isActive: true,
    schedule: {
      Mon: "09:00-18:00",
      Tue: "09:00-18:00",
      Wed: "09:00-18:00",
      Thu: "09:00-18:00",
      Fri: "09:00-18:00",
      Sat: "OFF",
      Sun: "OFF",
    },
  },
];

// APPOINTMENTS
export const MOCK_APPOINTMENTS_DATA: MockAppointment[] = [
  {
    id: "a1",
    customerId: "c1",
    customerName: "Sarah Tan",
    customerPhone: "+65 9123 4567",
    petId: "p1",
    petName: "Mochi",
    petBreed: "Toy Poodle",
    petSize: "SMALL",
    petCoatType: "CURLY",
    serviceId: "s1",
    serviceName: "Full Grooming",
    serviceDuration: 120,
    servicePrice: 85,
    groomerId: "g1",
    groomerName: "Amy Chen",
    status: "IN_PROGRESS",
    isWalkIn: false,
    notes: "Teddy bear cut on face, scissor trim only around paws. Sensitive skin.",
    dateStr: todayStr,
    startTime: "09:00",
    endTime: "11:00",
    addOns: [{ id: "add_3", name: "Spa Therapy Add-on", price: 30 }],
    isPaid: false,
  },
  {
    id: "a2",
    customerId: "c1",
    customerName: "Sarah Tan",
    customerPhone: "+65 9123 4567",
    petId: "p2",
    petName: "Biscuit",
    petBreed: "Shih Tzu",
    petSize: "SMALL",
    petCoatType: "LONG",
    serviceId: "s2",
    serviceName: "Basic Grooming",
    serviceDuration: 75,
    servicePrice: 55,
    groomerId: "g2",
    groomerName: "Ben Tan",
    status: "ARRIVED",
    isWalkIn: false,
    notes: "Short sanitary clip, round ears.",
    dateStr: todayStr,
    startTime: "09:30",
    endTime: "10:45",
    isPaid: false,
  },
  {
    id: "a3",
    customerId: "c2",
    customerName: "James Wong",
    customerPhone: "+65 8234 5678",
    petId: "p3",
    petName: "Cooper",
    petBreed: "Golden Retriever",
    petSize: "LARGE",
    petCoatType: "DOUBLE",
    serviceId: "s8",
    serviceName: "De-shedding & Bath",
    serviceDuration: 90,
    servicePrice: 110,
    groomerId: "g1",
    groomerName: "Amy Chen",
    status: "BOOKED",
    isWalkIn: false,
    notes: "Undercoat blowout and heavy de-shedding.",
    dateStr: todayStr,
    startTime: "11:30",
    endTime: "13:00",
    isPaid: false,
  },
  {
    id: "a4",
    customerId: "c3",
    customerName: "Linda Lim",
    customerPhone: "+65 9345 6789",
    petId: "p4",
    petName: "Coco",
    petBreed: "Maltese",
    petSize: "SMALL",
    petCoatType: "LONG",
    serviceId: "s6",
    serviceName: "Nail Trim",
    serviceDuration: 20,
    servicePrice: 20,
    groomerId: "g3",
    groomerName: "Cindy Ong",
    status: "DONE",
    isWalkIn: true,
    notes: "Walk-in client for nail trim.",
    dateStr: todayStr,
    startTime: "14:00",
    endTime: "14:20",
    isPaid: true,
  },
  {
    id: "a5",
    customerId: "c4",
    customerName: "Marcus Koh",
    customerPhone: "+65 9888 1234",
    petId: "p5",
    petName: "Brownie",
    petBreed: "Cavapoo",
    petSize: "SMALL",
    petCoatType: "CURLY",
    serviceId: "s3",
    serviceName: "Shower & Fluff Dry",
    serviceDuration: 45,
    servicePrice: 38,
    groomerId: "g2",
    groomerName: "Ben Tan",
    status: "BOOKED",
    isWalkIn: false,
    dateStr: todayStr,
    startTime: "15:00",
    endTime: "15:45",
    isPaid: false,
  },
];

export const STATUS_COLORS_HEX: Record<string, { bg: string; border: string; text: string }> = {
  BOOKED: { bg: "#3b82f6", border: "#2563eb", text: "#ffffff" },
  ARRIVED: { bg: "#f59e0b", border: "#d97706", text: "#ffffff" },
  IN_PROGRESS: { bg: "#8b5cf6", border: "#7c3aed", text: "#ffffff" },
  DONE: { bg: "#10b981", border: "#059669", text: "#ffffff" },
  NO_SHOW: { bg: "#6b7280", border: "#4b5563", text: "#ffffff" },
  CANCELLED: { bg: "#ef4444", border: "#dc2626", text: "#ffffff" },
};

// STORAGE KEYS
const STORAGE_KEYS = {
  APPOINTMENTS: "nimbus_appointments",
  STAFF: "nimbus_staff",
  CUSTOMERS: "nimbus_customers",
  MEMBERSHIPS: "nimbus_memberships",
  GROOMING_RECORDS: "nimbus_grooming_records",
  PAYMENTS: "nimbus_payments",
  SERVICES: "nimbus_services",
  ADDONS: "nimbus_addons",
};

// ---------------------------------------------------------------------------
// STORAGE LAYER
// localStorage is a synchronous cache that every page reads from. When Supabase
// is configured, every write is also pushed to the cloud (one table per
// collection, rows are { id, data jsonb }) and hydrateFromCloud() refills the
// cache from the database on app start. Without Supabase env vars the app runs
// in demo mode on mock data stored only in this browser.
// ---------------------------------------------------------------------------
const tableOf = (key: string) => key.replace("nimbus_", "");

function readCache<T>(key: string): T[] | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : null;
  } catch {
    return null;
  }
}

function readCollection<T>(key: string, demoDefaults: T[]): T[] {
  if (typeof window === "undefined") return isSupabaseConfigured ? [] : demoDefaults;
  const cached = readCache<T>(key);
  // When connected to Supabase, cached is what came from the database (even if empty []).
  if (cached !== null) return cached;
  // If Supabase is configured but not yet loaded, return empty (real DB mode, no mock pollution)
  if (isSupabaseConfigured) return [];
  // Demo mode only (no Supabase configured): use mock data
  localStorage.setItem(key, JSON.stringify(demoDefaults));
  return demoDefaults;
}

let syncChain: Promise<void> = Promise.resolve();

function reportSyncError(message: string) {
  console.error("[nimbus] cloud sync failed:", message);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nimbus-sync-error", { detail: message }));
  }
}

function commit<T extends { id: string }>(key: string, next: T[]): void {
  const prev = readCache<T>(key) ?? [];
  const prevJson = new Map(prev.map((r) => [r.id, JSON.stringify(r)]));
  const upserts = next
    .filter((r) => prevJson.get(r.id) !== JSON.stringify(r))
    .map((r) => ({ id: r.id, data: r }));
  const nextIds = new Set(next.map((r) => r.id));
  const deletes = prev.filter((r) => !nextIds.has(r.id)).map((r) => r.id);

  // Update local cache
  localStorage.setItem(key, JSON.stringify(next));
  if (!isSupabaseConfigured) return;

  if (upserts.length === 0 && deletes.length === 0) return;

  const table = tableOf(key);
  syncChain = syncChain.then(async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      let failure: string | null = null;
      if (upserts.length) {
        const { error } = await supabase.from(table).upsert(upserts);
        if (error) failure = `${table}: ${error.message}`;
      }
      if (!failure && deletes.length) {
        const { error } = await supabase.from(table).delete().in("id", deletes);
        if (error) failure = `${table}: ${error.message}`;
      }
      if (!failure) return;
      if (attempt === 1) reportSyncError(failure);
    }
  });
}

/** Loads all collections from Supabase into the local cache. Throws on failure. */
export async function hydrateFromCloud(): Promise<void> {
  if (!isSupabaseConfigured) return;

  const loaded = await Promise.all(
    Object.values(STORAGE_KEYS).map(async (key) => {
      const table = tableOf(key);
      const rows: unknown[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase
          .from(table)
          .select("id,data")
          .order("id")
          .range(from, from + 999);
        if (error) throw new Error(`${table}: ${error.message}`);
        rows.push(...(data || []).map((r: { data: unknown }) => r.data));
        if (!data || data.length < 1000) break;
      }
      return [key, rows] as const;
    })
  );

  const byKey = new Map<string, unknown[]>(loaded);

  // First run on an empty database: start with the default services, add-ons, and staff.
  if (
    byKey.get(STORAGE_KEYS.SERVICES)!.length === 0 &&
    byKey.get(STORAGE_KEYS.ADDONS)!.length === 0 &&
    byKey.get(STORAGE_KEYS.STAFF)!.length === 0 &&
    !localStorage.getItem("nimbus_catalogue_seeded")
  ) {
    for (const [key, defaults] of [
      [STORAGE_KEYS.SERVICES, MOCK_SERVICES],
      [STORAGE_KEYS.ADDONS, MOCK_ADDONS],
      [STORAGE_KEYS.STAFF, MOCK_STAFF_DATA],
    ] as const) {
      const { error } = await supabase
        .from(tableOf(key))
        .upsert(defaults.map((d) => ({ id: d.id, data: d })));
      if (error) throw new Error(`${tableOf(key)}: ${error.message}`);
      byKey.set(key, [...defaults]);
    }
    localStorage.setItem("nimbus_catalogue_seeded", "1");
  }

  byKey.forEach((rows, key) => localStorage.setItem(key, JSON.stringify(rows)));
}

// 1. APPOINTMENTS
export function getAppointments(): MockAppointment[] {
  if (typeof window === "undefined") return isSupabaseConfigured ? [] : MOCK_APPOINTMENTS_DATA;
  return readCollection(STORAGE_KEYS.APPOINTMENTS, isSupabaseConfigured ? [] : MOCK_APPOINTMENTS_DATA);
}

export function saveAppointment(apt: MockAppointment): void {
  const current = getAppointments();
  const updated = [apt, ...current.filter((a) => a.id !== apt.id)];
  commit(STORAGE_KEYS.APPOINTMENTS, updated);
}

export function updateAppointmentStatus(id: string, status: MockAppointment["status"]): void {
  const current = getAppointments();
  const updated = current.map((a) => (a.id === id ? { ...a, status } : a));
  commit(STORAGE_KEYS.APPOINTMENTS, updated);
}

// 2. STAFF
export function getStaff(): MockStaff[] {
  if (typeof window === "undefined") return MOCK_STAFF_DATA;
  return readCollection(STORAGE_KEYS.STAFF, MOCK_STAFF_DATA);
}

export function saveStaff(staff: MockStaff): void {
  const current = getStaff();
  const updated = [...current.filter((s) => s.id !== staff.id), staff];
  commit(STORAGE_KEYS.STAFF, updated);
}

// 3. CUSTOMERS
export function getCustomers(): MockCustomer[] {
  if (typeof window === "undefined") return isSupabaseConfigured ? [] : MOCK_CUSTOMERS_DATA;
  return readCollection(STORAGE_KEYS.CUSTOMERS, isSupabaseConfigured ? [] : MOCK_CUSTOMERS_DATA);
}

export function saveCustomer(customer: MockCustomer): void {
  const current = getCustomers();
  const updated = [customer, ...current.filter((c) => c.id !== customer.id)];
  commit(STORAGE_KEYS.CUSTOMERS, updated);
}

// 4. MEMBERSHIPS
export function getMemberships(): CustomerMembership[] {
  if (typeof window === "undefined") return isSupabaseConfigured ? [] : INITIAL_MEMBERSHIPS;
  return readCollection(STORAGE_KEYS.MEMBERSHIPS, isSupabaseConfigured ? [] : INITIAL_MEMBERSHIPS);
}

export function getCustomerMembership(customerId: string): CustomerMembership | undefined {
  const memberships = getMemberships();
  return memberships.find((m) => m.customerId === customerId);
}

export function purchaseMembership(customerId: string, tierName: "BASIC" | "STANDARD" | "VIP" | "SVIP"): CustomerMembership {
  const tier = MEMBERSHIP_TIERS.find((t) => t.name === tierName)!;
  const now = new Date();
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + tier.validityMonths);

  const bonusAllowances = tier.name === "VIP" || tier.name === "SVIP" ? [
    { id: `ba_${Date.now()}_1`, name: "Spa Therapy or Medicated Treatment", total: tier.name === "SVIP" ? 8 : 4, remaining: tier.name === "SVIP" ? 8 : 4 },
    { id: `ba_${Date.now()}_2`, name: "Nose & Paw Defense or Tear Stain Lift", total: tier.name === "SVIP" ? 4 : 2, remaining: tier.name === "SVIP" ? 4 : 2 },
  ] : [
    { id: `ba_${Date.now()}_1`, name: "Spa Therapy or Medicated Treatment", total: tier.name === "STANDARD" ? 2 : 1, remaining: tier.name === "STANDARD" ? 2 : 1 },
  ];

  const newMembership: CustomerMembership = {
    id: `mem_${Date.now()}`,
    customerId,
    tierName,
    displayName: tier.displayName,
    purchaseDate: localDateStr(now),
    expiryDate: localDateStr(expiry),
    remainingCredits: tier.totalCredits,
    totalCredits: tier.totalCredits,
    hasQueuePriority: tier.hasQueuePriority,
    bonusAllowances,
  };

  const current = getMemberships().filter((m) => m.customerId !== customerId);
  const updated = [newMembership, ...current];
  commit(STORAGE_KEYS.MEMBERSHIPS, updated);
  return newMembership;
}

export function deductMembershipCredits(customerId: string, credits: number): boolean {
  const memberships = getMemberships();
  const member = memberships.find((m) => m.customerId === customerId);
  if (!member || member.remainingCredits < credits) return false;

  member.remainingCredits -= credits;
  commit(STORAGE_KEYS.MEMBERSHIPS, memberships);
  return true;
}

/** Create or replace a customer's membership record (used for custom credit packages). */
export function setCustomerMembership(membership: CustomerMembership): void {
  const current = getMemberships().filter((m) => m.customerId !== membership.customerId);
  commit(STORAGE_KEYS.MEMBERSHIPS, [membership, ...current]);
}

export function updateCustomerMembership(
  customerId: string,
  updates: Partial<CustomerMembership>
): CustomerMembership | undefined {
  const memberships = getMemberships();
  const idx = memberships.findIndex((m) => m.customerId === customerId);
  if (idx === -1) return undefined;

  memberships[idx] = { ...memberships[idx], ...updates };
  commit(STORAGE_KEYS.MEMBERSHIPS, memberships);
  return memberships[idx];
}

export function adjustCustomerMembershipCredits(
  customerId: string,
  newRemainingCredits: number,
  newTotalCredits?: number
): CustomerMembership | undefined {
  const memberships = getMemberships();
  const idx = memberships.findIndex((m) => m.customerId === customerId);
  if (idx === -1) return undefined;

  memberships[idx].remainingCredits = Math.max(0, newRemainingCredits);
  if (typeof newTotalCredits === "number" && newTotalCredits > 0) {
    memberships[idx].totalCredits = Math.max(newTotalCredits, memberships[idx].remainingCredits);
  }
  commit(STORAGE_KEYS.MEMBERSHIPS, memberships);
  return memberships[idx];
}

export function deductPackageAddonAllowance(
  customerId: string,
  allowanceId: string
): CustomerMembership | undefined {
  const memberships = getMemberships();
  const idx = memberships.findIndex((m) => m.customerId === customerId);
  if (idx === -1 || !memberships[idx].bonusAllowances) return undefined;

  const allowance = memberships[idx].bonusAllowances.find((a) => a.id === allowanceId);
  if (!allowance || allowance.remaining <= 0) return undefined;

  allowance.remaining -= 1;
  commit(STORAGE_KEYS.MEMBERSHIPS, memberships);
  return memberships[idx];
}

// 5. GROOMING RECORDS
export function getGroomingRecords(petId?: string): GroomingRecord[] {
  if (typeof window === "undefined") return isSupabaseConfigured ? [] : INITIAL_GROOMING_RECORDS;
  const records = readCollection(STORAGE_KEYS.GROOMING_RECORDS, isSupabaseConfigured ? [] : INITIAL_GROOMING_RECORDS);
  return petId ? records.filter((r) => r.petId === petId) : records;
}

export function saveGroomingRecord(record: GroomingRecord): void {
  const current = getGroomingRecords();
  const updated = [record, ...current.filter((r) => r.id !== record.id)];
  commit(STORAGE_KEYS.GROOMING_RECORDS, updated);
}

// 6. PAYMENTS & INVOICES
export function getPayments(): PaymentRecord[] {
  if (typeof window === "undefined") return isSupabaseConfigured ? [] : INITIAL_PAYMENTS;
  return readCollection(STORAGE_KEYS.PAYMENTS, isSupabaseConfigured ? [] : INITIAL_PAYMENTS);
}

export function savePayment(payment: PaymentRecord): void {
  const current = getPayments();
  const updated = [payment, ...current.filter((p) => p.id !== payment.id)];
  commit(STORAGE_KEYS.PAYMENTS, updated);

  // Mark appointment as paid
  const appointments = getAppointments();
  const apt = appointments.find((a) => a.id === payment.appointmentId);
  if (apt) {
    apt.isPaid = true;
    commit(STORAGE_KEYS.APPOINTMENTS, appointments);
  }
}

// 7. PET MANAGEMENT HELPERS
/** Returns false (and saves nothing) when the customer cannot be found. */
export function addPetToCustomer(customerId: string, pet: MockPet): boolean {
  const customers = getCustomers();
  const cust = customers.find((c) => c.id === customerId);
  if (!cust) return false;
  cust.pets = [...(cust.pets || []), pet];
  commit(STORAGE_KEYS.CUSTOMERS, customers);
  return true;
}

export function updatePet(petId: string, updatedData: Partial<MockPet>): void {
  const customers = getCustomers();
  for (const c of customers) {
    const idx = c.pets.findIndex((p) => p.id === petId);
    if (idx !== -1) {
      c.pets[idx] = { ...c.pets[idx], ...updatedData };
      break;
    }
  }
  commit(STORAGE_KEYS.CUSTOMERS, customers);
}

// 8. SERVICES CATALOGUE MANAGEMENT
export function getServices(): MockService[] {
  if (typeof window === "undefined") return MOCK_SERVICES;
  // Derive a category for legacy rows that have none (read-time only, nothing is written back)
  return readCollection(STORAGE_KEYS.SERVICES, MOCK_SERVICES).map((s) =>
    s.category ? s : { ...s, category: inferCategory(s.name) }
  );
}

function inferCategory(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("train") || lower.includes("behavior") || lower.includes("consult")) return "Training & Behavior";
  if (lower.includes("spa") || lower.includes("medicat")) return "Spa & Treatment";
  if (lower.includes("nail") || lower.includes("teeth") || lower.includes("clean")) return "Hygiene & Maintenance";
  if (lower.includes("daycare") || lower.includes("board")) return "Daycare & Boarding";
  return "Grooming";
}

/** Distinct categories currently in the catalogue (always includes Grooming). */
export function getServiceCategories(): string[] {
  const set = new Set<string>(["Grooming"]);
  getServices().forEach((s) => s.category && set.add(s.category));
  return Array.from(set);
}

/** Fixed-price services skip the pet size / coat surcharges (e.g. training sessions). */
export function isFlatRate(service: MockService): boolean {
  if (typeof service.flatRate === "boolean") return service.flatRate;
  const cat = (service.category || "").toLowerCase();
  return cat.includes("train") || cat.includes("daycare");
}

export function saveService(service: MockService): void {
  const services = getServices();
  const idx = services.findIndex((s) => s.id === service.id);
  if (idx !== -1) {
    services[idx] = service;
  } else {
    services.push(service);
  }
  commit(STORAGE_KEYS.SERVICES, services);
}

export function addService(service: MockService): void {
  const services = getServices();
  const updated = [...services, service];
  commit(STORAGE_KEYS.SERVICES, updated);
}

export function deleteService(serviceId: string): void {
  const services = getServices();
  const updated = services.filter((s) => s.id !== serviceId);
  commit(STORAGE_KEYS.SERVICES, updated);
}

// 9. ADD-ONS MANAGEMENT
export function getAddons(): MockAddon[] {
  if (typeof window === "undefined") return MOCK_ADDONS;
  return readCollection(STORAGE_KEYS.ADDONS, MOCK_ADDONS);
}

export function saveAddon(addon: MockAddon): void {
  const addons = getAddons();
  const idx = addons.findIndex((a) => a.id === addon.id);
  if (idx !== -1) {
    addons[idx] = addon;
  } else {
    addons.push(addon);
  }
  commit(STORAGE_KEYS.ADDONS, addons);
}

export function addAddon(addon: MockAddon): void {
  const addons = getAddons();
  const updated = [...addons, addon];
  commit(STORAGE_KEYS.ADDONS, updated);
}

export function deleteAddon(addonId: string): void {
  const addons = getAddons();
  const updated = addons.filter((a) => a.id !== addonId);
  commit(STORAGE_KEYS.ADDONS, updated);
}

// 10. STAFF EDIT & DELETE
export function updateStaff(staff: MockStaff): void {
  const current = getStaff();
  const updated = current.map((s) => (s.id === staff.id ? staff : s));
  commit(STORAGE_KEYS.STAFF, updated);
}

export function deleteStaff(staffId: string): void {
  const current = getStaff();
  const updated = current.filter((s) => s.id !== staffId);
  commit(STORAGE_KEYS.STAFF, updated);
}

// 11. SALON & CALENDAR SETTINGS
export interface SalonSettings {
  calendarStartTime: string; // e.g. "08:00"
  calendarEndTime: string;   // e.g. "21:00" (slots run up to 9 PM)
}

export const DEFAULT_SALON_SETTINGS: SalonSettings = {
  calendarStartTime: "08:00",
  calendarEndTime: "21:00",
};

export function getSalonSettings(): SalonSettings {
  if (typeof window === "undefined") return DEFAULT_SALON_SETTINGS;
  try {
    const raw = localStorage.getItem("nimbus_settings");
    if (raw) {
      let parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed = parsed[0];
      }
      if (parsed && typeof parsed === "object") {
        return {
          calendarStartTime: typeof parsed.calendarStartTime === "string" ? parsed.calendarStartTime : DEFAULT_SALON_SETTINGS.calendarStartTime,
          calendarEndTime: typeof parsed.calendarEndTime === "string" ? parsed.calendarEndTime : DEFAULT_SALON_SETTINGS.calendarEndTime,
        };
      }
    }
  } catch {}
  return DEFAULT_SALON_SETTINGS;
}

export function saveSalonSettings(settings: Partial<SalonSettings>): void {
  if (typeof window === "undefined") return;
  const current = getSalonSettings();
  const updated: SalonSettings = { ...current, ...settings };
  localStorage.setItem("nimbus_settings", JSON.stringify(updated));
}
