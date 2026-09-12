import type { GameCategory, GameDef } from "./types";

export const GAMES: GameDef[] = [
  {
    id: "never-have-i-ever",
    title: "Never Have I Ever",
    tagline: "Confess, laugh, repeat",
    emoji: "🙈",
    category: "quick",
    accent: "primary",
    players: "2 players",
    minutes: "5–10 min",
    featured: true,
    quick: true,
    online: "turns",
    scored: true,
    description:
      "A card flips, you both tap whether you've done it. Matching confessions score points for the two of you.",
  },
  {
    id: "whos-more-likely",
    title: "Who's More Likely",
    tagline: "Point the finger",
    emoji: "👉",
    category: "quick",
    accent: "berry",
    players: "2 players",
    minutes: "5–10 min",
    featured: true,
    quick: true,
    online: "turns",
    scored: true,
    description:
      "Each round asks who's more likely to do something. Agree and you both score. Disagree and you argue about it.",
  },
  {
    id: "four-in-a-row",
    title: "Four in a Row",
    tagline: "Drop, block, brag",
    emoji: "🔴",
    category: "competitive",
    accent: "sky",
    players: "2 players",
    minutes: "3–6 min",
    featured: true,
    quick: true,
    online: "turns",
    scored: true,
    description:
      "Classic drop-and-connect strategy with a couples twist: loser owes a favour.",
  },
  {
    id: "basketball-rivalry",
    title: "Basketball Rivalry",
    tagline: "Ten shots each",
    emoji: "🏀",
    category: "competitive",
    accent: "sunny",
    players: "2 players",
    minutes: "3–5 min",
    quick: true,
    online: "turns",
    scored: true,
    description:
      "Time your tap, sink the shot. Ten attempts each and the higher score takes the trophy.",
  },
  {
    id: "pillow-talk",
    title: "Pillow Talk",
    tagline: "Slow, warm questions",
    emoji: "🌙",
    category: "conversation",
    accent: "berry",
    players: "2 players",
    minutes: "10–20 min",
    online: "turns",
    scored: false,
    description:
      "Unhurried questions for late evenings. No points, no timer — just take turns and actually listen.",
  },
  {
    id: "this-or-that",
    title: "This or That",
    tagline: "Pick a side",
    emoji: "⚖️",
    category: "cooperative",
    accent: "mint",
    players: "2 players",
    minutes: "4–8 min",
    online: "turns",
    scored: true,
    description:
      "Two options, one tap each. Reveal together and see how aligned your tastes really are.",
  },
  {
    id: "truth-or-dare",
    title: "Truth or Dare",
    tagline: "Choose your risk",
    emoji: "🎲",
    category: "competitive",
    accent: "primary",
    players: "2 players",
    minutes: "10–15 min",
    online: "turns",
    scored: true,
    description:
      "Spin between honest answers and playful dares. Complete it for a point, chicken out for none.",
  },
  {
    id: "couple-quiz",
    title: "Couple Quiz",
    tagline: "How well do you know them?",
    emoji: "💡",
    category: "cooperative",
    accent: "sky",
    players: "2 players",
    minutes: "6–12 min",
    online: "turns",
    scored: true,
    description:
      "One of you answers about yourself, the other guesses. Swap every round and count the hits.",
  },
  {
    id: "air-hockey-duel",
    title: "Air Hockey Duel",
    tagline: "Flat phone, fast puck",
    emoji: "🏒",
    category: "arcade",
    accent: "sky",
    players: "2 players",
    minutes: "1–2 min",
    featured: true,
    quick: true,
    battle: true,
    online: "local",
    scored: true,
    description:
      "Lay the phone flat between you, grab a half each and slide your paddle. First to five goals wins.",
  },
  {
    id: "reaction-clash",
    title: "Reaction Clash",
    tagline: "Fastest thumb wins",
    emoji: "⚡",
    category: "reflex",
    accent: "sunny",
    players: "2 players",
    minutes: "1 min",
    quick: true,
    battle: true,
    online: "local",
    scored: true,
    description:
      "Both halves flash at a random moment. Tap first to take the round — jump early and you hand it over.",
  },
  {
    id: "memory-match-duel",
    title: "Memory Match Duel",
    tagline: "Pairs, turns, bragging",
    emoji: "🧠",
    category: "puzzle",
    accent: "berry",
    players: "2 players",
    minutes: "2–4 min",
    quick: true,
    online: "turns",
    scored: true,
    description:
      "Sixteen cards, eight pairs. Match to score and go again — two in a row earns a bonus point.",
  },
  {
    id: "mini-golf-duel",
    title: "Mini Golf Duel",
    tagline: "Drag, putt, sink",
    emoji: "⛳",
    category: "sports",
    accent: "mint",
    players: "2 players",
    minutes: "3–5 min",
    online: "local",
    scored: true,
    description:
      "Five short holes with bouncing walls. Drag back to aim and putt — the lowest stroke total wins.",
  },
  {
    id: "battleship-blitz",
    title: "Battleship Blitz",
    tagline: "Hidden fleets, 6×6 sea",
    emoji: "🚢",
    category: "board",
    accent: "sky",
    players: "2 players",
    minutes: "3–6 min",
    online: "turns",
    scored: true,
    description:
      "Three hidden ships each. Fire a shot, keep your turn on a hit, and sink their fleet first.",
  },
  {
    id: "tap-race-dash",
    title: "Tap Race Dash",
    tagline: "Thumbs at dawn",
    emoji: "👍",
    category: "reflex",
    accent: "primary",
    players: "2 players",
    minutes: "1 min",
    quick: true,
    battle: true,
    online: "local",
    scored: true,
    description:
      "Three eight-second bursts. Hammer your half of the screen and out-tap your partner.",
  },
  {
    id: "sumo-tug",
    title: "Sumo Tug",
    tagline: "Pull them over the line",
    emoji: "🪢",
    category: "arcade",
    accent: "sunny",
    players: "2 players",
    minutes: "1–2 min",
    quick: true,
    battle: true,
    online: "local",
    scored: true,
    description:
      "A rope sits between you. Tap fast to drag the marker into their side. Best of three.",
  },
  {
    id: "grid-clash",
    title: "Grid Clash",
    tagline: "Three in a row, five rounds",
    emoji: "❌",
    category: "board",
    accent: "sky",
    players: "2 players",
    minutes: "3–5 min",
    quick: true,
    online: "turns",
    scored: true,
    description:
      "A fast 3×3 duel played over five rounds, so one lucky win is never enough.",
  },
  {
    id: "box-wars",
    title: "Box Wars",
    tagline: "Close the box, go again",
    emoji: "🔲",
    category: "board",
    accent: "mint",
    players: "2 players",
    minutes: "4–7 min",
    online: "turns",
    scored: true,
    description:
      "Join the dots one line at a time. Complete a box and you keep the turn.",
  },
  {
    id: "penalty-shootout",
    title: "Penalty Shootout",
    tagline: "Shooter versus keeper",
    emoji: "🥅",
    category: "sports",
    accent: "berry",
    players: "2 players",
    minutes: "2–4 min",
    quick: true,
    battle: true,
    online: "local",
    scored: true,
    description:
      "Ten kicks. Pick your corner, guess their dive, and see who holds their nerve.",
  },
  {
    id: "echo-sequence",
    title: "Echo Sequence",
    tagline: "Remember the pattern",
    emoji: "🎵",
    category: "puzzle",
    accent: "berry",
    players: "2 players",
    minutes: "2–4 min",
    quick: true,
    online: "local",
    scored: true,
    description:
      "Colours light up in order and the chain gets longer every turn. Three slips and you're out.",
  },
  {
    id: "odd-one-out",
    title: "Odd One Out",
    tagline: "Spot the shade",
    emoji: "🎨",
    category: "reflex",
    accent: "mint",
    players: "2 players",
    minutes: "2–3 min",
    quick: true,
    battle: true,
    online: "local",
    scored: true,
    description:
      "One tile is a fraction off. Eight grids, getting harder, first eye to catch it scores.",
  },
  {
    id: "number-hunt",
    title: "Number Hunt",
    tagline: "One to five, fast",
    emoji: "🔢",
    category: "reflex",
    accent: "sky",
    players: "2 players",
    minutes: "2–3 min",
    quick: true,
    online: "local",
    scored: true,
    description:
      "Find the numbers in order in a scrambled grid. Wrong taps count against you.",
  },
  {
    id: "bowling-roll",
    title: "Bowling Roll",
    tagline: "Stop the meter dead centre",
    emoji: "🎳",
    category: "sports",
    accent: "sunny",
    players: "2 players",
    minutes: "3–5 min",
    online: "local",
    scored: true,
    description:
      "Five frames each. Time the power marker perfectly and knock down all ten pins.",
  },
  {
    id: "last-stick",
    title: "Last Stick",
    tagline: "Don't take the final one",
    emoji: "🥢",
    category: "board",
    accent: "primary",
    players: "2 players",
    minutes: "3–6 min",
    online: "turns",
    scored: true,
    description:
      "Remove sticks from a single row each turn. Whoever takes the last one loses the round.",
  },
  {
    id: "bubble-pop-panic",
    title: "Bubble Pop Panic",
    tagline: "Fifteen frantic seconds",
    emoji: "🫧",
    category: "arcade",
    accent: "primary",
    players: "2 players",
    minutes: "1–2 min",
    quick: true,
    battle: true,
    online: "local",
    scored: true,
    description:
      "Pop coral bubbles as fast as you can and dodge the dark ones. Two turns each.",
  },
  {
    id: "guess-the-word",
    title: "Guess the Word",
    tagline: "Letters and lives",
    emoji: "🔤",
    category: "puzzle",
    accent: "sky",
    players: "2 players",
    minutes: "4–7 min",
    online: "local",
    scored: true,
    description:
      "Reveal the hidden word letter by letter. Leftover lives become your points.",
  },
  {
    id: "emoji-decode",
    title: "Emoji Decode",
    tagline: "Read between the icons",
    emoji: "🧩",
    category: "puzzle",
    accent: "berry",
    players: "2 players",
    minutes: "3–5 min",
    quick: true,
    online: "local",
    scored: true,
    description:
      "Short emoji clues hide everyday phrases. Pick the right one to take the point.",
  },
  {
    id: "two-truths",
    title: "Two Truths and a Lie",
    tagline: "Bluff them",
    emoji: "🤥",
    category: "conversation",
    accent: "primary",
    players: "2 players",
    minutes: "6–12 min",
    online: "local",
    scored: true,
    description:
      "Write three statements about yourself and hide one lie. Catching it scores, so does fooling them.",
  },
  {
    id: "rate-my-guess",
    title: "Rate My Guess",
    tagline: "How well do you read them?",
    emoji: "🎚️",
    category: "cooperative",
    accent: "mint",
    players: "2 players",
    minutes: "5–8 min",
    online: "local",
    scored: true,
    description:
      "Rate yourself on a slider, then see how close your partner lands to your number.",
  },
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);

