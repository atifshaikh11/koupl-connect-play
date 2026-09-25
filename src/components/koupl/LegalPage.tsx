import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto w-full max-w-md px-5 pb-16 pt-6">
        <Link
          to="/profile"
          className="press inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-sm font-bold"
        >
          Back
        </Link>
        <h1 className="font-display mt-5 text-3xl font-bold">{title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">Last updated: {updated}</p>
        <p className="mt-4 rounded-2xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          This page is informational and has not yet been reviewed by a lawyer. Items in
          [brackets] must be completed by the app owner before public release.
        </p>
        <div className="legal mt-6 space-y-5 text-sm leading-relaxed text-foreground/90 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
      </main>
    </div>
  );
}
