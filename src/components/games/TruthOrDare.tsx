import { Button } from "@/components/ui/button";
import { GameFrame, GameSummary, PromptCard } from "@/components/koupl/GameShell";
import { ScoreBar, TurnBanner } from "@/components/koupl/ui";
import { useSharedState } from "@/lib/koupl/useRoom";
import type { GameProps } from "./shared";

const ROUNDS = 12;

type State = {
  i: number;
  pick: "" | "truth" | "dare";
  s0: number;
  s1: number;
  done: boolean;
};

const initial: State = { i: 0, pick: "", s0: 0, s1: 0, done: false };

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
  const deck = s.pick === "truth" ? truths : dares;
  const card = deck[Math.floor(s.i / 2) % deck.length]!;

  function resolve(completed: boolean) {
    const done = s.i + 1 >= ROUNDS;
    patch({
      i: s.i + 1,
      pick: "",
      s0: s.s0 + (completed && active === 0 ? 1 : 0),
      s1: s.s1 + (completed && active === 1 ? 1 : 0),
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
          detail="Points for everything actually completed. Chickening out is allowed, just costly."
          scored
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
        <div className="mt-6 grid flex-1 grid-rows-2 gap-4">
          <button
            type="button"
            disabled={!myTurn}
            onClick={() => patch({ pick: "truth" })}
            className="press flex flex-col items-center justify-center rounded-3xl bg-sky text-sky-foreground shadow-float disabled:opacity-55"
          >
            <span className="text-5xl" aria-hidden>
              💬
            </span>
            <span className="font-display mt-2 text-2xl font-bold">Truth</span>
            <span className="text-xs opacity-80">Answer honestly</span>
          </button>
          <button
            type="button"
            disabled={!myTurn}
            onClick={() => patch({ pick: "dare" })}
            className="press flex flex-col items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-float disabled:opacity-55"
          >
            <span className="text-5xl" aria-hidden>
              ⚡️
            </span>
            <span className="font-display mt-2 text-2xl font-bold">Dare</span>
            <span className="text-xs opacity-80">Do it right now</span>
          </button>
        </div>
      ) : (
        <>
          <div className="mt-5">
            <PromptCard tone={s.pick === "truth" ? "sky" : "primary"} animateKey={s.i}>
              <span className="mb-2 text-xs font-bold uppercase tracking-widest opacity-80">
                {s.pick}
              </span>
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
              Did it — +1 point
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
