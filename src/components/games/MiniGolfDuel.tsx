import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackBanner, GameFrame, GameIntro, GameSummary, StatPill } from "@/components/koupl/GameShell";
import { ScoreBar, TurnBanner } from "@/components/koupl/ui";
import { bounceOffRect, clamp, useBoardSize, useRaf, type Rect } from "./engine";
import { useGameFx, useIntro } from "./shared";
import type { GameProps } from "./shared";

const HOLES = 5;
const BALL_R = 9;
const CUP_R = 15;
const MAX_STROKES = 6;

type Course = {
  /** Everything is stored 0–1 so the course scales to any phone. */
  tee: { x: number; y: number };
  cup: { x: number; y: number };
  walls: Rect[];
};

function buildCourse(index: number): Course {
  const jitter = (n: number) => n + (Math.random() - 0.5) * 0.08;
  const layouts: Course[] = [
    { tee: { x: 0.5, y: 0.85 }, cup: { x: 0.5, y: 0.15 }, walls: [{ x: 0.3, y: 0.48, w: 0.4, h: 0.05 }] },
    {
      tee: { x: 0.25, y: 0.85 },
      cup: { x: 0.78, y: 0.18 },
      walls: [
        { x: 0.0, y: 0.5, w: 0.55, h: 0.05 },
        { x: 0.62, y: 0.55, w: 0.38, h: 0.05 },
      ],
    },
    {
      tee: { x: 0.5, y: 0.88 },
      cup: { x: 0.5, y: 0.12 },
      walls: [
        { x: 0.18, y: 0.4, w: 0.24, h: 0.06 },
        { x: 0.58, y: 0.4, w: 0.24, h: 0.06 },
        { x: 0.42, y: 0.62, w: 0.16, h: 0.06 },
      ],
    },
    {
      tee: { x: 0.8, y: 0.85 },
      cup: { x: 0.2, y: 0.2 },
      walls: [
        { x: 0.35, y: 0.62, w: 0.5, h: 0.05 },
        { x: 0.12, y: 0.38, w: 0.5, h: 0.05 },
      ],
    },
    {
      tee: { x: 0.5, y: 0.9 },
      cup: { x: 0.5, y: 0.1 },
      walls: [
        { x: 0.36, y: 0.3, w: 0.28, h: 0.06 },
        { x: 0.0, y: 0.58, w: 0.34, h: 0.06 },
        { x: 0.66, y: 0.58, w: 0.34, h: 0.06 },
      ],
    },
  ];
  const base = layouts[index % layouts.length]!;
  return { ...base, cup: { x: clamp(jitter(base.cup.x), 0.12, 0.88), y: base.cup.y } };
}

