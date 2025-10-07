import React, { useState } from 'react';
import { ArrowLeft, Gamepad2, Trophy, Zap, Lock, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'components';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { GameService } from '../../services/gameService';

interface GameCard {
  id: string;
  title: string;
  description: string;
  emoji: string;
  route: string;
  isAvailable: boolean;
  minLevel?: number;
}

const games: GameCard[] = [
  {
    id: 'pupfi-catcher',
    title: 'PupFi Catcher',
    description: 'Help your pup catch falling treats and avoid bombs!',
    emoji: '🦴',
    route: '/game/pupfi-catcher',
    isAvailable: true,
  },
  {
    id: 'memory-game',
    title: 'Memory Match',
    description: 'Match pairs of adorable pups to earn rewards!',
    emoji: '🧠',
    route: '/game/memory-match',
    isAvailable: true,
  },
  {
    id: 'puzzle-game',
    title: 'Pup Puzzle',
    description: 'Solve fun puzzles with your virtual pets!',
    emoji: '🧩',
    route: '/game/puzzle',
    isAvailable: true,
  },
  {
    id: 'racing-game',
    title: 'Pup Racing',
    description: 'Race with your dogs and win amazing prizes!',
    emoji: '🏁',
    route: '/game/racing',
    isAvailable: true,
  },
];

export const GameCenter = () => {
  const navigate = useNavigate();
  const { gameStats } = useGame();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [isClaimingTickets, setIsClaimingTickets] = useState(false);

  const handleGameClick = (game: GameCard) => {
    if (game.isAvailable) {
      navigate(game.route);
    }
  };

  const handleClaimDailyTickets = async () => {
    if (!user?.id || isClaimingTickets) return;

    setIsClaimingTickets(true);
    try {
      const result = await GameService.claimDailyTickets(user.id);

      if (result.success) {
        success(result.message);
        // Reload to update stats
        window.location.reload();
      } else {
        error(result.message);
      }
    } catch (err) {
      console.error('Error claiming daily tickets:', err);
      error('Failed to claim daily tickets');
    } finally {
      setIsClaimingTickets(false);
    }
  };

  return (
    <div className="page-bg font-inter min-h-screen">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="space-y-6 md:space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Button
              onClick={() => navigate('/')}
              className="cute-button px-4 py-2 flex items-center gap-2 self-start"
            >
              <ArrowLeft size={16} />
              Back Home
            </Button>
            <div className="text-center flex-1">
              <h1 className="text-3xl md:text-5xl font-inter font-black mb-2">
                <span className="text-5xl md:text-6xl">🎮</span>{' '}
                <span className="gradient-text">Game Center</span>
              </h1>
              <p className="text-gray-700 font-inter text-sm md:text-base">
                Choose your favorite mini-game and start playing!
              </p>
            </div>
            <div className="food-points self-end md:self-auto">
              <span>🍖</span>
              <span className="font-inter font-bold">
                {gameStats?.zenBalance?.toLocaleString() || '0'}
              </span>
            </div>
          </div>

          {/* Daily Tickets Banner */}
          <div className="cute-card p-4 md:p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl md:text-5xl">🎫</div>
                <div>
                  <h3 className="text-lg md:text-xl font-inter font-bold text-gray-800">
                    Daily Free Tickets
                  </h3>
                  <p className="text-sm text-gray-600 font-inter">
                    Claim 5 free tickets every day!
                  </p>
                </div>
              </div>
              <Button
                onClick={handleClaimDailyTickets}
                disabled={isClaimingTickets}
                className="cute-button px-6 py-3 flex items-center gap-2"
              >
                <Gift size={18} />
                {isClaimingTickets ? 'Claiming...' : 'Claim Daily Tickets'}
              </Button>
            </div>
          </div>

          {/* Stats Banner */}
          <div className="cute-card p-4 md:p-6">
            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              <div className="stat-card">
                <div className="stat-value text-xl md:text-2xl">
                  {games.filter(g => g.isAvailable).length}
                </div>
                <div className="stat-label">Available Games</div>
              </div>
              <div className="stat-card">
                <div className="stat-value text-xl md:text-2xl">
                  {gameStats?.zenBalance?.toLocaleString() || '0'}
                </div>
                <div className="stat-label">Total Food</div>
              </div>
              <div className="stat-card">
                <div className="stat-value text-xl md:text-2xl flex items-center gap-2">
                  🎫 {gameStats?.gameTickets || '0'}
                </div>
                <div className="stat-label">Game Tickets</div>
              </div>
              <div className="stat-card">
                <div className="stat-value text-xl md:text-2xl">
                  {games.length}
                </div>
                <div className="stat-label">Total Games</div>
              </div>
            </div>
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {games.map((game) => (
              <div
                key={game.id}
                onClick={() => handleGameClick(game)}
                className={`cute-card p-6 transition-all duration-300 ${
                  game.isAvailable
                    ? 'cursor-pointer hover:scale-105 hover:shadow-2xl'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="text-center space-y-4">
                  {/* Game Icon */}
                  <div className="text-6xl md:text-7xl mb-4 transform hover:scale-110 transition-transform">
                    {game.emoji}
                  </div>

                  {/* Game Title */}
                  <h3 className="text-xl md:text-2xl font-inter font-bold text-gray-800">
                    {game.title}
                  </h3>

                  {/* Game Description */}
                  <p className="text-gray-600 font-inter text-sm">
                    {game.description}
                  </p>

                  {/* Status/Action */}
                  <div className="pt-4">
                    {game.isAvailable ? (
                      <Button className="cute-button w-full py-3 flex items-center justify-center gap-2">
                        <Gamepad2 size={18} className="text-white" />
                        Play Now
                      </Button>
                    ) : (
                      <div className="cute-card-disabled p-3 flex items-center justify-center gap-2 bg-gray-100 rounded-lg">
                        <Lock size={16} className="text-gray-500" />
                        <span className="text-gray-500 font-inter text-sm">
                          Coming Soon
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Min Level Badge */}
                  {game.minLevel && !game.isAvailable && (
                    <div className="text-xs text-gray-500 font-inter">
                      Unlocks at Level {game.minLevel}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Info Card */}
          <div className="cute-card p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">💡</div>
              <div className="flex-1 space-y-2">
                <h3 className="font-inter font-bold text-gray-800 text-lg">
                  How to Play
                </h3>
                <ul className="space-y-2 text-gray-600 text-sm font-inter">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">•</span>
                    <span>Choose any available game from the grid above</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">•</span>
                    <span>Play mini-games to earn food points for your pups</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">•</span>
                    <span>Higher scores earn more rewards!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">•</span>
                    <span>Claim 5 free tickets daily to play more games!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">•</span>
                    <span>Earn tickets by completing tasks and leveling up</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">•</span>
                    <span>More games coming soon - stay tuned!</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
