// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

/**
 * Generates /sw.js (Workbox) after the CLIENT environment build so the published app
 * — and the Android shell that loads it — can relaunch and play one-phone games offline.
 * All JS/CSS/image chunks are precached; HTML pages are network-first and cached on visit.
 * Registration is guarded in src/lib/koupl/pwa.ts (never in dev or Lovable preview).
 */
function offlineServiceWorker(): Plugin {
  return {
    name: "koupl-offline-sw",
    apply: "build",
    applyToEnvironment: (env) => env.name === "client",
    async closeBundle() {
      const outDir = this.environment.config.build.outDir;
      const { generateSW } = await import("workbox-build");
      const res = await generateSW({
        globDirectory: outDir,
        swDest: `${outDir}/sw.js`,
        globPatterns: ["**/*.{js,css,png,jpg,jpeg,svg,webp,ico,woff,woff2}"],
        globIgnores: ["sw.js", "workbox-*.js"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: null,
        inlineWorkboxRuntime: true,
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              url.origin === self.location.origin &&
              !url.pathname.startsWith("/~oauth") &&
              !url.pathname.startsWith("/auth") &&
              !url.pathname.startsWith("/api/") &&
              !url.pathname.startsWith("/_serverFn") &&
              (request.mode === "navigate" || request.headers.get("x-koupl-warm") === "1"),
            handler: "NetworkFirst",
            options: {
              cacheName: "koupl-pages",
              networkTimeoutSeconds: 4,
              matchOptions: { ignoreVary: true, ignoreSearch: true },
              expiration: { maxEntries: 80 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.origin === "https://fonts.googleapis.com" ||
              url.origin === "https://fonts.gstatic.com",
            handler: "CacheFirst",
            options: {
              cacheName: "koupl-fonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      });
      this.environment.logger.info(
        `[koupl-offline-sw] precached ${res.count} files (${Math.round(res.size / 1024)} kB)`,
      );
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [offlineServiceWorker()],
  },
});
