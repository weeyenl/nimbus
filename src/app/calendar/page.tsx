"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Button } from "@/components/ui/button";
import { Plus, Clock, AlertTriangle, StickyNote } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getAppointments,
  saveAppointment,
  getCustomers,
  getStaff,
  STATUS_COLORS_HEX,
  MockAppointment,
  MockStaff,
  MockPet,
  getSalonSettings,
  saveSalonSettings,
  SalonSettings,
  DEFAULT_SALON_SETTINGS,
  findOverlappingAppointments,
  getStaffShiftForDate,
  isTimeWithinShift,
} from "@/lib/mock-data";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { showToast } from "@/components/ui/toast-system";

export default function CalendarPage() {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [appointments, setAppointments] = useState<MockAppointment[]>([]);
  const [staffList, setStaffList] = useState<MockStaff[]>([]);
  const [petsById, setPetsById] = useState<Record<string, MockPet>>({});

  const [groomerFilter, setGroomerFilter] = useState<string>("ALL");
  const [hideCancelled, setHideCancelled] = useState<boolean>(true);
  const [showLegend, setShowLegend] = useState(false);
  const [visibleRange, setVisibleRange] = useState<{
    start: Date;
    end: Date;
    title: string;
  } | null>(null);

  const [salonSettings, setSalonSettings] = useState<SalonSettings>(DEFAULT_SALON_SETTINGS);
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [tempStart, setTempStart] = useState("08:00");
  const [tempEnd, setTempEnd] = useState("21:00");

  const loadData = () => {
    setAppointments(getAppointments());
    setStaffList(getStaff().filter((s) => s.isActive !== false));
    const map: Record<string, MockPet> = {};
    getCustomers().forEach((c) => c.pets.forEach((p) => (map[p.id] = p)));
    setPetsById(map);

    const settings = getSalonSettings();
    setSalonSettings(settings);
    setTempStart(settings.calendarStartTime);
    setTempEnd(settings.calendarEndTime);
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    loadData();
    window.addEventListener("nimbus-data-updated", loadData);
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("nimbus-data-updated", loadData);
    };
  }, []);

  function handleEventDrop(info: any) {
    const newStart: Date | null = info.event.start;
    const newEnd: Date | null = info.event.end;
    if (!newStart) return;

    const year = newStart.getFullYear();
    const month = String(newStart.getMonth() + 1).padStart(2, "0");
    const day = String(newStart.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const startTime = `${String(newStart.getHours()).padStart(2, "0")}:${String(
      newStart.getMinutes()
    ).padStart(2, "0")}`;

    let endTime = "";
    if (newEnd && newEnd.getDate() === newStart.getDate()) {
      endTime = `${String(newEnd.getHours()).padStart(2, "0")}:${String(
        newEnd.getMinutes()
      ).padStart(2, "0")}`;
    } else {
      const original = getAppointments().find((a) => a.id === info.event.id);
      const dur = original?.serviceDuration || 60;
      const endD = new Date(newStart.getTime() + dur * 60000);
      endTime =
        endD.getDate() !== newStart.getDate()
          ? "23:45"
          : `${String(endD.getHours()).padStart(2, "0")}:${String(
              endD.getMinutes()
            ).padStart(2, "0")}`;
    }

    const apt = getAppointments().find((a) => a.id === info.event.id);
    if (!apt) return;

    const updatedApt: MockAppointment = {
      ...apt,
      dateStr,
      startTime,
      endTime,
    };
    saveAppointment(updatedApt);
    setAppointments(getAppointments());

    const overlaps = findOverlappingAppointments(
      apt.groomerId,
      dateStr,
      startTime,
      endTime,
      apt.id
    );
    const staffMember = staffList.find((s) => s.id === apt.groomerId);
    const shift = getStaffShiftForDate(staffMember, dateStr);
    const inShift = isTimeWithinShift(startTime, endTime, shift);

    if (overlaps.length > 0) {
      showToast(
        `Moved to ${dateStr} ${startTime}, but ${apt.groomerName} overlaps with ${overlaps[0].petName}.`,
        "warning"
      );
    } else if (!inShift) {
      showToast(
        `Moved to ${dateStr} ${startTime}, outside ${apt.groomerName}'s shift (${shift}).`,
        "warning"
      );
    } else {
      showToast(`Rescheduled ${apt.petName} to ${dateStr} ${startTime}.`, "success");
    }
  }

  function handleEventResize(info: any) {
    const newStart: Date | null = info.event.start;
    const newEnd: Date | null = info.event.end;
    if (!newStart || !newEnd) return;

    const startTime = `${String(newStart.getHours()).padStart(2, "0")}:${String(
      newStart.getMinutes()
    ).padStart(2, "0")}`;

    const endTime =
      newEnd.getDate() !== newStart.getDate()
        ? "23:45"
        : `${String(newEnd.getHours()).padStart(2, "0")}:${String(
            newEnd.getMinutes()
          ).padStart(2, "0")}`;

    const durationMins = Math.round((newEnd.getTime() - newStart.getTime()) / 60000);
    const apt = getAppointments().find((a) => a.id === info.event.id);
    if (!apt) return;

    const updatedApt: MockAppointment = {
      ...apt,
      startTime,
      endTime,
      serviceDuration: durationMins > 0 ? durationMins : apt.serviceDuration,
    };
    saveAppointment(updatedApt);
    setAppointments(getAppointments());

    const overlaps = findOverlappingAppointments(
      apt.groomerId,
      apt.dateStr,
      startTime,
      endTime,
      apt.id
    );
    if (overlaps.length > 0) {
      showToast(
        `Updated duration, but overlaps ${overlaps[0].petName} (${overlaps[0].startTime}).`,
        "warning"
      );
    } else {
      showToast(`Updated ${apt.petName}'s slot duration to ${updatedApt.serviceDuration} mins.`, "success");
    }
  }

  function handleSaveHours(e: React.FormEvent) {
    e.preventDefault();
    const updated = saveSalonSettings({
      calendarStartTime: tempStart,
      calendarEndTime: tempEnd,
    });
    setSalonSettings(updated);
    setIsHoursModalOpen(false);
    showToast("Calendar operating hours updated.", "success");
  }

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (hideCancelled && (apt.status === "CANCELLED" || apt.status === "NO_SHOW")) {
        return false;
      }
      if (groomerFilter !== "ALL" && apt.groomerId !== groomerFilter) {
        return false;
      }
      return true;
    });
  }, [appointments, hideCancelled, groomerFilter]);

  const visibleAppointments = filteredAppointments.filter((apt) => {
    if (!visibleRange) return true;
    const aptDate = new Date(`${apt.dateStr}T00:00:00`);
    return aptDate >= visibleRange.start && aptDate < visibleRange.end;
  });

  const statusCounts = visibleAppointments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const events = filteredAppointments.map((apt) => {
    const colors = STATUS_COLORS_HEX[apt.status] || {
      bg: "#3b82f6",
      border: "#2563eb",
      text: "#ffffff",
    };
    const pet = petsById[apt.petId];
    const hasWarnings = (pet?.warnings?.length || 0) > 0;
    const isLocked =
      apt.isPaid || ["DONE", "CANCELLED", "NO_SHOW"].includes(apt.status);

    return {
      id: apt.id,
      title: `${apt.petName} (${apt.serviceName})`,
      start: `${apt.dateStr}T${apt.startTime}:00`,
      end: `${apt.dateStr}T${apt.endTime}:00`,
      editable: !isLocked,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: colors.text,
      extendedProps: {
        petName: apt.petName,
        petBreed: apt.petBreed,
        serviceName: apt.serviceName,
        groomerName: apt.groomerName,
        status: apt.status,
        isPaid: apt.isPaid,
        hasWarnings,
        warningsText: pet?.warnings?.join(", ") || "",
        notes: apt.notes || "",
      },
    };
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Calendar</h1>
          <p className="text-muted-foreground">Schedule view by day, week, and month</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg border bg-muted/30 p-0.5 mr-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTempStart(salonSettings.calendarStartTime);
                setTempEnd(salonSettings.calendarEndTime);
                setIsHoursModalOpen(true);
              }}
              className="h-7 text-xs px-2.5 text-muted-foreground hover:text-foreground gap-1.5 font-normal"
              title="Configure calendar operating hours"
            >
              <Clock className="h-3.5 w-3.5" />
              Hours
            </Button>
            <Button
              variant={showLegend ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowLegend((v) => !v)}
              className="h-7 text-xs px-2.5 text-muted-foreground hover:text-foreground gap-1.5 font-normal"
              title="Toggle status color legend"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              {showLegend ? "Hide Legend" : "Legend"}
            </Button>
          </div>

          <Button asChild size="sm" className="font-semibold shadow-xs">
            <Link href="/appointments/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New Booking
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="font-medium">
            <Link href="/appointments/walk-in">
              <Clock className="mr-1.5 h-4 w-4" />
              Walk-in
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="cal-groomer-filter" className="text-xs text-muted-foreground whitespace-nowrap">
              Staff / Groomer:
            </Label>
            <Select value={groomerFilter} onValueChange={setGroomerFilter}>
              <SelectTrigger id="cal-groomer-filter" className="h-8 w-[170px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Staff</SelectItem>
                {staffList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.role === "GROOMER" ? "Groomer" : s.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="hide-cancelled"
            checked={hideCancelled}
            onCheckedChange={setHideCancelled}
          />
          <Label htmlFor="hide-cancelled" className="text-xs cursor-pointer text-muted-foreground">
            Hide Cancelled / No-Show
          </Label>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="rounded-xl border bg-card p-3 shadow-sm md:p-6 space-y-4">
        {showLegend && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 p-3 bg-muted/40 rounded-lg border text-xs animate-in fade-in duration-150">
            <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
              {visibleRange?.title ? `${visibleRange.title} Status:` : "Status:"}
            </span>
            {[
              { key: "BOOKED", label: "Booked", dot: "#3b82f6", pill: "bg-blue-100 text-blue-800" },
              { key: "ARRIVED", label: "Arrived", dot: "#f59e0b", pill: "bg-amber-100 text-amber-800" },
              { key: "IN_PROGRESS", label: "In Progress", dot: "#8b5cf6", pill: "bg-purple-100 text-purple-800" },
              { key: "DONE", label: "Done", dot: "#10b981", pill: "bg-emerald-100 text-emerald-800" },
              { key: "NO_SHOW", label: "No Show", dot: "#6b7280", pill: "bg-gray-100 text-gray-800" },
              { key: "CANCELLED", label: "Cancelled", dot: "#ef4444", pill: "bg-red-100 text-red-800" },
            ].map((item) => (
              <div key={item.key} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full shadow-xs" style={{ backgroundColor: item.dot }} />
                <span className="font-medium text-foreground">{item.label}</span>
                {statusCounts[item.key] ? (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${item.pill}`}>
                    {statusCounts[item.key]}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay"
          eventDisplay="block"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridDay,timeGridWeek,dayGridMonth",
          }}
          buttonText={{
            today: "Today",
            dayGridMonth: "Month",
            timeGridWeek: "Week",
            timeGridDay: "Day",
          }}
          slotMinTime={`${salonSettings.calendarStartTime}:00`}
          slotMaxTime={`${salonSettings.calendarEndTime}:00`}
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          slotLabelFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
            hour12: true,
          }}
          datesSet={(info) => {
            setVisibleRange({
              start: info.start,
              end: info.end,
              title: info.view.title,
            });
          }}
          allDaySlot={false}
          nowIndicator={true}
          editable={true}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          selectable={true}
          dayMaxEvents={true}
          weekends={true}
          height="auto"
          contentHeight={isMobile ? 550 : 700}
          events={events}
          eventClick={(info) => {
            router.push(`/appointments/${info.event.id}`);
          }}
          dateClick={(info) => {
            let dateVal = info.dateStr;
            let timeVal = "";
            if (info.dateStr.includes("T")) {
              const [d, t] = info.dateStr.split("T");
              dateVal = d;
              timeVal = t.slice(0, 5);
            } else {
              dateVal = info.dateStr.slice(0, 10);
            }
            const params = new URLSearchParams();
            if (dateVal) params.set("date", dateVal);
            if (timeVal) params.set("time", timeVal);
            router.push(`/appointments/new?${params.toString()}`);
          }}
          eventContent={(arg) => {
            const props = arg.event.extendedProps;
            const start = arg.event.start;
            const end = arg.event.end;
            const durationMins =
              start && end ? Math.round((end.getTime() - start.getTime()) / 60000) : 60;
            const isShortSlot = durationMins <= 35;
            const statusLabel = APPOINTMENT_STATUS_LABELS[props.status] || props.status;
            const tooltip = `${props.petName} (${props.petBreed}) - ${props.serviceName} | ${statusLabel} | Groomer: ${props.groomerName}${
              props.isPaid ? " | Paid" : ""
            }${props.warningsText ? ` | Alert: ${props.warningsText}` : ""}${
              props.notes ? ` | Note: ${props.notes}` : ""
            }`;

            if (arg.view.type === "dayGridMonth") {
              return (
                <div
                  style={{
                    backgroundColor: arg.event.backgroundColor,
                    borderColor: arg.event.borderColor,
                  }}
                  className="flex items-center justify-between gap-1 w-full px-1.5 py-0.5 text-[11px] font-semibold text-white rounded truncate leading-tight shadow-xs"
                  title={tooltip}
                >
                  <span className="truncate flex items-center gap-1">
                    {props.hasWarnings && <AlertTriangle className="h-3 w-3 shrink-0 text-amber-200" />}
                    {props.petName} · {props.serviceName}
                  </span>
                  <span className="text-[9px] font-bold uppercase opacity-90 shrink-0 bg-black/30 px-1 rounded">
                    {statusLabel}
                  </span>
                </div>
              );
            }

            if (isShortSlot) {
              return (
                <div
                  className="flex items-center justify-between gap-1 text-xs font-medium leading-none overflow-hidden w-full whitespace-nowrap"
                  title={tooltip}
                >
                  <div className="flex items-center gap-1 truncate min-w-0">
                    {props.hasWarnings && <AlertTriangle className="h-3 w-3 shrink-0 text-amber-200" />}
                    <span className="font-bold truncate shrink-0">{props.petName}</span>
                    <span className="opacity-80 truncate text-[10px]">· {props.serviceName}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {props.notes && <StickyNote className="h-2.5 w-2.5 opacity-85" />}
                    {props.isPaid && (
                      <span className="bg-emerald-950/40 text-emerald-100 border border-emerald-300/40 text-[8px] px-1 py-0.2 rounded font-semibold">
                        Paid
                      </span>
                    )}
                    <span className="bg-black/25 text-white text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      {statusLabel}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div
                className="flex flex-col justify-start h-full text-xs overflow-hidden leading-tight"
                title={tooltip}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1 min-w-0">
                    {props.hasWarnings && <AlertTriangle className="h-3 w-3 shrink-0 text-amber-200" />}
                    <span className="font-bold truncate text-[11.5px] sm:text-xs tracking-tight">
                      {props.petName}
                    </span>
                    {props.isPaid && (
                      <span className="bg-emerald-950/40 text-emerald-100 border border-emerald-300/40 text-[8.5px] px-1 py-0 rounded font-semibold shrink-0">
                        Paid
                      </span>
                    )}
                  </div>
                  <span className="bg-black/25 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                    {statusLabel}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-medium opacity-90 mt-0.5 truncate">
                  <span className="opacity-80 font-normal shrink-0">{props.petBreed}</span>
                  <span className="opacity-60 shrink-0">·</span>
                  <span className="truncate">{props.serviceName}</span>
                </div>

                {durationMins >= 60 && (
                  <div className="flex items-center justify-between gap-1 text-[10px] opacity-85 mt-auto pt-1 border-t border-white/20">
                    <span className="truncate font-medium">✂ {props.groomerName}</span>
                    {props.notes && <StickyNote className="h-3 w-3 shrink-0 opacity-90" />}
                  </div>
                )}
              </div>
            );
          }}
        />
      </div>

      {/* Calendar Operating Hours Dialog */}
      <Dialog open={isHoursModalOpen} onOpenChange={setIsHoursModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Calendar Hours</DialogTitle>
            <DialogDescription>
              Set the earliest and latest hours shown on the calendar schedule view.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveHours} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Start Time (Earliest Slot)</Label>
                <Select value={tempStart} onValueChange={setTempStart}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="06:00">6:00 AM</SelectItem>
                    <SelectItem value="07:00">7:00 AM</SelectItem>
                    <SelectItem value="08:00">8:00 AM (Standard)</SelectItem>
                    <SelectItem value="09:00">9:00 AM</SelectItem>
                    <SelectItem value="10:00">10:00 AM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">End Time (Latest Slot)</Label>
                <Select value={tempEnd} onValueChange={setTempEnd}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="19:00">7:00 PM (Slots up to 7 PM)</SelectItem>
                    <SelectItem value="20:00">8:00 PM (Slots up to 8 PM)</SelectItem>
                    <SelectItem value="21:00">9:00 PM (Slots up to 9 PM)</SelectItem>
                    <SelectItem value="22:00">10:00 PM (Slots up to 10 PM)</SelectItem>
                    <SelectItem value="23:00">11:00 PM (Slots up to 11 PM)</SelectItem>
                    <SelectItem value="24:00">12:00 AM (Midnight)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">How End Time works:</p>
              <p>
                Choosing <strong>9:00 PM</strong> means 8:00 PM – 9:00 PM appointments are fully visible.
                Choosing <strong>10:00 PM</strong> extends slots through 9:00 PM – 10:00 PM.
              </p>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsHoursModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Hours</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
