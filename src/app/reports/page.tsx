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
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "@/lib/mock-data";

export default function ReportsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [appointments, setAppointments] = useState<MockAppointment[]>([]);
  const [dateFilter, setDateFilter] = useState("TODAY");

  useEffect(() => {
    setPayments(getPayments());
    setAppointments(getAppointments());
  }, []);

  const todayStr = localDateStr();

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    if (dateFilter === "TODAY") return p.paidAt.includes(todayStr);
    return true; // ALL
  });

  // Financial calculations
  const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.totalAmount, 0);
  const payNowTotal = filteredPayments.filter((p) => p.paymentMethod === "PAYNOW").reduce((sum, p) => sum + p.totalAmount, 0);
  const cardTotal = filteredPayments.filter((p) => p.paymentMethod === "CARD").reduce((sum, p) => sum + p.totalAmount, 0);
  const cashTotal = filteredPayments.filter((p) => p.paymentMethod === "CASH").reduce((sum, p) => sum + p.totalAmount, 0);
  const creditTotal = filteredPayments.filter((p) => p.paymentMethod === "MEMBERSHIP_CREDIT").reduce((sum, p) => sum + p.totalAmount, 0);

  // Bookings calculations
  const filteredAppointments = appointments.filter((a) => {
    if (dateFilter === "TODAY") return a.dateStr === todayStr;
    return true;
  });
  const totalBookings = filteredAppointments.length;
  const walkInCount = filteredAppointments.filter((a) => a.isWalkIn).length;
  const completedCount = filteredAppointments.filter((a) => a.status === "DONE").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Daily Sales & Reports
          </h1>
          <p className="text-muted-foreground">
            Financial summary, payment breakdowns, and booking statistics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40 bg-card">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAY">Today</SelectItem>
              <SelectItem value="ALL">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print Report
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
              No transactions recorded for this period.
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
