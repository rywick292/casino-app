import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowLeft, Coins, HelpCircle, RotateCcw, Volume2, VolumeX, Shield, Play } from 'lucide-react';
import { Card, BlackjackSpot } from '../types';
import { CardView } from './CardView';
import {
  createBlackjackDeck,
  calculateBlackjackScore,
  doesDealerHit,
} from '../utils/blackjackRules';
import { soundEffects } from '../utils/soundEffects';

interface BlackjackTableProps {
  currentCoins: number;
  onUpdateCoins: (newCoins: number) => void;
  onGoToMainMenu: () => void;
  onOpenRules: () => void;
}

const CHIP_DENOMINATIONS = [50, 100, 500, 1000, 5000];

export const BlackjackTable: React.FC<BlackjackTableProps> = ({
  currentCoins,
  onUpdateCoins,
  onGoToMainMenu,
  onOpenRules,
}) => {
  // Sound state
  const [soundOn, setSoundOn] = useState<boolean>(soundEffects.isEnabled());

  // Chip selection
  const [selectedChip, setSelectedChip] = useState<number>(500);

  // 3 Circular Betting Spots on the Half-Circle Table
  const [spots, setSpots] = useState<BlackjackSpot[]>([
    {
      id: 0,
      label: 'Spot 1',
      bet: 0,
      cards: [],
      isDoubled: false,
      hasInsurance: false,
      insuranceBet: 0,
      status: 'idle',
      payout: 0,
    },
    {
      id: 1,
      label: 'Spot 2',
      bet: 1000, // Default active center spot
      cards: [],
      isDoubled: false,
      hasInsurance: false,
      insuranceBet: 0,
      status: 'idle',
      payout: 0,
    },
    {
      id: 2,
      label: 'Spot 3',
      bet: 0,
      cards: [],
      isDoubled: false,
      hasInsurance: false,
      insuranceBet: 0,
      status: 'idle',
      payout: 0,
    },
  ]);

  // Dealer State
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [isDealerHoleCardHidden, setIsDealerHoleCardHidden] = useState<boolean>(true);

  // Deck Shoe
  const [shoe, setShoe] = useState<Card[]>([]);

  // Round Stage: 'betting' | 'dealing' | 'insurance' | 'player-turn' | 'dealer-turn' | 'round-over'
  const [stage, setStage] = useState<
    'betting' | 'dealing' | 'insurance' | 'player-turn' | 'dealer-turn' | 'round-over'
  >('betting');

  // Active Spot Index during player turn (0, 1, or 2)
  const [activeSpotIndex, setActiveSpotIndex] = useState<number | null>(null);

  // Message banner
  const [tableNotice, setTableNotice] = useState<string>('Place your bets in the circles & press Deal');

  // Round summary
  const [roundNetWin, setRoundNetWin] = useState<number>(0);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const totalCurrentBet = spots.reduce((sum, s) => sum + s.bet, 0);

  // Toggle sound
  const handleToggleSound = () => {
    const updated = soundEffects.toggleSound();
    setSoundOn(updated);
  };

  // Place bet on a spot
  const handleSpotClick = (spotId: number) => {
    if (stage !== 'betting') return;
    if (currentCoins < selectedChip) {
      soundEffects.playPassSound();
      setTableNotice('Not enough balance for this chip!');
      return;
    }

    soundEffects.playChipSound();
    onUpdateCoins(currentCoins - selectedChip);

    setSpots((prev) =>
      prev.map((spot) =>
        spot.id === spotId ? { ...spot, bet: spot.bet + selectedChip } : spot
      )
    );
    setTableNotice(`Added $${selectedChip.toLocaleString()} to ${spots[spotId].label}`);
  };

  // Clear all bets
  const handleClearBets = () => {
    if (stage !== 'betting') return;
    if (totalCurrentBet === 0) return;

    soundEffects.playChipSound();
    onUpdateCoins(currentCoins + totalCurrentBet);
    setSpots((prev) =>
      prev.map((s) => ({
        ...s,
        bet: 0,
        cards: [],
        status: 'idle',
        payout: 0,
        isDoubled: false,
        hasInsurance: false,
        insuranceBet: 0,
      }))
    );
    setTableNotice('All bets cleared.');
  };

  // Double current bets if player has coins
  const handleDoubleAllBets = () => {
    if (stage !== 'betting') return;
    if (totalCurrentBet === 0) return;
    if (currentCoins < totalCurrentBet) {
      setTableNotice('Not enough balance to double bets!');
      soundEffects.playPassSound();
      return;
    }

    soundEffects.playChipSound();
    onUpdateCoins(currentCoins - totalCurrentBet);
    setSpots((prev) =>
      prev.map((s) => ({
        ...s,
        bet: s.bet * 2,
      }))
    );
    setTableNotice('All bets doubled!');
  };

  // DEAL HAND
  const handleDeal = () => {
    if (stage !== 'betting') return;
    if (totalCurrentBet === 0) {
      setTableNotice('Please place at least one bet in a circle to play!');
      soundEffects.playPassSound();
      return;
    }

    setStage('dealing');
    setTableNotice('Dealing cards...');
    soundEffects.playShuffle();

    // Create fresh shoe
    const newShoe = createBlackjackDeck();
    let shoeIdx = 0;

    const activeSpots = spots.filter((s) => s.bet > 0);

    // Initial deal: 2 cards to each active spot, 2 cards to dealer
    const updatedSpots = spots.map((s) => ({
      ...s,
      cards: s.bet > 0 ? [newShoe[shoeIdx++], newShoe[shoeIdx++]] : [],
      isDoubled: false,
      hasInsurance: false,
      insuranceBet: 0,
      status: (s.bet > 0 ? 'playing' : 'idle') as BlackjackSpot['status'],
      payout: 0,
    }));

    const dealerInitial = [newShoe[shoeIdx++], newShoe[shoeIdx++]];
    const remainingDeck = newShoe.slice(shoeIdx);

    setShoe(remainingDeck);
    setSpots(updatedSpots);
    setDealerCards(dealerInitial);
    setIsDealerHoleCardHidden(true);

    soundEffects.playCardDeal();

    // Check if dealer upcard is an Ace (Dealer index 0 is upcard, index 1 is hole card)
    const dealerUpcard = dealerInitial[0];
    const isDealerUpcardAce = dealerUpcard.rank === 14;

    timeoutRef.current = setTimeout(() => {
      // Check for Natural Blackjacks on player spots
      const spotsWithBJ = updatedSpots.map((s) => {
        if (s.bet > 0) {
          const val = calculateBlackjackScore(s.cards);
          if (val.isBlackjack) {
            return { ...s, status: 'blackjack' as BlackjackSpot['status'] };
          }
        }
        return s;
      });
      setSpots(spotsWithBJ);

      if (isDealerUpcardAce) {
        // Dealer shows Ace: offer insurance!
        soundEffects.playCardSelect();
        setStage('insurance');
        setTableNotice('Dealer shows an Ace! Insurance pays 2:1');
      } else {
        // Check dealer natural 10 upcard (Blackjack peek)
        const dealerScore = calculateBlackjackScore(dealerInitial);
        if (dealerUpcard.rank >= 10 && dealerScore.isBlackjack) {
          // Dealer has natural blackjack! Reveal immediately
          revealDealerAndFinish(spotsWithBJ, dealerInitial, remainingDeck);
        } else {
          // Start player turn on the first active spot
          startPlayerTurns(spotsWithBJ, remainingDeck, dealerInitial);
        }
      }
    }, 1200);
  };

  // Handle Insurance: Accept or Decline
  const handleInsuranceDecision = (accept: boolean) => {
    let currentShoe = shoe;
    let updatedSpots = spots;

    if (accept) {
      // Insurance costs 50% of original bet for each active spot
      let totalInsuranceCost = 0;
      updatedSpots = spots.map((s) => {
        if (s.bet > 0) {
          const ins = Math.floor(s.bet / 2);
          totalInsuranceCost += ins;
          return { ...s, hasInsurance: true, insuranceBet: ins };
        }
        return s;
      });

      if (currentCoins < totalInsuranceCost) {
        setTableNotice('Not enough coins to buy insurance!');
        soundEffects.playPassSound();
        return;
      }

      onUpdateCoins(currentCoins - totalInsuranceCost);
      soundEffects.playChipSound();
      setSpots(updatedSpots);
      setTableNotice(`Insurance purchased for $${totalInsuranceCost.toLocaleString()}`);
    } else {
      setTableNotice('Insurance declined. Playing hand...');
    }

    // Dealer checks hole card for Blackjack
    const dealerVal = calculateBlackjackScore(dealerCards);
    if (dealerVal.isBlackjack) {
      timeoutRef.current = setTimeout(() => {
        revealDealerAndFinish(updatedSpots, dealerCards, currentShoe);
      }, 1000);
    } else {
      timeoutRef.current = setTimeout(() => {
        setTableNotice('Dealer does NOT have Blackjack. Good luck!');
        startPlayerTurns(updatedSpots, currentShoe, dealerCards);
      }, 900);
    }
  };

  // Start player turns
  const startPlayerTurns = (
    currentSpots: BlackjackSpot[],
    currentShoe: Card[],
    currDealerCards: Card[]
  ) => {
    // Find first active spot that is not already a natural blackjack
    const firstPlayableIdx = currentSpots.findIndex(
      (s) => s.bet > 0 && s.status === 'playing'
    );

    if (firstPlayableIdx === -1) {
      // All active spots either blackjack or none active
      dealerPlay(currentSpots, currentShoe, currDealerCards);
    } else {
      setStage('player-turn');
      setActiveSpotIndex(firstPlayableIdx);
      setTableNotice(`Playing ${currentSpots[firstPlayableIdx].label}: Hit, Stand, or Double`);
    }
  };

  // HIT ACTION
  const handleHit = () => {
    if (stage !== 'player-turn' || activeSpotIndex === null) return;
    if (shoe.length === 0) return;

    soundEffects.playCardDeal();
    const nextCard = shoe[0];
    const newShoe = shoe.slice(1);
    setShoe(newShoe);

    const targetSpot = spots[activeSpotIndex];
    const newCards = [...targetSpot.cards, nextCard];
    const scoreVal = calculateBlackjackScore(newCards);

    let nextStatus: BlackjackSpot['status'] = 'playing';
    if (scoreVal.isBust) {
      nextStatus = 'busted';
      soundEffects.playPassSound();
      setTableNotice(`${targetSpot.label} BUSTED with ${scoreVal.score}!`);
    } else if (scoreVal.score === 21) {
      nextStatus = 'stood';
      setTableNotice(`${targetSpot.label} hit 21!`);
    }

    const updatedSpots = spots.map((s, idx) =>
      idx === activeSpotIndex ? { ...s, cards: newCards, status: nextStatus } : s
    );
    setSpots(updatedSpots);

    if (scoreVal.isBust || scoreVal.score === 21) {
      moveToNextSpotOrDealer(updatedSpots, newShoe);
    }
  };

  // STAND ACTION
  const handleStand = () => {
    if (stage !== 'player-turn' || activeSpotIndex === null) return;
    soundEffects.playCardSelect();

    const targetSpot = spots[activeSpotIndex];
    const val = calculateBlackjackScore(targetSpot.cards);
    setTableNotice(`${targetSpot.label} stands on ${val.score}.`);

    const updatedSpots = spots.map((s, idx) =>
      idx === activeSpotIndex ? { ...s, status: 'stood' as BlackjackSpot['status'] } : s
    );
    setSpots(updatedSpots);

    moveToNextSpotOrDealer(updatedSpots, shoe);
  };

  // DOUBLE DOWN ACTION
  const handleDoubleDown = () => {
    if (stage !== 'player-turn' || activeSpotIndex === null) return;
    const targetSpot = spots[activeSpotIndex];

    if (targetSpot.cards.length !== 2) {
      setTableNotice('Double Down is only available on your first 2 cards!');
      return;
    }
    if (currentCoins < targetSpot.bet) {
      setTableNotice('Not enough balance to Double Down!');
      soundEffects.playPassSound();
      return;
    }

    // Deduct double bet
    soundEffects.playChipSound();
    onUpdateCoins(currentCoins - targetSpot.bet);

    const nextCard = shoe[0];
    const newShoe = shoe.slice(1);
    setShoe(newShoe);

    const newCards = [...targetSpot.cards, nextCard];
    const scoreVal = calculateBlackjackScore(newCards);
    const newStatus: BlackjackSpot['status'] = scoreVal.isBust ? 'busted' : 'stood';

    if (scoreVal.isBust) {
      soundEffects.playPassSound();
      setTableNotice(`${targetSpot.label} Doubled & Busted with ${scoreVal.score}!`);
    } else {
      soundEffects.playCardDeal();
      setTableNotice(`${targetSpot.label} Doubled on ${scoreVal.score}!`);
    }

    const updatedSpots = spots.map((s, idx) =>
      idx === activeSpotIndex
        ? {
            ...s,
            bet: s.bet * 2,
            isDoubled: true,
            cards: newCards,
            status: newStatus,
          }
        : s
    );
    setSpots(updatedSpots);

    moveToNextSpotOrDealer(updatedSpots, newShoe);
  };

  // Move to next playable spot, or dealer's turn
  const moveToNextSpotOrDealer = (currSpots: BlackjackSpot[], currShoe: Card[]) => {
    if (activeSpotIndex === null) return;

    // Look for next spot > activeSpotIndex
    let nextIdx = -1;
    for (let i = activeSpotIndex + 1; i < currSpots.length; i++) {
      if (currSpots[i].bet > 0 && currSpots[i].status === 'playing') {
        nextIdx = i;
        break;
      }
    }

    if (nextIdx !== -1) {
      setActiveSpotIndex(nextIdx);
      setTableNotice(`Playing ${currSpots[nextIdx].label}...`);
    } else {
      // All player hands finished -> dealer turn!
      setActiveSpotIndex(null);
      timeoutRef.current = setTimeout(() => {
        dealerPlay(currSpots, currShoe, dealerCards);
      }, 700);
    }
  };

  // Dealer Turn & Drawing (Dealer must stand on 17 and draw to 16)
  const dealerPlay = (
    currSpots: BlackjackSpot[],
    currShoe: Card[],
    currDealerCards: Card[]
  ) => {
    setStage('dealer-turn');
    setIsDealerHoleCardHidden(false); // Reveal hole card!
    soundEffects.playCardDeal();

    // Check if all spots busted; if so, dealer doesn't need to draw extra cards
    const allBusted = currSpots
      .filter((s) => s.bet > 0)
      .every((s) => s.status === 'busted');

    if (allBusted) {
      setTableNotice('All player hands busted. Dealer wins!');
      resolveRound(currSpots, currDealerCards);
      return;
    }

    setTableNotice('Dealer reveals hole card and draws to 16...');

    // Draw cards step-by-step
    let deckCopy = [...currShoe];
    let dCards = [...currDealerCards];

    const drawStep = () => {
      if (doesDealerHit(dCards) && deckCopy.length > 0) {
        soundEffects.playCardDeal();
        dCards.push(deckCopy[0]);
        deckCopy = deckCopy.slice(1);
        setDealerCards([...dCards]);
        setShoe([...deckCopy]);

        const dealerScore = calculateBlackjackScore(dCards);
        if (dealerScore.isBust) {
          setTableNotice(`Dealer BUSTED with ${dealerScore.score}!`);
          timeoutRef.current = setTimeout(() => {
            resolveRound(currSpots, dCards);
          }, 1200);
          return;
        }

        timeoutRef.current = setTimeout(drawStep, 900);
      } else {
        const dealerScore = calculateBlackjackScore(dCards);
        setTableNotice(`Dealer stands on ${dealerScore.score}.`);
        timeoutRef.current = setTimeout(() => {
          resolveRound(currSpots, dCards);
        }, 1200);
      }
    };

    timeoutRef.current = setTimeout(drawStep, 800);
  };

  // Immediate reveal when dealer has natural Blackjack
  const revealDealerAndFinish = (
    currSpots: BlackjackSpot[],
    currDealerCards: Card[],
    currShoe: Card[]
  ) => {
    setIsDealerHoleCardHidden(false);
    soundEffects.playCardDeal();
    setTableNotice('Dealer has Natural Blackjack 21!');
    timeoutRef.current = setTimeout(() => {
      resolveRound(currSpots, currDealerCards);
    }, 1200);
  };

  // Resolve Round & Calculate Payouts
  const resolveRound = (currSpots: BlackjackSpot[], finalDealerCards: Card[]) => {
    const dealerVal = calculateBlackjackScore(finalDealerCards);
    let totalReturn = 0;
    let playerWonAny = false;

    const resolvedSpots = currSpots.map((spot) => {
      if (spot.bet === 0) return spot;

      const playerVal = calculateBlackjackScore(spot.cards);
      let status: BlackjackSpot['status'] = spot.status;
      let spotPayout = 0;

      // Insurance Resolution (Insurance pays 2:1 if dealer has blackjack)
      if (spot.hasInsurance) {
        if (dealerVal.isBlackjack) {
          const insWin = spot.insuranceBet * 3; // 2:1 payout + return insurance bet
          spotPayout += insWin;
        }
      }

      // Hand Outcome
      if (playerVal.isBust) {
        status = 'busted';
        spotPayout += 0;
      } else if (playerVal.isBlackjack) {
        if (dealerVal.isBlackjack) {
          // Push
          status = 'pushed';
          spotPayout += spot.bet; // Bet returned
        } else {
          // Blackjack pays 3:2! (Profit = 1.5 * bet; total return = 2.5 * bet)
          status = 'blackjack';
          spotPayout += Math.floor(spot.bet * 2.5);
          playerWonAny = true;
        }
      } else if (dealerVal.isBlackjack) {
        // Dealer BJ beats non-BJ 21
        status = 'lost';
        spotPayout += 0;
      } else if (dealerVal.isBust) {
        // Dealer bust: player wins 1:1 (+ bet returned = 2x)
        status = 'won';
        spotPayout += spot.bet * 2;
        playerWonAny = true;
      } else if (playerVal.score > dealerVal.score) {
        // Higher score: Win 1:1
        status = 'won';
        spotPayout += spot.bet * 2;
        playerWonAny = true;
      } else if (playerVal.score === dealerVal.score) {
        // Push
        status = 'pushed';
        spotPayout += spot.bet;
      } else {
        // Lower score: Loss
        status = 'lost';
        spotPayout += 0;
      }

      totalReturn += spotPayout;
      return {
        ...spot,
        status,
        payout: spotPayout,
      };
    });

    const netResult = totalReturn - totalCurrentBet;
    setRoundNetWin(netResult);
    setSpots(resolvedSpots);
    setStage('round-over');

    if (totalReturn > 0) {
      onUpdateCoins(currentCoins + totalReturn);
    }

    if (playerWonAny || netResult > 0) {
      soundEffects.playKaChing();
      soundEffects.playWinSound();
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
      });
      setTableNotice(`🎉 Round Over! You won $${Math.max(0, netResult).toLocaleString()}!`);
    } else if (netResult === 0 && totalCurrentBet > 0) {
      soundEffects.playCardSelect();
      setTableNotice('Round Over! Push - All bets returned.');
    } else {
      soundEffects.playPassSound();
      setTableNotice('Round Over! House wins.');
    }
  };

  // Replay with same bets or start fresh
  const handlePlayAgain = (keepBets: boolean = true) => {
    soundEffects.playCardSelect();
    setDealerCards([]);
    setIsDealerHoleCardHidden(true);
    setRoundNetWin(0);

    if (keepBets) {
      // Re-place same bets if player has coins
      const needed = totalCurrentBet;
      if (currentCoins >= needed) {
        onUpdateCoins(currentCoins - needed);
        setSpots((prev) =>
          prev.map((s) => ({
            ...s,
            cards: [],
            isDoubled: false,
            hasInsurance: false,
            insuranceBet: 0,
            status: 'idle',
            payout: 0,
          }))
        );
        setStage('betting');
        setTableNotice('Bets placed. Click Deal when ready!');
      } else {
        // Not enough coins to rebet same amount
        setSpots((prev) =>
          prev.map((s) => ({
            ...s,
            bet: 0,
            cards: [],
            isDoubled: false,
            hasInsurance: false,
            insuranceBet: 0,
            status: 'idle',
            payout: 0,
          }))
        );
        setStage('betting');
        setTableNotice('Insufficient balance to rebet. Place new bets!');
      }
    } else {
      setSpots((prev) =>
        prev.map((s) => ({
          ...s,
          bet: 0,
          cards: [],
          isDoubled: false,
          hasInsurance: false,
          insuranceBet: 0,
          status: 'idle',
          payout: 0,
        }))
      );
      setStage('betting');
      setTableNotice('Place your bets in the circles & press Deal');
    }
  };

  const dealerScoreInfo = calculateBlackjackScore(
    isDealerHoleCardHidden && dealerCards.length >= 2
      ? [dealerCards[0]]
      : dealerCards
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#04130d] text-white flex flex-col justify-between select-none font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0b3323] via-[#051a11] to-[#020a06] pointer-events-none" />

      {/* TOP HEADER BAR */}
      <header className="relative z-20 flex items-center justify-between px-4 py-2.5 bg-black/50 backdrop-blur-md border-b border-emerald-500/30">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-menu-bj"
            type="button"
            onClick={onGoToMainMenu}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-400/40 text-emerald-300 text-xs font-bold transition uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Main Menu</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/20 text-xs font-bold text-emerald-300">
            <span>♠ LAS VEGAS RULES (3:2) ♣</span>
          </div>
        </div>

        {/* Center Title */}
        <div className="text-center">
          <h1 className="text-sm sm:text-base font-black tracking-widest text-amber-400 uppercase">
            CASINO BLACKJACK
          </h1>
          <span className="text-[10px] text-white/60 tracking-wider">
            Player vs Dealer (1-on-1)
          </span>
        </div>

        {/* Right Balance & Sound Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-amber-500/40">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs sm:text-sm font-black text-amber-400 font-mono">
              ${currentCoins.toLocaleString()}
            </span>
          </div>

          <button
            id="btn-sound-bj"
            type="button"
            onClick={handleToggleSound}
            className="p-1.5 rounded-xl bg-black/40 hover:bg-black/70 border border-white/20 text-white transition cursor-pointer"
            title="Toggle Sound"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          <button
            id="btn-rules-bj"
            type="button"
            onClick={onOpenRules}
            className="p-1.5 rounded-xl bg-black/40 hover:bg-black/70 border border-white/20 text-white transition cursor-pointer"
            title="Rules"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </header>

      {/* MAIN CASINO HALF-CIRCLE TABLE AREA */}
      <main className="relative flex-1 flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
        {/* HALF-CIRCLE CASINO TABLE CONTAINER */}
        <div
          id="blackjack-felt-table"
          className="relative w-full max-w-4xl aspect-[1.75/1] sm:aspect-[1.85/1] bg-gradient-to-b from-[#0a3f29] via-[#064e3b] to-[#04281c] rounded-b-[260px] sm:rounded-b-[400px] md:rounded-b-[480px] border-t-8 border-t-zinc-800 border-x-[14px] border-b-[14px] border-[#6b4724] shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_4px_30px_rgba(0,0,0,0.6)] flex flex-col justify-between p-3 sm:p-6 overflow-hidden select-none"
        >
          {/* Inner Golden Felt Boundary Arc */}
          <div className="absolute inset-3 sm:inset-5 rounded-b-[240px] sm:rounded-b-[380px] md:rounded-b-[460px] border border-amber-400/25 pointer-events-none" />

          {/* DEALER AREA (TOP FLAT EDGE) */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Dealer Chip Tray & Shoe Graphic */}
            <div className="flex items-center gap-6 mb-2">
              <div className="px-3 py-1 rounded bg-black/60 border border-amber-500/30 text-[10px] font-bold text-amber-300 uppercase tracking-widest shadow-inner">
                DEALER SHOE
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider">
                  DEALER
                </span>
                {dealerCards.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-black/70 border border-amber-400 text-xs font-black text-amber-300 font-mono">
                    {dealerScoreInfo.isBlackjack && !isDealerHoleCardHidden
                      ? 'BLACKJACK 21'
                      : dealerScoreInfo.isBust
                      ? `BUST (${dealerScoreInfo.score})`
                      : dealerScoreInfo.score}
                  </span>
                )}
              </div>
            </div>

            {/* Dealer Cards */}
            <div className="flex items-center justify-center min-h-[96px] sm:min-h-[110px] gap-2">
              {dealerCards.length === 0 ? (
                <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center text-[10px] text-white/40 uppercase">
                  Dealer
                </div>
              ) : (
                dealerCards.map((card, idx) => (
                  <motion.div
                    key={card.id}
                    initial={{ y: -30, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.15 }}
                  >
                    <CardView
                      card={card}
                      isFaceDown={idx === 1 && isDealerHoleCardHidden}
                      size="md"
                    />
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* TABLE FELT TEXT & ARCS */}
          <div className="relative z-0 flex flex-col items-center justify-center pointer-events-none my-1">
            {/* BLACKJACK PAYS 3 TO 2 ARC */}
            <div className="text-amber-400/90 font-black text-xs sm:text-sm md:text-base tracking-[0.25em] uppercase text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              BLACKJACK PAYS 3 TO 2
            </div>

            {/* INSURANCE PAYS 2 TO 1 SHAPE / BANNER */}
            <div className="my-1.5 px-6 sm:px-12 py-1 sm:py-1.5 rounded-full border-2 border-amber-400/50 bg-black/35 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <span className="text-amber-300 font-extrabold text-[11px] sm:text-xs md:text-sm tracking-[0.2em] uppercase drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]">
                ★ INSURANCE PAYS 2 TO 1 ★
              </span>
            </div>

            {/* DEALER RULE TEXT */}
            <div className="text-white/60 font-semibold text-[9px] sm:text-[11px] tracking-wider uppercase">
              Dealer must draw to 16 and stand on all 17s
            </div>
          </div>

          {/* THREE CIRCLES AREA (PLAYER BETTING & CARD SPOTS) */}
          <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-6 px-2 sm:px-8 mb-2">
            {spots.map((spot, idx) => {
              const spotVal = calculateBlackjackScore(spot.cards);
              const isCurrentTurn = stage === 'player-turn' && activeSpotIndex === idx;

              return (
                <div key={spot.id} className="flex flex-col items-center">
                  {/* Cards placed above this spot */}
                  <div className="min-h-[95px] sm:min-h-[110px] flex items-center justify-center -space-x-5 sm:-space-x-7 mb-2">
                    {spot.cards.map((card, cIdx) => (
                      <motion.div
                        key={card.id}
                        initial={{ y: 20, opacity: 0, scale: 0.8 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        transition={{ delay: cIdx * 0.1 }}
                      >
                        <CardView card={card} size="md" />
                      </motion.div>
                    ))}
                  </div>

                  {/* Spot Score / Status Badge */}
                  {spot.cards.length > 0 && (
                    <div className="mb-1.5">
                      {spot.status === 'blackjack' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-lg animate-pulse">
                          BLACKJACK!
                        </span>
                      ) : spot.status === 'busted' ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider">
                          BUST ({spotVal.score})
                        </span>
                      ) : spot.status === 'won' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                          WON +${spot.payout.toLocaleString()}
                        </span>
                      ) : spot.status === 'pushed' ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider">
                          PUSH (TIE)
                        </span>
                      ) : spot.status === 'lost' ? (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-white/70 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                          LOST
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-black/70 border border-emerald-400 text-[10px] sm:text-xs font-mono font-bold text-emerald-300">
                          {spotVal.score}
                        </span>
                      )}
                    </div>
                  )}

                  {/* THE CIRCLE ON THE FELT */}
                  <motion.div
                    id={`bj-spot-${spot.id}`}
                    onClick={() => handleSpotClick(spot.id)}
                    whileHover={stage === 'betting' ? { scale: 1.05 } : {}}
                    whileTap={stage === 'betting' ? { scale: 0.95 } : {}}
                    className={`
                      relative w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 select-none
                      ${
                        isCurrentTurn
                          ? 'border-amber-400 bg-amber-400/25 ring-8 ring-amber-400/30 shadow-[0_0_35px_rgba(245,158,11,0.6)]'
                          : spot.bet > 0
                          ? 'border-emerald-400 bg-emerald-950/60 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                          : 'border-white/30 bg-black/40 hover:border-amber-400/60 hover:bg-black/60'
                      }
                      ${stage === 'betting' ? 'cursor-pointer' : 'cursor-default'}
                    `}
                  >
                    {/* Inner Circle Ring */}
                    <div className="absolute inset-1.5 sm:inset-2 rounded-full border border-dashed border-amber-300/40 pointer-events-none" />

                    {/* Spot Bet Chips or Placeholder */}
                    {spot.bet > 0 ? (
                      <div className="flex flex-col items-center z-10">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 border-2 border-white text-slate-950 font-black text-[10px] sm:text-xs flex items-center justify-center shadow-lg">
                          ${spot.bet >= 1000 ? `${spot.bet / 1000}k` : spot.bet}
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-black text-amber-300 mt-0.5">
                          ${spot.bet.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <div className="text-center z-10">
                        <span className="text-[10px] sm:text-xs font-black text-white/50 uppercase block">
                          {spot.label}
                        </span>
                        {stage === 'betting' && (
                          <span className="text-[8px] sm:text-[9px] text-amber-300/70 font-semibold block">
                            Tap to Bet
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        {/* NOTICE MESSAGE BANNER */}
        <div className="mt-2 sm:mt-3 px-4 py-1.5 rounded-full bg-black/70 border border-emerald-500/40 text-xs sm:text-sm font-bold text-emerald-300 text-center shadow-lg">
          {tableNotice}
        </div>
      </main>

      {/* BOTTOM CONTROLS & ACTIONS */}
      <footer className="relative z-20 bg-zinc-950/90 backdrop-blur-md border-t border-emerald-500/30 p-2 sm:p-4">
        {/* 1. BETTING STAGE CONTROLS */}
        {stage === 'betting' && (
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Chip Denominations */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white/50 uppercase hidden md:inline">
                Chips:
              </span>
              {CHIP_DENOMINATIONS.map((chip) => {
                const isSelected = selectedChip === chip;
                return (
                  <button
                    key={chip}
                    id={`btn-chip-${chip}`}
                    type="button"
                    onClick={() => {
                      soundEffects.playCardSelect();
                      setSelectedChip(chip);
                    }}
                    className={`
                      w-10 h-10 sm:w-12 sm:h-12 rounded-full font-black text-[10px] sm:text-xs transition-all border-2 flex items-center justify-center shadow-lg cursor-pointer
                      ${
                        isSelected
                          ? 'scale-110 ring-4 ring-amber-400 border-white text-slate-950 bg-gradient-to-br from-amber-300 to-yellow-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                          : 'border-white/20 text-white bg-zinc-800 hover:bg-zinc-700'
                      }
                    `}
                  >
                    ${chip >= 1000 ? `${chip / 1000}k` : chip}
                  </button>
                );
              })}
            </div>

            {/* Bet Modification & Deal Button */}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
              <button
                id="btn-clear-bets"
                type="button"
                onClick={handleClearBets}
                disabled={totalCurrentBet === 0}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Clear
              </button>

              <button
                id="btn-double-bets"
                type="button"
                onClick={handleDoubleAllBets}
                disabled={totalCurrentBet === 0 || currentCoins < totalCurrentBet}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-amber-400 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                2X Bets
              </button>

              <button
                id="btn-deal-bj"
                type="button"
                onClick={handleDeal}
                disabled={totalCurrentBet === 0}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)] transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>DEAL (${totalCurrentBet.toLocaleString()})</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. INSURANCE PROMPT OVERLAY */}
        {stage === 'insurance' && (
          <div className="max-w-md mx-auto flex flex-col items-center gap-2 py-1">
            <div className="flex items-center gap-2 text-amber-400 font-black text-xs sm:text-sm uppercase">
              <Shield className="w-4 h-4" />
              <span>Dealer shows Ace! Take Insurance (Pays 2:1)?</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                id="btn-buy-insurance"
                type="button"
                onClick={() => handleInsuranceDecision(true)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition cursor-pointer"
              >
                Buy Insurance (${Math.floor(totalCurrentBet / 2).toLocaleString()})
              </button>
              <button
                id="btn-decline-insurance"
                type="button"
                onClick={() => handleInsuranceDecision(false)}
                className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {/* 3. PLAYER TURN ACTION BAR (HIT, STAND, DOUBLE) */}
        {stage === 'player-turn' && (
          <div className="max-w-lg mx-auto flex items-center justify-center gap-3 sm:gap-4">
            <button
              id="btn-hit"
              type="button"
              onClick={handleHit}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)] transition cursor-pointer"
            >
              HIT
            </button>

            <button
              id="btn-stand"
              type="button"
              onClick={handleStand}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(244,63,94,0.4)] transition cursor-pointer"
            >
              STAND
            </button>

            {activeSpotIndex !== null &&
              spots[activeSpotIndex]?.cards.length === 2 && (
                <button
                  id="btn-double"
                  type="button"
                  onClick={handleDoubleDown}
                  disabled={currentCoins < (spots[activeSpotIndex]?.bet || 0)}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 disabled:opacity-40 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.4)] transition cursor-pointer"
                >
                  DOUBLE
                </button>
              )}
          </div>
        )}

        {/* 4. DEALER TURN / DEALING ANIMATION NOTICE */}
        {(stage === 'dealing' || stage === 'dealer-turn') && (
          <div className="text-center py-2 text-xs sm:text-sm font-bold text-white/70 animate-pulse">
            {stage === 'dealing' ? 'Dealing cards...' : 'Dealer is playing...'}
          </div>
        )}

        {/* 5. ROUND OVER CONTROLS */}
        {stage === 'round-over' && (
          <div className="max-w-md mx-auto flex items-center justify-center gap-3">
            <button
              id="btn-rebet-deal"
              type="button"
              onClick={() => handlePlayAgain(true)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)] transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>REBET & PLAY AGAIN</span>
            </button>

            <button
              id="btn-new-bets"
              type="button"
              onClick={() => handlePlayAgain(false)}
              className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition cursor-pointer"
            >
              NEW BETS
            </button>
          </div>
        )}
      </footer>
    </div>
  );
};
