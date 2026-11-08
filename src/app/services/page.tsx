"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calculator,
  Plus,
  Clock,
  Crown,
  CheckCircle,
  Edit,
  Trash2,
  Check,
  Tag,
  Percent,
  X,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showToast } from "@/components/ui/toast-system";
import { COAT_TYPES, formatPrice, roundCurrency } from "@/lib/utils";
import {
  newId,
  localDateStr,
  MEMBERSHIP_TIERS,
  getMembershipTiers,
  saveMembershipTier,
  deleteMembershipTier,
  MembershipTier,
  TierAllowanceTemplate,
  getServiceCategories,
  isFlatRate,
  calculateServicePrice,
  getServices,
  saveService,
  addService,
  deleteService,
  getAddons,
  saveAddon,
  addAddon,
  deleteAddon,
  getPromoCodes,
  savePromoCode,
  deletePromoCode,
  MockService,
  MockAddon,
  MockPet,
  BreedPriceRule,
  PromoCode,
} from "@/lib/mock-data";

const DEFAULT_CATEGORIES = [
  "Grooming",
  "Spa & Treatment",
  "Hygiene & Maintenance",
  "Training & Behavior",
  "Daycare & Boarding",
];

const DEFAULT_SIZE_SURCHARGES: Record<MockPet["size"], number> = {
  SMALL: 0,
  MEDIUM: 20,
  LARGE: 45,
  EXTRA_LARGE: 75,
};

function defaultCoatSurchargesForCategory(category: string): Record<MockPet["coatType"], number> {
  const isGrooming = !category || category === "Grooming";
  return {
    SHORT: 0,
    MEDIUM: 0,
    LONG: isGrooming ? 10 : 0,
    DOUBLE: isGrooming ? 10 : 0,
    WIRE: 0,
    CURLY: isGrooming ? 10 : 0,
  };
}

function getEffectiveSizeSurcharge(service: MockService | undefined, size: MockPet["size"]): number {
  return service?.sizeSurcharges?.[size] ?? DEFAULT_SIZE_SURCHARGES[size] ?? 0;
}

function getEffectiveCoatSurcharge(service: MockService | undefined, coat: MockPet["coatType"]): number {
  const custom = service?.coatSurcharges?.[coat];
  if (typeof custom === "number") return custom;
  const isGrooming = !service?.category || service.category === "Grooming";
  return isGrooming && ["CURLY", "LONG", "DOUBLE"].includes(coat) ? 10 : 0;
}

