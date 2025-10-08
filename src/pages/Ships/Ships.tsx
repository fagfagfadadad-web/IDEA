import React, { useState } from 'react';
import { Heart, Battery, TrendingUp, ShoppingCart, Wrench } from 'lucide-react';
import { Button } from 'components';
import { useGame } from '../../context/GameContext';

const dogTypes = [
  {
    type: 'basic',
    name: 'Playful Puppy',
    cost: 0,
    mining_power: 10,
    energy_capacity: 100,
    description: 'A cute and energetic puppy perfect for beginners',
    emoji: '🐶'
  },
  {
    type: 'beagle',
    name: 'Curious Beagle',
    cost: 500,
    mining_power: 15,
    energy_capacity: 150,
    description: 'A friendly and curious pup who loves treats',
    emoji: '🐕'
  },
  {
    type: 'advanced',
    name: 'Golden Retriever',
    cost: 1000,
    mining_power: 25,
    energy_capacity: 200,
    description: 'A loyal and loving companion with great appetite',
    emoji: '🦮'
  },
  {
    type: 'poodle',
    name: 'Smart Poodle',
    cost: 1500,
    mining_power: 30,
    energy_capacity: 220,
    description: 'An intelligent and elegant dog with refined taste',
    emoji: '🐩'
  },
  {
    type: 'bulldog',
    name: 'Tough Bulldog',
    cost: 2500,
    mining_power: 35,
    energy_capacity: 250,
    description: 'A sturdy and determined companion',
    emoji: '🐕'
  },
  {
    type: 'shepherd',
    name: 'German Shepherd',
    cost: 4000,
    mining_power: 45,
    energy_capacity: 280,
    description: 'A brave and protective guardian dog',
    emoji: '🐕‍🦺'
  },
  {
    type: 'elite',
    name: 'Husky Explorer',
    cost: 5000,
    mining_power: 50,
    energy_capacity: 300,
    description: 'An adventurous dog with high energy and appetite',
    emoji: '🐺'
  },
  {
    type: 'dalmatian',
    name: 'Spotted Dalmatian',
    cost: 7500,
    mining_power: 60,
    energy_capacity: 350,
    description: 'A energetic spotted beauty with endless enthusiasm',
    emoji: '🐕'
  },
  {
    type: 'akita',
    name: 'Noble Akita',
    cost: 10000,
    mining_power: 70,
    energy_capacity: 400,
    description: 'A majestic and loyal Japanese companion',
    emoji: '🐕'
  },
  {
    type: 'doberman',
    name: 'Elite Doberman',
    cost: 15000,
    mining_power: 85,
    energy_capacity: 450,
    description: 'A sleek and powerful protector',
    emoji: '🐕‍🦺'
  },
  {
    type: 'legendary',
    name: 'Royal Corgi',
    cost: 20000,
    mining_power: 100,
    energy_capacity: 500,
    description: 'The ultimate companion with royal appetite and charm',
    emoji: '👑🐕'
  },
  {
    type: 'mythic',
    name: 'Mystical Wolf',
    cost: 50000,
    mining_power: 150,
    energy_capacity: 700,
    description: 'A rare and powerful wolf with supernatural abilities',
    emoji: '🐺✨'
  },
  {
    type: 'divine',
    name: 'Celestial Hound',
    cost: 100000,
    mining_power: 250,
    energy_capacity: 1000,
    description: 'A legendary divine companion from the heavens',
    emoji: '🌟🐕'
  }
];

