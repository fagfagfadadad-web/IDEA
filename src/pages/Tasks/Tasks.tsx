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
  getDoc,
  setDoc,
  serverTimestamp,
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

      // Sync referral task progress before fetching
      if (user?.id && gameStats?.totalReferrals !== undefined) {
        await GameService.syncReferralTasksProgress(user.id, gameStats.totalReferrals);
      }

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

      let initialProgress = isReferralTask ? 0 : 100;
      let initialStatus = isReferralTask ? 'in_progress' : 'pending_claim';

      if (isReferralTask) {
        const referralCountRequired = task.requirements?.referralCount || task.referralCountRequired || 0;
        const currentTotalReferrals = gameStats?.totalReferrals || 0;

        if (referralCountRequired > 0) {
          initialProgress = Math.min(Math.floor((currentTotalReferrals / referralCountRequired) * 100), 100);

          if (currentTotalReferrals >= referralCountRequired) {
            initialStatus = 'pending_claim';
            initialProgress = 100;
            console.log(`✅ Task already completed! User has ${currentTotalReferrals}/${referralCountRequired} friends`);
          } else {
            console.log(`📊 Task started with progress: ${currentTotalReferrals}/${referralCountRequired} friends (${initialProgress}%)`);
          }
        }
      }

      await addDoc(collection(db, 'userTasks'), {
        taskId,
        userId: user?.id,
        status: initialStatus,
        progress: initialProgress,
        createdAt: serverTimestamp()
      });

      if (isReferralTask && initialStatus === 'pending_claim') {
        success('Task completed! You can claim your reward now!');
      } else if (isReferralTask) {
        success('Task started! Invite friends to earn rewards!');
      } else {
        success('Task ready to claim!');
      }

      fetchTasks();
    } catch (err) {
      console.error('Error starting task:', err);
      error('Failed to start task');
    }
  };

  const completeTask = async (userTaskId: string, rewardAmount: number, ticketReward?: number, proofUrl?: string, taskToValidate?: TaskWithProgress) => {
    try {
      if (!user?.id) {
        console.error('❌ No user ID found');
        return;
      }

      console.log('🎯 Completing task:', {
        userTaskId,
        rewardAmount,
        ticketReward,
        userId: user.id,
        proofUrl
      });

      // Validate referral task requirements before claiming
      if (taskToValidate && taskToValidate.taskType === 'referral') {
        const referralCountRequired = taskToValidate.requirements?.referralCount || taskToValidate.referralCountRequired || 0;
        const currentTotalReferrals = gameStats?.totalReferrals || 0;

        if (currentTotalReferrals < referralCountRequired) {
          const remaining = referralCountRequired - currentTotalReferrals;
          error(`You need ${remaining} more friend${remaining > 1 ? 's' : ''}! Currently ${currentTotalReferrals}/${referralCountRequired} friends invited.`);
          console.error(`❌ Validation failed: ${currentTotalReferrals}/${referralCountRequired} friends`);
          return;
        }

        console.log(`✅ Validation passed: ${currentTotalReferrals}/${referralCountRequired} friends`);
      }

      // Mark task as completed
      const userTaskRef = doc(db, 'userTasks', userTaskId);
      const taskUpdateData: any = {
        status: 'completed',
        progress: 100,
        completedAt: serverTimestamp()
      };
      if (proofUrl) {
        taskUpdateData.proofUrl = proofUrl;
      }
      await updateDoc(userTaskRef, taskUpdateData);
      console.log('📝 Task updated');

      // Award Food tokens and tickets - check if gameStats exists first
      const statsRef = doc(db, 'gameStats', user.id);
      const statsSnap = await getDoc(statsRef);

      const updateData: any = {
        zenBalance: increment(rewardAmount),
        updatedAt: serverTimestamp()
      };

      if (ticketReward && ticketReward > 0) {
        updateData.gameTickets = increment(ticketReward);
      }

      if (statsSnap.exists()) {
        // Update existing document
        await updateDoc(statsRef, updateData);
        console.log('💰 zenBalance incremented:', rewardAmount);
        if (ticketReward) {
          console.log('🎫 gameTickets incremented:', ticketReward);
        }
      } else {
        // Create new document with starting balance
        await setDoc(statsRef, {
          userId: user.id,
          zenBalance: 1000 + rewardAmount,
          gameTickets: 5 + (ticketReward || 0),
          totalMined: 0,
          miningLevel: 1,
          experience: 0,
          referralCode: '',
          totalReferrals: 0,
          referralEarnings: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log('💰 Created new gameStats with balance:', 1000 + rewardAmount);
      }

      console.log('✅ Task completed successfully');

      let rewardMessage = `Task completed! Earned ${rewardAmount} food points`;
      if (ticketReward && ticketReward > 0) {
        rewardMessage += ` and ${ticketReward} game tickets!`;
      } else {
        rewardMessage += '!';
      }
      success(rewardMessage);

      // Refresh game context to show updated balance
      if (window.location) {
        window.location.reload();
      }
    } catch (err) {
      console.error('❌ Error completing task:', err);
      error('Failed to complete task');
    }
  };

  const claimTask = async (task: TaskWithProgress) => {
    const userTask = task.userTask;
    if (!userTask) return;

    // If task doesn't require proof, claim immediately
    if (!task.requiresProof || task.proofType === 'none' || task.taskType === 'referral') {
      await completeTask(userTask.id, task.rewardAmount, task.ticketReward, undefined, task);
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

    await completeTask(userTask.id, currentClaimTask.rewardAmount, currentClaimTask.ticketReward, proofUrl, currentClaimTask);
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
                  const isReferralTask = task.taskType === 'referral';

                  let canClaim = userTask?.status === 'pending_claim' || (userTask?.status === 'in_progress' && userTask.progress >= 100);

                  // Extra validation for referral tasks
                  if (canClaim && isReferralTask) {
                    const referralCountRequired = task.requirements?.referralCount || task.referralCountRequired || 0;
                    const currentTotalReferrals = gameStats?.totalReferrals || 0;
                    canClaim = currentTotalReferrals >= referralCountRequired;
                  }
                  
                  return (
                    <div
                      key={task.id}
                      className={`overflow-hidden rounded-2xl transition-all duration-300 hover:transform hover:scale-105 shadow-lg ${
                        userTask?.status === 'completed'
                          ? 'ring-2 ring-green-500'
                          : userTask?.status === 'in_progress'
                          ? 'ring-2 ring-purple-500'
                          : ''
                      }`}
                    >
                      {/* Banner Image */}
                      {task.bannerImage && (
                        <div className="w-full h-48 overflow-hidden bg-gradient-to-br from-[#f97316] to-[#fb923c]">
                          <img
                            src={task.bannerImage}
                            alt={task.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="bg-gradient-to-br from-[#f97316] to-[#fb923c] p-6 space-y-4">
                        {/* Task Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-inter font-bold text-white">
                              {task.title}
                            </h3>
                            <p className="text-white/80 text-sm capitalize font-inter">
                              {task.taskType} Task
                            </p>
                          </div>
                          <div className={`text-sm font-medium text-white`}>
                            {userTask?.status === 'completed' && <CheckCircle size={16} />}
                            {userTask?.status === 'in_progress' && <Clock size={16} />}
                          </div>
                        </div>

                        {/* Task Description */}
                        <p className="text-white text-sm leading-relaxed font-inter">
                          {task.description}
                        </p>

                        {/* Reference Link */}
                        {task.referenceLink && (
                          <div className="mb-3">
                            <a
                              href={task.referenceLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-white hover:text-white/80 text-sm font-medium transition-colors duration-200 font-inter"
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
                              <span className="text-white/80 text-sm font-inter">Friends Invited</span>
                              <span className="text-white text-sm font-inter font-bold">
                                {Math.floor((userTask.progress / 100) * (task.requirements?.referralCount || task.referralCountRequired || 0))}/{task.requirements?.referralCount || task.referralCountRequired || 0} ({userTask.progress}%)
                              </span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-white transition-all duration-300"
                                style={{ width: `${userTask.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Status indicator for pending claim */}
                        {userTask?.status === 'pending_claim' && (
                          <div className="p-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg">
                            <div className="flex items-center gap-2 text-white text-sm font-inter">
                              <Clock size={16} />
                              <span>Ready to claim reward!</span>
                            </div>
                          </div>
                        )}

                        {/* Reward and Action */}
                        <div className="flex justify-between items-center pt-2">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-white font-inter font-bold">
                              <span>🍖</span>
                              +{task.rewardAmount} Food
                            </div>
                            {task.ticketReward && task.ticketReward > 0 && (
                              <div className="flex items-center gap-1 text-white font-inter font-bold">
                                <span>🎫</span>
                                +{task.ticketReward} Tickets
                              </div>
                            )}
                          </div>

                          {!userTask && (
                            <Button
                              onClick={() => startTask(task.id!, task)}
                              className="bg-[#7C3AED] hover:bg-[#6b21a8] text-white px-4 py-2 rounded-lg font-inter font-bold"
                            >
                              Start
                            </Button>
                          )}

                          {canClaim && (
                            <Button
                              onClick={() => claimTask(task)}
                              className="bg-[#7C3AED] hover:bg-[#6b21a8] text-white px-4 py-2 rounded-lg font-inter font-bold flex items-center gap-2"
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
                            <div className="flex items-center gap-1 text-white/80 text-sm font-inter">
                              <Clock size={16} />
                              In Progress
                            </div>
                          )}

                          {userTask?.status === 'completed' && (
                            <div className="flex items-center gap-1 text-white font-medium font-inter">
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
        <div className="fixed inset-0 bg-black/50 flex items-start md:items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="cute-card p-6 max-w-md w-full my-4 md:my-0 mb-24 md:mb-0">
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
              <div className="p-4 bg-gradient-to-br from-[#f97316] to-[#fb923c] border border-[#f97316] rounded-lg">
                <h4 className="font-inter font-bold text-white mb-2">
                  {currentClaimTask.title}
                </h4>
                <p className="text-sm text-white font-inter">
                  {currentClaimTask.description}
                </p>
                <div className="flex flex-col gap-1 mt-3">
                  <div className="flex items-center gap-1 text-white font-inter font-bold">
                    <span>🍖</span>
                    +{currentClaimTask.rewardAmount} Food Reward
                  </div>
                  {currentClaimTask.ticketReward && currentClaimTask.ticketReward > 0 && (
                    <div className="flex items-center gap-1 text-white font-inter font-bold">
                      <span>🎫</span>
                      +{currentClaimTask.ticketReward} Ticket Reward
                    </div>
                  )}
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
                    <Upload size={16} className="text-[#f97316]" />
                  ) : (
                    <LinkIcon size={16} className="text-[#f97316]" />
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
                  className="w-full px-4 py-3 text-sm text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] font-inter placeholder:text-gray-500"
                  placeholder="https://..."
                  autoFocus
                  style={{ color: '#111827' }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => {
                    setShowProofModal(false);
                    setProofUrl('');
                    setCurrentClaimTask(null);
                  }}
                  className="bg-[#7C3AED] hover:bg-[#6b21a8] text-white px-4 py-3 rounded-lg font-inter font-bold flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleProofSubmit}
                  className="bg-[#7C3AED] hover:bg-[#6b21a8] text-white px-4 py-3 rounded-lg font-inter font-bold flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
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