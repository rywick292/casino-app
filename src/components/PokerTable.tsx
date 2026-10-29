import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BuangKartuTigaEvent, Card, ComboType, Difficulty, HandCombo, ManualBuangKartuState, Player, PokerVariant, ReshuffleEvent, TrickPlay } from '../types';
import {
  canBeatCombo,
  findCategorizedCombos,
  identifyCombo,
  isConsecutiveRanks,
  RANK_LABEL,
  SUIT_RANK,
  SUIT_SYMBOL,
  sortCards,
} from '../utils/pokerRules';
import { findAllValidCombos } from '../utils/aiStrategy';
import { soundEffects } from '../utils/soundEffects';
import { CardView } from './CardView';
import {
  Coins,
  Volume2,
  VolumeX,
  HelpCircle,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  Ban,
  Clock,
  Trophy,
  Layers,
  LogOut,
  RefreshCw,
  Flame,
  Eye,
} from 'lucide-react';

interface PokerTableProps {
  players: Player[];
  activePlayerIndex: number;
  lastCombo: HandCombo | null;
  lastComboPlayerName: string | null;
  trickHistory?: TrickPlay[];
  betAmount: number;
  difficulty: Difficulty;
  isFirstTurnOfGame: boolean;
  gameWinner: Player | null;
  isPendingWin?: boolean;
  isDealingCards?: boolean;
  reshuffleEvent?: ReshuffleEvent | null;
  onInstantReshuffleNow?: () => void;
  buangKartuTigaEvent?: BuangKartuTigaEvent | null;
  manualBuangKartuState?: ManualBuangKartuState | null;
  onHumanThrowThrees?: () => void;
  onFinishBuangKartu?: () => void;
  isRematch?: boolean;
  discardedThrees?: Card[];
  onDismissBuangKartu?: () => void;
  logs: string[];
  variant?: PokerVariant;
  previousWinnerName?: string | null;
  onPlayCards: (selectedCards: Card[]) => void;
  onPassTurn: () => void;
  onOpenRules: () => void;
  onOpenSetup: () => void;
}

