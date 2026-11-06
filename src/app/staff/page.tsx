"use client";

import React, { useState, useEffect } from "react";
import { Plus, Calendar, Phone, Mail, UserCheck } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getInitials } from "@/lib/utils";
import { getStaff, saveStaff, MockStaff } from "@/lib/mock-data";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-purple-100 text-purple-800",
  GROOMER: "bg-blue-100 text-blue-800",
  RECEPTIONIST: "bg-green-100 text-green-800",
};

export default function StaffPage() {
  const [staffList, setStaffList] = useState<MockStaff[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [role, setRole] = useState<"GROOMER" | "RECEPTIONIST" | "OWNER">("GROOMER");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    setStaffList(getStaff());
  }, []);

  function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const newStaff: MockStaff = {
      id: `s_${Date.now()}`,
      name: name.trim(),
      role: role,
      phone: phone || "+65 9000 0000",
      email: email || `${name.toLowerCase().replace(/\s+/g, ".")}@doglab.com`,
      isActive: true,
      schedule: {
        Mon: "09:00-18:00",
        Tue: "09:00-18:00",
        Wed: "09:00-18:00",
        Thu: "09:00-18:00",
        Fri: "09:00-18:00",
        Sat: role === "GROOMER" ? "09:00-14:00" : "OFF",
        Sun: "OFF",
      },
    };

    saveStaff(newStaff);
    setStaffList(getStaff());
    setIsDialogOpen(false);
    setName("");
    setPhone("");
    setEmail("");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Staff & Schedules
          </h1>
          <p className="text-muted-foreground">
            Manage groomers, receptionists, and their working hours
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
              <DialogDescription>
                Create a new staff profile and assign their salon role.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddStaff} className="space-y-4 pt-2">
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

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="staffPhone">Phone</Label>
                  <Input
                    id="staffPhone"
                    type="tel"
                    placeholder="+65 9123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staffEmail">Email</Label>
                  <Input
                    id="staffEmail"
                    type="email"
                    placeholder="jason@doglab.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Staff Member</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {staffList.map((staff) => (
          <Card key={staff.id} className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(staff.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">{staff.name}</CardTitle>
                    <Badge
                      variant="secondary"
                      className={ROLE_COLORS[staff.role] || ""}
                    >
                      {staff.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <Phone className="h-3 w-3" />
                    <span>{staff.phone}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Weekly Working Schedule</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map((day) => {
                    const schedule = staff.schedule?.[day] || "OFF";
                    const isOff = schedule === "OFF";
                    return (
                      <div
                        key={day}
                        className={`rounded-md p-1.5 text-center text-xs ${
                          isOff
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary/10 text-primary font-medium"
                        }`}
                      >
                        <div className="font-semibold text-[11px]">{day}</div>
                        <div className="mt-0.5 text-[9px] leading-tight">
                          {isOff ? "Off" : schedule.replace("-", "\n")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
