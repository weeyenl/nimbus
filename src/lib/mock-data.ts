// Shared data store. Runs on browser-local mock data in demo mode, or syncs to
// Supabase when NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are set.

import { supabase, isSupabaseConfigured } from "./supabase";
import { hashStaffPin, roundCurrency } from "./utils";

export function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

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
  addOns?: { id: string; name: string; price: number; packageAllowanceId?: string }[];
  isPaid?: boolean;
  depositPaid?: number;
  depositMethod?: "CASH" | "CARD" | "PAYNOW";
  packageDeducted?: boolean;
  packageDeductionId?: string;
}

export interface MockStaff {
  id: string;
  name: string;
  role: "OWNER" | "GROOMER" | "RECEPTIONIST";
  phone: string;
  email: string;
  pin?: string; // legacy plaintext support; new saves store pinHash only
  pinHash?: string;
  isActive: boolean;
  schedule: Record<string, string>;
}

export interface PetVaccination {
  id: string;
  name: string;
  dateGiven?: string;
  expiryDate: string;
  notes?: string;
}

export interface MockPet {
  id: string;
  name: string;
  breed: string;
  age: number;
  size: "SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE";
  weight: number;
  coatType: "SHORT" | "MEDIUM" | "LONG" | "DOUBLE" | "WIRE" | "CURLY";
  photoUrl?: string;
  warnings: string[];
  vaccinationExpiry?: string;
  vaccinations?: PetVaccination[];
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

export interface BreedPriceRule {
  id: string;
  breed: string;
  price: number;
}

export interface MockService {
  id: string;
  name: string;
  category?: string;
  duration: number; // in mins
  basePrice: number;
  price: number;
  description: string;
  /** Fixed price: no pet size / coat / breed surcharges. */
  flatRate?: boolean;
  sizeSurcharges?: Partial<Record<MockPet["size"], number>>;
  coatSurcharges?: Partial<Record<MockPet["coatType"], number>>;
  breedPrices?: BreedPriceRule[];
}

export interface MockAddon {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface PromoCode {
  id: string;
  code: string;
  description?: string;
  discountType: "FIXED" | "PERCENTAGE";
  discountValue: number;
  isActive: boolean;
  validUntil?: string;
  maxUses?: number;
  currentUses: number;
}

export interface TierAllowanceTemplate {
  name: string;
  quantity: number;
}

export interface MembershipTier {
  id: string;
  name: "BASIC" | "STANDARD" | "VIP" | "SVIP" | string;
  displayName: string;
  packageType?: "CREDITS" | "SESSIONS";
  sessionCount?: number;
  applicableServiceIds?: string[];
  price: number;
  bonusCredits: number;
  totalCredits: number;
  validityMonths: number;
  hasQueuePriority: boolean;
  color?: string;
  includedBenefits: string[];
  allowanceTemplates?: TierAllowanceTemplate[];
}

export interface CreditTransaction {
  id: string;
  dateStr: string;
  amount: number; // positive for add/purchase, negative for deduction
  type: "PURCHASE" | "USAGE" | "ADJUSTMENT" | "VOUCHER" | "SESSION";
  note: string;
  appointmentId?: string;
}

export interface CustomerMembership {
  id: string;
  customerId: string;
  tierName: "BASIC" | "STANDARD" | "VIP" | "SVIP" | string;
  displayName: string;
  packageType?: "CREDITS" | "SESSIONS";
  totalSessions?: number;
  remainingSessions?: number;
  applicableServiceIds?: string[];
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
  transactions?: CreditTransaction[];
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
  skinConditions: string[];
  skinConditionNotes?: string;
  issueLocations: string[];
  healthObservations?: string;
  behaviour?: string;
  recommendationToOwner?: string;
}

export interface PaymentInstallment {
  id: string;
  amount: number;
  method: "CASH" | "CARD" | "PAYNOW" | "MEMBERSHIP_CREDIT";
  paidAt: string; // "YYYY-MM-DD HH:mm"
  note?: string;
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
  depositAmount?: number;
  balanceAmount?: number;
  paymentMethod: "CASH" | "CARD" | "PAYNOW" | "DEPOSIT" | "MEMBERSHIP_CREDIT";
  membershipCreditsDeducted?: number;
  installments?: PaymentInstallment[];
  paidAt: string;
  status: "PAID" | "PARTIAL" | "PENDING";
}

export interface SalonSettings {
  id?: string;
  calendarStartTime: string;
  calendarEndTime: string;
  salonName: string;
  salonAddress: string;
  salonPhone: string;
  receiptFooter: string;
  autoBackupEnabled: boolean;
  lastAutoBackupAt?: string;
}

export interface BackupSnapshot {
  id: string;
  createdAt: string;
  dateStr: string;
  trigger: "AUTO" | "MANUAL";
  summary: {
    customers: number;
    appointments: number;
    payments: number;
    groomingRecords: number;
  };
  payload: Record<string, unknown>;
}

// Date helpers (local time — toISOString() is UTC and gives wrong day in SG before 8am)
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function extractDateOnly(str?: string): string | null {
  if (!str) return null;
  const isoMatch = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const ddmmyyyyMatch = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (ddmmyyyyMatch) {
    const [, d, m, y] = ddmmyyyyMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

/**
 * Resolves the date a payment was actually received (never uses scheduled appointment date first,
 * preventing cross-day double counting).
 */
export function getPaymentDateStr(paidAt?: string, fallbackAptDate?: string): string | null {
  const parsed = extractDateOnly(paidAt);
  if (parsed) return parsed;
  return fallbackAptDate || null;
}

export function isPaymentFromDate(paidAt: string | undefined, targetDateStr: string): boolean {
  if (!paidAt) return false;
  const dateOnly = extractDateOnly(paidAt);
  return dateOnly === targetDateStr;
}

/**
 * Returns individual payment receipts/installments whose paidAt date matches targetDateStr
 * (or predicate), supporting split deposit + balance payments accurately.
 */
export function getPaymentInstallments(payment: PaymentRecord): PaymentInstallment[] {
  if (payment.installments && payment.installments.length > 0) {
    return payment.installments;
  }
  const amountPaid =
    payment.status === "PARTIAL"
      ? roundCurrency(payment.depositAmount ?? payment.totalAmount - (payment.balanceAmount ?? 0))
      : payment.status === "PENDING"
      ? 0
      : payment.totalAmount;
  if (amountPaid <= 0 && payment.totalAmount > 0) return [];
  return [
    {
      id: `${payment.id}_single`,
      amount: amountPaid,
      method: payment.paymentMethod === "DEPOSIT" ? "PAYNOW" : payment.paymentMethod,
      paidAt: payment.paidAt,
    },
  ];
}

function getTodayOffsetStr(daysOffset: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return localDateStr(d);
}

const todayStr = getTodayOffsetStr(0);
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
  { id: "s9", name: "Puppy Basic Obedience & Socialization", category: "Training & Behavior", duration: 60, basePrice: 120, price: 120, flatRate: true, description: "Core commands (sit, down, stay, recall), loose-leash walking, and puppy socialization." },
  { id: "s10", name: "1-on-1 Behavioral Consultation", category: "Training & Behavior", duration: 90, basePrice: 160, price: 160, flatRate: true, description: "Private coaching for anxiety, reactivity, excessive barking, or grooming desensitization." },
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

// 2b. PROMO CODES
export const INITIAL_PROMO_CODES: PromoCode[] = [
  { id: "promo_1", code: "WELCOME10", description: "New customer $10 off", discountType: "FIXED", discountValue: 10, isActive: true, currentUses: 1 },
  { id: "promo_2", code: "VIP5", description: "VIP $5 discount", discountType: "FIXED", discountValue: 5, isActive: true, currentUses: 0 },
  { id: "promo_3", code: "GROOM15", description: "15% off seasonal promo", discountType: "PERCENTAGE", discountValue: 15, isActive: true, currentUses: 0 },
];

// DYNAMIC PRICING MATRIX CALCULATION
export function calculateServicePrice(
  serviceId: string,
  petSize: "SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE" = "SMALL",
  coatType: string = "SHORT",
  breed?: string
): number {
  const services = typeof window !== "undefined" ? getServices() : MOCK_SERVICES;
  const service = services.find((s) => s.id === serviceId) || services[0] || MOCK_SERVICES[0];
  if (!service) return 0;

  if (isFlatRate(service)) {
    return roundCurrency(service.basePrice);
  }

  // Exact breed override takes priority when configured on the service
  if (breed && service.breedPrices && service.breedPrices.length > 0) {
    const cleanBreed = breed.trim().toLowerCase();
    const match = service.breedPrices.find(
      (bp) => bp.breed.trim().toLowerCase() === cleanBreed
    );
    if (match) {
      return roundCurrency(match.price);
    }
  }

  let price = service.basePrice;
  const defaultSizes: Record<MockPet["size"], number> = {
    SMALL: 0,
    MEDIUM: 20,
    LARGE: 45,
    EXTRA_LARGE: 75,
  };
  price += service.sizeSurcharges?.[petSize] ?? defaultSizes[petSize] ?? 0;

  const customCoat = service.coatSurcharges?.[coatType as MockPet["coatType"]];
  if (typeof customCoat === "number") {
    price += customCoat;
  } else if (
    ["CURLY", "LONG", "DOUBLE"].includes(coatType) &&
    (!service.category || service.category === "Grooming")
  ) {
    price += 10;
  }

  return roundCurrency(price);
}

// 3. CLUB MEMBERSHIP TIERS
export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: "tier_basic",
    name: "BASIC",
    displayName: "Basic Membership",
    packageType: "CREDITS",
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
    allowanceTemplates: [
      { name: "Spa Therapy or Medicated Treatment", quantity: 1 },
    ],
  },
  {
    id: "tier_standard",
    name: "STANDARD",
    displayName: "Standard Membership",
    packageType: "CREDITS",
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
    allowanceTemplates: [
      { name: "Spa Therapy or Medicated Treatment", quantity: 2 },
    ],
  },
  {
    id: "tier_vip",
    name: "VIP",
    displayName: "VIP Membership",
    packageType: "CREDITS",
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
    allowanceTemplates: [
      { name: "Spa Therapy or Medicated Treatment", quantity: 4 },
      { name: "Nose & Paw Defense or Tear Stain Lift", quantity: 2 },
    ],
  },
  {
    id: "tier_svip",
    name: "SVIP",
    displayName: "SVIP Membership",
    packageType: "CREDITS",
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
    allowanceTemplates: [
      { name: "Spa Therapy or Medicated Treatment", quantity: 8 },
      { name: "Nose & Paw Defense or Tear Stain Lift", quantity: 4 },
    ],
  },
  {
    id: "tier_full_groom_5x",
    name: "FULL_GROOM_5X",
    displayName: "5× Full Grooming Package",
    packageType: "SESSIONS",
    sessionCount: 5,
    applicableServiceIds: ["s1"],
    price: 380,
    bonusCredits: 0,
    totalCredits: 0,
    validityMonths: 6,
    hasQueuePriority: false,
    color: "bg-indigo-50 text-indigo-800 border-indigo-300",
    includedBenefits: [
      "5× Full Grooming Sessions (Auto-deducts 1 per visit)",
      "6 Month Validity",
    ],
    allowanceTemplates: [],
  },
];

// Initial Customer Memberships (valid relative to today in demo mode)
export const INITIAL_MEMBERSHIPS: CustomerMembership[] = [
  {
    id: "mem_c1",
    customerId: "c1",
    tierName: "VIP",
    displayName: "VIP Membership",
    packageType: "CREDITS",
    purchaseDate: getTodayOffsetStr(-60),
    expiryDate: getTodayOffsetStr(305),
    remainingCredits: 1280,
    totalCredits: 1500,
    hasQueuePriority: true,
    bonusAllowances: [
      { id: "ba1", name: "Spa Therapy or Medicated Treatment", total: 4, remaining: 3 },
      { id: "ba2", name: "Nose & Paw Defense or Tear Stain Lift", total: 2, remaining: 2 },
    ],
    transactions: [
      {
        id: "tx_init_1",
        dateStr: getTodayOffsetStr(-60),
        amount: 1500,
        type: "PURCHASE",
        note: "Purchased VIP Membership ($1400 + $100 bonus)",
      },
      {
        id: "tx_init_2",
        dateStr: yesterdayStr,
        amount: -85,
        type: "USAGE",
        note: "Full Grooming (Mochi)",
        appointmentId: "a7",
      },
    ],
  },
  {
    id: "mem_c2",
    customerId: "c2",
    tierName: "STANDARD",
    displayName: "Standard Membership",
    packageType: "CREDITS",
    purchaseDate: getTodayOffsetStr(-30),
    expiryDate: getTodayOffsetStr(150),
    remainingCredits: 420,
    totalCredits: 800,
    hasQueuePriority: false,
    bonusAllowances: [
      { id: "ba3", name: "Spa Therapy or Medicated Treatment", total: 2, remaining: 1 },
    ],
    transactions: [
      {
        id: "tx_init_3",
        dateStr: getTodayOffsetStr(-30),
        amount: 800,
        type: "PURCHASE",
        note: "Purchased Standard Membership",
      },
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
    skinConditions: ["Dry", "Dandruff"],
    skinConditionNotes: "Flaking around upper back and behind right ear.",
    issueLocations: ["Ears", "Back / Spine"],
    healthObservations: "Slight ear discharge in left ear, nails trimmed cleanly.",
    behaviour: "Good, slightly anxious with high velocity dryer near paws.",
    recommendationToOwner: "Apply moisturizing skin spray; recommend medicated bath next month.",
  },
  {
    id: "gr_2",
    appointmentId: "a2_prev",
    petId: "p2",
    dateStr: getTodayOffsetStr(-30),
    groomerName: "Ben Tan",
    serviceDone: "Basic Grooming",
    haircutStyle: "Sanitary shave, trimmed eyes, shaped ears",
    bladeGuardLength: "#10 sanitary, scissor face only",
    skinConditions: ["Normal"],
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
    invoiceNumber: "INV-2026-1001",
    customerName: "Sarah Tan",
    customerPhone: "+65 9123 4567",
    petName: "Mochi",
    serviceName: "Full Grooming",
    servicePrice: 85,
    addOns: [{ name: "Spa Therapy Add-on (Free Package Voucher)", price: 0 }],
    discountAmount: 0,
    subtotal: 85,
    totalAmount: 85,
    paymentMethod: "MEMBERSHIP_CREDIT",
    membershipCreditsDeducted: 85,
    installments: [
      { id: "inst_1", amount: 85, method: "MEMBERSHIP_CREDIT", paidAt: `${yesterdayStr} 11:45` },
    ],
    paidAt: `${yesterdayStr} 11:45`,
    status: "PAID",
  },
  {
    id: "pay_2",
    appointmentId: "a8",
    invoiceNumber: "INV-2026-1002",
    customerName: "James Wong",
    customerPhone: "+65 8234 5678",
    petName: "Cooper",
    serviceName: "De-shedding",
    servicePrice: 110,
    addOns: [{ name: "Matted Fur Surcharge", price: 20 }],
    discountAmount: 10,
    discountNote: "Promo Code: WELCOME10",
    subtotal: 130,
    totalAmount: 120,
    paymentMethod: "PAYNOW",
    installments: [
      { id: "inst_2", amount: 120, method: "PAYNOW", paidAt: `${yesterdayStr} 14:15` },
    ],
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
        vaccinationExpiry: getTodayOffsetStr(190),
        vaccinations: [
          { id: "vac_1", name: "Rabies", dateGiven: getTodayOffsetStr(-175), expiryDate: getTodayOffsetStr(190) },
          { id: "vac_2", name: "DHPPiL", dateGiven: getTodayOffsetStr(-175), expiryDate: getTodayOffsetStr(190) },
        ],
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
        vaccinationExpiry: getTodayOffsetStr(-20),
        vaccinations: [
          { id: "vac_3", name: "Core Booster", dateGiven: getTodayOffsetStr(-385), expiryDate: getTodayOffsetStr(-20) },
        ],
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
        vaccinationExpiry: getTodayOffsetStr(120),
        vaccinations: [
          { id: "vac_4", name: "DHPP + Rabies", dateGiven: getTodayOffsetStr(-245), expiryDate: getTodayOffsetStr(120) },
        ],
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
        vaccinationExpiry: getTodayOffsetStr(20),
        vaccinations: [
          { id: "vac_5", name: "Core Vaccines", dateGiven: getTodayOffsetStr(-345), expiryDate: getTodayOffsetStr(20) },
        ],
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
        vaccinationExpiry: getTodayOffsetStr(280),
        vaccinations: [
          { id: "vac_6", name: "Puppy Core Series", dateGiven: getTodayOffsetStr(-85), expiryDate: getTodayOffsetStr(280) },
        ],
      },
    ],
  },
];

// STAFF
export const MOCK_STAFF_DATA: MockStaff[] = [
  {
    id: "g0",
    name: "Jason Lim",
    role: "OWNER",
    phone: "+65 9000 0000",
    email: "owner@doglab.com",
    pinHash: hashStaffPin("g0", "0000"),
    isActive: true,
    schedule: {
      Mon: "09:00-18:00",
      Tue: "09:00-18:00",
      Wed: "09:00-18:00",
      Thu: "09:00-18:00",
      Fri: "09:00-18:00",
      Sat: "09:00-14:00",
      Sun: "OFF",
    },
  },
  {
    id: "g1",
    name: "Amy Chen",
    role: "GROOMER",
    phone: "+65 9111 2222",
    email: "amy@doglab.com",
    pinHash: hashStaffPin("g1", "1111"),
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
    pinHash: hashStaffPin("g2", "2222"),
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
    pinHash: hashStaffPin("g3", "3333"),
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
    servicePrice: 95,
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
    servicePrice: 65,
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
    serviceName: "De-shedding",
    serviceDuration: 60,
    servicePrice: 120,
    groomerId: "g1",
    groomerName: "Amy Chen",
    status: "BOOKED",
    isWalkIn: false,
    notes: "Undercoat blowout and heavy de-shedding.",
    dateStr: todayStr,
    startTime: "11:30",
    endTime: "12:30",
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
    serviceDuration: 15,
    servicePrice: 15,
    groomerId: "g2",
    groomerName: "Ben Tan",
    status: "DONE",
    isWalkIn: true,
    notes: "Walk-in client for nail trim.",
    dateStr: todayStr,
    startTime: "14:00",
    endTime: "14:15",
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
    serviceName: "Shower Only",
    serviceDuration: 45,
    servicePrice: 45,
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
  MEMBERSHIP_TIERS: "nimbus_membership_tiers",
  GROOMING_RECORDS: "nimbus_grooming_records",
  PAYMENTS: "nimbus_payments",
  SERVICES: "nimbus_services",
  ADDONS: "nimbus_addons",
  PROMO_CODES: "nimbus_promo_codes",
  SETTINGS: "nimbus_settings_rows",
  BACKUPS: "nimbus_backups",
};

const PENDING_SYNC_KEY = "nimbus_pending_sync";

// ---------------------------------------------------------------------------
// STORAGE LAYER WITH PERSISTENT PENDING QUEUE
// ---------------------------------------------------------------------------
const tableOf = (key: string) => key.replace("nimbus_", "").replace("settings_rows", "settings");

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
  if (cached !== null) return cached;
  if (isSupabaseConfigured) return [];
  localStorage.setItem(key, JSON.stringify(demoDefaults));
  return demoDefaults;
}

type PendingMap = Record<string, { upserts: string[]; deletes: string[] }>;

function readPendingSync(): PendingMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PENDING_SYNC_KEY);
    return raw ? (JSON.parse(raw) as PendingMap) : {};
  } catch {
    return {};
  }
}

