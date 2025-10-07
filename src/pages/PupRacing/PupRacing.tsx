import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, RotateCcw, Play, Zap } from 'lucide-react';
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

const playBoostSound = () => createSound(800, 0.1);
const playCollisionSound = () => createSound(150, 0.2, 'sawtooth');
const playWinSound = () => {
  createSound(523, 0.2);
  setTimeout(() => createSound(659, 0.2), 150);
  setTimeout(() => createSound(784, 0.2), 300);
  setTimeout(() => createSound(1047, 0.3), 450);
};
const playStartSound = () => {
  createSound(262, 0.15);
  setTimeout(() => createSound(330, 0.15), 150);
  setTimeout(() => createSound(392, 0.15), 300);
  setTimeout(() => createSound(523, 0.2), 450);
};

const vibrate = (pattern: number | number[]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

const vibrateBoost = () => vibrate(40);
const vibrateCollision = () => vibrate(100);
const vibrateWin = () => vibrate([100, 50, 100, 50, 200]);

interface Racer {
  id: number;
  name: string;
  emoji: string;
  position: number;
  speed: number;
  color: string;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const PupRacing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameStats, refetch } = useGame();
  const { success, error } = useToast();

  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [playerPosition, setPlayerPosition] = useState(50);
  const [racers, setRacers] = useState<Racer[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(5);
  const [boosts, setBoosts] = useState(3);
  const [countdown, setCountdown] = useState(3);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const distanceRef = useRef(0);
  const playerPosRef = useRef(50);
  const speedRef = useRef(5);
  const boostsRef = useRef(3);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const updateCanvasSize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const width = isMobile ? Math.min(container.clientWidth - 10, window.innerWidth - 10) : Math.min(600, container.clientWidth - 40);
    const height = isMobile ? Math.min(400, window.innerHeight - 300) : Math.min(500, window.innerHeight - 250);

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;
      keysPressed.current.add(e.key);

      if (e.key === ' ' && boostsRef.current > 0) {
        speedRef.current = 12;
        boostsRef.current--;
        setBoosts(boostsRef.current);
        playBoostSound();
        vibrateBoost();
        setTimeout(() => {
          speedRef.current = 5;
        }, 1000);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, gameOver]);

  const initializeRace = () => {
    const opponents: Racer[] = [
      { id: 1, name: 'Speed Pup', emoji: '🐕', position: 0, speed: 4.5, color: '#FF6B6B' },
      { id: 2, name: 'Fast Doggo', emoji: '🦮', position: 0, speed: 4.2, color: '#4ECDC4' },
      { id: 3, name: 'Zoom Pup', emoji: '🐕‍🦺', position: 0, speed: 4.8, color: '#95E1D3' },
    ];
    setRacers(opponents);
    setObstacles([]);
    setDistance(0);
    setSpeed(5);
    setBoosts(3);
    setPlayerPosition(50);
    distanceRef.current = 0;
    playerPosRef.current = 50;
    speedRef.current = 5;
    boostsRef.current = 3;
  };

  const startCountdown = async () => {
    setCountdown(3);

    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      createSound(440, 0.2);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    playStartSound();
    vibrate([50, 30, 50]);
    setGameStarted(true);
    setCountdown(0);
    animationFrameId.current = requestAnimationFrame(gameLoop);
  };

  const startGame = () => {
    initializeRace();
    setGameStarted(false);
    setGameOver(false);
    startCountdown();
  };

  const gameLoop = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < canvas.height; i += 40) {
      ctx.fillStyle = i % 80 === 0 ? '#7CCD7C' : '#90EE90';
      ctx.fillRect(0, i - (distanceRef.current % 40), canvas.width, 40);
    }

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    for (let i = 0; i < canvas.height; i += 40) {
      const y = i - (distanceRef.current % 40);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 2, y);
      ctx.lineTo(canvas.width / 2 - 2, y + 20);
      ctx.stroke();
    }

    if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a')) {
      playerPosRef.current = Math.max(15, playerPosRef.current - 5);
    }
    if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d')) {
      playerPosRef.current = Math.min(canvas.width - 15, playerPosRef.current + 5);
    }

    setPlayerPosition(playerPosRef.current);

    obstacles.forEach((obs, index) => {
      obs.y += speedRef.current;

      ctx.fillStyle = '#8B4513';
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      ctx.fillText('🪨', obs.x + obs.width / 4, obs.y + obs.height / 1.5);

      if (
        playerPosRef.current < obs.x + obs.width &&
        playerPosRef.current + 30 > obs.x &&
        canvas.height - 80 < obs.y + obs.height &&
        canvas.height - 50 > obs.y
      ) {
        playCollisionSound();
        vibrateCollision();
        speedRef.current = Math.max(2, speedRef.current - 1);
        obstacles.splice(index, 1);
      }

      if (obs.y > canvas.height) {
        obstacles.splice(index, 1);
      }
    });

    if (Math.random() < 0.02) {
      obstacles.push({
        x: Math.random() * (canvas.width - 40),
        y: -30,
        width: 40,
        height: 40,
      });
    }

    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🐕', playerPosRef.current, canvas.height - 60);

    distanceRef.current += speedRef.current;
    setDistance(Math.floor(distanceRef.current / 10));
    setSpeed(speedRef.current);

    racers.forEach((racer) => {
      racer.position += racer.speed + Math.random() * 0.5;
    });
    setRacers([...racers]);

    if (distanceRef.current >= 5000) {
      endGame(true);
      return;
    }

    animationFrameId.current = requestAnimationFrame(gameLoop);
  };

  const endGame = async (won: boolean) => {
    setGameOver(true);
    setGameStarted(false);

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }

    if (won) {
      playWinSound();
      vibrateWin();

      const basePoints = 200;
      const speedBonus = Math.floor(distance / 10);
      const totalPoints = basePoints + speedBonus;

      if (totalPoints > 0 && user?.id) {
        try {
          const currentBalance = gameStats?.zenBalance || 0;
          await import('../../services/gameService').then(({ GameService }) => {
            return GameService.updateGameStats(user.id!, {
              zenBalance: currentBalance + totalPoints
            });
          });

          success(`You Won! Earned ${totalPoints} food points! 🍖`);
          refetch();
        } catch (err) {
          error('Failed to award food points');
        }
      }
    }
  };

  const calculateScore = () => {
    const basePoints = 200;
    const speedBonus = Math.floor(distance / 10);
    return basePoints + speedBonus;
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
                Pup Racing
              </h1>
              <p className="text-gray-700 font-inter text-sm md:text-base">Race to the finish! 🏁</p>
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
                  <div className="stat-value text-lg md:text-xl">{distance}m</div>
                  <div className="stat-label">Distance</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value text-lg md:text-xl">{speed.toFixed(1)}x</div>
                  <div className="stat-label">Speed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value text-lg md:text-xl flex items-center gap-1">
                    <Zap size={18} className="text-yellow-500" />
                    {boosts}
                  </div>
                  <div className="stat-label">Boosts</div>
                </div>
              </div>

              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className="block mx-auto w-full max-w-full rounded-3xl border-4 border-primary-300"
                />

                {countdown > 0 && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-3xl">
                    <div className="text-9xl font-black text-white animate-pulse">
                      {countdown}
                    </div>
                  </div>
                )}

                {!gameStarted && !gameOver && countdown === 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-3xl">
                    <div className="text-center space-y-4 cute-card p-6 md:p-8 mx-4">
                      <div className="text-6xl">🏁</div>
                      <h2 className="text-xl md:text-2xl font-inter font-bold text-gray-800">Pup Racing</h2>
                      <p className="text-sm md:text-base text-gray-600 font-inter">
                        Race 500m! Use arrows or A/D to move. Space for boost!
                      </p>
                      <Button
                        onClick={startGame}
                        className="cute-button px-6 md:px-8 py-3"
                      >
                        <Play size={16} />
                        Start Race
                      </Button>
                    </div>
                  </div>
                )}

                {gameOver && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-3xl">
                    <div className="text-center space-y-4 cute-card p-6 md:p-8 mx-4">
                      <div className="text-4xl">🏆</div>
                      <h2 className="text-xl md:text-2xl font-inter font-bold text-gray-800">Finish Line!</h2>
                      <div className="space-y-2">
                        <p className="text-base md:text-lg font-inter font-bold text-primary-500">
                          Distance: {distance}m
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
                        Race Again
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="cute-card p-4">
                <h3 className="font-inter font-bold text-gray-800 mb-2">Controls:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700 font-inter">
                  <div>• Arrow Keys or A/D: Move left/right</div>
                  <div>• Spacebar: Speed boost (3x)</div>
                  <div>• Avoid obstacles to keep speed</div>
                  <div>• Reach 500m to win!</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
