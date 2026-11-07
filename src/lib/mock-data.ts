// Shared mock data store with state management for prototype demo
// Covers V1.1 (Booking & Customers) and V1.2 (Pricing, Memberships, Grooming Records, Payments & Reports)

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
  duration: number; // in mins
  basePrice: number;
  price: number;
  description: string;
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

// Date helpers
function getTodayOffsetStr(daysOffset: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split("T")[0];
}

const todayStr = getTodayOffsetStr(0);
const tomorrowStr = getTodayOffsetStr(1);
const yesterdayStr = getTodayOffsetStr(-1);

// 1. SERVICES CATALOGUE
export const MOCK_SERVICES: MockService[] = [
  { id: "s1", name: "Full Grooming", duration: 120, basePrice: 85, price: 85, description: "Full styling, bath, fluff dry, sanitary shave, paw pads, ear cleaning, and nail trim." },
  { id: "s2", name: "Basic Grooming", duration: 75, basePrice: 55, price: 55, description: "Bath, fluff dry, sanitary clip, paw pad trim, nail clipping, and ear cleaning." },
  { id: "s3", name: "Shower Only", duration: 45, basePrice: 35, price: 35, description: "Gentle shampoo bath and thorough blow dry." },
  { id: "s4", name: "Express Grooming", duration: 60, basePrice: 95, price: 95, description: "Fast turnaround, single-groomer dedicated priority session." },
  { id: "s5", name: "Medicated Treatment", duration: 45, basePrice: 50, price: 50, description: "Specialized anti-bacterial or soothing medicated soak for skin issues." },
  { id: "s6", name: "Nail Trim", duration: 15, basePrice: 15, price: 15, description: "Clipping and smoothing edges." },
  { id: "s7", name: "Teeth Cleaning", duration: 20, basePrice: 25, price: 25, description: "Ultrasonic / oral brushing and fresh breath gel." },
  { id: "s8", name: "De-shedding", duration: 60, basePrice: 65, price: 65, description: "High-velocity undercoat blowout and thorough brush out." },
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
  const service = MOCK_SERVICES.find((s) => s.id === serviceId) || MOCK_SERVICES[0];
  let price = service.basePrice;

  // Small is base
  if (petSize === "MEDIUM") price += 20;
  if (petSize === "LARGE") price += 45;
  if (petSize === "EXTRA_LARGE") price += 75;

  // Coat difficulty modifier (curly, long, double take longer)
  if (["CURLY", "LONG", "DOUBLE"].includes(coatType) && ["s1", "s2", "s8"].includes(serviceId)) {
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

// 1. APPOINTMENTS
export function getAppointments(): MockAppointment[] {
  if (typeof window === "undefined") return MOCK_APPOINTMENTS_DATA;
  const stored = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(MOCK_APPOINTMENTS_DATA));
    return MOCK_APPOINTMENTS_DATA;
  }
  return JSON.parse(stored);
}

export function saveAppointment(apt: MockAppointment): void {
  const current = getAppointments();
  const updated = [apt, ...current.filter((a) => a.id !== apt.id)];
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updated));
}

export function updateAppointmentStatus(id: string, status: MockAppointment["status"]): void {
  const current = getAppointments();
  const updated = current.map((a) => (a.id === id ? { ...a, status } : a));
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updated));
}

// 2. STAFF
export function getStaff(): MockStaff[] {
  if (typeof window === "undefined") return MOCK_STAFF_DATA;
  const stored = localStorage.getItem(STORAGE_KEYS.STAFF);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(MOCK_STAFF_DATA));
    return MOCK_STAFF_DATA;
  }
  return JSON.parse(stored);
}

export function saveStaff(staff: MockStaff): void {
  const current = getStaff();
  const updated = [...current, staff];
  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(updated));
}

// 3. CUSTOMERS
export function getCustomers(): MockCustomer[] {
  if (typeof window === "undefined") return MOCK_CUSTOMERS_DATA;
  const stored = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(MOCK_CUSTOMERS_DATA));
    return MOCK_CUSTOMERS_DATA;
  }
  return JSON.parse(stored);
}

export function saveCustomer(customer: MockCustomer): void {
  const current = getCustomers();
  const updated = [customer, ...current.filter((c) => c.id !== customer.id)];
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
}

// 4. MEMBERSHIPS
export function getMemberships(): CustomerMembership[] {
  if (typeof window === "undefined") return INITIAL_MEMBERSHIPS;
  const stored = localStorage.getItem(STORAGE_KEYS.MEMBERSHIPS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.MEMBERSHIPS, JSON.stringify(INITIAL_MEMBERSHIPS));
    return INITIAL_MEMBERSHIPS;
  }
  return JSON.parse(stored);
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
    purchaseDate: now.toISOString().split("T")[0],
    expiryDate: expiry.toISOString().split("T")[0],
    remainingCredits: tier.totalCredits,
    totalCredits: tier.totalCredits,
    hasQueuePriority: tier.hasQueuePriority,
    bonusAllowances,
  };

  const current = getMemberships().filter((m) => m.customerId !== customerId);
  const updated = [newMembership, ...current];
  localStorage.setItem(STORAGE_KEYS.MEMBERSHIPS, JSON.stringify(updated));
  return newMembership;
}