/** Three-step "how to play" shown on each game detail screen. Original wording. */
export const HOW_TO: Record<string, string[]> = {
  "never-have-i-ever": [
    "A confession card appears. Read it out loud together.",
    "Each of you taps “I have” or “Never” — hidden until you both answer.",
    "Matching answers score a point for the pair. Mismatches earn a story.",
  ],
  "whos-more-likely": [
    "Read the round out loud, then point with a tap.",
    "You each choose the person you think fits best.",
    "Agree and you both score. Disagree and you defend your case.",
  ],
  "four-in-a-row": [
    "Take turns dropping a disc into a column.",
    "Line up four of yours across, down or diagonally.",
    "First to connect four wins the round — then hit rematch.",
  ],
  "basketball-rivalry": [
    "The hoop slides side to side. Tap to shoot.",
    "Time it so the ball meets the moving hoop.",
    "Ten shots each. Highest score takes the bragging rights.",
  ],
  "pillow-talk": [
    "One question at a time, no timer, no score.",
    "Whoever's turn it is reads it out and answers first.",
    "Swipe to the next card whenever the conversation runs its course.",
  ],
  "this-or-that": [
    "Two options land on screen. Pick your side.",
    "Both answers stay hidden until you've each chosen.",
    "Every match adds a point to your shared alignment score.",
  ],
  "truth-or-dare": [
    "On your turn, choose truth or dare.",
    "Answer honestly or complete the dare to bank a point.",
    "Pass if you must — it just costs you the point.",
  ],
  "couple-quiz": [
    "One of you answers a question about yourself.",
    "The other guesses what they picked.",
    "Roles swap each round. Correct guesses score.",
  ],
  "air-hockey-duel": [
    "Put the phone flat on a table between you.",
    "Each of you drags a paddle inside your own half — you can both move at once.",
    "Knock the puck through their goal mouth. First to five.",
  ],
  "reaction-clash": [
    "Thumb on your own half, eyes on the screen.",
    "When both halves flash green, tap immediately.",
    "Tapping before the flash gives the point away. Seven flashes decide it.",
  ],
  "memory-match-duel": [
    "Flip two cards on your turn.",
    "A pair scores and you keep the turn; a miss passes the phone.",
    "Back-to-back pairs earn a bonus point.",
  ],
  "mini-golf-duel": [
    "Drag backwards from the ball to set aim and power.",
    "Release to putt — walls bounce and the cup only takes a slow ball.",
    "Both of you play all five holes; fewest strokes wins.",
  ],
  "battleship-blitz": [
    "Three ships each are hidden on a 6×6 sea.",
    "Tap a square to fire. Hits let you fire again.",
    "Sink all of their ships before they sink yours.",
  ],
  "tap-race-dash": [
    "Each of you takes one half of the screen.",
    "When the round starts, tap your half as fast as you can for eight seconds.",
    "Three rounds — most round wins takes it.",
  ],
  "sumo-tug": [
    "The rope marker starts dead centre.",
    "Tap your side to pull it towards you.",
    "Drag it all the way over to win the round. Best of three.",
  ],
  "grid-clash": [
    "Take turns claiming squares on the 3×3 board.",
    "Three in a row wins the round; a full board is a draw.",
    "Five rounds decide the match.",
  ],
  "box-wars": [
    "Tap the gap between two dots to draw a line.",
    "Complete the fourth side of a box to claim it — and go again.",
    "Most boxes when the grid is full wins.",
  ],
  "penalty-shootout": [
    "The shooter picks a corner while the keeper looks away.",
    "The keeper then picks a corner to dive into.",
    "Ten kicks in total, alternating roles. Most goals wins.",
  ],
  "echo-sequence": [
    "Watch the pads light up in order.",
    "Repeat the pattern back exactly.",
    "Each clean turn adds a pad. Three slips ends it.",
  ],
  "odd-one-out": [
    "One tile in the grid is a slightly different shade.",
    "Tap it, then mark whose finger got there first.",
    "Wrong taps hand the point over. Eight grids in total.",
  ],
  "number-hunt": [
    "On your turn, tap 1, 2, 3, 4 and 5 in order.",
    "Wrong taps are counted against you.",
    "Six turns. Most clean runs wins, fewest misses breaks ties.",
  ],
  "bowling-roll": [
    "A marker slides across the power bar.",
    "Tap roll to stop it — dead centre knocks down all ten pins.",
    "Five frames each; highest pin total wins.",
  ],
  "last-stick": [
    "On your turn take any number of sticks, but from one row only.",
    "Tap end turn to hand over.",
    "Whoever takes the very last stick loses the round.",
  ],
  "bubble-pop-panic": [
    "You get fifteen seconds on the clock.",
    "Pop every coral bubble; dark bubbles cost two points.",
    "Two turns each, highest total wins.",
  ],
  "guess-the-word": [
    "Tap letters to reveal the hidden word.",
    "Six lives — each wrong letter costs one.",
    "Solve it and bank your remaining lives as points.",
  ],
  "emoji-decode": [
    "A short emoji clue appears on your turn.",
    "Choose the everyday phrase it's hiding.",
    "Correct decodes score. Turns alternate each round.",
  ],
  "two-truths": [
    "Write three statements about yourself and mark the lie.",
    "Pass the phone; your partner picks the one they think is false.",
    "Catching the lie scores the guesser, fooling them scores you.",
  ],
  "rate-my-guess": [
    "Rate yourself on the slider and lock it in.",
    "Your partner slides to the number they think you chose.",
    "Closer guesses score more — up to three points.",
  ],
};


