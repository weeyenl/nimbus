"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, Plus, X, Camera, Syringe, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PET_SIZE_LABELS,
  COAT_TYPES,
  PRESET_WARNINGS,
  compressImageToDataUrl,
} from "@/lib/utils";
import {
  addPetToCustomer,
  newId,
  MockPet,
  PetVaccination,
} from "@/lib/mock-data";
import { showToast } from "@/components/ui/toast-system";

export default function NewPetPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [selectedWarnings, setSelectedWarnings] = useState<string[]>([]);
  const [customWarning, setCustomWarning] = useState("");
  const [vaccinations, setVaccinations] = useState<PetVaccination[]>([]);
  const [vacName, setVacName] = useState("");
  const [vacDateGiven, setVacDateGiven] = useState("");
  const [vacExpiry, setVacExpiry] = useState("");

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

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setPhotoUrl(dataUrl);
      showToast("Pet photo attached!", "success");
    } catch {
      showToast("Could not process that image file.", "error");
    }
  }

  function addVaccinationRow() {
    if (!vacName.trim() || !vacExpiry) {
      showToast("Enter both vaccine name and expiry date.", "error");
      return;
    }
    setVaccinations((prev) => [
      ...prev,
      {
        id: newId("vac"),
        name: vacName.trim(),
        dateGiven: vacDateGiven || undefined,
        expiryDate: vacExpiry,
      },
    ]);
    setVacName("");
    setVacDateGiven("");
    setVacExpiry("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const parsedAge = parseFloat(String(formData.get("age") ?? ""));
    const parsedWeight = parseFloat(String(formData.get("weight") ?? ""));
    const quickVacExpiry = (formData.get("vaccinationExpiry") as string) || undefined;

    const finalVaccinations = [...vaccinations];
    if (finalVaccinations.length === 0 && quickVacExpiry) {
      finalVaccinations.push({
        id: newId("vac"),
        name: "Core Vaccine (DHPP / Rabies)",
        expiryDate: quickVacExpiry,
      });
    }

    const newPet: MockPet = {
      id: newId("p"),
      name: (formData.get("name") as string).trim(),
      breed: (formData.get("breed") as string)?.trim() || "Mixed Breed",
      age: Number.isFinite(parsedAge) && parsedAge >= 0 ? parsedAge : 1,
      size: (formData.get("size") as MockPet["size"]) || "SMALL",
      weight: Number.isFinite(parsedWeight) && parsedWeight >= 0 ? parsedWeight : 5,
      coatType: (formData.get("coatType") as MockPet["coatType"]) || "SHORT",
      photoUrl: photoUrl || undefined,
      warnings: selectedWarnings,
      vaccinations: finalVaccinations.length > 0 ? finalVaccinations : undefined,
      vaccinationExpiry:
        finalVaccinations[0]?.expiryDate || quickVacExpiry || undefined,
    };

    if (!addPetToCustomer(params.id, newPet)) {
      showToast(
        "Could not find this customer. Return to the customer list and try again.",
        "error"
      );
      return;
    }
    showToast(`Added ${newPet.name} to customer profile!`, "success");
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
            Upload a photo, add coat details, vaccination records, and permanent warnings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Photo Upload */}
            <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-3">
              <Avatar className="h-16 w-16 border shrink-0">
                {photoUrl && (
                  <AvatarImage src={photoUrl} alt="Pet preview" className="object-cover" />
                )}
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Camera className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs font-semibold">Pet Photo (Optional)</Label>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-3.5 w-3.5" />{" "}
                    {photoUrl ? "Change Photo" : "Upload Photo"}
                  </Button>
                  {photoUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-destructive"
                      onClick={() => setPhotoUrl("")}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Pet Name *</Label>
                <Input id="name" name="name" placeholder="e.g. Mochi" required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="breed">Breed *</Label>
                <Input
                  id="breed"
                  name="breed"
                  placeholder="e.g. Toy Poodle, Golden Retriever"
                  required
                />
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
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="4.5"
                  defaultValue="5"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="age">Age (years)</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="3"
                  defaultValue="2"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vaccinationExpiry">Primary Vaccine Expiry (Quick Add)</Label>
                <Input id="vaccinationExpiry" name="vaccinationExpiry" type="date" />
              </div>
            </div>

            {/* Detailed Vaccination Records Builder */}
            <div className="rounded-lg border p-3.5 space-y-3 bg-muted/20">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Syringe className="h-4 w-4 text-primary" />
                Specific Vaccination Certificates (Optional)
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <Input
                  placeholder="Vaccine (e.g. Rabies, DHPPi)"
                  value={vacName}
                  onChange={(e) => setVacName(e.target.value)}
                  className="text-xs h-8 bg-background"
                />
                <Input
                  type="date"
                  value={vacDateGiven}
                  onChange={(e) => setVacDateGiven(e.target.value)}
                  title="Date given"
                  className="text-xs h-8 bg-background"
                />
                <div className="flex gap-1.5">
                  <Input
                    type="date"
                    value={vacExpiry}
                    onChange={(e) => setVacExpiry(e.target.value)}
                    title="Expiry date"
                    className="text-xs h-8 bg-background flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 px-2"
                    onClick={addVaccinationRow}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {vaccinations.length > 0 && (
                <div className="space-y-1">
                  {vaccinations.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between text-xs bg-background rounded border px-2.5 py-1.5"
                    >
                      <span>
                        <strong>{v.name}</strong> · Exp: {v.expiryDate}
                        {v.dateGiven && ` (Given: ${v.dateGiven})`}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setVaccinations((prev) => prev.filter((item) => item.id !== v.id))
                        }
                        className="text-destructive hover:opacity-75"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Permanent Warnings Section */}
            <div className="space-y-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
              <div className="flex items-center gap-2 font-semibold text-sm text-warning-foreground">
                <AlertTriangle className="h-4 w-4" />
                Permanent Health &amp; Behaviour Warnings
              </div>
              <p className="text-xs text-muted-foreground">
                Tap preset tags or add custom alerts shown to groomers before handling.
              </p>

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

              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="Add custom warning (e.g. sensitive left ear)..."
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
