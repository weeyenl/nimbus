"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PawPrint,
  Lock,
  Mail,
  ArrowRight,
  KeyRound,
  Delete,
  AlertTriangle,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { hashStaffPin } from "@/lib/utils";
import {
  newId,
  getStaff,
  MockStaff,
  verifyStaffPin,
  staffHasPin,
} from "@/lib/mock-data";

export default function LoginPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<"pin" | "email">("pin");

  // PIN login state
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [staffMembers, setStaffMembers] = useState<MockStaff[]>([]);
  const [pinLoading, setPinLoading] = useState(false);
  const [cloudLoaded, setCloudLoaded] = useState(!isSupabaseConfigured);
  const [cloudError, setCloudError] = useState("");

  // First-time Owner setup when cloud staff table is completely empty
  const [setupName, setSetupName] = useState("Owner");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPin, setSetupPin] = useState("");
  const [setupError, setSetupError] = useState("");
  const [setupSaving, setSetupSaving] = useState(false);

  // Email login state (optional if Email & Password is used)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStaffMembers(getStaff());
      setCloudLoaded(true);
      return;
    }

    let cancelled = false;

    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const hasSession = Boolean(sessionData.session);
      const isLocked = localStorage.getItem("nimbus_pin_locked") === "1";
      const activeStaffId = localStorage.getItem("nimbus_active_staff_id");

      if (!isLocked && (hasSession || activeStaffId)) {
        router.replace("/");
        return;
      }

      const { data: rows, error } = await supabase.from("staff").select("id,data");
      if (cancelled) return;

      if (error) {
        setCloudError(error.message);
        setCloudLoaded(true);
        return;
      }

      setCloudError("");
      const cloudStaff = (rows || []).map((r: { data: unknown }) => r.data as MockStaff);
      setStaffMembers(cloudStaff);
      localStorage.setItem("nimbus_staff", JSON.stringify(cloudStaff));
      setCloudLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handlePinDigit = useCallback((digit: string) => {
    setPin((prev) => (prev.length < 6 ? prev + digit : prev));
    setPinError("");
  }, []);

  const handlePinBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setPinError("");
  }, []);

  const handlePinClear = useCallback(() => {
    setPin("");
    setPinError("");
  }, []);

  const handlePinSubmit = useCallback(() => {
    if (pin.length < 4) {
      setPinError("Please enter at least 4 digits.");
      return;
    }

    setPinLoading(true);
    const staffList = staffMembers.length > 0 ? staffMembers : getStaff();

    const matched = staffList.find(
      (s) => s.isActive !== false && verifyStaffPin(s, pin)
    );

    if (matched) {
      localStorage.removeItem("nimbus_pin_locked");
      localStorage.setItem("nimbus_active_staff_id", matched.id);
      localStorage.setItem("nimbus_current_role", matched.role);
      router.push("/");
    } else {
      setPinLoading(false);
      setPinError("Invalid Staff PIN or inactive account.");
    }
  }, [pin, staffMembers, router]);

  // Allow typing digits directly on keyboard when Staff PIN keypad is shown
  const showEmptyOwnerSetup =
    isSupabaseConfigured && cloudLoaded && !cloudError && staffMembers.length === 0;

  useEffect(() => {
    if (authMethod !== "pin" || showEmptyOwnerSetup || !cloudLoaded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handlePinDigit(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handlePinBackspace();
      } else if (e.key === "Enter" && pin.length >= 4 && !pinLoading) {
        e.preventDefault();
        handlePinSubmit();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    authMethod,
    showEmptyOwnerSetup,
    cloudLoaded,
    pin.length,
    pinLoading,
    handlePinDigit,
    handlePinBackspace,
    handlePinSubmit,
  ]);

  const handleCreateInitialOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = setupName.trim();
    const cleanPin = setupPin.trim();
    if (!cleanName) {
      setSetupError("Enter an owner name.");
      return;
    }
    if (cleanPin.length < 4 || cleanPin.length > 6) {
      setSetupError("PIN must be 4 to 6 digits.");
      return;
    }

    setSetupSaving(true);
    setSetupError("");
    const id = newId("g");
    const ownerProfile: MockStaff = {
      id,
      name: cleanName,
      role: "OWNER",
      phone: "",
      email: setupEmail.trim(),
      pinHash: hashStaffPin(id, cleanPin),
      isActive: true,
      schedule: {
        Mon: "09:00-18:00",
        Tue: "09:00-18:00",
        Wed: "09:00-18:00",
        Thu: "09:00-18:00",
        Fri: "09:00-18:00",
        Sat: "09:00-18:00",
        Sun: "OFF",
      },
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from("staff")
        .upsert([{ id: ownerProfile.id, data: ownerProfile }]);
      if (error) {
        setCloudError(error.message);
        setSetupSaving(false);
        return;
      }
    }

    const nextStaff = [ownerProfile];
    localStorage.setItem("nimbus_staff", JSON.stringify(nextStaff));
    localStorage.removeItem("nimbus_pin_locked");
    localStorage.setItem("nimbus_active_staff_id", ownerProfile.id);
    localStorage.setItem("nimbus_current_role", ownerProfile.role);
    router.push("/");
  };

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      localStorage.removeItem("nimbus_pin_locked");
      router.push("/");
      return;
    }
    setEmailError("");
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (authError) {
      setEmailError(authError.message);
      return;
    }
    localStorage.removeItem("nimbus_active_staff_id");
    localStorage.removeItem("nimbus_pin_locked");
    router.push("/");
  }

  const activeStaffWithPin = staffMembers.filter(
    (s) => s.isActive !== false && staffHasPin(s)
  );

  return (
    <div className="flex min-h-[90vh] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="text-center space-y-1.5 pb-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <PawPrint className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome to Nimbus</CardTitle>
          <CardDescription>Doglab Grooming Management System</CardDescription>

          <div className="pt-2">
            <Tabs
              value={authMethod}
              onValueChange={(v) => setAuthMethod(v as "pin" | "email")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pin" className="gap-1.5 text-xs font-semibold">
                  <KeyRound className="h-3.5 w-3.5" /> Staff PIN Pad
                </TabsTrigger>
                <TabsTrigger value="email" className="gap-1.5 text-xs font-semibold">
                  <Mail className="h-3.5 w-3.5" /> Email &amp; Password
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {authMethod === "pin" ? (
            <div className="space-y-4">
              {isSupabaseConfigured && !cloudLoaded && (
                <p className="text-center text-xs text-muted-foreground py-6">
                  Checking staff database…
                </p>
              )}

              {isSupabaseConfigured && cloudLoaded && cloudError && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
                  <div className="space-y-1">
                    <p className="font-semibold">Could not read staff table from Supabase</p>
                    <p className="text-amber-900">
                      {cloudError} — If RLS is enabled on Supabase, run the disable RLS SQL command in the SQL Editor, or sign in via the <strong>Email &amp; Password</strong> tab.
                    </p>
                  </div>
                </div>
              )}

              {showEmptyOwnerSetup ? (
                <form onSubmit={handleCreateInitialOwner} className="space-y-3 pt-1">
                  <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                    Database is empty. Create your first <strong>Owner</strong> account &amp; PIN to get started.
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="setupName">Owner Name *</Label>
                    <Input
                      id="setupName"
                      value={setupName}
                      onChange={(e) => setSetupName(e.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="setupPin">PIN (4–6 Digits) *</Label>
                    <Input
                      id="setupPin"
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={setupPin}
                      onChange={(e) => {
                        setSetupPin(e.target.value.replace(/\D/g, ""));
                        setSetupError("");
                      }}
                      placeholder="e.g. 1234"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="setupEmail">Email (Optional)</Label>
                    <Input
                      id="setupEmail"
                      type="email"
                      value={setupEmail}
                      onChange={(e) => setSetupEmail(e.target.value)}
                      placeholder="owner@yoursalon.com"
                    />
                  </div>

                  {setupError && <p className="text-xs font-medium text-destructive">{setupError}</p>}

                  <Button type="submit" className="w-full gap-2" disabled={setupSaving}>
                    <UserPlus className="h-4 w-4" />
                    {setupSaving ? "Creating Owner…" : "Create Owner & Sign In"}
                  </Button>
                </form>
              ) : (
                cloudLoaded && (
                  <>
                    {isSupabaseConfigured && !cloudError && staffMembers.length > 0 && activeStaffWithPin.length === 0 && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-950">
                        Staff profiles exist in the database, but none have a PIN configured yet. Sign in with <strong>Email &amp; Password</strong> and assign PINs under <strong>Staff &amp; Shifts</strong>.
                      </div>
                    )}

                    {/* PIN Display Dots */}
                    <div className="text-center space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Enter 4–6 Digit Staff PIN
                      </Label>
                      <div className="flex justify-center items-center gap-2.5 h-10">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-4 w-4 rounded-full border-2 transition-all ${
                              pin.length > i
                                ? "bg-primary border-primary scale-110 shadow-xs"
                                : "border-muted-foreground/30 bg-muted/20"
                            }`}
                          />
                        ))}
                      </div>
                      {pinError && (
                        <p className="text-xs font-medium text-destructive pt-0.5">{pinError}</p>
                      )}
                    </div>

                    {/* Numeric Keypad */}
                    <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto pt-1">
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                        <Button
                          key={num}
                          type="button"
                          variant="outline"
                          className="h-14 text-xl font-bold rounded-xl hover:bg-primary/10 active:scale-95 transition-all"
                          onClick={() => handlePinDigit(num)}
                        >
                          {num}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-14 text-xs font-semibold rounded-xl text-muted-foreground"
                        onClick={handlePinClear}
                      >
                        Clear
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-14 text-xl font-bold rounded-xl hover:bg-primary/10 active:scale-95 transition-all"
                        onClick={() => handlePinDigit("0")}
                      >
                        0
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-14 rounded-xl text-muted-foreground"
                        onClick={handlePinBackspace}
                        disabled={pin.length === 0}
                        aria-label="Backspace"
                      >
                        <Delete className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Submit PIN button */}
                    <div className="max-w-[280px] mx-auto pt-2">
                      <Button
                        type="button"
                        className="w-full h-11 text-sm font-semibold gap-2 rounded-xl"
                        onClick={handlePinSubmit}
                        disabled={pin.length < 4 || pinLoading}
                      >
                        {pinLoading ? "Signing in..." : "Unlock with PIN"}{" "}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {!isSupabaseConfigured && (
                      <div className="rounded-lg bg-muted/40 border p-2.5 text-[11px] text-muted-foreground text-center">
                        <span className="font-semibold text-foreground block mb-0.5">
                          Demo PINs (local preview):
                        </span>
                        Owner: <code>0000</code> · Amy (Groomer): <code>1111</code> · Ben
                        (Groomer): <code>2222</code> · Cindy (Front Desk): <code>3333</code>
                      </div>
                    )}
                  </>
                )
              )}
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-4 pt-1">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="owner@yoursalon.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required={isSupabaseConfigured}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required={isSupabaseConfigured}
                  />
                </div>
              </div>

              {emailError && <p className="text-sm text-destructive">{emailError}</p>}
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? "Signing in…" : "Sign In with Email"}{" "}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="justify-center border-t py-3">
          <p className="text-xs text-muted-foreground">
            {isSupabaseConfigured
              ? "Cloud-synced station · Staff PIN login"
              : "Demo mode · Fast tablet PIN pad or instant preview"}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