export const CATEGORY_LABEL: Record<string, string> = {
  arcade: "Arcade",
  reflex: "Reflex",
  board: "Board & Strategy",
  sports: "Sports",
  puzzle: "Puzzle & Word",
  competitive: "Competitive",
  cooperative: "Co-op",
  conversation: "Couples",
  quick: "Quick Play",
};

/**
 * The four moods we surface on Home and in the library header. Each one rolls
 * up several fine-grained categories so every game is reachable from a mood.
 */
export const MOOD_LABEL: Record<string, string> = {
  m_competitive: "Competitive",
  m_cooperative: "Cooperative",
  m_conversation: "Conversation",
  m_quick: "Quick Play",
};

const MOOD_CATEGORIES: Record<string, GameCategory[]> = {
  m_competitive: ["competitive", "arcade", "reflex", "sports", "board"],
  m_cooperative: ["cooperative", "puzzle"],
  m_conversation: ["conversation"],
  m_quick: ["quick"],
};

/**
 * The single headline category shown on a game card. Every game rolls up into
 * exactly one of the four moods, so the badge is never ambiguous.
 */
export function moodOf(game: GameDef): string {
  if (game.category === "quick" || game.quick === true) return "m_quick";
  if (game.category === "conversation") return "m_conversation";
  if (MOOD_CATEGORIES['m_cooperative']!.includes(game.category)) return "m_cooperative";
  return "m_competitive";
}

