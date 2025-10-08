import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, RotateCcw, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'components';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { GameService, awardFoodPoints } from '../../services/gameService';

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  emoji: string;
  lane: number;
}

interface Coin {
  x: number;
  y: number;
  width: number;
  height: number;
  lane: number;
}

interface Tree {
  x: number;
  y: number;
  width: number;
  height: number;
  side: 'left' | 'right';
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  lane: number;
}

const createSound = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
  try {
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
  } catch (e) {
    console.error('Sound error:', e);
  }
};

const playBoostSound = () => createSound(800, 0.1);
const playCollisionSound = () => createSound(150, 0.2, 'sawtooth');
const playCoinSound = () => createSound(660, 0.1);
const playWinSound = () => {
  createSound(523, 0.2);
  setTimeout(() => createSound(659, 0.2), 150);
  setTimeout(() => createSound(784, 0.2), 300);
  setTimeout(() => createSound(1047, 0.3), 450);
};

export const PupRacing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameStats, refetch } = useGame();
  const { success, error } = useToast();

  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [speed, setSpeed] = useState(5);
  const [boosts, setBoosts] = useState(3);
  const [countdown, setCountdown] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [canPlayGame, setCanPlayGame] = useState(false);
  const [needsTicket, setNeedsTicket] = useState(false);
  const [hasTicket, setHasTicket] = useState(false);
  const [checkingTickets, setCheckingTickets] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const playerImageRef = useRef<HTMLImageElement | null>(null);

  const player = useRef<Player>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    lane: 1
  });

  const lanes = useRef<number[]>([]);
  const obstacles = useRef<Obstacle[]>([]);
  const coins = useRef<Coin[]>([]);
  const trees = useRef<Tree[]>([]);

  const speedRef = useRef(5);
  const boostsRef = useRef(3);
  const roadOffsetRef = useRef(0);
  const lastObstacleSpawn = useRef(0);
  const lastCoinSpawn = useRef(0);
  const lastTreeSpawn = useRef(0);
  const isBoosting = useRef(false);
  const coinsRef = useRef(0);
  const gameStartedRef = useRef(false);
  const countdownRef = useRef(0);

  useEffect(() => {
    // Load player image (car with dog)
    const img = new Image();
    img.src = '/42f0ae4a-0733-4b97-ba17-21474eeb069f (1) copy.png';
    img.onload = () => {
      playerImageRef.current = img;
      drawInitialCanvas();
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Draw initial canvas state
    drawInitialCanvas();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  // Check if player can play the game
  useEffect(() => {
    const checkGameAccess = async () => {
      if (!user?.id) return;

      setCheckingTickets(true);
      try {
        const result = await GameService.canPlayGame(user.id, 'racing');
        console.log('Pup Racing access check:', result);
        setCanPlayGame(result.canPlay);
        setNeedsTicket(result.needsTicket);
        setHasTicket(result.hasTicket);
      } catch (err) {
        console.error('Error checking game access:', err);
        setCanPlayGame(true); // Allow play on error
      } finally {
        setCheckingTickets(false);
      }
    };

    checkGameAccess();
  }, [user?.id, gameStats?.gameTickets]);

  const drawInitialCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grass
    const grassGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grassGradient.addColorStop(0, '#2d5016');
    grassGradient.addColorStop(1, '#1a3d0a');
    ctx.fillStyle = grassGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw road
    const roadStart = canvas.width * 0.2;
    const roadWidth = canvas.width * 0.6;

    const roadGradient = ctx.createLinearGradient(roadStart, 0, roadStart + roadWidth, 0);
    roadGradient.addColorStop(0, '#1a1a1a');
    roadGradient.addColorStop(0.5, '#2f2f2f');
    roadGradient.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = roadGradient;
    ctx.fillRect(roadStart, 0, roadWidth, canvas.height);

    // Draw lane lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 20]);

    const laneLineX1 = roadStart + roadWidth / 3;
    const laneLineX2 = roadStart + (roadWidth / 3) * 2;

    ctx.beginPath();
    ctx.moveTo(laneLineX1, 0);
    ctx.lineTo(laneLineX1, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(laneLineX2, 0);
    ctx.lineTo(laneLineX2, canvas.height);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw player at starting position
    if (playerImageRef.current) {
      ctx.drawImage(
        playerImageRef.current,
        player.current.x,
        player.current.y,
        player.current.width,
        player.current.height
      );
    } else {
      ctx.font = `${player.current.height * 0.8}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐕', player.current.x + player.current.width / 2, player.current.y + player.current.height / 2);
    }
  };

  const updateCanvasSize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isMobile = window.innerWidth < 768;
    const width = isMobile ? Math.min(window.innerWidth - 20, 400) : Math.min(600, window.innerWidth - 40);
    const height = isMobile ? Math.min(600, window.innerHeight - 300) : Math.min(720, window.innerHeight - 250);

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const laneWidth = width * 0.6 / 3;
    const roadStart = width * 0.2;
    lanes.current = [
      roadStart + laneWidth * 0.5,
      roadStart + laneWidth * 1.5,
      roadStart + laneWidth * 2.5
    ];

    player.current.width = width * 0.12;
    player.current.height = player.current.width * 1.5;
    player.current.x = lanes.current[1] - player.current.width / 2;
    player.current.y = height - player.current.height - 50;
    player.current.lane = 1;

    // Redraw canvas after resize if not in game
    if (!gameStarted) {
      setTimeout(() => drawInitialCanvas(), 0);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || countdown > 0) return;
      keysPressed.current.add(e.key);

      if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && player.current.lane > 0) {
        player.current.lane--;
        player.current.x = lanes.current[player.current.lane] - player.current.width / 2;
      } else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && player.current.lane < 2) {
        player.current.lane++;
        player.current.x = lanes.current[player.current.lane] - player.current.width / 2;
      } else if (e.key === ' ' && boostsRef.current > 0 && !isBoosting.current) {
        e.preventDefault();
        isBoosting.current = true;
        boostsRef.current--;
        setBoosts(boostsRef.current);
        playBoostSound();
        speedRef.current *= 3;

        setTimeout(() => {
          isBoosting.current = false;
          speedRef.current = 5;
        }, 2000);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    let touchStartX = 0;
    let touchStartTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (!gameStarted || countdown > 0) return;

      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartTime = Date.now();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!gameStarted || countdown > 0) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX;
      const swipeThreshold = 30;

      // Swipe left
      if (deltaX < -swipeThreshold && player.current.lane > 0) {
        player.current.lane--;
        player.current.x = lanes.current[player.current.lane] - player.current.width / 2;
        touchStartX = touch.clientX; // Reset for continuous swiping
      }
      // Swipe right
      else if (deltaX > swipeThreshold && player.current.lane < 2) {
        player.current.lane++;
        player.current.x = lanes.current[player.current.lane] - player.current.width / 2;
        touchStartX = touch.clientX; // Reset for continuous swiping
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!gameStarted || countdown > 0) return;

      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;

      // Quick tap (less than 200ms) = boost
      if (touchDuration < 200 && boostsRef.current > 0 && !isBoosting.current) {
        e.preventDefault();
        isBoosting.current = true;
        boostsRef.current--;
        setBoosts(boostsRef.current);
        playBoostSound();
        speedRef.current *= 3;

        setTimeout(() => {
          isBoosting.current = false;
          speedRef.current = 5;
        }, 2000);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStart);
      canvas.addEventListener('touchmove', handleTouchMove);
      canvas.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [gameStarted, countdown]);

  const startCountdown = () => {
    console.log('🎮 Starting countdown...');
    setCountdown(3);
    countdownRef.current = 3;
    setGameStarted(true);
    gameStartedRef.current = true; // Set ref immediately
    console.log('🎮 Game started set to true (state + ref), requesting animation frame...');
    animationFrameId.current = requestAnimationFrame(gameLoop);
    console.log('🎮 Animation frame requested:', animationFrameId.current);

    const countInterval = setInterval(() => {
      setCountdown(prev => {
        const newVal = prev <= 1 ? 0 : prev - 1;
        countdownRef.current = newVal;
        console.log('⏱️ Countdown:', prev, '→', newVal);
        if (prev <= 1) {
          clearInterval(countInterval);
          console.log('🎮 Countdown finished! Game should start now.');
        }
        return newVal;
      });
    }, 1000);
  };

  const startGame = async () => {
    console.log('🚀 START GAME CALLED');

    // Handle ticket logic
    if (needsTicket && user?.id) {
      try {
        await GameService.useTicket(user.id, 'racing');
        success('Ticket used! Good luck! 🎫');
        refetch(); // Refresh game stats to show updated ticket count
      } catch (err) {
        error('Failed to use ticket');
        return;
      }
    } else if (!needsTicket && user?.id) {
      // Record free daily play
      try {
        await GameService.recordGamePlay(user.id, 'racing');
      } catch (err) {
        console.error('Failed to record game play:', err);
      }
    }

    setShowStartScreen(false);
    setGameOver(false);
    setSpeed(5);
    setBoosts(3);
    setCoinsCollected(0);

    speedRef.current = 5;
    boostsRef.current = 3;
    roadOffsetRef.current = 0;
    isBoosting.current = false;
    coinsRef.current = 0;

    obstacles.current = [];
    coins.current = [];
    trees.current = [];

    lastObstacleSpawn.current = 0;
    lastCoinSpawn.current = 0;
    lastTreeSpawn.current = 0;

    player.current.lane = 1;
    player.current.x = lanes.current[1] - player.current.width / 2;

    startCountdown();
  };

  const spawnObstacle = (timestamp: number) => {
    if (timestamp - lastObstacleSpawn.current < 1500) return;
    lastObstacleSpawn.current = timestamp;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const lane = Math.floor(Math.random() * 3);
    const emojis = ['🚧', '🛑', '⚠️', '🪨'];

    obstacles.current.push({
      x: lanes.current[lane],
      y: -50,
      width: canvas.width * 0.1,
      height: canvas.width * 0.1,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      lane
    });
  };

  const spawnCoin = (timestamp: number) => {
    if (timestamp - lastCoinSpawn.current < 800) return;
    lastCoinSpawn.current = timestamp;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const lane = Math.floor(Math.random() * 3);

    coins.current.push({
      x: lanes.current[lane],
      y: -30,
      width: canvas.width * 0.06,
      height: canvas.width * 0.06,
      lane
    });
  };

  const spawnTree = (timestamp: number) => {
    if (timestamp - lastTreeSpawn.current < 600) return;
    lastTreeSpawn.current = timestamp;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const side = Math.random() < 0.5 ? 'left' : 'right';
    const width = canvas.width * 0.08;

    trees.current.push({
      x: side === 'left' ? canvas.width * 0.05 : canvas.width * 0.87,
      y: -width * 1.5,
      width,
      height: width * 1.5,
      side
    });
  };

  const gameLoop = (timestamp: number) => {
    console.log('🔄 Game loop called. gameStartedRef:', gameStartedRef.current, 'countdownRef:', countdownRef.current, 'canvas:', !!canvasRef.current);
    if (!gameStartedRef.current || !canvasRef.current) {
      console.log('❌ Game loop returning early');
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('❌ No context');
      return;
    }

    // Only update game state if countdown is finished
    const isCountingDown = countdownRef.current > 0;
    console.log('🎮 isCountingDown:', isCountingDown, 'countdownRef.current:', countdownRef.current);

    if (!isCountingDown) {
      roadOffsetRef.current = (roadOffsetRef.current + speedRef.current) % 40;

      // Gradually increase speed over time
      if (speedRef.current < 15) {
        speedRef.current += 0.001;
        setSpeed(speedRef.current);
      }
    } else {
      // During countdown, still animate the road
      roadOffsetRef.current = (roadOffsetRef.current + 3) % 40;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const grassGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grassGradient.addColorStop(0, '#2d5016');
    grassGradient.addColorStop(1, '#1a3d0a');
    ctx.fillStyle = grassGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const roadStart = canvas.width * 0.2;
    const roadWidth = canvas.width * 0.6;

    const roadGradient = ctx.createLinearGradient(roadStart, 0, roadStart + roadWidth, 0);
    roadGradient.addColorStop(0, '#1a1a1a');
    roadGradient.addColorStop(0.5, '#2f2f2f');
    roadGradient.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = roadGradient;
    ctx.fillRect(roadStart, 0, roadWidth, canvas.height);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = -roadOffsetRef.current;

    const laneLineX1 = roadStart + roadWidth / 3;
    const laneLineX2 = roadStart + (roadWidth / 3) * 2;

    ctx.beginPath();
    ctx.moveTo(laneLineX1, 0);
    ctx.lineTo(laneLineX1, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(laneLineX2, 0);
    ctx.lineTo(laneLineX2, canvas.height);
    ctx.stroke();

    ctx.setLineDash([]);

    trees.current.forEach((tree, index) => {
      if (!isCountingDown) {
        tree.y += speedRef.current;
      }

      ctx.fillStyle = '#8B4513';
      ctx.fillRect(tree.x - tree.width * 0.15, tree.y + tree.height * 0.4, tree.width * 0.3, tree.height * 0.6);

      ctx.fillStyle = '#228B22';
      ctx.beginPath();
      ctx.arc(tree.x, tree.y + tree.height * 0.3, tree.width * 0.4, 0, Math.PI * 2);
      ctx.fill();

      if (tree.y > canvas.height) {
        trees.current.splice(index, 1);
      }
    });

    coins.current.forEach((coin, index) => {
      if (!isCountingDown) {
        coin.y += speedRef.current;
      }

      ctx.save();
      ctx.translate(coin.x, coin.y);
      ctx.rotate(timestamp * 0.003);

      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(0, 0, coin.width / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#FFF';
      ctx.font = `${coin.width * 0.6}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🍖', 0, 0);

      ctx.restore();

      if (
        !isCountingDown &&
        Math.abs(player.current.x + player.current.width / 2 - coin.x) < player.current.width / 2 &&
        Math.abs(player.current.y + player.current.height / 2 - coin.y) < player.current.height / 2
      ) {
        playCoinSound();
        coinsRef.current++;
        setCoinsCollected(coinsRef.current);
        coins.current.splice(index, 1);
      } else if (coin.y > canvas.height) {
        coins.current.splice(index, 1);
      }
    });

    obstacles.current.forEach((obstacle, index) => {
      if (!isCountingDown) {
        obstacle.y += speedRef.current;
      }

      ctx.font = `${obstacle.width}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(obstacle.emoji, obstacle.x, obstacle.y);

      if (
        !isCountingDown &&
        Math.abs(player.current.lane - obstacle.lane) === 0 &&
        obstacle.y + obstacle.height > player.current.y &&
        obstacle.y < player.current.y + player.current.height
      ) {
        playCollisionSound();
        endGame();
      } else if (obstacle.y > canvas.height) {
        obstacles.current.splice(index, 1);
      }
    });

    // Draw player
    if (playerImageRef.current) {
      ctx.drawImage(
        playerImageRef.current,
        player.current.x,
        player.current.y,
        player.current.width,
        player.current.height
      );
    } else {
      ctx.font = `${player.current.height * 0.8}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐕', player.current.x + player.current.width / 2, player.current.y + player.current.height / 2);
    }

    if (isBoosting.current) {
      ctx.font = `${player.current.width * 0.6}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💨', player.current.x + player.current.width / 2, player.current.y + player.current.height + 10);
    }

    if (countdownRef.current > 0) {
      console.log('🎯 Drawing countdown:', countdownRef.current);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#fff';
      ctx.font = `${canvas.width * 0.3}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(countdownRef.current.toString(), canvas.width / 2, canvas.height / 2);
    }

    // Only spawn objects if countdown is finished
    if (!isCountingDown) {
      spawnObstacle(timestamp);
      spawnCoin(timestamp);
      spawnTree(timestamp);
    }

    console.log('➡️ Requesting next frame...');
    animationFrameId.current = requestAnimationFrame(gameLoop);
  };

  const endGame = async () => {
    setGameOver(true);
    setGameStarted(false);
    gameStartedRef.current = false;
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    setTimeout(() => drawInitialCanvas(), 100);
    await awardPoints();
  };


  const awardPoints = async () => {
    if (user?.id) {
      try {
        const coinBonus = coinsRef.current * 10;
        await awardFoodPoints(user.id, coinBonus);
        success(`Game Over! Earned ${coinBonus} food points! 🍖`);
        refetch();
      } catch (err) {
        error('Failed to award food points');
      }
    }
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
                <div className="stat-card">
                  <div className="stat-value text-lg md:text-xl">🍖 {coinsCollected}</div>
                  <div className="stat-label">Coins</div>
                </div>
              </div>

              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className="block mx-auto w-full max-w-full rounded-3xl border-4 border-primary-300"
                  style={{ height: '650px' }}
                />

                {showStartScreen && !gameStarted && !gameOver && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-3xl p-2">
                    <div className="text-center space-y-4 cute-card p-6 mx-2 max-w-xs w-full">
                      <div className="text-5xl">🏁</div>
                      <h2 className="text-2xl font-inter font-bold text-gray-800">Pup Racing</h2>

                      {checkingTickets ? (
                        <div className="text-gray-600 font-inter text-sm">Checking...</div>
                      ) : (
                        <>
                          {needsTicket && (
                            <div className="bg-yellow-50 border border-yellow-400 p-3 rounded-lg">
                              <p className="text-yellow-800 font-inter font-bold text-sm">🎫 Daily Play Used</p>
                              <p className="text-yellow-700 text-sm font-inter">
                                {hasTicket ? `Have ${gameStats?.gameTickets || 0} tickets` : 'Need ticket'}
                              </p>
                            </div>
                          )}

                          {!needsTicket && (
                            <div className="bg-green-50 border border-green-400 p-3 rounded-lg">
                              <p className="text-green-800 font-inter font-bold text-sm">✨ Free Play</p>
                              <p className="text-green-700 text-sm font-inter">Tickets: {gameStats?.gameTickets || 0}</p>
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
                        {checkingTickets ? 'Loading...' : canPlayGame ? 'Start Race' : 'Need Tickets'}
                      </Button>
                    </div>
                  </div>
                )}

                {gameOver && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-3xl">
                    <div className="text-center space-y-4 cute-card p-6 md:p-8 mx-4">
                      <div className="text-4xl">💥</div>
                      <h2 className="text-xl md:text-2xl font-inter font-bold text-gray-800">Game Over!</h2>
                      <div className="space-y-2">
                        <p className="text-base md:text-lg font-inter font-bold text-primary-500">
                          Coins Collected: {coinsCollected} 🍖
                        </p>
                        <p className="text-sm md:text-base text-gray-600 font-inter">
                          Earned: {coinsCollected * 10} food points! 🍖
                        </p>
                      </div>
                      <Button
                        onClick={async () => {
                          setShowStartScreen(true);
                          setGameOver(false);
                          // Re-check game access for next play
                          if (user?.id) {
                            try {
                              const result = await GameService.canPlayGame(user.id, 'racing');
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
                <h3 className="font-inter font-bold text-gray-800 mb-2">Controls:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700 font-inter">
                  <div>• Arrow Keys or A/D: Move left/right</div>
                  <div>• Spacebar: Speed boost (3x)</div>
                  <div>• Avoid obstacles to keep racing</div>
                  <div>• Collect 🍖 for bonus points</div>
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
