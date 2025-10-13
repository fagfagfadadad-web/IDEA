import React, { useState } from 'react';
import { ShoppingCart, Zap, Star, TrendingUp, Package, Sparkles, Award, Gift } from 'lucide-react';
import { Button } from 'components';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const shopItems = [
  {
    id: 'xp_boost_small',
    name: 'XP Treat',
    description: 'Instantly grant 100 XP to one pet',
    cost: 50,
    type: 'consumable',
    icon: <Star size={24} className="text-yellow-400" />,
    effect: { xp: 100 },
    emoji: '✨'
  },
  {
    id: 'xp_boost_medium',
    name: 'XP Snack Pack',
    description: 'Instantly grant 500 XP to one pet',
    cost: 200,
    type: 'consumable',
    icon: <Star size={24} className="text-yellow-500" />,
    effect: { xp: 500 },
    emoji: '🌟'
  },
  {
    id: 'xp_boost_large',
    name: 'XP Feast',
    description: 'Instantly grant 2000 XP to one pet',
    cost: 750,
    type: 'consumable',
    icon: <Star size={24} className="text-yellow-600" />,
    effect: { xp: 2000 },
    emoji: '💫'
  },
  {
    id: 'training_boost',
    name: 'Training Manual',
    description: '+10% to all training stats for one pet',
    cost: 300,
    type: 'consumable',
    icon: <Award size={24} className="text-blue-500" />,
    effect: { training: 10 },
    emoji: '📚'
  },
  {
    id: 'evolution_catalyst',
    name: 'Evolution Stone',
    description: 'Reduce XP needed for next level by 20%',
    cost: 500,
    type: 'consumable',
    icon: <Sparkles size={24} className="text-purple-500" />,
    effect: { xp_reduction: 0.2 },
    emoji: '💎'
  },
  {
    id: 'global_xp_boost',
    name: 'XP Multiplier (24h)',
    description: 'All pets earn 2x XP for 24 hours',
    cost: 1000,
    type: 'boost',
    icon: <Zap size={24} className="text-orange-400" />,
    effect: { xp_multiplier: 2, duration: 86400 },
    emoji: '⚡'
  },
  {
    id: 'training_multiplier',
    name: 'Training Boost (24h)',
    description: 'Training costs 50% less Food and grants 2x progress for 24 hours',
    cost: 800,
    type: 'boost',
    icon: <TrendingUp size={24} className="text-green-500" />,
    effect: { training_boost: 2, cost_reduction: 0.5, duration: 86400 },
    emoji: '💪'
  },
  {
    id: 'food_generator',
    name: 'Food Generator (7 days)',
    description: 'Generate 100 Food per hour passively for 7 days',
    cost: 2500,
    type: 'boost',
    icon: <Gift size={24} className="text-pink-500" />,
    effect: { food_per_hour: 100, duration: 604800 },
    emoji: '🎁'
  },
  {
    id: 'shiny_charm',
    name: 'Shiny Charm',
    description: 'Next pet adoption has 10% chance to be Shiny (stackable)',
    cost: 5000,
    type: 'special',
    icon: <Sparkles size={24} className="text-yellow-300" />,
    effect: { shiny_chance: 0.1 },
    emoji: '🍀'
  },
  {
    id: 'market_pass',
    name: 'Market VIP Pass (30 days)',
    description: 'No marketplace fees for 30 days',
    cost: 3000,
    type: 'special',
    icon: <ShoppingCart size={24} className="text-indigo-500" />,
    effect: { no_fees: true, duration: 2592000 },
    emoji: '👑'
  },
  {
    id: 'food_multiplier',
    name: 'Food Multiplier Upgrade',
    description: 'Permanently increase food rewards by +10% (stackable)',
    cost: 2000,
    type: 'permanent',
    icon: <TrendingUp size={24} className="text-green-500" />,
    effect: { multiplier: 'food', increase: 0.1 },
    emoji: '🍖'
  },
  {
    id: 'xp_multiplier',
    name: 'XP Multiplier Upgrade',
    description: 'Permanently increase XP gains by +10% (stackable)',
    cost: 2500,
    type: 'permanent',
    icon: <Star size={24} className="text-yellow-500" />,
    effect: { multiplier: 'xp', increase: 0.1 },
    emoji: '⭐'
  },
  {
    id: 'cooldown_reducer',
    name: 'Cooldown Reducer Upgrade',
    description: 'Permanently reduce training cooldowns by 5% (stackable)',
    cost: 3000,
    type: 'permanent',
    icon: <Zap size={24} className="text-blue-500" />,
    effect: { multiplier: 'cooldown', decrease: 0.05 },
    emoji: '⚡'
  }
];

