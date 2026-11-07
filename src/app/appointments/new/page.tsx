"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
  saveAppointment,
  calculateServicePrice,
  localDateStr,
  MockCustomer,
  MockService,
  MockStaff,
} from "@/lib/mock-data";
import { ServiceSelectItems } from "@/components/service-select-items";
import Link from "next/link";

function NewAppointmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDate = searchParams?.get("date") || localDateStr();
  const presetCustomerId = searchParams?.get("customerId") || "";
  const presetPetId = searchParams?.get("petId") || "";

  const [customers, setCustomers] = useState<MockCustomer[]>([]);
  const [staff, setStaff] = useState<MockStaff[]>([]);
  const [services, setServices] = useState<MockService[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedGroomerId, setSelectedGroomerId] = useState<string>("");
  const [error, setError] = useState("");

  useEffect(() => {
    const custs = getCustomers();
    setCustomers(custs);
    const initial = custs.find((c) => c.id === presetCustomerId) || custs[0];
    if (initial) {
      setSelectedCustomerId(initial.id);
      const preset = initial.pets.find((p) => p.id === presetPetId);
      const firstPet = preset || initial.pets[0];
      setSelectedPetId(firstPet ? firstPet.id : "");
    }
    const svcs = getServices();
    setServices(svcs);
    if (svcs.length > 0) setSelectedServiceId(svcs[0].id);
    const groomers = getStaff().filter((s) => s.role === "GROOMER" && s.isActive !== false);
    setStaff(groomers);
    if (groomers.length > 0) setSelectedGroomerId(groomers[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  // Only ever use a pet that really belongs to the selected customer
  const selectedPet = selectedCustomer?.pets.find((p) => p.id === selectedPetId);
  const selectedService = services.find((s) => s.id === selectedServiceId);
  const quotedPrice =
    selectedService && selectedPet
      ? calculateServicePrice(selectedService.id, selectedPet.size, selectedPet.coatType)
      : selectedService?.basePrice ?? 0;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const dateStr = (formData.get("date") as string) || initialDate;
    const startTimeStr = (formData.get("time") as string) || "10:00";
    const notes = formData.get("notes") as string;

    const groomer = staff.find((g) => g.id === selectedGroomerId);
    if (!selectedCustomer) return setError("Please select a customer.");
    if (!selectedPet) return setError("Please select a pet. If this customer has no pets yet, add one first.");
    if (!selectedService) return setError("Please select a service.");
    if (!groomer) return setError("Please select a groomer. Add one under Staff & Shifts if the list is empty.");

    const [startH, startM] = startTimeStr.split(":").map(Number);
    const totalMinutes = startH * 60 + startM + selectedService.duration;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const endTimeStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

    saveAppointment({
      id: `apt_${Date.now()}`,
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
      servicePrice: quotedPrice,
      groomerId: groomer.id,
      groomerName: groomer.name,
      status: "BOOKED" as const,
      isWalkIn: false,
      notes: notes || undefined,
      dateStr: dateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
    });
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
            Select customer, pet, service, groomer and time slot.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <Select
                value={selectedCustomerId}
                onValueChange={(val) => {
                  setSelectedCustomerId(val);
                  const cust = customers.find((c) => c.id === val);
                  setSelectedPetId(cust && cust.pets.length > 0 ? cust.pets[0].id : "");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {customers.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No customers yet.{" "}
                  <Link href="/customers/new" className="text-primary underline">Add a customer</Link> first.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pet">Pet *</Label>
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
                      {pet.name} ({pet.breed} - {pet.size})
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="service">Service *</Label>
                <Select
                  value={selectedServiceId}
                  onValueChange={setSelectedServiceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    <ServiceSelectItems services={services} />
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="groomer">Preferred Groomer *</Label>
                <Select
                  value={selectedGroomerId}
                  onValueChange={setSelectedGroomerId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select groomer" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((groomer) => (
                      <SelectItem key={groomer.id} value={groomer.id}>
                        ✂ {groomer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {staff.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No groomers yet — add one under Staff &amp; Shifts.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={initialDate}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Start Time *</Label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  defaultValue="10:00"
                  required
                />
              </div>
            </div>

            {selectedService && (
              <div className="rounded-md bg-muted/60 p-3 text-sm">
                <p className="font-medium text-foreground">
                  Estimated Duration: {selectedService.duration} minutes
                  {" · "}Price: ${quotedPrice}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {selectedPet
                    ? "Price reflects the pet's size and coat. Slot is reserved from start to end time."
                    : "Slot will be automatically reserved from start to end time."}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Appointment Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Specific instructions for today (e.g. scissor trim face only, light bath)..."
                rows={3}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
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
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading booking form...</div>}>
      <NewAppointmentContent />
    </Suspense>
  );
}
