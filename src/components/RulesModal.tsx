import React, { useState } from 'react';
import { X, ShieldCheck, Trophy, Layers, DollarSign, Bomb, Sparkles, RefreshCw, Flame } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'global' | 'indonesian' | 'blackjack' | 'holdem' | 'special'>('global');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0a0a0a] border-2 border-emerald-500 w-full max-w-2xl rounded-3xl shadow-[0_0_80px_rgba(16,185,129,0.4)] overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-900 border-b border-emerald-500/30 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
              Casino Card Games Rule Guide
            </h2>
          </div>
          <button
            id="btn-close-rules"
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 px-4 pt-3 bg-zinc-950 border-b border-white/10 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              soundEffects.playCardSelect();
              setActiveTab('global');
            }}
            className={`pb-2.5 px-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'global'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            🌐 Big 2
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playCardSelect();
              setActiveTab('indonesian');
            }}
            className={`pb-2.5 px-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'indonesian'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            🇮🇩 Indonesian Poker
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playCardSelect();
              setActiveTab('blackjack');
            }}
            className={`pb-2.5 px-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'blackjack'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            🃏 Blackjack
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playCardSelect();
              setActiveTab('holdem');
            }}
            className={`pb-2.5 px-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'holdem'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            🤠 Hold'em
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playCardSelect();
              setActiveTab('special');
            }}
            className={`pb-2.5 px-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'special'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            🔥 Special
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-sm text-white/80 leading-relaxed">
          {activeTab === 'global' && (
            <>
              {/* Section 1: Objective */}
              <div className="bg-zinc-900/90 p-4 rounded-2xl border border-white/10">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4" /> Global Big 2 Objective & Turn Order
                </h3>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed mb-2">
                  Be the first player to shed all your cards!
                </p>
                <div className="text-xs text-white/80 space-y-1.5 font-sans">
                  <p>
                    • <strong className="text-amber-400">Opening Game:</strong> At the very beginning of the gameplay session, the player holding the <strong className="text-amber-300 font-semibold">3 of Spades (3♠)</strong> starts first and must include 3♠ in their first play.
                  </p>
                  <p>
                    • <strong className="text-emerald-400">Play Again Rematches:</strong> When a match finishes and players play again, the <strong className="text-emerald-300 font-semibold">winner of the previous game</strong> plays first with a Free Lead (can play any valid card or combo)!
                  </p>
                </div>
              </div>

              {/* Card Rankings */}
              <div>
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2">1. Card & Suit Rankings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-zinc-900 p-3.5 rounded-2xl border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">
                      Rank Hierarchy (Lowest → Highest)
                    </span>
                    <p className="font-mono text-blue-400 font-bold text-xs sm:text-sm">
                      3 &lt; 4 &lt; 5 &lt; 6 &lt; 7 &lt; 8 &lt; 9 &lt; 10 &lt; J &lt; Q &lt; K &lt; A &lt;{' '}
                      <span className="text-rose-400 text-base">2</span>
                    </p>
                    <p className="text-[11px] text-white/50 mt-1">3 is lowest, 2 is highest.</p>
                  </div>

                  <div className="bg-zinc-900 p-3.5 rounded-2xl border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">
                      Suit Hierarchy (Lowest → Highest)
                    </span>
                    <p className="font-mono text-emerald-400 font-bold text-xs sm:text-sm">
                      ♠ Spades &lt; ♣ Clubs &lt; ♦ Diamonds &lt; <span className="text-red-500">♥ Hearts</span>
                    </p>
                    <p className="text-[11px] text-white/50 mt-1">3♠ is lowest; 2♥ is highest.</p>
                  </div>
                </div>
              </div>

              {/* 5-Card Hands */}
              <div>
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" /> 2. 5-Card Hands Hierarchy (Global)
                </h3>
                <div className="p-3.5 bg-zinc-900/90 rounded-2xl border border-white/10 text-xs space-y-1.5 font-mono">
                  <p>1. <strong>Straight</strong>: 5 consecutive ranks</p>
                  <p>2. <strong>Flush</strong>: 5 cards of same suit (beats Straight)</p>
                  <p>3. <strong>Full House</strong>: Triple + Pair (beats Flush)</p>
                  <p>4. <strong>Four of a Kind</strong>: 4 cards + kicker (beats Full House)</p>
                  <p>5. <strong>Straight Flush</strong>: 5 consecutive cards of same suit (beats all)</p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'indonesian' && (
            <>
              {/* Indonesian Poker Specific Rules */}
              <div className="bg-rose-950/40 p-4 rounded-2xl border border-rose-500/40">
                <h3 className="text-xs font-bold text-rose-300 uppercase tracking-widest flex items-center gap-2 mb-1.5">
                  <Bomb className="w-4 h-4 text-amber-400" /> 🇮🇩 Indonesian Poker (Capsa Banting) Special Rules
                </h3>
                <p className="text-xs text-white/80">
                  Indonesian Poker adds distinct high-stakes rules: "Buang kartu 3" opening ritual, suited straight requirements (3-straight, 4-straight, Straight House), 5-straight Straight Flush auto win, and Murni pure hand victories!
                </p>
              </div>

              {/* Rule 1: Buang Kartu 3 */}
              <div className="bg-zinc-900/90 p-4 rounded-2xl border border-amber-400/50">
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-400" /> 1. "Buang Kartu 3" Manual Opening Ritual (First Game Only)
                </h4>
                <p className="text-xs text-white/80 leading-relaxed mb-1.5">
                  At the very beginning of the gameplay session, <strong className="text-amber-300">players manually throw all their "3" cards to the table</strong> with the caption <strong className="text-emerald-400">"Buang kartu 3"</strong>!
                </p>
                <div className="text-xs text-white/80 space-y-1.5 font-sans">
                  <p>
                    • <strong className="text-amber-300">3 of Spades (3♠) Starter:</strong> Whoever throws the <strong className="text-amber-300 font-semibold">3 of Spades (3♠)</strong> onto the table <strong className="text-emerald-400 font-semibold">starts the game</strong> with a <strong className="text-white">Free Lead</strong> (can play any valid card or combo)!
                  </p>
                  <p>
                    • <strong className="text-emerald-400">Play Again (Rematches):</strong> This 3-card throw occurs <strong className="text-amber-300">ONLY in the very beginning of the game</strong>. When a match is won and players play again, <strong className="text-rose-400 font-bold">NO NEED TO BUANG KARTU 3!</strong> The winner of the previous game plays first directly!
                  </p>
                </div>
              </div>

              {/* Rule 2: Suited Straights Only & Allowed Combinations */}
              <div className="bg-zinc-900/90 p-4 rounded-2xl border border-emerald-400/50">
                <h4 className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Layers className="w-4 h-4 text-emerald-400" /> 2. Suited Straights Only & Allowed Straight Types
                </h4>
                <p className="text-xs text-white/80 leading-relaxed mb-2">
                  <strong className="text-rose-400">Straight cards MUST be in the same symbols (suit)</strong> and <strong className="text-white">CANNOT have different symbols</strong>. Mixed-suit straights are not allowed.
                </p>
                <div className="text-xs text-white/80 space-y-1.5 font-sans">
                  <p>
                    • <strong className="text-amber-300">3 Straight Cards:</strong> You can throw exactly 3 straight suited cards (e.g. 7♠ 8♠ 9♠). Beat with a higher 3-straight.
                  </p>
                  <p>
                    • <strong className="text-amber-300">4 Straight Cards:</strong> You can throw exactly 4 straight suited cards (e.g. 5♥ 6♥ 7♥ 8♥). Beat with a higher 4-straight.
                  </p>
                  <p>
                    • <strong className="text-amber-300">Straight House (5 Cards):</strong> 3 straight suited cards + a pair of matching cards (e.g. 6♠ 7♠ 8♠ + Q♦ Q♥), structured just like a Full House!
                  </p>
                </div>
              </div>

              {/* Rule 3: 5 Straight Cards (Straight Flush) Bomb & AUTO WIN */}
              <div className="bg-gradient-to-r from-amber-950/50 to-zinc-900 p-4 rounded-2xl border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Flame className="w-4 h-4 text-amber-400 animate-bounce" /> 3. 5 Straight Cards (Straight Flush): Bomb "2" & AUTO WIN!
                </h4>
                <p className="text-xs text-white/90 leading-relaxed">
                  If a player throws <strong className="text-amber-300">5 straight cards of the same symbol (Straight Flush)</strong>:
                </p>
                <ul className="list-disc list-inside text-xs text-white/80 mt-1 space-y-1">
                  <li>It can <strong className="text-rose-400 font-semibold">BOMB any "2" card</strong> played on the table!</li>
                  <li>Playing 5 straight cards triggers an immediate <strong className="text-emerald-400 font-bold uppercase">AUTO WIN</strong> for that player!</li>
                </ul>
              </div>

              {/* Rule 4: MURNI */}
              <div className="bg-zinc-900/90 p-4 rounded-2xl border border-amber-500/40">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4" /> 4. "MURNI" Pure Hand Instant Win
                </h4>
                <p className="text-xs text-white/80">
                  If a player is dealt a hand containing <strong className="text-amber-300">NO "J", NO "Q", and NO "K"</strong> cards, the player instantly wins the match! All opponents pay full hand coin penalties.
                </p>
              </div>

              {/* Rule 5: Strict Higher Number Required */}
              <div className="bg-zinc-900/90 p-4 rounded-2xl border border-white/10">
                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">
                  5. Strictly Higher Number Required (No Same Number With Higher Suit)
                </h4>
                <p className="text-xs text-white/80 leading-relaxed">
                  After a card is thrown onto the table (e.g. "4"), players must throw a card with a <strong className="text-emerald-400 font-semibold">strictly higher number</strong> (5, 6, ..., 2). You <strong className="text-rose-400">CANNOT</strong> throw the same number with a higher suit symbol.
                </p>
              </div>
            </>
          )}

          {activeTab === 'blackjack' && (
            <>
              <div className="bg-zinc-900/90 p-4 rounded-2xl border border-emerald-500/40">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="w-4 h-4" /> Las Vegas Rules (1-on-1 vs Dealer)
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  The goal of Blackjack is to beat the dealer by getting a count as close to 21 as possible without going over 21.
                </p>
                <div className="mt-2 space-y-1.5 text-xs text-white/80">
                  <p>• <strong className="text-amber-400">Card Values:</strong> 2 through 10 are face value. J, Q, K are worth 10. Ace is worth 11 or 1 (soft hand).</p>
                  <p>• <strong className="text-amber-400">Natural Blackjack (21):</strong> An Ace + any 10-point card on the initial deal pays <strong className="text-emerald-400">3 to 2</strong> immediately!</p>
                  <p>• <strong className="text-emerald-300">Dealer Rules:</strong> Dealer must hit on 16 or lower, and <strong className="text-amber-300">stand on all 17s</strong>.</p>
                </div>
              </div>

              <div className="bg-zinc-900/90 p-4 rounded-2xl border border-amber-500/40">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-1.5">
                  Player Actions & Special Bets
                </h4>
                <div className="space-y-1.5 text-xs text-white/80">
                  <p>• <strong className="text-white">HIT:</strong> Take another card. If total exceeds 21, you bust and forfeit the bet.</p>
                  <p>• <strong className="text-white">STAND:</strong> Keep current total and end your turn on this spot.</p>
                  <p>• <strong className="text-amber-300">DOUBLE DOWN:</strong> Double your initial bet, draw exactly one additional card, and stand.</p>
                  <p>• <strong className="text-amber-400">INSURANCE (Pays 2:1):</strong> When the dealer shows an Ace, you can place an Insurance bet for half your initial wager. If the dealer has Blackjack, insurance pays <strong className="text-emerald-400">2 to 1</strong>!</p>
                  <p>• <strong className="text-cyan-300">Multi-Spot Table:</strong> The semicircular felt table features 3 circular betting spots. You can bet on 1, 2, or all 3 spots at the same time!</p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'holdem' && (
            <>
              <div className="bg-zinc-900/90 p-4 rounded-2xl border border-amber-500/40">
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="w-4 h-4" /> Texas Hold'em (No-Limit International Rules)
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  Each player is dealt 2 private hole cards. Five community cards are dealt face-up in the middle. The best 5-card poker hand out of 7 cards wins the pot!
                </p>
                <div className="mt-2 space-y-1.5 text-xs text-white/80">
                  <p>• <strong className="text-amber-300">Pre-Flop:</strong> Blinds (Small Blind & Big Blind) posted; players dealt 2 hole cards.</p>
                  <p>• <strong className="text-amber-300">The Flop:</strong> First 3 community cards dealt face-up. Betting round 2.</p>
                  <p>• <strong className="text-amber-300">The Turn:</strong> 4th community card dealt face-up. Betting round 3.</p>
                  <p>• <strong className="text-amber-300">The River:</strong> 5th & final community card dealt. Final betting round.</p>
                  <p>• <strong className="text-emerald-400">Showdown:</strong> Remaining players reveal hands. Best 5-card combination wins!</p>
                </div>
              </div>

              <div className="bg-zinc-900/90 p-4 rounded-2xl border border-white/10">
                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1.5">
                  Actions & Customization
                </h4>
                <div className="space-y-1.5 text-xs text-white/80">
                  <p>• <strong className="text-white">CHECK:</strong> Pass the action without betting if no one has raised.</p>
                  <p>• <strong className="text-emerald-400">CALL:</strong> Match the current highest bet to stay in the hand.</p>
                  <p>• <strong className="text-amber-400">RAISE:</strong> Increase the bet size with the slider or presets (Min, 1/2 Pot, Pot, All-in).</p>
                  <p>• <strong className="text-rose-400">FOLD:</strong> Discard your hand and surrender any chips invested in the pot.</p>
                  <p>• <strong className="text-cyan-300">Customizable Bots:</strong> Adjust the number of bot opponents from 1 (Heads-Up) to 7 (8-max table) in the top configuration menu!</p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'special' && (
            <>
              {/* 4x 2s Reshuffle Rule */}
              <div className="bg-gradient-to-r from-red-950/60 to-zinc-900 p-4 rounded-2xl border border-red-500/40">
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2 mb-1.5">
                  <RefreshCw className="w-4 h-4 text-red-400 animate-spin" /> Four "2"s Dragon Quad Reshuffle
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  If any player is dealt all four "2" cards (2♠, 2♣, 2♦, 2♥), an emergency reshuffle is triggered! All player cards are revealed face-up on the table, and the deck is automatically reshuffled and redealt with animated card throw trajectories.
                </p>
              </div>

              {/* Auto Select Feature */}
              <div className="bg-zinc-900/90 p-4 rounded-2xl border border-emerald-500/40">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Right Dock Auto-Select
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  Use the dock on the right of the poker table to instantly select valid combinations in your hand with one tap: <strong>Pair</strong>, <strong>3 of a Kind</strong>, <strong>Straight</strong>, <strong>Flush</strong>, <strong>Full House</strong>, <strong>4 of a Kind</strong>, <strong>Straight Flush</strong>, and <strong>Royal Flush</strong>!
                </p>
              </div>

              {/* Coin Formula */}
              <div className="bg-black/60 p-4 rounded-2xl border border-white/10">
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-400" /> Payout Formula
                </h3>
                <p className="text-xs text-white/70">
                  When a player wins, losers pay <code className="text-amber-400 font-bold">(Cards Left in Hand) × (Bet Rate)</code>.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-zinc-950 p-4 text-center border-t border-white/10">
          <button
            id="btn-rules-got-it"
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold uppercase tracking-[0.2em] rounded-full transition shadow-[0_0_20px_rgba(16,185,129,0.3)] text-xs border border-emerald-400/30 cursor-pointer"
          >
            Got It, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};