export const Shop = () => {
  const { user } = useAuth();
  const { gameStats, refetch } = useGame();
  const { success, error } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);

  const categories = [
    { id: 'all', name: 'All Items', icon: <Package size={16} />, emoji: '📦' },
    { id: 'consumable', name: 'Consumables', icon: <Star size={16} />, emoji: '✨' },
    { id: 'boost', name: 'Boosts', icon: <Zap size={16} />, emoji: '⚡' },
    { id: 'permanent', name: 'Permanent', icon: <TrendingUp size={16} />, emoji: '💎' },
    { id: 'special', name: 'Special', icon: <Sparkles size={16} />, emoji: '🌟' }
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
      error('Insufficient Food balance!');
      return;
    }

    setIsProcessing(true);
    try {
      const { GameService } = await import('../../services/gameService');
      const { InventoryService } = await import('../../services/inventoryService');

      if (item.type === 'permanent') {
        if (item.effect.multiplier === 'food') {
          const currentMultiplier = gameStats?.permanentUpgrades?.foodMultiplier || 1;
          const newMultiplier = currentMultiplier + item.effect.increase;
          await GameService.purchasePermanentUpgrade(user.id, 'foodMultiplier', newMultiplier, item.cost);
          success(`${item.name} purchased! Food rewards increased by ${Math.floor(item.effect.increase * 100)}%`);
        } else if (item.effect.multiplier === 'xp') {
          const currentMultiplier = gameStats?.permanentUpgrades?.xpMultiplier || 1;
          const newMultiplier = currentMultiplier + item.effect.increase;
          await GameService.purchasePermanentUpgrade(user.id, 'xpMultiplier', newMultiplier, item.cost);
          success(`${item.name} purchased! XP gains increased by ${Math.floor(item.effect.increase * 100)}%`);
        } else if (item.effect.multiplier === 'cooldown') {
          const currentMultiplier = gameStats?.permanentUpgrades?.cooldownMultiplier || 1;
          const newMultiplier = currentMultiplier - item.effect.decrease;
          await GameService.purchasePermanentUpgrade(user.id, 'cooldownMultiplier', newMultiplier, item.cost);
          success(`${item.name} purchased! Training cooldowns reduced by ${Math.floor(item.effect.decrease * 100)}%`);
        }
      } else if (item.type === 'consumable' || item.type === 'boost' || item.type === 'special') {
        await GameService.purchaseShopItem(user.id, item.id, item.type, item.cost, item.effect);
        await InventoryService.addItemToInventory(
          user.id,
          item.id,
          item.name,
          item.type,
          item.effect,
          { emoji: item.emoji }
        );
        success(`${item.name} added to inventory! Go to Inventory to activate it.`);
      } else {
        success(`${item.name} purchased!`);
      }
      await refetch();
    } catch (err: any) {
      console.error('Purchase error:', err);
      const errorMessage = err?.message || 'Purchase failed. Please try again.';

      if (errorMessage.includes('Insufficient')) {
        error('Not enough Food! Earn more by feeding and playing with your pets.');
      } else if (errorMessage.includes('active')) {
        error(errorMessage);
      } else {
        error('Purchase failed. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 pb-24 md:pb-8">
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="title-responsive font-inter font-bold gradient-text">
              Pet Evolution Store
            </h1>
            <p className="text-white text-lg font-inter font-semibold">
              Boost your pets with XP items, training tools, and special evolution items
            </p>
            <div className="flex items-center justify-center gap-2 text-white font-inter font-bold text-xl">
              <span>🍖</span>
              {gameStats?.zenBalance?.toLocaleString() || 0} Food
            </div>
          </div>

          <div className="cute-card p-6">
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-3 rounded-xl font-inter font-bold transition-all duration-200 flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white shadow-lg scale-105'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  }`}
                >
                  <span className="text-xl">{category.emoji}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const affordable = canAfford(item.cost);

              return (
                <div
                  key={item.id}
                  className="cute-card overflow-hidden hover:transform hover:scale-105 transition-all duration-300"
                >
                  <div className={`p-6 relative ${
                    item.type === 'consumable' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                    item.type === 'boost' ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                    'bg-gradient-to-br from-indigo-500 to-purple-600'
                  }`}>
                    <div className="text-center">
                      <div className="text-6xl mb-4">{item.emoji}</div>
                      <h3 className="text-xl font-inter font-bold text-white mb-2">
                        {item.name}
                      </h3>
                      <p className="text-white/90 text-sm font-inter">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between text-lg font-inter">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-bold text-gray-800">
                        🍖 {item.cost.toLocaleString()}
                      </span>
                    </div>

                    {item.effect.duration && (
                      <div className="text-sm text-white font-inter bg-purple-500 rounded-lg p-2">
                        ⏰ Duration: {item.effect.duration >= 86400 ? `${item.effect.duration / 86400} days` : `${item.effect.duration / 3600} hours`}
                      </div>
                    )}

                    <Button
                      onClick={() => handlePurchase(item)}
                      disabled={!affordable || isProcessing}
                      className={`w-full ${
                        affordable && !isProcessing
                          ? 'bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:from-[#ea580c] hover:to-[#f97316] text-white'
                          : 'bg-gray-600 cursor-not-allowed text-gray-300'
                      } px-4 py-3 rounded-lg font-inter font-bold flex items-center justify-center gap-2`}
                    >
                      <ShoppingCart size={20} />
                      {affordable ? 'Buy Now' : 'Insufficient Balance'}
                    </Button>
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
