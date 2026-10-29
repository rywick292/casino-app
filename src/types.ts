export type Suit = 'spades' | 'clubs' | 'diamonds' | 'hearts';

export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type ComboType = 
  | 'single' 
  | 'pair' 
  | 'triple' 
  | 'straight' 
  | 'flush' 
  | 'full-house' 
  | 'four-of-a-kind' 
  | 'straight-flush'
  | 'straight-3'
  | 'straight-4'
  | 'straight-house';

export type PokerVariant = 'global' | 'indonesian';

export type WinType = 'standard' | 'murni' | 'bomb' | 'straight-flush-autowin';

export interface HandCombo {
  type: ComboType;
  cards: Card[];
  primaryRank: number; // For comparison (e.g. rank of single/pair/triple, or highest card in straight/flush, or triple in full house, or 4 of a kind)
  suitRank: number;    // Secondary comparison (suit of highest card: spades=1, clubs=2, diamonds=3, hearts=4)
  description: string;
  isBomb?: boolean;
}

export interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  avatar: string;
  coins: number;
  hand: Card[];
  isPassed: boolean;
  lastAction?: 'play' | 'pass' | 'win';
  lastPlayedCombo?: HandCombo | null;
  statusText?: string;
  isWinner?: boolean;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export type GamePhase = 'landing' | 'setup' | 'playing' | 'game-over' | 'slot-machine' | 'blackjack' | 'texas-holdem';

// --- BLACKJACK TYPES ---
export interface BlackjackSpot {
  id: number; // 0: Left, 1: Center, 2: Right
  label: string;
  bet: number;
  cards: Card[];
  isDoubled: boolean;
  hasInsurance: boolean;
  insuranceBet: number;
  status: 'idle' | 'playing' | 'stood' | 'busted' | 'blackjack' | 'won' | 'lost' | 'pushed';
  payout: number;
}

// --- TEXAS HOLD'EM TYPES ---
export type HoldemStage = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export type HoldemPlayerAction = 'none' | 'check' | 'call' | 'raise' | 'fold' | 'all-in';

export interface HoldemPlayer {
  id: string;
  name: string;
  isHuman: boolean;
  avatar: string;
  chips: number;
  currentBet: number;
  totalRoundInvestment: number;
  cards: Card[];
  hasFolded: boolean;
  isAllIn: boolean;
  lastAction?: HoldemPlayerAction;
  lastActionText?: string;
  evaluation?: HoldemEvaluation;
}

export interface HoldemEvaluation {
  rankLevel: number; // 1 to 10
  categoryName: string;
  tieBreakers: number[];
  bestFiveCards: Card[];
  summary: string;
}

export type SlotSymbol = 'diamond' | 'spade' | 'seven';

export interface SlotResult {
  reels: [SlotSymbol, SlotSymbol, SlotSymbol];
  payoutMultiplier: number; // 0, 2 (100% extra), or 3 (3X)
  wonCoins: number;
  betCoins: number;
  title: 'NICE TRY' | 'WIN WIN WIN' | 'MEGA EXTRA BONUS';
}

export interface GameLog {
  id: string;
  text: string;
  type: 'info' | 'play' | 'pass' | 'win' | 'bet';
  timestamp: string;
}

export interface PayoutDetail {
  playerId: string;
  playerName: string;
  isHuman: boolean;
  cardsLeft: number;
  multiplier: number;
  netCoins: number;
  isWinner: boolean;
}

export interface TrickPlay {
  id: string;
  combo: HandCombo;
  playerIndex: number;
  playerName: string;
  playerAvatar: string;
  timestamp: number;
}

export interface ReshuffleEvent {
  player: Player;
  fourTwos: Card[];
  phase: 'revealing' | 'dealing';
}

export interface BuangKartuTigaPlayerDiscard {
  playerId: string;
  playerName: string;
  playerAvatar: string;
  isHuman: boolean;
  cards: Card[];
}

export interface BuangKartuTigaEvent {
  discards: BuangKartuTigaPlayerDiscard[];
  starterPlayerId: string;
  starterPlayerName: string;
  starterPlayerAvatar: string;
  starterIsHuman: boolean;
  allDiscardedThrees: Card[];
}

export type ManualBuangKartuStep = 'waiting-player' | 'bots-throwing' | 'announcing';

export interface ManualBuangKartuState {
  step: ManualBuangKartuStep;
  discards: BuangKartuTigaPlayerDiscard[];
  currentThrowerName?: string;
  starterPlayerId?: string;
  starterPlayerName?: string;
  starterPlayerAvatar?: string;
  starterIsHuman?: boolean;
}



