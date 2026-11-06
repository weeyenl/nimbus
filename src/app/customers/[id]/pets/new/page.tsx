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
import { PET_SIZE_LABELS } from "@/lib/utils";

const COAT_TYPES = [
  { value: "SHORT", label: "Short" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LONG", label: "Long" },
  { value: "DOUBLE", label: "Double Coat" },
  { value: "WIRE", label: "Wire / Coarse" },
  { value: "CURLY", label: "Curly / Wool" },
];

export default function NewPetPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      customerId: params.id,
      name: formData.get("name"),
      breed: formData.get("breed"),
      age: formData.get("age"),
      size: formData.get("size"),
      weight: formData.get("weight"),
      coatType: formData.get("coatType"),
      permanentNotes: formData.get("permanentNotes"),
      isWarning: formData.get("isWarning") === "on",
    };

    console.log("Adding pet:", data);
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

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Pet Profile</CardTitle>
          <CardDescription>
            Enter details, coat type, and any health or behavioral warnings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Pet Name *</Label>
                <Input id="name" name="name" placeholder="e.g. Mochi" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="breed">Breed</Label>
                <Input id="breed" name="breed" placeholder="e.g. Toy Poodle" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
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

              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input id="weight" name="weight" type="number" step="0.1" placeholder="4.5" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="age">Age (years)</Label>
                <Input id="age" name="age" type="number" min="0" placeholder="3" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="permanentNotes">Permanent Warnings / Health Notes</Label>
              </div>
              <Textarea
                id="permanentNotes"
                name="permanentNotes"
                placeholder="Important warnings: e.g. bites when paws touched, sensitive skin, collapsed trachea, heart murmur..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Warnings will be highlighted in orange across appointments and the pet profile.
              </p>
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
