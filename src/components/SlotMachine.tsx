import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlotSymbol, SlotResult } from '../types';
import { soundEffects } from '../utils/soundEffects';
import { Coins, Trophy, Sparkles, Home, Menu, RotateCcw, ArrowRight, HelpCircle, Zap } from 'lucide-react';

interface SlotMachineProps {
  currentCoins: number;
  onUpdateCoins: (newCoins: number) => void;
  onGoToMainMenu: () => void;
  onGoToHomepage: () => void;
}

const SYMBOLS: SlotSymbol[] = ['diamond', 'spade', 'seven'];

// Symbol visual render helper with rich 3D dimensionality & dark brown text frame on 7
const renderSymbolVisual = (sym: SlotSymbol, size: 'sm' | 'md' | 'lg' = 'lg') => {
  if (sym === 'diamond') {
    return (
      <div className="flex items-center justify-center select-none py-1">
        {/* 3D Dimensional Diamond Gem (No Caption Below) */}
        <span
          className={`font-serif leading-none transition-transform select-none ${
            size === 'lg' ? 'text-6xl sm:text-7xl' : size === 'md' ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'
          } text-red-600`}
          style={{
            filter:
              'drop-shadow(1px 1px 0px #b91c1c) drop-shadow(2px 2px 0px #991b1b) drop-shadow(3px 3px 0px #7f1d1d) drop-shadow(4px 4px 6px rgba(0,0,0,0.6))',
          }}
        >
          ♦
        </span>
      </div>
    );
  }

  if (sym === 'spade') {
    return (
      <div className="flex items-center justify-center select-none py-1">
        {/* 3D Dimensional Spade (No Caption Below) */}
        <span
          className={`font-serif leading-none transition-transform select-none ${
            size === 'lg' ? 'text-6xl sm:text-7xl' : size === 'md' ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'
          } text-slate-900`}
          style={{
            filter:
              'drop-shadow(1px 1px 0px #475569) drop-shadow(2px 2px 0px #334155) drop-shadow(3px 3px 0px #1e293b) drop-shadow(4px 4px 6px rgba(0,0,0,0.65))',
          }}
        >
          ♠
        </span>
      </div>
    );
  }

  // Lucky 7: Number 7 only with dark brown text frame (No square box & No caption below)
  return (
    <div className="flex items-center justify-center select-none py-1">
      <span
        className={`font-black font-art-deco leading-none text-amber-400 select-none ${
          size === 'lg' ? 'text-6xl sm:text-7xl' : size === 'md' ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'
        }`}
        style={{
          WebkitTextStroke: '2.5px #3b1a06',
          paintOrder: 'stroke fill',
          textShadow:
            '2px 2px 0px #3b1a06, -2px -2px 0px #3b1a06, 2px -2px 0px #3b1a06, -2px 2px 0px #3b1a06, 0px 3px 0px #2a1103, 3px 4px 6px rgba(0,0,0,0.75)',
        }}
      >
        7
      </span>
    </div>
  );
};

