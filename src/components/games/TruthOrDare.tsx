import { MessageCircleQuestion, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GameFrame, GameSummary, PromptCard, StatPill } from "@/components/koupl/GameShell";
import { ScoreBar, TurnBanner } from "@/components/koupl/ui";
import { useSharedState } from "@/lib/koupl/useRoom";
import type { GameProps } from "./shared";

const ROUNDS = 12;

type State = {
  i: number;
  pick: "" | "truth" | "dare";
  tUsed: number;
  dUsed: number;
  truths0: number;
  dares0: number;
  truths1: number;
  dares1: number;
  s0: number;
  s1: number;
  done: boolean;
};

const initial: State = {
  i: 0,
  pick: "",
  tUsed: 0,
  dUsed: 0,
  truths0: 0,
  dares0: 0,
  truths1: 0,
  dares1: 0,
  s0: 0,
  s1: 0,
  done: false,
};

export function TruthOrDare({
  game,
  players,
  mySlot,
  room,
  onFinish,
  onExit,
  truths,
  dares,
}: GameProps & { truths: string[]; dares: string[] }) {
  const { value: s, patch, reset } = useSharedState<State>(initial, room, game.id);
  const active: 0 | 1 = (s.i % 2) as 0 | 1;
  const myTurn = mySlot === null || mySlot === active;
  // Each pick consumes its own deck, so no card is repeated back-to-back.
  const card =
    s.pick === "truth"
      ? truths[s.tUsed % truths.length]!
      : dares[s.dUsed % dares.length]!;

  function pickCard(kind: "truth" | "dare") {
    patch({
      pick: kind,
      ...(kind === "truth"
        ? active === 0
          ? { truths0: s.truths0 + 1 }
          : { truths1: s.truths1 + 1 }
        : active === 0
          ? { dares0: s.dares0 + 1 }
          : { dares1: s.dares1 + 1 }),
    });
  }

  function resolve(completed: boolean) {
    const done = s.i + 1 >= ROUNDS;
    const points = completed ? (s.pick === "dare" ? 2 : 1) : 0;
    patch({
      i: s.i + 1,
      pick: "",
      tUsed: s.pick === "truth" ? s.tUsed + 1 : s.tUsed,
      dUsed: s.pick === "dare" ? s.dUsed + 1 : s.dUsed,
      s0: s.s0 + (active === 0 ? points : 0),
      s1: s.s1 + (active === 1 ? points : 0),
      done,
    });
  }

  if (s.done) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={[s.s0, s.s1]}
          headline={s.s0 === s.s1 ? "Equally brave" : `${players[s.s0 > s.s1 ? 0 : 1].name} is bolder`}
          detail="Truths are worth one point, dares two. Chickening out is allowed, just costly."
          scored
          stats={[
            { label: `${players[0].name}`, value: `${s.truths0}T · ${s.dares0}D` },
            { label: `${players[1].name}`, value: `${s.truths1}T · ${s.dares1}D` },
          ]}
          onRematch={() => reset(initial)}
          onExit={() =>
            onFinish({
              summary: `${s.s0}–${s.s1} completed`,
              myScore: mySlot === 1 ? s.s1 : s.s0,
              theirScore: mySlot === 1 ? s.s0 : s.s1,
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
      step={s.i}
      total={ROUNDS}
      header={<ScoreBar players={players} scores={[s.s0, s.s1]} activeSlot={active} />}
    >
      <div className="mt-1">
        <TurnBanner player={players[active]} action={myTurn ? "your call" : "is deciding"} />
      </div>

      {s.pick === "" ? (
        <div className="mt-5 grid flex-1 grid-rows-2 gap-4">
          <button
            type="button"
            disabled={!myTurn}
            onClick={() => pickCard("truth")}
            className="press relative flex flex-col items-center justify-center overflow-hidden rounded-[1.75rem] bg-sky text-sky-foreground shadow-float disabled:opacity-55"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-current opacity-10"
            />
            <MessageCircleQuestion className="relative h-11 w-11" aria-hidden />
            <span className="font-display relative mt-2 text-2xl font-bold">Truth</span>
            <span className="relative text-xs opacity-80">Answer honestly · 1 point</span>
          </button>
          <button
            type="button"
            disabled={!myTurn}
            onClick={() => pickCard("dare")}
            className="press relative flex flex-col items-center justify-center overflow-hidden rounded-[1.75rem] bg-primary text-primary-foreground shadow-float disabled:opacity-55"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-current opacity-10"
            />
            <Zap className="relative h-11 w-11" aria-hidden />
            <span className="font-display relative mt-2 text-2xl font-bold">Dare</span>
            <span className="relative text-xs opacity-80">Do it right now · 2 points</span>
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 flex justify-center">
            <StatPill
              label={s.pick === "truth" ? "Truth" : "Dare"}
              value={s.pick === "truth" ? "1 point" : "2 points"}
              tone="primary"
            />
          </div>
          <div className="mt-3">
            <PromptCard tone={s.pick === "truth" ? "sky" : "primary"} animateKey={`${s.i}-${s.pick}`}>
              <p className="font-display text-xl font-bold leading-snug text-balance-tight">
                {card}
              </p>
            </PromptCard>
          </div>
          <div className="mt-auto flex flex-col gap-2 pt-6">
            <Button
              size="lg"
              className="h-14 rounded-2xl text-base"
              disabled={!myTurn}
              onClick={() => resolve(true)}
            >
              Did it — +{s.pick === "dare" ? 2 : 1}
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="h-12 rounded-2xl text-base"
              disabled={!myTurn}
              onClick={() => resolve(false)}
            >
              Chicken out
            </Button>
          </div>
        </>
      )}
    </GameFrame>
  );
}
