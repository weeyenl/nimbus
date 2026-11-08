"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  PawPrint,
  Scissors,
  Clock,
  Plus,
  DollarSign,
  BarChart3,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  StickyNote,
} from "lucide-react";
import Link from "next/link";
import {
  getAppointments,
  getPayments,
  getCustomers,
  getStaff,
  MockAppointment,
  PaymentRecord,
  MockPet,
  localDateStr,
  isPaymentFromDate,
  getPaymentInstallments,
  getPetEffectiveVaccinationExpiry,
} from "@/lib/mock-data";
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
  formatPrice,
  getVaccinationStatus,
} from "@/lib/utils";
import type { UserRole } from "@/components/layout/app-shell";

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<MockAppointment[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [petsById, setPetsById] = useState<Record<string, MockPet>>({});
  const [role, setRole] = useState<UserRole>("OWNER");
  const [activeStaffName, setActiveStaffName] = useState<string>("");
  const [myQueueOnly, setMyQueueOnly] = useState(false);

  const loadData = () => {
    setAppointments(getAppointments());
    setPayments(getPayments());
    const customers = getCustomers();
    setCustomerCount(customers.length);

    const map: Record<string, MockPet> = {};
    customers.forEach((c) => c.pets.forEach((p) => (map[p.id] = p)));
    setPetsById(map);

    const savedRole = (localStorage.getItem("nimbus_current_role") as UserRole | null) || "OWNER";
    setRole(savedRole);
    const activeId = localStorage.getItem("nimbus_active_staff_id");
    const staff = activeId ? getStaff().find((s) => s.id === activeId) : undefined;
    setActiveStaffName(staff?.name || "");
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

  const todaysAppointments = useMemo(() => {
    return appointments
      .filter((apt) => apt.dateStr === todayStr)
      .filter((apt) => {
        if (!myQueueOnly || !activeStaffName) return true;
        return apt.groomerName === activeStaffName || apt.groomerId === localStorage.getItem("nimbus_active_staff_id");
      })
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  }, [appointments, todayStr, myQueueOnly, activeStaffName]);

  const inProgressCount = todaysAppointments.filter((apt) => apt.status === "IN_PROGRESS").length;
  const completedTodayCount = todaysAppointments.filter((apt) => apt.status === "DONE").length;

  const { cashCollectedToday, creditsRedeemedToday } = useMemo(() => {
    let collected = 0;
    let credits = 0;
    for (const p of payments) {
      for (const inst of getPaymentInstallments(p)) {
        if (isPaymentFromDate(inst.paidAt, todayStr)) {
          if (inst.method === "MEMBERSHIP_CREDIT") {
            credits += inst.amount;
          } else {
            collected += inst.amount;
          }
        }
      }
    }
    return { cashCollectedToday: collected, creditsRedeemedToday: credits };
  }, [payments, todayStr]);

  const canBook = role === "OWNER" || role === "RECEPTIONIST";
  const isOwner = role === "OWNER";
  const isGroomer = role === "GROOMER";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
          <p className="text-muted-foreground">
            {isGroomer
              ? "Welcome to your grooming station! Review pet alerts and today's queue."
              : "Welcome back! Here's your daily salon overview."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canBook && (
            <>
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
            </>
          )}
          {isGroomer && activeStaffName && (
            <Button
              variant={myQueueOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setMyQueueOnly((v) => !v)}
            >
              <Scissors className="mr-2 h-4 w-4" />
              {myQueueOnly ? `Showing: ${activeStaffName}` : "Filter: My Queue"}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysAppointments.length}</div>
            <p className="text-xs text-muted-foreground">appointments scheduled today</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">currently on table</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isGroomer ? "Completed Today" : "Total Customers"}
            </CardTitle>
            {isGroomer ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <Users className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isGroomer ? completedTodayCount : customerCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {isGroomer ? "sessions finished today" : "registered owners"}
            </p>
          </CardContent>
        </Card>

        {isOwner ? (
          <Card className="shadow-sm border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today&apos;s Collected Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatPrice(cashCollectedToday)}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                {creditsRedeemedToday > 0 ? (
                  <span className="text-[11px] text-muted-foreground">
                    +{formatPrice(creditsRedeemedToday)} club credits
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">Cash / Card / PayNow</span>
                )}
                <Link href="/reports" className="text-xs text-primary font-medium hover:underline">
                  Reports →
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isGroomer ? "Pets With Alerts Today" : "Completed Today"}
              </CardTitle>
              {isGroomer ? (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isGroomer
                  ? todaysAppointments.filter(
                      (a) => (petsById[a.petId]?.warnings?.length || 0) > 0
                    ).length
                  : completedTodayCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {isGroomer ? "require special handling" : "grooming sessions finished"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Today's Schedule & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Today&apos;s Schedule</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/calendar">View Calendar</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaysAppointments.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No appointments scheduled for today
                </div>
              ) : (
                todaysAppointments.map((apt) => {
                  const pet = petsById[apt.petId];
                  const hasWarnings = (pet?.warnings?.length || 0) > 0;
                  const vacStatus = pet
                    ? getVaccinationStatus(getPetEffectiveVaccinationExpiry(pet))
                    : null;

                  return (
                    <Link
                      key={apt.id}
                      href={`/appointments/${apt.id}`}
                      className="flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex flex-col items-center justify-center rounded-md bg-muted px-2.5 py-1.5 text-center min-w-[62px] shrink-0">
                          <span className="text-xs font-semibold">{apt.startTime}</span>
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-medium text-sm">{apt.petName}</span>
                            <span className="text-xs text-muted-foreground">
                              ({apt.petBreed})
                            </span>
                            {hasWarnings && (
                              <span
                                className="inline-flex items-center gap-0.5 rounded bg-red-100 text-red-700 px-1.5 py-0.5 text-[10px] font-semibold"
                                title={pet?.warnings.join(", ")}
                              >
                                <AlertTriangle className="h-3 w-3" /> Alert
                              </span>
                            )}
                            {vacStatus?.status === "EXPIRED" && (
                              <span
                                className="inline-flex items-center gap-0.5 rounded bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[10px] font-semibold"
                                title={vacStatus.label}
                              >
                                <ShieldAlert className="h-3 w-3" /> Vac Expired
                              </span>
                            )}
                            {apt.isWalkIn && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                Walk-in
                              </Badge>
                            )}
                            {apt.isPaid && (
                              <Badge variant="success" className="text-[10px] py-0 px-1.5">
                                Paid
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {apt.serviceName} · Groomer: {apt.groomerName}
                          </p>
                          {apt.notes && (
                            <p className="text-[11px] text-amber-800/90 flex items-center gap-1 truncate max-w-[320px]">
                              <StickyNote className="h-3 w-3 shrink-0" />
                              <span className="truncate">{apt.notes}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        className={`${APPOINTMENT_STATUS_COLORS[apt.status] || ""} shrink-0`}
                        variant="secondary"
                      >
                        {APPOINTMENT_STATUS_LABELS[apt.status]}
                      </Badge>
                    </Link>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions — role-aware */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {canBook && (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="h-auto flex-col gap-2 p-4 justify-center"
                >
                  <Link href="/appointments/new">
                    <Plus className="h-6 w-6 text-primary" />
                    <span className="font-semibold text-sm">New Booking</span>
                    <span className="text-xs text-muted-foreground">Book scheduled session</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-auto flex-col gap-2 p-4 justify-center"
                >
                  <Link href="/appointments/walk-in">
                    <Clock className="h-6 w-6 text-amber-500" />
                    <span className="font-semibold text-sm">Walk-in</span>
                    <span className="text-xs text-muted-foreground">Quick front-desk entry</span>
                  </Link>
                </Button>
              </>
            )}

            {isOwner ? (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="h-auto flex-col gap-2 p-4 justify-center"
                >
                  <Link href="/services">
                    <Sparkles className="h-6 w-6 text-indigo-500" />
                    <span className="font-semibold text-sm">Services &amp; Pricing</span>
                    <span className="text-xs text-muted-foreground">Matrix, Promos &amp; Packages</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-auto flex-col gap-2 p-4 justify-center"
                >
                  <Link href="/reports">
                    <BarChart3 className="h-6 w-6 text-emerald-500" />
                    <span className="font-semibold text-sm">Daily Reports</span>
                    <span className="text-xs text-muted-foreground">Sales &amp; booking stats</span>
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="h-auto flex-col gap-2 p-4 justify-center"
                >
                  <Link href="/calendar">
                    <Calendar className="h-6 w-6 text-indigo-500" />
                    <span className="font-semibold text-sm">Full Calendar</span>
                    <span className="text-xs text-muted-foreground">Day, Week &amp; Month view</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-auto flex-col gap-2 p-4 justify-center"
                >
                  <Link href="/pets">
                    <PawPrint className="h-6 w-6 text-emerald-500" />
                    <span className="font-semibold text-sm">Pets Directory</span>
                    <span className="text-xs text-muted-foreground">History &amp; handling alerts</span>
                  </Link>
                </Button>
              </>
            )}

            {role === "RECEPTIONIST" && (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="h-auto flex-col gap-2 p-4 justify-center sm:col-span-2"
                >
                  <Link href="/customers">
                    <Users className="h-6 w-6 text-primary" />
                    <span className="font-semibold text-sm">Customer Directory &amp; Packages</span>
                    <span className="text-xs text-muted-foreground">
                      Search owners, top-up memberships &amp; register pets
                    </span>
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
