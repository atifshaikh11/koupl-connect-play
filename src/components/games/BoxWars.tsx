import { useState } from "react";

import { FeedbackBanner, GameFrame, GameIntro, GameSummary } from "@/components/koupl/GameShell";
import { ScoreBar, TurnBanner } from "@/components/koupl/ui";
import { cn } from "@/lib/utils";
import { useSharedState } from "@/lib/koupl/useRoom";
import { useGameFx, useIntro } from "./shared";
import type { GameProps } from "./shared";

/** 4x4 dots -> 3x3 boxes. */
const N = 4;
const CELLS = N - 1;
const H_COUNT = N * CELLS; // horizontal edges
const V_COUNT = CELLS * N; // vertical edges

type Owner = 0 | 1 | null;
type State = {
  h: boolean[];
  v: boolean[];
  boxes: Owner[];
  turn: 0 | 1;
  over: boolean;
};

const initial: State = {
  h: Array(H_COUNT).fill(false),
  v: Array(V_COUNT).fill(false),
  boxes: Array(CELLS * CELLS).fill(null),
  turn: 0,
  over: false,
};

const hIndex = (r: number, c: number) => r * CELLS + c;
const vIndex = (r: number, c: number) => r * N + c;

export function BoxWars({ game, players, mySlot, room, onFinish, onExit }: GameProps) {
  const fx = useGameFx();
  const { value: s, patch } = useSharedState<State>(initial, room, game.id);
  const boxes = s.boxes as Owner[];
  const h = s.h as boolean[];
  const v = s.v as boolean[];
  const { showIntro, startPlaying } = useIntro(boxes.every((b) => b === null));
  const [note, setNote] = useState<string | null>(null);

  const myTurn = mySlot === null || mySlot === s.turn;
  const scores: [number, number] = [
    boxes.filter((b) => b === 0).length,
    boxes.filter((b) => b === 1).length,
  ];

  function draw(kind: "h" | "v", index: number) {
    if (s.over || !myTurn) return;
    const nh = [...h];
    const nv = [...v];
    if (kind === "h") {
      if (nh[index]) return;
      nh[index] = true;
    } else {
      if (nv[index]) return;
      nv[index] = true;
    }

    const nb = [...boxes];
    let claimed = 0;
    for (let r = 0; r < CELLS; r++) {
      for (let c = 0; c < CELLS; c++) {
        if (nb[r * CELLS + c] !== null) continue;
        const closed =
          nh[hIndex(r, c)] && nh[hIndex(r + 1, c)] && nv[vIndex(r, c)] && nv[vIndex(r, c + 1)];
        if (closed) {
          nb[r * CELLS + c] = s.turn;
          claimed++;
        }
      }
    }

    const filled = nb.every((b) => b !== null);
    if (claimed) {
      fx.win();
      setNote(`${players[s.turn]!.name} closes ${claimed === 1 ? "a box" : `${claimed} boxes`} — go again`);
    } else {
      fx.tap();
      setNote(null);
    }
    patch({
      h: nh,
      v: nv,
      boxes: nb,
      turn: claimed ? s.turn : s.turn === 0 ? 1 : 0,
      over: filled,
    });
  }

  function rematch() {
    setNote(null);
    patch({ ...initial });
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective="Close more boxes than your partner on a nine-box grid."
          steps={[
            "Take turns drawing one line between two dots.",
            "Complete the fourth side of a box and it becomes yours.",
            "Closing a box earns another go. Most boxes wins.",
          ]}
          onStart={startPlaying}
          startLabel="Draw first line"
        />
      </GameFrame>
    );
  }

  if (s.over) {
    const winner = scores[0] >= scores[1] ? 0 : 1;
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={scores}
          headline={
            scores[0] === scores[1] ? "Split down the middle" : `${players[winner]!.name} boxes clever`
          }
          detail={`Boxes ${scores[0]}–${scores[1]}.`}
          scored
          onRematch={rematch}
          onExit={() =>
            onFinish({ summary: `${scores[0]}–${scores[1]} box wars`, myScore: scores[0], theirScore: scores[1] })
          }
        />
      </GameFrame>
    );
  }

  const step = 100 / CELLS;

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      header={<ScoreBar players={players} scores={scores} activeSlot={s.turn} />}
    >
      <TurnBanner player={players[s.turn]!} action={myTurn ? "draw a line" : "is drawing"} />

      <div className="mt-4 grid flex-1 place-content-center">
        <div className="relative aspect-square w-[min(84vw,360px)] rounded-3xl bg-card p-6 shadow-float">
          <div className="relative h-full w-full">
            {/* claimed boxes */}
            {boxes.map((owner, i) =>
              owner === null ? null : (
                <span
                  key={`b${i}`}
                  aria-hidden
                  className={cn(
                    "absolute rounded-lg",
                    owner === 0 ? "bg-primary/25" : "bg-sky/35",
                  )}
                  style={{
                    left: `${(i % CELLS) * step}%`,
                    top: `${Math.floor(i / CELLS) * step}%`,
                    width: `${step}%`,
                    height: `${step}%`,
                  }}
                />
              ),
            )}

            {/* horizontal edges */}
            {Array.from({ length: N }).map((_, r) =>
              Array.from({ length: CELLS }).map((__, c) => {
                const i = hIndex(r, c);
                return (
                  <button
                    key={`h${i}`}
                    type="button"
                    aria-label={`Horizontal line row ${r + 1} column ${c + 1}`}
                    onClick={() => draw("h", i)}
                    disabled={h[i] || !myTurn}
                    className="absolute -translate-y-1/2 rounded-full"
                    style={{
                      left: `${c * step}%`,
                      top: `${r * step}%`,
                      width: `${step}%`,
                      height: 22,
                    }}
                  >
                    <span
                      className={cn(
                        "block h-1.5 w-full rounded-full transition-colors",
                        h[i] ? "bg-night" : "bg-border",
                      )}
                      style={{ marginTop: 10 }}
                    />
                  </button>
                );
              }),
            )}

            {/* vertical edges */}
            {Array.from({ length: CELLS }).map((_, r) =>
              Array.from({ length: N }).map((__, c) => {
                const i = vIndex(r, c);
                return (
                  <button
                    key={`v${i}`}
                    type="button"
                    aria-label={`Vertical line row ${r + 1} column ${c + 1}`}
                    onClick={() => draw("v", i)}
                    disabled={v[i] || !myTurn}
                    className="absolute -translate-x-1/2 rounded-full"
                    style={{
                      top: `${r * step}%`,
                      left: `${c * step}%`,
                      height: `${step}%`,
                      width: 22,
                    }}
                  >
                    <span
                      className={cn(
                        "block h-full w-1.5 rounded-full transition-colors",
                        v[i] ? "bg-night" : "bg-border",
                      )}
                      style={{ marginLeft: 10 }}
                    />
                  </button>
                );
              }),
            )}

            {/* dots */}
            {Array.from({ length: N }).map((_, r) =>
              Array.from({ length: N }).map((__, c) => (
                <span
                  key={`d${r}-${c}`}
                  aria-hidden
                  className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-night"
                  style={{ left: `${c * step}%`, top: `${r * step}%` }}
                />
              )),
            )}
          </div>
        </div>
      </div>

      {note ? (
        <div className="mt-3">
          <FeedbackBanner tone="success">{note}</FeedbackBanner>
        </div>
      ) : null}
    </GameFrame>
  );
}
