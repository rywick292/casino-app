import { Card, ComboType, HandCombo, PokerVariant, Rank, Suit } from '../types';

export const SUIT_RANK: Record<Suit, number> = {
  spades: 1,
  clubs: 2,
  diamonds: 3,
  hearts: 4,
};

export const SUIT_SYMBOL: Record<Suit, string> = {
  spades: '♠',
  clubs: '♣',
  diamonds: '♦',
  hearts: '♥',
};

export const SUIT_COLOR: Record<Suit, string> = {
  spades: 'text-gray-900 dark:text-gray-100',
  clubs: 'text-gray-900 dark:text-gray-100',
  diamonds: 'text-red-600',
  hearts: 'text-red-600',
};

export const RANK_LABEL: Record<Rank, string> = {
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
  15: '2',
};

export const FIVE_CARD_CATEGORY_RANK: Record<Extract<ComboType, 'straight' | 'flush' | 'full-house' | 'four-of-a-kind' | 'straight-flush'>, number> = {
  'straight': 1,
  'flush': 2,
  'full-house': 3,
  'four-of-a-kind': 4,
  'straight-flush': 5,
};

// Returns total power of a card for comparison: rank * 10 + suit
export function getCardValue(card: Card): number {
  return card.rank * 10 + SUIT_RANK[card.suit];
}

// Create a standard 52-card deck
export function createDeck(): Card[] {
  const suits: Suit[] = ['spades', 'clubs', 'diamonds', 'hearts'];
  const ranks: Rank[] = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
      });
    }
  }
  return deck;
}

// Shuffle deck using Fisher-Yates shuffle
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Sort cards by Big 2 rank (3 -> 2) then suit (Spades -> Hearts)
export function sortCards(cards: Card[], ascending = true): Card[] {
  return [...cards].sort((a, b) => {
    const valA = getCardValue(a);
    const valB = getCardValue(b);
    return ascending ? valA - valB : valB - valA;
  });
}

// Helper to check if cards all share the same suit
export function isSuited(cards: Card[]): boolean {
  if (!cards || cards.length === 0) return true;
  return cards.every((c) => c.suit === cards[0].suit);
}

// Helper to check if ranks form consecutive sequence (e.g. 5-6-7 or 6-7-8-9)
export function isConsecutiveRanks(ranks: number[]): boolean {
  if (!ranks || ranks.length < 2) return false;
  const sorted = [...ranks].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] - sorted[i] !== 1) return false;
  }
  return true;
}

