"use client";

import React, { useMemo, useState } from "react";
import { Check, ChevronsUpDown, PawPrint, Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, phoneMatchesQuery } from "@/lib/utils";
import { MockCustomer } from "@/lib/mock-data";

interface CustomerComboboxProps {
  customers: MockCustomer[];
  value: string;
  onChange: (customerId: string) => void;
  placeholder?: string;
  showNewLink?: boolean;
}

export function CustomerCombobox({
  customers,
  value,
  onChange,
  placeholder = "Search owner name, phone, or pet...",
  showNewLink = true,
}: CustomerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => customers.find((c) => c.id === value),
    [customers, value]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        phoneMatchesQuery(c.phone, query) ||
        (c.pets || []).some(
          (p) =>
            p.name.toLowerCase().includes(needle) ||
            (p.breed || "").toLowerCase().includes(needle)
        )
    );
  }, [customers, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-10 px-3"
        >
          {selected ? (
            <span className="truncate text-left">
              <span className="font-medium">{selected.name}</span>{" "}
              <span className="text-muted-foreground">({selected.phone})</span>
              {selected.pets?.length > 0 && (
                <span className="text-xs text-muted-foreground ml-1.5">
                  · {selected.pets.map((p) => p.name).join(", ")}
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground truncate">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Type owner name, phone, or pet..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
            autoFocus
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-0.5">
          {filtered.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground space-y-2">
              <p>No matching customer or pet found.</p>
              {showNewLink && (
                <Button asChild size="sm" variant="outline" className="h-7 text-xs gap-1">
                  <Link href="/customers/new">
                    <UserPlus className="h-3 w-3" /> Add New Customer
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            filtered.map((c) => {
              const isSelected = c.id === value;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onChange(c.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "w-full flex items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent",
                    isSelected && "bg-primary/10 text-primary"
                  )}
                >
                  <Check
                    className={cn(
                      "h-3.5 w-3.5 mt-0.5 shrink-0",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {c.name}{" "}
                      <span className="font-normal text-muted-foreground">({c.phone})</span>
                    </div>
                    {c.pets && c.pets.length > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate mt-0.5">
                        <PawPrint className="h-2.5 w-2.5 shrink-0 text-primary/70" />
                        <span className="truncate">
                          {c.pets.map((p) => `${p.name} (${p.breed})`).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