export const moodLabelOf = (game: GameDef): string => MOOD_LABEL[moodOf(game)] ?? "Play";

/** Does a game belong under a filter key (mood, category, or "all")? */
export function matchesFilter(game: GameDef, key: string): boolean {
  if (key === "all") return true;
  if (key === "m_quick") return game.category === "quick" || game.quick === true;
  const mood = MOOD_CATEGORIES[key];
  if (mood) return mood.includes(game.category);
  return game.category === key;
}

export const ONLINE_LABEL: Record<string, string> = {
  turns: "One phone or two",
  local: "One shared phone",
};


/* ------------------------------------------------------------------ */
/* Original prompt banks                                               */
/* ------------------------------------------------------------------ */

export const NEVER_HAVE_I_EVER: string[] = [
  "Never have I ever re-read a message from you more than five times.",
  "Never have I ever pretended to like a gift you gave me.",
  "Never have I ever changed my plans just so I could bump into you.",
  "Never have I ever fallen asleep during a film you picked.",
  "Never have I ever eaten the last of something and blamed it on you.",
  "Never have I ever practised a conversation with you in my head first.",
  "Never have I ever taken a photo of you while you were sleeping.",
  "Never have I ever secretly checked our old photos when I missed you.",
  "Never have I ever let you win an argument I knew I could win.",
  "Never have I ever worn your clothes without telling you.",
  "Never have I ever hidden a snack somewhere only I know about.",
  "Never have I ever daydreamed about a trip we haven't booked yet.",
  "Never have I ever pretended to be asleep to avoid getting up first.",
  "Never have I ever told a friend a story about us that I exaggerated.",
  "Never have I ever bought something purely because I imagined your reaction.",
  "Never have I ever sung loudly in the car when you weren't in it.",
  "Never have I ever rehearsed an apology before giving it.",
  "Never have I ever kept a receipt or ticket stub from one of our nights out.",
  "Never have I ever googled something you said just to check you were right.",
  "Never have I ever pretended to know a band you love.",
  "Never have I ever taken the bigger half on purpose.",
  "Never have I ever stayed up late just to keep talking to you.",
  "Never have I ever cried at something you wrote me.",
  "Never have I ever picked a restaurant because you'd like the pudding.",
  "Never have I ever screenshot one of your messages to show a friend.",
  "Never have I ever moved something of yours and denied it.",
  "Never have I ever imagined what our house would look like.",
  "Never have I ever pretended a plan fell through so we could stay in.",
  "Never have I ever kept a nickname for you I've never used out loud.",
  "Never have I ever agreed with you just to end the conversation.",
  "Never have I ever learned something new purely because you're into it.",
  "Never have I ever taken a longer route home to keep the conversation going.",
  "Never have I ever hidden how nervous I was around your family.",
  "Never have I ever gone through your playlist to work out your mood.",
  "Never have I ever eaten something I dislike because you cooked it.",
  "Never have I ever told you I was fine when I really wasn't.",
  "Never have I ever counted down the hours until I'd see you.",
  "Never have I ever kept an item of yours on purpose.",
];

