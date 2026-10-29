import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
import { PayoutDetail } from '../types';
import { soundEffects } from '../utils/soundEffects';
import { RefreshCw, Home, Menu, Coins, Sparkles } from 'lucide-react';

interface GameOverModalProps {
  winnerName: string;
  winnerAvatar: string;
  isHumanWinner: boolean;
  betAmount: number;
  payoutDetails: PayoutDetail[];
  winType?: 'standard' | 'murni' | 'bomb' | 'straight-flush-autowin';
  onPlayAgain: () => void;
  onGoToMainMenu: () => void;
  onGoToHomepage: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winnerName,
  winnerAvatar,
  isHumanWinner,
  betAmount,
  payoutDetails,
  winType = 'standard',
  onPlayAgain,
  onGoToMainMenu,
  onGoToHomepage,
}) => {
  useEffect(() => {
    if (isHumanWinner) {
      soundEffects.playVictory();
      // Fire confetti celebration
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Fallback silently if confetti fails
      }
    } else {
      soundEffects.playChipSound();
    }
  }, [isHumanWinner]);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="bg-[#0a0a0a]/95 border-2 border-emerald-500 w-full max-w-lg rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.95),0_0_50px_rgba(16,185,129,0.3)] overflow-hidden text-white flex flex-col my-auto"
      >
        {/* Header Header Banner */}
        <div
          className={`p-6 text-center relative overflow-hidden border-b ${
            isHumanWinner
              ? 'bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-900 border-emerald-500/30'
              : 'bg-zinc-900/90 border-rose-500/30'
          }`}
        >
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 text-xs font-bold uppercase tracking-[0.2em] mb-3 border border-emerald-500/20 text-emerald-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {winType === 'straight-flush-autowin'
                  ? '💥 5-STRAIGHT AUTO WIN (STRAIGHT FLUSH)'
                  : winType === 'murni'
                  ? 'MURNI (PURE HAND) VICTORY'
                  : winType === 'bomb'
                  ? 'BOMB STRIKE VICTORY'
                  : 'MATCH RESULT'}
              </span>
            </div>

            <div className="text-5xl my-2">{winnerAvatar}</div>
            {isHumanWinner ? (
              <>
                <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter uppercase text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.6)]">
                  {winType === 'straight-flush-autowin'
                    ? 'AUTO WIN!'
                    : winType === 'murni'
                    ? 'MURNI!'
                    : winType === 'bomb'
                    ? 'BOMB WIN!'
                    : 'VICTORY!'}
                </h1>
                <p className="text-xs sm:text-sm font-medium mt-1 text-white/70">
                  {winType === 'straight-flush-autowin'
                    ? '💥 Automatic victory achieved by throwing 5 Straight Cards (Straight Flush Bomb)!'
                    : winType === 'murni'
                    ? 'Pure hand victory! Dealt hand contained NO J, Q, or K cards!'
                    : winType === 'bomb'
                    ? 'Super Bomb victory! Successfully bombed the table!'
                    : 'Congratulations! You cleared all cards first!'}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter uppercase text-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.5)]">
                  {winType === 'straight-flush-autowin'
                    ? 'AUTO WIN!'
                    : winType === 'murni'
                    ? 'MURNI!'
                    : winType === 'bomb'
                    ? 'BOMBED!'
                    : 'NICE TRY'}
                </h1>
                <p className="text-sm sm:text-base font-extrabold mt-1.5 text-amber-400 uppercase tracking-wider">
                  {winType === 'straight-flush-autowin'
                    ? `💥 ${winnerName} WON INSTANTLY WITH 5 STRAIGHT CARDS (STRAIGHT FLUSH)!`
                    : winType === 'murni'
                    ? `👑 ${winnerName} WON WITH MURNI (NO J, Q, K)!`
                    : winType === 'bomb'
                    ? `💣 ${winnerName} CLAIMED VICTORY WITH BOMB CARD!`
                    : `🤖 ${winnerName} WINS THE MATCH!`}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Payout Table */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-white/40 uppercase tracking-widest px-1">
            <span>Player Breakdown</span>
            <span>Bet Rate: {betAmount.toLocaleString()} / Card</span>
          </div>

          <div className="bg-zinc-900/90 rounded-2xl border border-white/10 divide-y divide-white/10 overflow-hidden max-h-48 overflow-y-auto">
            {payoutDetails.map((detail) => (
              <div
                key={detail.playerId}
                className={`p-3.5 flex items-center justify-between ${
                  detail.isWinner ? 'bg-emerald-950/40 border-l-4 border-l-emerald-500' : ''
                }`}
              >
                {/* Player info */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="text-2xl">{detail.isHuman ? '👑' : '🤖'}</span>
                    {detail.isWinner && (
                      <span className="absolute -top-1 -right-2 bg-emerald-500 text-black text-[9px] font-black px-1 rounded-full uppercase">
                        WIN
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-1.5">
                      {detail.playerName}
                      {detail.isHuman && <span className="text-[10px] bg-zinc-800 text-white/80 px-1.5 py-0.5 rounded">YOU</span>}
                    </div>
                    <span className="text-xs text-white/40">
                      {detail.isWinner ? 'Cleared All Cards' : `${detail.cardsLeft} cards remaining`}
                    </span>
                  </div>
                </div>

                {/* Coins Net */}
                <div className="text-right">
                  <div
                    className={`font-mono text-base font-bold flex items-center justify-end gap-1 ${
                      detail.netCoins > 0
                        ? 'text-emerald-400'
                        : detail.netCoins < 0
                        ? 'text-rose-400'
                        : 'text-white/40'
                    }`}
                  >
                    <Coins className="w-4 h-4" />
                    {detail.netCoins > 0 ? `+${detail.netCoins.toLocaleString()}` : detail.netCoins.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-white/40 font-mono">
                    {detail.isWinner ? 'Collected' : `-${detail.cardsLeft} × ${betAmount.toLocaleString()}`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              id="btn-play-again"
              type="button"
              onClick={() => {
                soundEffects.playChipSound();
                onPlayAgain();
              }}
              className="py-3.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 border border-emerald-400/30 text-white font-bold uppercase tracking-wider rounded-full transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] text-xs cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Play Again
            </button>

            <button
              id="btn-main-menu"
              type="button"
              onClick={() => {
                soundEffects.playCardSelect();
                onGoToMainMenu();
              }}
              className="py-3.5 px-3 bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white font-bold uppercase tracking-wider rounded-full transition flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <Menu className="w-4 h-4 text-emerald-400" />
              Main Menu
            </button>

            <button
              id="btn-homepage"
              type="button"
              onClick={() => {
                soundEffects.playPass();
                onGoToHomepage();
              }}
              className="py-3.5 px-3 bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white font-bold uppercase tracking-wider rounded-full transition flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <Home className="w-4 h-4 text-amber-400" />
              Homepage
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
