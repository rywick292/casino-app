import { Card, Difficulty, HandCombo, Player, PokerVariant } from '../types';
import { canBeatCombo, getCardValue, has3OfSpades, identifyCombo, sortCards } from './pokerRules';

// Generate all possible sub-sets of cards of length k
function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [head, ...tail] = arr;
  const withHead = getCombinations(tail, k - 1).map((c) => [head, ...c]);
  const withoutHead = getCombinations(tail, k);
  return [...withHead, ...withoutHead];
}

// Find all valid hand combos from a player's hand
export function findAllValidCombos(hand: Card[], variant: PokerVariant = 'global'): HandCombo[] {
  const sorted = sortCards(hand, true);
  const validCombos: HandCombo[] = [];

  // Singles
  for (const card of sorted) {
    const combo = identifyCombo([card], variant);
    if (combo) validCombos.push(combo);
  }

  // Pairs
  if (sorted.length >= 2) {
    const pairs = getCombinations(sorted, 2);
    for (const p of pairs) {
      const combo = identifyCombo(p, variant);
      if (combo) validCombos.push(combo);
    }
  }

  // Triples
  if (sorted.length >= 3) {
    const triples = getCombinations(sorted, 3);
    for (const t of triples) {
      const combo = identifyCombo(t, variant);
      if (combo) validCombos.push(combo);
    }
  }

  // 4-Card hands (Four of a kind Quad Bomb)
  if (sorted.length >= 4) {
    const fourCards = getCombinations(sorted, 4);
    for (const f of fourCards) {
      const combo = identifyCombo(f, variant);
      if (combo) validCombos.push(combo);
    }
  }

  // 5-Card hands
  if (sorted.length >= 5) {
    const fiveCards = getCombinations(sorted, 5);
    for (const f of fiveCards) {
      const combo = identifyCombo(f, variant);
      if (combo) validCombos.push(combo);
    }
  }

  return validCombos;
}

