"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, UserPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  saveAppointment,
  saveCustomer,
  addPetToCustomer,
  calculateServicePrice,
  localDateStr,
  MockCustomer,
  MockPet,
  MockService,
  MockStaff,
} from "@/lib/mock-data";
import { ServiceSelectItems } from "@/components/service-select-items";
import { PET_SIZE_LABELS } from "@/lib/utils";

export default function WalkInPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<MockCustomer[]>([]);
  const [staff, setStaff] = useState<MockStaff[]>([]);
  const [services, setServices] = useState<MockService[]>([]);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [searchPhone, setSearchPhone] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedGroomerId, setSelectedGroomerId] = useState<string>("");
  const [error, setError] = useState("");

  // New customer form state
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newOwnerPhone, setNewOwnerPhone] = useState("");
  const [newPetName, setNewPetName] = useState("");
  const [newPetBreed, setNewPetBreed] = useState("");
  const [newPetSize, setNewPetSize] = useState<"SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE">("SMALL");

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
    const staffList = getStaff().filter((s) => s.isActive !== false);
    setStaff(staffList);
    if (staffList.length > 0) setSelectedGroomerId(staffList[0].id);
  }, []);

  // One source of truth: the customer shown on screen is the customer that gets booked.
  const activeCustomer = customers.find((c) => c.id === selectedCustomerId);
  const activePet: MockPet | undefined =
    activeCustomer?.pets.find((p) => p.id === selectedPetId) ?? activeCustomer?.pets[0];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const service = services.find((s) => s.id === selectedServiceId);
    const groomer = staff.find((g) => g.id === selectedGroomerId);
    if (!service) return setError("Please select a service.");
    if (!groomer) return setError("Please select a groomer. Add one under Staff & Shifts if the list is empty.");

    let customer: MockCustomer | undefined;
    let pet: MockPet | undefined;

    if (isNewCustomer) {
      const name = newOwnerName.trim();
      const phone = newOwnerPhone.trim();
      const petName = newPetName.trim();
      if (!name || !phone || !petName) return setError("Owner name, phone and pet name are required.");

      const newPet: MockPet = {
        id: `p_${Date.now()}`,
        name: petName,
        breed: newPetBreed.trim() || "Mixed Breed",
        age: 2,
        size: newPetSize,
        weight: 5,
        coatType: "SHORT",
        warnings: [],
      };

      const digits = (s: string) => s.replace(/\D/g, "");
      const existing = customers.find((c) => digits(c.phone) === digits(phone));
      if (existing) {
        // Same phone number = same owner: attach the pet instead of creating a duplicate customer
        if (!addPetToCustomer(existing.id, newPet)) return setError("Could not save the pet. Please try again.");
        customer = { ...existing, pets: [...existing.pets, newPet] };
      } else {
        customer = {
          id: `c_${Date.now()}`,
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
      if (!customer) return setError("Please search for and select an owner, or add a new one.");
      if (!pet) return setError("This owner has no pets yet. Add a pet to their profile first, or use Quick Add New Owner.");
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + service.duration * 60000);
    const price = calculateServicePrice(service.id, pet.size, pet.coatType);

    saveAppointment({
      id: `apt_${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      petId: pet.id,
      petName: pet.name,
      petBreed: pet.breed,
      petSize: pet.size,
      petCoatType: pet.coatType,
      serviceId: service.id,
      serviceName: service.name,
      serviceDuration: service.duration,
      servicePrice: price,
      groomerId: groomer.id,
      groomerName: groomer.name,
      status: "ARRIVED" as const,
      isWalkIn: true,
      notes: "Walk-in client checked in at front desk.",
      dateStr: localDateStr(now),
      startTime: now.toTimeString().slice(0, 5),
      // Past midnight? Cap at 23:59 so the end time never sorts before the start time.
      endTime: localDateStr(endTime) === localDateStr(now) ? endTime.toTimeString().slice(0, 5) : "23:59",
    });
    router.push("/appointments");
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
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
            Quickly locate or add customer, pick pet and service, auto-start appointment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Customer Lookup or Quick Create */}
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
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Pet Size</Label>
                  <Select value={newPetSize} onValueChange={(v) => setNewPetSize(v as typeof newPetSize)}>
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
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Search Owner by Name or Phone</Label>
                  <Input
                    placeholder="Type name or phone (e.g. Sarah, James)..."
                    value={searchPhone}
                    onChange={(e) => {
                      const q = e.target.value;
                      setSearchPhone(q);
                      const needle = q.trim().toLowerCase();
                      const match = needle
                        ? customers.find(
                            (c) => c.phone.includes(q.trim()) || c.name.toLowerCase().includes(needle)
                          )
                        : undefined;
                      // No match -> nothing selected (never silently book someone else)
                      setSelectedCustomerId(match ? match.id : "");
                      setSelectedPetId(match?.pets[0]?.id ?? "");
                    }}
                  />
                </div>

                {searchPhone.trim() && !activeCustomer && (
                  <p className="text-xs text-muted-foreground">
                    No owner found. Use &quot;Quick Add New Owner&quot; above.
                  </p>
                )}

                {activeCustomer && (
                  <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Selected: <span className="font-semibold text-primary">{activeCustomer.name}</span> ({activeCustomer.phone})
                    </p>
                    {activeCustomer.pets.length === 0 ? (
                      <p className="text-xs text-destructive">
                        No pets on file for this owner. Add a pet to their profile first, or use Quick Add New Owner.
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
                                {p.name} ({p.breed} - {p.size})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                <Label>Assign Groomer *</Label>
                <Select
                  value={selectedGroomerId}
                  onValueChange={setSelectedGroomerId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select groomer" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        ✂ {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-4">
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
