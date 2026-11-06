"use client";

import React, { useState, useEffect } from "react";
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
  Clock,
  HeartPulse,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/utils";
import {
  getCustomers,
  getGroomingRecords,
  MockPet,
  MockCustomer,
  GroomingRecord,
} from "@/lib/mock-data";

export default function PetDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [pet, setPet] = useState<MockPet | null>(null);
  const [owner, setOwner] = useState<MockCustomer | null>(null);
  const [records, setRecords] = useState<GroomingRecord[]>([]);

  useEffect(() => {
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

    if (!foundPet && customers[0]?.pets[0]) {
      foundPet = customers[0].pets[0];
      foundOwner = customers[0];
    }

    setPet(foundPet);
    setOwner(foundOwner);
    if (foundPet) {
      setRecords(getGroomingRecords(foundPet.id));
    }
  }, [params.id]);

  if (!pet || !owner) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center gap-3">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
              {getInitials(pet.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{pet.name}</h1>
              {pet.warnings.length > 0 && (
                <AlertTriangle className="h-5 w-5 text-warning" />
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {pet.breed} · Owner:{" "}
              <Link href={`/customers/${owner.id}`} className="font-semibold text-primary hover:underline">
                {owner.name} ({owner.phone})
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Permanent Warning Banner */}
      {pet.warnings.length > 0 && (
        <div className="rounded-lg border-2 border-warning/40 bg-warning/10 p-4 shadow-sm">
          <div className="flex items-center gap-2 font-semibold text-warning-foreground">
            <AlertTriangle className="h-5 w-5" />
            Permanent Health & Behaviour Warnings
          </div>
          <ul className="mt-2 space-y-1">
            {pet.warnings.map((w, idx) => (
              <li key={idx} className="text-sm font-medium">• {w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Pet Info Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Ruler className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Size</p>
              <p className="font-semibold text-sm">{pet.size}</p>
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
              <p className="font-semibold text-sm">{pet.age} years</p>
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

      {/* Vaccinations */}
      {pet.vaccinationExpiry && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Syringe className="h-4 w-4 text-primary" />
              Vaccination Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-semibold text-sm">Core Vaccinations (Rabies, DHPP)</p>
                <p className="text-xs text-muted-foreground">Annual booster cycle</p>
              </div>
              <Badge variant="success">
                Expires: {pet.vaccinationExpiry}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grooming History Timeline (Per-visit record) */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HeartPulse className="h-5 w-5 text-primary" />
              Visit History Timeline ({records.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No grooming records logged yet for {pet.name}.
            </div>
          ) : (
            <div className="space-y-6">
              {records.map((record, index) => (
                <div key={record.id} className="relative pl-6 pb-6 border-l-2 border-primary/30 last:border-l-0 last:pb-0">
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
                          <span className="font-semibold text-muted-foreground">Style / Haircut: </span>
                          <span className="text-foreground">{record.haircutStyle}</span>
                        </div>
                      )}
                      {record.bladeGuardLength && (
                        <div>
                          <span className="font-semibold text-muted-foreground">Blade / Guard: </span>
                          <span className="text-foreground">{record.bladeGuardLength}</span>
                        </div>
                      )}
                    </div>

                    {/* Skin & Coat Condition */}
                    {record.skinConditions && record.skinConditions.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-muted-foreground">Skin & Coat Condition:</span>
                        <div className="flex flex-wrap gap-1">
                          {record.skinConditions.map((cond, i) => (
                            <Badge key={i} variant={cond === "Normal" ? "outline" : "warning"} className="text-[11px]">
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

                    {/* Issue locations */}
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

                    {/* Health observations & Behaviour */}
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

                    {/* Recommendations */}
                    {record.recommendationToOwner && (
                      <div className="rounded-md bg-blue-50 border border-blue-200 p-2.5 text-xs text-blue-900 mt-2">
                        <span className="font-bold">💡 Staff Recommendation: </span>
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
    </div>
  );
}
