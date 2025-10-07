import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, RotateCcw, Play, Clock, Shuffle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'components';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { GameService } from '../../services/gameService';

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

const playMoveSound = () => createSound(400, 0.08);
const playSolvedSound = () => {
  createSound(523, 0.2);
  setTimeout(() => createSound(659, 0.2), 150);
  setTimeout(() => createSound(784, 0.2), 300);
  setTimeout(() => createSound(1047, 0.3), 450);
};
const playStartSound = () => {
  createSound(349, 0.15);
  setTimeout(() => createSound(440, 0.15), 150);
  setTimeout(() => createSound(523, 0.2), 300);
};

const vibrate = (pattern: number | number[]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

const vibrateMove = () => vibrate(25);
const vibrateSolved = () => vibrate([100, 50, 100, 50, 200]);

interface Tile {
  value: number;
  position: number;
}

const GRID_SIZE = 4;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

const dogEmojis = ['🐕', '🦴', '🐾', '🥩', '🎾', '🦮', '🐕‍🦺', '🌭', '🏠', '💕', '⭐', '🎉', '🔥', '💎', '🎈'];

export const PupPuzzle = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameStats, refetch } = useGame();
  const { success, error } = useToast();

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [emptyPosition, setEmptyPosition] = useState(TOTAL_TILES - 1);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [canPlayGame, setCanPlayGame] = useState(false);
  const [needsTicket, setNeedsTicket] = useState(false);
  const [hasTicket, setHasTicket] = useState(false);
  const [checkingTickets, setCheckingTickets] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const initializePuzzle = () => {
    const initialTiles: Tile[] = Array.from({ length: TOTAL_TILES - 1 }, (_, i) => ({
      value: i + 1,
      position: i,
    }));

    let shuffled = [...initialTiles];
    let currentEmpty = TOTAL_TILES - 1;

    for (let i = 0; i < 200; i++) {
      const validMoves = getValidMoves(currentEmpty, TOTAL_TILES);
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];

      const tileAtRandomMove = shuffled.find(t => t.position === randomMove);
      if (tileAtRandomMove) {
        tileAtRandomMove.position = currentEmpty;
        currentEmpty = randomMove;
      }
    }

    setTiles(shuffled);
    setEmptyPosition(currentEmpty);
    setMoves(0);
    setTimeElapsed(0);
  };

  useEffect(() => {
    initializePuzzle();
  }, []);

  useEffect(() => {
    const checkGameAccess = async () => {
      if (!user?.id) return;

      setCheckingTickets(true);
      try {
        const result = await GameService.canPlayGame(user.id, 'puzzle');
        setCanPlayGame(result.canPlay);
        setNeedsTicket(result.needsTicket);
        setHasTicket(result.hasTicket);
      } catch (err) {
        console.error('Error checking game access:', err);
        setCanPlayGame(false);
      } finally {
        setCheckingTickets(false);
      }
    };

    checkGameAccess();
  }, [user?.id]);

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

  const getValidMoves = (emptyPos: number, totalLength: number) => {
    const validMoves: number[] = [];
    const row = Math.floor(emptyPos / GRID_SIZE);
    const col = emptyPos % GRID_SIZE;

    if (col > 0) validMoves.push(emptyPos - 1);
    if (col < GRID_SIZE - 1) validMoves.push(emptyPos + 1);
    if (row > 0) validMoves.push(emptyPos - GRID_SIZE);
    if (row < GRID_SIZE - 1) validMoves.push(emptyPos + GRID_SIZE);

    return validMoves;
  };

  const handleTileClick = (position: number) => {
    if (!gameStarted || gameOver) return;

    const validMoves = getValidMoves(emptyPosition, tiles.length);
    if (!validMoves.includes(position)) return;

    playMoveSound();
    vibrateMove();

    const newTiles = [...tiles];
    const clickedTileIndex = tiles.findIndex(t => t.position === position);
    const emptyTileIndex = emptyPosition;

    if (clickedTileIndex === -1) return;

    const temp = newTiles[emptyTileIndex];
    newTiles[emptyTileIndex] = newTiles[clickedTileIndex];
    newTiles[clickedTileIndex] = temp;

    newTiles[emptyTileIndex].position = emptyTileIndex;
    if (newTiles[clickedTileIndex]) {
      newTiles[clickedTileIndex].position = clickedTileIndex;
    }

    setTiles(newTiles);
    setEmptyPosition(clickedTileIndex);
    setMoves(prev => prev + 1);

    if (checkWin(newTiles)) {
      endGame();
    }
  };

  const checkWin = (currentTiles: Tile[]) => {
    for (let i = 0; i < currentTiles.length; i++) {
      if (currentTiles[i].value !== i + 1) return false;
    }
    return true;
  };

  const startGame = async () => {
    if (!canPlayGame || !user?.id) return;

    try {
      if (needsTicket) {
        await GameService.useTicket(user.id, 'puzzle');
      } else {
        await GameService.recordGamePlay(user.id, 'puzzle');
      }
      refetch();
    } catch (err) {
      error('Failed to start game');
      return;
    }

    playStartSound();
    vibrate([50, 30, 50]);
    setGameStarted(true);
    setGameOver(false);
    initializePuzzle();
  };

  const endGame = async () => {
    setGameOver(true);
    setGameStarted(false);
    playSolvedSound();
    vibrateSolved();

    if (timerRef.current) clearInterval(timerRef.current);

    const basePoints = 150;
    const timeBonus = Math.max(0, 120 - timeElapsed) * 2;
    const moveBonus = Math.max(0, (100 - moves)) * 3;
    const totalPoints = Math.max(50, basePoints + timeBonus + moveBonus);

    if (totalPoints > 0 && user?.id) {
      try {
        const currentBalance = gameStats?.zenBalance || 0;
        await import('../../services/gameService').then(({ GameService }) => {
          return GameService.updateGameStats(user.id!, {
            zenBalance: currentBalance + totalPoints
          });
        });

        success(`Puzzle Solved! Earned ${totalPoints} food points! 🍖`);
        refetch();
      } catch (err) {
        error('Failed to award food points');
      }
    }
  };

  const calculateScore = () => {
    const basePoints = 150;
    const timeBonus = Math.max(0, 120 - timeElapsed) * 2;
    const moveBonus = Math.max(0, (100 - moves)) * 3;
    return Math.max(50, basePoints + timeBonus + moveBonus);
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
                Pup Puzzle
              </h1>
              <p className="text-gray-700 font-inter text-sm md:text-base">Solve the sliding puzzle! 🧩</p>
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
                  <div className="stat-value text-lg md:text-xl flex items-center gap-1">
                    <Clock size={18} />
                    {timeElapsed}s
                  </div>
                  <div className="stat-label">Time</div>
                </div>
              </div>

              <div className="relative">
                <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
                  {Array.from({ length: TOTAL_TILES }).map((_, index) => {
                    const tile = tiles.find(t => t.position === index);
                    const isEmpty = index === emptyPosition || !tile;

                    return (
                      <button
                        key={index}
                        onClick={() => handleTileClick(index)}
                        disabled={!gameStarted || isEmpty}
                        className={`
                          aspect-square rounded-xl flex items-center justify-center text-2xl md:text-4xl font-bold
                          transition-all duration-200 transform
                          ${isEmpty
                            ? 'bg-gray-200 cursor-default'
                            : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg hover:scale-105 hover:shadow-xl cursor-pointer'
                          }
                          disabled:cursor-not-allowed
                        `}
                      >
                        {!isEmpty && (
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-3xl md:text-5xl">{dogEmojis[(tile.value - 1) % dogEmojis.length]}</span>
                            <span className="text-xs md:text-sm font-bold text-white/70 mt-1">{tile.value}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {!gameStarted && !gameOver && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-3xl p-2">
                    <div className="text-center space-y-2 cute-card p-3 mx-2 max-w-xs w-full max-h-[80vh] overflow-y-auto">
                      <div className="text-3xl">🧩</div>
                      <h2 className="text-base font-inter font-bold text-gray-800">Pup Puzzle</h2>

                      {checkingTickets ? (
                        <div className="text-gray-600 font-inter text-xs">Checking...</div>
                      ) : (
                        <>
                          {needsTicket && (
                            <div className="bg-yellow-50 border border-yellow-400 p-2 rounded-lg">
                              <p className="text-yellow-800 font-inter font-bold text-xs">🎫 Daily Play Used</p>
                              <p className="text-yellow-700 text-xs font-inter">
                                {hasTicket ? `Have ${gameStats?.gameTickets || 0} tickets` : 'Need ticket'}
                              </p>
                            </div>
                          )}

                          {!needsTicket && (
                            <div className="bg-green-50 border border-green-400 p-2 rounded-lg">
                              <p className="text-green-800 font-inter font-bold text-xs">✨ Free Play</p>
                              <p className="text-green-700 text-xs font-inter">Tickets: {gameStats?.gameTickets || 0}</p>
                            </div>
                          )}
                        </>
                      )}

                      <div className="text-left space-y-0.5 text-xs text-gray-700 font-inter bg-blue-50 p-2 rounded-lg">
                        <p className="font-bold text-gray-800">How to Play:</p>
                        <p>• Click tiles next to empty</p>
                        <p>• Arrange by numbers (1-15)</p>
                        <p>• Faster = more points</p>
                      </div>

                      <Button
                        onClick={startGame}
                        disabled={!canPlayGame || checkingTickets}
                        className="cute-button px-4 py-2 w-full text-sm"
                      >
                        <Play size={14} />
                        {checkingTickets ? 'Loading...' : canPlayGame ? 'Start Game' : 'Need Tickets'}
                      </Button>
                    </div>
                  </div>
                )}

                {gameOver && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-3xl">
                    <div className="text-center space-y-4 cute-card p-6 md:p-8 mx-4">
                      <div className="text-4xl">🎉</div>
                      <h2 className="text-xl md:text-2xl font-inter font-bold text-gray-800">Puzzle Solved!</h2>
                      <div className="space-y-2">
                        <p className="text-base md:text-lg font-inter font-bold text-primary-500">
                          Time: {timeElapsed}s | Moves: {moves}
                        </p>
                        <p className="text-sm md:text-base text-gray-600 font-inter">
                          Earned: {calculateScore()} food points! 🍖
                        </p>
                      </div>
                      <Button
                        onClick={async () => {
                          setGameOver(false);
                          if (user?.id) {
                            try {
                              const result = await GameService.canPlayGame(user.id, 'puzzle');
                              setCanPlayGame(result.canPlay);
                              setNeedsTicket(result.needsTicket);
                              setHasTicket(result.hasTicket);
                            } catch (err) {
                              console.error('Error checking game access:', err);
                            }
                          }
                        }}
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
                  <li>• Click tiles next to the empty space</li>
                  <li>• Arrange emojis by numbers (1, 2, 3...)</li>
                  <li>• Faster and fewer moves = more points!</li>
                  <li>• Reward: 150 points + time & move bonuses</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