function writePendingSync(map: PendingMap): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(map));
}

export function getPendingSyncCount(): number {
  const map = readPendingSync();
  return Object.values(map).reduce(
    (sum, entry) => sum + (entry.upserts?.length || 0) + (entry.deletes?.length || 0),
    0
  );
}

let syncChain: Promise<void> = Promise.resolve();

function reportSyncError(message: string) {
  console.error("[nimbus] cloud sync failed:", message);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nimbus-sync-error", { detail: message }));
  }
}

function dispatchDataUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nimbus-data-updated"));
  }
}

async function flushTableSync(key: string): Promise<void> {
  if (!isSupabaseConfigured || typeof window === "undefined") return;
  const table = tableOf(key);
  const pending = readPendingSync();
  const entry = pending[table];
  if (!entry || (entry.upserts.length === 0 && entry.deletes.length === 0)) return;

  const current = readCache<{ id: string }>(key) ?? [];
  const byId = new Map(current.map((r) => [r.id, r]));
  const upsertIds = [...entry.upserts];
  const deleteIds = [...entry.deletes];
  const upsertRows = upsertIds
    .map((id) => byId.get(id))
    .filter((r): r is { id: string } => Boolean(r))
    .map((r) => ({ id: r.id, data: r }));

  for (let attempt = 0; attempt < 2; attempt++) {
    let failure: string | null = null;
    if (upsertRows.length > 0) {
      const { error } = await supabase.from(table).upsert(upsertRows);
      if (error) failure = `${table}: ${error.message}`;
    }
    if (!failure && deleteIds.length > 0) {
      const { error } = await supabase.from(table).delete().in("id", deleteIds);
      if (error) failure = `${table}: ${error.message}`;
    }
    if (!failure) {
      const latestPending = readPendingSync();
      const cur = latestPending[table];
      if (cur) {
        const flushedUpserts = new Set(upsertIds);
        const flushedDeletes = new Set(deleteIds);
        cur.upserts = cur.upserts.filter((id) => !flushedUpserts.has(id));
        cur.deletes = cur.deletes.filter((id) => !flushedDeletes.has(id));
        if (cur.upserts.length === 0 && cur.deletes.length === 0) {
          delete latestPending[table];
        }
        writePendingSync(latestPending);
      }
      window.dispatchEvent(new CustomEvent("nimbus-sync-error", { detail: "" }));
      return;
    }
    if (attempt === 1) reportSyncError(failure);
  }
}

