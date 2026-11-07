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
            router.push(`/appointments/new?date=${info.dateStr}`);
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
                  className="flex items-center gap-1.5 px-1 py-0.5 text-[11px] leading-tight overflow-hidden w-full whitespace-nowrap"
                  title={`${props.petName} (${props.petBreed}) - ${props.serviceName} | Groomer: ${props.groomerName}`}
                >
                  <span className="font-bold truncate shrink-0">{props.petName}</span>
                  <span className="opacity-80 truncate text-[10px]">{props.serviceName}</span>
                </div>
              );
            }

            return (
              <div
                className="flex flex-col justify-start h-full p-1 text-xs overflow-hidden leading-tight"
                title={`${props.petName} (${props.petBreed}) - ${props.serviceName} | Groomer: ${props.groomerName}`}
              >
                <div className="font-bold truncate text-[11px] sm:text-xs">
                  {props.petName}{" "}
                  <span className="opacity-80 font-normal">({props.petBreed})</span>
                </div>
                <div className="truncate text-[10px] sm:text-[11px] opacity-90">
                  {props.serviceName}
                </div>
                {durationMins >= 60 && (
                  <div className="truncate text-[9.5px] opacity-80 mt-auto">
                    ✂ {props.groomerName}
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