export const PokerTable: React.FC<PokerTableProps> = ({
  players,
  activePlayerIndex,
  lastCombo,
  lastComboPlayerName,
  trickHistory = [],
  betAmount,
  difficulty,
  isFirstTurnOfGame,
  previousWinnerName,
  gameWinner,
  isPendingWin = false,
  isDealingCards = false,
  reshuffleEvent = null,
  onInstantReshuffleNow,
  buangKartuTigaEvent = null,
  manualBuangKartuState = null,
  onHumanThrowThrees,
  onFinishBuangKartu,
  isRematch = false,
  discardedThrees = [],
  onDismissBuangKartu,
  logs,
  variant = 'global' as PokerVariant,
  onPlayCards,
  onPassTurn,
  onOpenRules,
  onOpenSetup,
}) => {
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [sortDescending, setSortDescending] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(soundEffects.isEnabled());
  const [showQuitConfirm, setShowQuitConfirm] = useState<boolean>(false);
  const [autoSelectCategoryIndex, setAutoSelectCategoryIndex] = useState<Record<string, number>>({});
  const [showOpeningCaption, setShowOpeningCaption] = useState<boolean>(false);

  // 1-second delay after shuffle/deal animation before displaying Game Opening caption
  useEffect(() => {
    if (isDealingCards) {
      setShowOpeningCaption(false);
    } else {
      const timer = setTimeout(() => {
        setShowOpeningCaption(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isDealingCards]);

  const humanPlayer = players.find((p) => p.isHuman) || players[0];
  const isHumanTurn =
    players[activePlayerIndex]?.isHuman && !gameWinner && !isPendingWin && !isDealingCards && !reshuffleEvent && !manualBuangKartuState;

  // AI Opponents (exclude human player)
  const aiOpponents = players.filter((p) => !p.isHuman);

  // Categorized combos available in human hand for Auto Select
  const categorized = useMemo(() => {
    return findCategorizedCombos(humanPlayer.hand, variant);
  }, [humanPlayer.hand, variant]);

  // Filter selected card objects from human hand
  const selectedCards = humanPlayer.hand.filter((c) => selectedCardIds.includes(c.id));
  const identifiedCombo = identifyCombo(selectedCards, variant);

  // Check if selected move is valid and can beat top table combo
  const isValidPlay =
    isHumanTurn &&
    identifiedCombo !== null &&
    canBeatCombo(identifiedCombo, lastCombo, variant) &&
    (!isFirstTurnOfGame || variant === 'indonesian' || selectedCards.some((c) => c.rank === 3 && c.suit === 'spades'));

  // Toggle card selection
  const handleCardClick = (card: Card) => {
    if (manualBuangKartuState) {
      if (manualBuangKartuState.step === 'waiting-player' && card.rank === 3 && onHumanThrowThrees) {
        onHumanThrowThrees();
      }
      return;
    }
    if (!isHumanTurn) return;
    soundEffects.playCardSelect();

    if (selectedCardIds.includes(card.id)) {
      setSelectedCardIds(selectedCardIds.filter((id) => id !== card.id));
    } else {
      // Limit selection to max 5 cards
      if (selectedCardIds.length >= 5) return;
      setSelectedCardIds([...selectedCardIds, card.id]);
    }
  };

  // Auto Select a category of combos (Singles, Pairs, Full House, Straight, etc.)
  const handleAutoSelect = (categoryKey: string, combosList: HandCombo[]) => {
    if (!combosList || combosList.length === 0) return;
    soundEffects.playCardSelect();

    const currentIndex = autoSelectCategoryIndex[categoryKey] ?? -1;
    const nextIndex = (currentIndex + 1) % combosList.length;

    setAutoSelectCategoryIndex((prev) => ({ ...prev, [categoryKey]: nextIndex }));
    const chosenCombo = combosList[nextIndex];
    if (chosenCombo && chosenCombo.cards) {
      setSelectedCardIds(chosenCombo.cards.map((c) => c.id));
    }
  };

  // Handle Play Button click
  const handlePlayClick = () => {
    if (!isValidPlay) {
      soundEffects.playError();
      return;
    }
    soundEffects.playCardPlay();
    onPlayCards(selectedCards);
    setSelectedCardIds([]);
  };

  // Handle Pass Button click
  const handlePassClick = () => {
    if (!isHumanTurn) return;
    if (lastCombo === null) {
      soundEffects.playError();
      return; // Cannot pass when table is free lead
    }
    soundEffects.playPass();
    onPassTurn();
    setSelectedCardIds([]);
  };

  const toggleSound = () => {
    const newState = soundEffects.toggleSound();
    setSoundOn(newState);
  };

  // Sort human hand
  const sortedHumanHand = sortCards(humanPlayer.hand, !sortDescending);

  // Singles list for Auto Select
  const singlesList = useMemo(() => {
    return humanPlayer.hand.map((c) => ({
      type: 'single' as const,
      cards: [c],
      primaryRank: c.rank,
      suitRank: SUIT_RANK[c.suit],
      description: `Single ${RANK_LABEL[c.rank]}`,
    }));
  }, [humanPlayer.hand]);

  // Check if human player has any valid combination that can beat lastCombo
  const hasEligibleCards = useMemo(() => {
    if (!isHumanTurn || !lastCombo) return true;
    const allCombos = findAllValidCombos(humanPlayer.hand, variant);
    return allCombos.some((c) => canBeatCombo(c, lastCombo, variant));
  }, [isHumanTurn, lastCombo, humanPlayer.hand, variant]);

  // Limit visible stacked card history on table to at most 4 plays
  const visibleHistory = useMemo(() => {
    return trickHistory.slice(-4);
  }, [trickHistory]);

  // Auto-Select Buttons Config
  const autoSelectOptions = useMemo(() => [
    {
      key: 'single',
      label: 'Single',
      combos: singlesList,
    },
    {
      key: 'pair',
      label: 'Pair',
      combos: categorized.pairs,
    },
    {
      key: 'triple',
      label: '3 of a Kind',
      combos: categorized.triples,
    },
    ...(variant === 'indonesian'
      ? [
          {
            key: 'straight3',
            label: '3-Straight',
            combos: categorized.straights3,
          },
          {
            key: 'straight4',
            label: '4-Straight',
            combos: categorized.straights4,
          },
          {
            key: 'straightHouse',
            label: 'Straight House',
            combos: categorized.straightHouses,
          },
          {
            key: 'fullhouse',
            label: 'Full House',
            combos: categorized.fullHouses,
          },
          {
            key: 'fourOfAKind',
            label: '4-of-a-Kind (💣)',
            combos: categorized.fourOfAKinds,
          },
          {
            key: 'straightFlush',
            label: '5-Straight (💥 Auto Win)',
            combos: categorized.straightFlushes,
          },
        ]
      : [
          {
            key: 'straight',
            label: 'Straight',
            combos: categorized.straights,
          },
          {
            key: 'flush',
            label: 'Flush',
            combos: categorized.flushes,
          },
          {
            key: 'fullhouse',
            label: 'Full House',
            combos: categorized.fullHouses,
          },
          {
            key: 'fourOfAKind',
            label: '4 of a Kind',
            combos: categorized.fourOfAKinds,
          },
          {
            key: 'straightFlush',
            label: 'Straight Flush',
            combos: categorized.straightFlushes,
          },
          {
            key: 'royalFlush',
            label: 'Royal Flush',
            combos: categorized.royalFlushes,
          },
        ]),
  ], [singlesList, categorized, variant]);

  // Filter ONLY eligible combinations to display for Auto Select below Sort button
  const eligibleAutoSelectOptions = useMemo(() => {
    return autoSelectOptions
      .map((opt) => {
        // Filter this option's combos to ONLY those that are actually eligible to be played right now!
        const eligibleCombos = opt.combos.filter((c) => {
          if (isFirstTurnOfGame) {
            return c.cards.some((card) => card.rank === 3 && card.suit === 'spades');
          }
          if (lastCombo !== null) {
            return canBeatCombo(c, lastCombo, variant);
          }
          return true;
        });

        return {
          ...opt,
          combos: eligibleCombos,
          badge: eligibleCombos.length,
        };
      })
      .filter((opt) => opt.badge > 0);
  }, [autoSelectOptions, isFirstTurnOfGame, lastCombo, variant]);

  return (
    <div className="relative h-screen w-screen max-h-screen bg-[#05110d] text-white flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* Radial Ambient Glow */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1a5d42 0%, transparent 70%)' }}
      />

      {/* TOP NAVBAR (Immersive Theme) */}
      <header className="relative z-20 bg-black/60 border-b border-white/10 backdrop-blur-md px-3 sm:px-6 py-1.5 flex items-center justify-between shadow-lg">
        {/* Left: Brand & Stats */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="text-xs sm:text-sm tracking-[0.15em] uppercase font-serif font-black text-amber-400 flex items-center gap-1.5">
            <span className="text-emerald-400">♠</span>
            <span>RYAN'S GRAND CASINO</span>
            <span className="text-rose-500">♥</span>
          </div>
          <div className="h-3.5 w-px bg-white/20 hidden sm:block" />
          <div className="hidden lg:flex items-center">
            {variant === 'indonesian' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-[10px] font-black text-rose-300 tracking-wider">
                🇮🇩 INDONESIAN POKER
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/50 text-[10px] font-black text-blue-300 tracking-wider">
                🌐 GLOBAL BIG 2
              </span>
            )}
          </div>
          <div className="h-3.5 w-px bg-white/20 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase text-white/40 tracking-wider">Coins:</span>
            <span className="text-xs sm:text-base font-mono text-amber-400 font-bold flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              {humanPlayer.coins.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Center/Right: Bet, Difficulty & Controls */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden md:flex flex-col text-right">
            <span className="block text-[9px] uppercase text-white/40 tracking-wider">Active Bet</span>
            <span className="text-xs font-semibold font-mono text-amber-300">
              {betAmount.toLocaleString()} / card
            </span>
          </div>
          <div className="hidden sm:flex flex-col text-right">
            <span className="block text-[9px] uppercase text-white/40 tracking-wider">Difficulty</span>
            <span className="text-xs font-semibold capitalize text-slate-200">{difficulty} (AI)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-toggle-sound"
              type="button"
              onClick={toggleSound}
              className="p-1.5 border border-white/20 rounded-lg text-xs hover:bg-white/10 transition-colors text-white cursor-pointer"
              title="Toggle Sound"
            >
              {soundOn ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-white/40" />}
            </button>

            <button
              id="btn-table-rules"
              type="button"
              onClick={onOpenRules}
              className="px-2.5 py-1 border border-white/20 rounded-lg text-xs hover:bg-white/10 transition-colors uppercase tracking-widest text-white flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Rules</span>
            </button>

            <button
              id="btn-table-quit-menu"
              type="button"
              onClick={() => {
                soundEffects.playCardSelect();
                setShowQuitConfirm(true);
              }}
              className="px-2.5 py-1 border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 rounded-lg text-xs hover:border-rose-400 transition-all uppercase tracking-widest text-rose-200 flex items-center gap-1.5 cursor-pointer font-bold shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>QUIT TO MENU</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN POKER TABLE STAGE WITH RIGHT SIDE AUTO-SELECT PANEL */}
      <main className="relative flex-1 flex items-stretch justify-between p-1.5 sm:p-3 md:p-4 max-w-7xl mx-auto w-full min-h-0 overflow-visible gap-2">
        {/* GREEN FELT OVAL TABLE CONTAINER */}
        <div className="relative flex-1 bg-gradient-to-b from-[#155d42] to-[#0a2d20] rounded-[40px] sm:rounded-[70px] md:rounded-[100px] border-[6px] sm:border-[10px] border-[#2c1a12] shadow-[0_0_80px_rgba(0,0,0,0.8),inset_0_0_40px_rgba(0,0,0,0.5)] flex flex-col justify-between p-2 sm:p-4 overflow-visible min-h-0">
          {/* Subtle Inner Felt Ring Line */}
          <div className="absolute inset-2 sm:inset-3 border border-white/10 rounded-[30px] sm:rounded-[60px] md:rounded-[90px] pointer-events-none" />

          {/* AI OPPONENTS CONTAINER (TOP & SIDE AREAS) */}
          <div className="relative z-10 w-full flex justify-center items-center gap-3 sm:gap-8 flex-wrap">
            {aiOpponents.map((opp) => {
              const isCurrentTurn = players[activePlayerIndex]?.id === opp.id && !gameWinner;
              const isOppWinner = opp.isWinner || gameWinner?.id === opp.id;
              const isLastCards = opp.hand.length <= 3 && opp.hand.length > 0;
              const hasFourTwosInOpp = reshuffleEvent && opp.id === reshuffleEvent.player.id;

              return (
                <div
                  key={opp.id}
                  id={`ai-player-box-${opp.id}`}
                  className="relative flex flex-col items-center group"
                >
                  {/* Avatar Circle with Glow */}
                  <div
                    className={`
                      w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900 border-2 shadow-xl flex items-center justify-center text-base sm:text-xl font-bold transition-all duration-300 relative
                      ${
                        hasFourTwosInOpp
                          ? 'border-amber-400 ring-4 ring-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.8)] animate-pulse'
                          : isCurrentTurn
                          ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] scale-105 ring-2 ring-emerald-500/30'
                          : 'border-white/20'
                      }
                      ${opp.isPassed ? 'opacity-60' : ''}
                    `}
                  >
                    <span>{opp.avatar}</span>

                    {/* Active turn badge */}
                    {isCurrentTurn && (
                      <span className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 p-0.5 rounded-full animate-pulse shadow">
                        <Clock className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  {/* Player Info Badge */}
                  <div className="mt-1 bg-black/70 px-2 py-0.5 rounded text-[9px] sm:text-[10px] uppercase tracking-wider border border-white/10 text-center font-mono">
                    <span className="font-bold text-white block truncate max-w-[90px]">{opp.name}</span>
                    <span className="text-emerald-400 font-semibold">{opp.hand.length} Cards</span>
                  </div>

                  {/* If 4x Twos Reshuffle is revealing cards: Render AI hands face-up! */}
                  {reshuffleEvent && (
                    <div className="mt-1 flex items-center -space-x-4 max-w-[160px] overflow-visible z-30">
                      {opp.hand.map((c) => (
                        <CardView key={c.id} card={c} size="sm" isFaceDown={false} className="shadow-md" />
                      ))}
                    </div>
                  )}

                  {/* Four Twos holder banner */}
                  {hasFourTwosInOpp && (
                    <div className="mt-0.5 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-red-600 text-slate-950 font-black rounded text-[9px] uppercase tracking-wider border border-amber-200 animate-bounce shadow-lg">
                      🔥 4x TWOS HOLDER!
                    </div>
                  )}

                  {/* Warning / Pass / Win Badges */}
                  {!reshuffleEvent && (
                    <>
                      {isOppWinner && (
                        <div className="mt-0.5 px-2 py-0.5 bg-amber-500 text-slate-950 font-black rounded text-[9px] uppercase tracking-wider border border-yellow-200 animate-bounce">
                          WINNER!
                        </div>
                      )}
                      {opp.isPassed && !isOppWinner && (
                        <div className="mt-0.5 px-1.5 py-0.5 bg-zinc-800 text-white/60 rounded text-[8px] uppercase tracking-wider border border-white/10">
                          PASSED
                        </div>
                      )}
                      {isLastCards && !opp.isPassed && !isOppWinner && (
                        <div className="mt-0.5 px-1.5 py-0.5 bg-red-600 text-white rounded text-[8px] font-bold uppercase tracking-wider animate-pulse shadow">
                          LAST CARDS!
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* TABLE CENTER: PLAYED CARDS STAGE & DEALING / RESHUFFLE ANIMATION */}
          <div className="relative my-2 sm:my-4 flex-1 flex flex-col items-center justify-center text-center min-h-[140px] sm:min-h-[180px]">
            {/* Table Watermark Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-[0.08] leading-none">
              <span className="text-3xl sm:text-6xl md:text-7xl font-serif text-amber-300 font-black tracking-[0.2em] uppercase">
                RYAN'S
              </span>
              <span className="text-xl sm:text-4xl md:text-5xl font-serif text-emerald-400 font-black tracking-[0.25em] uppercase mt-1">
                GRAND CASINO
              </span>
            </div>

            {/* DEALING ANIMATION (Flying Card Backs to Players) */}
            <AnimatePresence>
              {isDealingCards && (
                <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                  {/* Center Deck */}
                  <div className="relative w-16 h-24 bg-gradient-to-br from-indigo-950 to-slate-900 border-2 border-amber-400/80 rounded-lg shadow-2xl flex items-center justify-center">
                    <span className="text-amber-400 font-serif font-black text-xl">♠</span>

                    {/* Flying Card Backs with Throw Animation to Seat Trajectories */}
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
                      const seatAngle = (idx % 4) * 90;
                      const targetX = idx % 4 === 0 ? 0 : idx % 4 === 1 ? -220 : idx % 4 === 2 ? 0 : 220;
                      const targetY = idx % 4 === 0 ? 180 : idx % 4 === 1 ? -120 : idx % 4 === 2 ? -160 : -120;

                      return (
                        <motion.div
                          key={`deal-card-${idx}`}
                          initial={{ x: 0, y: 0, scale: 0.9, rotate: 0, opacity: 1 }}
                          animate={{
                            x: targetX,
                            y: targetY,
                            scale: 0.65,
                            rotate: seatAngle + idx * 25,
                            opacity: 0,
                          }}
                          transition={{
                            duration: 0.85,
                            delay: idx * 0.08,
                            ease: 'easeOut',
                          }}
                          className="absolute w-12 h-16 bg-gradient-to-br from-indigo-900 to-blue-950 border border-amber-400 rounded-md shadow-lg flex items-center justify-center"
                        >
                          <span className="text-amber-400 text-xs">♠</span>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Dealing Badge */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="absolute -bottom-8 bg-black/90 border border-amber-400/70 px-4 py-1 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                      SHUFFLING & DEALING CARDS...
                    </span>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* FOUR 2s RESHUFFLE DRAMATIC BANNER OVERLAY */}
            <AnimatePresence>
              {reshuffleEvent && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: 20 }}
                  className="z-50 bg-gradient-to-b from-[#1a0c0c] to-[#0a0505] border-2 border-red-500/80 rounded-2xl p-4 sm:p-5 shadow-[0_0_80px_rgba(239,68,68,0.5)] max-w-lg mx-auto text-center flex flex-col items-center gap-3 backdrop-blur-md"
                >
                  <div className="flex items-center gap-2 text-red-400 text-sm sm:text-base font-black tracking-widest uppercase animate-pulse">
                    <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
                    <span>♠ FOUR '2's DETECTED! (DRAGON QUAD) ♠</span>
                    <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
                  </div>

                  <p className="text-xs sm:text-sm text-white/90 font-medium">
                    <strong className="text-amber-400">{reshuffleEvent.player.name}</strong> was dealt all four 2s!
                    <br />
                    <span className="text-white/70 text-xs">
                      All player hands revealed on table. Automatic reshuffle starting shortly...
                    </span>
                  </p>

                  {/* Show the 4 Twos */}
                  <div className="flex items-center justify-center gap-2 py-1">
                    {reshuffleEvent.fourTwos.map((card) => (
                      <CardView key={`four-two-${card.id}`} card={card} size="sm" className="ring-2 ring-amber-400" />
                    ))}
                  </div>

                  {/* Instant Reshuffle Trigger Button */}
                  {onInstantReshuffleNow && (
                    <button
                      id="btn-instant-reshuffle"
                      type="button"
                      onClick={onInstantReshuffleNow}
                      className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 cursor-pointer transition-all transform hover:scale-105"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>RESHUFFLE IMMEDIATELY</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* MANUAL BUANG KARTU 3 INTERACTIVE STAGE (Indonesian Poker Opening Ritual) */}
            <AnimatePresence>
              {manualBuangKartuState && (
                <motion.div
                  initial={{ scale: 0.88, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.88, opacity: 0, y: -15 }}
                  className="z-50 bg-gradient-to-b from-[#14101e] via-[#0d0915] to-[#08050e] border-2 border-amber-400/90 rounded-2xl p-4 sm:p-5 shadow-[0_0_80px_rgba(245,158,11,0.5)] max-w-xl mx-auto text-center flex flex-col items-center gap-3 backdrop-blur-md"
                >
                  <div className="flex items-center gap-2 text-amber-300 text-xs sm:text-sm font-black tracking-widest uppercase animate-pulse">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>♠ TAHAP AWAL: BUANG KARTU 3 ♠</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>

                  <p className="text-xs sm:text-sm text-white/90 font-medium max-w-md">
                    {manualBuangKartuState.step === 'waiting-player' ? (
                      <span>
                        Pemain saling melempar kartu "3" ke meja secara manual. Pemain yang membuang <strong className="text-amber-300">3 Sekop (3♠)</strong> akan jalan pertama!
                      </span>
                    ) : manualBuangKartuState.step === 'bots-throwing' ? (
                      <span className="flex items-center justify-center gap-2 text-amber-300">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        <span>Pemain lain sedang membuang kartu 3 mereka ke meja...</span>
                      </span>
                    ) : (
                      <span className="text-emerald-300 font-bold">
                        Semua pemain selesai membuang kartu 3! Pemilik 3♠ memulai permainan.
                      </span>
                    )}
                  </p>

                  {/* Discarded cards list grouped by player */}
                  <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 py-1">
                    {players.map((p) => {
                      const discard = manualBuangKartuState.discards.find((d) => d.playerId === p.id);
                      const hasThrown = !!discard;
                      const isCurrentlyThrowing =
                        !hasThrown &&
                        manualBuangKartuState.step === 'bots-throwing' &&
                        manualBuangKartuState.currentThrowerName === p.name;
                      const threw3Spades = discard?.cards.some((c) => c.rank === 3 && c.suit === 'spades');

                      return (
                        <div
                          key={`manual-buang-box-${p.id}`}
                          className={`rounded-xl p-2.5 flex flex-col items-center gap-1.5 transition-all border ${
                            threw3Spades
                              ? 'bg-amber-950/80 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)] ring-2 ring-amber-400'
                              : hasThrown
                              ? 'bg-black/60 border-white/20'
                              : isCurrentlyThrowing
                              ? 'bg-blue-950/60 border-blue-400/80 animate-pulse'
                              : 'bg-black/40 border-white/10 opacity-70'
                          }`}
                        >
                          <div className="flex items-center gap-1 text-[11px] font-bold text-white">
                            <span>{p.avatar}</span>
                            <span className="truncate max-w-[85px]">{p.name}</span>
                            {threw3Spades && <span className="text-amber-300">👑</span>}
                          </div>

                          {hasThrown ? (
                            discard.cards.length > 0 ? (
                              <div className="flex items-center justify-center gap-1 flex-wrap min-h-[36px]">
                                {discard.cards.map((c) => (
                                  <span
                                    key={`thrown-card-${c.id}`}
                                    className={`px-1.5 py-0.5 rounded font-mono font-bold text-xs shadow border ${
                                      c.suit === 'spades'
                                        ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400'
                                        : 'bg-zinc-800 text-white border-white/20'
                                    }`}
                                  >
                                    {RANK_LABEL[c.rank]}
                                    {SUIT_SYMBOL[c.suit]}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-white/50 italic py-2">Tidak ada kartu 3</span>
                            )
                          ) : isCurrentlyThrowing ? (
                            <div className="flex items-center gap-1 py-2 text-[10px] text-blue-300">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Membuang...</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-white/40 py-2">
                              {p.isHuman ? 'Giliranmu' : 'Menunggu...'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Step Announcing: 3 of Spades Starter Badge */}
                  {manualBuangKartuState.step === 'announcing' && (
                    <div className="w-full bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 border-2 border-emerald-400/80 px-4 py-2.5 rounded-xl flex flex-col items-center gap-1 shadow-lg animate-in zoom-in-95">
                      <span className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5 uppercase">
                        <span>👑</span> {manualBuangKartuState.starterPlayerName} MEMBUANG 3 SEKOP (3♠)!
                      </span>
                      <span className="text-[11px] text-white/90">
                        {manualBuangKartuState.starterIsHuman
                          ? 'Kamu membuang 3♠ dan memulai permainan pertama dengan Free Lead!'
                          : `${manualBuangKartuState.starterPlayerName} membuang 3♠ dan memulai permainan pertama dengan Free Lead.`}
                      </span>
                      {onFinishBuangKartu && (
                        <button
                          id="btn-finish-buang-kartu-stage"
                          type="button"
                          onClick={onFinishBuangKartu}
                          className="mt-1 px-4 py-1.5 bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 cursor-pointer transition-all transform hover:scale-105"
                        >
                          <span>MULAI PERMAINAN SEKARANG</span>
                          <Zap className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Step Waiting-Player: Direct Throw Button on Stage */}
                  {manualBuangKartuState.step === 'waiting-player' && onHumanThrowThrees && (
                    <div className="pt-0.5">
                      {humanPlayer.hand.filter((c) => c.rank === 3).length > 0 ? (
                        <button
                          id="btn-stage-buang-kartu"
                          type="button"
                          onClick={onHumanThrowThrees}
                          className="px-6 py-2 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center gap-2 cursor-pointer transform hover:scale-105 transition"
                        >
                          <span>🎴 BUANG KARTU 3 ({humanPlayer.hand.filter((c) => c.rank === 3).length} KARTU)</span>
                        </button>
                      ) : (
                        <button
                          id="btn-stage-buang-kartu-empty"
                          type="button"
                          onClick={onHumanThrowThrees}
                          className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white/90 font-bold text-xs uppercase tracking-wider rounded-xl border border-white/20 shadow-md flex items-center gap-2 cursor-pointer transform hover:scale-105 transition"
                        >
                          <span>✓ SAYA TIDAK PUNYA KARTU 3 (LANJUT)</span>
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Persistent Discarded 3s Tray on table during game */}
            {!buangKartuTigaEvent && discardedThrees.length > 0 && (
              <div className="z-10 mb-2 inline-flex items-center gap-1.5 bg-black/75 border border-amber-400/50 px-3 py-1 rounded-full text-[10px] text-amber-300 font-mono shadow-md backdrop-blur-sm">
                <span className="font-bold uppercase tracking-wider text-white/80">Buang Kartu 3:</span>
                <div className="flex items-center gap-1">
                  {discardedThrees.map((c) => (
                    <span
                      key={`discarded-3-${c.id}`}
                      className={`px-1 rounded bg-black/60 border border-white/10 font-bold ${
                        c.suit === 'spades' ? 'text-amber-400 ring-1 ring-amber-400/60' : 'text-white/80'
                      }`}
                    >
                      {RANK_LABEL[c.rank]}{SUIT_SYMBOL[c.suit]}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* WIN OVERLAY AT TABLE CENTER IF GAME OVER */}
            {gameWinner && (
              <div className="z-30 mb-2 bg-black/90 border-2 border-emerald-500 px-5 sm:px-8 py-3 rounded-2xl shadow-[0_0_60px_rgba(16,185,129,0.4)] flex flex-col items-center gap-1.5 animate-in zoom-in-95">
                <span className="text-emerald-500 text-3xl sm:text-5xl font-black italic tracking-tighter uppercase flex items-center gap-2">
                  <Trophy className="w-8 h-8 sm:w-12 sm:h-12 text-amber-400" /> WIN
                </span>
                <span className="text-xs sm:text-base text-white/90 font-medium">
                  {gameWinner.isHuman ? 'You won the match!' : `${gameWinner.name} cleared all cards!`}
                </span>
              </div>
            )}

            {/* ACTIVE PLAYED CARDS & STACK (ONLY SHOW AT MOST LAST 4 PLAYS) */}
            {!isDealingCards && !reshuffleEvent && (
              <>
                {visibleHistory.length > 0 ? (
                  <div className="relative w-full h-36 sm:h-44 flex items-center justify-center z-20">
                    <AnimatePresence mode="popLayout">
                      {visibleHistory.map((play, index) => {
                        const isTop = index === visibleHistory.length - 1;
                        const depth = visibleHistory.length - 1 - index;

                        // Direct throw trajectory launching from seat position to center table
                        const origin = (() => {
                          const pIdx = play.playerIndex;
                          const totalP = players.length;
                          if (pIdx === 0) return { x: 0, y: 160, scale: 0.2, rotate: 15, opacity: 0 };
                          if (totalP === 4) {
                            if (pIdx === 1) return { x: -220, y: -140, scale: 0.2, rotate: -25, opacity: 0 };
                            if (pIdx === 2) return { x: 0, y: -180, scale: 0.2, rotate: 10, opacity: 0 };
                            if (pIdx === 3) return { x: 220, y: -140, scale: 0.2, rotate: 25, opacity: 0 };
                          } else if (totalP === 3) {
                            if (pIdx === 1) return { x: -180, y: -140, scale: 0.2, rotate: -25, opacity: 0 };
                            if (pIdx === 2) return { x: 180, y: -140, scale: 0.2, rotate: 25, opacity: 0 };
                          } else {
                            if (pIdx === 1) return { x: 0, y: -180, scale: 0.2, rotate: -20, opacity: 0 };
                          }
                          return { x: 0, y: -140, scale: 0.2, rotate: 0, opacity: 0 };
                        })();

                        // Target stack offsets on table
                        const targetX = isTop ? 0 : -depth * 18 + (index % 2 === 0 ? -4 : 4);
                        const targetY = isTop ? 0 : -depth * 14;
                        const targetRotate = isTop ? 0 : (index % 2 === 0 ? -1 : 1) * (depth * 4 + 2);
                        const targetScale = isTop ? 1 : Math.max(0.85, 1 - depth * 0.05);
                        const targetOpacity = isTop ? 1 : Math.max(0.65, 1 - depth * 0.12);

                        return (
                          <motion.div
                            key={play.id}
                            initial={origin}
                            animate={{
                              x: targetX,
                              y: targetY,
                              scale: targetScale,
                              rotate: targetRotate,
                              opacity: targetOpacity,
                            }}
                            exit={{ scale: 0.1, opacity: 0, y: -20, transition: { duration: 0.2 } }}
                            transition={{
                              type: 'spring',
                              stiffness: 320,
                              damping: 25,
                              mass: 0.7,
                            }}
                            style={{ zIndex: index + 1 }}
                            className="absolute flex flex-col items-center gap-1"
                          >
                            {/* Play Info Banner - Only shown for top card */}
                            {isTop && (
                              <div className="bg-black/85 border border-emerald-400/50 px-3 py-1 rounded-full text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)] backdrop-blur-md">
                                <span>{play.playerAvatar}</span>
                                <span>{play.playerName} played:</span>
                                <strong className="text-white uppercase tracking-wider font-bold">
                                  {play.combo.description}
                                </strong>
                              </div>
                            )}

                            {/* Cards in Combo Stack */}
                            <div className="flex items-center justify-center -space-x-3 sm:-space-x-4 py-0.5">
                              {play.combo.cards.map((card, cIdx) => (
                                <motion.div
                                  key={card.id}
                                  initial={{ scale: 0.8, y: -8 }}
                                  animate={{ scale: 1, y: 0 }}
                                  transition={{ delay: cIdx * 0.03 }}
                                >
                                  <CardView
                                    card={card}
                                    size="md"
                                    className={`shadow-xl ${
                                      isTop
                                        ? 'scale-100 border-emerald-400/60 ring-2 ring-emerald-500/20'
                                        : 'brightness-90 opacity-90'
                                    } transition-all`}
                                  />
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                ) : showOpeningCaption ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35 }}
                    className="z-20 bg-black/60 border border-white/10 px-4 py-2 rounded-xl shadow-lg backdrop-blur-md text-center max-w-sm"
                  >
                    <span className="text-[11px] font-bold text-emerald-400 block uppercase tracking-widest mb-0.5">
                      {trickHistory.length === 0 ? 'Game Opening' : 'Table Cleared'}
                    </span>
                    <span className="text-[11px] sm:text-xs font-medium text-white/80">
                      {isFirstTurnOfGame
                        ? 'Opening Match: Player with 3 of Spades (3♠) plays first!'
                        : trickHistory.length === 0
                        ? `Previous winner (${previousWinnerName || players[activePlayerIndex]?.name || 'Winner'}) plays first! Free Lead.`
                        : 'Free Lead! Play any single, pair, triple, or 5-card combo.'}
                    </span>
                  </motion.div>
                ) : null}
              </>
            )}

            {/* Pending Win Banner if applicable */}
            {isPendingWin && (
              <div className="mt-2 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600 border border-amber-300/80 px-4 py-1.5 rounded-full shadow-[0_0_25px_rgba(245,158,11,0.6)] backdrop-blur-md text-center animate-pulse z-30">
                <span className="text-xs sm:text-sm font-black text-slate-950 uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <span>🏆</span> MATCH FINISHED! FINAL PLAY DISPLAYED...
                </span>
              </div>
            )}
          </div>

          {/* HUMAN PLAYER CONTROLS & CARDS FAN */}
          <div className="relative z-40 w-full flex flex-col items-center mb-6 sm:mb-8 -mt-2 sm:-mt-4">
            {/* Header info bar with Sort, Clear and Absolute-Positioned Vertical Auto-Select Stack */}
            <div className="relative z-50 flex items-center justify-between w-full max-w-5xl px-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl">{humanPlayer.avatar}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs sm:text-sm text-white">{humanPlayer.name}</span>
                  <span className="text-[11px] text-emerald-400 font-mono">({humanPlayer.hand.length} Cards)</span>
                </div>
              </div>

              {/* Right Side: Sort Controls and Vertical UP-TO-DOWN Auto-Select Stack */}
              <div className="relative flex items-center gap-2 z-50 pointer-events-auto">
                <button
                  id="btn-sort-hand"
                  type="button"
                  onClick={() => {
                    soundEffects.playCardSelect();
                    setSortDescending(!sortDescending);
                  }}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-xs text-white font-bold rounded-lg border border-white/15 flex items-center gap-1.5 transition uppercase tracking-wider cursor-pointer shadow-sm pointer-events-auto"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sort {sortDescending ? '3→2' : '2→3'}</span>
                </button>

                {selectedCardIds.length > 0 && (
                  <button
                    id="btn-clear-selection"
                    type="button"
                    onClick={() => {
                      soundEffects.playCardSelect();
                      setSelectedCardIds([]);
                    }}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-xs text-white/80 rounded-lg border border-white/15 flex items-center gap-1 transition cursor-pointer shadow-sm pointer-events-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Clear</span>
                  </button>
                )}

                {/* AUTO SELECT FEATURE (Positioned vertically UP-TO-DOWN below SORT 2 -> 3 without pushing cards down) */}
                {eligibleAutoSelectOptions.length > 0 && (
                  <div className="absolute right-0 top-full mt-1.5 z-50 flex flex-col items-end gap-1.5 bg-black/95 p-2 rounded-xl border border-amber-400/60 shadow-2xl backdrop-blur-md max-h-56 overflow-y-auto scrollbar-thin pointer-events-auto">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-amber-400/90 flex items-center gap-1 select-none px-1">
                      <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-spin-slow" />
                      <span>Auto Select:</span>
                    </span>
                    {eligibleAutoSelectOptions.map((opt) => {
                      return (
                        <button
                          key={opt.key}
                          id={`btn-auto-select-${opt.key}`}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAutoSelect(opt.key, opt.combos);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between gap-3 border shadow-md cursor-pointer min-w-[145px] bg-gradient-to-r from-emerald-950/95 to-teal-900/95 border-emerald-400/80 text-emerald-300 ring-1 ring-emerald-400/40 hover:brightness-125 active:scale-95 pointer-events-auto select-none"
                        >
                          <span className="truncate">{opt.label}</span>
                          <span className="px-1.5 py-0.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 rounded text-[10px] font-mono font-bold">
                            {opt.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* CARDS DISPLAY (Elevated upper position on felt with generous bottom margin above footer) */}
            <div className="relative z-20 w-full max-w-[98vw] flex justify-center pt-3 pb-6 sm:pb-8 px-1 sm:px-3 overflow-visible">
              <div
                className={`flex items-center justify-center p-1 sm:p-2 overflow-visible ${
                  sortedHumanHand.length >= 22
                    ? '-space-x-8 sm:-space-x-10 md:-space-x-11 lg:-space-x-12'
                    : sortedHumanHand.length >= 16
                    ? '-space-x-7 sm:-space-x-8 md:-space-x-9 lg:-space-x-10'
                    : sortedHumanHand.length >= 10
                    ? '-space-x-5 sm:-space-x-6 md:-space-x-7 lg:-space-x-8'
                    : '-space-x-3 sm:-space-x-4 md:-space-x-5'
                }`}
              >
                {sortedHumanHand.map((card) => {
                  const isSelected = selectedCardIds.includes(card.id);
                  const isThree = card.rank === 3;
                  const isBuangWaiting = manualBuangKartuState?.step === 'waiting-player';

                  return (
                    <CardView
                      key={card.id}
                      card={card}
                      isSelected={isSelected}
                      onClick={() => handleCardClick(card)}
                      size="md"
                      className={`hover:z-50 relative shrink-0 transition-transform ${
                        isBuangWaiting && isThree
                          ? 'ring-2 ring-amber-400 rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.9)] animate-pulse'
                          : ''
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* BOTTOM IMMERSIVE CONTROL DECK */}
      <footer className="relative z-30 bg-black/90 border-t border-white/20 backdrop-blur-md px-4 sm:px-8 py-2 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-2xl rounded-t-[20px] sm:rounded-t-[28px]">
        {/* Left: Selection Status */}
        <div className="flex flex-col text-center sm:text-left">
          <span className="text-[9px] text-white/40 uppercase tracking-widest font-semibold">
            {manualBuangKartuState ? 'Tahap Awal: Buang Kartu 3' : 'Current Hand Selected'}
          </span>
          {manualBuangKartuState ? (
            <span className="text-sm sm:text-base font-bold tracking-tight text-amber-300 flex items-center gap-1.5 justify-center sm:justify-start">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {manualBuangKartuState.step === 'waiting-player'
                  ? 'BUANG SELURUH KARTU 3 KE MEJA'
                  : manualBuangKartuState.step === 'bots-throwing'
                  ? 'GILIRAN LAWAN MEMBUANG KARTU 3'
                  : 'PEMILIK 3 SEKOP (3♠) MEMULAI PERMAINAN'}
              </span>
            </span>
          ) : isHumanTurn && !hasEligibleCards && lastCombo !== null ? (
            <span className="text-xs sm:text-sm font-bold tracking-tight text-rose-400 flex items-center justify-center sm:justify-start gap-1 animate-pulse">
              <Ban className="w-3.5 h-3.5" /> NO ELIGIBLE CARDS — AUTO PASSING...
            </span>
          ) : (
            <span className="text-sm sm:text-base font-bold tracking-tight text-emerald-400">
              {selectedCards.length === 0
                ? isHumanTurn
                  ? isFirstTurnOfGame && variant !== 'indonesian'
                    ? 'SELECT 3 OF SPADES (3♠) COMBO'
                    : 'YOUR TURN — SELECT CARDS TO PLAY'
                  : 'NO CARDS SELECTED'
                : identifiedCombo
                ? !canBeatCombo(identifiedCombo, lastCombo, variant)
                  ? `${identifiedCombo.description.toUpperCase()} ${
                      variant === 'indonesian' && lastCombo && identifiedCombo.primaryRank === lastCombo.primaryRank
                        ? '(MUST THROW HIGHER NUMBER)'
                        : '(CANNOT BEAT TABLE)'
                    }`
                  : variant === 'indonesian' && identifiedCombo.type === 'straight-flush'
                  ? `${identifiedCombo.description.toUpperCase()} (💥 AUTO WIN!)`
                  : identifiedCombo.description.toUpperCase()
                : variant === 'indonesian' && selectedCards.length >= 3 && isConsecutiveRanks(selectedCards.map((c) => c.rank))
                ? 'STRAIGHT MUST BE SAME SYMBOL (NOT DIFFERENT SUITS)'
                : `${selectedCards.length} CARDS (INVALID COMBO)`}
            </span>
          )}
        </div>

        {/* Center: Action Buttons */}
        <div className="flex items-center gap-3">
          {manualBuangKartuState ? (
            manualBuangKartuState.step === 'waiting-player' ? (
              humanPlayer.hand.filter((c) => c.rank === 3).length > 0 ? (
                <button
                  id="btn-footer-buang-kartu-action"
                  type="button"
                  onClick={onHumanThrowThrees}
                  className="px-6 sm:px-8 h-10 sm:h-11 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.6)] flex items-center gap-2 cursor-pointer transition transform hover:scale-105 animate-pulse"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>BUANG KARTU 3 ({humanPlayer.hand.filter((c) => c.rank === 3).length} KARTU)</span>
                </button>
              ) : (
                <button
                  id="btn-footer-buang-kartu-empty"
                  type="button"
                  onClick={onHumanThrowThrees}
                  className="px-6 sm:px-8 h-10 sm:h-11 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white/90 font-bold text-xs uppercase tracking-wider border border-white/20 shadow-md flex items-center gap-2 cursor-pointer transition transform hover:scale-105"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>TIDAK ADA KARTU 3 (LANJUT)</span>
                </button>
              )
            ) : manualBuangKartuState.step === 'bots-throwing' ? (
              <div className="h-10 sm:h-11 px-6 rounded-full bg-black/80 border border-amber-400/40 text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-inner">
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>MEMBUANG KARTU 3...</span>
              </div>
            ) : (
              <button
                id="btn-footer-start-game"
                type="button"
                onClick={onFinishBuangKartu}
                className="px-6 sm:px-8 h-10 sm:h-11 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center gap-2 cursor-pointer transition transform hover:scale-105"
              >
                <span>MULAI PERMAINAN SEKARANG</span>
                <Zap className="w-4 h-4 fill-current" />
              </button>
            )
          ) : (
            <>
              {/* PASS BUTTON */}
              <button
                id="btn-poker-pass"
                type="button"
                onClick={handlePassClick}
                disabled={!isHumanTurn || lastCombo === null}
                className={`
                  w-28 sm:w-36 h-10 sm:h-11 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-full text-xs font-bold uppercase tracking-[0.15em] transition-all text-white flex items-center justify-center gap-1.5 shadow-md
                  ${!isHumanTurn || lastCombo === null ? 'opacity-40 cursor-not-allowed hover:bg-zinc-800' : 'cursor-pointer'}
                `}
              >
                <Ban className="w-3.5 h-3.5 text-rose-400" />
                Pass
              </button>

              {/* PLAY CARDS BUTTON */}
              <button
                id="btn-poker-play"
                type="button"
                onClick={handlePlayClick}
                disabled={!isValidPlay}
                className={`
                  w-36 sm:w-48 h-10 sm:h-11 rounded-full text-xs font-bold uppercase tracking-[0.15em] transition-all text-white flex items-center justify-center gap-1.5 border border-emerald-400/30
                  ${
                    isValidPlay
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer'
                      : 'bg-zinc-800/60 text-white/40 border-white/10 cursor-not-allowed opacity-50'
                  }
                `}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                Play Cards
              </button>
            </>
          )}
        </div>

        {/* Right: Table Pot Summary */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="text-right">
            <span className="block text-[9px] text-white/40 uppercase tracking-widest font-semibold">Match Win Pot</span>
            <span className="text-sm font-mono text-amber-400 font-bold">
              ~{(betAmount * (players.length - 1) * 7).toLocaleString()} Coins
            </span>
          </div>
        </div>
      </footer>

      {/* QUIT TO MENU CONFIRMATION POPUP MODAL */}
      <AnimatePresence>
        {showQuitConfirm && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="bg-[#0c0c0c] border-2 border-amber-400/50 w-full max-w-sm rounded-3xl shadow-[0_0_80px_rgba(245,158,11,0.25)] overflow-hidden text-white flex flex-col p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center mx-auto mb-3 text-rose-400">
                <LogOut className="w-6 h-6" />
              </div>

              <h2 className="text-2xl font-black tracking-wider uppercase text-amber-400 mb-1">
                QUIT TO MENU?
              </h2>

              <p className="text-white/70 text-xs font-medium mb-6">
                Are you sure you want to quit the match? Any active progress will be lost.
              </p>

              <div className="flex items-center gap-3 justify-center">
                <button
                  id="btn-quit-yes"
                  type="button"
                  onClick={() => {
                    soundEffects.playCardSelect();
                    setShowQuitConfirm(false);
                    onOpenSetup();
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg hover:shadow-rose-600/30 cursor-pointer"
                >
                  YES
                </button>

                <button
                  id="btn-quit-no"
                  type="button"
                  onClick={() => {
                    soundEffects.playCardSelect();
                    setShowQuitConfirm(false);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg hover:shadow-emerald-600/30 cursor-pointer"
                >
                  NO
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

