import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, Clock, Star, Zap, Target, Trophy, Gift, ExternalLink, Upload, Link as LinkIcon, X } from 'lucide-react';
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
  serverTimestamp,
  writeBatch,
  increment
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
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [currentClaimTask, setCurrentClaimTask] = useState<TaskWithProgress | null>(null);

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

  const startTask = async (taskId: string, task: TaskWithProgress) => {
    try {
      const isReferralTask = task.taskType === 'referral';

      await addDoc(collection(db, 'userTasks'), {
        taskId,
        userId: user?.id,
        status: isReferralTask ? 'in_progress' : 'pending_claim',
        progress: isReferralTask ? 0 : 100,
        createdAt: serverTimestamp()
      });

      success(isReferralTask ? 'Task started!' : 'Task ready to claim!');
      fetchTasks();
    } catch (err) {
      console.error('Error starting task:', err);
      error('Failed to start task');
    }
  };

  const completeTask = async (userTaskId: string, rewardAmount: number, proofUrl?: string) => {
    try {
      if (!user?.id) return;

      // Use Firestore batch to ensure both operations succeed together
      const batch = writeBatch(db);

      // Mark task as completed
      const userTaskRef = doc(db, 'userTasks', userTaskId);
      batch.update(userTaskRef, {
        status: 'completed',
        progress: 100,
        proofUrl: proofUrl || undefined,
        completedAt: serverTimestamp()
      });

      // Award Food tokens using increment
      const statsRef = doc(db, 'gameStats', user.id);
      batch.update(statsRef, {
        zenBalance: increment(rewardAmount),
        updatedAt: serverTimestamp()
      });

      await batch.commit();

      success(`Task completed! Earned ${rewardAmount} food points!`);
      fetchTasks();
    } catch (err) {
      console.error('Error completing task:', err);
      error('Failed to complete task');
    }
  };

  const claimTask = async (task: TaskWithProgress) => {
    const userTask = task.userTask;
    if (!userTask) return;

    // If task doesn't require proof, claim immediately
    if (!task.requiresProof || task.proofType === 'none' || task.taskType === 'referral') {
      await completeTask(userTask.id, task.rewardAmount);
      return;
    }

    // If requires proof, show modal
    setCurrentClaimTask(task);
    setProofUrl('');
    setShowProofModal(true);
  };

  const handleProofSubmit = async () => {
    if (!currentClaimTask || !proofUrl.trim()) {
      error('Please enter a valid URL');
      return;
    }

    const userTask = currentClaimTask.userTask;
    if (!userTask) return;

    await completeTask(userTask.id, currentClaimTask.rewardAmount, proofUrl);
    setShowProofModal(false);
    setProofUrl('');
    setCurrentClaimTask(null);
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
                  const canClaim = userTask?.status === 'pending_claim' || (userTask?.status === 'in_progress' && userTask.progress >= 100);
                  const isReferralTask = task.taskType === 'referral';
                  
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

                        {/* Progress Bar - only for referral tasks */}
                        {userTask?.status === 'in_progress' && isReferralTask && (
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

                        {/* Status indicator for pending claim */}
                        {userTask?.status === 'pending_claim' && (
                          <div className="p-3 bg-primary-50 border border-primary-300 rounded-lg">
                            <div className="flex items-center gap-2 text-primary-600 text-sm font-inter">
                              <Clock size={16} />
                              <span>Ready to claim reward!</span>
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
                              onClick={() => startTask(task.id!, task)}
                              className="cute-button px-4 py-2"
                            >
                              Start
                            </Button>
                          )}

                          {canClaim && (
                            <Button
                              onClick={() => claimTask(task)}
                              className="bg-success text-white px-4 py-2 rounded-lg font-inter font-bold hover:bg-green-600 flex items-center gap-2"
                            >
                              {task.requiresProof && task.proofType !== 'none' && (
                                <>
                                  {task.proofType === 'screenshot' ? <Upload size={16} /> : <LinkIcon size={16} />}
                                </>
                              )}
                              Claim Reward
                            </Button>
                          )}

                          {userTask?.status === 'in_progress' && isReferralTask && !canClaim && (
                            <div className="flex items-center gap-1 text-gray-600 text-sm font-inter">
                              <Clock size={16} />
                              In Progress
                            </div>
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

      {/* Proof Modal */}
      {showProofModal && currentClaimTask && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="cute-card p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-inter font-bold text-gray-800">
                Submit Verification
              </h3>
              <button
                onClick={() => {
                  setShowProofModal(false);
                  setProofUrl('');
                  setCurrentClaimTask(null);
                }}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-primary-50 border border-primary-300 rounded-lg">
                <h4 className="font-inter font-bold text-gray-800 mb-2">
                  {currentClaimTask.title}
                </h4>
                <p className="text-sm text-gray-700 font-inter">
                  {currentClaimTask.description}
                </p>
                <div className="flex items-center gap-1 text-primary-600 font-inter font-bold mt-3">
                  <span>🍖</span>
                  +{currentClaimTask.rewardAmount} Food Reward
                </div>
              </div>

              <div>
                <label className="block text-gray-800 text-sm font-medium mb-2 font-inter">
                  {currentClaimTask.proofType === 'screenshot'
                    ? 'Screenshot URL'
                    : 'Verification Link'}
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {currentClaimTask.proofType === 'screenshot' ? (
                    <Upload size={16} className="text-primary-600" />
                  ) : (
                    <LinkIcon size={16} className="text-primary-600" />
                  )}
                  <span className="text-xs text-gray-600 font-inter">
                    {currentClaimTask.proofType === 'screenshot'
                      ? 'Upload your screenshot to imgur.com or similar and paste the URL here'
                      : 'Paste the verification link here'}
                  </span>
                </div>
                <input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-inter"
                  placeholder="https://..."
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => {
                    setShowProofModal(false);
                    setProofUrl('');
                    setCurrentClaimTask(null);
                  }}
                  className="cute-button-outline flex-1 py-3"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleProofSubmit}
                  className="cute-button flex-1 py-3"
                  disabled={!proofUrl.trim()}
                >
                  Submit & Claim
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};