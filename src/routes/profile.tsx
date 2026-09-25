import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  ChevronRight,
  Copy,
  HelpCircle,
  LogOut,
  Moon,
  Shield,
  Store,
  Unlink,
  Volume2,
  Vibrate,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AvatarBubble, LoadingScreen, Screen } from "@/components/koupl/ui";
import { AVATARS, RELATIONSHIP_OPTIONS } from "@/lib/koupl/games";
import { useApp } from "@/lib/koupl/store";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & settings — Koupl" },
      {
        name: "description",
        content:
          "Edit your Koupl name and avatar, manage your partner connection, sound, theme and privacy settings.",
      },
      { property: "og:title", content: "Profile & settings — Koupl" },
      {
        property: "og:description",
        content: "Your Koupl profile, partner link and app preferences.",
      },
    ],
  }),
  component: Profile,
});

function Row({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-2">
      <span className="text-muted-foreground" aria-hidden>
        {icon}
      </span>
      <span className="flex-1 text-sm font-bold">{label}</span>
      {children}
    </div>
  );
}

function Profile() {
  const navigate = useNavigate();
  const app = useApp();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  if (!app.hydrated) return <LoadingScreen />;

  const currentName = name || app.me.name;
  const currentAvatar = avatar || app.me.avatar;
  const relationship = app.profile?.relationship_status ?? app.guest?.relationship ?? "dating";

  async function saveIdentity() {
    setSaving(true);
    if (app.session) await app.updateProfile({ display_name: currentName, avatar: currentAvatar });
    else app.saveGuest({ name: currentName, avatar: currentAvatar });
    setSaving(false);
    toast.success("Profile updated");
  }

  async function setRelationship(value: string) {
    if (app.session) await app.updateProfile({ relationship_status: value });
    else app.saveGuest({ relationship: value as never });
  }

  async function connect() {
    try {
      const res = await app.linkPartner(code);
      toast.success(`Connected with ${res?.name ?? "your partner"}`);
      setCode("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't find that code");
    }
  }

  return (
    <Screen>
      <h1 className="font-display text-2xl font-bold">Profile</h1>

      {/* Identity */}
      <section className="surface mt-4 p-5" aria-labelledby="you-h">
        <h2 id="you-h" className="sr-only">
          Your details
        </h2>
        <div className="flex flex-col items-center">
          <AvatarBubble emoji={currentAvatar} size="xl" />
          <p className="font-display mt-3 text-xl font-bold">{currentName}</p>
          <p className="text-xs text-muted-foreground">
            {app.session ? app.session.user.email : "Guest — playing on this device"}
          </p>
        </div>

        <div className="mt-5 grid gap-2">
          <Label htmlFor="dn" className="text-sm font-bold">
            Display name
          </Label>
          <Input
            id="dn"
            maxLength={40}
            value={currentName}
            onChange={(e) => setName(e.target.value)}
            className="h-13 rounded-2xl text-base"
          />
        </div>

        <p className="mt-4 text-sm font-bold">Avatar</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              aria-label={`Avatar ${a}`}
              aria-pressed={currentAvatar === a}
              onClick={() => setAvatar(a)}
              className={cn(
                "press flex h-12 w-12 items-center justify-center rounded-full border-2 bg-card text-2xl",
                currentAvatar === a ? "border-primary bg-primary/10" : "border-border",
              )}
            >
              {a}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm font-bold">Relationship</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {RELATIONSHIP_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={relationship === o.value}
              onClick={() => void setRelationship(o.value)}
              className={cn(
                "press rounded-full border-2 px-3 py-2 text-xs font-bold",
                relationship === o.value ? "border-primary bg-primary/10" : "border-border",
              )}
            >
              <span aria-hidden>{o.emoji}</span> {o.label}
            </button>
          ))}
        </div>

        <Button
          className="mt-5 h-13 w-full rounded-2xl text-base"
          disabled={saving}
          onClick={() => void saveIdentity()}
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </section>

      {/* Partner */}
      <section className="surface mt-4 p-5" aria-labelledby="partner-h">
        <h2 id="partner-h" className="font-display text-base font-bold">
          Partner
        </h2>
        {app.partner ? (
          <div className="mt-3 flex items-center gap-3">
            <AvatarBubble emoji={app.partner.avatar} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{app.partner.name}</p>
              <p className="text-sm text-muted-foreground">
                {app.session ? "Linked account" : "Local partner"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11 rounded-full"
              onClick={() => {
                if (app.session) void app.unlinkPartner();
                else app.saveGuest({ partnerName: "" });
                toast.success("Partner removed");
              }}
            >
              <Unlink className="mr-1 h-4 w-4" aria-hidden /> Remove
            </Button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Nobody connected yet.{" "}
            {app.session
              ? "Enter their code below."
              : "Add a name in setup, or create an account to link two phones."}
          </p>
        )}

        <div className="surface mt-4 flex items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-muted-foreground">Your invite code</p>
            <p className="font-display text-lg font-bold tracking-[0.2em]">
              {app.inviteCode || "——————"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Copy invite code"
            className="press flex h-11 w-11 items-center justify-center rounded-full border border-border"
            onClick={() => {
              void navigator.clipboard?.writeText(app.inviteCode);
              toast.success("Code copied");
            }}
          >
            <Copy className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {app.session ? (
          <div className="mt-3 flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Their code"
              maxLength={8}
              aria-label="Partner invite code"
              className="h-12 flex-1 rounded-2xl text-center font-bold tracking-[0.2em]"
            />
            <Button
              className="h-12 rounded-2xl"
              disabled={code.length < 4}
              onClick={() => void connect()}
            >
              Link
            </Button>
          </div>
        ) : (
          <Button asChild variant="secondary" className="mt-3 h-12 w-full rounded-2xl">
            <Link to="/auth">Create an account to link phones</Link>
          </Button>
        )}
      </section>

      {/* Settings */}
      <section className="surface mt-4 divide-y divide-border" aria-labelledby="settings-h">
        <h2 id="settings-h" className="font-display px-4 pt-4 text-base font-bold">
          Settings
        </h2>
        <Row icon={<Volume2 className="h-5 w-5" />} label="Sound effects">
          <Switch
            checked={app.settings.sound}
            onCheckedChange={(v) => app.setSettings({ sound: v })}
            aria-label="Sound effects"
          />
        </Row>
        <Row icon={<Vibrate className="h-5 w-5" />} label="Haptics">
          <Switch
            checked={app.settings.haptics}
            onCheckedChange={(v) => app.setSettings({ haptics: v })}
            aria-label="Haptics"
          />
        </Row>
        <Row icon={<Bell className="h-5 w-5" />} label="Notifications">
          <Switch
            checked={app.settings.notifications}
            onCheckedChange={(v) => app.setSettings({ notifications: v })}
            aria-label="Notifications"
          />
        </Row>
        <Row icon={<Moon className="h-5 w-5" />} label="Dark theme">
          <Switch
            checked={app.settings.theme === "dark"}
            onCheckedChange={(v) => app.setSettings({ theme: v ? "dark" : "light" })}
            aria-label="Dark theme"
          />
        </Row>

        <Dialog>
          <DialogTrigger asChild>
            <button type="button" className="press flex min-h-14 w-full items-center gap-3 px-4">
              <Shield className="h-5 w-5 text-muted-foreground" aria-hidden />
              <span className="flex-1 text-left text-sm font-bold">Privacy</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-display">Privacy</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Guest play stays on this device only. Nothing leaves your phone until you create
                an account.
              </p>
              <p>
                With an account, we store your name, avatar, partner link and game results so both
                phones stay in sync. Your answers inside a game are only shared with the partner in
                your room.
              </p>
              <Button
                variant="secondary"
                className="h-12 w-full rounded-2xl"
                onClick={() => {
                  void app.clearActivity();
                  toast.success("Game history deleted");
                }}
              >
                Delete my game history
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Link
          to="/store"
          className="press flex min-h-14 w-full items-center gap-3 px-4"
        >
          <Store className="h-5 w-5 text-muted-foreground" aria-hidden />
          <span className="flex-1 text-left text-sm font-bold">Koupl on the app store</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
        </Link>

        <Dialog>
          <DialogTrigger asChild>
            <button type="button" className="press flex min-h-14 w-full items-center gap-3 px-4">
              <HelpCircle className="h-5 w-5 text-muted-foreground" aria-hidden />
              <span className="flex-1 text-left text-sm font-bold">Help &amp; about</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-display">Help &amp; about</DialogTitle>
            </DialogHeader>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="a">
                <AccordionTrigger className="text-sm font-bold">
                  How do we play on two phones?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Both of you create an account, then link with each other's invite code. Inside a
                  game, tap "Two phones" to open a room and share the room code.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="b">
                <AccordionTrigger className="text-sm font-bold">
                  Can we just use one phone?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Yes — that's the default. Games show a hand-over screen so nobody sees the other's
                  answer early.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="c">
                <AccordionTrigger className="text-sm font-bold">About Koupl</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Koupl is an independent couples games app with original prompts, decks and
                  question banks. No ads, no purchases.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </DialogContent>
        </Dialog>
      </section>

      <div className="mt-4 grid gap-2">
        {app.session ? (
          <Button
            variant="ghost"
            className="h-13 rounded-2xl text-base text-destructive"
            onClick={() => {
              void app.signOut();
              toast.success("Signed out");
            }}
          >
            <LogOut className="mr-1 h-5 w-5" aria-hidden /> Sign out
          </Button>
        ) : (
          <Button asChild className="h-13 rounded-2xl text-base">
            <Link to="/auth">Create an account</Link>
          </Button>
        )}
        <Button
          variant="ghost"
          className="h-11 rounded-2xl text-sm text-muted-foreground"
          onClick={() => {
            app.clearGuest();
            void navigate({ to: "/welcome" });
          }}
        >
          Reset this device
        </Button>
      </div>
    </Screen>
  );
}