// Identify combo for 1, 2, 3, 4, or 5 cards respecting variant rules
export function identifyCombo(cards: Card[], variant: PokerVariant = 'global'): HandCombo | null {
  if (!cards || cards.length === 0) return null;
  const sorted = sortCards(cards, true);
  const len = sorted.length;

  if (len === 1) {
    const card = sorted[0];
    return {
      type: 'single',
      cards: sorted,
      primaryRank: card.rank,
      suitRank: SUIT_RANK[card.suit],
      description: `${RANK_LABEL[card.rank]}${SUIT_SYMBOL[card.suit]}`,
    };
  }

  if (len === 2) {
    if (sorted[0].rank === sorted[1].rank) {
      const highestCard = sorted[1]; // highest suit in sorted pair
      return {
        type: 'pair',
        cards: sorted,
        primaryRank: sorted[0].rank,
        suitRank: SUIT_RANK[highestCard.suit],
        description: `Pair of ${RANK_LABEL[sorted[0].rank]}s`,
      };
    }
    return null;
  }

  if (len === 3) {
    // 1. Triple (3 of a kind)
    if (sorted[0].rank === sorted[1].rank && sorted[1].rank === sorted[2].rank) {
      return {
        type: 'triple',
        cards: sorted,
        primaryRank: sorted[0].rank,
        suitRank: SUIT_RANK[sorted[2].suit],
        description: `Triple ${RANK_LABEL[sorted[0].rank]}s`,
      };
    }

    // 2. In Indonesian Poker: Exactly 3 Straight Cards (MUST be same suit/symbol!)
    if (variant === 'indonesian') {
      if (isSuited(sorted) && isConsecutiveRanks(sorted.map((c) => c.rank))) {
        const highestCard = sorted[2];
        return {
          type: 'straight-3',
          cards: sorted,
          primaryRank: highestCard.rank,
          suitRank: SUIT_RANK[highestCard.suit],
          description: `3-Straight (${sorted.map((c) => RANK_LABEL[c.rank]).join('-')} ${SUIT_SYMBOL[highestCard.suit]})`,
        };
      }
    }
    return null;
  }

  // 4 Cards: Four of a Kind Bomb OR 4 Straight Cards in Indonesian Poker
  if (len === 4) {
    // Four of a kind
    if (
      sorted[0].rank === sorted[1].rank &&
      sorted[1].rank === sorted[2].rank &&
      sorted[2].rank === sorted[3].rank
    ) {
      return {
        type: 'four-of-a-kind',
        cards: sorted,
        primaryRank: sorted[0].rank,
        suitRank: 4,
        isBomb: true,
        description: `4-of-a-Kind Bomb (${RANK_LABEL[sorted[0].rank as Rank]}s)`,
      };
    }

    // In Indonesian Poker: Exactly 4 Straight Cards (MUST be same suit/symbol!)
    if (variant === 'indonesian') {
      if (isSuited(sorted) && isConsecutiveRanks(sorted.map((c) => c.rank))) {
        const highestCard = sorted[3];
        return {
          type: 'straight-4',
          cards: sorted,
          primaryRank: highestCard.rank,
          suitRank: SUIT_RANK[highestCard.suit],
          description: `4-Straight (${sorted.map((c) => RANK_LABEL[c.rank]).join('-')} ${SUIT_SYMBOL[highestCard.suit]})`,
        };
      }
    }
    return null;
  }

  if (len === 5) {
    // Count ranks
    const rankCounts: Record<number, number> = {};
    for (const card of sorted) {
      rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    }
    const uniqueRanks = Object.keys(rankCounts).map(Number);
    const counts = Object.values(rankCounts);

    // Check Flush (same suit)
    const isFlush = isSuited(sorted);

    // Check Straight (either standard consecutive or A-2-3-4-5)
    let isStraight = isConsecutiveRanks(sorted.map((c) => c.rank));
    let straightHighestCard = sorted[4];

    // Special straight handling (e.g., A-2-3-4-5):
    if (!isStraight) {
      const ranksA2345 = [3, 4, 5, 14, 15];
      const actualRanks = sorted.map((c) => c.rank).sort((a, b) => a - b);
      if (actualRanks.length === 5 && actualRanks.every((val, idx) => val === ranksA2345[idx])) {
        isStraight = true;
        straightHighestCard = sorted.find((c) => c.rank === 5) || sorted[4];
      }
    }

    // 1. Straight Flush (5 straight cards in same symbol)
    // In Indonesian Poker: Bombs the '2' card and triggers an instant AUTO WIN!
    if (isStraight && isFlush) {
      return {
        type: 'straight-flush',
        cards: sorted,
        primaryRank: straightHighestCard.rank,
        suitRank: SUIT_RANK[straightHighestCard.suit],
        isBomb: true,
        description: `Straight Flush Bomb (${RANK_LABEL[straightHighestCard.rank]} High ${SUIT_SYMBOL[straightHighestCard.suit]})`,
      };
    }

    // 2. Four of a Kind + 1 kicker
    if (uniqueRanks.length === 2 && counts.includes(4)) {
      const quadRank = uniqueRanks.find((r) => rankCounts[r] === 4)!;
      return {
        type: 'four-of-a-kind',
        cards: sorted,
        primaryRank: quadRank,
        suitRank: 0,
        isBomb: true,
        description: `Four of a Kind (${RANK_LABEL[quadRank as Rank]}s)`,
      };
    }

    // 3. Full House (3 + 2)
    if (uniqueRanks.length === 2 && counts.includes(3) && counts.includes(2)) {
      const tripleRank = uniqueRanks.find((r) => rankCounts[r] === 3)!;
      return {
        type: 'full-house',
        cards: sorted,
        primaryRank: tripleRank,
        suitRank: 0,
        description: `Full House (${RANK_LABEL[tripleRank as Rank]}s)`,
      };
    }

    // 4. In Indonesian Poker:
    if (variant === 'indonesian') {
      // Straight House: 3 straight cards (SAME SUIT) + a pair of matching rank
      // "just like fullhouse but with three straight cards"
      const candidatePairRanks = uniqueRanks.filter((r) => rankCounts[r] >= 2);
      for (const pr of candidatePairRanks) {
        const pairCards = sorted.filter((c) => c.rank === pr).slice(0, 2);
        const remCards = sorted.filter((c) => !pairCards.some((pc) => pc.id === c.id));
        if (remCards.length === 3 && isSuited(remCards) && isConsecutiveRanks(remCards.map((c) => c.rank))) {
          const sortedRem = sortCards(remCards, true);
          const highestRem = sortedRem[2];
          return {
            type: 'straight-house',
            cards: sorted,
            primaryRank: highestRem.rank,
            suitRank: SUIT_RANK[highestRem.suit],
            description: `Straight House (${sortedRem.map((c) => RANK_LABEL[c.rank]).join('-')}${SUIT_SYMBOL[highestRem.suit]} + Pair ${RANK_LABEL[pr as Rank]}s)`,
          };
        }
      }

      // In Indonesian Poker: straight card MUST be in the same symbols and CANNOT with different symbols!
      // And regular flushes are not allowed.
      return null;
    }

    // 5. Global Big 2 Flush & Straight
    if (isFlush) {
      const highestCard = sorted[4];
      return {
        type: 'flush',
        cards: sorted,
        primaryRank: highestCard.rank,
        suitRank: SUIT_RANK[highestCard.suit],
        description: `Flush of ${sorted[0].suit.toUpperCase()} (${RANK_LABEL[highestCard.rank]} High)`,
      };
    }

    if (isStraight) {
      return {
        type: 'straight',
        cards: sorted,
        primaryRank: straightHighestCard.rank,
        suitRank: SUIT_RANK[straightHighestCard.suit],
        description: `Straight (${RANK_LABEL[straightHighestCard.rank]} High)`,
      };
    }

    return null;
  }

  return null;
}

