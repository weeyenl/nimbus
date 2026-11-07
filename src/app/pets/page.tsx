"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  PawPrint,
  ChevronRight,
  AlertTriangle,
  User,
  Plus,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getInitials, PET_SIZE_LABELS } from "@/lib/utils";
import {
  getCustomers,
  saveCustomer,
  addPetToCustomer,
  MockCustomer,
  MockPet,
} from "@/lib/mock-data";

const PRESET_WARNINGS = [
  "Bites when paws touched",
  "Anxious with loud dryer noises",
  "Sensitive skin / Allergies",
  "Elderly / Hip dysplasia",
  "Aggressive with other dogs",
  "Cannot stand for long periods",
];

const COAT_TYPES = [
  { value: "SHORT", label: "Short" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LONG", label: "Long" },
  { value: "DOUBLE", label: "Double Coat" },
  { value: "WIRE", label: "Wire / Coarse" },
  { value: "CURLY", label: "Curly / Wool" },
];

export default function PetsPage() {
  const [customers, setCustomers] = useState<MockCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddPetOpen, setIsAddPetOpen] = useState(false);

  // Form states
  const [isNewOwner, setIsNewOwner] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newOwnerPhone, setNewOwnerPhone] = useState("");

  const [petName, setPetName] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [petSize, setPetSize] = useState<"SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE">("SMALL");
  const [coatType, setCoatType] = useState<"SHORT" | "MEDIUM" | "LONG" | "DOUBLE" | "WIRE" | "CURLY">("CURLY");
  const [weight, setWeight] = useState("5");
  const [age, setAge] = useState("2");
  const [vaccinationExpiry, setVaccinationExpiry] = useState("");
  const [selectedWarnings, setSelectedWarnings] = useState<string[]>([]);
  const [customWarning, setCustomWarning] = useState("");

  function refreshData() {
    const custs = getCustomers();
    setCustomers(custs);
    if (custs.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(custs[0].id);
    }
    if (custs.length === 0) setIsNewOwner(true);
  }

  useEffect(() => {
    refreshData();
  }, []);

  // Flatten pets with their owner information
  const allPets = customers.flatMap((c) =>
    (c.pets || []).map((p) => ({
      ...p,
      ownerId: c.id,
      ownerName: c.name,
      ownerPhone: c.phone,
    }))
  );

  const filtered = allPets.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  function handleCreatePet(e: React.FormEvent) {
    e.preventDefault();
    if (!petName.trim()) return;

    // The dropdown displays customers[0] when nothing was picked, so use the same fallback here
    let targetCustomerId = selectedCustomerId || customers[0]?.id || "";
    let newCustomerToSave: MockCustomer | null = null;

    if (isNewOwner) {
      if (!newOwnerName.trim() || !newOwnerPhone.trim()) return;
      newCustomerToSave = {
        id: `c_${Date.now()}`,
        name: newOwnerName.trim(),
        phone: newOwnerPhone.trim(),
        pets: [],
      };
      targetCustomerId = newCustomerToSave.id;
    } else if (!targetCustomerId || !customers.some((c) => c.id === targetCustomerId)) {
      alert("Please choose an owner for this pet (or switch to 'New owner').");
      return;
    }

    const newPet: MockPet = {
      id: `p_${Date.now()}`,
      name: petName.trim(),
      breed: petBreed.trim() || "Mixed Breed",
      size: petSize,
      coatType: coatType,
      weight: Number(weight) || 5,
      age: Number(age) || 1,
      warnings: selectedWarnings,
      vaccinationExpiry: vaccinationExpiry || undefined,
    };

    // Save the owner and pet together so a failure can never leave an owner without the pet
    if (newCustomerToSave) {
      saveCustomer({ ...newCustomerToSave, pets: [newPet] });
    } else if (!addPetToCustomer(targetCustomerId, newPet)) {
      alert("Could not save the pet because the owner was not found.");
      return;
    }
    refreshData();

    // Reset and close
    setIsAddPetOpen(false);
    setPetName("");
    setPetBreed("");
    setSelectedWarnings([]);
    setNewOwnerName("");
    setNewOwnerPhone("");
    setIsNewOwner(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Pets Directory
          </h1>
          <p className="text-muted-foreground">
            All registered pets, medical observations, and permanent warning notes
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setIsAddPetOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Pet
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search pet by name, breed, or owner..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Pet List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <PawPrint className="mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No pets found matching &quot;{searchQuery}&quot;
              </p>
              <Button
                variant="link"
                className="mt-2 text-sm"
                onClick={() => setIsAddPetOpen(true)}
              >
                Add a new pet
              </Button>
            </CardContent>
          </Card>
        ) : (
          filtered.map((pet) => (
            <Link key={pet.id} href={`/pets/${pet.id}`}>
              <Card className="transition-colors hover:bg-accent/50 shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {getInitials(pet.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{pet.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {pet.size}
                      </Badge>
                      {pet.warnings && pet.warnings.length > 0 && (
                        <Badge variant="warning" className="gap-1 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          {pet.warnings.length} Warning{pet.warnings.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {pet.breed} · {pet.coatType} coat
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>
                        Owner: <span className="font-medium text-foreground">{pet.ownerName}</span> ({pet.ownerPhone})
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ADD PET MODAL (Reverse Engineer: From Pets Page)
      ───────────────────────────────────────────────────────────── */}
      <Dialog open={isAddPetOpen} onOpenChange={setIsAddPetOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-primary" />
              Add Pet to Salon
            </DialogTitle>
            <DialogDescription>
              Assign the pet to an existing owner or register a new owner on the fly.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePet} className="space-y-4 pt-2">
            {/* Owner Section */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Pet Owner
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setIsNewOwner(!isNewOwner)}
                >
                  {isNewOwner ? "Select Existing Owner" : "+ Create New Owner"}
                </Button>
              </div>

              {isNewOwner ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Owner Name *</Label>
                    <Input
                      placeholder="e.g. Jessica Tan"
                      value={newOwnerName}
                      onChange={(e) => setNewOwnerName(e.target.value)}
                      required={isNewOwner}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Phone Number *</Label>
                    <Input
                      placeholder="+65 9123 4567"
                      value={newOwnerPhone}
                      onChange={(e) => setNewOwnerPhone(e.target.value)}
                      required={isNewOwner}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <Select
                    value={selectedCustomerId || customers[0]?.id || ""}
                    onValueChange={setSelectedCustomerId}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Choose owner" />
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
              )}
            </div>

            {/* Pet Info */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="petNameInput">Pet Name *</Label>
                <Input
                  id="petNameInput"
                  placeholder="e.g. Brownie"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="breedInput">Breed *</Label>
                <Input
                  id="breedInput"
                  placeholder="e.g. Maltipoo, Corgi"
                  value={petBreed}
                  onChange={(e) => setPetBreed(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Size</Label>
                <Select value={petSize} onValueChange={(val) => setPetSize(val as any)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PET_SIZE_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Coat Type</Label>
                <Select value={coatType} onValueChange={(val) => setCoatType(val as any)}>
                  <SelectTrigger className="bg-background">
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

              <div className="space-y-1">
                <Label className="text-xs">Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Age (years)</Label>
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Vaccination Expiry</Label>
                <Input
                  type="date"
                  value={vaccinationExpiry}
                  onChange={(e) => setVaccinationExpiry(e.target.value)}
                />
              </div>
            </div>

            {/* Warnings Section */}
            <div className="space-y-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-warning-foreground">
                <AlertTriangle className="h-3.5 w-3.5" />
                Permanent Warnings
              </div>
              <div className="flex flex-wrap gap-1">
                {PRESET_WARNINGS.map((w) => {
                  const isSelected = selectedWarnings.includes(w);
                  return (
                    <Badge
                      key={w}
                      variant={isSelected ? "warning" : "outline"}
                      className="cursor-pointer text-[11px] py-0.5 px-2 select-none"
                      onClick={() => togglePresetWarning(w)}
                    >
                      {w} {isSelected ? "✓" : "+"}
                    </Badge>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="Custom warning note..."
                  value={customWarning}
                  onChange={(e) => setCustomWarning(e.target.value)}
                  className="text-xs h-8 bg-background"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomWarning();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={addCustomWarning}>
                  Add
                </Button>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddPetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Pet</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