export const SlotMachine: React.FC<SlotMachineProps> = ({
  currentCoins,
  onUpdateCoins,
  onGoToMainMenu,
  onGoToHomepage,
}) => {
  const [betAmount, setBetAmount] = useState<number>(1000);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isLeverPulled, setIsLeverPulled] = useState<boolean>(false);

  // Active Reel Positions
  const [reels, setReels] = useState<[SlotSymbol, SlotSymbol, SlotSymbol]>(['seven', 'diamond', 'spade']);
  const [reelSpinning, setReelSpinning] = useState<[boolean, boolean, boolean]>([false, false, false]);

  // Result popup
  const [result, setResult] = useState<SlotResult | null>(null);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [showPaytable, setShowPaytable] = useState<boolean>(false);

  // Chasing Lamps Animation Counter
  const [lampStep, setLampStep] = useState<number>(0);

  // Interval for chasing lights above machine
  useEffect(() => {
    const interval = setInterval(() => {
      setLampStep((prev) => (prev + 1) % 16);
    }, 90);
    return () => clearInterval(interval);
  }, []);

  // Quick Bet presets
  const BET_PRESETS = [1000, 2500, 5000, 10000, 25000, 50000];

  // Slot machine spinning logic
  const handleSpin = () => {
    if (isSpinning) return;
    if (currentCoins < betAmount) {
      soundEffects.playNiceTry();
      return;
    }

    // Deduct bet coins immediately
    const remainingCoins = currentCoins - betAmount;
    onUpdateCoins(remainingCoins);

    setIsSpinning(true);
    setIsLeverPulled(true);
    setShowResultModal(false);
    setResult(null);
    soundEffects.playLeverPull();

    // Reset lever visual after spring return
    setTimeout(() => {
      setIsLeverPulled(false);
    }, 450);

    // Set all reels to spinning
    setReelSpinning([true, true, true]);

    // Continuous tick sound during spin
    const tickInterval = setInterval(() => {
      soundEffects.playReelTick();
    }, 110);

    // Generate RNG Outcome
    // Each reel picks from SYMBOLS ['diamond', 'spade', 'seven'] with authentic probability weights
    const rollReel = (): SlotSymbol => {
      const idx = Math.floor(Math.random() * SYMBOLS.length);
      return SYMBOLS[idx];
    };

    const finalReels: [SlotSymbol, SlotSymbol, SlotSymbol] = [rollReel(), rollReel(), rollReel()];

    // Calculate winnings
    // Case 1: All 3 symbols match (3X coins as inputted)
    const isThreeMatch = finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2];
    // Case 2: Exactly 2 symbols match (100% extra coins = 2X total payout)
    const isTwoMatch =
      !isThreeMatch &&
      (finalReels[0] === finalReels[1] ||
        finalReels[1] === finalReels[2] ||
        finalReels[0] === finalReels[2]);

    let multiplier = 0;
    let wonCoins = 0;
    let title: 'NICE TRY' | 'WIN WIN WIN' | 'MEGA EXTRA BONUS' = 'NICE TRY';

    if (isThreeMatch) {
      multiplier = 3;
      wonCoins = betAmount * 3;
      title = 'MEGA EXTRA BONUS';
    } else if (isTwoMatch) {
      multiplier = 2; // 100% extra on top of input (2x return)
      wonCoins = betAmount * 2;
      title = 'WIN WIN WIN';
    } else {
      multiplier = 0;
      wonCoins = 0;
      title = 'NICE TRY';
    }

    // Sequence Reel Stops (Staggered realistic reel lock-in)
    // Reel 1 stop after 1.2s
    setTimeout(() => {
      setReels((prev) => [finalReels[0], prev[1], prev[2]]);
      setReelSpinning((prev) => [false, prev[1], prev[2]]);
      soundEffects.playReelStop();
    }, 1200);

    // Reel 2 stop after 1.8s
    setTimeout(() => {
      setReels((prev) => [finalReels[0], finalReels[1], prev[2]]);
      setReelSpinning((prev) => [false, false, prev[2]]);
      soundEffects.playReelStop();
    }, 1800);

    // Reel 3 stop after 2.4s (result lands)
    setTimeout(() => {
      clearInterval(tickInterval);
      setReels(finalReels);
      setReelSpinning([false, false, false]);
      soundEffects.playReelStop();

      // Payout settlement balance update
      const updatedBalance = remainingCoins + wonCoins;
      if (wonCoins > 0) {
        onUpdateCoins(updatedBalance);
      }

      setResult({
        reels: finalReels,
        payoutMultiplier: multiplier,
        wonCoins,
        betCoins: betAmount,
        title,
      });

      // Sound effect plays 1 second (1000ms) after the spinning result is revealed
      // The lever and PULL button remain locked until the sound effect has played!
      setTimeout(() => {
        if (wonCoins > 0) {
          if (multiplier === 3) {
            soundEffects.playMegaBonus();
            setShowResultModal(true);
          } else {
            soundEffects.playSlotWin();
          }
        } else {
          soundEffects.playNiceTry();
        }

        // Unlock the lever and PULL button after the sound effect has played
        setIsSpinning(false);
      }, 1000);
    }, 2400);
  };

  // 16 Chasing Lamps generation around the top arch
  const totalLamps = 16;
  const lamps = Array.from({ length: totalLamps }, (_, i) => {
    // Distance from active step for smooth chasing effect
    const dist = (i - lampStep + totalLamps) % totalLamps;
    const isHead = dist === 0;
    const isTrail1 = dist === 1 || dist === totalLamps - 1;
    const isTrail2 = dist === 2;

    let bulbColor = 'bg-amber-900 border-amber-950 opacity-40 shadow-none';
    if (isHead) {
      bulbColor = 'bg-yellow-200 border-yellow-100 shadow-[0_0_15px_#fef08a,0_0_30px_#eab308] opacity-100 scale-125 z-10';
    } else if (isTrail1) {
      bulbColor = 'bg-amber-400 border-amber-300 shadow-[0_0_10px_#f59e0b] opacity-90 scale-110';
    } else if (isTrail2) {
      bulbColor = 'bg-amber-600 border-amber-500 shadow-[0_0_5px_#d97706] opacity-70';
    }

    return (
      <div
        key={i}
        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border transition-all duration-75 ${bulbColor}`}
      />
    );
  });

  return (
    <div className="relative min-h-screen w-screen bg-[#030706] text-white flex flex-col items-center justify-between p-3 sm:p-6 overflow-x-hidden font-sans select-none">
      {/* Background Casino Ambient Glows & Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/80 via-[#030d0a] to-[#010403] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-20 w-full max-w-5xl flex items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <button
            id="btn-slot-home"
            type="button"
            onClick={onGoToHomepage}
            className="flex items-center gap-1.5 bg-black/60 hover:bg-black/90 border border-amber-400/30 text-amber-300 hover:text-white px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition backdrop-blur-md cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Homepage</span>
          </button>

          <button
            id="btn-slot-menu"
            type="button"
            onClick={onGoToMainMenu}
            className="flex items-center gap-1.5 bg-black/60 hover:bg-black/90 border border-emerald-400/30 text-emerald-300 hover:text-white px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition backdrop-blur-md cursor-pointer"
          >
            <Menu className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Main Menu</span>
          </button>
        </div>

        {/* Player Credits Display */}
        <div className="flex items-center gap-3">
          <div className="bg-black/70 border border-amber-400/40 px-4 py-1.5 rounded-2xl flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
            <div className="text-right">
              <span className="text-[10px] text-white/50 block font-semibold uppercase tracking-widest leading-none">
                BALANCE
              </span>
              <span className="text-sm sm:text-base font-black font-mono text-amber-300 leading-none">
                {currentCoins.toLocaleString()}
              </span>
            </div>
          </div>

          <button
            id="btn-slot-paytable"
            type="button"
            onClick={() => setShowPaytable(!showPaytable)}
            className="flex items-center gap-1 bg-black/60 hover:bg-black/90 border border-white/20 text-white/80 hover:text-white px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Paytable</span>
          </button>
        </div>
      </header>

      {/* Main Realistic Gold 3D Slot Machine Stage */}
      <main className="relative z-10 my-auto flex flex-col items-center justify-center w-full max-w-4xl px-2">
        {/* SLOT MACHINE CABINET */}
        <div className="relative flex items-center justify-center">
          {/* Main Gold Casing Body */}
          <div
            className="relative w-full max-w-[340px] sm:max-w-[480px] md:max-w-[560px] rounded-[36px] p-4 sm:p-7
            bg-gradient-to-b from-amber-100 via-amber-400 to-amber-700
            border-[6px] sm:border-[8px] border-amber-200
            shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_4px_8px_rgba(255,255,255,0.9),inset_0_-8px_16px_rgba(0,0,0,0.5),0_0_40px_rgba(245,158,11,0.35)]
            flex flex-col items-center"
          >
            {/* Top Crown with Chasing Circle Lamps */}
            <div className="w-full bg-gradient-to-b from-slate-900 via-zinc-900 to-black rounded-2xl p-3 sm:p-4 mb-4 border-2 border-amber-400/80 shadow-[inset_0_2px_10px_rgba(0,0,0,0.9)] flex flex-col items-center relative overflow-hidden">
              {/* Gold Metallic Marquee Header */}
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h1 className="text-base sm:text-xl md:text-2xl font-black font-art-deco uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-300 to-amber-500 drop-shadow-[0_2px_10px_rgba(234,179,8,0.7)]">
                  ROYAL TRIPLE SLOTS
                </h1>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>

              {/* Chasing Lamps Arch Bar */}
              <div className="w-full flex items-center justify-between px-2 sm:px-4 py-1.5 bg-black/60 rounded-full border border-amber-500/30">
                {lamps}
              </div>
            </div>

            {/* Paytable Mini Banner */}
            <div className="w-full bg-gradient-to-r from-amber-950/70 via-black to-amber-950/70 border border-amber-500/40 rounded-xl px-3 py-1.5 mb-4 flex items-center justify-around text-[10px] sm:text-xs font-bold text-amber-300">
              <div className="flex items-center gap-1">
                <span className="text-red-400 font-serif">♦</span>
                <span className="text-white font-serif">♠</span>
                <span className="text-amber-400 font-art-deco">7</span>
                <span className="text-white/60 ml-1">3 OF A KIND =</span>
                <span className="text-yellow-400 font-black font-mono">3X WIN</span>
              </div>
              <div className="h-3 w-px bg-white/20" />
              <div className="flex items-center gap-1">
                <span className="text-white/60">ANY PAIR =</span>
                <span className="text-emerald-400 font-black font-mono">+100% EXTRA (2X)</span>
              </div>
            </div>

            {/* REEL DISPLAY WINDOW (3D Glass Box with Metallic Gold Bevel) */}
            <div className="relative w-full bg-black/90 p-3 sm:p-4 rounded-2xl border-4 border-amber-500 shadow-[inset_0_10px_30px_rgba(0,0,0,0.9),0_4px_12px_rgba(0,0,0,0.6)] overflow-hidden">
              {/* Glass Reflection Highlight */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none z-30" />
              
              {/* Payline Guide Red Arrows on Sides (No Middle Line) */}
              <div className="absolute left-1 top-1/2 -translate-y-1/2 text-red-500 font-black text-sm z-20 select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">▶</div>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 text-red-500 font-black text-sm z-20 select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">◀</div>

              {/* 3 Reels Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 relative z-10">
                {[0, 1, 2].map((idx) => {
                  const sym = reels[idx];
                  const isCurrentReelSpinning = reelSpinning[idx];

                  return (
                    <div
                      key={idx}
                      className="relative h-28 sm:h-36 md:h-44 bg-gradient-to-b from-slate-100 via-white to-slate-200 rounded-xl border-2 border-amber-400/70 shadow-[inset_0_15px_20px_rgba(0,0,0,0.4),inset_0_-15px_20px_rgba(0,0,0,0.4),0_4px_8px_rgba(0,0,0,0.3)] flex items-center justify-center overflow-hidden"
                    >
                      {/* Reel Cylinder Gradient Depth */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none z-10" />

                      {/* Spinning Blurred Animation or Static Locked Symbol */}
                      {isCurrentReelSpinning ? (
                        <motion.div
                          animate={{ y: [-140, 140] }}
                          transition={{ repeat: Infinity, duration: 0.12, ease: 'linear' }}
                          className="flex flex-col gap-8 items-center blur-[2px] opacity-70"
                        >
                          <span className="text-red-500 font-serif text-5xl">♦</span>
                          <span className="text-black font-serif text-5xl">♠</span>
                          <span className="text-amber-500 font-art-deco text-5xl">7</span>
                          <span className="text-red-500 font-serif text-5xl">♦</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ y: -30, scale: 0.8 }}
                          animate={{ y: 0, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                        >
                          {renderSymbolVisual(sym, 'lg')}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LED Status & Bet Controller Deck */}
            <div className="w-full mt-4 bg-zinc-950 rounded-2xl p-3 sm:p-4 border-2 border-amber-500/70 shadow-inner flex flex-col gap-3">
              {/* Digital LED Displays */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-black/90 rounded-xl p-2 border border-white/10">
                  <span className="text-[9px] sm:text-[10px] text-white/50 block font-bold uppercase tracking-wider">
                    BET COINS
                  </span>
                  <span className="text-sm sm:text-base font-black font-mono text-amber-400">
                    {betAmount.toLocaleString()}
                  </span>
                </div>

                <div className="bg-black/90 rounded-xl p-2 border border-white/10">
                  <span className="text-[9px] sm:text-[10px] text-white/50 block font-bold uppercase tracking-wider">
                    STATUS
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-black uppercase ${
                      isSpinning
                        ? 'text-amber-400 animate-pulse'
                        : result && result.payoutMultiplier === 3
                        ? 'text-yellow-300 animate-bounce'
                        : result && result.payoutMultiplier === 2
                        ? 'text-emerald-400 font-extrabold'
                        : result && result.wonCoins === 0
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {isSpinning
                      ? 'SPINNING...'
                      : result && result.payoutMultiplier === 3
                      ? 'MEGA BONUS!'
                      : result && result.payoutMultiplier === 2
                      ? 'WIN WIN WIN!'
                      : result && result.wonCoins === 0
                      ? 'NICE TRY'
                      : 'READY'}
                  </span>
                </div>

                <div className="bg-black/90 rounded-xl p-2 border border-white/10">
                  <span className="text-[9px] sm:text-[10px] text-white/50 block font-bold uppercase tracking-wider">
                    LAST WIN
                  </span>
                  <span className="text-sm sm:text-base font-black font-mono text-yellow-300">
                    {result ? result.wonCoins.toLocaleString() : '0'}
                  </span>
                </div>
              </div>

              {/* Bet Presets Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
                {BET_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    id={`btn-slot-bet-${preset}`}
                    type="button"
                    disabled={isSpinning}
                    onClick={() => {
                      soundEffects.playChipSound();
                      setBetAmount(preset);
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border ${
                      betAmount === preset
                        ? 'bg-amber-500 text-slate-950 border-yellow-200 shadow-[0_0_12px_rgba(245,158,11,0.5)] scale-102'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-white/70 border-white/10'
                    } ${isSpinning ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {preset >= 1000 ? `${preset / 1000}k` : preset}
                  </button>
                ))}

                {/* MAX BET Button */}
                <button
                  id="btn-slot-bet-max"
                  type="button"
                  disabled={isSpinning || currentCoins < 1000}
                  onClick={() => {
                    soundEffects.playChipSound();
                    setBetAmount(Math.max(1000, currentCoins));
                  }}
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 shadow-md cursor-pointer whitespace-nowrap ${
                    isSpinning ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  MAX
                </button>
              </div>

              {/* Slider for precision coin adjustment */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-white/60 uppercase">1,000</span>
                <input
                  id="slot-bet-slider"
                  type="range"
                  min="1000"
                  max={Math.max(1000, currentCoins)}
                  step="500"
                  value={betAmount}
                  disabled={isSpinning}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  className="w-full accent-amber-400 h-2 bg-zinc-800 rounded-lg cursor-pointer disabled:opacity-50"
                />
                <span className="text-[10px] font-bold text-white/60 uppercase">MAX</span>
              </div>
            </div>
          </div>

          {/* 3D MECHANICAL LEVER ON THE RIGHT SIDE */}
          <div className="relative -ml-2 sm:-ml-3 flex flex-col items-center justify-center z-10">
            {/* Lever Base Mounting Bracket */}
            <div className="w-6 sm:w-8 h-20 sm:h-24 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-800 rounded-r-2xl border-y-2 border-r-2 border-amber-300 shadow-[0_10px_20px_rgba(0,0,0,0.6)] flex items-center justify-center relative">
              {/* Lever Pivot Joint */}
              <div className="w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-slate-950 border border-amber-300 shadow-inner" />

              {/* Lever Shaft & Red Chrome Knob */}
              <motion.div
                animate={
                  isLeverPulled
                    ? { rotateX: 65, y: 45, scaleY: 0.7 }
                    : { rotateX: 0, y: 0, scaleY: 1 }
                }
                transition={{ type: 'spring', stiffness: 350, damping: 15 }}
                onClick={!isSpinning ? handleSpin : undefined}
                className={`absolute -top-16 sm:-top-20 left-2 sm:left-3 origin-bottom group select-none ${
                  isSpinning || currentCoins < betAmount
                    ? 'cursor-not-allowed pointer-events-none opacity-80'
                    : 'cursor-pointer'
                }`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Gold Metal Shaft */}
                <div className="w-3 sm:w-4 h-20 sm:h-24 bg-gradient-to-r from-amber-200 via-amber-100 to-amber-400 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.4)] mx-auto border border-amber-300/60" />

                {/* 3D Ruby Red Ball / Knob */}
                <div
                  className="absolute -top-4 -left-2.5 sm:-left-3 w-8 sm:w-10 h-8 sm:h-10 rounded-full
                  bg-gradient-to-br from-red-400 via-red-600 to-red-950
                  border-2 border-red-300 shadow-[0_10px_25px_rgba(239,68,68,0.7),inset_0_2px_4px_rgba(255,255,255,0.7)]
                  group-hover:scale-110 active:scale-95 transition-transform"
                />
              </motion.div>
            </div>

            {/* "PULL" BUTTON BELOW THE LEVER */}
            <div className="mt-4 flex flex-col items-center">
              <button
                id="btn-slot-pull"
                type="button"
                disabled={isSpinning || currentCoins < betAmount}
                onClick={handleSpin}
                className={`group relative px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all duration-200 border-2 flex flex-col items-center gap-1 shadow-2xl cursor-pointer ${
                  isSpinning || currentCoins < betAmount
                    ? 'bg-zinc-800 text-white/30 border-white/10 cursor-not-allowed'
                    : 'bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:to-yellow-400 text-slate-950 border-yellow-200 shadow-[0_0_25px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95'
                }`}
              >
                <Zap className="w-4 h-4 fill-current group-hover:animate-bounce" />
                <span>PULL</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* RESULT POPUP MODAL */}
      <AnimatePresence>
        {showResultModal && result && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className={`w-full max-w-md rounded-3xl p-6 sm:p-8 text-center text-white relative shadow-2xl overflow-hidden border-2 ${
                result.title === 'MEGA EXTRA BONUS'
                  ? 'bg-[#0f0902] border-yellow-400 shadow-[0_0_90px_rgba(245,158,11,0.5)]'
                  : result.title === 'WIN WIN WIN'
                  ? 'bg-[#030f08] border-emerald-400 shadow-[0_0_80px_rgba(16,185,129,0.4)]'
                  : 'bg-[#0f0707] border-white/20 shadow-[0_0_60px_rgba(0,0,0,0.8)]'
              }`}
            >
              {/* Result Icon */}
              <div
                className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center border ${
                  result.title === 'MEGA EXTRA BONUS'
                    ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-[0_0_30px_rgba(245,158,11,0.4)]'
                    : result.title === 'WIN WIN WIN'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                    : 'bg-zinc-800 border-white/20 text-white/60'
                }`}
              >
                {result.title === 'MEGA EXTRA BONUS' ? (
                  <Trophy className="w-9 h-9 text-amber-400 animate-bounce" />
                ) : result.title === 'WIN WIN WIN' ? (
                  <Sparkles className="w-9 h-9 text-emerald-400 animate-pulse" />
                ) : (
                  <RotateCcw className="w-8 h-8 text-white/50" />
                )}
              </div>

              {/* Title exact to prompt specifications */}
              <h2
                className={`text-2xl sm:text-3xl font-black font-art-deco tracking-widest uppercase mb-2 ${
                  result.title === 'MEGA EXTRA BONUS'
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-300 drop-shadow-[0_2px_15px_rgba(245,158,11,0.8)]'
                    : result.title === 'WIN WIN WIN'
                    ? 'text-emerald-400 drop-shadow-[0_2px_15px_rgba(16,185,129,0.8)]'
                    : 'text-white/80'
                }`}
              >
                {result.title}
              </h2>

              {/* Reels Display in Result */}
              <div className="flex items-center justify-center gap-3 my-4 bg-black/60 rounded-2xl p-3 border border-white/10">
                {result.reels.map((sym, i) => (
                  <div
                    key={i}
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-300 shadow-inner"
                  >
                    {renderSymbolVisual(sym, 'md')}
                  </div>
                ))}
              </div>

              {/* Coins Won Summary */}
              <div className="bg-black/40 rounded-2xl p-3 mb-6 border border-white/10">
                <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                  <span>Coins Inserted:</span>
                  <span className="font-mono text-white font-bold">{result.betCoins.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                  <span>Payout Multiplier:</span>
                  <span className="font-mono text-amber-300 font-bold">
                    {result.payoutMultiplier > 0 ? `${result.payoutMultiplier}X` : '0X'}
                  </span>
                </div>
                <div className="border-t border-white/10 pt-1.5 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-white/80">Total Won:</span>
                  <span
                    className={`text-lg font-black font-mono flex items-center gap-1 ${
                      result.wonCoins > 0 ? 'text-amber-400' : 'text-white/40'
                    }`}
                  >
                    <Coins className="w-4 h-4 text-amber-400" />
                    {result.wonCoins.toLocaleString()} Coins
                  </span>
                </div>
              </div>

              {/* Bottom UI Action Buttons */}
              <div className="flex flex-col gap-2.5">
                {/* Spin Again (does NOT auto spin, closes modal so player can pull when ready) */}
                <button
                  id="btn-result-spin-again"
                  type="button"
                  onClick={() => {
                    soundEffects.playCardSelect();
                    setShowResultModal(false);
                  }}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:scale-[1.02] active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>SPIN AGAIN</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  {/* Back to Main Menu */}
                  <button
                    id="btn-result-main-menu"
                    type="button"
                    onClick={() => {
                      soundEffects.playCardSelect();
                      setShowResultModal(false);
                      onGoToMainMenu();
                    }}
                    className="py-2.5 px-3 rounded-xl border border-white/20 hover:bg-white/10 text-white/80 hover:text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Menu className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Main Menu</span>
                  </button>

                  {/* Back to Homepage */}
                  <button
                    id="btn-result-homepage"
                    type="button"
                    onClick={() => {
                      soundEffects.playCardSelect();
                      setShowResultModal(false);
                      onGoToHomepage();
                    }}
                    className="py-2.5 px-3 rounded-xl border border-white/20 hover:bg-white/10 text-white/80 hover:text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Home className="w-3.5 h-3.5 text-amber-400" />
                    <span>Homepage</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Paytable Modal */}
      <AnimatePresence>
        {showPaytable && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-950 border-2 border-amber-500/60 rounded-3xl p-6 w-full max-w-md text-white shadow-2xl"
            >
              <h3 className="text-xl font-black font-art-deco uppercase tracking-widest text-amber-400 text-center mb-4">
                SLOT MACHINE RULES & PAYTABLE
              </h3>

              <div className="space-y-3 text-xs">
                <div className="bg-black/60 p-3 rounded-xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-300 block">3 Identical Symbols (All Same)</span>
                    <span className="text-white/60">3x Diamonds, 3x Spades, or 3x Lucky 7</span>
                  </div>
                  <span className="text-yellow-400 font-black text-sm font-mono">3X COINS</span>
                </div>

                <div className="bg-black/60 p-3 rounded-xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-300 block">Any 2 Matching Symbols</span>
                    <span className="text-white/60">Any Pair (e.g. 2 Diamonds, 2 Sevens, 2 Spades)</span>
                  </div>
                  <span className="text-emerald-400 font-black text-sm font-mono">+100% EXTRA (2X)</span>
                </div>

                <div className="bg-black/60 p-3 rounded-xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-rose-300 block">No Matching Symbols</span>
                    <span className="text-white/60">All 3 reels show different symbols</span>
                  </div>
                  <span className="text-white/50 font-bold text-sm font-mono">0 COINS</span>
                </div>
              </div>

              <button
                id="btn-close-paytable"
                type="button"
                onClick={() => setShowPaytable(false)}
                className="mt-5 w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase text-xs rounded-xl tracking-wider cursor-pointer"
              >
                Close Paytable
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
