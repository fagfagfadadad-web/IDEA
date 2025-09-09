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
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface UserTask {
  id?: string;
  taskId: string;
  userId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  completedAt?: any;
  createdAt: any;
}

export class GameService {
  // Game Stats
  static async getGameStats(userId: string): Promise<GameStats | null> {
    const docRef = doc(db, 'gameStats', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const rawData = docSnap.data();
      console.log('🔍 GameService: Raw Firestore data:', rawData);
      
      // Fix missing zenBalance field in existing data
      if (rawData.zenBalance === undefined || rawData.zenBalance === null || isNaN(rawData.zenBalance)) {
        console.log('🔧 GameService: Fixing missing zenBalance field...');
        await updateDoc(docRef, {
          zenBalance: 1000,
          updatedAt: serverTimestamp()
        });
        rawData.zenBalance = 1000;
        console.log('✅ GameService: zenBalance field fixed');
      }
      
      const gameStats = { id: docSnap.id, ...rawData } as GameStats;
      console.log('🔍 GameService: Processed GameStats:', gameStats);
      return gameStats;
    }
    return null;
  }

  static async createGameStats(userId: string, referredBy?: string): Promise<GameStats> {
    const referralCode = this.generateReferralCode();
    const gameStats: Omit<GameStats, 'id'> = {
      userId,
      zenBalance: 1000, // Starting balance
      totalMined: 0,
      miningLevel: 1,
      experience: 0,
      referralCode,
      referredBy: referredBy || null,
      totalReferrals: 0,
      referralEarnings: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = doc(db, 'gameStats', userId);
    await setDoc(docRef, gameStats);
    
    return { id: userId, ...gameStats } as GameStats;
  }

  static async updateGameStats(userId: string, updates: Partial<GameStats>): Promise<void> {
    const docRef = doc(db, 'gameStats', userId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
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
    console.log('🚀 GameService: Creating starter ship for user:', userId);
    const shipId = await this.createShip({
      userId,
      name: 'Starter Miner',
      level: 1,
      miningPower: 10,
      energyCapacity: 100,
      currentEnergy: 100,
      shipType: 'basic',
      upgrades: {},
      lastMining: new Date(),
      createdAt: new Date()
    });
    
    console.log('✅ GameService: Starter ship created with ID:', shipId);
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

    // Calculate mining reward
    const baseReward = ship.miningPower;
    const levelBonus = stats.miningLevel;
    const randomBonus = 1 + Math.random() * 0.5;
    const zenMined = Math.floor(baseReward * levelBonus * randomBonus);

    // Update ship
    batch.update(shipRef, {
      currentEnergy: Math.max(0, ship.currentEnergy - 10),
      lastMining: serverTimestamp()
    });

    // Calculate new experience and level
    const newExperience = stats.experience + Math.floor(zenMined / 10);
    const newLevel = Math.floor(newExperience / 1000) + 1;
    const leveledUp = newLevel > stats.miningLevel;

    // Update game stats
    batch.update(statsRef, {
      zenBalance: increment(zenMined),
      totalMined: increment(zenMined),
      experience: newExperience,
      miningLevel: newLevel,
      updatedAt: serverTimestamp()
    });

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

    // Award ZEN tokens
    const statsRef = doc(db, 'gameStats', userId);
    batch.update(statsRef, {
      zenBalance: increment(rewardAmount),
      updatedAt: serverTimestamp()
    });

    await batch.commit();
  }

  // Admin functions
  static async createTask(task: Omit<Task, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'tasks'), {
      ...task,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  static async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const docRef = doc(db, 'tasks', taskId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
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
      basic: { name: 'Basic Miner', miningPower: 10, energyCapacity: 100, cost: 0 },
      advanced: { name: 'Advanced Miner', miningPower: 25, energyCapacity: 200, cost: 1000 },
      elite: { name: 'Elite Miner', miningPower: 50, energyCapacity: 300, cost: 5000 },
      legendary: { name: 'Legendary Miner', miningPower: 100, energyCapacity: 500, cost: 20000 }
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
}