import { useEffect, useRef, useState } from "react";

import { GameFrame, GameIntro, GameSummary } from "@/components/koupl/GameShell";
import { ScoreBar } from "@/components/koupl/ui";
import { useBoardSize, useRaf, clamp } from "./engine";
import { useGameFx, useIntro } from "./shared";
import type { GameProps } from "./shared";

const TARGET = 5;
const PUCK_R = 16;
const PADDLE_R = 26;

type Vec = { x: number; y: number };

export function AirHockeyDuel({ game, players, onFinish, onExit }: GameProps) {
  const fx = useGameFx();
  const { showIntro, startPlaying } = useIntro(true);
  const { ref: boardRef, size } = useBoardSize<HTMLDivElement>();

  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [flash, setFlash] = useState<0 | 1 | null>(null);
  const [done, setDone] = useState(false);

  const puck = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const paddles = useRef<[Vec, Vec]>([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ]);
  const prev = useRef<[Vec, Vec]>([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ]);
  const pointers = useRef(new Map<number, 0 | 1>());
  const puckEl = useRef<HTMLDivElement | null>(null);
  const padEls = useRef<[HTMLDivElement | null, HTMLDivElement | null]>([null, null]);
  const started = useRef(false);

  const { w, h } = size;

  function serve(toward: 0 | 1) {
    puck.current = {
      x: w / 2,
      y: h / 2,
      vx: (Math.random() - 0.5) * 120,
      vy: (toward === 0 ? 1 : -1) * 220,
    };
  }

  if (w > 0 && !started.current) {
    started.current = true;
    puck.current = { x: w / 2, y: h / 2, vx: 0, vy: 0 };
    paddles.current = [
      { x: w / 2, y: h - 60 },
      { x: w / 2, y: 60 },
    ];
    prev.current = [{ ...paddles.current[0] }, { ...paddles.current[1] }];
    serve(Math.random() < 0.5 ? 0 : 1);
  }

  function slotFor(y: number): 0 | 1 {
    return y > h / 2 ? 0 : 1;
  }

  // Place the pucks/paddles as soon as the rink has real pixels (and after each round).
  useEffect(() => {
    if (!w || !h || showIntro) return;
    ([0, 1] as const).forEach((i) => {
      const pad = paddles.current[i];
      const el = padEls.current[i];
      if (el) el.style.transform = `translate3d(${pad.x - PADDLE_R}px, ${pad.y - PADDLE_R}px, 0)`;
    });
    const p = puck.current;
    if (puckEl.current)
      puckEl.current.style.transform = `translate3d(${p.x - PUCK_R}px, ${p.y - PUCK_R}px, 0)`;
  }, [w, h, showIntro]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const slot = slotFor(y);
    pointers.current.set(e.pointerId, slot);
    e.currentTarget.setPointerCapture(e.pointerId);
    movePaddle(slot, e.clientX - rect.left, y);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const slot = pointers.current.get(e.pointerId);
    if (slot === undefined) return;
    const rect = e.currentTarget.getBoundingClientRect();
    movePaddle(slot, e.clientX - rect.left, e.clientY - rect.top);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId);
  }

  function movePaddle(slot: 0 | 1, x: number, y: number) {
    const minY = slot === 0 ? h / 2 + PADDLE_R : PADDLE_R;
    const maxY = slot === 0 ? h - PADDLE_R : h / 2 - PADDLE_R;
    const p = paddles.current[slot];
    p.x = clamp(x, PADDLE_R, w - PADDLE_R);
    p.y = clamp(y, minY, maxY);
    const el = padEls.current[slot];
    if (el) el.style.transform = `translate3d(${p.x - PADDLE_R}px, ${p.y - PADDLE_R}px, 0)`;
  }

  useRaf((dt) => {
    if (!w || done || showIntro) return;
    const p = puck.current;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.995;
    p.vy *= 0.995;

    // Side walls
    if (p.x < PUCK_R) {
      p.x = PUCK_R;
      p.vx = Math.abs(p.vx) * 0.92;
    }
    if (p.x > w - PUCK_R) {
      p.x = w - PUCK_R;
      p.vx = -Math.abs(p.vx) * 0.92;
    }

    const goalHalf = w * 0.22;
    const inGoalMouth = Math.abs(p.x - w / 2) < goalHalf;

    // Top / bottom: goal or wall
    if (p.y < PUCK_R) {
      if (inGoalMouth) return score(0);
      p.y = PUCK_R;
      p.vy = Math.abs(p.vy) * 0.92;
    }
    if (p.y > h - PUCK_R) {
      if (inGoalMouth) return score(1);
      p.y = h - PUCK_R;
      p.vy = -Math.abs(p.vy) * 0.92;
    }

    // Paddles
    for (let i = 0; i < 2; i++) {
      const pad = paddles.current[i]!;
      const dx = p.x - pad.x;
      const dy = p.y - pad.y;
      const d = Math.hypot(dx, dy);
      const min = PUCK_R + PADDLE_R;
      if (d < min && d > 0) {
        const nx = dx / d;
        const ny = dy / d;
        p.x = pad.x + nx * min;
        p.y = pad.y + ny * min;
        const speed = Math.max(Math.hypot(p.vx, p.vy), 260);
        const padVx = (pad.x - prev.current[i]!.x) / Math.max(dt, 0.001);
        const padVy = (pad.y - prev.current[i]!.y) / Math.max(dt, 0.001);
        p.vx = nx * speed + padVx * 0.35;
        p.vy = ny * speed + padVy * 0.35;
        fx.tap();
      }
      prev.current[i] = { x: pad.x, y: pad.y };
    }

    // Speed cap so it stays playable
    const sp = Math.hypot(p.vx, p.vy);
    const cap = 1100;
    if (sp > cap) {
      p.vx = (p.vx / sp) * cap;
      p.vy = (p.vy / sp) * cap;
    }

    if (puckEl.current)
      puckEl.current.style.transform = `translate3d(${p.x - PUCK_R}px, ${p.y - PUCK_R}px, 0)`;
  }, !done && !showIntro && w > 0);

  function score(slot: 0 | 1) {
    fx.win();
    setFlash(slot);
    window.setTimeout(() => setFlash(null), 900);
    setScores((s) => {
      const next: [number, number] = [s[0] + (slot === 0 ? 1 : 0), s[1] + (slot === 1 ? 1 : 0)];
      if (next[0] >= TARGET || next[1] >= TARGET) setDone(true);
      return next;
    });
    serve(slot === 0 ? 1 : 0);
  }

  function rematch() {
    setScores([0, 0]);
    setDone(false);
    serve(Math.random() < 0.5 ? 0 : 1);
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective={`Slide your paddle, smash the puck into their goal. First to ${TARGET} wins.`}
          steps={[
            "Hold the phone flat between you — one player per half.",
            "Drag anywhere in your half to move your paddle. Both of you can move at once.",
            `Defend the coloured goal mouth. First to ${TARGET} goals takes it.`,
          ]}
          onStart={startPlaying}
          startLabel="Face off"
        />
      </GameFrame>
    );
  }

  if (done) {
    const winner = scores[0] > scores[1] ? 0 : 1;
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={scores}
          headline={`${players[winner]!.name} wins the face-off`}
          detail={`Final score ${scores[0]}–${scores[1]}.`}
          scored
          onRematch={rematch}
          onExit={() =>
            onFinish({
              summary: `${scores[0]}–${scores[1]} air hockey`,
              myScore: scores[0],
              theirScore: scores[1],
            })
          }
        />
      </GameFrame>
    );
  }

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      header={<ScoreBar players={players} scores={scores} activeSlot={null} />}
    >
      <div
        ref={boardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative mt-3 flex-1 touch-none select-none overflow-hidden rounded-[1.75rem] bg-night shadow-float"
        style={{ minHeight: 420 }}
      >
        {/* rink markings */}
        <span
          aria-hidden
          className="absolute left-0 right-0 top-1/2 h-px -translate-y-px bg-night-foreground/20"
        />
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-night-foreground/20"
        />
        <span
          aria-hidden
          className="absolute -top-8 left-1/2 h-16 w-[44%] -translate-x-1/2 rounded-b-full bg-sky/70"
        />
        <span
          aria-hidden
          className="absolute -bottom-8 left-1/2 h-16 w-[44%] -translate-x-1/2 rounded-t-full bg-primary/70"
        />

        <div
          ref={(el) => {
            padEls.current[1] = el;
          }}
          aria-hidden
          className="absolute left-0 top-0 rounded-full bg-sky shadow-float ring-4 ring-sky/30"
          style={{
            width: PADDLE_R * 2,
            height: PADDLE_R * 2,
            transform: `translate3d(${paddles.current[1].x - PADDLE_R}px, ${paddles.current[1].y - PADDLE_R}px, 0)`,
          }}
        />
        <div
          ref={(el) => {
            padEls.current[0] = el;
          }}
          aria-hidden
          className="absolute left-0 top-0 rounded-full bg-primary shadow-float ring-4 ring-primary/30"
          style={{
            width: PADDLE_R * 2,
            height: PADDLE_R * 2,
            transform: `translate3d(${paddles.current[0].x - PADDLE_R}px, ${paddles.current[0].y - PADDLE_R}px, 0)`,
          }}
        />
        <div
          ref={puckEl}
          aria-hidden
          className="absolute left-0 top-0 rounded-full bg-night-foreground shadow-float"
          style={{
            width: PUCK_R * 2,
            height: PUCK_R * 2,
            transform: `translate3d(${puck.current.x - PUCK_R}px, ${puck.current.y - PUCK_R}px, 0)`,
          }}
        />

        {flash !== null ? (
          <p
            aria-live="polite"
            className="animate-pop-in absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-display text-2xl font-bold text-night-foreground"
          >
            Goal — {players[flash]!.name}
          </p>
        ) : null}
      </div>
      <p className="mt-3 text-center text-xs font-bold text-muted-foreground">
        First to {TARGET} · drag inside your own half
      </p>
    </GameFrame>
  );
}