// Helper to test if a combo is considered a Bomb (4-of-a-kind or Straight Flush)
export function isBombCombo(combo: HandCombo): boolean {
  return combo.type === 'straight-flush' || combo.type === 'four-of-a-kind' || !!combo.isBomb;
}

// Compare if newCombo beats currentCombo, respecting selected variant
export function canBeatCombo(
  newCombo: HandCombo,
  currentCombo: HandCombo | null,
  variant: PokerVariant = 'global'
): boolean {
  if (!currentCombo) return true; // Free turn / table cleared

  const newIsBomb = isBombCombo(newCombo);
  const currentIsBomb = isBombCombo(currentCombo);

  // INDONESIAN POKER (Capsa Banting) RULES
  if (variant === 'indonesian') {
    // 1. Bomb mechanics in Indonesian Poker:
    // A 5-card Straight Flush can BOMB any "2" card (single 2, pair of 2s, etc.) and auto win!
    const tableHasDeuce = currentCombo.primaryRank === 15 || currentCombo.cards.some((c) => c.rank === 15);
    const isSingleDeuce = currentCombo.type === 'single' && currentCombo.primaryRank === 15;

    // 5-Card Straight Flush (5 straight cards) can BOMB any '2' card play!
    if (newCombo.type === 'straight-flush') {
      if (tableHasDeuce || currentCombo.cards.length === 5 || currentIsBomb) {
        return true;
      }
    }

    if (currentIsBomb) {
      // Fighting an existing Bomb:
      if (!newIsBomb) return false; // Non-bomb cannot beat a Bomb!

      // Straight Flush vs Four of a Kind: Straight Flush ALWAYS beats Four of a Kind!
      if (newCombo.type === 'straight-flush' && currentCombo.type === 'four-of-a-kind') {
        return true;
      }
      if (newCombo.type === 'four-of-a-kind' && currentCombo.type === 'straight-flush') {
        return false;
      }

      // Straight Flush vs Straight Flush:
      if (newCombo.type === 'straight-flush' && currentCombo.type === 'straight-flush') {
        if (newCombo.primaryRank > currentCombo.primaryRank) return true;
        if (newCombo.primaryRank === currentCombo.primaryRank) {
          return newCombo.suitRank > currentCombo.suitRank;
        }
        return false;
      }

      // Four of a Kind vs Four of a Kind:
      if (newCombo.type === 'four-of-a-kind' && currentCombo.type === 'four-of-a-kind') {
        return newCombo.primaryRank > currentCombo.primaryRank;
      }

      return false;
    }

    // 4-of-a-kind can BOMB a single 2!
    if (isSingleDeuce && newIsBomb) {
      return true;
    }

    // 2. Strict 5-card combo rule in Indonesian Poker:
    // "if the gameplay playing straight, fullhouse cannot be playable because it is not eligible (if straight must have straight, if fullhouse need to play fullhouse)"
    if (newCombo.cards.length === 5 && currentCombo.cards.length === 5) {
      if (newCombo.type !== currentCombo.type) {
        return false; // Cannot play Fullhouse over Straight House, etc.
      }
      // Same 5-card combo type comparison:
      return newCombo.primaryRank > currentCombo.primaryRank;
    }

    // 3. Single, Pair, Triple, 3-Card Straight, 4-Card Straight, 4-Card Quad standard matching
    if (newCombo.cards.length !== currentCombo.cards.length) {
      return false;
    }

    if (newCombo.type !== currentCombo.type) return false;

    // In Indonesian Poker: Strictly higher number required!
    return newCombo.primaryRank > currentCombo.primaryRank;
  }

  // GLOBAL BIG 2 RULES
  // Card count must match (unless 5-card hands comparison)
  if (newCombo.cards.length !== currentCombo.cards.length) {
    return false;
  }

  // Single, Pair, Triple, 4-Card Quad: must match exact type
  if (currentCombo.type === 'single' || currentCombo.type === 'pair' || currentCombo.type === 'triple' || (currentCombo.type === 'four-of-a-kind' && currentCombo.cards.length === 4)) {
    if (newCombo.type !== currentCombo.type) return false;
    if (newCombo.primaryRank > currentCombo.primaryRank) return true;
    if (newCombo.primaryRank === currentCombo.primaryRank) {
      return newCombo.suitRank > currentCombo.suitRank;
    }
    return false;
  }

  // 5-card hands:
  const is5CardNew = newCombo.cards.length === 5;
  const is5CardCurrent = currentCombo.cards.length === 5;

  if (is5CardNew && is5CardCurrent) {
    const newCatRank = FIVE_CARD_CATEGORY_RANK[newCombo.type as keyof typeof FIVE_CARD_CATEGORY_RANK];
    const curCatRank = FIVE_CARD_CATEGORY_RANK[currentCombo.type as keyof typeof FIVE_CARD_CATEGORY_RANK];

    if (newCatRank > curCatRank) return true;
    if (newCatRank < curCatRank) return false;

    // Same category of 5-card hand:
    if (newCombo.primaryRank > currentCombo.primaryRank) return true;
    if (newCombo.primaryRank === currentCombo.primaryRank) {
      return newCombo.suitRank > currentCombo.suitRank;
    }
    return false;
  }

  return false;
}

