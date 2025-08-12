import { supabase } from '../lib/supabase';
import { Task, UserRewardTask, TaskStatistics } from '../types/rewards.types';

export class TaskService {
  // Get all available tasks
  static async getAllTasks(): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  // Get all tasks for admin
  static async getAllTasksAdmin(): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin tasks:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching admin tasks:', error);
      return [];
    }
  }

  // Get user reward tasks with task details
  static async getUserRewardTasks(userId: string): Promise<UserRewardTask[]> {
    try {
      const { data, error } = await supabase
        .from('user_reward_tasks')
        .select('*, task:tasks(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user reward tasks:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching user reward tasks:', error);
      return [];
    }
  }

  // Initialize user reward tasks when user first connects
  static async initializeUserRewardTasks(userId: string): Promise<void> {
    try {
      // Get all active tasks
      const tasks = await this.getAllTasks();
      if (tasks.length === 0) return;
      
      // Check which tasks user already has
      const { data: existingUserRewardTasks } = await supabase
        .from('user_reward_tasks')
        .select('task_id')
        .eq('user_id', userId);

      const existingTaskIds = new Set(existingUserRewardTasks?.map(ut => ut.task_id) || []);

      // Create user tasks for new tasks
      const newUserRewardTasks = tasks
        .filter(task => !existingTaskIds.has(task.id))
        .map(task => ({
          user_id: userId,
          task_id: task.id,
          status: 'available' as const
        }));

      if (newUserRewardTasks.length > 0) {
        try {
          const { error } = await supabase
            .from('user_reward_tasks')
            .insert(newUserRewardTasks);

          if (error) throw error;
        } catch (insertError: any) {
          // Handle duplicate key constraint violation gracefully
          if (insertError?.code === '23505') {
            console.warn('Some user reward tasks already exist, skipping duplicates');
          } else {
            throw insertError;
          }
        }
      }
    } catch (error) {
      console.error('Error initializing user reward tasks:', error);
      // Don't throw error, just log it
    }
  }

  // Complete a reward task
  static async completeRewardTask(
    userId: string, 
    taskId: string, 
    proofUrl?: string, 
    proofText?: string
  ): Promise<UserRewardTask | null> {
    try {
      const updateData: any = {
        status: 'completed',
        completed_at: new Date().toISOString()
      };

      if (proofUrl) updateData.proof_url = proofUrl;
      if (proofText) updateData.proof_text = proofText;

      const { data, error } = await supabase
        .from('user_reward_tasks')
        .update(updateData)
        .eq('user_id', userId)
        .eq('task_id', taskId)
        .eq('status', 'available')
        .select(`
          *,
          task:tasks(*)
        `)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        console.warn(`Task ${taskId} not found in available status for user ${userId}`);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error completing reward task:', error);
      throw new Error('Failed to complete task');
    }
  }

  // Claim reward task reward
  static async claimRewardTaskReward(userId: string, taskId: string): Promise<{
    success: boolean;
    newBalance?: number;
    xpGained?: number;
    newLevel?: number;
  }> {
    try {
      // Get the completed task
      const { data: userRewardTask, error: taskError } = await supabase
        .from('user_reward_tasks')
        .select(`
          *,
          task:tasks(*)
        `)
        .eq('user_id', userId)
        .eq('task_id', taskId)
        .eq('status', 'completed')
        .single();

      if (taskError || !userRewardTask?.task) {
        throw new Error('Task not found or not completed');
      }

      // Update user task status to claimed
      const { error: updateError } = await supabase
        .from('user_reward_tasks')
        .update({
          status: 'claimed',
          claimed_at: new Date().toISOString()
        })
        .eq('id', userRewardTask.id);

      if (updateError) throw updateError;

      // Add IDA tokens to user balance
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('ida_balance, total_earned, level, xp, wallet_address')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const newIdaBalance = (user.ida_balance || 0) + userRewardTask.task.reward_amount;
      const newTotalEarned = (user.total_earned || 0) + userRewardTask.task.reward_amount;
      const newXp = (user.xp || 0) + userRewardTask.task.xp_reward;
      const newLevel = Math.floor(newXp / 100) + 1;
      const leveledUp = newLevel > (user.level || 1);

      const { error: balanceError } = await supabase
        .from('users')
        .update({
          ida_balance: newIdaBalance,
          total_earned: newTotalEarned,
          xp: newXp,
          level: newLevel
        })
        .eq('id', userId);

      if (balanceError) throw balanceError;

      // Record transaction
      await supabase
        .from('transaction_history')
        .insert({
          from_address: 'system',
          to_address: user.wallet_address,
          token_identifier: 'IDA',
          amount: userRewardTask.task.reward_amount,
          transaction_type: 'reward',
          status: 'success',
          description: `Task reward: ${userRewardTask.task.title}`
        });

      return {
        success: true,
        newBalance: newIdaBalance,
        xpGained: userRewardTask.task.xp_reward,
        newLevel: leveledUp ? newLevel : undefined
      };
    } catch (error) {
      console.error('Error claiming reward task reward:', error);
      throw new Error('Failed to claim reward');
    }
  }

  // Check and complete automatic tasks
  static async checkAndCompleteAutomaticTasks(userId: string, userProfile: any): Promise<void> {
    try {
      const userRewardTasks = await this.getUserRewardTasks(userId);
      
      for (const userRewardTask of userRewardTasks) {
        if (userRewardTask.status !== 'available' || !userRewardTask.task) continue;

        let shouldComplete = false;

        switch (userRewardTask.task.task_type) {
          case 'wallet_connect':
            // Auto-complete if user has connected wallet
            shouldComplete = !!userProfile.wallet_address;
            break;
          
          case 'mining_level':
            // Auto-complete if user reached required level
            const requiredLevel = parseInt(userRewardTask.task.required_value || '1');
            shouldComplete = (userProfile.level || 1) >= requiredLevel;
            break;
          
          // Add more automatic task types as needed
        }

        if (shouldComplete) {
          await this.completeRewardTask(userId, userRewardTask.task_id);
        }
      }
    } catch (error) {
      console.error('Error checking automatic tasks:', error);
    }
  }

  // Check if user is admin
  static async isAdmin(address: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('wallet_address', address)
        .single();

      if (error) return false;
      return data?.is_admin || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Create new task (admin only)
  static async createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }
  }

  // Update task (admin only)
  static async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw new Error('Failed to update task');
    }
  }

  // Delete task (admin only)
  static async deleteTask(taskId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw new Error('Failed to delete task');
    }
  }

  // Get task statistics for admin
  static async getTaskStatistics(): Promise<TaskStatistics> {
    try {
      const [tasksResult, userTasksResult, rewardsResult] = await Promise.all([
        supabase.from('tasks').select('id, is_active').then(r => r.error ? { data: [] } : r),
        supabase.from('user_reward_tasks').select('status').then(r => r.error ? { data: [] } : r),
        supabase.from('user_reward_tasks').select('task:tasks(reward_amount)').eq('status', 'claimed').then(r => r.error ? { data: [] } : r)
      ]);

      const totalTasks = tasksResult.data?.length || 0;
      const activeTasks = tasksResult.data?.filter(t => t.is_active).length || 0;
      const totalCompletions = userTasksResult.data?.filter(ut => ut.status === 'claimed').length || 0;
      const totalRewardsDistributed = rewardsResult.data?.reduce(
        (sum, ut) => sum + (ut.task?.reward_amount || 0), 
        0
      ) || 0;

      return {
        totalTasks,
        activeTasks,
        totalCompletions,
        totalRewardsDistributed
      };
    } catch (error) {
      console.error('Error getting task statistics:', error);
      return {
        totalTasks: 0,
        activeTasks: 0,
        totalCompletions: 0,
        totalRewardsDistributed: 0
      };
    }
  }
}