export const WHOS_MORE_LIKELY: string[] = [
  "Who's more likely to cry at a cartoon?",
  "Who's more likely to text back within ten seconds?",
  "Who's more likely to burn the toast twice in a row?",
  "Who's more likely to plan a holiday down to the minute?",
  "Who's more likely to adopt a stray animal on the spot?",
  "Who's more likely to start a hobby and abandon it in a week?",
  "Who's more likely to survive a week without their phone?",
  "Who's more likely to say sorry first after a silly argument?",
  "Who's more likely to talk to strangers in a queue?",
  "Who's more likely to forget an anniversary but make up for it beautifully?",
  "Who's more likely to sing in the shower at full volume?",
  "Who's more likely to fall asleep on a road trip?",
  "Who's more likely to over-order at a restaurant?",
  "Who's more likely to become mildly famous online by accident?",
  "Who's more likely to lose their keys twice in one day?",
  "Who's more likely to win a dance-off at a wedding?",
  "Who's more likely to keep a plant alive for a whole year?",
  "Who's more likely to read the instructions before building furniture?",
  "Who's more likely to book a flight at 3am on a whim?",
  "Who's more likely to argue with a self-checkout machine?",
  "Who's more likely to remember a stranger's birthday?",
  "Who's more likely to get lost with a map in their hand?",
  "Who's more likely to eat dessert before the main?",
  "Who's more likely to become obsessed with a new gadget?",
  "Who's more likely to make friends with the neighbour's cat first?",
  "Who's more likely to fall for an obvious scam email?",
  "Who's more likely to redecorate a room at midnight?",
  "Who's more likely to keep a plant they've clearly killed?",
  "Who's more likely to be recognised in the local shop?",
  "Who's more likely to give a heartfelt speech with no warning?",
  "Who's more likely to hoard sauce packets?",
  "Who's more likely to say yes to karaoke?",
  "Who's more likely to win a staring contest?",
  "Who's more likely to panic in a horror film?",
  "Who's more likely to bring back a suitcase of snacks from abroad?",
  "Who's more likely to text the wrong person something embarrassing?",
];

