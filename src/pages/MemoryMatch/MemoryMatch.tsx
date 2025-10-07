import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, RotateCcw, Play, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'components';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';

const createSound = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

const playFlipSound = () => createSound(600, 0.1);
const playMatchSound = () => {
  createSound(800, 0.15);
  setTimeout(() => createSound(1000, 0.15), 100);
};
const playWinSound = () => {
  createSound(523, 0.2);
  setTimeout(() => createSound(659, 0.2), 200);
  setTimeout(() => createSound(784, 0.2), 400);
  setTimeout(() => createSound(1047, 0.3), 600);
};
const playStartSound = () => {
  createSound(440, 0.15);
  setTimeout(() => createSound(554, 0.15), 150);
  setTimeout(() => createSound(659, 0.2), 300);
};

const vibrate = (pattern: number | number[]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

const vibrateFlip = () => vibrate(30);
const vibrateMatch = () => vibrate([50, 30, 50]);
const vibrateWin = () => vibrate([100, 50, 100, 50, 200]);

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const cardEmojis = ['🐕', '🦴', '🐾', '🥩', '🎾', '🦮', '🐕‍🦺', '🌭'];

export const MemoryMatch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameStats, refetch } = useGame();
  const { success, error } = useToast();

  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [canFlip, setCanFlip] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const initializeGame = () => {
    const duplicatedEmojis = [...cardEmojis, ...cardEmojis];
    const shuffled = duplicatedEmojis
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setTimeElapsed(0);
    setCanFlip(true);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (flippedCards.length === 2) {
      setCanFlip(false);
      const [first, second] = flippedCards;
      const firstCard = cards[first];
      const secondCard = cards[second];

      if (firstCard.emoji === secondCard.emoji) {
        playMatchSound();
        vibrateMatch();

        setTimeout(() => {
          setCards(prev =>
            prev.map(card =>
              card.id === first || card.id === second
                ? { ...card, isMatched: true }
                : card
            )
          );
          setMatches(prev => prev + 1);
          setFlippedCards([]);
          setCanFlip(true);

          if (matches + 1 === cardEmojis.length) {
            endGame();
          }
        }, 600);
      } else {
        setTimeout(() => {
          setCards(prev =>
            prev.map(card =>
              card.id === first || card.id === second
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlippedCards([]);
          setCanFlip(true);
        }, 1000);
      }
      setMoves(prev => prev + 1);
    }
  }, [flippedCards, cards, matches]);

  const handleCardClick = (id: number) => {
    if (!gameStarted || !canFlip || flippedCards.includes(id)) return;

    const card = cards[id];
    if (card.isFlipped || card.isMatched) return;

    playFlipSound();
    vibrateFlip();

    setCards(prev =>
      prev.map(c => (c.id === id ? { ...c, isFlipped: true } : c))
    );
    setFlippedCards(prev => [...prev, id]);
  };

  const startGame = () => {
    playStartSound();
    vibrate([50, 30, 50]);
    setGameStarted(true);
    setGameOver(false);
    initializeGame();
  };

  const endGame = async () => {
    setGameOver(true);
    setGameStarted(false);
    playWinSound();
    vibrateWin();

    if (timerRef.current) clearInterval(timerRef.current);

    const basePoints = 100;
    const timeBonus = Math.max(0, 60 - timeElapsed) * 2;
    const moveBonus = Math.max(0, (cardEmojis.length * 2 - moves)) * 5;
    const totalPoints = basePoints + timeBonus + moveBonus;

    if (totalPoints > 0 && user?.id) {
      try {
        const currentBalance = gameStats?.zenBalance || 0;
        await import('../../services/gameService').then(({ GameService }) => {
          return GameService.updateGameStats(user.id!, {
            zenBalance: currentBalance + totalPoints
          });
        });

        success(`Congrats! Earned ${totalPoints} food points! 🍖`);
        refetch();
      } catch (err) {
        error('Failed to award food points');
      }
    }
  };

  const calculateScore = () => {
    const basePoints = 100;
    const timeBonus = Math.max(0, 60 - timeElapsed) * 2;
    const moveBonus = Math.max(0, (cardEmojis.length * 2 - moves)) * 5;
    return basePoints + timeBonus + moveBonus;
  };

  return (
    <div className="page-bg font-inter min-h-screen">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="space-y-6 md:space-y-8">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate('/game')}
              className="cute-button-outline px-4 py-2 flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Games
            </Button>
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-inter font-bold gradient-text">
                Memory Match
              </h1>
              <p className="text-gray-700 font-inter text-sm md:text-base">Match all the pairs! 🧠</p>
            </div>
            <div className="food-points">
              <span>🍖</span>
              <span className="font-inter font-bold">
                {gameStats?.zenBalance?.toLocaleString() || '0'}
              </span>
            </div>
          </div>

          <div className="cute-card p-4 md:p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="stat-card">
                  <div className="stat-value text-lg md:text-xl">{moves}</div>
                  <div className="stat-label">Moves</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value text-lg md:text-xl">{matches}/{cardEmojis.length}</div>
                  <div className="stat-label">Matches</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value text-lg md:text-xl flex items-center gap-1">
                    <Clock size={18} />
                    {timeElapsed}s
                  </div>
                  <div className="stat-label">Time</div>
                </div>
              </div>

              <div className="relative">
                <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-2xl mx-auto">
                  {cards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => handleCardClick(card.id)}
                      disabled={!gameStarted || !canFlip || card.isMatched}
                      className={`
                        aspect-square rounded-2xl flex items-center justify-center text-3xl md:text-5xl
                        transition-all duration-300 transform
                        ${card.isFlipped || card.isMatched
                          ? 'bg-gradient-to-br from-pink-400 to-purple-500 scale-100'
                          : 'bg-gradient-to-br from-blue-400 to-cyan-500 hover:scale-105'
                        }
                        ${card.isMatched ? 'opacity-60 scale-95' : ''}
                        shadow-lg hover:shadow-xl
                        disabled:cursor-not-allowed
                      `}
                      style={{
                        transform: card.isFlipped || card.isMatched ? 'rotateY(0deg)' : 'rotateY(0deg)',
                      }}
                    >
                      {card.isFlipped || card.isMatched ? (
                        <span className="animate-bounce-in">{card.emoji}</span>
                      ) : (
                        <span className="text-white">❓</span>
                      )}
                    </button>
                  ))}
                </div>

                {!gameStarted && !gameOver && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-3xl">
                    <div className="text-center space-y-4 cute-card p-6 md:p-8 mx-4">
                      <div className="text-6xl">🧠</div>
                      <h2 className="text-xl md:text-2xl font-inter font-bold text-gray-800">Memory Match</h2>
                      <p className="text-sm md:text-base text-gray-600 font-inter">
                        Flip cards and match pairs! Faster = more points!
                      </p>
                      <Button
                        onClick={startGame}
                        className="cute-button px-6 md:px-8 py-3"
                      >
                        <Play size={16} />
                        Start Game
                      </Button>
                    </div>
                  </div>
                )}

                {gameOver && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-3xl">
                    <div className="text-center space-y-4 cute-card p-6 md:p-8 mx-4">
                      <div className="text-4xl">🏆</div>
                      <h2 className="text-xl md:text-2xl font-inter font-bold text-gray-800">Perfect!</h2>
                      <div className="space-y-2">
                        <p className="text-base md:text-lg font-inter font-bold text-primary-500">
                          Time: {timeElapsed}s | Moves: {moves}
                        </p>
                        <p className="text-sm md:text-base text-gray-600 font-inter">
                          Earned: {calculateScore()} food points! 🍖
                        </p>
                      </div>
                      <Button
                        onClick={startGame}
                        className="cute-button px-6 py-3"
                      >
                        <RotateCcw size={16} />
                        Play Again
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="cute-card p-4">
                <h3 className="font-inter font-bold text-gray-800 mb-2">How to Play:</h3>
                <ul className="space-y-1 text-sm text-gray-700 font-inter">
                  <li>• Click cards to flip them and reveal the emoji</li>
                  <li>• Match all pairs to win the game</li>
                  <li>• Fewer moves and faster time = more points!</li>
                  <li>• Base reward: 100 points + time & move bonuses</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
