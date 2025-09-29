import React, { useState } from 'react';
import { Rocket, Zap, Battery, TrendingUp, ShoppingCart, Wrench } from 'lucide-react';
import { Button } from 'components';
import { useGame } from '../../context/GameContext';

const shipTypes = [
  {
    type: 'basic',
    name: 'Zen Puppy',
    cost: 0,
    mining_power: 10,
    energy_capacity: 100,
    description: 'A gentle starter companion for new spiritual seekers',
    image: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg'
  },
  {
    type: 'advanced',
    name: 'Cosmic Retriever',
    cost: 1000,
    mining_power: 25,
    energy_capacity: 200,
    description: 'Enhanced spiritual capabilities with better energy flow',
    image: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg'
  },
  {
    type: 'elite',
    name: 'Astral Shepherd',
    cost: 5000,
    mining_power: 50,
    energy_capacity: 300,
    description: 'High-performance companion for serious spiritual practitioners',
    image: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg'
  },
  {
    type: 'legendary',
    name: 'Divine Wolf',
    cost: 20000,
    mining_power: 100,
    energy_capacity: 500,
    description: 'The ultimate spiritual companion with maximum enlightenment',
    image: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg'
  }
];

const upgradeTypes = [
  {
    type: 'mining_power',
    name: 'Spiritual Power',
    description: 'Increase ZEN energy harvested per meditation',
    icon: <Zap size={20} className="text-cyan-400" />
  },
  {
    type: 'energy_capacity',
    name: 'Spiritual Capacity',
    description: 'Increase maximum spiritual energy storage',
    icon: <Battery size={20} className="text-green-400" />
  },
  {
    type: 'efficiency',
    name: 'Meditation Efficiency',
    description: 'Reduce energy consumption per meditation session',
    icon: <TrendingUp size={20} className="text-purple-400" />
  }
];

