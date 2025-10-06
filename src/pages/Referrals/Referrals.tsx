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
  orderBy,
  doc,
  getDoc
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

      let referralStats = [];

      try {
        // Try with index-required query first
        const q = query(
          collection(db, 'gameStats'),
          where('referredBy', '==', gameStats.referralCode),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        referralStats = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (indexError: any) {
        // Fallback: query without orderBy if index not ready
        console.log('Using fallback query for referrals (index not ready)');
        const fallbackQuery = query(
          collection(db, 'gameStats'),
          where('referredBy', '==', gameStats.referralCode)
        );

        const querySnapshot = await getDocs(fallbackQuery);
        referralStats = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a: any, b: any) => {
          // Manual sorting by createdAt
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
      }

      // Get user data for each referral
      const referralsWithUsers = await Promise.all(
        referralStats.map(async (stats: any) => {
          const userDoc = doc(db, 'users', stats.id);
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
      <div className="page-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-400 mx-auto"></div>
          <div className="text-xl text-primary-600 font-bold font-inter">Loading Friends...</div>
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
              Friends Program
            </h1>
            <p className="text-gray-700 text-lg font-inter">
              Invite friends and earn bonus food points from their pet care activities
            </p>
          </div>

          {/* Referral Stats */}
          <div className="cute-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="stat-card">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="text-primary-400" size={20} />
                  <span className="text-gray-700 font-medium font-inter">Total Friends</span>
                </div>
                <div className="stat-value">
                  {gameStats?.totalReferrals || 0}
                </div>
              </div>
              <div className="stat-card">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gift className="text-success" size={20} />
                  <span className="text-gray-700 font-medium font-inter">Earnings</span>
                </div>
                <div className="stat-value text-success">
                  {gameStats?.referralEarnings?.toLocaleString() || 0}
                </div>
              </div>
              <div className="stat-card">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="text-accent-500" size={20} />
                  <span className="text-gray-700 font-medium font-inter">Current Tier</span>
                </div>
                <div className="text-lg font-inter font-bold text-accent-600">
                  {currentTier ? `${currentTier.icon} ${currentTier.title}` : '🌟 Beginner'}
                </div>
              </div>
              <div className="stat-card">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="text-warning" size={20} />
                  <span className="text-gray-700 font-medium font-inter">Next Tier</span>
                </div>
                <div className="text-lg font-inter font-bold text-warning">
                  {nextTier ? `${nextTier.icon} ${nextTier.title}` : '🏆 Max Level'}
                </div>
              </div>
            </div>
          </div>

          {/* Referral Link */}
          <div className="cute-card p-6">
            <h2 className="text-2xl font-inter font-bold text-gray-800 mb-4">
              Your Friend Invitation Link
            </h2>
            <div className="flex gap-3">
              <div className="flex-1 bg-primary-100 rounded-lg p-3 border border-primary-300">
                <div className="text-gray-700 text-sm mb-1 font-inter">Friend Code</div>
                <div className="text-gray-800 font-inter font-bold text-lg">
                  {gameStats?.referralCode || 'Loading...'}
                </div>
              </div>
              <Button
                onClick={copyReferralLink}
                className={`px-6 py-3 rounded-lg font-inter font-bold transition-all duration-200 ${
                  hasCopied
                    ? 'bg-success text-white'
                    : 'cute-button'
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
            <p className="text-gray-600 text-sm mt-3 font-inter">
              Share this link with friends. You'll earn 10% of their pet care rewards!
            </p>
          </div>

          {/* Referral Tiers */}
          <div className="cute-card p-6">
            <h2 className="text-2xl font-inter font-bold text-gray-800 mb-6">
              Friend Tiers
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
                        ? 'border-primary-400 bg-primary-100'
                        : isUnlocked
                        ? 'border-success bg-green-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="text-center space-y-2">
                      <div className="text-2xl">{tier.icon}</div>
                      <h3 className="font-inter font-bold text-gray-800">
                        {tier.title}
                      </h3>
                      <p className="text-gray-600 text-sm font-inter">
                        {tier.referrals} friends
                      </p>
                      <div className="text-primary-600 font-inter font-bold">
                        +{tier.bonus} 🍖 bonus
                      </div>
                      {isCurrent && (
                        <div className="text-primary-600 text-xs font-medium font-inter">
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
          <div className="cute-card p-6">
            <h2 className="text-2xl font-inter font-bold text-gray-800 mb-6">
              Your Friends
            </h2>
            
            {referrals.length === 0 ? (
              <div className="text-center py-8">
                <Users size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-inter font-bold text-gray-600 mb-2">
                  No Friends Yet
                </h3>
                <p className="text-gray-500 font-inter">
                  Start inviting friends to earn bonus food points!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {referrals.map((referral, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-primary-50 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-inter font-bold">
                        {referral.user?.username?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="text-gray-800 font-medium font-inter">
                          {referral.user?.username || 'Anonymous'}
                        </div>
                        <div className="text-gray-600 text-sm font-inter">
                          Joined {referral.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-primary-600 font-inter font-bold">
                        +{Math.floor((referral.totalMined || 0) * 0.1)} 🍖
                      </div>
                      <div className="text-gray-600 text-sm font-inter">
                        Earned from friend
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