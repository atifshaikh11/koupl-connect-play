import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Koupl — Android packaging config.
 *
 * The Koupl web app is server-rendered (TanStack Start), so the Android shell loads the
 * deployed production build instead of a static export. `webDir` only holds an offline
 * fallback screen that is shown when the device cannot reach the network.
 *
 * Override the production URL at build time with KOUPL_APP_URL if the app moves domains.
 */
const APP_URL = process.env["KOUPL_APP_URL"] ?? "https://koupl-connect-play.lovable.app";

const config: CapacitorConfig = {
  appId: "com.koupl.app",
  appName: "Koupl",
  webDir: "android-www",
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Google's sign-in pages refuse a WebView user agent (the "; wv" token).
    // Presenting a plain Chrome UA keeps the whole OAuth round-trip in-app, so the
    // broker's state cookie and the callback live in the same browser session.
    overrideUserAgent:
      "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36 Koupl/1.0",
  },
  server: {
    // Production HTTPS origin. No localhost / dev URLs here.
    url: APP_URL,
    cleartext: false,
    androidScheme: "https",
    // OAuth must stay inside the app: broker, Google account pages and the
    // backend are all allowed; anything else still opens in the phone browser.
    allowNavigation: [
      "koupl-connect-play.lovable.app",
      "*.supabase.co",
      "*.lovable.app",
      "accounts.google.com",
      "*.google.com",
      "*.googleusercontent.com",
      "ssl.gstatic.com",
      "*.gstatic.com",
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      launchAutoHide: true,
      backgroundColor: "#1C0F0E",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    Keyboard: {
      resize: "native",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
