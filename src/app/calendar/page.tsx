"use client";

import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Button } from "@/components/ui/button";
import { Plus, Clock, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getAppointments,
  saveAppointment,
  STATUS_COLORS_HEX,
  MockAppointment,
  getSalonSettings,
  saveSalonSettings,
  SalonSettings,
  DEFAULT_SALON_SETTINGS,
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

export default function CalendarPage() {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [appointments, setAppointments] = useState<MockAppointment[]>([]);
  const [showLegend, setShowLegend] = useState(false);
  const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date; title: string } | null>(null);

  // Calendar Hours / Operating Hours Settings
  const [salonSettings, setSalonSettings] = useState<SalonSettings>(DEFAULT_SALON_SETTINGS);
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [tempStart, setTempStart] = useState("08:00");
  const [tempEnd, setTempEnd] = useState("21:00");

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    setAppointments(getAppointments());
    const settings = getSalonSettings();
    setSalonSettings(settings);
    setTempStart(settings.calendarStartTime);
    setTempEnd(settings.calendarEndTime);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  function handleEventDrop(info: any) {
    const newStart = info.event.start;
    const newEnd = info.event.end;
    if (!newStart) return;

    const year = newStart.getFullYear();
    const month = String(newStart.getMonth() + 1).padStart(2, "0");
    const day = String(newStart.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const startHours = String(newStart.getHours()).padStart(2, "0");
    const startMins = String(newStart.getMinutes()).padStart(2, "0");
    const startTime = `${startHours}:${startMins}`;

    let endTime = "";
    if (newEnd) {
      const endHours = String(newEnd.getHours()).padStart(2, "0");
      const endMins = String(newEnd.getMinutes()).padStart(2, "0");
      endTime = `${endHours}:${endMins}`;
    } else {
      const original = appointments.find((a) => a.id === info.event.id);
      const dur = original?.serviceDuration || 60;
      const endD = new Date(newStart.getTime() + dur * 60000);
      endTime = `${String(endD.getHours()).padStart(2, "0")}:${String(endD.getMinutes()).padStart(2, "0")}`;
    }

    const current = getAppointments();
    const apt = current.find((a) => a.id === info.event.id);
    if (apt) {
      const updatedApt: MockAppointment = {
        ...apt,
        dateStr,
        startTime,
        endTime,
      };
      saveAppointment(updatedApt);
      setAppointments(getAppointments());
    }
  }

  function handleEventResize(info: any) {
    const newStart = info.event.start;
    const newEnd = info.event.end;
    if (!newStart || !newEnd) return;

    const startHours = String(newStart.getHours()).padStart(2, "0");
    const startMins = String(newStart.getMinutes()).padStart(2, "0");
    const startTime = `${startHours}:${startMins}`;

    const endHours = String(newEnd.getHours()).padStart(2, "0");
    const endMins = String(newEnd.getMinutes()).padStart(2, "0");
    const endTime = `${endHours}:${endMins}`;

    const durationMins = Math.round((newEnd.getTime() - newStart.getTime()) / 60000);

    const current = getAppointments();
    const apt = current.find((a) => a.id === info.event.id);
    if (apt) {
      const updatedApt: MockAppointment = {
        ...apt,
        startTime,
        endTime,
        serviceDuration: durationMins > 0 ? durationMins : apt.serviceDuration,
      };
      saveAppointment(updatedApt);
      setAppointments(getAppointments());
    }
  }

  function handleSaveHours(e: React.FormEvent) {
    e.preventDefault();
    const updated: SalonSettings = {
      calendarStartTime: tempStart,
      calendarEndTime: tempEnd,
    };
    saveSalonSettings(updated);
    setSalonSettings(updated);
    setIsHoursModalOpen(false);
  }

  const visibleAppointments = appointments.filter((apt) => {
    if (!visibleRange) return true;
    const aptDate = new Date(`${apt.dateStr}T00:00:00`);
    return aptDate >= visibleRange.start && aptDate < visibleRange.end;
  });

  const statusCounts = visibleAppointments.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const events = appointments.map((apt) => {
    const colors = STATUS_COLORS_HEX[apt.status] || {
      bg: "#3b82f6",
      border: "#2563eb",
      text: "#ffffff",
    };
    return {
      id: apt.id,
      title: `${apt.petName} (${apt.serviceName})`,
      start: `${apt.dateStr}T${apt.startTime}:00`,
      end: `${apt.dateStr}T${apt.endTime}:00`,
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
      },
    };
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Calendar
          </h1>
          <p className="text-muted-foreground">
            Schedule view by day, week, and month
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Subtle utility controls */}
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

          {/* Primary Focus Actions */}
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

      {/* Calendar Card */}
      <div className="rounded-xl border bg-card p-3 shadow-sm md:p-6 space-y-4">
        {/* Status Legend Bar with Live Dynamic Counts for Currently Viewed Date Range */}
        {showLegend && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 p-3 bg-muted/40 rounded-lg border text-xs animate-in fade-in duration-150">
            <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
              {visibleRange?.title ? `${visibleRange.title} Status:` : "Status:"}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6] shadow-xs"></span>
              <span className="font-medium text-foreground">Booked</span>
              {statusCounts["BOOKED"] ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold">
                  {statusCounts["BOOKED"]}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b] shadow-xs"></span>
              <span className="font-medium text-foreground">Arrived</span>
              {statusCounts["ARRIVED"] ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                  {statusCounts["ARRIVED"]}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#8b5cf6] shadow-xs"></span>
              <span className="font-medium text-foreground">In Progress</span>
              {statusCounts["IN_PROGRESS"] ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold">
                  {statusCounts["IN_PROGRESS"]}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#10b981] shadow-xs"></span>
              <span className="font-medium text-foreground">Done</span>
              {statusCounts["DONE"] ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                  {statusCounts["DONE"]}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#6b7280] shadow-xs"></span>
              <span className="font-medium text-foreground">No Show</span>
              {statusCounts["NO_SHOW"] ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 font-bold">
                  {statusCounts["NO_SHOW"]}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444] shadow-xs"></span>
              <span className="font-medium text-foreground">Cancelled</span>
              {statusCounts["CANCELLED"] ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold">
                  {statusCounts["CANCELLED"]}
                </span>
              ) : null}
            </div>
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
            right: isMobile
              ? "timeGridDay,dayGridMonth"
              : "timeGridDay,timeGridWeek,dayGridMonth",
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
            const durationMins = start && end ? Math.round((end.getTime() - start.getTime()) / 60000) : 60;
            const isShortSlot = durationMins <= 35;
            const statusLabel = APPOINTMENT_STATUS_LABELS[props.status] || props.status;

            // Month View (dayGrid) Event Rendering - Solid Colored Badge
            if (arg.view.type === "dayGridMonth") {
              return (
                <div
                  style={{ backgroundColor: arg.event.backgroundColor, borderColor: arg.event.borderColor }}
                  className="flex items-center justify-between gap-1 w-full px-1.5 py-0.5 text-[11px] font-semibold text-white rounded truncate leading-tight shadow-xs"
                  title={`${props.petName} (${props.petBreed}) - ${props.serviceName} | ${statusLabel}`}
                >
                  <span className="truncate">
                    {props.petName} · {props.serviceName}
                  </span>
                  <span className="text-[9px] font-bold uppercase opacity-90 shrink-0 bg-black/30 px-1 rounded">
                    {statusLabel}
                  </span>
                </div>
              );
            }

            // Short slot (<= 35 mins) in TimeGrid (Day/Week)
            if (isShortSlot) {
              return (
                <div
                  className="flex items-center justify-between gap-1 text-xs font-medium leading-none overflow-hidden w-full whitespace-nowrap"
                  title={`${props.petName} (${props.petBreed}) - ${props.serviceName} | Status: ${statusLabel} | Groomer: ${props.groomerName}${props.isPaid ? ' | Paid' : ''}`}
                >
                  <div className="flex items-center gap-1 truncate min-w-0">
                    <span className="font-bold truncate shrink-0">{props.petName}</span>
                    <span className="opacity-80 truncate text-[10px]">· {props.serviceName}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
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

            // Regular slot in TimeGrid (Day/Week)
            return (
              <div
                className="flex flex-col justify-start h-full text-xs overflow-hidden leading-tight"
                title={`${props.petName} (${props.petBreed}) - ${props.serviceName} | Status: ${statusLabel} | Groomer: ${props.groomerName}${props.isPaid ? ' | Paid' : ''}`}
              >
                {/* Top Row: Pet Name, Paid Badge & Status Pill */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="font-bold truncate text-[11.5px] sm:text-xs tracking-tight">
                      {props.petName}
                    </span>
                    {props.isPaid && (
                      <span className="bg-emerald-950/40 text-emerald-100 border border-emerald-300/40 text-[8.5px] px-1 py-0 rounded font-semibold shrink-0">
                        Paid
                      </span>
                    )}
                  </div>
                  <span className="bg-black/25 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 backdrop-blur-xs">
                    {statusLabel}
                  </span>
                </div>

                {/* Subtitle: Breed + Service */}
                <div className="flex items-center gap-1 text-[10px] font-medium opacity-90 mt-0.5 truncate">
                  <span className="opacity-80 font-normal shrink-0">{props.petBreed}</span>
                  <span className="opacity-60 shrink-0">·</span>
                  <span className="truncate">{props.serviceName}</span>
                </div>

                {/* Footer: Groomer if duration allows */}
                {durationMins >= 60 && (
                  <div className="flex items-center gap-1 text-[10px] opacity-85 mt-auto pt-1 border-t border-white/20">
                    <span>✂</span>
                    <span className="truncate font-medium">{props.groomerName}</span>
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
              <p className="font-medium text-foreground">💡 How End Time works:</p>
              <p>
                Choosing <strong>9:00 PM</strong> means 8:00 PM – 9:00 PM appointments are fully visible.
                Choosing <strong>10:00 PM</strong> extends slots through 9:00 PM – 10:00 PM.
              </p>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsHoursModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Hours
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
