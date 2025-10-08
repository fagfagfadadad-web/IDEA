import React, { useState } from 'react';
import { Button } from './Button';
import { useToast } from '../context/ToastContext';
import { Save, AlertTriangle, Award, Clock, DollarSign, Zap, Trophy, Gift } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { success, error } = useToast();

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

  const handleSaveGameSettings = () => {
    success('Game settings saved successfully!');
  };

  const handleSaveBoostSettings = () => {
    success('Boost settings saved successfully!');
  };

  const handleSaveUpgradeSettings = () => {
    success('Upgrade settings saved successfully!');
  };

  const handleSaveShopSettings = () => {
    success('Shop settings saved successfully!');
  };

  const handleSaveGameRewards = () => {
    success('Game rewards saved successfully!');
  };

  const handleToggleMaintenance = () => {
    setMaintenanceMode(prev => ({ ...prev, enabled: !prev.enabled }));
    success(maintenanceMode.enabled ? 'Maintenance mode disabled' : 'Maintenance mode enabled');
  };

  return (
    <div className="space-y-6">
      {/* Maintenance Mode */}
      <div className="cute-card p-6 border-2 border-red-400">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-red-500" size={24} />
          <h3 className="text-xl font-bold text-gray-800 font-inter">Maintenance Mode</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-gray-100 p-4 rounded-lg">
            <div>
              <div className="font-bold text-gray-800 font-inter">System Status</div>
              <div className="text-sm text-gray-600 font-inter">
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
          <div>
            <label className="block text-gray-700 font-bold mb-2 font-inter">Maintenance Message</label>
            <textarea
              value={maintenanceMode.message}
              onChange={(e) => setMaintenanceMode({ ...maintenanceMode, message: e.target.value })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-inter"
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
      <div className="bg-blue-100 border-2 border-blue-400 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 text-2xl">ℹ️</div>
          <div>
            <div className="font-bold text-blue-800 font-inter mb-1">Important Note</div>
            <div className="text-blue-700 text-sm font-inter">
              Settings are currently stored locally. Changes will apply immediately but may not persist across sessions.
              To make these settings permanent, they need to be stored in the database and integrated with the game logic.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
