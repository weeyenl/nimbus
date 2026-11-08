"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Receipt,
  CreditCard,
  Plus,
  Trash2,
  Printer,
  Crown,
  HeartPulse,
  Sparkles,
  Copy,
  MessageCircle,
  ShieldAlert,
  StickyNote,
  History,
  Tag,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
  SKIN_CONDITIONS,
  ISSUE_LOCATIONS,
  formatPrice,
  roundCurrency,
  getInitials,
  getVaccinationStatus,
  normalizePhoneDigits,
} from "@/lib/utils";
import {
  getAppointments,
  updateAppointmentStatus,
  saveAppointment,
  deleteAppointment,
  getCustomers,
  getCustomerMembership,
  deductMembershipCredits,
  deductMembershipSession,
  deductPackageAddonAllowance,
  isMembershipExpired,
  getGroomingRecords,
  saveGroomingRecord,
  getPayments,
  savePayment,
  getAddons,
  getServices,
  getStaff,
  getSalonSettings,
  DEFAULT_SALON_SETTINGS,
  validatePromoCode,
  incrementPromoUsage,
  calculateServicePrice,
  findOverlappingAppointments,
  getStaffShiftForDate,
  isTimeWithinShift,
  getPetEffectiveVaccinationExpiry,
  localDateStr,
  newId,
  MockAppointment,
  MockCustomer,
  MockPet,
  MockService,
  MockStaff,
  CustomerMembership,
  GroomingRecord,
  PaymentRecord,
  PaymentInstallment,
  SalonSettings,
} from "@/lib/mock-data";
import { ServiceSelectItems } from "@/components/service-select-items";
import { showToast } from "@/components/ui/toast-system";
import type { UserRole } from "@/components/layout/app-shell";

