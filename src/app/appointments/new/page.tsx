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
  MOCK_SERVICES,
  getStaff,
  getCustomers,
  saveAppointment,
  MockCustomer,
  MockStaff,
} from "@/lib/mock-data";

function NewAppointmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDate = searchParams?.get("date") || new Date().toISOString().split("T")[0];

  const [customers, setCustomers] = useState<MockCustomer[]>([]);
  const [staff, setStaff] = useState<MockStaff[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("s1");
  const [selectedGroomerId, setSelectedGroomerId] = useState<string>("");

  useEffect(() => {
    const custs = getCustomers();
    setCustomers(custs);
    if (custs.length > 0) {
      setSelectedCustomerId(custs[0].id);
      if (custs[0].pets.length > 0) setSelectedPetId(custs[0].pets[0].id);
    }
    const groomers = getStaff().filter((s) => s.role === "GROOMER");
    setStaff(groomers);
    if (groomers.length > 0) setSelectedGroomerId(groomers[0].id);
  }, []);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const selectedService = MOCK_SERVICES.find((s) => s.id === selectedServiceId) || MOCK_SERVICES[0];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dateStr = (formData.get("date") as string) || initialDate;
    const startTimeStr = (formData.get("time") as string) || "10:00";
    const notes = formData.get("notes") as string;

    const [startH, startM] = startTimeStr.split(":").map(Number);
    const totalMinutes = startH * 60 + startM + selectedService.duration;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const endTimeStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

    const groomer = staff.find((g) => g.id === selectedGroomerId) || staff[0] || { id: "g1", name: "Amy Chen" };
    const pet = selectedCustomer?.pets.find((p) => p.id === selectedPetId) || selectedCustomer?.pets[0] || {
      id: "p_unknown",
      name: "Pet",
      breed: "Mixed",
      size: "SMALL" as const,
    };

    const newAppointment = {
      id: `apt_${Date.now()}`,
      customerId: selectedCustomer?.id || "c1",
      customerName: selectedCustomer?.name || "Customer",
      customerPhone: selectedCustomer?.phone || "+65 9000 0000",
      petId: pet.id,
      petName: pet.name,
      petBreed: pet.breed,
      petSize: pet.size,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      serviceDuration: selectedService.duration,
      servicePrice: selectedService.price,
      groomerId: groomer.id,
      groomerName: groomer.name,
      status: "BOOKED" as const,
      isWalkIn: false,
      notes: notes || undefined,
      dateStr: dateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
    };

    saveAppointment(newAppointment);
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
                  if (cust && cust.pets.length > 0) {
                    setSelectedPetId(cust.pets[0].id);
                  }
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="pet">Pet *</Label>
              <Select
                value={selectedPetId}
                onValueChange={setSelectedPetId}
                disabled={!selectedCustomerId}
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
                    {MOCK_SERVICES.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.duration} mins - ${service.price})
                      </SelectItem>
                    ))}
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
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Slot will be automatically reserved from start to end time.
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
