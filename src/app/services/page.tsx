"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Calculator,
  Plus,
  Clock,
  DollarSign,
  Crown,
  CheckCircle,
  Edit,
  Trash2,
  Check,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MEMBERSHIP_TIERS,
  getMembershipTiers,
  saveMembershipTier,
  deleteMembershipTier,
  MembershipTier,
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
  MockService,
  MockAddon,
} from "@/lib/mock-data";

export default function ServicesPage() {
  const [services, setServices] = useState<MockService[]>([]);
  const [addons, setAddons] = useState<MockAddon[]>([]);
  const [membershipTiers, setMembershipTiers] = useState<MembershipTier[]>([]);
  const [activeTab, setActiveTab] = useState("services");

  // Dynamic pricing preview state
  const [calcServiceId, setCalcServiceId] = useState("");
  const [calcSize, setCalcSize] = useState<"SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE">("SMALL");
  const [calcCoat, setCalcCoat] = useState("CURLY");

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
  const [categories, setCategories] = useState<string[]>(["Grooming"]);
  const NEW_CATEGORY = "__new__";

  // Add-on Edit / Add Dialog State
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [addonName, setAddonName] = useState("");
  const [addonPrice, setAddonPrice] = useState<number>(20);
  const [addonDesc, setAddonDesc] = useState("");

  // Membership Tier Edit / Add Dialog State
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [tierName, setTierName] = useState("VIP");
  const [tierDisplayName, setTierDisplayName] = useState("VIP Membership");
  const [tierPrice, setTierPrice] = useState<number>(1400);
  const [tierBonusCredits, setTierBonusCredits] = useState<number>(100);
  const [tierTotalCredits, setTierTotalCredits] = useState<number>(1500);
  const [tierValidityMonths, setTierValidityMonths] = useState<number>(12);
  const [tierHasQueuePriority, setTierHasQueuePriority] = useState<boolean>(true);
  const [tierBenefitsText, setTierBenefitsText] = useState<string>("");

  const refreshData = () => {
    const s = getServices();
    const a = getAddons();
    const t = getMembershipTiers();
    setServices(s);
    setAddons(a);
    setMembershipTiers(t);
    setCategories(getServiceCategories());
    if (!calcServiceId && s.length > 0) {
      setCalcServiceId(s[0].id);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const selectedCalcService = services.find((s) => s.id === calcServiceId) || services[0];
  const calculatedRate = calcServiceId ? calculateServicePrice(calcServiceId, calcSize, calcCoat) : 0;

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
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (service: MockService) => {
    setEditingServiceId(service.id);
    setServiceName(service.name);
    setServicePrice(service.basePrice);
    setServiceDuration(service.duration);
    setServiceDesc(service.description);
    setServiceCategory(service.category || "Grooming");
    setNewCategoryText("");
    setServiceFlat(isFlatRate(service));
    setIsServiceModalOpen(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) return;

    const category =
      serviceCategory === NEW_CATEGORY ? newCategoryText.trim() : serviceCategory;
    if (!category) {
      alert("Please type a name for the new category.");
      return;
    }

    const record: MockService = {
      id: editingServiceId || `srv-${Date.now()}`,
      name: serviceName.trim(),
      category,
      flatRate: serviceFlat,
      basePrice: Number(servicePrice) || 0,
      price: Number(servicePrice) || 0,
      duration: Number(serviceDuration) || 30,
      description: serviceDesc.trim(),
    };

    if (editingServiceId) saveService(record);
    else addService(record);

    refreshData();
    setIsServiceModalOpen(false);
  };

  const handleDeleteService = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete service "${name}"?`)) {
      deleteService(id);
      refreshData();
    }
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
    if (!addonName.trim()) return;

    if (editingAddonId) {
      const updated: MockAddon = {
        id: editingAddonId,
        name: addonName.trim(),
        price: Number(addonPrice) || 0,
        description: addonDesc.trim(),
      };
      saveAddon(updated);
    } else {
      const newAddon: MockAddon = {
        id: `addon-${Date.now()}`,
        name: addonName.trim(),
        price: Number(addonPrice) || 0,
        description: addonDesc.trim(),
      };
      addAddon(newAddon);
    }

    refreshData();
    setIsAddonModalOpen(false);
  };

  const handleDeleteAddon = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete add-on "${name}"?`)) {
      deleteAddon(id);
      refreshData();
    }
  };

  // --- MEMBERSHIP TIER ACTIONS ---
  const handleOpenAddTier = () => {
    setEditingTierId(null);
    setTierName("NEW_TIER");
    setTierDisplayName("Custom Membership Tier");
    setTierPrice(500);
    setTierBonusCredits(50);
    setTierTotalCredits(550);
    setTierValidityMonths(6);
    setTierHasQueuePriority(false);
    setTierBenefitsText("1× Free Spa Treatment\n6 Month Validity");
    setIsTierModalOpen(true);
  };

  const handleOpenEditTier = (tier: MembershipTier) => {
    setEditingTierId(tier.id);
    setTierName(tier.name);
    setTierDisplayName(tier.displayName);
    setTierPrice(tier.price);
    setTierBonusCredits(tier.bonusCredits);
    setTierTotalCredits(tier.totalCredits);
    setTierValidityMonths(tier.validityMonths);
    setTierHasQueuePriority(tier.hasQueuePriority);
    setTierBenefitsText((tier.includedBenefits || []).join("\n"));
    setIsTierModalOpen(true);
  };

  const handleSaveTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierDisplayName.trim()) return;

    const benefits = tierBenefitsText
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean);

    const updatedTier: MembershipTier = {
      id: editingTierId || `tier_${Date.now()}`,
      name: tierName.trim() || tierDisplayName.trim().toUpperCase().replace(/\s+/g, "_"),
      displayName: tierDisplayName.trim(),
      price: Number(tierPrice) || 0,
      bonusCredits: Number(tierBonusCredits) || 0,
      totalCredits: Number(tierTotalCredits) || (Number(tierPrice) + Number(tierBonusCredits)),
      validityMonths: Number(tierValidityMonths) || 12,
      hasQueuePriority: Boolean(tierHasQueuePriority),
      includedBenefits: benefits.length > 0 ? benefits : ["Club perks included"],
      color: "border-primary shadow-sm",
    };

    saveMembershipTier(updatedTier);
    setIsTierModalOpen(false);
    refreshData();
  };

  const handleDeleteTier = (tierId: string) => {
    if (confirm("Are you sure you want to remove this membership tier from the catalogue?")) {
      deleteMembershipTier(tierId);
      setIsTierModalOpen(false);
      refreshData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Services & Pricing
          </h1>
          <p className="text-muted-foreground">
            Manage catalogue, dynamic price matrix, add-ons, and club memberships
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
          {activeTab === "memberships" && (
            <Button onClick={handleOpenAddTier} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Tier
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="services">Services ({services.length})</TabsTrigger>
          <TabsTrigger value="addons">Add-ons ({addons.length})</TabsTrigger>
          <TabsTrigger value="memberships">Memberships</TabsTrigger>
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
                Base service price + Size tier (+20 Med, +45 Lrg, +75 XL) + Coat modifier (+10 Curly/Double).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-4 items-end">
                <div className="space-y-1.5">
                  <Label className="text-xs">Service</Label>
                  <Select value={calcServiceId} onValueChange={setCalcServiceId}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} (Base ${s.basePrice})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Pet Size</Label>
                  <Select
                    value={calcSize}
                    onValueChange={(val) => setCalcSize(val as any)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SMALL">Small (&lt; 5kg, +$0)</SelectItem>
                      <SelectItem value="MEDIUM">Medium (5-15kg, +$20)</SelectItem>
                      <SelectItem value="LARGE">Large (15-30kg, +$45)</SelectItem>
                      <SelectItem value="EXTRA_LARGE">Extra Large (&gt; 30kg, +$75)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Coat Type</Label>
                  <Select value={calcCoat} onValueChange={setCalcCoat}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SHORT">Short / Smooth (+$0)</SelectItem>
                      <SelectItem value="MEDIUM">Medium (+$0)</SelectItem>
                      <SelectItem value="LONG">Long / Silky (+$0)</SelectItem>
                      <SelectItem value="DOUBLE">Double Coat (+ $10)</SelectItem>
                      <SelectItem value="CURLY">Curly / Wool (+ $10)</SelectItem>
                      <SelectItem value="WIRE">Wire / Coarse (+$0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg bg-background p-3 border text-center shadow-xs">
                  <span className="text-xs text-muted-foreground block font-medium">Computed Rate</span>
                  <span className="text-2xl font-bold text-primary">${calculatedRate}</span>
                  <span className="text-[11px] text-muted-foreground block">
                    Duration: ~{selectedCalcService?.duration || 60} mins
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
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{cat}</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.filter((sv) => (sv.category || "Grooming") === cat).map((service) => (
              <Card key={service.id} className="shadow-sm flex flex-col justify-between hover:border-primary/50 transition-colors">
                <div>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base font-semibold">{service.name}</CardTitle>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Est. {service.duration} mins</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-primary">${service.basePrice}</span>
                        <span className="text-[10px] text-muted-foreground block">
                          {isFlatRate(service) ? "Fixed price" : "Base (Small)"}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2">
                    <p className="text-xs text-muted-foreground line-clamp-2">{service.description}</p>
                    {isFlatRate(service) ? (
                    <div className="rounded-md bg-muted/40 p-2.5 text-[11px] border text-muted-foreground">
                      Fixed price — same for every pet size and coat.
                    </div>
                    ) : (
                    <div className="rounded-md bg-muted/40 p-2.5 text-[11px] space-y-1 border">
                      <span className="font-semibold text-foreground block text-xs">Size & Coat Additions:</span>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Medium (+5-15kg):</span> <span className="font-medium text-foreground">+$20</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Large (+15-30kg):</span> <span className="font-medium text-foreground">+$45</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Extra Large (&gt;30kg):</span> <span className="font-medium text-foreground">+$75</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Curly / Double Coat:</span> <span className="font-medium text-foreground">+$10</span>
                      </div>
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
                    onClick={() => handleDeleteService(service.id, service.name)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          </div>
          ))}
        </TabsContent>

        {/* TAB 2: ADD-ONS & EXTRA CHARGES */}
        <TabsContent value="addons" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {addons.map((addon) => (
              <Card key={addon.id} className="shadow-sm flex flex-col justify-between hover:border-primary/50 transition-colors">
                <div>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold">{addon.name}</CardTitle>
                      <Badge variant="secondary" className="font-bold text-sm bg-primary/10 text-primary">
                        +${addon.price}
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
                    onClick={() => handleDeleteAddon(addon.id, addon.name)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: CLUB MEMBERSHIPS */}
        <TabsContent value="memberships" className="space-y-4 pt-4">
          <div className="border rounded-xl bg-card p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between max-w-5xl mx-auto mb-6 gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Club Memberships</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Configurable prepaid credit packages with bonus credits and included perks. Synchronized in database.
                </p>
              </div>
              <Button size="sm" className="gap-1.5 text-xs font-semibold self-start sm:self-auto" onClick={handleOpenAddTier}>
                <Plus className="h-4 w-4" />
                Add New Tier
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(membershipTiers.length > 0 ? membershipTiers : MEMBERSHIP_TIERS).map((tier) => (
                <div
                  key={tier.id}
                  className={`rounded-2xl border-2 p-5 flex flex-col justify-between transition-all ${
                    tier.name === "VIP" || tier.name === "SVIP"
                      ? "border-primary shadow-md"
                      : "border-border"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">{tier.displayName.replace(" Membership", "")}</h3>
                      <div className="flex items-center gap-1">
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
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold">${tier.price}</span>
                        <span className="text-xs text-emerald-600 font-bold">
                          (+${tier.bonusCredits} Bonus)
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                        {tier.totalCredits} Total Credits
                      </p>
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
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-6">
              * Credit values estimated for grooming sessions; add-on counters deduct zero credits upon redemption.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* SERVICE EDIT/ADD DIALOG */}
      <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingServiceId ? "Edit Service" : "Add New Service"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveService} className="space-y-4 pt-2">
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
              <Select value={serviceCategory} onValueChange={setServiceCategory}>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="srvPrice">{serviceFlat ? "Price ($) *" : "Base Price ($) *"}</Label>
                <Input
                  id="srvPrice"
                  type="number"
                  min="0"
                  step="1"
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
                  min="10"
                  step="5"
                  value={serviceDuration}
                  onChange={(e) => setServiceDuration(parseInt(e.target.value) || 30)}
                  required
                />
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={serviceFlat}
                onChange={(e) => setServiceFlat(e.target.checked)}
              />
              <span>
                Fixed price
                <span className="block text-xs text-muted-foreground">
                  Charge exactly this price for every pet. Untick for grooming-style pricing that adds
                  size and coat surcharges.
                </span>
              </span>
            </label>

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
                step="1"
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

      {/* MEMBERSHIP TIER EDIT/ADD DIALOG */}
      <Dialog open={isTierModalOpen} onOpenChange={setIsTierModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTierId ? `Configure ${tierDisplayName}` : "Add New Membership Tier"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveTier} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tName" className="text-xs font-semibold">Tier Code / Name *</Label>
                <Input
                  id="tName"
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                  placeholder="e.g. VIP or GOLD"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tDispName" className="text-xs font-semibold">Display Title *</Label>
                <Input
                  id="tDispName"
                  value={tierDisplayName}
                  onChange={(e) => setTierDisplayName(e.target.value)}
                  placeholder="e.g. Gold Membership"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tPrice" className="text-xs font-semibold">Price ($) *</Label>
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
                <Label htmlFor="tBonus" className="text-xs font-semibold">Bonus ($)</Label>
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
                <Label htmlFor="tTotal" className="text-xs font-semibold">Total Credits</Label>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tValidity" className="text-xs font-semibold">Validity (Months)</Label>
                <Input
                  id="tValidity"
                  type="number"
                  min="1"
                  max="48"
                  value={tierValidityMonths}
                  onChange={(e) => setTierValidityMonths(parseInt(e.target.value) || 12)}
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="tBenefits" className="text-xs font-semibold">Included Perks & Benefits</Label>
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
                  onClick={() => handleDeleteTier(editingTierId)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete Tier
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setIsTierModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Tier Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
