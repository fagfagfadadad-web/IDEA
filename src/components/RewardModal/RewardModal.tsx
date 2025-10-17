import React from 'react';
import { Gift, Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import { PassiveIncomeReward, LevelUpReward } from '../../services/passiveIncomeService';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  passiveRewards?: PassiveIncomeReward[];
  levelUpRewards?: LevelUpReward[];
  newLevel?: number;
  treasureRewards?: { petName: string; amount: number };
}

export const RewardModal: React.FC<RewardModalProps> = ({
  isOpen,
  onClose,
  passiveRewards = [],
  levelUpRewards = [],
  newLevel,
  treasureRewards
}) => {
  if (!isOpen) return null;

  const totalPassiveIncome = passiveRewards.reduce((sum, r) => sum + r.foodEarned, 0);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500';
      case 'epic':
        return 'text-purple-400 bg-purple-500/20 border-purple-500';
      case 'rare':
        return 'text-blue-400 bg-blue-500/20 border-blue-500';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 border-2 border-green-500 rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl shadow-green-500/20">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4 animate-bounce">
            <Gift className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-green-400 mb-2">
            Rewards Collected!
          </h2>
          <p className="text-gray-400">
            Your pets have earned rewards for you!
          </p>
        </div>

        <div className="space-y-6">
          {passiveRewards.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-green-500/30">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-bold text-green-400">
                  Passive Income
                </h3>
              </div>

              <div className="space-y-3 mb-4">
                {passiveRewards.map((reward, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-900/50 rounded-lg p-4 border border-gray-700"
                  >
                    <div>
                      <p className="text-white font-semibold">{reward.petName}</p>
                      <p className="text-sm text-gray-400">
                        {reward.hoursPassed} hours of work
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400">
                        +{reward.foodEarned} Food
                      </p>
                      <p className="text-xs text-gray-500">
                        Total earned: {reward.totalEarned}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500 rounded-lg p-4">
                <p className="text-center text-xl font-bold text-green-400">
                  Total: +{totalPassiveIncome} Food
                </p>
              </div>
            </div>
          )}

          {newLevel && levelUpRewards.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-purple-500/30">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-bold text-purple-400">
                  Level {newLevel} Rewards!
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {levelUpRewards.map((reward, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between rounded-lg p-4 border ${getRarityColor(reward.rarity)}`}
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5" />
                      <div>
                        <p className="font-bold">{reward.itemName}</p>
                        <p className="text-sm opacity-80 capitalize">
                          {reward.rarity}
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      x{reward.quantity}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-center text-sm text-gray-400">
                Items have been added to your inventory
              </div>
            </div>
          )}

          {treasureRewards && (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-yellow-500/30">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-bold text-yellow-400">
                  Treasure Found!
                </h3>
              </div>

              <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
                <p className="text-center">
                  <span className="text-white font-semibold">{treasureRewards.petName}</span>
                  <span className="text-gray-400"> found a treasure chest!</span>
                </p>
                <p className="text-center text-2xl font-bold text-yellow-400 mt-2">
                  +{treasureRewards.amount} Food
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-green-500/30"
        >
          Awesome! Collect Rewards
        </button>
      </div>
    </div>
  );
};