export const PILLOW_TALK: string[] = [
  "What small thing did I do this month that stayed with you?",
  "When did you last feel completely at ease with me?",
  "What part of your day do you wish I could see?",
  "What's a fear you've never said out loud to me?",
  "Which version of me from the past do you miss?",
  "What do you hope our ordinary Tuesdays look like in five years?",
  "What's something you'd like me to ask you about more often?",
  "When have you felt most proud of us?",
  "What do you need more of from me lately?",
  "What's a habit of mine you've quietly grown fond of?",
  "Where do you feel safest, and why there?",
  "What would you like us to stop apologising for?",
  "What's a memory of us you replay when you're low?",
  "What does being loved well look like to you this year?",
  "What's something you're still learning about yourself?",
  "If we could pause one week forever, which week would it be?",
  "What's the kindest thing anyone has ever said about us?",
  "Which of our routines would you never want to lose?",
  "What do you think I underestimate about myself?",
  "When was the last time you felt genuinely rested?",
  "What's a conversation we keep circling but never finish?",
  "What does home smell like to you?",
  "Which of your parents' habits have you kept on purpose?",
  "What would you like our next chapter to be called?",
  "What's something small I could do tomorrow that would help?",
  "Which of my worries would you like to take off me?",
  "What's a promise you'd like us to make quietly?",
  "When do you feel most yourself?",
  "What have you changed your mind about since we met?",
  "What's a hard thing you're glad we went through?",
  "What do you hope stays exactly the same about us?",
  "What's one thing you'd love to try together this year?",
];

export type ThisOrThatCard = { a: string; b: string };

