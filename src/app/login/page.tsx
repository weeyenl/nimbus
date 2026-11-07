"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PawPrint, Lock, Mail, ArrowRight, KeyRound, Delete, Check } from "lucide-react";
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
import { getStaff, MockStaff } from "@/lib/mock-data";

export default function LoginPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<"pin" | "email">("pin");

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
    // 1. Initial staff from local storage
    const localList = getStaff();
    setStaffMembers(localList);

    // 2. Fetch latest staff from Supabase (to guarantee custom PINs are up to date)
    if (isSupabaseConfigured) {
      supabase
        .from("staff")
        .select("id,data")
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const cloudStaff = data.map((r: any) => r.data as MockStaff);
            setStaffMembers(cloudStaff);
            localStorage.setItem("nimbus_staff", JSON.stringify(cloudStaff));
          }
        });

      supabase.auth.getSession().then(({ data }) => {
        if (data.session) router.replace("/");
      });
    }
  }, [router]);

  // Handle PIN button click
  const handlePinDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
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
    if (pin.length < 4) {
      setPinError("Please enter at least 4 digits");
      return;
    }

    setPinLoading(true);
    const staffList = staffMembers.length > 0 ? staffMembers : getStaff();
    const matched = staffList.find((s) => s.pin === pin && s.isActive !== false);

    if (matched) {
      localStorage.setItem("nimbus_active_staff_id", matched.id);
      localStorage.setItem("nimbus_current_role", matched.role);
      router.push("/");
    } else {
      setPinLoading(false);
      setPinError("Invalid Staff PIN code");
    }
  };

  // Handle standard email + password login
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
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
    router.push("/");
  }

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
            <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pin" className="gap-1.5 text-xs font-semibold">
                  <KeyRound className="h-3.5 w-3.5" /> Staff PIN Pad
                </TabsTrigger>
                <TabsTrigger value="email" className="gap-1.5 text-xs font-semibold">
                  <Mail className="h-3.5 w-3.5" /> Email & Password
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {authMethod === "pin" ? (
            <div className="space-y-4">
              {/* PIN Display Dots */}
              <div className="text-center space-y-2">
                <Label className="text-xs text-muted-foreground">Enter 4-6 Digit Staff PIN</Label>
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
                {pinError && <p className="text-xs font-medium text-destructive pt-0.5">{pinError}</p>}
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
                >
                  <Delete className="h-5 w-5" />
                </Button>
              </div>

              {/* Explicit Login / OK button */}
              <div className="max-w-[280px] mx-auto pt-2">
                <Button
                  type="button"
                  className="w-full h-11 text-sm font-semibold gap-2 rounded-xl"
                  onClick={handlePinSubmit}
                  disabled={pin.length < 4 || pinLoading}
                >
                  {pinLoading ? "Signing in..." : "Login with PIN"} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
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
                    required
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
                    required
                  />
                </div>
              </div>

              {emailError && <p className="text-sm text-destructive">{emailError}</p>}
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? "Signing in…" : "Sign In with Email"} <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="justify-center border-t py-3">
          <p className="text-xs text-muted-foreground">
            Fast tablet PIN pad or administrative email sign-in
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
