"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  Scissors,
  Receipt,
  Download,
  CheckCircle,
  Printer,
  ChevronLeft,
  ChevronRight,
  Users,
  Sparkles,
  AlertCircle,
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
import { showToast } from "@/components/ui/toast-system";
import { formatPrice, roundCurrency } from "@/lib/utils";
import {
  getPayments,
  getAppointments,
  getPaymentInstallments,
  PaymentRecord,
  PaymentInstallment,
  MockAppointment,
  localDateStr,
  extractDateOnly,
} from "@/lib/mock-data";

interface MatchedInstallment {
  payment: PaymentRecord;
  installment: PaymentInstallment;
  dateStr: string | null;
}

const METHOD_LABELS: Record<string, string> = {
  PAYNOW: "PayNow QR",
  CARD: "Credit Card",
  CASH: "Cash",
  MEMBERSHIP_CREDIT: "Club Credits",
};

function csvCell(v: string | number | undefined | null): string {
  const s = String(v ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

function matchesReportPeriod(
  dStr: string | null,
  dateMode: string,
  selectedDate: string,
  sevenDaysStartStr: string,
  todayStr: string
): boolean {
  if (dateMode === "ALL") return true;
  if (!dStr) return false;
  if (dateMode === "TODAY" || dateMode === "YESTERDAY" || dateMode === "DATE") {
    return dStr === selectedDate;
  }
  if (dateMode === "THIS_WEEK") {
    return dStr >= sevenDaysStartStr && dStr <= todayStr;
  }
  if (dateMode === "THIS_MONTH") {
    return dStr.startsWith(selectedDate.slice(0, 7));
  }
  return true;
}

export default function ReportsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [appointments, setAppointments] = useState<MockAppointment[]>([]);
  const todayStr = localDateStr();
  const [dateMode, setDateMode] = useState<string>("TODAY");
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const loadData = () => {
    setPayments(getPayments());
    setAppointments(getAppointments());
  };

  useEffect(() => {
    loadData();
    const onRefresh = () => loadData();
    window.addEventListener("nimbus-data-updated", onRefresh);
    return () => window.removeEventListener("nimbus-data-updated", onRefresh);
  }, []);

  const sevenDaysStartStr = useMemo(() => {
    const [y, m, d] = todayStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d - 6);
    return localDateStr(dt);
  }, [todayStr]);

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
    if (dateMode === "ALL") return "All-Time Overview";
    if (dateMode === "THIS_WEEK") return `Past 7 Days (${sevenDaysStartStr} – ${todayStr})`;
    if (dateMode === "THIS_MONTH") {
      try {
        const [y, m] = selectedDate.split("-").map(Number);
        const d = new Date(y, m - 1, 1);
        return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      } catch {
        return "This Month";
      }
    }
    if (selectedDate === todayStr) {
      return `Today · ${formatFriendlyDate(selectedDate)}`;
    }
    const [y, m, d] = todayStr.split("-").map(Number);
    const yesterdayStr = localDateStr(new Date(y, m - 1, d - 1));
    if (selectedDate === yesterdayStr) {
      return `Yesterday · ${formatFriendlyDate(selectedDate)}`;
    }
    return formatFriendlyDate(selectedDate);
  }

  // Strictly match each payment installment by its actual paidAt date (prevents cross-day double counting)
  const matchedInstallments = useMemo<MatchedInstallment[]>(() => {
    const items: MatchedInstallment[] = [];
    for (const payment of payments) {
      for (const inst of getPaymentInstallments(payment)) {
        const dStr = extractDateOnly(inst.paidAt);
        if (matchesReportPeriod(dStr, dateMode, selectedDate, sevenDaysStartStr, todayStr)) {
          items.push({ payment, installment: inst, dateStr: dStr });
        }
      }
    }
    return items.sort((a, b) =>
      (b.installment.paidAt || "").localeCompare(a.installment.paidAt || "")
    );
  }, [payments, dateMode, selectedDate, todayStr, sevenDaysStartStr]);

  // Financial breakdowns
  const {
    cashCollected,
    creditsRedeemed,
    grossValue,
    payNowTotal,
    cardTotal,
    cashTotal,
    uniqueInvoiceCount,
  } = useMemo(() => {
    let cashCol = 0;
    let credits = 0;
    let payNow = 0;
    let card = 0;
    let cash = 0;
    const invoiceIds = new Set<string>();

    for (const { payment, installment } of matchedInstallments) {
      invoiceIds.add(payment.id);
      const amt = installment.amount || 0;
      if (installment.method === "MEMBERSHIP_CREDIT") {
        credits += amt;
      } else {
        cashCol += amt;
        if (installment.method === "PAYNOW") payNow += amt;
        else if (installment.method === "CARD") card += amt;
        else if (installment.method === "CASH") cash += amt;
      }
    }

    return {
      cashCollected: roundCurrency(cashCol),
      creditsRedeemed: roundCurrency(credits),
      grossValue: roundCurrency(cashCol + credits),
      payNowTotal: roundCurrency(payNow),
      cardTotal: roundCurrency(card),
      cashTotal: roundCurrency(cash),
      uniqueInvoiceCount: invoiceIds.size,
    };
  }, [matchedInstallments]);

  // Outstanding Partial Balances across all invoices
  const partialInvoices = useMemo(
    () => payments.filter((p) => p.status === "PARTIAL" && (p.balanceAmount || 0) > 0),
    [payments]
  );
  const totalOutstandingBalance = useMemo(
    () => roundCurrency(partialInvoices.reduce((s, p) => s + (p.balanceAmount || 0), 0)),
    [partialInvoices]
  );

  // Appointments filtering
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) =>
      matchesReportPeriod(a.dateStr, dateMode, selectedDate, sevenDaysStartStr, todayStr)
    );
  }, [appointments, dateMode, selectedDate, todayStr, sevenDaysStartStr]);

  const totalBookings = filteredAppointments.length;
  const walkInCount = filteredAppointments.filter((a) => a.isWalkIn).length;
  const completedCount = filteredAppointments.filter((a) => a.status === "DONE").length;

  // Groomer performance
  const groomerStats = useMemo(() => {
    const map = new Map<
      string,
      { name: string; total: number; done: number; billableValue: number }
    >();
    for (const a of filteredAppointments) {
      if (a.status === "CANCELLED" || a.status === "NO_SHOW") continue;
      const key = a.groomerName || "Unassigned";
      const cur = map.get(key) || { name: key, total: 0, done: 0, billableValue: 0 };
      cur.total += 1;
      if (a.status === "DONE") cur.done += 1;
      const addOnsSum = (a.addOns || []).reduce((s, ad) => s + ad.price, 0);
      cur.billableValue = roundCurrency(cur.billableValue + a.servicePrice + addOnsSum);
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total || b.billableValue - a.billableValue);
  }, [filteredAppointments]);

  // Top Services breakdown
  const topServices = useMemo(() => {
    const map = new Map<string, { name: string; count: number; value: number }>();
    for (const a of filteredAppointments) {
      if (a.status === "CANCELLED" || a.status === "NO_SHOW") continue;
      const key = a.serviceName || "Other Service";
      const cur = map.get(key) || { name: key, count: 0, value: 0 };
      cur.count += 1;
      cur.value = roundCurrency(cur.value + a.servicePrice);
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count || b.value - a.value);
  }, [filteredAppointments]);

  const handleExportCSV = () => {
    const headers = [
      "Invoice Number",
      "Paid At",
      "Customer",
      "Phone",
      "Pet",
      "Service",
      "Installment Method",
      "Installment Amount",
      "Invoice Total",
      "Invoice Status",
      "Note",
    ];
    const rows = matchedInstallments.map(({ payment, installment }) => [
      payment.invoiceNumber,
      installment.paidAt,
      payment.customerName,
      payment.customerPhone,
      payment.petName,
      payment.serviceName,
      METHOD_LABELS[installment.method] || installment.method,
      installment.amount.toFixed(2),
      payment.totalAmount.toFixed(2),
      payment.status,
      installment.note || "",
    ]);

    const csv =
      "\uFEFF" +
      [headers.map(csvCell).join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nimbus-sales-${dateMode.toLowerCase()}-${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${matchedInstallments.length} transaction line(s) to CSV.`, "success");
  };

  const isSingleDay = dateMode === "DATE" || dateMode === "TODAY" || dateMode === "YESTERDAY";
  const avgTicket = uniqueInvoiceCount > 0 ? roundCurrency(grossValue / uniqueInvoiceCount) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Daily Sales &amp; Reports
          </h1>
          <p className="text-muted-foreground flex flex-wrap items-center gap-1.5 mt-1 text-sm">
            <span className="font-semibold text-foreground">{getReportPeriodLabel()}</span>
            <span className="opacity-50">·</span>
            <span>Actual receipt dates &amp; department analytics</span>
          </p>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2">
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
                const [y, m, d] = todayStr.split("-").map(Number);
                setSelectedDate(localDateStr(new Date(y, m - 1, d - 1)));
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
            onClick={handleExportCSV}
            disabled={matchedInstallments.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>

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
            <CardTitle className="text-sm font-medium">Cash / Card / PayNow</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">
              {formatPrice(cashCollected)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {creditsRedeemed > 0
                ? `+ ${formatPrice(creditsRedeemed)} club credits redeemed`
                : `${matchedInstallments.length} receipt line(s)`}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Gross Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatPrice(grossValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg. {formatPrice(avgTicket)} across {uniqueInvoiceCount} invoice(s)
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bookings &amp; Walk-ins</CardTitle>
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
              {totalBookings > 0 ? Math.round((completedCount / totalBookings) * 100) : 0}%
              completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Partial Balances Banner */}
      {partialInvoices.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/70 shadow-xs">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950">
                <p className="font-semibold">
                  {partialInvoices.length} Open Partial / Deposit Invoice(s) · Outstanding Balance:{" "}
                  {formatPrice(totalOutstandingBalance)}
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {partialInvoices.slice(0, 4).map((p) => (
                    <Link
                      key={p.id}
                      href={p.appointmentId ? `/appointments/${p.appointmentId}` : "/appointments"}
                      className="underline font-medium hover:text-amber-700"
                    >
                      {p.customerName} ({p.petName}): {formatPrice(p.balanceAmount)} due
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Method Breakdown & Department Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Revenue by Payment Method
            </CardTitle>
            <CardDescription>
              Split across PayNow QR, Card, Cash, and Prepaid Club Credits by receipt date.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <Badge variant="outline" className="font-semibold text-xs">
                PayNow QR
              </Badge>
              <span className="font-bold text-sm">{formatPrice(payNowTotal)}</span>
            </div>

            <div className="flex items-center justify-between border-b pb-2">
              <Badge variant="outline" className="font-semibold text-xs">
                Credit Card
              </Badge>
              <span className="font-bold text-sm">{formatPrice(cardTotal)}</span>
            </div>

            <div className="flex items-center justify-between border-b pb-2">
              <Badge variant="outline" className="font-semibold text-xs">
                Cash
              </Badge>
              <span className="font-bold text-sm">{formatPrice(cashTotal)}</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Badge variant="default" className="font-semibold text-xs">
                Club Credits Redeemed
              </Badge>
              <span className="font-bold text-sm text-primary">
                {formatPrice(creditsRedeemed)}
              </span>
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
            <CardDescription>All appointment statuses for the selected period.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="flex items-center justify-between border-b pb-1.5 text-sm">
              <span className="text-muted-foreground">In Progress:</span>
              <span className="font-bold text-purple-600">
                {filteredAppointments.filter((a) => a.status === "IN_PROGRESS").length}
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-1.5 text-sm">
              <span className="text-muted-foreground">Arrived &amp; Waiting:</span>
              <span className="font-bold text-amber-600">
                {filteredAppointments.filter((a) => a.status === "ARRIVED").length}
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-1.5 text-sm">
              <span className="text-muted-foreground">Booked Ahead:</span>
              <span className="font-bold text-blue-600">
                {filteredAppointments.filter((a) => a.status === "BOOKED").length}
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-1.5 text-sm">
              <span className="text-muted-foreground">Done / Handed Over:</span>
              <span className="font-bold text-emerald-600">{completedCount}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-1.5 text-sm">
              <span className="text-muted-foreground">No Show:</span>
              <span className="font-bold text-muted-foreground">
                {filteredAppointments.filter((a) => a.status === "NO_SHOW").length}
              </span>
            </div>
            <div className="flex items-center justify-between pt-0.5 text-sm">
              <span className="text-muted-foreground">Cancelled:</span>
              <span className="font-bold text-destructive">
                {filteredAppointments.filter((a) => a.status === "CANCELLED").length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Groomer Performance & Top Services */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Groomer Performance
            </CardTitle>
            <CardDescription>Active visits &amp; billable service value by groomer.</CardDescription>
          </CardHeader>
          <CardContent>
            {groomerStats.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No active appointments in this period.
              </p>
            ) : (
              <div className="space-y-2.5">
                {groomerStats.map((g) => (
                  <div
                    key={g.name}
                    className="flex items-center justify-between border-b last:border-b-0 pb-2 last:pb-0 text-sm"
                  >
                    <div>
                      <span className="font-semibold">{g.name}</span>
                      <span className="text-xs text-muted-foreground block">
                        {g.done} done / {g.total} booked
                      </span>
                    </div>
                    <span className="font-bold text-primary">
                      {formatPrice(g.billableValue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Top Services Breakdown
            </CardTitle>
            <CardDescription>Most booked services in the selected period.</CardDescription>
          </CardHeader>
          <CardContent>
            {topServices.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No services booked in this period.
              </p>
            ) : (
              <div className="space-y-2.5">
                {topServices.map((srv) => (
                  <div
                    key={srv.name}
                    className="flex items-center justify-between border-b last:border-b-0 pb-2 last:pb-0 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {srv.count}×
                      </Badge>
                      <span className="font-medium truncate">{srv.name}</span>
                    </div>
                    <span className="font-bold shrink-0">{formatPrice(srv.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Records List */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            Paid Receipts &amp; Installment Ledger
          </CardTitle>
        </CardHeader>
        <CardContent>
          {matchedInstallments.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No payment installments recorded for this period ({getReportPeriodLabel()}).
            </div>
          ) : (
            <div className="space-y-2">
              {matchedInstallments.map(({ payment, installment }) => (
                <div
                  key={installment.id}
                  className="flex flex-wrap items-center justify-between p-3 border rounded-lg hover:bg-muted/40 transition-colors gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex flex-col shrink-0">
                      {payment.appointmentId ? (
                        <Link
                          href={`/appointments/${payment.appointmentId}`}
                          className="font-bold text-xs text-primary hover:underline"
                        >
                          {payment.invoiceNumber}
                        </Link>
                      ) : (
                        <span className="font-bold text-xs">{payment.invoiceNumber}</span>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {installment.paidAt}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-sm">{payment.customerName}</span>
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        · {payment.petName} ({payment.serviceName})
                      </span>
                      {installment.note && (
                        <span className="block text-[11px] text-muted-foreground">
                          {installment.note}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {payment.status === "PARTIAL" && (
                      <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-800 bg-amber-50">
                        Partial (Bal: {formatPrice(payment.balanceAmount)})
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {METHOD_LABELS[installment.method] || installment.method}
                    </Badge>
                    <span className="font-bold text-sm">{formatPrice(installment.amount)}</span>
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