export const Ships = () => {
  const { gameStats, ships, upgradeShip, buyShip, isLoading } = useGame();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedShip, setSelectedShip] = useState<string | null>(null);

  const calculateUpgradeCost = (ship: any, upgradeType: string) => {
    const currentLevel = ship.upgrades[upgradeType] || 0;
    const baseCost = {
      mining_power: 100,
      miningPower: 100,
      energy_capacity: 80,
      energyCapacity: 80,
      efficiency: 150
    };
    const cost = baseCost[upgradeType as keyof typeof baseCost] || 100;
    const finalCost = Math.floor(cost * Math.pow(1.5, currentLevel));
    
    console.log('💰 Ships: calculateUpgradeCost:', {
      upgradeType,
      currentLevel,
      baseCost: cost,
      finalCost,
      ship: ship
    });
    
    return finalCost;
  };

  const canAfford = (cost: number) => {
    const currentBalance = Number(gameStats?.zenBalance || 0);
    console.log('💰 Ships: Checking affordability - Balance:', currentBalance, 'Cost:', cost);
    return currentBalance >= cost;
  };

  const getEnergyPercentage = (ship: any) => {
    const currentEnergy = ship.current_energy || ship.currentEnergy || 0;
    const maxEnergy = ship.energy_capacity || ship.energyCapacity || 100;
    return (currentEnergy / maxEnergy) * 100;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div>
          <div className="text-xl text-cyan-400 font-orbitron">Loading Fleet...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 font-inter">
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-orbitron font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Cosmic Pack Management
            </h1>
            <p className="text-gray-400 text-lg">
              Manage your cosmic pack and adopt new spiritual companions
            </p>
            <div className="flex items-center justify-center gap-2 text-cyan-400 font-orbitron font-bold text-xl">
              <span>⚡</span>
              {gameStats?.zenBalance?.toLocaleString() || 0} ZEN
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-cyan-500/20 overflow-hidden">
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setActiveTab(0)}
                className={`flex-1 px-6 py-4 font-orbitron font-bold transition-all duration-200 ${
                  activeTab === 0
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                My Dogs ({ships.length}) 🐕
              </button>
              <button
                onClick={() => setActiveTab(1)}
                className={`flex-1 px-6 py-4 font-orbitron font-bold transition-all duration-200 ${
                  activeTab === 1
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Adoption Center
              </button>
            </div>

            <div className="p-6">
              {activeTab === 0 && (
                <div className="space-y-6">
                  {ships.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="text-6xl mb-4 block">🐕</span>
                      <h3 className="text-xl font-orbitron font-bold text-gray-400 mb-2">
                        No Dogs in Pack
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Adopt your first cosmic dog to start harvesting ZEN energy
                      </p>
                      <Button
                        onClick={() => setActiveTab(1)}
                        className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white flex items-center gap-2"
                      >
                        <span>🐕</span>
                        Visit Adoption Center
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {ships.map((ship) => {
                        const energyPercentage = getEnergyPercentage(ship);
                        
                        return (
                          <div
                            key={ship.id}
                            className="bg-slate-700/50 rounded-xl p-6 border border-gray-600/50 hover:border-cyan-500/50 transition-all duration-300"
                          >
                            <div className="space-y-4">
                              {/* Dog Info */}
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-xl font-orbitron font-bold text-white">
                                    {ship.name}
                                  </h3>
                                  <p className="text-gray-400">
                                    Level {ship.level} • {ship.shipType} 🐕
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="text-cyan-400 font-orbitron font-bold text-lg">
                                    {ship.miningPower}
                                  </div>
                                  <div className="text-gray-400 text-sm">Spiritual Power</div>
                                </div>
                              </div>

                              {/* Spiritual Energy Status */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400 text-sm">
                                    ⚡ Spiritual Energy
                                  </span>
                                  <span className="text-white text-sm">
                                    {ship.currentEnergy}/{ship.energyCapacity}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-600 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      energyPercentage > 50 ? 'bg-green-500' :
                                      energyPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${energyPercentage}%` }}
                                  />
                                </div>
                              </div>

                              {/* Training */}
                              <div className="space-y-3">
                                <h4 className="text-white font-orbitron font-bold">Training</h4>
                                <div className="grid grid-cols-1 gap-2">
                                  {upgradeTypes.map((upgrade) => {
                                    const currentLevel = ship.upgrades[upgrade.type] || 0;
                                    const cost = calculateUpgradeCost(ship, upgrade.type);
                                    const affordable = canAfford(cost);
                                    
                                    return (
                                      <div
                                        key={upgrade.type}
                                        className="flex items-center justify-between bg-slate-600/30 rounded-lg p-3"
                                      >
                                        <div className="flex items-center gap-3">
                                          {upgrade.icon}
                                          <div>
                                            <div className="text-white font-medium text-sm">
                                              {upgrade.name} (Lv.{currentLevel})
                                            </div>
                                            <div className="text-gray-400 text-xs">
                                              {upgrade.description}
                                            </div>
                                          </div>
                                        </div>
                                        <Button
                                          onClick={() => upgradeShip(ship.id!, upgrade.type)}
                                          disabled={!affordable}
                                          className={`px-3 py-1 text-xs font-orbitron font-bold rounded-lg ${
                                            affordable
                                              ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white'
                                              : 'bg-slate-600 text-gray-400 cursor-not-allowed'
                                          }`}
                                        >
                                          {cost} ZEN
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {shipTypes.map((shipType) => {
                      const affordable = canAfford(shipType.cost);
                      const owned = ships.some(s => s.shipType === shipType.type);
                      
                      return (
                        <div
                          key={shipType.type}
                          className="bg-slate-700/50 rounded-xl overflow-hidden border border-gray-600/50 hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:scale-105"
                        >
                          <div className="aspect-video bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                            <span className="text-6xl">🐕</span>
                          </div>
                          
                          <div className="p-4 space-y-4">
                            <div>
                              <h3 className="text-lg font-orbitron font-bold text-white">
                                {shipType.name}
                              </h3>
                              <p className="text-gray-400 text-sm">
                                {shipType.description}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-400 text-sm">Spiritual Power:</span>
                                <span className="text-cyan-400 font-bold">{shipType.mining_power}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400 text-sm">Energy Capacity:</span>
                                <span className="text-green-400 font-bold">{shipType.energy_capacity}</span>
                              </div>
                            </div>

                            <Button
                              onClick={() => buyShip(shipType.type)}
                              disabled={!affordable || owned || shipType.cost === 0}
                              className={`w-full py-3 rounded-xl font-orbitron font-bold transition-all duration-200 ${
                                shipType.cost === 0 ? 'bg-slate-600 text-gray-400 cursor-not-allowed' :
                                owned ? 'bg-green-600 text-white cursor-not-allowed' :
                                affordable
                                  ? 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white'
                                  : 'bg-slate-600 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {shipType.cost === 0 ? 'Starter Dog' :
                               owned ? 'Adopted' :
                               affordable ? (
                                <div className="flex items-center justify-center gap-2">
                                  <span>🐕</span>
                                  Adopt for {shipType.cost.toLocaleString()} ZEN
                                </div>
                               ) : `Need ${shipType.cost.toLocaleString()} ZEN`}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};