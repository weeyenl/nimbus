"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Calculator,
  Plus,
  Clock,
  DollarSign,
  Crown,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MOCK_SERVICES,
  MOCK_ADDONS,
  MEMBERSHIP_TIERS,
  calculateServicePrice,
  MockService,
} from "@/lib/mock-data";

export default function ServicesPage() {
  const [services, setServices] = useState<MockService[]>(MOCK_SERVICES);

  // Dynamic pricing preview state
  const [calcServiceId, setCalcServiceId] = useState("s1");
  const [calcSize, setCalcSize] = useState<"SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE">("SMALL");
  const [calcCoat, setCalcCoat] = useState("CURLY");

  const calculatedRate = calculateServicePrice(calcServiceId, calcSize, calcCoat);
  const selectedCalcService = services.find((s) => s.id === calcServiceId) || services[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Services & Pricing
          </h1>
          <p className="text-muted-foreground">
            Manage catalogue, dynamic price matrix, add-ons, and club memberships
          </p>
        </div>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="addons">Add-ons & Extras</TabsTrigger>
          <TabsTrigger value="memberships">Memberships</TabsTrigger>
        </TabsList>

        {/* TAB 1: SERVICES & DYNAMIC PRICING */}
        <TabsContent value="services" className="space-y-6 pt-4">
          {/* Dynamic Pricing Matrix Interactive Calculator */}
          <Card className="border-primary/30 bg-primary/5 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                Live Dynamic Price Calculator
              </CardTitle>
              <CardDescription>
                Test how pet size, coat type, and service combine to compute the appointment price.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-4 items-end">
                <div className="space-y-1.5">
                  <Label className="text-xs">Service</Label>
                  <Select value={calcServiceId} onValueChange={setCalcServiceId}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Pet Size</Label>
                  <Select
                    value={calcSize}
                    onValueChange={(val) => setCalcSize(val as any)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SMALL">Small (&lt; 5kg)</SelectItem>
                      <SelectItem value="MEDIUM">Medium (5-15kg)</SelectItem>
                      <SelectItem value="LARGE">Large (15-30kg)</SelectItem>
                      <SelectItem value="EXTRA_LARGE">Extra Large (&gt; 30kg)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Coat Type</Label>
                  <Select value={calcCoat} onValueChange={setCalcCoat}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SHORT">Short / Smooth</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LONG">Long / Silky</SelectItem>
                      <SelectItem value="DOUBLE">Double Coat (Fluffy)</SelectItem>
                      <SelectItem value="CURLY">Curly / Wool</SelectItem>
                      <SelectItem value="WIRE">Wire / Coarse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg bg-background p-3 border text-center">
                  <span className="text-xs text-muted-foreground block">Computed Price</span>
                  <span className="text-2xl font-bold text-primary">${calculatedRate}</span>
                  <span className="text-[11px] text-muted-foreground block">
                    Duration: ~{selectedCalcService.duration} mins
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services List Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id} className="shadow-sm flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">{service.name}</CardTitle>
                    <span className="text-lg font-bold text-primary">${service.basePrice}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Est. {service.duration} mins</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  <p className="text-xs text-muted-foreground">{service.description}</p>
                  <div className="rounded-md bg-muted/50 p-2 text-[11px] space-y-1">
                    <span className="font-semibold text-foreground block">Dynamic Surcharges:</span>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Medium Pet:</span> <span>+$20</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Large Pet:</span> <span>+$45</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Extra Large:</span> <span>+$75</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Curly/Double Coat:</span> <span>+$10</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: ADD-ONS & EXTRA CHARGES */}
        <TabsContent value="addons" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {MOCK_ADDONS.map((addon) => (
              <Card key={addon.id} className="shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">{addon.name}</CardTitle>
                    <Badge variant="secondary" className="font-bold text-sm">
                      +${addon.price}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{addon.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: CLUB MEMBERSHIPS */}
        <TabsContent value="memberships" className="space-y-4 pt-4">
          <div className="border rounded-xl bg-card p-4 sm:p-6 shadow-sm">
            <div className="text-center max-w-xl mx-auto mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Club Memberships</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Prepaid credit packages with bonus credits and included spa/grooming perks.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {MEMBERSHIP_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  className={`rounded-2xl border-2 p-5 flex flex-col justify-between transition-all ${
                    tier.name === "VIP" || tier.name === "SVIP"
                      ? "border-primary shadow-md"
                      : "border-border"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">{tier.displayName.replace(" Membership", "")}</h3>
                      {tier.hasQueuePriority && (
                        <Badge variant="default" className="text-[10px] gap-1 py-0">
                          <Crown className="h-3 w-3" /> Priority
                        </Badge>
                      )}
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold">${tier.price}</span>
                        <span className="text-xs text-emerald-600 font-bold">
                          (+${tier.bonusCredits} Bonus)
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                        {tier.totalCredits} Total Credits
                      </p>
                    </div>

                    <div className="border-t pt-3 space-y-2">
                      <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase block">
                        Included Benefits
                      </span>
                      {tier.includedBenefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs">
                          <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t">
                    <Badge variant="outline" className="w-full justify-center py-1 text-xs">
                      {tier.validityMonths} Month Validity
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-6">
              * Credit values estimated for grooming sessions; add-on counters deduct zero credits upon redemption.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
