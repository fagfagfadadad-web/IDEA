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
      userObject: user
    });
    
    if (user?.id && isAuthenticated && !authLoading && user?.isProfileReady === true) {
      console.log('🎮 GameContext: User authenticated, fetching data for:', user.id);
      fetchGameData();
      startMiningLoop();
    } else if (!authLoading && (!user?.id || !isAuthenticated)) {
      console.log('🎮 GameContext: User definitely logged out, clearing data');
      // Only clear if we actually have data and auth is definitely done
      if ((gameStats || ships.length > 0) && !authLoading) {
        setGameStats(null);
        setShips([]);
        dataCache.current = { gameStats: null, ships: [] };
        stopMiningLoop();
      }
      setIsLoading(false);
    } else {
      console.log('🎮 GameContext: Waiting for auth to complete...', {
        hasUserId: !!user?.id,
        isAuthenticated,
        authLoading,
        isProfileReady: user?.isProfileReady,
        userIsProfileReady: user?.isProfileReady === true
      });
    }

    return () => {
      stopMiningLoop();
    };
  }, [user?.id, isAuthenticated, authLoading, user?.isProfileReady]);

  const startMiningLoop = () => {
    if (miningInterval.current) return;
    
    miningInterval.current = setInterval(() => {
      if (isAuthenticated && user?.id) {
        updateEnergyRegeneration();
      }
    }, 30000); // Update every 30 seconds
  };

  const stopMiningLoop = () => {
    if (miningInterval.current) {
      clearInterval(miningInterval.current);
      miningInterval.current = null;
    }
  };

  const updateEnergyRegeneration = async () => {
    try {
      // Regenerate energy for ships
      const updatedShips = ships.map(ship => {
        const lastMining = ship.lastMining?.toDate?.() || new Date(ship.lastMining || new Date());
        const now = new Date();
        const timeDiff = now.getTime() - lastMining.getTime();
        const minutesPassed = Math.floor(timeDiff / (1000 * 60));
        
        if (minutesPassed > 0 && ship.currentEnergy < ship.energyCapacity) {
          const energyToAdd = Math.min(
            ship.energyCapacity - ship.currentEnergy,
            Math.floor(minutesPassed / 5) // 1 energy per 5 minutes
          );
          
          if (energyToAdd > 0) {
            const newEnergy = ship.currentEnergy + energyToAdd;
            GameService.updateShip(ship.id!, { currentEnergy: newEnergy });
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
        console.log('✅ GameContext: Game stats and starter ship created');
      }
      
      // Map field names to match component expectations
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

      // Fetch ships
      const userShips = await GameService.getUserShips(user.id);
      
      // Map ship field names to match component expectations
      const mappedShips = userShips.map(ship => ({
        ...ship,
        current_energy: ship.currentEnergy || ship.energy_capacity || ship.energyCapacity || 100,
        energy_capacity: ship.energyCapacity || ship.energy_capacity || 100,
        mining_power: ship.miningPower || ship.mining_power || 10,
        last_mining: ship.lastMining || ship.last_mining || new Date(),
        ship_type: ship.shipType || ship.ship_type || 'basic'
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
      
      const currentEnergy = ship.current_energy || ship.currentEnergy || 0;
      if (currentEnergy < 10) {
        throw new Error('Ship has insufficient energy');
      }

      // Check cooldown
      const lastMining = ship.last_mining?.toDate?.() || new Date(ship.last_mining || ship.lastMining || new Date());
      const now = new Date();
      const timeDiff = now.getTime() - lastMining.getTime();
      const minutesPassed = Math.floor(timeDiff / (1000 * 60));

      if (minutesPassed < 1) {
        throw new Error('Must wait at least 1 minute between mining operations');
      }

      const result = await GameService.performMining(user.id, shipId);
      
      success(`Mined ${result.zenMined} ZEN tokens!`);
      if (result.newLevel) {
        success(`Level up! You are now level ${result.newLevel}!`);
      }
      
      await fetchGameData();
    } catch (error: any) {
      console.error('Error mining ZEN:', error);
      showError(error.message || 'Failed to mine ZEN tokens');
    } finally {
      setIsMining(false);
    }
  };

  const upgradeShip = async (shipId: string, upgradeType: string) => {
    try {
      if (!user?.id) throw new Error('User not authenticated');
      
      const ship = ships.find(s => s.id === shipId);
      if (!ship) throw new Error('Ship not found');

      const upgradeCost = GameService.calculateUpgradeCost(ship, upgradeType);
      const currentBalance = gameStats?.zen_balance || gameStats?.zenBalance || 0;
      if (currentBalance < upgradeCost) {
        throw new Error('Insufficient ZEN tokens for upgrade');
      }

      // Apply upgrade
      const upgrades = { ...ship.upgrades };
      const currentLevel = upgrades[upgradeType] || 0;
      upgrades[upgradeType] = currentLevel + 1;

      let newStats = { ...ship };
      switch (upgradeType) {
        case 'miningPower':
          newStats.mining_power += 5;
          break;
        case 'energyCapacity':
          newStats.energy_capacity += 20;
          break;
        case 'efficiency':
          // Efficiency reduces energy consumption
          break;
      }

      // Update ship
      await GameService.updateShip(shipId, {
        ...newStats,
        upgrades
      });

      // Deduct cost
      await GameService.updateGameStats(user.id, {
        zenBalance: currentBalance - upgradeCost
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
      
      const currentBalance = gameStats?.zen_balance || gameStats?.zenBalance || 0;
      if (currentBalance < shipConfig.cost) {
        throw new Error('Insufficient ZEN tokens to buy ship');
      }

      // Create new ship
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

      // Deduct cost
      await GameService.updateGameStats(user.id, {
        zenBalance: currentBalance - shipConfig.cost
      });

      await fetchGameData();
      success(`${shipConfig.name} purchased successfully!`);
    } catch (error: any) {
      console.error('Error buying ship:', error);
      showError(error.message || 'Failed to purchase ship');
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