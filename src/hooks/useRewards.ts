import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TaskService } from '../services/taskService';
import { ReferralService } from '../services/referralService';
import { ProfileService } from '../services/profileService';
import { Task, UserRewardTask, UserReferralStats, Referral, ReferralReward, TaskStatistics } from '../types/rewards.types';

// Hook for tasks
export const useTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userTasks, setUserTasks] = useState<UserRewardTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadTasks();
    }
  }, [user?.id]);

  const loadTasks = async () => {
    if (!user?.id || !user?.wallet_address) {
      setTasks([]);
      setUserTasks([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Initialize user for rewards system
      const userProfile = await ProfileService.initializeUserForRewards(user.wallet_address);
      if (!userProfile) {
        console.warn('Could not initialize user for rewards system');
        setTasks([]);
        setUserTasks([]);
        return;
      }
      
      // Load tasks and user progress
      const [allTasks, userTasksData] = await Promise.all([
        TaskService.getAllTasks(),
        TaskService.getUserRewardTasks(user.id)
      ]);

      setTasks(allTasks);
      setUserTasks(userTasksData);

      // Check for automatic task completions
      await TaskService.checkAndCompleteAutomaticTasks(user.id, userProfile);
      
      // Reload user tasks after auto-completion check
      const updatedUserTasks = await TaskService.getUserRewardTasks(user.id);
      setUserTasks(updatedUserTasks);
    } catch (err) {
      console.error('Error loading tasks:', err);
      // Don't show error to user, just log it
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const completeTask = async (taskId: string, proofUrl?: string, proofText?: string) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      await TaskService.completeRewardTask(user.id, taskId, proofUrl, proofText);
      await loadTasks(); // Reload to get updated status
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to complete task');
    } finally {
      setIsLoading(false);
    }
  };

  const claimReward = async (taskId: string) => {
    if (!user?.id) return null;

    setIsLoading(true);
    try {
      const result = await TaskService.claimRewardTaskReward(user.id, taskId);
      await loadTasks(); // Reload to get updated status
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to claim reward');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getTaskStats = () => {
    const completed = userTasks.filter(ut => ut.status === 'completed' || ut.status === 'claimed').length;
    const claimed = userTasks.filter(ut => ut.status === 'claimed').length;
    const available = userTasks.filter(ut => ut.status === 'available').length;
    const totalRewards = userTasks
      .filter(ut => ut.status === 'claimed')
      .reduce((sum, ut) => sum + (ut.task?.reward_amount || 0), 0);

    return {
      completed,
      claimed,
      available,
      total: userTasks.length,
      totalRewards
    };
  };

  return {
    tasks,
    userTasks,
    isLoading,
    error,
    completeTask,
    claimReward,
    refreshTasks: loadTasks,
    taskStats: getTaskStats()
  };
};

// Hook for referrals
export const useReferrals = () => {
  const { user } = useAuth();
  const [referralStats, setReferralStats] = useState<UserReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.wallet_address) {
      loadReferralData();
      // Check for referral from URL on first load
      ReferralService.checkReferralFromUrl(user.wallet_address);
    }
  }, [user?.wallet_address]);

  const loadReferralData = async () => {
    if (!user?.wallet_address || !user?.id) {
      console.log('🔗 useReferrals: No wallet address or user ID, clearing data');
      setReferralStats(null);
      setReferrals([]);
      setRewards([]);
      setLeaderboard([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔗 useReferrals: Loading referral data for user:', user.id);
      
      // Initialize user referral stats if needed
      const initialized = await ReferralService.initializeUserReferralStats(user.id);
      if (!initialized) {
        console.warn('Could not initialize referral stats');
        console.log('🔗 useReferrals: Failed to initialize referral stats');
        setReferralStats(null);
        setReferrals([]);
        setRewards([]);
        return;
      }
      
      console.log('🔗 useReferrals: Fetching referral data...');
      const [stats, userReferrals, rewardHistory, topReferrers] = await Promise.all([
        ReferralService.getUserReferralStats(user.wallet_address),
        ReferralService.getUserReferrals(user.wallet_address),
        ReferralService.getReferralRewards(user.wallet_address),
        ReferralService.getReferralLeaderboard(10)
      ]);

      console.log('🔗 useReferrals: Fetched data:', {
        stats,
        userReferrals: userReferrals?.length || 0,
        rewardHistory: rewardHistory?.length || 0,
        topReferrers: topReferrers?.length || 0
      });

      setReferralStats(stats);
      setReferrals(userReferrals);
      setRewards(rewardHistory);
      setLeaderboard(topReferrers);
      
      // Calculate total IDA earned from referrals for display
      const totalReferralEarnings = rewardHistory.reduce((sum, reward) => {
        return sum + reward.reward_amount;
      }, 0);
    } catch (err) {
      console.error('Error loading referral data:', err);
      // Don't show error to user, just log it
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getReferralLink = () => {
    if (!referralStats?.referral_code) return '';
    return ReferralService.generateReferralLink(String(referralStats.referral_code));
  };

  const copyReferralLink = async () => {
    const link = getReferralLink();
    if (link) {
      try {
        await navigator.clipboard.writeText(link);
        return true;
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
      }
    }
    return false;
  };

  const shareReferralLink = async () => {
    const link = getReferralLink();
    if (link && navigator.share) {
      try {
        await navigator.share({
          title: 'Join IDEA Platform',
          text: 'Join me on IDEA Platform and start earning IDA tokens!',
          url: link,
        });
        return true;
      } catch (error) {
        if (error instanceof Error && !error.message.includes('Permission denied')) {
          console.error('Failed to share:', error);
        }
        return false;
      }
    }
    return false;
  };

  const formatTime = (dateString: string) => {
    return new Date(String(dateString)).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCoins = (amount: number) => {
    const numAmount = Number(amount) || 0;
    if (numAmount >= 1000000) {
      return (numAmount / 1000000).toFixed(1) + 'M';
    } else if (numAmount >= 1000) {
      return (numAmount / 1000).toFixed(1) + 'K';
    } else {
      return String(Math.round(numAmount * 100) / 100);
    }
  };

  return {
    referralStats,
    referrals,
    rewards,
    leaderboard,
    isLoading,
    error,
    getReferralLink,
    copyReferralLink,
    shareReferralLink,
    refreshData: loadReferralData,
    formatTime,
    formatCoins,
    rewardAmounts: ReferralService.getRewardAmounts()
  };
};

// Hook for admin task management
export const useAdminTasks = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTasks, setAdminTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStatistics>({
    totalTasks: 0,
    activeTasks: 0,
    totalCompletions: 0,
    totalRewardsDistributed: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.wallet_address) {
      checkAdminStatus();
    }
  }, [user?.wallet_address]);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user?.wallet_address) {
      setIsAdmin(false);
      return;
    }

    try {
      const adminStatus = await TaskService.isAdmin(user.wallet_address);
      setIsAdmin(adminStatus);
    } catch (err) {
      setIsAdmin(false);
    }
  };

  const loadAdminData = async () => {
    if (!isAdmin) return;

    setIsLoading(true);
    setError(null);

    try {
      const [tasks, stats] = await Promise.all([
        TaskService.getAllTasksAdmin(),
        TaskService.getTaskStatistics()
      ]);

      setAdminTasks(tasks);
      setTaskStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    setIsLoading(true);
    setError(null);

    try {
      const newTask = await TaskService.createTask(taskData);
      if (newTask) {
        await loadAdminData();
        return newTask;
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedTask = await TaskService.updateTask(taskId, updates);
      if (updatedTask) {
        await loadAdminData();
        return updatedTask;
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await TaskService.deleteTask(taskId);
      if (success) {
        await loadAdminData();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isAdmin,
    adminTasks,
    taskStats,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refreshData: loadAdminData
  };
};