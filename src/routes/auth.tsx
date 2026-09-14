import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wordmark } from "@/components/koupl/ui";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useApp } from "@/lib/koupl/store";
import { postAuthTarget } from "@/lib/koupl/coupleRoom";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Koupl" },
      {
        name: "description",
        content:
          "Sign in to Koupl to connect with your partner across two phones and keep your game history.",
      },
      { property: "og:title", content: "Sign in — Koupl" },
      {
        property: "og:description",
        content: "Create a Koupl account to play from two phones.",
      },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const { session, guest } = useApp();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(guest?.name ?? "");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (session) void navigate({ to: postAuthTarget() });
  }, [session, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name.trim() || email.split("@")[0], avatar: guest?.avatar ?? "🦊" },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          return;
        }
        toast.success("Account created");
        void navigate({ to: postAuthTarget() });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        void navigate({ to: postAuthTarget() });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        // Always a full, same-origin public URL: works in the browser and inside
        // the Android WebView, which keeps the whole OAuth round-trip on one origin.
        redirect_uri: `${window.location.origin}/auth/callback`,
      });
      if (result.error) {
        toast.error(result.error.message || "Google sign-in failed. Try email instead.");
        return;
      }
      if (result.redirected) return;
      void navigate({ to: postAuthTarget() });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed. Try email instead.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="text-5xl" aria-hidden>
          📬
        </span>
        <h1 className="font-display text-2xl font-bold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to {email}. Open it to finish creating your account.
        </p>
        <Button variant="ghost" className="mt-2 h-12 rounded-2xl" onClick={() => setSent(false)}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-6">
        <div className="mb-8 flex items-center gap-3">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => void navigate({ to: "/" })}
            className="press flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <Wordmark />
        </div>

        <h1 className="font-display text-3xl font-bold">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An account lets you and your partner play from two phones and keeps your history safe.
        </p>

        <form onSubmit={submit} className="mt-6 grid gap-4">
          {mode === "signup" ? (
            <div className="grid gap-2">
              <Label htmlFor="dn" className="text-sm font-bold">
                Display name
              </Label>
              <Input
                id="dn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sam"
                className="h-14 rounded-2xl text-base"
              />
            </div>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-bold">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 rounded-2xl text-base"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pw" className="text-sm font-bold">
              Password
            </Label>
            <Input
              id="pw"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 rounded-2xl text-base"
            />
          </div>
          <Button type="submit" size="lg" className="h-14 rounded-2xl text-base" disabled={busy}>
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs font-bold text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="h-14 rounded-2xl text-base"
          onClick={() => void google()}
        >
          Continue with Google
        </Button>

        <button
          type="button"
          className="mt-6 min-h-11 text-sm font-bold text-primary"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
        >
          {mode === "signup" ? "I already have an account" : "I need an account"}
        </button>

        <button
          type="button"
          className="mt-auto min-h-11 pt-8 text-sm font-bold text-muted-foreground"
          onClick={() => void navigate({ to: "/" })}
        >
          Keep playing as a guest
        </button>
      </div>
    </div>
  );
}
