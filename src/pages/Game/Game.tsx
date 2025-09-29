import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Zap, Play, RotateCcw, Star, Heart } from 'lucide-react';
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
  type: "treat" | "doubleTreat" | "poison" | "bomb" | "superTreat" | "heart" | "star";
  speed: number;
  rotation?: number;
  scale?: number;
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
  type: string;
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

interface PowerUp {
  type: string;
  duration: number;
  startTime: number;
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
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [lives, setLives] = useState(3);
  const [specialEffects, setSpecialEffects] = useState<string[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const livesRef = useRef(3);
  const gameTimeRef = useRef(60000); // 60 seconds
  const startTimeRef = useRef<number | null>(null);
  const gameSpeedRef = useRef(1);
  const fallingObjects = useRef<FallingObject[]>([]);
  const platform = useRef<Platform>({ x: 0, y: 0, width: 0, height: 0 });
  const explosions = useRef<Explosion[]>([]);
  const collectionEffects = useRef<CollectionEffect[]>([]);
  const bubbles = useRef<Bubble[]>([]);
  const lastSpawnTime = useRef(0);
  const lastComboTime = useRef(0);

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
    const width = isMobile ? Math.min(container.clientWidth - 20, window.innerWidth - 20) : Math.min(600, container.clientWidth - 40);
    const height = isMobile ? Math.min(window.innerHeight - 200, 500) : Math.min(400, window.innerHeight - 300);

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
    if (random < 0.05) return "bomb";
    if (random < 0.15) return "poison";
    if (random < 0.25) return "superTreat";
    if (random < 0.35) return "doubleTreat";
    if (random < 0.4) return "heart";
    if (random < 0.45) return "star";
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
    const rotation = Math.random() * 360;
    const scale = 0.8 + Math.random() * 0.4;

    fallingObjects.current.push({
      id: Date.now() + Math.random(),
      x,
      y: -objectSize,
      type: generateObjectType(),
      speed: 2 + gameSpeedRef.current,
      rotation,
      scale
    });
  };

  const createExplosion = (x: number, y: number) => {
    explosions.current.push({ x, y, size: 50, frame: 0, maxFrame: 30 });
  };

  const createCollectionEffect = (x: number, y: number, value: number, type: string) => {
    collectionEffects.current.push({ x, y, frame: 0, maxFrame: 60, value, type });
  };

  const addPowerUp = (type: string, duration: number) => {
    setPowerUps(prev => [...prev.filter(p => p.type !== type), { type, duration, startTime: Date.now() }]);
  };

  const updateCombo = (increment: boolean = true) => {
    if (increment) {
      comboRef.current += 1;
      setCombo(comboRef.current);
      if (comboRef.current > maxCombo) {
        setMaxCombo(comboRef.current);
      }
      lastComboTime.current = Date.now();
    } else {
      comboRef.current = 0;
      setCombo(0);
    }
  };

