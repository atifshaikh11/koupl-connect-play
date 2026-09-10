import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarBubble, LoadingScreen, Wordmark } from "@/components/koupl/ui";
import { AVATARS, RELATIONSHIP_OPTIONS } from "@/lib/koupl/games";
import { useApp } from "@/lib/koupl/store";
import { cn } from "@/lib/utils";
import type { RelationshipStatus } from "@/lib/koupl/types";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Get started — Koupl" },
      {
        name: "description",
        content:
          "Create your Koupl profile, pick an avatar and connect your partner with a short code.",
      },
      { property: "og:title", content: "Get started — Koupl" },
      {
        property: "og:description",
        content: "Set up your couple profile and start playing in under a minute.",
      },
    ],
  }),
  component: Welcome,
});

const STEPS = ["Welcome", "You", "Us", "Partner"] as const;

function Welcome() {
  const navigate = useNavigate();
  const { hydrated, saveGuest, startDemo, inviteCode, session } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]!);
  const [relationship, setRelationship] = useState<RelationshipStatus>("dating");
  const [partnerName, setPartnerName] = useState("");
  const [partnerAvatar, setPartnerAvatar] = useState(AVATARS[2]!);

  if (!hydrated) return <LoadingScreen />;

  function finish() {
    saveGuest({
      name: name.trim() || "You",
      avatar,
      relationship,
      partnerName: partnerName.trim(),
      partnerAvatar,
    });
    toast.success("You're all set. Have fun.");
    void navigate({ to: "/" });
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <Wordmark />
          <div className="flex gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === step ? "w-6 bg-primary" : "w-2 bg-muted",
                )}
              />
            ))}
          </div>
        </div>

        {step === 0 ? (
          <div className="animate-rise flex flex-1 flex-col justify-center text-center">
            <div className="flex justify-center gap-2">
              <span className="animate-float text-6xl" aria-hidden>
                💞
              </span>
            </div>
            <h1 className="font-display mt-6 text-4xl font-bold leading-tight text-balance-tight">
              Two people.
              <br />
              One phone. Or two.
            </h1>
            <p className="mt-4 text-base text-muted-foreground text-balance-tight">
              Koupl is a small pile of games built for couples — confessions, quizzes, deep
              questions and the occasional basketball rivalry.
            </p>
            <div className="mt-8 grid gap-2">
              <Button
                size="lg"
                className="h-14 rounded-2xl text-base"
                onClick={() => setStep(1)}
              >
                Get started <ArrowRight className="ml-1 h-5 w-5" aria-hidden />
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="h-14 rounded-2xl text-base font-bold"
                onClick={() => {
                  startDemo();
                  toast.success("Demo loaded — you're Sam, playing with Alex");
                  void navigate({ to: "/" });
                }}
              >
                Try the demo — no account
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="h-12 rounded-2xl text-base"
                onClick={() => void navigate({ to: "/auth" })}
              >
                I already have an account
              </Button>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="animate-rise flex flex-1 flex-col">
            <h1 className="font-display text-3xl font-bold">What should we call you?</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This is what your partner sees during games.
            </p>

            <div className="mt-6 space-y-2">
              <Label htmlFor="name" className="text-sm font-bold">
                Display name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sam"
                autoComplete="nickname"
                className="h-14 rounded-2xl text-base"
              />
            </div>

            <p className="mt-6 text-sm font-bold">Pick an avatar</p>
            <div className="mt-3 grid grid-cols-4 gap-3">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-label={`Avatar ${a}`}
                  aria-pressed={avatar === a}
                  onClick={() => setAvatar(a)}
                  className={cn(
                    "press flex h-16 items-center justify-center rounded-2xl border-2 bg-card text-3xl",
                    avatar === a ? "border-primary bg-primary/10" : "border-border",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>

            <div className="mt-auto grid gap-2 pt-8">
              <Button
                size="lg"
                className="h-14 rounded-2xl text-base"
                disabled={!name.trim()}
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
              <Button variant="ghost" className="h-11 rounded-2xl" onClick={() => setStep(0)}>
                Back
              </Button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="animate-rise flex flex-1 flex-col">
            <h1 className="font-display text-3xl font-bold">Where are you two at?</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We use this to pick the right tone. You can change it later.
            </p>

            <div className="mt-6 grid gap-3">
              {RELATIONSHIP_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={relationship === o.value}
                  onClick={() => setRelationship(o.value as RelationshipStatus)}
                  className={cn(
                    "press flex min-h-14 items-center gap-3 rounded-2xl border-2 bg-card px-4 text-left text-base font-bold",
                    relationship === o.value ? "border-primary bg-primary/10" : "border-border",
                  )}
                >
                  <span className="text-2xl" aria-hidden>
                    {o.emoji}
                  </span>
                  {o.label}
                  {relationship === o.value ? (
                    <Check className="ml-auto h-5 w-5 text-primary" aria-hidden />
                  ) : null}
                </button>
              ))}
            </div>

            <div className="mt-auto grid gap-2 pt-8">
              <Button size="lg" className="h-14 rounded-2xl text-base" onClick={() => setStep(3)}>
                Continue
              </Button>
              <Button variant="ghost" className="h-11 rounded-2xl" onClick={() => setStep(1)}>
                Back
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="animate-rise flex flex-1 flex-col">
            <h1 className="font-display text-3xl font-bold">Add your partner</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Playing on one phone? Just enter their name. Want to play from two phones? Create
              an account and share your code.
            </p>

            <div className="mt-6 space-y-2">
              <Label htmlFor="pname" className="text-sm font-bold">
                Partner's name
              </Label>
              <Input
                id="pname"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="e.g. Alex"
                className="h-14 rounded-2xl text-base"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {AVATARS.slice(0, 8).map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-label={`Partner avatar ${a}`}
                  aria-pressed={partnerAvatar === a}
                  onClick={() => setPartnerAvatar(a)}
                  className={cn(
                    "press flex h-12 w-12 items-center justify-center rounded-full border-2 bg-card text-2xl",
                    partnerAvatar === a ? "border-primary bg-primary/10" : "border-border",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>

            <div className="surface mt-6 flex items-center gap-3 p-4">
              <AvatarBubble emoji={avatar} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-muted-foreground">Your invite code</p>
                <p className="font-display text-xl font-bold tracking-[0.2em]">
                  {inviteCode || "——————"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Copy invite code"
                className="press flex h-11 w-11 items-center justify-center rounded-full border border-border"
                onClick={() => {
                  void navigator.clipboard?.writeText(inviteCode);
                  toast.success("Code copied");
                }}
              >
                <Copy className="h-4 w-4" aria-hidden />
              </button>
            </div>
            {!session ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Codes only work between accounts. You can sign up any time from Profile.
              </p>
            ) : null}

            <div className="mt-auto grid gap-2 pt-8">
              <Button size="lg" className="h-14 rounded-2xl text-base" onClick={finish}>
                Start playing
              </Button>
              <Button variant="ghost" className="h-11 rounded-2xl" onClick={() => setStep(2)}>
                Back
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
