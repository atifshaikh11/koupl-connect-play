import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Gamepad2, Share2, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useApp } from "@/lib/koupl/store";

const KEY = "koupl.room-onboarding.v1";
const STEPS = [
  { icon: UsersRound, title: "One Couple Room", body: "Create a room or join your partner's room once. It stays with you across every game." },
  { icon: Share2, title: "Invite your partner", body: "Share the private invite link, or tell them the short room code as a fallback." },
  { icon: Gamepad2, title: "Choose and play", body: "Pick any game together. Switch games anytime and come straight back to your Couple Room." },
] as const;

export function RoomOnboarding() {
  const app = useApp();
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);
  // A tapped invitation is a one-tap flow: never cover it with the guide.
  const onInvite = useRouterState({
    select: (s) => s.location.pathname.startsWith("/i/"),
  });
  useEffect(() => {
    if (!app.hydrated || !app.onboarded || onInvite) return;
    try { setOpen(window.localStorage.getItem(KEY) !== "done"); } catch { setOpen(true); }
  }, [app.hydrated, app.onboarded, onInvite]);
  const finish = () => {
    try { window.localStorage.setItem(KEY, "done"); } catch { /* unavailable */ }
    setOpen(false);
  };
  const item = STEPS[step]!;
  const Icon = item.icon;
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) finish(); }}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-[2rem] p-5">
        <DialogTitle className="sr-only">Welcome to Couple Room</DialogTitle>
        <DialogDescription className="sr-only">A three-step guide to playing together.</DialogDescription>
        <div className="pt-4 text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-primary/12 text-primary"><Icon className="h-9 w-9" /></span>
          <p className="mt-5 text-xs font-bold uppercase tracking-[.18em] text-primary">Step {step + 1} of 3</p>
          <h2 className="font-display mt-2 text-2xl font-bold">{item.title}</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          <div className="mt-6 flex justify-center gap-2" aria-hidden>{STEPS.map((_, i) => <span key={i} className={`h-2 rounded-full transition-all ${i === step ? "w-7 bg-primary" : "w-2 bg-muted"}`} />)}</div>
          <Button className="mt-6 h-14 w-full rounded-2xl" onClick={() => step === 2 ? finish() : setStep((value) => value + 1)}>{step === 2 ? "Let's play" : "Next"}</Button>
          <button type="button" className="mt-3 min-h-11 px-4 text-sm font-bold text-muted-foreground" onClick={finish}>Skip guide</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}