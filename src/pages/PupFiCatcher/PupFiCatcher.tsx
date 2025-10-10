import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Zap, Play, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'components';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { GameService } from '../../services/gameService';

// Sound effects using Web Audio API
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

const playCollectSound = () => {
  createSound(523, 0.1);
  setTimeout(() => createSound(659, 0.1), 50);
  setTimeout(() => createSound(784, 0.15), 100);
};

const playBonusSound = () => {
  createSound(880, 0.1);
  setTimeout(() => createSound(1047, 0.1), 50);
  setTimeout(() => createSound(1319, 0.2), 100);
};

const playPoisonSound = () => {
  createSound(220, 0.2, 'sawtooth');
  setTimeout(() => createSound(185, 0.2, 'sawtooth'), 100);
  setTimeout(() => createSound(147, 0.3, 'sawtooth'), 200);
};

const playExplosionSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const bufferSize = audioContext.sampleRate * 0.3;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const output = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const whiteNoise = audioContext.createBufferSource();
  whiteNoise.buffer = buffer;

  const gainNode = audioContext.createGain();
  whiteNoise.connect(gainNode);
  gainNode.connect(audioContext.destination);

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

  whiteNoise.start();
};

const playGameOverSound = () => {
  createSound(523, 0.3);
  setTimeout(() => createSound(466, 0.3), 300);
  setTimeout(() => createSound(415, 0.3), 600);
  setTimeout(() => createSound(349, 0.5), 900);
};

const playGameStartSound = () => {
  createSound(262, 0.2);
  setTimeout(() => createSound(330, 0.2), 200);
  setTimeout(() => createSound(392, 0.2), 400);
  setTimeout(() => createSound(523, 0.3), 600);
};

