import React, { useState, useEffect } from 'react';
import { Store, Tag, TrendingUp, Package, ShoppingBag, X, DollarSign, Check } from 'lucide-react';
import { Button } from 'components';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useGame } from '../../context/GameContext';
import { MarketplaceService, MarketplaceListing } from '../../services/marketplaceService';
import { InventoryService, InventoryItem } from '../../services/inventoryService';

export const Marketplace: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const { gameStats, refetch } = useGame();
  const [selectedTab, setSelectedTab] = useState<'browse' | 'mylistings' | 'sell'>('browse');
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [myListings, setMyListings] = useState<MarketplaceListing[]>([]);
  const [myInventory, setMyInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [sellPrice, setSellPrice] = useState('');
  const [sellQuantity, setSellQuantity] = useState(1);

  useEffect(() => {
    loadData();
  }, [user?.id, selectedTab]);

  const loadData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      if (selectedTab === 'browse') {
        const allListings = await MarketplaceService.getActiveListings();
        setListings(allListings.filter(l => l.user_id !== user.id));
      } else if (selectedTab === 'mylistings') {
        const userListings = await MarketplaceService.getUserListings(user.id);
        setMyListings(userListings);
      } else if (selectedTab === 'sell') {
        const inventory = await InventoryService.getUserInventory(user.id);
        setMyInventory(inventory);
      }
    } catch (err) {
      console.error('Error loading marketplace:', err);
      error('Failed to load marketplace data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (listing: MarketplaceListing) => {
    if (!user?.id) return;

    const canAfford = (gameStats?.zenBalance || 0) >= listing.price;
    if (!canAfford) {
      error('Insufficient Food balance!');
      return;
    }

    if (!confirm(`Purchase ${listing.item_name} for 🍖 ${listing.price}?`)) return;

    setIsProcessing(true);
    try {
      await MarketplaceService.purchaseListing(listing.id, user.id);
      success(`Purchased ${listing.item_name}! Check your inventory.`);
      await loadData();
      await refetch();
    } catch (err: any) {
      console.error('Purchase error:', err);
      error(err.message || 'Purchase failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateListing = async () => {
    if (!selectedItem || !user?.id || !sellPrice) return;

    const price = parseInt(sellPrice);
    if (isNaN(price) || price <= 0) {
      error('Invalid price');
      return;
    }

    if (sellQuantity > selectedItem.quantity) {
      error('Quantity exceeds available amount');
      return;
    }

    setIsProcessing(true);
    try {
      await MarketplaceService.createListing(
        user.id,
        selectedItem.id,
        selectedItem.item_id,
        selectedItem.item_name,
        selectedItem.item_type,
        sellQuantity,
        price,
        selectedItem.effect,
        selectedItem.metadata
      );
      success('Listing created successfully!');
      setSelectedItem(null);
      setSellPrice('');
      setSellQuantity(1);
      setSelectedTab('mylistings');
      await loadData();
    } catch (err: any) {
      console.error('Listing error:', err);
      error(err.message || 'Failed to create listing');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelListing = async (listingId: string) => {
    if (!user?.id || !confirm('Cancel this listing?')) return;

    setIsProcessing(true);
    try {
      await MarketplaceService.cancelListing(listingId, user.id);
      success('Listing cancelled successfully');
      await loadData();
    } catch (err: any) {
      console.error('Cancel error:', err);
      error(err.message || 'Failed to cancel listing');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 flex items-center justify-center pb-24 md:pb-8">
        <div className="text-white text-xl font-inter">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 pb-24 md:pb-8">
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="title-responsive font-inter font-bold gradient-text">
              Item Marketplace
            </h1>
            <p className="text-white text-lg font-inter font-semibold">
              Buy and sell items with other players
            </p>
            <div className="flex items-center justify-center gap-2 text-white font-inter font-bold text-xl">
              <span>🍖</span>
              {gameStats?.zenBalance?.toLocaleString() || 0} Food
            </div>
            <div className="text-white text-sm font-inter">
              ⚠️ 10% marketplace fee on sales
            </div>
          </div>

          <div className="cute-card p-6">
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => setSelectedTab('browse')}
                className={`px-6 py-3 rounded-xl font-inter font-bold transition-all duration-200 flex items-center gap-2 ${
                  selectedTab === 'browse'
                    ? 'bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white shadow-lg scale-105'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
              >
                <Store size={20} />
                Browse ({listings.length})
              </button>
              <button
                onClick={() => setSelectedTab('mylistings')}
                className={`px-6 py-3 rounded-xl font-inter font-bold transition-all duration-200 flex items-center gap-2 ${
                  selectedTab === 'mylistings'
                    ? 'bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white shadow-lg scale-105'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
              >
                <Tag size={20} />
                My Listings ({myListings.length})
              </button>
              <button
                onClick={() => setSelectedTab('sell')}
                className={`px-6 py-3 rounded-xl font-inter font-bold transition-all duration-200 flex items-center gap-2 ${
                  selectedTab === 'sell'
                    ? 'bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white shadow-lg scale-105'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
              >
                <TrendingUp size={20} />
                Sell Items
              </button>
            </div>
          </div>

          {selectedTab === 'browse' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.length === 0 ? (
                <div className="col-span-full cute-card p-12 text-center">
                  <ShoppingBag size={64} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-inter font-bold text-gray-800 mb-2">
                    No items available
                  </h3>
                  <p className="text-gray-600 font-inter">
                    Check back later or sell your own items
                  </p>
                </div>
              ) : (
                listings.map((listing) => (
                  <div key={listing.id} className="cute-card overflow-hidden">
                    <div className="p-6 bg-gradient-to-br from-green-400 to-emerald-500">
                      <div className="text-center">
                        <div className="text-6xl mb-4">{listing.metadata?.emoji || '📦'}</div>
                        <h3 className="text-xl font-inter font-bold text-white mb-2">
                          {listing.item_name}
                        </h3>
                        {listing.quantity > 1 && (
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block">
                            <span className="text-white font-inter font-bold">x{listing.quantity}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between text-lg font-inter">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-bold text-green-600">
                          🍖 {listing.price.toLocaleString()}
                        </span>
                      </div>

                      <Button
                        onClick={() => handlePurchase(listing)}
                        disabled={isProcessing || (gameStats?.zenBalance || 0) < listing.price}
                        className={`w-full ${
                          (gameStats?.zenBalance || 0) >= listing.price && !isProcessing
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                            : 'bg-gray-600 cursor-not-allowed text-gray-300'
                        } px-4 py-3 rounded-lg font-inter font-bold flex items-center justify-center gap-2`}
                      >
                        <ShoppingBag size={20} />
                        {(gameStats?.zenBalance || 0) >= listing.price ? 'Buy Now' : 'Insufficient Balance'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {selectedTab === 'mylistings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myListings.length === 0 ? (
                <div className="col-span-full cute-card p-12 text-center">
                  <Tag size={64} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-inter font-bold text-gray-800 mb-2">
                    No active listings
                  </h3>
                  <p className="text-gray-600 font-inter">
                    Go to Sell Items tab to create listings
                  </p>
                </div>
              ) : (
                myListings.map((listing) => (
                  <div key={listing.id} className="cute-card overflow-hidden">
                    <div className={`p-6 ${
                      listing.status === 'sold' ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                      'bg-gradient-to-br from-blue-400 to-indigo-500'
                    }`}>
                      <div className="text-center">
                        <div className="text-6xl mb-4">{listing.metadata?.emoji || '📦'}</div>
                        <h3 className="text-xl font-inter font-bold text-white mb-2">
                          {listing.item_name}
                        </h3>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block">
                          <span className="text-white font-inter font-bold uppercase text-xs">
                            {listing.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between text-lg font-inter">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-bold text-gray-800">
                          🍖 {listing.price.toLocaleString()}
                        </span>
                      </div>

                      {listing.status === 'active' && (
                        <Button
                          onClick={() => handleCancelListing(listing.id)}
                          disabled={isProcessing}
                          className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-inter font-bold flex items-center justify-center gap-2"
                        >
                          <X size={20} />
                          Cancel Listing
                        </Button>
                      )}

                      {listing.status === 'sold' && (
                        <div className="text-center text-green-600 font-inter font-bold flex items-center justify-center gap-2">
                          <Check size={20} />
                          Sold!
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {selectedTab === 'sell' && !selectedItem && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myInventory.length === 0 ? (
                <div className="col-span-full cute-card p-12 text-center">
                  <Package size={64} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-inter font-bold text-gray-800 mb-2">
                    No items to sell
                  </h3>
                  <p className="text-gray-600 font-inter">
                    Purchase items from the shop first
                  </p>
                </div>
              ) : (
                myInventory.map((item) => (
                  <div key={item.id} className="cute-card overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                       onClick={() => setSelectedItem(item)}>
                    <div className="p-6 bg-gradient-to-br from-yellow-400 to-orange-500">
                      <div className="text-center">
                        <div className="text-6xl mb-4">{item.metadata?.emoji || '📦'}</div>
                        <h3 className="text-xl font-inter font-bold text-white mb-2">
                          {item.item_name}
                        </h3>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block">
                          <span className="text-white font-inter font-bold">x{item.quantity}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 text-center">
                      <Button className="w-full bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:from-[#ea580c] hover:to-[#f97316] text-white px-4 py-2 rounded-lg font-inter font-bold">
                        <DollarSign size={18} className="inline mr-2" />
                        Sell This Item
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {selectedTab === 'sell' && selectedItem && (
            <div className="max-w-2xl mx-auto">
              <div className="cute-card overflow-hidden">
                <div className="p-6 bg-gradient-to-br from-yellow-400 to-orange-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">{selectedItem.metadata?.emoji || '📦'}</div>
                    <h3 className="text-xl font-inter font-bold text-white mb-2">
                      {selectedItem.item_name}
                    </h3>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  <div>
                    <label className="block text-gray-700 font-inter font-bold mb-2">
                      Quantity (Available: {selectedItem.quantity})
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedItem.quantity}
                      value={sellQuantity}
                      onChange={(e) => setSellQuantity(Math.max(1, Math.min(selectedItem.quantity, parseInt(e.target.value) || 1)))}
                      className="w-full px-4 py-3 rounded-lg border-2 border-purple-300 focus:border-purple-500 outline-none font-inter"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-inter font-bold mb-2">
                      Price (in Food)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(e.target.value)}
                      placeholder="Enter price..."
                      className="w-full px-4 py-3 rounded-lg border-2 border-purple-300 focus:border-purple-500 outline-none font-inter"
                    />
                  </div>

                  {sellPrice && parseInt(sellPrice) > 0 && (
                    <div className="bg-purple-100 rounded-lg p-4 space-y-2 font-inter">
                      <div className="flex justify-between">
                        <span className="text-gray-600">List Price:</span>
                        <span className="font-bold">🍖 {parseInt(sellPrice).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Marketplace Fee (10%):</span>
                        <span className="font-bold text-red-600">- 🍖 {Math.floor(parseInt(sellPrice) * 0.1).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-800 font-bold">You Receive:</span>
                        <span className="font-bold text-green-600">🍖 {(parseInt(sellPrice) - Math.floor(parseInt(sellPrice) * 0.1)).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      onClick={() => {
                        setSelectedItem(null);
                        setSellPrice('');
                        setSellQuantity(1);
                      }}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-inter font-bold"
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateListing}
                      disabled={isProcessing || !sellPrice || parseInt(sellPrice) <= 0}
                      className="flex-1 bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:from-[#ea580c] hover:to-[#f97316] text-white px-6 py-3 rounded-lg font-inter font-bold"
                    >
                      {isProcessing ? 'Creating...' : 'Create Listing'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
