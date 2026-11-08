"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Clock,
  Filter,
  AlertTriangle,
  StickyNote,
  ShieldAlert,
  Play,
  UserCheck,
} from "lucide-react";
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
  formatPrice,
  phoneMatchesQuery,
  getVaccinationStatus,
} from "@/lib/utils";
import {
  getAppointments,
  updateAppointmentStatus,
  getCustomers,
  getStaff,
  getPetEffectiveVaccinationExpiry,
  MockAppointment,
  MockPet,
  MockStaff,
  localDateStr,
} from "@/lib/mock-data";
import { showToast } from "@/components/ui/toast-system";
import type { UserRole } from "@/components/layout/app-shell";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<MockAppointment[]>([]);
  const [petsById, setPetsById] = useState<Record<string, MockPet>>({});
  const [staffList, setStaffList] = useState<MockStaff[]>([]);
  const [role, setRole] = useState<UserRole>("OWNER");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "UPCOMING" | "PAST">("ALL");
  const [groomerFilter, setGroomerFilter] = useState<string>("ALL");

  const loadData = () => {
    setAppointments(getAppointments());
    const map: Record<string, MockPet> = {};
    getCustomers().forEach((c) => c.pets.forEach((p) => (map[p.id] = p)));
    setPetsById(map);
    setStaffList(getStaff().filter((s) => s.isActive !== false));
    setRole((localStorage.getItem("nimbus_current_role") as UserRole | null) || "OWNER");
  };

  useEffect(() => {
    loadData();
    const onRefresh = () => loadData();
    window.addEventListener("nimbus-data-updated", onRefresh);
    window.addEventListener("nimbus-role-changed", onRefresh);
    return () => {
      window.removeEventListener("nimbus-data-updated", onRefresh);
      window.removeEventListener("nimbus-role-changed", onRefresh);
    };
  }, []);

  const todayStr = localDateStr();

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return appointments
      .filter((apt) => {
        const matchSearch =
          !searchQuery.trim() ||
          apt.customerName.toLowerCase().includes(q) ||
          apt.petName.toLowerCase().includes(q) ||
          apt.petBreed.toLowerCase().includes(q) ||
          apt.serviceName.toLowerCase().includes(q) ||
          apt.groomerName.toLowerCase().includes(q) ||
          (apt.notes || "").toLowerCase().includes(q) ||
          phoneMatchesQuery(apt.customerPhone, searchQuery);

        const matchStatus = statusFilter === "ALL" || apt.status === statusFilter;
        const matchGroomer = groomerFilter === "ALL" || apt.groomerId === groomerFilter;

        let matchDate = true;
        if (dateFilter === "TODAY") matchDate = apt.dateStr === todayStr;
        else if (dateFilter === "UPCOMING") matchDate = apt.dateStr >= todayStr;
        else if (dateFilter === "PAST") matchDate = apt.dateStr < todayStr;

        return matchSearch && matchStatus && matchGroomer && matchDate;
      })
      .sort((a, b) => {
        // Upcoming/today nearest first, or newest date first
        if (dateFilter === "PAST") {
          const cmp = b.dateStr.localeCompare(a.dateStr);
          return cmp !== 0 ? cmp : b.startTime.localeCompare(a.startTime);
        }
        const aUpcoming = a.dateStr >= todayStr ? 0 : 1;
        const bUpcoming = b.dateStr >= todayStr ? 0 : 1;
        if (aUpcoming !== bUpcoming) return aUpcoming - bUpcoming;
        if (aUpcoming === 0) {
          const d = a.dateStr.localeCompare(b.dateStr);
          return d !== 0 ? d : a.startTime.localeCompare(b.startTime);
        }
        const d = b.dateStr.localeCompare(a.dateStr);
        return d !== 0 ? d : b.startTime.localeCompare(a.startTime);
      });
  }, [appointments, searchQuery, statusFilter, groomerFilter, dateFilter, todayStr]);

  const handleQuickStatus = (
    e: React.MouseEvent,
    apt: MockAppointment,
    nextStatus: MockAppointment["status"]
  ) => {
    e.preventDefault();
    e.stopPropagation();
    updateAppointmentStatus(apt.id, nextStatus);
    setAppointments(getAppointments());
    showToast(
      `${apt.petName} marked as ${APPOINTMENT_STATUS_LABELS[nextStatus]}.`,
      "success"
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Appointments</h1>
          <p className="text-muted-foreground">
            Manage scheduled bookings and walk-in visits
          </p>
        </div>
        {role !== "GROOMER" && (
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
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customer, phone, pet, service, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto">
          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as typeof dateFilter)}>
            <SelectTrigger className="w-full lg:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Dates</SelectItem>
              <SelectItem value="TODAY">Today Only</SelectItem>
              <SelectItem value="UPCOMING">Today &amp; Upcoming</SelectItem>
              <SelectItem value="PAST">Past History</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-40">
              <Filter className="mr-2 h-4 w-4 shrink-0" />
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

          <Select value={groomerFilter} onValueChange={setGroomerFilter}>
            <SelectTrigger className="w-full lg:w-44">
              <SelectValue placeholder="All Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Staff</SelectItem>
              {staffList.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Appointment List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <Clock className="mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No appointments found</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((apt) => {
            const pet = petsById[apt.petId];
            const hasWarnings = (pet?.warnings?.length || 0) > 0;
            const vacStatus = pet
              ? getVaccinationStatus(getPetEffectiveVaccinationExpiry(pet))
              : null;

            return (
              <Link key={apt.id} href={`/appointments/${apt.id}`} className="block">
                <Card className="transition-colors hover:bg-accent/50 shadow-sm">
                  <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex flex-col items-center justify-center rounded-lg bg-muted px-3 py-2 text-center min-w-[82px] shrink-0">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {apt.dateStr === todayStr ? "Today" : apt.dateStr}
                        </span>
                        <span className="text-sm font-bold">{apt.startTime}</span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-semibold truncate">
                            {apt.petName}
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              ({apt.petBreed})
                            </span>
                          </p>
                          {hasWarnings && (
                            <Badge
                              variant="destructive"
                              className="text-[10px] py-0 px-1.5 gap-1"
                              title={pet?.warnings.join(", ")}
                            >
                              <AlertTriangle className="h-3 w-3" /> {pet?.warnings.length} Alert
                            </Badge>
                          )}
                          {vacStatus?.status === "EXPIRED" && (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1.5 bg-amber-50 text-amber-800 border-amber-300 gap-1"
                            >
                              <ShieldAlert className="h-3 w-3" /> Vac Expired
                            </Badge>
                          )}
                          {apt.isWalkIn && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                              Walk-in
                            </Badge>
                          )}
                          {apt.isPaid ? (
                            <Badge variant="success" className="text-[10px] py-0 px-1.5">
                              Paid
                            </Badge>
                          ) : apt.depositPaid && apt.depositPaid > 0 ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1.5 bg-blue-50 text-blue-800 border-blue-200"
                            >
                              Deposit {formatPrice(apt.depositPaid)}
                            </Badge>
                          ) : null}
                        </div>

                        <p className="text-sm text-muted-foreground truncate">
                          {apt.customerName} · {apt.serviceName} (
                          {formatPrice(apt.servicePrice)}) · ✂ {apt.groomerName}
                        </p>

                        {apt.notes && (
                          <p className="text-xs text-amber-800/90 flex items-center gap-1 truncate">
                            <StickyNote className="h-3 w-3 shrink-0" />
                            <span className="truncate">{apt.notes}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0">
                      {apt.status === "BOOKED" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={(e) => handleQuickStatus(e, apt, "ARRIVED")}
                        >
                          <UserCheck className="h-3 w-3" /> Check In
                        </Button>
                      )}
                      {apt.status === "ARRIVED" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={(e) => handleQuickStatus(e, apt, "IN_PROGRESS")}
                        >
                          <Play className="h-3 w-3" /> Start Groom
                        </Button>
                      )}

                      <Badge
                        className={APPOINTMENT_STATUS_COLORS[apt.status] || ""}
                        variant="secondary"
                      >
                        {APPOINTMENT_STATUS_LABELS[apt.status]}
                      </Badge>
                    </div>
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