export function deductMembershipCredits(customerId: string, credits: number): boolean {
  const memberships = getMemberships();
  const member = memberships.find((m) => m.customerId === customerId);
  if (!member || member.remainingCredits < credits) return false;

  member.remainingCredits -= credits;
  localStorage.setItem(STORAGE_KEYS.MEMBERSHIPS, JSON.stringify(memberships));
  return true;
}

// 5. GROOMING RECORDS
export function getGroomingRecords(petId?: string): GroomingRecord[] {
  if (typeof window === "undefined") return INITIAL_GROOMING_RECORDS;
  const stored = localStorage.getItem(STORAGE_KEYS.GROOMING_RECORDS);
  let records: GroomingRecord[] = INITIAL_GROOMING_RECORDS;
  if (stored) {
    records = JSON.parse(stored);
  } else {
    localStorage.setItem(STORAGE_KEYS.GROOMING_RECORDS, JSON.stringify(INITIAL_GROOMING_RECORDS));
  }
  return petId ? records.filter((r) => r.petId === petId) : records;
}

export function saveGroomingRecord(record: GroomingRecord): void {
  const current = getGroomingRecords();
  const updated = [record, ...current.filter((r) => r.id !== record.id)];
  localStorage.setItem(STORAGE_KEYS.GROOMING_RECORDS, JSON.stringify(updated));
}

// 6. PAYMENTS & INVOICES
export function getPayments(): PaymentRecord[] {
  if (typeof window === "undefined") return INITIAL_PAYMENTS;
  const stored = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
    return INITIAL_PAYMENTS;
  }
  return JSON.parse(stored);
}

export function savePayment(payment: PaymentRecord): void {
  const current = getPayments();
  const updated = [payment, ...current.filter((p) => p.id !== payment.id)];
  localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(updated));

  // Mark appointment as paid
  const appointments = getAppointments();
  const apt = appointments.find((a) => a.id === payment.appointmentId);
  if (apt) {
    apt.isPaid = true;
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }
}

// 7. PET MANAGEMENT HELPERS
export function addPetToCustomer(customerId: string, pet: MockPet): void {
  const customers = getCustomers();
  const cust = customers.find((c) => c.id === customerId);
  if (cust) {
    cust.pets = [pet, ...(cust.pets || [])];
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }
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
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
}

// 8. SERVICES CATALOGUE MANAGEMENT
export function getServices(): MockService[] {
  if (typeof window === "undefined") return MOCK_SERVICES;
  const stored = localStorage.getItem(STORAGE_KEYS.SERVICES);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(MOCK_SERVICES));
    return MOCK_SERVICES;
  }
  return JSON.parse(stored);
}

export function saveService(service: MockService): void {
  const services = getServices();
  const idx = services.findIndex((s) => s.id === service.id);
  if (idx !== -1) {
    services[idx] = service;
  } else {
    services.push(service);
  }
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
}

export function addService(service: MockService): void {
  const services = getServices();
  const updated = [...services, service];
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(updated));
}

export function deleteService(serviceId: string): void {
  const services = getServices();
  const updated = services.filter((s) => s.id !== serviceId);
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(updated));
}

// 9. ADD-ONS MANAGEMENT
export function getAddons(): MockAddon[] {
  if (typeof window === "undefined") return MOCK_ADDONS;
  const stored = localStorage.getItem(STORAGE_KEYS.ADDONS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.ADDONS, JSON.stringify(MOCK_ADDONS));
    return MOCK_ADDONS;
  }
  return JSON.parse(stored);
}

export function saveAddon(addon: MockAddon): void {
  const addons = getAddons();
  const idx = addons.findIndex((a) => a.id === addon.id);
  if (idx !== -1) {
    addons[idx] = addon;
  } else {
    addons.push(addon);
  }
  localStorage.setItem(STORAGE_KEYS.ADDONS, JSON.stringify(addons));
}

export function addAddon(addon: MockAddon): void {
  const addons = getAddons();
  const updated = [...addons, addon];
  localStorage.setItem(STORAGE_KEYS.ADDONS, JSON.stringify(updated));
}

export function deleteAddon(addonId: string): void {
  const addons = getAddons();
  const updated = addons.filter((a) => a.id !== addonId);
  localStorage.setItem(STORAGE_KEYS.ADDONS, JSON.stringify(updated));
}

// 10. STAFF EDIT & DELETE
export function updateStaff(staff: MockStaff): void {
  const current = getStaff();
  const updated = current.map((s) => (s.id === staff.id ? staff : s));
  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(updated));
}

export function deleteStaff(staffId: string): void {
  const current = getStaff();
  const updated = current.filter((s) => s.id !== staffId);
  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(updated));
}
