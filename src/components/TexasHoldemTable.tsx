import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Coins,
  HelpCircle,
  Play,
  RotateCcw,
  Sliders,
  Volume2,
  VolumeX,
  Users,
  Trophy,
} from 'lucide-react';
import { Card, HoldemPlayer, HoldemStage } from '../types';
import { CardView } from './CardView';
import {
  createHoldemDeck,
  evaluateBestHoldemHand,
  compareHoldemEvaluations,
  decideBotAction,
} from '../utils/holdemEvaluator';
import { soundEffects } from '../utils/soundEffects';

interface TexasHoldemTableProps {
  currentCoins: number;
  onUpdateCoins: (newCoins: number) => void;
  onGoToMainMenu: () => void;
  onOpenRules: () => void;
}

const DEFAULT_BIG_BLIND = 200;
const DEFAULT_SMALL_BLIND = 100;

const BOT_PRESETS = [
  { name: 'Ace Hunter', avatar: '🦊' },
  { name: 'Viper VIP', avatar: '🐍' },
  { name: 'Maverick', avatar: '🦅' },
  { name: 'Tiger Shark', avatar: '🐯' },
  { name: 'Cyber Bot', avatar: '🤖' },
  { name: 'Golden Lion', avatar: '🦁' },
  { name: 'Lady Luck', avatar: '👑' },
];

