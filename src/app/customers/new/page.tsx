"use client";

import React from "react";
import { useRouter } from "next/navigation";
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
import { REFERRAL_SOURCES, PET_SIZE_LABELS } from "@/lib/utils";
import { saveCustomer, MockCustomer, MockPet } from "@/lib/mock-data";

const COAT_TYPES = [
  { value: "SHORT", label: "Short" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LONG", label: "Long" },
  { value: "DOUBLE", label: "Double Coat" },
  { value: "WIRE", label: "Wire / Coarse" },
  { value: "CURLY", label: "Curly / Wool" },
];

export default function NewCustomerPage() {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;
    const referralSource = formData.get("referralSource") as string;
    const notes = formData.get("notes") as string;
    const petName = ((formData.get("petName") as string) || "").trim();
    const petBreed = formData.get("petBreed") as string;
    const petSize = ((formData.get("petSize") as MockPet["size"]) || "SMALL");
    const petCoat = ((formData.get("petCoat") as MockPet["coatType"]) || "SHORT");

    const newCustomer: MockCustomer = {
      id: `c_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : undefined,
      address: address ? address.trim() : undefined,
      referralSource: referralSource || undefined,
      notes: notes ? notes.trim() : undefined,
      pets: petName ? [
        {
          id: `p_${Date.now()}`,
          name: petName,
          breed: petBreed ? petBreed.trim() : "Mixed Breed",
          age: 2,
          size: petSize,
          weight: 5,
          coatType: petCoat,
          warnings: [],
        }
      ] : [],
    };

    saveCustomer(newCustomer);
    // Go straight to the profile so pets can be added / booked right away
    router.push(`/customers/${newCustomer.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Customer</h1>
          <p className="text-muted-foreground">
            Register a new pet owner and their pet
          </p>
        </div>
      </div>

      <Card className="mx-auto max-w-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Owner & Pet Details</CardTitle>
          <CardDescription>
            Fill in the pet owner&apos;s information. Phone number is required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Owner Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Sarah Tan"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+65 9123 4567"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="sarah@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referralSource">How did you find us?</Label>
                <Select name="referralSource">
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {REFERRAL_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                placeholder="Block 123, Street Name, #01-01"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">First Pet (Optional)</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="petName">Pet Name</Label>
                  <Input id="petName" name="petName" placeholder="e.g. Milo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="petBreed">Breed</Label>
                  <Input id="petBreed" name="petBreed" placeholder="e.g. Corgi" />
                </div>
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Select name="petSize" defaultValue="SMALL">
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
                <div className="space-y-2">
                  <Label>Coat</Label>
                  <Select name="petCoat" defaultValue="SHORT">
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
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Any special customer preferences..."
                rows={2}
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
              <Button type="submit">Create Customer</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
