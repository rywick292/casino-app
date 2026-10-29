import { Card, HoldemEvaluation, Rank, Suit } from '../types';

export function createHoldemDeck(): Card[] {
  const suits: Suit[] = ['spades', 'clubs', 'diamonds', 'hearts'];
  const ranks: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        id: `th-${suit}-${rank}-${Math.random().toString(36).substring(2, 7)}`,
        suit,
        rank,
      });
    }
  }

  // Shuffle Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

const RANK_NAMES: Record<number, string> = {
  2: 'Two',
  3: 'Three',
  4: 'Four',
  5: 'Five',
  6: 'Six',
  7: 'Seven',
  8: 'Eight',
  9: 'Nine',
  10: 'Ten',
  11: 'Jack',
  12: 'Queen',
  13: 'King',
  14: 'Ace',
};

const PLURAL_RANK_NAMES: Record<number, string> = {
  2: 'Twos',
  3: 'Threes',
  4: 'Fours',
  5: 'Fives',
  6: 'Sixes',
  7: 'Sevens',
  8: 'Eights',
  9: 'Nines',
  10: 'Tens',
  11: 'Jacks',
  12: 'Queens',
  13: 'Kings',
  14: 'Aces',
};

// Generates all 5-card combinations from a set of cards (typically 7 cards = 21 combos)
function getCombinations<T>(arr: T[], k: number): T[][] {
  const result: T[][] = [];
  function backtrack(start: number, combo: T[]) {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      backtrack(i + 1, combo);
      combo.pop();
    }
  }
  backtrack(0, []);
  return result;
}

