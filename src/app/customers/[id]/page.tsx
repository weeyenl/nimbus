"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  PawPrint,
  Plus,
  Calendar,
  AlertTriangle,
  Syringe,
  Crown,
  CreditCard,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getInitials } from "@/lib/utils";
import {
  getCustomers,
  getAppointments,
  getCustomerMembership,
  purchaseMembership,
  MEMBERSHIP_TIERS,
  MockCustomer,
  MockAppointment,
  CustomerMembership,
} from "@/lib/mock-data";

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<MockCustomer | null>(null);
  const [appointments, setAppointments] = useState<MockAppointment[]>([]);
  const [membership, setMembership] = useState<CustomerMembership | undefined>();
  const [isBuyMembershipOpen, setIsBuyMembershipOpen] = useState(false);

  useEffect(() => {
    const custs = getCustomers();
    const found = custs.find((c) => c.id === params.id) || custs[0];
    setCustomer(found);

    if (found) {
      const apts = getAppointments().filter((a) => a.customerId === found.id || a.customerName === found.name);
      setAppointments(apts);

      const mem = getCustomerMembership(found.id);
      setMembership(mem);
    }
  }, [params.id]);

  if (!customer) return null;

  function handleBuyTier(tierName: "BASIC" | "STANDARD" | "VIP" | "SVIP") {
    const newMem = purchaseMembership(customer!.id, tierName);
    setMembership(newMem);
    setIsBuyMembershipOpen(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
              {membership && (
                <Badge variant="default" className="text-xs gap-1 py-0.5">
                  <Crown className="h-3 w-3 text-amber-400" /> {membership.displayName}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">Customer Profile</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setIsBuyMembershipOpen(true)}
        >
          <Crown className="h-4 w-4 text-amber-500" />
          {membership ? "Upgrade Membership" : "Assign Club Membership"}
        </Button>
      </div>

      {/* Contact Info & Membership Summary Strip */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Contact Info */}
        <Card className="shadow-sm">
          <CardContent className="flex flex-col justify-center space-y-2 p-4">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{customer.address}</span>
              </div>
            )}
            {customer.referralSource && (
              <div className="pt-1">
                <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Source: {customer.referralSource}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Membership Details Card */}
        <Card className={`shadow-sm ${membership ? "border-primary/40 bg-primary/5" : "bg-card"}`}>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            {membership ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-base text-primary">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <span>{membership.displayName}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Exp: {membership.expiryDate}
                  </Badge>
                </div>

                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-muted-foreground">Remaining Balance:</span>
                    <span className="text-2xl font-extrabold text-foreground">
                      ${membership.remainingCredits}
                      <span className="text-xs text-muted-foreground font-normal"> / {membership.totalCredits} credits</span>
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (membership.remainingCredits / membership.totalCredits) * 100)}%` }}
                    />
                  </div>
                </div>

                {membership.bonusAllowances && membership.bonusAllowances.length > 0 && (
                  <div className="border-t pt-2 space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground block">Included Add-on Allowances:</span>
                    {membership.bonusAllowances.map((allowance) => (
                      <div key={allowance.id} className="flex justify-between text-xs">
                        <span>{allowance.name}</span>
                        <span className="font-bold text-primary">{allowance.remaining} remaining</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <Crown className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-semibold">No Active Club Membership</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Prepay credits and unlock free Spa & Priority perks.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 text-xs"
                  onClick={() => setIsBuyMembershipOpen(true)}
                >
                  View Packages
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pets" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="pets" className="flex-1 sm:flex-none">
            <PawPrint className="mr-2 h-4 w-4" />
            Registered Pets ({customer.pets.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 sm:flex-none">
            <Calendar className="mr-2 h-4 w-4" />
            Appointments ({appointments.length})
          </TabsTrigger>
        </TabsList>

        {/* Pets Tab */}
        <TabsContent value="pets" className="space-y-4 pt-2">
          <div className="flex justify-end">
            <Button asChild size="sm">
              <Link href={`/customers/${customer.id}/pets/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Pet
              </Link>
            </Button>
          </div>

          {customer.pets.map((pet) => (
            <Card key={pet.id} className="overflow-hidden shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                      {getInitials(pet.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{pet.name}</h3>
                      {pet.warnings.length > 0 && (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {pet.breed} · {pet.age} yrs · {pet.weight}kg
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">{pet.size}</Badge>
                      <Badge variant="secondary">{pet.coatType}</Badge>
                      {pet.vaccinationExpiry && (
                        <Badge variant="outline" className="gap-1">
                          <Syringe className="h-3 w-3" />
                          Vax: {pet.vaccinationExpiry}
                        </Badge>
                      )}
                    </div>

                    {pet.warnings.length > 0 && (
                      <div className="mt-3 rounded-md border border-warning/30 bg-warning/10 p-3">
                        <div className="flex items-center gap-1 text-sm font-medium text-warning-foreground">
                          <AlertTriangle className="h-4 w-4" />
                          Permanent Warnings
                        </div>
                        <ul className="mt-1 space-y-0.5 text-sm">
                          {pet.warnings.map((w, i) => (
                            <li key={i}>• {w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/pets/${pet.id}`}>View Pet</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-3 pt-2">
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg bg-card p-4">
              No appointments on record yet for this customer.
            </div>
          ) : (
            appointments.map((apt) => (
              <Link key={apt.id} href={`/appointments/${apt.id}`}>
                <Card className="hover:bg-muted/40 transition-colors shadow-sm">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-sm">{apt.petName} — {apt.serviceName}</p>
                      <p className="text-xs text-muted-foreground">
                        {apt.dateStr} at {apt.startTime} · Groomer: {apt.groomerName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {apt.isPaid && (
                        <Badge variant="success" className="text-xs">
                          Paid
                        </Badge>
                      )}
                      <Badge variant="secondary">{apt.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* ASSIGN / PURCHASE MEMBERSHIP DIALOG */}
      <Dialog open={isBuyMembershipOpen} onOpenChange={setIsBuyMembershipOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Assign Club Membership to {customer.name}
            </DialogTitle>
            <DialogDescription>
              Select a tier to add prepaid grooming credits and included perks.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            {MEMBERSHIP_TIERS.map((tier) => (
              <div
                key={tier.id}
                className="border-2 rounded-xl p-4 flex flex-col justify-between hover:border-primary cursor-pointer transition-all bg-card"
                onClick={() => handleBuyTier(tier.name)}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{tier.displayName}</span>
                    <span className="font-extrabold text-base text-primary">${tier.price}</span>
                  </div>
                  <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                    +{tier.bonusCredits} Bonus = ${tier.totalCredits} Credits
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {tier.validityMonths} Months · {tier.includedBenefits[0]}
                  </p>
                </div>
                <Button size="sm" className="w-full mt-3 text-xs">
                  Select {tier.displayName.replace(" Membership", "")}
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsBuyMembershipOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
