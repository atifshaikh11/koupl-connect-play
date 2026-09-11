import { useEffect, useState } from "react";
import { Crosshair, Waves } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FeedbackBanner, GameFrame, GameIntro, GameSummary } from "@/components/koupl/GameShell";
import { AvatarBubble, ScoreBar, TurnBanner } from "@/components/koupl/ui";
import { useSharedState } from "@/lib/koupl/useRoom";
import { cn } from "@/lib/utils";
import { useGameFx, useIntro } from "./shared";
import type { GameProps } from "./shared";

const SIZE = 6;
const FLEET = [3, 2, 2];
const CELLS = SIZE * SIZE;
const TOTAL_HITS = FLEET.reduce((a, b) => a + b, 0);

type State = {
  /** Comma separated cell indexes holding each player's fleet. */
  fleet0: string;
  fleet1: string;
  /** Comma separated cells each player has fired at. */
  shots0: string;
  shots1: string;
  turn: 0 | 1;
  last: string;
  passed: boolean;
  done: boolean;
};

const initial: State = {
  fleet0: "",
  fleet1: "",
  shots0: "",
  shots1: "",
  turn: 0,
  last: "",
  passed: false,
  done: false,
};

function deployFleet(): string {
  const taken = new Set<number>();
  for (const len of FLEET) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const horizontal = Math.random() < 0.5;
      const row = Math.floor(Math.random() * SIZE);
      const col = Math.floor(Math.random() * SIZE);
      if (horizontal && col + len > SIZE) continue;
      if (!horizontal && row + len > SIZE) continue;
      const cells: number[] = [];
      for (let i = 0; i < len; i++) {
        cells.push(horizontal ? row * SIZE + col + i : (row + i) * SIZE + col);
      }
      if (cells.some((c) => taken.has(c))) continue;
      cells.forEach((c) => taken.add(c));
      break;
    }
  }
  return [...taken].join(",");
}

const list = (s: string) => (s ? s.split(",").map(Number) : []);

export function BattleshipBlitz({ game, players, mySlot, room, onFinish, onExit }: GameProps) {
  const fx = useGameFx();
  const { value: s, patch, reset } = useSharedState<State>(initial, room, game.id);
  const { showIntro, startPlaying } = useIntro(!s.fleet0 || (!s.shots0 && !s.shots1));
  const [handedOver, setHandedOver] = useState(false);

  useEffect(() => {
    if (!s.fleet0 || !s.fleet1) patch({ fleet0: deployFleet(), fleet1: deployFleet() });
  }, [s.fleet0, s.fleet1, patch]);

  const attacker = s.turn;
  const defender: 0 | 1 = attacker === 0 ? 1 : 0;
  const myTurn = mySlot === null || mySlot === attacker;
  const enemyFleet = list(defender === 0 ? s.fleet0 : s.fleet1);
  const myShots = list(attacker === 0 ? s.shots0 : s.shots1);
  const hits0 = list(s.shots0).filter((c) => list(s.fleet1).includes(c)).length;
  const hits1 = list(s.shots1).filter((c) => list(s.fleet0).includes(c)).length;

  // On one phone, hide the board while the device changes hands.
  const needsPass = mySlot === null && !handedOver && myShots.length > 0;

  function fire(cell: number) {
    if (!myTurn || s.done || myShots.includes(cell)) return;
    const hit = enemyFleet.includes(cell);
    const shots = [...myShots, cell];
    const scored = shots.filter((c) => enemyFleet.includes(c)).length;
    if (hit) fx.win();
    else fx.tap();
    patch({
      ...(attacker === 0 ? { shots0: shots.join(",") } : { shots1: shots.join(",") }),
      last: hit ? `Direct hit on ${players[defender]!.name}'s fleet` : "Splash — nothing there",
      turn: hit ? attacker : defender,
      done: scored >= TOTAL_HITS,
    });
    if (!hit) setHandedOver(false);
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective="Two hidden fleets on a 6×6 sea. Find all three of their ships before they find yours."
          steps={[
            "Fleets deploy automatically — three ships each, hidden from view.",
            "Tap a square to fire. A hit keeps your turn going.",
            "Miss and the phone passes over. First to sink everything wins.",
          ]}
          onStart={startPlaying}
          startLabel="Deploy fleets"
        />
      </GameFrame>
    );
  }

  if (s.done) {
    const winner = hits0 >= TOTAL_HITS ? 0 : 1;
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={[hits0, hits1]}
          headline={`${players[winner]!.name} sinks the fleet`}
          detail={`Hits landed: ${hits0}–${hits1}.`}
          scored
          stats={[
            { label: "Shots fired", value: list(s.shots0).length + list(s.shots1).length },
          ]}
          onRematch={() => {
            setHandedOver(false);
            reset({ ...initial, fleet0: deployFleet(), fleet1: deployFleet() });
          }}
          onExit={() =>
            onFinish({
              summary: `${hits0}–${hits1} hits landed`,
              myScore: mySlot === 1 ? hits1 : hits0,
              theirScore: mySlot === 1 ? hits0 : hits1,
            })
          }
        />
      </GameFrame>
    );
  }

  if (needsPass) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <div className="surface animate-pop-in m-auto w-full p-8 text-center">
          <AvatarBubble emoji={players[attacker]!.avatar} size="lg" />
          <p className="font-display mt-3 text-xl font-bold">Pass to {players[attacker]!.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">Their sea is hidden until you tap.</p>
          <Button
            size="lg"
            className="mt-5 h-14 w-full rounded-2xl text-base"
            onClick={() => setHandedOver(true)}
          >
            I'm at the controls
          </Button>
        </div>
      </GameFrame>
    );
  }

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      header={<ScoreBar players={players} scores={[hits0, hits1]} activeSlot={attacker} />}
    >
      <div className="mt-1">
        <TurnBanner
          player={players[attacker]!}
          action={myTurn ? `fire at ${players[defender]!.name}'s sea` : "is taking aim"}
        />
      </div>

      <div className="mt-4 rounded-[1.75rem] bg-night p-3 shadow-float">
        <div className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: CELLS }).map((_, cell) => {
            const shot = myShots.includes(cell);
            const hit = shot && enemyFleet.includes(cell);
            return (
              <button
                key={cell}
                type="button"
                aria-label={`Fire at row ${Math.floor(cell / SIZE) + 1}, column ${(cell % SIZE) + 1}`}
                disabled={!myTurn || shot}
                onClick={() => fire(cell)}
                className={cn(
                  "press grid aspect-square place-items-center rounded-lg transition-colors",
                  hit
                    ? "bg-primary text-primary-foreground"
                    : shot
                      ? "bg-night-soft text-night-muted"
                      : "bg-sky/25 text-sky-foreground hover:bg-sky/40",
                )}
              >
                {hit ? (
                  <Crosshair className="h-4 w-4" aria-hidden />
                ) : shot ? (
                  <Waves className="h-4 w-4" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-bold">
        {players.map((p, i) => (
          <div key={i} className="surface p-3">
            <p className="truncate text-muted-foreground">{p.name} hit</p>
            <p className="font-display mt-1 text-lg">
              {(i === 0 ? hits0 : hits1)}/{TOTAL_HITS}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4">
        {s.last ? (
          <FeedbackBanner
            tone={s.last.startsWith("Direct") ? "success" : "muted"}
            animateKey={s.shots0 + s.shots1}
          >
            {s.last}
          </FeedbackBanner>
        ) : null}
      </div>
    </GameFrame>
  );
}
