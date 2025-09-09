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
  const { user, isAuthenticated } = useAuth();
  const { success, error: showError } = useToast();
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [ships, setShips] = useState<Ship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMining, setIsMining] = useState(false);
  const miningInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchGameData();
      startMiningLoop();
    } else {
      setGameStats(null);
      setShips([]);
      setIsLoading(false);
      stopMiningLoop();
    }

    return () => {
      stopMiningLoop();
    };
  }, [isAuthenticated, user?.id]);

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
        const lastMining = ship.lastMining?.toDate?.() || new Date(ship.lastMining);
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

      // Fetch or create game stats
      let stats = await GameService.getGameStats(user.id);
      if (!stats) {
        console.log('🆕 GameContext: Creating new game stats...');
        stats = await GameService.createGameStats(user.id);
        await GameService.createStarterShip(user.id);
        console.log('✅ GameContext: Game stats and starter ship created');
      }
      setGameStats(stats);
      console.log('📊 GameContext: Game stats loaded:', stats);

      // Fetch ships
      const userShips = await GameService.getUserShips(user.id);
      setShips(userShips);
      console.log('🚀 GameContext: Ships loaded:', userShips.length);

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
      
      if (ship.currentEnergy < 10) {
        throw new Error('Ship has insufficient energy');
      }

      // Check cooldown
      const lastMining = ship.lastMining?.toDate?.() || new Date(ship.lastMining);
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
      if ((gameStats?.zenBalance || 0) < upgradeCost) {
        throw new Error('Insufficient ZEN tokens for upgrade');
      }

      // Apply upgrade
      const upgrades = { ...ship.upgrades };
      const currentLevel = upgrades[upgradeType] || 0;
      upgrades[upgradeType] = currentLevel + 1;

      let newStats = { ...ship };
      switch (upgradeType) {
        case 'miningPower':
          newStats.miningPower += 5;
          break;
        case 'energyCapacity':
          newStats.energyCapacity += 20;
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
        zenBalance: (gameStats?.zenBalance || 0) - upgradeCost
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
      
      if ((gameStats?.zenBalance || 0) < shipConfig.cost) {
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
        zenBalance: (gameStats?.zenBalance || 0) - shipConfig.cost
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