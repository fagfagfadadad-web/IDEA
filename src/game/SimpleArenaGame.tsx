import React, { useEffect, useRef, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc, deleteField } from 'firebase/firestore';

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
  createdAt: number;
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
  const [bullets, setBullets] = useState<Record<string, Bullet>>({});
  const playersRef = useRef<Record<string, Player>>({});
  const bulletsRef = useRef<Record<string, Bullet>>({});
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(3);

  const playerPos = useRef({ x: 400, y: 450 });
  const joystickPos = useRef({ x: 0, y: 0 });
  const weaponAngle = useRef(0);
  const isShooting = useRef(false);
  const lastShot = useRef(0);
  const playerImage = useRef<HTMLImageElement | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PLAYER_SIZE = 40;

  useEffect(() => {
    const img = new Image();
    img.src = '/-pupfi new .png';
    img.onload = () => {
      playerImage.current = img;
    };

    const updateJoystick = () => {
      const speed = 0.8;
      let x = 0;
      let y = 0;

      if (keysPressed.current.has('w') || keysPressed.current.has('ArrowUp')) y -= speed;
      if (keysPressed.current.has('s') || keysPressed.current.has('ArrowDown')) y += speed;
      if (keysPressed.current.has('a') || keysPressed.current.has('ArrowLeft')) x -= speed;
      if (keysPressed.current.has('d') || keysPressed.current.has('ArrowRight')) x += speed;

      joystickPos.current.x = x;
      joystickPos.current.y = y;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      const key = e.key.toLowerCase();
      const validKeys = ['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '];

      if (validKeys.includes(key)) {
        if (key === ' ') {
          isShooting.current = true;
        } else {
          keysPressed.current.add(e.key);
          updateJoystick();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === ' ') {
        isShooting.current = false;
      } else {
        keysPressed.current.delete(e.key);
        updateJoystick();
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
          x: 400,
          y: 450,
          angle: 0,
          health: 3,
          score: 0,
          username,
          petImage: petImage || '/pupfi-logo.png',
        }
      },
      bullets: {},
      lastUpdate: Date.now(),
    }, { merge: true })
      .catch(err => console.error('❌ Failed to create game state:', err));

    const unsubGameState = onSnapshot(gameStateRef, (snapshot) => {
      const data = snapshot.data();
      if (data) {
        if (data.players) {
          playersRef.current = data.players;
          setPlayers(data.players);
          if (data.players[playerId]) {
            setHealth(data.players[playerId].health);
            setScore(data.players[playerId].score);
          }
        }
        if (data.bullets) {
          const validBullets: Record<string, Bullet> = {};
          Object.entries(data.bullets).forEach(([id, bullet]: [string, any]) => {
            if (bullet && bullet.x !== undefined) {
              validBullets[id] = bullet;
            }
          });
          bulletsRef.current = validBullets;
          setBullets(validBullets);
        } else {
          bulletsRef.current = {};
          setBullets({});
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
    let animationId: number;

    const draw = () => {
      const currentPlayers = playersRef.current;
      const currentBullets = bulletsRef.current;

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 3;
      obstacles.forEach((obs) => {
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      });

      Object.values(currentBullets).forEach((bullet) => {
        if (!bullet || bullet.x === undefined || bullet.y === undefined) return;
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      Object.entries(currentPlayers).forEach(([id, player]) => {
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

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [playerId]);

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
    let lastFirebaseUpdate = 0;
    let lastBulletUpdate = 0;

    const gameLoop = setInterval(() => {
      const gameStateRef = doc(db, 'arena_game_state', matchId);
      const now = Date.now();

      // Update bullets physics
      if (now - lastBulletUpdate > 50) {
        lastBulletUpdate = now;
        const updates: any = {};

        Object.entries(bulletsRef.current).forEach(([bulletId, bullet]) => {
          if (!bullet || !bullet.owner) return;

          // Calculate new position
          const newX = bullet.x + bullet.speedX;
          const newY = bullet.y + bullet.speedY;
          const age = now - (bullet.createdAt || 0);

          // Remove if out of bounds or too old
          if (newX < 0 || newX > CANVAS_WIDTH || newY < 0 || newY > CANVAS_HEIGHT || age > 3000) {
            updates[`bullets.${bulletId}`] = deleteField();
            return;
          }

          // Check collision with obstacles
          let hitObstacle = false;
          for (const obs of obstacles) {
            if (newX > obs.x && newX < obs.x + obs.width &&
                newY > obs.y && newY < obs.y + obs.height) {
              hitObstacle = true;
              break;
            }
          }

          if (hitObstacle) {
            updates[`bullets.${bulletId}`] = deleteField();
            return;
          }

          // Check collision with players
          Object.entries(playersRef.current).forEach(([targetId, target]: [string, any]) => {
            if (targetId === bullet.owner || !target || target.health <= 0) return;

            const dx = newX - (target.x + PLAYER_SIZE / 2);
            const dy = newY - (target.y + PLAYER_SIZE / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < PLAYER_SIZE / 2 + 6) {
              // Hit detected!
              updates[`bullets.${bulletId}`] = deleteField();
              updates[`players.${targetId}.health`] = Math.max(0, target.health - 1);

              // Award point if killed
              if (target.health - 1 <= 0) {
                const shooter = playersRef.current[bullet.owner];
                if (shooter) {
                  updates[`players.${bullet.owner}.score`] = (shooter.score || 0) + 1;
                }
              }
            }
          });

          // Update position if not removed
          if (!updates[`bullets.${bulletId}`]) {
            updates[`bullets.${bulletId}.x`] = newX;
            updates[`bullets.${bulletId}.y`] = newY;
          }
        });

        if (Object.keys(updates).length > 0) {
          updateDoc(gameStateRef, updates).catch(() => {});
        }
      }

      const hasMovement = joystickPos.current.x !== 0 || joystickPos.current.y !== 0;

      if (hasMovement) {
        const speed = 5;
        let newX = playerPos.current.x + speed * joystickPos.current.x;
        let newY = playerPos.current.y + speed * joystickPos.current.y;

        // Clamp to canvas boundaries
        newX = Math.max(0, Math.min(newX, CANVAS_WIDTH - PLAYER_SIZE));
        newY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - PLAYER_SIZE));

        // Check collision and update
        const collisionX = checkCollision(newX, playerPos.current.y);
        const collisionY = checkCollision(playerPos.current.x, newY);

        if (!collisionX) {
          playerPos.current.x = newX;
        }
        if (!collisionY) {
          playerPos.current.y = newY;
        }

        if (now - lastFirebaseUpdate > 50) {
          lastFirebaseUpdate = now;
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
    const bulletData = {
      x: centerX + Math.cos(angle) * 30,
      y: centerY + Math.sin(angle) * 30,
      speedX: Math.cos(angle) * 10,
      speedY: Math.sin(angle) * 10,
      owner: playerId,
      createdAt: Date.now(),
    };

    updateDoc(gameStateRef, {
      [`bullets.${bulletId}`]: bulletData
    }).catch(err => console.error('❌ Shoot failed:', err));

    // Auto-remove after 2 seconds
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

      <div className="absolute bottom-20 sm:bottom-8 w-full flex justify-between px-4 sm:px-8 pointer-events-none z-50">
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
