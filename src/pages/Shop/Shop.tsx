import React, { useState } from 'react';
import { ShoppingCart, Zap, Battery, TrendingUp, Package, Star } from 'lucide-react';
import { Button } from 'components';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { GameService } from '../../services/gameService';

const shopItems = [
  {
    id: 'energy_pack_small',
    name: 'Small Treat Pack',
    description: 'Restore 50 happiness to one dog',
    cost: 10,
    type: 'consumable',
    icon: <Battery size={24} className="text-green-400" />,
    effect: { energy: 50 },
    emoji: '🦴'
  },
  {
    id: 'energy_pack_large',
    name: 'Large Treat Pack',
    description: 'Restore 150 happiness to one dog',
    cost: 25,
    type: 'consumable',
    icon: <Battery size={24} className="text-green-500" />,
    effect: { energy: 150 },
    emoji: '🥩'
  },
  {
    id: 'mining_boost',
    name: 'Appetite Boost',
    description: '2x food earning for 1 hour',
    cost: 50,
    type: 'boost',
    icon: <Zap size={24} className="text-primary-400" />,
    effect: { mining_multiplier: 2, duration: 3600 },
    emoji: '🍖'
  },
  {
    id: 'experience_boost',
    name: 'Love Boost',
    description: '2x experience gain for 1 hour',
    cost: 40,
    type: 'boost',
    icon: <Star size={24} className="text-accent-400" />,
    effect: { exp_multiplier: 2, duration: 3600 },
    emoji: '💖'
  },
  {
    id: 'auto_miner',
    name: 'Auto-Feeder',
    description: 'Automatically feed dogs when they are hungry',
    cost: 500,
    type: 'upgrade',
    icon: <TrendingUp size={24} className="text-orange-400" />,
    effect: { auto_mine: true },
    emoji: '🤖'
  },
  {
    id: 'energy_regenerator',
    name: 'Happiness Booster',
    description: 'Increase happiness regeneration rate by 50%',
    cost: 800,
    type: 'upgrade',
    icon: <Battery size={24} className="text-blue-400" />,
    effect: { energy_regen_boost: 1.5 },
    emoji: '⚡'
  }
];

export const Shop = () => {
  const { user } = useAuth();
  const { gameStats, ships, refetch } = useGame();
  const { success, error } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedShip, setSelectedShip] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const categories = [
    { id: 'all', name: 'All Items', icon: <Package size={16} />, emoji: '📦' },
    { id: 'consumable', name: 'Treats', icon: <Battery size={16} />, emoji: '🦴' },
    { id: 'boost', name: 'Boosts', icon: <Zap size={16} />, emoji: '⚡' },
    { id: 'upgrade', name: 'Upgrades', icon: <TrendingUp size={16} />, emoji: '🔧' }
  ];

  const filteredItems = selectedCategory === 'all' 
    ? shopItems 
    : shopItems.filter(item => item.type === selectedCategory);

  const canAfford = (cost: number) => {
    return (gameStats?.zenBalance || 0) >= cost;
  };

  const handlePurchase = async (item: any) => {
    if (!user?.id) {
      error('Please log in to make purchases');
      return;
    }

    if (!canAfford(item.cost)) {
      error('Insufficient food points');
      return;
    }

    if (item.type === 'consumable' && item.effect.energy) {
      if (!selectedShip) {
        error('Please select a dog to restore happiness');
        return;
      }

      try {
        setIsProcessing(true);
        await GameService.purchaseConsumable(user.id, selectedShip, item.effect.energy, item.cost);
        success(`${item.name} used successfully! Restored ${item.effect.energy} happiness!`);
        await refetch();
      } catch (err: any) {
        error(err.message || 'Failed to purchase item');
      } finally {
        setIsProcessing(false);
      }
    } else if (item.type === 'boost') {
      try {
        setIsProcessing(true);
        const boostType = item.id === 'mining_boost' ? 'mining' : 'experience';
        await GameService.activateBoost(user.id, boostType, item.effect.mining_multiplier || item.effect.exp_multiplier, item.effect.duration, item.cost);
        success(`${item.name} activated! Enjoy ${item.effect.mining_multiplier || item.effect.exp_multiplier}x boost for 1 hour!`);
        await refetch();
      } catch (err: any) {
        error(err.message || 'Failed to activate boost');
      } finally {
        setIsProcessing(false);
      }
    } else if (item.type === 'upgrade') {
      try {
        setIsProcessing(true);
        const upgradeType = item.id === 'auto_miner' ? 'autoFeeder' : 'happinessBooster';
        const value = item.id === 'auto_miner' ? true : 1.5;
        await GameService.purchasePermanentUpgrade(user.id, upgradeType, value, item.cost);
        success(`${item.name} purchased successfully! Upgrade is now active!`);
        await refetch();
      } catch (err: any) {
        error(err.message || 'Failed to purchase upgrade');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="page-bg font-inter">
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="title-responsive font-inter font-bold gradient-text">
              Pet Store
            </h1>
            <p className="text-gray-700 text-lg font-inter">
              Purchase treats, boosts, and upgrades for your dogs
            </p>
            <div className="food-points text-xl justify-center">
              <span>🍖</span>
              {gameStats?.zenBalance?.toLocaleString() || 0} Food Points
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
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                    : 'bg-white/70 text-gray-700 hover:text-primary-600 hover:bg-primary-100'
                }`}
              >
                <span className="text-lg">{category.emoji}</span>
                {category.name}
              </button>
            ))}
          </div>

          {/* Dog Selection for Consumables */}
          {selectedCategory === 'consumable' && ships.length > 0 && (
            <div className="cute-card p-6">
              <h3 className="text-gray-800 font-inter font-bold mb-4">Select Dog for Treats</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ships.map((ship) => (
                  <button
                    key={ship.id}
                    onClick={() => setSelectedShip(ship.id || null)}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      selectedShip === ship.id
                        ? 'border-primary-400 bg-primary-100'
                        : 'border-gray-300 bg-white/50 hover:border-primary-300'
                    }`}
                  >
                    <div className="text-gray-800 font-medium">{ship.name}</div>
                    <div className="text-gray-600 text-sm">
                      Happiness: {ship.currentEnergy}/{ship.energyCapacity}
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
                  className="cute-card p-6 hover:transform hover:scale-105"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-200 rounded-full flex items-center justify-center">
                        <span className="text-2xl">{item.emoji}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-inter font-bold text-gray-800">
                          {item.name}
                        </h3>
                        <p className="text-gray-600 text-sm capitalize">
                          {item.type}
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-700 text-sm leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-1 text-primary-600 font-inter font-bold">
                        <span>🍖</span>
                        {item.cost} Food
                      </div>
                      <Button
                        onClick={() => handlePurchase(item)}
                        disabled={!affordable || (item.type === 'consumable' && !selectedShip) || isProcessing}
                        className={`px-4 py-2 rounded-lg font-inter font-bold transition-all duration-200 ${
                          affordable && (item.type !== 'consumable' || selectedShip) && !isProcessing
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingCart size={16} />
                        {isProcessing ? 'Processing...' : 'Buy'}
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