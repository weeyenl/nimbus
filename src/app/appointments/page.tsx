"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Clock, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
} from "@/lib/utils";
import { getAppointments, MockAppointment } from "@/lib/mock-data";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<MockAppointment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    setAppointments(getAppointments());
  }, []);

  const filtered = appointments.filter((apt) => {
    const matchSearch =
      apt.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.petName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.groomerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === "ALL" || apt.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Appointments
          </h1>
          <p className="text-muted-foreground">
            Manage scheduled bookings and walk-in visits
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/appointments/new">
              <Plus className="mr-2 h-4 w-4" />
              New Booking
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/appointments/walk-in">
              <Clock className="mr-2 h-4 w-4" />
              Walk-in
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customer, pet, or groomer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.entries(APPOINTMENT_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Appointment List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <Clock className="mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No appointments found
              </p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((apt) => (
            <Link key={apt.id} href={`/appointments/${apt.id}`}>
              <Card className="transition-colors hover:bg-accent/50 shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex flex-col items-center justify-center rounded-lg bg-muted px-3 py-2 text-center min-w-[76px]">
                    <span className="text-[11px] font-medium text-muted-foreground">{apt.dateStr}</span>
                    <span className="text-sm font-bold">{apt.startTime}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">
                        {apt.petName}
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          ({apt.petBreed})
                        </span>
                      </p>
                      {apt.isWalkIn && (
                        <Badge variant="outline" className="text-xs">
                          Walk-in
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {apt.customerName} · {apt.serviceName} (${apt.servicePrice}) · ✂ {apt.groomerName}
                    </p>
                  </div>

                  <Badge
                    className={APPOINTMENT_STATUS_COLORS[apt.status] || ""}
                    variant="secondary"
                  >
                    {APPOINTMENT_STATUS_LABELS[apt.status]}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
