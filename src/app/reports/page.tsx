"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  Scissors,
  Receipt,
  Download,
  CheckCircle,
  Clock,
  Printer,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getPayments,
  getAppointments,
  PaymentRecord,
  MockAppointment,
  localDateStr,
  isPaymentFromDate,
  getPaymentDateStr,
} from "@/lib/mock-data";

export default function ReportsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [appointments, setAppointments] = useState<MockAppointment[]>([]);
  const todayStr = localDateStr();
  const [dateMode, setDateMode] = useState<string>("TODAY");
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  useEffect(() => {
    setPayments(getPayments());
    setAppointments(getAppointments());
  }, []);

  function formatFriendlyDate(dStr: string) {
    try {
      const [y, m, d] = dStr.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dStr;
    }
  }

  function getReportPeriodLabel(): string {
    if (dateMode === "ALL") return "All-Time Overview (All records)";
    if (dateMode === "THIS_WEEK") return "Past 7 Days";
    if (dateMode === "THIS_MONTH") {
      try {
        const [y, m] = selectedDate.split("-").map(Number);
        const d = new Date(y, m - 1, 1);
        return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      } catch {
        return "This Month";
      }
    }
    // Single Day (DATE, TODAY, YESTERDAY)
    if (selectedDate === todayStr) {
      return `Today · ${formatFriendlyDate(selectedDate)}`;
    }
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterdayStr = localDateStr(d);
    if (selectedDate === yesterdayStr) {
      return `Yesterday · ${formatFriendlyDate(selectedDate)}`;
    }
    return formatFriendlyDate(selectedDate);
  }

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    if (dateMode === "ALL") return true;

    const matchApt = p.appointmentId ? appointments.find((a) => a.id === p.appointmentId) : null;
    const paymentDate = getPaymentDateStr(p.paidAt, matchApt?.dateStr);

    if (dateMode === "TODAY" || dateMode === "YESTERDAY" || dateMode === "DATE") {
      if (paymentDate && paymentDate === selectedDate) return true;
      if (isPaymentFromDate(p.paidAt, selectedDate)) return true;
      if (matchApt && matchApt.dateStr === selectedDate) return true;
      return false;
    }

    if (dateMode === "THIS_WEEK") {
      if (!paymentDate) return false;
      const pTime = new Date(`${paymentDate}T00:00:00`).getTime();
      const now = new Date(`${todayStr}T23:59:59`).getTime();
      const sevenDaysAgo = now - 7 * 86400000;
      return pTime >= sevenDaysAgo && pTime <= now;
    }

    if (dateMode === "THIS_MONTH") {
      const prefix = selectedDate.slice(0, 7);
      if (paymentDate && paymentDate.startsWith(prefix)) return true;
      if (matchApt && matchApt.dateStr.startsWith(prefix)) return true;
      return false;
    }

    return true;
  });

  // Financial calculations
  const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.totalAmount, 0);
  const payNowTotal = filteredPayments.filter((p) => p.paymentMethod === "PAYNOW").reduce((sum, p) => sum + p.totalAmount, 0);
  const cardTotal = filteredPayments.filter((p) => p.paymentMethod === "CARD").reduce((sum, p) => sum + p.totalAmount, 0);
  const cashTotal = filteredPayments.filter((p) => p.paymentMethod === "CASH").reduce((sum, p) => sum + p.totalAmount, 0);
  const creditTotal = filteredPayments.filter((p) => p.paymentMethod === "MEMBERSHIP_CREDIT").reduce((sum, p) => sum + p.totalAmount, 0);

  // Bookings calculations
  const filteredAppointments = appointments.filter((a) => {
    if (dateMode === "ALL") return true;
    if (dateMode === "TODAY" || dateMode === "YESTERDAY" || dateMode === "DATE") {
      return a.dateStr === selectedDate;
    }
    if (dateMode === "THIS_WEEK") {
      const aptTime = new Date(`${a.dateStr}T00:00:00`).getTime();
      const now = new Date(`${todayStr}T23:59:59`).getTime();
      const sevenDaysAgo = now - 7 * 86400000;
      return aptTime >= sevenDaysAgo && aptTime <= now;
    }
    if (dateMode === "THIS_MONTH") {
      const prefix = selectedDate.slice(0, 7);
      return a.dateStr.startsWith(prefix);
    }
    return true;
  });

  const totalBookings = filteredAppointments.length;
  const walkInCount = filteredAppointments.filter((a) => a.isWalkIn).length;
  const completedCount = filteredAppointments.filter((a) => a.status === "DONE").length;

  const isSingleDay = dateMode === "DATE" || dateMode === "TODAY" || dateMode === "YESTERDAY";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Daily Sales & Reports
          </h1>
          <p className="text-muted-foreground flex flex-wrap items-center gap-1.5 mt-1 text-sm">
            <span className="font-semibold text-foreground">{getReportPeriodLabel()}</span>
            <span className="opacity-50">·</span>
            <span>Financial summary & statistics</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Date Stepper & Native Datepicker for single day view */}
          {isSingleDay && (
            <div className="flex items-center rounded-lg border bg-card p-0.5 shadow-xs">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Previous Day"
                onClick={() => {
                  const [y, m, d] = selectedDate.split("-").map(Number);
                  const prev = new Date(y, m - 1, d - 1);
                  setSelectedDate(localDateStr(prev));
                  setDateMode("DATE");
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="relative flex items-center">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      setDateMode("DATE");
                    }
                  }}
                  className="h-8 w-[134px] px-2 py-0 text-xs font-semibold bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 cursor-pointer text-center"
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Next Day"
                onClick={() => {
                  const [y, m, d] = selectedDate.split("-").map(Number);
                  const next = new Date(y, m - 1, d + 1);
                  setSelectedDate(localDateStr(next));
                  setDateMode("DATE");
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {selectedDate !== todayStr && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 text-xs px-2 mr-1 font-medium"
                  onClick={() => {
                    setSelectedDate(todayStr);
                    setDateMode("TODAY");
                  }}
                >
                  Today
                </Button>
              )}
            </div>
          )}

          {/* Preset Range Selector */}
          <Select
            value={dateMode}
            onValueChange={(val) => {
              setDateMode(val);
              if (val === "TODAY") {
                setSelectedDate(todayStr);
              } else if (val === "YESTERDAY") {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                setSelectedDate(localDateStr(d));
              }
            }}
          >
            <SelectTrigger className="w-[145px] h-9 bg-card text-xs">
              <Calendar className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAY">Today</SelectItem>
              <SelectItem value="YESTERDAY">Yesterday</SelectItem>
              <SelectItem value="DATE">Pick Date...</SelectItem>
              <SelectItem value="THIS_WEEK">Past 7 Days</SelectItem>
              <SelectItem value="THIS_MONTH">This Month</SelectItem>
              <SelectItem value="ALL">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs"
            onClick={() => window.print()}
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Print</span>
          </Button>
        </div>
      </div>

      {/* Top Metric KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">${totalRevenue}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredPayments.length} paid transactions
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {walkInCount} walk-in · {totalBookings - walkInCount} scheduled
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Visits</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{completedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalBookings > 0 ? Math.round((completedCount / totalBookings) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Ticket</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${filteredPayments.length > 0 ? Math.round(totalRevenue / filteredPayments.length) : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">per grooming visit</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Revenue by Payment Method
            </CardTitle>
            <CardDescription>Breakdown across PayNow, Card, Cash, and Club Credits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-semibold text-xs">PayNow QR</Badge>
              </div>
              <span className="font-bold text-sm">${payNowTotal}</span>
            </div>

            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-semibold text-xs">Credit Card</Badge>
              </div>
              <span className="font-bold text-sm">${cardTotal}</span>
            </div>

            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-semibold text-xs">Cash</Badge>
              </div>
              <span className="font-bold text-sm">${cashTotal}</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="font-semibold text-xs">Club Credits Redeemed</Badge>
              </div>
              <span className="font-bold text-sm text-primary">${creditTotal}</span>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Status Distribution */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Scissors className="h-4 w-4 text-primary" />
              Grooming Department Activity
            </CardTitle>
            <CardDescription>Daily throughput and queue management.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2 text-sm">
              <span className="text-muted-foreground">In Progress:</span>
              <span className="font-bold">{filteredAppointments.filter((a) => a.status === "IN_PROGRESS").length}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2 text-sm">
              <span className="text-muted-foreground">Arrived & Waiting:</span>
              <span className="font-bold">{filteredAppointments.filter((a) => a.status === "ARRIVED").length}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2 text-sm">
              <span className="text-muted-foreground">Booked Ahead:</span>
              <span className="font-bold">{filteredAppointments.filter((a) => a.status === "BOOKED").length}</span>
            </div>
            <div className="flex items-center justify-between pt-1 text-sm">
              <span className="text-muted-foreground">Done / Handed Over:</span>
              <span className="font-bold text-emerald-600">{completedCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Records List */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            Paid Invoices & Receipts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No transactions recorded for this period ({getReportPeriodLabel()}).
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPayments.map((pay) => (
                <div
                  key={pay.id}
                  className="flex flex-wrap items-center justify-between p-3 border rounded-lg hover:bg-muted/40 transition-colors gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-xs">{pay.invoiceNumber}</span>
                      <span className="text-[11px] text-muted-foreground">{pay.paidAt}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-sm">{pay.customerName}</span>
                      <span className="text-xs text-muted-foreground"> · {pay.petName} ({pay.serviceName})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {pay.paymentMethod}
                    </Badge>
                    <span className="font-bold text-sm">${pay.totalAmount}</span>
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
