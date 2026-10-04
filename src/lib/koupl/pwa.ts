import { GAMES } from "@/lib/koupl/games";

/**
 * Offline support for one-phone play. The ONLY place /sw.js is registered.
 *
 * The service worker precaches every built JS/CSS/image chunk (all 28 games, their
 * bundled prompts/words/emoji data, sounds are synthesized in Web Audio). Pages are
 * network-first; this module warms the pages one-phone play needs so the app can be
 * reopened and every game started with no connection.
 *
 * Never registers in dev, inside an iframe, or on Lovable preview hosts. `?sw=off`
 * unregisters it (kill switch).
 */
const SW_URL = "/sw.js";

function refused(): boolean {
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;
  const h = window.location.hostname;
  if (h.startsWith("id-preview--") || h.startsWith("preview--")) return true;
  const blocked = ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"];
  if (blocked.some((d) => h === d || h.endsWith(`.${d}`))) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterOwn() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    regs
      .filter((r) => (r.active ?? r.installing ?? r.waiting)?.scriptURL.endsWith(SW_URL))
      .map((r) => r.unregister()),
  );
}

/** Pages one-phone mode can land on, cached while online. */
function offlinePages(): string[] {
  return ["/", "/games", "/welcome", "/activity", ...GAMES.map((g) => `/play/${g.id}`)];
}

let warming = false;

/** Refresh cached pages on every online launch so they always match the current build. */
async function warmPages() {
  if (!navigator.onLine || warming) return;
  warming = true;
  for (const url of offlinePages()) {
    try {
      await fetch(url, { headers: { "x-koupl-warm": "1" }, credentials: "same-origin" });
    } catch {
      break; // went offline mid-way; try again next launch
    }
  }
  warming = false;
}

export function setupOfflineSupport() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (refused()) {
    void unregisterOwn().catch(() => {});
    return;
  }
  void (async () => {
    try {
      await navigator.serviceWorker.register(SW_URL, { scope: "/" });
      await navigator.serviceWorker.ready;
      // Give the first screen priority, then warm in the background.
      window.setTimeout(() => void warmPages(), 3000);
      // A new deploy took over: re-cache pages against the new build.
      navigator.serviceWorker.addEventListener("controllerchange", () => void warmPages());
    } catch {
      /* offline support is best-effort */
    }
  })();
}