export function MiniGolfDuel({ game, players, onFinish, onExit }: GameProps) {
  const fx = useGameFx();
  const { showIntro, startPlaying } = useIntro(true);
  const { ref: boardRef, size } = useBoardSize<HTMLDivElement>();

  const [hole, setHole] = useState(0);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [strokes, setStrokes] = useState<[number, number]>([0, 0]);
  const [totals, setTotals] = useState<[number, number]>([0, 0]);
  const [message, setMessage] = useState("Drag back from the ball and let go.");
  const [holeDone, setHoleDone] = useState(false);
  const [done, setDone] = useState(false);
  const [aim, setAim] = useState<{ x: number; y: number } | null>(null);
  const [moving, setMoving] = useState(false);

  const courses = useRef<Course[]>(Array.from({ length: HOLES }, (_, i) => buildCourse(i)));
  const course = courses.current[hole]!;
  const { w, h } = size;

  const ball = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const ballEl = useRef<HTMLDivElement | null>(null);
  const placed = useRef("");

  const px = (v: number) => v * w;
  const py = (v: number) => v * h;
  const rectPx = (r: Rect) => ({ x: r.x * w, y: r.y * h, w: r.w * w, h: r.h * h });

  const key = `${hole}-${turn}-${w}`;
  if (w > 0 && placed.current !== key && !moving) {
    placed.current = key;
    ball.current = { x: px(course.tee.x), y: py(course.tee.y), vx: 0, vy: 0 };
    if (ballEl.current)
      ballEl.current.style.transform = `translate3d(${ball.current.x - BALL_R}px, ${ball.current.y - BALL_R}px, 0)`;
  }

  useRaf((dt) => {
    const b = ball.current;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.vx *= 0.985;
    b.vy *= 0.985;

    if (b.x < BALL_R) {
      b.x = BALL_R;
      b.vx = -b.vx * 0.7;
    }
    if (b.x > w - BALL_R) {
      b.x = w - BALL_R;
      b.vx = -b.vx * 0.7;
    }
    if (b.y < BALL_R) {
      b.y = BALL_R;
      b.vy = -b.vy * 0.7;
    }
    if (b.y > h - BALL_R) {
      b.y = h - BALL_R;
      b.vy = -b.vy * 0.7;
    }
    for (const wall of course.walls) bounceOffRect(b, rectPx(wall), BALL_R, 0.7);

    const cupX = px(course.cup.x);
    const cupY = py(course.cup.y);
    const speed = Math.hypot(b.vx, b.vy);
    if (Math.hypot(b.x - cupX, b.y - cupY) < CUP_R && speed < 420) {
      b.vx = 0;
      b.vy = 0;
      b.x = cupX;
      b.y = cupY;
      setMoving(false);
      sink();
    } else if (speed < 12) {
      b.vx = 0;
      b.vy = 0;
      setMoving(false);
    }

    if (ballEl.current)
      ballEl.current.style.transform = `translate3d(${b.x - BALL_R}px, ${b.y - BALL_R}px, 0)`;
  }, moving && w > 0);

  function sink() {
    fx.win();
    const taken = strokes[turn];
    setMessage(taken === 1 ? "Hole in one!" : `Sunk it in ${taken} strokes.`);
    finishTurn();
  }

  function finishTurn() {
    setHoleDone(true);
  }

  function shoot(dx: number, dy: number) {
    const power = clamp(Math.hypot(dx, dy), 0, 150);
    if (power < 8) return;
    const nx = dx / (Math.hypot(dx, dy) || 1);
    const ny = dy / (Math.hypot(dx, dy) || 1);
    ball.current.vx = nx * power * 9;
    ball.current.vy = ny * power * 9;
    fx.tap();
    setMoving(true);
    setStrokes((s) => {
      const next: [number, number] = [...s];
      next[turn] = next[turn]! + 1;
      if (next[turn]! >= MAX_STROKES) {
        setMessage(`Stroke limit reached — ${MAX_STROKES} counted.`);
        window.setTimeout(() => setHoleDone(true), 900);
      }
      return next;
    });
  }

  function nextTurn() {
    const taken = strokes[turn]!;
    setTotals((t) => {
      const next: [number, number] = [...t];
      next[turn] = next[turn]! + taken;
      return next;
    });
    setHoleDone(false);
    setMessage("Drag back from the ball and let go.");
    if (turn === 0) {
      setTurn(1);
      setStrokes((s) => [s[0], 0]);
    } else if (hole + 1 >= HOLES) {
      setDone(true);
    } else {
      setTurn(0);
      setHole((x) => x + 1);
      setStrokes([0, 0]);
    }
  }

  function rematch() {
    courses.current = Array.from({ length: HOLES }, (_, i) => buildCourse(i));
    setHole(0);
    setTurn(0);
    setStrokes([0, 0]);
    setTotals([0, 0]);
    setDone(false);
    setHoleDone(false);
    placed.current = "";
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective="Five short holes each. Fewest strokes over the round takes the match."
          steps={[
            "Drag backwards from the ball — the longer the drag, the harder the hit.",
            "Let go to putt. Walls bounce, the cup only takes a slow ball.",
            "Both of you play every hole. Lowest total after five holes wins.",
          ]}
          onStart={startPlaying}
          startLabel="Tee off"
        />
      </GameFrame>
    );
  }

  if (done) {
    const winner = totals[0] <= totals[1] ? 0 : 1;
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={totals}
          headline={
            totals[0] === totals[1] ? "All square" : `${players[winner]!.name} takes the round`
          }
          detail="Lowest total strokes wins in golf — smaller is better here."
          scored
          stats={[{ label: "Holes", value: HOLES }]}
          onRematch={rematch}
          onExit={() =>
            onFinish({
              summary: `${totals[0]}–${totals[1]} strokes over ${HOLES} holes`,
              myScore: totals[0],
              theirScore: totals[1],
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
      step={hole}
      total={HOLES}
      stepNoun="Hole"
      header={<ScoreBar players={players} scores={totals} activeSlot={turn} />}
    >
      <div className="mt-1 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <TurnBanner player={players[turn]!} action={holeDone ? "hole finished" : "line up a putt"} />
        </div>
        <StatPill label="Strokes" value={strokes[turn]!} tone="primary" />
      </div>

      <div
        ref={boardRef}
        className="relative mt-3 flex-1 touch-none select-none overflow-hidden rounded-[1.75rem] bg-mint shadow-float"
        style={{ minHeight: 380 }}
        onPointerDown={(e) => {
          if (moving || holeDone) return;
          const r = e.currentTarget.getBoundingClientRect();
          setAim({ x: e.clientX - r.left, y: e.clientY - r.top });
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!aim) return;
          const r = e.currentTarget.getBoundingClientRect();
          setAim({ x: e.clientX - r.left, y: e.clientY - r.top });
        }}
        onPointerUp={() => {
          if (!aim) return;
          shoot(ball.current.x - aim.x, ball.current.y - aim.y);
          setAim(null);
        }}
        onPointerCancel={() => setAim(null)}
      >
        {course.walls.map((wall, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute rounded-lg bg-night/80"
            style={{
              left: `${wall.x * 100}%`,
              top: `${wall.y * 100}%`,
              width: `${wall.w * 100}%`,
              height: `${wall.h * 100}%`,
            }}
          />
        ))}

        <span
          aria-hidden
          className="absolute rounded-full bg-night ring-4 ring-night/25"
          style={{
            left: px(course.cup.x) - CUP_R,
            top: py(course.cup.y) - CUP_R,
            width: CUP_R * 2,
            height: CUP_R * 2,
          }}
        />

        {aim ? (
          <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full">
            <line
              x1={ball.current.x}
              y1={ball.current.y}
              x2={ball.current.x + (ball.current.x - aim.x)}
              y2={ball.current.y + (ball.current.y - aim.y)}
              stroke="currentColor"
              className="text-primary"
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray="8 8"
            />
          </svg>
        ) : null}

        <div
          ref={ballEl}
          aria-hidden
          className="absolute left-0 top-0 rounded-full bg-card shadow-float ring-2 ring-night/20"
          style={{ width: BALL_R * 2, height: BALL_R * 2 }}
        />
      </div>

      <div className="mt-3 space-y-2">
        <FeedbackBanner tone={holeDone ? "success" : "muted"} animateKey={message}>
          {message}
        </FeedbackBanner>
        {holeDone ? (
          <Button size="lg" className="h-14 w-full rounded-2xl text-base" onClick={nextTurn}>
            {turn === 0
              ? `Pass to ${players[1]!.name}`
              : hole + 1 >= HOLES
                ? "See the card"
                : "Next hole"}
          </Button>
        ) : null}
      </div>
    </GameFrame>
  );
}
