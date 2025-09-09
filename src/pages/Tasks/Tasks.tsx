import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Star, Zap, Target, Trophy, Gift } from 'lucide-react';
import { Button } from 'components';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { GameService, Task } from '../../services/gameService';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface TaskWithProgress extends Task {
  userTask?: {
    id: string;
    status: string;
    progress: number;
    completedAt?: any;
  };
}

export const Tasks = () => {
  const { user } = useAuth();
  const { gameStats } = useGame();
  const { success, error } = useToast();
  const [tasks, setTasks] = useState<TaskWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchTasks();
    }
  }, [user?.id]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      
      // Get all active tasks
      const activeTasks = await GameService.getTasks();
      
      // Get user task progress
      const userTasksQuery = query(
        collection(db, 'userTasks'),
        where('userId', '==', user?.id)
      );
      const userTasksSnapshot = await getDocs(userTasksQuery);
      const userTasks = userTasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Combine tasks with user progress
      const tasksWithProgress = activeTasks.map(task => {
        const userTask = userTasks.find(ut => ut.taskId === task.id);
        return {
          ...task,
          userTask
        };
      });

      setTasks(tasksWithProgress);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const startTask = async (taskId: string) => {
    try {
      await addDoc(collection(db, 'userTasks'), {
        taskId,
        userId: user?.id,
        status: 'in_progress',
        progress: 0,
        createdAt: serverTimestamp()
      });

      success('Task started!');
      fetchTasks();
    } catch (err) {
      console.error('Error starting task:', err);
      error('Failed to start task');
    }
  };

  const completeTask = async (userTaskId: string, rewardAmount: number) => {
    try {
      if (!user?.id) return;

      // Mark task as completed
      const userTaskRef = doc(db, 'userTasks', userTaskId);
      await updateDoc(userTaskRef, {
        status: 'completed',
        progress: 100,
        completedAt: serverTimestamp()
      });

      // Award ZEN tokens
      await GameService.updateGameStats(user.id, {
        zenBalance: (gameStats?.zenBalance || 0) + rewardAmount
      });

      success(`Task completed! Earned ${rewardAmount} ZEN tokens!`);
      fetchTasks();
    } catch (err) {
      console.error('Error completing task:', err);
      error('Failed to complete task');
    }
  };

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'mining':
        return <Zap className="text-cyan-400" size={24} />;
      case 'social':
        return <Star className="text-purple-400" size={24} />;
      case 'referral':
        return <Gift className="text-green-400" size={24} />;
      default:
        return <Target className="text-orange-400" size={24} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'in_progress':
        return 'text-cyan-400';
      default:
        return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div>
          <div className="text-xl text-cyan-400 font-orbitron">Loading Tasks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 font-inter">
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-orbitron font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Mission Control
            </h1>
            <p className="text-gray-400 text-lg">
              Complete tasks to earn bonus ZEN tokens and experience
            </p>
            <div className="flex items-center justify-center gap-2 text-cyan-400 font-orbitron font-bold text-xl">
              <Zap size={20} />
              {gameStats?.zenBalance?.toLocaleString() || 0} ZEN
            </div>
          </div>

          {/* Tasks Grid */}
          <div className="space-y-6">
            {tasks.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-8 border border-gray-700/50 text-center">
                <Target size={48} className="text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-orbitron font-bold text-gray-400 mb-2">
                  No Tasks Available
                </h3>
                <p className="text-gray-500">
                  Check back later for new missions and challenges
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.map((task) => {
                  const userTask = task.userTask;
                  const canComplete = userTask?.status === 'in_progress' && userTask.progress >= 100;
                  
                  return (
                    <div
                      key={task.id}
                      className={`bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border transition-all duration-300 hover:transform hover:scale-105 ${
                        userTask?.status === 'completed' 
                          ? 'border-green-500/50 bg-green-500/5'
                          : userTask?.status === 'in_progress'
                          ? 'border-cyan-500/50 bg-cyan-500/5'
                          : 'border-gray-700/50 hover:border-cyan-500/50'
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Task Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                              {getTaskIcon(task.taskType)}
                            </div>
                            <div>
                              <h3 className="text-lg font-orbitron font-bold text-white">
                                {task.title}
                              </h3>
                              <p className="text-gray-400 text-sm capitalize">
                                {task.taskType} Task
                              </p>
                            </div>
                          </div>
                          <div className={`text-sm font-medium ${getStatusColor(userTask?.status || 'not_started')}`}>
                            {userTask?.status === 'completed' && <CheckCircle size={16} />}
                            {userTask?.status === 'in_progress' && <Clock size={16} />}
                          </div>
                        </div>

                        {/* Task Description */}
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {task.description}
                        </p>

                        {/* Progress Bar */}
                        {userTask?.status === 'in_progress' && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 text-sm">Progress</span>
                              <span className="text-white text-sm">{userTask.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                                style={{ width: `${userTask.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Reward and Action */}
                        <div className="flex justify-between items-center pt-2">
                          <div className="flex items-center gap-1 text-cyan-400 font-orbitron font-bold">
                            <Zap size={16} />
                            +{task.rewardAmount} ZEN
                          </div>
                          
                          {!userTask && (
                            <Button
                              onClick={() => startTask(task.id!)}
                              className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-4 py-2 rounded-lg font-orbitron font-bold"
                            >
                              Start
                            </Button>
                          )}
                          
                          {canComplete && (
                            <Button
                              onClick={() => completeTask(userTask.id, task.rewardAmount)}
                              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-orbitron font-bold"
                            >
                              Claim Reward
                            </Button>
                          )}
                          
                          {userTask?.status === 'completed' && (
                            <div className="flex items-center gap-1 text-green-400 font-medium">
                              <CheckCircle size={16} />
                              Completed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};