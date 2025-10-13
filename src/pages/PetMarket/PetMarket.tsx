import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Star, Zap, ShoppingCart, TrendingUp } from 'lucide-react';
import { Button } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { PetService } from '../../services/petService';
import { MarketListing, BREED_INFO, BreedType, EvolutionStage } from '../../types/pet.types';

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

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [listings, searchQuery, selectedBreed, selectedStage, priceSort]);

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
        l.sellerUsername.toLowerCase().includes(query)
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
                    className="cute-card overflow-hidden hover:transform hover:scale-105 transition-all duration-300"
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
                        <div className="text-6xl mb-4">{breedInfo.emoji}</div>
                        <h3 className="text-xl font-inter font-bold text-white mb-1">
                          {breedInfo.name}
                        </h3>
                        <p className="text-white/80 font-inter text-sm">
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

                      {listing.sellerId === user?.id ? (
                        <Button
                          onClick={() => handleUnlist(listing)}
                          disabled={isUnlisting}
                          className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-4 py-3 rounded-lg font-inter font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ShoppingCart size={20} />
                          {isUnlisting ? 'Unlisting...' : 'Unlist Pet'}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handlePurchase(listing)}
                          disabled={!canAfford}
                          className={`w-full ${
                            canAfford
                              ? 'bg-purple-600 hover:bg-purple-700'
                              : 'bg-gray-300 cursor-not-allowed'
                          } text-white px-4 py-3 rounded-lg font-inter font-bold flex items-center justify-center gap-2`}
                        >
                          <ShoppingCart size={20} />
                          {canAfford ? 'Buy Now' : 'Insufficient Balance'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedListing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-inter font-bold text-gray-800 mb-4">
              Confirm Purchase
            </h2>
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-center mb-4">
                  <div className="text-5xl mb-2">{BREED_INFO[selectedListing.breedType].emoji}</div>
                  <div className="font-inter font-bold text-gray-800">
                    {BREED_INFO[selectedListing.breedType].name}
                  </div>
                  <div className="text-sm text-gray-600 font-inter">
                    Level {selectedListing.level} • {selectedListing.evolutionStage}
                  </div>
                </div>
                <div className="space-y-2 text-sm font-inter">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-bold">🍖 {selectedListing.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Marketplace fee:</span>
                    <span className="font-bold">🍖 {Math.floor(selectedListing.price * 0.05).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-700 font-bold">Total:</span>
                    <span className="font-bold text-purple-600">
                      🍖 {(selectedListing.price + Math.floor(selectedListing.price * 0.05)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800 font-inter">
                <strong>Note:</strong> This purchase is final. The pet will be transferred to your collection immediately.
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setSelectedListing(null)}
                disabled={isPurchasing}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-inter font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmPurchase}
                disabled={isPurchasing}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-3 rounded-lg font-inter font-bold"
              >
                {isPurchasing ? 'Processing...' : 'Confirm Purchase'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
