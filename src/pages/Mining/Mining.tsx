import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Battery, Rocket, Clock, TrendingUp, Star } from 'lucide-react';
import { Button } from 'components';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';

export const Mining = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameStats, ships, mineZen, isMining, isLoading } = useGame();
  const [selectedShip, setSelectedShip] = useState<string | null>(null);
  const [miningProgress, setMiningProgress] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (ships.length > 0 && !selectedShip) {
      setSelectedShip(ships[0].id);
    }
  }, [ships, selectedShip]);

  // Update mining progress for ships
  useEffect(() => {
    const interval = setInterval(() => {
      const newProgress: { [key: string]: number } = {};
      ships.forEach(ship => {
        const lastMining = new Date(ship.last_mining);
        const now = new Date();
        const timeDiff = now.getTime() - lastMining.getTime();
        const progress = Math.min(100, (timeDiff / (60 * 1000)) * 100); // 1 minute = 100%
        newProgress[ship.id] = progress;
      });
      setMiningProgress(newProgress);
    }, 1000);

    return () => clearInterval(interval);
  }, [ships]);

  const handleMine = async (shipId: string) => {
    await mineZen(shipId);
  };

  const getEnergyPercentage = (ship: any) => {
    return (ship.current_energy / ship.energy_capacity) * 100;
  };

  const canMine = (ship: any) => {
    // Always use the most recent mining time from either field
    const lastMiningField = ship.last_mining || ship.lastMining;
    const lastMining = lastMiningField?.toDate?.() || new Date(lastMiningField || new Date());
    const now = new Date();
    const timeDiff = now.getTime() - lastMining.getTime();
    const secondsPassed = Math.floor(timeDiff / 1000);
    
    const hasEnergy = (ship.current_energy || ship.currentEnergy || 0) >= 10;
    const cooldownPassed = secondsPassed >= 60; // 60 seconds = 1 minute
    
    console.log('⛏️ Mining: canMine check for ship', ship.name, {
      hasEnergy,
      currentEnergy: ship.current_energy || ship.currentEnergy,
      cooldownPassed,
      secondsPassed,
      lastMiningField,
      lastMiningParsed: lastMining.toISOString(),
      now: now.toISOString(),
      result: hasEnergy && cooldownPassed
    });
    
    return hasEnergy && cooldownPassed;
  };

  const getTimeUntilNextMining = (ship: any) => {
    // Always use the most recent mining time from either field
    const lastMiningField = ship.last_mining || ship.lastMining;
    const lastMining = lastMiningField?.toDate?.() || new Date(lastMiningField || new Date());
    const now = new Date();
    const timeDiff = now.getTime() - lastMining.getTime();
    const secondsElapsed = Math.floor(timeDiff / 1000);
    const secondsRemaining = Math.max(0, 60 - secondsElapsed);
    
    console.log('⏰ Mining: getTimeUntilNextMining debug:', {
      shipName: ship.name,
      lastMiningField,
      lastMining: lastMining.toISOString(),
      now: now.toISOString(),
      timeDiff,
      secondsElapsed,
      secondsRemaining
    });
    
    if (secondsElapsed >= 60) return "Ready!";
    return `${secondsRemaining}s remaining`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div>
          <div className="text-xl text-cyan-400 font-orbitron">Loading Mining Station...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 font-inter">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg')] bg-cover bg-center opacity-5"></div>
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-orbitron font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Mining Station
            </h1>
            <p className="text-gray-400 text-lg">
              Deploy your ships and mine ZEN tokens across the galaxy
            </p>
          </div>

          {/* Game Stats */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-cyan-500/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="text-cyan-400" size={20} />
                  <span className="text-gray-400 font-medium">ZEN Balance</span>
                </div>
                <div className="text-2xl md:text-3xl font-orbitron font-bold text-cyan-400">
                  {gameStats?.zen_balance?.toLocaleString() || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="text-purple-400" size={20} />
                  <span className="text-gray-400 font-medium">Total Mined</span>
                </div>
                <div className="text-2xl md:text-3xl font-orbitron font-bold text-purple-400">
                  {gameStats?.total_mined?.toLocaleString() || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="text-green-400" size={20} />
                  <span className="text-gray-400 font-medium">Level</span>
                </div>
                <div className="text-2xl md:text-3xl font-orbitron font-bold text-green-400">
                  {gameStats?.mining_level || 1}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Rocket className="text-orange-400" size={20} />
                  <span className="text-gray-400 font-medium">Ships</span>
                </div>
                <div className="text-2xl md:text-3xl font-orbitron font-bold text-orange-400">
                  {ships.length}
                </div>
              </div>
            </div>
          </div>

          {/* Ships Grid */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-orbitron font-bold text-white">
                Your Mining Fleet
              </h2>
              <Button
                onClick={() => navigate('/ships')}
                variant="outline"
                className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900"
              >
                <Rocket size={16} />
                Manage Ships
              </Button>
            </div>

            {ships.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-8 border border-gray-700/50 text-center">
                <Rocket size={48} className="text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-orbitron font-bold text-gray-400 mb-2">
                  No Ships Available
                </h3>
                <p className="text-gray-500 mb-4">
                  You need at least one ship to start mining ZEN tokens
                </p>
                <Button
                  onClick={() => navigate('/ships')}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
                >
                  Get Your First Ship
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ships.map((ship) => {
                  const energyPercentage = getEnergyPercentage(ship);
                  const canMineNow = canMine(ship);
                  const progress = miningProgress[ship.id] || 0;
                  
                  return (
                    <div
                      key={ship.id}
                      className={`bg-slate-800/70 backdrop-blur-lg rounded-xl p-6 border transition-all duration-300 hover:transform hover:scale-105 ${
                        selectedShip === ship.id 
                          ? 'border-cyan-500 shadow-lg shadow-cyan-500/20' 
                          : 'border-gray-700/50 hover:border-cyan-500/50'
                      }`}
                      onClick={() => setSelectedShip(ship.id)}
                    >
                      <div className="space-y-4">
                        {/* Ship Header */}
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-orbitron font-bold text-white">
                              {ship.name}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              Level {ship.level} • {ship.ship_type}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-cyan-400 font-orbitron font-bold">
                              {ship.mining_power}
                            </div>
                            <div className="text-gray-400 text-xs">Power</div>
                          </div>
                        </div>

                        {/* Energy Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm flex items-center gap-1">
                              <Battery size={14} />
                              Energy
                            </span>
                            <span className="text-white text-sm font-medium">
                              {ship.current_energy}/{ship.energy_capacity}
                            </span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                energyPercentage > 50 ? 'bg-green-500' :
                                energyPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${energyPercentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Mining Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm flex items-center gap-1">
                              <Clock size={14} />
                              Mining Progress
                            </span>
                            <span className={`text-sm font-medium ${
                              canMineNow ? 'text-green-400' : 'text-orange-400'
                            }`}>
                              {getTimeUntilNextMining(ship)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                canMineNow 
                                  ? 'bg-gradient-to-r from-green-500 to-green-400' 
                                  : 'bg-gradient-to-r from-orange-500 to-yellow-500'
                              }`}
                              style={{ width: `${canMineNow ? 100 : progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Mine Button */}
                        <Button
                          onClick={() => handleMine(ship.id)}
                          disabled={!canMineNow || isMining}
                          className={`w-full py-3 rounded-xl font-orbitron font-bold transition-all duration-200 ${
                            canMineNow && !isMining
                              ? 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                              : 'bg-slate-700 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {isMining ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Mining...
                            </div>
                          ) : canMineNow ? (
                            <div className="flex items-center justify-center gap-2">
                              <Zap size={16} />
                              Mine ZEN
                            </div>
                          ) : (ship.current_energy || ship.currentEnergy || 0) < 10 ? (
                            <div className="flex items-center justify-center gap-2">
                              <Battery size={16} />
                              No Energy
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <Clock size={16} />
                              {getTimeUntilNextMining(ship)}
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

          {/* Mining Tips */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-xl font-orbitron font-bold text-white mb-4">
              Mining Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Zap size={16} className="text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium">Energy Management</h4>
                  <p className="text-gray-400 text-sm">Ships need energy to mine. Energy regenerates over time.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={16} className="text-purple-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium">Level Up</h4>
                  <p className="text-gray-400 text-sm">Higher levels increase your mining efficiency and rewards.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Star size={16} className="text-green-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium">Upgrades</h4>
                  <p className="text-gray-400 text-sm">Upgrade your ships to mine more ZEN tokens per operation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};