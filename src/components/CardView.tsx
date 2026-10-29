import React from 'react';
import { motion } from 'motion/react';
import { Card } from '../types';
import { RANK_LABEL, SUIT_SYMBOL } from '../utils/pokerRules';

interface CardViewProps {
  card: Card;
  isSelected?: boolean;
  isFaceDown?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  badge?: string;
  className?: string;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  isSelected = false,
  isFaceDown = false,
  onClick,
  size = 'md',
  disabled = false,
  badge,
  className = '',
}) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const textColor = isRed ? 'text-red-600' : 'text-slate-950';
  const symbol = SUIT_SYMBOL[card.suit];
  const rankLabel = RANK_LABEL[card.rank];

  const sizeClasses = {
    sm: 'w-10 h-14 text-xs rounded-md p-1 border',
    md: 'w-14 h-20 sm:w-16 sm:h-24 text-sm sm:text-base rounded-lg p-1.5 border-2',
    lg: 'w-20 h-28 sm:w-24 sm:h-36 text-lg sm:text-xl rounded-xl p-2 sm:p-3 border-2',
  }[size];

  if (isFaceDown) {
    return (
      <div
        id={`card-facedown-${card.id}`}
        style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
        className={`relative ${sizeClasses} bg-gradient-to-br from-indigo-900 via-blue-950 to-slate-900 border-amber-500/40 shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.2)] flex items-center justify-center select-none overflow-hidden transition-all duration-200 ${className}`}
      >
        {/* Diamond mesh pattern */}
        <div className="absolute inset-1 rounded border border-amber-400/30 bg-[radial-gradient(#eab308_1px,transparent_1px)] [background-size:6px_6px] opacity-30" />
        <div className="w-5 h-7 sm:w-6 sm:h-8 rounded border border-amber-400/50 flex items-center justify-center bg-indigo-950/80 shadow-inner">
          <span className="text-amber-400 text-xs font-black font-casino-serif font-serif">♠</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ perspective: '800px', transformStyle: 'preserve-3d' }} className="inline-block overflow-visible">
      <motion.button
        id={`card-${card.id}`}
        type="button"
        onClick={onClick}
        disabled={disabled}
        whileHover={
          !disabled
            ? {
                y: -14,
                scale: 1.08,
                rotateX: -6,
                rotateY: 6,
                z: 30,
                boxShadow: '0 20px 35px rgba(0,0,0,0.5), 0 5px 15px rgba(16,185,129,0.3)',
              }
            : {}
        }
        whileTap={!disabled ? { scale: 0.95, z: 0 } : {}}
        animate={
          isSelected
            ? {
                y: -28,
                scale: 1.06,
                rotateX: -10,
                rotateY: -2,
                z: 40,
                boxShadow: '0 25px 40px rgba(16,185,129,0.4), 0 0 20px rgba(16,185,129,0.6)',
              }
            : { y: 0, scale: 1, rotateX: 0, rotateY: 0, z: 0 }
        }
        transition={{ type: 'spring', stiffness: 900, damping: 30, mass: 0.3 }}
        style={{ transformStyle: 'preserve-3d' }}
        className={`
          relative ${sizeClasses} select-none cursor-pointer text-left flex flex-col justify-between font-black rounded-lg overflow-hidden
          bg-gradient-to-b from-white via-slate-50 to-gray-200
          border-gray-300 shadow-[0_10px_20px_rgba(0,0,0,0.35),0_2px_4px_rgba(0,0,0,0.1)]
          ${isSelected ? 'ring-4 ring-emerald-500 border-emerald-400 z-30' : 'hover:border-emerald-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        {/* Subtle Glossy Card Surface Highlight */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none" />

        {/* Top Left Rank & Suit */}
        <div className={`leading-none flex flex-col items-center w-fit ${textColor} z-10 font-black`}>
          <span className="tracking-tight font-casino-serif font-serif font-black text-[1.25em] leading-none select-none">
            {rankLabel}
          </span>
          <span className="text-[0.9em] font-black leading-none mt-0.5 select-none font-serif">
            {symbol}
          </span>
        </div>

        {/* Center Big Suit Icon */}
        <div className={`absolute inset-0 flex items-center justify-center ${textColor} opacity-90 select-none pointer-events-none z-0`}>
          <span className={`${size === 'lg' ? 'text-4xl sm:text-5xl' : size === 'md' ? 'text-3xl sm:text-4xl' : 'text-2xl'} font-black font-serif`}>
            {symbol}
          </span>
        </div>

        {/* Bottom Right Inverted Rank & Suit */}
        <div className={`leading-none flex flex-col items-center w-fit self-end rotate-180 ${textColor} z-10 font-black`}>
          <span className="tracking-tight font-casino-serif font-serif font-black text-[1.25em] leading-none select-none">
            {rankLabel}
          </span>
          <span className="text-[0.9em] font-black leading-none mt-0.5 select-none font-serif">
            {symbol}
          </span>
        </div>

        {/* Optional Badge */}
        {badge && (
          <span className="absolute -top-2 -right-2 bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-lg border border-amber-200 z-20">
            {badge}
          </span>
        )}
      </motion.button>
    </div>
  );
};
