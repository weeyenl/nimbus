"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Users,
  PawPrint,
  Scissors,
  UserCog,
  LayoutDashboard,
  Menu,
  X,
  Sparkles,
  BarChart3,
  Shield,
  ShieldCheck,
  Check,
  User,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type UserRole = "OWNER" | "RECEPTIONIST" | "GROOMER";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const ALL_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["OWNER", "RECEPTIONIST", "GROOMER"] },
  { href: "/calendar", label: "Calendar", icon: Calendar, roles: ["OWNER", "RECEPTIONIST", "GROOMER"] },
  { href: "/appointments", label: "Appointments", icon: Scissors, roles: ["OWNER", "RECEPTIONIST", "GROOMER"] },
  { href: "/customers", label: "Customers", icon: Users, roles: ["OWNER", "RECEPTIONIST"] },
  { href: "/pets", label: "Pets Directory", icon: PawPrint, roles: ["OWNER", "RECEPTIONIST", "GROOMER"] },
  { href: "/services", label: "Services & Pricing", icon: Sparkles, roles: ["OWNER"] },
  { href: "/reports", label: "Daily Reports", icon: BarChart3, roles: ["OWNER"] },
  { href: "/staff", label: "Staff & Shifts", icon: UserCog, roles: ["OWNER"] },
];

const ROLE_PROFILES = [
  {
    role: "OWNER" as UserRole,
    title: "Owner / Salon Manager",
    name: "Jason Lim",
    email: "owner@doglab.com",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    description: "Unrestricted access to all departments: pricing, staff schedules, POS, financial revenue reports.",
  },
  {
    role: "RECEPTIONIST" as UserRole,
    title: "Front Desk Receptionist",
    name: "Cindy Tan",
    email: "cindy@doglab.com",
    badgeColor: "bg-green-100 text-green-800 border-green-300",
    description: "Bookings, check-in, payments, walk-ins, and customer profiles. Financial reports & staff editing hidden.",
  },
  {
    role: "GROOMER" as UserRole,
    title: "Senior Stylist / Groomer",
    name: "Amy Wong",
    email: "amy@doglab.com",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    description: "Grooming station view: daily appointments, haircut styles, skin condition logging, and pet warning alerts.",
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>("OWNER");
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("nimbus_current_role") as UserRole;
    if (saved && ["OWNER", "RECEPTIONIST", "GROOMER"].includes(saved)) {
      setCurrentRole(saved);
    }
  }, []);

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem("nimbus_current_role", role);
    setIsRoleModalOpen(false);
  };

  const activeProfile = ROLE_PROFILES.find((p) => p.role === currentRole) || ROLE_PROFILES[0];
  const visibleNavItems = ALL_NAV_ITEMS.filter((item) => item.roles.includes(currentRole));

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop: always visible, mobile: slide-over */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-300 md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo / Header */}
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <PawPrint className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-bold leading-none block">Nimbus</span>
              <span className="text-[10px] text-muted-foreground">Doglab Grooming</span>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Separator />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {visibleNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Active Role & Hidden Admin Switcher Footer */}
        <div className="border-t p-3 bg-muted/20">
          <div
            onClick={() => setIsRoleModalOpen(true)}
            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/60 cursor-pointer transition-colors"
            title="Click to switch role or open role permissions"
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {activeProfile.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold truncate">{activeProfile.name}</span>
                <Sliders className="h-3 w-3 text-muted-foreground shrink-0 ml-1" />
              </div>
              <Badge
                variant="outline"
                className={`text-[9px] px-1.5 py-0 mt-0.5 border ${activeProfile.badgeColor}`}
              >
                {activeProfile.role}
              </Badge>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar — mobile only */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <PawPrint className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm">Nimbus</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setIsRoleModalOpen(true)}
          >
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span>{currentRole}</span>
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>

        {/* Bottom nav — mobile only */}
        <nav className="flex h-16 items-center justify-around border-t bg-card md:hidden">
          {visibleNavItems.slice(0, 5).map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-1",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* HIDDEN ADMIN / ROLE SWITCHER MODAL */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Role & Access Control Switcher
            </DialogTitle>
            <DialogDescription>
              Test or simulate how different salon staff roles experience Nimbus.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {ROLE_PROFILES.map((profile) => {
              const isSelected = profile.role === currentRole;
              return (
                <div
                  key={profile.role}
                  onClick={() => handleRoleChange(profile.role)}
                  className={cn(
                    "p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start justify-between gap-3 bg-card",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-xs"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{profile.title}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${profile.badgeColor}`}
                      >
                        {profile.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      User: <span className="font-medium text-foreground">{profile.name}</span> ({profile.email})
                    </p>
                    <p className="text-[11px] text-muted-foreground pt-1 leading-snug">
                      {profile.description}
                    </p>
                  </div>

                  <div className="pt-0.5">
                    {isSelected ? (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-muted-foreground/40" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground border mt-2">
            <span className="font-semibold text-foreground block mb-0.5">Role Permission Breakdown:</span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li><strong className="text-foreground">Owner</strong>: All pages (Dashboard, Calendar, Appointments, Customers, Pets, Services & Pricing, Daily Reports, Staff & Salaries).</li>
              <li><strong className="text-foreground">Receptionist</strong>: Bookings, Walk-ins, Customers, Pets, Calendar.</li>
              <li><strong className="text-foreground">Groomer</strong>: Personal Station, Calendar, Appointments, Pet Grooming Profiles & Alerts.</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
