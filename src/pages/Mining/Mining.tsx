import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Battery, Clock, TrendingUp, Star } from 'lucide-react';
import { Button } from 'components';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';

export const Mining = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameStats, ships, mineZen, isMining, isLoading } = useGame();
  const [selectedShip, setSelectedShip] = useState<string | null>(null);
  const [feedingProgress, setFeedingProgress] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (ships.length > 0 && !selectedShip) {
      setSelectedShip(ships[0].id || null);
    }
  }, [ships, selectedShip]);

  // Update feeding progress for dogs
  useEffect(() => {
    const interval = setInterval(() => {
      const newProgress: { [key: string]: number } = {};
      ships.forEach(ship => {
       if (!ship.id) return;
       const lastFeeding = ship.lastMining?.toDate?.() || new Date(ship.lastMining || new Date());
        const now = new Date();
        const timeDiff = now.getTime() - lastFeeding.getTime();
        const progress = Math.min(100, (timeDiff / (60 * 1000)) * 100); // 1 minute = 100%
       newProgress[ship.id] = progress;
      });
      setFeedingProgress(newProgress);
    }, 1000);

    return () => clearInterval(interval);
  }, [ships]);

  const handleFeed = async (shipId: string) => {
    await mineZen(shipId);
  };

  const getHappinessPercentage = (ship: any) => {
    return (ship.current_energy / ship.energy_capacity) * 100;
  };

  const canFeed = (ship: any) => {
    const lastFeedingField = ship.lastMining;
    const lastFeeding = lastFeedingField?.toDate?.() || new Date(lastFeedingField || new Date());
    const now = new Date();
    const timeDiff = now.getTime() - lastFeeding.getTime();
    const secondsPassed = Math.floor(timeDiff / 1000);
    
   const hasHunger = (ship.currentEnergy || 0) >= 10;
    const cooldownPassed = secondsPassed >= 60; // 60 seconds = 1 minute
    
    console.log('🍖 Feeding: canFeed check for dog', ship.name, {
      hasHunger,
      currentHunger: ship.current_energy || ship.currentEnergy,
      cooldownPassed,
      secondsPassed,
      lastFeedingField,
      lastFeedingParsed: lastFeeding.toISOString(),
      now: now.toISOString(),
      result: hasHunger && cooldownPassed
    });
    
    return hasHunger && cooldownPassed;
  };

  const getTimeUntilNextFeeding = (ship: any) => {
    const lastFeedingField = ship.lastMining;
    const lastFeeding = lastFeedingField?.toDate?.() || new Date(lastFeedingField || new Date());
    const now = new Date();
    const timeDiff = now.getTime() - lastFeeding.getTime();
    const secondsElapsed = Math.floor(timeDiff / 1000);
    const secondsRemaining = Math.max(0, 60 - secondsElapsed);
    
    console.log('⏰ Feeding: getTimeUntilNextFeeding debug:', {
      dogName: ship.name,
      lastFeedingField,
      lastFeeding: lastFeeding.toISOString(),
      now: now.toISOString(),
      timeDiff,
      secondsElapsed,
      secondsRemaining
    });
    
    if (secondsElapsed >= 60) return "Ready to eat!";
    return `${secondsRemaining}s until hungry`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-400 mx-auto"></div>
          <div className="text-xl text-pink-600 font-bold">Loading Pet Care Center...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg font-nunito">
      {/* Animated Background */}
      <div className="floating-hearts">
          {/* Floating hearts and stars */}
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="floating-heart"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                fontSize: `${8 + Math.random() * 6}px`,
                color: ['#ff6b9d', '#ec4899', '#d946ef', '#fbbf24'][Math.floor(Math.random() * 4)]
              }}
            >
              {['💖', '⭐', '🌟', '💫', '🎀'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="title-responsive font-fredoka font-bold gradient-text">
              Pet Care Center
            </h1>
            <p className="text-tamagochi-text-dark text-lg font-nunito">
              Feed your dogs and watch them grow happy and healthy! 🐕💖
            </p>
          </div>

          {/* Game Stats */}
          <div className="cute-card p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="stat-card">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-tamagochi-500 text-xl">🍖</span>
                  <span className="text-tamagochi-text-dark font-nunito font-medium">Food Points</span>
                </div>
                <div className="stat-value">
                  {gameStats?.zenBalance?.toLocaleString() || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-purple-500 text-xl">❤️</span>
                  <span className="text-gray-700 font-medium">Love Given</span>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-purple-600">
                  {gameStats?.totalMined?.toLocaleString() || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-green-500 text-xl">🏆</span>
                  <span className="text-gray-700 font-medium">Care Level</span>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-green-600">
                  {gameStats?.miningLevel || 1}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-orange-500 text-xl">🐕</span>
                  <span className="text-gray-700 font-medium">Pet Dogs</span>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-orange-600">
                  {ships.length}
                </div>
              </div>
            </div>
          </div>

          {/* Dogs Grid */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Your Pet Dogs
              </h2>
              <Button
                onClick={() => navigate('/ships')}
                variant="outline"
                className="border-pink-400 text-pink-600 hover:bg-pink-400 hover:text-white flex items-center gap-2"
              >
                <span>🐕</span>
                Manage Dogs
              </Button>
            </div>

            {ships.length === 0 ? (
              <div className="bg-white/70 backdrop-blur-lg rounded-xl p-8 border border-pink-300/40 text-center shadow-lg">
                <span className="text-6xl mb-4 block">🐕</span>
                <h3 className="text-xl font-bold text-gray-700 mb-2">
                  No Pet Dogs Available
                </h3>
                <p className="text-gray-600 mb-4">
                  You need at least one dog to start the pet care experience
                </p>
                <Button
                  onClick={() => navigate('/ships')}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center gap-2"
                >
                  <span>🐕</span>
                  Adopt Your First Dog
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ships.map((ship) => {
                  const happinessPercentage = getHappinessPercentage(ship);
                  const canFeedNow = canFeed(ship);
                 const progress = feedingProgress[ship.id || ''] || 0;
                  
                  return (
                    <div
                      key={ship.id}
                      className={`bg-white/70 backdrop-blur-lg rounded-xl p-6 border transition-all duration-300 hover:transform hover:scale-105 shadow-lg ${
                        selectedShip === ship.id 
                          ? 'border-pink-400 shadow-pink-200' 
                          : 'border-pink-200/50 hover:border-pink-400/50'
                      }`}
                     onClick={() => setSelectedShip(ship.id || null)}
                    >
                      <div className="space-y-4">
                        {/* Dog Header */}
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">
                              {ship.name}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              Level {ship.level} • {ship.shipType} 🐕
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-pink-600 font-bold">
                              {ship.miningPower}
                            </div>
                            <div className="text-gray-600 text-xs">Appetite</div>
                          </div>
                        </div>

                        {/* Happiness Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">
                              💖 Happiness Level
                            </span>
                            <span className="text-gray-800 text-sm font-medium">
                              {ship.currentEnergy}/{ship.energyCapacity}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                happinessPercentage > 50 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                                happinessPercentage > 25 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gradient-to-r from-red-400 to-red-500'
                              }`}
                              style={{ width: `${happinessPercentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Feeding Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">
                              🍖 Feeding Time
                            </span>
                            <span className={`text-sm font-medium ${
                              canFeedNow ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {getTimeUntilNextFeeding(ship)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                canFeedNow 
                                  ? 'bg-gradient-to-r from-green-400 to-green-500' 
                                  : 'bg-gradient-to-r from-orange-400 to-yellow-500'
                              }`}
                              style={{ width: `${canFeedNow ? 100 : progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Feed Button */}
                        <Button
                         onClick={() => handleFeed(ship.id!)}
                          disabled={!canFeedNow || isMining}
                          className={`w-full py-3 rounded-xl font-bold transition-all duration-200 ${
                            canFeedNow && !isMining
                              ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {isMining ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Feeding...
                            </div>
                          ) : canFeedNow ? (
                            <div className="flex items-center justify-center gap-2">
                              <span>🍖</span>
                              Feed Dog
                            </div>
                         ) : (ship.currentEnergy || 0) < 10 ? (
                            <div className="flex items-center justify-center gap-2">
                              <span>😴</span>
                              Dog is Full
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <Clock size={16} />
                              {getTimeUntilNextFeeding(ship)}
                            </div>
                         )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pet Care Tips */}
          <div className="bg-white/70 backdrop-blur-lg rounded-xl p-6 border border-pink-300/40 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Pet Care Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center flex-shrink-0 text-xl">
                  🍖
                </div>
                <div>
                  <h4 className="text-gray-800 font-medium">Regular Feeding</h4>
                  <p className="text-gray-600 text-sm">Feed your dogs regularly to keep them happy and earn food points.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0 text-xl">
                  💖
                </div>
                <div>
                  <h4 className="text-gray-800 font-medium">Show Love</h4>
                  <p className="text-gray-600 text-sm">Higher care levels increase your feeding efficiency and rewards.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 text-xl">
                  🐕
                </div>
                <div>
                  <h4 className="text-gray-800 font-medium">Adopt More Dogs</h4>
                  <p className="text-gray-600 text-sm">Adopt different dog breeds to earn more food points per feeding.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};