  const addSpecialEffect = (effect: string) => {
    setSpecialEffects(prev => [...prev, effect]);
    setTimeout(() => {
      setSpecialEffects(prev => prev.filter(e => e !== effect));
    }, 2000);
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

    // Update combo timeout
    if (Date.now() - lastComboTime.current > 3000 && comboRef.current > 0) {
      updateCombo(false);
    }

    // Update power-ups
    setPowerUps(prev => prev.filter(p => Date.now() - p.startTime < p.duration));

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background effects
    if (powerUps.some(p => p.type === 'rainbow')) {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(255, 0, 150, 0.1)');
      gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(255, 255, 0, 0.1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw platform (dog bowl)
    const isShielded = powerUps.some(p => p.type === 'shield');
    ctx.fillStyle = isShielded ? '#00ff00' : '#ff69b4';
    ctx.fillRect(platform.current.x, platform.current.y, platform.current.width, platform.current.height);
    
    if (isShielded) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.strokeRect(platform.current.x - 5, platform.current.y - 5, platform.current.width + 10, platform.current.height + 10);
    }
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🥣', platform.current.x + platform.current.width / 2, platform.current.y + 15);

    // Update and draw falling objects
    fallingObjects.current.forEach((obj, index) => {
      obj.y += obj.speed;
      if (obj.rotation !== undefined) {
        obj.rotation += 2;
      }

      // Draw object
      if (obj.rotation !== undefined) {
        ctx.rotate((obj.rotation * Math.PI) / 180);
      }
      if (obj.scale !== undefined) {
        ctx.scale(obj.scale, obj.scale);
      }
      
      const fontSize = Math.floor(24 * (obj.scale || 1));
      ctx.font = `${fontSize}px Arial`;
      ctx.textAlign = 'center';
      let emoji = '';
      switch (obj.type) {
        case 'treat':
          emoji = '🦴';
          break;
        case 'doubleTreat':
          emoji = '🥩';
          break;
        case 'superTreat':
          emoji = '🍖';
          break;
        case 'heart':
          emoji = '💖';
          break;
        case 'star':
          emoji = '⭐';
          break;
        case 'poison':
          emoji = '☠️';
          break;
        case 'bomb':
          emoji = '💣';
          break;
      }
      ctx.fillText(emoji, 0, 5);
      ctx.restore();

      // Check collision with platform
      if (
        obj.y + 30 >= platform.current.y &&
        obj.x + 30 > platform.current.x &&
        obj.x < platform.current.x + platform.current.width
      ) {
        fallingObjects.current.splice(index, 1);
        
        const comboMultiplier = Math.min(3, 1 + comboRef.current * 0.1);
        const doublePoints = powerUps.some(p => p.type === 'doublePoints');
        const pointsMultiplier = doublePoints ? 2 : 1;
        
        switch (obj.type) {
          case 'treat':
            const treatPoints = Math.floor(10 * comboMultiplier * pointsMultiplier);
            scoreRef.current += treatPoints;
            createCollectionEffect(obj.x, obj.y, treatPoints, 'treat');
            updateCombo(true);
            break;
          case 'doubleTreat':
            const doublePoints = Math.floor(25 * comboMultiplier * pointsMultiplier);
            scoreRef.current += doublePoints;
            createCollectionEffect(obj.x, obj.y, doublePoints, 'doubleTreat');
            updateCombo(true);
            break;
          case 'superTreat':
            const superPoints = Math.floor(50 * comboMultiplier * pointsMultiplier);
            scoreRef.current += superPoints;
            createCollectionEffect(obj.x, obj.y, superPoints, 'superTreat');
            updateCombo(true);
            addPowerUp('doublePoints', 10000);
            addSpecialEffect('DOUBLE POINTS!');
            break;
          case 'heart':
            if (livesRef.current < 5) {
              livesRef.current += 1;
              setLives(livesRef.current);
            }
            createCollectionEffect(obj.x, obj.y, 0, 'heart');
            updateCombo(true);
            addSpecialEffect('EXTRA LIFE!');
            break;
          case 'star':
            addPowerUp('shield', 15000);
            createCollectionEffect(obj.x, obj.y, 0, 'star');
            updateCombo(true);
            addSpecialEffect('SHIELD ACTIVATED!');
            break;
          case 'poison':
            if (!powerUps.some(p => p.type === 'shield')) {
              scoreRef.current = Math.max(0, scoreRef.current - 15);
              livesRef.current = Math.max(0, livesRef.current - 1);
              setLives(livesRef.current);
              if (livesRef.current === 0) {
                endGame();
                return;
              }
            }
            createExplosion(obj.x, obj.y);
            updateCombo(false);
            break;
          case 'bomb':
            if (!powerUps.some(p => p.type === 'shield')) {
              endGame();
              return;
            } else {
              createExplosion(obj.x, obj.y);
              addSpecialEffect('SHIELD SAVED YOU!');
            }
            break;
        }
        
        setScore(scoreRef.current);
        
        // Create celebration bubbles
        const bubbleCount = obj.type === 'superTreat' ? 15 : obj.type === 'heart' || obj.type === 'star' ? 10 : 5;
        for (let i = 0; i < bubbleCount; i++) {
          bubbles.current.push({
            x: obj.x + 15,
            y: obj.y + 15,
            radius: Math.random() * 3 + 2,
            speedX: (Math.random() - 0.5) * 4,
            speedY: (Math.random() - 0.5) * 4,
            opacity: 1,
            color: obj.type === 'poison' ? '#ff0000' : 
                   obj.type === 'superTreat' ? '#ffd700' :
                   obj.type === 'heart' ? '#ff1493' :
                   obj.type === 'star' ? '#00ffff' : '#ff69b4',
            frame: 0,
            maxFrame: 30,
          });
        }
      } else if (obj.y > canvas.height) {
        fallingObjects.current.splice(index, 1);
        if (obj.type === 'treat' || obj.type === 'doubleTreat' || obj.type === 'superTreat') {
          updateCombo(false);
        }
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
      
      let color = '255, 215, 0';
      if (effect.type === 'heart') color = '255, 20, 147';
      if (effect.type === 'star') color = '0, 255, 255';
      if (effect.type === 'superTreat') color = '255, 215, 0';
      
      ctx.fillStyle = `rgba(${color}, ${1 - progress})`;
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      
      if (effect.value > 0) {
        ctx.fillText(`+${effect.value}`, effect.x + 15, effect.y - progress * 40);
      } else {
        const text = effect.type === 'heart' ? '+LIFE' : effect.type === 'star' ? 'SHIELD' : '';
        ctx.fillText(text, effect.x + 15, effect.y - progress * 40);
      }
      
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

    // Draw main UI
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${scoreRef.current}`, 10, 25);
    ctx.fillText(`Time: ${remaining}s`, 10, 50);
    ctx.fillText(`Lives: ${livesRef.current}`, 10, 75);
    
    // Draw combo
    if (comboRef.current > 1) {
      ctx.fillStyle = '#ff1493';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`COMBO x${comboRef.current}!`, 10, 105);
    }
    
    // Draw power-ups
    let powerUpY = 130;
    powerUps.forEach(powerUp => {
      const timeLeft = Math.ceil((powerUp.duration - (Date.now() - powerUp.startTime)) / 1000);
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`${powerUp.type.toUpperCase()}: ${timeLeft}s`, 10, powerUpY);
      powerUpY += 20;
    });
    
    // Draw special effects
    specialEffects.forEach((effect, index) => {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(effect, canvas.width / 2, 100 + index * 30);
    });

    // Spawn objects
    spawnObject(timestamp);

    animationFrameId.current = requestAnimationFrame(gameLoop);
  };

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setRemainingSeconds(60);
    setCombo(0);
    setMaxCombo(0);
    setLives(3);
    setPowerUps([]);
    setSpecialEffects([]);
    scoreRef.current = 0;
    comboRef.current = 0;
    livesRef.current = 3;
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
                Treat Catcher
              </h1>
              <p className="text-gray-700 font-inter">Help your dog catch falling treats! 🦴</p>
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
                <div className="text-right">
                  <div className="text-sm md:text-lg font-inter font-bold text-success">Speed: {gameSpeed.toFixed(1)}x</div>
                  <div className="text-gray-600 text-xs md:text-sm font-inter">Game Speed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value text-lg md:text-xl">{lives}</div>
                  <div className="stat-label">Lives</div>
                </div>
              </div>

              {/* Game Canvas */}
              <div className="game-canvas-container">
                <canvas
                  ref={canvasRef}
                  className="block mx-auto cursor-none w-full max-w-full touch-none"
                  style={{ background: 'linear-gradient(to bottom, #fef7ff, #fdeeff, #fcdcff)' }}
                />
                
                {/* Game Overlays */}
                {!gameStarted && !gameOver && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-3xl">
                    <div className="text-center space-y-4 cute-card p-4 md:p-8 mx-4">
                      <div className="text-6xl">🐕</div>
                      <h2 className="text-xl md:text-2xl font-inter font-bold text-gray-800">Treat Catcher</h2>
                      <p className="text-sm md:text-base text-gray-600 font-inter">Help your dog catch treats and avoid poison!</p>
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
                        {maxCombo > 1 && (
                          <p className="text-sm md:text-base text-pink-500 font-inter font-bold">Max Combo: x{maxCombo}</p>
                        )}
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
                    <div className="text-gray-700 font-inter">Bone: +10 pts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">🥩</div>
                    <div className="text-gray-700 font-inter">Meat: +25 pts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">🍖</div>
                    <div className="text-gray-700 font-inter">Super: +50 pts + 2x</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">💖</div>
                    <div className="text-gray-700 font-inter">Heart: +1 Life</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">⭐</div>
                    <div className="text-gray-700 font-inter">Star: Shield</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">☠️</div>
                    <div className="text-gray-700 font-inter">Poison: -1 Life</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">💣</div>
                    <div className="text-gray-700 font-inter">Bomb: Game Over</div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-3 text-center font-inter">
                  Move your mouse or finger to control the dog bowl. Build combos for bonus points!
                </p>
                {combo > 1 && (
                  <div className="text-sm md:text-lg font-inter font-bold text-pink-500 mt-2">
                    Combo: x{combo}
                  </div>
                )}
              </div>
            </div>
            
            {/* Power-ups Display */}
            {powerUps.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {powerUps.map((powerUp, index) => {
                  const timeLeft = Math.ceil((powerUp.duration - (Date.now() - powerUp.startTime)) / 1000);
                  return (
                    <div key={index} className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {powerUp.type.toUpperCase()}: {timeLeft}s
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};