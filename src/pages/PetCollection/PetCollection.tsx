import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Star, Zap, TrendingUp, ShoppingBag } from 'lucide-react';
import { Button } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PetService } from '../../services/petService';
import { Pet, BREED_INFO, BreedType } from '../../types/pet.types';

export const PetCollection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [selectedBreed, setSelectedBreed] = useState<BreedType>('golden_retriever');
  const [petName, setPetName] = useState('');
  const [isAdopting, setIsAdopting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchPets();
    }
  }, [user]);

  const fetchPets = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const userPets = await PetService.getUserPets(user.id);
      setPets(userPets);
    } catch (err) {
      console.error('Error fetching pets:', err);
      error('Failed to load pets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdoptPet = async () => {
    if (!petName.trim()) {
      error('Please enter a name for your pet');
      return;
    }

    if (!user?.id) {
      error('Please log in');
      return;
    }

    try {
      setIsAdopting(true);
      await PetService.adoptPet(user.id, selectedBreed, petName.trim());
      success(`Successfully adopted ${petName}!`);
      setShowAdoptModal(false);
      setPetName('');
      fetchPets();
    } catch (err) {
      console.error('Error adopting pet:', err);
      error('Failed to adopt pet');
    } finally {
      setIsAdopting(false);
    }
  };

  const getEvolutionBadge = (stage: string) => {
    switch (stage) {
      case 'base':
        return <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full font-inter font-bold">Base</span>;
      case 'evolved':
        return <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-inter font-bold flex items-center gap-1"><Zap size={12} />Evolved</span>;
      case 'ascended':
        return <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full font-inter font-bold flex items-center gap-1"><Star size={12} />Ascended</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-inter">Loading your pets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 pb-24 md:pb-8">
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="title-responsive font-inter font-bold gradient-text">
              My Pet Collection
            </h1>
            <p className="text-white text-lg font-inter font-semibold">
              Train, evolve, and care for your pets
            </p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              onClick={() => setShowAdoptModal(true)}
              className="bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:from-[#ea580c] hover:to-[#f97316] text-white px-6 py-3 rounded-xl font-inter font-bold flex items-center gap-2 shadow-lg"
            >
              <Plus size={20} />
              Adopt New Pet
            </Button>
            <Button
              onClick={() => navigate('/market')}
              className="bg-gradient-to-r from-[#7C3AED] to-[#6b21a8] hover:from-[#6b21a8] hover:to-[#581c87] text-white px-6 py-3 rounded-xl font-inter font-bold flex items-center gap-2 shadow-lg"
            >
              <ShoppingBag size={20} />
              Visit Market
            </Button>
          </div>

          {pets.length === 0 ? (
            <div className="cute-card p-12 text-center">
              <div className="text-6xl mb-4">🐕</div>
              <h3 className="text-2xl font-inter font-bold text-gray-700 mb-2">
                No Pets Yet
              </h3>
              <p className="text-gray-600 font-inter mb-6">
                Adopt your first pet to start your journey!
              </p>
              <Button
                onClick={() => setShowAdoptModal(true)}
                className="bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:from-[#ea580c] hover:to-[#f97316] text-white px-8 py-3 rounded-xl font-inter font-bold"
              >
                Adopt Your First Pet
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pets.map((pet) => {
                const breedInfo = BREED_INFO[pet.breedType];
                const xpPercentage = pet.level < 50
                  ? Math.floor((pet.currentXP / (100 * Math.pow(1.5, pet.level - 1))) * 100)
                  : 100;

                return (
                  <div
                    key={pet.id}
                    className="cute-card overflow-hidden cursor-pointer hover:transform hover:scale-105 transition-all duration-300"
                    onClick={() => navigate(`/pets/${pet.id}`)}
                  >
                    <div className="bg-gradient-to-br from-[#f97316] to-[#fb923c] p-6 relative">
                      <div className="absolute top-4 right-4">
                        {getEvolutionBadge(pet.evolutionStage)}
                      </div>
                      {pet.isShiny && (
                        <div className="absolute top-4 left-4">
                          <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs rounded-full font-inter font-bold">
                            ✨ Shiny
                          </span>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-6xl mb-4">{breedInfo.emoji}</div>
                        <h3 className="text-2xl font-inter font-bold text-white mb-1">
                          {pet.name}
                        </h3>
                        <p className="text-white/80 font-inter text-sm">
                          {breedInfo.name}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star size={20} className="text-yellow-500" />
                          <span className="font-inter font-bold text-gray-700">
                            Level {pet.level}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 font-inter">
                            {pet.currentXP.toLocaleString()} XP
                          </div>
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300"
                          style={{ width: `${xpPercentage}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-purple-500 rounded-lg p-2">
                          <div className="text-xs text-white/80 font-inter">Agility</div>
                          <div className="text-sm font-inter font-bold text-white">
                            {pet.training.agility}%
                          </div>
                        </div>
                        <div className="bg-purple-500 rounded-lg p-2">
                          <div className="text-xs text-white/80 font-inter">Obedience</div>
                          <div className="text-sm font-inter font-bold text-white">
                            {pet.training.obedience}%
                          </div>
                        </div>
                        <div className="bg-purple-500 rounded-lg p-2">
                          <div className="text-xs text-white/80 font-inter">Intelligence</div>
                          <div className="text-sm font-inter font-bold text-white">
                            {pet.training.intelligence}%
                          </div>
                        </div>
                      </div>

                      {pet.abilities.length > 0 && (
                        <div className="border-t pt-4">
                          <div className="text-xs text-gray-600 font-inter mb-2">Abilities:</div>
                          {pet.abilities.map((ability, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-sm text-gray-700 font-inter"
                            >
                              <Zap size={14} className="text-purple-500" />
                              <span className="font-bold">{ability.name}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-600 font-inter">
                        <span>Market Value:</span>
                        <span className="font-bold text-gray-800">
                          🍖 {pet.marketValue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showAdoptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-purple-500 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-inter font-bold text-white">
                  Adopt a Pet
                </h2>
                <button
                  onClick={() => setShowAdoptModal(false)}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="block text-sm font-inter font-bold text-white mb-2">
                  Pet Name
                </label>
                <input
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="Enter a name..."
                  className="w-full px-4 py-2 border-2 border-orange-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-inter bg-white"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-inter font-bold text-white mb-3">
                  Select Breed
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(Object.keys(BREED_INFO) as BreedType[]).map((breed) => {
                    const info = BREED_INFO[breed];
                    return (
                      <button
                        key={breed}
                        onClick={() => setSelectedBreed(breed)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          selectedBreed === breed
                            ? 'border-orange-500 bg-orange-500'
                            : 'border-white/30 bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        <div className="text-4xl mb-2">{info.emoji}</div>
                        <div className="text-xs font-inter font-bold text-white">
                          {info.name}
                        </div>
                        <div className="text-xs text-orange-200 font-inter mt-1">
                          🍖 {info.basePrice}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedBreed && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <h3 className="font-inter font-bold text-white mb-2">
                    {BREED_INFO[selectedBreed].name}
                  </h3>
                  <p className="text-sm text-white/90 font-inter mb-3">
                    {BREED_INFO[selectedBreed].description}
                  </p>
                  <div className="space-y-2">
                    <div className="text-xs text-white/90 font-inter">
                      <span className="font-bold text-orange-300">Evolved Ability:</span>{' '}
                      {BREED_INFO[selectedBreed].abilities.evolved.name}
                    </div>
                    <div className="text-xs text-white/90 font-inter">
                      <span className="font-bold text-orange-300">Ascended Ability:</span>{' '}
                      {BREED_INFO[selectedBreed].abilities.ascended.name}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowAdoptModal(false)}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-inter font-bold border border-white/30"
                  disabled={isAdopting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdoptPet}
                  className="flex-1 bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:from-[#ea580c] hover:to-[#f97316] text-white px-6 py-3 rounded-xl font-inter font-bold shadow-lg"
                  disabled={isAdopting}
                >
                  {isAdopting ? 'Adopting...' : `Adopt for 🍖 ${BREED_INFO[selectedBreed].basePrice}`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
