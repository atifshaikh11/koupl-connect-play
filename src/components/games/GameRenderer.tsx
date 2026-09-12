import type { ReactNode } from "react";

import { DualChoiceGame, type DualRound } from "@/components/games/DualChoiceGame";
import { FourInARow } from "@/components/games/FourInARow";
import { BasketballRivalry } from "@/components/games/BasketballRivalry";
import { PillowTalk } from "@/components/games/PillowTalk";
import { TruthOrDare } from "@/components/games/TruthOrDare";
import { CoupleQuiz } from "@/components/games/CoupleQuiz";
import { AirHockeyDuel } from "@/components/games/AirHockeyDuel";
import { ReactionClash } from "@/components/games/ReactionClash";
import { MemoryMatchDuel } from "@/components/games/MemoryMatchDuel";
import { MiniGolfDuel } from "@/components/games/MiniGolfDuel";
import { BattleshipBlitz } from "@/components/games/BattleshipBlitz";
import { TapRaceDash } from "@/components/games/TapRaceDash";
import { SumoTug } from "@/components/games/SumoTug";
import { GridClash } from "@/components/games/GridClash";
import { BoxWars } from "@/components/games/BoxWars";
import { PenaltyShootout } from "@/components/games/PenaltyShootout";
import { EchoSequence } from "@/components/games/EchoSequence";
import { OddOneOut } from "@/components/games/OddOneOut";
import { NumberHunt } from "@/components/games/NumberHunt";
import { BowlingRoll } from "@/components/games/BowlingRoll";
import { LastStick } from "@/components/games/LastStick";
import { BubblePopPanic } from "@/components/games/BubblePopPanic";
import { GuessTheWord } from "@/components/games/GuessTheWord";
import { EmojiDecode } from "@/components/games/EmojiDecode";
import { TwoTruthsAndALie } from "@/components/games/TwoTruthsAndALie";
import { RateMyGuess } from "@/components/games/RateMyGuess";
import type { GameProps } from "@/components/games/shared";
import {
  COUPLE_QUIZ,
  DARES,
  NEVER_HAVE_I_EVER,
  PILLOW_TALK,
  THIS_OR_THAT,
  TRUTHS,
  WHOS_MORE_LIKELY,
  shuffle,
} from "@/lib/koupl/games";

const ROUNDS = 10;

/**
 * Renders the screen for any of the games. Shared by one-phone play and the
 * persistent Couple Room, so both paths stay in sync.
 */
export function GameRenderer({ base, seed }: { base: GameProps; seed: number }): ReactNode {
  const { game, players } = base;

  switch (game.id) {
    case "never-have-i-ever": {
      const rounds: DualRound[] = shuffle(NEVER_HAVE_I_EVER, seed)
        .slice(0, ROUNDS)
        .map((p, i) => ({
          key: `nhie-${i}`,
          prompt: p,
          options: [
            { label: "I have", value: "have" },
            { label: "Never", value: "never" },
          ],
        }));
      return (
        <DualChoiceGame
          {...base}
          rounds={rounds}
          tone="primary"
          layout="confess"
          objective="Ten confessions. Answer honestly at the same time — every matching answer scores a point for the two of you."
          matchCopy={{
            hit: "Same answer — point for the pair.",
            miss: "Different answers. Story time.",
          }}
        />
      );
    }
    case "whos-more-likely": {
      const rounds: DualRound[] = shuffle(WHOS_MORE_LIKELY, seed)
        .slice(0, ROUNDS)
        .map((p, i) => ({
          key: `wml-${i}`,
          prompt: p,
          options: [
            { label: players[0].name, value: "p0" },
            { label: players[1].name, value: "p1" },
          ],
        }));
      return (
        <DualChoiceGame
          {...base}
          rounds={rounds}
          tone="berry"
          layout="point"
          objective="Ten rounds of finger-pointing. Point at the same person and you both score."
          matchCopy={{
            hit: "You both pointed the same way.",
            miss: "You each pointed at the other. Bold.",
          }}
          summaryNoun="agreements"
        />
      );
    }
    case "this-or-that": {
      const rounds: DualRound[] = shuffle(THIS_OR_THAT, seed)
        .slice(0, ROUNDS)
        .map((c, i) => ({
          key: `tot-${i}`,
          prompt: `${c.a} or ${c.b}?`,
          options: [
            { label: c.a, value: c.a },
            { label: c.b, value: c.b },
          ],
        }));
      return (
        <DualChoiceGame
          {...base}
          rounds={rounds}
          tone="mint"
          layout="split"
          objective="Ten split-second choices. Pick your side in secret, reveal together, and see how aligned your tastes really are."
          matchCopy={{ hit: "Same pick. Frighteningly aligned.", miss: "Split decision." }}
        />
      );
    }
    case "four-in-a-row":
      return <FourInARow {...base} />;
    case "basketball-rivalry":
      return <BasketballRivalry {...base} />;
    case "pillow-talk":
      return <PillowTalk {...base} cards={shuffle(PILLOW_TALK, seed).slice(0, 12)} />;
    case "truth-or-dare":
      return <TruthOrDare {...base} truths={shuffle(TRUTHS, seed)} dares={shuffle(DARES, seed)} />;
    case "couple-quiz":
      return <CoupleQuiz {...base} questions={shuffle(COUPLE_QUIZ, seed).slice(0, 10)} />;
    case "air-hockey-duel":
      return <AirHockeyDuel {...base} />;
    case "reaction-clash":
      return <ReactionClash {...base} />;
    case "memory-match-duel":
      return <MemoryMatchDuel {...base} />;
    case "mini-golf-duel":
      return <MiniGolfDuel {...base} />;
    case "battleship-blitz":
      return <BattleshipBlitz {...base} />;
    case "tap-race-dash":
      return <TapRaceDash {...base} />;
    case "sumo-tug":
      return <SumoTug {...base} />;
    case "grid-clash":
      return <GridClash {...base} />;
    case "box-wars":
      return <BoxWars {...base} />;
    case "penalty-shootout":
      return <PenaltyShootout {...base} />;
    case "echo-sequence":
      return <EchoSequence {...base} />;
    case "odd-one-out":
      return <OddOneOut {...base} />;
    case "number-hunt":
      return <NumberHunt {...base} />;
    case "bowling-roll":
      return <BowlingRoll {...base} />;
    case "last-stick":
      return <LastStick {...base} />;
    case "bubble-pop-panic":
      return <BubblePopPanic {...base} />;
    case "guess-the-word":
      return <GuessTheWord {...base} />;
    case "emoji-decode":
      return <EmojiDecode {...base} />;
    case "two-truths":
      return <TwoTruthsAndALie {...base} />;
    case "rate-my-guess":
      return <RateMyGuess {...base} />;
    default:
      return null;
  }
}
