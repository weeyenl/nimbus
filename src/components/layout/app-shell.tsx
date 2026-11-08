"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  LogOut,
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
  Sliders,
  Settings,
  KeyRound,
  RefreshCw,
  MoreHorizontal,
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
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  hydrateFromCloud,
  getStaff,
  refreshFromCloudIfClean,
  retryPendingSync,
  getPendingSyncCount,
  runDailyAutoBackupIfNeeded,
} from "@/lib/mock-data";

export type UserRole = "OWNER" | "RECEPTIONIST" | "GROOMER";

interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const ALL_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard, roles: ["OWNER", "RECEPTIONIST", "GROOMER"] },
  { href: "/calendar", label: "Calendar", icon: Calendar, roles: ["OWNER", "RECEPTIONIST", "GROOMER"] },
  { href: "/appointments", label: "Appointments", shortLabel: "Appts", icon: Scissors, roles: ["OWNER", "RECEPTIONIST", "GROOMER"] },
  { href: "/customers", label: "Customers", icon: Users, roles: ["OWNER", "RECEPTIONIST"] },
  { href: "/pets", label: "Pets Directory", shortLabel: "Pets", icon: PawPrint, roles: ["OWNER", "RECEPTIONIST", "GROOMER"] },
  { href: "/services", label: "Services & Pricing", shortLabel: "Services", icon: Sparkles, roles: ["OWNER"] },
  { href: "/reports", label: "Daily Reports", shortLabel: "Reports", icon: BarChart3, roles: ["OWNER"] },
  { href: "/staff", label: "Staff & Shifts", shortLabel: "Staff", icon: UserCog, roles: ["OWNER"] },
  { href: "/settings", label: "Settings & Backups", shortLabel: "Settings", icon: Settings, roles: ["OWNER"] },
];