export async function retryPendingSync(): Promise<void> {
  if (!isSupabaseConfigured) return;
  const pending = readPendingSync();
  const keysByTable = new Map(Object.values(STORAGE_KEYS).map((k) => [tableOf(k), k]));
  for (const table of Object.keys(pending)) {
    const key = keysByTable.get(table);
    if (key) {
      syncChain = syncChain.then(() => flushTableSync(key));
    }
  }
  await syncChain;
}

function commit<T extends { id: string }>(key: string, next: T[]): void {
  const prev = readCache<T>(key) ?? [];
  const prevJson = new Map(prev.map((r) => [r.id, JSON.stringify(r)]));
  const changedIds = next
    .filter((r) => prevJson.get(r.id) !== JSON.stringify(r))
    .map((r) => r.id);
  const nextIds = new Set(next.map((r) => r.id));
  const deletedIds = prev.filter((r) => !nextIds.has(r.id)).map((r) => r.id);

  localStorage.setItem(key, JSON.stringify(next));
  dispatchDataUpdated();

  if (!isSupabaseConfigured) return;
  if (changedIds.length === 0 && deletedIds.length === 0) return;

  const table = tableOf(key);
  const pending = readPendingSync();
  const cur = pending[table] || { upserts: [], deletes: [] };
  const upsertSet = new Set(cur.upserts);
  const deleteSet = new Set(cur.deletes);

  for (const id of changedIds) {
    upsertSet.add(id);
    deleteSet.delete(id);
  }
  for (const id of deletedIds) {
    deleteSet.add(id);
    upsertSet.delete(id);
  }
  pending[table] = { upserts: Array.from(upsertSet), deletes: Array.from(deleteSet) };
  writePendingSync(pending);

  syncChain = syncChain.then(() => flushTableSync(key));
}