// Helper to check if hand contains 3 of Spades (3♠)
export function has3OfSpades(hand: Card[]): boolean {
  return hand.some((c) => c.rank === 3 && c.suit === 'spades');
}

// Helper to check if hand contains all 4 Twos (Dragon Quad Instant Reshuffle Rule)
export function checkHasFourTwos(hand: Card[]): boolean {
  if (!hand || hand.length < 4) return false;
  return hand.filter((c) => c.rank === 15).length === 4;
}

// Helper to check "MURNI" (Pure Cards Hand in Indonesian Poker):
// Hand has NO 'J' (11), NO 'Q' (12), and NO 'K' (13) court cards
export function checkHasMurni(hand: Card[]): boolean {
  if (!hand || hand.length === 0) return false;
  return !hand.some((c) => c.rank === 11 || c.rank === 12 || c.rank === 13);
}

export interface CategorizedCombos {
  royalFlushes: HandCombo[];
  straightFlushes: HandCombo[];
  fourOfAKinds: HandCombo[];
  fullHouses: HandCombo[];
  straightHouses: HandCombo[];
  flushes: HandCombo[];
  straights: HandCombo[];
  straights4: HandCombo[];
  straights3: HandCombo[];
  triples: HandCombo[];
  pairs: HandCombo[];
  singles: HandCombo[];
}

