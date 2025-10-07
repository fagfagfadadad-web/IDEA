import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  increment,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ActiveBoost {
  type: 'mining' | 'experience';
  multiplier: number;
  expiresAt: any;
}

export interface PermanentUpgrade {
  autoFeeder: boolean;
  happinessBooster: number;
}

export interface GameStats {
  id?: string;
  userId: string;
  zenBalance: number;
  totalMined: number;
  miningLevel: number;
  experience: number;
  referralCode: string;
  referredBy?: string;
  totalReferrals: number;
  referralEarnings: number;
  gameTickets: number;
  activeBoosts?: ActiveBoost[];
  permanentUpgrades?: PermanentUpgrade;
  createdAt: any;
  updatedAt: any;
}

export interface Ship {
  id?: string;
  userId: string;
  name: string;
  level: number;
  miningPower: number;
  energyCapacity: number;
  currentEnergy: number;
  shipType: string;
  upgrades: Record<string, number>;
  lastMining: any;
  createdAt: any;
}

export interface Task {
  id?: string;
  title: string;
  description: string;
  rewardAmount: number;
  taskType: string;
  requirements: Record<string, any>;
  miningOperationsRequired?: number;
  dailyMiningCountRequired?: number;
  shipCountRequired?: number;
  referralCountRequired?: number;
  requiredLevel?: number;
  referenceLink?: string;
  requiresProof?: boolean;
  proofType?: 'screenshot' | 'link' | 'none';
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface UserTask {
  id?: string;
  taskId: string;
  userId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'pending_claim';
  progress: number;
  proofUrl?: string;
  completedAt?: any;
  createdAt: any;
}

export interface GamePlay {
  id?: string;
  userId: string;
  gameId: 'racing' | 'memory-match' | 'puzzle' | 'pupfi-catcher';
  lastPlayed: any;
  totalPlays: number;
  createdAt: any;
}

export class GameService {
  // Helper function to remove undefined values from objects
  private static filterUndefinedProperties(obj: Record<string, any>): Record<string, any> {
    const filtered: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        filtered[key] = value;
      }
    }
    return filtered;
  }

  // Game Stats
  static async getGameStats(userId: string): Promise<GameStats | null> {
    const docRef = doc(db, 'gameStats', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const rawData = docSnap.data();
      console.log('🔍 GameService: Raw Firestore data:', rawData);
      
      // Fix missing zenBalance field in existing data
      if (rawData.zenBalance === undefined || rawData.zenBalance === null || isNaN(rawData.zenBalance) || rawData.zenBalance === 0) {
        console.log('🔧 GameService: Fixing missing zenBalance field...');
        await updateDoc(docRef, {
          zenBalance: 1000,
          updatedAt: serverTimestamp()
        });
        rawData.zenBalance = 1000;
        console.log('✅ GameService: zenBalance field fixed');
      }

      // Initialize gameTickets if missing
      if (rawData.gameTickets === undefined) {
        console.log('🎫 GameService: Initializing gameTickets field...');
        await updateDoc(docRef, {
          gameTickets: 5,
          updatedAt: serverTimestamp()
        });
        rawData.gameTickets = 5;
        console.log('✅ GameService: gameTickets initialized to 5');
      }
      
      const gameStats = { id: docSnap.id, ...rawData } as GameStats;
      console.log('🔍 GameService: Processed GameStats:', gameStats);
      return gameStats;
    }
    return null;
  }

  static async createGameStats(userId: string, referredBy?: string): Promise<GameStats> {
    const referralCode = this.generateReferralCode();
    console.log('🆕 GameService: Creating game stats with starting balance 1000 PupFi for user:', userId);

    const gameStatsData: any = {
      userId,
      zenBalance: 1000, // Starting balance
      totalMined: 0,
      miningLevel: 1,
      experience: 0,
      referralCode,
      totalReferrals: 0,
      referralEarnings: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Only add referredBy if it's a valid string
    if (referredBy && typeof referredBy === 'string') {
      gameStatsData.referredBy = referredBy;
    }

    const docRef = doc(db, 'gameStats', userId);
    await setDoc(docRef, gameStatsData);
    console.log('✅ GameService: Game stats created successfully');

    return { id: userId, ...gameStatsData } as GameStats;
  }

  static async updateGameStats(userId: string, updates: Partial<GameStats>): Promise<void> {
    console.log('💾 GameService: Updating game stats for user:', userId, 'Updates:', updates);
    const docRef = doc(db, 'gameStats', userId);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    console.log('💾 GameService: Final update data:', updateData);
    await updateDoc(docRef, updateData);
    console.log('✅ GameService: Game stats updated successfully');
  }

  // Ships
  static async getUserShips(userId: string): Promise<Ship[]> {
    try {
      const q = query(
        collection(db, 'ships'),
        where('userId', '==', userId),
        orderBy('createdAt', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ship[];
    } catch (error: any) {
      // If index doesn't exist yet, fall back to simple query
      if (error.code === 'failed-precondition') {
        console.log('Using fallback query for ships (index not ready)');
        const q = query(
          collection(db, 'ships'),
          where('userId', '==', userId)
        );
        
        const querySnapshot = await getDocs(q);
        const ships = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Ship[];
        
        // Sort manually by createdAt
        return ships.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return aTime.getTime() - bTime.getTime();
        });
      }
      throw error;
    }
  }

  static async createShip(ship: Omit<Ship, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'ships'), {
      ...ship,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  }

  static async updateShip(shipId: string, updates: Partial<Ship>): Promise<void> {
    const docRef = doc(db, 'ships', shipId);
    await updateDoc(docRef, updates);
  }

  static async createStarterShip(userId: string): Promise<void> {
    console.log('🐕 GameService: Creating starter dog for user:', userId);
    const shipId = await this.createShip({
      userId,
      name: 'Playful Puppy',
      level: 1,
      miningPower: 10,
      energyCapacity: 100,
      currentEnergy: 100,
      shipType: 'basic',
      upgrades: {},
      lastMining: new Date(),
      createdAt: new Date()
    });
    
    console.log('✅ GameService: Starter dog created with ID:', shipId);
  }

  // Mining
  static async performMining(userId: string, shipId: string): Promise<{ zenMined: number; newLevel?: number }> {
    const batch = writeBatch(db);
    
    // Get ship and game stats
    const shipRef = doc(db, 'ships', shipId);
    const statsRef = doc(db, 'gameStats', userId);
    
    const [shipSnap, statsSnap] = await Promise.all([
      getDoc(shipRef),
      getDoc(statsRef)
    ]);

    if (!shipSnap.exists() || !statsSnap.exists()) {
      throw new Error('Ship or game stats not found');
    }

    const ship = shipSnap.data() as Ship;
    const stats = statsSnap.data() as GameStats;

    if (ship.currentEnergy < 10) {
      throw new Error('Ship has insufficient energy');
    }

    // Check for active mining boost
    let miningMultiplier = 1;
    if (stats.activeBoosts && stats.activeBoosts.length > 0) {
      const now = new Date();
      const activeMiningBoost = stats.activeBoosts.find(boost => {
        if (boost.type !== 'mining') return false;
        const expiresAt = boost.expiresAt?.toDate?.() || new Date(boost.expiresAt);
        return expiresAt > now;
      });
      if (activeMiningBoost) {
        miningMultiplier = activeMiningBoost.multiplier;
      }
    }

    // Calculate mining reward with boost
    const baseReward = ship.miningPower;
    const levelBonus = stats.miningLevel;
    const randomBonus = 1 + Math.random() * 0.5;
    const zenMined = Math.floor(baseReward * levelBonus * randomBonus * miningMultiplier);

    // Update ship
    batch.update(shipRef, {
      currentEnergy: Math.max(0, ship.currentEnergy - 10),
      lastMining: serverTimestamp(),
      last_mining: serverTimestamp() // Update both fields for compatibility
    });

    // Check for active experience boost
    let expMultiplier = 1;
    if (stats.activeBoosts && stats.activeBoosts.length > 0) {
      const now = new Date();
      const activeExpBoost = stats.activeBoosts.find(boost => {
        if (boost.type !== 'experience') return false;
        const expiresAt = boost.expiresAt?.toDate?.() || new Date(boost.expiresAt);
        return expiresAt > now;
      });
      if (activeExpBoost) {
        expMultiplier = activeExpBoost.multiplier;
      }
    }

    // Calculate new experience and level with boost
    const baseExp = Math.floor(zenMined / 10);
    const newExperience = stats.experience + Math.floor(baseExp * expMultiplier);
    const newLevel = Math.floor(newExperience / 1000) + 1;
    const leveledUp = newLevel > stats.miningLevel;
    const levelsGained = leveledUp ? newLevel - stats.miningLevel : 0;

    // Update game stats (award 2 tickets per level up)
    const updateData: any = {
      zenBalance: increment(zenMined),
      totalMined: increment(zenMined),
      experience: newExperience,
      miningLevel: newLevel,
      updatedAt: serverTimestamp()
    };

    if (leveledUp) {
      updateData.gameTickets = increment(levelsGained * 2);
      console.log(`🎫 GameService: Level up! Awarded ${levelsGained * 2} game tickets (${levelsGained} levels)`);
    }

    batch.update(statsRef, updateData);

    // Handle referral earnings
    if (stats.referredBy) {
      const referralEarnings = Math.floor(zenMined * 0.1);
      const referrerQuery = query(
        collection(db, 'gameStats'),
        where('referralCode', '==', stats.referredBy),
        limit(1)
      );
      
      const referrerSnap = await getDocs(referrerQuery);
      if (!referrerSnap.empty) {
        const referrerDoc = referrerSnap.docs[0];
        batch.update(referrerDoc.ref, {
          zenBalance: increment(referralEarnings),
          referralEarnings: increment(referralEarnings),
          updatedAt: serverTimestamp()
        });

        // Log referral earning
        const earningRef = doc(collection(db, 'referralEarnings'));
        batch.set(earningRef, {
          referrerId: referrerDoc.id,
          referredId: userId,
          amount: referralEarnings,
          source: 'mining',
          createdAt: serverTimestamp()
        });
      }
    }

    await batch.commit();

    return { zenMined, newLevel: leveledUp ? newLevel : undefined };
  }

  // Tasks
  static async getTasks(): Promise<Task[]> {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
    } catch (error: any) {
      // If index doesn't exist yet, fall back to simple query
      if (error.code === 'failed-precondition') {
        console.log('Using fallback query for tasks (index not ready)');
        const q = query(
          collection(db, 'tasks'),
          where('isActive', '==', true)
        );
        
        const querySnapshot = await getDocs(q);
        const tasks = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Task[];
        
        // Sort manually by createdAt
        return tasks.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return bTime.getTime() - aTime.getTime(); // desc order
        });
      }
      throw error;
    }
  }

  static async getUserTasks(userId: string): Promise<UserTask[]> {
    const q = query(
      collection(db, 'userTasks'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserTask[];
  }

  static async startTask(userId: string, taskId: string): Promise<void> {
    await addDoc(collection(db, 'userTasks'), {
      taskId,
      userId,
      status: 'in_progress',
      progress: 0,
      createdAt: serverTimestamp()
    });
  }

  static async completeTask(userTaskId: string, userId: string, rewardAmount: number): Promise<void> {
    const batch = writeBatch(db);

    // Update task status
    const userTaskRef = doc(db, 'userTasks', userTaskId);
    batch.update(userTaskRef, {
      status: 'completed',
      progress: 100,
      completedAt: serverTimestamp()
    });

    // Award PupFi tokens + 1 game ticket for each completed task
    const statsRef = doc(db, 'gameStats', userId);
    batch.update(statsRef, {
      zenBalance: increment(rewardAmount),
      gameTickets: increment(1),
      updatedAt: serverTimestamp()
    });

    await batch.commit();
    console.log(`🎫 GameService: Awarded 1 game ticket + ${rewardAmount} food for completing task`);
  }

  // Admin functions
  static async createTask(task: Omit<Task, 'id'>): Promise<string> {
    // Build requirements object from specific fields
    const requirements: Record<string, any> = {};
    if (task.miningOperationsRequired && task.miningOperationsRequired > 0) {
      requirements.miningOperations = task.miningOperationsRequired;
    }
    if (task.dailyMiningCountRequired && task.dailyMiningCountRequired > 0) {
      requirements.dailyMiningCount = task.dailyMiningCountRequired;
    }
    if (task.shipCountRequired && task.shipCountRequired > 0) {
      requirements.shipCount = task.shipCountRequired;
    }
    if (task.referralCountRequired && task.referralCountRequired > 0) {
      requirements.referralCount = task.referralCountRequired;
    }
    if (task.requiredLevel && task.requiredLevel > 0) {
      requirements.requiredLevel = task.requiredLevel;
    }

    const taskData = this.filterUndefinedProperties({
      ...task,
      requirements,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const docRef = await addDoc(collection(db, 'tasks'), taskData);
    return docRef.id;
  }

  static async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    // Build requirements object from specific fields if they exist in updates
    if (updates.miningOperationsRequired !== undefined || 
        updates.dailyMiningCountRequired !== undefined ||
        updates.shipCountRequired !== undefined ||
        updates.referralCountRequired !== undefined ||
        updates.requiredLevel !== undefined) {
      
      const requirements: Record<string, any> = {};
      if (updates.miningOperationsRequired && updates.miningOperationsRequired > 0) {
        requirements.miningOperations = updates.miningOperationsRequired;
      }
      if (updates.dailyMiningCountRequired && updates.dailyMiningCountRequired > 0) {
        requirements.dailyMiningCount = updates.dailyMiningCountRequired;
      }
      if (updates.shipCountRequired && updates.shipCountRequired > 0) {
        requirements.shipCount = updates.shipCountRequired;
      }
      if (updates.referralCountRequired && updates.referralCountRequired > 0) {
        requirements.referralCount = updates.referralCountRequired;
      }
      if (updates.requiredLevel && updates.requiredLevel > 0) {
        requirements.requiredLevel = updates.requiredLevel;
      }
      
      updates.requirements = requirements;
    }

    const docRef = doc(db, 'tasks', taskId);
    const updateData = this.filterUndefinedProperties({
      ...updates,
      updatedAt: serverTimestamp()
    });

    await updateDoc(docRef, updateData);
  }

  static async getLeaderboard(field: string, limitCount = 100): Promise<GameStats[]> {
    const q = query(
      collection(db, 'gameStats'),
      orderBy(field, 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GameStats[];
  }

  // Utility functions
  static generateReferralCode(): string {
    return 'ZEND' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  static getShipConfig(shipType: string) {
    const configs = {
      basic: { name: 'Playful Puppy', miningPower: 10, energyCapacity: 100, cost: 0 },
      advanced: { name: 'Golden Retriever', miningPower: 25, energyCapacity: 200, cost: 1000 },
      elite: { name: 'Husky Explorer', miningPower: 50, energyCapacity: 300, cost: 5000 },
      legendary: { name: 'Royal Corgi', miningPower: 100, energyCapacity: 500, cost: 20000 }
    };
    return configs[shipType as keyof typeof configs] || configs.basic;
  }

  static calculateUpgradeCost(ship: Ship, upgradeType: string): number {
    const currentLevel = ship.upgrades[upgradeType] || 0;
    const baseCost = {
      miningPower: 100,
      energyCapacity: 80,
      efficiency: 150
    };
    return Math.floor(baseCost[upgradeType as keyof typeof baseCost] * Math.pow(1.5, currentLevel));
  }

  // Shop functions
  static async purchaseConsumable(userId: string, shipId: string, energyAmount: number, cost: number): Promise<void> {
    const statsRef = doc(db, 'gameStats', userId);
    const shipRef = doc(db, 'ships', shipId);

    const batch = writeBatch(db);

    batch.update(statsRef, {
      zenBalance: increment(-cost),
      updatedAt: serverTimestamp()
    });

    batch.update(shipRef, {
      currentEnergy: increment(energyAmount),
      updatedAt: serverTimestamp()
    });

    await batch.commit();
  }

  static async activateBoost(userId: string, boostType: 'mining' | 'experience', multiplier: number, duration: number, cost: number): Promise<void> {
    const statsRef = doc(db, 'gameStats', userId);
    const statsSnap = await getDoc(statsRef);

    if (!statsSnap.exists()) {
      throw new Error('User stats not found');
    }

    const stats = statsSnap.data() as GameStats;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration * 1000);

    const activeBoosts = stats.activeBoosts || [];
    activeBoosts.push({
      type: boostType,
      multiplier,
      expiresAt
    });

    await updateDoc(statsRef, {
      zenBalance: increment(-cost),
      activeBoosts,
      updatedAt: serverTimestamp()
    });
  }

  static async purchasePermanentUpgrade(userId: string, upgradeType: 'autoFeeder' | 'happinessBooster', value: boolean | number, cost: number): Promise<void> {
    const statsRef = doc(db, 'gameStats', userId);
    const statsSnap = await getDoc(statsRef);

    if (!statsSnap.exists()) {
      throw new Error('User stats not found');
    }

    const stats = statsSnap.data() as GameStats;
    const permanentUpgrades = stats.permanentUpgrades || { autoFeeder: false, happinessBooster: 1 };

    if (upgradeType === 'autoFeeder') {
      permanentUpgrades.autoFeeder = value as boolean;
    } else if (upgradeType === 'happinessBooster') {
      permanentUpgrades.happinessBooster = value as number;
    }

    await updateDoc(statsRef, {
      zenBalance: increment(-cost),
      permanentUpgrades,
      updatedAt: serverTimestamp()
    });
  }

  static async cleanExpiredBoosts(userId: string): Promise<void> {
    const statsRef = doc(db, 'gameStats', userId);
    const statsSnap = await getDoc(statsRef);

    if (!statsSnap.exists()) return;

    const stats = statsSnap.data() as GameStats;
    if (!stats.activeBoosts || stats.activeBoosts.length === 0) return;

    const now = new Date();
    const activeBoosts = stats.activeBoosts.filter(boost => {
      const expiresAt = boost.expiresAt?.toDate?.() || new Date(boost.expiresAt);
      return expiresAt > now;
    });

    if (activeBoosts.length !== stats.activeBoosts.length) {
      await updateDoc(statsRef, {
        activeBoosts,
        updatedAt: serverTimestamp()
      });
    }
  }

  // Game rewards function
  static async awardFoodPoints(userId: string, points: number): Promise<void> {
    const statsRef = doc(db, 'gameStats', userId);
    await updateDoc(statsRef, {
      zenBalance: increment(points),
      updatedAt: serverTimestamp()
    });
  }

  // Referral functions
  static async processReferral(referralCode: string, newUserId: string): Promise<void> {
    // Find the referrer by referral code
    const q = query(
      collection(db, 'gameStats'),
      where('referralCode', '==', referralCode),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('⚠️ GameService: Referral code not found:', referralCode);
      return;
    }

    const referrerDoc = querySnapshot.docs[0];
    const referrerData = referrerDoc.data() as GameStats;
    const referrerId = referrerDoc.id;

    console.log('👤 GameService: Found referrer:', referrerId);

    // Don't allow self-referral
    if (referrerId === newUserId) {
      console.log('⚠️ GameService: Self-referral not allowed');
      return;
    }

    // Award referral bonus (100 Food for both)
    const referralBonus = 100;

    // Update referrer stats
    await updateDoc(doc(db, 'gameStats', referrerId), {
      totalReferrals: increment(1),
      referralEarnings: increment(referralBonus),
      zenBalance: increment(referralBonus),
      updatedAt: serverTimestamp()
    });

    // Award bonus to new user
    await updateDoc(doc(db, 'gameStats', newUserId), {
      zenBalance: increment(referralBonus),
      updatedAt: serverTimestamp()
    });

    console.log('✅ GameService: Referral bonus awarded:', referralBonus, 'Food to both users');
  }

  // Game Tickets Management
  static async canPlayGame(userId: string, gameId: string): Promise<{ canPlay: boolean; needsTicket: boolean; hasTicket: boolean }> {
    const gamePlayRef = doc(db, 'gamePlays', `${userId}_${gameId}`);
    const gamePlaySnap = await getDoc(gamePlayRef);

    if (!gamePlaySnap.exists()) {
      return { canPlay: true, needsTicket: false, hasTicket: false };
    }

    const gamePlay = gamePlaySnap.data() as GamePlay;
    const lastPlayed = gamePlay.lastPlayed?.toDate();
    const now = new Date();

    // Check if last play was today
    const isToday = lastPlayed &&
      lastPlayed.getDate() === now.getDate() &&
      lastPlayed.getMonth() === now.getMonth() &&
      lastPlayed.getFullYear() === now.getFullYear();

    if (!isToday) {
      return { canPlay: true, needsTicket: false, hasTicket: false };
    }

    // Already played today, need ticket
    const stats = await this.getGameStats(userId);
    const hasTicket = (stats?.gameTickets || 0) > 0;

    return { canPlay: hasTicket, needsTicket: true, hasTicket };
  }

  static async useTicket(userId: string, gameId: string): Promise<void> {
    const stats = await this.getGameStats(userId);

    if (!stats || stats.gameTickets <= 0) {
      throw new Error('No tickets available');
    }

    // Deduct ticket
    await updateDoc(doc(db, 'gameStats', userId), {
      gameTickets: increment(-1),
      updatedAt: serverTimestamp()
    });

    // Record game play
    await this.recordGamePlay(userId, gameId);
  }

  static async recordGamePlay(userId: string, gameId: string): Promise<void> {
    const gamePlayRef = doc(db, 'gamePlays', `${userId}_${gameId}`);
    const gamePlaySnap = await getDoc(gamePlayRef);

    if (gamePlaySnap.exists()) {
      await updateDoc(gamePlayRef, {
        lastPlayed: serverTimestamp(),
        totalPlays: increment(1)
      });
    } else {
      await setDoc(gamePlayRef, {
        userId,
        gameId,
        lastPlayed: serverTimestamp(),
        totalPlays: 1,
        createdAt: serverTimestamp()
      });
    }
  }

  static async awardTickets(userId: string, amount: number): Promise<void> {
    await updateDoc(doc(db, 'gameStats', userId), {
      gameTickets: increment(amount),
      updatedAt: serverTimestamp()
    });
    console.log(`🎫 GameService: Awarded ${amount} tickets to user ${userId}`);
  }
}

// Export helper function for convenience
export const awardFoodPoints = GameService.awardFoodPoints.bind(GameService);