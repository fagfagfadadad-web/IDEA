import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, Gift, TrendingUp, Star } from 'lucide-react';
import { Button } from 'components';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const Referrals = () => {
  const { user } = useAuth();
  const { gameStats } = useGame();
  const { success, error } = useToast();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (user?.id && gameStats?.referralCode) {
      fetchReferrals();
    }
  }, [user?.id, gameStats?.referralCode]);

  const fetchReferrals = async () => {
    try {
      setIsLoading(true);
      
      if (!gameStats?.referralCode) return;

      // Get users referred by this user
      const q = query(
        collection(db, 'gameStats'),
        where('referredBy', '==', gameStats.referralCode),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const referralStats = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get user data for each referral
      const referralsWithUsers = await Promise.all(
        referralStats.map(async (stats) => {
         const userDoc = doc(db, 'users', stats.userId);
         const userSnapshot = await getDoc(userDoc);
         const userData = userSnapshot.exists() ? userSnapshot.data() : null;
          
          return {
            ...stats,
            user: userData
          };
        })
      );

      setReferrals(referralsWithUsers);
    } catch (err) {
      console.error('Error fetching referrals:', err);
      error('Failed to load referrals');
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralLink = async () => {
    const referralLink = `${window.location.origin}?ref=${gameStats?.referralCode}`;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setHasCopied(true);
      success('Referral link copied to clipboard!');
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      error('Failed to copy referral link');
    }
  };

  const referralTiers = [
    { referrals: 1, bonus: 50, title: 'Recruiter', icon: '🚀' },
    { referrals: 5, bonus: 100, title: 'Commander', icon: '⭐' },
    { referrals: 10, bonus: 200, title: 'Admiral', icon: '👑' },
    { referrals: 25, bonus: 500, title: 'Fleet Master', icon: '🏆' }
  ];

  const getCurrentTier = () => {
    const totalReferrals = gameStats?.totalReferrals || 0;
    return referralTiers
      .slice()
      .reverse()
      .find(tier => totalReferrals >= tier.referrals) || null;
  };

  const getNextTier = () => {
    const totalReferrals = gameStats?.totalReferrals || 0;
    return referralTiers.find(tier => totalReferrals < tier.referrals) || null;
  };

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div>
          <div className="text-xl text-cyan-400 font-orbitron">Loading Referrals...</div>
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
              Referral Program
            </h1>
            <p className="text-gray-400 text-lg">
              Invite friends and earn bonus ZEN tokens from their mining activities
            </p>
          </div>

          {/* Referral Stats */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-cyan-500/20">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="text-cyan-400" size={20} />
                  <span className="text-gray-400 font-medium">Total Referrals</span>
                </div>
                <div className="text-2xl md:text-3xl font-orbitron font-bold text-cyan-400">
                  {gameStats?.totalReferrals || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gift className="text-green-400" size={20} />
                  <span className="text-gray-400 font-medium">Earnings</span>
                </div>
                <div className="text-2xl md:text-3xl font-orbitron font-bold text-green-400">
                  {gameStats?.referralEarnings?.toLocaleString() || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="text-purple-400" size={20} />
                  <span className="text-gray-400 font-medium">Current Tier</span>
                </div>
                <div className="text-lg font-orbitron font-bold text-purple-400">
                  {currentTier ? `${currentTier.icon} ${currentTier.title}` : '🌟 Beginner'}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="text-orange-400" size={20} />
                  <span className="text-gray-400 font-medium">Next Tier</span>
                </div>
                <div className="text-lg font-orbitron font-bold text-orange-400">
                  {nextTier ? `${nextTier.icon} ${nextTier.title}` : '🏆 Max Level'}
                </div>
              </div>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-cyan-500/20">
            <h2 className="text-2xl font-orbitron font-bold text-white mb-4">
              Your Referral Link
            </h2>
            <div className="flex gap-3">
              <div className="flex-1 bg-slate-700/50 rounded-lg p-3 border border-gray-600">
                <div className="text-gray-400 text-sm mb-1">Referral Code</div>
                <div className="text-white font-orbitron font-bold text-lg">
                  {gameStats?.referralCode || 'Loading...'}
                </div>
              </div>
              <Button
                onClick={copyReferralLink}
                className={`px-6 py-3 rounded-lg font-orbitron font-bold transition-all duration-200 ${
                  hasCopied
                    ? 'bg-green-600 text-white'
                    : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white'
                }`}
              >
                {hasCopied ? (
                  <div className="flex items-center gap-2">
                    <Check size={16} />
                    Copied!
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Copy size={16} />
                    Copy Link
                  </div>
                )}
              </Button>
            </div>
            <p className="text-gray-400 text-sm mt-3">
              Share this link with friends. You'll earn 10% of their mining rewards!
            </p>
          </div>

          {/* Referral Tiers */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-cyan-500/20">
            <h2 className="text-2xl font-orbitron font-bold text-white mb-6">
              Referral Tiers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {referralTiers.map((tier, index) => {
                const isUnlocked = (gameStats?.totalReferrals || 0) >= tier.referrals;
                const isCurrent = currentTier?.referrals === tier.referrals;
                
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      isCurrent
                        ? 'border-cyan-400 bg-cyan-500/10'
                        : isUnlocked
                        ? 'border-green-500/50 bg-green-500/5'
                        : 'border-gray-600 bg-slate-700/30'
                    }`}
                  >
                    <div className="text-center space-y-2">
                      <div className="text-2xl">{tier.icon}</div>
                      <h3 className="font-orbitron font-bold text-white">
                        {tier.title}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {tier.referrals} referrals
                      </p>
                      <div className="text-cyan-400 font-orbitron font-bold">
                        +{tier.bonus} ZEN bonus
                      </div>
                      {isCurrent && (
                        <div className="text-cyan-400 text-xs font-medium">
                          Current Tier
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Referral List */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-cyan-500/20">
            <h2 className="text-2xl font-orbitron font-bold text-white mb-6">
              Your Referrals
            </h2>
            
            {referrals.length === 0 ? (
              <div className="text-center py-8">
                <Users size={48} className="text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-orbitron font-bold text-gray-400 mb-2">
                  No Referrals Yet
                </h3>
                <p className="text-gray-500">
                  Start inviting friends to earn bonus ZEN tokens!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {referrals.map((referral, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-700/30 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center text-white font-orbitron font-bold">
                        {referral.user?.username?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {referral.user?.username || 'Anonymous'}
                        </div>
                        <div className="text-gray-400 text-sm">
                          Joined {referral.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-cyan-400 font-orbitron font-bold">
                        +{Math.floor((referral.totalMined || 0) * 0.1)} ZEN
                      </div>
                      <div className="text-gray-400 text-sm">
                        Earned from referral
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};