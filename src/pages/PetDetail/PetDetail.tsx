import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Zap, TrendingUp, Utensils, Dumbbell, Brain, Target, ShoppingBag } from 'lucide-react';
import { Button } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { PetService } from '../../services/petService';
import { Pet, BREED_INFO, TrainingType, EVOLUTION_MULTIPLIERS } from '../../types/pet.types';

export const PetDetail = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameStats, refetch } = useGame();
  const { success, error } = useToast();

  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [isFeeding, setIsFeeding] = useState(false);
  const [showEvolutionAnimation, setShowEvolutionAnimation] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [listingPrice, setListingPrice] = useState('');
  const [isUnlisting, setIsUnlisting] = useState(false);

  const getTrainingCost = (currentValue: number): number => {
    const baseCost = 20;
    const scalingFactor = 1 + (currentValue / 100) * 3;
    return Math.floor(baseCost * scalingFactor);
  };

  useEffect(() => {
    if (petId) {
      fetchPet();
    }
  }, [petId]);

  const fetchPet = async () => {
    try {
      setIsLoading(true);
      const petData = await PetService.getPetById(petId!);
      if (petData) {
        setPet(petData);
      } else {
        error('Pet not found');
        navigate('/pets');
      }
    } catch (err) {
      console.error('Error fetching pet:', err);
      error('Failed to load pet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeed = async () => {
    if (!pet?.id || !user?.id) return;

    const foodCost = 10;
    if ((gameStats?.zenBalance || 0) < foodCost) {
      error('Not enough Food to feed your pet!');
      return;
    }

    try {
      setIsFeeding(true);
      await PetService.feedPet(pet.id, user.id, foodCost);
      success('Pet fed successfully! -10 Food, +10 XP');
      await fetchPet();
      refetch();
    } catch (err) {
      console.error('Error feeding pet:', err);
      error('Failed to feed pet');
    } finally {
      setIsFeeding(false);
    }
  };

  const handleTrain = async (trainingType: TrainingType) => {
    if (!pet?.id || !user?.id) return;

    const trainingCost = getTrainingCost(pet.training[trainingType]);
    if ((gameStats?.zenBalance || 0) < trainingCost) {
      error('Not enough Food for training!');
      return;
    }

    try {
      setIsTraining(true);
      const result = await PetService.trainPet(pet.id, user.id, trainingType, trainingCost);

      if (result.evolved) {
        setShowEvolutionAnimation(true);
        setTimeout(() => {
          setShowEvolutionAnimation(false);
          success(`🌟 ${pet.name} evolved to ${result.newStage}!`);
        }, 3000);
      } else if (result.leveled) {
        success(`Level up! ${pet.name} is now level ${result.newLevel}! -${trainingCost} Food`);
      } else {
        success(`Training completed! -${trainingCost} Food, +30 XP`);
      }

      await fetchPet();
      refetch();
    } catch (err) {
      console.error('Error training pet:', err);
      error('Failed to train pet');
    } finally {
      setIsTraining(false);
    }
  };

  const handleListOnMarket = async () => {
    if (!pet?.id || !user?.username || !user?.id) return;

    const price = parseInt(listingPrice);
    if (isNaN(price) || price <= 0) {
      error('Please enter a valid price');
      return;
    }

    try {
      await PetService.listPetOnMarket(pet.id, user.id, user.username, price);
      success('Pet listed on market successfully!');
      setShowListModal(false);
      navigate('/market');
    } catch (err) {
      console.error('Error listing pet:', err);
      error('Failed to list pet on market');
    }
  };

  const handleUnlistPet = async () => {
    if (!pet?.petId || !user?.id) return;

    try {
      setIsUnlisting(true);

      const listingsQuery = await PetService.getMarketListings();
      const myListing = listingsQuery.find(l => l.petId === pet.petId && l.sellerId === user.id && l.status === 'active');

      if (myListing?.id) {
        const result = await PetService.cancelListing(myListing.id, user.id);
        if (result) {
          success('Pet unlisted successfully!');
          await fetchPet();
          refetch();
        } else {
          error('Failed to unlist pet');
        }
      }
    } catch (err) {
      console.error('Error unlisting pet:', err);
      error('Failed to unlist pet');
    } finally {
      setIsUnlisting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-inter">Loading pet...</p>
        </div>
      </div>
    );
  }

  if (!pet) {
    return null;
  }

  const breedInfo = BREED_INFO[pet.breedType];
  const xpNeeded = Math.floor(100 * Math.pow(1.5, pet.level - 1));
  const xpPercentage = Math.floor((pet.currentXP / xpNeeded) * 100);

  const evolutionMultipliers = EVOLUTION_MULTIPLIERS[pet.evolutionStage];
  const shopMultipliers = gameStats?.permanentUpgrades || { foodMultiplier: 1, xpMultiplier: 1, cooldownMultiplier: 1 };

  const totalMultipliers = {
    food: evolutionMultipliers.food * shopMultipliers.foodMultiplier,
    xp: evolutionMultipliers.xp * shopMultipliers.xpMultiplier,
    cooldown: evolutionMultipliers.cooldown * shopMultipliers.cooldownMultiplier
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 pb-24 md:pb-8">
      <div className="container mx-auto px-6 py-8">
        <Button
          onClick={() => navigate('/pets')}
          className="mb-6 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-inter font-bold flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Back to Collection
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="cute-card overflow-hidden">
              <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 p-8 relative">
                {showEvolutionAnimation && (
                  <div className="absolute inset-0 bg-yellow-400 animate-pulse flex items-center justify-center z-10">
                    <div className="text-center text-white">
                      <div className="text-6xl mb-4 animate-bounce">✨</div>
                      <div className="text-2xl font-inter font-bold">Evolving!</div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-start mb-4">
                  {pet.isShiny && (
                    <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-sm rounded-full font-inter font-bold">
                      ✨ Shiny
                    </span>
                  )}
                  <div className="ml-auto">
                    {pet.evolutionStage === 'base' && (
                      <span className="px-3 py-1 bg-gray-500 text-white text-sm rounded-full font-inter font-bold">
                        Base Form
                      </span>
                    )}
                    {pet.evolutionStage === 'evolved' && (
                      <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full font-inter font-bold flex items-center gap-1">
                        <Zap size={14} /> Evolved
                      </span>
                    )}
                    {pet.evolutionStage === 'ascended' && (
                      <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full font-inter font-bold flex items-center gap-1">
                        <Star size={14} /> Ascended
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-8xl mb-4">{breedInfo.emoji}</div>
                  <h1 className="text-4xl font-inter font-bold text-white mb-2">
                    {pet.name}
                  </h1>
                  <p className="text-white/90 text-xl font-inter">
                    {breedInfo.name}
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Star size={24} className="text-yellow-500" />
                      <span className="text-2xl font-inter font-bold text-gray-800">
                        Level {pet.level}
                      </span>
                    </div>
                    <span className="text-gray-600 font-inter">
                      {pet.currentXP} / {xpNeeded} XP
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="h-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300"
                      style={{ width: `${xpPercentage}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-600 font-inter mt-1 text-right">
                    {xpPercentage}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-500 rounded-lg p-4 text-center shadow-sm">
                    <div className="text-2xl mb-2">🍖</div>
                    <div className="text-xs text-white/80 font-inter">Times Fed</div>
                    <div className="text-lg font-inter font-bold text-white">
                      {pet.stats.totalFeedings}x
                    </div>
                  </div>
                  <div className="bg-purple-500 rounded-lg p-4 text-center shadow-sm">
                    <div className="text-2xl mb-2">💪</div>
                    <div className="text-xs text-white/80 font-inter">Training Sessions</div>
                    <div className="text-lg font-inter font-bold text-white">
                      {pet.stats.totalTrainingSessions}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="cute-card p-6">
              <h2 className="text-2xl font-inter font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Dumbbell size={24} className="text-purple-500" />
                Training Stats
              </h2>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target size={20} className="text-purple-500" />
                      <span className="font-inter font-bold text-gray-700">Agility</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 font-inter">{pet.training.agility}%</span>
                      <Button
                        onClick={() => handleTrain('agility')}
                        disabled={isTraining || pet.training.agility >= 100}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-1 rounded-lg text-sm font-inter font-bold disabled:opacity-50"
                      >
                        Train ({getTrainingCost(pet.training.agility)} Food)
                      </Button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-orange-500 transition-all duration-300"
                      style={{ width: `${pet.training.agility}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Star size={20} className="text-purple-500" />
                      <span className="font-inter font-bold text-gray-700">Obedience</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 font-inter">{pet.training.obedience}%</span>
                      <Button
                        onClick={() => handleTrain('obedience')}
                        disabled={isTraining || pet.training.obedience >= 100}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-1 rounded-lg text-sm font-inter font-bold disabled:opacity-50"
                      >
                        Train ({getTrainingCost(pet.training.obedience)} Food)
                      </Button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-orange-500 transition-all duration-300"
                      style={{ width: `${pet.training.obedience}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Brain size={20} className="text-purple-500" />
                      <span className="font-inter font-bold text-gray-700">Intelligence</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 font-inter">{pet.training.intelligence}%</span>
                      <Button
                        onClick={() => handleTrain('intelligence')}
                        disabled={isTraining || pet.training.intelligence >= 100}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-1 rounded-lg text-sm font-inter font-bold disabled:opacity-50"
                      >
                        Train ({getTrainingCost(pet.training.intelligence)} Food)
                      </Button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-orange-500 transition-all duration-300"
                      style={{ width: `${pet.training.intelligence}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="cute-card p-6">
              <h2 className="text-xl font-inter font-bold text-gray-800 mb-4">
                Actions
              </h2>
              <div className="space-y-3">
                <Button
                  onClick={handleFeed}
                  disabled={isFeeding}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-inter font-bold flex items-center justify-center gap-2"
                >
                  <Utensils size={20} />
                  Feed (10 Food)
                </Button>
                {pet.isListed ? (
                  <Button
                    onClick={handleUnlistPet}
                    disabled={isUnlisting}
                    className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-4 py-3 rounded-lg font-inter font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ShoppingBag size={20} />
                    {isUnlisting ? 'Unlisting...' : 'Unlist from Market'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowListModal(true)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-inter font-bold flex items-center justify-center gap-2"
                  >
                    <ShoppingBag size={20} />
                    Sell on Market
                  </Button>
                )}
              </div>
            </div>

            <div className="cute-card p-6">
              <h2 className="text-xl font-inter font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Zap size={20} className="text-purple-500" />
                Abilities
              </h2>
              {pet.abilities.length === 0 ? (
                <p className="text-gray-600 font-inter text-sm">
                  No abilities unlocked yet. Reach level 10 to evolve!
                </p>
              ) : (
                <div className="space-y-3">
                  {pet.abilities.map((ability, idx) => (
                    <div key={idx} className="bg-purple-50 rounded-lg p-3">
                      <div className="font-inter font-bold text-purple-800 mb-1">
                        {ability.name}
                      </div>
                      <div className="text-sm text-purple-600 font-inter">
                        {ability.effect}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="cute-card p-6">
              <h2 className="text-xl font-inter font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-purple-500" />
                Multipliers
              </h2>
              <div className="space-y-2 text-sm font-inter">
                <div className="flex justify-between">
                  <span className="text-gray-600">Food Bonus:</span>
                  <span className="font-bold text-gray-800">+{Math.floor((totalMultipliers.food - 1) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">XP Bonus:</span>
                  <span className="font-bold text-gray-800">+{Math.floor((totalMultipliers.xp - 1) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cooldown:</span>
                  <span className="font-bold text-gray-800">-{Math.floor((1 - totalMultipliers.cooldown) * 100)}%</span>
                </div>
              </div>
            </div>

            <div className="cute-card p-6">
              <h2 className="text-xl font-inter font-bold text-gray-800 mb-2">
                Market Value
              </h2>
              <div className="text-3xl font-inter font-bold text-purple-600">
                🍖 {pet.marketValue.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 font-inter mt-2">
                Estimated value based on level, evolution stage, and rarity
              </p>
            </div>
          </div>
        </div>
      </div>

      {showListModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#f97316] to-[#fb923c] rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-inter font-bold text-white mb-4">
              List {pet.name} on Market
            </h2>
            <p className="text-white/80 font-inter mb-4">
              Set your selling price in Food tokens.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-inter font-bold text-white mb-2">
                Price (Food)
              </label>
              <input
                type="number"
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
                placeholder={`Suggested: ${pet.marketValue}`}
                className="w-full px-4 py-2 border border-white/20 bg-white/10 text-white placeholder:text-white/60 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent font-inter"
                min="1"
              />
              <p className="text-xs text-white/70 font-inter mt-1">
                Marketplace fee: 5% • You'll receive: {listingPrice ? Math.floor(parseInt(listingPrice) * 0.95) : 0} Food
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowListModal(false)}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 px-4 py-2 rounded-lg font-inter font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleListOnMarket}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-inter font-bold"
              >
                List Pet
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
