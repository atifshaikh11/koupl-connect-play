export type PlayerSlot = 0 | 1;

export type Player = {
  id: string;
  name: string;
  avatar: string;
};

export type Settings = {
  sound: boolean;
  haptics: boolean;
  notifications: boolean;
  theme: "light" | "dark";
};

export type RelationshipStatus =
  | "dating"
  | "engaged"
  | "married"
  | "long-distance"
  | "its-complicated";

export type GuestProfile = {
  name: string;
  avatar: string;
  relationship: RelationshipStatus;
  partnerName: string;
  partnerAvatar: string;
  code: string;
};

export type ActivityItem = {
  id: string;
  game_id: string;
  mode: string;
  summary: string;
  my_score: number;
  their_score: number;
  created_at: string;
};

export type GameCategory = "party" | "deep" | "arcade" | "quiz";

export type GameDef = {
  id: string;
  title: string;
  tagline: string;
  emoji: string;
  category: GameCategory;
  accent: "primary" | "berry" | "sunny" | "mint" | "sky";
  players: string;
  minutes: string;
  featured?: boolean;
  scored: boolean;
  description: string;
};

/** Result handed back by every game when it reaches its summary screen. */
export type GameResult = {
  summary: string;
  myScore: number;
  theirScore: number;
};

/** Shared, synchronised state container passed to every game. */
export type SharedState<T> = {
  value: T;
  patch: (next: Partial<T> | ((prev: T) => Partial<T>)) => void;
  reset: (next: T) => void;
  ready: boolean;
};

export type PlayMode = "local" | "online";

export type GameContext = {
  players: [Player, Player];
  /** Index of the player using THIS device. In local mode both are "me". */
  mySlot: PlayerSlot | null;
  mode: PlayMode;
  onFinish: (result: GameResult) => void;
  onExit: () => void;
};
