"use client";

import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Button } from "@/components/ui/button";
import { Plus, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAppointments, STATUS_COLORS_HEX, MockAppointment } from "@/lib/mock-data";

export default function CalendarPage() {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [appointments, setAppointments] = useState<MockAppointment[]>([]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    setAppointments(getAppointments());
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

      {/* Calendar Card */}
      <div className="rounded-xl border bg-card p-3 shadow-sm md:p-6">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay"
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
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          slotLabelFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
            hour12: true,
          }}
          slotLabelContent={(arg) => {
            const date = arg.date;
            const hours = date.getHours();
            const ampm = hours >= 12 ? "PM" : "AM";
            const displayHour = hours % 12 || 12;
            return (
              <div className="flex items-baseline justify-end gap-1 px-1.5 select-none pt-0.5">
                <span className="font-semibold text-[11px] text-slate-600 dark:text-slate-300 tabular-nums">
                  {displayHour}:00
                </span>
                <span className="font-medium text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {ampm}
                </span>
              </div>
            );
          }}
          allDaySlot={false}
          nowIndicator={true}
          editable={true}
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

            if (isShortSlot) {
              return (
                <div
                  className="flex items-center gap-1.5 text-xs font-medium leading-none overflow-hidden w-full whitespace-nowrap"
                  title={`${props.petName} (${props.petBreed}) - ${props.serviceName} | Groomer: ${props.groomerName}`}
                >
                  <span className="font-semibold truncate shrink-0">{props.petName}</span>
                  <span className="opacity-80 truncate text-[10.5px]">· {props.serviceName}</span>
                </div>
              );
            }

            return (
              <div
                className="flex flex-col justify-start h-full text-xs overflow-hidden leading-tight"
                title={`${props.petName} (${props.petBreed}) - ${props.serviceName} | Groomer: ${props.groomerName}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold truncate text-[11.5px] sm:text-xs tracking-tight">
                    {props.petName}
                  </span>
                  <span className="opacity-80 font-normal text-[10px] shrink-0 truncate">
                    {props.petBreed}
                  </span>
                </div>
                <div className="truncate text-[10.5px] font-medium opacity-90 mt-0.5">
                  {props.serviceName}
                </div>
                {durationMins >= 60 && (
                  <div className="flex items-center gap-1 text-[10px] opacity-80 mt-auto pt-1 border-t border-white/20">
                    <span>✂</span>
                    <span className="truncate font-medium">{props.groomerName}</span>
                  </div>
                )}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
