"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  Phone,
  Mail,
  Edit,
  Trash2,
  Check,
  Clock,
  KeyRound,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showToast } from "@/components/ui/toast-system";
import { getInitials, hashStaffPin } from "@/lib/utils";
import {
  newId,
  getStaff,
  saveStaff,
  updateStaff,
  deleteStaff,
  verifyStaffPin,
  staffHasPin,
  MockStaff,
} from "@/lib/mock-data";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-purple-100 text-purple-800",
  GROOMER: "bg-blue-100 text-blue-800",
  RECEPTIONIST: "bg-green-100 text-green-800",
};

const SCHEDULE_PRESETS = ["09:00-18:00", "10:00-19:00", "09:00-14:00", "13:00-20:00", "OFF"];
const CUSTOM_SHIFT = "__CUSTOM__";

const DEFAULT_SCHEDULE: Record<string, string> = {
  Mon: "09:00-18:00",
  Tue: "09:00-18:00",
  Wed: "09:00-18:00",
  Thu: "09:00-18:00",
  Fri: "09:00-18:00",
  Sat: "09:00-14:00",
  Sun: "OFF",
};

function parseShiftTimes(val: string): [string, string] {
  const parts = (val || "").split("-");
  if (parts.length === 2 && /^\d{2}:\d{2}$/.test(parts[0]) && /^\d{2}:\d{2}$/.test(parts[1])) {
    return [parts[0], parts[1]];
  }
  return ["09:00", "18:00"];
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<MockStaff[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MockStaff | null>(null);

  // Edit or Add state
  const [editingStaff, setEditingStaff] = useState<MockStaff | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"GROOMER" | "RECEPTIONIST" | "OWNER">("GROOMER");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [clearPin, setClearPin] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [schedule, setSchedule] = useState<Record<string, string>>(DEFAULT_SCHEDULE);

  const refreshList = () => {
    setStaffList(getStaff());
  };

  useEffect(() => {
    refreshList();
    const onRefresh = () => refreshList();
    window.addEventListener("nimbus-data-updated", onRefresh);
    return () => window.removeEventListener("nimbus-data-updated", onRefresh);
  }, []);

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setName("");
    setRole("GROOMER");
    setPhone("+65 9123 4567");
    setEmail("");
    setPinInput("");
    setClearPin(false);
    setIsActive(true);
    setSchedule({ ...DEFAULT_SCHEDULE });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (staff: MockStaff) => {
    setEditingStaff(staff);
    setName(staff.name);
    setRole(staff.role);
    setPhone(staff.phone);
    setEmail(staff.email);
    setPinInput("");
    setClearPin(false);
    setIsActive(staff.isActive !== false);
    setSchedule(staff.schedule ? { ...DEFAULT_SCHEDULE, ...staff.schedule } : { ...DEFAULT_SCHEDULE });
    setIsDialogOpen(true);
  };

  const handleDayPresetChange = (day: string, value: string) => {
    if (value === CUSTOM_SHIFT) {
      const existing = schedule[day];
      const [start, end] = parseShiftTimes(existing);
      setSchedule((prev) => ({
        ...prev,
        [day]: `${start}-${end}`,
      }));
      return;
    }
    setSchedule((prev) => ({
      ...prev,
      [day]: value,
    }));
  };

  const handleCustomTimeChange = (day: string, bound: "start" | "end", nextTime: string) => {
    const [curStart, curEnd] = parseShiftTimes(schedule[day]);
    const next = bound === "start" ? `${nextTime}-${curEnd}` : `${curStart}-${nextTime}`;
    setSchedule((prev) => ({
      ...prev,
      [day]: next,
    }));
  };

  const activeOwnerCountExcluding = (excludeId?: string) =>
    staffList.filter(
      (s) => s.id !== excludeId && s.role === "OWNER" && s.isActive !== false
    ).length;

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Staff full name is required.", "warning");
      return;
    }

    // Protect last active OWNER from lock-out
    if (
      editingStaff &&
      editingStaff.role === "OWNER" &&
      (role !== "OWNER" || !isActive) &&
      activeOwnerCountExcluding(editingStaff.id) === 0
    ) {
      showToast("At least one active Owner profile must remain enabled.", "error");
      return;
    }

    // Validate shift ranges
    for (const day of DAYS) {
      const shift = schedule[day] || "OFF";
      if (shift !== "OFF") {
        const [start, end] = parseShiftTimes(shift);
        if (end <= start) {
          showToast(`${day}: End time (${end}) must be later than start time (${start}).`, "warning");
          return;
        }
      }
    }

    const cleanPin = pinInput.trim();
    if (cleanPin && (cleanPin.length < 4 || cleanPin.length > 6)) {
      showToast("Staff PIN must be 4 to 6 digits.", "warning");
      return;
    }

    if (cleanPin && isActive) {
      const collision = staffList.find(
        (s) =>
          s.id !== editingStaff?.id &&
          s.isActive !== false &&
          verifyStaffPin(s, cleanPin)
      );
      if (collision) {
        showToast(
          `PIN already assigned to active staff member "${collision.name}". Choose a unique PIN.`,
          "error"
        );
        return;
      }
    }

    const staffId = editingStaff?.id || newId("g");
    let resolvedPinHash: string | undefined;

    if (cleanPin) {
      resolvedPinHash = hashStaffPin(staffId, cleanPin);
    } else if (editingStaff && !clearPin) {
      if (editingStaff.pinHash) {
        resolvedPinHash = editingStaff.pinHash;
      } else if (editingStaff.pin) {
        resolvedPinHash = hashStaffPin(staffId, editingStaff.pin);
      }
    }

    const record: MockStaff = {
      id: staffId,
      name: name.trim(),
      role,
      phone: phone.trim() || "+65 9000 0000",
      email:
        email.trim() ||
        `${name.trim().toLowerCase().replace(/\s+/g, ".")}@doglab.com`,
      pinHash: resolvedPinHash,
      pin: undefined,
      isActive,
      schedule,
    };

    if (editingStaff) {
      updateStaff(record);
      showToast(`Updated profile for ${record.name}.`, "success");
    } else {
      saveStaff(record);
      showToast(`Added ${record.name} to staff roster.`, "success");
    }

    refreshList();
    setIsDialogOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (
      deleteTarget.role === "OWNER" &&
      activeOwnerCountExcluding(deleteTarget.id) === 0
    ) {
      showToast("Cannot delete the only remaining active Owner account.", "error");
      setDeleteTarget(null);
      return;
    }
    deleteStaff(deleteTarget.id);
    showToast(`Deleted staff profile "${deleteTarget.name}".`, "info");
    setDeleteTarget(null);
    refreshList();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Staff &amp; Schedules
          </h1>
          <p className="text-muted-foreground">
            Manage groomers, receptionists, tablet PIN access, active status, and weekly shifts
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Staff List */}
      {staffList.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center space-y-2">
            <p className="text-sm font-medium">No staff members in database yet</p>
            <p className="text-xs text-muted-foreground">
              Click &ldquo;Add Staff Member&rdquo; to create groomer, receptionist, or owner profiles and PINs.
            </p>
          </CardContent>
        </Card>
      ) : (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {staffList.map((staff) => {
          const active = staff.isActive !== false;
          const hasPin = staffHasPin(staff);
          return (
            <Card
              key={staff.id}
              className={`shadow-sm flex flex-col justify-between transition-colors ${
                active ? "hover:border-primary/50" : "opacity-70 bg-muted/25"
              }`}
            >
              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(staff.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <CardTitle className="text-base font-semibold truncate">
                          {staff.name}
                        </CardTitle>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] shrink-0 font-medium ${ROLE_COLORS[staff.role] || ""}`}
                        >
                          {staff.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 truncate">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span className="truncate">{staff.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 truncate">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{staff.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {hasPin ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 border-primary/40 bg-primary/5 text-primary gap-1"
                          >
                            <KeyRound className="h-2.5 w-2.5" /> PIN Set
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                            No PIN
                          </Badge>
                        )}
                        <Badge
                          variant={active ? "secondary" : "destructive"}
                          className={`text-[10px] px-1.5 py-0 ${
                            active ? "bg-emerald-100 text-emerald-800" : ""
                          }`}
                        >
                          {active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 border-t pt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Weekly Working Roster</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {DAYS.map((day) => {
                        const daySchedule = staff.schedule?.[day] || "OFF";
                        const isOff = daySchedule === "OFF";
                        return (
                          <div
                            key={day}
                            className={`rounded-md p-1 text-center text-xs ${
                              isOff
                                ? "bg-muted text-muted-foreground"
                                : "bg-primary/10 text-primary font-medium"
                            }`}
                          >
                            <div className="font-semibold text-[10px]">{day}</div>
                            <div className="mt-0.5 text-[8.5px] leading-tight whitespace-pre-line">
                              {isOff ? "Off" : daySchedule.replace("-", "\n")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-4 pt-0 border-t mt-3 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => handleOpenEdit(staff)}
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit Staff &amp; Schedule
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteTarget(staff)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      )}

      {/* Staff Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? "Edit Staff & Schedule" : "Add New Staff Member"}
            </DialogTitle>
            <DialogDescription>
              Set salon role, contact details, PIN keypad access, active status, and shift hours.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveStaff} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staffName">Full Name *</Label>
                <Input
                  id="staffName"
                  placeholder="e.g. Jason Lim"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staffRole">Role *</Label>
                <Select
                  value={role}
                  onValueChange={(val) => setRole(val as MockStaff["role"])}
                >
                  <SelectTrigger id="staffRole">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GROOMER">Groomer</SelectItem>
                    <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                    <SelectItem value="OWNER">Owner / Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staffPhone">Phone Number</Label>
                <Input
                  id="staffPhone"
                  type="tel"
                  placeholder="+65 9123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffEmail">Email Address (Cloud Role Match)</Label>
                <Input
                  id="staffEmail"
                  type="email"
                  placeholder="jason@doglab.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Active / Inactive Switch */}
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
              <div className="pr-4">
                <Label htmlFor="staffActiveSwitch" className="text-sm font-medium cursor-pointer">
                  Active Staff Profile
                </Label>
                <p className="text-xs text-muted-foreground">
                  Inactive staff are hidden from booking groomers and blocked from PIN login.
                </p>
              </div>
              <Switch
                id="staffActiveSwitch"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            {/* PIN Input */}
            <div className="space-y-2 rounded-lg border p-3 bg-muted/10">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="staffPin" className="text-sm font-medium">
                  Staff Login PIN (4–6 Digits)
                </Label>
                {editingStaff && staffHasPin(editingStaff) && !pinInput && (
                  <Button
                    type="button"
                    variant={clearPin ? "destructive" : "ghost"}
                    size="sm"
                    className="h-6 text-[11px] px-2"
                    onClick={() => setClearPin((v) => !v)}
                  >
                    {clearPin ? "Will Clear PIN" : "Clear Existing PIN"}
                  </Button>
                )}
              </div>
              <Input
                id="staffPin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                disabled={clearPin}
                placeholder={
                  editingStaff && staffHasPin(editingStaff)
                    ? "Leave blank to keep existing PIN"
                    : "e.g. 1234 (optional quick tablet sign-in)"
                }
                value={pinInput}
                onChange={(e) => {
                  setClearPin(false);
                  setPinInput(e.target.value.replace(/\D/g, ""));
                }}
              />
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 shrink-0 text-primary" />
                PINs are stored as salted SHA-256 hashes — plain PINs are never saved in readable form.
              </p>
            </div>

            {/* Weekly Schedule Planner */}
            <div className="space-y-3 pt-3 border-t">
              <Label className="flex items-center gap-1.5 text-sm font-semibold">
                <Clock className="h-4 w-4 text-primary" />
                Weekly Work Schedule (Mon – Sun)
              </Label>
              <p className="text-xs text-muted-foreground">
                Choose a preset shift, Custom Hours, or OFF. Used to warn when booking off-shift.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DAYS.map((day) => {
                  const currentVal = schedule[day] || "OFF";
                  const isPreset = SCHEDULE_PRESETS.includes(currentVal);
                  const selectVal = isPreset ? currentVal : CUSTOM_SHIFT;
                  const [cStart, cEnd] = parseShiftTimes(currentVal);

                  return (
                    <div
                      key={day}
                      className="space-y-2 p-2.5 rounded-lg border bg-muted/20"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs w-10 shrink-0">{day}:</span>
                        <Select
                          value={selectVal}
                          onValueChange={(val) => handleDayPresetChange(day, val)}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="09:00-18:00">09:00 – 18:00 (Standard)</SelectItem>
                            <SelectItem value="10:00-19:00">10:00 – 19:00 (Late)</SelectItem>
                            <SelectItem value="09:00-14:00">09:00 – 14:00 (Morning)</SelectItem>
                            <SelectItem value="13:00-20:00">13:00 – 20:00 (Afternoon)</SelectItem>
                            <SelectItem value={CUSTOM_SHIFT}>Custom Hours…</SelectItem>
                            <SelectItem value="OFF">OFF (Rest Day)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {selectVal === CUSTOM_SHIFT && (
                        <div className="flex items-center gap-1.5 pl-10">
                          <Input
                            type="time"
                            value={cStart}
                            onChange={(e) => handleCustomTimeChange(day, "start", e.target.value)}
                            className="h-7 text-xs bg-background px-2"
                          />
                          <span className="text-xs text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={cEnd}
                            onChange={(e) => handleCustomTimeChange(day, "end", e.target.value)}
                            className="h-7 text-xs bg-background px-2"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="gap-2">
                <Check className="h-4 w-4" />
                {editingStaff ? "Save Changes" : "Create Staff Profile"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE STAFF CONFIRMATION */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteTarget?.name}</strong>? Historical appointments will keep their name on record. Consider marking them Inactive instead if they may return.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Staff
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
