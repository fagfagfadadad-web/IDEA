import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { GameService, GameStats, Ship } from '../services/gameService';
import { useToast } from './ToastContext';

interface GameContextType {
  gameStats: GameStats | null;
  ships: Ship[];
  isLoading: boolean;
  error: string | null;
  mineZen: (shipId: string) => Promise<void>;
  upgradeShip: (shipId: string, upgradeType: string) => Promise<void>;
  buyShip: (shipType: string) => Promise<void>;
  refetch: () => Promise<void>;
  isMining: boolean;
}

const GameContext = createContext<GameContextType>({
  gameStats: null,
  ships: [],
  isLoading: true,
  error: null,
  mineZen: async () => {},
  upgradeShip: async () => {},
  buyShip: async () => {},
  refetch: async () => {},
  isMining: false,
});

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { success, error: showError } = useToast();
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [ships, setShips] = useState<Ship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMining, setIsMining] = useState(false);
  const miningInterval = useRef<NodeJS.Timeout | null>(null);
  const dataCache = useRef<{ gameStats: GameStats | null; ships: Ship[] }>({ gameStats: null, ships: [] });

  useEffect(() => {
    console.log('🎮 GameContext: useEffect triggered with:', {
      userId: user?.id,
      isAuthenticated,
      authLoading,
      isProfileReady: user?.isProfileReady,
      hasGameStats: !!gameStats
    });

    // Wait for auth to complete
    if (authLoading) {
      console.log('🎮 GameContext: Auth loading, waiting...');
      return;
    }

    // User logged out - clear data
    if (!user?.id || !isAuthenticated) {
      console.log('🎮 GameContext: User logged out, clearing data');
      if (gameStats || ships.length > 0) {
        setGameStats(null);
        setShips([]);
        dataCache.current = { gameStats: null, ships: [] };
        stopMiningLoop();
      }
      setIsLoading(false);
      return;
    }

    // User authenticated but profile not ready
    if (!user?.isProfileReady) {
      console.log('🎮 GameContext: Profile not ready yet, waiting...');
      return;
    }

    // User authenticated with ready profile - fetch data if needed
    if (!gameStats) {
      console.log('🎮 GameContext: Fetching game data for:', user.id);
      fetchGameData();
    }

    // Start mining loop (restart when gameStats or ships change)
    startMiningLoop();

    return () => {
      stopMiningLoop();
    };
  }, [user?.id, isAuthenticated, authLoading, user?.isProfileReady, gameStats, ships]);

  const startMiningLoop = () => {
    if (miningInterval.current) {
      clearInterval(miningInterval.current);
    }

    miningInterval.current = setInterval(() => {
      if (isAuthenticated && user?.id) {
        updateEnergyRegeneration();
        checkOfflineMining();
        autoFeedDogs(); // Auto-feed dogs if auto-feeder is active
      }
    }, 30000); // Update every 30 seconds
  };

  const stopMiningLoop = () => {
    if (miningInterval.current) {
      clearInterval(miningInterval.current);
      miningInterval.current = null;
    }
  };

  const checkOfflineMining = async () => {
    if (!user?.id) return;

    try {
      const offlineRewards = await GameService.claimOfflineMining(user.id);
      if (offlineRewards.foodCollected > 0) {
        const hours = Math.floor(offlineRewards.timeElapsed / 3600);
        const minutes = Math.floor((offlineRewards.timeElapsed % 3600) / 60);
        success(`Auto-Feeder collected ${offlineRewards.foodCollected} food! (${hours}h ${minutes}m)`);

        // Refresh data to show updated balance
        const updatedStats = await GameService.getGameStats(user.id);
        if (updatedStats) {
          const mappedStats = {
            ...updatedStats,
            zen_balance: updatedStats.zenBalance || 0,
            total_mined: updatedStats.totalMined || 0,
            mining_level: updatedStats.miningLevel || 1,
            zenBalance: updatedStats.zenBalance || 0,
            totalMined: updatedStats.totalMined || 0,
            miningLevel: updatedStats.miningLevel || 1
          };
          setGameStats(mappedStats);
          dataCache.current.gameStats = mappedStats;
        }

        // Refresh ships to update lastMining timestamps
        const userShips = await GameService.getUserShips(user.id);
        const mappedShips = userShips.map(ship => ({
          ...ship,
          current_energy: ship.currentEnergy || ship.energyCapacity || 100,
          energy_capacity: ship.energyCapacity || 100,
          mining_power: ship.miningPower || 10,
          last_mining: ship.lastMining || new Date(),
          ship_type: ship.shipType || 'basic'
        }));
        setShips(mappedShips);
        dataCache.current.ships = mappedShips;
      }
    } catch (error) {
      console.log('ℹ️ GameContext: No offline mining available');
    }
  };

  const autoFeedDogs = async () => {
    if (!user?.id || !gameStats) {
      console.log('🚫 Auto-Feeder: Missing user or gameStats', { hasUser: !!user?.id, hasGameStats: !!gameStats });
      return;
    }

    try {
      // Check if auto-feeder boost is active (24-hour boost from shop)
      const now = new Date();
      const autoFeederBoost = gameStats.activeBoosts?.find(boost => {
        if (boost.type !== 'autoFeeder') return false;
        const expiresAt = boost.expiresAt?.toDate?.() || new Date(boost.expiresAt);
        return expiresAt > now;
      });

      if (!autoFeederBoost) {
        console.log('🚫 Auto-Feeder: Not active or expired');
        return;
      }

      console.log('🤖 Auto-Feeder v4.1.1: Active! Checking dogs for automatic feeding...');
      console.log('✨ Auto-Feeder Fix: Now properly refreshes both stats AND ship data after feeding!');

      // Check each dog if ready to feed
      for (const ship of ships) {
        if (!ship.id) continue;

        const lastFeeding = ship.lastMining?.toDate?.() || new Date(ship.lastMining || new Date());
        const timeDiff = now.getTime() - lastFeeding.getTime();
        const minutesPassed = Math.floor(timeDiff / (1000 * 60));
        const secondsPassed = Math.floor(timeDiff / 1000);

        // Check if cooldown passed (60 seconds) and dog can be fed (has energy to consume)
        const cooldownPassed = secondsPassed >= 60;
        const hasHunger = (ship.currentEnergy || 0) >= 10;
        const canFeed = cooldownPassed && hasHunger;

        if (canFeed && !isMining) {
          console.log(`🤖 Auto-Feeder: Automatically feeding ${ship.name}`, {
            lastFeeding: lastFeeding.toISOString(),
            secondsPassed,
            currentEnergy: ship.currentEnergy,
            canFeed
          });

          // Perform feeding without showing toast
          try {
            const result = await GameService.performMining(user.id, ship.id);
            console.log(`✅ Auto-Feeder: Fed ${ship.name}, earned ${result.zenMined} food`);

            // Refresh both stats AND ships data
            const [updatedStats, updatedShips] = await Promise.all([
              GameService.getGameStats(user.id),
              GameService.getUserShips(user.id)
            ]);

            if (updatedStats) {
              const mappedStats = {
                ...updatedStats,
                zen_balance: updatedStats.zenBalance || 0,
                total_mined: updatedStats.totalMined || 0,
                mining_level: updatedStats.miningLevel || 1,
                zenBalance: updatedStats.zenBalance || 0,
                totalMined: updatedStats.totalMined || 0,
                miningLevel: updatedStats.miningLevel || 1
              };
              setGameStats(mappedStats);
              dataCache.current.gameStats = mappedStats;
            }

            if (updatedShips) {
              const mappedShips = updatedShips.map(s => ({
                ...s,
                current_energy: s.currentEnergy || s.energyCapacity || 100,
                energy_capacity: s.energyCapacity || 100,
                mining_power: s.miningPower || 10,
                last_mining: s.lastMining || new Date(),
                ship_type: s.shipType || 'basic'
              }));
              setShips(mappedShips);
              dataCache.current.ships = mappedShips;
              console.log(`🔄 Auto-Feeder: Updated ship data for ${ship.name}, new energy:`, mappedShips.find(s => s.id === ship.id)?.currentEnergy);
            }
          } catch (error) {
            console.error(`❌ Auto-Feeder: Failed to feed ${ship.name}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error in auto-feed:', error);
    }
  };

  const updateEnergyRegeneration = async () => {
    try {
      // Get Happiness Booster multiplier (1.5x if purchased, 1x otherwise)
      const happinessBooster = gameStats?.permanentUpgrades?.happinessBooster || 1;

      // Regenerate energy for ships
      const updatedShips = ships.map(ship => {
        const lastMining = ship.lastMining?.toDate?.() || new Date(ship.lastMining || new Date());
        const now = new Date();
        const timeDiff = now.getTime() - lastMining.getTime();
        const minutesPassed = Math.floor(timeDiff / (1000 * 60));

        if (minutesPassed > 0 && ship.currentEnergy < ship.energyCapacity) {
          // Base: 1 energy per 5 minutes
          // With Happiness Booster (1.5x): 1.5 energy per 5 minutes = 1 energy per 3.33 minutes
          const baseEnergyPerMinute = 1 / 5;
          const boostedEnergyPerMinute = baseEnergyPerMinute * happinessBooster;
          const energyToAdd = Math.min(
            ship.energyCapacity - ship.currentEnergy,
            Math.floor(minutesPassed * boostedEnergyPerMinute)
          );

          if (energyToAdd > 0) {
            const newEnergy = ship.currentEnergy + energyToAdd;
            GameService.updateShip(ship.id!, { currentEnergy: newEnergy });
            console.log(`⚡ Happiness Booster: Regenerated ${energyToAdd} energy (${happinessBooster}x boost) for ${ship.name}`);
            return { ...ship, currentEnergy: newEnergy };
          }
        }

        return ship;
      });

      setShips(updatedShips);
    } catch (error) {
      console.error('Error updating energy:', error);
    }
  };

  const fetchGameData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.id) return;

      console.log('🔄 GameContext: Fetching game data for user:', user.id);

      // Use cached data while loading new data
      if (dataCache.current.gameStats && dataCache.current.ships.length > 0) {
        console.log('📦 GameContext: Using cached data while fetching...');
        setGameStats(dataCache.current.gameStats);
        setShips(dataCache.current.ships);
      }

      // Fetch or create game stats
      let stats = await GameService.getGameStats(user.id);
      if (!stats) {
        console.log('🆕 GameContext: Creating new game stats...');
        stats = await GameService.createGameStats(user.id);
        await GameService.createStarterShip(user.id);
        console.log('✅ GameContext: Game stats and starter dog created');
      }

      // Claim offline mining if auto-feeder is active
      if (stats) {
        try {
          const offlineRewards = await GameService.claimOfflineMining(user.id);
          if (offlineRewards.foodCollected > 0) {
            const hours = Math.floor(offlineRewards.timeElapsed / 3600);
            const minutes = Math.floor((offlineRewards.timeElapsed % 3600) / 60);
            success(`Auto-Feeder collected ${offlineRewards.foodCollected} food while you were away! (${hours}h ${minutes}m)`);
            // Refresh stats to get updated balance
            stats = await GameService.getGameStats(user.id);
          }
        } catch (err) {
          console.log('ℹ️ GameContext: No offline mining to claim');
        }
      }

      // Map field names to match component expectations
      if (stats) {
        const mappedStats = {
          ...stats,
          zen_balance: stats.zenBalance || 0,
          total_mined: stats.totalMined || 0,
          mining_level: stats.miningLevel || 1,
          // Keep both naming conventions for compatibility
          zenBalance: stats.zenBalance || 0,
          totalMined: stats.totalMined || 0,
          miningLevel: stats.miningLevel || 1
        };

        setGameStats(mappedStats);
        dataCache.current.gameStats = mappedStats;
        console.log('📊 GameContext: Game stats loaded:', stats);
        console.log('🗺️ GameContext: Mapped stats:', mappedStats);
      }

      // Fetch ships
      const userShips = await GameService.getUserShips(user.id);
      
      // Map ship field names to match component expectations
      const mappedShips = userShips.map(ship => ({
        ...ship,
        current_energy: ship.currentEnergy || ship.energyCapacity || 100,
        energy_capacity: ship.energyCapacity || 100,
        mining_power: ship.miningPower || 10,
        last_mining: ship.lastMining || new Date(),
        ship_type: ship.shipType || 'basic'
      }));
      
      setShips(mappedShips);
      dataCache.current.ships = mappedShips;
      console.log('🚀 GameContext: Ships loaded:', userShips.length, 'Raw ships:', userShips);
      console.log('🗺️ GameContext: Mapped ships:', mappedShips.length, 'Mapped data:', mappedShips);

    } catch (err) {
      console.error('Error fetching game data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const mineZen = async (shipId: string) => {
    try {
      setIsMining(true);
      
      if (!user?.id) throw new Error('User not authenticated');
      
      const ship = ships.find(s => s.id === shipId);
      if (!ship) throw new Error('Ship not found');
      
     const currentEnergy = ship.currentEnergy || 0;
      if (currentEnergy < 10) {
        throw new Error('Ship has insufficient energy');
      }

      // Check cooldown
      const lastMining = ship.lastMining?.toDate?.() || new Date(ship.lastMining || new Date());
      const now = new Date();
      const timeDiff = now.getTime() - lastMining.getTime();
      const minutesPassed = Math.floor(timeDiff / (1000 * 60));

      if (minutesPassed < 1) {
        throw new Error('Must wait at least 1 minute between mining operations');
      }

      const result = await GameService.performMining(user.id, shipId);
      
      success(`Mined ${result.zenMined} Food!`);
      if (result.newLevel) {
        success(`Level up! You are now level ${result.newLevel}!`);
      }
      
      await fetchGameData();
    } catch (error: any) {
      console.error('Error mining Food:', error);
      showError(error.message || 'Failed to mine Food');
    } finally {
      setIsMining(false);
    }
  };

  const upgradeShip = async (shipId: string, upgradeType: string) => {
    try {
      if (!user?.id) throw new Error('User not authenticated');
      
      const ship = ships.find(s => s.id === shipId);
      if (!ship) throw new Error('Ship not found');

      // Calculate upgrade cost locally
      const currentLevel = ship.upgrades[upgradeType] || 0;
      // Normalize upgrade type for cost calculation
      const normalizedUpgradeType = upgradeType.replace(/_/g, '').toLowerCase();
      const baseCostMap: Record<string, number> = {
        'miningpower': 100,
        'energycapacity': 80,
        'efficiency': 150
      };
      const baseCost = baseCostMap[normalizedUpgradeType] || 100;
      const upgradeCost = Math.floor(baseCost * Math.pow(1.5, currentLevel));

      const currentBalance = Number(gameStats?.zenBalance || 0);

      console.log('💰 GameContext: Upgrade calculation:', {
        currentBalance,
        upgradeCost,
        upgradeType,
        currentLevel,
        baseCost,
        result: currentBalance - upgradeCost,
        gameStats: gameStats
      });

      if (currentBalance < upgradeCost) {
        throw new Error('Insufficient Food for upgrade');
      }

      // Apply upgrade
      const upgrades = { ...ship.upgrades };
      upgrades[upgradeType] = currentLevel + 1;

      let newStats = { ...ship };
      // Handle both snake_case and camelCase upgrade types
      switch (normalizedUpgradeType) {
        case 'miningpower':
          newStats.miningPower = (newStats.miningPower || 0) + 5;
          break;
        case 'energycapacity':
          newStats.energyCapacity = (newStats.energyCapacity || 0) + 20;
          break;
        case 'efficiency':
          // Efficiency reduces energy consumption - stored in upgrades
          break;
      }

      // Update ship
      await GameService.updateShip(shipId, {
        ...newStats,
        upgrades
      });

      // Deduct cost
      const newBalance = currentBalance - upgradeCost;
      console.log('💰 GameContext: New balance calculation:', {
        currentBalance,
        upgradeCost,
        newBalance
      });
      
      await GameService.updateGameStats(user.id, {
        zenBalance: newBalance
      });

      await fetchGameData();
      success('Ship upgraded successfully!');
    } catch (error: any) {
      console.error('Error upgrading ship:', error);
      showError(error.message || 'Failed to upgrade ship');
    }
  };

  const buyShip = async (shipType: string) => {
    try {
      if (!user?.id) throw new Error('User not authenticated');

      const shipConfig = GameService.getShipConfig(shipType);

      if (shipConfig.cost === 0) {
        throw new Error('Cannot purchase starter dog');
      }

      const currentBalance = Number(gameStats?.zenBalance || 0);

      console.log('🛒 GameContext: Ship purchase calculation:', {
        currentBalance,
        shipCost: shipConfig.cost,
        result: currentBalance - shipConfig.cost,
        gameStats: gameStats
      });

      if (currentBalance < shipConfig.cost) {
        throw new Error('Insufficient Food to buy dog');
      }

      // Deduct cost FIRST before creating ship
      const newBalance = currentBalance - shipConfig.cost;
      console.log('🛒 GameContext: Deducting cost first, new balance:', {
        currentBalance,
        shipCost: shipConfig.cost,
        newBalance
      });

      await GameService.updateGameStats(user.id, {
        zenBalance: newBalance
      });

      // Then create new ship
      await GameService.createShip({
        userId: user.id,
        name: shipConfig.name,
        level: 1,
        miningPower: shipConfig.miningPower,
        energyCapacity: shipConfig.energyCapacity,
        currentEnergy: shipConfig.energyCapacity,
        shipType,
        upgrades: {},
        lastMining: new Date(),
        createdAt: new Date()
      });

      success(`${shipConfig.name} adopted for ${shipConfig.cost.toLocaleString()} food! 🐕`);
      await fetchGameData();
    } catch (error: any) {
      console.error('Error buying ship:', error);
      showError(error.message || 'Failed to purchase dog');
    }
  };

  const refetch = fetchGameData;

  const value = {
    gameStats,
    ships,
    isLoading,
    error,
    mineZen,
    upgradeShip,
    buyShip,
    refetch,
    isMining
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};