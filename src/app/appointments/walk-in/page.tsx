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
  MOCK_SERVICES,
  getStaff,
  getCustomers,
  saveAppointment,
  saveCustomer,
  MockCustomer,
  MockStaff,
} from "@/lib/mock-data";

export default function WalkInPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<MockCustomer[]>([]);
  const [staff, setStaff] = useState<MockStaff[]>([]);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [searchPhone, setSearchPhone] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("s6");
  const [selectedGroomerId, setSelectedGroomerId] = useState<string>("");

  // New customer form state
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newOwnerPhone, setNewOwnerPhone] = useState("");
  const [newPetName, setNewPetName] = useState("");
  const [newPetBreed, setNewPetBreed] = useState("Poodle");
  const [newPetSize, setNewPetSize] = useState<"SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE">("SMALL");

  useEffect(() => {
    const custs = getCustomers();
    setCustomers(custs);
    if (custs.length > 0) {
      setSelectedCustomerId(custs[0].id);
      if (custs[0].pets.length > 0) {
        setSelectedPetId(custs[0].pets[0].id);
      }
    }
    const staffList = getStaff().filter((s) => s.role === "GROOMER");
    setStaff(staffList);
    if (staffList.length > 0) {
      setSelectedGroomerId(staffList[0].id);
    }
  }, []);

  const activeCustomer = customers.find((c) =>
    searchPhone
      ? c.phone.includes(searchPhone) || c.name.toLowerCase().includes(searchPhone.toLowerCase())
      : c.id === selectedCustomerId
  ) || customers[0];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const startTimeStr = now.toTimeString().slice(0, 5); // "HH:MM"
    const service = MOCK_SERVICES.find((s) => s.id === selectedServiceId) || MOCK_SERVICES[0];
    const groomer = staff.find((g) => g.id === selectedGroomerId) || staff[0] || { id: "g1", name: "Amy Chen" };

    const endHour = new Date(now.getTime() + service.duration * 60000);
    const endTimeStr = endHour.toTimeString().slice(0, 5);

    let finalCustomerId = selectedCustomerId;
    let finalCustomerName = activeCustomer?.name || "Walk-in Guest";
    let finalCustomerPhone = activeCustomer?.phone || "+65 9000 0000";
    let finalPetId = selectedPetId;
    let finalPetName = activeCustomer?.pets.find((p) => p.id === selectedPetId)?.name || "Pet";
    let finalPetBreed = activeCustomer?.pets.find((p) => p.id === selectedPetId)?.breed || "Mixed";
    let finalPetSize: "SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE" = activeCustomer?.pets.find((p) => p.id === selectedPetId)?.size || "SMALL";

    if (isNewCustomer) {
      const newCustId = `c_${Date.now()}`;
      const newPId = `p_${Date.now()}`;
      const newCust: MockCustomer = {
        id: newCustId,
        name: newOwnerName || "Walk-in Customer",
        phone: newOwnerPhone || "+65 9123 0000",
        referralSource: "Walk-in",
        pets: [
          {
            id: newPId,
            name: newPetName || "Buddy",
            breed: newPetBreed || "Mixed Breed",
            age: 2,
            size: newPetSize,
            weight: 5,
            coatType: "SHORT",
            warnings: [],
          },
        ],
      };
      saveCustomer(newCust);
      finalCustomerId = newCustId;
      finalCustomerName = newCust.name;
      finalCustomerPhone = newCust.phone;
      finalPetId = newPId;
      finalPetName = newCust.pets[0].name;
      finalPetBreed = newCust.pets[0].breed;
      finalPetSize = newCust.pets[0].size;
    }

    const newAppointment = {
      id: `apt_${Date.now()}`,
      customerId: finalCustomerId,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      petId: finalPetId,
      petName: finalPetName,
      petBreed: finalPetBreed,
      petSize: finalPetSize,
      serviceId: service.id,
      serviceName: service.name,
      serviceDuration: service.duration,
      servicePrice: service.price,
      groomerId: groomer.id,
      groomerName: groomer.name,
      status: "ARRIVED" as const,
      isWalkIn: true,
      notes: "Walk-in client checked in at front desk.",
      dateStr: todayStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
    };

    saveAppointment(newAppointment);
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
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Search Owner by Name or Phone</Label>
                  <Input
                    placeholder="Type name or phone (e.g. Sarah, James)..."
                    value={searchPhone}
                    onChange={(e) => {
                      setSearchPhone(e.target.value);
                      const match = customers.find(
                        (c) =>
                          c.phone.includes(e.target.value) ||
                          c.name.toLowerCase().includes(e.target.value.toLowerCase())
                      );
                      if (match) {
                        setSelectedCustomerId(match.id);
                        if (match.pets.length > 0) setSelectedPetId(match.pets[0].id);
                      }
                    }}
                  />
                </div>

                {activeCustomer && (
                  <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Selected: <span className="font-semibold text-primary">{activeCustomer.name}</span> ({activeCustomer.phone})
                    </p>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Select Pet *</Label>
                      <Select
                        value={selectedPetId || (activeCustomer.pets[0]?.id ?? "")}
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
                    {MOCK_SERVICES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} (${s.price} - {s.duration}m)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Assign Groomer *</Label>
                <Select
                  value={selectedGroomerId || (staff[0]?.id ?? "g1")}
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
