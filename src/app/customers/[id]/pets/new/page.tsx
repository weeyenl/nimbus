"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, Plus, X } from "lucide-react";
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
import { PET_SIZE_LABELS } from "@/lib/utils";
import { addPetToCustomer, MockPet } from "@/lib/mock-data";

const COAT_TYPES = [
  { value: "SHORT", label: "Short" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LONG", label: "Long" },
  { value: "DOUBLE", label: "Double Coat" },
  { value: "WIRE", label: "Wire / Coarse" },
  { value: "CURLY", label: "Curly / Wool" },
];

const PRESET_WARNINGS = [
  "Bites when paws touched",
  "Anxious with loud dryer noises",
  "Sensitive skin / Allergies",
  "Elderly / Hip dysplasia",
  "Aggressive with other dogs",
  "Cannot stand for long periods",
  "Collapsed trachea — handle neck gently",
];

export default function NewPetPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [selectedWarnings, setSelectedWarnings] = useState<string[]>([]);
  const [customWarning, setCustomWarning] = useState("");

  function togglePresetWarning(warning: string) {
    if (selectedWarnings.includes(warning)) {
      setSelectedWarnings(selectedWarnings.filter((w) => w !== warning));
    } else {
      setSelectedWarnings([...selectedWarnings, warning]);
    }
  }

  function addCustomWarning() {
    if (customWarning.trim() && !selectedWarnings.includes(customWarning.trim())) {
      setSelectedWarnings([...selectedWarnings, customWarning.trim()]);
      setCustomWarning("");
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newPet: MockPet = {
      id: `p_${Date.now()}`,
      name: (formData.get("name") as string).trim(),
      breed: (formData.get("breed") as string)?.trim() || "Mixed Breed",
      age: Number(formData.get("age")) || 1,
      size: (formData.get("size") as any) || "SMALL",
      weight: Number(formData.get("weight")) || 5,
      coatType: (formData.get("coatType") as any) || "SHORT",
      warnings: selectedWarnings,
      vaccinationExpiry: (formData.get("vaccinationExpiry") as string) || undefined,
    };

    if (!addPetToCustomer(params.id, newPet)) {
      alert("Could not find this customer, so the pet was not saved. Go back to the customer list and try again.");
      return;
    }
    router.push(`/customers/${params.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Pet</h1>
          <p className="text-muted-foreground">Register pet under this customer</p>
        </div>
      </div>

      <Card className="mx-auto max-w-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Pet Profile</CardTitle>
          <CardDescription>
            Enter pet details, size, coat type, vaccination, and permanent warnings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Pet Name *</Label>
                <Input id="name" name="name" placeholder="e.g. Mochi" required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="breed">Breed *</Label>
                <Input id="breed" name="breed" placeholder="e.g. Toy Poodle, Golden Retriever" required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="size">Size</Label>
                <Select name="size" defaultValue="SMALL">
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
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
                <Label htmlFor="coatType">Coat Type</Label>
                <Select name="coatType" defaultValue="CURLY">
                  <SelectTrigger>
                    <SelectValue placeholder="Select coat" />
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

              <div className="space-y-1.5">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input id="weight" name="weight" type="number" step="0.1" placeholder="4.5" defaultValue="5" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="age">Age (years)</Label>
                <Input id="age" name="age" type="number" min="0" placeholder="3" defaultValue="2" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vaccinationExpiry">Vaccination Expiry Date</Label>
                <Input id="vaccinationExpiry" name="vaccinationExpiry" type="date" />
              </div>
            </div>

            {/* Permanent Warnings Section */}
            <div className="space-y-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
              <div className="flex items-center gap-2 font-semibold text-sm text-warning-foreground">
                <AlertTriangle className="h-4 w-4" />
                Permanent Health & Behaviour Warnings
              </div>
              <p className="text-xs text-muted-foreground">
                Click preset tags or add custom warnings. These persist permanently on the pet&apos;s profile and flash on appointment booking.
              </p>

              {/* Preset clickable tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_WARNINGS.map((warning) => {
                  const isSelected = selectedWarnings.includes(warning);
                  return (
                    <Badge
                      key={warning}
                      variant={isSelected ? "warning" : "outline"}
                      className="cursor-pointer py-1 px-2.5 text-xs select-none hover:bg-warning/20 transition-colors"
                      onClick={() => togglePresetWarning(warning)}
                    >
                      {warning} {isSelected ? "✓" : "+"}
                    </Badge>
                  );
                })}
              </div>

              {/* Custom warning addition */}
              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="Add custom warning (e.g. skin rash behind left ear)..."
                  value={customWarning}
                  onChange={(e) => setCustomWarning(e.target.value)}
                  className="text-xs h-9 bg-background"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomWarning();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addCustomWarning}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              {/* Active warnings list */}
              {selectedWarnings.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-semibold text-warning-foreground block mb-1">
                    Selected Warnings ({selectedWarnings.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedWarnings.map((w, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-md bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning-foreground"
                      >
                        {w}
                        <button
                          type="button"
                          onClick={() => togglePresetWarning(w)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit">Save Pet</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
