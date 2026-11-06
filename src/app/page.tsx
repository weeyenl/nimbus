"use client";

import React, { useState, useEffect } from "react";
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
  UserPlus,
  DollarSign,
  BarChart3,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  getAppointments,
  getPayments,
  getCustomers,
  MockAppointment,
  PaymentRecord,
} from "@/lib/mock-data";
import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_LABELS } from "@/lib/utils";

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<MockAppointment[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [customerCount, setCustomerCount] = useState(0);

  useEffect(() => {
    setAppointments(getAppointments());
    setPayments(getPayments());
    setCustomerCount(getCustomers().length);
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];
  const todaysAppointments = appointments.filter((apt) => apt.dateStr === todayStr);
  const inProgressCount = todaysAppointments.filter((apt) => apt.status === "IN_PROGRESS").length;
  const todaysRevenue = payments
    .filter((p) => p.paidAt.includes(todayStr))
    .reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your daily salon overview.
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

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysAppointments.length}</div>
            <p className="text-xs text-muted-foreground">appointments today</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">currently grooming</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerCount || 24}</div>
            <p className="text-xs text-muted-foreground">registered owners</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${todaysRevenue}</div>
            <Link href="/reports" className="text-xs text-primary font-medium hover:underline block mt-0.5">
              View daily reports →
            </Link>
          </CardContent>
        </Card>
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
                todaysAppointments.map((apt) => (
                  <Link
                    key={apt.id}
                    href={`/appointments/${apt.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center rounded-md bg-muted px-2.5 py-1 text-center min-w-[62px]">
                        <span className="text-xs font-semibold">{apt.startTime}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {apt.petName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({apt.petBreed})
                          </span>
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
                      </div>
                    </div>
                    <Badge
                      className={APPOINTMENT_STATUS_COLORS[apt.status] || ""}
                      variant="secondary"
                    >
                      {APPOINTMENT_STATUS_LABELS[apt.status]}
                    </Badge>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
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
            <Button
              asChild
              variant="outline"
              className="h-auto flex-col gap-2 p-4 justify-center"
            >
              <Link href="/services">
                <Sparkles className="h-6 w-6 text-indigo-500" />
                <span className="font-semibold text-sm">Services & Pricing</span>
                <span className="text-xs text-muted-foreground">Matrix & Club Memberships</span>
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
                <span className="text-xs text-muted-foreground">Sales & booking stats</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
