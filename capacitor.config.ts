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
  },
  server: {
    // Production HTTPS origin. No localhost / dev URLs here.
    url: APP_URL,
    cleartext: false,
    androidScheme: "https",
    allowNavigation: ["koupl-connect-play.lovable.app", "*.supabase.co", "*.lovable.app"],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      launchAutoHide: true,
      backgroundColor: "#1C0F0E",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
ام: undefined,
    },
    Keyboard: {
      resize: "native",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
