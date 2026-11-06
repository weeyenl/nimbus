"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Phone, ChevronRight, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { getCustomers, MockCustomer } from "@/lib/mock-data";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<MockCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setCustomers(getCustomers());
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
            Customers
          </h1>
          <p className="text-muted-foreground">
            Manage pet owners and their registered pets
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
          filtered.map((customer) => (
            <Link key={customer.id} href={`/customers/${customer.id}`}>
              <Card className="transition-colors hover:bg-accent/50 shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(customer.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{customer.name}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Phone className="h-3 w-3" />
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