export const THIS_OR_THAT: ThisOrThatCard[] = [
  { a: "Sunrise walk", b: "Midnight snack run" },
  { a: "Beach week", b: "Mountain cabin" },
  { a: "Cook together", b: "Order in" },
  { a: "Loud party", b: "Four close friends" },
  { a: "Plan everything", b: "Wing it" },
  { a: "Big surprise gift", b: "Small daily notes" },
  { a: "Road trip", b: "Long flight" },
  { a: "Sweet breakfast", b: "Savoury breakfast" },
  { a: "Cinema seats", b: "Sofa and blanket" },
  { a: "Early birds", b: "Night owls" },
  { a: "Museum morning", b: "Market morning" },
  { a: "Two dogs", b: "Two cats" },
  { a: "Slow Sunday", b: "Packed Sunday" },
  { a: "Handwritten letter", b: "Voice note" },
  { a: "Same tattoo", b: "Same playlist" },
  { a: "City apartment", b: "House with a garden" },
  { a: "Camping", b: "Hotel" },
  { a: "Board games", b: "Video games" },
  { a: "Comedy show", b: "Live music" },
  { a: "Breakfast in bed", b: "Brunch out" },
  { a: "Matching outfits", b: "Absolutely not" },
  { a: "Winter wedding", b: "Summer wedding" },
  { a: "Sea swim", b: "Hot bath" },
  { a: "Long books", b: "Long series" },
  { a: "Spontaneous kiss", b: "Long hug" },
  { a: "Anniversary trip", b: "Anniversary feast" },
  { a: "Talk it out now", b: "Sleep on it" },
  { a: "Karaoke duet", b: "Silent car ride" },
  { a: "Save for a house", b: "Spend on travel" },
  { a: "Sunday roast", b: "Street food crawl" },
  { a: "Photo albums", b: "Fridge magnets" },
];

export const TRUTHS: string[] = [
  "What's the most embarrassing thing you've done to impress me?",
  "Describe the exact moment you knew you liked me.",
  "What's a compliment you've thought about me but never said?",
  "What's one thing you'd change about our first date?",
  "Tell me about a time you were jealous and hid it.",
  "What's the pettiest reason you've ever been annoyed at me?",
  "What's a secret talent you've been saving?",
  "What's the last thing you searched that you'd rather I didn't see?",
  "Which of my friends do you find the funniest, honestly?",
  "What's a lie you told me that was actually kind?",
  "What's your most unrealistic dream for us?",
  "What's something you've forgiven me for without telling me?",
  "What's the worst gift you've ever received and pretended to like?",
  "What did you assume about me the first week we met?",
  "What's a habit of mine you'd secretly like to break?",
  "What's the boldest thing you've ever texted someone?",
  "Which of my stories have you heard far too many times?",
  "What's something you're proud of but never mention?",
  "What's the silliest thing you've cried about this year?",
  "What's a rule you've broken and never regretted?",
  "What's the last thing you did purely to impress me?",
  "What would you do with a completely free, unwatched day?",
  "What's the most childish thing you still enjoy?",
  "Which compliment do you never get tired of hearing?",
];

export const DARES: string[] = [
  "Do your best impression of me ordering coffee.",
  "Send a wildly dramatic voice note to your closest friend.",
  "Let your partner restyle your hair for the next round.",
  "Speak only in questions until your next turn.",
  "Recreate a photo of us from memory, right now.",
  "Give a sixty-second speech about your partner's best quality.",
  "Let your partner pick your phone wallpaper for a week.",
  "Do ten star jumps while listing things you love about them.",
  "Text a friend a compliment you'd normally be too shy to send.",
  "Dance for thirty seconds with no music at all.",
  "Let your partner choose your outfit for tomorrow.",
  "Read your last three messages out loud in a movie-trailer voice.",
  "Invent a jingle for your partner's name and perform it.",
  "Balance something on your head until your next turn.",
  "Describe your day as if you were a sports commentator.",
  "Swap accents with your partner for two whole rounds.",
  "Write a two-line poem about them, out loud, right now.",
  "Let them add one ridiculous item to tomorrow's shopping list.",
  "Do your best catwalk from one side of the room to the other.",
  "Name ten things you love about them in thirty seconds.",
  "Let them tickle-attack you for five seconds without moving.",
  "Act out how you looked on our first date.",
  "Hold a plank while they ask you three quick questions.",
  "Give them a two-minute head, shoulder or hand massage.",
];

export type QuizQuestion = { q: string; options: string[] };

