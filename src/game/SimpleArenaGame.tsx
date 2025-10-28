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

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PLAYER_SIZE = 40;

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
          setBullets(Object.values(data.bullets));
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
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      Object.entries(players).forEach(([id, player]) => {
        if (player.health <= 0) return;

        ctx.save();
        ctx.translate(player.x + PLAYER_SIZE / 2, player.y + PLAYER_SIZE / 2);

        ctx.fillStyle = id === playerId ? '#00ff00' : '#ff4081';
        ctx.beginPath();
        ctx.arc(0, 0, PLAYER_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();

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

        const gameStateRef = doc(db, 'arena_game_state', matchId);
        updateDoc(gameStateRef, {
          [`players.${playerId}.x`]: playerPos.current.x,
          [`players.${playerId}.y`]: playerPos.current.y,
          [`players.${playerId}.angle`]: weaponAngle.current,
        });
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
      joystickPos.current = {
        x: Math.min(dx / maxDistance, 1),
        y: Math.min(dy / maxDistance, 1),
      };

      weaponAngle.current = Math.atan2(dy, dx);
    }
  };

  const handleJoystickEnd = () => {
    joystickPos.current = { x: 0, y: 0 };
  };

  return (
    <div className="relative w-full h-screen bg-black flex flex-col items-center justify-center">
      <div className="absolute top-4 left-4 text-white text-xl z-10">
        Score: {score} | HP: {health}/3
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-gray-600 bg-gray-900"
      />

      <div className="absolute bottom-8 w-full flex justify-between px-8">
        <div
          className="w-32 h-32 rounded-full bg-blue-500 bg-opacity-30 flex items-center justify-center"
          onTouchStart={handleJoystickMove}
          onTouchMove={handleJoystickMove}
          onTouchEnd={handleJoystickEnd}
          onMouseDown={handleJoystickMove}
          onMouseMove={(e) => e.buttons === 1 && handleJoystickMove(e)}
          onMouseUp={handleJoystickEnd}
        >
          <div className="w-16 h-16 rounded-full bg-blue-600"></div>
        </div>

        <button
          className="w-24 h-24 rounded-full bg-red-500 text-white text-2xl"
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
        className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded z-10"
      >
        Leave
      </button>
    </div>
  );
};
