import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Star, Zap, Target, Trophy, Gift, ExternalLink } from 'lucide-react';
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
        ...doc.data(),
        taskId: doc.data().taskId,
        status: doc.data().status,
        progress: doc.data().progress,
        completedAt: doc.data().completedAt
      }));

      // Combine tasks with user progress
      const tasksWithProgress = activeTasks.map(task => {
        const userTask = userTasks.find(ut => ut.taskId === task.id) as any;
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

      success(`Task completed! Earned ${rewardAmount} food points!`);
      fetchTasks();
    } catch (err) {
      console.error('Error completing task:', err);
      error('Failed to complete task');
    }
  };

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'mining':
        return <Zap className="text-primary-400" size={24} />;
      case 'social':
        return <Star className="text-accent-400" size={24} />;
      case 'referral':
        return <Gift className="text-success" size={24} />;
      default:
        return <Target className="text-warning" size={24} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success';
      case 'in_progress':
        return 'text-primary-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="page-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-400 mx-auto"></div>
          <div className="text-xl text-primary-600 font-bold font-inter">Loading Tasks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg font-inter">
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="title-responsive font-inter font-bold gradient-text">
              PupFi Tasks
            </h1>
            <p className="text-gray-700 text-lg font-inter">
              Complete tasks to earn bonus food points and experience
            </p>
            <div className="flex items-center justify-center gap-2 text-primary-600 font-inter font-bold text-xl">
              <span>🍖</span>
              {gameStats?.zenBalance?.toLocaleString() || 0} Food
            </div>
          </div>

          {/* Tasks Grid */}
          <div className="space-y-6">
            {tasks.length === 0 ? (
              <div className="cute-card p-8 text-center">
                <Target size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-inter font-bold text-gray-600 mb-2">
                  No Tasks Available
                </h3>
                <p className="text-gray-500 font-inter">
                  Check back later for new pet care challenges
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
                      className={`cute-card p-6 transition-all duration-300 hover:transform hover:scale-105 ${
                        userTask?.status === 'completed' 
                          ? 'border-success bg-green-50'
                          : userTask?.status === 'in_progress'
                          ? 'border-primary-400 bg-primary-50'
                          : 'border-gray-300 hover:border-primary-400'
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Task Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-200 rounded-full flex items-center justify-center">
                              {getTaskIcon(task.taskType)}
                            </div>
                            <div>
                              <h3 className="text-lg font-inter font-bold text-gray-800">
                                {task.title}
                              </h3>
                              <p className="text-gray-600 text-sm capitalize font-inter">
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
                        <p className="text-gray-700 text-sm leading-relaxed font-inter">
                          {task.description}
                        </p>

                        {/* Reference Link */}
                        {task.referenceLink && (
                          <div className="mb-3">
                            <a
                              href={task.referenceLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors duration-200 font-inter"
                            >
                              <ExternalLink size={14} />
                              Go to Instructions
                            </a>
                          </div>
                        )}

                        {/* Progress Bar */}
                        {userTask?.status === 'in_progress' && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm font-inter">Progress</span>
                              <span className="text-gray-800 text-sm font-inter">{userTask.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
                                style={{ width: `${userTask.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Reward and Action */}
                        <div className="flex justify-between items-center pt-2">
                          <div className="flex items-center gap-1 text-primary-600 font-inter font-bold">
                            <span>🍖</span>
                            +{task.rewardAmount} Food
                          </div>
                          
                          {!userTask && (
                            <Button
                              onClick={() => startTask(task.id!)}
                              className="cute-button px-4 py-2"
                            >
                              Start
                            </Button>
                          )}
                          
                          {canComplete && (
                            <Button
                              onClick={() => completeTask(userTask.id, task.rewardAmount)}
                              className="bg-success text-white px-4 py-2 rounded-lg font-inter font-bold hover:bg-green-600"
                            >
                              Claim Reward
                            </Button>
                          )}
                          
                          {userTask?.status === 'completed' && (
                            <div className="flex items-center gap-1 text-success font-medium font-inter">
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