const upgradeTypes = [
  {
    type: 'mining_power',
    name: 'Appetite Boost',
    description: 'Increase food points earned per feeding',
    icon: <Heart size={20} className="text-pink-500" />
  },
  {
    type: 'energy_capacity',
    name: 'Happiness Capacity',
    description: 'Increase maximum happiness level',
    icon: <Battery size={20} className="text-green-500" />
  },
  {
    type: 'efficiency',
    name: 'Care Efficiency',
    description: 'Reduce time between feedings',
    icon: <TrendingUp size={20} className="text-purple-500" />
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
    
    console.log('💰 Dogs: calculateUpgradeCost:', {
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
    console.log('💰 Dogs: Checking affordability - Balance:', currentBalance, 'Cost:', cost);
    return currentBalance >= cost;
  };

  const getHappinessPercentage = (ship: any) => {
    const currentHappiness = ship.current_energy || ship.currentEnergy || 0;
    const maxHappiness = ship.energy_capacity || ship.energyCapacity || 100;
    return (currentHappiness / maxHappiness) * 100;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-400 mx-auto"></div>
          <div className="text-xl text-pink-600 font-bold">Loading Dog House...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg font-inter">
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="title-responsive font-inter font-bold gradient-text">
              Dog House Management
            </h1>
            <p className="text-gray-700 text-lg font-inter">
              Manage your pet dogs and adopt new furry friends
            </p>
            <div className="food-points text-xl justify-center">
              <span>🍖</span>
              {gameStats?.zenBalance?.toLocaleString() || 0} Food Points
            </div>
          </div>

          {/* Tabs */}
          <div className="cute-card overflow-hidden">
            <div className="flex border-b border-primary-200">
              <button
                onClick={() => setActiveTab(0)}
                className={`flex-1 px-6 py-4 font-inter font-bold transition-all duration-200 ${
                  activeTab === 0
                    ? 'bg-gradient-to-r from-purple-400 to-purple-500 text-white border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-primary-500'
                }`}
              >
                My Dogs ({ships.length}) 🐕
              </button>
              <button
                onClick={() => setActiveTab(1)}
                className={`flex-1 px-6 py-4 font-inter font-bold transition-all duration-200 ${
                  activeTab === 1
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-primary-500'
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
                      <h3 className="text-xl font-bold text-gray-700 mb-2">
                        No Dogs in Your House
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Adopt your first dog to start the pet care experience
                      </p>
                      <Button
                        onClick={() => setActiveTab(1)}
                        className="bg-gradient-to-r from-primary-500 to-primary-600 text-white flex items-center gap-2"
                      >
                        <span>🐕</span>
                        Visit Adoption Center
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {ships.map((ship) => {
                        const happinessPercentage = getHappinessPercentage(ship);
                        
                        return (
                          <div
                            key={ship.id}
                            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 md:p-6 border border-purple-700 transition-all duration-300 shadow-lg"
                          >
                            <div className="space-y-3 md:space-y-4">
                              {/* Dog Info */}
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-lg md:text-xl font-bold text-white">
                                    {ship.name}
                                  </h3>
                                  <p className="text-white/90">
                                    Level {ship.level} • {ship.shipType} 🐕
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="text-white font-bold text-base md:text-lg">
                                    {ship.miningPower}
                                  </div>
                                  <div className="text-white/80 text-sm">Appetite</div>
                                </div>
                              </div>

                              {/* Happiness Status */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-white/90 text-sm">
                                    💖 Happiness Level
                                  </span>
                                  <span className="text-white text-sm">
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

                              {/* Training */}
                              <div className="space-y-3">
                                <h4 className="text-white font-bold">Training & Care</h4>
                                <div className="grid grid-cols-1 gap-2">
                                  {upgradeTypes.map((upgrade) => {
                                    const currentLevel = ship.upgrades[upgrade.type] || 0;
                                    const cost = calculateUpgradeCost(ship, upgrade.type);
                                    const affordable = canAfford(cost);
                                    
                                    return (
                                      <div
                                        key={upgrade.type}
                                        className="flex items-center justify-between bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-3"
                                      >
                                        <div className="flex items-center gap-3">
                                          {upgrade.icon}
                                          <div>
                                            <div className="text-white font-medium text-sm">
                                              {upgrade.name} (Lv.{currentLevel})
                                            </div>
                                            <div className="text-white/90 text-xs">
                                              {upgrade.description}
                                            </div>
                                          </div>
                                        </div>
                                        <Button
                                          onClick={() => upgradeShip(ship.id!, upgrade.type)}
                                          disabled={!affordable}
                                          className={`px-3 py-1 text-xs font-bold rounded-lg ${
                                            affordable
                                              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                          }`}
                                        >
                                          {cost} 🍖
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
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Perfect Companion</h2>
                    <p className="text-gray-600">From beginner pups to legendary guardians - find your ideal furry friend!</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {dogTypes.map((dogType) => {
                      const affordable = canAfford(dogType.cost);
                      const owned = ships.some(s => s.shipType === dogType.type);
                      
                      return (
                        <div
                          key={dogType.type}
                          className="bg-white/70 rounded-xl overflow-hidden border border-purple-200/50 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg"
                        >
                          <div className="aspect-video bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center">
                            <span className="text-6xl">{dogType.emoji}</span>
                          </div>

                          <div className="p-4 space-y-4 bg-gradient-to-br from-purple-900 to-purple-950">
                            <div>
                              <h3 className="text-lg font-bold text-white">
                                {dogType.name}
                              </h3>
                              <p className="text-purple-200 text-sm">
                                {dogType.description}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-purple-300 text-sm">Appetite:</span>
                                <span className="text-orange-400 font-bold">{dogType.mining_power}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-300 text-sm">Happiness Capacity:</span>
                                <span className="text-orange-400 font-bold">{dogType.energy_capacity}</span>
                              </div>
                            </div>

                            <Button
                              onClick={() => buyShip(dogType.type)}
                              disabled={!affordable || owned || dogType.cost === 0}
                              className={`w-full py-3 rounded-xl font-bold transition-all duration-200 ${
                                dogType.cost === 0 ? 'bg-gray-300 text-white cursor-not-allowed' :
                                owned ? 'bg-green-500 text-white cursor-not-allowed' :
                                affordable
                                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              {dogType.cost === 0 ? 'Starter Dog' :
                               owned ? 'Already Adopted' :
                               affordable ? (
                                <div className="flex items-center justify-center gap-2">
                                  <span>🐕</span>
                                  Adopt for {dogType.cost.toLocaleString()} 🍖
                                </div>
                               ) : `Need ${dogType.cost.toLocaleString()} 🍖`}
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