export default function ServicesPage() {
  const [services, setServices] = useState<MockService[]>([]);
  const [addons, setAddons] = useState<MockAddon[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [membershipTiers, setMembershipTiers] = useState<MembershipTier[]>([]);
  const [activeTab, setActiveTab] = useState("services");

  // Delete Confirmation Dialog
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "service" | "addon" | "promo" | "tier";
    id: string;
    name: string;
  } | null>(null);

  // Dynamic pricing preview state
  const [calcServiceId, setCalcServiceId] = useState("");
  const [calcSize, setCalcSize] = useState<MockPet["size"]>("SMALL");
  const [calcCoat, setCalcCoat] = useState<MockPet["coatType"]>("CURLY");
  const [calcBreed, setCalcBreed] = useState("");

  // Service Edit / Add Dialog State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState<number>(65);
  const [serviceDuration, setServiceDuration] = useState<number>(60);
  const [serviceDesc, setServiceDesc] = useState("");
  const [serviceCategory, setServiceCategory] = useState("Grooming");
  const [newCategoryText, setNewCategoryText] = useState("");
  const [serviceFlat, setServiceFlat] = useState(false);
  const [sizeSurcharges, setSizeSurcharges] = useState<Record<MockPet["size"], number>>(DEFAULT_SIZE_SURCHARGES);
  const [coatSurcharges, setCoatSurcharges] = useState<Record<MockPet["coatType"], number>>(
    defaultCoatSurchargesForCategory("Grooming")
  );
  const [breedPrices, setBreedPrices] = useState<BreedPriceRule[]>([]);
  const [newBreedName, setNewBreedName] = useState("");
  const [newBreedPrice, setNewBreedPrice] = useState<string>("");
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const NEW_CATEGORY = "__new__";

  // Add-on Edit / Add Dialog State
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [addonName, setAddonName] = useState("");
  const [addonPrice, setAddonPrice] = useState<number>(20);
  const [addonDesc, setAddonDesc] = useState("");

  // Promo Code Edit / Add Dialog State
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoDesc, setPromoDesc] = useState("");
  const [promoType, setPromoType] = useState<"FIXED" | "PERCENTAGE">("FIXED");
  const [promoValue, setPromoValue] = useState<number>(10);
  const [promoValidUntil, setPromoValidUntil] = useState("");
  const [promoMaxUses, setPromoMaxUses] = useState<string>("");
  const [promoActive, setPromoActive] = useState(true);

  // Membership Tier Edit / Add Dialog State
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [tierPackageType, setTierPackageType] = useState<"CREDITS" | "SESSIONS">("CREDITS");
  const [tierName, setTierName] = useState("VIP");
  const [tierDisplayName, setTierDisplayName] = useState("VIP Membership");
  const [tierPrice, setTierPrice] = useState<number>(1400);
  const [tierBonusCredits, setTierBonusCredits] = useState<number>(100);
  const [tierTotalCredits, setTierTotalCredits] = useState<number>(1500);
  const [tierSessionCount, setTierSessionCount] = useState<number>(5);
  const [tierApplicableServiceIds, setTierApplicableServiceIds] = useState<string[]>([]);
  const [tierValidityMonths, setTierValidityMonths] = useState<number>(12);
  const [tierHasQueuePriority, setTierHasQueuePriority] = useState<boolean>(true);
  const [tierAllowances, setTierAllowances] = useState<TierAllowanceTemplate[]>([]);
  const [newAllowanceName, setNewAllowanceName] = useState("");
  const [newAllowanceQty, setNewAllowanceQty] = useState<number>(1);
  const [tierBenefitsText, setTierBenefitsText] = useState<string>("");

  const refreshData = () => {
    const s = getServices();
    const a = getAddons();
    const p = getPromoCodes();
    const t = getMembershipTiers();
    setServices(s);
    setAddons(a);
    setPromos(p);
    setMembershipTiers(t);

    const catMap = new Map<string, string>();
    [...DEFAULT_CATEGORIES, ...getServiceCategories()].forEach((cat) => {
      const clean = cat.trim();
      if (clean && !catMap.has(clean.toLowerCase())) {
        catMap.set(clean.toLowerCase(), clean);
      }
    });
    setCategories(Array.from(catMap.values()));

    setCalcServiceId((prev) => (prev && s.some((item) => item.id === prev) ? prev : s[0]?.id || ""));
  };

  useEffect(() => {
    refreshData();
    const onRefresh = () => refreshData();
    window.addEventListener("nimbus-data-updated", onRefresh);
    return () => window.removeEventListener("nimbus-data-updated", onRefresh);
  }, []);

  const selectedCalcService = services.find((s) => s.id === calcServiceId) || services[0];
  const matchedCalcBreed = useMemo(() => {
    if (!selectedCalcService || isFlatRate(selectedCalcService) || !calcBreed.trim()) return undefined;
    const clean = calcBreed.trim().toLowerCase();
    return selectedCalcService.breedPrices?.find((bp) => bp.breed.trim().toLowerCase() === clean);
  }, [selectedCalcService, calcBreed]);

  const calculatedRate = calcServiceId
    ? calculateServicePrice(calcServiceId, calcSize, calcCoat, calcBreed)
    : 0;

  // --- SERVICE ACTIONS ---
  const handleOpenAddService = () => {
    setEditingServiceId(null);
    setServiceName("");
    setServicePrice(65);
    setServiceDuration(60);
    setServiceDesc("");
    setServiceCategory("Grooming");
    setNewCategoryText("");
    setServiceFlat(false);
    setSizeSurcharges({ ...DEFAULT_SIZE_SURCHARGES });
    setCoatSurcharges(defaultCoatSurchargesForCategory("Grooming"));
    setBreedPrices([]);
    setNewBreedName("");
    setNewBreedPrice("");
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (service: MockService) => {
    const cat = service.category || "Grooming";
    const defCoats = defaultCoatSurchargesForCategory(cat);
    setEditingServiceId(service.id);
    setServiceName(service.name);
    setServicePrice(service.basePrice);
    setServiceDuration(service.duration);
    setServiceDesc(service.description);
    setServiceCategory(cat);
    setNewCategoryText("");
    setServiceFlat(isFlatRate(service));
    setSizeSurcharges({
      SMALL: service.sizeSurcharges?.SMALL ?? DEFAULT_SIZE_SURCHARGES.SMALL,
      MEDIUM: service.sizeSurcharges?.MEDIUM ?? DEFAULT_SIZE_SURCHARGES.MEDIUM,
      LARGE: service.sizeSurcharges?.LARGE ?? DEFAULT_SIZE_SURCHARGES.LARGE,
      EXTRA_LARGE: service.sizeSurcharges?.EXTRA_LARGE ?? DEFAULT_SIZE_SURCHARGES.EXTRA_LARGE,
    });
    setCoatSurcharges({
      SHORT: service.coatSurcharges?.SHORT ?? defCoats.SHORT,
      MEDIUM: service.coatSurcharges?.MEDIUM ?? defCoats.MEDIUM,
      LONG: service.coatSurcharges?.LONG ?? defCoats.LONG,
      DOUBLE: service.coatSurcharges?.DOUBLE ?? defCoats.DOUBLE,
      WIRE: service.coatSurcharges?.WIRE ?? defCoats.WIRE,
      CURLY: service.coatSurcharges?.CURLY ?? defCoats.CURLY,
    });
    setBreedPrices(service.breedPrices ? [...service.breedPrices] : []);
    setNewBreedName("");
    setNewBreedPrice("");
    setIsServiceModalOpen(true);
  };

  const handleAddBreedRule = () => {
    const cleanBreed = newBreedName.trim();
    const numPrice = parseFloat(newBreedPrice);
    if (!cleanBreed) {
      showToast("Enter a breed name for the custom price rule.", "warning");
      return;
    }
    if (!Number.isFinite(numPrice) || numPrice < 0) {
      showToast("Enter a valid non-negative breed price.", "warning");
      return;
    }
    if (breedPrices.some((bp) => bp.breed.trim().toLowerCase() === cleanBreed.toLowerCase())) {
      showToast(`A custom price for "${cleanBreed}" already exists.`, "warning");
      return;
    }
    setBreedPrices((prev) => [
      ...prev,
      { id: newId("bp"), breed: cleanBreed, price: roundCurrency(numPrice) },
    ]);
    setNewBreedName("");
    setNewBreedPrice("");
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      showToast("Service name is required.", "warning");
      return;
    }

    let category =
      serviceCategory === NEW_CATEGORY ? newCategoryText.trim() : serviceCategory;
    if (!category) {
      showToast("Please enter a name for the new category.", "warning");
      return;
    }
    const existingCat = categories.find((c) => c.toLowerCase() === category.toLowerCase());
    if (existingCat) category = existingCat;

    const cleanBase = roundCurrency(Math.max(0, Number(servicePrice) || 0));
    const record: MockService = {
      id: editingServiceId || newId("srv"),
      name: serviceName.trim(),
      category,
      flatRate: serviceFlat,
      basePrice: cleanBase,
      price: cleanBase,
      duration: Math.max(5, Number(serviceDuration) || 30),
      description: serviceDesc.trim(),
      sizeSurcharges: serviceFlat
        ? undefined
        : {
            SMALL: roundCurrency(Math.max(0, sizeSurcharges.SMALL || 0)),
            MEDIUM: roundCurrency(Math.max(0, sizeSurcharges.MEDIUM || 0)),
            LARGE: roundCurrency(Math.max(0, sizeSurcharges.LARGE || 0)),
            EXTRA_LARGE: roundCurrency(Math.max(0, sizeSurcharges.EXTRA_LARGE || 0)),
          },
      coatSurcharges: serviceFlat
        ? undefined
        : {
            SHORT: roundCurrency(Math.max(0, coatSurcharges.SHORT || 0)),
            MEDIUM: roundCurrency(Math.max(0, coatSurcharges.MEDIUM || 0)),
            LONG: roundCurrency(Math.max(0, coatSurcharges.LONG || 0)),
            DOUBLE: roundCurrency(Math.max(0, coatSurcharges.DOUBLE || 0)),
            WIRE: roundCurrency(Math.max(0, coatSurcharges.WIRE || 0)),
            CURLY: roundCurrency(Math.max(0, coatSurcharges.CURLY || 0)),
          },
      breedPrices: serviceFlat ? undefined : breedPrices,
    };

    if (editingServiceId) {
      saveService(record);
      showToast(`Updated service "${record.name}".`, "success");
    } else {
      addService(record);
      showToast(`Created service "${record.name}".`, "success");
    }

    refreshData();
    setIsServiceModalOpen(false);
  };

  // --- ADDON ACTIONS ---
  const handleOpenAddAddon = () => {
    setEditingAddonId(null);
    setAddonName("");
    setAddonPrice(20);
    setAddonDesc("");
    setIsAddonModalOpen(true);
  };

  const handleOpenEditAddon = (addon: MockAddon) => {
    setEditingAddonId(addon.id);
    setAddonName(addon.name);
    setAddonPrice(addon.price);
    setAddonDesc(addon.description);
    setIsAddonModalOpen(true);
  };

  const handleSaveAddon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addonName.trim()) {
      showToast("Add-on name is required.", "warning");
      return;
    }

    const cleanPrice = roundCurrency(Math.max(0, Number(addonPrice) || 0));
    if (editingAddonId) {
      saveAddon({
        id: editingAddonId,
        name: addonName.trim(),
        price: cleanPrice,
        description: addonDesc.trim(),
      });
      showToast(`Updated add-on "${addonName.trim()}".`, "success");
    } else {
      addAddon({
        id: newId("add"),
        name: addonName.trim(),
        price: cleanPrice,
        description: addonDesc.trim(),
      });
      showToast(`Created add-on "${addonName.trim()}".`, "success");
    }

    refreshData();
    setIsAddonModalOpen(false);
  };

  // --- PROMO CODE ACTIONS ---
  const handleOpenAddPromo = () => {
    setEditingPromoId(null);
    setPromoCode("");
    setPromoDesc("");
    setPromoType("FIXED");
    setPromoValue(10);
    setPromoValidUntil("");
    setPromoMaxUses("");
    setPromoActive(true);
    setIsPromoModalOpen(true);
  };

  const handleOpenEditPromo = (promo: PromoCode) => {
    setEditingPromoId(promo.id);
    setPromoCode(promo.code);
    setPromoDesc(promo.description || "");
    setPromoType(promo.discountType);
    setPromoValue(promo.discountValue);
    setPromoValidUntil(promo.validUntil || "");
    setPromoMaxUses(promo.maxUses ? String(promo.maxUses) : "");
    setPromoActive(promo.isActive);
    setIsPromoModalOpen(true);
  };

  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = promoCode.trim().toUpperCase().replace(/\s+/g, "");
    if (!cleanCode) {
      showToast("Promo code cannot be empty.", "warning");
      return;
    }
    const existingDup = promos.find(
      (p) => p.code.toUpperCase() === cleanCode && p.id !== editingPromoId
    );
    if (existingDup) {
      showToast(`Promo code "${cleanCode}" already exists.`, "error");
      return;
    }
    const cleanVal = roundCurrency(Math.max(0, Number(promoValue) || 0));
    if (cleanVal <= 0) {
      showToast("Discount value must be greater than zero.", "warning");
      return;
    }
    if (promoType === "PERCENTAGE" && cleanVal > 100) {
      showToast("Percentage discount cannot exceed 100%.", "warning");
      return;
    }

    const parsedMax = promoMaxUses.trim() ? parseInt(promoMaxUses, 10) : undefined;
    const existingUses = editingPromoId
      ? promos.find((p) => p.id === editingPromoId)?.currentUses || 0
      : 0;

    const record: PromoCode = {
      id: editingPromoId || newId("promo"),
      code: cleanCode,
      description: promoDesc.trim() || undefined,
      discountType: promoType,
      discountValue: cleanVal,
      isActive: promoActive,
      validUntil: promoValidUntil.trim() || undefined,
      maxUses: parsedMax && parsedMax > 0 ? parsedMax : undefined,
      currentUses: existingUses,
    };

    savePromoCode(record);
    showToast(
      editingPromoId ? `Updated promo "${record.code}".` : `Created promo "${record.code}".`,
      "success"
    );
    refreshData();
    setIsPromoModalOpen(false);
  };

  const handleTogglePromoActive = (promo: PromoCode, nextActive: boolean) => {
    savePromoCode({ ...promo, isActive: nextActive });
    showToast(`Promo "${promo.code}" ${nextActive ? "activated" : "paused"}.`, "info");
    refreshData();
  };

  // --- MEMBERSHIP TIER ACTIONS ---
  const handleOpenAddTier = () => {
    setEditingTierId(null);
    setTierPackageType("CREDITS");
    setTierName("NEW_TIER");
    setTierDisplayName("Custom Membership Tier");
    setTierPrice(500);
    setTierBonusCredits(50);
    setTierTotalCredits(550);
    setTierSessionCount(5);
    setTierApplicableServiceIds([]);
    setTierValidityMonths(6);
    setTierHasQueuePriority(false);
    setTierAllowances([{ name: "Spa Therapy or Medicated Treatment", quantity: 1 }]);
    setNewAllowanceName("");
    setNewAllowanceQty(1);
    setTierBenefitsText("1× Free Spa Treatment\n6 Month Validity");
    setIsTierModalOpen(true);
  };

  const handleOpenEditTier = (tier: MembershipTier) => {
    setEditingTierId(tier.id);
    setTierPackageType(tier.packageType === "SESSIONS" ? "SESSIONS" : "CREDITS");
    setTierName(tier.name);
    setTierDisplayName(tier.displayName);
    setTierPrice(tier.price);
    setTierBonusCredits(tier.bonusCredits);
    setTierTotalCredits(tier.totalCredits);
    setTierSessionCount(tier.sessionCount || 5);
    setTierApplicableServiceIds(tier.applicableServiceIds || []);
    setTierValidityMonths(tier.validityMonths);
    setTierHasQueuePriority(tier.hasQueuePriority);
    setTierAllowances(tier.allowanceTemplates ? [...tier.allowanceTemplates] : []);
    setNewAllowanceName("");
    setNewAllowanceQty(1);
    setTierBenefitsText((tier.includedBenefits || []).join("\n"));
    setIsTierModalOpen(true);
  };

  const handleAddAllowanceTemplate = () => {
    const clean = newAllowanceName.trim();
    const qty = Math.max(1, Math.round(newAllowanceQty || 1));
    if (!clean) {
      showToast("Enter a voucher/perk name.", "warning");
      return;
    }
    setTierAllowances((prev) => [...prev, { name: clean, quantity: qty }]);
    setNewAllowanceName("");
    setNewAllowanceQty(1);
  };

  const handleToggleApplicableService = (serviceId: string) => {
    setTierApplicableServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleSaveTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierDisplayName.trim()) {
      showToast("Display title is required.", "warning");
      return;
    }

    const benefits = tierBenefitsText
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean);

    const cleanPrice = roundCurrency(Math.max(0, Number(tierPrice) || 0));
    const cleanBonus = tierPackageType === "CREDITS" ? roundCurrency(Math.max(0, Number(tierBonusCredits) || 0)) : 0;
    const cleanTotalCredits =
      tierPackageType === "CREDITS"
        ? roundCurrency(Math.max(1, Number(tierTotalCredits) || cleanPrice + cleanBonus))
        : 0;
    const cleanSessions =
      tierPackageType === "SESSIONS" ? Math.max(1, Math.round(Number(tierSessionCount) || 1)) : undefined;

    const updatedTier: MembershipTier = {
      id: editingTierId || newId("tier"),
      name: tierName.trim() || tierDisplayName.trim().toUpperCase().replace(/\s+/g, "_"),
      displayName: tierDisplayName.trim(),
      packageType: tierPackageType,
      sessionCount: cleanSessions,
      applicableServiceIds: tierPackageType === "SESSIONS" ? tierApplicableServiceIds : undefined,
      price: cleanPrice,
      bonusCredits: cleanBonus,
      totalCredits: cleanTotalCredits,
      validityMonths: Math.max(1, Number(tierValidityMonths) || 12),
      hasQueuePriority: Boolean(tierHasQueuePriority),
      includedBenefits:
        benefits.length > 0
          ? benefits
          : [
              tierPackageType === "SESSIONS"
                ? `${cleanSessions}× Grooming Sessions`
                : "Club perks included",
            ],
      allowanceTemplates: tierPackageType === "CREDITS" ? tierAllowances : [],
      color: "border-primary shadow-sm",
    };

    saveMembershipTier(updatedTier);
    showToast(`Saved package "${updatedTier.displayName}".`, "success");
    setIsTierModalOpen(false);
    refreshData();
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "service") {
      deleteService(deleteTarget.id);
      showToast(`Deleted service "${deleteTarget.name}".`, "info");
    } else if (deleteTarget.type === "addon") {
      deleteAddon(deleteTarget.id);
      showToast(`Deleted add-on "${deleteTarget.name}".`, "info");
    } else if (deleteTarget.type === "promo") {
      deletePromoCode(deleteTarget.id);
      showToast(`Deleted promo code "${deleteTarget.name}".`, "info");
    } else if (deleteTarget.type === "tier") {
      deleteMembershipTier(deleteTarget.id);
      setIsTierModalOpen(false);
      showToast(`Removed membership tier "${deleteTarget.name}".`, "info");
    }
    setDeleteTarget(null);
    refreshData();
  };

  const todayStr = localDateStr();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Services, Pricing &amp; Promotions
          </h1>
          <p className="text-muted-foreground">
            Manage catalogue, size/coat/breed pricing matrix, add-ons, promo codes, and club packages
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "services" && (
            <Button onClick={handleOpenAddService} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
          )}
          {activeTab === "addons" && (
            <Button onClick={handleOpenAddAddon} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Add-on
            </Button>
          )}
          {activeTab === "promos" && (
            <Button onClick={handleOpenAddPromo} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Promo Code
            </Button>
          )}
          {activeTab === "memberships" && (
            <Button onClick={handleOpenAddTier} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Tier / Package
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-2xl h-auto">
          <TabsTrigger value="services" className="text-xs sm:text-sm py-2">
            Services ({services.length})
          </TabsTrigger>
          <TabsTrigger value="addons" className="text-xs sm:text-sm py-2">
            Add-ons ({addons.length})
          </TabsTrigger>
          <TabsTrigger value="promos" className="text-xs sm:text-sm py-2">
            Promo Codes ({promos.length})
          </TabsTrigger>
          <TabsTrigger value="memberships" className="text-xs sm:text-sm py-2">
            Memberships ({membershipTiers.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SERVICES & DYNAMIC PRICING */}
        <TabsContent value="services" className="space-y-6 pt-4">
          {/* Dynamic Pricing Matrix Interactive Calculator */}
          <Card className="border-primary/30 bg-primary/5 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                Live Dynamic Price Matrix Calculator
              </CardTitle>
              <CardDescription>
                Simulates exact pricing: Breed-specific override (if configured), or Base + Size Tier + Coat Surcharge.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
                <div className="space-y-1.5">
                  <Label className="text-xs">Service</Label>
                  <Select value={calcServiceId} onValueChange={setCalcServiceId}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({formatPrice(s.basePrice)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Pet Size</Label>
                  <Select
                    value={calcSize}
                    onValueChange={(val) => setCalcSize(val as MockPet["size"])}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SMALL">
                        Small (&lt; 5kg, +${getEffectiveSizeSurcharge(selectedCalcService, "SMALL")})
                      </SelectItem>
                      <SelectItem value="MEDIUM">
                        Medium (5-15kg, +${getEffectiveSizeSurcharge(selectedCalcService, "MEDIUM")})
                      </SelectItem>
                      <SelectItem value="LARGE">
                        Large (15-30kg, +${getEffectiveSizeSurcharge(selectedCalcService, "LARGE")})
                      </SelectItem>
                      <SelectItem value="EXTRA_LARGE">
                        Extra Large (&gt; 30kg, +${getEffectiveSizeSurcharge(selectedCalcService, "EXTRA_LARGE")})
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Coat Type</Label>
                  <Select
                    value={calcCoat}
                    onValueChange={(val) => setCalcCoat(val as MockPet["coatType"])}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COAT_TYPES.map((ct) => (
                        <SelectItem key={ct.value} value={ct.value}>
                          {ct.label} (+${getEffectiveCoatSurcharge(selectedCalcService, ct.value)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Breed (Optional Override Test)</Label>
                  <Input
                    className="bg-background"
                    placeholder="e.g. Bichon Frise"
                    value={calcBreed}
                    onChange={(e) => setCalcBreed(e.target.value)}
                  />
                </div>

                <div className="rounded-lg bg-background p-3 border text-center shadow-xs">
                  <span className="text-xs text-muted-foreground block font-medium">
                    Computed Rate
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(calculatedRate)}
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    {isFlatRate(selectedCalcService)
                      ? "Fixed flat rate"
                      : matchedCalcBreed
                      ? `Breed rule: ${matchedCalcBreed.breed}`
                      : `Est. ${selectedCalcService?.duration || 60} mins`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services List Grid */}
          {categories
            .filter((cat) => services.some((sv) => (sv.category || "Grooming") === cat))
            .map((cat) => (
              <div key={cat} className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {cat}
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {services
                    .filter((sv) => (sv.category || "Grooming") === cat)
                    .map((service) => {
                      const medAdd = getEffectiveSizeSurcharge(service, "MEDIUM");
                      const lrgAdd = getEffectiveSizeSurcharge(service, "LARGE");
                      const xlAdd = getEffectiveSizeSurcharge(service, "EXTRA_LARGE");
                      const coatAdds = COAT_TYPES.filter(
                        (ct) => getEffectiveCoatSurcharge(service, ct.value) > 0
                      );

                      return (
                        <Card
                          key={service.id}
                          className="shadow-sm flex flex-col justify-between hover:border-primary/50 transition-colors"
                        >
                          <div>
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <CardTitle className="text-base font-semibold">
                                    {service.name}
                                  </CardTitle>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>Est. {service.duration} mins</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-xl font-bold text-primary">
                                    {formatPrice(service.basePrice)}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground block">
                                    {isFlatRate(service) ? "Fixed price" : "Base (Small)"}
                                  </span>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-2">
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {service.description}
                              </p>
                              {isFlatRate(service) ? (
                                <div className="rounded-md bg-muted/40 p-2.5 text-[11px] border text-muted-foreground">
                                  Fixed price — same rate for every pet size, coat, and breed.
                                </div>
                              ) : (
                                <div className="rounded-md bg-muted/40 p-2.5 text-[11px] space-y-1 border">
                                  <span className="font-semibold text-foreground block text-xs">
                                    Size &amp; Coat Surcharges:
                                  </span>
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>Medium (5–15kg):</span>
                                    <span className="font-medium text-foreground">
                                      +{formatPrice(medAdd)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>Large (15–30kg):</span>
                                    <span className="font-medium text-foreground">
                                      +{formatPrice(lrgAdd)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>Extra Large (&gt;30kg):</span>
                                    <span className="font-medium text-foreground">
                                      +{formatPrice(xlAdd)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-2 text-muted-foreground pt-0.5 border-t border-dashed">
                                    <span>Coat Surcharges:</span>
                                    <span className="font-medium text-foreground text-right">
                                      {coatAdds.length === 0
                                        ? "None ($0)"
                                        : coatAdds
                                            .map(
                                              (ct) =>
                                                `${ct.value.charAt(0) + ct.value.slice(1).toLowerCase()} +$${getEffectiveCoatSurcharge(service, ct.value)}`
                                            )
                                            .join(", ")}
                                    </span>
                                  </div>
                                  {service.breedPrices && service.breedPrices.length > 0 && (
                                    <div className="pt-1.5 border-t border-dashed flex flex-wrap gap-1">
                                      {service.breedPrices.map((bp) => (
                                        <Badge
                                          key={bp.id}
                                          variant="secondary"
                                          className="text-[10px] py-0 px-1.5"
                                        >
                                          {bp.breed}: {formatPrice(bp.price)}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </div>

                          <div className="p-4 pt-0 border-t mt-3 flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 text-xs"
                              onClick={() => handleOpenEditService(service)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                setDeleteTarget({
                                  type: "service",
                                  id: service.id,
                                  name: service.name,
                                })
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                </div>
              </div>
            ))}
        </TabsContent>

        {/* TAB 2: ADD-ONS & EXTRA CHARGES */}
        <TabsContent value="addons" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {addons.map((addon) => (
              <Card
                key={addon.id}
                className="shadow-sm flex flex-col justify-between hover:border-primary/50 transition-colors"
              >
                <div>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold">{addon.name}</CardTitle>
                      <Badge
                        variant="secondary"
                        className="font-bold text-sm bg-primary/10 text-primary"
                      >
                        +{formatPrice(addon.price)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{addon.description}</p>
                  </CardContent>
                </div>

                <div className="p-4 pt-0 border-t mt-3 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => handleOpenEditAddon(addon)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    onClick={() =>
                      setDeleteTarget({
                        type: "addon",
                        id: addon.id,
                        name: addon.name,
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: PROMO CODES & DISCOUNTS */}
        <TabsContent value="promos" className="space-y-4 pt-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  Active Promotional &amp; Discount Codes
                </CardTitle>
                <CardDescription>
                  Validated live at POS checkout with expiry dates and redemption counters.
                </CardDescription>
              </div>
              <Button size="sm" onClick={handleOpenAddPromo} className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> New Promo
              </Button>
            </CardHeader>
            <CardContent>
              {promos.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No promo codes configured yet. Click &ldquo;Add Promo Code&rdquo; to create one.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {promos.map((promo) => {
                    const isExpired = Boolean(promo.validUntil && promo.validUntil < todayStr);
                    const limitReached = Boolean(
                      promo.maxUses && promo.maxUses > 0 && promo.currentUses >= promo.maxUses
                    );
                    return (
                      <div
                        key={promo.id}
                        className={`rounded-xl border p-4 flex flex-col justify-between gap-3 ${
                          !promo.isActive || isExpired ? "bg-muted/30 opacity-80" : "bg-card"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="font-mono text-sm px-2.5 py-0.5 tracking-wider">
                                {promo.code}
                              </Badge>
                              <Badge variant="outline" className="font-semibold text-xs">
                                {promo.discountType === "PERCENTAGE"
                                  ? `${promo.discountValue}% OFF`
                                  : `-${formatPrice(promo.discountValue)}`}
                              </Badge>
                            </div>
                            <Switch
                              checked={promo.isActive}
                              onCheckedChange={(checked) => handleTogglePromoActive(promo, checked)}
                              aria-label={`Toggle ${promo.code}`}
                            />
                          </div>

                          <p className="text-xs text-muted-foreground">
                            {promo.description || "No description"}
                          </p>

                          <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                            <Badge variant="secondary" className="text-[10px]">
                              Uses: {promo.currentUses}
                              {promo.maxUses ? ` / ${promo.maxUses}` : " (Unlimited)"}
                            </Badge>
                            {promo.validUntil && (
                              <Badge
                                variant={isExpired ? "destructive" : "outline"}
                                className="text-[10px]"
                              >
                                {isExpired
                                  ? `Expired (${promo.validUntil})`
                                  : `Valid until ${promo.validUntil}`}
                              </Badge>
                            )}
                            {limitReached && (
                              <Badge variant="destructive" className="text-[10px]">
                                Limit reached
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => handleOpenEditPromo(promo)}
                          >
                            <Edit className="h-3 w-3" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() =>
                              setDeleteTarget({
                                type: "promo",
                                id: promo.id,
                                name: promo.code,
                              })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: CLUB MEMBERSHIPS & PACKAGES */}
        <TabsContent value="memberships" className="space-y-4 pt-4">
          <div className="border rounded-xl bg-card p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between max-w-5xl mx-auto mb-6 gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Club Memberships &amp; Session Packages
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure prepaid credit tiers with bonus vouchers or multi-session grooming bundles.
                </p>
              </div>
              <Button
                size="sm"
                className="gap-1.5 text-xs font-semibold self-start sm:self-auto"
                onClick={handleOpenAddTier}
              >
                <Plus className="h-4 w-4" />
                Add Tier / Package
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(membershipTiers.length > 0 ? membershipTiers : MEMBERSHIP_TIERS).map((tier) => {
                const isSessionPkg = tier.packageType === "SESSIONS";
                const matchingServices =
                  isSessionPkg && tier.applicableServiceIds?.length
                    ? services
                        .filter((s) => tier.applicableServiceIds?.includes(s.id))
                        .map((s) => s.name)
                    : [];

                return (
                  <div
                    key={tier.id}
                    className={`rounded-2xl border-2 p-5 flex flex-col justify-between transition-all ${
                      tier.name === "VIP" || tier.name === "SVIP"
                        ? "border-primary shadow-md"
                        : "border-border"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-lg leading-tight">
                            {tier.displayName.replace(" Membership", "")}
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-[10px] mt-1 font-medium"
                          >
                            {isSessionPkg ? "Session Package" : "Prepaid Credits"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {tier.hasQueuePriority && (
                            <Badge variant="default" className="text-[10px] gap-1 py-0">
                              <Crown className="h-3 w-3" /> Priority
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenEditTier(tier)}
                            title="Configure Tier"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-3xl font-extrabold">
                            {formatPrice(tier.price)}
                          </span>
                          {!isSessionPkg && tier.bonusCredits > 0 && (
                            <span className="text-xs text-emerald-600 font-bold">
                              (+{formatPrice(tier.bonusCredits)} Bonus)
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                          {isSessionPkg
                            ? `${tier.sessionCount || 1} Sessions Included`
                            : `${formatPrice(tier.totalCredits)} Total Credits`}
                        </p>
                        {isSessionPkg && (
                          <p className="text-[11px] text-primary mt-0.5">
                            {matchingServices.length > 0
                              ? `Valid for: ${matchingServices.join(", ")}`
                              : "Valid for any service"}
                          </p>
                        )}
                      </div>

                      <div className="border-t pt-3 space-y-2">
                        <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase block">
                          Included Benefits
                        </span>
                        {(tier.includedBenefits || []).map((benefit, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-xs">
                            <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </div>
                        ))}
                        {tier.allowanceTemplates && tier.allowanceTemplates.length > 0 && (
                          <div className="pt-1.5 space-y-1">
                            {tier.allowanceTemplates.map((tpl, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-[10px] mr-1 gap-1"
                              >
                                <Ticket className="h-2.5 w-2.5" />
                                {tpl.quantity}× {tpl.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t flex items-center justify-between gap-2">
                      <Badge variant="outline" className="py-0.5 text-xs">
                        {tier.validityMonths} Month Validity
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 font-medium"
                        onClick={() => handleOpenEditTier(tier)}
                      >
                        <Edit className="h-3 w-3" />
                        Configure
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-6">
              * Prepaid credit tiers deduct balance at checkout; Session Packages auto-deduct 1 session per qualifying visit.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* SERVICE EDIT/ADD DIALOG */}
      <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingServiceId ? "Edit Service" : "Add New Service"}</DialogTitle>
            <DialogDescription>
              Configure base pricing, variable size/coat surcharges, and optional breed overrides.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveService} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="srvName">Service Name *</Label>
                <Input
                  id="srvName"
                  placeholder="e.g. Full Grooming"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={serviceCategory}
                  onValueChange={(val) => {
                    setServiceCategory(val);
                    if (!editingServiceId && val !== NEW_CATEGORY) {
                      setCoatSurcharges(defaultCoatSurchargesForCategory(val));
                      const lower = val.toLowerCase();
                      if (lower.includes("train") || lower.includes("daycare")) {
                        setServiceFlat(true);
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                    <SelectItem value={NEW_CATEGORY}>+ New category…</SelectItem>
                  </SelectContent>
                </Select>
                {serviceCategory === NEW_CATEGORY && (
                  <Input
                    placeholder="e.g. Training, Daycare, Boarding"
                    value={newCategoryText}
                    onChange={(e) => setNewCategoryText(e.target.value)}
                    autoFocus
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="srvPrice">
                  {serviceFlat ? "Fixed Price ($) *" : "Base Price (Small) ($) *"}
                </Label>
                <Input
                  id="srvPrice"
                  type="number"
                  min="0"
                  step="0.5"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="srvDuration">Duration (Mins) *</Label>
                <Input
                  id="srvDuration"
                  type="number"
                  min="5"
                  step="5"
                  value={serviceDuration}
                  onChange={(e) => setServiceDuration(parseInt(e.target.value, 10) || 30)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
              <div className="pr-4">
                <Label htmlFor="flatRateSwitch" className="text-sm font-medium cursor-pointer">
                  Fixed Flat Price
                </Label>
                <p className="text-xs text-muted-foreground">
                  Charge the same rate for every pet size, coat, and breed.
                </p>
              </div>
              <Switch
                id="flatRateSwitch"
                checked={serviceFlat}
                onCheckedChange={setServiceFlat}
              />
            </div>

            {!serviceFlat && (
              <div className="space-y-4 rounded-xl border p-3.5 bg-muted/20">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Size Surcharges ($ Added to Base)
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <Label className="text-[11px]">Small (&lt;5kg)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        className="h-8 text-xs bg-background"
                        value={sizeSurcharges.SMALL}
                        onChange={(e) =>
                          setSizeSurcharges((p) => ({
                            ...p,
                            SMALL: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Medium (5–15kg)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        className="h-8 text-xs bg-background"
                        value={sizeSurcharges.MEDIUM}
                        onChange={(e) =>
                          setSizeSurcharges((p) => ({
                            ...p,
                            MEDIUM: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Large (15–30kg)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        className="h-8 text-xs bg-background"
                        value={sizeSurcharges.LARGE}
                        onChange={(e) =>
                          setSizeSurcharges((p) => ({
                            ...p,
                            LARGE: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">XL (&gt;30kg)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        className="h-8 text-xs bg-background"
                        value={sizeSurcharges.EXTRA_LARGE}
                        onChange={(e) =>
                          setSizeSurcharges((p) => ({
                            ...p,
                            EXTRA_LARGE: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Coat Surcharges ($ Added to Base)
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {COAT_TYPES.map((ct) => (
                      <div key={ct.value}>
                        <Label className="text-[11px]">{ct.label}</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          className="h-8 text-xs bg-background"
                          value={coatSurcharges[ct.value]}
                          onChange={(e) =>
                            setCoatSurcharges((p) => ({
                              ...p,
                              [ct.value]: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 border-t pt-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Breed-Specific Price Overrides (Optional)
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Exact breed match overrides size &amp; coat calculations (e.g. Bichon Frise = $110).
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Breed e.g. Bichon Frise"
                      className="h-8 text-xs bg-background"
                      value={newBreedName}
                      onChange={(e) => setNewBreedName(e.target.value)}
                    />
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Price $"
                      className="h-8 w-24 text-xs bg-background"
                      value={newBreedPrice}
                      onChange={(e) => setNewBreedPrice(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs shrink-0"
                      onClick={handleAddBreedRule}
                    >
                      Add
                    </Button>
                  </div>
                  {breedPrices.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {breedPrices.map((bp) => (
                        <Badge
                          key={bp.id}
                          variant="secondary"
                          className="gap-1.5 text-xs py-0.5 pl-2 pr-1"
                        >
                          <span>
                            {bp.breed}: {formatPrice(bp.price)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setBreedPrices((prev) => prev.filter((item) => item.id !== bp.id))
                            }
                            className="hover:text-destructive"
                            aria-label={`Remove ${bp.breed} rule`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="srvDesc">Description</Label>
              <Textarea
                id="srvDesc"
                placeholder="What is included in this service..."
                value={serviceDesc}
                onChange={(e) => setServiceDesc(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button type="button" variant="ghost" onClick={() => setIsServiceModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2">
                <Check className="h-4 w-4" />
                {editingServiceId ? "Save Changes" : "Create Service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ADD-ON EDIT/ADD DIALOG */}
      <Dialog open={isAddonModalOpen} onOpenChange={setIsAddonModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAddonId ? "Edit Add-on" : "Add New Add-on"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAddon} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="adName">Add-on Name *</Label>
              <Input
                id="adName"
                placeholder="e.g. Ayurveda Herb Spa"
                value={addonName}
                onChange={(e) => setAddonName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adPrice">Price ($) *</Label>
              <Input
                id="adPrice"
                type="number"
                min="0"
                step="0.5"
                value={addonPrice}
                onChange={(e) => setAddonPrice(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adDesc">Description</Label>
              <Textarea
                id="adDesc"
                placeholder="Description of benefits..."
                value={addonDesc}
                onChange={(e) => setAddonDesc(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button type="button" variant="ghost" onClick={() => setIsAddonModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2">
                <Check className="h-4 w-4" />
                {editingAddonId ? "Save Changes" : "Create Add-on"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PROMO CODE EDIT/ADD DIALOG */}
      <Dialog open={isPromoModalOpen} onOpenChange={setIsPromoModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPromoId ? "Edit Promo Code" : "Create Promo Code"}</DialogTitle>
            <DialogDescription>
              Applied at POS checkout to calculate instant fixed or percentage discounts.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSavePromo} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pCode">Code *</Label>
                <Input
                  id="pCode"
                  placeholder="e.g. SUMMER15"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pType">Discount Type</Label>
                <Select
                  value={promoType}
                  onValueChange={(v) => setPromoType(v as "FIXED" | "PERCENTAGE")}
                >
                  <SelectTrigger id="pType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Fixed Amount ($)</SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pValue">
                  {promoType === "PERCENTAGE" ? "Percentage Off (%) *" : "Amount Off ($) *"}
                </Label>
                <div className="relative">
                  <Input
                    id="pValue"
                    type="number"
                    min="0.5"
                    max={promoType === "PERCENTAGE" ? 100 : undefined}
                    step="0.5"
                    value={promoValue}
                    onChange={(e) => setPromoValue(parseFloat(e.target.value) || 0)}
                    required
                  />
                  {promoType === "PERCENTAGE" && (
                    <Percent className="h-3.5 w-3.5 text-muted-foreground absolute right-3 top-3" />
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pMaxUses">Usage Limit (Optional)</Label>
                <Input
                  id="pMaxUses"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Unlimited"
                  value={promoMaxUses}
                  onChange={(e) => setPromoMaxUses(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pValidUntil">Valid Until (Optional)</Label>
              <Input
                id="pValidUntil"
                type="date"
                value={promoValidUntil}
                onChange={(e) => setPromoValidUntil(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pDesc">Description</Label>
              <Input
                id="pDesc"
                placeholder="e.g. Weekend wash promotion"
                value={promoDesc}
                onChange={(e) => setPromoDesc(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
              <Label htmlFor="promoActiveSwitch" className="text-sm font-medium cursor-pointer">
                Promo Code Active
              </Label>
              <Switch
                id="promoActiveSwitch"
                checked={promoActive}
                onCheckedChange={setPromoActive}
              />
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button type="button" variant="ghost" onClick={() => setIsPromoModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2">
                <Check className="h-4 w-4" />
                {editingPromoId ? "Save Promo Code" : "Create Promo Code"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MEMBERSHIP TIER EDIT/ADD DIALOG */}
      <Dialog open={isTierModalOpen} onOpenChange={setIsTierModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTierId ? `Configure ${tierDisplayName}` : "Add New Membership / Package"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveTier} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Package Structure</Label>
              <Select
                value={tierPackageType}
                onValueChange={(v) => setTierPackageType(v as "CREDITS" | "SESSIONS")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDITS">Prepaid Club Credits ($ + Bonus Vouchers)</SelectItem>
                  <SelectItem value="SESSIONS">Multi-Session Grooming Package (e.g. 5× Visits)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tName" className="text-xs font-semibold">
                  Tier Code / Key *
                </Label>
                <Input
                  id="tName"
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                  placeholder="e.g. VIP or FULL_5X"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tDispName" className="text-xs font-semibold">
                  Display Title *
                </Label>
                <Input
                  id="tDispName"
                  value={tierDisplayName}
                  onChange={(e) => setTierDisplayName(e.target.value)}
                  placeholder="e.g. Gold Membership"
                  required
                />
              </div>
            </div>

            {tierPackageType === "CREDITS" ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="tPrice" className="text-xs font-semibold">
                    Price ($) *
                  </Label>
                  <Input
                    id="tPrice"
                    type="number"
                    min="0"
                    step="1"
                    value={tierPrice}
                    onChange={(e) => {
                      const p = parseFloat(e.target.value) || 0;
                      setTierPrice(p);
                      setTierTotalCredits(p + (Number(tierBonusCredits) || 0));
                    }}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tBonus" className="text-xs font-semibold">
                    Bonus ($)
                  </Label>
                  <Input
                    id="tBonus"
                    type="number"
                    min="0"
                    step="1"
                    value={tierBonusCredits}
                    onChange={(e) => {
                      const b = parseFloat(e.target.value) || 0;
                      setTierBonusCredits(b);
                      setTierTotalCredits((Number(tierPrice) || 0) + b);
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tTotal" className="text-xs font-semibold">
                    Total Credits
                  </Label>
                  <Input
                    id="tTotal"
                    type="number"
                    min="1"
                    step="1"
                    value={tierTotalCredits}
                    onChange={(e) => setTierTotalCredits(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="tPkgPrice" className="text-xs font-semibold">
                      Package Price ($) *
                    </Label>
                    <Input
                      id="tPkgPrice"
                      type="number"
                      min="0"
                      step="1"
                      value={tierPrice}
                      onChange={(e) => setTierPrice(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tSessions" className="text-xs font-semibold">
                      Number of Sessions *
                    </Label>
                    <Input
                      id="tSessions"
                      type="number"
                      min="1"
                      step="1"
                      value={tierSessionCount}
                      onChange={(e) => setTierSessionCount(parseInt(e.target.value, 10) || 1)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 rounded-lg border p-3 bg-muted/20">
                  <Label className="text-xs font-semibold">
                    Qualifying Services (Leave all unchecked = valid for any service)
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 max-h-32 overflow-y-auto">
                    {services.map((srv) => (
                      <label key={srv.id} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tierApplicableServiceIds.includes(srv.id)}
                          onChange={() => handleToggleApplicableService(srv.id)}
                        />
                        <span className="truncate">{srv.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tValidity" className="text-xs font-semibold">
                  Validity (Months)
                </Label>
                <Input
                  id="tValidity"
                  type="number"
                  min="1"
                  max="48"
                  value={tierValidityMonths}
                  onChange={(e) => setTierValidityMonths(parseInt(e.target.value, 10) || 12)}
                  required
                />
              </div>

              <div className="space-y-1.5 flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2 font-medium text-xs select-none">
                  <input
                    type="checkbox"
                    checked={tierHasQueuePriority}
                    onChange={(e) => setTierHasQueuePriority(e.target.checked)}
                    className="rounded border-input h-4 w-4 text-primary"
                  />
                  <span>VIP Queue Priority</span>
                </label>
              </div>
            </div>

            {tierPackageType === "CREDITS" && (
              <div className="space-y-2 rounded-lg border p-3 bg-muted/20">
                <Label className="text-xs font-semibold">
                  Complimentary Add-on Vouchers Granted on Purchase
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Spa Therapy or Medicated Treatment"
                    className="h-8 text-xs bg-background"
                    value={newAllowanceName}
                    onChange={(e) => setNewAllowanceName(e.target.value)}
                  />
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    className="h-8 w-16 text-xs bg-background"
                    value={newAllowanceQty}
                    onChange={(e) => setNewAllowanceQty(parseInt(e.target.value, 10) || 1)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-8 text-xs shrink-0"
                    onClick={handleAddAllowanceTemplate}
                  >
                    Add
                  </Button>
                </div>
                {tierAllowances.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tierAllowances.map((tpl, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1.5 text-xs pr-1">
                        <span>
                          {tpl.quantity}× {tpl.name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setTierAllowances((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="hover:text-destructive"
                          aria-label="Remove voucher template"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="tBenefits" className="text-xs font-semibold">
                  Display Benefits Summary
                </Label>
                <span className="text-[10px] text-muted-foreground">1 perk per line</span>
              </div>
              <Textarea
                id="tBenefits"
                rows={3}
                value={tierBenefitsText}
                onChange={(e) => setTierBenefitsText(e.target.value)}
                placeholder="4× Spa Therapy Add-on&#10;2× Nose & Paw Defense&#10;+ Queue Priority"
              />
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              {editingTierId && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 mr-auto text-xs"
                  onClick={() =>
                    setDeleteTarget({
                      type: "tier",
                      id: editingTierId,
                      name: tierDisplayName,
                    })
                  }
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete Tier
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setIsTierModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Package Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* REUSABLE DELETE CONFIRMATION */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &ldquo;{deleteTarget?.name}&rdquo;? Existing past invoices and appointments will keep their historical snapshot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