// Find categorized poker combinations in a hand for quick Auto-Select
export function findCategorizedCombos(hand: Card[], variant: PokerVariant = 'global'): CategorizedCombos {
  const sorted = sortCards(hand, true);
  const result: CategorizedCombos = {
    royalFlushes: [],
    straightFlushes: [],
    fourOfAKinds: [],
    fullHouses: [],
    straightHouses: [],
    flushes: [],
    straights: [],
    straights4: [],
    straights3: [],
    triples: [],
    pairs: [],
    singles: [],
  };

  if (!sorted || sorted.length === 0) return result;

  // 1. Singles
  for (const card of sorted) {
    const combo = identifyCombo([card], variant);
    if (combo) result.singles.push(combo);
  }

  // Group by Rank
  const rankMap: Record<number, Card[]> = {};
  for (const c of sorted) {
    if (!rankMap[c.rank]) rankMap[c.rank] = [];
    rankMap[c.rank].push(c);
  }

  // 2. Pairs
  const pairRanks = Object.keys(rankMap)
    .map(Number)
    .filter((r) => rankMap[r].length >= 2);

  for (const r of pairRanks) {
    const cards = rankMap[r];
    if (cards.length === 2) {
      const combo = identifyCombo(cards, variant);
      if (combo) result.pairs.push(combo);
    } else if (cards.length >= 3) {
      const combo = identifyCombo(cards.slice(cards.length - 2), variant);
      if (combo) result.pairs.push(combo);
      if (cards.length === 4) {
        const combo2 = identifyCombo(cards.slice(0, 2), variant);
        if (combo2) result.pairs.push(combo2);
      }
    }
  }

  // 3. Triples
  const tripleRanks = Object.keys(rankMap)
    .map(Number)
    .filter((r) => rankMap[r].length >= 3);

  for (const r of tripleRanks) {
    const cards = rankMap[r];
    const combo = identifyCombo(cards.slice(0, 3), variant);
    if (combo) result.triples.push(combo);
  }

  // 4. Four of a Kind (both 4-card Bomb and 4 + 1 kicker)
  const quadRanks = Object.keys(rankMap)
    .map(Number)
    .filter((r) => rankMap[r].length === 4);

  for (const qr of quadRanks) {
    const quads = rankMap[qr];
    const quadBomb = identifyCombo(quads, variant);
    if (quadBomb) result.fourOfAKinds.push(quadBomb);

    const kicker = sorted.find((c) => c.rank !== qr);
    if (kicker) {
      const combo5 = identifyCombo([...quads, kicker], variant);
      if (combo5) result.fourOfAKinds.push(combo5);
    }
  }

  // 5. Full Houses (Triple + Pair)
  for (const tr of tripleRanks) {
    const tripCards = rankMap[tr].slice(0, 3);
    for (const pr of pairRanks) {
      if (pr === tr) continue;
      const pairCards = rankMap[pr].slice(0, 2);
      const combo = identifyCombo([...tripCards, ...pairCards], variant);
      if (combo && combo.type === 'full-house') result.fullHouses.push(combo);
    }
  }

  // Group by Suit
  const suitMap: Record<Suit, Card[]> = {
    spades: [],
    clubs: [],
    diamonds: [],
    hearts: [],
  };
  for (const c of sorted) {
    suitMap[c.suit].push(c);
  }

  // 6. Indonesian Poker Suited Straights (3-Straights, 4-Straights, Straight Houses)
  if (variant === 'indonesian') {
    for (const suit of Object.keys(suitMap) as Suit[]) {
      const suitCards = sortCards(suitMap[suit], true);

      // 3-Card Straights (same suit)
      if (suitCards.length >= 3) {
        for (let i = 0; i <= suitCards.length - 3; i++) {
          const trio = suitCards.slice(i, i + 3);
          const combo = identifyCombo(trio, variant);
          if (combo && combo.type === 'straight-3') {
            result.straights3.push(combo);

            // Also check Straight House: 3-straight + pair
            for (const pr of pairRanks) {
              const pairCards = rankMap[pr].slice(0, 2);
              if (!pairCards.some((pc) => trio.some((tc) => tc.id === pc.id))) {
                const shCombo = identifyCombo([...trio, ...pairCards], variant);
                if (shCombo && shCombo.type === 'straight-house') {
                  result.straightHouses.push(shCombo);
                }
              }
            }
          }
        }
      }

      // 4-Card Straights (same suit)
      if (suitCards.length >= 4) {
        for (let i = 0; i <= suitCards.length - 4; i++) {
          const quad = suitCards.slice(i, i + 4);
          const combo = identifyCombo(quad, variant);
          if (combo && combo.type === 'straight-4') {
            result.straights4.push(combo);
          }
        }
      }
    }
  }

  // 7. Flushes & Flush Combos (Only in Global Big 2; NOT in Indonesian Poker)
  if (variant !== 'indonesian') {
    for (const suit of Object.keys(suitMap) as Suit[]) {
      const suitCards = suitMap[suit];
      if (suitCards.length >= 5) {
        for (let i = 0; i <= suitCards.length - 5; i++) {
          const five = suitCards.slice(i, i + 5);
          const combo = identifyCombo(five, variant);
          if (combo && combo.type === 'flush') {
            result.flushes.push(combo);
          }
        }
      }
    }

    // Straights (Global Big 2 allows mixed suits)
    const uniqueRanks = Array.from(new Set(sorted.map((c) => c.rank))).sort((a, b) => a - b);
    for (let i = 0; i <= uniqueRanks.length - 5; i++) {
      const seq = uniqueRanks.slice(i, i + 5);
      if (
        seq[1] === seq[0] + 1 &&
        seq[2] === seq[1] + 1 &&
        seq[3] === seq[2] + 1 &&
        seq[4] === seq[3] + 1
      ) {
        const cardsInSeq = seq.map((r) => rankMap[r][0]);
        const combo = identifyCombo(cardsInSeq, variant);
        if (combo && combo.type === 'straight') {
          result.straights.push(combo);
        }
      }
    }
  }

  // 8. Straight Flushes & Royal Flushes (Valid in both, Bomb in Indonesian Poker!)
  for (const suit of Object.keys(suitMap) as Suit[]) {
    const suitCards = suitMap[suit];
    if (suitCards.length >= 5) {
      const sRanks = Array.from(new Set(suitCards.map((c) => c.rank))).sort((a, b) => a - b);
      for (let i = 0; i <= sRanks.length - 5; i++) {
        const seq = sRanks.slice(i, i + 5);
        if (
          seq[1] === seq[0] + 1 &&
          seq[2] === seq[1] + 1 &&
          seq[3] === seq[2] + 1 &&
          seq[4] === seq[3] + 1
        ) {
          const sfCards = seq.map((r) => suitCards.find((c) => c.rank === r)!);
          const combo = identifyCombo(sfCards, variant);
          if (combo && combo.type === 'straight-flush') {
            if (seq[0] === 10 && seq[4] === 14) {
              result.royalFlushes.push({
                ...combo,
                description: `Royal Flush of ${suit.toUpperCase()}`,
              });
            } else {
              result.straightFlushes.push(combo);
            }
          }
        }
      }
    }
  }

  return result;
}

