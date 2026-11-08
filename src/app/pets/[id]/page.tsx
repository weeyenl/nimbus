"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Scissors,
  Syringe,
  Weight,
  Ruler,
  HeartPulse,
  Edit,
  Plus,
  X,
  Check,
  Camera,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
} from "@/lib/utils";
import {
  getCustomers,
  getGroomingRecords,
  updatePet,
  getPetEffectiveVaccinationExpiry,
  newId,
  MockPet,
  MockCustomer,
  GroomingRecord,
  PetVaccination,
} from "@/lib/mock-data";
import { showToast } from "@/components/ui/toast-system";
import type { UserRole } from "@/components/layout/app-shell";

export default function PetDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loaded, setLoaded] = useState(false);
  const [role, setRole] = useState<UserRole>("OWNER");
  const [pet, setPet] = useState<MockPet | null>(null);
  const [owner, setOwner] = useState<MockCustomer | null>(null);
  const [records, setRecords] = useState<GroomingRecord[]>([]);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [editName, setEditName] = useState("");
  const [editBreed, setEditBreed] = useState("");
  const [editAge, setEditAge] = useState<string>("3");
  const [editSize, setEditSize] = useState<MockPet["size"]>("MEDIUM");
  const [editWeight, setEditWeight] = useState<string>("8");
  const [editCoatType, setEditCoatType] = useState<MockPet["coatType"]>("MEDIUM");
  const [editVaccinations, setEditVaccinations] = useState<PetVaccination[]>([]);
  const [newVacName, setNewVacName] = useState("");
  const [newVacGiven, setNewVacGiven] = useState("");
  const [newVacExpiry, setNewVacExpiry] = useState("");
  const [editWarnings, setEditWarnings] = useState<string[]>([]);
  const [customWarning, setCustomWarning] = useState("");

  const refreshPetData = () => {
    setRole((localStorage.getItem("nimbus_current_role") as UserRole | null) || "OWNER");
    const customers = getCustomers();
    let foundPet: MockPet | null = null;
    let foundOwner: MockCustomer | null = null;

    for (const c of customers) {
      const p = c.pets.find((petItem) => petItem.id === params.id);
      if (p) {
        foundPet = p;
        foundOwner = c;
        break;
      }
    }

    setPet(foundPet);
    setOwner(foundOwner);
    setLoaded(true);
    if (foundPet) {
      setRecords(getGroomingRecords(foundPet.id));
    }
  };

  useEffect(() => {
    refreshPetData();
    const onRefresh = () => refreshPetData();
    window.addEventListener("nimbus-data-updated", onRefresh);
    window.addEventListener("nimbus-role-changed", onRefresh);
    return () => {
      window.removeEventListener("nimbus-data-updated", onRefresh);
      window.removeEventListener("nimbus-role-changed", onRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const openEditModal = () => {
    if (!pet) return;
    setEditPhotoUrl(pet.photoUrl || "");
    setEditName(pet.name);
    setEditBreed(pet.breed);
    setEditAge(String(pet.age));
    setEditSize(pet.size);
    setEditWeight(String(pet.weight));
    setEditCoatType(pet.coatType);

    if (pet.vaccinations && pet.vaccinations.length > 0) {
      setEditVaccinations([...pet.vaccinations]);
    } else if (pet.vaccinationExpiry) {
      setEditVaccinations([
        {
          id: newId("vac"),
          name: "Core Vaccine (DHPP / Rabies)",
          expiryDate: pet.vaccinationExpiry,
        },
      ]);
    } else {
      setEditVaccinations([]);
    }

    setNewVacName("");
    setNewVacGiven("");
    setNewVacExpiry("");
    setEditWarnings([...pet.warnings]);
    setCustomWarning("");
    setIsEditOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setEditPhotoUrl(dataUrl);
      showToast("Photo ready — save profile to update.", "info");
    } catch {
      showToast("Could not process image file.", "error");
    }
  };

  const toggleWarning = (warning: string) => {
    if (editWarnings.includes(warning)) {
      setEditWarnings(editWarnings.filter((w) => w !== warning));
    } else {
      setEditWarnings([...editWarnings, warning]);
    }
  };

  const addCustomWarning = () => {
    if (customWarning.trim() && !editWarnings.includes(customWarning.trim())) {
      setEditWarnings([...editWarnings, customWarning.trim()]);
      setCustomWarning("");
    }
  };

  const handleAddVaccination = () => {
    if (!newVacName.trim() || !newVacExpiry) {
      showToast("Enter both vaccine name and expiry date.", "error");
      return;
    }
    setEditVaccinations((prev) => [
      ...prev,
      {
        id: newId("vac"),
        name: newVacName.trim(),
        dateGiven: newVacGiven || undefined,
        expiryDate: newVacExpiry,
      },
    ]);
    setNewVacName("");
    setNewVacGiven("");
    setNewVacExpiry("");
  };

  const handleSavePet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pet) return;

    const parsedAge = parseFloat(editAge);
    const parsedWeight = parseFloat(editWeight);

    const updatedData: Partial<MockPet> = {
      name: editName.trim() || pet.name,
      breed: editBreed.trim() || pet.breed,
      age: Number.isFinite(parsedAge) && parsedAge >= 0 ? parsedAge : 1,
      size: editSize,
      weight: Number.isFinite(parsedWeight) && parsedWeight >= 0 ? parsedWeight : 5,
      coatType: editCoatType,
      photoUrl: editPhotoUrl || undefined,
      vaccinations: editVaccinations,
      vaccinationExpiry:
        editVaccinations.length > 0
          ? [...editVaccinations].map((v) => v.expiryDate).sort()[0]
          : undefined,
      warnings: editWarnings,
    };

    updatePet(pet.id, updatedData);
    setPet({ ...pet, ...updatedData });
    setIsEditOpen(false);
    showToast(`Updated ${updatedData.name}'s profile!`, "success");
  };

  if (!loaded) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Loading pet profile...
      </div>
    );
  }

  if (!pet || !owner) {
    return (
      <Card className="mx-auto max-w-md mt-8 shadow-sm">
        <CardHeader>
          <CardTitle>Pet Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This pet record could not be found or was removed.
          </p>
          <Button asChild variant="outline">
            <Link href="/pets">Back to Pets Directory</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const displayedVaccinations: PetVaccination[] =
    pet.vaccinations && pet.vaccinations.length > 0
      ? pet.vaccinations
      : pet.vaccinationExpiry
      ? [
          {
            id: "legacy_vac",
            name: "Core Vaccinations (Rabies, DHPP)",
            expiryDate: pet.vaccinationExpiry,
          },
        ]
      : [];

  const effectiveVacStatus = getVaccinationStatus(getPetEffectiveVaccinationExpiry(pet));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16 border shadow-xs">
              {pet.photoUrl && (
                <AvatarImage src={pet.photoUrl} alt={pet.name} className="object-cover" />
              )}
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                {getInitials(pet.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{pet.name}</h1>
                {pet.warnings.length > 0 && (
                  <Badge variant="warning" className="flex items-center gap-1 font-semibold text-xs">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {pet.warnings.length} Alert{pet.warnings.length > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                {pet.breed} · Owner:{" "}
                {role === "GROOMER" ? (
                  <span className="font-semibold text-foreground">{owner.name}</span>
                ) : (
                  <Link
                    href={`/customers/${owner.id}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {owner.name} ({owner.phone})
                  </Link>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="outline" className="gap-2" onClick={openEditModal}>
            <Edit className="h-4 w-4" />
            Edit Pet Profile
          </Button>
          {role !== "GROOMER" && (
            <Button asChild className="gap-2">
              <Link href={`/appointments/new?customerId=${owner.id}&petId=${pet.id}`}>
                <Scissors className="h-4 w-4" />
                Book Appointment
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Permanent Warning Banner */}
      {pet.warnings.length > 0 && (
        <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-red-900">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Permanent Health &amp; Behaviour Warnings
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-red-800 hover:text-red-950"
              onClick={openEditModal}
            >
              Manage
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {pet.warnings.map((w, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="px-3 py-1 text-xs bg-white/80 text-red-900 border-red-300"
              >
                {w}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Pet Info Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Ruler className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Size</p>
              <p className="font-semibold text-sm">{PET_SIZE_LABELS[pet.size] || pet.size}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Weight className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Weight</p>
              <p className="font-semibold text-sm">{pet.weight} kg</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Age</p>
              <p className="font-semibold text-sm">{pet.age} years old</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Scissors className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Coat Type</p>
              <p className="font-semibold text-sm">{pet.coatType}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Multi-Vaccination Records Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Syringe className="h-4 w-4 text-primary" />
            Vaccination Records
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={openEditModal}>
            + Update Vaccines
          </Button>
        </CardHeader>
        <CardContent>
          {displayedVaccinations.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No vaccination expiry recorded. Click &quot;Update Vaccines&quot; to log records.
            </p>
          ) : (
            <div className="space-y-2">
              {displayedVaccinations.map((v) => {
                const st = getVaccinationStatus(v.expiryDate);
                return (
                  <div
                    key={v.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                  >
                    <div>
                      <p className="font-semibold text-sm">{v.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.dateGiven ? `Given: ${v.dateGiven}` : "Vaccination certificate on file"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        st.status === "EXPIRED"
                          ? "destructive"
                          : st.status === "EXPIRING_SOON"
                          ? "warning"
                          : "success"
                      }
                    >
                      {st.label}
                    </Badge>
                  </div>
                );
              })}
              {effectiveVacStatus.status === "EXPIRED" && (
                <p className="text-xs text-destructive font-medium pt-1">
                  Action needed: Remind {owner.name} to submit updated vaccination proof before the next visit.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grooming History Timeline */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <HeartPulse className="h-5 w-5 text-primary" />
            Visit History Timeline ({records.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No grooming records logged yet for {pet.name}. Completed appointments log styles and skin observations here.
            </div>
          ) : (
            <div className="space-y-6">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="relative pl-6 pb-6 border-l-2 border-primary/30 last:border-l-0 last:pb-0"
                >
                  <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-primary" />
                  <div className="space-y-3 rounded-lg border bg-card p-4 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base">{record.dateStr}</span>
                        <Badge variant="secondary">{record.serviceDone}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        ✂ Groomer: {record.groomerName}
                      </span>
                    </div>

                    <div className="grid gap-2 text-xs sm:grid-cols-2">
                      {record.haircutStyle && (
                        <div>
                          <span className="font-semibold text-muted-foreground">
                            Style / Haircut:{" "}
                          </span>
                          <span className="text-foreground">{record.haircutStyle}</span>
                        </div>
                      )}
                      {record.bladeGuardLength && (
                        <div>
                          <span className="font-semibold text-muted-foreground">
                            Blade / Guard:{" "}
                          </span>
                          <span className="text-foreground">{record.bladeGuardLength}</span>
                        </div>
                      )}
                    </div>

                    {record.skinConditions && record.skinConditions.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-muted-foreground">
                          Skin &amp; Coat Condition:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {record.skinConditions.map((cond, i) => (
                            <Badge
                              key={i}
                              variant={cond === "Normal" ? "outline" : "warning"}
                              className="text-[11px]"
                            >
                              {cond}
                            </Badge>
                          ))}
                        </div>
                        {record.skinConditionNotes && (
                          <p className="text-xs text-muted-foreground mt-1 bg-muted/50 p-2 rounded">
                            {record.skinConditionNotes}
                          </p>
                        )}
                      </div>
                    )}

                    {record.issueLocations && record.issueLocations.length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-muted-foreground">Locations:</span>
                        <div className="flex gap-1 flex-wrap">
                          {record.issueLocations.map((loc, i) => (
                            <Badge key={i} variant="outline" className="text-[10px]">
                              {loc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {record.healthObservations && (
                      <div className="text-xs">
                        <span className="font-semibold text-muted-foreground">Observations: </span>
                        <span>{record.healthObservations}</span>
                      </div>
                    )}

                    {record.behaviour && (
                      <div className="text-xs">
                        <span className="font-semibold text-muted-foreground">Behaviour: </span>
                        <span>{record.behaviour}</span>
                      </div>
                    )}

                    {record.recommendationToOwner && (
                      <div className="rounded-md bg-blue-50 border border-blue-200 p-2.5 text-xs text-blue-900 mt-2">
                        <span className="font-bold">Staff Recommendation: </span>
                        {record.recommendationToOwner}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Pet Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pet Profile: {pet.name}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSavePet} className="space-y-4 pt-2">
            {/* Photo Editor */}
            <div className="flex items-center gap-4 rounded-lg border bg-muted/20 p-3">
              <Avatar className="h-14 w-14 border shrink-0">
                {editPhotoUrl && (
                  <AvatarImage src={editPhotoUrl} alt={editName} className="object-cover" />
                )}
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {getInitials(editName || pet.name)}
                </AvatarFallback>
              </Avatar>
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
                  {editPhotoUrl ? "Change Photo" : "Upload Photo"}
                </Button>
                {editPhotoUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-destructive"
                    onClick={() => setEditPhotoUrl("")}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="petName">Pet Name *</Label>
                <Input
                  id="petName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="petBreed">Breed *</Label>
                <Input
                  id="petBreed"
                  value={editBreed}
                  onChange={(e) => setEditBreed(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="petSize">Size Category</Label>
                <Select
                  value={editSize}
                  onValueChange={(val) => setEditSize(val as MockPet["size"])}
                >
                  <SelectTrigger id="petSize">
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

              <div className="space-y-2">
                <Label htmlFor="petWeight">Weight (kg)</Label>
                <Input
                  id="petWeight"
                  type="number"
                  step="0.1"
                  min="0"
                  value={editWeight}
                  onChange={(e) => setEditWeight(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="petAge">Age (Years)</Label>
                <Input
                  id="petAge"
                  type="number"
                  step="0.5"
                  min="0"
                  max="30"
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coatType">Coat Type</Label>
              <Select
                value={editCoatType}
                onValueChange={(val) => setEditCoatType(val as MockPet["coatType"])}
              >
                <SelectTrigger id="coatType">
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

            {/* Multi-Vaccination Records Editor */}
            <div className="space-y-2.5 border-t pt-3">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Syringe className="h-3.5 w-3.5 text-primary" />
                Vaccination Records
              </Label>

              {editVaccinations.length > 0 && (
                <div className="space-y-1.5">
                  {editVaccinations.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between text-xs border rounded px-2.5 py-1.5 bg-muted/20"
                    >
                      <span>
                        <strong>{v.name}</strong> · Exp: {v.expiryDate}
                        {v.dateGiven && ` (Given: ${v.dateGiven})`}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditVaccinations((prev) => prev.filter((item) => item.id !== v.id))
                        }
                        className="text-destructive hover:opacity-75"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-3">
                <Input
                  placeholder="Vaccine (e.g. Rabies)"
                  value={newVacName}
                  onChange={(e) => setNewVacName(e.target.value)}
                  className="text-xs h-8"
                />
                <Input
                  type="date"
                  value={newVacGiven}
                  onChange={(e) => setNewVacGiven(e.target.value)}
                  title="Date given"
                  className="text-xs h-8"
                />
                <div className="flex gap-1.5">
                  <Input
                    type="date"
                    value={newVacExpiry}
                    onChange={(e) => setNewVacExpiry(e.target.value)}
                    title="Expiry date"
                    className="text-xs h-8 flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 px-2"
                    onClick={handleAddVaccination}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Permanent Warning Management */}
            <div className="space-y-2 pt-2 border-t">
              <Label className="flex items-center gap-1.5 text-warning-foreground font-semibold">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Permanent Warnings &amp; Behavioural Alerts
              </Label>

              {editWarnings.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 rounded border">
                  {editWarnings.map((w) => (
                    <Badge
                      key={w}
                      variant="warning"
                      className="gap-1 cursor-pointer hover:bg-warning/80"
                      onClick={() => toggleWarning(w)}
                    >
                      {w}
                      <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_WARNINGS.map((w) => {
                  const isSelected = editWarnings.includes(w);
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => toggleWarning(w)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        isSelected
                          ? "bg-warning/20 border-warning text-warning-foreground font-semibold"
                          : "bg-background hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {w}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="Or type custom warning..."
                  value={customWarning}
                  onChange={(e) => setCustomWarning(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomWarning();
                    }
                  }}
                  className="text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomWarning}
                  className="gap-1 text-xs whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Tag
                </Button>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2">
                <Check className="h-4 w-4" />
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
