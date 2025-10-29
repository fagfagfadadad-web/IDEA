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

interface PowerUp {
  id: string;
  type: 'shield' | 'speed' | 'health' | 'rapid_fire' | 'triple_shot' | 'freeze';
  x: number;
  y: number;
  createdAt: number;
}

interface PlayerState {
  x: number;
  y: number;
  angle: number;
  health: number;
  score: number;
  username: string;
  petImage: string;
  hasShield?: boolean;
  speedBoost?: number;
  rapidFire?: boolean;
  tripleShot?: boolean;
  powerUpExpiry?: number;
  isFrozen?: boolean;
  freezeExpiry?: number;
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
  const [players, setPlayers] = useState<Record<string, PlayerState>>({});
  const [bullets, setBullets] = useState<Record<string, Bullet>>({});
  const [powerUps, setPowerUps] = useState<Record<string, PowerUp>>({});
  const playersRef = useRef<Record<string, PlayerState>>({});
  const bulletsRef = useRef<Record<string, Bullet>>({});
  const powerUpsRef = useRef<Record<string, PowerUp>>({});
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(5);
  const lastPowerUpSpawn = useRef(0);

  const playerPos = useRef({ x: 400, y: 450 });
  const joystickPos = useRef({ x: 0, y: 0 });
  const weaponAngle = useRef(0);
  const isShooting = useRef(false);
  const lastShot = useRef(0);
  const playerImage = useRef<HTMLImageElement | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const lastDirectionKey = useRef<string | null>(null);

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
      if (e.repeat) return;

      const key = e.key;
      const keyLower = key.toLowerCase();
      const validKeys = ['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '];

