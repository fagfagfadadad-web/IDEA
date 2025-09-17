export interface FirebaseUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

export interface GameStats {
  id?: string;
  userId: string;
  zenBalance: number;
  totalMined: number;
  miningLevel: number;
  experience: number;
  referralCode: string;
  referredBy?: string | null;
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