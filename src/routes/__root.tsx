import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppProvider } from "@/lib/koupl/store";
import { initNative } from "@/lib/koupl/native";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-primary">404</h1>
        <h2 className="font-display mt-4 text-xl font-semibold">Nothing here</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That page doesn't exist. Let's get you back to the games.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="press inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <span className="text-5xl" aria-hidden>
          🫠
        </span>
        <h1 className="font-display mt-3 text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try again, or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="press inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
          >
            Try again
          </button>
          <a
            href="/"
            className="press inline-flex items-center justify-center rounded-2xl border border-input bg-card px-5 py-3 text-sm font-bold"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "Koupl — Games for Couples" },
      {
        name: "description",
        content:
          "Koupl is a playful two-player games app for couples: question decks, quizzes and quick arcade duels.",
      },
      { name: "theme-color", content: "#f7f2e8" },
      { property: "og:site_name", content: "Koupl" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    return initNative(() => {
      if (router.state.location.pathname === "/") return false;
      router.history.back();
      return true;
    });
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <main><Outlet /></main>
        <Toaster position="top-center" />
      </AppProvider>
    </QueryClientProvider>
  );
}