/** Loads all collections from Supabase into the local cache. Throws on failure. */
export async function hydrateFromCloud(): Promise<void> {
  if (!isSupabaseConfigured) return;

  // Flush any offline/failed writes before pulling remote state
  await retryPendingSync();

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

  // Seed each default catalogue independently if empty on first boot
  if (!localStorage.getItem("nimbus_catalogue_seeded")) {
    const cloudStaffDefaults: MockStaff[] = MOCK_STAFF_DATA.map((s) => ({
      ...s,
      pinHash: undefined,
      pin: undefined,
    }));

    const seedTargets: [string, readonly { id: string }[]][] = [
      [STORAGE_KEYS.SERVICES, MOCK_SERVICES],
      [STORAGE_KEYS.ADDONS, MOCK_ADDONS],
      [STORAGE_KEYS.MEMBERSHIP_TIERS, MEMBERSHIP_TIERS],
      [STORAGE_KEYS.PROMO_CODES, INITIAL_PROMO_CODES],
    ];
    if ((byKey.get(STORAGE_KEYS.STAFF) || []).length === 0) {
      seedTargets.push([STORAGE_KEYS.STAFF, cloudStaffDefaults]);
    }

    let seededAny = false;
    for (const [key, defaults] of seedTargets) {
      if ((byKey.get(key) || []).length === 0) {
        const { error } = await supabase
          .from(tableOf(key))
          .upsert(defaults.map((d) => ({ id: d.id, data: d })));
        if (error) throw new Error(`${tableOf(key)}: ${error.message}`);
        byKey.set(key, [...defaults]);
        seededAny = true;
      }
    }
    if (seededAny || (byKey.get(STORAGE_KEYS.SERVICES) || []).length > 0) {
      localStorage.setItem("nimbus_catalogue_seeded", "1");
    }
  }

  byKey.forEach((rows, key) => localStorage.setItem(key, JSON.stringify(rows)));
  dispatchDataUpdated();
}

let lastCloudRefresh = 0;
export async function refreshFromCloudIfClean(): Promise<void> {
  if (!isSupabaseConfigured || typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastCloudRefresh < 15000) return;
  lastCloudRefresh = now;
  try {
    await retryPendingSync();
    if (getPendingSyncCount() === 0) {
      await hydrateFromCloud();
    }
  } catch {
    // Non-fatal background refresh
  }
}

// STAFF AUTH HELPERS
export function verifyStaffPin(staff: MockStaff, pin: string): boolean {
  const clean = pin.trim();
  if (!clean) return false;
  if (staff.pinHash) {
    return staff.pinHash === hashStaffPin(staff.id, clean);
  }
  if (staff.pin) {
    return staff.pin === clean;
  }
  return false;
}

export function staffHasPin(staff: MockStaff): boolean {
  return Boolean(staff.pinHash || staff.pin);
}

// SCHEDULE & CONFLICT HELPERS
const DAY_INDEX_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function getDayKey(dateStr: string): string {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return "Mon";
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return DAY_INDEX_KEYS[d.getDay()];
}

