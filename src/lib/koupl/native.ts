/**
 * Android (Capacitor) runtime behaviour for Koupl.
 *
 * Everything here is a no-op in a normal browser: plugin modules are only imported
 * when the app is actually running inside the native Android shell.
 */

let started = false;

type Cleanup = () => void;

export function initNative(navigateBack: () => boolean): Cleanup | undefined {
  if (typeof window === "undefined" || started) return;

  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (!cap?.isNativePlatform?.()) return;

  started = true;
  const cleanups: Cleanup[] = [];

  void (async () => {
    try {
      const [{ App }, { StatusBar, Style }, { Keyboard }, { SplashScreen }] = await Promise.all([
        import("@capacitor/app"),
        import("@capacitor/status-bar"),
        import("@capacitor/keyboard"),
        import("@capacitor/splash-screen"),
      ]);

      // Dark, edge-to-edge chrome that matches the Koupl night surface.
      await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      await StatusBar.setBackgroundColor({ color: "#1C0F0E" }).catch(() => {});
      await SplashScreen.hide().catch(() => {});

      // Keyboard: keep the focused input visible and expose its height to CSS.
      const setKb = (h: number) =>
        document.documentElement.style.setProperty("--kb-inset", `${h}px`);
      const kbShow = await Keyboard.addListener("keyboardWillShow", (info) =>
        setKb(info.keyboardHeight),
      );
      const kbHide = await Keyboard.addListener("keyboardWillHide", () => setKb(0));
      cleanups.push(() => void kbShow.remove(), () => void kbHide.remove());

      // Hardware back button: step back through app history, exit only at the root.
      const back = await App.addListener("backButton", ({ canGoBack }) => {
        if (navigateBack() || canGoBack) return;
        void App.exitApp();
      });
      cleanups.push(() => void back.remove());
    } catch {
      // Plugin unavailable — behave like the plain web app.
    }
  })();

  return () => {
    cleanups.forEach((fn) => fn());
    started = false;
  };
}
