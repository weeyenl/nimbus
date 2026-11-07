"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  PawPrint,
  Plus,
  Minus,
  Calendar,
  AlertTriangle,
  Syringe,
  Crown,
  CreditCard,
  CheckCircle,
  Sparkles,
  SlidersHorizontal,
  DollarSign,
  Check,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getInitials } from "@/lib/utils";
import {
  getCustomers,
  getAppointments,
  getCustomerMembership,
  purchaseMembership,
  updateCustomerMembership,
  setCustomerMembership,
  localDateStr,
  adjustCustomerMembershipCredits,
  deductPackageAddonAllowance,
  MEMBERSHIP_TIERS,
  MockCustomer,
  MockAppointment,
  CustomerMembership,
} from "@/lib/mock-data";

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<MockCustomer | null>(null);
  const [appointments, setAppointments] = useState<MockAppointment[]>([]);
  const [membership, setMembership] = useState<CustomerMembership | undefined>();

  // Modals
  const [isBuyMembershipOpen, setIsBuyMembershipOpen] = useState(false);
  const [isAdjustBalanceOpen, setIsAdjustBalanceOpen] = useState(false);

  // Custom membership creation form
  const [customTierName, setCustomTierName] = useState("Custom Credit Package");
  const [customCredits, setCustomCredits] = useState<number>(300);
  const [customValidityMonths, setCustomValidityMonths] = useState<number>(6);

  // Adjust Balance modal form state
  const [adjustMode, setAdjustMode] = useState<"ADD" | "SET" | "DEDUCT">("ADD");
  const [adjustAmount, setAdjustAmount] = useState<number>(100);
  const [exactBalance, setExactBalance] = useState<number>(0);
  const [editTotalCredits, setEditTotalCredits] = useState<number>(0);
  const [editExpiryDate, setEditExpiryDate] = useState<string>("");
  const [adjustmentNote, setAdjustmentNote] = useState<string>("");
  const [editAllowances, setEditAllowances] = useState<
    { id: string; name: string; total: number; remaining: number }[]
  >([]);

  const [notFound, setNotFound] = useState(false);

  const loadData = () => {
    const custs = getCustomers();
    // Never fall back to a different customer: Add Pet / Book / Adjust Balance would hit the wrong person
    const found = custs.find((c) => c.id === params.id);
    if (!found) {
      setCustomer(null);
      setNotFound(true);
      return;
    }
    setNotFound(false);
    setCustomer(found);

    const apts = getAppointments().filter((a) => a.customerId === found.id);
    setAppointments(apts);

    const mem = getCustomerMembership(found.id);
    setMembership(mem);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (notFound) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="font-semibold">Customer not found</p>
        <Button asChild variant="outline">
          <Link href="/customers">Back to customers</Link>
        </Button>
      </div>
    );
  }
  if (!customer) return null;

  function handleBuyTier(tierName: "BASIC" | "STANDARD" | "VIP" | "SVIP") {
    const newMem = purchaseMembership(customer!.id, tierName);
    setMembership(newMem);
    setIsBuyMembershipOpen(false);
  }

  function handleCreateCustomPackage(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;

    const now = new Date();
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + customValidityMonths);

    const newMem: CustomerMembership = {
      id: `mem_${Date.now()}`,
      customerId: customer.id,
      tierName: "BASIC",
      displayName: customTierName.trim() || "Store Credit Package",
      purchaseDate: localDateStr(now),
      expiryDate: localDateStr(expiry),
      remainingCredits: Number(customCredits) || 0,
      totalCredits: Number(customCredits) || 0,
      hasQueuePriority: false,
      bonusAllowances: [],
    };

    setCustomerMembership(newMem);
    setMembership(newMem);
    setIsBuyMembershipOpen(false);
  }

  function openAdjustModal() {
    if (!membership) return;
    setAdjustMode("ADD");
    setAdjustAmount(100);
    setExactBalance(membership.remainingCredits);
    setEditTotalCredits(membership.totalCredits);
    setEditExpiryDate(membership.expiryDate || "");
    setAdjustmentNote("");
    setEditAllowances(membership.bonusAllowances ? [...membership.bonusAllowances] : []);
    setIsAdjustBalanceOpen(true);
  }

  function handleSaveAdjustBalance(e: React.FormEvent) {
    e.preventDefault();
    if (!membership || !customer) return;

    let computedRemaining = membership.remainingCredits;
    let computedTotal = editTotalCredits || membership.totalCredits;

    if (adjustMode === "ADD") {
      computedRemaining = membership.remainingCredits + Number(adjustAmount);
      // Auto expand total if remaining exceeds current total
      if (computedRemaining > computedTotal) {
        computedTotal = computedRemaining;
      }
    } else if (adjustMode === "DEDUCT") {
      computedRemaining = Math.max(0, membership.remainingCredits - Number(adjustAmount));
    } else if (adjustMode === "SET") {
      computedRemaining = Math.max(0, Number(exactBalance));
      if (computedRemaining > computedTotal) {
        computedTotal = computedRemaining;
      }
    }

    const updated = updateCustomerMembership(customer.id, {
      remainingCredits: computedRemaining,
      totalCredits: computedTotal,
      expiryDate: editExpiryDate || membership.expiryDate,
      bonusAllowances: editAllowances,
    });

    if (updated) {
      setMembership(updated);
    }
    setIsAdjustBalanceOpen(false);
  }

  const handleAllowanceChange = (idx: number, delta: number) => {
    setEditAllowances((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const newRem = Math.max(0, item.remaining + delta);
        return {
          ...item,
          remaining: newRem,
          total: Math.max(item.total, newRem),
        };
      })
    );
  };

  const handleRedeemAllowance = (allowanceId: string, allowanceName: string) => {
    if (!customer) return;
    if (confirm(`Redeem 1 voucher for "${allowanceName}" for ${customer.name}?`)) {
      const updated = deductPackageAddonAllowance(customer.id, allowanceId);
      if (updated) {
        setMembership({ ...updated });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
              {membership && (
                <Badge variant="default" className="text-xs gap-1 py-0.5">
                  <Crown className="h-3 w-3 text-amber-400" /> {membership.displayName}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">Customer Profile & Membership</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {membership && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-primary/40 text-primary hover:bg-primary/5"
              onClick={openAdjustModal}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Adjust Balance ($)
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setIsBuyMembershipOpen(true)}
          >
            <Crown className="h-4 w-4 text-amber-500" />
            {membership ? "Change / Upgrade Tier" : "Assign Club Package"}
          </Button>
        </div>
      </div>

      {/* Contact Info & Membership Summary Strip */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Contact Info */}
        <Card className="shadow-sm">
          <CardContent className="flex flex-col justify-center space-y-2 p-4">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{customer.address}</span>
              </div>
            )}
            {customer.referralSource && (
              <div className="pt-1">
                <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Source: {customer.referralSource}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Membership Details Card */}
        <Card className={`shadow-sm ${membership ? "border-primary/40 bg-primary/5" : "bg-card"}`}>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            {membership ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-base text-primary">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <span>{membership.displayName}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Exp: {membership.expiryDate}
                  </Badge>
                </div>

                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Remaining Package Balance:</span>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-foreground">
                        ${membership.remainingCredits}
                      </span>
                      <span className="text-xs text-muted-foreground font-normal"> / ${membership.totalCredits} credits</span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          membership.totalCredits > 0
                            ? (membership.remainingCredits / membership.totalCredits) * 100
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Quick Adjust Button directly on Card */}
                <div className="flex items-center justify-between pt-1">
                  <Button
                    size="sm"
                    variant="default"
                    className="h-7 text-xs gap-1.5 font-semibold"
                    onClick={openAdjustModal}
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    Adjust Package Balance
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setIsBuyMembershipOpen(true)}
                  >
                    Upgrade Tier
                  </Button>
                </div>

                {membership.bonusAllowances && membership.bonusAllowances.length > 0 && (
                  <div className="border-t pt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Included Add-on Allowances
                      </span>
                      <span className="text-[10px] text-muted-foreground">Click &quot;Redeem 1&quot; to deduct</span>
                    </div>
                    {membership.bonusAllowances.map((allowance) => (
                      <div
                        key={allowance.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border text-xs"
                      >
                        <div className="pr-2">
                          <span className="font-semibold block">{allowance.name}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {allowance.remaining} of {allowance.total} remaining
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant={allowance.remaining > 0 ? "secondary" : "ghost"}
                          className="h-7 text-xs gap-1 font-semibold shrink-0"
                          disabled={allowance.remaining <= 0}
                          onClick={() => handleRedeemAllowance(allowance.id, allowance.name)}
                        >
                          <Sparkles className="h-3 w-3 text-primary" />
                          {allowance.remaining > 0 ? "Redeem 1" : "Used Up"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <Crown className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-semibold">No Active Club Membership</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Prepay credits and unlock free Spa & Priority perks.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 text-xs gap-1.5"
                  onClick={() => setIsBuyMembershipOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Assign Package or Credits
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pets" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="pets" className="flex-1 sm:flex-none">
            <PawPrint className="mr-2 h-4 w-4" />
            Registered Pets ({customer.pets.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 sm:flex-none">
            <Calendar className="mr-2 h-4 w-4" />
            Appointments ({appointments.length})
          </TabsTrigger>
        </TabsList>

        {/* Pets Tab */}
        <TabsContent value="pets" className="space-y-4 pt-2">
          <div className="flex justify-end">
            <Button asChild size="sm">
              <Link href={`/customers/${customer.id}/pets/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Pet
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {customer.pets.map((pet) => (
              <Card key={pet.id} className="hover:border-primary/50 transition-colors shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(pet.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{pet.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {pet.breed} · {pet.age} yrs · {pet.size}
                        </p>
                      </div>
                    </div>
                    {pet.warnings.length > 0 && (
                      <Badge variant="warning" className="flex items-center gap-1 text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        {pet.warnings.length} alert{pet.warnings.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Weight: </span>
                      <span className="font-medium">{pet.weight} kg</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Coat: </span>
                      <span className="font-medium">{pet.coatType}</span>
                    </div>
                    {pet.vaccinationExpiry && (
                      <div className="col-span-2 flex items-center gap-1 text-muted-foreground">
                        <Syringe className="h-3 w-3 text-primary" />
                        <span>Vaccine valid until: {pet.vaccinationExpiry}</span>
                      </div>
                    )}
                  </div>

                  {pet.warnings.length > 0 && (
                    <div className="rounded-md bg-warning/10 p-2 text-xs text-warning-foreground border border-warning/20">
                      <span className="font-semibold block mb-1">Permanent Alerts:</span>
                      <ul className="list-disc list-inside space-y-0.5">
                        {pet.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/appointments/new?customerId=${customer.id}&petId=${pet.id}`}>
                        Book
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/pets/${pet.id}`}>View Pet</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-3 pt-2">
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg bg-card p-4">
              No appointments on record yet for this customer.
            </div>
          ) : (
            appointments.map((apt) => (
              <Link key={apt.id} href={`/appointments/${apt.id}`}>
                <Card className="hover:bg-muted/40 transition-colors shadow-sm">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-sm">
                        {apt.petName} — {apt.serviceName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {apt.dateStr} at {apt.startTime} · Groomer: {apt.groomerName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {apt.isPaid && (
                        <Badge variant="success" className="text-xs">
                          Paid
                        </Badge>
                      )}
                      <Badge variant="secondary">{apt.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* ADJUST MEMBERSHIP PACKAGE BALANCE MODAL */}
      <Dialog open={isAdjustBalanceOpen} onOpenChange={setIsAdjustBalanceOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Adjust Package Balance & Credits
            </DialogTitle>
            <DialogDescription>
              Modify remaining grooming credits, add top-ups, extend validity, or manage voucher allowances for {customer.name}.
            </DialogDescription>
          </DialogHeader>

          {membership && (
            <form onSubmit={handleSaveAdjustBalance} className="space-y-4 pt-2">
              {/* Current Status Box */}
              <div className="rounded-lg border bg-muted/40 p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Package Tier</span>
                  <span className="font-bold text-sm text-primary flex items-center gap-1">
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                    {membership.displayName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block font-medium">Current Balance</span>
                  <span className="text-lg font-extrabold text-foreground">
                    ${membership.remainingCredits}
                    <span className="text-xs font-normal text-muted-foreground"> / ${membership.totalCredits}</span>
                  </span>
                </div>
              </div>

              {/* Adjustment Mode Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Select Adjustment Action</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={adjustMode === "ADD" ? "default" : "outline"}
                    className="text-xs h-9"
                    onClick={() => setAdjustMode("ADD")}
                  >
                    + Add / Top Up
                  </Button>
                  <Button
                    type="button"
                    variant={adjustMode === "SET" ? "default" : "outline"}
                    className="text-xs h-9"
                    onClick={() => setAdjustMode("SET")}
                  >
                    Set Exact Balance
                  </Button>
                  <Button
                    type="button"
                    variant={adjustMode === "DEDUCT" ? "default" : "outline"}
                    className="text-xs h-9"
                    onClick={() => setAdjustMode("DEDUCT")}
                  >
                    - Deduct
                  </Button>
                </div>
              </div>

              {/* Mode Specific Inputs */}
              {adjustMode === "ADD" && (
                <div className="space-y-3 rounded-lg border p-3 bg-card">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="topUpAmt" className="text-xs font-medium">
                      Top-Up Amount ($)
                    </Label>
                    <span className="text-xs font-bold text-emerald-600">
                      New Balance: ${membership.remainingCredits + Number(adjustAmount || 0)}
                    </span>
                  </div>
                  <Input
                    id="topUpAmt"
                    type="number"
                    min="1"
                    step="1"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(parseFloat(e.target.value) || 0)}
                    required
                  />
                  {/* Quick Preset Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[50, 100, 200, 500].map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs"
                        onClick={() => setAdjustAmount(preset)}
                      >
                        +${preset}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {adjustMode === "DEDUCT" && (
                <div className="space-y-3 rounded-lg border p-3 bg-card">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="deductAmt" className="text-xs font-medium">
                      Deduct Amount ($)
                    </Label>
                    <span className="text-xs font-bold text-amber-600">
                      New Balance: ${Math.max(0, membership.remainingCredits - Number(adjustAmount || 0))}
                    </span>
                  </div>
                  <Input
                    id="deductAmt"
                    type="number"
                    min="1"
                    max={membership.remainingCredits}
                    step="1"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(parseFloat(e.target.value) || 0)}
                    required
                  />
                  {/* Quick Preset Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[20, 50, 85, 100].map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs"
                        onClick={() => setAdjustAmount(preset)}
                      >
                        -${preset}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {adjustMode === "SET" && (
                <div className="space-y-3 rounded-lg border p-3 bg-card">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="exactBal" className="text-xs font-medium">
                      Exact Remaining Balance ($)
                    </Label>
                    <span className="text-xs font-bold text-primary">
                      Updated: ${exactBalance}
                    </span>
                  </div>
                  <Input
                    id="exactBal"
                    type="number"
                    min="0"
                    step="1"
                    value={exactBalance}
                    onChange={(e) => setExactBalance(parseFloat(e.target.value) || 0)}
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Directly overrides the customer&apos;s available credit balance.
                  </p>
                </div>
              )}

              {/* Package Total Credits Limit & Expiry Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="totalCap" className="text-xs">
                    Total Package Value ($)
                  </Label>
                  <Input
                    id="totalCap"
                    type="number"
                    min="1"
                    value={editTotalCredits}
                    onChange={(e) => setEditTotalCredits(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="expiryDate" className="text-xs">
                    Package Expiry Date
                  </Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={editExpiryDate}
                    onChange={(e) => setEditExpiryDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Bonus Allowance Counters */}
              {editAllowances.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Included Add-on Allowances (Vouchers)
                  </Label>
                  <div className="space-y-2">
                    {editAllowances.map((allowance, idx) => (
                      <div
                        key={allowance.id}
                        className="flex items-center justify-between p-2 rounded-lg border bg-muted/20 text-xs"
                      >
                        <span className="font-medium pr-2">{allowance.name}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-6 w-6"
                            onClick={() => handleAllowanceChange(idx, -1)}
                            disabled={allowance.remaining <= 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-bold w-6 text-center text-primary">
                            {allowance.remaining}
                          </span>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-6 w-6"
                            onClick={() => handleAllowanceChange(idx, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Adjustment Note */}
              <div className="space-y-1.5 border-t pt-3">
                <Label htmlFor="adjNote" className="text-xs">
                  Reason / Reference Note (Optional)
                </Label>
                <Input
                  id="adjNote"
                  placeholder="e.g. Counter PayNow top-up / Goodwill adjustment / Cash refund"
                  value={adjustmentNote}
                  onChange={(e) => setAdjustmentNote(e.target.value)}
                  className="text-xs"
                />
              </div>

              <DialogFooter className="pt-3 border-t gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAdjustBalanceOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="gap-2">
                  <Check className="h-4 w-4" />
                  Save & Apply Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ASSIGN / PURCHASE MEMBERSHIP DIALOG */}
      <Dialog open={isBuyMembershipOpen} onOpenChange={setIsBuyMembershipOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Assign Membership / Credit Package: {customer.name}
            </DialogTitle>
            <DialogDescription>
              Select an official 4-tier Club Membership or assign a custom prepaid credit wallet.
            </DialogDescription>
          </DialogHeader>

          {/* 4 Standard Club Tiers */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Standard Salon Packages
            </span>
            <div className="grid gap-3 sm:grid-cols-2">
              {MEMBERSHIP_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  className="border-2 rounded-xl p-4 flex flex-col justify-between hover:border-primary cursor-pointer transition-all bg-card"
                  onClick={() => handleBuyTier(tier.name)}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{tier.displayName}</span>
                      <span className="font-extrabold text-base text-primary">${tier.price}</span>
                    </div>
                    <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                      +${tier.bonusCredits} Bonus = ${tier.totalCredits} Credits
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {tier.validityMonths} Months · {tier.includedBenefits[0]}
                    </p>
                  </div>
                  <Button size="sm" className="w-full mt-3 text-xs">
                    Select {tier.displayName.replace(" Membership", "")}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Credit Wallet Creation */}
          <div className="space-y-3 pt-3 border-t">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Or Custom Prepaid Store Credit Wallet
            </span>

            <form onSubmit={handleCreateCustomPackage} className="rounded-xl border p-4 bg-muted/20 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-1">
                  <Label className="text-xs">Package Name</Label>
                  <Input
                    value={customTierName}
                    onChange={(e) => setCustomTierName(e.target.value)}
                    placeholder="e.g. VIP Puppy Wallet"
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Credit Balance ($)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={customCredits}
                    onChange={(e) => setCustomCredits(parseFloat(e.target.value) || 0)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Validity (Months)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="36"
                    value={customValidityMonths}
                    onChange={(e) => setCustomValidityMonths(parseInt(e.target.value) || 6)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button type="submit" variant="secondary" size="sm" className="gap-1.5 text-xs">
                  <CreditCard className="h-3.5 w-3.5" />
                  Assign Custom Credits
                </Button>
              </div>
            </form>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsBuyMembershipOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
