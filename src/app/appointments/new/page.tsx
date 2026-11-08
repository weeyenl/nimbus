"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  ShieldAlert,
  Crown,
  Clock,
  CreditCard,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getServices,
  getStaff,
  getCustomers,
  getCustomerMembership,
  saveAppointment,
  recordAppointmentDeposit,
  calculateServicePrice,
  localDateStr,
  newId,
  getStaffShiftForDate,
  isTimeWithinShift,
  findOverlappingAppointments,
  getPetEffectiveVaccinationExpiry,
  isMembershipExpired,
  MockCustomer,
  MockService,
  MockStaff,
  MockAppointment,
} from "@/lib/mock-data";
import { ServiceSelectItems } from "@/components/service-select-items";
import { CustomerCombobox } from "@/components/customer-combobox";
import { formatPrice, getVaccinationStatus } from "@/lib/utils";
import { showToast } from "@/components/ui/toast-system";
import Link from "next/link";

function NewAppointmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawDate = searchParams?.get("date") || "";
  const rawTime = searchParams?.get("time") || "";

  let parsedDate = "";
  let parsedTime = rawTime;
  if (rawDate) {
    if (rawDate.includes("T")) {
      const [d, t] = rawDate.split("T");
      parsedDate = d;
      if (!parsedTime && t) parsedTime = t.slice(0, 5);
    } else {
      parsedDate = rawDate.slice(0, 10);
    }
  }

  const initialDate = parsedDate || localDateStr();
  const initialTime = parsedTime || "10:00";
  const presetCustomerId = searchParams?.get("customerId") || "";
  const presetPetId = searchParams?.get("petId") || "";

  const [customers, setCustomers] = useState<MockCustomer[]>([]);
  const [allStaff, setAllStaff] = useState<MockStaff[]>([]);
  const [services, setServices] = useState<MockService[]>([]);
  const [showAllStaff, setShowAllStaff] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedGroomerId, setSelectedGroomerId] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>(initialDate);
  const [startTime, setStartTime] = useState<string>(initialTime);
  const [notes, setNotes] = useState<string>("");

  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [customPrice, setCustomPrice] = useState<string>("");

  const [collectDeposit, setCollectDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>("20");
  const [depositMethod, setDepositMethod] = useState<"PAYNOW" | "CASH" | "CARD">("PAYNOW");

  const [error, setError] = useState("");

  useEffect(() => {
    const custs = getCustomers();
    setCustomers(custs);
    const initial = custs.find((c) => c.id === presetCustomerId) || custs[0];
    if (initial) {
      setSelectedCustomerId(initial.id);
      const preset = initial.pets.find((p) => p.id === presetPetId);
      setSelectedPetId((preset || initial.pets[0])?.id || "");
    }

    const svcs = getServices();
    setServices(svcs);
    if (svcs.length > 0) setSelectedServiceId(svcs[0].id);

    const activeStaff = getStaff().filter((s) => s.isActive !== false);
    setAllStaff(activeStaff);
    const defaultGroomer =
      activeStaff.find((s) => s.role === "GROOMER") || activeStaff[0];
    if (defaultGroomer) setSelectedGroomerId(defaultGroomer.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayedStaff = useMemo(() => {
    if (showAllStaff) return allStaff;
    const groomers = allStaff.filter((s) => s.role === "GROOMER");
    return groomers.length > 0 ? groomers : allStaff;
  }, [allStaff, showAllStaff]);

  useEffect(() => {
    if (
      displayedStaff.length > 0 &&
      !displayedStaff.some((s) => s.id === selectedGroomerId)
    ) {
      setSelectedGroomerId(displayedStaff[0].id);
    }
  }, [displayedStaff, selectedGroomerId]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const selectedPet = selectedCustomer?.pets.find((p) => p.id === selectedPetId);
  const selectedService = services.find((s) => s.id === selectedServiceId);
  const selectedGroomer = allStaff.find((g) => g.id === selectedGroomerId);
  const membership = selectedCustomer
    ? getCustomerMembership(selectedCustomer.id)
    : undefined;

  const matrixPrice =
    selectedService && selectedPet
      ? calculateServicePrice(
          selectedService.id,
          selectedPet.size,
          selectedPet.coatType,
          selectedPet.breed
        )
      : selectedService?.basePrice ?? 0;

  const finalPrice = useCustomPrice
    ? Math.max(0, Number.isFinite(parseFloat(customPrice)) ? parseFloat(customPrice) : matrixPrice)
    : matrixPrice;

  // Compute safe same-day endTime
  const computedEndTime = useMemo(() => {
    if (!selectedService || !startTime) return startTime;
    const [h, m] = startTime.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return startTime;
    const endMinutes = Math.min(23 * 60 + 59, h * 60 + m + selectedService.duration);
    return `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(
      endMinutes % 60
    ).padStart(2, "0")}`;
  }, [selectedService, startTime]);

  const groomerShift = selectedGroomer
    ? getStaffShiftForDate(selectedGroomer, dateStr)
    : "";
  const withinShift = selectedGroomer
    ? isTimeWithinShift(startTime, computedEndTime, groomerShift)
    : true;
  const overlapping = selectedGroomer
    ? findOverlappingAppointments(selectedGroomer.id, dateStr, startTime, computedEndTime)
    : [];

  const vacStatus = selectedPet
    ? getVaccinationStatus(getPetEffectiveVaccinationExpiry(selectedPet))
    : null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!selectedCustomer) return setError("Please select a customer.");
    if (!selectedPet)
      return setError(
        "Please select a pet. If this customer has no pets yet, add one first."
      );
    if (!selectedService) return setError("Please select a service.");
    if (!selectedGroomer)
      return setError(
        "Please select a groomer. Add one under Staff & Shifts if the list is empty."
      );
    if (!dateStr || !startTime) return setError("Please select date and start time.");

    const depVal = collectDeposit ? parseFloat(depositAmount) : 0;
    if (collectDeposit && (!Number.isFinite(depVal) || depVal <= 0)) {
      return setError("Enter a valid deposit amount greater than $0.");
    }
    if (collectDeposit && depVal > finalPrice) {
      return setError("Deposit cannot exceed the service price.");
    }

    const newApt: MockAppointment = {
      id: newId("apt"),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      petId: selectedPet.id,
      petName: selectedPet.name,
      petBreed: selectedPet.breed,
      petSize: selectedPet.size,
      petCoatType: selectedPet.coatType,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      serviceDuration: selectedService.duration,
      servicePrice: finalPrice,
      groomerId: selectedGroomer.id,
      groomerName: selectedGroomer.name,
      status: "BOOKED",
      isWalkIn: false,
      notes: notes.trim() || undefined,
      dateStr,
      startTime,
      endTime: computedEndTime,
      depositPaid: collectDeposit ? depVal : undefined,
      depositMethod: collectDeposit ? depositMethod : undefined,
    };

    saveAppointment(newApt);
    if (collectDeposit && depVal > 0) {
      recordAppointmentDeposit(newApt, depVal, depositMethod, "Booking deposit");
    }

    showToast(
      `Booked ${selectedPet.name} (${selectedService.name}) on ${dateStr} at ${startTime}.`,
      "success"
    );
    router.push("/calendar");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Appointment</h1>
          <p className="text-muted-foreground">Book a scheduled grooming session</p>
        </div>
      </div>

      <Card className="mx-auto max-w-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
          <CardDescription>
            Search customer, pick pet, service, groomer, and optional deposit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Customer *</Label>
                <Link
                  href="/customers/new"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  + Add New Customer
                </Link>
              </div>
              <CustomerCombobox
                customers={customers}
                value={selectedCustomerId}
                onChange={(val) => {
                  setSelectedCustomerId(val);
                  const cust = customers.find((c) => c.id === val);
                  setSelectedPetId(cust && cust.pets.length > 0 ? cust.pets[0].id : "");
                }}
              />
            </div>

            {membership && (
              <div
                className={`rounded-lg border p-2.5 text-xs flex items-center justify-between gap-2 ${
                  isMembershipExpired(membership)
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-purple-50 border-purple-200 text-purple-900"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Crown className="h-4 w-4 shrink-0" />
                  <span className="truncate font-medium">
                    {membership.displayName}
                    {membership.hasQueuePriority && " (Queue Priority)"}
                  </span>
                </div>
                <div className="shrink-0 font-semibold">
                  {membership.packageType === "SESSIONS"
                    ? `${membership.remainingSessions ?? 0}/${membership.totalSessions ?? 0} sessions left`
                    : `${formatPrice(membership.remainingCredits)} credits`}
                  {isMembershipExpired(membership) && " · EXPIRED"}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Pet *</Label>
              <Select
                value={selectedPetId}
                onValueChange={setSelectedPetId}
                disabled={!selectedCustomer || selectedCustomer.pets.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a pet" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCustomer?.pets.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.name} ({pet.breed} · {pet.size} · {pet.coatType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCustomer && selectedCustomer.pets.length === 0 && (
                <p className="text-xs text-destructive">
                  {selectedCustomer.name} has no pets yet.{" "}
                  <Link href={`/customers/${selectedCustomer.id}/pets/new`} className="underline">
                    Add a pet
                  </Link>{" "}
                  before booking.
                </p>
              )}
            </div>

            {/* Pet Handling Warnings & Vaccination Alert */}
            {selectedPet &&
              (selectedPet.warnings.length > 0 ||
                vacStatus?.status === "EXPIRED" ||
                vacStatus?.status === "EXPIRING_SOON") && (
                <div className="space-y-2">
                  {selectedPet.warnings.length > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900 space-y-1">
                      <p className="font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                        Handling Alerts for {selectedPet.name}:
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {selectedPet.warnings.map((w, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="bg-white/80 text-red-800 border-red-300 text-[11px]"
                          >
                            {w}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {vacStatus &&
                    (vacStatus.status === "EXPIRED" || vacStatus.status === "EXPIRING_SOON") && (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>
                          <strong>Vaccination notice:</strong> {vacStatus.label}
                        </span>
                      </div>
                    )}
                </div>
              )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Service *</Label>
                <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    <ServiceSelectItems services={services} />
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Assigned Groomer *</Label>
                  <button
                    type="button"
                    onClick={() => setShowAllStaff((v) => !v)}
                    className="text-[11px] text-primary hover:underline"
                  >
                    {showAllStaff ? "Groomers only" : "Show all staff"}
                  </button>
                </div>
                <Select value={selectedGroomerId} onValueChange={setSelectedGroomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select groomer" />
                  </SelectTrigger>
                  <SelectContent>
                    {displayedStaff.map((groomer) => (
                      <SelectItem key={groomer.id} value={groomer.id}>
                        ✂ {groomer.name} ({getStaffShiftForDate(groomer, dateStr)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {allStaff.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No active staff — add one under Staff &amp; Shifts.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Start Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Live Shift & Overlap Conflict Warnings */}
            {selectedGroomer && (!withinShift || overlapping.length > 0) && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
                {!withinShift && (
                  <p className="flex items-center gap-1.5 font-medium">
                    <Clock className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                    {selectedGroomer.name}&apos;s shift on {dateStr} is{" "}
                    <strong>{groomerShift}</strong> (outside selected {startTime}–{computedEndTime}).
                  </p>
                )}
                {overlapping.length > 0 && (
                  <p className="flex items-center gap-1.5 font-medium text-red-800">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                    Overlap alert: {selectedGroomer.name} is already booked with{" "}
                    <strong>{overlapping.map((o) => `${o.petName} (${o.startTime}–${o.endTime})`).join(", ")}</strong>.
                  </p>
                )}
              </div>
            )}

            {/* Summary & Optional Price Override */}
            {selectedService && (
              <div className="rounded-lg border bg-muted/40 p-3.5 text-sm space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">
                      Duration: {selectedService.duration} mins ({startTime} – {computedEndTime})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Matrix Quote: <strong>{formatPrice(matrixPrice)}</strong>
                      {selectedPet
                        ? ` (${selectedPet.breed}, ${selectedPet.size}, ${selectedPet.coatType})`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(finalPrice)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <Switch
                      checked={useCustomPrice}
                      onCheckedChange={(checked) => {
                        setUseCustomPrice(checked);
                        if (checked && !customPrice) setCustomPrice(String(matrixPrice));
                      }}
                    />
                    Custom agreed price override
                  </label>
                  {useCustomPrice && (
                    <Input
                      type="number"
                      step="0.50"
                      min="0"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="w-28 h-8 text-xs font-semibold"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Optional Upfront Booking Deposit */}
            <div className="rounded-lg border p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Collect Booking Deposit Now
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Deducted automatically from the final balance at checkout.
                  </p>
                </div>
                <Switch checked={collectDeposit} onCheckedChange={setCollectDeposit} />
              </div>

              {collectDeposit && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div className="space-y-1">
                    <Label className="text-xs">Deposit Amount ($)</Label>
                    <Input
                      type="number"
                      step="0.50"
                      min="1"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Payment Method</Label>
                    <Select
                      value={depositMethod}
                      onValueChange={(v) => setDepositMethod(v as typeof depositMethod)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PAYNOW">PayNow / QR</SelectItem>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="CARD">Card / NETS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Appointment Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific requests for today (e.g. teddy bear cut, scissor trim paws only, sensitive ears)..."
                rows={3}
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
                <Info className="h-4 w-4 shrink-0" /> {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit">Confirm Booking</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewAppointmentPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-muted-foreground">Loading booking form...</div>
      }
    >
      <NewAppointmentContent />
    </Suspense>
  );
}
