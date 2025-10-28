import React, { useEffect, useRef, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

interface Player {
  x: number;
  y: number;
  angle: number;
  health: number;
  score: number;
  username: string;
  petImage: string;
}

interface Bullet {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  owner: string;
}

interface GameProps {
  matchId: string;
  playerId: string;
  username: string;
  petImage?: string;
  onLeave: () => void;
}

export const SimpleArenaGame: React.FC<GameProps> = ({
  matchId,
  playerId,
  username,
  petImage,
  onLeave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(3);

  const playerPos = useRef({ x: 400, y: 300 });
  const joystickPos = useRef({ x: 0, y: 0 });
  const weaponAngle = useRef(0);
  const isShooting = useRef(false);
  const lastShot = useRef(0);
  const playerImage = useRef<HTMLImageElement | null>(null);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PLAYER_SIZE = 40;

  useEffect(() => {
    const img = new Image();
    img.src = '/-pupfi new .png';
    img.onload = () => {
      playerImage.current = img;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const speed = 0.8;
      switch(e.key) {
        case 'ArrowUp':
        case 'w':
          joystickPos.current.y = -speed;
          break;
        case 'ArrowDown':
        case 's':
          joystickPos.current.y = speed;
          break;
        case 'ArrowLeft':
        case 'a':
          joystickPos.current.x = -speed;
          break;
        case 'ArrowRight':
        case 'd':
          joystickPos.current.x = speed;
          break;
        case ' ':
          isShooting.current = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'ArrowDown':
        case 's':
          joystickPos.current.y = 0;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'ArrowRight':
        case 'd':
          joystickPos.current.x = 0;
          break;
        case ' ':
          isShooting.current = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const gameStateRef = doc(db, 'arena_game_state', matchId);

    setDoc(gameStateRef, {
      players: {
        [playerId]: {
          x: playerPos.current.x,
          y: playerPos.current.y,
          angle: 0,
          health: 3,
          score: 0,
          username,
          petImage: petImage || '/pupfi-logo.png',
        }
      },
      bullets: {},
      lastUpdate: Date.now(),
    }, { merge: true }).catch(console.error);

    const unsubGameState = onSnapshot(gameStateRef, (snapshot) => {
      const data = snapshot.data();
      if (data) {
        if (data.players) {
          setPlayers(data.players);
          if (data.players[playerId]) {
            setHealth(data.players[playerId].health);
            setScore(data.players[playerId].score);
          }
        }
        if (data.bullets) {
          const validBullets = Object.values(data.bullets).filter((b: any) => b !== null && b.x !== undefined) as Bullet[];
          setBullets(validBullets);
        } else {
          setBullets([]);
        }
      }
    });

    return () => {
      unsubGameState();
    };
  }, [matchId, playerId, username, petImage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 3;
      obstacles.forEach((obs) => {
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      });

      bullets.forEach((bullet) => {
        if (!bullet || bullet.x === undefined || bullet.y === undefined) return;
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      Object.entries(players).forEach(([id, player]) => {
        if (player.health <= 0) return;

        ctx.save();
        ctx.translate(player.x + PLAYER_SIZE / 2, player.y + PLAYER_SIZE / 2);

        if (playerImage.current) {
          ctx.drawImage(playerImage.current, -PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
        } else {
          ctx.fillStyle = id === playerId ? '#00ff00' : '#ff4081';
          ctx.beginPath();
          ctx.arc(0, 0, PLAYER_SIZE / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = id === playerId ? '#00ff00' : '#ff0000';
        ctx.fillRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2 - 10, PLAYER_SIZE * (player.health / 3), 5);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(player.angle) * 30, Math.sin(player.angle) * 30);
        ctx.stroke();

        ctx.restore();

        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(player.username, player.x, player.y - 15);
      });

      requestAnimationFrame(draw);
    };

    draw();
  }, [players, bullets, playerId]);

  const obstacles = [
    { x: 100, y: 50, width: 200, height: 20 },
    { x: 500, y: 50, width: 200, height: 20 },
    { x: 300, y: 300, width: 200, height: 20 },
    { x: 100, y: 500, width: 20, height: 100 },
    { x: 680, y: 500, width: 20, height: 100 },
  ];

  const checkCollision = (x: number, y: number) => {
    for (const obs of obstacles) {
      if (
        x + PLAYER_SIZE > obs.x &&
        x < obs.x + obs.width &&
        y + PLAYER_SIZE > obs.y &&
        y < obs.y + obs.height
      ) {
        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    console.log('🎮 Game loop started');
    let lastFirebaseUpdate = 0;

    const gameLoop = setInterval(() => {
      if (joystickPos.current.x !== 0 || joystickPos.current.y !== 0) {
        const speed = 5;
        let newX = playerPos.current.x + speed * joystickPos.current.x;
        let newY = playerPos.current.y + speed * joystickPos.current.y;

        if (!checkCollision(newX, playerPos.current.y)) {
          playerPos.current.x = Math.max(0, Math.min(newX, CANVAS_WIDTH - PLAYER_SIZE));
        }
        if (!checkCollision(playerPos.current.x, newY)) {
          playerPos.current.y = Math.max(0, Math.min(newY, CANVAS_HEIGHT - PLAYER_SIZE));
        }

        const now = Date.now();
        if (now - lastFirebaseUpdate > 50) {
          lastFirebaseUpdate = now;
          const gameStateRef = doc(db, 'arena_game_state', matchId);
          updateDoc(gameStateRef, {
            [`players.${playerId}.x`]: playerPos.current.x,
            [`players.${playerId}.y`]: playerPos.current.y,
            [`players.${playerId}.angle`]: weaponAngle.current,
          }).catch(err => console.error('❌ Update failed:', err));
        }
      }

      if (isShooting.current && Date.now() - lastShot.current > 300) {
        shoot();
        lastShot.current = Date.now();
      }
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [matchId, playerId]);

  const shoot = () => {
    const bulletId = `${playerId}_${Date.now()}`;
    const angle = weaponAngle.current;
    const centerX = playerPos.current.x + PLAYER_SIZE / 2;
    const centerY = playerPos.current.y + PLAYER_SIZE / 2;

    const gameStateRef = doc(db, 'arena_game_state', matchId);
    updateDoc(gameStateRef, {
      [`bullets.${bulletId}`]: {
        x: centerX + Math.cos(angle) * 30,
        y: centerY + Math.sin(angle) * 30,
        speedX: Math.cos(angle) * 10,
        speedY: Math.sin(angle) * 10,
        owner: playerId,
      }
    });

    setTimeout(() => {
      updateDoc(gameStateRef, {
        [`bullets.${bulletId}`]: null,
      });
    }, 2000);
  };

  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const dx = clientX - rect.left - centerX;
    const dy = clientY - rect.top - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = centerX * 0.8;

    if (distance > 0) {
      const normalizedDistance = Math.min(distance, maxDistance);
      joystickPos.current = {
        x: (dx / distance) * (normalizedDistance / maxDistance),
        y: (dy / distance) * (normalizedDistance / maxDistance),
      };

      weaponAngle.current = Math.atan2(dy, dx);
      console.log('🎯 Joystick:', joystickPos.current);
    }
  };

  const handleJoystickEnd = () => {
    joystickPos.current = { x: 0, y: 0 };
  };

  return (
    <div className="relative w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden touch-none">
      <div className="absolute top-2 left-2 text-white text-sm sm:text-xl z-10 bg-black bg-opacity-50 px-3 py-1 rounded">
        Score: {score} | HP: {health}/3
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="max-w-full max-h-[70vh] sm:max-h-full border-2 border-gray-600 bg-gray-900"
        style={{ imageRendering: 'pixelated' }}
      />

      <div className="absolute bottom-4 sm:bottom-8 w-full flex justify-between px-4 sm:px-8 pointer-events-none">
        <div
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-blue-500 bg-opacity-30 flex items-center justify-center pointer-events-auto active:bg-opacity-50 transition-all"
          onTouchStart={handleJoystickMove}
          onTouchMove={handleJoystickMove}
          onTouchEnd={handleJoystickEnd}
          onMouseDown={handleJoystickMove}
          onMouseMove={(e) => e.buttons === 1 && handleJoystickMove(e)}
          onMouseUp={handleJoystickEnd}
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-600 shadow-lg"></div>
        </div>

        <button
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-500 text-white text-2xl sm:text-3xl pointer-events-auto active:bg-red-600 active:scale-95 transition-all shadow-lg"
          onTouchStart={() => (isShooting.current = true)}
          onTouchEnd={() => (isShooting.current = false)}
          onMouseDown={() => (isShooting.current = true)}
          onMouseUp={() => (isShooting.current = false)}
        >
          🔫
        </button>
      </div>

      <button
        onClick={onLeave}
        className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded z-10 text-sm sm:text-base active:bg-red-700 transition-colors"
      >
        Leave
      </button>
    </div>
  );
};
