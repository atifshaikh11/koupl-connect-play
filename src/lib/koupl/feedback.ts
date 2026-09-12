export type SoundCue =
  | "tap"
  | "select"
  | "impact"
  | "reaction"
  | "flip"
  | "match-found"
  | "hit"
  | "miss"
  | "sink"
  | "kick"
  | "goal"
  | "pop"
  | "roll"
  | "reveal"
  | "tension"
  | "win-round"
  | "lose-round"
  | "game-win"
  | "game-lose"
  | "streak";

export type HapticCue = "selection" | "success" | "loss" | "game-win" | "streak";

type WebkitWindow = typeof window & { webkitAudioContext?: typeof AudioContext };

/** One lazy Web Audio graph shared by the entire app. */
class KouplSoundManager {
  private enabled = true;
  private context: AudioContext | null = null;
  private lastPlayed = new Map<SoundCue, number>();

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled && this.context?.state === "running") void this.context.suspend().catch(() => {});
  }

  private audioContext() {
    if (!this.enabled || typeof window === "undefined") return null;
    const AudioCtx = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!AudioCtx) return null;
    this.context ??= new AudioCtx();
    if (this.context.state === "suspended") void this.context.resume().catch(() => {});
    return this.context;
  }

  play(cue: SoundCue, streakTier = 1) {
    if (!this.enabled) return;
    const now = typeof performance === "undefined" ? Date.now() : performance.now();
    const throttle = cue === "tap" || cue === "impact" || cue === "pop" ? 55 : 24;
    if (now - (this.lastPlayed.get(cue) ?? 0) < throttle) return;
    this.lastPlayed.set(cue, now);
    const ctx = this.audioContext();
    if (!ctx) return;

    const notes: Record<SoundCue, Array<[number, number, number, OscillatorType]>> = {
      tap: [[760, 0, 0.07, "sine"]],
      select: [[620, 0, 0.1, "sine"], [850, 0.045, 0.08, "sine"]],
      impact: [[185, 0, 0.06, "triangle"]],
      reaction: [[980, 0, 0.055, "square"]],
      flip: [[430, 0, 0.08, "triangle"], [650, 0.035, 0.07, "sine"]],
      "match-found": [[620, 0, 0.13, "sine"], [880, 0.075, 0.17, "sine"]],
      hit: [[165, 0, 0.09, "square"], [420, 0.045, 0.1, "triangle"]],
      miss: [[180, 0, 0.13, "sine"]],
      sink: [[520, 0, 0.12, "sine"], [780, 0.07, 0.2, "sine"]],
      kick: [[150, 0, 0.075, "triangle"]],
      goal: [[440, 0, 0.12, "triangle"], [660, 0.07, 0.17, "sine"]],
      pop: [[720, 0, 0.055, "sine"]],
      roll: [[120, 0, 0.12, "sawtooth"], [175, 0.06, 0.1, "triangle"]],
      reveal: [[420, 0, 0.1, "sine"], [610, 0.06, 0.13, "sine"]],
      tension: [[135, 0, 0.08, "triangle"]],
      "win-round": [[520, 0, 0.13, "sine"], [660, 0.08, 0.16, "sine"]],
      "lose-round": [[210, 0, 0.16, "sine"], [165, 0.07, 0.13, "sine"]],
      "game-win": [[392, 0, 0.16, "sine"], [523, 0.09, 0.2, "sine"], [659, 0.18, 0.28, "sine"]],
      "game-lose": [[260, 0, 0.18, "sine"], [196, 0.11, 0.2, "sine"]],
      streak: [[523, 0, 0.13, "sine"], [659, 0.07, 0.16, "sine"], [784, 0.15, 0.24, "sine"]],
    };

    const pitch = cue === "win-round" ? 1 + Math.min(Math.max(streakTier, 1), 3) * 0.08 : 1;
    for (const [frequency, offset, duration, type] of notes[cue]) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency * pitch;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + offset + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + duration);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(ctx.currentTime + offset);
      oscillator.stop(ctx.currentTime + offset + duration + 0.01);
    }
  }
}

/** Native-first haptics with a browser vibration fallback. */
class KouplHapticManager {
  private enabled = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(0);
  }

  async play(cue: HapticCue) {
    if (!this.enabled || typeof window === "undefined") return;
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (cap?.isNativePlatform?.()) {
      try {
        const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
        if (cue === "selection") await Haptics.selectionChanged();
        else if (cue === "success") await Haptics.notification({ type: NotificationType.Success });
        else if (cue === "loss") await Haptics.impact({ style: ImpactStyle.Light });
        else if (cue === "game-win") await Haptics.impact({ style: ImpactStyle.Heavy });
        else {
          await Haptics.impact({ style: ImpactStyle.Medium });
          window.setTimeout(() => void Haptics.impact({ style: ImpactStyle.Heavy }), 110);
        }
        return;
      } catch {
        // Fall back to vibration when the native plugin is unavailable.
      }
    }
    if (!("vibrate" in navigator)) return;
    const pattern: Record<HapticCue, number | number[]> = {
      selection: 7,
      success: 18,
      loss: 6,
      "game-win": 35,
      streak: [18, 70, 28],
    };
    navigator.vibrate(pattern[cue]);
  }
}

export const SoundManager = new KouplSoundManager();
export const HapticManager = new KouplHapticManager();