      if (validKeys.includes(keyLower)) {
        if (keyLower === ' ') {
          isShooting.current = true;
        } else {
          keysPressed.current.add(key);
          lastDirectionKey.current = key;

          const speed = 0.8;
          const k = keyLower;
          if (k === 'w' || k === 'arrowup') {
            joystickPos.current.x = 0;
            joystickPos.current.y = -speed;
          } else if (k === 's' || k === 'arrowdown') {
            joystickPos.current.x = 0;
            joystickPos.current.y = speed;
          } else if (k === 'a' || k === 'arrowleft') {
            joystickPos.current.x = -speed;
            joystickPos.current.y = 0;
          } else if (k === 'd' || k === 'arrowright') {
            joystickPos.current.x = speed;
            joystickPos.current.y = 0;
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key;
      const keyLower = key.toLowerCase();

      if (keyLower === ' ') {
        isShooting.current = false;
      } else {
        keysPressed.current.delete(key);

        if (lastDirectionKey.current === key) {
          if (keysPressed.current.size === 0) {
            joystickPos.current.x = 0;
            joystickPos.current.y = 0;
            lastDirectionKey.current = null;
          } else {
            const remaining = Array.from(keysPressed.current);
            const lastKey = remaining[remaining.length - 1];
            lastDirectionKey.current = lastKey;

            const speed = 0.8;
            const k = lastKey.toLowerCase();
            if (k === 'w' || k === 'arrowup') {
              joystickPos.current.x = 0;
              joystickPos.current.y = -speed;
            } else if (k === 's' || k === 'arrowdown') {
              joystickPos.current.x = 0;
              joystickPos.current.y = speed;
            } else if (k === 'a' || k === 'arrowleft') {
              joystickPos.current.x = -speed;
              joystickPos.current.y = 0;
            } else if (k === 'd' || k === 'arrowright') {
              joystickPos.current.x = speed;
              joystickPos.current.y = 0;
            }
          }
        }
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
          health: 5,
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

            if (Math.abs(data.players[playerId].x - playerPos.current.x) > 100 ||
                Math.abs(data.players[playerId].y - playerPos.current.y) > 100) {
              playerPos.current.x = data.players[playerId].x;
              playerPos.current.y = data.players[playerId].y;
            }
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
        if (data.powerUps) {
          powerUpsRef.current = data.powerUps;
          setPowerUps(data.powerUps);
        } else {
          powerUpsRef.current = {};
          setPowerUps({});
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
      const currentPowerUps = powerUpsRef.current;

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 3;
      obstacles.forEach((obs) => {
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      });

      Object.values(currentPowerUps).forEach((powerUp) => {
        if (!powerUp) return;
        const icons: Record<PowerUp['type'], string> = {
          shield: '🛡️',
          speed: '⚡',
          health: '❤️',
          rapid_fire: '🔥',
          triple_shot: '⚔️',
          freeze: '❄️'
        };
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText(icons[powerUp.type], powerUp.x, powerUp.y + 8);

        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(powerUp.x + 12, powerUp.y, 20, 0, Math.PI * 2);
        ctx.stroke();
      });

      Object.entries(currentBullets).forEach(([bulletId, bullet]) => {
        if (!bullet || bullet.x === undefined || bullet.y === undefined) return;
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
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

        if (player.hasShield) {
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, PLAYER_SIZE / 2 + 8, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (player.isFrozen && player.freezeExpiry && Date.now() < player.freezeExpiry) {
          ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
          ctx.beginPath();
          ctx.arc(0, 0, PLAYER_SIZE / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillText('❄️', -8, 8);
        }

        ctx.fillStyle = id === playerId ? '#00ff00' : '#ff0000';
        ctx.fillRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2 - 10, PLAYER_SIZE * (player.health / 5), 5);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(player.angle) * 30, Math.sin(player.angle) * 30);
        ctx.stroke();

        ctx.restore();

        let powerUpY = player.y - 30;
        if (player.speedBoost && player.speedBoost > 1) {
          ctx.fillText('⚡', player.x + PLAYER_SIZE + 5, powerUpY);
          powerUpY -= 15;
        }
        if (player.rapidFire) {
          ctx.fillText('🔥', player.x + PLAYER_SIZE + 5, powerUpY);
          powerUpY -= 15;
        }
        if (player.tripleShot) {
          ctx.fillText('⚔️', player.x + PLAYER_SIZE + 5, powerUpY);
        }

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

              if (target.hasShield) {
                updates[`players.${targetId}.hasShield`] = false;
                updates[`players.${targetId}.powerUpExpiry`] = 0;
              } else {
                const newHealth = Math.max(0, target.health - 1);
                updates[`players.${targetId}.health`] = newHealth;

                if (newHealth <= 0) {
                  const shooter = playersRef.current[bullet.owner];
                  if (shooter) {
                    updates[`players.${bullet.owner}.score`] = (shooter.score || 0) + 1;
                  }

                  const spawnX = 50 + Math.random() * (CANVAS_WIDTH - 100);
                  const spawnY = 50 + Math.random() * (CANVAS_HEIGHT - 100);
                  updates[`players.${targetId}.x`] = spawnX;
                  updates[`players.${targetId}.y`] = spawnY;
                  updates[`players.${targetId}.health`] = 5;
                  updates[`players.${targetId}.hasShield`] = false;
                  updates[`players.${targetId}.speedBoost`] = 1;
                  updates[`players.${targetId}.rapidFire`] = false;
                  updates[`players.${targetId}.tripleShot`] = false;
                  updates[`players.${targetId}.powerUpExpiry`] = 0;
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
        const currentPlayer = playersRef.current[playerId];

        if (currentPlayer?.isFrozen && currentPlayer.freezeExpiry && Date.now() < currentPlayer.freezeExpiry) {
          return;
        }

        const baseSpeed = 2.5;
        const speed = baseSpeed * (currentPlayer?.speedBoost || 1);

        let moveX = joystickPos.current.x;
        let moveY = joystickPos.current.y;

        if (Math.abs(moveX) > 0 && Math.abs(moveY) > 0) {
          if (Math.abs(moveX) > Math.abs(moveY)) {
            moveY = 0;
          } else {
            moveX = 0;
          }
        }

        let newX = playerPos.current.x + speed * moveX;
        let newY = playerPos.current.y + speed * moveY;

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

      checkPowerUpCollision();

      if (now - lastPowerUpSpawn.current > 15000) {
        spawnPowerUp();
        lastPowerUpSpawn.current = now;
      }

      const currentPlayer = playersRef.current[playerId];

      if (currentPlayer?.freezeExpiry && Date.now() > currentPlayer.freezeExpiry && currentPlayer.isFrozen) {
        updateDoc(gameStateRef, {
          [`players.${playerId}.isFrozen`]: false,
          [`players.${playerId}.freezeExpiry`]: 0,
        }).catch(() => {});
      }

      const fireRate = currentPlayer?.rapidFire ? 150 : 300;

      if (isShooting.current && Date.now() - lastShot.current > fireRate) {
        shoot();
        lastShot.current = Date.now();
      }
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [matchId, playerId]);

  const shoot = () => {
    const angle = weaponAngle.current;
    const centerX = playerPos.current.x + PLAYER_SIZE / 2;
    const centerY = playerPos.current.y + PLAYER_SIZE / 2;
    const currentPlayer = playersRef.current[playerId];
    const gameStateRef = doc(db, 'arena_game_state', matchId);

    const angles = currentPlayer?.tripleShot
      ? [angle - 0.2, angle, angle + 0.2]
      : [angle];

    const updates: any = {};

    angles.forEach((shootAngle, i) => {
      const bulletId = `${playerId}_${Date.now()}_${i}`;
      const bulletData = {
        x: centerX + Math.cos(shootAngle) * 30,
        y: centerY + Math.sin(shootAngle) * 30,
        speedX: Math.cos(shootAngle) * 10,
        speedY: Math.sin(shootAngle) * 10,
        owner: playerId,
        createdAt: Date.now(),
      };
      updates[`bullets.${bulletId}`] = bulletData;
    });

    updateDoc(gameStateRef, updates).catch(err => console.error('❌ Shoot failed:', err));
  };

  const spawnPowerUp = () => {
    const powerUpTypes: PowerUp['type'][] = ['shield', 'speed', 'health', 'rapid_fire', 'triple_shot', 'freeze'];
    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    const powerUpId = `powerup_${Date.now()}`;

    const gameStateRef = doc(db, 'arena_game_state', matchId);
    updateDoc(gameStateRef, {
      [`powerUps.${powerUpId}`]: {
        id: powerUpId,
        type: randomType,
        x: Math.random() * (CANVAS_WIDTH - 30),
        y: Math.random() * (CANVAS_HEIGHT - 30),
        createdAt: Date.now(),
      }
    }).catch(err => console.error('❌ Spawn powerup failed:', err));
  };

  const checkPowerUpCollision = () => {
    Object.entries(powerUpsRef.current).forEach(([id, powerUp]) => {
      const dx = playerPos.current.x - powerUp.x;
      const dy = playerPos.current.y - powerUp.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 30) {
        const gameStateRef = doc(db, 'arena_game_state', matchId);
        const updates: any = {};

        updates[`powerUps.${id}`] = deleteField();

        switch (powerUp.type) {
          case 'health':
            updates[`players.${playerId}.health`] = Math.min((playersRef.current[playerId]?.health || 3) + 1, 5);
            break;
          case 'shield':
            updates[`players.${playerId}.hasShield`] = true;
            updates[`players.${playerId}.powerUpExpiry`] = Date.now() + 10000;
            break;
          case 'speed':
            updates[`players.${playerId}.speedBoost`] = 1.5;
            updates[`players.${playerId}.powerUpExpiry`] = Date.now() + 8000;
            break;
          case 'rapid_fire':
            updates[`players.${playerId}.rapidFire`] = true;
            updates[`players.${playerId}.powerUpExpiry`] = Date.now() + 10000;
            break;
          case 'triple_shot':
            updates[`players.${playerId}.tripleShot`] = true;
            updates[`players.${playerId}.powerUpExpiry`] = Date.now() + 12000;
            break;
          case 'freeze':
            Object.keys(playersRef.current).forEach((pId) => {
              if (pId !== playerId) {
                updates[`players.${pId}.isFrozen`] = true;
                updates[`players.${pId}.freezeExpiry`] = Date.now() + 2000;
              }
            });
            break;
        }

        updateDoc(gameStateRef, updates).catch(err => console.error('❌ PowerUp pickup failed:', err));
      }
    });
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

  const currentPlayer = players[playerId];
  const activePowerUps: string[] = [];

  if (currentPlayer) {
    if (currentPlayer.hasShield) activePowerUps.push('🛡️ Shield');
    if (currentPlayer.speedBoost && currentPlayer.speedBoost > 1) activePowerUps.push('⚡ Speed Boost');
    if (currentPlayer.rapidFire) activePowerUps.push('🔥 Rapid Fire');
    if (currentPlayer.tripleShot) activePowerUps.push('⚔️ Triple Shot');
  }

  return (
    <div className="relative w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden touch-none">
      <div className="absolute top-2 left-2 text-white text-sm sm:text-xl z-10 bg-black bg-opacity-50 px-3 py-1 rounded">
        Score: {score} | HP: {health}/5
      </div>

      {activePowerUps.length > 0 && (
        <div className="absolute top-14 left-2 z-10 space-y-1">
          {activePowerUps.map((powerUp, index) => (
            <div key={index} className="bg-purple-600 bg-opacity-90 text-white text-xs sm:text-sm px-2 py-1 rounded shadow-lg">
              {powerUp}
            </div>
          ))}
        </div>
      )}

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
