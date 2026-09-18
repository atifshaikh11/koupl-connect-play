import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/koupl/ui";
import { supabase } from "@/integrations/supabase/client";
import { goPostAuth } from "@/lib/koupl/coupleRoom";

export const Route = createFileRoute("/auth_/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing you in — Koupl" },
      {
        name: "description",
        content: "Finishing your Koupl sign-in and returning you to your games.",
      },
      { property: "og:title", content: "Signing you in — Koupl" },
      { property: "og:description", content: "Finishing your Koupl sign-in." },
    ],
  }),
  component: AuthCallback,
});

/** Reads tokens / errors the OAuth broker appends to the callback URL. */
function readAuthParams() {
  if (typeof window === "undefined") return null;
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const pick = (key: string) => hash.get(key) ?? query.get(key);
  return {
    accessToken: pick("access_token"),
    refreshToken: pick("refresh_token"),
    error: pick("error_description") ?? pick("error"),
  };
}

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const done = () => {
      if (!active) return;
      active = false;
      goPostAuth(navigate, true);
    };

    const fail = (message: string) => {
      if (!active) return;
      active = false;
      setError(message);
    };

    // Any session change (including supabase-js parsing the URL itself) finishes the flow.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) done();
    });

    void (async () => {
      const params = readAuthParams();

      if (params?.error) {
        fail(params.error);
        return;
      }

      if (params?.accessToken && params.refreshToken) {
        const { error: setErr } = await supabase.auth.setSession({
          access_token: params.accessToken,
          refresh_token: params.refreshToken,
        });
        if (setErr) {
          fail(setErr.message);
          return;
        }
        done();
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        done();
        return;
      }

      // Give supabase-js / the broker a moment to hydrate before giving up.
      timer = setTimeout(() => fail("We could not finish signing you in."), 8000);
    })();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <Wordmark />
      {error ? (
        <>
          <span className="text-5xl" aria-hidden>
            🙈
          </span>
          <h1 className="font-display text-2xl font-bold">Sign-in didn’t finish</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="mt-2 grid w-full gap-2">
            <Button className="h-12 rounded-2xl" onClick={() => void navigate({ to: "/auth" })}>
              Try again
            </Button>
            <Button
              variant="ghost"
              className="h-12 rounded-2xl"
              onClick={() => void navigate({ to: "/" })}
            >
              Keep playing as a guest
            </Button>
          </div>
        </>
      ) : (
        <>
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm text-muted-foreground">Finishing sign-in…</p>
        </>
      )}
    </div>
  );
}