export const COUPLE_QUIZ: QuizQuestion[] = [
  {
    q: "What's my ideal way to spend a free evening?",
    options: ["Out with friends", "Film on the sofa", "Something outdoors", "A quiet solo hour"],
  },
  {
    q: "Which chore do I secretly dislike the most?",
    options: ["Dishes", "Laundry", "Food shopping", "Cleaning the bathroom"],
  },
  {
    q: "What's my usual comfort food?",
    options: ["Pasta", "Something spicy", "Chocolate", "Toast and tea"],
  },
  {
    q: "How do I handle being stressed?",
    options: ["Talk it out", "Go quiet", "Clean everything", "Distract myself"],
  },
  {
    q: "What would I pick for a birthday treat?",
    options: ["A big party", "Dinner for two", "A weekend away", "A lazy day at home"],
  },
  {
    q: "Which is my strongest travel instinct?",
    options: ["Book everything early", "Decide on the day", "Follow the food", "Follow the views"],
  },
  {
    q: "What am I most likely to overspend on?",
    options: ["Food", "Clothes", "Gadgets", "Gifts for you"],
  },
  {
    q: "What's my go-to argument style?",
    options: ["Say it straight", "Need time first", "Make a joke", "Write it down"],
  },
  {
    q: "Which sound annoys me most?",
    options: ["Loud chewing", "Alarm clocks", "A dripping tap", "Notification pings"],
  },
  {
    q: "What's my favourite kind of weather?",
    options: ["Hot and bright", "Crisp and cold", "Rainy and cosy", "Windy and wild"],
  },
  {
    q: "Which would I rather give up for a month?",
    options: ["Coffee", "Social media", "Takeaways", "Streaming"],
  },
  {
    q: "How do I like to be woken up?",
    options: ["Slowly, with coffee", "Alarm and go", "Left alone", "With a chat"],
  },
  {
    q: "What's my dream pet?",
    options: ["A big dog", "A lazy cat", "Something unusual", "No pets, thanks"],
  },
  {
    q: "Where would I want to live for a year?",
    options: ["By the sea", "A big city", "The mountains", "Right where we are"],
  },
  {
    q: "What's my favourite part of a night out?",
    options: ["Getting ready", "The food", "The dancing", "Going home"],
  },
  {
    q: "What do I do first thing in the morning?",
    options: ["Check my phone", "Make a drink", "Snooze again", "Get straight up"],
  },
  {
    q: "Which gift would land best with me?",
    options: ["Something handmade", "Tickets to something", "Something practical", "A surprise trip"],
  },
  {
    q: "How do I feel about surprise parties?",
    options: ["Love them", "Hate them", "Depends who's there", "Only small ones"],
  },
  {
    q: "What's my most-used app?",
    options: ["Messages", "Social", "Music", "Maps"],
  },
  {
    q: "Which task do I always put off?",
    options: ["Replying to emails", "Booking appointments", "Tidying up", "Paperwork"],
  },
  {
    q: "What's my ideal holiday pace?",
    options: ["Non-stop sightseeing", "One thing a day", "Pure lounging", "Whatever you want"],
  },
  {
    q: "What makes me instantly happier?",
    options: ["Food", "A walk", "A nap", "A hug"],
  },
];

export const DAILY_PROMPTS: string[] = [
  "Tell them one thing they did this week that you noticed.",
  "Send them a photo that made you think of them today.",
  "Name a place you'd both visit with zero planning.",
  "Ask them what they need more of this week.",
  "Share a song that sounds like your relationship right now.",
  "Describe your partner using only three words.",
  "Tell them about a moment today you wished they'd seen.",
];

export const AVATARS = [
  "🦊",
  "🐻",
  "🐼",
  "🐨",
  "🐯",
  "🦁",
  "🐸",
  "🐙",
  "🦄",
  "🐧",
  "🦉",
  "🐳",
  "🌻",
  "🍉",
  "🔥",
  "⭐️",
];

export const RELATIONSHIP_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: "dating", label: "Dating", emoji: "💕" },
  { value: "engaged", label: "Engaged", emoji: "💍" },
  { value: "married", label: "Married", emoji: "🏡" },
  { value: "long-distance", label: "Long distance", emoji: "✈️" },
  { value: "its-complicated", label: "It's complicated", emoji: "🌀" },
];

export function shuffle<T>(items: readonly T[], seed = Math.random()): T[] {
  const out = [...items];
  let s = Math.floor(seed * 2 ** 31) || 1;
  const rand = () => {
    s = (s * 1103515245 + 12345) % 2 ** 31;
    return s / 2 ** 31;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
