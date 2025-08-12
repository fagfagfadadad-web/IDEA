import React, { useState, useRef } from 'react';
import { 
  Gift, 
  Users, 
  CheckSquare, 
  Clock, 
  Award, 
  Star, 
  TrendingUp, 
  ExternalLink, 
  Twitter, 
  MessageCircle,
  Copy,
  Share,
  Trophy,
  Plus,
  X,
  Upload,
  FileText,
  Link as LinkIcon,
  Settings
} from 'lucide-react';
import { Button } from 'components';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useTasks, useReferrals, useAdminTasks } from '../../hooks/useRewards';
import { ReferralService } from '../../services/referralService';
import { Task, UserRewardTask } from '../../types/rewards.types';
import { useNavigate } from 'react-router-dom';

export const RewardsHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const { uploadFile } = useFileUpload();
  
  // Tasks hook
  const { 
    userTasks, 
    isLoading: tasksLoading, 
    error: tasksError, 
    completeTask, 
    claimReward, 
    taskStats 
  } = useTasks();

  // Referrals hook
  const {
    referralStats,
    referrals,
    rewards,
    leaderboard,
    isLoading: referralsLoading,
    error: referralsError,
    getReferralLink,
    copyReferralLink,
    shareReferralLink,
    formatTime,
    formatCoins,
    rewardAmounts
  } = useReferrals() || {};

  // Admin hook
  const { isAdmin } = useAdminTasks();

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [clickedExternalLinks, setClickedExternalLinks] = useState<Set<string>>(new Set());
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedTaskForProof, setSelectedTaskForProof] = useState<UserRewardTask | null>(null);
  const [proofData, setProofData] = useState<{
    file?: File;
    url?: string;
    text?: string;
  }>({});
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  // Triple-click admin access
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTitleClick = () => {
    setClickCount(prev => prev + 1);
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    clickTimeoutRef.current = setTimeout(() => {
      setClickCount(0);
    }, 1000);
    
    if (clickCount + 1 >= 3) {
      setClickCount(0);
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      
      if (isAdmin) {
        navigate('/admin');
        showSuccessToast('Opening admin panel...');
      } else {
        showErrorToast('Admin access denied');
      }
    }
  };

  const handleExternalLinkClick = (taskId: string, url: string) => {
    setClickedExternalLinks(prev => new Set(prev).add(taskId));
    window.open(url, '_blank');
  };

  const handleOpenProofModal = (userRewardTask: UserRewardTask) => {
    setSelectedTaskForProof(userRewardTask);
    setShowProofModal(true);
  };

  const handleProofSubmission = async () => {
    if (!selectedTaskForProof) return;
    
    setIsSubmittingProof(true);
    
    try {
      let proofUrl = proofData.url;
      
      // Handle file upload if needed
      if (proofData.file && selectedTaskForProof.task?.proof_required_type === 'file') {
        proofUrl = await uploadFile(proofData.file, 'task-proofs', 'proofs');
      }
      
      // Complete task with proof
      await completeTask(selectedTaskForProof.task_id, proofUrl, proofData.text);
      
      showSuccessToast('Proof submitted and task completed!');
      
      // Close modal and reset state
      setShowProofModal(false);
      setSelectedTaskForProof(null);
      setProofData({});
    } catch (error) {
      showErrorToast('Failed to submit proof. Please try again.');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
      showSuccessToast('Task completed! You can now claim your reward.');
    } catch (error) {
      showErrorToast('Failed to complete task');
    }
  };

  const handleClaimReward = async (taskId: string, rewardAmount: number) => {
    try {
      const result = await claimReward(taskId);
      if (result) {
        let message = `You received ${rewardAmount.toLocaleString()} IDA tokens!`;
        
        if (result.xpGained && result.xpGained > 0) {
          message += ` +${result.xpGained} XP`;
        }
        
        if (result.newLevel) {
          message += ` 🎉 Level up to ${result.newLevel}!`;
        }
        
        showSuccessToast(message);
      }
    } catch (error) {
      showErrorToast('Failed to claim reward');
    }
  };

  const handleCopyReferralLink = async () => {
    const success = await copyReferralLink();
    if (success) {
      showSuccessToast('Referral link copied to clipboard!');
    } else {
      showErrorToast('Failed to copy link');
    }
  };

  const handleShareReferralLink = async () => {
    const success = await shareReferralLink();
    if (!success) {
      // Fallback to copy
      handleCopyReferralLink();
    }
  };

  // Helper functions
  const canSubmitProof = (userRewardTask: UserRewardTask) => {
    return userRewardTask.task?.proof_required_type !== 'none' && 
           userRewardTask.task?.proof_required_type !== undefined &&
           userRewardTask.status === 'available';
  };

  const canCompleteTask = (userRewardTask: UserRewardTask) => {
    if (!userRewardTask.task) return false;
    return userRewardTask.status === 'available' && userRewardTask.task.task_type === 'manual';
  };

  const canClaimReward = (userRewardTask: UserRewardTask) => {
    return userRewardTask.status === 'completed';
  };

  const isExternalTask = (taskType: string) => {
    return ['social_follow', 'social_post', 'social_retweet', 'social_like', 'external_link'].includes(taskType);
  };

  const getExternalLinkIcon = (taskType: string) => {
    switch (taskType) {
      case 'social_follow':
      case 'social_retweet':
      case 'social_like':
        return Twitter;
      case 'social_post':
        return MessageCircle;
      case 'external_link':
        return ExternalLink;
      default:
        return ExternalLink;
    }
  };

  const getExternalLinkText = (taskType: string) => {
    switch (taskType) {
      case 'social_follow':
        return 'Follow';
      case 'social_post':
        return 'Create Post';
      case 'social_retweet':
        return 'Retweet';
      case 'social_like':
        return 'Like Post';
      case 'external_link':
        return 'Visit Link';
      default:
        return 'Open Link';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'claimed': return 'purple';
      case 'in_progress': return 'yellow';
      default: return 'blue';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckSquare;
      case 'claimed': return Award;
      case 'in_progress': return Clock;
      default: return Star;
    }
  };

  const tabs = [
    { id: 0, label: 'Tasks', icon: <CheckSquare size={20} /> },
    { id: 1, label: 'Referrals', icon: <Users size={20} /> }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="gradient-card p-8">
            <div className="text-center">
              <Gift size={48} className="text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
              <p className="text-gray-600 mb-6">
                Connect your wallet to access the Rewards Hub and start earning IDA tokens
              </p>
              <Button
                onClick={() => navigate('/unlock')}
                variant="gradient"
                size="lg"
              >
                Connect Wallet
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="gradient-card p-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <Gift size={32} className="text-white" />
                </div>
                <h1 
                  className="text-3xl font-bold gradient-text cursor-pointer select-none hover:opacity-80 transition-opacity"
                  onClick={handleTitleClick}
                >
                  Rewards Hub
                </h1>
              </div>
              <p className="text-gray-600">
                Complete tasks and invite friends to earn IDA tokens for the upcoming airdrop
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="gradient-card overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-8">
              {/* Tasks Tab */}
              {activeTab === 0 && (
                <div className="space-y-6">
                  {/* Task Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckSquare size={20} className="text-green-600" />
                        <span className="text-green-800 font-medium">Completed</span>
                      </div>
                      <p className="text-green-800 text-2xl font-bold">{taskStats.claimed}</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Star size={20} className="text-blue-600" />
                        <span className="text-blue-800 font-medium">Available</span>
                      </div>
                      <p className="text-blue-800 text-2xl font-bold">{taskStats.available}</p>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 p-6 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Award size={20} className="text-purple-600" />
                        <span className="text-purple-800 font-medium">IDA Earned</span>
                      </div>
                      <p className="text-purple-800 text-2xl font-bold">{formatCoins(taskStats.totalRewards)}</p>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <TrendingUp size={20} className="text-orange-600" />
                        <span className="text-orange-800 font-medium">Total Tasks</span>
                      </div>
                      <p className="text-orange-800 text-2xl font-bold">{taskStats.total}</p>
                    </div>
                  </div>

                  {/* Tasks List */}
                  {tasksLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="space-y-4 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="text-gray-700">Loading tasks...</p>
                      </div>
                    </div>
                  ) : tasksError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700">{tasksError}</p>
                    </div>
                  ) : userTasks.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckSquare size={48} className="text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No tasks available</h3>
                      <p className="text-gray-600">Check back later for new tasks to complete</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userTasks.map((userTask) => {
                        if (!userTask.task) return null;
                        
                        const StatusIcon = getStatusIcon(userTask.status);
                        const statusColor = getStatusColor(userTask.status);
                        
                        return (
                          <div
                            key={userTask.id}
                            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                          >
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                              <div className="flex items-start gap-4 flex-1">
                                <div className={`p-3 rounded-lg ${
                                  statusColor === 'green' ? 'bg-green-100 text-green-600' :
                                  statusColor === 'purple' ? 'bg-purple-100 text-purple-600' :
                                  statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-blue-100 text-blue-600'
                                }`}>
                                  <StatusIcon size={20} />
                                </div>
                                
                                <div className="flex-1">
                                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                                    {userTask.task.title}
                                  </h3>
                                  <p className="text-gray-600 mb-3">
                                    {userTask.task.description}
                                  </p>
                                  
                                  <div className="flex gap-2 flex-wrap">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      statusColor === 'green' ? 'bg-green-100 text-green-800' :
                                      statusColor === 'purple' ? 'bg-purple-100 text-purple-800' :
                                      statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {userTask.status.replace('_', ' ').charAt(0).toUpperCase() + userTask.status.replace('_', ' ').slice(1)}
                                    </span>
                                    
                                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                      {userTask.task.reward_amount.toLocaleString()} IDA
                                    </span>
                                    
                                    {userTask.task.xp_reward > 0 && (
                                      <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                                        +{userTask.task.xp_reward} XP
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-2 w-full md:w-auto">
                                {/* External Link Button */}
                                {userTask.task && isExternalTask(userTask.task.task_type) && userTask.task.required_value && userTask.status === 'available' && (
                                  <div className="space-y-2">
                                    <Button
                                      onClick={() => handleExternalLinkClick(userTask.task_id, userTask.task?.required_value || '')}
                                      className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                                    >
                                      {React.createElement(getExternalLinkIcon(userTask.task.task_type), { size: 16 })}
                                      {getExternalLinkText(userTask.task.task_type)}
                                      <ExternalLink size={14} />
                                    </Button>
                                    {clickedExternalLinks.has(userTask.task_id) && (
                                      <Button
                                        onClick={() => handleCompleteTask(userTask.task_id)}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                                        disabled={tasksLoading}
                                      >
                                        <CheckSquare size={16} />
                                        Mark as Completed
                                      </Button>
                                    )}
                                  </div>
                                )}
                                
                                {/* Proof Submission Button */}
                                {canSubmitProof(userTask) && (
                                  <Button
                                    onClick={() => handleOpenProofModal(userTask)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                                  >
                                    <Upload size={16} />
                                    Submit Proof
                                  </Button>
                                )}
                                
                                {/* Complete Task Button */}
                                {canCompleteTask(userTask) && !isExternalTask(userTask.task?.task_type || '') && (
                                  <Button
                                    onClick={() => handleCompleteTask(userTask.task_id)}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                                    disabled={tasksLoading}
                                  >
                                    <CheckSquare size={16} />
                                    Complete
                                  </Button>
                                )}
                                
                                {/* Claim Reward Button */}
                                {canClaimReward(userTask) && (
                                  <Button
                                    onClick={() => handleClaimReward(userTask.task_id, userTask.task?.reward_amount || 0)}
                                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 animate-pulse"
                                    disabled={tasksLoading}
                                  >
                                    <Gift size={16} />
                                    Claim Reward
                                  </Button>
                                )}
                                
                                {/* Claimed Badge */}
                                {userTask.status === 'claimed' && (
                                  <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg text-center font-medium">
                                    ✓ Claimed
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
              )}

              {/* Referrals Tab */}
              {activeTab === 1 && (
                <div className="space-y-6">
                  {/* Referral Statistics */}
                  {referralStats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                          <Users size={20} className="text-green-600" />
                          <span className="text-green-800 font-medium">Total Friends</span>
                        </div>
                        <p className="text-green-800 text-2xl font-bold">{referralStats.total_referrals}</p>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                          <TrendingUp size={20} className="text-blue-600" />
                          <span className="text-blue-800 font-medium">Active Friends</span>
                        </div>
                        <p className="text-blue-800 text-2xl font-bold">{referralStats.active_referrals}</p>
                      </div>

                      <div className="bg-purple-50 border border-purple-200 p-6 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                          <Award size={20} className="text-purple-600" />
                          <span className="text-purple-800 font-medium">IDA Earned</span>
                        </div>
                        <p className="text-purple-800 text-2xl font-bold">{formatCoins(referralStats.total_referral_earnings)}</p>
                      </div>

                      <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                          <Gift size={20} className="text-orange-600" />
                          <span className="text-orange-800 font-medium">Your Code</span>
                        </div>
                        <p className="text-orange-800 text-xl font-bold">{referralStats.referral_code}</p>
                      </div>
                    </div>
                  )}

                  {/* Referral Link */}
                  {referralStats && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Your Referral Link</h3>
                      <div className="flex gap-3">
                        <input
                          value={getReferralLink()}
                          readOnly
                          className="flex-1 p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 text-sm"
                        />
                        <Button
                          onClick={handleCopyReferralLink}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center gap-2"
                        >
                          <Copy size={16} />
                          Copy
                        </Button>
                      </div>
                      <Button
                        onClick={handleShareReferralLink}
                        className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2"
                      >
                        <Share size={16} />
                        Share Link
                      </Button>
                    </div>
                  )}

                  {/* Rewards Info */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Referral Rewards</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">👋 Friend joins (both get)</span>
                          <span className="text-green-600 font-bold">+{rewardAmounts.signup} IDA</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">💸 First task completed</span>
                          <span className="text-green-600 font-bold">+{rewardAmounts.first_transaction} IDA</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">🎯 Friend reaches 100 IDA</span>
                          <span className="text-green-600 font-bold">+{rewardAmounts.milestone_100} IDA</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">🚀 Friend reaches 1,000 IDA</span>
                          <span className="text-green-600 font-bold">+{rewardAmounts.milestone_1000} IDA</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">💎 Friend reaches 10,000 IDA</span>
                          <span className="text-green-600 font-bold">+{rewardAmounts.milestone_10000} IDA</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Your Referrals */}
                  {referrals.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Your Referrals ({referrals.length})
                      </h3>
                      <div className="space-y-3">
                        {referrals.slice(0, 5).map((referral) => (
                          <div
                            key={referral.id}
                            className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                                {referral.referred_user?.username?.charAt(0)?.toUpperCase() || 
                                 referral.referred_user?.wallet_address?.charAt(4)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">
                                  {referral.referred_user?.username || 
                                   `${referral.referred_user?.wallet_address.slice(0, 8)}...${referral.referred_user?.wallet_address.slice(-6)}`}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    referral.status === 'active' ? 'bg-green-100 text-green-800' :
                                    referral.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {referral.status}
                                  </span>
                                  <span className="text-gray-500 text-xs">
                                    {formatTime(referral.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-green-600 font-bold">
                                +{formatCoins(referral.rewards_earned)} IDA
                              </p>
                              <p className="text-gray-500 text-xs">Earned</p>
                            </div>
                          </div>
                        ))}
                        
                        {referrals.length > 5 && (
                          <p className="text-gray-500 text-sm text-center">
                            ... and {referrals.length - 5} more friends
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recent Rewards */}
                  {rewards.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Rewards</h3>
                      <div className="space-y-3">
                        {rewards.slice(0, 5).map((reward) => (
                          <div
                            key={reward.id}
                            className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">
                                {reward.reward_type === 'signup_bonus' ? '👋' :
                                 reward.reward_type === 'gig_creation' ? '💼' :
                                 reward.reward_type === 'order_completion' ? '✅' :
                                 reward.reward_type === 'monthly_bonus' ? '📅' : '🎁'}
                              </span>
                              <div>
                                <p className="font-medium text-gray-800">
                                  {ReferralService.getRewardTypeDescription(reward.reward_type)}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  {formatTime(reward.processed_at || reward.created_at)}
                                </p>
                              </div>
                            </div>
                            <p className="text-purple-600 font-bold">
                              +{formatCoins(reward.reward_amount)} IDA
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Referrers Leaderboard */}
                  {leaderboard.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Top Referrers</h3>
                      <div className="space-y-3">
                        {leaderboard.slice(0, 5).map((user, index) => (
                          <div
                            key={user.user_id}
                            className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {index === 0 && <Trophy className="text-yellow-500" size={16} />}
                                {index === 1 && <Star className="text-gray-400" size={16} />}
                                {index === 2 && <Award className="text-orange-400" size={16} />}
                                <span className="font-bold text-gray-800">#{index + 1}</span>
                              </div>
                              <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                                {user.user?.username?.charAt(0)?.toUpperCase() || 
                                 user.user?.wallet_address?.charAt(4)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">
                                  {user.user?.username || 
                                   `${user.user?.wallet_address.slice(0, 8)}...${user.user?.wallet_address.slice(-6)}`}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  {user.total_referrals} referrals
                                </p>
                              </div>
                            </div>
                            <p className="text-purple-600 font-bold">
                              {formatCoins(user.total_referral_earnings)} IDA
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* How it Works */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">How it Works</h3>
                    <div className="space-y-2">
                      <p className="text-gray-600 text-sm">1. 📋 Share your referral link with friends</p>
                      <p className="text-gray-600 text-sm">2. 👋 They sign up using your link and you both get 1000 IDA tokens!</p>
                      <p className="text-gray-600 text-sm">3. 💸 When they complete their first task, you get 25 IDA tokens</p>
                      <p className="text-gray-600 text-sm">4. 🎯 Earn milestone bonuses as they progress (50-1000 IDA tokens)</p>
                      <p className="text-gray-600 text-sm">5. 🏆 Compete on the leaderboard for top referrer status</p>
                    </div>
                  </div>

                  {/* Empty State for Referrals */}
                  {referralStats && referrals.length === 0 && (
                    <div className="text-center py-12">
                      <Users size={48} className="text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No referrals yet</h3>
                      <p className="text-gray-600 mb-4">
                        Share your referral link to start earning rewards!
                      </p>
                      <Button
                        onClick={handleShareReferralLink}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
                      >
                        <Share size={16} />
                        Share Your Link
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Proof Submission Modal */}
        {showProofModal && selectedTaskForProof && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Submit Proof for Task</h3>
                  <button
                    onClick={() => setShowProofModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2">{selectedTaskForProof.task?.title}</h4>
                    <p className="text-gray-600 text-sm">{selectedTaskForProof.task?.description}</p>
                  </div>

                  {/* File Upload */}
                  {selectedTaskForProof.task?.proof_required_type === 'file' && (
                    <div>
                      <label className="block text-gray-800 text-sm font-medium mb-2">
                        Upload Proof File
                      </label>
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors"
                        onClick={() => document.getElementById('proof-file-input')?.click()}
                      >
                        <input
                          id="proof-file-input"
                          type="file"
                          accept="image/*,.pdf,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setProofData({ ...proofData, file });
                            }
                          }}
                          className="hidden"
                        />
                        {proofData.file ? (
                          <div className="space-y-2">
                            <FileText size={24} className="text-green-600 mx-auto" />
                            <p className="text-green-600 font-medium">{proofData.file.name}</p>
                            <p className="text-gray-500 text-sm">
                              {(proofData.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload size={24} className="text-gray-400 mx-auto" />
                            <p className="text-gray-600">Click to select a file</p>
                            <p className="text-gray-500 text-sm">
                              Supported: Images, PDF, Text files (max 10MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* URL Input */}
                  {selectedTaskForProof.task?.proof_required_type === 'url' && (
                    <div>
                      <label className="block text-gray-800 text-sm font-medium mb-2">
                        Proof URL
                      </label>
                      <input
                        type="url"
                        value={proofData.url || ''}
                        onChange={(e) => setProofData({ ...proofData, url: e.target.value })}
                        placeholder="https://example.com/proof"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}

                  {/* Text Input */}
                  {selectedTaskForProof.task?.proof_required_type === 'text' && (
                    <div>
                      <label className="block text-gray-800 text-sm font-medium mb-2">
                        Your Response
                      </label>
                      <textarea
                        value={proofData.text || ''}
                        onChange={(e) => setProofData({ ...proofData, text: e.target.value })}
                        placeholder="Describe how you completed this task..."
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => setShowProofModal(false)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleProofSubmission}
                      disabled={isSubmittingProof || (
                        selectedTaskForProof.task?.proof_required_type === 'file' && !proofData.file ||
                        selectedTaskForProof.task?.proof_required_type === 'url' && !proofData.url ||
                        selectedTaskForProof.task?.proof_required_type === 'text' && !proofData.text
                      )}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg"
                    >
                      {isSubmittingProof ? 'Submitting...' : 'Submit Proof'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};