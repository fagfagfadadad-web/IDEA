import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Zap, Play, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'components';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';

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
  // Happy collect sound - ascending notes
  createSound(523, 0.1); // C5
  setTimeout(() => createSound(659, 0.1), 50); // E5
  setTimeout(() => createSound(784, 0.15), 100); // G5
};

const playBonusSound = () => {
  // Special bonus sound - higher pitch
  createSound(880, 0.1); // A5
  setTimeout(() => createSound(1047, 0.1), 50); // C6
  setTimeout(() => createSound(1319, 0.2), 100); // E6
};

const playPoisonSound = () => {
  // Negative sound - descending low notes
  createSound(220, 0.2, 'sawtooth'); // A3
  setTimeout(() => createSound(185, 0.2, 'sawtooth'), 100); // F#3
  setTimeout(() => createSound(147, 0.3, 'sawtooth'), 200); // D3
};

const playExplosionSound = () => {
  // Explosion sound - noise burst
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
  // Game over sound - sad descending melody
  createSound(523, 0.3); // C5
  setTimeout(() => createSound(466, 0.3), 300); // Bb4
  setTimeout(() => createSound(415, 0.3), 600); // Ab4
  setTimeout(() => createSound(349, 0.5), 900); // F4
};

const playGameStartSound = () => {
  // Game start sound - uplifting melody
  createSound(262, 0.2); // C4
  setTimeout(() => createSound(330, 0.2), 200); // E4
  setTimeout(() => createSound(392, 0.2), 400); // G4
  setTimeout(() => createSound(523, 0.3), 600); // C5
};
// Game interfaces
// Vibration functions
const vibrate = (pattern: number | number[]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

const vibrateCollect = () => {
  vibrate(50); // Short vibration for collecting items
};

const vibrateBonus = () => {
  vibrate([100, 50, 100]); // Double vibration for bonus items
};

const vibratePoison = () => {
  vibrate([200, 100, 200]); // Longer vibration for negative items
};

const vibrateExplosion = () => {
  vibrate([300, 100, 300, 100, 300]); // Strong vibration pattern for explosion
};

const vibrateGameOver = () => {
  vibrate([500, 200, 500]); // Long vibration for game over
};

const vibrateGameStart = () => {
  vibrate([100, 50, 100, 50, 200]); // Welcoming vibration pattern
};

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

export const Game = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameStats, refetch } = useGame();
  const { success, error } = useToast();
  
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const gameTimeRef = useRef(60000); // 60 seconds
  const startTimeRef = useRef<number | null>(null);
  const gameSpeedRef = useRef(1);
  const fallingObjects = useRef<FallingObject[]>([]);
  const platform = useRef<Platform>({ x: 0, y: 0, width: 0, height: 0 });
  const explosions = useRef<Explosion[]>([]);
  const collectionEffects = useRef<CollectionEffect[]>([]);
  const bubbles = useRef<Bubble[]>([]);
  const lastSpawnTime = useRef(0);

  // Initialize canvas and platform
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
    const height = isMobile ? Math.min((window.innerHeight - 200) * 0.77, 400) : Math.min(460, window.innerHeight - 250);

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Update platform position
    const platformWidth = width * 0.15;
    const platformHeight = 20;
    platform.current = {
      x: width / 2 - platformWidth / 2,
      y: height - 40,
      width: platformWidth,
      height: platformHeight,
    };
  };

  // Platform movement
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

  // Game loop
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

    // Update timer
    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const elapsed = timestamp - startTimeRef.current;
    
    if (elapsed >= gameTimeRef.current && !gameOver) {
      endGame();
      return;
    }

    const remaining = Math.ceil((gameTimeRef.current - elapsed) / 1000);
    setRemainingSeconds(remaining);

    // Increase game speed over time - progressively faster
    const speedProgress = elapsed / gameTimeRef.current;
    gameSpeedRef.current = 1 + speedProgress * 4; // Speed increases from 1x to 5x
    setCurrentSpeed(gameSpeedRef.current);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw platform (dog bowl)
    // Draw platform (dog bowl image)
    const centerX = platform.current.x + platform.current.width / 2;
    const centerY = platform.current.y + platform.current.height / 2;
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🥣', centerX, centerY + 8);

    // Update and draw falling objects
    fallingObjects.current.forEach((obj, index) => {
      obj.y += obj.speed;

      // Draw object
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

      // Check collision with platform
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
          case 'poison':
            scoreRef.current = Math.max(0, scoreRef.current - 15);
            createExplosion(obj.x, obj.y);
            playPoisonSound();
            vibratePoison();
            break;
          case 'bomb':
            playExplosionSound();
            vibrateExplosion();
            setTimeout(() => playGameOverSound(), 500);
            endGame();
            return;
        }
        
        setScore(scoreRef.current);
        
        // Create celebration bubbles
        for (let i = 0; i < 5; i++) {
          bubbles.current.push({
            x: obj.x + 15,
            y: obj.y + 15,
            radius: Math.random() * 3 + 2,
            speedX: (Math.random() - 0.5) * 4,
            speedY: (Math.random() - 0.5) * 4,
            opacity: 1,
            color: obj.type === 'poison' ? '#ff0000' : '#ff69b4',
            frame: 0,
            maxFrame: 30,
          });
        }
      } else if (obj.y > canvas.height) {
        fallingObjects.current.splice(index, 1);
      }
    });

    // Draw explosions
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

    // Draw collection effects
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

    // Draw bubbles
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

    // Draw UI
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${scoreRef.current}`, 10, 25);
    ctx.fillText(`Time: ${remaining}s`, 10, 50);

    // Spawn objects
    spawnObject(timestamp);

    animationFrameId.current = requestAnimationFrame(gameLoop);
  };

  const startGame = () => {
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

    // Play game over sound if not already played (from bomb)
    if (!fallingObjects.current.some(obj => obj.type === 'bomb')) {
      playGameOverSound();
      vibrateGameOver();
    }
    // Award food points based on score
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
        refetch(); // Refresh game data
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate('/')}
              className="cute-button-outline px-4 py-2 flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back Home
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

          {/* Game Area */}
          <div className="cute-card p-4 md:p-6">
            <div className="space-y-3 md:space-y-4">
              {/* Game Stats */}
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

              {/* Game Canvas */}
              <div className="game-canvas-container">
                <canvas
                  ref={canvasRef}
                  className="block mx-auto cursor-none w-full max-w-full touch-none"
                  style={{ background: 'linear-gradient(to bottom, #4a5568, #2d3748, #1a202c)' }}
                />
                
                {/* Game Overlays */}
                {!gameStarted && !gameOver && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-3xl">
                    <div className="text-center space-y-4 cute-card p-4 md:p-8 mx-4">
                      <div className="text-6xl">🐕</div>
                      <h2 className="text-xl md:text-2xl font-inter font-bold text-gray-800">PupFi Catcher</h2>
                      <p className="text-sm md:text-base text-gray-600 font-inter">Help your pup catch treats and avoid poison! Speed increases over time!</p>
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
                    <div className="text-center space-y-4 cute-card p-4 md:p-8 mx-4">
                      <div className="text-4xl">🏆</div>
                      <h2 className="text-xl md:text-2xl font-inter font-bold text-gray-800">Game Over!</h2>
                      <div className="space-y-2">
                        <p className="text-base md:text-lg font-inter font-bold text-primary-500">Final Score: {score}</p>
                        <p className="text-sm md:text-base text-gray-600 font-inter">Food Earned: {score} 🍖</p>
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

              {/* Game Instructions */}
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
                    <div className="text-2xl mb-1">☠️</div>
                    <div className="text-gray-700 font-inter">Poison: -15 pts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">💣</div>
                    <div className="text-gray-700 font-inter">Bomb: Game Over</div>
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