"use client";

import React, { useState, useEffect } from "react";
import { Plus, Calendar, Phone, Mail, Edit, Trash2, Check, Clock, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getInitials } from "@/lib/utils";
import { getStaff, saveStaff, updateStaff, deleteStaff, MockStaff } from "@/lib/mock-data";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-purple-100 text-purple-800",
  GROOMER: "bg-blue-100 text-blue-800",
  RECEPTIONIST: "bg-green-100 text-green-800",
};

const SCHEDULE_PRESETS = ["09:00-18:00", "10:00-19:00", "09:00-14:00", "13:00-20:00", "OFF"];

export default function StaffPage() {
  const [staffList, setStaffList] = useState<MockStaff[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Edit or Add state
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"GROOMER" | "RECEPTIONIST" | "OWNER">("GROOMER");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [schedule, setSchedule] = useState<Record<string, string>>({
    Mon: "09:00-18:00",
    Tue: "09:00-18:00",
    Wed: "09:00-18:00",
    Thu: "09:00-18:00",
    Fri: "09:00-18:00",
    Sat: "09:00-14:00",
    Sun: "OFF",
  });

  const refreshList = () => {
    setStaffList(getStaff());
  };

  useEffect(() => {
    refreshList();
  }, []);

  const handleOpenAdd = () => {
    setEditingStaffId(null);
    setName("");
    setRole("GROOMER");
    setPhone("+65 9123 4567");
    setEmail("");
    setIsActive(true);
    setSchedule({
      Mon: "09:00-18:00",
      Tue: "09:00-18:00",
      Wed: "09:00-18:00",
      Thu: "09:00-18:00",
      Fri: "09:00-18:00",
      Sat: "09:00-14:00",
      Sun: "OFF",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (staff: MockStaff) => {
    setEditingStaffId(staff.id);
    setName(staff.name);
    setRole(staff.role);
    setPhone(staff.phone);
    setEmail(staff.email);
    setIsActive(staff.isActive);
    setSchedule(
      staff.schedule || {
        Mon: "09:00-18:00",
        Tue: "09:00-18:00",
        Wed: "09:00-18:00",
        Thu: "09:00-18:00",
        Fri: "09:00-18:00",
        Sat: "09:00-14:00",
        Sun: "OFF",
      }
    );
    setIsDialogOpen(true);
  };

  const handleDayScheduleChange = (day: string, value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: value,
    }));
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingStaffId) {
      const staffMember: MockStaff = {
        id: editingStaffId,
        name: name.trim(),
        role,
        phone: phone.trim() || "+65 9000 0000",
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, ".")}@doglab.com`,
        isActive,
        schedule,
      };
      updateStaff(staffMember);
    } else {
      const newStaff: MockStaff = {
        id: `s_${Date.now()}`,
        name: name.trim(),
        role,
        phone: phone.trim() || "+65 9000 0000",
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, ".")}@doglab.com`,
        isActive: true,
        schedule,
      };
      saveStaff(newStaff);
    }

    refreshList();
    setIsDialogOpen(false);
  };

  const handleDeleteStaff = (id: string, staffName: string) => {
    if (confirm(`Are you sure you want to delete staff member "${staffName}"?`)) {
      deleteStaff(id);
      refreshList();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Staff & Schedules
          </h1>
          <p className="text-muted-foreground">
            Manage groomers, receptionists, their working hours, and roster
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Staff List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {staffList.map((staff) => (
          <Card key={staff.id} className="shadow-sm flex flex-col justify-between hover:border-primary/50 transition-colors">
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
                      <CardTitle className="text-base font-semibold truncate">{staff.name}</CardTitle>
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
                    <span>{staff.isActive ? "🟢 Active" : "🔴 Inactive"}</span>
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
                          <div className="mt-0.5 text-[8.5px] leading-tight">
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
                Edit Staff & Schedule
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                onClick={() => handleDeleteStaff(staff.id, staff.name)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Staff Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStaffId ? "Edit Staff & Schedule" : "Add New Staff Member"}</DialogTitle>
            <DialogDescription>
              Set salon role, contact information, and weekly shift schedules.
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
                  onValueChange={(val) => setRole(val as any)}
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
                <Label htmlFor="staffEmail">Email Address</Label>
                <Input
                  id="staffEmail"
                  type="email"
                  placeholder="jason@doglab.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Weekly Schedule Planner */}
            <div className="space-y-3 pt-3 border-t">
              <Label className="flex items-center gap-1.5 text-sm font-semibold">
                <Clock className="h-4 w-4 text-primary" />
                Weekly Work Schedule (Mon - Sun)
              </Label>
              <p className="text-xs text-muted-foreground">
                Select shift hours for each day of the week or mark as day off.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DAYS.map((day) => {
                  const currentVal = schedule[day] || "OFF";
                  return (
                    <div key={day} className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-muted/20">
                      <span className="font-semibold text-xs w-12">{day}:</span>
                      <Select
                        value={currentVal}
                        onValueChange={(val) => handleDayScheduleChange(day, val)}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="09:00-18:00">09:00 - 18:00 (Standard Full)</SelectItem>
                          <SelectItem value="10:00-19:00">10:00 - 19:00 (Late Shift)</SelectItem>
                          <SelectItem value="09:00-14:00">09:00 - 14:00 (Morning Half)</SelectItem>
                          <SelectItem value="13:00-20:00">13:00 - 20:00 (Afternoon Half)</SelectItem>
                          <SelectItem value="OFF">OFF (Rest Day)</SelectItem>
                        </SelectContent>
                      </Select>
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
                {editingStaffId ? "Save Changes" : "Create Staff Profile"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
