"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  PawPrint,
  ChevronRight,
  AlertTriangle,
  User,
  Plus,
  X,
  Camera,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
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
import {
  getInitials,
  PET_SIZE_LABELS,
  COAT_TYPES,
  PRESET_WARNINGS,
  compressImageToDataUrl,
  getVaccinationStatus,
  phoneMatchesQuery,
} from "@/lib/utils";
import {
  getCustomers,
  saveCustomer,
  addPetToCustomer,
  getPetEffectiveVaccinationExpiry,
  newId,
  MockCustomer,
  MockPet,
} from "@/lib/mock-data";
import { CustomerCombobox } from "@/components/customer-combobox";
import { showToast } from "@/components/ui/toast-system";
import type { UserRole } from "@/components/layout/app-shell";

export default function PetsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customers, setCustomers] = useState<MockCustomer[]>([]);
  const [role, setRole] = useState<UserRole>("OWNER");
  const [searchQuery, setSearchQuery] = useState("");
  const [warningsOnly, setWarningsOnly] = useState(false);
  const [isAddPetOpen, setIsAddPetOpen] = useState(false);

  // Add Pet modal states
  const [isNewOwner, setIsNewOwner] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newOwnerPhone, setNewOwnerPhone] = useState("");

  const [photoUrl, setPhotoUrl] = useState("");
  const [petName, setPetName] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [petSize, setPetSize] = useState<MockPet["size"]>("SMALL");
  const [coatType, setCoatType] = useState<MockPet["coatType"]>("CURLY");
  const [weight, setWeight] = useState("5");
  const [age, setAge] = useState("2");
  const [vaccinationExpiry, setVaccinationExpiry] = useState("");
  const [selectedWarnings, setSelectedWarnings] = useState<string[]>([]);
  const [customWarning, setCustomWarning] = useState("");

  const refreshData = () => {
    const custs = getCustomers();
    setCustomers(custs);
    setRole((localStorage.getItem("nimbus_current_role") as UserRole | null) || "OWNER");
    if (custs.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(custs[0].id);
    }
    if (custs.length === 0) setIsNewOwner(true);
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("nimbus-data-updated", refreshData);
    window.addEventListener("nimbus-role-changed", refreshData);
    return () => {
      window.removeEventListener("nimbus-data-updated", refreshData);
      window.removeEventListener("nimbus-role-changed", refreshData);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allPets = customers.flatMap((c) =>
    (c.pets || []).map((p) => ({
      ...p,
      ownerId: c.id,
      ownerName: c.name,
      ownerPhone: c.phone,
    }))
  );

  const filtered = allPets.filter((p) => {
    if (warningsOnly && (!p.warnings || p.warnings.length === 0)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.breed.toLowerCase().includes(q) ||
      p.ownerName.toLowerCase().includes(q) ||
      (role !== "GROOMER" && phoneMatchesQuery(p.ownerPhone, searchQuery))
    );
  });

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
    } catch {
      showToast("Could not process image file.", "error");
    }
  }

  function handleCreatePet(e: React.FormEvent) {
    e.preventDefault();
    if (!petName.trim()) {
      showToast("Pet name is required.", "error");
      return;
    }

    let targetCustomerId = selectedCustomerId || customers[0]?.id || "";
    let newCustomerToSave: MockCustomer | null = null;

    if (isNewOwner) {
      if (!newOwnerName.trim() || !newOwnerPhone.trim()) {
        showToast("Owner name and phone number are required.", "error");
        return;
      }
      newCustomerToSave = {
        id: newId("c"),
        name: newOwnerName.trim(),
        phone: newOwnerPhone.trim(),
        pets: [],
      };
      targetCustomerId = newCustomerToSave.id;
    } else if (!targetCustomerId || !customers.some((c) => c.id === targetCustomerId)) {
      showToast("Please select an owner or switch to 'Create New Owner'.", "error");
      return;
    }

    const parsedWeight = parseFloat(weight);
    const parsedAge = parseFloat(age);

    const newPet: MockPet = {
      id: newId("p"),
      name: petName.trim(),
      breed: petBreed.trim() || "Mixed Breed",
      size: petSize,
      coatType,
      weight: Number.isFinite(parsedWeight) && parsedWeight >= 0 ? parsedWeight : 5,
      age: Number.isFinite(parsedAge) && parsedAge >= 0 ? parsedAge : 1,
      photoUrl: photoUrl || undefined,
      warnings: selectedWarnings,
      vaccinationExpiry: vaccinationExpiry || undefined,
      vaccinations: vaccinationExpiry
        ? [
            {
              id: newId("vac"),
              name: "Core Vaccine (DHPP / Rabies)",
              expiryDate: vaccinationExpiry,
            },
          ]
        : undefined,
    };

    if (newCustomerToSave) {
      saveCustomer({ ...newCustomerToSave, pets: [newPet] });
    } else if (!addPetToCustomer(targetCustomerId, newPet)) {
      showToast("Could not save pet because owner was not found.", "error");
      return;
    }

    refreshData();
    showToast(`Added ${newPet.name} to pets directory!`, "success");

    setIsAddPetOpen(false);
    setPhotoUrl("");
    setPetName("");
    setPetBreed("");
    setSelectedWarnings([]);
    setVaccinationExpiry("");
    setNewOwnerName("");
    setNewOwnerPhone("");
    setIsNewOwner(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pets Directory</h1>
          <p className="text-muted-foreground">
            Registered pets, vaccination alerts, and handling warnings
          </p>
        </div>
        {role !== "GROOMER" && (
          <Button size="sm" className="gap-2" onClick={() => setIsAddPetOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Pet
          </Button>
        )}
      </div>

      {/* Search & Warnings Filter */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search pet by name, breed, or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer border rounded-lg px-3 py-2 bg-card shrink-0">
          <Switch checked={warningsOnly} onCheckedChange={setWarningsOnly} />
          <span>Alerts Only</span>
        </label>
      </div>

      {/* Pet List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <PawPrint className="mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {searchQuery || warningsOnly
                  ? "No matching pets found."
                  : "No pets registered yet."}
              </p>
              {role !== "GROOMER" && (
                <Button
                  variant="link"
                  className="mt-2 text-sm"
                  onClick={() => setIsAddPetOpen(true)}
                >
                  Add a new pet
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filtered.map((pet) => {
            const vacStatus = getVaccinationStatus(getPetEffectiveVaccinationExpiry(pet));
            return (
              <Link key={pet.id} href={`/pets/${pet.id}`} className="block">
                <Card className="transition-colors hover:bg-accent/50 shadow-sm">
                  <CardContent className="flex items-center gap-4 p-4">
                    <Avatar className="h-12 w-12 border shrink-0">
                      {pet.photoUrl && (
                        <AvatarImage
                          src={pet.photoUrl}
                          alt={pet.name}
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {getInitials(pet.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold truncate">{pet.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {pet.size}
                        </Badge>
                        {pet.warnings && pet.warnings.length > 0 && (
                          <Badge variant="warning" className="gap-1 text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            {pet.warnings.length} Alert{pet.warnings.length > 1 ? "s" : ""}
                          </Badge>
                        )}
                        {vacStatus.status === "EXPIRED" && (
                          <Badge variant="destructive" className="gap-1 text-[10px]">
                            <ShieldAlert className="h-3 w-3" /> Vac Expired
                          </Badge>
                        )}
                        {vacStatus.status === "EXPIRING_SOON" && (
                          <Badge
                            variant="outline"
                            className="gap-1 text-[10px] border-amber-300 bg-amber-50 text-amber-800"
                          >
                            <ShieldAlert className="h-3 w-3" /> Vac Expiring
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {pet.breed} · {pet.coatType} coat
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>
                          Owner: <span className="font-medium text-foreground">{pet.ownerName}</span>
                          {role !== "GROOMER" && ` (${pet.ownerPhone})`}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>

      {/* ADD PET MODAL */}
      <Dialog open={isAddPetOpen} onOpenChange={setIsAddPetOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-primary" />
              Add Pet to Salon
            </DialogTitle>
            <DialogDescription>
              Assign the pet to an existing owner or register a new owner.
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
                <CustomerCombobox
                  customers={customers}
                  value={selectedCustomerId || customers[0]?.id || ""}
                  onChange={setSelectedCustomerId}
                  showNewLink={false}
                />
              )}
            </div>

            {/* Pet Photo Upload */}
            <div className="flex items-center gap-3 rounded-lg border p-2.5 bg-muted/20">
              <Avatar className="h-12 w-12 border shrink-0">
                {photoUrl && (
                  <AvatarImage src={photoUrl} alt="Preview" className="object-cover" />
                )}
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Camera className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-wrap items-center gap-2">
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
                  <Camera className="h-3.5 w-3.5" /> {photoUrl ? "Change Photo" : "Add Photo"}
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
                <Select
                  value={petSize}
                  onValueChange={(val) => setPetSize(val as MockPet["size"])}
                >
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
                <Select
                  value={coatType}
                  onValueChange={(val) => setCoatType(val as MockPet["coatType"])}
                >
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
                  min="0"
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
                  step="0.5"
                  min="0"
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

              {selectedWarnings.filter((w) => !PRESET_WARNINGS.includes(w as any)).length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedWarnings
                    .filter((w) => !PRESET_WARNINGS.includes(w as any))
                    .map((w) => (
                      <Badge
                        key={w}
                        variant="warning"
                        className="text-[11px] gap-1 cursor-pointer"
                        onClick={() => togglePresetWarning(w)}
                      >
                        {w} <X className="h-3 w-3" />
                      </Badge>
                    ))}
                </div>
              )}

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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={addCustomWarning}
                >
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
