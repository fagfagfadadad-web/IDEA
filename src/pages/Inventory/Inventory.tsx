import React, { useState, useEffect } from 'react';
import { Package, Sparkles, Clock, Trash2, Gift, Star, Zap } from 'lucide-react';
import { Button } from 'components';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { InventoryService, InventoryItem, DailyDeal, RareItem } from '../../services/inventoryService';
import { useGame } from '../../context/GameContext';
import { GameService } from '../../services/gameService';

export const Inventory: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const { gameStats, refetch } = useGame();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [dailyDeals, setDailyDeals] = useState<DailyDeal[]>([]);
  const [rareItems, setRareItems] = useState<RareItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'inventory' | 'deals' | 'rare'>('inventory');
  const [showUseModal, setShowUseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const [inv, deals, rare] = await Promise.all([
        InventoryService.getUserInventory(user.id),
        InventoryService.getDailyDeals(),
        InventoryService.getRareItems()
      ]);
      setInventory(inv);
      setDailyDeals(deals);
      setRareItems(rare);
    } catch (err) {
      console.error('Error loading inventory:', err);
      error('Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseItem = async (item: InventoryItem) => {
    setSelectedItem(item);
    setShowUseModal(true);
  };

  const confirmUseItem = async () => {
    if (!selectedItem || !selectedItem.id || !user?.id) return;

    setIsProcessing(true);
    try {
      await InventoryService.useInventoryItem(selectedItem.id, user.id);

      if (selectedItem.effect?.xp) {
        success(`Used ${selectedItem.itemName}! XP boost applied.`);
      } else if (selectedItem.effect?.xp_multiplier) {
        success(`Activated ${selectedItem.itemName}! Boost is now active.`);
      } else {
        success(`Used ${selectedItem.itemName}!`);
      }

      setShowUseModal(false);
      setSelectedItem(null);
      await loadData();
      await refetch();
    } catch (err) {
      console.error('Error using item:', err);
      error('Failed to use item');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!user?.id || !confirm('Are you sure you want to delete this item?')) return;

    try {
      await InventoryService.deleteInventoryItem(itemId, user.id);
      success('Item deleted successfully');
      await loadData();
    } catch (err) {
      console.error('Error deleting item:', err);
      error('Failed to delete item');
    }
  };

  const handlePurchaseDailyDeal = async (deal: DailyDeal, itemInfo: any) => {
    if (!user?.id) return;

    const canAfford = (gameStats?.zenBalance || 0) >= deal.discountedPrice;
    if (!canAfford) {
      error('Insufficient Food balance!');
      return;
    }

    setIsProcessing(true);
    try {
      await GameService.purchaseShopItem(user.id, deal.itemId, itemInfo.type, deal.discountedPrice, itemInfo.effect);
      await InventoryService.addItemToInventory(
        user.id,
        deal.itemId,
        itemInfo.name,
        itemInfo.type,
        itemInfo.effect
      );
      success(`Purchased ${itemInfo.name} at discounted price!`);
      await loadData();
      await refetch();
    } catch (err) {
      console.error('Purchase error:', err);
      error('Purchase failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchaseRareItem = async (rareItem: RareItem) => {
    if (!user?.id) return;

    const canAfford = (gameStats?.zenBalance || 0) >= rareItem.price;
    if (!canAfford) {
      error('Insufficient Food balance!');
      return;
    }

    setIsProcessing(true);
    try {
      await GameService.purchaseShopItem(user.id, rareItem.itemId, 'special', rareItem.price, rareItem.effect);
      await InventoryService.purchaseRareItem(user.id, rareItem);
      success(`Purchased ${rareItem.name}!`);
      await loadData();
      await refetch();
    } catch (err) {
      console.error('Purchase error:', err);
      error('Purchase failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-500 to-orange-500';
      case 'epic': return 'from-purple-500 to-pink-500';
      case 'rare': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getTimeRemaining = (until: string) => {
    const now = new Date();
    const end = new Date(until);
    const diff = end.getTime() - now.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  const dealItems: Record<string, any> = {
    'xp_boost_small': { name: 'XP Treat', type: 'consumable', effect: { xp: 100 }, emoji: '✨' },
    'xp_boost_medium': { name: 'XP Snack Pack', type: 'consumable', effect: { xp: 500 }, emoji: '🌟' },
    'global_xp_boost': { name: 'XP Multiplier (24h)', type: 'boost', effect: { xp_multiplier: 2, duration: 86400 }, emoji: '⚡' }
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
              Inventory & Shop
            </h1>
            <p className="text-white text-lg font-inter font-semibold">
              Manage your items and discover special deals
            </p>
            <div className="flex items-center justify-center gap-2 text-white font-inter font-bold text-xl">
              <span>🍖</span>
              {gameStats?.zenBalance?.toLocaleString() || 0} Food
            </div>
          </div>

          <div className="cute-card p-6">
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => setSelectedTab('inventory')}
                className={`px-6 py-3 rounded-xl font-inter font-bold transition-all duration-200 flex items-center gap-2 ${
                  selectedTab === 'inventory'
                    ? 'bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white shadow-lg scale-105'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
              >
                <Package size={20} />
                My Inventory ({inventory.length})
              </button>
              <button
                onClick={() => setSelectedTab('deals')}
                className={`px-6 py-3 rounded-xl font-inter font-bold transition-all duration-200 flex items-center gap-2 ${
                  selectedTab === 'deals'
                    ? 'bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white shadow-lg scale-105'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
              >
                <Gift size={20} />
                Daily Deals ({dailyDeals.length})
              </button>
              <button
                onClick={() => setSelectedTab('rare')}
                className={`px-6 py-3 rounded-xl font-inter font-bold transition-all duration-200 flex items-center gap-2 ${
                  selectedTab === 'rare'
                    ? 'bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white shadow-lg scale-105'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
              >
                <Sparkles size={20} />
                Rare Items ({rareItems.length})
              </button>
            </div>
          </div>

          {selectedTab === 'inventory' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventory.length === 0 ? (
                <div className="col-span-full cute-card p-12 text-center">
                  <Package size={64} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-inter font-bold text-gray-800 mb-2">
                    Your inventory is empty
                  </h3>
                  <p className="text-gray-600 font-inter">
                    Purchase items from the shop to see them here
                  </p>
                </div>
              ) : (
                inventory.map((item) => (
                  <div key={item.id} className="cute-card overflow-hidden">
                    <div className={`p-6 bg-gradient-to-br ${
                      item.itemType === 'consumable' ? 'from-yellow-400 to-orange-500' :
                      item.itemType === 'boost' ? 'from-purple-500 to-pink-500' :
                      'from-indigo-500 to-purple-600'
                    }`}>
                      <div className="text-center">
                        <div className="text-6xl mb-4">{item.metadata?.emoji || '📦'}</div>
                        <h3 className="text-xl font-inter font-bold text-white mb-2">
                          {item.itemName}
                        </h3>
                        {item.quantity > 1 && (
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block">
                            <span className="text-white font-inter font-bold">x{item.quantity}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUseItem(item)}
                          className="flex-1 bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:from-[#ea580c] hover:to-[#f97316] text-white px-4 py-3 rounded-lg font-inter font-bold"
                          disabled={isProcessing}
                        >
                          <Zap size={18} className="inline mr-2" />
                          Use Item
                        </Button>
                        {item.id && (
                          <Button
                            onClick={() => handleDeleteItem(item.id!)}
                            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg"
                            disabled={isProcessing}
                          >
                            <Trash2 size={18} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {selectedTab === 'deals' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dailyDeals.length === 0 ? (
                <div className="col-span-full cute-card p-12 text-center">
                  <Gift size={64} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-inter font-bold text-gray-800 mb-2">
                    No deals available right now
                  </h3>
                  <p className="text-gray-600 font-inter">
                    Check back later for special discounted items
                  </p>
                </div>
              ) : (
                dailyDeals.map((deal) => {
                  const itemInfo = dealItems[deal.itemId];
                  if (!itemInfo) return null;

                  return (
                    <div key={deal.id} className="cute-card overflow-hidden relative">
                      <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full font-inter font-bold text-sm z-10">
                        -{deal.discountPercentage}%
                      </div>
                      <div className="p-6 bg-gradient-to-br from-green-400 to-emerald-500">
                        <div className="text-center">
                          <div className="text-6xl mb-4">{itemInfo.emoji}</div>
                          <h3 className="text-xl font-inter font-bold text-white mb-2">
                            {itemInfo.name}
                          </h3>
                          <div className="flex items-center justify-center gap-2 text-white font-inter">
                            <Clock size={16} />
                            <span className="text-sm">{getTimeRemaining(deal.availableUntil)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 line-through font-inter">
                            🍖 {deal.originalPrice}
                          </span>
                          <span className="text-2xl font-bold text-green-600 font-inter">
                            🍖 {deal.discountedPrice}
                          </span>
                        </div>

                        <Button
                          onClick={() => handlePurchaseDailyDeal(deal, itemInfo)}
                          disabled={isProcessing || (gameStats?.zenBalance || 0) < deal.discountedPrice}
                          className={`w-full ${
                            (gameStats?.zenBalance || 0) >= deal.discountedPrice
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                              : 'bg-gray-600 cursor-not-allowed text-gray-300'
                          } px-4 py-3 rounded-lg font-inter font-bold`}
                        >
                          {(gameStats?.zenBalance || 0) >= deal.discountedPrice ? 'Buy Deal' : 'Insufficient Balance'}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {selectedTab === 'rare' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rareItems.map((item) => (
                <div key={item.id} className="cute-card overflow-hidden">
                  <div className={`p-6 bg-gradient-to-br ${getRarityColor(item.rarity)}`}>
                    <div className="text-center">
                      <div className="text-6xl mb-4">{item.emoji}</div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block mb-2">
                        <span className="text-white font-inter font-bold uppercase text-xs">
                          {item.rarity}
                        </span>
                      </div>
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
                        🍖 {item.price.toLocaleString()}
                      </span>
                    </div>

                    <Button
                      onClick={() => handlePurchaseRareItem(item)}
                      disabled={isProcessing || (gameStats?.zenBalance || 0) < item.price}
                      className={`w-full ${
                        (gameStats?.zenBalance || 0) >= item.price
                          ? 'bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:from-[#ea580c] hover:to-[#f97316] text-white'
                          : 'bg-gray-600 cursor-not-allowed text-gray-300'
                      } px-4 py-3 rounded-lg font-inter font-bold flex items-center justify-center gap-2`}
                    >
                      <Star size={20} />
                      {(gameStats?.zenBalance || 0) >= item.price ? 'Purchase' : 'Insufficient Balance'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showUseModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-start md:items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-purple-500 rounded-2xl max-w-md w-full shadow-2xl my-4 md:my-0 mb-24 md:mb-0">
            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">{selectedItem.metadata?.emoji || '📦'}</div>
                <h2 className="text-2xl font-inter font-bold text-white mb-2">
                  Use {selectedItem.itemName}?
                </h2>
                <p className="text-white/90 font-inter">
                  This item will be consumed and cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowUseModal(false);
                    setSelectedItem(null);
                  }}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-inter font-bold border border-white/30"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmUseItem}
                  className="flex-1 bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:from-[#ea580c] hover:to-[#f97316] text-white px-6 py-3 rounded-xl font-inter font-bold shadow-lg"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Using...' : 'Use Item'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