export default function AppointmentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [role, setRole] = useState<UserRole>("OWNER");
  const [apt, setApt] = useState<MockAppointment | null>(null);
  const [customer, setCustomer] = useState<MockCustomer | undefined>();
  const [pet, setPet] = useState<MockPet | undefined>();
  const [status, setStatus] = useState<MockAppointment["status"]>("BOOKED");
  const [membership, setMembership] = useState<CustomerMembership | undefined>();
  const [existingRecord, setExistingRecord] = useState<GroomingRecord | undefined>();
  const [lastPastRecord, setLastPastRecord] = useState<GroomingRecord | undefined>();
  const [paymentRecord, setPaymentRecord] = useState<PaymentRecord | undefined>();
  const [services, setServices] = useState<MockService[]>([]);
  const [staffList, setStaffList] = useState<MockStaff[]>([]);
  const [salonSettings, setSalonSettings] = useState<SalonSettings>(DEFAULT_SALON_SETTINGS);

  // Modals & confirm dialogs
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSessionConfirmOpen, setIsSessionConfirmOpen] = useState(false);

  // Edit / Reschedule state
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editGroomerId, setEditGroomerId] = useState("");
  const [editServiceId, setEditServiceId] = useState("");
  const [editPetId, setEditPetId] = useState("");

  // Notes & Price state
  const [aptNotes, setAptNotes] = useState("");
  const [priceInput, setPriceInput] = useState<string>("0");
  const [selectedAddons, setSelectedAddons] = useState<
    { id: string; name: string; price: number; packageAllowanceId?: string }[]
  >([]);
  const [addonSelectValue, setAddonSelectValue] = useState<string>("");

  // Grooming Record Form state
  const [haircutStyle, setHaircutStyle] = useState("");
  const [bladeLength, setBladeLength] = useState("");
  const [selectedConditions, setSelectedConditions] = useState<string[]>(["Normal"]);
  const [skinNotes, setSkinNotes] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [healthNotes, setHealthNotes] = useState("");
  const [behaviour, setBehaviour] = useState("Calm and well-behaved");
  const [recommendation, setRecommendation] = useState("");

  // Checkout & POS state
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "CARD" | "PAYNOW" | "MEMBERSHIP_CREDIT" | "SESSION_PACKAGE"
  >("PAYNOW");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [manualDiscountType, setManualDiscountType] = useState<"NONE" | "FIXED" | "PERCENTAGE">("NONE");
  const [manualDiscountInput, setManualDiscountInput] = useState("");
  const [manualDiscountReason, setManualDiscountReason] = useState("");
  const [discountValue, setDiscountValue] = useState(0);

  const [collectPartial, setCollectPartial] = useState(false);
  const [partialAmountInput, setPartialAmountInput] = useState("");
  const [allowExpiredOverride, setAllowExpiredOverride] = useState(false);

  const loadData = () => {
    setRole((localStorage.getItem("nimbus_current_role") as UserRole | null) || "OWNER");
    setServices(getServices());
    setStaffList(getStaff().filter((s) => s.isActive !== false));
    setSalonSettings(getSalonSettings());

    const found = getAppointments().find((a) => a.id === params.id) || null;
    setApt(found);
    setLoaded(true);
    if (!found) return;

    setStatus(found.status);
    setPriceInput(String(found.servicePrice));
    setSelectedAddons(found.addOns || []);
    setAptNotes(found.notes || "");

    setEditDate(found.dateStr);
    setEditStartTime(found.startTime);
    setEditEndTime(found.endTime);
    setEditGroomerId(found.groomerId);
    setEditServiceId(found.serviceId);
    setEditPetId(found.petId);

    const cust = getCustomers().find((c) => c.id === found.customerId);
    setCustomer(cust);
    setPet(cust?.pets.find((p) => p.id === found.petId));

    const mem = getCustomerMembership(found.customerId);
    setMembership(mem);

    const records = getGroomingRecords(found.petId);
    const currentRec = records.find((r) => r.appointmentId === found.id);
    const pastRec = records.find((r) => r.appointmentId !== found.id);
    setLastPastRecord(pastRec);
    setExistingRecord(currentRec);

    if (currentRec) {
      setHaircutStyle(currentRec.haircutStyle || "");
      setBladeLength(currentRec.bladeGuardLength || "");
      setSelectedConditions(
        currentRec.skinConditions?.length ? currentRec.skinConditions : ["Normal"]
      );
      setSkinNotes(currentRec.skinConditionNotes || "");
      setSelectedLocations(currentRec.issueLocations || []);
      setHealthNotes(currentRec.healthObservations || "");
      setBehaviour(currentRec.behaviour || "Calm and well-behaved");
      setRecommendation(currentRec.recommendationToOwner || "");
    }

    const pay = getPayments().find((p) => p.appointmentId === found.id);
    setPaymentRecord(pay);
  };

  useEffect(() => {
    loadData();
    const onRefresh = () => loadData();
    window.addEventListener("nimbus-data-updated", onRefresh);
    window.addEventListener("nimbus-role-changed", onRefresh);
    return () => {
      window.removeEventListener("nimbus-data-updated", onRefresh);
      window.removeEventListener("nimbus-role-changed", onRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Pricing totals
  const servicePrice = useMemo(() => {
    const num = parseFloat(priceInput);
    return Number.isFinite(num) && num >= 0 ? roundCurrency(num) : apt?.servicePrice ?? 0;
  }, [priceInput, apt?.servicePrice]);

  const addOnsTotal = useMemo(
    () => roundCurrency(selectedAddons.reduce((sum, a) => sum + a.price, 0)),
    [selectedAddons]
  );

  const subtotal = roundCurrency(servicePrice + addOnsTotal);

  const isFullyPaid = Boolean(apt?.isPaid || paymentRecord?.status === "PAID");
  const priorPaidAmount = useMemo(() => {
    if (paymentRecord) {
      if (paymentRecord.status === "PAID") return paymentRecord.totalAmount;
      return roundCurrency(paymentRecord.depositAmount || 0);
    }
    return roundCurrency(apt?.depositPaid || 0);
  }, [paymentRecord, apt?.depositPaid]);

  const activeBillDiscount = paymentRecord ? paymentRecord.discountAmount : discountValue;
  const activeBillTotal = paymentRecord
    ? paymentRecord.totalAmount
    : Math.max(0, roundCurrency(subtotal - activeBillDiscount));

  // If paying via session package, base service fee drops to $0 (only add-ons remain chargeable)
  const effectiveServiceCharge =
    paymentMethod === "SESSION_PACKAGE" && !paymentRecord ? 0 : servicePrice;
  const checkoutSubtotal = roundCurrency(effectiveServiceCharge + addOnsTotal);
  const checkoutGrandTotal = paymentRecord
    ? paymentRecord.totalAmount
    : Math.max(0, roundCurrency(checkoutSubtotal - discountValue));
  const checkoutRemainingDue = Math.max(0, roundCurrency(checkoutGrandTotal - priorPaidAmount));

  const sessionApplicable = useMemo(() => {
    if (!membership || membership.packageType !== "SESSIONS" || !apt) return false;
    if ((membership.remainingSessions ?? 0) <= 0) return false;
    if (
      membership.applicableServiceIds &&
      membership.applicableServiceIds.length > 0 &&
      !membership.applicableServiceIds.includes(apt.serviceId)
    ) {
      return false;
    }
    return true;
  }, [membership, apt]);

  const membershipExpired = isMembershipExpired(membership);

  if (!loaded) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Loading appointment...
      </div>
    );
  }

  if (!apt) {
    return (
      <Card className="mx-auto max-w-md mt-8 shadow-sm">
        <CardHeader>
          <CardTitle>Appointment Not Found</CardTitle>
          <CardDescription>
            This booking may have been deleted or the link is no longer valid.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/calendar">Back to Calendar</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const vacStatus = pet
    ? getVaccinationStatus(getPetEffectiveVaccinationExpiry(pet))
    : null;
  const canEditFinancials = role !== "GROOMER" && !isFullyPaid;
  const canDeleteBooking = role === "OWNER" || role === "RECEPTIONIST";

  function handleStatusChange(newStatus: MockAppointment["status"]) {
    if (!apt) return;
    setStatus(newStatus);
    const updated: MockAppointment = { ...apt, status: newStatus };
    setApt(updated);
    updateAppointmentStatus(apt.id, newStatus);
    showToast(`Status updated to ${APPOINTMENT_STATUS_LABELS[newStatus]}.`, "success");

    // Prompt session deduction when marking DONE if eligible and not already deducted
    if (
      newStatus === "DONE" &&
      !apt.packageDeducted &&
      !apt.isPaid &&
      sessionApplicable &&
      (!membershipExpired || allowExpiredOverride)
    ) {
      setIsSessionConfirmOpen(true);
    }
  }

  function handleConfirmSessionDeduction() {
    if (!apt || !membership || apt.packageDeducted) {
      setIsSessionConfirmOpen(false);
      return;
    }
    const ok = deductMembershipSession(apt.customerId, apt.serviceId, {
      allowExpired: allowExpiredOverride,
      note: `Redeemed 1 session for ${apt.serviceName} (${apt.petName})`,
      appointmentId: apt.id,
    });
    if (!ok) {
      showToast("Could not deduct session (expired or incompatible service).", "error");
      setIsSessionConfirmOpen(false);
      return;
    }

    const updatedApt: MockAppointment = {
      ...apt,
      packageDeducted: true,
      packageDeductionId: membership.id,
    };
    saveAppointment(updatedApt);
    setApt(updatedApt);
    setMembership(getCustomerMembership(apt.customerId));
    setIsSessionConfirmOpen(false);
    showToast("Deducted 1 session from customer package.", "success");
  }

  function handleSaveNotes() {
    if (!apt) return;
    const clean = aptNotes.trim();
    if ((apt.notes || "") === clean) return;
    const updated: MockAppointment = { ...apt, notes: clean || undefined };
    saveAppointment(updated);
    setApt(updated);
    showToast("Appointment notes saved.", "success");
  }

  function handleCommitPrice() {
    if (!apt || !canEditFinancials) return;
    const parsed = parseFloat(priceInput);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setPriceInput(String(apt.servicePrice));
      showToast("Enter a valid non-negative price.", "error");
      return;
    }
    const clean = roundCurrency(parsed);
    setPriceInput(String(clean));
    if (clean === apt.servicePrice) return;
    const updated = { ...apt, servicePrice: clean };
    saveAppointment(updated);
    setApt(updated);
    showToast(`Service price updated to ${formatPrice(clean)}.`, "success");
  }

  function handleEditServiceOrStartChange(nextServiceId: string, nextStart: string) {
    const svc = services.find((s) => s.id === nextServiceId);
    if (!svc || !nextStart) return;
    const [h, m] = nextStart.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return;
    const endMins = Math.min(23 * 60 + 59, h * 60 + m + svc.duration);
    setEditEndTime(
      `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(
        endMins % 60
      ).padStart(2, "0")}`
    );
  }

  function handleSaveSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!apt) return;
    if (!editDate || !editStartTime || !editEndTime) {
      showToast("Date, start time and end time are required.", "error");
      return;
    }
    if (editEndTime <= editStartTime) {
      showToast("End time must be after start time.", "error");
      return;
    }

    const groomer = staffList.find((s) => s.id === editGroomerId) || staffList[0];
    const svc = services.find((s) => s.id === editServiceId);
    const chosenPet = customer?.pets.find((p) => p.id === editPetId) || pet;

    let updatedServiceName = apt.serviceName;
    let updatedDuration = apt.serviceDuration;
    let updatedPrice = apt.servicePrice;
    let updatedServiceId = apt.serviceId;

    if (!isFullyPaid && !paymentRecord && svc) {
      updatedServiceId = svc.id;
      updatedServiceName = svc.name;
      updatedDuration = svc.duration;
      if (svc.id !== apt.serviceId || chosenPet?.id !== apt.petId) {
        updatedPrice = calculateServicePrice(
          svc.id,
          chosenPet?.size || apt.petSize,
          chosenPet?.coatType || apt.petCoatType || "SHORT",
          chosenPet?.breed || apt.petBreed
        );
      }
    }

    const updatedApt: MockAppointment = {
      ...apt,
      dateStr: editDate,
      startTime: editStartTime,
      endTime: editEndTime,
      groomerId: groomer?.id || apt.groomerId,
      groomerName: groomer?.name || apt.groomerName,
      serviceId: updatedServiceId,
      serviceName: updatedServiceName,
      serviceDuration: updatedDuration,
      servicePrice: updatedPrice,
      petId: chosenPet?.id || apt.petId,
      petName: chosenPet?.name || apt.petName,
      petBreed: chosenPet?.breed || apt.petBreed,
      petSize: chosenPet?.size || apt.petSize,
      petCoatType: chosenPet?.coatType || apt.petCoatType,
    };

    saveAppointment(updatedApt);
    setApt(updatedApt);
    setPet(chosenPet);
    setPriceInput(String(updatedPrice));
    setIsRescheduleOpen(false);

    const overlaps = findOverlappingAppointments(
      updatedApt.groomerId,
      updatedApt.dateStr,
      updatedApt.startTime,
      updatedApt.endTime,
      updatedApt.id
    );
    const shift = getStaffShiftForDate(groomer, updatedApt.dateStr);
    const inShift = isTimeWithinShift(updatedApt.startTime, updatedApt.endTime, shift);

    if (overlaps.length > 0) {
      showToast(
        `Saved, but ${updatedApt.groomerName} overlaps with ${overlaps[0].petName} (${overlaps[0].startTime}).`,
        "warning"
      );
    } else if (!inShift) {
      showToast(
        `Saved, outside ${updatedApt.groomerName}'s shift (${shift}).`,
        "warning"
      );
    } else {
      showToast("Appointment updated!", "success");
    }
  }

  function handleDeleteBooking() {
    if (!apt) return;
    deleteAppointment(apt.id);
    setIsDeleteConfirmOpen(false);
    showToast("Appointment deleted.", "info");
    router.push("/calendar");
  }

  function handleAddAddon(addonId: string) {
    if (!apt || !canEditFinancials || !addonId) return;
    const addon = getAddons().find((a) => a.id === addonId);
    setAddonSelectValue("");
    if (!addon) return;
    if (selectedAddons.some((a) => a.id === addon.id)) {
      showToast(`${addon.name} is already added.`, "info");
      return;
    }

    const updated = [
      ...selectedAddons,
      { id: addon.id, name: addon.name, price: addon.price },
    ];
    setSelectedAddons(updated);
    const nextApt = { ...apt, addOns: updated };
    saveAppointment(nextApt);
    setApt(nextApt);
  }

  function handleUpdateAddonPrice(addonId: string, rawVal: string) {
    if (!apt || !canEditFinancials) return;
    const num = parseFloat(rawVal);
    if (!Number.isFinite(num) || num < 0) return;
    const clean = roundCurrency(num);
    const updated = selectedAddons.map((a) =>
      a.id === addonId ? { ...a, price: clean } : a
    );
    setSelectedAddons(updated);
    const nextApt = { ...apt, addOns: updated };
    saveAppointment(nextApt);
    setApt(nextApt);
  }

  function handleAddPackageVoucher(allowanceId: string, allowanceName: string) {
    if (!apt || !canEditFinancials || !membership) return;
    const allowance = membership.bonusAllowances.find((b) => b.id === allowanceId);
    if (!allowance || allowance.remaining <= 0) {
      showToast("No remaining vouchers for this perk.", "error");
      return;
    }
    if (membershipExpired && !allowExpiredOverride) {
      showToast("Membership package has expired.", "error");
      return;
    }
    const voucherId = `pkg_${allowanceId}`;
    if (selectedAddons.some((a) => a.id === voucherId)) return;

    const updated = [
      ...selectedAddons,
      {
        id: voucherId,
        name: `${allowanceName} (Package Voucher)`,
        price: 0,
        packageAllowanceId: allowanceId,
      },
    ];
    setSelectedAddons(updated);
    const nextApt = { ...apt, addOns: updated };
    saveAppointment(nextApt);
    setApt(nextApt);
  }

  function handleRemoveAddon(addonId: string) {
    if (!apt || !canEditFinancials) return;
    const updated = selectedAddons.filter((a) => a.id !== addonId);
    setSelectedAddons(updated);
    const nextApt = { ...apt, addOns: updated };
    saveAppointment(nextApt);
    setApt(nextApt);
  }

  function toggleSkinCondition(cond: string) {
    if (cond === "Normal") {
      setSelectedConditions(["Normal"]);
      return;
    }
    const withoutNormal = selectedConditions.filter((c) => c !== "Normal");
    if (withoutNormal.includes(cond)) {
      const next = withoutNormal.filter((c) => c !== cond);
      setSelectedConditions(next.length > 0 ? next : ["Normal"]);
    } else {
      setSelectedConditions([...withoutNormal, cond]);
    }
  }

  function handleCopyLastVisitStyle() {
    if (!lastPastRecord) return;
    if (lastPastRecord.haircutStyle) setHaircutStyle(lastPastRecord.haircutStyle);
    if (lastPastRecord.bladeGuardLength) setBladeLength(lastPastRecord.bladeGuardLength);
    showToast("Copied haircut style & blade length from last visit.", "info");
  }

  function handleSaveGroomingRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!apt) return;
    const newRecord: GroomingRecord = {
      id: existingRecord?.id || newId("gr"),
      appointmentId: apt.id,
      petId: apt.petId,
      dateStr: apt.dateStr,
      groomerName: apt.groomerName,
      serviceDone: apt.serviceName,
      haircutStyle: haircutStyle.trim() || undefined,
      bladeGuardLength: bladeLength.trim() || undefined,
      skinConditions: selectedConditions.length > 0 ? selectedConditions : ["Normal"],
      skinConditionNotes: skinNotes.trim() || undefined,
      issueLocations: selectedLocations,
      healthObservations: healthNotes.trim() || undefined,
      behaviour: behaviour.trim() || undefined,
      recommendationToOwner: recommendation.trim() || undefined,
    };

    saveGroomingRecord(newRecord);
    setExistingRecord(newRecord);
    setIsRecordOpen(false);
    showToast("Grooming & health record saved!", "success");

    if (status !== "DONE") {
      handleStatusChange("DONE");
    }
  }

  function applyPromoCode() {
    const res = validatePromoCode(discountCode, checkoutSubtotal);
    if (!res.valid || !res.promo) {
      showToast(res.reason || "Invalid promo code.", "error");
      return;
    }
    setAppliedPromoCode(res.promo.code);
    setManualDiscountType("NONE");
    setDiscountValue(res.discountAmount);
    showToast(
      `Applied ${res.promo.code}: -${formatPrice(res.discountAmount)} off!`,
      "success"
    );
  }

  function applyManualDiscount(type: "NONE" | "FIXED" | "PERCENTAGE", rawVal: string) {
    setManualDiscountType(type);
    setManualDiscountInput(rawVal);
    if (type === "NONE") {
      if (!appliedPromoCode) setDiscountValue(0);
      return;
    }
    setAppliedPromoCode(null);
    const val = parseFloat(rawVal);
    if (!Number.isFinite(val) || val <= 0) {
      setDiscountValue(0);
      return;
    }
    const calc =
      type === "PERCENTAGE"
        ? roundCurrency((checkoutSubtotal * Math.min(100, val)) / 100)
        : roundCurrency(Math.min(checkoutSubtotal, val));
    setDiscountValue(calc);
  }

  function openCheckout() {
    setDiscountValue(paymentRecord?.discountAmount || 0);
    setAppliedPromoCode(null);
    setDiscountCode("");
    setManualDiscountType("NONE");
    setManualDiscountInput("");
    setManualDiscountReason("");
    setCollectPartial(false);
    setPartialAmountInput("");
    setAllowExpiredOverride(false);

    if (paymentRecord?.status === "PARTIAL") {
      setPaymentMethod("PAYNOW");
    } else if (sessionApplicable && !apt?.packageDeducted && !membershipExpired) {
      setPaymentMethod("SESSION_PACKAGE");
    } else {
      setPaymentMethod("PAYNOW");
    }
    setIsCheckoutOpen(true);
  }

  function handleProcessPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!apt) return;
    if (isFullyPaid) {
      showToast("This appointment is already paid in full.", "info");
      return;
    }

    const nowTimeStr = `${localDateStr()} ${new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    // Determine installment amount being paid right now
    let amountThisPayment = checkoutRemainingDue;
    if (collectPartial && paymentMethod !== "SESSION_PACKAGE") {
      const parsedPartial = parseFloat(partialAmountInput);
      if (!Number.isFinite(parsedPartial) || parsedPartial <= 0) {
        showToast("Enter a valid partial payment amount greater than $0.", "error");
        return;
      }
      if (parsedPartial > checkoutRemainingDue) {
        showToast("Partial amount exceeds the remaining balance due.", "error");
        return;
      }
      amountThisPayment = roundCurrency(parsedPartial);
    }

    // Validate Session Package payment if selected
    if (paymentMethod === "SESSION_PACKAGE" && !paymentRecord) {
      if (!sessionApplicable || apt.packageDeducted) {
        showToast("Session package cannot be applied to this booking.", "error");
        return;
      }
      if (membershipExpired && !allowExpiredOverride) {
        showToast("Membership is expired. Check 'Override expired check' if approved.", "error");
        return;
      }
      const ok = deductMembershipSession(apt.customerId, apt.serviceId, {
        allowExpired: allowExpiredOverride,
        note: `Checkout redeemed 1 session for ${apt.serviceName} (${apt.petName})`,
        appointmentId: apt.id,
      });
      if (!ok) {
        showToast("Could not deduct session from customer package.", "error");
        return;
      }
    }

    // Validate Club Credits payment if selected
    if (paymentMethod === "MEMBERSHIP_CREDIT") {
      if (!membership) {
        showToast("Customer has no active membership.", "error");
        return;
      }
      if (membershipExpired && !allowExpiredOverride) {
        showToast("Membership credits have expired. Check override to allow anyway.", "error");
        return;
      }
      if (membership.remainingCredits < amountThisPayment) {
        showToast(
          `Insufficient club credits (${formatPrice(membership.remainingCredits)} available).`,
          "error"
        );
        return;
      }
      const ok = deductMembershipCredits(apt.customerId, amountThisPayment, {
        allowExpired: allowExpiredOverride,
        note: `Payment for ${apt.petName} (${apt.serviceName})`,
        appointmentId: apt.id,
      });
      if (!ok) {
        showToast("Could not deduct club credits.", "error");
        return;
      }
    }

    // Deduct redeemed vouchers once on first payment
    if (!paymentRecord) {
      for (const addon of selectedAddons) {
        if (addon.packageAllowanceId) {
          deductPackageAddonAllowance(
            apt.customerId,
            addon.packageAllowanceId,
            `Redeemed on ${apt.petName}'s appointment`,
            apt.id
          );
        }
      }
      if (appliedPromoCode) {
        incrementPromoUsage(appliedPromoCode);
      }
    }

    const totalPaidAfter = roundCurrency(priorPaidAmount + amountThisPayment);
    const newBalanceAfter = roundCurrency(Math.max(0, checkoutGrandTotal - totalPaidAfter));
    const settledInFull = newBalanceAfter <= 0;

    const installmentMethod: PaymentInstallment["method"] =
      paymentMethod === "SESSION_PACKAGE" ? "CASH" : paymentMethod;

    const newInstallment: PaymentInstallment | null =
      amountThisPayment > 0
        ? {
            id: newId("inst"),
            amount: amountThisPayment,
            method: installmentMethod,
            paidAt: nowTimeStr,
            note: settledInFull
              ? paymentRecord
                ? "Final balance"
                : "Full payment"
              : "Deposit / Partial payment",
          }
        : null;

    const existingInstallments = paymentRecord?.installments || [];
    const nextInstallments = newInstallment
      ? [...existingInstallments, newInstallment]
      : existingInstallments;

    const discountLabel = appliedPromoCode
      ? `Promo Code: ${appliedPromoCode}`
      : manualDiscountType !== "NONE"
      ? manualDiscountReason.trim() || "Custom Discount"
      : paymentRecord?.discountNote;

    const finalRecord: PaymentRecord = paymentRecord
      ? {
          ...paymentRecord,
          depositAmount: totalPaidAfter,
          balanceAmount: newBalanceAfter,
          paymentMethod:
            paymentMethod === "MEMBERSHIP_CREDIT"
              ? "MEMBERSHIP_CREDIT"
              : paymentMethod === "SESSION_PACKAGE"
              ? "CASH"
              : settledInFull
              ? paymentMethod
              : "DEPOSIT",
          membershipCreditsDeducted:
            (paymentRecord.membershipCreditsDeducted || 0) +
            (paymentMethod === "MEMBERSHIP_CREDIT" ? amountThisPayment : 0) ||
            undefined,
          installments: nextInstallments,
          paidAt: nowTimeStr,
          status: settledInFull ? "PAID" : "PARTIAL",
        }
      : {
          id: newId("pay"),
          appointmentId: apt.id,
          invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(
            100000 + Math.random() * 900000
          )}`,
          customerName: apt.customerName,
          customerPhone: apt.customerPhone,
          petName: apt.petName,
          serviceName:
            paymentMethod === "SESSION_PACKAGE"
              ? `${apt.serviceName} (Package Session)`
              : apt.serviceName,
          servicePrice: effectiveServiceCharge,
          addOns: selectedAddons.map((a) => ({ name: a.name, price: a.price })),
          discountAmount: discountValue,
          discountNote: discountLabel,
          subtotal: checkoutSubtotal,
          totalAmount: checkoutGrandTotal,
          depositAmount: settledInFull ? undefined : totalPaidAfter,
          balanceAmount: newBalanceAfter,
          paymentMethod:
            paymentMethod === "SESSION_PACKAGE"
              ? "CASH"
              : settledInFull
              ? paymentMethod
              : "DEPOSIT",
          membershipCreditsDeducted:
            paymentMethod === "MEMBERSHIP_CREDIT" ? amountThisPayment : undefined,
          installments: nextInstallments,
          paidAt: nowTimeStr,
          status: settledInFull ? "PAID" : "PARTIAL",
        };

    savePayment(finalRecord);
    setPaymentRecord(finalRecord);

    const nextApt: MockAppointment = {
      ...apt,
      servicePrice: effectiveServiceCharge,
      isPaid: settledInFull,
      depositPaid: totalPaidAfter,
      packageDeducted:
        apt.packageDeducted || paymentMethod === "SESSION_PACKAGE",
      status: settledInFull ? "DONE" : apt.status,
    };
    saveAppointment(nextApt);
    setApt(nextApt);
    setStatus(nextApt.status);
    setMembership(getCustomerMembership(apt.customerId));

    setIsCheckoutOpen(false);
    setIsReceiptOpen(true);
    showToast(
      settledInFull
        ? "Payment completed and marked as Done!"
        : `Collected ${formatPrice(amountThisPayment)}. Remaining balance: ${formatPrice(
            newBalanceAfter
          )}.`,
      "success"
    );
  }

  function handlePrintReceipt() {
    document.body.classList.add("printing-receipt");
    const cleanup = () => {
      document.body.classList.remove("printing-receipt");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    setTimeout(cleanup, 1500);
  }

  function buildReceiptText(): string {
    const recService = paymentRecord?.serviceName ?? apt?.serviceName ?? "";
    const recServicePrice = paymentRecord?.servicePrice ?? servicePrice;
    const recAddons = paymentRecord?.addOns ?? selectedAddons;
    const recDiscount = paymentRecord?.discountAmount ?? activeBillDiscount;
    const recTotal = paymentRecord?.totalAmount ?? activeBillTotal;
    const recBalance = paymentRecord?.balanceAmount ?? 0;

    const lines = [
      salonSettings.salonName,
      `${salonSettings.salonAddress} | Tel: ${salonSettings.salonPhone}`,
      `Invoice: ${paymentRecord?.invoiceNumber || "DRAFT"}`,
      `Date: ${paymentRecord?.paidAt || apt?.dateStr}`,
      `Customer: ${apt?.customerName} | Pet: ${apt?.petName} (${apt?.petBreed})`,
      `Groomer: ${apt?.groomerName}`,
      "---",
      `${recService}: ${formatPrice(recServicePrice)}`,
      ...recAddons.map((a) => `+ ${a.name}: ${formatPrice(a.price)}`),
      ...(recDiscount > 0 ? [`Discount: -${formatPrice(recDiscount)}`] : []),
      `TOTAL: ${formatPrice(recTotal)}`,
      ...(recBalance > 0
        ? [
            `Paid: ${formatPrice(roundCurrency(recTotal - recBalance))}`,
            `Balance Due: ${formatPrice(recBalance)}`,
          ]
        : [`Status: PAID (${paymentRecord?.paymentMethod || "SETTLED"})`]),
      "---",
      salonSettings.receiptFooter,
    ];
    return lines.join("\n");
  }

  async function handleCopyReceipt() {
    try {
      await navigator.clipboard.writeText(buildReceiptText());
      showToast("Receipt copied! Ready to paste into WhatsApp or SMS.", "success");
    } catch {
      showToast("Could not access clipboard on this browser.", "error");
    }
  }

  const phoneDigits = normalizePhoneDigits(apt.customerPhone);
  const whatsappHref = phoneDigits
    ? `https://wa.me/${phoneDigits.length === 8 ? `65${phoneDigits}` : phoneDigits}?text=${encodeURIComponent(
        buildReceiptText()
      )}`
    : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mt-0.5">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Appointment Details</h1>
              <Badge className={APPOINTMENT_STATUS_COLORS[status] || ""}>
                {APPOINTMENT_STATUS_LABELS[status]}
              </Badge>
              {isFullyPaid ? (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Paid
                </Badge>
              ) : paymentRecord?.status === "PARTIAL" ? (
                <Badge variant="warning" className="gap-1">
                  Partial ({formatPrice(paymentRecord.balanceAmount)} due)
                </Badge>
              ) : null}
              {membership?.hasQueuePriority && !membershipExpired && (
                <Badge variant="default" className="text-xs gap-1">
                  <Crown className="h-3 w-3" /> VIP Queue Priority
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-muted-foreground text-sm">
                {apt.dateStr} · {apt.startTime} – {apt.endTime} ({apt.groomerName})
              </p>
              {role !== "GROOMER" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs px-2 gap-1"
                  onClick={() => {
                    setEditDate(apt.dateStr);
                    setEditStartTime(apt.startTime);
                    setEditEndTime(apt.endTime);
                    setEditGroomerId(apt.groomerId);
                    setEditServiceId(apt.serviceId);
                    setEditPetId(apt.petId);
                    setIsRescheduleOpen(true);
                  }}
                >
                  <Clock className="h-3 w-3" /> Edit / Reschedule
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {paymentRecord && role !== "GROOMER" && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setIsReceiptOpen(true)}
            >
              <Receipt className="h-4 w-4" /> View Receipt
            </Button>
          )}

          {!isFullyPaid && role !== "GROOMER" && (
            <Button variant="default" size="sm" className="gap-1.5" onClick={openCheckout}>
              <DollarSign className="h-4 w-4" />
              {paymentRecord?.status === "PARTIAL"
                ? `Collect Balance (${formatPrice(paymentRecord.balanceAmount)})`
                : "Checkout & Pay"}
            </Button>
          )}

          {canDeleteBooking && !isFullyPaid && !paymentRecord && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
              onClick={() => setIsDeleteConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      {/* Real Pet Handling Warnings & Vaccination Alert */}
      {(pet?.warnings?.length || 0) > 0 && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
          <div className="flex items-center gap-2 font-semibold text-red-900">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            Handling &amp; Safety Warnings for {apt.petName}:
          </div>
          <ul className="mt-1.5 grid gap-1 sm:grid-cols-2 text-sm text-red-800">
            {pet!.warnings.map((w, i) => (
              <li key={i}>• {w}</li>
            ))}
          </ul>
        </div>
      )}

      {vacStatus && (vacStatus.status === "EXPIRED" || vacStatus.status === "EXPIRING_SOON") && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 flex items-center gap-2.5">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
          <span>
            <strong>Vaccination Notice:</strong> {apt.petName}&apos;s vaccine record shows{" "}
            <strong>{vacStatus.label}</strong>.
          </span>
        </div>
      )}

      {/* Action / Status & Record Strip */}
      <Card className="shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold">Appointment Status:</span>
            <Select
              value={status}
              onValueChange={(v) => handleStatusChange(v as MockAppointment["status"])}
            >
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

          <div className="flex flex-wrap items-center gap-2">
            {sessionApplicable && !apt.packageDeducted && !apt.isPaid && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 border-purple-300 text-purple-800 hover:bg-purple-50"
                onClick={() => setIsSessionConfirmOpen(true)}
              >
                <Ticket className="h-4 w-4" /> Deduct 1 Package Session
              </Button>
            )}
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

      {/* Grid: Customer/Pet & Service/Pricing */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer & Pet Details + Appointment Notes */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Customer, Pet &amp; Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Owner</p>
                {role === "GROOMER" ? (
                  <p className="font-medium mt-0.5">{apt.customerName}</p>
                ) : (
                  <Link
                    href={`/customers/${apt.customerId}`}
                    className="font-medium text-primary hover:underline flex flex-wrap items-center gap-1.5 mt-0.5"
                  >
                    <span>{apt.customerName}</span>
                    <span className="text-muted-foreground font-normal">
                      ({apt.customerPhone})
                    </span>
                  </Link>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Groomer</p>
                <p className="font-medium text-sm mt-0.5">✂ {apt.groomerName}</p>
              </div>
            </div>

            {membership && (
              <div
                className={`rounded-lg border p-3 flex items-center justify-between gap-2 ${
                  membershipExpired
                    ? "bg-amber-50 border-amber-200"
                    : "bg-primary/5 border-primary/20"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-sm">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <span>{membership.displayName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {membership.packageType === "SESSIONS" ? (
                      <>
                        Remaining:{" "}
                        <strong className="text-foreground">
                          {membership.remainingSessions ?? 0} / {membership.totalSessions ?? 0}
                        </strong>{" "}
                        sessions
                      </>
                    ) : (
                      <>
                        Balance:{" "}
                        <strong className="text-foreground">
                          {formatPrice(membership.remainingCredits)}
                        </strong>{" "}
                        / {formatPrice(membership.totalCredits)}
                      </>
                    )}
                  </p>
                </div>
                <Badge variant={membershipExpired ? "destructive" : "outline"} className="text-xs">
                  {membershipExpired ? `Expired ${membership.expiryDate}` : `Exp: ${membership.expiryDate}`}
                </Badge>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Avatar className="h-11 w-11 border shrink-0">
                {pet?.photoUrl && (
                  <AvatarImage src={pet.photoUrl} alt={apt.petName} className="object-cover" />
                )}
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {getInitials(apt.petName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Pet Profile</p>
                <Link
                  href={`/pets/${apt.petId}`}
                  className="font-semibold text-primary hover:underline block truncate"
                >
                  {apt.petName} — {apt.petBreed} ({apt.petSize})
                </Link>
              </div>
            </div>

            {/* Editable Appointment Notes */}
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="apt-notes" className="text-xs font-semibold flex items-center gap-1.5">
                  <StickyNote className="h-3.5 w-3.5 text-amber-600" />
                  Appointment Notes &amp; Requests
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs px-2 text-primary"
                  onClick={handleSaveNotes}
                >
                  Save Notes
                </Button>
              </div>
              <Textarea
                id="apt-notes"
                value={aptNotes}
                onChange={(e) => setAptNotes(e.target.value)}
                onBlur={handleSaveNotes}
                placeholder="Notes for groomer or front desk (e.g. scissor face only, owner picks up at 3pm)..."
                rows={2}
                className="text-xs"
              />
            </div>

            {/* Last Visit Reference */}
            {lastPastRecord && (
              <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-foreground">
                  <History className="h-3.5 w-3.5 text-primary" />
                  Last Visit Reference ({lastPastRecord.dateStr} · {lastPastRecord.serviceDone})
                </p>
                {lastPastRecord.haircutStyle && (
                  <p>
                    <span className="text-muted-foreground">Style:</span>{" "}
                    <strong>{lastPastRecord.haircutStyle}</strong>
                    {lastPastRecord.bladeGuardLength && ` (${lastPastRecord.bladeGuardLength})`}
                  </p>
                )}
                {lastPastRecord.healthObservations && (
                  <p className="text-muted-foreground">{lastPastRecord.healthObservations}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service, Add-ons & Pricing Breakdown */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scissors className="h-5 w-5" />
              Service &amp; Pricing
            </CardTitle>
            <CardDescription>
              {isFullyPaid
                ? "Locked after full payment."
                : role === "GROOMER"
                ? "Service summary and add-on treatments."
                : "Service fee, custom pricing, add-ons, and vouchers."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3 gap-3">
              <div>
                <p className="font-semibold text-sm">{apt.serviceName}</p>
                <p className="text-xs text-muted-foreground">
                  {apt.serviceDuration} minutes
                  {apt.packageDeducted && " · Package session applied"}
                </p>
              </div>
              {role !== "GROOMER" && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.50"
                    min="0"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    onBlur={handleCommitPrice}
                    disabled={!canEditFinancials}
                    className="w-24 text-right h-8"
                  />
                </div>
              )}
            </div>

            {/* Package Vouchers */}
            {canEditFinancials &&
              membership?.bonusAllowances &&
              membership.bonusAllowances.some((b) => b.remaining > 0) && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      {membership.displayName} Add-on Vouchers
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Billed at $0.00
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {membership.bonusAllowances
                      .filter((b) => b.remaining > 0)
                      .map((allowance) => {
                        const isAdded = selectedAddons.some(
                          (a) => a.id === `pkg_${allowance.id}`
                        );
                        return (
                          <div
                            key={allowance.id}
                            className="flex items-center justify-between text-xs bg-background p-2 rounded border gap-2"
                          >
                            <div className="min-w-0">
                              <span className="font-semibold block truncate">
                                {allowance.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {allowance.remaining} of {allowance.total} left
                              </span>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant={isAdded ? "secondary" : "default"}
                              className="h-7 text-xs gap-1 font-semibold shrink-0"
                              disabled={isAdded}
                              onClick={() =>
                                handleAddPackageVoucher(allowance.id, allowance.name)
                              }
                            >
                              {isAdded ? "Added ($0)" : "+ Redeem"}
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

            {/* Add-ons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Add-ons &amp; Extra Charges
                </span>
                {canEditFinancials && (
                  <Select value={addonSelectValue} onValueChange={handleAddAddon}>
                    <SelectTrigger className="w-40 h-7 text-xs">
                      <Plus className="mr-1 h-3 w-3" />
                      <SelectValue placeholder="Add extra..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getAddons().map((addon) => (
                        <SelectItem key={addon.id} value={addon.id}>
                          {addon.name} (+{formatPrice(addon.price)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedAddons.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No add-ons selected.</p>
              ) : (
                selectedAddons.map((addon) => (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between gap-2 text-xs rounded-md bg-muted/60 p-2"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{addon.name}</span>
                      {addon.price === 0 && (
                        <Badge variant="success" className="text-[10px] py-0 px-1.5 shrink-0">
                          Free Voucher
                        </Badge>
                      )}
                    </div>
                    {role !== "GROOMER" && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {canEditFinancials && !addon.packageAllowanceId ? (
                          <div className="flex items-center gap-0.5">
                            <span className="text-muted-foreground">$</span>
                            <Input
                              type="number"
                              step="0.50"
                              min="0"
                              defaultValue={addon.price}
                              onBlur={(e) => handleUpdateAddonPrice(addon.id, e.target.value)}
                              className="w-16 h-6 text-right text-xs px-1.5"
                            />
                          </div>
                        ) : (
                          <span className="font-semibold">
                            {addon.price === 0 ? "$0.00" : `+${formatPrice(addon.price)}`}
                          </span>
                        )}
                        {canEditFinancials && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => handleRemoveAddon(addon.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {role !== "GROOMER" && (
              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex items-center justify-between font-bold">
                  <span>Bill Total</span>
                  <span className="text-lg text-primary">
                    {formatPrice(paymentRecord ? paymentRecord.totalAmount : subtotal)}
                  </span>
                </div>
                {priorPaidAmount > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Paid / Deposit Collected</span>
                    <span>-{formatPrice(priorPaidAmount)}</span>
                  </div>
                )}
                {!isFullyPaid && priorPaidAmount > 0 && (
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
                    <span>Remaining Balance Due</span>
                    <span>
                      {formatPrice(
                        Math.max(0, roundCurrency(activeBillTotal - priorPaidAmount))
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* MODAL 1: GROOMING RECORD MODAL */}
      <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
              <DialogTitle className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-primary" />
                Grooming &amp; Health Record
              </DialogTitle>
              {lastPastRecord && (lastPastRecord.haircutStyle || lastPastRecord.bladeGuardLength) && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={handleCopyLastVisitStyle}
                >
                  <History className="h-3 w-3" /> Copy Last Style
                </Button>
              )}
            </div>
            <DialogDescription>
              Record haircut style, blade length, skin conditions, and health notes for {apt.petName}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveGroomingRecord} className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Haircut / Style Used</Label>
                <Input
                  placeholder="e.g. Teddy bear cut, scissor face"
                  value={haircutStyle}
                  onChange={(e) => setHaircutStyle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Blade / Guard Length</Label>
                <Input
                  placeholder="e.g. #10 body, 1/2 guard"
                  value={bladeLength}
                  onChange={(e) => setBladeLength(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Skin &amp; Coat Condition (Multi-select)</Label>
              <div className="flex flex-wrap gap-1.5">
                {SKIN_CONDITIONS.map((cond) => {
                  const isSelected = selectedConditions.includes(cond);
                  return (
                    <Badge
                      key={cond}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer py-1 px-2.5 text-xs select-none"
                      onClick={() => toggleSkinCondition(cond)}
                    >
                      {cond}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Skin Condition Details / Free-Text Notes</Label>
              <Textarea
                placeholder="Describe severity, patch size, or specific coat/skin notes..."
                value={skinNotes}
                onChange={(e) => setSkinNotes(e.target.value)}
                rows={2}
              />
            </div>

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
                  placeholder="e.g. Medicated bath next visit, vet check for ears"
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

      {/* MODAL 2: CHECKOUT & PAYMENT MODAL */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Checkout &amp; Payment
            </DialogTitle>
            <DialogDescription>
              Settle full payment, package redemption, or deposit for {apt.petName}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProcessPayment} className="space-y-4 pt-2">
            {/* Bill Summary */}
            <div className="rounded-lg bg-muted/60 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>
                  {apt.serviceName}
                  {paymentMethod === "SESSION_PACKAGE" && !paymentRecord && " (Package Session)"}
                </span>
                <span>{formatPrice(effectiveServiceCharge)}</span>
              </div>
              {selectedAddons.map((a) => (
                <div key={a.id} className="flex justify-between text-muted-foreground">
                  <span>+ {a.name}</span>
                  <span>{formatPrice(a.price)}</span>
                </div>
              ))}
              {discountValue > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>
                    Discount
                    {appliedPromoCode
                      ? ` (${appliedPromoCode})`
                      : manualDiscountReason
                      ? ` (${manualDiscountReason})`
                      : ""}
                  </span>
                  <span>-{formatPrice(discountValue)}</span>
                </div>
              )}
              {priorPaidAmount > 0 && (
                <div className="flex justify-between text-blue-700 font-medium">
                  <span>Less Deposit / Already Paid</span>
                  <span>-{formatPrice(priorPaidAmount)}</span>
                </div>
              )}
              <div className="border-t pt-1.5 flex justify-between font-bold text-sm text-foreground">
                <span>Balance Due Now</span>
                <span className="text-primary">{formatPrice(checkoutRemainingDue)}</span>
              </div>
            </div>

            {/* Promo Code + Custom Discount (only before initial payment finalized) */}
            {!paymentRecord && (
              <div className="space-y-2.5">
                <div className="flex gap-2">
                  <Input
                    placeholder="Promo code (e.g. WELCOME10, GROOM15)"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="text-xs h-9"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={applyPromoCode}>
                    Apply
                  </Button>
                </div>

                <div className="rounded-lg border p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium flex items-center gap-1 text-muted-foreground">
                      <Tag className="h-3.5 w-3.5" /> Custom Discount
                    </span>
                    <div className="flex gap-1">
                      {(["NONE", "FIXED", "PERCENTAGE"] as const).map((t) => (
                        <Button
                          key={t}
                          type="button"
                          size="sm"
                          variant={manualDiscountType === t ? "default" : "ghost"}
                          className="h-6 text-[11px] px-2"
                          onClick={() => applyManualDiscount(t, manualDiscountInput)}
                        >
                          {t === "NONE" ? "None" : t === "FIXED" ? "$ Off" : "% Off"}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {manualDiscountType !== "NONE" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder={manualDiscountType === "PERCENTAGE" ? "e.g. 10%" : "e.g. $5"}
                        value={manualDiscountInput}
                        onChange={(e) =>
                          applyManualDiscount(manualDiscountType, e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                      <Input
                        placeholder="Reason (optional)"
                        value={manualDiscountReason}
                        onChange={(e) => setManualDiscountReason(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

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
                  Card / NETS
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
                  disabled={!membership || membership.packageType === "SESSIONS"}
                  className="text-xs justify-start"
                >
                  Club Credits
                </Button>
              </div>

              {sessionApplicable && !paymentRecord && !apt.packageDeducted && (
                <Button
                  type="button"
                  variant={paymentMethod === "SESSION_PACKAGE" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setPaymentMethod("SESSION_PACKAGE");
                    setCollectPartial(false);
                  }}
                  className="w-full text-xs justify-start gap-1.5 border-purple-300"
                >
                  <Ticket className="h-3.5 w-3.5" />
                  Redeem 1 Package Session ({membership?.remainingSessions ?? 0} left)
                </Button>
              )}

              {(paymentMethod === "MEMBERSHIP_CREDIT" ||
                paymentMethod === "SESSION_PACKAGE") &&
                membership && (
                  <div
                    className={`rounded-md border p-2.5 text-xs space-y-1.5 ${
                      membershipExpired
                        ? "border-destructive/50 bg-red-50 text-red-900"
                        : "border-primary/30 bg-primary/5"
                    }`}
                  >
                    <p className="font-semibold">
                      {membership.displayName}{" "}
                      {membershipExpired && `— EXPIRED (${membership.expiryDate})`}
                    </p>
                    {paymentMethod === "MEMBERSHIP_CREDIT" ? (
                      <p className="text-muted-foreground">
                        Current: {formatPrice(membership.remainingCredits)} · After:{" "}
                        {formatPrice(membership.remainingCredits - checkoutRemainingDue)}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        Remaining sessions: {membership.remainingSessions ?? 0} →{" "}
                        {Math.max(0, (membership.remainingSessions ?? 0) - 1)}. Add-on charges
                        still apply if any.
                      </p>
                    )}

                    {membershipExpired && (
                      <label className="flex items-center gap-2 pt-1 font-medium cursor-pointer">
                        <Switch
                          checked={allowExpiredOverride}
                          onCheckedChange={setAllowExpiredOverride}
                        />
                        Allow expired package override (Manager approved)
                      </label>
                    )}
                  </div>
                )}
            </div>

            {/* Optional Partial Payment */}
            {paymentMethod !== "SESSION_PACKAGE" && checkoutRemainingDue > 0 && (
              <div className="rounded-lg border p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium cursor-pointer">
                    Record Partial Payment / Deposit Instead
                  </Label>
                  <Switch checked={collectPartial} onCheckedChange={setCollectPartial} />
                </div>
                {collectPartial && (
                  <div className="space-y-1">
                    <Input
                      type="number"
                      step="0.50"
                      min="0.50"
                      max={checkoutRemainingDue}
                      placeholder={`Max ${formatPrice(checkoutRemainingDue)}`}
                      value={partialAmountInput}
                      onChange={(e) => setPartialAmountInput(e.target.value)}
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCheckoutOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {collectPartial ? "Record Partial Payment" : "Complete & View Receipt"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: INVOICE / RECEIPT VIEWER */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <div className="print-area p-4 border rounded-xl bg-white text-black space-y-4 print:border-none print:p-0">
            <div className="text-center border-b pb-3 space-y-1">
              <h2 className="text-xl font-bold tracking-tight">
                {salonSettings.salonName}
              </h2>
              <p className="text-xs text-neutral-600">{salonSettings.salonAddress}</p>
              <p className="text-xs text-neutral-600">Tel: {salonSettings.salonPhone}</p>
              <Badge variant="outline" className="mt-1 text-[10px] border-neutral-300 text-black">
                {paymentRecord?.invoiceNumber || "DRAFT-INVOICE"}
              </Badge>
            </div>

            <div className="text-xs space-y-1 border-b pb-3">
              <div className="flex justify-between">
                <span className="text-neutral-500">Date:</span>
                <span>{paymentRecord?.paidAt || apt.dateStr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Customer:</span>
                <span className="font-semibold">{apt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Pet:</span>
                <span>
                  {apt.petName} ({apt.petBreed})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Groomer:</span>
                <span>{apt.groomerName}</span>
              </div>
            </div>

            {/* Frozen line items from paymentRecord when available */}
            <div className="text-xs space-y-1.5 border-b pb-3">
              <div className="flex justify-between font-semibold">
                <span>{paymentRecord?.serviceName || apt.serviceName}</span>
                <span>
                  {formatPrice(paymentRecord ? paymentRecord.servicePrice : servicePrice)}
                </span>
              </div>
              {(paymentRecord?.addOns || selectedAddons).map((addon, idx) => (
                <div key={idx} className="flex justify-between text-neutral-600">
                  <span>+ {addon.name}</span>
                  <span>{formatPrice(addon.price)}</span>
                </div>
              ))}
              {(paymentRecord ? paymentRecord.discountAmount : activeBillDiscount) > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>
                    {paymentRecord?.discountNote || "Discount"}
                  </span>
                  <span>
                    -{formatPrice(paymentRecord ? paymentRecord.discountAmount : activeBillDiscount)}
                  </span>
                </div>
              )}
            </div>

            <div className="text-xs space-y-1.5">
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL BILL</span>
                <span>{formatPrice(paymentRecord?.totalAmount ?? activeBillTotal)}</span>
              </div>
              {paymentRecord?.installments && paymentRecord.installments.length > 0 && (
                <div className="border-t pt-1.5 space-y-1 text-[11px] text-neutral-600">
                  {paymentRecord.installments.map((inst) => (
                    <div key={inst.id} className="flex justify-between">
                      <span>
                        {inst.note || "Payment"} ({inst.method} · {inst.paidAt})
                      </span>
                      <span className="font-medium text-black">{formatPrice(inst.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              {paymentRecord?.status === "PARTIAL" ? (
                <div className="flex justify-between font-bold text-amber-700 pt-1">
                  <span>BALANCE DUE</span>
                  <span>{formatPrice(paymentRecord.balanceAmount)}</span>
                </div>
              ) : (
                <div className="flex justify-between text-neutral-600">
                  <span>Status:</span>
                  <span className="font-semibold text-black">
                    PAID ({paymentRecord?.paymentMethod || "SETTLED"})
                  </span>
                </div>
              )}
            </div>

            <div className="text-center text-[10px] text-neutral-500 border-t pt-3">
              {salonSettings.receiptFooter}
            </div>
          </div>

          <DialogFooter className="no-print flex-wrap gap-2 sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrintReceipt}>
                <Printer className="h-4 w-4" /> Print
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopyReceipt}>
                <Copy className="h-4 w-4" /> Copy Text
              </Button>
              {whatsappHref && (
                <Button asChild variant="outline" size="sm" className="gap-1.5 text-emerald-700">
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </Button>
              )}
            </div>
            <Button size="sm" onClick={() => setIsReceiptOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit / Reschedule Modal */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit &amp; Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Update date, time, groomer{!isFullyPaid && !paymentRecord ? ", service, or pet" : ""}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSchedule} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Start Time</Label>
                <Input
                  type="time"
                  value={editStartTime}
                  onChange={(e) => {
                    setEditStartTime(e.target.value);
                    handleEditServiceOrStartChange(editServiceId, e.target.value);
                  }}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">End Time</Label>
                <Input
                  type="time"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            {!isFullyPaid && !paymentRecord && (
              <>
                <div>
                  <Label className="text-xs">Service</Label>
                  <Select
                    value={editServiceId}
                    onValueChange={(val) => {
                      setEditServiceId(val);
                      handleEditServiceOrStartChange(val, editStartTime);
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <ServiceSelectItems services={services} />
                    </SelectContent>
                  </Select>
                </div>

                {customer && customer.pets.length > 0 && (
                  <div>
                    <Label className="text-xs">Pet</Label>
                    <Select value={editPetId} onValueChange={setEditPetId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {customer.pets.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.breed})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            <div>
              <Label className="text-xs">Assigned Groomer / Staff</Label>
              <Select value={editGroomerId} onValueChange={setEditGroomerId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select staff..." />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRescheduleOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Appointment */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the booking for <strong>{apt.petName}</strong> on{" "}
              {apt.dateStr} at {apt.startTime}. You can also mark it as Cancelled instead to keep
              history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBooking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Session Deduction */}
      <AlertDialog open={isSessionConfirmOpen} onOpenChange={setIsSessionConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deduct 1 Session from Package?</AlertDialogTitle>
            <AlertDialogDescription>
              {apt.customerName} has <strong>{membership?.remainingSessions ?? 0}</strong>{" "}
              remaining session(s) on <strong>{membership?.displayName}</strong>. Deduct 1 session
              for this {apt.serviceName} visit?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not Now</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSessionDeduction}>
              Deduct 1 Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
