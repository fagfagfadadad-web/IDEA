import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from './ToastContext';

interface Ship {
  id: string;
  name: string;
  level: number;
  mining_power: number;
  energy_capacity: number;
  current_energy: number;
  last_mining: string;
  upgrades: any;
}

interface GameStats {
  zen_balance: number;
  total_mined: number;
  mining_level: number;
  experience: number;
  referral_code: string;
  referred_by: string | null;
  total_referrals: number;
  referral_earnings: number;
}

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
        updateMiningProgress();
      }
    }, 5000); // Update every 5 seconds
  };

  const stopMiningLoop = () => {
    if (miningInterval.current) {
      clearInterval(miningInterval.current);
      miningInterval.current = null;
    }
  };

  const updateMiningProgress = async () => {
    try {
      // Check for ships that can mine automatically
      const { data: activeShips } = await supabase
        .from('ships')
        .select('*')
        .eq('user_id', user?.id)
        .gt('current_energy', 0);

      if (activeShips && activeShips.length > 0) {
        // Auto-mine for ships with energy
        for (const ship of activeShips) {
          const lastMining = new Date(ship.last_mining);
          const now = new Date();
          const timeDiff = now.getTime() - lastMining.getTime();
          const minutesPassed = Math.floor(timeDiff / (1000 * 60));

          if (minutesPassed >= 1 && ship.current_energy > 0) {
            await performMining(ship.id, true); // Silent mining
          }
        }
      }
    } catch (error) {
      console.error('Error in mining loop:', error);
    }
  };

  const fetchGameData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch or create game stats
      const { data: stats, error: statsError } = await supabase
        .from('game_stats')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (statsError && statsError.code !== 'PGRST116') {
        throw statsError;
      }

      if (!stats) {
        // Create initial game stats
        const referralCode = generateReferralCode();
        const { data: newStats, error: createError } = await supabase
          .from('game_stats')
          .insert({
            user_id: user?.id,
            zen_balance: 100, // Starting balance
            total_mined: 0,
            mining_level: 1,
            experience: 0,
            referral_code: referralCode,
            total_referrals: 0,
            referral_earnings: 0
          })
          .select()
          .single();

        if (createError) throw createError;
        setGameStats(newStats);

        // Create starter ship
        await createStarterShip();
      } else {
        setGameStats(stats);
      }

      // Fetch ships
      const { data: shipsData, error: shipsError } = await supabase
        .from('ships')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (shipsError) throw shipsError;
      setShips(shipsData || []);

    } catch (err) {
      console.error('Error fetching game data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const createStarterShip = async () => {
    try {
      const { data: ship, error } = await supabase
        .from('ships')
        .insert({
          user_id: user?.id,
          name: 'Starter Miner',
          level: 1,
          mining_power: 10,
          energy_capacity: 100,
          current_energy: 100,
          ship_type: 'basic',
          upgrades: {}
        })
        .select()
        .single();

      if (error) throw error;
      setShips([ship]);
    } catch (error) {
      console.error('Error creating starter ship:', error);
    }
  };

  const generateReferralCode = () => {
    return 'ZEN' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const mineZen = async (shipId: string) => {
    try {
      setIsMining(true);
      await performMining(shipId, false);
      success('ZEN tokens mined successfully!');
    } catch (error) {
      console.error('Error mining ZEN:', error);
      showError('Failed to mine ZEN tokens');
    } finally {
      setIsMining(false);
    }
  };

  const performMining = async (shipId: string, silent = false) => {
    const ship = ships.find(s => s.id === shipId);
    if (!ship || ship.current_energy <= 0) {
      if (!silent) showError('Ship has no energy to mine');
      return;
    }

    const now = new Date();
    const lastMining = new Date(ship.last_mining);
    const timeDiff = now.getTime() - lastMining.getTime();
    const minutesPassed = Math.floor(timeDiff / (1000 * 60));

    if (minutesPassed < 1 && !silent) {
      showError('Must wait at least 1 minute between mining operations');
      return;
    }

    // Calculate mining reward
    const baseReward = ship.mining_power;
    const levelBonus = gameStats?.mining_level || 1;
    const energyCost = 10;
    const zenMined = Math.floor(baseReward * levelBonus * (1 + Math.random() * 0.5));

    // Update ship energy and last mining time
    const { error: shipError } = await supabase
      .from('ships')
      .update({
        current_energy: Math.max(0, ship.current_energy - energyCost),
        last_mining: now.toISOString()
      })
      .eq('id', shipId);

    if (shipError) throw shipError;

    // Update game stats
    const newBalance = (gameStats?.zen_balance || 0) + zenMined;
    const newTotalMined = (gameStats?.total_mined || 0) + zenMined;
    const newExperience = (gameStats?.experience || 0) + Math.floor(zenMined / 10);
    const newLevel = Math.floor(newExperience / 1000) + 1;

    const { error: statsError } = await supabase
      .from('game_stats')
      .update({
        zen_balance: newBalance,
        total_mined: newTotalMined,
        experience: newExperience,
        mining_level: newLevel
      })
      .eq('user_id', user?.id);

    if (statsError) throw statsError;

    // Update local state
    setGameStats(prev => prev ? {
      ...prev,
      zen_balance: newBalance,
      total_mined: newTotalMined,
      experience: newExperience,
      mining_level: newLevel
    } : null);

    setShips(prev => prev.map(s => 
      s.id === shipId 
        ? { ...s, current_energy: Math.max(0, s.current_energy - energyCost), last_mining: now.toISOString() }
        : s
    ));

    if (!silent) {
      success(`Mined ${zenMined} ZEN tokens!`);
    }
  };

  const upgradeShip = async (shipId: string, upgradeType: string) => {
    try {
      const ship = ships.find(s => s.id === shipId);
      if (!ship) throw new Error('Ship not found');

      const upgradeCost = calculateUpgradeCost(ship, upgradeType);
      if ((gameStats?.zen_balance || 0) < upgradeCost) {
        showError('Insufficient ZEN tokens for upgrade');
        return;
      }

      // Apply upgrade
      const upgrades = { ...ship.upgrades };
      const currentLevel = upgrades[upgradeType] || 0;
      upgrades[upgradeType] = currentLevel + 1;

      let newStats = { ...ship };
      switch (upgradeType) {
        case 'mining_power':
          newStats.mining_power += 5;
          break;
        case 'energy_capacity':
          newStats.energy_capacity += 20;
          break;
        case 'efficiency':
          // Efficiency reduces energy consumption
          break;
      }

      // Update ship
      const { error: shipError } = await supabase
        .from('ships')
        .update({
          ...newStats,
          upgrades
        })
        .eq('id', shipId);

      if (shipError) throw shipError;

      // Deduct cost
      const { error: statsError } = await supabase
        .from('game_stats')
        .update({
          zen_balance: (gameStats?.zen_balance || 0) - upgradeCost
        })
        .eq('user_id', user?.id);

      if (statsError) throw statsError;

      await fetchGameData();
      success(`Ship upgraded successfully!`);
    } catch (error) {
      console.error('Error upgrading ship:', error);
      showError('Failed to upgrade ship');
    }
  };

  const buyShip = async (shipType: string) => {
    try {
      const shipCost = getShipCost(shipType);
      if ((gameStats?.zen_balance || 0) < shipCost) {
        showError('Insufficient ZEN tokens to buy ship');
        return;
      }

      const shipConfig = getShipConfig(shipType);
      
      // Create new ship
      const { error: shipError } = await supabase
        .from('ships')
        .insert({
          user_id: user?.id,
          name: shipConfig.name,
          level: 1,
          mining_power: shipConfig.mining_power,
          energy_capacity: shipConfig.energy_capacity,
          current_energy: shipConfig.energy_capacity,
          ship_type: shipType,
          upgrades: {}
        });

      if (shipError) throw shipError;

      // Deduct cost
      const { error: statsError } = await supabase
        .from('game_stats')
        .update({
          zen_balance: (gameStats?.zen_balance || 0) - shipCost
        })
        .eq('user_id', user?.id);

      if (statsError) throw statsError;

      await fetchGameData();
      success(`${shipConfig.name} purchased successfully!`);
    } catch (error) {
      console.error('Error buying ship:', error);
      showError('Failed to purchase ship');
    }
  };

  const calculateUpgradeCost = (ship: Ship, upgradeType: string) => {
    const currentLevel = ship.upgrades[upgradeType] || 0;
    const baseCost = {
      mining_power: 100,
      energy_capacity: 80,
      efficiency: 150
    };
    return Math.floor(baseCost[upgradeType as keyof typeof baseCost] * Math.pow(1.5, currentLevel));
  };

  const getShipCost = (shipType: string) => {
    const costs = {
      basic: 0,
      advanced: 1000,
      elite: 5000,
      legendary: 20000
    };
    return costs[shipType as keyof typeof costs] || 0;
  };

  const getShipConfig = (shipType: string) => {
    const configs = {
      basic: { name: 'Basic Miner', mining_power: 10, energy_capacity: 100 },
      advanced: { name: 'Advanced Miner', mining_power: 25, energy_capacity: 200 },
      elite: { name: 'Elite Miner', mining_power: 50, energy_capacity: 300 },
      legendary: { name: 'Legendary Miner', mining_power: 100, energy_capacity: 500 }
    };
    return configs[shipType as keyof typeof configs] || configs.basic;
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