// AI Turn Decision Engine
export function chooseAIMove(
  aiPlayer: Player,
  currentCombo: HandCombo | null,
  difficulty: Difficulty,
  isFirstTurnOfGame: boolean,
  allPlayers: Player[],
  variant: PokerVariant = 'global'
): HandCombo | null {
  const hand = aiPlayer.hand;
  if (hand.length === 0) return null;

  let allCombos = findAllValidCombos(hand, variant);

  // If first turn of game and AI has 3 of Spades, MUST include 3 of Spades!
  const has3Spades = has3OfSpades(hand);
  if (isFirstTurnOfGame && has3Spades) {
    allCombos = allCombos.filter((c) => c.cards.some((card) => card.rank === 3 && card.suit === 'spades'));
  }

  // Filter combos that beat currentCombo respecting variant rules
  const legalCombos = allCombos.filter((c) => canBeatCombo(c, currentCombo, variant));

  if (legalCombos.length === 0) {
    return null; // Must pass
  }

  // Check if any legal combo wins the game immediately (empties hand!)
  const winningMove = legalCombos.find((c) => c.cards.length === hand.length);
  if (winningMove) {
    return winningMove;
  }

  // In Indonesian Poker: 5-Card Straight Flush triggers an instant AUTO WIN! Prioritize playing it!
  if (variant === 'indonesian') {
    const autoWinStraightFlush = legalCombos.find((c) => c.type === 'straight-flush');
    if (autoWinStraightFlush) {
      return autoWinStraightFlush;
    }
  }

  // If in Indonesian Poker and currentCombo is a '2', or is a bomb:
  if (variant === 'indonesian' && currentCombo && (currentCombo.primaryRank === 15 || currentCombo.cards.some((c) => c.rank === 15) || currentCombo.isBomb)) {
    const bombMoves = legalCombos.filter((c) => c.isBomb || c.type === 'straight-flush' || (c.type === 'four-of-a-kind' && c.cards.length === 4));
    if (bombMoves.length > 0) {
      // Drop bomb to win immediately or stop the 2
      if (difficulty !== 'easy' || Math.random() < 0.8) {
        return bombMoves.sort((a, b) => a.primaryRank - b.primaryRank)[0];
      }
    }
  }

  // EASY DIFFICULTY
  if (difficulty === 'easy') {
    // If not leading, 25% chance to pass even if legal move exists
    if (currentCombo && Math.random() < 0.25) {
      return null;
    }
    // Pick a random legal combo or lowest combo
    const lowestCombo = legalCombos.sort((a, b) => a.primaryRank - b.primaryRank)[0];
    return lowestCombo;
  }

  // MEDIUM DIFFICULTY
  if (difficulty === 'medium') {
    // If leading (currentCombo is null)
    if (!currentCombo) {
      // Prefer multi-card combos (5-card, 4-card, triple, pair) over singles
      const multiCardCombos = legalCombos.filter((c) => c.cards.length > 1);
      if (multiCardCombos.length > 0) {
        return multiCardCombos.sort((a, b) => a.primaryRank - b.primaryRank)[0];
      }
      // Otherwise lowest single
      return legalCombos.sort((a, b) => a.primaryRank - b.primaryRank)[0];
    }

    // Following: pick lowest combo that beats table, avoid playing 2s unless necessary
    const nonDeuceCombos = legalCombos.filter((c) => !c.cards.some((card) => card.rank === 15));
    if (nonDeuceCombos.length > 0) {
      return nonDeuceCombos.sort((a, b) => a.primaryRank - b.primaryRank)[0];
    }

    // If only deuces available and opponent has <= 3 cards left, use deuce!
    const opponentInDanger = allPlayers.some((p) => p.id !== aiPlayer.id && p.hand.length <= 3);
    if (opponentInDanger) {
      return legalCombos.sort((a, b) => a.primaryRank - b.primaryRank)[0];
    }

    // Otherwise pass to save 2s
    if (Math.random() < 0.5) return null;
    return legalCombos.sort((a, b) => a.primaryRank - b.primaryRank)[0];
  }

  // HARD DIFFICULTY
  if (difficulty === 'hard') {
    const minOpponentHandSize = Math.min(...allPlayers.filter((p) => p.id !== aiPlayer.id).map((p) => p.hand.length));
    const dangerMode = minOpponentHandSize <= 3;

    // If leading (free turn):
    if (!currentCombo) {
      // 1. Try 5-card hands first to dump cards fast
      const fiveCardHands = legalCombos.filter((c) => c.cards.length === 5);
      if (fiveCardHands.length > 0) {
        return fiveCardHands.sort((a, b) => a.primaryRank - b.primaryRank)[0];
      }
      // 2. Try Triples or Pairs next
      const pairsOrTriples = legalCombos.filter((c) => c.cards.length === 2 || c.cards.length === 3 || c.cards.length === 4);
      if (pairsOrTriples.length > 0) {
        return pairsOrTriples.sort((a, b) => a.primaryRank - b.primaryRank)[0];
      }
      // 3. Play lowest single card
      const singles = legalCombos.filter((c) => c.cards.length === 1);
      return singles.sort((a, b) => getCardValue(a.cards[0]) - getCardValue(b.cards[0]))[0];
    }

    // Following turn:
    if (dangerMode) {
      // Opponent is close to winning! Play HIGHEST valid card/combo to stop them
      return legalCombos.sort((a, b) => b.primaryRank - a.primaryRank || b.suitRank - a.suitRank)[0];
    }

    // Standard hard play: play smallest combo that beats current, preserving 2s for late game
    const nonDeuceCombos = legalCombos.filter((c) => !c.cards.some((card) => card.rank === 15));
    if (nonDeuceCombos.length > 0) {
      return nonDeuceCombos.sort((a, b) => a.primaryRank - b.primaryRank || a.suitRank - b.suitRank)[0];
    }

    // If AI holds 2s and hand is small (<= 4 cards), use 2s to gain control
    if (hand.length <= 4) {
      return legalCombos.sort((a, b) => a.primaryRank - b.primaryRank)[0];
    }

    // Pass to let others fight unless it's a small single/pair
    if (currentCombo.cards[0].rank >= 14 && Math.random() < 0.7) {
      return null; // Pass against Ace/2 leads
    }

    return legalCombos.sort((a, b) => a.primaryRank - b.primaryRank)[0];
  }

  return legalCombos[0];
}

