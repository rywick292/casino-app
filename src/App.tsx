import React, { useState, useEffect, useRef } from 'react';
import { BuangKartuTigaEvent, BuangKartuTigaPlayerDiscard, Card, Difficulty, GameLog, GamePhase, HandCombo, ManualBuangKartuState, PayoutDetail, Player, PokerVariant, ReshuffleEvent, TrickPlay, WinType } from './types';
import { canBeatCombo, checkHasFourTwos, checkHasMurni, createDeck, has3OfSpades, identifyCombo, RANK_LABEL, shuffleDeck, sortCards, SUIT_SYMBOL } from './utils/pokerRules';
import { chooseAIMove, findAllValidCombos } from './utils/aiStrategy';
import { soundEffects } from './utils/soundEffects';
import { PokerTable } from './components/PokerTable';
import { GameSetupModal } from './components/GameSetupModal';
import { RulesModal } from './components/RulesModal';
import { GameOverModal } from './components/GameOverModal';
import { Homepage } from './components/Homepage';
import { SlotMachine } from './components/SlotMachine';
import { BlackjackTable } from './components/BlackjackTable';
import { TexasHoldemTable } from './components/TexasHoldemTable';

const INITIAL_COINS = 100000;
const STORAGE_KEY_COINS = 'big2_player_coins';

