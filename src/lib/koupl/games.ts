import type { GameDef } from "./types";

export const GAMES: GameDef[] = [
  {
    id: "never-have-i-ever",
    title: "Never Have I Ever",
    tagline: "Confess, laugh, repeat",
    emoji: "🙈",
    category: "party",
    accent: "primary",
    players: "2 players",
    minutes: "5–10 min",
    featured: true,
    scored: true,
    description:
      "A card flips, you both tap whether you've done it. Matching confessions score points for the two of you.",
  },
  {
    id: "whos-more-likely",
    title: "Who's More Likely",
    tagline: "Point the finger",
    emoji: "👉",
    category: "party",
    accent: "berry",
    players: "2 players",
    minutes: "5–10 min",
    featured: true,
    scored: true,
    description:
      "Each round asks who's more likely to do something. Agree and you both score. Disagree and you argue about it.",
  },
  {
    id: "four-in-a-row",
    title: "Four in a Row",
    tagline: "Drop, block, brag",
    emoji: "🔴",
    category: "arcade",
    accent: "sky",
    players: "2 players",
    minutes: "3–6 min",
    featured: true,
    scored: true,
    description:
      "Classic drop-and-connect strategy with a couples twist: loser owes a favour.",
  },
  {
    id: "basketball-rivalry",
    title: "Basketball Rivalry",
    tagline: "Ten shots each",
    emoji: "🏀",
    category: "arcade",
    accent: "sunny",
    players: "2 players",
    minutes: "3–5 min",
    scored: true,
    description:
      "Time your tap, sink the shot. Ten attempts each and the higher score takes the trophy.",
  },
  {
    id: "pillow-talk",
    title: "Pillow Talk",
    tagline: "Slow, warm questions",
    emoji: "🌙",
    category: "deep",
    accent: "berry",
    players: "2 players",
    minutes: "10–20 min",
    scored: false,
    description:
      "Unhurried questions for late evenings. No points, no timer — just take turns and actually listen.",
  },
  {
    id: "this-or-that",
    title: "This or That",
    tagline: "Pick a side",
    emoji: "⚖️",
    category: "quiz",
    accent: "mint",
    players: "2 players",
    minutes: "4–8 min",
    scored: true,
    description:
      "Two options, one tap each. Reveal together and see how aligned your tastes really are.",
  },
  {
    id: "truth-or-dare",
    title: "Truth or Dare",
    tagline: "Choose your risk",
    emoji: "🎲",
    category: "party",
    accent: "primary",
    players: "2 players",
    minutes: "10–15 min",
    scored: true,
    description:
      "Spin between honest answers and playful dares. Complete it for a point, chicken out for none.",
  },
  {
    id: "couple-quiz",
    title: "Couple Quiz",
    tagline: "How well do you know them?",
    emoji: "💡",
    category: "quiz",
    accent: "sky",
    players: "2 players",
    minutes: "6–12 min",
    scored: true,
    description:
      "One of you answers about yourself, the other guesses. Swap every round and count the hits.",
  },
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);

export const CATEGORY_LABEL: Record<string, string> = {
  party: "Party",
  deep: "Deep talk",
  arcade: "Arcade",
  quiz: "Quiz",
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
