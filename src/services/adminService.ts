import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  getCountFromServer,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GameService, Task } from './gameService';
import { UserService, User } from './userService';

export interface AdminStats {
  totalUsers: number;
  totalZenMined: number;
  totalZenBalance: number;
  totalShips: number;
  activeTasks: number;
  completedTasks: number;
  averageLevel: number;
  newUsersThisWeek: number;
  totalReferrals: number;
}

export class AdminService {
  static async getAdminStats(): Promise<AdminStats> {
    try {
      // Get total users
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getCountFromServer(usersQuery);
      const totalUsers = usersSnapshot.data().count;

      // Get all game stats for calculations
      const gameStatsQuery = query(collection(db, 'gameStats'));
      const gameStatsSnapshot = await getDocs(gameStatsQuery);
      
      let totalZenMined = 0;
      let totalZenBalance = 0;
      let totalLevels = 0;
      let totalReferrals = 0;

      gameStatsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        totalZenMined += data.totalMined || 0;
        totalZenBalance += data.zenBalance || 0;
        totalLevels += data.miningLevel || 1;
        totalReferrals += data.totalReferrals || 0;
      });

      const averageLevel = gameStatsSnapshot.size > 0 ? Math.round(totalLevels / gameStatsSnapshot.size) : 1;

      // Get total ships
      const shipsQuery = query(collection(db, 'ships'));
      const shipsSnapshot = await getCountFromServer(shipsQuery);
      const totalShips = shipsSnapshot.data().count;

      // Get active tasks
      const activeTasksQuery = query(
        collection(db, 'tasks'),
        where('isActive', '==', true)
      );
      const activeTasksSnapshot = await getCountFromServer(activeTasksQuery);
      const activeTasks = activeTasksSnapshot.data().count;

      // Get completed tasks
      const completedTasksQuery = query(
        collection(db, 'userTasks'),
        where('status', '==', 'completed')
      );
      const completedTasksSnapshot = await getCountFromServer(completedTasksQuery);
      const completedTasks = completedTasksSnapshot.data().count;

      // Get new users this week
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const newUsersQuery = query(
        collection(db, 'users'),
        where('createdAt', '>=', sevenDaysAgo)
      );
      const newUsersSnapshot = await getCountFromServer(newUsersQuery);
      const newUsersThisWeek = newUsersSnapshot.data().count;

      return {
        totalUsers,
        totalZenMined,
        totalZenBalance,
        totalShips,
        activeTasks,
        completedTasks,
        averageLevel,
        newUsersThisWeek,
        totalReferrals
      };
    } catch (error) {
      console.error('Error getting admin stats:', error);
      throw error;
    }
  }

  static async getAllTasks(): Promise<Task[]> {
    const q = query(
      collection(db, 'tasks'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Task[];
  }

  static async deleteTask(taskId: string): Promise<void> {
    const docRef = doc(db, 'tasks', taskId);
    await deleteDoc(docRef);
  }

  static async toggleTaskStatus(taskId: string, isActive: boolean): Promise<void> {
    const docRef = doc(db, 'tasks', taskId);
    await updateDoc(docRef, {
      isActive,
      updatedAt: serverTimestamp()
    });
  }

  static async getAllUsersWithStats(): Promise<(User & { gameStats?: any })[]> {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];

    // Get game stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const gameStats = await GameService.getGameStats(user.id!);
        return { ...user, gameStats };
      })
    );

    return usersWithStats;
  }

  static async banUser(userId: string, isBanned: boolean): Promise<void> {
    await UserService.updateUser(userId, { isBanned });
  }

  static async toggleAdminStatus(userId: string, isAdmin: boolean): Promise<void> {
    await UserService.updateUser(userId, { isAdmin });
  }

  static async awardZenTokens(userId: string, amount: number): Promise<void> {
    const statsRef = doc(db, 'gameStats', userId);
    await updateDoc(statsRef, {
      zenBalance: increment(amount),
      updatedAt: serverTimestamp()
    });
  }
}