import React, { useState } from 'react';
import { ShoppingCart, Zap, Battery, TrendingUp, Package, Star } from 'lucide-react';
import { Button } from 'components';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';

const shopItems = [
  {
    id: 'energy_pack_small',
    name: 'Small Energy Pack',
    description: 'Restore 50 energy to one ship',
    cost: 10,
    type: 'consumable',
    icon: <Battery size={24} className="text-green-400" />,
    effect: { energy: 50 }
  },
  {
    id: 'energy_pack_large',
    name: 'Large Energy Pack',
    description: 'Restore 150 energy to one ship',
    cost: 25,
    type: 'consumable',
    icon: <Battery size={24} className="text-green-500" />,
    effect: { energy: 150 }
  },
  {
    id: 'mining_boost',
    name: 'Mining Boost',
    description: '2x mining power for 1 hour',
    cost: 50,
    type: 'boost',
    icon: <Zap size={24} className="text-cyan-400" />,
    effect: { mining_multiplier: 2, duration: 3600 }
  },
  {
    id: 'experience_boost',
    name: 'Experience Boost',
    description: '2x experience gain for 1 hour',
    cost: 40,
    type: 'boost',
    icon: <Star size={24} className="text-purple-400" />,
    effect: { exp_multiplier: 2, duration: 3600 }
  },
  {
    id: 'auto_miner',
    name: 'Auto-Miner Module',
    description: 'Automatically mine when energy is available',
    cost: 500,
    type: 'upgrade',
    icon: <TrendingUp size={24} className="text-orange-400" />,
    effect: { auto_mine: true }
  },
  {
    id: 'energy_regenerator',
    name: 'Energy Regenerator',
    description: 'Increase energy regeneration rate by 50%',
    cost: 800,
    type: 'upgrade',
    icon: <Battery size={24} className="text-blue-400" />,
    effect: { energy_regen_boost: 1.5 }
  }
];

export const Shop = () => {
  const { gameStats, ships } = useGame();
  const { success, error } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedShip, setSelectedShip] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'All Items', icon: <Package size={16} /> },
    { id: 'consumable', name: 'Consumables', icon: <Battery size={16} /> },
    { id: 'boost', name: 'Boosts', icon: <Zap size={16} /> },
    { id: 'upgrade', name: 'Upgrades', icon: <TrendingUp size={16} /> }
  ];

  const filteredItems = selectedCategory === 'all' 
    ? shopItems 
    : shopItems.filter(item => item.type === selectedCategory);

  const canAfford = (cost: number) => {
    return (gameStats?.zenBalance || 0) >= cost;
  };

  const handlePurchase = async (item: any) => {
    if (!canAfford(item.cost)) {
      error('Insufficient ZEN tokens');
      return;
    }

    if (item.type === 'consumable' && item.effect.energy) {
      if (!selectedShip) {
        error('Please select a ship to restore energy');
        return;
      }
      // Apply energy restoration logic here
      success(`${item.name} used successfully!`);
    } else {
      // Handle other item types
      success(`${item.name} purchased successfully!`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 font-inter">
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-orbitron font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              ZEN Shop
            </h1>
            <p className="text-gray-400 text-lg">
              Purchase upgrades, boosts, and consumables with your ZEN tokens
            </p>
            <div className="flex items-center justify-center gap-2 text-cyan-400 font-orbitron font-bold text-xl">
              <Zap size={20} />
              {gameStats?.zenBalance?.toLocaleString() || 0} ZEN
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white'
                    : 'bg-slate-700/50 text-gray-400 hover:text-white hover:bg-slate-600/50'
                }`}
              >
                {category.icon}
                {category.name}
              </button>
            ))}
          </div>

          {/* Ship Selection for Consumables */}
          {selectedCategory === 'consumable' && ships.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-cyan-500/20">
              <h3 className="text-white font-orbitron font-bold mb-4">Select Ship for Consumables</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ships.map((ship) => (
                  <button
                    key={ship.id}
                    onClick={() => setSelectedShip(ship.id || null)}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      selectedShip === ship.id
                        ? 'border-cyan-400 bg-cyan-500/10'
                        : 'border-gray-600 bg-slate-700/30 hover:border-cyan-500/50'
                    }`}
                  >
                    <div className="text-white font-medium">{ship.name}</div>
                    <div className="text-gray-400 text-sm">
                      Energy: {ship.currentEnergy}/{ship.energyCapacity}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Shop Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const affordable = canAfford(item.cost);
              
              return (
                <div
                  key={item.id}
                  className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:scale-105"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-orbitron font-bold text-white">
                          {item.name}
                        </h3>
                        <p className="text-gray-400 text-sm capitalize">
                          {item.type}
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-1 text-cyan-400 font-orbitron font-bold">
                        <Zap size={16} />
                        {item.cost} ZEN
                      </div>
                      <Button
                        onClick={() => handlePurchase(item)}
                        disabled={!affordable || (item.type === 'consumable' && !selectedShip)}
                        className={`px-4 py-2 rounded-lg font-orbitron font-bold transition-all duration-200 ${
                          affordable && (item.type !== 'consumable' || selectedShip)
                            ? 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white'
                            : 'bg-slate-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingCart size={16} />
                        Buy
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};