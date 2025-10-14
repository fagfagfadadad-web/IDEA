import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Star, Zap, ShoppingCart, TrendingUp, TrendingDown, Sparkles, History, ArrowRight } from 'lucide-react';
import { Button } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { PetService } from '../../services/petService';
import { MarketListing, BREED_INFO, BreedType, EvolutionStage, EVOLUTION_MULTIPLIERS, PetOwnershipHistory } from '../../types/pet.types';

export const PetMarket = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameStats, refetch } = useGame();
  const { success, error } = useToast();

  const [listings, setListings] = useState<MarketListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<MarketListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBreed, setSelectedBreed] = useState<BreedType | 'all'>('all');
  const [selectedStage, setSelectedStage] = useState<EvolutionStage | 'all'>('all');
  const [priceSort, setPriceSort] = useState<'asc' | 'desc' | 'none'>('none');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MarketListing | null>(null);
  const [isUnlisting, setIsUnlisting] = useState(false);
  const [ownershipHistory, setOwnershipHistory] = useState<PetOwnershipHistory[]>([]);
  const [floorPrice, setFloorPrice] = useState<number>(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [listings, searchQuery, selectedBreed, selectedStage, priceSort]);

  useEffect(() => {
    if (selectedListing?.petId && selectedListing?.breedType) {
      loadHistoryAndFloorPrice(selectedListing.petId, selectedListing.breedType);
    }
  }, [selectedListing]);

  const loadHistoryAndFloorPrice = async (petId: string, breedType: BreedType) => {
    setIsLoadingHistory(true);
    try {
      const [history, floor] = await Promise.all([
        PetService.getPetOwnershipHistory(petId),
        PetService.getBreedFloorPrice(breedType)
      ]);
      setOwnershipHistory(history);
      setFloorPrice(floor);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchListings = async () => {
    try {
      setIsLoading(true);
      const marketListings = await PetService.getMarketListings();
      setListings(marketListings);
    } catch (err) {
      console.error('Error fetching listings:', err);
      error('Failed to load market listings');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...listings];

    if (selectedBreed !== 'all') {
      filtered = filtered.filter(l => l.breedType === selectedBreed);
    }

    if (selectedStage !== 'all') {
      filtered = filtered.filter(l => l.evolutionStage === selectedStage);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(l =>
        BREED_INFO[l.breedType].name.toLowerCase().includes(query) ||
        l.sellerUsername.toLowerCase().includes(query) ||
        (l.pet?.name && l.pet.name.toLowerCase().includes(query))
      );
    }

    if (priceSort === 'asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (priceSort === 'desc') {
      filtered.sort((a, b) => b.price - a.price);
    }

    setFilteredListings(filtered);
  };

  const handlePurchase = async (listing: MarketListing) => {
    if (!user?.id || !user?.username) {
      error('Please log in to purchase');
      return;
    }

    const totalCost = listing.price + Math.floor(listing.price * 0.05);
    if ((gameStats?.zenBalance || 0) < totalCost) {
      error('Insufficient balance!');
      return;
    }

    setSelectedListing(listing);
  };

  const confirmPurchase = async () => {
    if (!selectedListing || !user?.id || !user?.username) return;
    if (isPurchasing) return; // Prevent double-click

    try {
      setIsPurchasing(true);
      const result = await PetService.purchasePet(
        selectedListing.id!,
        user.id,
        user.username
      );

      if (result.success) {
        success('Pet purchased successfully!');
        setSelectedListing(null);
        fetchListings();
        refetch();
        navigate('/pets');
      } else {
        error(result.error || 'Purchase failed');
      }
    } catch (err) {
      console.error('Error purchasing pet:', err);
      error('Failed to purchase pet');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleUnlist = async (listing: MarketListing) => {
    if (!user?.id || !listing.id) return;

    try {
      setIsUnlisting(true);
      const result = await PetService.cancelListing(listing.id, user.id);

      if (result) {
        success('Pet unlisted successfully!');
        setSelectedListing(null);
        fetchListings();
        refetch();
      } else {
        error('Failed to unlist pet');
      }
    } catch (err) {
      console.error('Error unlisting pet:', err);
      error('Failed to unlist pet');
    } finally {
      setIsUnlisting(false);
    }
  };

  const getEvolutionBadge = (stage: EvolutionStage) => {
    switch (stage) {
      case 'base':
        return <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full font-inter font-bold">Base</span>;
      case 'evolved':
        return <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-inter font-bold flex items-center gap-1"><Zap size={12} />Evolved</span>;
      case 'ascended':
        return <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full font-inter font-bold flex items-center gap-1"><Star size={12} />Ascended</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-inter">Loading marketplace...</p>
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
              Pet Market
            </h1>
            <p className="text-white text-lg font-inter font-semibold">
              Buy and sell evolved pets with unique abilities
            </p>
            <div className="flex items-center justify-center gap-2 text-white font-inter font-bold text-xl">
              <span>🍖</span>
              {gameStats?.zenBalance?.toLocaleString() || 0} Food
            </div>
          </div>

          <div className="cute-card p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by breed or seller..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-inter text-gray-800 placeholder:text-gray-400"
                />
              </div>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-inter font-bold flex items-center gap-2"
              >
                <Filter size={20} />
                Filters
              </Button>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-inter font-bold text-gray-700 mb-2">
                    Breed
                  </label>
                  <select
                    value={selectedBreed}
                    onChange={(e) => setSelectedBreed(e.target.value as BreedType | 'all')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-inter"
                  >
                    <option value="all">All Breeds</option>
                    {(Object.keys(BREED_INFO) as BreedType[]).map(breed => (
                      <option key={breed} value={breed}>
                        {BREED_INFO[breed].emoji} {BREED_INFO[breed].name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-inter font-bold text-gray-700 mb-2">
                    Evolution Stage
                  </label>
                  <select
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value as EvolutionStage | 'all')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-inter"
                  >
                    <option value="all">All Stages</option>
                    <option value="base">Base Form</option>
                    <option value="evolved">Evolved</option>
                    <option value="ascended">Ascended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-inter font-bold text-gray-700 mb-2">
                    Sort by Price
                  </label>
                  <select
                    value={priceSort}
                    onChange={(e) => setPriceSort(e.target.value as 'asc' | 'desc' | 'none')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-inter"
                  >
                    <option value="none">No Sorting</option>
                    <option value="asc">Price: Low to High</option>
                    <option value="desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-600 font-inter">
            {filteredListings.length} pet{filteredListings.length !== 1 ? 's' : ''} available
          </div>

          {filteredListings.length === 0 ? (
            <div className="cute-card p-12 text-center">
              <div className="text-6xl mb-4">🏪</div>
              <h3 className="text-2xl font-inter font-bold text-gray-700 mb-2">
                No Listings Found
              </h3>
              <p className="text-gray-600 font-inter">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => {
                const breedInfo = BREED_INFO[listing.breedType];
                const totalCost = listing.price + Math.floor(listing.price * 0.05);
                const canAfford = (gameStats?.zenBalance || 0) >= totalCost;

                return (
                  <div
                    key={listing.id}
                    onClick={() => setSelectedListing(listing)}
                    className="cute-card overflow-hidden hover:transform hover:scale-105 transition-all duration-300 cursor-pointer"
                  >
                    <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 p-6 relative">
                      <div className="absolute top-4 right-4">
                        {getEvolutionBadge(listing.evolutionStage)}
                      </div>
                      {listing.isShiny && (
                        <div className="absolute top-4 left-4">
                          <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs rounded-full font-inter font-bold">
                            ✨ Shiny
                          </span>
                        </div>
                      )}
                      <div className="text-center">
                        {(listing.pet?.aiImageUrl || listing.pet?.aiImageData) ? (
                          <div className="relative mb-4 bg-gradient-to-br from-white/5 to-white/10 rounded-lg p-2">
                            <img
                              src={listing.pet.aiImageUrl || listing.pet.aiImageData}
                              alt={breedInfo.name}
                              className="w-full h-48 object-contain rounded-lg"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden text-6xl mb-4">{breedInfo.emoji}</div>
                            {listing.pet?.hasCustomImage && (
                              <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-inter font-bold">
                                🎨 AI
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-6xl mb-4">{breedInfo.emoji}</div>
                        )}
                        <h3 className="text-2xl font-inter font-bold text-white mb-1">
                          {listing.pet?.name || breedInfo.name}
                        </h3>
                        <p className="text-white/90 font-inter text-sm mb-1">
                          {breedInfo.name}
                        </p>
                        <p className="text-white/70 font-inter text-xs">
                          by @{listing.sellerUsername}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star size={20} className="text-yellow-500" />
                          <span className="font-inter font-bold text-gray-700">
                            Level {listing.level}
                          </span>
                        </div>
                      </div>

                      {listing.abilities.length > 0 && (
                        <div className="border-t pt-4">
                          <div className="text-xs text-gray-600 font-inter mb-2">Abilities:</div>
                          <div className="space-y-1">
                            {listing.abilities.slice(0, 2).map((ability, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-sm text-gray-700 font-inter"
                              >
                                <Zap size={14} className="text-purple-500" />
                                <span>{ability}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="border-t pt-4 space-y-2">
                        <div className="flex items-center justify-between text-lg font-inter">
                          <span className="text-gray-600">Price:</span>
                          <span className="font-bold text-gray-800">
                            🍖 {listing.price.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 font-inter">
                          <span>Marketplace fee (5%):</span>
                          <span>🍖 {Math.floor(listing.price * 0.05).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm font-inter font-bold">
                          <span className="text-gray-700">Total:</span>
                          <span className="text-purple-600">
                            🍖 {totalCost.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedListing(listing);
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-inter font-bold flex items-center justify-center gap-2"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedListing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pb-24 md:pb-4">
          <div className="bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col" style={{maxHeight: '85vh'}}>
            <div className="p-4 pb-3 flex-shrink-0">
              <h2 className="text-xl font-inter font-bold text-white">
                {selectedListing.sellerId === user?.id ? 'Pet Details' : 'Confirm Purchase'}
              </h2>
            </div>

            <div className="space-y-3 px-4 overflow-y-auto flex-1">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                <div className="text-center mb-4">
                  {(selectedListing.pet?.aiImageUrl || selectedListing.pet?.aiImageData) ? (
                    <div className="relative mb-2 bg-gradient-to-br from-white/5 to-white/10 rounded-lg p-2">
                      <img
                        src={selectedListing.pet.aiImageUrl || selectedListing.pet.aiImageData}
                        alt={BREED_INFO[selectedListing.breedType].name}
                        className="w-full h-48 object-contain rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden text-5xl mb-2">{BREED_INFO[selectedListing.breedType].emoji}</div>
                      {selectedListing.pet?.hasCustomImage && (
                        <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-inter font-bold">
                          🎨 AI
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-5xl mb-2">{BREED_INFO[selectedListing.breedType].emoji}</div>
                  )}
                  <div className="font-inter font-bold text-white text-2xl mb-1">
                    {selectedListing.pet?.name || BREED_INFO[selectedListing.breedType].name}
                  </div>
                  <div className="text-sm text-white/90 font-inter mb-1">
                    {BREED_INFO[selectedListing.breedType].name}
                  </div>
                  <div className="text-xs text-white/80 font-inter mb-2">
                    Level {selectedListing.level} • {selectedListing.evolutionStage}
                  </div>
                  {selectedListing.isShiny && (
                    <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs rounded-full font-inter font-bold">
                      ✨ Shiny
                    </span>
                  )}
                </div>

                <div className="border-t border-white/30 pt-3">
                  <div className="text-white/80 font-bold mb-2 text-sm">Market Value</div>
                  <div className="text-white/90 text-sm">
                    🍖 {selectedListing.pet?.marketValue?.toLocaleString() || 200}
                    <span className="text-white/60 text-xs ml-2">Estimated value</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30 space-y-3 text-xs font-inter">
                  <div>
                    <div className="text-white/80 font-bold mb-2">Training Stats</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-white/90">Agility:</span>
                        <span className="text-white font-bold">{selectedListing.pet?.training?.agility || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/90">Obedience:</span>
                        <span className="text-white font-bold">{selectedListing.pet?.training?.obedience || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/90">Intelligence:</span>
                        <span className="text-white font-bold">{selectedListing.pet?.training?.intelligence || 0}%</span>
                      </div>
                    </div>
                  </div>

                  {selectedListing.abilities.length > 0 ? (
                    <div className="border-t border-white/30 pt-3">
                      <div className="text-white/80 font-bold mb-2">Abilities</div>
                      <div className="space-y-1">
                        {selectedListing.abilities.map((ability, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-white/90">
                            <Zap size={12} className="text-yellow-300" />
                            <span>{ability}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-white/30 pt-3">
                      <div className="text-white/80 font-bold mb-2">Abilities</div>
                      <div className="text-white/60 text-xs italic">
                        No abilities unlocked yet. Reach level 10 to evolve!
                      </div>
                    </div>
                  )}

                  {selectedListing.pet?.equippedItems && selectedListing.pet.equippedItems.length > 0 && (
                    <div className="border-t border-white/30 pt-3">
                      <div className="text-white/80 font-bold mb-2">Equipped Rare Items</div>
                      <div className="space-y-1">
                        {selectedListing.pet.equippedItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-white/90">
                            <Sparkles size={12} className="text-purple-300" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-white/30 pt-3">
                    <div className="text-white/80 font-bold mb-2">Multipliers</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-white/90">Food Bonus:</span>
                        <span className="text-white font-bold">+{Math.floor((EVOLUTION_MULTIPLIERS[selectedListing.evolutionStage].food - 1) * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/90">XP Bonus:</span>
                        <span className="text-white font-bold">+{Math.floor((EVOLUTION_MULTIPLIERS[selectedListing.evolutionStage].xp - 1) * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/90">Cooldown:</span>
                        <span className="text-white font-bold">-{Math.floor((1 - EVOLUTION_MULTIPLIERS[selectedListing.evolutionStage].cooldown) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Sales History Section */}
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <History size={16} className="text-white" />
                    <h3 className="text-white font-bold text-sm">Sales History</h3>
                  </div>
                  {floorPrice > 0 && (
                    <div className="text-right">
                      <div className="text-white/60 text-xs">Floor Price</div>
                      <div className="text-white font-bold text-sm">🍖 {floorPrice.toLocaleString()}</div>
                    </div>
                  )}
                </div>

                {isLoadingHistory ? (
                  <div className="text-center py-4 text-white/60 text-xs">Loading history...</div>
                ) : ownershipHistory.length === 0 ? (
                  <div className="text-center py-4 text-white/60 text-xs italic">
                    No sales history yet. This will be the first!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {ownershipHistory.filter(h => h.transferType === 'purchase').slice(0, 10).map((history, idx) => (
                      <div key={history.id || idx} className="bg-white/10 rounded-lg p-2 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 text-white/90">
                            <span className="font-bold">{history.fromUsername || 'Unknown'}</span>
                            <ArrowRight size={12} className="text-white/60" />
                            <span className="font-bold">{history.toUsername || 'Unknown'}</span>
                          </div>
                          {history.price && (
                            <div className="flex items-center gap-1">
                              <span className="text-white font-bold">🍖 {history.price.toLocaleString()}</span>
                              {history.priceChangePercent !== undefined && history.priceChangePercent !== 0 && (
                                <span className={`flex items-center gap-0.5 ${history.priceChangePercent > 0 ? 'text-green-300' : 'text-red-300'}`}>
                                  {history.priceChangePercent > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                  {Math.abs(history.priceChangePercent).toFixed(1)}%
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-white/60 text-xs">
                          {history.transferredAt?.toDate?.().toLocaleDateString() || 'Recently'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-inter">
                  <div className="flex flex-col items-center">
                    <span className="text-white/90 text-xs mb-1">Price</span>
                    <span className="font-bold text-white text-lg">🍖 {selectedListing.price.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-white/90 text-xs mb-1">Marketplace fee (5%)</span>
                    <span className="font-bold text-white text-lg">🍖 {Math.floor(selectedListing.price * 0.05).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-white/90 text-xs mb-1">Total</span>
                    <span className="font-bold text-yellow-300 text-lg">
                      🍖 {(selectedListing.price + Math.floor(selectedListing.price * 0.05)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {selectedListing.sellerId !== user?.id && (
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-sm text-white font-inter border border-white/30">
                  <strong>Note:</strong> This purchase is final. The pet will be transferred to your collection immediately.
                </div>
              )}
            </div>

            <div className="p-4 pt-3 flex-shrink-0 border-t border-white/20">
              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedListing(null)}
                  disabled={isPurchasing || isUnlisting}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-inter font-bold backdrop-blur-sm border border-white/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedListing.sellerId === user?.id ? 'Close' : 'Cancel'}
                </Button>
                {selectedListing.sellerId === user?.id ? (
                  <Button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleUnlist(selectedListing);
                    }}
                    disabled={isUnlisting}
                    className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-inter font-bold shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUnlisting ? 'Unlisting...' : 'Unlist Pet'}
                  </Button>
                ) : (
                  <Button
                    onClick={confirmPurchase}
                    disabled={isPurchasing || (gameStats?.zenBalance || 0) < (selectedListing.price + Math.floor(selectedListing.price * 0.05))}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-inter font-bold shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPurchasing ? 'Processing...' : (gameStats?.zenBalance || 0) < (selectedListing.price + Math.floor(selectedListing.price * 0.05)) ? 'Insufficient Balance' : 'Confirm Purchase'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
