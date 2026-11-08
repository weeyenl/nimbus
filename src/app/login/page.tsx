"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PawPrint, Lock, Mail, ArrowRight, KeyRound, Delete, Info } from "lucide-react";
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
import { getStaff, MockStaff, verifyStaffPin, staffHasPin } from "@/lib/mock-data";

export default function LoginPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<"pin" | "email">(
    isSupabaseConfigured ? "email" : "pin"
  );
  const [hasCloudSession, setHasCloudSession] = useState(false);

  // PIN login state
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [staffMembers, setStaffMembers] = useState<MockStaff[]>([]);
  const [pinLoading, setPinLoading] = useState(false);

  // Email login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const localList = getStaff();
    setStaffMembers(localList);

    if (!isSupabaseConfigured) {
      setAuthMethod("pin");
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      const hasSession = Boolean(data.session);
      setHasCloudSession(hasSession);

      if (hasSession) {
        const isLocked = localStorage.getItem("nimbus_pin_locked") === "1";
        // Fetch fresh staff hashes while authenticated
        supabase
          .from("staff")
          .select("id,data")
          .then(({ data: rows, error }) => {
            if (!error && rows && rows.length > 0) {
              const cloudStaff = rows.map((r: { data: unknown }) => r.data as MockStaff);
              setStaffMembers(cloudStaff);
              localStorage.setItem("nimbus_staff", JSON.stringify(cloudStaff));
            }
          });

        if (isLocked) {
          setAuthMethod("pin");
        } else {
          router.replace("/");
        }
      } else {
        setAuthMethod("email");
      }
    });
  }, [router]);

  const handlePinDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setPinError("");
    }
  };

  const handlePinBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setPinError("");
  };

  const handlePinClear = () => {
    setPin("");
    setPinError("");
  };

  const handlePinSubmit = () => {
    if (isSupabaseConfigured && !hasCloudSession) {
      setPinError("Connect this tablet via Email & Password first before using Staff PIN.");
      return;
    }
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
              {isSupabaseConfigured && !hasCloudSession && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
                  <div>
                    <p className="font-semibold">Device not connected to cloud yet</p>
                    <p className="mt-0.5 text-amber-800">
                      Sign in once with <strong>Email &amp; Password</strong> to connect this station, then staff can fast-switch using their PIN.
                    </p>
                  </div>
                </div>
              )}

              {isSupabaseConfigured && hasCloudSession && activeStaffWithPin.length === 0 && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                  No staff PINs have been set yet. Ask the salon owner to assign 4–6 digit PINs under <strong>Staff &amp; Shifts</strong>.
                </div>
              )}

              {/* PIN Display Dots */}
              <div className="text-center space-y-2">
                <Label className="text-xs text-muted-foreground">Enter 4–6 Digit Staff PIN</Label>
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
                    disabled={isSupabaseConfigured && !hasCloudSession}
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  className="h-14 text-xs font-semibold rounded-xl text-muted-foreground"
                  onClick={handlePinClear}
                  disabled={isSupabaseConfigured && !hasCloudSession}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 text-xl font-bold rounded-xl hover:bg-primary/10 active:scale-95 transition-all"
                  onClick={() => handlePinDigit("0")}
                  disabled={isSupabaseConfigured && !hasCloudSession}
                >
                  0
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-14 rounded-xl text-muted-foreground"
                  onClick={handlePinBackspace}
                  disabled={pin.length === 0 || (isSupabaseConfigured && !hasCloudSession)}
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
                  disabled={
                    pin.length < 4 ||
                    pinLoading ||
                    (isSupabaseConfigured && !hasCloudSession)
                  }
                >
                  {pinLoading ? "Signing in..." : "Unlock with PIN"}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Show demo PIN hints ONLY in unconfigured demo mode */}
              {!isSupabaseConfigured && (
                <div className="rounded-lg bg-muted/40 border p-2.5 text-[11px] text-muted-foreground text-center">
                  <span className="font-semibold text-foreground block mb-0.5">
                    Demo PINs (local preview):
                  </span>
                  Owner: <code>0000</code> · Amy (Groomer): <code>1111</code> · Ben (Groomer):{" "}
                  <code>2222</code> · Cindy (Front Desk): <code>3333</code>
                </div>
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
                    placeholder="owner@doglab.com"
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
              ? "Cloud-synced station · Fast staff PIN switching enabled after login"
              : "Demo mode · Fast tablet PIN pad or instant preview"}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
