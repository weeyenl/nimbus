"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Phone, ChevronRight, PawPrint, Crown, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { getCustomers, getMemberships, MockCustomer, CustomerMembership } from "@/lib/mock-data";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<MockCustomer[]>([]);
  const [memberships, setMemberships] = useState<CustomerMembership[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setCustomers(getCustomers());
    setMemberships(getMemberships());
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.pets.some((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Customers & Packages
          </h1>
          <p className="text-muted-foreground">
            Manage pet owners, registered pets, and membership credit packages
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/customers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by owner name, phone, or pet name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <Search className="mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "No customers found matching your search"
                  : "No customers yet"}
              </p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/customers/new">Add your first customer</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          filtered.map((customer) => {
            const mem = memberships.find((m) => m.customerId === customer.id);
            return (
              <Link key={customer.id} href={`/customers/${customer.id}`}>
                <Card className="transition-colors hover:bg-accent/50 shadow-sm">
                  <CardContent className="flex items-center gap-4 p-4">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(customer.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{customer.name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span>{customer.phone}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {customer.pets.map((pet) => (
                          <Badge key={pet.id} variant="secondary" className="text-xs font-normal">
                            <PawPrint className="mr-1 h-3 w-3 text-primary" />
                            {pet.name} ({pet.breed})
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Membership & Credit Balance Pill */}
                    {mem ? (
                      <div className="text-right shrink-0 hidden sm:block">
                        <Badge variant="outline" className="text-xs gap-1 border-primary/40 bg-primary/5 text-primary font-semibold">
                          <Crown className="h-3 w-3 text-amber-500" />
                          {mem.displayName.replace(" Membership", "")}
                        </Badge>
                        <div className="text-xs font-bold text-foreground mt-1">
                          ${mem.remainingCredits} <span className="text-[10px] text-muted-foreground font-normal">credits</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-right shrink-0 hidden sm:block">
                        <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          No Package
                        </span>
                      </div>
                    )}

                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
