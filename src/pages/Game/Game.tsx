import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Zap, Play, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'components';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';

// Game interfaces
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
  const [gameSpeed, setGameSpeed] = useState(1);
  
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

    const width = Math.min(600, container.clientWidth - 40);
    const height = Math.min(400, window.innerHeight - 300);

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
    
    const spawnInterval = Math.max(800, 1500 - gameSpeedRef.current * 200);
    if (timestamp - lastSpawnTime.current < spawnInterval) return;
    if (fallingObjects.current.length >= 4) return;
    
    lastSpawnTime.current = timestamp;

    const canvas = canvasRef.current;
    const objectSize = 30;
    const x = Math.random() * (canvas.width - objectSize);

    fallingObjects.current.push({
      id: Date.now() + Math.random(),
      x,
      y: -objectSize,
      type: generateObjectType(),
      speed: 2 + gameSpeedRef.current,
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

    // Increase game speed over time
    gameSpeedRef.current = 1 + (elapsed / gameTimeRef.current) * 2;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw platform (dog bowl)
    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(platform.current.x, platform.current.y, platform.current.width, platform.current.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🥣', platform.current.x + platform.current.width / 2, platform.current.y + 15);

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
            scoreRef.current += 10;
            createCollectionEffect(obj.x, obj.y, 10);
            break;
          case 'doubleTreat':
            scoreRef.current += 25;
            createCollectionEffect(obj.x, obj.y, 25);
            break;
          case 'poison':
            scoreRef.current = Math.max(0, scoreRef.current - 15);
            createExplosion(obj.x, obj.y);
            break;
          case 'bomb':
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
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 font-inter">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                fontSize: `${12 + Math.random() * 8}px`,
                color: ['#ff69b4', '#ec4899', '#d946ef', '#fbbf24'][Math.floor(Math.random() * 4)]
              }}
            >
              {['🦴', '🥩', '🍖', '💖', '⭐'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate('/')}
              className="bg-white/70 text-pink-600 border border-pink-300 hover:bg-pink-100 px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back Home
            </Button>
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                Treat Catcher
              </h1>
              <p className="text-gray-700">Help your dog catch falling treats! 🦴</p>
            </div>
            <div className="flex items-center gap-2 bg-white/70 px-4 py-2 rounded-lg border border-pink-300">
              <span className="text-pink-500">🍖</span>
              <span className="text-pink-600 font-bold">
                {gameStats?.zenBalance?.toLocaleString() || '0'}
              </span>
            </div>
          </div>

          {/* Game Area */}
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-pink-300/40 shadow-lg">
            <div className="space-y-4">
              {/* Game Stats */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-600">{score}</div>
                    <div className="text-gray-600 text-sm">Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{remainingSeconds}s</div>
                    <div className="text-gray-600 text-sm">Time Left</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">Speed: {gameSpeed.toFixed(1)}x</div>
                  <div className="text-gray-600 text-sm">Game Speed</div>
                </div>
              </div>

              {/* Game Canvas */}
              <div className="relative bg-gradient-to-b from-blue-200 to-green-200 rounded-xl overflow-hidden border-2 border-pink-300">
                <canvas
                  ref={canvasRef}
                  className="block mx-auto cursor-none"
                  style={{ background: 'linear-gradient(to bottom, #e0f2fe, #f0f9ff)' }}
                />
                
                {/* Game Overlays */}
                {!gameStarted && !gameOver && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="text-6xl">🐕</div>
                      <h2 className="text-2xl font-bold text-white">Treat Catcher</h2>
                      <p className="text-white">Help your dog catch treats and avoid poison!</p>
                      <Button
                        onClick={startGame}
                        className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-xl font-bold"
                      >
                        <Play size={16} />
                        Start Game
                      </Button>
                    </div>
                  </div>
                )}

                {gameOver && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <div className="text-center space-y-4 bg-white/90 p-8 rounded-xl">
                      <div className="text-4xl">🏆</div>
                      <h2 className="text-2xl font-bold text-gray-800">Game Over!</h2>
                      <div className="space-y-2">
                        <p className="text-lg font-bold text-pink-600">Final Score: {score}</p>
                        <p className="text-gray-600">Food Points Earned: {score} 🍖</p>
                      </div>
                      <Button
                        onClick={startGame}
                        className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-bold"
                      >
                        <RotateCcw size={16} />
                        Play Again
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Game Instructions */}
              <div className="bg-pink-50/50 rounded-xl p-4 border border-pink-200">
                <h3 className="font-bold text-gray-800 mb-2">How to Play:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-center">
                    <div className="text-2xl mb-1">🦴</div>
                    <div className="text-gray-700">Bone: +10 pts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">🥩</div>
                    <div className="text-gray-700">Meat: +25 pts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">☠️</div>
                    <div className="text-gray-700">Poison: -15 pts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">💣</div>
                    <div className="text-gray-700">Bomb: Game Over</div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-3 text-center">
                  Move your mouse or finger to control the dog bowl. Earn food points = score
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};