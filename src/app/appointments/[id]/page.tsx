"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  Phone,
  DollarSign,
  Receipt,
  FileText,
  CreditCard,
  Plus,
  Trash2,
  Printer,
  Crown,
  HeartPulse,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
} from "@/lib/utils";
import {
  getAppointments,
  updateAppointmentStatus,
  saveAppointment,
  getCustomerMembership,
  deductMembershipCredits,
  getGroomingRecords,
  saveGroomingRecord,
  getPayments,
  savePayment,
  MOCK_ADDONS,
  MockAppointment,
  CustomerMembership,
  GroomingRecord,
  PaymentRecord,
} from "@/lib/mock-data";

const SKIN_CONDITIONS = [
  "Normal",
  "Dry Skin",
  "Redness / Irritation",
  "Rashes / Hot Spots",
  "Fleas / Ticks",
  "Matting / Tangled Fur",
  "Dandruff / Flaking",
  "Bald Patches",
];

const ISSUE_LOCATIONS = [
  "Ears",
  "Belly",
  "Paws / Pads",
  "Legs",
  "Tail",
  "Face / Eyes",
  "Back / Spine",
  "Neck / Chest",
];

export default function AppointmentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [apt, setApt] = useState<MockAppointment | null>(null);
  const [status, setStatus] = useState<string>("BOOKED");
  const [membership, setMembership] = useState<CustomerMembership | undefined>();
  const [existingRecord, setExistingRecord] = useState<GroomingRecord | undefined>();
  const [paymentRecord, setPaymentRecord] = useState<PaymentRecord | undefined>();

  // Modals
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Price adjustment
  const [customPrice, setCustomPrice] = useState<number>(85);
  const [selectedAddons, setSelectedAddons] = useState<{ id: string; name: string; price: number }[]>([]);

  // Grooming Record Form state
  const [haircutStyle, setHaircutStyle] = useState("");
  const [bladeLength, setBladeLength] = useState("");
  const [selectedConditions, setSelectedConditions] = useState<string[]>(["Normal"]);
  const [skinNotes, setSkinNotes] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [healthNotes, setHealthNotes] = useState("");
  const [behaviour, setBehaviour] = useState("Calm and well-behaved");
  const [recommendation, setRecommendation] = useState("");

  // Payment Form state
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "PAYNOW" | "MEMBERSHIP_CREDIT">("PAYNOW");
  const [discountCode, setDiscountCode] = useState("");
  const [discountValue, setDiscountValue] = useState(0);

  useEffect(() => {
    const list = getAppointments();
    const found = list.find((a) => a.id === params.id) || list[0];
    if (found) {
      setApt(found);
      setStatus(found.status);
      setCustomPrice(found.servicePrice);
      if (found.addOns) setSelectedAddons(found.addOns);

      const mem = getCustomerMembership(found.customerId);
      setMembership(mem);

      const records = getGroomingRecords(found.petId);
      const rec = records.find((r) => r.appointmentId === found.id);
      if (rec) {
        setExistingRecord(rec);
        setHaircutStyle(rec.haircutStyle || "");
        setBladeLength(rec.bladeGuardLength || "");
        setSelectedConditions(rec.skinConditions || ["Normal"]);
        setSkinNotes(rec.skinConditionNotes || "");
        setSelectedLocations(rec.issueLocations || []);
        setHealthNotes(rec.healthObservations || "");
        setBehaviour(rec.behaviour || "");
        setRecommendation(rec.recommendationToOwner || "");
      }

      const payments = getPayments();
      const pay = payments.find((p) => p.appointmentId === found.id);
      if (pay) setPaymentRecord(pay);
    }
  }, [params.id]);

  if (!apt) return null;

  // Add-on totals
  const addOnsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const subtotal = customPrice + addOnsTotal;
  const grandTotal = Math.max(0, subtotal - discountValue);

  function handleStatusChange(newStatus: string) {
    if (!apt) return;
    setStatus(newStatus);
    updateAppointmentStatus(apt.id, newStatus as any);
  }

  function handleAddAddon(addonId: string) {
    if (!apt) return;
    const addon = MOCK_ADDONS.find((a) => a.id === addonId);
    if (!addon) return;
    if (selectedAddons.some((a) => a.id === addon.id)) return;

    const updated = [...selectedAddons, { id: addon.id, name: addon.name, price: addon.price }];
    setSelectedAddons(updated);
    apt.addOns = updated;
    saveAppointment(apt);
  }

  function handleRemoveAddon(addonId: string) {
    if (!apt) return;
    const updated = selectedAddons.filter((a) => a.id !== addonId);
    setSelectedAddons(updated);
    apt.addOns = updated;
    saveAppointment(apt);
  }

  function handleSaveGroomingRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!apt) return;
    const newRecord: GroomingRecord = {
      id: existingRecord?.id || `gr_${Date.now()}`,
      appointmentId: apt.id,
      petId: apt.petId,
      dateStr: apt.dateStr,
      groomerName: apt.groomerName,
      serviceDone: apt.serviceName,
      haircutStyle,
      bladeGuardLength: bladeLength,
      skinConditions: selectedConditions,
      skinConditionNotes: skinNotes,
      issueLocations: selectedLocations,
      healthObservations: healthNotes,
      behaviour,
      recommendationToOwner: recommendation,
    };

    saveGroomingRecord(newRecord);
    setExistingRecord(newRecord);
    setIsRecordOpen(false);

    // If appointment is not yet marked DONE, set to DONE
    if (status !== "DONE") {
      handleStatusChange("DONE");
    }
  }

  function handleProcessPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!apt) return;

    if (paymentMethod === "MEMBERSHIP_CREDIT") {
      if (!membership || membership.remainingCredits < grandTotal) {
        alert("Insufficient membership credits!");
        return;
      }
      deductMembershipCredits(apt.customerId, grandTotal);
    }

    const newPayment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      appointmentId: apt.id,
      invoiceNumber: `INV-2024-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: apt.customerName,
      customerPhone: apt.customerPhone,
      petName: apt.petName,
      serviceName: apt.serviceName,
      servicePrice: customPrice,
      addOns: selectedAddons,
      discountAmount: discountValue,
      discountNote: discountCode ? `Promo Code: ${discountCode}` : undefined,
      subtotal,
      totalAmount: grandTotal,
      paymentMethod,
      membershipCreditsDeducted: paymentMethod === "MEMBERSHIP_CREDIT" ? grandTotal : undefined,
      paidAt: new Date().toLocaleString("en-SG"),
      status: "PAID",
    };

    savePayment(newPayment);
    setPaymentRecord(newPayment);
    setIsCheckoutOpen(false);
    setIsReceiptOpen(true);
    apt.isPaid = true;
    saveAppointment(apt);
  }

  function applyPromoCode() {
    if (discountCode.trim().toUpperCase() === "WELCOME10") {
      setDiscountValue(10);
    } else if (discountCode.trim().toUpperCase() === "VIP5") {
      setDiscountValue(5);
    } else {
      alert("Invalid promo code. Try WELCOME10 for $10 off.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Appointment Details</h1>
            <Badge className={APPOINTMENT_STATUS_COLORS[status] || ""}>
              {APPOINTMENT_STATUS_LABELS[status]}
            </Badge>
            {apt.isPaid && (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> Paid
              </Badge>
            )}
            {membership?.hasQueuePriority && (
              <Badge variant="default" className="text-xs gap-1">
                <Crown className="h-3 w-3" /> VIP Queue Priority
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{apt.dateStr} · {apt.startTime} - {apt.endTime}</p>
        </div>

        <div className="flex gap-2">
          {paymentRecord && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setIsReceiptOpen(true)}
            >
              <Receipt className="h-4 w-4" /> View Invoice
            </Button>
          )}

          {!paymentRecord && (
            <Button
              variant="default"
              size="sm"
              className="gap-1.5"
              onClick={() => setIsCheckoutOpen(true)}
            >
              <DollarSign className="h-4 w-4" /> Checkout & Pay
            </Button>
          )}
        </div>
      </div>

      {/* Warnings if any */}
      {apt.petName === "Mochi" && (
        <div className="rounded-lg border-2 border-warning/40 bg-warning/10 p-4">
          <div className="flex items-center gap-2 font-semibold text-warning-foreground">
            <AlertTriangle className="h-5 w-5" />
            Warning for {apt.petName}:
          </div>
          <ul className="mt-1 space-y-1 text-sm">
            <li>• Sensitive around paws — handle gently</li>
            <li>• Anxious with loud dryer noises</li>
          </ul>
        </div>
      )}

      {/* Action / Status & Record Strip */}
      <Card className="shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">Appointment Status:</span>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(APPOINTMENT_STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={existingRecord ? "secondary" : "default"}
              size="sm"
              className="gap-2"
              onClick={() => setIsRecordOpen(true)}
            >
              <HeartPulse className="h-4 w-4" />
              {existingRecord ? "Edit Health & Style Record" : "Fill Grooming Health Record"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Details & Pricing Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer & Pet Details */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Customer & Pet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Owner</p>
              <Link
                href={`/customers/${apt.customerId}`}
                className="font-medium text-primary hover:underline flex items-center gap-1.5 mt-0.5"
              >
                <span>{apt.customerName}</span>
                <span className="text-muted-foreground font-normal">({apt.customerPhone})</span>
              </Link>
            </div>

            {/* Membership badge if member */}
            {membership && (
              <div className="rounded-lg border bg-primary/5 p-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-sm">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <span>{membership.displayName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Balance: <span className="font-bold text-foreground">{membership.remainingCredits}</span> / {membership.totalCredits} credits
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Exp: {membership.expiryDate}
                </Badge>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground">Pet</p>
              <Link
                href={`/pets/${apt.petId}`}
                className="font-medium text-primary hover:underline mt-0.5 inline-block"
              >
                {apt.petName} — {apt.petBreed} ({apt.petSize})
              </Link>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Assigned Groomer</p>
              <p className="font-medium mt-0.5">✂ {apt.groomerName}</p>
            </div>
          </CardContent>
        </Card>

        {/* Service, Add-ons & Manual Price Edit */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scissors className="h-5 w-5" />
              Service & Pricing
            </CardTitle>
            <CardDescription>
              Service duration, add-ons, and manual price edit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="font-semibold text-sm">{apt.serviceName}</p>
                <p className="text-xs text-muted-foreground">{apt.serviceDuration} minutes</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Price: $</span>
                <Input
                  type="number"
                  value={customPrice}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCustomPrice(val);
                    apt.servicePrice = val;
                    saveAppointment(apt);
                  }}
                  className="w-20 text-right h-8"
                />
              </div>
            </div>

            {/* Selected Add-ons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Add-ons & Extra Charges
                </span>
                <Select onValueChange={handleAddAddon}>
                  <SelectTrigger className="w-36 h-7 text-xs">
                    <Plus className="mr-1 h-3 w-3" />
                    <span>Add extra</span>
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_ADDONS.map((addon) => (
                      <SelectItem key={addon.id} value={addon.id}>
                        {addon.name} (+${addon.price})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAddons.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No add-ons selected.</p>
              ) : (
                selectedAddons.map((addon) => (
                  <div key={addon.id} className="flex items-center justify-between text-xs rounded-md bg-muted/60 p-2">
                    <span>{addon.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">+${addon.price}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-destructive"
                        onClick={() => handleRemoveAddon(addon.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Grand Total */}
            <div className="border-t pt-3 flex items-center justify-between font-bold">
              <span>Total Price</span>
              <span className="text-lg text-primary">${grandTotal}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: GROOMING RECORD MODAL
      ───────────────────────────────────────────────────────────── */}
      <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-primary" />
              Appointment Grooming & Health Record
            </DialogTitle>
            <DialogDescription>
              Record haircut style, blade length, skin condition, and observations for {apt.petName}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveGroomingRecord} className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Haircut / Style Used</Label>
                <Input
                  placeholder="e.g. Teddy bear cut, scissor face, rounded ears"
                  value={haircutStyle}
                  onChange={(e) => setHaircutStyle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Blade / Guard Length</Label>
                <Input
                  placeholder="e.g. #10 body, #30 sanitary, 1/2 guard"
                  value={bladeLength}
                  onChange={(e) => setBladeLength(e.target.value)}
                />
              </div>
            </div>

            {/* Skin & Coat Condition Multi-select */}
            <div className="space-y-2">
              <Label>Skin & Coat Condition (Multi-select)</Label>
              <div className="flex flex-wrap gap-1.5">
                {SKIN_CONDITIONS.map((cond) => {
                  const isSelected = selectedConditions.includes(cond);
                  return (
                    <Badge
                      key={cond}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer py-1 px-2.5 text-xs select-none"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedConditions(selectedConditions.filter((c) => c !== cond));
                        } else {
                          setSelectedConditions([...selectedConditions, cond]);
                        }
                      }}
                    >
                      {cond}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Location of Issue */}
            <div className="space-y-2">
              <Label>Location of Issue (if applicable)</Label>
              <div className="flex flex-wrap gap-1.5">
                {ISSUE_LOCATIONS.map((loc) => {
                  const isSelected = selectedLocations.includes(loc);
                  return (
                    <Badge
                      key={loc}
                      variant={isSelected ? "warning" : "outline"}
                      className="cursor-pointer py-1 px-2.5 text-xs select-none"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedLocations(selectedLocations.filter((l) => l !== loc));
                        } else {
                          setSelectedLocations([...selectedLocations, loc]);
                        }
                      }}
                    >
                      {loc}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Health Observations (Ears, Eyes, Lumps, Nails)</Label>
              <Textarea
                placeholder="e.g. Left ear slightly inflamed, nails trimmed and smoothed."
                value={healthNotes}
                onChange={(e) => setHealthNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Behaviour During Grooming</Label>
                <Input
                  placeholder="e.g. Calm, anxious with dryer"
                  value={behaviour}
                  onChange={(e) => setBehaviour(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Recommendation to Owner</Label>
                <Input
                  placeholder="e.g. Medicated bath next visit, check ears with vet"
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsRecordOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Health Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: CHECKOUT & PAYMENT MODAL
      ───────────────────────────────────────────────────────────── */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Checkout & Payment
            </DialogTitle>
            <DialogDescription>
              Complete payment for {apt.petName}&apos;s visit.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProcessPayment} className="space-y-4 pt-2">
            {/* Bill Summary */}
            <div className="rounded-lg bg-muted/60 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>{apt.serviceName}</span>
                <span>${customPrice}</span>
              </div>
              {selectedAddons.map((a) => (
                <div key={a.id} className="flex justify-between text-muted-foreground">
                  <span>+ {a.name}</span>
                  <span>${a.price}</span>
                </div>
              ))}
              {discountValue > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount</span>
                  <span>-${discountValue}</span>
                </div>
              )}
              <div className="border-t pt-1.5 flex justify-between font-bold text-sm text-foreground">
                <span>Total Amount Due</span>
                <span className="text-primary">${grandTotal}</span>
              </div>
            </div>

            {/* Promo Code Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Promo code (e.g. WELCOME10)"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className="text-xs h-9"
              />
              <Button type="button" variant="outline" size="sm" onClick={applyPromoCode}>
                Apply
              </Button>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === "PAYNOW" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPaymentMethod("PAYNOW")}
                  className="text-xs justify-start"
                >
                  PayNow QR
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === "CARD" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPaymentMethod("CARD")}
                  className="text-xs justify-start"
                >
                  Credit Card
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === "CASH" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPaymentMethod("CASH")}
                  className="text-xs justify-start"
                >
                  Cash
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === "MEMBERSHIP_CREDIT" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPaymentMethod("MEMBERSHIP_CREDIT")}
                  disabled={!membership}
                  className="text-xs justify-start"
                >
                  Club Credits
                </Button>
              </div>

              {membership && paymentMethod === "MEMBERSHIP_CREDIT" && (
                <div className="rounded-md border border-primary/30 bg-primary/5 p-2.5 text-xs mt-2">
                  <p className="font-semibold text-primary">
                    Deduct from {membership.displayName}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    Current balance: {membership.remainingCredits} credits.
                    After payment: {membership.remainingCredits - grandTotal} credits.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsCheckoutOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Complete & Print Receipt</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: INVOICE / RECEIPT VIEWER
      ───────────────────────────────────────────────────────────── */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-md">
          <div className="p-4 border rounded-xl bg-white text-black space-y-4 print:p-0">
            {/* Salon Header */}
            <div className="text-center border-b pb-3 space-y-1">
              <h2 className="text-xl font-bold tracking-tight">DOGLAB GROOMING</h2>
              <p className="text-xs text-neutral-500">123 Grooming Lane, Singapore</p>
              <p className="text-xs text-neutral-500">Tel: +65 6789 0123</p>
              <Badge variant="outline" className="mt-1 text-[10px]">
                {paymentRecord?.invoiceNumber || "INV-2024-1001"}
              </Badge>
            </div>

            {/* Metadata */}
            <div className="text-xs space-y-1 border-b pb-3">
              <div className="flex justify-between">
                <span className="text-neutral-500">Date:</span>
                <span>{paymentRecord?.paidAt || new Date().toLocaleString("en-SG")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Customer:</span>
                <span className="font-semibold">{apt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Pet:</span>
                <span>{apt.petName} ({apt.petBreed})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Groomer:</span>
                <span>{apt.groomerName}</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="text-xs space-y-1.5 border-b pb-3">
              <div className="flex justify-between font-semibold">
                <span>{apt.serviceName}</span>
                <span>${customPrice}.00</span>
              </div>
              {selectedAddons.map((addon) => (
                <div key={addon.id} className="flex justify-between text-neutral-600">
                  <span>+ {addon.name}</span>
                  <span>${addon.price}.00</span>
                </div>
              ))}
              {discountValue > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount ({discountCode || "Promo"})</span>
                  <span>-${discountValue}.00</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="text-xs space-y-1">
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL PAID</span>
                <span>${paymentRecord?.totalAmount || grandTotal}.00</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Payment Method:</span>
                <span>{paymentRecord?.paymentMethod || paymentMethod}</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-neutral-400 border-t pt-3">
              Thank you for trusting Doglab with {apt.petName}!
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" /> Print Receipt
            </Button>
            <Button size="sm" onClick={() => setIsReceiptOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