export default function App() {
  // Persistent Player Coins
  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COINS);
    return saved ? parseInt(saved, 10) : INITIAL_COINS;
  });

  // Save coins to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COINS, coins.toString());
  }, [coins]);

  // Game Setup Config (Defaults to 'landing' homepage first)
  const [phase, setPhase] = useState<GamePhase>('landing');
  const [variant, setVariant] = useState<PokerVariant>('global');
  const [aiCount, setAiCount] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [betAmount, setBetAmount] = useState<number>(1000);
  const [playerName, setPlayerName] = useState<string>('Player 1');
  const [playerAvatar, setPlayerAvatar] = useState<string>('👑');

  // Active Game State
  const [players, setPlayers] = useState<Player[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [lastCombo, setLastCombo] = useState<HandCombo | null>(null);
  const [lastComboPlayerIndex, setLastComboPlayerIndex] = useState<number | null>(null);
  const [trickHistory, setTrickHistory] = useState<TrickPlay[]>([]);
  const [passedPlayerIndices, setPassedPlayerIndices] = useState<number[]>([]);
  const [isFirstTurnOfGame, setIsFirstTurnOfGame] = useState<boolean>(true);
  const [previousWinnerId, setPreviousWinnerId] = useState<string | null>(null);
  const [previousWinnerName, setPreviousWinnerName] = useState<string | null>(null);
  const [isRematch, setIsRematch] = useState<boolean>(false);
  const [gameWinner, setGameWinner] = useState<Player | null>(null);
  const [winType, setWinType] = useState<WinType>('standard');
  const [isPendingWin, setIsPendingWin] = useState<boolean>(false);
  const [payoutDetails, setPayoutDetails] = useState<PayoutDetail[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [showRules, setShowRules] = useState<boolean>(false);

  // Dealing & Four 2s Reshuffle State
  const [isDealingCards, setIsDealingCards] = useState<boolean>(false);
  const [reshuffleEvent, setReshuffleEvent] = useState<ReshuffleEvent | null>(null);

  // Indonesian Poker "Buang kartu 3" State (Manual throwing ritual)
  const [buangKartuTigaEvent, setBuangKartuTigaEvent] = useState<BuangKartuTigaEvent | null>(null);
  const [manualBuangKartuState, setManualBuangKartuState] = useState<ManualBuangKartuState | null>(null);
  const [discardedThrees, setDiscardedThrees] = useState<Card[]>([]);

  // Ref to track turn execution and avoid double AI triggers
  const aiTurnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const winTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reshuffleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dealAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buangKartuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to add log
  const addLog = (msg: string) => {
    setLogs((prev) => [...prev.slice(-15), msg]);
  };

  // Perform card distribution & check for Four '2's rule and Indonesian 'Murni' rule
  const dealCardsAndCheckReshuffle = (
    currentAiCount: number,
    currentName: string,
    currentAvatar: string,
    currentVariant: PokerVariant = variant,
    prevWinnerId: string | null = null,
    prevWinnerName: string | null = null,
    isPlayAgainMatch: boolean = false
  ) => {
    if (reshuffleTimeoutRef.current) clearTimeout(reshuffleTimeoutRef.current);
    if (dealAnimationTimeoutRef.current) clearTimeout(dealAnimationTimeoutRef.current);

    // Create & shuffle deck
    const deck = shuffleDeck(createDeck());
    const totalPlayersCount = currentAiCount + 1;
    const cardsPerPlayer = Math.floor(52 / totalPlayersCount);
    const newPlayers: Player[] = [];

    // Create Human Player (Index 0)
    newPlayers.push({
      id: 'human-0',
      name: currentName,
      isHuman: true,
      avatar: currentAvatar,
      coins: coins,
      hand: sortCards(deck.slice(0, cardsPerPlayer)),
      isPassed: false,
    });

    // Create AI Opponents
    const aiAvatars = ['🤖', '🦊', '🐯', '⚡'];
    const aiNames = ['Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta'];

    for (let i = 0; i < currentAiCount; i++) {
      const startIdx = (i + 1) * cardsPerPlayer;
      newPlayers.push({
        id: `ai-${i + 1}`,
        name: aiNames[i % aiNames.length],
        isHuman: false,
        avatar: aiAvatars[i % aiAvatars.length],
        coins: 100000,
        hand: sortCards(deck.slice(startIdx, startIdx + cardsPerPlayer)),
        isPassed: false,
      });
    }

    // 1. Check if any player was dealt all four '2's (Dragon Quad Instant Reshuffle Rule)
    const fourTwosPlayer = newPlayers.find((p) => checkHasFourTwos(p.hand));

    if (fourTwosPlayer) {
      // FOUR 2s DETECTED!
      setPlayers(newPlayers);
      setReshuffleEvent({
        player: fourTwosPlayer,
        fourTwos: fourTwosPlayer.hand.filter((c) => c.rank === 15),
        phase: 'revealing',
      });
      setIsDealingCards(false);
      soundEffects.playReshuffleAlert();
      addLog(`🚨 FOUR '2's DETECTED! ${fourTwosPlayer.name} holds all four 2s! All hands revealed. Reshuffle initiated.`);

      // Auto-trigger reshuffle after 3.8s reveal
      reshuffleTimeoutRef.current = setTimeout(() => {
        setReshuffleEvent((prev) => (prev ? { ...prev, phase: 'dealing' } : null));
        soundEffects.playShuffle();
        dealCardsAndCheckReshuffle(
          currentAiCount,
          currentName,
          currentAvatar,
          currentVariant,
          prevWinnerId,
          prevWinnerName,
          isPlayAgainMatch
        );
      }, 3800);
      return;
    }

    // 2. Check for MURNI (Indonesian Poker Rule: Dealt hand with No J, Q, K = Instant Win!)
    if (currentVariant === 'indonesian') {
      const murniPlayer = newPlayers.find((p) => checkHasMurni(p.hand));
      if (murniPlayer) {
        setReshuffleEvent(null);
        setPlayers(newPlayers);
        setIsDealingCards(false);
        setWinType('murni');
        soundEffects.playKaChing();
        addLog(`👑 MURNI! ${murniPlayer.name} was dealt Pure Hand (NO J, Q, K cards)! Instant MURNI Victory!`);

        winTimeoutRef.current = setTimeout(() => {
          handleGameOver(murniPlayer, newPlayers, 'murni');
        }, 1500);
        return;
      }
    }

    // Standard clean deal with card throwing animation
    setReshuffleEvent(null);
    if (buangKartuTimeoutRef.current) clearTimeout(buangKartuTimeoutRef.current);

    // Determine starting player & "Buang kartu 3" handling:
    let startIndex = 0;
    let mustPlay3Spades = false;

    if (currentVariant === 'indonesian') {
      if (isPlayAgainMatch) {
        // REMATCH IN INDONESIAN POKER: NO NEED TO BUANG KARTU 3!
        // All 3 cards remain in player hands. Previous winner plays first with Free Lead!
        setManualBuangKartuState(null);
        setDiscardedThrees([]);
        setBuangKartuTigaEvent(null);

        const prevWinnerIdx = newPlayers.findIndex((p) => p.id === prevWinnerId);
        startIndex = prevWinnerIdx !== -1 ? prevWinnerIdx : 0;
        mustPlay3Spades = false;

        addLog(
          `🎮 Rematch! Pemenang sebelumnya ${newPlayers[startIndex].name} jalan pertama dengan Free Lead. (Tidak perlu buang kartu 3)`
        );
      } else {
        // VERY BEGINNING OF GAME: MANUAL BUANG KARTU 3!
        // Players throw 3 cards to table manually. 3s stay in hands until thrown.
        setDiscardedThrees([]);
        setBuangKartuTigaEvent(null);
        setManualBuangKartuState({
          step: 'waiting-player',
          discards: [],
        });

        startIndex = 0;
        mustPlay3Spades = false;

        addLog(`📢 Tahap Awal: Buang kartu 3! Pemain saling melempar kartu 3 ke meja. Pemilik 3♠ akan mulai bermain!`);
      }
    } else {
      // GLOBAL BIG 2
      setManualBuangKartuState(null);
      setDiscardedThrees([]);
      setBuangKartuTigaEvent(null);

      if (prevWinnerId) {
        const prevWinnerIdx = newPlayers.findIndex((p) => p.id === prevWinnerId);
        startIndex = prevWinnerIdx !== -1 ? prevWinnerIdx : 0;
        mustPlay3Spades = false;
        addLog(
          `Next Match! Previous winner ${newPlayers[startIndex].name} plays first with Free Lead!`
        );
      } else {
        const idx3Spades = newPlayers.findIndex((p) => has3OfSpades(p.hand));
        startIndex = idx3Spades !== -1 ? idx3Spades : 0;
        mustPlay3Spades = true;
        addLog(
          `Opening match (Global Big 2)! ${newPlayers[startIndex].name} holding 3♠ plays first.`
        );
      }
    }

    setPlayers(newPlayers);
    setIsDealingCards(true);
    soundEffects.playShuffle();
    soundEffects.playCardDeal();

    setActivePlayerIndex(startIndex);
    setLastCombo(null);
    setLastComboPlayerIndex(null);
    setTrickHistory([]);
    setPassedPlayerIndices([]);
    setIsFirstTurnOfGame(mustPlay3Spades);
    if (winTimeoutRef.current) clearTimeout(winTimeoutRef.current);
    setIsPendingWin(false);
    setGameWinner(null);
    setWinType('standard');
    setPayoutDetails([]);
    setLogs([
      currentVariant === 'indonesian'
        ? isPlayAgainMatch
          ? `Permainan Baru! Pemenang sebelumnya ${newPlayers[startIndex].name} jalan pertama dengan Free Lead. (Tidak perlu buang kartu 3)`
          : `Tahap Awal: Buang kartu 3! Silakan buang seluruh kartu 3 milikmu ke meja.`
        : mustPlay3Spades
        ? `Match dealt (Global Big 2)! ${newPlayers[startIndex].name} holding 3♠ plays first.`
        : `Match dealt (Global Big 2)! Previous winner ${newPlayers[startIndex].name} plays first with Free Lead.`,
    ]);

    // End dealing animation after 1.3s
    dealAnimationTimeoutRef.current = setTimeout(() => {
      setIsDealingCards(false);
    }, 1300);
  };

  // Start new game match
  const startNewMatch = (
    config?: {
      aiCount: number;
      difficulty: Difficulty;
      betAmount: number;
      playerName: string;
      playerAvatar: string;
      variant: PokerVariant;
    },
    isPlayAgain: boolean = false
  ) => {
    const currentAiCount = config ? config.aiCount : aiCount;
    const currentDiff = config ? config.difficulty : difficulty;
    const currentBet = config ? config.betAmount : betAmount;
    const currentName = config ? config.playerName : playerName;
    const currentAvatar = config ? config.playerAvatar : playerAvatar;
    const currentVariant = config ? config.variant : variant;

    if (config) {
      setAiCount(currentAiCount);
      setDifficulty(currentDiff);
      setBetAmount(currentBet);
      setPlayerName(currentName);
      setPlayerAvatar(currentAvatar);
      setVariant(currentVariant);
    }

    const winnerIdToUse = isPlayAgain ? previousWinnerId : null;
    const winnerNameToUse = isPlayAgain ? previousWinnerName : null;

    if (!isPlayAgain) {
      setPreviousWinnerId(null);
      setPreviousWinnerName(null);
      setIsRematch(false);
    } else {
      setIsRematch(true);
    }

    setPhase('playing');
    dealCardsAndCheckReshuffle(
      currentAiCount,
      currentName,
      currentAvatar,
      currentVariant,
      winnerIdToUse,
      winnerNameToUse,
      isPlayAgain
    );
  };

  // Manual Trigger to skip reveal timer and reshuffle immediately
  const handleInstantReshuffleNow = () => {
    if (reshuffleTimeoutRef.current) clearTimeout(reshuffleTimeoutRef.current);
    setReshuffleEvent((prev) => (prev ? { ...prev, phase: 'dealing' } : null));
    soundEffects.playShuffle();
    dealCardsAndCheckReshuffle(
      aiCount,
      playerName,
      playerAvatar,
      variant,
      previousWinnerId,
      previousWinnerName,
      isRematch
    );
  };

  // MANUAL BUANG KARTU 3: Human player throws their 3 card(s)
  const handleHumanThrowThrees = () => {
    if (!manualBuangKartuState || manualBuangKartuState.step !== 'waiting-player') return;

    const humanPlayer = players.find((p) => p.isHuman) || players[0];
    const humanThrees = humanPlayer.hand.filter((c) => c.rank === 3);
    const newHand = humanPlayer.hand.filter((c) => c.rank !== 3);

    const humanDiscard: BuangKartuTigaPlayerDiscard = {
      playerId: humanPlayer.id,
      playerName: humanPlayer.name,
      playerAvatar: humanPlayer.avatar,
      isHuman: true,
      cards: humanThrees,
    };

    if (humanThrees.length > 0) {
      soundEffects.playCardPlay();
      addLog(`🃏 ${humanPlayer.name} membuang ${humanThrees.map((c) => `${RANK_LABEL[c.rank]}${SUIT_SYMBOL[c.suit]}`).join(' ')} ke meja!`);
    } else {
      soundEffects.playPass();
      addLog(`🃏 ${humanPlayer.name} tidak memiliki kartu 3.`);
    }

    const updatedPlayers = players.map((p) => (p.id === humanPlayer.id ? { ...p, hand: newHand } : p));
    setPlayers(updatedPlayers);

    setManualBuangKartuState((prev) =>
      prev
        ? {
            ...prev,
            step: 'bots-throwing',
            discards: [humanDiscard],
          }
        : null
    );
  };

  // MANUAL BUANG KARTU 3: Finish announcing and start game with the 3♠ starter
  const handleFinishBuangKartu = () => {
    if (!manualBuangKartuState || manualBuangKartuState.step !== 'announcing') return;

    const starterId = manualBuangKartuState.starterPlayerId;
    const starterIdx = players.findIndex((p) => p.id === starterId);
    const validStarterIdx = starterIdx !== -1 ? starterIdx : 0;

    setActivePlayerIndex(validStarterIdx);
    setLastCombo(null);
    setLastComboPlayerIndex(null);
    setTrickHistory([]);
    setPassedPlayerIndices([]);
    setIsFirstTurnOfGame(false);
    setManualBuangKartuState(null);

    soundEffects.playCardSelect();
    addLog(`🚀 Permainan dimulai! ${players[validStarterIdx]?.name} jalan pertama dengan Free Lead.`);
  };

  // AI bots throw their 3 cards sequentially during Manual Buang Kartu 3 phase
  useEffect(() => {
    if (phase !== 'playing' || !manualBuangKartuState || manualBuangKartuState.step !== 'bots-throwing') {
      return;
    }

    const botPlayers = players.filter((p) => !p.isHuman);
    if (botPlayers.length === 0) {
      const allDiscards = manualBuangKartuState.discards;
      const starterDiscard = allDiscards.find((d) => d.cards.some((c) => c.rank === 3 && c.suit === 'spades'));
      const starterId = starterDiscard ? starterDiscard.playerId : players[0].id;
      const starterPlayer = players.find((p) => p.id === starterId) || players[0];

      setManualBuangKartuState((prev) =>
        prev
          ? {
              ...prev,
              step: 'announcing',
              starterPlayerId: starterPlayer.id,
              starterPlayerName: starterPlayer.name,
              starterPlayerAvatar: starterPlayer.avatar,
              starterIsHuman: starterPlayer.isHuman,
            }
          : null
      );
      return;
    }

    let isCancelled = false;
    const timeouts: NodeJS.Timeout[] = [];

    botPlayers.forEach((bot, idx) => {
      const delay = (idx + 1) * 750;
      const timer = setTimeout(() => {
        if (isCancelled) return;

        setPlayers((prevPlayers) => {
          const currentBot = prevPlayers.find((p) => p.id === bot.id);
          if (!currentBot) return prevPlayers;

          const botThrees = currentBot.hand.filter((c) => c.rank === 3);
          const newBotHand = currentBot.hand.filter((c) => c.rank !== 3);

          if (botThrees.length > 0) {
            soundEffects.playCardPlay();
            addLog(`🤖 ${currentBot.name} membuang ${botThrees.map((c) => `${RANK_LABEL[c.rank]}${SUIT_SYMBOL[c.suit]}`).join(' ')} ke meja!`);
          } else {
            addLog(`🤖 ${currentBot.name} tidak memiliki kartu 3.`);
          }

          const botDiscard: BuangKartuTigaPlayerDiscard = {
            playerId: currentBot.id,
            playerName: currentBot.name,
            playerAvatar: currentBot.avatar,
            isHuman: false,
            cards: botThrees,
          };

          setManualBuangKartuState((prevState) => {
            if (!prevState) return null;
            return {
              ...prevState,
              discards: [...prevState.discards, botDiscard],
              currentThrowerName: currentBot.name,
            };
          });

          return prevPlayers.map((p) => (p.id === currentBot.id ? { ...p, hand: newBotHand } : p));
        });
      }, delay);

      timeouts.push(timer);
    });

    const totalDelay = (botPlayers.length + 1) * 750 + 150;
    const finishTimer = setTimeout(() => {
      if (isCancelled) return;

      setManualBuangKartuState((prevState) => {
        if (!prevState) return null;
        const allDiscards = prevState.discards;
        const allThrees = allDiscards.flatMap((d) => d.cards);

        // Find who threw 3 of Spades (3♠)
        const starterDiscard = allDiscards.find((d) =>
          d.cards.some((c) => c.rank === 3 && c.suit === 'spades')
        );

        const starterId = starterDiscard ? starterDiscard.playerId : (allDiscards[0]?.playerId || 'human-0');
        const starterPlayer = players.find((p) => p.id === starterId) || players[0];

        soundEffects.playKaChing();
        addLog(`👑 ${starterPlayer.name} membuang 3 Sekop (3♠)!`);
        addLog(`👑 ${starterPlayer.name} jalan pertama dengan Free Lead!`);

        setDiscardedThrees(allThrees);

        return {
          ...prevState,
          step: 'announcing',
          starterPlayerId: starterPlayer.id,
          starterPlayerName: starterPlayer.name,
          starterPlayerAvatar: starterPlayer.avatar,
          starterIsHuman: starterPlayer.isHuman,
        };
      });
    }, totalDelay);

    timeouts.push(finishTimer);

    return () => {
      isCancelled = true;
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, [manualBuangKartuState?.step, phase]);

  // Auto-finish announcement after 2.8s
  useEffect(() => {
    if (manualBuangKartuState?.step === 'announcing') {
      const autoTimer = setTimeout(() => {
        handleFinishBuangKartu();
      }, 2800);
      return () => clearTimeout(autoTimer);
    }
  }, [manualBuangKartuState?.step, manualBuangKartuState?.starterPlayerId, players]);

  // Calculate settlement & payouts when match ends
  const handleGameOver = (winner: Player, updatedPlayers: Player[], typeOfWin: WinType = 'standard') => {
    soundEffects.playChipSound();
    setGameWinner(winner);
    setPreviousWinnerId(winner.id);
    setPreviousWinnerName(winner.name);
    setWinType(typeOfWin);

    let winnerGain = 0;
    const details: PayoutDetail[] = [];
    let updatedHumanCoins = coins;

    updatedPlayers.forEach((p) => {
      if (p.id === winner.id) return;
      // Loser pays: cards left * betAmount
      const lossAmount = p.hand.length * betAmount;
      winnerGain += lossAmount;

      if (p.isHuman) {
        updatedHumanCoins -= lossAmount;
      }

      details.push({
        playerId: p.id,
        playerName: p.name,
        isHuman: p.isHuman,
        cardsLeft: p.hand.length,
        multiplier: 1,
        netCoins: -lossAmount,
        isWinner: false,
      });
    });

    // Winner details
    if (winner.isHuman) {
      updatedHumanCoins += winnerGain;
    }

    details.unshift({
      playerId: winner.id,
      playerName: winner.name,
      isHuman: winner.isHuman,
      cardsLeft: 0,
      multiplier: 1,
      netCoins: winnerGain,
      isWinner: true,
    });

    // Save updated coins
    setCoins(Math.max(0, updatedHumanCoins));
    setPayoutDetails(details);
    addLog(
      `WINNER! ${winner.name} won ${winnerGain.toLocaleString()} coins (${
        typeOfWin === 'murni' ? 'MURNI WIN' : typeOfWin === 'bomb' ? 'BOMB WIN' : 'MATCH WIN'
      })!`
    );
    setPhase('game-over');
  };

  // Next Turn advance logic
  const advanceTurn = (
    nextIndex: number,
    currentPlayers: Player[],
    newLastCombo: HandCombo | null,
    newLastComboPlayerIdx: number | null,
    newPassedIndices: number[]
  ) => {
    const totalCount = currentPlayers.length;

    // Check if table clears (all active opponents passed back to last combo player)
    if (newLastComboPlayerIdx !== null) {
      const activeOpponentsPassedCount = newPassedIndices.length;
      if (activeOpponentsPassedCount >= totalCount - 1) {
        // In Indonesian Poker, if a player bombed someone and all other players pass (no higher bomb), that player wins the match!
        if (variant === 'indonesian' && newLastCombo?.isBomb) {
          const bombWinner = currentPlayers[newLastComboPlayerIdx];
          addLog(`💣 BOMB VICTORY! ${bombWinner.name}'s Bomb went uncontested and wins the match!`);
          handleGameOver(bombWinner, currentPlayers, 'bomb');
          return;
        }

        // Table Cleared! Last combo player gets free lead turn
        addLog(`All players passed! Table cleared. Turn returned to ${currentPlayers[newLastComboPlayerIdx].name}.`);

        // Reset player statuses
        const resetPlayers = currentPlayers.map((p) => ({ ...p, isPassed: false, statusText: undefined }));
        setPlayers(resetPlayers);
        setActivePlayerIndex(newLastComboPlayerIdx);
        setLastCombo(null);
        setLastComboPlayerIndex(null);
        setTrickHistory([]);
        setPassedPlayerIndices([]);
        return;
      }
    }

    // Find next unpassed player
    let candidateIdx = nextIndex % totalCount;
    while (newPassedIndices.includes(candidateIdx)) {
      candidateIdx = (candidateIdx + 1) % totalCount;
    }

    setActivePlayerIndex(candidateIdx);
  };

  // Handle Player Action (Play Cards)
  const handlePlayCards = (selectedCards: Card[]) => {
    if (gameWinner || isPendingWin || isDealingCards || reshuffleEvent) return;

    const combo = identifyCombo(selectedCards, variant);
    if (!combo) return;

    const currPlayer = players[activePlayerIndex];
    const newHand = currPlayer.hand.filter((c) => !selectedCards.some((sc) => sc.id === c.id));

    const updatedPlayers = players.map((p, idx) => {
      if (idx === activePlayerIndex) {
        return {
          ...p,
          hand: newHand,
          isPassed: false,
          statusText: newHand.length === 0 ? 'WINNER!' : combo.isBomb ? '💣 BOMB!' : `Played ${combo.description}`,
          isWinner: newHand.length === 0,
        };
      }
      return p;
    });

    setPlayers(updatedPlayers);
    setLastCombo(combo);
    setLastComboPlayerIndex(activePlayerIndex);
    setTrickHistory((prev) => [
      ...prev,
      {
        id: `play-${Date.now()}-${Math.random()}`,
        combo,
        playerIndex: activePlayerIndex,
        playerName: currPlayer.name,
        playerAvatar: currPlayer.avatar,
        timestamp: Date.now(),
      },
    ]);
    setIsFirstTurnOfGame(false);

    if (combo.isBomb) {
      addLog(`💣 BOMB! ${currPlayer.name} played Bomb: ${combo.description}!`);
    } else {
      addLog(`${currPlayer.name} played ${combo.description}`);
    }

    // CHECK INDONESIAN POKER 5 STRAIGHT CARDS (STRAIGHT FLUSH) AUTO WIN!
    // "if they throw 5 straight cards (straight flush) the card can bomb the "2" card and auto win."
    if (variant === 'indonesian' && combo.type === 'straight-flush') {
      setIsPendingWin(true);
      addLog(`💥 STRAIGHT FLUSH AUTO WIN! ${currPlayer.name} threw 5 Straight Cards (Straight Flush) for an instant AUTO WIN!`);
      soundEffects.playVictory();
      soundEffects.playKaChing();

      if (winTimeoutRef.current) clearTimeout(winTimeoutRef.current);
      winTimeoutRef.current = setTimeout(() => {
        handleGameOver(currPlayer, updatedPlayers, 'straight-flush-autowin');
        setIsPendingWin(false);
      }, 2000);
      return;
    }

    // Check Win - Delay game over result modal by 2 seconds so final card is visible on table
    if (newHand.length === 0) {
      setIsPendingWin(true);
      const winner = updatedPlayers[activePlayerIndex];
      addLog(`🎉 MATCH ENDED! ${winner.name} cleared all cards!`);

      if (winTimeoutRef.current) clearTimeout(winTimeoutRef.current);
      winTimeoutRef.current = setTimeout(() => {
        handleGameOver(winner, updatedPlayers, 'standard');
        setIsPendingWin(false);
      }, 2000);
      return;
    }

    // Advance turn
    advanceTurn(
      (activePlayerIndex + 1) % players.length,
      updatedPlayers,
      combo,
      activePlayerIndex,
      passedPlayerIndices
    );
  };

  // Handle Player Action (Pass Turn)
  const handlePassTurn = () => {
    if (gameWinner || isPendingWin || lastCombo === null || passedPlayerIndices.includes(activePlayerIndex) || isDealingCards || reshuffleEvent || buangKartuTigaEvent || manualBuangKartuState) return;

    const currPlayer = players[activePlayerIndex];
    const newPassedIndices = [...passedPlayerIndices, activePlayerIndex];

    const updatedPlayers = players.map((p, idx) => {
      if (idx === activePlayerIndex) {
        return {
          ...p,
          isPassed: true,
          statusText: 'PASSED',
        };
      }
      return p;
    });

    setPlayers(updatedPlayers);
    setPassedPlayerIndices(newPassedIndices);
    addLog(`${currPlayer.name} passed turn.`);

    advanceTurn(
      (activePlayerIndex + 1) % players.length,
      updatedPlayers,
      lastCombo,
      lastComboPlayerIndex,
      newPassedIndices
    );
  };

  // Human Player Auto-Pass Effect when holding no eligible cards
  useEffect(() => {
    if (phase !== 'playing' || gameWinner || isPendingWin || isDealingCards || reshuffleEvent || buangKartuTigaEvent || manualBuangKartuState) return;

    const activePlayer = players[activePlayerIndex];
    if (!activePlayer || !activePlayer.isHuman || !lastCombo) return;

    const allCombos = findAllValidCombos(activePlayer.hand, variant);
    const legalCombos = allCombos.filter((c) => canBeatCombo(c, lastCombo, variant));

    if (legalCombos.length === 0) {
      addLog(`${activePlayer.name} has no eligible cards to beat the table. Auto-passing...`);

      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === activePlayerIndex
            ? { ...p, statusText: 'No Eligible Cards (Auto Passing...)' }
            : p
        )
      );

      const autoPassTimer = setTimeout(() => {
        soundEffects.playPass();
        handlePassTurn();
      }, 1000);

      return () => clearTimeout(autoPassTimer);
    }
  }, [activePlayerIndex, phase, gameWinner, isPendingWin, lastCombo, isDealingCards, reshuffleEvent, buangKartuTigaEvent, manualBuangKartuState, variant]);

  // AI Turn Effect Loop
  useEffect(() => {
    if (phase !== 'playing' || gameWinner || isPendingWin || isDealingCards || reshuffleEvent || buangKartuTigaEvent || manualBuangKartuState) return;

    const activePlayer = players[activePlayerIndex];
    if (!activePlayer || activePlayer.isHuman) return;

    // Set AI status to thinking
    setPlayers((prev) =>
      prev.map((p, idx) => (idx === activePlayerIndex ? { ...p, statusText: 'Thinking...' } : p))
    );

    // Schedule AI move after natural delay
    aiTurnTimeoutRef.current = setTimeout(() => {
      const aiMove = chooseAIMove(activePlayer, lastCombo, difficulty, isFirstTurnOfGame, players, variant);

      if (aiMove) {
        soundEffects.playCardPlay();
        handlePlayCards(aiMove.cards);
      } else {
        soundEffects.playPass();
        handlePassTurn();
      }
    }, 1200);

    return () => {
      if (aiTurnTimeoutRef.current) {
        clearTimeout(aiTurnTimeoutRef.current);
      }
    };
  }, [activePlayerIndex, phase, gameWinner, isPendingWin, lastCombo, isFirstTurnOfGame, isDealingCards, reshuffleEvent, buangKartuTigaEvent, manualBuangKartuState, variant]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 flex flex-col">
      {/* HOMEPAGE LANDING SCREEN */}
      {phase === 'landing' && (
        <Homepage
          onStart={() => setPhase('setup')}
          onOpenRules={() => setShowRules(true)}
        />
      )}

      {/* SETUP SCREEN / MAIN MENU */}
      {phase === 'setup' && (
        <GameSetupModal
          currentCoins={coins}
          onStartGame={(config) => startNewMatch(config)}
          onPlaySlotMachine={() => setPhase('slot-machine')}
          onPlayBlackjack={() => setPhase('blackjack')}
          onPlayTexasHoldem={() => setPhase('texas-holdem')}
          onOpenRules={() => setShowRules(true)}
          onResetCoins={() => setCoins(INITIAL_COINS)}
          onGoToHomepage={() => setPhase('landing')}
        />
      )}

      {/* BLACKJACK TABLE SCREEN */}
      {phase === 'blackjack' && (
        <BlackjackTable
          currentCoins={coins}
          onUpdateCoins={(newCoins) => setCoins(newCoins)}
          onGoToMainMenu={() => setPhase('setup')}
          onOpenRules={() => setShowRules(true)}
        />
      )}

      {/* TEXAS HOLD'EM TABLE SCREEN */}
      {phase === 'texas-holdem' && (
        <TexasHoldemTable
          currentCoins={coins}
          onUpdateCoins={(newCoins) => setCoins(newCoins)}
          onGoToMainMenu={() => setPhase('setup')}
          onOpenRules={() => setShowRules(true)}
        />
      )}

      {/* SLOT MACHINE SCREEN */}
      {phase === 'slot-machine' && (
        <SlotMachine
          currentCoins={coins}
          onUpdateCoins={(newCoins) => setCoins(newCoins)}
          onGoToMainMenu={() => setPhase('setup')}
          onGoToHomepage={() => setPhase('landing')}
        />
      )}

      {/* PLAYING POKER TABLE SCREEN */}
      {(phase === 'playing' || phase === 'game-over') && (
        <PokerTable
          players={players}
          activePlayerIndex={activePlayerIndex}
          lastCombo={lastCombo}
          lastComboPlayerName={lastComboPlayerIndex !== null ? players[lastComboPlayerIndex]?.name : null}
          trickHistory={trickHistory}
          betAmount={betAmount}
          difficulty={difficulty}
          isFirstTurnOfGame={isFirstTurnOfGame}
          previousWinnerName={previousWinnerName}
          gameWinner={gameWinner}
          isPendingWin={isPendingWin}
          isDealingCards={isDealingCards}
          reshuffleEvent={reshuffleEvent}
          onInstantReshuffleNow={handleInstantReshuffleNow}
          buangKartuTigaEvent={buangKartuTigaEvent}
          manualBuangKartuState={manualBuangKartuState}
          onHumanThrowThrees={handleHumanThrowThrees}
          onFinishBuangKartu={handleFinishBuangKartu}
          isRematch={isRematch}
          discardedThrees={discardedThrees}
          onDismissBuangKartu={() => setBuangKartuTigaEvent(null)}
          logs={logs}
          variant={variant}
          onPlayCards={handlePlayCards}
          onPassTurn={handlePassTurn}
          onOpenRules={() => setShowRules(true)}
          onOpenSetup={() => {
            setPreviousWinnerId(null);
            setPreviousWinnerName(null);
            setIsRematch(false);
            setPhase('setup');
          }}
        />
      )}

      {/* GAME OVER RESULTS MODAL */}
      {gameWinner && payoutDetails.length > 0 && (
        <GameOverModal
          winnerName={gameWinner.name}
          winnerAvatar={gameWinner.avatar}
          isHumanWinner={gameWinner.isHuman}
          betAmount={betAmount}
          payoutDetails={payoutDetails}
          winType={winType}
          onPlayAgain={() => startNewMatch(undefined, true)}
          onGoToMainMenu={() => {
            setGameWinner(null);
            setPreviousWinnerId(null);
            setPreviousWinnerName(null);
            setIsRematch(false);
            setPhase('setup');
          }}
          onGoToHomepage={() => {
            setGameWinner(null);
            setPreviousWinnerId(null);
            setPreviousWinnerName(null);
            setIsRematch(false);
            setPhase('landing');
          }}
        />
      )}

      {/* RULES MODAL */}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}


