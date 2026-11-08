"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  UserPlus,
  Search,
  AlertTriangle,
  ShieldAlert,
  Crown,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  getServices,
  getStaff,
  getCustomers,
  getCustomerMembership,
  saveAppointment,
  saveCustomer,
  addPetToCustomer,
  calculateServicePrice,
  localDateStr,
  newId,
  findOverlappingAppointments,
  getStaffShiftForDate,
  isTimeWithinShift,
  getPetEffectiveVaccinationExpiry,
  isMembershipExpired,
  MockCustomer,
  MockPet,
  MockService,
  MockStaff,
} from "@/lib/mock-data";
import { ServiceSelectItems } from "@/components/service-select-items";
import { CustomerCombobox } from "@/components/customer-combobox";
import {
  PET_SIZE_LABELS,
  COAT_TYPES,
  normalizePhoneDigits,
  formatPrice,
  getVaccinationStatus,
} from "@/lib/utils";
import { showToast } from "@/components/ui/toast-system";

export default function WalkInPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<MockCustomer[]>([]);
  const [allStaff, setAllStaff] = useState<MockStaff[]>([]);
  const [services, setServices] = useState<MockService[]>([]);
  const [showAllStaff, setShowAllStaff] = useState(false);

  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedGroomerId, setSelectedGroomerId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState("");

  // New customer form state
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newOwnerPhone, setNewOwnerPhone] = useState("");
  const [newPetName, setNewPetName] = useState("");
  const [newPetBreed, setNewPetBreed] = useState("");
  const [newPetSize, setNewPetSize] = useState<MockPet["size"]>("SMALL");
  const [newPetCoat, setNewPetCoat] = useState<MockPet["coatType"]>("SHORT");

  useEffect(() => {
    const custs = getCustomers();
    setCustomers(custs);
    if (custs.length > 0) {
      setSelectedCustomerId(custs[0].id);
      setSelectedPetId(custs[0].pets[0]?.id ?? "");
    } else {
      setIsNewCustomer(true);
    }

    const svcs = getServices();
    setServices(svcs);
    if (svcs.length > 0) setSelectedServiceId(svcs[0].id);

    const activeStaff = getStaff().filter((s) => s.isActive !== false);
    setAllStaff(activeStaff);
    const defaultGroomer =
      activeStaff.find((s) => s.role === "GROOMER") || activeStaff[0];
    if (defaultGroomer) setSelectedGroomerId(defaultGroomer.id);
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

  const activeCustomer = customers.find((c) => c.id === selectedCustomerId);
  const activePet: MockPet | undefined =
    activeCustomer?.pets.find((p) => p.id === selectedPetId) ?? activeCustomer?.pets[0];
  const selectedService = services.find((s) => s.id === selectedServiceId);
  const selectedGroomer = allStaff.find((g) => g.id === selectedGroomerId);
  const membership =
    !isNewCustomer && activeCustomer ? getCustomerMembership(activeCustomer.id) : undefined;

  const estimatedPrice = useMemo(() => {
    if (!selectedService) return 0;
    if (isNewCustomer) {
      return calculateServicePrice(
        selectedService.id,
        newPetSize,
        newPetCoat,
        newPetBreed
      );
    }
    if (activePet) {
      return calculateServicePrice(
        selectedService.id,
        activePet.size,
        activePet.coatType,
        activePet.breed
      );
    }
    return selectedService.basePrice;
  }, [selectedService, isNewCustomer, newPetSize, newPetCoat, newPetBreed, activePet]);

  const now = new Date();
  const todayStr = localDateStr(now);
  const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
  const endDate = new Date(now.getTime() + (selectedService?.duration || 60) * 60000);
  const endTimeStr =
    localDateStr(endDate) === todayStr
      ? `${String(endDate.getHours()).padStart(2, "0")}:${String(
          endDate.getMinutes()
        ).padStart(2, "0")}`
      : "23:59";

  const groomerShift = selectedGroomer ? getStaffShiftForDate(selectedGroomer, todayStr) : "";
  const withinShift = selectedGroomer
    ? isTimeWithinShift(nowTime, endTimeStr, groomerShift)
    : true;
  const overlapping = selectedGroomer
    ? findOverlappingAppointments(selectedGroomer.id, todayStr, nowTime, endTimeStr)
    : [];

  const vacStatus =
    !isNewCustomer && activePet
      ? getVaccinationStatus(getPetEffectiveVaccinationExpiry(activePet))
      : null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!selectedService) return setError("Please select a service.");
    if (!selectedGroomer)
      return setError(
        "Please select a groomer. Add one under Staff & Shifts if the list is empty."
      );

    let customer: MockCustomer | undefined;
    let pet: MockPet | undefined;

    if (isNewCustomer) {
      const name = newOwnerName.trim();
      const phone = newOwnerPhone.trim();
      const petName = newPetName.trim();
      if (!name || !phone || !petName) {
        return setError("Owner name, phone and pet name are required.");
      }

      const newPet: MockPet = {
        id: newId("p"),
        name: petName,
        breed: newPetBreed.trim() || "Mixed Breed",
        age: 2,
        size: newPetSize,
        weight: 5,
        coatType: newPetCoat,
        warnings: [],
      };

      const targetDigits = normalizePhoneDigits(phone);
      const existing = customers.find(
        (c) => targetDigits && normalizePhoneDigits(c.phone) === targetDigits
      );

      if (existing) {
        if (!addPetToCustomer(existing.id, newPet)) {
          return setError("Could not save the pet. Please try again.");
        }
        customer = { ...existing, pets: [...existing.pets, newPet] };
      } else {
        customer = {
          id: newId("c"),
          name,
          phone,
          referralSource: "Walk-in",
          pets: [newPet],
        };
        saveCustomer(customer);
      }
      pet = newPet;
    } else {
      customer = activeCustomer;
      pet = activePet;
      if (!customer)
        return setError("Please select an owner, or switch to Quick Add New Owner.");
      if (!pet)
        return setError(
          "This owner has no pets yet. Add a pet to their profile first, or use Quick Add New Owner."
        );
    }

    const submitNow = new Date();
    const submitEnd = new Date(submitNow.getTime() + selectedService.duration * 60000);
    const submitStartStr = `${String(submitNow.getHours()).padStart(2, "0")}:${String(
      submitNow.getMinutes()
    ).padStart(2, "0")}`;
    const submitEndStr =
      localDateStr(submitEnd) === localDateStr(submitNow)
        ? `${String(submitEnd.getHours()).padStart(2, "0")}:${String(
            submitEnd.getMinutes()
          ).padStart(2, "0")}`
        : "23:59";

    const price = calculateServicePrice(
      selectedService.id,
      pet.size,
      pet.coatType,
      pet.breed
    );

    const aptId = newId("apt");
    saveAppointment({
      id: aptId,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      petId: pet.id,
      petName: pet.name,
      petBreed: pet.breed,
      petSize: pet.size,
      petCoatType: pet.coatType,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      serviceDuration: selectedService.duration,
      servicePrice: price,
      groomerId: selectedGroomer.id,
      groomerName: selectedGroomer.name,
      status: "ARRIVED",
      isWalkIn: true,
      notes: notes.trim() || "Walk-in client checked in at front desk.",
      dateStr: localDateStr(submitNow),
      startTime: submitStartStr,
      endTime: submitEndStr,
    });

    showToast(`Checked in walk-in for ${pet.name}!`, "success");
    router.push(`/appointments/${aptId}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Walk-in Quick Entry</h1>
            <Badge variant="warning" className="gap-1">
              <Clock className="h-3 w-3" /> Status: Arrived Immediately
            </Badge>
          </div>
          <p className="text-muted-foreground">Fast front-desk check-in for walk-in visits</p>
        </div>
      </div>

      <Card className="mx-auto max-w-2xl border-primary/20 shadow-sm">
        <CardHeader>
          <CardTitle>Fast Check-In</CardTitle>
          <CardDescription>
            Locate an existing owner or add a new walk-in client in seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm font-semibold">Customer Information</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewCustomer(!isNewCustomer)}
              >
                {isNewCustomer ? (
                  <>
                    <Search className="mr-1.5 h-3.5 w-3.5" /> Find Existing Owner
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Quick Add New Owner
                  </>
                )}
              </Button>
            </div>

            {isNewCustomer ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Owner Name *</Label>
                  <Input
                    placeholder="e.g. David Lee"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number *</Label>
                  <Input
                    placeholder="+65 9876 5432"
                    type="tel"
                    value={newOwnerPhone}
                    onChange={(e) => setNewOwnerPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Pet Name *</Label>
                  <Input
                    placeholder="e.g. Brownie"
                    value={newPetName}
                    onChange={(e) => setNewPetName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Breed</Label>
                  <Input
                    placeholder="e.g. Toy Poodle"
                    value={newPetBreed}
                    onChange={(e) => setNewPetBreed(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Pet Size</Label>
                  <Select
                    value={newPetSize}
                    onValueChange={(v) => setNewPetSize(v as MockPet["size"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PET_SIZE_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Coat Type</Label>
                  <Select
                    value={newPetCoat}
                    onValueChange={(v) => setNewPetCoat(v as MockPet["coatType"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COAT_TYPES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Find Owner by Name, Phone, or Pet *</Label>
                  <CustomerCombobox
                    customers={customers}
                    value={selectedCustomerId}
                    onChange={(id) => {
                      setSelectedCustomerId(id);
                      const cust = customers.find((c) => c.id === id);
                      setSelectedPetId(cust?.pets[0]?.id ?? "");
                    }}
                    showNewLink={false}
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
                    <span className="font-semibold shrink-0">
                      {membership.packageType === "SESSIONS"
                        ? `${membership.remainingSessions ?? 0} sessions left`
                        : `${formatPrice(membership.remainingCredits)} credits`}
                    </span>
                  </div>
                )}

                {activeCustomer && (
                  <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                    {activeCustomer.pets.length === 0 ? (
                      <p className="text-xs text-destructive">
                        No pets on file for {activeCustomer.name}. Use Quick Add New Owner above or add a pet on their profile.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Select Pet *</Label>
                        <Select
                          value={activePet?.id ?? ""}
                          onValueChange={setSelectedPetId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose pet" />
                          </SelectTrigger>
                          <SelectContent>
                            {activeCustomer.pets.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} ({p.breed} · {p.size} · {p.coatType})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                {activePet &&
                  (activePet.warnings.length > 0 ||
                    vacStatus?.status === "EXPIRED" ||
                    vacStatus?.status === "EXPIRING_SOON") && (
                    <div className="space-y-2">
                      {activePet.warnings.length > 0 && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900 space-y-1">
                          <p className="font-semibold flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                            Handling Alerts for {activePet.name}:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {activePet.warnings.map((w, idx) => (
                              <Badge
                                key={idx}
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
                        (vacStatus.status === "EXPIRED" ||
                          vacStatus.status === "EXPIRING_SOON") && (
                          <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                            <span>
                              <strong>Vaccination notice:</strong> {vacStatus.label}
                            </span>
                          </div>
                        )}
                    </div>
                  )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="space-y-1.5">
                <Label>Service *</Label>
                <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    <ServiceSelectItems services={services} />
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Assign Groomer *</Label>
                  <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                    <Switch
                      checked={showAllStaff}
                      onCheckedChange={setShowAllStaff}
                    />
                    All staff
                  </label>
                </div>
                <Select value={selectedGroomerId} onValueChange={setSelectedGroomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select groomer" />
                  </SelectTrigger>
                  <SelectContent>
                    {displayedStaff.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        ✂ {g.name} ({getStaffShiftForDate(g, todayStr)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedGroomer && (!withinShift || overlapping.length > 0) && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
                {!withinShift && (
                  <p>
                    <strong>Shift notice:</strong> {selectedGroomer.name}&apos;s shift today is{" "}
                    {groomerShift}.
                  </p>
                )}
                {overlapping.length > 0 && (
                  <p className="text-red-800">
                    <strong>Conflict notice:</strong> {selectedGroomer.name} is currently booked
                    with {overlapping.map((o) => `${o.petName} (${o.startTime}–${o.endTime})`).join(", ")}.
                  </p>
                )}
              </div>
            )}

            {selectedService && (
              <div className="rounded-lg bg-muted/50 border px-3 py-2 text-xs flex items-center justify-between">
                <span className="text-muted-foreground">
                  Est. {selectedService.duration} mins · Starting immediately ({nowTime}–{endTimeStr})
                </span>
                <span className="font-bold text-sm text-primary">
                  {formatPrice(estimatedPrice)}
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="walkin-notes">Check-in Notes</Label>
              <Textarea
                id="walkin-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Walk-in instructions, coat state, pickup time..."
                rows={2}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" variant="default" className="gap-2">
                <Clock className="h-4 w-4" /> Check In Now
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
