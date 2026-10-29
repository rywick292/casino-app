import { Card, Rank, Suit } from '../types';

export function createBlackjackDeck(): Card[] {
  const suits: Suit[] = ['spades', 'clubs', 'diamonds', 'hearts'];
  // Ranks 2 through 14 (14 = Ace)
  const ranks: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        id: `bj-${suit}-${rank}-${Math.random().toString(36).substring(2, 7)}`,
        suit,
        rank,
      });
    }
  }

  // Shuffle deck using Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export interface HandValue {
  score: number;
  isSoft: boolean;
  isBust: boolean;
  isBlackjack: boolean;
}

export function calculateBlackjackScore(cards: Card[]): HandValue {
  if (cards.length === 0) {
    return { score: 0, isSoft: false, isBust: false, isBlackjack: false };
  }

  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.rank === 14) {
      aces += 1;
      total += 11;
    } else if (card.rank >= 10) {
      total += 10;
    } else {
      total += card.rank;
    }
  }

  // Adjust Aces from 11 to 1 if busting
  let isSoft = false;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  if (aces > 0 && total <= 21) {
    isSoft = true;
  }

  const isBust = total > 21;
  const isBlackjack = cards.length === 2 && total === 21;

  return {
    score: total,
    isSoft,
    isBust,
    isBlackjack,
  };
}

export function isDealerBust(dealerCards: Card[]): boolean {
  return calculateBlackjackScore(dealerCards).isBust;
}

export function doesDealerHit(dealerCards: Card[]): boolean {
  const { score } = calculateBlackjackScore(dealerCards);
  // Standard casino rule: Dealer must stand on all 17s and draw to 16
  return score < 17;
}