export function getStaffShiftForDate(staff: MockStaff | undefined, dateStr: string): string {
  if (!staff?.schedule) return "09:00-18:00";
  const dayKey = getDayKey(dateStr);
  return staff.schedule[dayKey] || "OFF";
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = (hhmm || "00:00").split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

export function isTimeWithinShift(startTime: string, endTime: string, shift: string): boolean {
  if (!shift || shift === "OFF") return false;
  const parts = shift.split("-");
  if (parts.length !== 2) return true;
  const sMin = timeToMinutes(startTime);
  const eMin = timeToMinutes(endTime);
  const shiftStart = timeToMinutes(parts[0]);
  const shiftEnd = timeToMinutes(parts[1]);
  return sMin >= shiftStart && eMin <= shiftEnd;
}

export function findOverlappingAppointments(
  groomerId: string,
  dateStr: string,
  startTime: string,
  endTime: string,
  excludeAppointmentId?: string
): MockAppointment[] {
  const sMin = timeToMinutes(startTime);
  const eMin = timeToMinutes(endTime);
  return getAppointments().filter((a) => {
    if (excludeAppointmentId && a.id === excludeAppointmentId) return false;
    if (a.groomerId !== groomerId || a.dateStr !== dateStr) return false;
    if (a.status === "CANCELLED" || a.status === "NO_SHOW") return false;
    const aStart = timeToMinutes(a.startTime);
    const aEnd = timeToMinutes(a.endTime);
    return sMin < aEnd && eMin > aStart;
  });
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

export function deleteAppointment(id: string): void {
  const current = getAppointments();
  const updated = current.filter((a) => a.id !== id);
  commit(STORAGE_KEYS.APPOINTMENTS, updated);
}

// 2. STAFF
export function getStaff(): MockStaff[] {
  if (typeof window === "undefined") return isSupabaseConfigured ? [] : MOCK_STAFF_DATA;
  return readCollection(STORAGE_KEYS.STAFF, isSupabaseConfigured ? [] : MOCK_STAFF_DATA);
}

export function saveStaff(staff: MockStaff): void {
  const current = getStaff();
  const updated = [...current.filter((s) => s.id !== staff.id), staff];
  commit(STORAGE_KEYS.STAFF, updated);
}

export function updateStaff(staff: MockStaff): void {
  const current = getStaff();
  const updated = current.map((s) => (s.id === staff.id ? staff : s));
  commit(STORAGE_KEYS.STAFF, updated);

  // Sync updated groomer name onto appointments
  const apts = getAppointments();
  let aptChanged = false;
  const nextApts = apts.map((a) => {
    if (a.groomerId === staff.id && a.groomerName !== staff.name) {
      aptChanged = true;
      return { ...a, groomerName: staff.name };
    }
    return a;
  });
  if (aptChanged) commit(STORAGE_KEYS.APPOINTMENTS, nextApts);
}

export function deleteStaff(staffId: string): void {
  const current = getStaff();
  const updated = current.filter((s) => s.id !== staffId);
  commit(STORAGE_KEYS.STAFF, updated);
}

// 3. CUSTOMERS & PETS
export function getCustomers(): MockCustomer[] {
  if (typeof window === "undefined") return isSupabaseConfigured ? [] : MOCK_CUSTOMERS_DATA;
  return readCollection(STORAGE_KEYS.CUSTOMERS, isSupabaseConfigured ? [] : MOCK_CUSTOMERS_DATA);
}

export function saveCustomer(customer: MockCustomer): void {
  const current = getCustomers();
  const updated = [customer, ...current.filter((c) => c.id !== customer.id)];
  commit(STORAGE_KEYS.CUSTOMERS, updated);
}

export function deleteCustomer(customerId: string): void {
  const current = getCustomers().filter((c) => c.id !== customerId);
  commit(STORAGE_KEYS.CUSTOMERS, current);
}

export function findPetById(
  petId: string
): { customer: MockCustomer; pet: MockPet } | undefined {
  for (const customer of getCustomers()) {
    const pet = (customer.pets || []).find((p) => p.id === petId);
    if (pet) return { customer, pet };
  }
  return undefined;
}

export function getPetEffectiveVaccinationExpiry(pet: MockPet): string | undefined {
  if (pet.vaccinations && pet.vaccinations.length > 0) {
    const validDates = pet.vaccinations
      .map((v) => v.expiryDate)
      .filter(Boolean)
      .sort();
    if (validDates.length > 0) return validDates[0]; // earliest expiry alerts first
  }
  return pet.vaccinationExpiry;
}

export function addPetToCustomer(customerId: string, pet: MockPet): boolean {
  const customers = getCustomers();
  const cust = customers.find((c) => c.id === customerId);
  if (!cust) return false;
  const normalizedPet: MockPet = {
    ...pet,
    vaccinationExpiry: getPetEffectiveVaccinationExpiry(pet),
  };
  cust.pets = [...(cust.pets || []), normalizedPet];
  commit(STORAGE_KEYS.CUSTOMERS, customers);
  return true;
}

export function updatePet(petId: string, updatedData: Partial<MockPet>): void {
  const customers = getCustomers();
  let updatedPet: MockPet | null = null;
  for (const c of customers) {
    const idx = c.pets.findIndex((p) => p.id === petId);
    if (idx !== -1) {
      const merged: MockPet = { ...c.pets[idx], ...updatedData };
      merged.vaccinationExpiry = getPetEffectiveVaccinationExpiry(merged);
      c.pets[idx] = merged;
      updatedPet = merged;
      break;
    }
  }
  commit(STORAGE_KEYS.CUSTOMERS, customers);

  // Sync updated pet snapshot to appointments
  if (updatedPet) {
    const apts = getAppointments();
    let changed = false;
    const nextApts = apts.map((a) => {
      if (a.petId !== petId) return a;
      if (
        a.petName !== updatedPet!.name ||
        a.petBreed !== updatedPet!.breed ||
        a.petSize !== updatedPet!.size ||
        a.petCoatType !== updatedPet!.coatType
      ) {
        changed = true;
        return {
          ...a,
          petName: updatedPet!.name,
          petBreed: updatedPet!.breed,
          petSize: updatedPet!.size,
          petCoatType: updatedPet!.coatType,
        };
      }
      return a;
    });
    if (changed) commit(STORAGE_KEYS.APPOINTMENTS, nextApts);
  }
}

// 4. MEMBERSHIPS, SESSIONS & TIERS
export function getMembershipTiers(): MembershipTier[] {
  if (typeof window === "undefined") return isSupabaseConfigured ? [] : MEMBERSHIP_TIERS;
  return readCollection(STORAGE_KEYS.MEMBERSHIP_TIERS, isSupabaseConfigured ? [] : MEMBERSHIP_TIERS);
}

export function saveMembershipTier(tier: MembershipTier): void {
  const tiers = getMembershipTiers();
  const idx = tiers.findIndex((t) => t.id === tier.id);
  const updated = idx !== -1 ? tiers.map((t) => (t.id === tier.id ? tier : t)) : [...tiers, tier];
  commit(STORAGE_KEYS.MEMBERSHIP_TIERS, updated);
}

export function deleteMembershipTier(tierId: string): void {
  const updated = getMembershipTiers().filter((t) => t.id !== tierId);
  commit(STORAGE_KEYS.MEMBERSHIP_TIERS, updated);
}

export function getMemberships(): CustomerMembership[] {
  if (typeof window === "undefined") return isSupabaseConfigured ? [] : INITIAL_MEMBERSHIPS;
  return readCollection(STORAGE_KEYS.MEMBERSHIPS, isSupabaseConfigured ? [] : INITIAL_MEMBERSHIPS);
}

export function getCustomerMembership(customerId: string): CustomerMembership | undefined {
  return getMemberships().find((m) => m.customerId === customerId);
}

export function isMembershipExpired(mem?: CustomerMembership): boolean {
  if (!mem?.expiryDate) return false;
  return mem.expiryDate < localDateStr();
}

export function deleteCustomerMembership(customerId: string): void {
  const current = getMemberships().filter((m) => m.customerId !== customerId);
  commit(STORAGE_KEYS.MEMBERSHIPS, current);
}

function buildAllowancesFromTier(tier: MembershipTier): CustomerMembership["bonusAllowances"] {
  if (tier.allowanceTemplates && tier.allowanceTemplates.length > 0) {
    return tier.allowanceTemplates
      .filter((t) => t.name.trim() && t.quantity > 0)
      .map((t) => ({
        id: newId("ba"),
        name: t.name.trim(),
        total: t.quantity,
        remaining: t.quantity,
      }));
  }
  if (tier.packageType === "SESSIONS") return [];
  if (tier.name === "VIP" || tier.name === "SVIP") {
    return [
      { id: newId("ba"), name: "Spa Therapy or Medicated Treatment", total: tier.name === "SVIP" ? 8 : 4, remaining: tier.name === "SVIP" ? 8 : 4 },
      { id: newId("ba"), name: "Nose & Paw Defense or Tear Stain Lift", total: tier.name === "SVIP" ? 4 : 2, remaining: tier.name === "SVIP" ? 4 : 2 },
    ];
  }
  if (tier.name === "BASIC" || tier.name === "STANDARD") {
    const qty = tier.name === "STANDARD" ? 2 : 1;
    return [{ id: newId("ba"), name: "Spa Therapy or Medicated Treatment", total: qty, remaining: qty }];
  }
  return [];
}

export function purchaseMembership(
  customerId: string,
  tierNameOrId: string,
  rolloverRemaining: boolean = true
): CustomerMembership {
  const tiers = getMembershipTiers();
  const tier =
    tiers.find((t) => t.id === tierNameOrId || t.name === tierNameOrId) ||
    tiers[0] ||
    MEMBERSHIP_TIERS[0];
  const existing = getCustomerMembership(customerId);

  const now = new Date();
  let baseDate = now;
  if (existing?.expiryDate) {
    const existingExp = new Date(existing.expiryDate + "T23:59:59");
    if (existingExp > now) {
      baseDate = existingExp;
    }
  }

  const expiry = new Date(baseDate);
  expiry.setMonth(expiry.getMonth() + (tier.validityMonths || 12));

  const bonusAllowances = buildAllowancesFromTier(tier);
  const isSessionPkg = tier.packageType === "SESSIONS";

  const prevRemaining = rolloverRemaining && existing ? Math.max(0, existing.remainingCredits) : 0;
  const addedCredits = isSessionPkg ? 0 : tier.totalCredits;
  const newRemaining = prevRemaining + addedCredits;
  const newTotal =
    rolloverRemaining && existing
      ? existing.totalCredits + addedCredits
      : addedCredits;

  const prevSessions = rolloverRemaining && existing?.remainingSessions ? Math.max(0, existing.remainingSessions) : 0;
  const addedSessions = isSessionPkg ? tier.sessionCount || 1 : 0;
  const newRemainingSessions = prevSessions + addedSessions;
  const newTotalSessions =
    rolloverRemaining && existing?.totalSessions
      ? existing.totalSessions + addedSessions
      : addedSessions;

  let combinedAllowances = bonusAllowances;
  if (rolloverRemaining && existing?.bonusAllowances?.length) {
    combinedAllowances = [
      ...bonusAllowances,
      ...existing.bonusAllowances.filter((ba) => ba.remaining > 0),
    ];
  }

  const purchaseTx: CreditTransaction = {
    id: newId("tx"),
    dateStr: localDateStr(now),
    amount: isSessionPkg ? addedSessions : addedCredits,
    type: "PURCHASE",
    note: isSessionPkg
      ? `Purchased ${tier.displayName} (${addedSessions} sessions, $${tier.price})`
      : `Purchased ${tier.displayName} ($${tier.price} + $${tier.bonusCredits} bonus)`,
  };

  const newMembership: CustomerMembership = {
    id: existing?.id || newId("mem"),
    customerId,
    tierName: tier.name,
    displayName: tier.displayName,
    packageType: tier.packageType || "CREDITS",
    totalSessions: isSessionPkg ? newTotalSessions : existing?.totalSessions,
    remainingSessions: isSessionPkg ? newRemainingSessions : existing?.remainingSessions,
    applicableServiceIds: tier.applicableServiceIds,
    purchaseDate: localDateStr(now),
    expiryDate: localDateStr(expiry),
    remainingCredits: newRemaining,
    totalCredits: newTotal,
    hasQueuePriority: Boolean(tier.hasQueuePriority || existing?.hasQueuePriority),
    bonusAllowances: combinedAllowances,
    transactions: [purchaseTx, ...(existing?.transactions || [])].slice(0, 50),
  };

  const current = getMemberships().filter((m) => m.customerId !== customerId);
  commit(STORAGE_KEYS.MEMBERSHIPS, [newMembership, ...current]);
  return newMembership;
}

export function deductMembershipCredits(
  customerId: string,
  credits: number,
  options?: { allowExpired?: boolean; note?: string; appointmentId?: string }
): boolean {
  const memberships = getMemberships();
  const member = memberships.find((m) => m.customerId === customerId);
  if (!member) return false;
  if (!options?.allowExpired && isMembershipExpired(member)) return false;
  if (member.remainingCredits < credits) return false;

  member.remainingCredits = roundCurrency(member.remainingCredits - credits);
  const tx: CreditTransaction = {
    id: newId("tx"),
    dateStr: localDateStr(),
    amount: -roundCurrency(credits),
    type: "USAGE",
    note: options?.note || "Appointment payment",
    appointmentId: options?.appointmentId,
  };
  member.transactions = [tx, ...(member.transactions || [])].slice(0, 50);
  commit(STORAGE_KEYS.MEMBERSHIPS, memberships);
  return true;
}

export function deductMembershipSession(
  customerId: string,
  serviceId: string,
  options?: { allowExpired?: boolean; note?: string; appointmentId?: string }
): boolean {
  const memberships = getMemberships();
  const member = memberships.find((m) => m.customerId === customerId);
  if (!member || (member.remainingSessions ?? 0) <= 0) return false;
  if (!options?.allowExpired && isMembershipExpired(member)) return false;
  if (
    member.applicableServiceIds &&
    member.applicableServiceIds.length > 0 &&
    !member.applicableServiceIds.includes(serviceId)
  ) {
    return false;
  }

  member.remainingSessions = Math.max(0, (member.remainingSessions ?? 0) - 1);
  const tx: CreditTransaction = {
    id: newId("tx"),
    dateStr: localDateStr(),
    amount: -1,
    type: "SESSION",
    note: options?.note || "Auto-deducted 1 grooming session",
    appointmentId: options?.appointmentId,
  };
  member.transactions = [tx, ...(member.transactions || [])].slice(0, 50);
  commit(STORAGE_KEYS.MEMBERSHIPS, memberships);
  return true;
}

export function setCustomerMembership(membership: CustomerMembership): void {
  const current = getMemberships().filter((m) => m.customerId !== membership.customerId);
  commit(STORAGE_KEYS.MEMBERSHIPS, [membership, ...current]);
}

export function updateCustomerMembership(
  customerId: string,
  updates: Partial<CustomerMembership>,
  transaction?: Omit<CreditTransaction, "id" | "dateStr">
): CustomerMembership | undefined {
  const memberships = getMemberships();
  const idx = memberships.findIndex((m) => m.customerId === customerId);
  if (idx === -1) return undefined;

  const prev = memberships[idx];
  const nextTx = transaction
    ? [
        { id: newId("tx"), dateStr: localDateStr(), ...transaction },
        ...(prev.transactions || []),
      ].slice(0, 50)
    : prev.transactions;

  memberships[idx] = { ...prev, ...updates, transactions: nextTx };
  commit(STORAGE_KEYS.MEMBERSHIPS, memberships);
  return memberships[idx];
}

export function adjustCustomerMembershipCredits(
  customerId: string,
  newRemainingCredits: number,
  newTotalCredits?: number,
  note?: string
): CustomerMembership | undefined {
  const memberships = getMemberships();
  const idx = memberships.findIndex((m) => m.customerId === customerId);
  if (idx === -1) return undefined;

  const prevRem = memberships[idx].remainingCredits;
  const clamped = Math.max(0, roundCurrency(newRemainingCredits));
  memberships[idx].remainingCredits = clamped;
  if (typeof newTotalCredits === "number" && newTotalCredits > 0) {
    memberships[idx].totalCredits = Math.max(newTotalCredits, clamped);
  }
  const delta = roundCurrency(clamped - prevRem);
  const tx: CreditTransaction = {
    id: newId("tx"),
    dateStr: localDateStr(),
    amount: delta,
    type: "ADJUSTMENT",
    note: note?.trim() || "Manual balance adjustment",
  };
  memberships[idx].transactions = [tx, ...(memberships[idx].transactions || [])].slice(0, 50);
  commit(STORAGE_KEYS.MEMBERSHIPS, memberships);
  return memberships[idx];
}

export function deductPackageAddonAllowance(
  customerId: string,
  allowanceId: string,
  note?: string,
  appointmentId?: string
): CustomerMembership | undefined {
  const memberships = getMemberships();
  const idx = memberships.findIndex((m) => m.customerId === customerId);
  if (idx === -1 || !memberships[idx].bonusAllowances) return undefined;

  const allowance = memberships[idx].bonusAllowances.find((a) => a.id === allowanceId);
  if (!allowance || allowance.remaining <= 0) return undefined;

  allowance.remaining -= 1;
  const tx: CreditTransaction = {
    id: newId("tx"),
    dateStr: localDateStr(),
    amount: -1,
    type: "VOUCHER",
    note: note || `Redeemed 1× ${allowance.name}`,
    appointmentId,
  };
  memberships[idx].transactions = [tx, ...(memberships[idx].transactions || [])].slice(0, 50);
  commit(STORAGE_KEYS.MEMBERSHIPS, memberships);
  return memberships[idx];
}

// 5. GROOMING RECORDS (Sorted newest appointment date first)
export function getGroomingRecords(petId?: string): GroomingRecord[] {
  if (typeof window === "undefined") return isSupabaseConfigured ? [] : INITIAL_GROOMING_RECORDS;
  const records = readCollection(STORAGE_KEYS.GROOMING_RECORDS, isSupabaseConfigured ? [] : INITIAL_GROOMING_RECORDS);
  const filtered = petId ? records.filter((r) => r.petId === petId) : records;
  return [...filtered].sort((a, b) => (b.dateStr || "").localeCompare(a.dateStr || ""));
}

export function saveGroomingRecord(record: GroomingRecord): void {
  const current = readCollection(STORAGE_KEYS.GROOMING_RECORDS, isSupabaseConfigured ? [] : INITIAL_GROOMING_RECORDS);
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

  const appointments = getAppointments();
  const apt = appointments.find((a) => a.id === payment.appointmentId);
  if (apt) {
    apt.isPaid = payment.status === "PAID";
    apt.depositPaid = payment.depositAmount ?? apt.depositPaid;
    commit(STORAGE_KEYS.APPOINTMENTS, appointments);
  }
}

export function recordAppointmentDeposit(
  apt: MockAppointment,
  depositAmount: number,
  method: "CASH" | "CARD" | "PAYNOW",
  note?: string
): PaymentRecord {
  const nowStr = `${localDateStr()} ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  const addOnsTotal = (apt.addOns || []).reduce((s, a) => s + a.price, 0);
  const subtotal = roundCurrency(apt.servicePrice + addOnsTotal);
  const cleanDeposit = roundCurrency(Math.min(subtotal, Math.max(0, depositAmount)));
  const balance = roundCurrency(Math.max(0, subtotal - cleanDeposit));

  const existing = getPayments().find((p) => p.appointmentId === apt.id);
  const installment: PaymentInstallment = {
    id: newId("inst"),
    amount: cleanDeposit,
    method,
    paidAt: nowStr,
    note: note || "Booking deposit",
  };

  const record: PaymentRecord = existing
    ? {
        ...existing,
        depositAmount: roundCurrency((existing.depositAmount || 0) + cleanDeposit),
        balanceAmount: roundCurrency(Math.max(0, existing.totalAmount - ((existing.depositAmount || 0) + cleanDeposit))),
        installments: [...(existing.installments || []), installment],
        status: existing.totalAmount - ((existing.depositAmount || 0) + cleanDeposit) <= 0 ? "PAID" : "PARTIAL",
      }
    : {
        id: newId("pay"),
        appointmentId: apt.id,
        invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
        customerName: apt.customerName,
        customerPhone: apt.customerPhone,
        petName: apt.petName,
        serviceName: apt.serviceName,
        servicePrice: apt.servicePrice,
        addOns: apt.addOns || [],
        discountAmount: 0,
        subtotal,
        totalAmount: subtotal,
        depositAmount: cleanDeposit,
        balanceAmount: balance,
        paymentMethod: balance === 0 ? method : "DEPOSIT",
        installments: [installment],
        paidAt: nowStr,
        status: balance === 0 ? "PAID" : "PARTIAL",
      };

  savePayment(record);
  return record;
}

// 7. SERVICES CATALOGUE MANAGEMENT
export function getServices(): MockService[] {
  if (typeof window === "undefined") return isSupabaseConfigured ? [] : MOCK_SERVICES;
  return readCollection(STORAGE_KEYS.SERVICES, isSupabaseConfigured ? [] : MOCK_SERVICES).map((s) =>
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

export function getServiceCategories(): string[] {
  const set = new Set<string>(["Grooming"]);
  getServices().forEach((s) => s.category && set.add(s.category));
  return Array.from(set);
}

export function isFlatRate(service: MockService): boolean {
  if (typeof service.flatRate === "boolean") return service.flatRate;
  const cat = (service.category || "").toLowerCase();
  return cat.includes("train") || cat.includes("daycare");
}

export function saveService(service: MockService): void {
  const services = getServices();
  const idx = services.findIndex((s) => s.id === service.id);
  if (idx !== -1) services[idx] = service;
  else services.push(service);
  commit(STORAGE_KEYS.SERVICES, services);

  // Sync service name to unpaid appointments
  const apts = getAppointments();
  let changed = false;
  const nextApts = apts.map((a) => {
    if (a.serviceId === service.id && !a.isPaid && a.serviceName !== service.name) {
      changed = true;
      return { ...a, serviceName: service.name };
    }
    return a;
  });
  if (changed) commit(STORAGE_KEYS.APPOINTMENTS, nextApts);
}

export function addService(service: MockService): void {
  const services = getServices();
  commit(STORAGE_KEYS.SERVICES, [...services, service]);
}

export function deleteService(serviceId: string): void {
  const updated = getServices().filter((s) => s.id !== serviceId);
  commit(STORAGE_KEYS.SERVICES, updated);
}

// 8. ADD-ONS MANAGEMENT
export function getAddons(): MockAddon[] {
  if (typeof window === "undefined") return isSupabaseConfigured ? [] : MOCK_ADDONS;
  return readCollection(STORAGE_KEYS.ADDONS, isSupabaseConfigured ? [] : MOCK_ADDONS);
}

export function saveAddon(addon: MockAddon): void {
  const addons = getAddons();
  const idx = addons.findIndex((a) => a.id === addon.id);
  if (idx !== -1) addons[idx] = addon;
  else addons.push(addon);
  commit(STORAGE_KEYS.ADDONS, addons);
}

export function addAddon(addon: MockAddon): void {
  commit(STORAGE_KEYS.ADDONS, [...getAddons(), addon]);
}

export function deleteAddon(addonId: string): void {
  commit(STORAGE_KEYS.ADDONS, getAddons().filter((a) => a.id !== addonId));
}

// 9. PROMO CODES
export function getPromoCodes(): PromoCode[] {
  if (typeof window === "undefined") return isSupabaseConfigured ? [] : INITIAL_PROMO_CODES;
  return readCollection(STORAGE_KEYS.PROMO_CODES, isSupabaseConfigured ? [] : INITIAL_PROMO_CODES);
}

export function savePromoCode(promo: PromoCode): void {
  const clean: PromoCode = { ...promo, code: promo.code.trim().toUpperCase() };
  const current = getPromoCodes();
  const idx = current.findIndex((p) => p.id === clean.id);
  const updated = idx !== -1 ? current.map((p) => (p.id === clean.id ? clean : p)) : [clean, ...current];
  commit(STORAGE_KEYS.PROMO_CODES, updated);
}

export function deletePromoCode(promoId: string): void {
  commit(STORAGE_KEYS.PROMO_CODES, getPromoCodes().filter((p) => p.id !== promoId));
}

export function validatePromoCode(
  codeInput: string,
  subtotal: number
): { valid: boolean; discountAmount: number; promo?: PromoCode; reason?: string } {
  const clean = codeInput.trim().toUpperCase();
  if (!clean) return { valid: false, discountAmount: 0, reason: "Enter a promo code." };
  const promo = getPromoCodes().find((p) => p.code.toUpperCase() === clean);
  if (!promo) return { valid: false, discountAmount: 0, reason: "Promo code not found." };
  if (!promo.isActive) return { valid: false, discountAmount: 0, reason: "Promo code is inactive." };
  if (promo.validUntil && promo.validUntil < localDateStr()) {
    return { valid: false, discountAmount: 0, reason: `Promo code expired on ${promo.validUntil}.` };
  }
  if (typeof promo.maxUses === "number" && promo.maxUses > 0 && promo.currentUses >= promo.maxUses) {
    return { valid: false, discountAmount: 0, reason: "Promo code usage limit reached." };
  }
  const discountAmount =
    promo.discountType === "PERCENTAGE"
      ? roundCurrency((subtotal * promo.discountValue) / 100)
      : roundCurrency(Math.min(subtotal, promo.discountValue));
  return { valid: true, discountAmount, promo };
}

export function incrementPromoUsage(code: string): void {
  const clean = code.trim().toUpperCase();
  if (!clean) return;
  const promos = getPromoCodes();
  const target = promos.find((p) => p.code.toUpperCase() === clean);
  if (target) {
    savePromoCode({ ...target, currentUses: (target.currentUses || 0) + 1 });
  }
}

// 10. SALON & CALENDAR SETTINGS (Cloud-synced)
export const DEFAULT_SALON_SETTINGS: SalonSettings = {
  id: "salon_settings",
  calendarStartTime: "08:00",
  calendarEndTime: "21:00",
  salonName: "DOGLAB GROOMING",
  salonAddress: "123 Grooming Lane, Singapore",
  salonPhone: "+65 6789 0123",
  receiptFooter: "Thank you for trusting Doglab with your furkid!",
  autoBackupEnabled: true,
};

export function getSalonSettings(): SalonSettings {
  if (typeof window === "undefined") return DEFAULT_SALON_SETTINGS;
  const rows = readCache<SalonSettings>(STORAGE_KEYS.SETTINGS);
  if (rows && rows.length > 0) {
    return { ...DEFAULT_SALON_SETTINGS, ...rows[0], id: "salon_settings" };
  }
  // Fallback migrate legacy single-object key
  try {
    const legacy = localStorage.getItem("nimbus_settings");
    if (legacy) {
      let parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.length > 0) parsed = parsed[0];
      if (parsed && typeof parsed === "object") {
        return { ...DEFAULT_SALON_SETTINGS, ...parsed, id: "salon_settings" };
      }
    }
  } catch {}
  return DEFAULT_SALON_SETTINGS;
}

export function saveSalonSettings(settings: Partial<SalonSettings>): SalonSettings {
  const current = getSalonSettings();
  const updated: SalonSettings & { id: string } = {
    ...current,
    ...settings,
    id: "salon_settings",
  };
  if (typeof window !== "undefined") {
    commit(STORAGE_KEYS.SETTINGS, [updated]);
    localStorage.setItem("nimbus_settings", JSON.stringify(updated));
  }
  return updated;
}

// 11. AUTOMATIC & MANUAL DATA BACKUP / RESTORE
export function getBackups(): BackupSnapshot[] {
  if (typeof window === "undefined") return [];
  const list = readCollection<BackupSnapshot>(STORAGE_KEYS.BACKUPS, []);
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function buildBackupPayload(): Record<string, unknown> {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    customers: getCustomers(),
    appointments: getAppointments(),
    staff: getStaff(),
    memberships: getMemberships(),
    membership_tiers: getMembershipTiers(),
    grooming_records: getGroomingRecords(),
    payments: getPayments(),
    services: getServices(),
    addons: getAddons(),
    promo_codes: getPromoCodes(),
    settings: getSalonSettings(),
  };
}

export function createBackupSnapshot(trigger: "AUTO" | "MANUAL"): BackupSnapshot {
  const payload = buildBackupPayload();
  const customers = (payload.customers as MockCustomer[]) || [];
  const appointments = (payload.appointments as MockAppointment[]) || [];
  const payments = (payload.payments as PaymentRecord[]) || [];
  const groomingRecords = (payload.grooming_records as GroomingRecord[]) || [];

  const snapshot: BackupSnapshot = {
    id: newId("bak"),
    createdAt: new Date().toISOString(),
    dateStr: localDateStr(),
    trigger,
    summary: {
      customers: customers.length,
      appointments: appointments.length,
      payments: payments.length,
      groomingRecords: groomingRecords.length,
    },
    payload,
  };

  // Keep latest 10 snapshots to stay light in storage
  const existing = getBackups();
  const next = [snapshot, ...existing].slice(0, 10);
  commit(STORAGE_KEYS.BACKUPS, next);

  saveSalonSettings({ lastAutoBackupAt: snapshot.createdAt });
  return snapshot;
}

export function deleteBackupSnapshot(id: string): void {
  const next = getBackups().filter((b) => b.id !== id);
  commit(STORAGE_KEYS.BACKUPS, next);
}

export function runDailyAutoBackupIfNeeded(): BackupSnapshot | null {
  if (typeof window === "undefined") return null;
  const settings = getSalonSettings();
  if (!settings.autoBackupEnabled) return null;
  const today = localDateStr();
  const existing = getBackups();
  const alreadyToday = existing.some((b) => b.dateStr === today);
  if (alreadyToday) return null;
  return createBackupSnapshot("AUTO");
}

export function restoreFromBackupPayload(raw: Record<string, unknown>): {
  ok: boolean;
  error?: string;
} {
  try {
    if (!raw || typeof raw !== "object") {
      return { ok: false, error: "Invalid backup JSON format." };
    }
    if (Array.isArray(raw.customers)) commit(STORAGE_KEYS.CUSTOMERS, raw.customers as MockCustomer[]);
    if (Array.isArray(raw.appointments)) commit(STORAGE_KEYS.APPOINTMENTS, raw.appointments as MockAppointment[]);
    if (Array.isArray(raw.staff)) commit(STORAGE_KEYS.STAFF, raw.staff as MockStaff[]);
    if (Array.isArray(raw.memberships)) commit(STORAGE_KEYS.MEMBERSHIPS, raw.memberships as CustomerMembership[]);
    if (Array.isArray(raw.membership_tiers)) commit(STORAGE_KEYS.MEMBERSHIP_TIERS, raw.membership_tiers as MembershipTier[]);
    if (Array.isArray(raw.grooming_records)) commit(STORAGE_KEYS.GROOMING_RECORDS, raw.grooming_records as GroomingRecord[]);
    if (Array.isArray(raw.payments)) commit(STORAGE_KEYS.PAYMENTS, raw.payments as PaymentRecord[]);
    if (Array.isArray(raw.services)) commit(STORAGE_KEYS.SERVICES, raw.services as MockService[]);
    if (Array.isArray(raw.addons)) commit(STORAGE_KEYS.ADDONS, raw.addons as MockAddon[]);
    if (Array.isArray(raw.promo_codes)) commit(STORAGE_KEYS.PROMO_CODES, raw.promo_codes as PromoCode[]);
    if (raw.settings && typeof raw.settings === "object") {
      saveSalonSettings(raw.settings as Partial<SalonSettings>);
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to restore backup." };
  }
}