const ROLE_PROFILES = [
  {
    role: "OWNER" as UserRole,
    title: "Owner / Salon Manager",
    name: "Jason Lim",
    email: "owner@doglab.com",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    description:
      "Unrestricted access to all departments: pricing, staff schedules, POS, financial revenue reports, and backups.",
  },
  {
    role: "RECEPTIONIST" as UserRole,
    title: "Front Desk Receptionist",
    name: "Cindy Ong",
    email: "cindy@doglab.com",
    badgeColor: "bg-green-100 text-green-800 border-green-300",
    description:
      "Bookings, check-in, payments, walk-ins, and customer profiles. Financial reports & staff editing hidden.",
  },
  {
    role: "GROOMER" as UserRole,
    title: "Senior Stylist / Groomer",
    name: "Amy Chen",
    email: "amy@doglab.com",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    description:
      "Grooming station view: daily appointments, haircut styles, skin condition logging, and pet warning alerts.",
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>("OWNER");
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState("");
  const [displayStaffLabel, setDisplayStaffLabel] = useState("");
  const [syncError, setSyncError] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [retryingSync, setRetryingSync] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const isLoginPage = pathname === "/login";

  // Demo mode: sync remembered role & active demo PIN staff name
  useEffect(() => {
    if (isSupabaseConfigured) return;
    if (isLoginPage) return;

    if (localStorage.getItem("nimbus_pin_locked") === "1") {
      router.replace("/login");
      return;
    }

    const saved = localStorage.getItem("nimbus_current_role") as UserRole | null;
    const activeId = localStorage.getItem("nimbus_active_staff_id");
    const staffList = getStaff();
    const matched = activeId ? staffList.find((s) => s.id === activeId && s.isActive !== false) : undefined;

    if (matched) {
      setCurrentRole(matched.role);
      setDisplayStaffLabel(`${matched.name} (${matched.role})`);
      localStorage.setItem("nimbus_current_role", matched.role);
      window.dispatchEvent(new CustomEvent("nimbus-role-changed", { detail: matched.role }));
    } else if (saved && ["OWNER", "RECEPTIONIST", "GROOMER"].includes(saved)) {
      setCurrentRole(saved);
      setDisplayStaffLabel("");
    }
    setPhase("ready");
  }, [pathname, isLoginPage, router]);

  // Cloud mode: allow Staff PIN session OR Supabase Auth session, enforce PIN lock if active, then hydrate
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (isLoginPage) return;

    let cancelled = false;
    setPhase("loading");
    setLoadError("");

    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      const activeStaffId = localStorage.getItem("nimbus_active_staff_id");
      const isLocked = localStorage.getItem("nimbus_pin_locked") === "1";

      if (isLocked || (!user && !activeStaffId)) {
        localStorage.removeItem("nimbus_active_staff_id");
        router.replace("/login");
        return;
      }

      try {
        await hydrateFromCloud();
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          const rlsHint =
            !user && (msg.toLowerCase().includes("row-level security") || msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("policy"))
              ? " (RLS is enabled on Supabase tables — run the disable RLS SQL command in Supabase SQL Editor for PIN-only login, or sign in with Email & Password.)"
              : "";
          setLoadError(msg + rlsHint);
          setPhase("error");
        }
        return;
      }
      if (cancelled) return;

      const allStaff = getStaff();
      const pinStaff = activeStaffId
        ? allStaff.find((s) => s.id === activeStaffId)
        : undefined;

      if (activeStaffId && (!pinStaff || pinStaff.isActive === false)) {
        localStorage.removeItem("nimbus_active_staff_id");
        if (!user) {
          router.replace("/login");
          return;
        }
        setLoadError("This staff profile is marked inactive or was removed. Sign in with an active staff PIN.");
        setPhase("error");
        return;
      }

      const email = user?.email || "";
      const emailStaff = email
        ? allStaff.find((s) => s.email?.toLowerCase() === email.toLowerCase())
        : undefined;

      const staffMatch = pinStaff || emailStaff;
      if (staffMatch && staffMatch.isActive === false) {
        setLoadError(`Staff profile for ${staffMatch.name} is inactive. Contact the salon owner.`);
        setPhase("error");
        return;
      }

      const metaRole = (user?.user_metadata?.role || user?.app_metadata?.role) as UserRole | undefined;
      const validMetaRole =
        metaRole && ["OWNER", "RECEPTIONIST", "GROOMER"].includes(metaRole) ? metaRole : undefined;

      let resolvedRole: UserRole | undefined =
        (staffMatch?.role as UserRole | undefined) || validMetaRole;

      if (!resolvedRole) {
        const hasConfiguredOwner = allStaff.some(
          (s) =>
            s.role === "OWNER" &&
            (Boolean(s.pinHash) || (s.email && s.email.toLowerCase() !== "owner@doglab.com"))
        );
        if (hasConfiguredOwner && user) {
          setLoadError(
            `Your account (${email || "unknown"}) is not linked to an active staff profile. Ask the salon owner to add your email under Staff & Shifts.`
          );
          setPhase("error");
          return;
        }
        resolvedRole = "OWNER";
      }

      localStorage.setItem("nimbus_current_role", resolvedRole);
      if (staffMatch) {
        localStorage.setItem("nimbus_active_staff_id", staffMatch.id);
      }
      window.dispatchEvent(new CustomEvent("nimbus-role-changed", { detail: resolvedRole }));

      setDisplayStaffLabel(
        staffMatch ? `${staffMatch.name} (${staffMatch.role})` : email || "Staff Member"
      );
      setCurrentRole(resolvedRole);
      setPendingCount(getPendingSyncCount());
      setPhase("ready");

      if (resolvedRole === "OWNER") {
        runDailyAutoBackupIfNeeded();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoginPage, retryCount, router]);

  // Run daily auto-backup once ready in Demo Mode for OWNER as well
  useEffect(() => {
    if (isSupabaseConfigured || phase !== "ready" || isLoginPage) return;
    if (currentRole === "OWNER") {
      runDailyAutoBackupIfNeeded();
    }
  }, [phase, currentRole, isLoginPage]);

  // Keep Supabase auth state listener + multi-tab visibility refresh
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && !localStorage.getItem("nimbus_active_staff_id")) {
        localStorage.removeItem("nimbus_pin_locked");
        router.replace("/login");
      }
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    const updatePending = () => setPendingCount(getPendingSyncCount());
    const onSyncError = (e: Event) => {
      setSyncError((e as CustomEvent<string>).detail || "");
      updatePending();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible" && isSupabaseConfigured && !isLoginPage) {
        refreshFromCloudIfClean().then(updatePending);
      }
    };
    const onFocus = () => {
      if (isSupabaseConfigured && !isLoginPage) {
        refreshFromCloudIfClean().then(updatePending);
      }
    };

    window.addEventListener("nimbus-sync-error", onSyncError);
    window.addEventListener("nimbus-data-updated", updatePending);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("nimbus-sync-error", onSyncError);
      window.removeEventListener("nimbus-data-updated", updatePending);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [isLoginPage]);

  const handleManualSync = useCallback(async () => {
    setRetryingSync(true);
    try {
      await retryPendingSync();
      setPendingCount(getPendingSyncCount());
      if (getPendingSyncCount() === 0) setSyncError("");
    } finally {
      setRetryingSync(false);
    }
  }, []);

  const handleRoleChange = (role: UserRole) => {
    if (isSupabaseConfigured) return;
    localStorage.removeItem("nimbus_active_staff_id");
    localStorage.setItem("nimbus_current_role", role);
    setCurrentRole(role);
    setDisplayStaffLabel("");
    window.dispatchEvent(new CustomEvent("nimbus-role-changed", { detail: role }));
    setIsRoleModalOpen(false);
  };

  const handleLockForPinSwitch = () => {
    localStorage.setItem("nimbus_pin_locked", "1");
    localStorage.removeItem("nimbus_active_staff_id");
    setSidebarOpen(false);
    router.replace("/login");
  };

  const handleSignOut = async () => {
    setSidebarOpen(false);
    localStorage.removeItem("nimbus_current_role");
    localStorage.removeItem("nimbus_active_staff_id");
    localStorage.removeItem("nimbus_pin_locked");
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    router.replace("/login");
  };

  const activeProfile = ROLE_PROFILES.find((p) => p.role === currentRole) || ROLE_PROFILES[0];
  const displayName = displayStaffLabel || activeProfile.name;
  const visibleNavItems = ALL_NAV_ITEMS.filter((item) => item.roles.includes(currentRole));
  const routeRule = ALL_NAV_ITEMS.find((i) => i.href !== "/" && pathname.startsWith(i.href));
  const routeAllowed = !routeRule || routeRule.roles.includes(currentRole);

  if (isLoginPage) return <>{children}</>;

  if (phase !== "ready") {
    return (
      <div className="flex h-dvh items-center justify-center p-6 text-center">
        {phase === "error" ? (
          <div className="max-w-md space-y-3 rounded-xl border bg-card p-6 shadow-sm">
            <p className="font-semibold text-destructive">Access / Connection Issue</p>
            <p className="text-sm text-muted-foreground break-words">{loadError}</p>
            {isSupabaseConfigured && (
              <p className="text-xs text-muted-foreground">
                If setting up a new database, run <code>supabase/schema.sql</code> in the Supabase SQL Editor.
              </p>
            )}
            <div className="flex justify-center gap-2 pt-2">
              <Button onClick={() => setRetryCount((n) => n + 1)}>Retry</Button>
              <Button variant="outline" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Loading Nimbus…</p>
        )}
      </div>
    );
  }

  const bottomBarItems = visibleNavItems.length > 4 ? visibleNavItems.slice(0, 4) : visibleNavItems;
  const hasMoreDrawer = visibleNavItems.length > 4;

  return (
    <div className="app-shell-root flex h-dvh overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="no-print fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop: always visible, mobile: slide-over */}
      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-300 md:static md:translate-x-0",
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
            aria-label="Close navigation menu"
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

        {/* Active Role, PIN Lock & Sign Out Footer */}
        <div className="border-t p-3 bg-muted/20 space-y-1.5">
          <div
            onClick={() => !isSupabaseConfigured && setIsRoleModalOpen(true)}
            className={cn(
              "flex items-center gap-2.5 p-2 rounded-lg transition-colors",
              !isSupabaseConfigured && "hover:bg-muted/60 cursor-pointer"
            )}
            title={
              isSupabaseConfigured
                ? displayName
                : "Click to switch simulated role or open role permissions"
            }
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold truncate">{displayName}</span>
                {!isSupabaseConfigured && (
                  <Sliders className="h-3 w-3 text-muted-foreground shrink-0 ml-1" />
                )}
              </div>
              <Badge
                variant="outline"
                className={`text-[9px] px-1.5 py-0 mt-0.5 border ${activeProfile.badgeColor}`}
              >
                {activeProfile.role}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-xs h-8"
              onClick={handleLockForPinSwitch}
            >
              <KeyRound className="h-3.5 w-3.5" /> Switch Staff (PIN)
            </Button>

            {isSupabaseConfigured ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-xs h-8 text-muted-foreground hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </Button>
            ) : (
              <p className="px-2 text-[10px] text-amber-700">
                Demo mode — browser local storage
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="app-shell-main flex flex-1 flex-col overflow-hidden">
        {(syncError || pendingCount > 0) && isSupabaseConfigured && (
          <div className="no-print flex items-center justify-between gap-3 bg-destructive px-4 py-2 text-xs text-destructive-foreground">
            <span className="flex-1">
              {pendingCount > 0
                ? `${pendingCount} queued change(s) pending cloud sync${syncError ? ` (${syncError})` : ""}.`
                : `Cloud sync notice: ${syncError}`}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-6 text-[11px] px-2 gap-1"
                onClick={handleManualSync}
                disabled={retryingSync}
              >
                <RefreshCw className={cn("h-3 w-3", retryingSync && "animate-spin")} />
                {retryingSync ? "Syncing..." : "Retry Sync"}
              </Button>
              {syncError && (
                <button
                  type="button"
                  onClick={() => setSyncError("")}
                  aria-label="Dismiss"
                  className="p-0.5 hover:opacity-80"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Top bar — mobile only */}
        <header className="no-print flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
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

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleLockForPinSwitch}
              title="Switch Staff (PIN)"
              aria-label="Switch Staff (PIN)"
            >
              <KeyRound className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => !isSupabaseConfigured && setIsRoleModalOpen(true)}
            >
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>{currentRole}</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
            {routeAllowed ? (
              children
            ) : (
              <div className="py-16 text-center space-y-2">
                <p className="text-sm font-medium">Access Restricted</p>
                <p className="text-xs text-muted-foreground">
                  Your role ({currentRole}) does not have permission to view this page.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href="/">Return to Dashboard</Link>
                </Button>
              </div>
            )}
          </div>
        </main>

        {/* Bottom nav — mobile only */}
        <nav className="no-print flex h-16 items-center justify-around border-t bg-card md:hidden">
          {bottomBarItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-1",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">
                  {item.shortLabel || item.label}
                </span>
              </Link>
            );
          })}
          {hasMoreDrawer && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center gap-1 px-2 py-1 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          )}
        </nav>
      </div>

      {/* DEMO MODE ROLE SWITCHER MODAL */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Role & Access Control Switcher
            </DialogTitle>
            <DialogDescription>
              Preview how different salon staff roles experience Nimbus in Demo Mode.
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
              <li>
                <strong className="text-foreground">Owner</strong>: All pages including Services &amp; Pricing, Daily Reports, Staff &amp; Shifts, and Settings &amp; Backups.
              </li>
              <li>
                <strong className="text-foreground">Receptionist</strong>: Bookings, Walk-ins, Customers, Pets, POS Checkout, Calendar.
              </li>
              <li>
                <strong className="text-foreground">Groomer</strong>: Personal Station, Calendar, Appointments, Grooming Notes &amp; Pet Warnings.
              </li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
