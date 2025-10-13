import React, { useState } from 'react';
import { Package, Star, Award, Sparkles, X } from 'lucide-react';
import { Button } from 'components';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PetService } from '../../services/petService';

const ITEM_INFO: Record<string, { name: string; description: string; icon: JSX.Element; emoji: string }> = {
  xp_boost_small: {
    name: 'XP Treat',
    description: 'Instantly grant 100 XP to one pet',
    icon: <Star size={24} className="text-yellow-400" />,
    emoji: '✨'
  },
  xp_boost_medium: {
    name: 'XP Snack Pack',
    description: 'Instantly grant 500 XP to one pet',
    icon: <Star size={24} className="text-yellow-500" />,
    emoji: '🌟'
  },
  xp_boost_large: {
    name: 'XP Feast',
    description: 'Instantly grant 2000 XP to one pet',
    icon: <Star size={24} className="text-yellow-600" />,
    emoji: '💫'
  },
  training_manual: {
    name: 'Training Manual',
    description: '+10% to all training stats for one pet',
    icon: <Award size={24} className="text-blue-500" />,
    emoji: '📚'
  },
  evolution_stone: {
    name: 'Evolution Stone',
    description: 'Reduce XP needed for next level by 20%',
    icon: <Sparkles size={24} className="text-purple-500" />,
    emoji: '💎'
  },
  shiny_charm: {
    name: 'Shiny Charm',
    description: 'Next pet adoption has 10% chance to be Shiny (stackable)',
    icon: <Sparkles size={24} className="text-yellow-300" />,
    emoji: '🍀'
  },
  market_pass: {
    name: 'Market VIP Pass',
    description: 'No marketplace fees (active in upgrades)',
    icon: <Package size={24} className="text-indigo-500" />,
    emoji: '👑'
  }
};

export const Inventory = () => {
  const { user } = useAuth();
  const { gameStats, refetch } = useGame();
  const { success, error } = useToast();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [userPets, setUserPets] = useState<any[]>([]);
  const [showPetSelector, setShowPetSelector] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const inventory = gameStats?.inventory || [];

  const loadPets = async () => {
    if (!user?.id) return;
    try {
      const pets = await PetService.getUserPets(user.id);
      setUserPets(pets);
    } catch (err) {
      console.error('Error loading pets:', err);
    }
  };

  const handleUseItem = async (itemId: string) => {
    setSelectedItem(itemId);
    await loadPets();
    setShowPetSelector(true);
  };

  const handleConfirmUse = async () => {
    if (!selectedItem || !selectedPet || !user?.id) return;

    setIsProcessing(true);
    try {
      const { PetInventoryService } = await import('../../services/gameService');

      if (selectedItem.includes('xp_boost')) {
        const xpAmount = selectedItem === 'xp_boost_small' ? 100 :
                        selectedItem === 'xp_boost_medium' ? 500 : 2000;
        await PetInventoryService.useXPItem(user.id, selectedPet, selectedItem, xpAmount);
        success(`Applied ${xpAmount} XP to your pet!`);
      } else if (selectedItem === 'training_manual') {
        await PetInventoryService.useTrainingManual(user.id, selectedPet, selectedItem);
        success('Training Manual applied! All training stats +10%');
      }

      setShowPetSelector(false);
      setSelectedItem(null);
      setSelectedPet(null);
      await refetch();
    } catch (err) {
      console.error('Error using item:', err);
      error('Failed to use item');
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
              Inventory
            </h1>
            <p className="subtitle-responsive text-white/90 font-inter">
              Use your items on your pets
            </p>
          </div>

          {inventory.length === 0 ? (
            <div className="cute-card p-12 text-center">
              <Package size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-inter font-bold text-gray-600 mb-2">
                Your inventory is empty
              </h3>
              <p className="text-gray-500 font-inter">
                Visit the shop to purchase items for your pets!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventory.map((item, index) => {
                const itemInfo = ITEM_INFO[item.itemId];
                if (!itemInfo) return null;

                return (
                  <div key={index} className="cute-card overflow-hidden">
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {itemInfo.icon}
                          <div>
                            <h3 className="text-lg font-inter font-bold text-gray-800">
                              {itemInfo.emoji} {itemInfo.name}
                            </h3>
                            <p className="text-sm text-gray-600 font-inter">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 font-inter">
                        {itemInfo.description}
                      </p>

                      <Button
                        onClick={() => handleUseItem(item.itemId)}
                        disabled={isProcessing}
                        className="w-full bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:from-[#ea580c] hover:to-[#f97316] text-white px-4 py-3 rounded-lg font-inter font-bold"
                      >
                        Use Item
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showPetSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="cute-card max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-inter font-bold text-gray-800">
                  Select a Pet
                </h2>
                <button
                  onClick={() => setShowPetSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {userPets.length === 0 ? (
                <p className="text-gray-600 font-inter text-center py-8">
                  You don't have any pets yet!
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {userPets.map((pet) => (
                    <button
                      key={pet.id}
                      onClick={() => setSelectedPet(pet.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedPet === pet.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{pet.isShiny ? '✨' : '🐕'}</div>
                        <div className="text-left">
                          <h3 className="font-inter font-bold text-gray-800">
                            {pet.name}
                          </h3>
                          <p className="text-sm text-gray-600 font-inter">
                            Level {pet.level} • {pet.evolutionStage}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedPet && (
                <Button
                  onClick={handleConfirmUse}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:from-[#ea580c] hover:to-[#f97316] text-white px-6 py-3 rounded-lg font-inter font-bold"
                >
                  {isProcessing ? 'Using...' : 'Confirm Use'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