// Evaluates exactly 5 cards
function evaluateFiveCards(fiveCards: Card[]): HoldemEvaluation {
  // Sort descending by rank (14 down to 2)
  const sorted = [...fiveCards].sort((a, b) => b.rank - a.rank);
  const ranks = sorted.map((c) => c.rank);
  const suits = sorted.map((c) => c.suit);

  const isFlush = suits.every((s) => s === suits[0]);

  // Check straight
  let isStraight = false;
  let straightHigh = 0;

  // Regular straight check
  let consecutive = true;
  for (let i = 0; i < 4; i++) {
    if (ranks[i] - ranks[i + 1] !== 1) {
      consecutive = false;
      break;
    }
  }

  if (consecutive) {
    isStraight = true;
    straightHigh = ranks[0];
  } else if (
    ranks[0] === 14 &&
    ranks[1] === 5 &&
    ranks[2] === 4 &&
    ranks[3] === 3 &&
    ranks[4] === 2
  ) {
    // Ace-low straight (Wheel: 5-4-3-2-A)
    isStraight = true;
    straightHigh = 5;
  }

  // Rank frequency map
  const counts: Record<number, number> = {};
  for (const r of ranks) {
    counts[r] = (counts[r] || 0) + 1;
  }

  const freqEntries = Object.entries(counts)
    .map(([r, count]) => ({ rank: Number(r), count }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);

  // 10. Royal Flush
  if (isFlush && isStraight && straightHigh === 14) {
    return {
      rankLevel: 10,
      categoryName: 'Royal Flush',
      tieBreakers: [14],
      bestFiveCards: sorted,
      summary: 'Royal Flush, Ace High',
    };
  }

  // 9. Straight Flush
  if (isFlush && isStraight) {
    return {
      rankLevel: 9,
      categoryName: 'Straight Flush',
      tieBreakers: [straightHigh],
      bestFiveCards: sorted,
      summary: `Straight Flush, ${RANK_NAMES[straightHigh]} High`,
    };
  }

  // 8. Four of a Kind
  if (freqEntries[0].count === 4) {
    const quadRank = freqEntries[0].rank;
    const kicker = freqEntries[1].rank;
    return {
      rankLevel: 8,
      categoryName: 'Four of a Kind',
      tieBreakers: [quadRank, kicker],
      bestFiveCards: sorted,
      summary: `Four of a Kind, ${PLURAL_RANK_NAMES[quadRank]}`,
    };
  }

  // 7. Full House
  if (freqEntries[0].count === 3 && freqEntries[1].count === 2) {
    const tripRank = freqEntries[0].rank;
    const pairRank = freqEntries[1].rank;
    return {
      rankLevel: 7,
      categoryName: 'Full House',
      tieBreakers: [tripRank, pairRank],
      bestFiveCards: sorted,
      summary: `Full House, ${PLURAL_RANK_NAMES[tripRank]} full of ${PLURAL_RANK_NAMES[pairRank]}`,
    };
  }

  // 6. Flush
  if (isFlush) {
    return {
      rankLevel: 6,
      categoryName: 'Flush',
      tieBreakers: ranks,
      bestFiveCards: sorted,
      summary: `Flush, ${RANK_NAMES[ranks[0]]} High`,
    };
  }

  // 5. Straight
  if (isStraight) {
    return {
      rankLevel: 5,
      categoryName: 'Straight',
      tieBreakers: [straightHigh],
      bestFiveCards: sorted,
      summary: `Straight, ${RANK_NAMES[straightHigh]} High`,
    };
  }

  // 4. Three of a Kind
  if (freqEntries[0].count === 3) {
    const tripRank = freqEntries[0].rank;
    const kickers = [freqEntries[1].rank, freqEntries[2].rank];
    return {
      rankLevel: 4,
      categoryName: 'Three of a Kind',
      tieBreakers: [tripRank, ...kickers],
      bestFiveCards: sorted,
      summary: `Three of a Kind, ${PLURAL_RANK_NAMES[tripRank]}`,
    };
  }

  // 3. Two Pair
  if (freqEntries[0].count === 2 && freqEntries[1].count === 2) {
    const highPair = Math.max(freqEntries[0].rank, freqEntries[1].rank);
    const lowPair = Math.min(freqEntries[0].rank, freqEntries[1].rank);
    const kicker = freqEntries[2].rank;
    return {
      rankLevel: 3,
      categoryName: 'Two Pair',
      tieBreakers: [highPair, lowPair, kicker],
      bestFiveCards: sorted,
      summary: `Two Pair, ${PLURAL_RANK_NAMES[highPair]} and ${PLURAL_RANK_NAMES[lowPair]}`,
    };
  }

  // 2. One Pair
  if (freqEntries[0].count === 2) {
    const pairRank = freqEntries[0].rank;
    const kickers = [freqEntries[1].rank, freqEntries[2].rank, freqEntries[3].rank];
    return {
      rankLevel: 2,
      categoryName: 'One Pair',
      tieBreakers: [pairRank, ...kickers],
      bestFiveCards: sorted,
      summary: `One Pair of ${PLURAL_RANK_NAMES[pairRank]}`,
    };
  }

  // 1. High Card
  return {
    rankLevel: 1,
    categoryName: 'High Card',
    tieBreakers: ranks,
    bestFiveCards: sorted,
    summary: `High Card, ${RANK_NAMES[ranks[0]]}`,
  };
}

// Compare two 5-card evaluations. Returns > 0 if A > B, < 0 if B > A, 0 if tie.
export function compareHoldemEvaluations(a: HoldemEvaluation, b: HoldemEvaluation): number {
  if (a.rankLevel !== b.rankLevel) {
    return a.rankLevel - b.rankLevel;
  }
  for (let i = 0; i < Math.min(a.tieBreakers.length, b.tieBreakers.length); i++) {
    if (a.tieBreakers[i] !== b.tieBreakers[i]) {
      return a.tieBreakers[i] - b.tieBreakers[i];
    }
  }
  return 0;
}

// Evaluates the best 5-card hand out of all available cards (e.g. 7 cards: 2 hole + 5 community)
export function evaluateBestHoldemHand(cards: Card[]): HoldemEvaluation {
  if (cards.length < 5) {
    // Fallback if fewer than 5 cards available
    const sorted = [...cards].sort((a, b) => b.rank - a.rank);
    const highRank = sorted[0]?.rank || 14;
    return {
      rankLevel: 1,
      categoryName: 'High Card',
      tieBreakers: sorted.map((c) => c.rank),
      bestFiveCards: sorted,
      summary: `High Card, ${RANK_NAMES[highRank] || 'Ace'}`,
    };
  }

  const combos = getCombinations(cards, 5);
  let bestEval: HoldemEvaluation | null = null;

  for (const combo of combos) {
    const currentEval = evaluateFiveCards(combo);
    if (!bestEval || compareHoldemEvaluations(currentEval, bestEval) > 0) {
      bestEval = currentEval;
    }
  }

  return bestEval!;
}

// Bot decision logic for Texas Hold'em
export interface BotDecision {
  action: 'check' | 'call' | 'raise' | 'fold';
  raiseAmount?: number;
}

export function decideBotAction(
  botHand: Card[],
  communityCards: Card[],
  currentBet: number,
  botCurrentBet: number,
  botChips: number,
  potSize: number,
  bigBlind: number,
  stage: 'preflop' | 'flop' | 'turn' | 'river'
): BotDecision {
  const callCost = currentBet - botCurrentBet;

  // If no cost to stay in hand, checking is virtually always better than folding
  const canCheck = callCost <= 0;

  if (stage === 'preflop') {
    const [c1, c2] = botHand;
    const isPair = c1.rank === c2.rank;
    const isSuited = c1.suit === c2.suit;
    const high = Math.max(c1.rank, c2.rank);
    const low = Math.min(c1.rank, c2.rank);

    // Premium hands: High pairs (10+), AK, AQ
    const isPremium = isPair && high >= 10 || (high === 14 && low >= 12);
    // Strong hands: Middle pairs (6-9), AJ, KQ, suited broadways
    const isStrong = (isPair && high >= 6) || (high === 14 && low >= 10) || (high === 13 && low >= 11) || (isSuited && high >= 10);
    // Playable hands: Low pairs, suited connectors, high cards
    const isPlayable = isPair || isSuited || high >= 11 || (high - low <= 2 && high >= 8);

    if (isPremium) {
      // 70% chance to raise if affordable
      if (Math.random() < 0.7 && botChips > currentBet + bigBlind) {
        const raiseSize = Math.min(botChips, currentBet + bigBlind * 2);
        return { action: 'raise', raiseAmount: raiseSize };
      }
      return canCheck ? { action: 'check' } : { action: 'call' };
    }

    if (isStrong) {
      if (callCost <= bigBlind * 3) {
        if (Math.random() < 0.35 && botChips > currentBet + bigBlind) {
          return { action: 'raise', raiseAmount: Math.min(botChips, currentBet + bigBlind) };
        }
        return canCheck ? { action: 'check' } : { action: 'call' };
      }
      return canCheck ? { action: 'check' } : { action: 'fold' };
    }

    if (isPlayable) {
      if (callCost <= bigBlind * 2) {
        return canCheck ? { action: 'check' } : { action: 'call' };
      }
      return canCheck ? { action: 'check' } : { action: 'fold' };
    }

    // Weak preflop
    if (canCheck) return { action: 'check' };
    if (callCost <= bigBlind && Math.random() < 0.4) return { action: 'call' };
    return { action: 'fold' };
  }

  // Postflop evaluation (Flop, Turn, River)
  const currentEval = evaluateBestHoldemHand([...botHand, ...communityCards]);
  const handStrength = currentEval.rankLevel; // 1 to 10

  // High tier: Full House or better (Rank 7+)
  if (handStrength >= 7) {
    if (botChips > currentBet + bigBlind && Math.random() < 0.8) {
      const raiseSize = Math.min(botChips, currentBet + Math.max(bigBlind * 2, Math.floor(potSize * 0.5)));
      return { action: 'raise', raiseAmount: raiseSize };
    }
    return canCheck ? { action: 'check' } : { action: 'call' };
  }

  // Strong tier: Three of a kind, Straight, Flush (Rank 4, 5, 6)
  if (handStrength >= 4) {
    if (botChips > currentBet + bigBlind && Math.random() < 0.5) {
      const raiseSize = Math.min(botChips, currentBet + Math.max(bigBlind, Math.floor(potSize * 0.35)));
      return { action: 'raise', raiseAmount: raiseSize };
    }
    return canCheck ? { action: 'check' } : { action: 'call' };
  }

  // Medium tier: Two Pair (Rank 3)
  if (handStrength === 3) {
    if (callCost <= potSize * 0.6) {
      if (canCheck && Math.random() < 0.3 && botChips > currentBet + bigBlind) {
        return { action: 'raise', raiseAmount: Math.min(botChips, currentBet + bigBlind) };
      }
      return canCheck ? { action: 'check' } : { action: 'call' };
    }
    return canCheck ? { action: 'check' } : { action: 'fold' };
  }

  // Fair tier: One Pair (Rank 2)
  if (handStrength === 2) {
    if (canCheck) return { action: 'check' };
    if (callCost <= potSize * 0.35 || callCost <= bigBlind * 2) {
      return { action: 'call' };
    }
    return { action: 'fold' };
  }

  // Weak tier: High Card (Rank 1)
  if (canCheck) return { action: 'check' };
  if (callCost <= bigBlind && Math.random() < 0.25) {
    return { action: 'call' };
  }
  return { action: 'fold' };
}
