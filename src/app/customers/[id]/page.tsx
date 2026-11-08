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
  Sparkles,
  SlidersHorizontal,
  Check,
  Edit,
  Trash2,
  History,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  getInitials,
  formatPrice,
  roundCurrency,
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
  getVaccinationStatus,
} from "@/lib/utils";
import {
  getCustomers,
  saveCustomer,
  deleteCustomer,
  getAppointments,
  saveAppointment,
  getCustomerMembership,
  purchaseMembership,
  updateCustomerMembership,
  deleteCustomerMembership,
  setCustomerMembership,
  deductPackageAddonAllowance,
  isMembershipExpired,
  getMembershipTiers,
  getPetEffectiveVaccinationExpiry,
  MEMBERSHIP_TIERS,
  localDateStr,
  newId,
  MembershipTier,
  MockCustomer,
  MockAppointment,
  CustomerMembership,
  CreditTransaction,
} from "@/lib/mock-data";
import { showToast } from "@/components/ui/toast-system";

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<MockCustomer | null>(null);
  const [appointments, setAppointments] = useState<MockAppointment[]>([]);
  const [membership, setMembership] = useState<CustomerMembership | undefined>();
  const [membershipTiers, setMembershipTiers] = useState<MembershipTier[]>([]);
  const [notFound, setNotFound] = useState(false);

  // Modals & Confirmations
  const [isBuyMembershipOpen, setIsBuyMembershipOpen] = useState(false);
  const [pendingTierToBuy, setPendingTierToBuy] = useState<MembershipTier | null>(null);
  const [isAdjustBalanceOpen, setIsAdjustBalanceOpen] = useState(false);
  const [isExtendExpiryOpen, setIsExtendExpiryOpen] = useState(false);
  const [extendExpiryDate, setExtendExpiryDate] = useState<string>("");
  const [isRemoveMembershipOpen, setIsRemoveMembershipOpen] = useState(false);
  const [isDeleteCustomerOpen, setIsDeleteCustomerOpen] = useState(false);
  const [pendingRedeemAllowance, setPendingRedeemAllowance] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [rolloverCredits, setRolloverCredits] = useState<boolean>(true);

  // Edit Customer Details Modal State
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editReferralSource, setEditReferralSource] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Custom package creation form
  const [customPkgType, setCustomPkgType] = useState<"CREDITS" | "SESSIONS">("CREDITS");
  const [customTierName, setCustomTierName] = useState("Custom Credit Package");
  const [customCredits, setCustomCredits] = useState<number>(300);
  const [customSessions, setCustomSessions] = useState<number>(5);
  const [customValidityMonths, setCustomValidityMonths] = useState<number>(6);

  // Adjust Balance / Sessions modal form state
  const [adjustMode, setAdjustMode] = useState<"ADD" | "SET" | "DEDUCT">("ADD");
  const [adjustAmount, setAdjustAmount] = useState<number>(100);
  const [exactBalance, setExactBalance] = useState<number>(0);
  const [editTotalCredits, setEditTotalCredits] = useState<number>(0);
  const [editRemainingSessions, setEditRemainingSessions] = useState<number>(0);
  const [editTotalSessions, setEditTotalSessions] = useState<number>(0);
  const [editExpiryDate, setEditExpiryDate] = useState<string>("");
  const [adjustmentNote, setAdjustmentNote] = useState<string>("");
  const [editAllowances, setEditAllowances] = useState<
    { id: string; name: string; total: number; remaining: number }[]
  >([]);

  const loadData = () => {
    const found = getCustomers().find((c) => c.id === params.id);
    if (!found) {
      setCustomer(null);
      setNotFound(true);
      return;
    }
    setNotFound(false);
    setCustomer(found);

    const apts = getAppointments()
      .filter((a) => a.customerId === found.id)
      .sort((a, b) => (b.dateStr || "").localeCompare(a.dateStr || ""));
    setAppointments(apts);

    const mem = getCustomerMembership(found.id);
    setMembership(mem);
    if (mem?.expiryDate) {
      setExtendExpiryDate(mem.expiryDate);
    }
    setMembershipTiers(getMembershipTiers());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("nimbus-data-updated", loadData);
    return () => window.removeEventListener("nimbus-data-updated", loadData);
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

  const isExpired = isMembershipExpired(membership);

  function openEditCustomerModal() {
    if (!customer) return;
    setEditName(customer.name || "");
    setEditPhone(customer.phone || "");
    setEditEmail(customer.email || "");
    setEditAddress(customer.address || "");
    setEditReferralSource(customer.referralSource || "");
    setEditNotes(customer.notes || "");
    setIsEditCustomerOpen(true);
  }

  function handleSaveCustomerDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;
    if (!editName.trim() || !editPhone.trim()) {
      showToast("Name and phone number are required.", "error");
      return;
    }

    const updatedCustomer: MockCustomer = {
      ...customer,
      name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim() || undefined,
      address: editAddress.trim() || undefined,
      referralSource: editReferralSource.trim() || undefined,
      notes: editNotes.trim() || undefined,
    };

    saveCustomer(updatedCustomer);
    setCustomer(updatedCustomer);

    if (editName.trim() !== customer.name || editPhone.trim() !== customer.phone) {
      for (const apt of getAppointments()) {
        if (apt.customerId === customer.id) {
          saveAppointment({
            ...apt,
            customerName: editName.trim(),
            customerPhone: editPhone.trim(),
          });
        }
      }
      setAppointments(getAppointments().filter((a) => a.customerId === customer.id));
    }

    setIsEditCustomerOpen(false);
    showToast("Customer details updated!", "success");
  }

  function handleDeleteCustomer() {
    if (!customer) return;
    deleteCustomer(customer.id);
    if (membership) deleteCustomerMembership(customer.id);
    setIsDeleteCustomerOpen(false);
    showToast(`Deleted customer ${customer.name}.`, "info");
    router.push("/customers");
  }

  function handleConfirmBuyTier() {
    if (!customer || !pendingTierToBuy) return;
    const newMem = purchaseMembership(customer.id, pendingTierToBuy.id, rolloverCredits);
    setMembership(newMem);
    setPendingTierToBuy(null);
    setIsBuyMembershipOpen(false);
    showToast(`Assigned ${newMem.displayName} to ${customer.name}!`, "success");
  }

  function handleExtendExpiry(e: React.FormEvent) {
    e.preventDefault();
    if (!customer || !extendExpiryDate) return;
    const updated = updateCustomerMembership(
      customer.id,
      { expiryDate: extendExpiryDate },
      {
        amount: 0,
        type: "ADJUSTMENT",
        note: `Extended expiry date to ${extendExpiryDate}`,
      }
    );
    if (updated) setMembership(updated);
    setIsExtendExpiryOpen(false);
    showToast(`Expiry updated to ${extendExpiryDate}.`, "success");
  }

  function handleQuickExtendMonths(months: number) {
    if (!membership) return;
    const currentBase = membership.expiryDate
      ? new Date(membership.expiryDate + "T00:00:00")
      : new Date();
    currentBase.setMonth(currentBase.getMonth() + months);
    setExtendExpiryDate(localDateStr(currentBase));
  }

  function handleRemoveMembership() {
    if (!customer) return;
    deleteCustomerMembership(customer.id);
    setMembership(undefined);
    setIsRemoveMembershipOpen(false);
    showToast("Membership package removed.", "info");
  }

  function handleCreateCustomPackage(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;

    const now = new Date();
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + (customValidityMonths || 6));

    const isSessions = customPkgType === "SESSIONS";
    const tx: CreditTransaction = {
      id: newId("tx"),
      dateStr: localDateStr(now),
      amount: isSessions ? customSessions : customCredits,
      type: "PURCHASE",
      note: `Assigned ${customTierName.trim() || "Custom Package"}`,
    };

    const newMem: CustomerMembership = {
      id: newId("mem"),
      customerId: customer.id,
      tierName: "CUSTOM",
      displayName: customTierName.trim() || (isSessions ? "Custom Session Pass" : "Store Credit Wallet"),
      packageType: customPkgType,
      totalSessions: isSessions ? Math.max(1, Number(customSessions) || 1) : undefined,
      remainingSessions: isSessions ? Math.max(0, Number(customSessions) || 0) : undefined,
      purchaseDate: localDateStr(now),
      expiryDate: localDateStr(expiry),
      remainingCredits: isSessions ? 0 : Math.max(0, Number(customCredits) || 0),
      totalCredits: isSessions ? 0 : Math.max(0, Number(customCredits) || 0),
      hasQueuePriority: false,
      bonusAllowances: [],
      transactions: [tx],
    };

    setCustomerMembership(newMem);
    setMembership(newMem);
    setIsBuyMembershipOpen(false);
    showToast(`Assigned ${newMem.displayName}!`, "success");
  }

  function openAdjustModal() {
    if (!membership) return;
    setAdjustMode("ADD");
    setAdjustAmount(100);
    setExactBalance(membership.remainingCredits);
    setEditTotalCredits(membership.totalCredits);
    setEditRemainingSessions(membership.remainingSessions ?? 0);
    setEditTotalSessions(membership.totalSessions ?? 0);
    setEditExpiryDate(membership.expiryDate || "");
    setAdjustmentNote("");
    setEditAllowances(membership.bonusAllowances ? [...membership.bonusAllowances] : []);
    setIsAdjustBalanceOpen(true);
  }

  function handleSaveAdjustBalance(e: React.FormEvent) {
    e.preventDefault();
    if (!membership || !customer) return;

    if (membership.packageType === "SESSIONS") {
      const nextRem = Math.max(0, Number(editRemainingSessions) || 0);
      const nextTot = Math.max(nextRem, Number(editTotalSessions) || nextRem);
      const delta = nextRem - (membership.remainingSessions ?? 0);
      const updated = updateCustomerMembership(
        customer.id,
        {
          remainingSessions: nextRem,
          totalSessions: nextTot,
          expiryDate: editExpiryDate || membership.expiryDate,
          bonusAllowances: editAllowances,
        },
        {
          amount: delta,
          type: "ADJUSTMENT",
          note:
            adjustmentNote.trim() ||
            `Sessions adjusted (${membership.remainingSessions ?? 0} → ${nextRem})`,
        }
      );
      if (updated) setMembership(updated);
      setIsAdjustBalanceOpen(false);
      showToast("Session package updated!", "success");
      return;
    }

    let computedRemaining = membership.remainingCredits;
    let computedTotal = editTotalCredits || membership.totalCredits;

    if (adjustMode === "ADD") {
      computedRemaining = roundCurrency(membership.remainingCredits + Number(adjustAmount || 0));
      if (computedRemaining > computedTotal) computedTotal = computedRemaining;
    } else if (adjustMode === "DEDUCT") {
      computedRemaining = roundCurrency(
        Math.max(0, membership.remainingCredits - Number(adjustAmount || 0))
      );
    } else if (adjustMode === "SET") {
      computedRemaining = roundCurrency(Math.max(0, Number(exactBalance || 0)));
      if (computedRemaining > computedTotal) computedTotal = computedRemaining;
    }

    const delta = roundCurrency(computedRemaining - membership.remainingCredits);
    const updated = updateCustomerMembership(
      customer.id,
      {
        remainingCredits: computedRemaining,
        totalCredits: computedTotal,
        expiryDate: editExpiryDate || membership.expiryDate,
        bonusAllowances: editAllowances,
      },
      {
        amount: delta,
        type: "ADJUSTMENT",
        note:
          adjustmentNote.trim() ||
          `Balance adjusted (${formatPrice(membership.remainingCredits)} → ${formatPrice(
            computedRemaining
          )})`,
      }
    );

    if (updated) setMembership(updated);
    setIsAdjustBalanceOpen(false);
    showToast("Package balance & allowances updated!", "success");
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

  const handleConfirmRedeemAllowance = () => {
    if (!customer || !pendingRedeemAllowance) return;
    const updated = deductPackageAddonAllowance(
      customer.id,
      pendingRedeemAllowance.id,
      `Counter redemption: ${pendingRedeemAllowance.name}`
    );
    if (updated) {
      setMembership({ ...updated });
      showToast(`Redeemed 1× ${pendingRedeemAllowance.name}.`, "success");
    }
    setPendingRedeemAllowance(null);
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
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
              {membership && (
                <Badge
                  variant={isExpired ? "destructive" : "default"}
                  className="text-xs gap-1 py-0.5"
                >
                  <Crown className="h-3 w-3 text-amber-300" /> {membership.displayName}
                  {isExpired && " (Expired)"}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">Customer Profile &amp; Membership</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={openEditCustomerModal}
          >
            <Edit className="h-3.5 w-3.5 text-primary" />
            Edit Profile
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => {
              setRolloverCredits(true);
              setIsBuyMembershipOpen(true);
            }}
          >
            <Crown className="h-3.5 w-3.5 text-amber-500" />
            {membership ? "Renew / Buy Package" : "Assign Package"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setIsDeleteCustomerOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Owner
          </Button>
        </div>
      </div>

      {/* Contact Info & Membership Summary Strip */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Contact Info */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Contact Information
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-primary hover:bg-primary/10 -mr-2"
              onClick={openEditCustomerModal}
            >
              <Edit className="h-3 w-3" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col justify-center space-y-2 p-4 pt-1">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-semibold text-foreground">{customer.phone}</span>
            </div>
            {customer.email ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground/60 italic">
                <Mail className="h-4 w-4 shrink-0" />
                <span>No email provided</span>
              </div>
            )}
            {customer.address ? (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>{customer.address}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground/60 italic">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>No address recorded</span>
              </div>
            )}
            {(customer.referralSource || customer.notes) && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t">
                {customer.referralSource && (
                  <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                    Source: {customer.referralSource}
                  </span>
                )}
                {customer.notes && (
                  <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-medium truncate max-w-full">
                    Note: {customer.notes}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Membership Details Card */}
        <Card
          className={`shadow-sm ${
            membership
              ? isExpired
                ? "border-destructive/40 bg-red-50/40"
                : "border-primary/40 bg-primary/5"
              : "bg-card"
          }`}
        >
          <CardContent className="p-4 flex flex-col justify-between h-full">
            {membership ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-base text-primary min-w-0">
                    {membership.packageType === "SESSIONS" ? (
                      <Ticket className="h-4 w-4 text-purple-600 shrink-0" />
                    ) : (
                      <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                    <span className="truncate">{membership.displayName}</span>
                  </div>
                  <Badge variant={isExpired ? "destructive" : "outline"} className="text-xs shrink-0">
                    {isExpired ? `Expired: ${membership.expiryDate}` : `Exp: ${membership.expiryDate}`}
                  </Badge>
                </div>

                {membership.packageType === "SESSIONS" ? (
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground font-medium">
                        Remaining Grooming Sessions:
                      </span>
                      <div className="text-right">
                        <span className="text-2xl font-extrabold text-foreground">
                          {membership.remainingSessions ?? 0}
                        </span>
                        <span className="text-xs text-muted-foreground font-normal">
                          {" "}
                          / {membership.totalSessions ?? 0} sessions
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            (membership.totalSessions ?? 0) > 0
                              ? ((membership.remainingSessions ?? 0) /
                                  (membership.totalSessions ?? 1)) *
                                  100
                              : 0
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground font-medium">
                        Remaining Package Balance:
                      </span>
                      <div className="text-right">
                        <span className="text-2xl font-extrabold text-foreground">
                          {formatPrice(membership.remainingCredits)}
                        </span>
                        <span className="text-xs text-muted-foreground font-normal">
                          {" "}
                          / {formatPrice(membership.totalCredits)} credits
                        </span>
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
                )}

                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="default"
                    className="h-7 text-xs gap-1 font-semibold"
                    onClick={openAdjustModal}
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    Adjust
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => {
                      setExtendExpiryDate(membership.expiryDate || localDateStr());
                      setIsExtendExpiryOpen(true);
                    }}
                  >
                    <Calendar className="h-3 w-3 text-primary" />
                    Extend Expiry
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 text-destructive hover:bg-destructive/10 sm:ml-auto"
                    onClick={() => setIsRemoveMembershipOpen(true)}
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </Button>
                </div>

                {membership.bonusAllowances && membership.bonusAllowances.length > 0 && (
                  <div className="border-t pt-2 space-y-2">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Included Add-on Vouchers
                    </span>
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
                          onClick={() =>
                            setPendingRedeemAllowance({
                              id: allowance.id,
                              name: allowance.name,
                            })
                          }
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
                <p className="text-sm font-semibold">No Active Club Membership or Session Pass</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Assign prepaid credits or a multi-session grooming package.
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
            Pets ({customer.pets.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 sm:flex-none">
            <Calendar className="mr-2 h-4 w-4" />
            Appointments ({appointments.length})
          </TabsTrigger>
          {membership && (
            <TabsTrigger value="ledger" className="flex-1 sm:flex-none">
              <History className="mr-2 h-4 w-4" />
              Package Ledger ({membership.transactions?.length || 0})
            </TabsTrigger>
          )}
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
            {customer.pets.map((pet) => {
              const vacStatus = getVaccinationStatus(getPetEffectiveVaccinationExpiry(pet));
              return (
                <Card key={pet.id} className="hover:border-primary/50 transition-colors shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-11 w-11 border shrink-0">
                          {pet.photoUrl && (
                            <AvatarImage
                              src={pet.photoUrl}
                              alt={pet.name}
                              className="object-cover"
                            />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(pet.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{pet.name}</CardTitle>
                          <p className="text-xs text-muted-foreground truncate">
                            {pet.breed} · {pet.age} yrs · {pet.size}
                          </p>
                        </div>
                      </div>
                      {pet.warnings.length > 0 && (
                        <Badge variant="warning" className="flex items-center gap-1 text-xs shrink-0">
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
                      {vacStatus.status !== "NONE" && (
                        <div
                          className={`col-span-2 flex items-center gap-1 font-medium ${
                            vacStatus.status === "EXPIRED"
                              ? "text-destructive"
                              : vacStatus.status === "EXPIRING_SOON"
                              ? "text-amber-700"
                              : "text-muted-foreground"
                          }`}
                        >
                          <Syringe className="h-3 w-3 shrink-0" />
                          <span>{vacStatus.label}</span>
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
              );
            })}
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
              <Link key={apt.id} href={`/appointments/${apt.id}`} className="block">
                <Card className="hover:bg-muted/40 transition-colors shadow-sm">
                  <CardContent className="flex items-center justify-between p-4 gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {apt.petName} — {apt.serviceName} ({formatPrice(apt.servicePrice)})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {apt.dateStr} at {apt.startTime} · Groomer: {apt.groomerName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {apt.isPaid && (
                        <Badge variant="success" className="text-xs">
                          Paid
                        </Badge>
                      )}
                      <Badge
                        className={APPOINTMENT_STATUS_COLORS[apt.status] || ""}
                        variant="secondary"
                      >
                        {APPOINTMENT_STATUS_LABELS[apt.status] || apt.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>

        {/* Package Transaction Ledger Tab */}
        {membership && (
          <TabsContent value="ledger" className="space-y-2 pt-2">
            {!membership.transactions || membership.transactions.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg bg-card p-4">
                No package transactions logged yet.
              </div>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="divide-y p-0">
                  {membership.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3.5 text-xs gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{tx.note}</p>
                        <p className="text-muted-foreground text-[11px]">
                          {tx.dateStr} · {tx.type}
                        </p>
                      </div>
                      <span
                        className={`font-bold shrink-0 ${
                          tx.amount > 0
                            ? "text-emerald-600"
                            : tx.amount < 0
                            ? "text-amber-700"
                            : "text-muted-foreground"
                        }`}
                      >
                        {tx.type === "SESSION" || tx.type === "VOUCHER"
                          ? `${tx.amount > 0 ? "+" : ""}${tx.amount}`
                          : `${tx.amount > 0 ? "+" : ""}${formatPrice(tx.amount)}`}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* ADJUST BALANCE / SESSIONS MODAL */}
      <Dialog open={isAdjustBalanceOpen} onOpenChange={setIsAdjustBalanceOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Adjust Package Balance &amp; Allowances
            </DialogTitle>
            <DialogDescription>
              Modify credits, session counts, expiry, or vouchers for {customer.name}.
            </DialogDescription>
          </DialogHeader>

          {membership && (
            <form onSubmit={handleSaveAdjustBalance} className="space-y-4 pt-2">
              {membership.packageType === "SESSIONS" ? (
                <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 bg-card">
                  <div className="space-y-1">
                    <Label className="text-xs">Remaining Sessions</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editRemainingSessions}
                      onChange={(e) => setEditRemainingSessions(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Total Sessions</Label>
                    <Input
                      type="number"
                      min="1"
                      value={editTotalSessions}
                      onChange={(e) => setEditTotalSessions(parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="rounded-lg border bg-muted/40 p-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground block font-medium">
                        Package Tier
                      </span>
                      <span className="font-bold text-sm text-primary flex items-center gap-1">
                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                        {membership.displayName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block font-medium">
                        Current Balance
                      </span>
                      <span className="text-lg font-extrabold text-foreground">
                        {formatPrice(membership.remainingCredits)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={adjustMode === "ADD" ? "default" : "outline"}
                      className="text-xs h-9"
                      onClick={() => setAdjustMode("ADD")}
                    >
                      + Top Up
                    </Button>
                    <Button
                      type="button"
                      variant={adjustMode === "SET" ? "default" : "outline"}
                      className="text-xs h-9"
                      onClick={() => setAdjustMode("SET")}
                    >
                      Set Exact
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

                  {adjustMode === "SET" ? (
                    <div className="space-y-2 rounded-lg border p-3 bg-card">
                      <Label className="text-xs font-medium">Exact Balance ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.50"
                        value={exactBalance}
                        onChange={(e) => setExactBalance(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2 rounded-lg border p-3 bg-card">
                      <div className="flex justify-between text-xs">
                        <Label>{adjustMode === "ADD" ? "Top-up ($)" : "Deduct ($)"}</Label>
                        <span className="font-semibold text-primary">
                          New:{" "}
                          {formatPrice(
                            adjustMode === "ADD"
                              ? membership.remainingCredits + (adjustAmount || 0)
                              : Math.max(0, membership.remainingCredits - (adjustAmount || 0))
                          )}
                        </span>
                      </div>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(parseFloat(e.target.value) || 0)}
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {[20, 50, 100, 200].map((preset) => (
                          <Button
                            key={preset}
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs"
                            onClick={() => setAdjustAmount(preset)}
                          >
                            {adjustMode === "ADD" ? `+$${preset}` : `-$${preset}`}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Total Package Cap ($)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={editTotalCredits}
                        onChange={(e) => setEditTotalCredits(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Package Expiry Date</Label>
                      <Input
                        type="date"
                        value={editExpiryDate}
                        onChange={(e) => setEditExpiryDate(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {membership.packageType === "SESSIONS" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Package Expiry Date</Label>
                  <Input
                    type="date"
                    value={editExpiryDate}
                    onChange={(e) => setEditExpiryDate(e.target.value)}
                  />
                </div>
              )}

              {editAllowances.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Included Add-on Vouchers
                  </Label>
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
              )}

              <div className="space-y-1.5 border-t pt-3">
                <Label htmlFor="adjNote" className="text-xs">
                  Reason / Reference Note
                </Label>
                <Input
                  id="adjNote"
                  placeholder="e.g. Counter PayNow top-up / Goodwill adjustment"
                  value={adjustmentNote}
                  onChange={(e) => setAdjustmentNote(e.target.value)}
                  className="text-xs"
                />
              </div>

              <DialogFooter className="pt-3 border-t gap-2 sm:gap-0">
                <Button type="button" variant="ghost" onClick={() => setIsAdjustBalanceOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="gap-2">
                  <Check className="h-4 w-4" />
                  Save Changes
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
              Assign Club Package or Credits: {customer.name}
            </DialogTitle>
            <DialogDescription>
              Select a club membership tier / session pass configured in Services &amp; Pricing, or create a custom wallet.
            </DialogDescription>
          </DialogHeader>

          {membership && (
            <div className="rounded-lg border bg-amber-500/10 border-amber-500/30 p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  Currently Active: {membership.displayName}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  Exp: {membership.expiryDate}
                </Badge>
              </div>
              <label className="flex items-center gap-2 pt-1 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={rolloverCredits}
                  onChange={(e) => setRolloverCredits(e.target.checked)}
                  className="rounded border-input h-4 w-4 text-primary"
                />
                <span>
                  Rollover remaining balance (
                  {membership.packageType === "SESSIONS"
                    ? `${membership.remainingSessions ?? 0} sessions`
                    : formatPrice(membership.remainingCredits)}
                  ) into new package
                </span>
              </label>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Salon Packages
            </span>
            <div className="grid gap-3 sm:grid-cols-2">
              {(membershipTiers.length > 0 ? membershipTiers : MEMBERSHIP_TIERS).map((tier) => (
                <div
                  key={tier.id}
                  className="border-2 rounded-xl p-4 flex flex-col justify-between hover:border-primary transition-all bg-card"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm">{tier.displayName}</span>
                      <span className="font-extrabold text-base text-primary">
                        {formatPrice(tier.price)}
                      </span>
                    </div>
                    {tier.packageType === "SESSIONS" ? (
                      <p className="text-xs text-purple-700 font-semibold mt-0.5">
                        {tier.sessionCount || 1} Prepaid Sessions
                      </p>
                    ) : (
                      <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                        +{formatPrice(tier.bonusCredits)} Bonus = {formatPrice(tier.totalCredits)} Credits
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {tier.validityMonths} Months ·{" "}
                      {tier.includedBenefits?.[0] || "Package Perks Included"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full mt-3 text-xs"
                    onClick={() => setPendingTierToBuy(tier)}
                  >
                    Select Package
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Or Assign Custom Package
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={customPkgType === "CREDITS" ? "default" : "outline"}
                  className="h-6 text-[11px]"
                  onClick={() => setCustomPkgType("CREDITS")}
                >
                  Credits ($)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={customPkgType === "SESSIONS" ? "default" : "outline"}
                  className="h-6 text-[11px]"
                  onClick={() => setCustomPkgType("SESSIONS")}
                >
                  Sessions (#)
                </Button>
              </div>
            </div>

            <form onSubmit={handleCreateCustomPackage} className="rounded-xl border p-4 bg-muted/20 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Package Name</Label>
                  <Input
                    value={customTierName}
                    onChange={(e) => setCustomTierName(e.target.value)}
                    placeholder="e.g. 5x Full Grooming"
                    className="text-xs"
                    required
                  />
                </div>
                {customPkgType === "SESSIONS" ? (
                  <div className="space-y-1">
                    <Label className="text-xs">Sessions Count</Label>
                    <Input
                      type="number"
                      min="1"
                      value={customSessions}
                      onChange={(e) => setCustomSessions(parseInt(e.target.value) || 1)}
                      className="text-xs"
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label className="text-xs">Credit Balance ($)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={customCredits}
                      onChange={(e) => setCustomCredits(parseFloat(e.target.value) || 0)}
                      className="text-xs"
                      required
                    />
                  </div>
                )}
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

              <div className="flex justify-end">
                <Button type="submit" variant="secondary" size="sm" className="gap-1.5 text-xs">
                  <CreditCard className="h-3.5 w-3.5" />
                  Assign Custom Package
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

      {/* Confirm Tier Purchase */}
      <AlertDialog
        open={Boolean(pendingTierToBuy)}
        onOpenChange={(open) => !open && setPendingTierToBuy(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign {pendingTierToBuy?.displayName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Assign <strong>{pendingTierToBuy?.displayName}</strong> ({formatPrice(pendingTierToBuy?.price)}) to{" "}
              <strong>{customer.name}</strong>?
              {membership && rolloverCredits
                ? " Remaining balance will roll over and validity will extend."
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBuyTier}>Confirm Assignment</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Allowance Voucher Redemption */}
      <AlertDialog
        open={Boolean(pendingRedeemAllowance)}
        onOpenChange={(open) => !open && setPendingRedeemAllowance(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redeem Add-on Voucher?</AlertDialogTitle>
            <AlertDialogDescription>
              Deduct 1 voucher for <strong>{pendingRedeemAllowance?.name}</strong> from{" "}
              {customer.name}&apos;s package?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRedeemAllowance}>Redeem 1</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* EXTEND EXPIRY DATE DIALOG */}
      <Dialog open={isExtendExpiryOpen} onOpenChange={setIsExtendExpiryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Extend Expiry: {customer.name}
            </DialogTitle>
            <DialogDescription>
              Current expiry date:{" "}
              <span className="font-semibold text-foreground">
                {membership?.expiryDate || "Not set"}
              </span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleExtendExpiry} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="extDate" className="text-xs font-semibold">
                New Expiry Date
              </Label>
              <Input
                id="extDate"
                type="date"
                value={extendExpiryDate}
                onChange={(e) => setExtendExpiryDate(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[1, 3, 6, 12].map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs font-semibold"
                  onClick={() => handleQuickExtendMonths(m)}
                >
                  +{m === 12 ? "1 Year" : `${m} Month${m > 1 ? "s" : ""}`}
                </Button>
              ))}
            </div>

            <DialogFooter className="pt-3 border-t gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsExtendExpiryOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save New Expiry Date</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* REMOVE MEMBERSHIP CONFIRMATION */}
      <AlertDialog open={isRemoveMembershipOpen} onOpenChange={setIsRemoveMembershipOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Membership Package?</AlertDialogTitle>
            <AlertDialogDescription>
              Removing <strong>{membership?.displayName}</strong> clears remaining balances and bonus vouchers for <strong>{customer.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Membership</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMembership}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Membership
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DELETE CUSTOMER CONFIRMATION */}
      <AlertDialog open={isDeleteCustomerOpen} onOpenChange={setIsDeleteCustomerOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer {customer.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the customer profile and their registered pets ({customer.pets.length}). Existing historical invoices remain untouched.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* EDIT CUSTOMER PROFILE DIALOG */}
      <Dialog open={isEditCustomerOpen} onOpenChange={setIsEditCustomerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Customer Details
            </DialogTitle>
            <DialogDescription>
              Update contact information and preferences for {customer.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCustomerDetails} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="custName" className="text-xs font-semibold">
                Customer Name *
              </Label>
              <Input
                id="custName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="custPhone" className="text-xs font-semibold">
                Phone Number *
              </Label>
              <Input
                id="custPhone"
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="custEmail" className="text-xs font-semibold">
                Email Address
              </Label>
              <Input
                id="custEmail"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="custAddr" className="text-xs font-semibold">
                Address
              </Label>
              <Input
                id="custAddr"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="custRef" className="text-xs font-semibold">
                Referral Source
              </Label>
              <Input
                id="custRef"
                value={editReferralSource}
                onChange={(e) => setEditReferralSource(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="custNotes" className="text-xs font-semibold">
                General Notes / Preferences
              </Label>
              <Textarea
                id="custNotes"
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditCustomerOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
