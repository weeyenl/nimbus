"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Settings,
  Database,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Check,
  Clock,
  Store,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { showToast } from "@/components/ui/toast-system";
import {
  getSalonSettings,
  saveSalonSettings,
  DEFAULT_SALON_SETTINGS,
  SalonSettings,
  getBackups,
  createBackupSnapshot,
  deleteBackupSnapshot,
  buildBackupPayload,
  restoreFromBackupPayload,
  BackupSnapshot,
  localDateStr,
} from "@/lib/mock-data";

const START_HOUR_OPTIONS = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00"];
const END_HOUR_OPTIONS = ["17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];

function summarizePayload(payload: Record<string, unknown>) {
  const countArr = (key: string) =>
    Array.isArray(payload[key]) ? (payload[key] as unknown[]).length : 0;
  return {
    customers: countArr("customers"),
    appointments: countArr("appointments"),
    payments: countArr("payments"),
    groomingRecords: countArr("grooming_records"),
  };
}

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<SalonSettings>(DEFAULT_SALON_SETTINGS);
  const [salonName, setSalonName] = useState(DEFAULT_SALON_SETTINGS.salonName);
  const [salonAddress, setSalonAddress] = useState(DEFAULT_SALON_SETTINGS.salonAddress);
  const [salonPhone, setSalonPhone] = useState(DEFAULT_SALON_SETTINGS.salonPhone);
  const [receiptFooter, setReceiptFooter] = useState(DEFAULT_SALON_SETTINGS.receiptFooter);
  const [calendarStartTime, setCalendarStartTime] = useState(
    DEFAULT_SALON_SETTINGS.calendarStartTime
  );
  const [calendarEndTime, setCalendarEndTime] = useState(DEFAULT_SALON_SETTINGS.calendarEndTime);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);

  const [backups, setBackups] = useState<BackupSnapshot[]>([]);

  const [pendingRestore, setPendingRestore] = useState<{
    sourceLabel: string;
    payload: Record<string, unknown>;
  } | null>(null);
  const [pendingDeleteSnapshot, setPendingDeleteSnapshot] = useState<BackupSnapshot | null>(
    null
  );

  const loadData = () => {
    const s = getSalonSettings();
    setSettings(s);
    setSalonName(s.salonName);
    setSalonAddress(s.salonAddress);
    setSalonPhone(s.salonPhone);
    setReceiptFooter(s.receiptFooter);
    setCalendarStartTime(s.calendarStartTime);
    setCalendarEndTime(s.calendarEndTime);
    setAutoBackupEnabled(s.autoBackupEnabled !== false);
    setBackups(getBackups());
  };

  useEffect(() => {
    loadData();
    const onRefresh = () => loadData();
    window.addEventListener("nimbus-data-updated", onRefresh);
    return () => window.removeEventListener("nimbus-data-updated", onRefresh);
  }, []);

  const handleSaveSalonSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonName.trim()) {
      showToast("Salon name cannot be empty.", "warning");
      return;
    }
    if (calendarEndTime <= calendarStartTime) {
      showToast("Calendar closing time must be later than opening time.", "warning");
      return;
    }

    const saved = saveSalonSettings({
      salonName: salonName.trim(),
      salonAddress: salonAddress.trim(),
      salonPhone: salonPhone.trim(),
      receiptFooter: receiptFooter.trim(),
      calendarStartTime,
      calendarEndTime,
      autoBackupEnabled,
    });
    setSettings(saved);
    showToast("Salon profile & calendar settings saved.", "success");
  };

  const handleToggleAutoBackup = (enabled: boolean) => {
    setAutoBackupEnabled(enabled);
    const saved = saveSalonSettings({ autoBackupEnabled: enabled });
    setSettings(saved);
    showToast(
      enabled
        ? "Daily automatic backups enabled (runs once per day on Owner sign-in)."
        : "Daily automatic backups paused.",
      "info"
    );
  };

  const handleCreateManualBackup = () => {
    const snap = createBackupSnapshot("MANUAL");
    setBackups(getBackups());
    showToast(
      `Snapshot saved (${snap.summary.customers} customers, ${snap.summary.appointments} appointments).`,
      "success"
    );
  };

  const triggerJsonDownload = (payload: Record<string, unknown>, filename: string) => {
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadLiveJson = () => {
    const payload = buildBackupPayload();
    const filename = `nimbus-backup-${localDateStr()}.json`;
    triggerJsonDownload(payload, filename);
    showToast(`Downloaded ${filename}`, "success");
  };

  const handleUploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          showToast("Invalid backup file: expected a JSON object.", "error");
          return;
        }
        const hasRecognizedKey = [
          "customers",
          "appointments",
          "staff",
          "services",
          "payments",
          "memberships",
        ].some((k) => Array.isArray(parsed[k]));

        if (!hasRecognizedKey) {
          showToast("Backup JSON does not contain recognizable Nimbus collections.", "error");
          return;
        }

        setPendingRestore({
          sourceLabel: file.name,
          payload: parsed as Record<string, unknown>,
        });
      } catch {
        showToast("Could not parse JSON file. Check that it is a valid Nimbus backup.", "error");
      }
    };
    reader.onerror = () => {
      showToast("Failed to read selected file.", "error");
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!pendingRestore) return;
    const res = restoreFromBackupPayload(pendingRestore.payload);
    if (res.ok) {
      showToast(`Restored data from ${pendingRestore.sourceLabel}.`, "success");
      loadData();
    } else {
      showToast(res.error || "Failed to restore backup.", "error");
    }
    setPendingRestore(null);
  };

  const handleConfirmDeleteSnapshot = () => {
    if (!pendingDeleteSnapshot) return;
    deleteBackupSnapshot(pendingDeleteSnapshot.id);
    setPendingDeleteSnapshot(null);
    setBackups(getBackups());
    showToast("Backup snapshot deleted.", "info");
  };

  const restoreSummary = pendingRestore ? summarizePayload(pendingRestore.payload) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2.5">
          <Settings className="h-7 w-7 text-primary" />
          Salon Settings &amp; Backups
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure receipt branding, calendar operating hours, and daily automated database backups
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Salon Profile, Receipts & Calendar Operating Hours */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              Salon Profile, Receipts &amp; Operating Hours
            </CardTitle>
            <CardDescription>
              Displayed on printed &amp; shared customer receipts and used to size the booking calendar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSalonSettings} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="salonName">Salon Display Name *</Label>
                <Input
                  id="salonName"
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                  placeholder="DOGLAB GROOMING"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="salonPhone">Contact Phone</Label>
                  <Input
                    id="salonPhone"
                    value={salonPhone}
                    onChange={(e) => setSalonPhone(e.target.value)}
                    placeholder="+65 6789 0123"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="salonAddress">Salon Address</Label>
                  <Input
                    id="salonAddress"
                    value={salonAddress}
                    onChange={(e) => setSalonAddress(e.target.value)}
                    placeholder="123 Grooming Lane, Singapore"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="receiptFooter">Receipt Footer Message</Label>
                <Textarea
                  id="receiptFooter"
                  rows={2}
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  placeholder="Thank you for trusting Doglab with your furkid!"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    Calendar Opens
                  </Label>
                  <Select value={calendarStartTime} onValueChange={setCalendarStartTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {START_HOUR_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    Calendar Closes
                  </Label>
                  <Select value={calendarEndTime} onValueChange={setCalendarEndTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {END_HOUR_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" className="gap-2">
                  <Check className="h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Backup & Recovery Controls */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Automated Backups &amp; Export / Restore
            </CardTitle>
            <CardDescription>
              Protect customer profiles, grooming history, and sales records with cloud-synced snapshots &amp; offline JSON exports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3.5 bg-muted/20">
              <div className="pr-4 space-y-0.5">
                <Label htmlFor="autoBackupSwitch" className="text-sm font-semibold cursor-pointer">
                  Daily Automatic Backup
                </Label>
                <p className="text-xs text-muted-foreground">
                  Automatically captures a restore snapshot once per day when the Owner opens Nimbus (retains latest 10 snapshots).
                </p>
                {settings.lastAutoBackupAt && (
                  <p className="text-[11px] text-primary font-medium pt-0.5 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Last snapshot:{" "}
                    {new Date(settings.lastAutoBackupAt).toLocaleString("en-SG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                )}
              </div>
              <Switch
                id="autoBackupSwitch"
                checked={autoBackupEnabled}
                onCheckedChange={handleToggleAutoBackup}
              />
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <Button
                type="button"
                onClick={handleCreateManualBackup}
                className="gap-2 justify-start"
              >
                <Database className="h-4 w-4" />
                Create Snapshot Now
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadLiveJson}
                className="gap-2 justify-start"
              >
                <Download className="h-4 w-4" />
                Download Full JSON
              </Button>
            </div>

            <div className="rounded-xl border border-dashed p-4 bg-muted/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs font-semibold">Restore from External Backup File</p>
                <p className="text-[11px] text-muted-foreground">
                  Upload a previously exported <code>.json</code> backup archive to restore records.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleUploadFileChange}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5 text-xs shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                Choose Backup File…
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Saved Backup Snapshots List */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Saved Restore Points ({backups.length} / 10)
          </CardTitle>
          <CardDescription>
            Snapshots are stored safely in your Nimbus workspace (and synced to Supabase in cloud mode).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No backup snapshots saved yet. Click &ldquo;Create Snapshot Now&rdquo; to create your first restore point.
            </div>
          ) : (
            <div className="space-y-2.5">
              {backups.map((snap) => (
                <div
                  key={snap.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={snap.trigger === "AUTO" ? "secondary" : "default"}
                        className="text-[10px]"
                      >
                        {snap.trigger === "AUTO" ? "Daily Auto" : "Manual Snapshot"}
                      </Badge>
                      <span className="font-semibold text-sm">
                        {new Date(snap.createdAt).toLocaleString("en-SG", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {snap.summary.customers} customer(s) · {snap.summary.appointments} appointment(s) ·{" "}
                      {snap.summary.payments} payment(s) · {snap.summary.groomingRecords} grooming log(s)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={() =>
                        triggerJsonDownload(
                          snap.payload,
                          `nimbus-snapshot-${snap.dateStr}-${snap.id.slice(-4)}.json`
                        )
                      }
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={() =>
                        setPendingRestore({
                          sourceLabel: `${snap.trigger} snapshot (${snap.dateStr})`,
                          payload: snap.payload,
                        })
                      }
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restore
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      onClick={() => setPendingDeleteSnapshot(snap)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* RESTORE BACKUP CONFIRMATION */}
      <AlertDialog open={Boolean(pendingRestore)} onOpenChange={(o) => !o && setPendingRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Data from Backup?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Restoring from <strong>{pendingRestore?.sourceLabel}</strong> will replace current
                  customers, appointments, grooming logs, services, promo codes, payments, and settings.
                </p>
                {restoreSummary && (
                  <div className="rounded-lg border bg-muted/40 p-2.5 text-xs text-foreground">
                    Backup contents: <strong>{restoreSummary.customers}</strong> customer(s),{" "}
                    <strong>{restoreSummary.appointments}</strong> appointment(s),{" "}
                    <strong>{restoreSummary.payments}</strong> payment(s),{" "}
                    <strong>{restoreSummary.groomingRecords}</strong> grooming record(s).
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRestore}>
              Yes, Restore Backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DELETE SNAPSHOT CONFIRMATION */}
      <AlertDialog
        open={Boolean(pendingDeleteSnapshot)}
        onOpenChange={(o) => !o && setPendingDeleteSnapshot(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Snapshot?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove the saved snapshot from{" "}
              {pendingDeleteSnapshot
                ? new Date(pendingDeleteSnapshot.createdAt).toLocaleString("en-SG")
                : ""}
              ? Live salon data will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteSnapshot}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
