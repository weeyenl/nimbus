"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PawPrint, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(isSupabaseConfigured ? "" : "owner@doglab.com");
  const [password, setPassword] = useState(isSupabaseConfigured ? "" : "demo");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already signed in? Skip the form.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router]);

  function handleLogin(role: string, roleEmail: string) {
    // Demo mode only (the quick-login buttons are hidden once Supabase is connected)
    localStorage.setItem("nimbus_current_role", role);
    setEmail(roleEmail);
    router.push("/");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      router.push("/");
      return;
    }
    setError("");
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.push("/");
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <PawPrint className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold">Sign in to Nimbus</CardTitle>
          <CardDescription>
            Doglab Grooming Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
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
                <span className="text-xs text-muted-foreground hover:underline cursor-pointer">
                  Forgot password?
                </span>
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

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"} <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Quick Demo Logins — demo mode only */}
          {!isSupabaseConfigured && (
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 font-medium">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Prototype Quick-Login Roles:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs flex flex-col h-auto py-2"
                onClick={() => handleLogin("OWNER", "owner@doglab.com")}
              >
                <span className="font-semibold">Owner</span>
                <span className="text-[10px] text-muted-foreground">All access</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs flex flex-col h-auto py-2"
                onClick={() => handleLogin("RECEPTIONIST", "cindy@doglab.com")}
              >
                <span className="font-semibold">Reception</span>
                <span className="text-[10px] text-muted-foreground">Bookings</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs flex flex-col h-auto py-2"
                onClick={() => handleLogin("GROOMER", "amy@doglab.com")}
              >
                <span className="font-semibold">Groomer</span>
                <span className="text-[10px] text-muted-foreground">My schedule</span>
              </Button>
            </div>
          </div>
          )}
        </CardContent>
        <CardFooter className="justify-center border-t py-3">
          <p className="text-xs text-muted-foreground">
            {isSupabaseConfigured
              ? "Accounts are created by the salon owner in Supabase"
              : "Demo mode — Supabase not connected"}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
