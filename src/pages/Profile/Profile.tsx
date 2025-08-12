import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  ExternalLink, 
  Edit, 
  Star, 
  Briefcase, 
  DollarSign,
  Settings,
  Eye,
  TrendingUp,
  Award,
  Coins,
  RefreshCw,
  Database
} from 'lucide-react';
import { Button, Card, ReviewsList, StarRating, EmailNotificationsToggle } from 'components';
import { TaskManager, CalendarWidget, FinancialOverview, ExternalToolsWidget } from 'components/ProfileDashboard';
import { useGetIsLoggedIn } from 'lib';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useReviewsForProvider } from '../../hooks/useReviews';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';

export const Profile = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  
  const isOwnProfile = !id || (user && id === user.id);
  const profileId = id || user?.id;
  
  const { data: profile, isLoading, error, refetch } = useProfile(isOwnProfile ? undefined : id);
  const { data: reviews, isLoading: reviewsLoading, error: reviewsError } = useReviewsForProvider(profileId || '');
  const updateProfile = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    bio: '',
    email: '',
    twitter_url: '',
    github_url: '',
    linkedin_url: '',
    website_url: ''
  });

  // Debug state for IDA balance
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isDebugging, setIsDebugging] = useState(false);

  // Set active tab from URL params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'settings') setActiveTab(1);
    else if (tab === 'workspace') setActiveTab(2);
    else setActiveTab(0);
  }, [searchParams]);

  // Load profile data into edit form
  useEffect(() => {
    if (profile && isOwnProfile) {
      setEditForm({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        email: profile.email || '',
        twitter_url: profile.twitter_url || '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        website_url: profile.website_url || ''
      });
    }
  }, [profile, isOwnProfile]);

  // Debug function to check IDA balance in database
  const debugIdaBalance = async () => {
    if (!user?.id) return;
    
    setIsDebugging(true);
    try {
      // Check user data directly from database
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('id, username, wallet_address, ida_balance, total_earned, level, xp')
        .eq('id', user.id)
        .single();

      // Check referral stats
      const { data: referralStats, error: referralError } = await supabase
        .from('referral_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Check transaction history
      const { data: transactions, error: txError } = await supabase
        .from('transaction_history')
        .select('*')
        .eq('to_address', user.wallet_address)
        .eq('transaction_type', 'referral')
        .order('timestamp', { ascending: false });

      // Check referral rewards
      const { data: rewards, error: rewardsError } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      setDebugInfo({
        dbUser,
        dbError,
        referralStats,
        referralError,
        transactions,
        txError,
        rewards,
        rewardsError,
        userFromAuth: user,
        profileData: profile
      });

      console.log('🔍 Debug IDA Balance:', {
        dbUser,
        referralStats,
        transactions,
        rewards,
        userFromAuth: user,
        profileData: profile
      });
    } catch (error) {
      console.error('Debug error:', error);
      showErrorToast('Debug failed');
    } finally {
      setIsDebugging(false);
    }
  };

  // Manual IDA balance fix
  const fixIdaBalance = async () => {
    if (!user?.id || !user?.wallet_address) return;
    
    try {
      // Check if user should have IDA balance from referrals
      const { data: rewards } = await supabase
        .from('referral_rewards')
        .select('reward_amount')
        .eq('referrer_id', user.id)
        .eq('status', 'completed');

      const totalRewards = rewards?.reduce((sum, reward) => sum + reward.reward_amount, 0) || 0;

      if (totalRewards > 0) {
        // Update user balance
        const { error } = await supabase
          .from('users')
          .update({
            ida_balance: totalRewards,
            total_earned: totalRewards
          })
          .eq('id', user.id);

        if (error) throw error;

        showSuccessToast(`Fixed IDA balance: ${totalRewards} IDA`);
        refetch();
        window.location.reload(); // Refresh to update AuthContext
      } else {
        showErrorToast('No rewards found to fix');
      }
    } catch (error) {
      console.error('Fix error:', error);
      showErrorToast('Failed to fix IDA balance');
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(editForm);
      showSuccessToast('Profile updated successfully');
      setIsEditing(false);
      refetch();
    } catch (error) {
      console.error('Error updating profile:', error);
      showErrorToast('Failed to update profile');
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditForm({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        email: profile.email || '',
        twitter_url: profile.twitter_url || '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        website_url: profile.website_url || ''
      });
    }
    setIsEditing(false);
  };

  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  const getCompletedOrdersCount = () => {
    return profile?.orders?.filter((order: any) => order.status === 'completed').length || 0;
  };

  const getTotalEarnings = () => {
    const completedOrders = profile?.orders?.filter((order: any) => order.status === 'completed') || [];
    return completedOrders.reduce((sum: number, order: any) => {
      // Apply fee calculation for EGLD orders
      if (order.payment_token === 'EGLD') {
        return sum + (order.amount * 0.9); // 90% after 10% fee
      }
      return sum + order.amount; // 100% for IDA tokens
    }, 0);
  };

  const tabs = [
    { id: 0, label: 'Overview', icon: <User size={16} /> },
    { id: 1, label: 'Settings', icon: <Settings size={16} /> },
    { id: 2, label: 'Workspace', icon: <Briefcase size={16} /> }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="gradient-card p-8">
            <div className="flex justify-center">
              <div className="space-y-4 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-700">Loading profile...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="gradient-card p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <span className="text-red-700 font-medium">Error loading profile: {error.message}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="gradient-card p-8">
            <div className="text-center">
              <User size={48} className="text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Profile Not Found</h2>
              <p className="text-gray-600 mb-6">
                The profile you're looking for doesn't exist or has been removed.
              </p>
              <Button
                onClick={() => navigate('/')}
                variant="gradient"
                size="lg"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile && isOwnProfile && !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="gradient-card p-8">
            <div className="text-center">
              <User size={48} className="text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
              <p className="text-gray-600 mb-6">
                Connect your wallet to view and manage your profile.
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

  const averageRating = calculateAverageRating();
  const completedOrders = getCompletedOrdersCount();
  const totalEarnings = getTotalEarnings();

  // Get IDA balance from user object or profile
  const idaBalance = user?.ida_balance || profile?.ida_balance || 0;
  const totalEarnedIda = user?.total_earned || profile?.total_earned || 0;
  const userLevel = user?.level || profile?.level || 1;
  const userXp = user?.xp || profile?.xp || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="gradient-card p-8">
            <div className="space-y-6">
              {/* Debug Section for Development */}
              {process.env.NODE_ENV === 'development' && isOwnProfile && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-yellow-800">Debug IDA Balance</h4>
                    <div className="flex gap-2">
                      <Button
                        onClick={debugIdaBalance}
                        disabled={isDebugging}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                      >
                        <Database size={12} />
                        {isDebugging ? 'Checking...' : 'Debug DB'}
                      </Button>
                      <Button
                        onClick={fixIdaBalance}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                      >
                        <RefreshCw size={12} />
                        Fix Balance
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-yellow-700">
                    <p>User IDA Balance: {idaBalance}</p>
                    <p>Profile IDA Balance: {profile?.ida_balance}</p>
                    <p>Auth User IDA Balance: {user?.ida_balance}</p>
                  </div>
                  {debugInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-yellow-800 font-medium">Debug Details</summary>
                      <pre className="text-xs bg-yellow-100 p-2 rounded mt-2 overflow-auto max-h-40">
                        {JSON.stringify(debugInfo, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-24 h-24 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-400 to-pink-400 flex-shrink-0">
                  {profile?.avatar_url ? (
                    <>
                      <img
                        src={profile.avatar_url}
                        alt={profile.username || "Profile"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.fallback-avatar') as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }
                        }}
                      />
                      <div 
                        className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-2xl font-bold text-white absolute inset-0"
                        style={{ display: 'none' }}
                      >
                        {profile?.username?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-2xl font-bold text-white">
                      {profile?.username?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        {profile?.full_name || profile?.username || 'Anonymous User'}
                      </h1>
                      {profile?.full_name && (
                        <p className="text-gray-600 text-lg">@{profile.username}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar size={16} className="text-gray-400" />
                          <span className="text-gray-600 text-sm">
                            Joined {new Date(profile?.created_at || '').toLocaleDateString()}
                          </span>
                        </div>
                        {reviews && reviews.length > 0 && (
                          <div className="flex items-center gap-2">
                            <StarRating 
                              rating={averageRating}
                              size={16}
                              showText={true}
                              showCount={true}
                              reviewCount={reviews.length}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {isOwnProfile && (
                      <Button
                        onClick={() => setIsEditing(!isEditing)}
                        variant="outline"
                        size="md"
                      >
                        <Edit size={16} />
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                      </Button>
                    )}
                  </div>

                  {profile?.bio && (
                    <p className="text-gray-700 mt-4 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}

                  {/* Social Links */}
                  {(profile?.twitter_url || profile?.github_url || profile?.linkedin_url || profile?.website_url) && (
                    <div className="flex gap-3 mt-4">
                      {profile.twitter_url && (
                        <a
                          href={profile.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-blue-500 transition-colors"
                        >
                          <ExternalLink size={18} />
                        </a>
                      )}
                      {profile.github_url && (
                        <a
                          href={profile.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          <ExternalLink size={18} />
                        </a>
                      )}
                      {profile.linkedin_url && (
                        <a
                          href={profile.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <ExternalLink size={18} />
                        </a>
                      )}
                      {profile.website_url && (
                        <a
                          href={profile.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-indigo-600 transition-colors"
                        >
                          <ExternalLink size={18} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins size={20} className="text-purple-600" />
                    <span className="text-gray-600 text-sm font-medium">IDA Balance</span>
                  </div>
                  <p className="text-gray-800 text-xl font-bold">
                    {idaBalance?.toLocaleString() || '0'}
                  </p>
                  <p className="text-gray-500 text-xs">Available tokens</p>
                </div>

                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={20} className="text-green-600" />
                    <span className="text-gray-600 text-sm font-medium">Total Earned</span>
                  </div>
                  <p className="text-gray-800 text-xl font-bold">
                    {totalEarnedIda?.toLocaleString() || '0'}
                  </p>
                  <p className="text-gray-500 text-xs">IDA tokens earned</p>
                </div>

                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={20} className="text-orange-600" />
                    <span className="text-gray-600 text-sm font-medium">Level</span>
                  </div>
                  <p className="text-gray-800 text-xl font-bold">
                    {userLevel}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {userXp} XP
                  </p>
                </div>

                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase size={20} className="text-blue-600" />
                    <span className="text-gray-600 text-sm font-medium">Orders</span>
                  </div>
                  <p className="text-gray-800 text-xl font-bold">
                    {completedOrders}
                  </p>
                  <p className="text-gray-500 text-xs">Completed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          {isOwnProfile && (
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
                {/* Overview Tab */}
                {activeTab === 0 && (
                  <div className="space-y-8">
                    {/* Edit Profile Form */}
                    {isEditing && (
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Edit Profile</h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-gray-800 text-sm font-medium mb-2">
                                Username
                              </label>
                              <input
                                type="text"
                                value={editForm.username}
                                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-800 text-sm font-medium mb-2">
                                Full Name
                              </label>
                              <input
                                type="text"
                                value={editForm.full_name}
                                onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-gray-800 text-sm font-medium mb-2">
                              Bio
                            </label>
                            <textarea
                              value={editForm.bio}
                              onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                              rows={4}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Tell others about yourself..."
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-gray-800 text-sm font-medium mb-2">
                                Twitter URL
                              </label>
                              <input
                                type="url"
                                value={editForm.twitter_url}
                                onChange={(e) => setEditForm({...editForm, twitter_url: e.target.value})}
                                placeholder="https://twitter.com/username"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-800 text-sm font-medium mb-2">
                                GitHub URL
                              </label>
                              <input
                                type="url"
                                value={editForm.github_url}
                                onChange={(e) => setEditForm({...editForm, github_url: e.target.value})}
                                placeholder="https://github.com/username"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-gray-800 text-sm font-medium mb-2">
                                LinkedIn URL
                              </label>
                              <input
                                type="url"
                                value={editForm.linkedin_url}
                                onChange={(e) => setEditForm({...editForm, linkedin_url: e.target.value})}
                                placeholder="https://linkedin.com/in/username"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-800 text-sm font-medium mb-2">
                                Website URL
                              </label>
                              <input
                                type="url"
                                value={editForm.website_url}
                                onChange={(e) => setEditForm({...editForm, website_url: e.target.value})}
                                placeholder="https://yourwebsite.com"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button
                              onClick={handleCancel}
                              variant="outline"
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSave}
                              disabled={updateProfile.isLoading}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                              {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Gigs Section */}
                    {profile?.gigs && profile.gigs.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">My Gigs</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {profile.gigs.slice(0, 6).map((gig: any) => (
                            <div
                              key={gig.id}
                              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => navigate(`/gigs/${gig.id}`)}
                            >
                              <img
                                src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                                alt={gig.title}
                                className="w-full h-32 object-cover"
                              />
                              <div className="p-4">
                                <h4 className="font-bold text-gray-800 mb-2 line-clamp-1">
                                  {gig.title}
                                </h4>
                                <div className="flex justify-between items-center">
                                  <span className="text-indigo-600 font-bold">
                                    {gig.price} {gig.payment_token === 'EGLD' ? 'EGLD' : 'IDA'}
                                  </span>
                                  <span className="text-gray-500 text-sm">
                                    {gig.duration} days
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {profile.gigs.length > 6 && (
                          <div className="text-center mt-6">
                            <Button
                              onClick={() => navigate('/profile?tab=gigs')}
                              variant="outline"
                              size="sm"
                            >
                              View All Gigs ({profile.gigs.length})
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reviews Section */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <ReviewsList 
                        reviews={reviews || []}
                        isLoading={reviewsLoading}
                        error={reviewsError}
                        showTitle={true}
                      />
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 1 && (
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-6">Account Settings</h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-gray-800 text-sm font-medium mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                            placeholder="your.email@example.com"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <EmailNotificationsToggle
                          enabled={profile?.email_notifications_enabled || false}
                          currentEmail={profile?.email || ''}
                          onEmailUpdated={(email) => {
                            setEditForm({...editForm, email});
                            refetch();
                          }}
                        />

                        <div className="pt-4">
                          <Button
                            onClick={handleSave}
                            disabled={updateProfile.isLoading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg"
                          >
                            {updateProfile.isLoading ? 'Saving...' : 'Save Settings'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Workspace Tab */}
                {activeTab === 2 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TaskManager />
                    <CalendarWidget />
                    <FinancialOverview />
                    <ExternalToolsWidget />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Public Profile View */}
          {!isOwnProfile && profile && (
            <div className="space-y-8">
              {/* Gigs Section */}
              {profile.gigs && profile.gigs.length > 0 && (
                <div className="gradient-card p-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Available Gigs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profile.gigs.filter((gig: any) => gig.status === 'active').map((gig: any) => (
                      <div
                        key={gig.id}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/gigs/${gig.id}`)}
                      >
                        <img
                          src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                          alt={gig.title}
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-4">
                          <h4 className="font-bold text-gray-800 mb-2 line-clamp-1">
                            {gig.title}
                          </h4>
                          <div className="flex justify-between items-center">
                            <span className="text-indigo-600 font-bold">
                              {gig.price} {gig.payment_token === 'EGLD' ? 'EGLD' : 'IDA'}
                            </span>
                            <span className="text-gray-500 text-sm">
                              {gig.duration} days
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              <div className="gradient-card p-8">
                <ReviewsList 
                  reviews={reviews || []}
                  isLoading={reviewsLoading}
                  error={reviewsError}
                  showTitle={true}
                />
              </div>
            </div>
          )}
        </div>

        {/* Add bottom padding for mobile navigation */}
        <div className="h-20 md:h-0"></div>
      </div>
    </div>
  );
};