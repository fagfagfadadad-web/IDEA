import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { useToast } from '../context/ToastContext';
import { Save, AlertTriangle, Award, Clock, DollarSign, Zap, Trophy, Gift, Download, MessageSquare, Trash2, Ban, Loader as LoaderIcon } from 'lucide-react';
import { UserService } from '../services/userService';
import { ChatService } from '../services/chatService';
import { SettingsService } from '../services/settingsService';

export const AdminSettings: React.FC = () => {
  const { success, error } = useToast();
  const [recentChatMessages, setRecentChatMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [gameSettings, setGameSettings] = useState({
    startingBalance: 1000,
    startingTickets: 5,
    dailyFreeTickets: 5,
    ticketsPerLevel: 2,
    ticketsPerTask: 1,
    miningCooldown: 1,
    energyRegenRate: 5,
    referralBonus: 100,
    referralPercentage: 10
  });

  const [boostSettings, setBoostSettings] = useState({
    foodBoostCost: 50,
    foodBoostMultiplier: 2,
    foodBoostDuration: 3600,
    expBoostCost: 40,
    expBoostMultiplier: 2,
    expBoostDuration: 3600
  });

  const [upgradeSettings, setUpgradeSettings] = useState({
    autoFeederCost: 500,
    happinessBoosterCost: 800,
    happinessBoosterMultiplier: 1.5,
    miningPowerBaseCost: 100,
    energyCapacityBaseCost: 80,
    efficiencyBaseCost: 150,
    upgradeCostMultiplier: 1.5
  });

  const [shopSettings, setShopSettings] = useState({
    smallTreatCost: 10,
    smallTreatEnergy: 50,
    largeTreatCost: 25,
    largeTreatEnergy: 150
  });

  const [gameRewards, setGameRewards] = useState({
    pupFiCatcherBonePoints: 5,
    pupFiCatcherMeatPoints: 15,
    pupFiCatcherBombPenalty: 15,
    memoryMatchBaseReward: 50,
    puzzleBaseReward: 75,
    racingBaseReward: 100
  });

  const [maintenanceMode, setMaintenanceMode] = useState({
    enabled: false,
    message: 'System is under maintenance. Please check back soon!'
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await SettingsService.getSettings();
      setGameSettings(settings.gameSettings);
      setBoostSettings(settings.boostSettings);
      setUpgradeSettings(settings.upgradeSettings);
      setShopSettings(settings.shopSettings);
      setGameRewards(settings.gameRewards);
      setMaintenanceMode(settings.maintenanceMode);
    } catch (err) {
      console.error('Failed to load settings:', err);
      error('Failed to load settings from database');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGameSettings = async () => {
    try {
      await SettingsService.updateGameSettings(gameSettings);
      success('Game settings saved successfully!');
    } catch (err) {
      error('Failed to save game settings');
      console.error(err);
    }
  };

  const handleSaveBoostSettings = async () => {
    try {
      await SettingsService.updateBoostSettings(boostSettings);
      success('Boost settings saved successfully!');
    } catch (err) {
      error('Failed to save boost settings');
      console.error(err);
    }
  };

  const handleSaveUpgradeSettings = async () => {
    try {
      await SettingsService.updateUpgradeSettings(upgradeSettings);
      success('Upgrade settings saved successfully!');
    } catch (err) {
      error('Failed to save upgrade settings');
      console.error(err);
    }
  };

  const handleSaveShopSettings = async () => {
    try {
      await SettingsService.updateShopSettings(shopSettings);
      success('Shop settings saved successfully!');
    } catch (err) {
      error('Failed to save shop settings');
      console.error(err);
    }
  };

  const handleSaveGameRewards = async () => {
    try {
      await SettingsService.updateGameRewards(gameRewards);
      success('Game rewards saved successfully!');
    } catch (err) {
      error('Failed to save game rewards');
      console.error(err);
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      const newMode = { ...maintenanceMode, enabled: !maintenanceMode.enabled };
      await SettingsService.updateMaintenanceMode(newMode);
      setMaintenanceMode(newMode);
      success(newMode.enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled');
    } catch (err) {
      error('Failed to update maintenance mode');
      console.error(err);
    }
  };

  const handleExportWallets = async () => {
    try {
      const users = await UserService.getUsersWithWallets();

      const csvContent = [
        '\uFEFF"Username","Wallet Address","User ID"',
        ...users.map(u => `"${u.username}","${u.walletAddress}","${u.userId}"`)
      ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `airdrop-wallets-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      success(`Exported ${users.length} wallet addresses for airdrop!`);
    } catch (err) {
      error('Failed to export wallet addresses');
      console.error(err);
    }
  };

  const loadRecentMessages = async () => {
    try {
      const messages = await ChatService.getRecentMessages(20);
      setRecentChatMessages(messages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    loadSettings();
    loadRecentMessages();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoaderIcon className="animate-spin text-primary-500" size={48} />
      </div>
    );
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Delete this message?')) return;

    try {
      await ChatService.deleteMessage(messageId);
      success('Message deleted successfully!');
      loadRecentMessages();
    } catch (err) {
      error('Failed to delete message');
      console.error(err);
    }
  };

  const handleClearAllMessages = async () => {
    if (!window.confirm('Are you sure you want to clear ALL chat messages? This cannot be undone!')) return;

    try {
      await ChatService.clearAllMessages();
      success('All chat messages cleared!');
      setRecentChatMessages([]);
    } catch (err) {
      error('Failed to clear messages');
      console.error(err);
    }
  };

  const handleBanUser = async (userId: string, username: string) => {
    const duration = prompt(`Ban user "${username}" from chat for how many minutes? (Default: 60)`, '60');
    if (!duration) return;

    try {
      await ChatService.banUserFromChat(userId, parseInt(duration));
      success(`User "${username}" banned from chat for ${duration} minutes!`);
    } catch (err) {
      error('Failed to ban user');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Airdrop Export */}
      <div className="cute-card p-6 border-2 border-blue-400">
        <div className="flex items-center gap-3 mb-4">
          <Download className="text-blue-500" size={24} />
          <h3 className="text-xl font-bold text-gray-800 font-inter">Airdrop Export</h3>
        </div>
        <div className="space-y-4">
          <p className="text-gray-700 font-inter">
            Export all user wallet addresses for airdrop distribution. The CSV file will include username, wallet address, and user ID.
          </p>
          <Button
            onClick={handleExportWallets}
            className="cute-button px-6 py-3"
          >
            <Download size={16} />
            Export Wallet Addresses (CSV)
          </Button>
        </div>
      </div>

      {/* Chat Moderation */}
      <div className="cute-card p-6 border-2 border-orange-400">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="text-orange-500" size={24} />
          <h3 className="text-xl font-bold text-gray-800 font-inter">Chat Moderation</h3>
        </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={handleClearAllMessages}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold"
            >
              <Trash2 size={16} />
              Clear All Messages
            </Button>
            <Button
              onClick={loadRecentMessages}
              className="cute-button px-4 py-2"
            >
              Refresh Messages
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto bg-gradient-to-b from-orange-100 to-yellow-100 p-4 rounded-lg border-2 border-orange-400">
            {recentChatMessages.length === 0 ? (
              <div className="text-center text-gray-900 py-8 font-inter font-bold text-lg">No messages to display</div>
            ) : (
              recentChatMessages.map((msg) => (
                <div key={msg.id} className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-gray-900 font-inter text-base">{msg.username}</span>
                      <span className="text-xs text-gray-600 ml-2 font-inter font-semibold">
                        {msg.createdAt?.toDate?.()?.toLocaleString() || 'Just now'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBanUser(msg.userId, msg.username)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 text-xs rounded-lg font-bold shadow-md transition-all flex items-center gap-1"
                      >
                        <Ban size={14} />
                        Ban
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 text-xs rounded-lg font-bold shadow-md transition-all flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-900 font-inter text-base font-semibold bg-gradient-to-r from-orange-100 to-yellow-100 p-3 rounded-lg border-2 border-orange-300">{msg.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="cute-card p-6 border-2 border-red-400">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-red-500" size={24} />
          <h3 className="text-xl font-bold text-gray-800 font-inter">Maintenance Mode</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-gradient-to-r from-red-100 to-orange-100 p-4 rounded-lg border-2 border-red-300">
            <div>
              <div className="font-bold text-gray-900 font-inter text-lg">System Status</div>
              <div className="text-base text-gray-800 font-inter font-semibold">
                {maintenanceMode.enabled ? 'Maintenance Active' : 'System Operational'}
              </div>
            </div>
            <Button
              onClick={handleToggleMaintenance}
              className={`px-6 py-3 rounded-lg font-bold ${
                maintenanceMode.enabled
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {maintenanceMode.enabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
          <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border-2 border-red-200">
            <label className="block text-gray-900 font-bold mb-2 font-inter text-base">Maintenance Message</label>
            <textarea
              value={maintenanceMode.message}
              onChange={(e) => setMaintenanceMode({ ...maintenanceMode, message: e.target.value })}
              className="w-full p-3 border-2 border-red-300 rounded-lg font-inter text-gray-900 bg-white"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Game Settings */}
      <div className="cute-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="text-primary-500" size={24} />
          <h3 className="text-xl font-bold text-gray-800 font-inter">Game Economy Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Starting Balance (Food)</label>
            <input
              type="number"
              value={gameSettings.startingBalance}
              onChange={(e) => setGameSettings({ ...gameSettings, startingBalance: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Starting Tickets</label>
            <input
              type="number"
              value={gameSettings.startingTickets}
              onChange={(e) => setGameSettings({ ...gameSettings, startingTickets: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Daily Free Tickets</label>
            <input
              type="number"
              value={gameSettings.dailyFreeTickets}
              onChange={(e) => setGameSettings({ ...gameSettings, dailyFreeTickets: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Tickets Per Level Up</label>
            <input
              type="number"
              value={gameSettings.ticketsPerLevel}
              onChange={(e) => setGameSettings({ ...gameSettings, ticketsPerLevel: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Tickets Per Task</label>
            <input
              type="number"
              value={gameSettings.ticketsPerTask}
              onChange={(e) => setGameSettings({ ...gameSettings, ticketsPerTask: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Mining Cooldown (minutes)</label>
            <input
              type="number"
              value={gameSettings.miningCooldown}
              onChange={(e) => setGameSettings({ ...gameSettings, miningCooldown: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Energy Regen Rate (minutes per 1 energy)</label>
            <input
              type="number"
              value={gameSettings.energyRegenRate}
              onChange={(e) => setGameSettings({ ...gameSettings, energyRegenRate: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Referral Bonus (Food)</label>
            <input
              type="number"
              value={gameSettings.referralBonus}
              onChange={(e) => setGameSettings({ ...gameSettings, referralBonus: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Referral Earning % (from mining)</label>
            <input
              type="number"
              value={gameSettings.referralPercentage}
              onChange={(e) => setGameSettings({ ...gameSettings, referralPercentage: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleSaveGameSettings} className="cute-button px-6 py-3">
            <Save size={16} />
            Save Game Settings
          </Button>
        </div>
      </div>

      {/* Boost Settings */}
      <div className="cute-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="text-yellow-500" size={24} />
          <h3 className="text-xl font-bold text-gray-800 font-inter">Boost Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Food Boost Cost</label>
            <input
              type="number"
              value={boostSettings.foodBoostCost}
              onChange={(e) => setBoostSettings({ ...boostSettings, foodBoostCost: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Food Boost Multiplier</label>
            <input
              type="number"
              step="0.1"
              value={boostSettings.foodBoostMultiplier}
              onChange={(e) => setBoostSettings({ ...boostSettings, foodBoostMultiplier: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Food Boost Duration (seconds)</label>
            <input
              type="number"
              value={boostSettings.foodBoostDuration}
              onChange={(e) => setBoostSettings({ ...boostSettings, foodBoostDuration: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Experience Boost Cost</label>
            <input
              type="number"
              value={boostSettings.expBoostCost}
              onChange={(e) => setBoostSettings({ ...boostSettings, expBoostCost: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Experience Boost Multiplier</label>
            <input
              type="number"
              step="0.1"
              value={boostSettings.expBoostMultiplier}
              onChange={(e) => setBoostSettings({ ...boostSettings, expBoostMultiplier: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Experience Boost Duration (seconds)</label>
            <input
              type="number"
              value={boostSettings.expBoostDuration}
              onChange={(e) => setBoostSettings({ ...boostSettings, expBoostDuration: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleSaveBoostSettings} className="cute-button px-6 py-3">
            <Save size={16} />
            Save Boost Settings
          </Button>
        </div>
      </div>

      {/* Upgrade Settings */}
      <div className="cute-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Award className="text-purple-500" size={24} />
          <h3 className="text-xl font-bold text-gray-800 font-inter">Upgrade Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Auto Feeder Cost</label>
            <input
              type="number"
              value={upgradeSettings.autoFeederCost}
              onChange={(e) => setUpgradeSettings({ ...upgradeSettings, autoFeederCost: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Happiness Booster Cost</label>
            <input
              type="number"
              value={upgradeSettings.happinessBoosterCost}
              onChange={(e) => setUpgradeSettings({ ...upgradeSettings, happinessBoosterCost: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Happiness Booster Multiplier</label>
            <input
              type="number"
              step="0.1"
              value={upgradeSettings.happinessBoosterMultiplier}
              onChange={(e) => setUpgradeSettings({ ...upgradeSettings, happinessBoosterMultiplier: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Mining Power Base Cost</label>
            <input
              type="number"
              value={upgradeSettings.miningPowerBaseCost}
              onChange={(e) => setUpgradeSettings({ ...upgradeSettings, miningPowerBaseCost: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Energy Capacity Base Cost</label>
            <input
              type="number"
              value={upgradeSettings.energyCapacityBaseCost}
              onChange={(e) => setUpgradeSettings({ ...upgradeSettings, energyCapacityBaseCost: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Efficiency Base Cost</label>
            <input
              type="number"
              value={upgradeSettings.efficiencyBaseCost}
              onChange={(e) => setUpgradeSettings({ ...upgradeSettings, efficiencyBaseCost: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Upgrade Cost Multiplier</label>
            <input
              type="number"
              step="0.1"
              value={upgradeSettings.upgradeCostMultiplier}
              onChange={(e) => setUpgradeSettings({ ...upgradeSettings, upgradeCostMultiplier: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleSaveUpgradeSettings} className="cute-button px-6 py-3">
            <Save size={16} />
            Save Upgrade Settings
          </Button>
        </div>
      </div>

      {/* Shop Settings */}
      <div className="cute-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="text-green-500" size={24} />
          <h3 className="text-xl font-bold text-gray-800 font-inter">Shop Item Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Small Treat Cost</label>
            <input
              type="number"
              value={shopSettings.smallTreatCost}
              onChange={(e) => setShopSettings({ ...shopSettings, smallTreatCost: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Small Treat Energy Restore</label>
            <input
              type="number"
              value={shopSettings.smallTreatEnergy}
              onChange={(e) => setShopSettings({ ...shopSettings, smallTreatEnergy: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Large Treat Cost</label>
            <input
              type="number"
              value={shopSettings.largeTreatCost}
              onChange={(e) => setShopSettings({ ...shopSettings, largeTreatCost: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Large Treat Energy Restore</label>
            <input
              type="number"
              value={shopSettings.largeTreatEnergy}
              onChange={(e) => setShopSettings({ ...shopSettings, largeTreatEnergy: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleSaveShopSettings} className="cute-button px-6 py-3">
            <Save size={16} />
            Save Shop Settings
          </Button>
        </div>
      </div>

      {/* Game Rewards */}
      <div className="cute-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="text-orange-500" size={24} />
          <h3 className="text-xl font-bold text-gray-800 font-inter">Game Reward Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">PupFi Catcher - Bone Points</label>
            <input
              type="number"
              value={gameRewards.pupFiCatcherBonePoints}
              onChange={(e) => setGameRewards({ ...gameRewards, pupFiCatcherBonePoints: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">PupFi Catcher - Meat Points</label>
            <input
              type="number"
              value={gameRewards.pupFiCatcherMeatPoints}
              onChange={(e) => setGameRewards({ ...gameRewards, pupFiCatcherMeatPoints: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">PupFi Catcher - Bomb Penalty</label>
            <input
              type="number"
              value={gameRewards.pupFiCatcherBombPenalty}
              onChange={(e) => setGameRewards({ ...gameRewards, pupFiCatcherBombPenalty: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Memory Match - Base Reward</label>
            <input
              type="number"
              value={gameRewards.memoryMatchBaseReward}
              onChange={(e) => setGameRewards({ ...gameRewards, memoryMatchBaseReward: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Puzzle - Base Reward</label>
            <input
              type="number"
              value={gameRewards.puzzleBaseReward}
              onChange={(e) => setGameRewards({ ...gameRewards, puzzleBaseReward: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Racing - Base Reward</label>
            <input
              type="number"
              value={gameRewards.racingBaseReward}
              onChange={(e) => setGameRewards({ ...gameRewards, racingBaseReward: Number(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleSaveGameRewards} className="cute-button px-6 py-3">
            <Save size={16} />
            Save Game Rewards
          </Button>
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-green-100 border-2 border-green-400 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-green-500 text-2xl">✅</div>
          <div>
            <div className="font-bold text-green-800 font-inter mb-1">Settings Active</div>
            <div className="text-green-700 text-sm font-inter">
              All settings are now stored in the Firebase database and persist across sessions.
              Changes you make here will be automatically applied throughout the application and accessible via the Settings API.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