export const TexasHoldemTable: React.FC<TexasHoldemTableProps> = ({
  currentCoins,
  onUpdateCoins,
  onGoToMainMenu,
  onOpenRules,
}) => {
  // Sound toggle
  const [soundOn, setSoundOn] = useState<boolean>(soundEffects.isEnabled());

  // Customizable Bot Count: 1 to 7 bots (Total 2 to 8 players)
  const [botCount, setBotCount] = useState<number>(3); // Default 3 bots (4 players total)
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  // Blinds
  const [bigBlind, setBigBlind] = useState<number>(DEFAULT_BIG_BLIND);
  const smallBlind = Math.floor(bigBlind / 2);

  // Deck & Community Cards
  const [deck, setDeck] = useState<Card[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);

  // Players
  const [players, setPlayers] = useState<HoldemPlayer[]>([]);

  // Positions
  const [dealerBtnIndex, setDealerBtnIndex] = useState<number>(0);
  const [activeTurnIndex, setActiveTurnIndex] = useState<number>(-1);

  // Stage & Betting
  const [stage, setStage] = useState<HoldemStage>('preflop');
  const [pot, setPot] = useState<number>(0);
  const [currentBet, setCurrentBet] = useState<number>(0);
  const [minRaiseAmount, setMinRaiseAmount] = useState<number>(DEFAULT_BIG_BLIND);
  const [isHandInProgress, setIsHandInProgress] = useState<boolean>(false);

  // Raise slider state
  const [raiseSliderValue, setRaiseSliderValue] = useState<number>(DEFAULT_BIG_BLIND * 2);

  // Messages & winners
  const [tableNotice, setTableNotice] = useState<string>('Welcome to Texas Hold\'em! Press Start Hand.');
  const [handWinners, setHandWinners] = useState<{ player: HoldemPlayer; winAmount: number; summary: string }[]>([]);

  // Track players who acted in current round
  const [actedPlayers, setActedPlayers] = useState<Set<string>>(new Set());

  // Timer reference for bot actions and animations
  const turnTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (turnTimeoutRef.current) clearTimeout(turnTimeoutRef.current);
    };
  }, []);

  const handleToggleSound = () => {
    const updated = soundEffects.toggleSound();
    setSoundOn(updated);
  };

  // Helper to initialize players
  const setupPlayers = (numBots: number) => {
    const newPlayers: HoldemPlayer[] = [
      {
        id: 'player-human',
        name: 'You (Player)',
        isHuman: true,
        avatar: '🤠',
        chips: currentCoins,
        currentBet: 0,
        totalRoundInvestment: 0,
        cards: [],
        hasFolded: false,
        isAllIn: false,
        lastAction: 'none',
      },
    ];

    for (let i = 0; i < numBots; i++) {
      const preset = BOT_PRESETS[i % BOT_PRESETS.length];
      newPlayers.push({
        id: `bot-${i + 1}`,
        name: preset.name,
        isHuman: false,
        avatar: preset.avatar,
        chips: 50000,
        currentBet: 0,
        totalRoundInvestment: 0,
        cards: [],
        hasFolded: false,
        isAllIn: false,
        lastAction: 'none',
      });
    }

    return newPlayers;
  };

  // Initialize on mount
  useEffect(() => {
    const initialPlayers = setupPlayers(botCount);
    setPlayers(initialPlayers);
  }, [botCount]);

  // START A NEW HAND
  const startNewHand = () => {
    if (turnTimeoutRef.current) clearTimeout(turnTimeoutRef.current);

    soundEffects.playShuffle();
    setHandWinners([]);
    setCommunityCards([]);

    // Rotate dealer button
    const newDealerIdx = (dealerBtnIndex + 1) % (botCount + 1);
    setDealerBtnIndex(newDealerIdx);

    // Create fresh shuffled 52-card deck
    const newDeck = createHoldemDeck();
    let deckIdx = 0;

    const totalCount = botCount + 1;
    const sbIdx = (newDealerIdx + 1) % totalCount;
    const bbIdx = (newDealerIdx + 2) % totalCount;

    // Reset players & deal 2 hole cards
    const freshPlayers: HoldemPlayer[] = players.map((p, idx) => {
      const c1 = newDeck[deckIdx++];
      const c2 = newDeck[deckIdx++];
      return {
        ...p,
        chips: p.isHuman ? currentCoins : p.chips < bigBlind * 2 ? 50000 : p.chips,
        currentBet: 0,
        totalRoundInvestment: 0,
        cards: [c1, c2],
        hasFolded: false,
        isAllIn: false,
        lastAction: 'none',
        lastActionText: undefined,
        evaluation: undefined,
      };
    });

    // Post Blinds
    // Small Blind
    const sbPlayer = freshPlayers[sbIdx];
    const actualSb = Math.min(sbPlayer.chips, smallBlind);
    sbPlayer.chips -= actualSb;
    sbPlayer.currentBet = actualSb;
    sbPlayer.totalRoundInvestment = actualSb;
    sbPlayer.lastActionText = `SB $${actualSb}`;
    if (sbPlayer.chips === 0) sbPlayer.isAllIn = true;

    // Big Blind
    const bbPlayer = freshPlayers[bbIdx];
    const actualBb = Math.min(bbPlayer.chips, bigBlind);
    bbPlayer.chips -= actualBb;
    bbPlayer.currentBet = actualBb;
    bbPlayer.totalRoundInvestment = actualBb;
    bbPlayer.lastActionText = `BB $${actualBb}`;
    if (bbPlayer.chips === 0) bbPlayer.isAllIn = true;

    // Deduct human if human posted blind
    if (sbPlayer.isHuman) onUpdateCoins(currentCoins - actualSb);
    if (bbPlayer.isHuman) onUpdateCoins(currentCoins - actualBb);

    const initialPot = actualSb + actualBb;
    const remainingDeck = newDeck.slice(deckIdx);

    setDeck(remainingDeck);
    setPlayers(freshPlayers);
    setPot(initialPot);
    setCurrentBet(bigBlind);
    setMinRaiseAmount(bigBlind * 2);
    setRaiseSliderValue(bigBlind * 2);
    setStage('preflop');
    setIsHandInProgress(true);

    // Action starts after BB (Under the Gun)
    const utgIdx = (bbIdx + 1) % totalCount;
    setActiveTurnIndex(utgIdx);
    setActedPlayers(new Set());

    soundEffects.playCardDeal();
    setTableNotice(`Pre-flop: Action is on ${freshPlayers[utgIdx].name}`);
  };

  // Turn management: Check if current turn is AI or human
  useEffect(() => {
    if (!isHandInProgress || activeTurnIndex === -1 || stage === 'showdown') return;

    const currentPlayer = players[activeTurnIndex];
    if (!currentPlayer) return;

    if (!currentPlayer.isHuman) {
      // AI Turn!
      turnTimeoutRef.current = setTimeout(() => {
        executeAiTurn(activeTurnIndex);
      }, 900);
    }
  }, [activeTurnIndex, isHandInProgress, stage]);

  // EXECUTE AI TURN
  const executeAiTurn = (aiIdx: number) => {
    const ai = players[aiIdx];
    if (!ai || ai.hasFolded || ai.isAllIn) {
      moveToNextTurn(players, actedPlayers);
      return;
    }

    const decision = decideBotAction(
      ai.cards,
      communityCards,
      currentBet,
      ai.currentBet,
      ai.chips,
      pot,
      bigBlind,
      stage
    );

    let updatedPlayers = [...players];
    let updatedPot = pot;
    let updatedCurrentBet = currentBet;
    let updatedMinRaise = minRaiseAmount;

    if (decision.action === 'fold') {
      soundEffects.playPassSound();
      updatedPlayers[aiIdx] = {
        ...ai,
        hasFolded: true,
        lastAction: 'fold',
        lastActionText: 'Fold',
      };
      setTableNotice(`${ai.name} Folds`);
    } else if (decision.action === 'check') {
      soundEffects.playCardSelect();
      updatedPlayers[aiIdx] = {
        ...ai,
        lastAction: 'check',
        lastActionText: 'Check',
      };
      setTableNotice(`${ai.name} Checks`);
    } else if (decision.action === 'call') {
      soundEffects.playChipSound();
      const callNeeded = currentBet - ai.currentBet;
      const actualCall = Math.min(ai.chips, callNeeded);

      updatedPot += actualCall;
      updatedPlayers[aiIdx] = {
        ...ai,
        chips: ai.chips - actualCall,
        currentBet: ai.currentBet + actualCall,
        totalRoundInvestment: ai.totalRoundInvestment + actualCall,
        isAllIn: ai.chips - actualCall === 0,
        lastAction: 'call',
        lastActionText: `Call $${actualCall.toLocaleString()}`,
      };
      setTableNotice(`${ai.name} Calls $${actualCall.toLocaleString()}`);
    } else if (decision.action === 'raise') {
      soundEffects.playChipSound();
      const targetRaise = decision.raiseAmount || currentBet + bigBlind;
      const additionalChips = targetRaise - ai.currentBet;
      const actualBet = Math.min(ai.chips, additionalChips);
      const totalSpotBet = ai.currentBet + actualBet;

      updatedPot += actualBet;
      updatedCurrentBet = totalSpotBet;
      updatedMinRaise = totalSpotBet + bigBlind;

      updatedPlayers[aiIdx] = {
        ...ai,
        chips: ai.chips - actualBet,
        currentBet: totalSpotBet,
        totalRoundInvestment: ai.totalRoundInvestment + actualBet,
        isAllIn: ai.chips - actualBet === 0,
        lastAction: 'raise',
        lastActionText: `Raise $${totalSpotBet.toLocaleString()}`,
      };
      setTableNotice(`${ai.name} Raises to $${totalSpotBet.toLocaleString()}`);
    }

    const nextActed = new Set<string>(actedPlayers);
    nextActed.add(ai.id);

    setPlayers(updatedPlayers);
    setPot(updatedPot);
    setCurrentBet(updatedCurrentBet);
    setMinRaiseAmount(updatedMinRaise);
    setActedPlayers(nextActed);

    moveToNextTurn(updatedPlayers, nextActed, updatedCurrentBet);
  };

  // HUMAN ACTIONS
  const handleHumanFold = () => {
    if (activeTurnIndex !== 0 || !isHandInProgress) return;
    soundEffects.playPassSound();

    const updatedPlayers = players.map((p, idx) =>
      idx === 0
        ? {
            ...p,
            hasFolded: true,
            lastAction: 'fold' as HoldemPlayer['lastAction'],
            lastActionText: 'Fold',
          }
        : p
    );

    const nextActed = new Set<string>(actedPlayers);
    nextActed.add(players[0].id);

    setPlayers(updatedPlayers);
    setActedPlayers(nextActed);
    setTableNotice('You folded.');

    moveToNextTurn(updatedPlayers, nextActed, currentBet);
  };

  const handleHumanCheck = () => {
    if (activeTurnIndex !== 0 || !isHandInProgress) return;
    soundEffects.playCardSelect();

    const updatedPlayers = players.map((p, idx) =>
      idx === 0
        ? {
            ...p,
            lastAction: 'check' as HoldemPlayer['lastAction'],
            lastActionText: 'Check',
          }
        : p
    );

    const nextActed = new Set<string>(actedPlayers);
    nextActed.add(players[0].id);

    setPlayers(updatedPlayers);
    setActedPlayers(nextActed);
    setTableNotice('You checked.');

    moveToNextTurn(updatedPlayers, nextActed, currentBet);
  };

  const handleHumanCall = () => {
    if (activeTurnIndex !== 0 || !isHandInProgress) return;
    soundEffects.playChipSound();

    const human = players[0];
    const callNeeded = currentBet - human.currentBet;
    const actualCall = Math.min(human.chips, callNeeded);

    onUpdateCoins(currentCoins - actualCall);

    const updatedPlayers = players.map((p, idx) =>
      idx === 0
        ? {
            ...p,
            chips: human.chips - actualCall,
            currentBet: human.currentBet + actualCall,
            totalRoundInvestment: human.totalRoundInvestment + actualCall,
            isAllIn: human.chips - actualCall === 0,
            lastAction: 'call' as HoldemPlayer['lastAction'],
            lastActionText: `Call $${actualCall.toLocaleString()}`,
          }
        : p
    );

    const nextActed = new Set<string>(actedPlayers);
    nextActed.add(human.id);

    setPlayers(updatedPlayers);
    setPot((prev) => prev + actualCall);
    setActedPlayers(nextActed);
    setTableNotice(`You called $${actualCall.toLocaleString()}.`);

    moveToNextTurn(updatedPlayers, nextActed, currentBet);
  };

  const handleHumanRaise = (raiseTotal: number) => {
    if (activeTurnIndex !== 0 || !isHandInProgress) return;
    soundEffects.playChipSound();

    const human = players[0];
    const additional = raiseTotal - human.currentBet;
    const actualInvestment = Math.min(human.chips, additional);
    const newTotalBet = human.currentBet + actualInvestment;

    onUpdateCoins(currentCoins - actualInvestment);

    const updatedPlayers = players.map((p, idx) =>
      idx === 0
        ? {
            ...p,
            chips: human.chips - actualInvestment,
            currentBet: newTotalBet,
            totalRoundInvestment: human.totalRoundInvestment + actualInvestment,
            isAllIn: human.chips - actualInvestment === 0,
            lastAction: 'raise' as HoldemPlayer['lastAction'],
            lastActionText: `Raise $${newTotalBet.toLocaleString()}`,
          }
        : p
    );

    // Raising resets other players' acted status (they must call or fold)
    const nextActed = new Set<string>([human.id]);

    setPlayers(updatedPlayers);
    setPot((prev) => prev + actualInvestment);
    setCurrentBet(newTotalBet);
    setMinRaiseAmount(newTotalBet + bigBlind);
    setRaiseSliderValue(newTotalBet + bigBlind);
    setActedPlayers(nextActed);
    setTableNotice(`You raised to $${newTotalBet.toLocaleString()}!`);

    moveToNextTurn(updatedPlayers, nextActed, newTotalBet);
  };

  // Advance turn to next active player or next betting stage
  const moveToNextTurn = (
    currPlayers: HoldemPlayer[],
    currActed: Set<string>,
    activeBet: number = currentBet
  ) => {
    // 1. Check if only one non-folded player remains
    const activePlayers = currPlayers.filter((p) => !p.hasFolded);
    if (activePlayers.length === 1) {
      resolveHandByFold(currPlayers, activePlayers[0]);
      return;
    }

    // 2. Check if betting round is complete
    // All active players must have acted AND their currentBet must equal activeBet (or be all-in)
    const roundComplete = activePlayers.every(
      (p) => p.isAllIn || (currActed.has(p.id) && p.currentBet === activeBet)
    );

    if (roundComplete) {
      advanceStage(currPlayers);
      return;
    }

    // 3. Find next active player
    let nextIdx = (activeTurnIndex + 1) % currPlayers.length;
    let found = false;

    for (let i = 0; i < currPlayers.length; i++) {
      const p = currPlayers[nextIdx];
      if (!p.hasFolded && !p.isAllIn) {
        found = true;
        break;
      }
      nextIdx = (nextIdx + 1) % currPlayers.length;
    }

    if (found) {
      setActiveTurnIndex(nextIdx);
      setTableNotice(`Action on ${currPlayers[nextIdx].name}`);
    } else {
      // Everyone else is all-in or folded! Run out community cards
      advanceStage(currPlayers);
    }
  };

  // Advance to next stage (Preflop -> Flop -> Turn -> River -> Showdown)
  const advanceStage = (currPlayers: HoldemPlayer[]) => {
    // Reset round bets
    const resetPlayers = currPlayers.map((p) => ({
      ...p,
      currentBet: 0,
      lastActionText: undefined,
    }));
    setPlayers(resetPlayers);
    setCurrentBet(0);
    setMinRaiseAmount(bigBlind);
    setRaiseSliderValue(bigBlind);
    setActedPlayers(new Set());

    let deckCopy = [...deck];
    let commCards = [...communityCards];

    soundEffects.playCardDeal();

    if (stage === 'preflop') {
      // Deal Flop (3 cards)
      commCards = [deckCopy[0], deckCopy[1], deckCopy[2]];
      deckCopy = deckCopy.slice(3);
      setCommunityCards(commCards);
      setDeck(deckCopy);
      setStage('flop');
      setTableNotice('Flop dealt! Betting round 2.');
      startPostFlopAction(resetPlayers);
    } else if (stage === 'flop') {
      // Deal Turn (1 card)
      commCards = [...commCards, deckCopy[0]];
      deckCopy = deckCopy.slice(1);
      setCommunityCards(commCards);
      setDeck(deckCopy);
      setStage('turn');
      setTableNotice('Turn dealt! Betting round 3.');
      startPostFlopAction(resetPlayers);
    } else if (stage === 'turn') {
      // Deal River (1 card)
      commCards = [...commCards, deckCopy[0]];
      deckCopy = deckCopy.slice(1);
      setCommunityCards(commCards);
      setDeck(deckCopy);
      setStage('river');
      setTableNotice('River dealt! Final betting round.');
      startPostFlopAction(resetPlayers);
    } else if (stage === 'river') {
      // Showdown!
      resolveShowdown(resetPlayers, commCards);
    }
  };

  // Start action for Flop, Turn, River: starts with first active player left of Dealer button
  const startPostFlopAction = (currPlayers: HoldemPlayer[]) => {
    const totalCount = currPlayers.length;
    let startIdx = (dealerBtnIndex + 1) % totalCount;

    for (let i = 0; i < totalCount; i++) {
      const p = currPlayers[startIdx];
      if (!p.hasFolded && !p.isAllIn) {
        setActiveTurnIndex(startIdx);
        return;
      }
      startIdx = (startIdx + 1) % totalCount;
    }

    // If all players are all-in, fast-forward to next stage
    turnTimeoutRef.current = setTimeout(() => {
      advanceStage(currPlayers);
    }, 1200);
  };

  // Single winner when everyone else folds
  const resolveHandByFold = (currPlayers: HoldemPlayer[], winner: HoldemPlayer) => {
    setActiveTurnIndex(-1);
    setIsHandInProgress(false);
    setStage('showdown');

    const winPot = pot;
    soundEffects.playWinSound();

    if (winner.isHuman) {
      soundEffects.playKaChing();
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
      onUpdateCoins(currentCoins + winPot);
    }

    setHandWinners([
      {
        player: winner,
        winAmount: winPot,
        summary: 'All opponents folded. Uncontested win!',
      },
    ]);
    setTableNotice(`🏆 ${winner.name} wins $${winPot.toLocaleString()}!`);
  };

  // Full Showdown: evaluate best 5-card hand for all active players
  const resolveShowdown = (currPlayers: HoldemPlayer[], finalCommunity: Card[]) => {
    setActiveTurnIndex(-1);
    setIsHandInProgress(false);
    setStage('showdown');
    soundEffects.playCardDeal();

    const activePlayers = currPlayers.filter((p) => !p.hasFolded);

    // Evaluate each active player's hand
    const evaluatedPlayers = currPlayers.map((p) => {
      if (p.hasFolded) return p;
      const evaluation = evaluateBestHoldemHand([...p.cards, ...finalCommunity]);
      return {
        ...p,
        evaluation,
      };
    });

    setPlayers(evaluatedPlayers);

    // Find highest rank
    const contenders = evaluatedPlayers.filter((p) => !p.hasFolded && p.evaluation);
    contenders.sort((a, b) => compareHoldemEvaluations(b.evaluation!, a.evaluation!));

    const bestEval = contenders[0].evaluation!;
    // Split pot if tie
    const winningContenders = contenders.filter(
      (c) => compareHoldemEvaluations(c.evaluation!, bestEval) === 0
    );

    const splitWin = Math.floor(pot / winningContenders.length);
    const winnersList = winningContenders.map((w) => ({
      player: w,
      winAmount: splitWin,
      summary: w.evaluation!.summary,
    }));

    setHandWinners(winnersList);

    const isHumanWinner = winningContenders.some((w) => w.isHuman);
    if (isHumanWinner) {
      soundEffects.playKaChing();
      soundEffects.playWinSound();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      onUpdateCoins(currentCoins + splitWin);
      setTableNotice(`🎉 Congratulations! You won $${splitWin.toLocaleString()} with ${bestEval.summary}!`);
    } else {
      soundEffects.playPassSound();
      setTableNotice(`🏆 ${winningContenders[0].name} wins with ${bestEval.summary}!`);
    }
  };

  // Human controls calculations
  const human = players[0] || null;
  const humanCanCheck = human && currentBet === human.currentBet;
  const callAmountNeeded = human ? currentBet - human.currentBet : 0;
  const minRaise = Math.max(minRaiseAmount, currentBet + bigBlind);
  const maxRaise = human ? human.chips : 0;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030d08] text-white flex flex-col justify-between select-none font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#082e1e] via-[#04170e] to-[#010704] pointer-events-none" />

      {/* TOP HEADER */}
      <header className="relative z-20 flex items-center justify-between px-4 py-2.5 bg-black/50 backdrop-blur-md border-b border-emerald-500/30">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-menu-th"
            type="button"
            onClick={onGoToMainMenu}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-400/40 text-emerald-300 text-xs font-bold transition uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Main Menu</span>
          </button>

          {/* Bot Customizer Button */}
          <button
            id="btn-bot-config"
            type="button"
            onClick={() => setShowConfigModal(true)}
            disabled={isHandInProgress}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/70 border border-amber-500/30 text-amber-300 text-xs font-bold transition uppercase tracking-wider cursor-pointer disabled:opacity-40"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Bots: {botCount}</span>
            <Sliders className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>

        {/* Center Title */}
        <div className="text-center">
          <h1 className="text-sm sm:text-base font-black tracking-widest text-amber-400 uppercase">
            TEXAS HOLD'EM POKER
          </h1>
          <span className="text-[10px] text-white/60 tracking-wider">
            No-Limit Hold'em (Blinds: ${smallBlind} / ${bigBlind})
          </span>
        </div>

        {/* Right Balance & Sound */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-amber-500/40">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs sm:text-sm font-black text-amber-400 font-mono">
              ${currentCoins.toLocaleString()}
            </span>
          </div>

          <button
            id="btn-sound-th"
            type="button"
            onClick={handleToggleSound}
            className="p-1.5 rounded-xl bg-black/40 hover:bg-black/70 border border-white/20 text-white transition cursor-pointer"
            title="Toggle Sound"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          <button
            id="btn-rules-th"
            type="button"
            onClick={onOpenRules}
            className="p-1.5 rounded-xl bg-black/40 hover:bg-black/70 border border-white/20 text-white transition cursor-pointer"
            title="Rules"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </header>

      {/* MAIN OVAL POKER TABLE AREA */}
      <main className="relative flex-1 flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
        {/* OVAL POKER FELT CONTAINER */}
        <div
          id="holdem-oval-table"
          className="relative w-full max-w-5xl aspect-[1.8/1] sm:aspect-[2.1/1] bg-gradient-to-br from-[#0c4a30] via-[#073623] to-[#042417] rounded-[180px] sm:rounded-[260px] border-[12px] sm:border-[16px] border-[#5c3818] shadow-[0_30px_70px_rgba(0,0,0,0.85),inset_0_4px_40px_rgba(0,0,0,0.7)] flex flex-col items-center justify-between p-4 sm:p-8 select-none"
        >
          {/* Inner Golden Felt Boundary */}
          <div className="absolute inset-3 sm:inset-4 rounded-[160px] sm:rounded-[240px] border border-amber-400/25 pointer-events-none" />

          {/* TOP / SIDES: BOT PLAYERS */}
          <div className="w-full flex items-center justify-around z-10 px-2 sm:px-6">
            {players
              .filter((p) => !p.isHuman)
              .map((bot, botIdx) => {
                const actualIndex = botIdx + 1;
                const isTurn = activeTurnIndex === actualIndex;
                const isDealer = dealerBtnIndex === actualIndex;

                return (
                  <div
                    key={bot.id}
                    className={`flex flex-col items-center transition-all duration-300 ${
                      bot.hasFolded ? 'opacity-40 grayscale' : ''
                    }`}
                  >
                    {/* Bot Cards */}
                    <div className="flex items-center -space-x-4 mb-1">
                      {stage === 'showdown' && !bot.hasFolded ? (
                        bot.cards.map((card) => (
                          <CardView key={card.id} card={card} size="sm" />
                        ))
                      ) : (
                        bot.cards.map((card) => (
                          <CardView key={card.id} card={card} isFaceDown size="sm" />
                        ))
                      )}
                    </div>

                    {/* Bot Avatar & Badges */}
                    <div className="relative">
                      <div
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-xl sm:text-2xl border-2 transition-all ${
                          isTurn
                            ? 'border-amber-400 bg-amber-400/25 ring-4 ring-amber-400/40 scale-105 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                            : 'border-white/20 bg-black/60'
                        }`}
                      >
                        {bot.avatar}
                      </div>

                      {/* Dealer Button */}
                      {isDealer && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center border border-white shadow">
                          D
                        </div>
                      )}

                      {/* Action Pill Badge */}
                      {bot.lastActionText && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-emerald-600 border border-emerald-400 text-[9px] font-black uppercase text-white shadow whitespace-nowrap">
                          {bot.lastActionText}
                        </div>
                      )}
                    </div>

                    {/* Bot Info */}
                    <span className="text-[10px] sm:text-xs font-bold text-white mt-1">
                      {bot.name}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-amber-300 font-mono font-bold">
                      ${bot.chips.toLocaleString()}
                    </span>

                    {/* Hand Summary in Showdown */}
                    {stage === 'showdown' && bot.evaluation && (
                      <span className="text-[8px] text-emerald-300 font-semibold max-w-[90px] text-center truncate">
                        {bot.evaluation.summary}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>

          {/* CENTER TABLE FELT: COMMUNITY CARDS & POT */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto">
            {/* Total Pot Display */}
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.3)] mb-3">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-xs sm:text-sm font-black text-amber-300 tracking-wider font-mono">
                POT: ${pot.toLocaleString()}
              </span>
            </div>

            {/* Community Cards Area (Flop 3, Turn 1, River 1) */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-h-[90px] sm:min-h-[110px]">
              {communityCards.length === 0 ? (
                <div className="text-white/30 text-xs sm:text-sm font-bold uppercase tracking-widest border border-dashed border-white/20 px-6 py-4 rounded-2xl">
                  Community Cards
                </div>
              ) : (
                communityCards.map((card, idx) => (
                  <motion.div
                    key={card.id}
                    initial={{ y: -20, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <CardView card={card} size="md" />
                  </motion.div>
                ))
              )}
            </div>

            {/* Table Stage Pill */}
            {isHandInProgress && (
              <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-emerald-400/80">
                • {stage.toUpperCase()} •
              </div>
            )}
          </div>

          {/* BOTTOM: HUMAN PLAYER AREA */}
          {human && (
            <div className="w-full flex items-center justify-center z-10">
              <div
                className={`flex flex-col items-center p-2 rounded-2xl transition-all ${
                  activeTurnIndex === 0
                    ? 'bg-amber-400/10 ring-2 ring-amber-400/50'
                    : 'bg-black/30'
                } ${human.hasFolded ? 'opacity-40 grayscale' : ''}`}
              >
                {/* Human Cards */}
                <div className="flex items-center -space-x-3 sm:-space-x-4 mb-1">
                  {human.cards.map((card) => (
                    <CardView key={card.id} card={card} size="md" />
                  ))}
                </div>

                {/* Human Avatar & Chips */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl border-2 ${
                        activeTurnIndex === 0
                          ? 'border-amber-400 bg-amber-400/30'
                          : 'border-white/20 bg-black/60'
                      }`}
                    >
                      {human.avatar}
                    </div>

                    {dealerBtnIndex === 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center border border-white shadow">
                        D
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-xs sm:text-sm font-black text-white block">
                      {human.name}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      ${human.chips.toLocaleString()}
                    </span>
                  </div>

                  {/* Best Hand Description */}
                  {human.evaluation && (
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-400/40 text-[10px] font-black text-emerald-300 uppercase">
                      {human.evaluation.summary}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TABLE NOTICE */}
        <div className="mt-2 px-4 py-1.5 rounded-full bg-black/70 border border-emerald-500/40 text-xs sm:text-sm font-bold text-emerald-300 text-center shadow-lg">
          {tableNotice}
        </div>
      </main>

      {/* BOTTOM CONTROLS & ACTION BAR */}
      <footer className="relative z-20 bg-zinc-950/90 backdrop-blur-md border-t border-emerald-500/30 p-2 sm:p-4">
        {!isHandInProgress ? (
          /* Hand Not In Progress: Start Hand Button */
          <div className="max-w-md mx-auto flex items-center justify-center gap-3">
            <button
              id="btn-start-holdem-hand"
              type="button"
              onClick={startNewHand}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)] transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>START NEW HAND</span>
            </button>
          </div>
        ) : activeTurnIndex === 0 && !human?.hasFolded ? (
          /* HUMAN'S TURN: CHECK, CALL, RAISE, FOLD */
          <div className="max-w-2xl mx-auto flex flex-col gap-2">
            {/* Action Buttons Row */}
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {/* FOLD */}
              <button
                id="btn-holdem-fold"
                type="button"
                onClick={handleHumanFold}
                className="flex-1 py-2.5 sm:py-3 px-3 rounded-xl bg-gradient-to-r from-rose-700 to-red-800 hover:from-rose-600 hover:to-red-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow transition cursor-pointer"
              >
                FOLD
              </button>

              {/* CHECK OR CALL */}
              {humanCanCheck ? (
                <button
                  id="btn-holdem-check"
                  type="button"
                  onClick={handleHumanCheck}
                  className="flex-1 py-2.5 sm:py-3 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow transition cursor-pointer"
                >
                  CHECK
                </button>
              ) : (
                <button
                  id="btn-holdem-call"
                  type="button"
                  onClick={handleHumanCall}
                  className="flex-1 py-2.5 sm:py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow transition cursor-pointer"
                >
                  CALL ${callAmountNeeded.toLocaleString()}
                </button>
              )}

              {/* RAISE BUTTON */}
              <button
                id="btn-holdem-raise"
                type="button"
                onClick={() => handleHumanRaise(raiseSliderValue)}
                disabled={human.chips < minRaise}
                className="flex-1 py-2.5 sm:py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 disabled:opacity-40 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow transition cursor-pointer"
              >
                RAISE ${raiseSliderValue.toLocaleString()}
              </button>
            </div>

            {/* Raise Slider & Presets */}
            {human.chips >= minRaise && (
              <div className="flex items-center gap-3 bg-zinc-900/80 p-2 rounded-xl border border-white/10">
                <span className="text-[10px] text-white/50 uppercase font-bold">
                  Raise:
                </span>
                <input
                  id="slider-raise"
                  type="range"
                  min={minRaise}
                  max={maxRaise}
                  step={bigBlind}
                  value={raiseSliderValue}
                  onChange={(e) => setRaiseSliderValue(Number(e.target.value))}
                  className="flex-1 accent-amber-400 cursor-pointer"
                />

                {/* Preset Buttons: Min, 1/2 Pot, Pot, All-in */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRaiseSliderValue(minRaise)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-bold text-amber-300 hover:bg-zinc-700"
                  >
                    Min
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRaiseSliderValue(Math.min(maxRaise, Math.max(minRaise, Math.floor(pot / 2))))
                    }
                    className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-bold text-amber-300 hover:bg-zinc-700"
                  >
                    1/2 Pot
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRaiseSliderValue(Math.min(maxRaise, Math.max(minRaise, pot)))
                    }
                    className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-bold text-amber-300 hover:bg-zinc-700"
                  >
                    Pot
                  </button>
                  <button
                    type="button"
                    onClick={() => setRaiseSliderValue(maxRaise)}
                    className="px-2 py-0.5 rounded bg-rose-900 text-[10px] font-black text-white hover:bg-rose-800"
                  >
                    All-In
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Waiting for Bot Turns */
          <div className="text-center py-2 text-xs sm:text-sm font-bold text-white/70 animate-pulse">
            Waiting for players to act...
          </div>
        )}
      </footer>

      {/* CUSTOMIZE BOTS MODAL */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border-2 border-emerald-500 rounded-3xl p-6 max-w-sm w-full text-white space-y-5 shadow-2xl"
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-black uppercase text-white">
                  CUSTOMIZE BOTS
                </h2>
              </div>

              <div>
                <label className="text-xs text-white/70 block mb-2 font-bold">
                  Number of Bot Opponents: <span className="text-amber-400 font-mono text-sm">{botCount} Bots</span> ({botCount + 1} players total)
                </label>
                <input
                  id="slider-bot-count"
                  type="range"
                  min="1"
                  max="7"
                  value={botCount}
                  onChange={(e) => setBotCount(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-white/40 mt-1">
                  <span>1 (Heads Up)</span>
                  <span>3 (4-Max)</span>
                  <span>7 (8-Max Table)</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-white/70 block mb-2 font-bold">
                  Big Blind Stakes:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[100, 200, 500].map((bb) => (
                    <button
                      key={bb}
                      type="button"
                      onClick={() => setBigBlind(bb)}
                      className={`py-1.5 rounded-xl text-xs font-bold transition border ${
                        bigBlind === bb
                          ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                          : 'border-white/10 bg-zinc-800 text-white/70'
                      }`}
                    >
                      ${bb / 2} / ${bb}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playCardSelect();
                  setShowConfigModal(false);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs uppercase tracking-wider transition shadow cursor-pointer"
              >
                APPLY & CLOSE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
