"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  PawPrint,
  ChevronRight,
  AlertTriangle,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const MOCK_PETS = [
  {
    id: "p1",
    name: "Mochi",
    breed: "Toy Poodle",
    size: "SMALL",
    owner: "Sarah Tan",
    ownerPhone: "+65 9123 4567",
    hasWarning: true,
    warningCount: 2,
  },
  {
    id: "p2",
    name: "Biscuit",
    breed: "Shih Tzu",
    size: "SMALL",
    owner: "Sarah Tan",
    ownerPhone: "+65 9123 4567",
    hasWarning: false,
    warningCount: 0,
  },
  {
    id: "p3",
    name: "Cooper",
    breed: "Golden Retriever",
    size: "LARGE",
    owner: "James Wong",
    ownerPhone: "+65 8234 5678",
    hasWarning: false,
    warningCount: 0,
  },
  {
    id: "p4",
    name: "Coco",
    breed: "Maltese",
    size: "SMALL",
    owner: "Linda Lim",
    ownerPhone: "+65 9345 6789",
    hasWarning: true,
    warningCount: 1,
  },
];

export default function PetsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = MOCK_PETS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Pets
          </h1>
          <p className="text-muted-foreground">
            All registered pets and health warnings
          </p>
        </div>
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
            </CardContent>
          </Card>
        ) : (
          filtered.map((pet) => (
            <Link key={pet.id} href={`/pets/${pet.id}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(pet.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{pet.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {pet.size}
                      </Badge>
                      {pet.hasWarning && (
                        <Badge variant="warning" className="gap-1 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          {pet.warningCount} Warning{pet.warningCount > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {pet.breed}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>Owner: {pet.owner}</span>
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
