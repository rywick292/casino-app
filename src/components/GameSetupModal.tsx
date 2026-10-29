import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Difficulty, PokerVariant } from '../types';
import { soundEffects } from '../utils/soundEffects';
import { Coins, Users, Zap, HelpCircle, Award, Home, Sparkles, ArrowLeft, Play, Flame, Shield, Bomb } from 'lucide-react';

interface GameSetupModalProps {
  currentCoins: number;
  onStartGame: (config: {
    aiCount: number;
    difficulty: Difficulty;
    betAmount: number;
    playerName: string;
    playerAvatar: string;
    variant: PokerVariant;
  }) => void;
  onPlaySlotMachine: () => void;
  onPlayBlackjack: () => void;
  onPlayTexasHoldem: () => void;
  onOpenRules: () => void;
  onResetCoins: () => void;
  onGoToHomepage: () => void;
}

const AVATARS = ['👑', '🎩', '🐯', '🦊', '⚡', '🐉', '💎', '♠️'];
const BET_PRESETS = [100, 500, 1000, 2500, 5000, 10000];

export const GameSetupModal: React.FC<GameSetupModalProps> = ({
  currentCoins,
  onStartGame,
  onPlaySlotMachine,
  onPlayBlackjack,
  onPlayTexasHoldem,
  onOpenRules,
  onResetCoins,
  onGoToHomepage,
}) => {
  // Main Menu Navigation State: 'select-game' -> 'select-poker-mode' -> 'poker-setup'
  const [menuView, setMenuView] = useState<'select-game' | 'select-poker-mode' | 'poker-setup'>('select-game');

  // Selected Poker Variant
  const [selectedVariant, setSelectedVariant] = useState<PokerVariant>('global');

  // Poker Configuration State
  const [aiCount, setAiCount] = useState<number>(3); // Default 3 AI (4 player game)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [betAmount, setBetAmount] = useState<number>(1000);
  const [playerName, setPlayerName] = useState<string>('Player 1');
  const [playerAvatar, setPlayerAvatar] = useState<string>('👑');

  const handleSelectPokerMode = (variant: PokerVariant) => {
    soundEffects.playCardSelect();
    setSelectedVariant(variant);
    setMenuView('poker-setup');
  };

  const handleStartPoker = () => {
    soundEffects.playKaChing();
    onStartGame({
      aiCount,
      difficulty,
      betAmount,
      playerName: playerName.trim() || 'Player 1',
      playerAvatar,
      variant: selectedVariant,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#030907]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Casino Ambient Glows & Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950/60 via-[#030d0a] to-[#010403] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      {/* 3D Floating Background Card Suit Logos */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-between px-4 sm:px-20"
        style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
      >
        <div className="flex flex-col gap-16 text-7xl sm:text-9xl font-serif">
          <motion.div
            animate={{
              y: [-15, 15, -15],
              rotateX: [15, -15, 15],
              rotateY: [-20, 20, -20],
              rotateZ: [-10, 10, -10],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="text-amber-400 opacity-25 drop-shadow-[0_20px_30px_rgba(245,158,11,0.4)]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            ♠
          </motion.div>

          <motion.div
            animate={{
              y: [15, -15, 15],
              rotateX: [-20, 15, -20],
              rotateY: [15, -25, 15],
              rotateZ: [12, -12, 12],
            }}
            transition={{
              duration: 8.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
            className="text-rose-500 opacity-25 drop-shadow-[0_20px_30px_rgba(244,63,94,0.4)]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            ♦
          </motion.div>
        </div>

        <div className="flex flex-col gap-16 text-7xl sm:text-9xl font-serif">
          <motion.div
            animate={{
              y: [12, -18, 12],
              rotateX: [-15, 20, -15],
              rotateY: [25, -15, 25],
              rotateZ: [8, -12, 8],
            }}
            transition={{
              duration: 6.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.2,
            }}
            className="text-rose-500 opacity-25 drop-shadow-[0_20px_30px_rgba(244,63,94,0.4)]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            ♥
          </motion.div>

          <motion.div
            animate={{
              y: [-18, 12, -18],
              rotateX: [20, -15, 20],
              rotateY: [-15, 20, -15],
              rotateZ: [-14, 10, -14],
            }}
            transition={{
              duration: 7.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.7,
            }}
            className="text-emerald-400 opacity-25 drop-shadow-[0_20px_30px_rgba(16,185,129,0.4)]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            ♣
          </motion.div>
        </div>
      </div>

      {/* Main Container Card */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="relative z-10 bg-[#0a0a0a] border-2 border-emerald-500 w-full max-w-xl rounded-3xl shadow-[0_0_90px_rgba(16,185,129,0.4)] overflow-hidden text-white flex flex-col my-auto"
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-900 p-5 sm:p-6 text-center relative border-b border-emerald-500/30">
          {/* Top Left Navigation Button */}
          {menuView === 'poker-setup' ? (
            <button
              id="btn-back-to-poker-modes"
              type="button"
              onClick={() => {
                soundEffects.playCardSelect();
                setMenuView('select-poker-mode');
              }}
              className="absolute top-4 left-4 bg-black/40 hover:bg-black/70 text-emerald-300 px-3 py-1.5 rounded-full transition-all border border-emerald-400/30 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Modes</span>
            </button>
          ) : menuView === 'select-poker-mode' ? (
            <button
              id="btn-back-to-games"
              type="button"
              onClick={() => {
                soundEffects.playCardSelect();
                setMenuView('select-game');
              }}
              className="absolute top-4 left-4 bg-black/40 hover:bg-black/70 text-emerald-300 px-3 py-1.5 rounded-full transition-all border border-emerald-400/30 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Back</span>
            </button>
          ) : (
            <button
              id="btn-homepage-header"
              type="button"
              onClick={onGoToHomepage}
              className="absolute top-4 left-4 bg-black/40 hover:bg-black/70 text-amber-400 px-3 py-1.5 rounded-full transition-all border border-amber-400/30 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              <Home className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Home</span>
            </button>
          )}

          {/* Top Right Rules Button */}
          <button
            id="btn-rules-header"
            type="button"
            onClick={onOpenRules}
            className="absolute top-4 right-4 bg-black/40 hover:bg-black/70 text-emerald-400 px-3 py-1.5 rounded-full transition-all border border-emerald-400/30 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 text-emerald-400 text-xs font-bold uppercase tracking-[0.2em] mb-2 border border-emerald-500/20">
            <span>♠ ♦ Casino Game Hub ♣ ♥</span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-wider uppercase">
            {menuView === 'select-game'
              ? 'MAIN MENU - SELECT GAME'
              : menuView === 'select-poker-mode'
              ? 'SELECT POKER VARIANT'
              : `${selectedVariant === 'indonesian' ? '🇮🇩 INDONESIAN POKER' : '🌐 GLOBAL BIG 2'} SETUP`}
          </h1>
          <p className="text-white/60 text-xs sm:text-sm font-medium mt-1">
            {menuView === 'select-game'
              ? 'Choose an arena to test your luck & skill'
              : menuView === 'select-poker-mode'
              ? 'Pick between Global Big 2 or Indonesian Poker (Capsa Banting)'
              : 'Configure match settings & prepare for battle'}
          </p>
        </div>

        {/* Dynamic Body Content */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Player Coins & Profile Bar */}
          <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl p-1 bg-zinc-800 rounded-xl border border-white/10">
                {playerAvatar}
              </span>
              <div>
                <span className="text-[10px] text-white/40 block font-medium uppercase tracking-wider">
                  Player Name
                </span>
                <span className="text-xs sm:text-sm font-bold text-white">
                  {playerName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <div className="text-right">
                <span className="text-[10px] text-white/40 block font-medium uppercase tracking-wider">
                  Total Balance
                </span>
                <span className="text-base sm:text-lg font-black text-amber-400 flex items-center gap-1 font-mono">
                  <Coins className="w-4 h-4 text-amber-400" />
                  {currentCoins.toLocaleString()}
                </span>
              </div>
              {currentCoins < 1000 && (
                <button
                  id="btn-reset-coins"
                  type="button"
                  onClick={onResetCoins}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition uppercase tracking-wider cursor-pointer"
                >
                  Reload (100k)
                </button>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* 1. SELECT GAME MENU (4 CASINO GAMES) */}
            {menuView === 'select-game' && (
              <motion.div
                key="select-game-view"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* 1. BIG 2 & INDONESIAN POKER */}
                <div className="relative group overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-2 border-emerald-500/50 hover:border-emerald-400 p-4 sm:p-5 shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all duration-300 flex flex-col justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-800 flex items-center justify-center text-white font-serif text-3xl shadow-lg border border-emerald-300 flex-shrink-0">
                      ♠
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          CARD SHEDDING POKER
                        </span>
                        <span className="bg-emerald-600/30 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          2 MODES
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-white">
                        Big 2 & Indonesian Poker
                      </h2>
                      <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
                        Global Big 2 and Indonesian Poker (Capsa Banting) featuring manual Buang Kartu 3, Pure Hand (Murni) wins, Suited Straights & Bombs!
                      </p>
                    </div>
                  </div>

                  <button
                    id="btn-select-poker"
                    type="button"
                    onClick={() => {
                      soundEffects.playCardSelect();
                      setMenuView('select-poker-mode');
                    }}
                    className="w-full py-2.5 sm:py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-[1.01] active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>PLAY BIG 2 / INDONESIAN POKER</span>
                  </button>
                </div>

                {/* 2. BLACKJACK (LAS VEGAS 3:2, HALF-CIRCLE TABLE) */}
                <div className="relative group overflow-hidden rounded-3xl bg-gradient-to-r from-teal-950/80 via-slate-900 to-emerald-950/80 border-2 border-teal-500/50 hover:border-teal-400 p-4 sm:p-5 shadow-[0_0_30px_rgba(20,184,166,0.2)] transition-all duration-300 flex flex-col justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-800 flex items-center justify-center text-white font-black text-2xl shadow-lg border border-teal-300 flex-shrink-0">
                      🃏
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-teal-500/20 border border-teal-400/40 text-teal-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          CASINO CLASSIC
                        </span>
                        <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                          PAYS 3:2
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-white">
                        Casino Blackjack (1-on-1 vs Dealer)
                      </h2>
                      <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
                        Authentic half-circle table with 3 betting circles, Insurance Pays 2:1, Hit, Stand, Double Down, and Dealer stands on 17.
                      </p>
                    </div>
                  </div>

                  <button
                    id="btn-select-blackjack"
                    type="button"
                    onClick={() => {
                      soundEffects.playCardDeal();
                      onPlayBlackjack();
                    }}
                    className="w-full py-2.5 sm:py-3 px-6 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs sm:text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(20,184,166,0.4)] hover:scale-[1.01] active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>PLAY BLACKJACK</span>
                  </button>
                </div>

                {/* 3. TEXAS HOLD'EM POKER */}
                <div className="relative group overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border-2 border-blue-500/50 hover:border-blue-400 p-4 sm:p-5 shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300 flex flex-col justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white text-2xl shadow-lg border border-blue-300 flex-shrink-0">
                      🤠
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-blue-500/20 border border-blue-400/40 text-blue-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          NO-LIMIT POKER
                        </span>
                        <span className="bg-blue-600/40 text-blue-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          1 TO 7 BOTS
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-white">
                        Texas Hold'em Poker
                      </h2>
                      <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
                        International No-Limit Hold'em on the classic oval table. Check, Call, Raise, Fold, Blinds & customizable bot opponents.
                      </p>
                    </div>
                  </div>

                  <button
                    id="btn-select-texas-holdem"
                    type="button"
                    onClick={() => {
                      soundEffects.playCardDeal();
                      onPlayTexasHoldem();
                    }}
                    className="w-full py-2.5 sm:py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-[1.01] active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>PLAY TEXAS HOLD'EM</span>
                  </button>
                </div>

                {/* 4. ROYAL 3D SLOT MACHINE */}
                <div className="relative group overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-2 border-amber-500/50 hover:border-amber-400 p-4 sm:p-5 shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all duration-300 flex flex-col justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 font-black text-3xl shadow-lg border border-amber-200 flex-shrink-0">
                      🎰
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          CASINO SPECIAL
                        </span>
                        <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                          HOT
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-white">
                        Royal 3D Gold Slot Machine
                      </h2>
                      <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
                        Spin ♦, ♠, and Lucky 7 with real casino mechanics, animated 3D lever, and 3X Mega Extra Bonus payouts.
                      </p>
                    </div>
                  </div>

                  <button
                    id="btn-select-slot"
                    type="button"
                    onClick={() => {
                      soundEffects.playChipSound();
                      onPlaySlotMachine();
                    }}
                    className="w-full py-2.5 sm:py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-[1.01] active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>PLAY SLOT MACHINE</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* 2. SELECT POKER VARIANT: GLOBAL BIG 2 vs INDONESIAN POKER */}
            {menuView === 'select-poker-mode' && (
              <motion.div
                key="select-poker-mode-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* SECTION A: GLOBAL BIG 2 POKER */}
                <div className="relative group overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-teal-950/80 border-2 border-blue-500/50 hover:border-blue-400 p-5 shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300 flex flex-col justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-800 flex items-center justify-center text-white text-2xl shadow-lg border border-blue-300 flex-shrink-0">
                      🌐
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-blue-500/20 border border-blue-400/40 text-blue-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          CLASSIC RULES
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-white">
                        GLOBAL BIG 2 POKER
                      </h2>
                      <p className="text-xs text-white/70 mt-1 leading-relaxed">
                        Standard international Big 2. Cross-category 5-card hands allowed (Full House beats Straight, Four-of-a-kind beats Full House, Straight Flush beats all).
                      </p>
                    </div>
                  </div>

                  <button
                    id="btn-choose-global-poker"
                    type="button"
                    onClick={() => handleSelectPokerMode('global')}
                    className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-[1.02] active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>CONFIGURE GLOBAL BIG 2</span>
                  </button>
                </div>

                {/* SECTION B: INDONESIAN POKER */}
                <div className="relative group overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/80 border-2 border-rose-500/60 hover:border-rose-400 p-5 shadow-[0_0_30px_rgba(244,63,94,0.3)] transition-all duration-300 flex flex-col justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-amber-600 flex items-center justify-center text-white text-2xl shadow-lg border border-rose-300 flex-shrink-0">
                      🇮🇩
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          CAPSA BANTING SPECIAL
                        </span>
                        <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Bomb className="w-2.5 h-2.5" /> BOMB & MURNI
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-white">
                        INDONESIAN POKER
                      </h2>
                      <div className="space-y-1 mt-1 text-xs text-white/70">
                        <p>👑 <strong className="text-amber-300">MURNI Win</strong>: No J, Q, K cards dealt = Instant Pure Hand Victory!</p>
                        <p>💣 <strong className="text-rose-400">BOMB Cards</strong>: 4-of-a-Kind & Straight Flush bomb single '2' (Pair 2s & Fullhouse cannot be bombed)!</p>
                        <p>🎯 <strong className="text-white">Strict Combos</strong>: Straight only beat Straight; Full House only beat Full House.</p>
                        <p>🚫 <strong className="text-rose-300">No Flush</strong>: Regular Flushes not playable (Only Straight Flush Bombs allowed).</p>
                      </div>
                    </div>
                  </div>

                  <button
                    id="btn-choose-indonesian-poker"
                    type="button"
                    onClick={() => handleSelectPokerMode('indonesian')}
                    className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-amber-600 to-rose-700 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs sm:text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:scale-[1.02] active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>CONFIGURE INDONESIAN POKER</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* 3. POKER CONFIGURATION VIEW (MATCH SETTINGS) */}
            {menuView === 'poker-setup' && (
              <motion.div
                key="poker-setup-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Active Mode Switcher Pill */}
                <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-white/10">
                  <button
                    id="btn-tab-global-mode"
                    type="button"
                    onClick={() => {
                      soundEffects.playCardSelect();
                      setSelectedVariant('global');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedVariant === 'global'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    <span>🌐 GLOBAL BIG 2</span>
                  </button>

                  <button
                    id="btn-tab-indonesian-mode"
                    type="button"
                    onClick={() => {
                      soundEffects.playCardSelect();
                      setSelectedVariant('indonesian');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedVariant === 'indonesian'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    <span>🇮🇩 INDONESIAN POKER</span>
                  </button>
                </div>

                {/* Mode Rules Pill Preview */}
                {selectedVariant === 'indonesian' ? (
                  <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-2xl text-xs text-rose-200 flex items-start gap-2.5">
                    <Bomb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300 block mb-0.5">🇮🇩 Indonesian Poker (Capsa Banting) Active Rules:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-white/80">
                        <li><strong>MURNI (Pure Hand)</strong>: Dealt hand with No J, Q, K = Instant Win!</li>
                        <li><strong>BOMBS</strong>: 4-of-a-Kind (4 cards) & Straight Flush bomb any '2' to claim win.</li>
                        <li><strong>Strict Combos</strong>: Straight only beats Straight; Fullhouse only beats Fullhouse.</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-blue-950/40 border border-blue-500/40 rounded-2xl text-xs text-blue-200 flex items-start gap-2.5">
                    <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-blue-300 block mb-0.5">🌐 Global Big 2 Active Rules:</span>
                      <p className="text-[11px] text-white/80">
                        Standard Big 2 5-card hand hierarchy: Straight &lt; Flush &lt; Full House &lt; Four-of-a-Kind &lt; Straight Flush.
                      </p>
                    </div>
                  </div>
                )}

                {/* Choose Avatar & Custom Name */}
                <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-white/10 space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Choose Your Avatar & Name:
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    {AVATARS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => {
                          soundEffects.playCardSelect();
                          setPlayerAvatar(av);
                        }}
                        className={`text-xl p-2 rounded-xl transition-all cursor-pointer ${
                          playerAvatar === av
                            ? 'bg-emerald-600 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400'
                            : 'bg-zinc-800 hover:bg-zinc-700'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                  <input
                    id="input-player-name"
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter player name"
                    className="w-full bg-zinc-950 border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {/* AI Opponents Count (1 - 4) */}
                <div>
                  <label className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    AI Opponents (1 to 4):
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((count) => (
                      <button
                        key={count}
                        id={`btn-ai-count-${count}`}
                        type="button"
                        onClick={() => {
                          soundEffects.playCardSelect();
                          setAiCount(count);
                        }}
                        className={`p-3 rounded-2xl font-bold text-center border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                          aiCount === count
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-102 ring-2 ring-emerald-400'
                            : 'bg-zinc-900 text-white/70 border-white/10 hover:border-white/30'
                        }`}
                      >
                        <span className="text-lg font-extrabold">{count}</span>
                        <span className="text-[10px] uppercase font-semibold tracking-wider">
                          {count === 1 ? '1 Bot' : `${count} Bots`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Difficulty Level */}
                <div>
                  <label className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    AI Difficulty Level:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => {
                      const activeColors = {
                        easy: 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
                        medium: 'bg-amber-600 text-white border-amber-400 ring-2 ring-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
                        hard: 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
                      }[diff];

                      return (
                        <button
                          key={diff}
                          id={`btn-difficulty-${diff}`}
                          type="button"
                          onClick={() => {
                            soundEffects.playCardSelect();
                            setDifficulty(diff);
                          }}
                          className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                            difficulty === diff
                              ? activeColors
                              : 'bg-zinc-900 text-white/70 border-white/10 hover:border-white/30'
                          }`}
                        >
                          <span className="text-sm font-extrabold capitalize">{diff}</span>
                          <span className="text-[10px] opacity-70 uppercase tracking-wider">
                            {diff === 'easy' ? 'Casual' : diff === 'medium' ? 'Balanced' : 'Master'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bet Selection (100 to 10,000 coins) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-400" />
                      Select Bet Amount (per card):
                    </label>
                    <span className="text-base font-black text-amber-400 font-mono bg-zinc-900 px-3 py-1 rounded-xl border border-white/10">
                      {betAmount.toLocaleString()} Coins
                    </span>
                  </div>

                  {/* Bet Presets */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                    {BET_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        id={`btn-bet-preset-${preset}`}
                        type="button"
                        onClick={() => {
                          soundEffects.playChipSound();
                          setBetAmount(preset);
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          betAmount === preset
                            ? 'bg-amber-500 text-black border-amber-300 font-extrabold ring-2 ring-amber-400 scale-102 shadow-lg'
                            : 'bg-zinc-900 text-white/70 border-white/10 hover:border-amber-400/50'
                        }`}
                      >
                        {preset.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  {/* Slider for custom bet */}
                  <input
                    id="bet-slider"
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Action Button to Start Match */}
                <button
                  id="btn-start-poker-game"
                  type="button"
                  onClick={handleStartPoker}
                  disabled={currentCoins < betAmount}
                  className={`w-full py-4 rounded-full font-bold text-sm sm:text-base tracking-[0.2em] uppercase transition-all shadow-xl flex items-center justify-center gap-2 border border-emerald-400/30 ${
                    currentCoins < betAmount
                      ? 'bg-zinc-800 text-white/30 cursor-not-allowed border-white/5'
                      : selectedVariant === 'indonesian'
                      ? 'bg-gradient-to-r from-rose-600 via-amber-600 to-rose-700 hover:from-rose-500 hover:to-amber-500 text-white shadow-[0_0_25px_rgba(244,63,94,0.5)] cursor-pointer'
                      : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer'
                  }`}
                >
                  <Award className="w-5 h-5" />
                  <span>Start {selectedVariant === 'indonesian' ? 'Indonesian Poker' : 'Big 2'} Match</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