const vibrate = (pattern: number | number[]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

const vibrateCollect = () => vibrate(50);
const vibrateBonus = () => vibrate([100, 50, 100]);
const vibratePoison = () => vibrate([200, 100, 200]);
const vibrateExplosion = () => vibrate([300, 100, 300, 100, 300]);
const vibrateGameOver = () => vibrate([500, 200, 500]);
const vibrateGameStart = () => vibrate([100, 50, 100, 50, 200]);

interface FallingObject {
  id: number;
  x: number;
  y: number;
  type: "treat" | "doubleTreat" | "poison" | "bomb";
  speed: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Explosion {
  x: number;
  y: number;
  size: number;
  frame: number;
  maxFrame: number;
}

interface CollectionEffect {
  x: number;
  y: number;
  frame: number;
  maxFrame: number;
  value: number;
}

interface Bubble {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  frame: number;
  maxFrame: number;
}

export const PupFiCatcher = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameStats, refetch } = useGame();
  const { success, error } = useToast();

  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [canPlayGame, setCanPlayGame] = useState(false);
  const [needsTicket, setNeedsTicket] = useState(false);
  const [hasTicket, setHasTicket] = useState(false);
  const [checkingTickets, setCheckingTickets] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const gameTimeRef = useRef(60000);
  const startTimeRef = useRef<number | null>(null);
  const gameSpeedRef = useRef(1);
  const fallingObjects = useRef<FallingObject[]>([]);
  const platform = useRef<Platform>({ x: 0, y: 0, width: 0, height: 0 });
  const explosions = useRef<Explosion[]>([]);
  const collectionEffects = useRef<CollectionEffect[]>([]);
  const bubbles = useRef<Bubble[]>([]);
  const lastSpawnTime = useRef(0);

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
    const width = isMobile ? window.innerWidth - 32 : Math.min(800, container.clientWidth - 40);
    const height = 520;

    canvas.width = width;
    canvas.height = height;

    const platformWidth = width * 0.15;
    const platformHeight = 20;
    platform.current = {
      x: width / 2 - platformWidth / 2,
      y: height - 40,
      width: platformWidth,
      height: platformHeight,
    };
  };

  useEffect(() => {
    const checkGameAccess = async () => {
      if (!user?.id) return;

      setCheckingTickets(true);
      try {
        const result = await GameService.canPlayGame(user.id, 'pupfi-catcher');
        console.log('PupFi Catcher access check:', result);
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
  }, [user?.id, gameStats?.gameTickets]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!gameStarted || gameOver) return;
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      let clientX;
      if (e instanceof MouseEvent) {
        clientX = e.clientX;
      } else {
        clientX = e.touches[0].clientX;
      }

      const x = clientX - rect.left - platform.current.width / 2;
      platform.current.x = Math.max(0, Math.min(x, canvas.width - platform.current.width));
    };

    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', handleMove, { passive: false });

    return () => {
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('touchmove', handleMove);
    };
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameStarted, gameOver]);

  const generateObjectType = (): "treat" | "doubleTreat" | "poison" | "bomb" => {
    const random = Math.random();
    if (random < 0.15) return "bomb";
    if (random < 0.25) return "poison";
    if (random < 0.4) return "doubleTreat";
    return "treat";
  };

  const spawnObject = (timestamp: number) => {
    if (!gameStarted || !canvasRef.current) return;

    const spawnInterval = Math.max(600, 1200 - gameSpeedRef.current * 250);
    if (timestamp - lastSpawnTime.current < spawnInterval) return;
    if (fallingObjects.current.length >= 5) return;

    lastSpawnTime.current = timestamp;

    const canvas = canvasRef.current;
    const objectSize = 30;
    const x = Math.random() * (canvas.width - objectSize);

    fallingObjects.current.push({
      id: Date.now() + Math.random(),
      x,
      y: -objectSize,
      type: generateObjectType(),
      speed: 3 + gameSpeedRef.current * 1.2,
    });
  };

  const createExplosion = (x: number, y: number) => {
    explosions.current.push({ x, y, size: 50, frame: 0, maxFrame: 30 });
  };

  const createCollectionEffect = (x: number, y: number, value: number) => {
    collectionEffects.current.push({ x, y, frame: 0, maxFrame: 60, value });
  };

  const gameLoop = (timestamp: number) => {
    if (!gameStarted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const elapsed = timestamp - startTimeRef.current;

    if (elapsed >= gameTimeRef.current && !gameOver) {
      endGame();
      return;
    }

    const remaining = Math.ceil((gameTimeRef.current - elapsed) / 1000);
    setRemainingSeconds(remaining);

    const speedProgress = elapsed / gameTimeRef.current;
    gameSpeedRef.current = 1 + speedProgress * 4;
    setCurrentSpeed(gameSpeedRef.current);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw platform (dog bowl) with beautiful blue design
    console.log('🎨 Drawing blue bowl - Version 3.0');
    const bowlX = platform.current.x;
    const bowlY = platform.current.y;
    const bowlWidth = platform.current.width;
    const bowlHeight = platform.current.height;

    // Draw bowl shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(bowlX + 2, bowlY + bowlHeight, bowlWidth - 4, 3);

    // Draw bowl body (blue gradient)
    const gradient = ctx.createLinearGradient(bowlX, bowlY, bowlX, bowlY + bowlHeight);
    gradient.addColorStop(0, '#60a5fa');
    gradient.addColorStop(1, '#3b82f6');
    ctx.fillStyle = gradient;

    // Draw trapezoid bowl shape
    ctx.beginPath();
    ctx.moveTo(bowlX + bowlWidth * 0.2, bowlY);
    ctx.lineTo(bowlX + bowlWidth * 0.8, bowlY);
    ctx.lineTo(bowlX + bowlWidth, bowlY + bowlHeight);
    ctx.lineTo(bowlX, bowlY + bowlHeight);
    ctx.closePath();
    ctx.fill();

    // Draw bowl rim (darker blue)
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw white paw print on bowl
    const pawX = bowlX + bowlWidth / 2;
    const pawY = bowlY + bowlHeight / 2;

    // Main pad
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.ellipse(pawX, pawY + 2, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Toes
    const toePositions = [
      { x: pawX - 4, y: pawY - 3 },
      { x: pawX, y: pawY - 4 },
      { x: pawX + 4, y: pawY - 3 }
    ];

    toePositions.forEach(pos => {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    fallingObjects.current.forEach((obj, index) => {
      obj.y += obj.speed;

      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      let emoji = '';
      switch (obj.type) {
        case 'treat':
          emoji = '🦴';
          break;
        case 'doubleTreat':
          emoji = '🥩';
          break;
        case 'poison':
          emoji = '☠️';
          break;
        case 'bomb':
          emoji = '💣';
          break;
      }
      ctx.fillText(emoji, obj.x + 15, obj.y + 20);

      if (
        obj.y + 30 >= platform.current.y &&
        obj.x + 30 > platform.current.x &&
        obj.x < platform.current.x + platform.current.width
      ) {
        fallingObjects.current.splice(index, 1);

        switch (obj.type) {
          case 'treat':
            scoreRef.current += 5;
            createCollectionEffect(obj.x, obj.y, 5);
            playCollectSound();
            vibrateCollect();
            break;
          case 'doubleTreat':
            scoreRef.current += 15;
            createCollectionEffect(obj.x, obj.y, 15);
            playBonusSound();
            vibrateBonus();
            break;
          case 'bomb':
            scoreRef.current = Math.max(0, scoreRef.current - 15);
            createExplosion(obj.x, obj.y);
            playExplosionSound();
            vibrateExplosion();
            break;
          case 'poison':
            playPoisonSound();
            vibratePoison();
            setTimeout(() => playGameOverSound(), 500);
            endGame();
            return;
        }

        setScore(scoreRef.current);

        for (let i = 0; i < 5; i++) {
          bubbles.current.push({
            x: obj.x + 15,
            y: obj.y + 15,
            radius: Math.random() * 3 + 2,
            speedX: (Math.random() - 0.5) * 4,
            speedY: (Math.random() - 0.5) * 4,
            opacity: 1,
            color: obj.type === 'bomb' ? '#ff0000' : '#ff69b4',
            frame: 0,
            maxFrame: 30,
          });
        }
      } else if (obj.y > canvas.height) {
        fallingObjects.current.splice(index, 1);
      }
    });

    explosions.current.forEach((explosion, index) => {
      explosion.frame++;
      const progress = explosion.frame / explosion.maxFrame;
      const size = explosion.size * (1 - progress);

      ctx.fillStyle = `rgba(255, 0, 0, ${1 - progress})`;
      ctx.beginPath();
      ctx.arc(explosion.x + 15, explosion.y + 15, size / 2, 0, Math.PI * 2);
      ctx.fill();

      if (explosion.frame >= explosion.maxFrame) {
        explosions.current.splice(index, 1);
      }
    });

    collectionEffects.current.forEach((effect, index) => {
      effect.frame++;
      const progress = effect.frame / effect.maxFrame;

      ctx.fillStyle = `rgba(255, 215, 0, ${1 - progress})`;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`+${effect.value}`, effect.x + 15, effect.y - progress * 30);

      if (effect.frame >= effect.maxFrame) {
        collectionEffects.current.splice(index, 1);
      }
    });

    bubbles.current.forEach((bubble, index) => {
      bubble.frame++;
      const progress = bubble.frame / bubble.maxFrame;
      bubble.x += bubble.speedX;
      bubble.y += bubble.speedY;
      bubble.opacity = 1 - progress;

      ctx.fillStyle = `${bubble.color}${Math.floor(bubble.opacity * 255).toString(16).padStart(2, '0')}`;
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
      ctx.fill();

      if (bubble.frame >= bubble.maxFrame) {
        bubbles.current.splice(index, 1);
      }
    });

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${scoreRef.current}`, 10, 25);
    ctx.fillText(`Time: ${remaining}s`, 10, 50);

    spawnObject(timestamp);

    animationFrameId.current = requestAnimationFrame(gameLoop);
  };

  const startGame = async () => {
    if (!canPlayGame || !user?.id) return;

    try {
      if (needsTicket) {
        await GameService.useTicket(user.id, 'pupfi-catcher');
      } else {
        await GameService.recordGamePlay(user.id, 'pupfi-catcher');
      }
      refetch();
    } catch (err) {
      error('Failed to start game');
      return;
    }

    playGameStartSound();
    vibrateGameStart();
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setRemainingSeconds(60);
    scoreRef.current = 0;
    gameSpeedRef.current = 1;
    startTimeRef.current = null;
    fallingObjects.current = [];
    explosions.current = [];
    collectionEffects.current = [];
    bubbles.current = [];
    lastSpawnTime.current = 0;

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }

    animationFrameId.current = requestAnimationFrame(gameLoop);
  };

  const endGame = async () => {
    setGameOver(true);
    setGameStarted(false);

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }

    if (!fallingObjects.current.some(obj => obj.type === 'bomb')) {
      playGameOverSound();
      vibrateGameOver();
    }

    const foodPointsEarned = scoreRef.current;
    if (foodPointsEarned > 0 && user?.id) {
      try {
        const currentBalance = gameStats?.zenBalance || 0;
        await import('../../services/gameService').then(({ GameService }) => {
          return GameService.updateGameStats(user.id!, {
            zenBalance: currentBalance + foodPointsEarned
          });
        });

        success(`Game Over! Earned ${foodPointsEarned} food points! 🍖`);
        refetch();
      } catch (err) {
        error('Failed to award food points');
      }
    } else {
      success('Game Over! Try to catch more treats next time! 🐕');
    }
  };

  return (
    <div className="page-bg font-inter">
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
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
                PupFi Catcher
              </h1>
              <p className="text-gray-700 font-inter">Help your pup catch falling treats! 🦴</p>
            </div>
            <div className="food-points">
              <span>🍖</span>
              <span className="font-inter font-bold">
                {gameStats?.zenBalance?.toLocaleString() || '0'}
              </span>
            </div>
          </div>

          <div className="cute-card p-4 md:p-6">
            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="stat-card">
                    <div className="stat-value text-lg md:text-xl">{score}</div>
                    <div className="stat-label">Score</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value text-lg md:text-xl">{remainingSeconds}s</div>
                    <div className="stat-label">Time Left</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-value text-lg md:text-xl">{currentSpeed.toFixed(1)}x</div>
                  <div className="stat-label">Speed</div>
                </div>
              </div>

              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className="block mx-auto cursor-none touch-none rounded-3xl border-4 border-primary-300"
                  style={{ width: '100%', height: '520px', maxWidth: '800px', background: '#a67c52' }}
                />

                {!gameStarted && !gameOver && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-3xl p-2">
                    <div className="text-center space-y-4 cute-card p-6 mx-2 max-w-xs w-full">
                      <div className="text-5xl">🐕</div>
                      <h2 className="text-2xl font-inter font-bold text-gray-800">PupFi Catcher</h2>

                      {checkingTickets ? (
                        <div className="text-gray-600 font-inter text-sm">Checking...</div>
                      ) : (
                        <>
                          {needsTicket && (
                            <div style={{ background: '#7C3AED' }} className="border border-purple-400 p-3 rounded-lg">
                              <p className="text-white font-inter font-bold text-sm">🎫 Daily Play Used</p>
                              <p className="text-white/90 text-sm font-inter">
                                {hasTicket ? `Have ${gameStats?.gameTickets || 0} tickets` : 'Need ticket'}
                              </p>
                            </div>
                          )}

                          {!needsTicket && (
                            <div style={{ background: '#7C3AED' }} className="border border-purple-400 p-3 rounded-lg">
                              <p className="text-white font-inter font-bold text-sm">✨ Free Play</p>
                              <p className="text-white/90 text-sm font-inter">Tickets: {gameStats?.gameTickets || 0}</p>
                            </div>
                          )}
                        </>
                      )}

                      <Button
                        onClick={startGame}
                        disabled={!canPlayGame || checkingTickets}
                        className="cute-button px-6 py-3 w-full text-lg"
                      >
                        <Play size={20} />
                        {checkingTickets ? 'Loading...' : canPlayGame ? 'Start Game' : 'Need Tickets'}
                      </Button>
                    </div>
                  </div>
                )}

                {gameOver && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-3xl">
                    <div className="text-center space-y-4 cute-card p-4 md:p-8 mx-4">
                      <div className="text-4xl">🏆</div>
                      <h2 className="text-xl md:text-2xl font-inter font-bold text-gray-800">Game Over!</h2>
                      <div className="space-y-2">
                        <p className="text-base md:text-lg font-inter font-bold text-primary-500">Final Score: {score}</p>
                        <p className="text-sm md:text-base text-gray-600 font-inter">Food Earned: {score} 🍖</p>
                      </div>
                      <Button
                        onClick={async () => {
                          setGameOver(false);
                          if (user?.id) {
                            try {
                              const result = await GameService.canPlayGame(user.id, 'pupfi-catcher');
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-center">
                    <div className="text-2xl mb-1">🦴</div>
                    <div className="text-gray-700 font-inter">Bone: +5 pts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">🥩</div>
                    <div className="text-gray-700 font-inter">Meat: +15 pts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">💣</div>
                    <div className="text-gray-700 font-inter">Bomb: -15 pts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">☠️</div>
                    <div className="text-gray-700 font-inter">Poison: Game Over</div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-3 text-center font-inter">
                  Move your mouse or finger to control the dog bowl. Earn food = score
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
