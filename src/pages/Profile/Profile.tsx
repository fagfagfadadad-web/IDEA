import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { User, Settings, Star, Calendar, DollarSign, Clock, Bell, BellOff, Edit, Save, X, Plus, Briefcase, FileText, Eye, AlertTriangle, Shield, MoreVertical, Twitter, Github, Linkedin, Globe, Coins, Check, Trash2, Pause, Play, BarChart3, Package, UserPlus, Gift, Users } from 'lucide-react';
  User, 
  Settings, 
  Star, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Edit, 
  Trash2, 
  X, 
  Plus, 
  MapPin, 
  Gift, 
  Users 
} from 'lucide-react';
import { Button, Card, EmailNotificationsToggle, ReviewsList, StarRating } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useReviewsForProvider } from '../../hooks/useReviews';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TaskManager } from '../../components/ProfileDashboard/TaskManager';
import { CalendarWidget } from '../../components/ProfileDashboard/CalendarWidget';
import { FinancialOverview } from '../../components/ProfileDashboard/FinancialOverview';
import { ExternalToolsWidget } from '../../components/ProfileDashboard/ExternalToolsWidget';

export const Profile = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { user, isAuthenticated } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  
  // Determine if viewing own profile or someone else's
  const isOwnProfile = !id || (user && id === user.id);
  const profileId = isOwnProfile ? undefined : id;
  
  // Real hooks
  const { data: profile, isLoading, error, refetch } = useProfile(profileId);
  const { data: reviews, isLoading: reviewsLoading, error: reviewsError } = useReviewsForProvider(profileId || user?.id || '');
  const updateProfile = useUpdateProfile();

  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    bio: '',
    email: '',
    twitter_url: '',
    github_url: '',
    linkedin_url: '',
    website_url: '',
    discord_username: '',
    telegram_username: '',
  });

  // Set active tab from URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'settings') setActiveTab(1);
    else if (tab === 'reviews') setActiveTab(2);
    else if (tab === 'workspace') setActiveTab(3);
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
        website_url: profile.website_url || '',
        discord_username: profile.discord_username || '',
        telegram_username: profile.telegram_username || '',
      });
    }
  }, [profile, isOwnProfile]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync(editForm);
      showSuccessToast('Profile updated successfully');
      setIsEditing(false);
      refetch();
    } catch (error) {
      console.error('Error updating profile:', error);
      showErrorToast('Error updating profile');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  };

  const tabs = [
    { id: 0, label: 'Overview', icon: <User size={20} /> },
    { id: 1, label: 'Settings', icon: <Settings size={20} /> },
    { id: 2, label: 'Reviews', icon: <Star size={20} /> },
    { id: 3, label: 'Workspace', icon: <Gift size={20} /> },
  ];

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
          <div className="gradient-card p-6 md:p-8">
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

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
          <div className="gradient-card p-6 md:p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <span className="text-red-700 font-medium">
                  Error loading profile: {error.message}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show not found state for other user's profile
  if (!isOwnProfile && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
          <div className="gradient-card p-6 md:p-8">
            <div className="text-center">
              <User size={48} className="text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Profile Not Found</h2>
              <p className="text-gray-600 mb-6">
                The profile you're looking for doesn't exist or has been removed.
              </p>
              <Button
                onClick={() => navigate('/')}
                variant="gradient"
                size="md"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt for own profile when not authenticated
  if (isOwnProfile && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
          <div className="gradient-card p-6 md:p-8">
            <div className="text-center">
              <User size={48} className="text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
              <p className="text-gray-600 mb-6">
                Connect your wallet to view and manage your profile
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 overflow-hidden">
      <div className="container mx-auto max-w-7xl px-3 md:px-6 py-4 md:py-8 overflow-hidden">
        <div className="space-y-4 md:space-y-8 overflow-hidden">
          {/* Profile Header */}
          <div className="gradient-card p-4 md:p-8 overflow-hidden">
            <div className="space-y-4 md:space-y-6 overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 overflow-hidden">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-400 to-pink-400 flex-shrink-0">
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
                        className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-xl md:text-2xl font-bold text-white absolute inset-0"
                        style={{ display: 'none' }}
                      >
                        {profile?.username?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-xl md:text-2xl font-bold text-white">
                      {profile?.username?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 overflow-hidden">
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-1 md:mb-2 break-words">
                    {profile?.full_name || profile?.username || 'Anonymous User'}
                  </h1>
                  {profile?.username && profile?.full_name && (
                    <p className="text-sm md:text-base text-gray-600 mb-2 break-words">@{profile.username}</p>
                  )}
                  {profile?.bio && (
                    <p className="text-sm md:text-base text-gray-700 break-words line-clamp-2 md:line-clamp-none">
                      {profile.bio}
                    </p>
                  )}
                  
                  {/* Stats for other user's profile */}
                  {!isOwnProfile && (
                    <div className="flex flex-wrap gap-2 md:gap-4 mt-3 md:mt-4 overflow-hidden">
                      <div className="flex items-center gap-1 md:gap-2">
                        <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-xs md:text-sm text-gray-600 break-words">
                          Joined {new Date(profile?.created_at || '').toLocaleDateString()}
                        </span>
                      </div>
                      {reviews && reviews.length > 0 && (
                        <div className="flex items-center gap-1 md:gap-2">
                          <StarRating 
                            rating={averageRating}
                            size={14}
                            showText={false}
                            className="flex-shrink-0"
                          />
                          <span className="text-xs md:text-sm text-gray-600 break-words">
                            {averageRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isOwnProfile && (
                  <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full md:w-auto flex-shrink-0">
                    <Button
                      onClick={() => setIsEditing(!isEditing)}
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <Edit size={16} />
                      {isEditing ? 'Cancel' : 'Edit Profile'}
                    </Button>
                    {isEditing && (
                      <Button
                        onClick={handleSaveProfile}
                        disabled={updateProfile.isLoading}
                        variant="gradient"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <CheckCircle size={16} />
                        {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Social Links for public profiles */}
              {!isOwnProfile && profile && (
                <div className="flex flex-wrap gap-2 md:gap-3 overflow-hidden">
                  {profile.twitter_url && (
                    <a
                      href={profile.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-xs md:text-sm flex-shrink-0"
                    >
                      <span>🐦</span>
                      <span className="break-words">Twitter</span>
                    </a>
                  )}
                  {profile.github_url && (
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors text-xs md:text-sm flex-shrink-0"
                    >
                      <span>💻</span>
                      <span className="break-words">GitHub</span>
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-xs md:text-sm flex-shrink-0"
                    >
                      <span>💼</span>
                      <span className="break-words">LinkedIn</span>
                    </a>
                  )}
                  {profile.website_url && (
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-xs md:text-sm flex-shrink-0"
                    >
                      <span>🌐</span>
                      <span className="break-words">Website</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tabs for own profile */}
          {isOwnProfile && (
            <div className="gradient-card overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 overflow-hidden">
                <div className="flex overflow-x-auto scrollbar-hide">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600 bg-white'
                          : 'border-transparent text-gray-500 hover:text-indigo-600 hover:bg-gray-50'
                      }`}
                    >
                      {tab.icon}
                      <span className="break-words">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 md:p-8 overflow-hidden">
                {/* Overview Tab */}
                {activeTab === 0 && (
                  <div className="space-y-4 md:space-y-6 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 overflow-hidden">
                      <div className="lg:col-span-2 space-y-4 md:space-y-6 overflow-hidden">
                        {/* Profile Info */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 overflow-hidden">
                          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4 break-words">Profile Information</h3>
                          
                          {isEditing ? (
                            <div className="space-y-3 md:space-y-4 overflow-hidden">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 overflow-hidden">
                                <div className="overflow-hidden">
                                  <label className="block text-gray-800 text-sm font-medium mb-2">Username</label>
                                  <input
                                    type="text"
                                    name="username"
                                    value={editForm.username}
                                    onChange={handleChange}
                                    className="w-full p-2 md:p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
                                  />
                                </div>
                                <div className="overflow-hidden">
                                  <label className="block text-gray-800 text-sm font-medium mb-2">Full Name</label>
                                  <input
                                    type="text"
                                    name="full_name"
                                    value={editForm.full_name}
                                    onChange={handleChange}
                                    className="w-full p-2 md:p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
                                  />
                                </div>
                              </div>
                              
                              <div className="overflow-hidden">
                                <label className="block text-gray-800 text-sm font-medium mb-2">Bio</label>
                                <textarea
                                  name="bio"
                                  value={editForm.bio}
                                  onChange={handleChange}
                                  rows={3}
                                  className="w-full p-2 md:p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm md:text-base"
                                />
                              </div>

                              <div className="overflow-hidden">
                                <label className="block text-gray-800 text-sm font-medium mb-2">Email</label>
                                <input
                                  type="email"
                                  name="email"
                                  value={editForm.email}
                                  onChange={handleChange}
                                  className="w-full p-2 md:p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 overflow-hidden">
                                <div className="overflow-hidden">
                                  <label className="block text-gray-800 text-sm font-medium mb-2">Twitter URL</label>
                                  <input
                                    type="url"
                                    name="twitter_url"
                                    value={editForm.twitter_url}
                                    onChange={handleChange}
                                    placeholder="https://twitter.com/username"
                                    className="w-full p-2 md:p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
                                  />
                                </div>
                                <div className="overflow-hidden">
                                  <label className="block text-gray-800 text-sm font-medium mb-2">GitHub URL</label>
                                  <input
                                    type="url"
                                    name="github_url"
                                    value={editForm.github_url}
                                    onChange={handleChange}
                                    placeholder="https://github.com/username"
                                    className="w-full p-2 md:p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 overflow-hidden">
                                <div className="overflow-hidden">
                                  <label className="block text-gray-800 text-sm font-medium mb-2">LinkedIn URL</label>
                                  <input
                                    type="url"
                                    name="linkedin_url"
                                    value={editForm.linkedin_url}
                                    onChange={handleChange}
                                    placeholder="https://linkedin.com/in/username"
                                    className="w-full p-2 md:p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
                                  />
                                </div>
                                <div className="overflow-hidden">
                                  <label className="block text-gray-800 text-sm font-medium mb-2">Website URL</label>
                                  <input
                                    type="url"
                                    name="website_url"
                                    value={editForm.website_url}
                                    onChange={handleChange}
                                    placeholder="https://yourwebsite.com"
                                    className="w-full p-2 md:p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3 md:space-y-4 overflow-hidden">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 overflow-hidden">
                                <div className="overflow-hidden">
                                  <p className="text-gray-600 text-sm">Username</p>
                                  <p className="text-gray-800 font-medium break-words">{profile?.username || 'Not set'}</p>
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-gray-600 text-sm">Full Name</p>
                                  <p className="text-gray-800 font-medium break-words">{profile?.full_name || 'Not set'}</p>
                                </div>
                              </div>
                              
                              <div className="overflow-hidden">
                                <p className="text-gray-600 text-sm">Bio</p>
                                <p className="text-gray-800 break-words">{profile?.bio || 'No bio available'}</p>
                              </div>

                              <div className="overflow-hidden">
                                <p className="text-gray-600 text-sm">Email</p>
                                <p className="text-gray-800 break-words">{profile?.email || 'Not set'}</p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 overflow-hidden">
                                <div className="overflow-hidden">
                                  <p className="text-gray-600 text-sm">Member Since</p>
                                  <p className="text-gray-800 font-medium break-words">
                                    {new Date(profile?.created_at || '').toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-gray-600 text-sm">Wallet Address</p>
                                  <p className="text-gray-800 font-mono text-xs md:text-sm break-all">
                                    {user?.wallet_address ? (
                                      <span title={user.wallet_address}>
                                        {user.wallet_address.substring(0, 8)}...{user.wallet_address.substring(user.wallet_address.length - 6)}
                                      </span>
                                    ) : (
                                      'Not connected'
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Activity Stats */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 overflow-hidden">
                          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4 break-words">Activity Overview</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 overflow-hidden">
                            <div className="text-center p-3 md:p-4 bg-blue-50 rounded-lg overflow-hidden">
                              <p className="text-blue-600 text-lg md:text-2xl font-bold break-words">
                                {profile?.gigs?.length || 0}
                              </p>
                              <p className="text-blue-800 text-xs md:text-sm font-medium break-words">Gigs Created</p>
                            </div>
                            <div className="text-center p-3 md:p-4 bg-green-50 rounded-lg overflow-hidden">
                              <p className="text-green-600 text-lg md:text-2xl font-bold break-words">
                                {profile?.orders?.filter((o: any) => o.status === 'completed').length || 0}
                              </p>
                              <p className="text-green-800 text-xs md:text-sm font-medium break-words">Orders Completed</p>
                            </div>
                            <div className="text-center p-3 md:p-4 bg-purple-50 rounded-lg overflow-hidden">
                              <p className="text-purple-600 text-lg md:text-2xl font-bold break-words">
                                {reviews?.length || 0}
                              </p>
                              <p className="text-purple-800 text-xs md:text-sm font-medium break-words">Reviews Received</p>
                            </div>
                            <div className="text-center p-3 md:p-4 bg-orange-50 rounded-lg overflow-hidden">
                              <p className="text-orange-600 text-lg md:text-2xl font-bold break-words">
                                {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                              </p>
                              <p className="text-orange-800 text-xs md:text-sm font-medium break-words">Avg Rating</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sidebar */}
                      <div className="space-y-4 md:space-y-6 overflow-hidden">
                        {/* Quick Stats */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 overflow-hidden">
                          <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 break-words">Quick Stats</h3>
                          <div className="space-y-2 md:space-y-3 overflow-hidden">
                            <div className="flex justify-between items-center overflow-hidden">
                              <span className="text-gray-600 text-sm break-words">Active Gigs</span>
                              <span className="text-gray-800 font-bold text-sm break-words">
                                {profile?.gigs?.filter((g: any) => g.status === 'active').length || 0}
                              </span>
                            </div>
                            <div className="flex justify-between items-center overflow-hidden">
                              <span className="text-gray-600 text-sm break-words">Total Orders</span>
                              <span className="text-gray-800 font-bold text-sm break-words">
                                {profile?.orders?.length || 0}
                              </span>
                            </div>
                            <div className="flex justify-between items-center overflow-hidden">
                              <span className="text-gray-600 text-sm break-words">Success Rate</span>
                              <span className="text-gray-800 font-bold text-sm break-words">
                                {profile?.orders?.length > 0 
                                  ? Math.round((profile.orders.filter((o: any) => o.status === 'completed').length / profile.orders.length) * 100)
                                  : 0}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 overflow-hidden">
                          <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 break-words">Recent Activity</h3>
                          <div className="space-y-2 md:space-y-3 overflow-hidden">
                            {profile?.orders?.slice(0, 3).map((order: any) => (
                              <div key={order.id} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-gray-50 rounded-lg overflow-hidden">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  order.status === 'completed' ? 'bg-green-500' :
                                  order.status === 'in_progress' ? 'bg-blue-500' :
                                  order.status === 'delivered' ? 'bg-yellow-500' :
                                  'bg-gray-500'
                                }`} />
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <p className="text-gray-800 font-medium text-xs md:text-sm break-words line-clamp-1">
                                    {order.gig?.title || 'Custom Project'}
                                  </p>
                                  <p className="text-gray-600 text-xs break-words">
                                    {new Date(order.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            )) || (
                              <p className="text-gray-600 text-sm break-words">No recent activity</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 1 && (
                  <div className="space-y-4 md:space-y-6 overflow-hidden">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 overflow-hidden">
                      <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-6 break-words">Account Settings</h3>
                      
                      <div className="space-y-4 md:space-y-6 overflow-hidden">
                        {/* Email Notifications */}
                        <div className="overflow-hidden">
                          <h4 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 break-words">Email Notifications</h4>
                          <EmailNotificationsToggle
                            enabled={profile?.email_notifications_enabled || false}
                            currentEmail={profile?.email || ''}
                            onEmailUpdated={(email) => {
                              if (profile) {
                                profile.email = email;
                              }
                            }}
                          />
                        </div>

                        {/* Social Links */}
                        <div className="overflow-hidden">
                          <h4 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 break-words">Social Links</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 overflow-hidden">
                            <div className="overflow-hidden">
                              <label className="block text-gray-800 text-sm font-medium mb-2">Twitter URL</label>
                              <input
                                type="url"
                                name="twitter_url"
                                value={editForm.twitter_url}
                                onChange={handleChange}
                                placeholder="https://twitter.com/username"
                                className="w-full p-2 md:p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
                              />
                            </div>
                            <div className="overflow-hidden">
                              <label className="block text-gray-800 text-sm font-medium mb-2">GitHub URL</label>
                              <input
                                type="url"
                                name="github_url"
                                value={editForm.github_url}
                                onChange={handleChange}
                                placeholder="https://github.com/username"
                                className="w-full p-2 md:p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
                              />
                            </div>
                            <div className="overflow-hidden">
                              <label className="block text-gray-800 text-sm font-medium mb-2">LinkedIn URL</label>
                              <input
                                type="url"
                                name="linkedin_url"
                                value={editForm.linkedin_url}
                                onChange={handleChange}
                                placeholder="https://linkedin.com/in/username"
                                className="w-full p-2 md:p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
                              />
                            </div>
                            <div className="overflow-hidden">
                              <label className="block text-gray-800 text-sm font-medium mb-2">Website URL</label>
                              <input
                                type="url"
                                name="website_url"
                                value={editForm.website_url}
                                onChange={handleChange}
                                placeholder="https://yourwebsite.com"
                                className="w-full p-2 md:p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="overflow-hidden">
                          <h4 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 break-words">Contact Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 overflow-hidden">
                            <div className="overflow-hidden">
                              <label className="block text-gray-800 text-sm font-medium mb-2">Discord Username</label>
                              <input
                                type="text"
                                name="discord_username"
                                value={editForm.discord_username}
                                onChange={handleChange}
                                placeholder="username#1234"
                                className="w-full p-2 md:p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
                              />
                            </div>
                            <div className="overflow-hidden">
                              <label className="block text-gray-800 text-sm font-medium mb-2">Telegram Username</label>
                              <input
                                type="text"
                                name="telegram_username"
                                value={editForm.telegram_username}
                                onChange={handleChange}
                                placeholder="@username"
                                className="w-full p-2 md:p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 md:pt-6 overflow-hidden">
                          <Button
                            onClick={handleSaveProfile}
                            disabled={updateProfile.isLoading}
                            variant="gradient"
                            size="lg"
                            fullWidth
                          >
                            <CheckCircle size={16} />
                            {updateProfile.isLoading ? 'Saving Changes...' : 'Save All Changes'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 2 && (
                  <div className="overflow-hidden">
                    <ReviewsList 
                      reviews={reviews || []}
                      isLoading={reviewsLoading}
                      error={reviewsError}
                      showTitle={true}
                    />
                  </div>
                )}

                {/* Workspace Tab */}
                {activeTab === 3 && (
                  <div className="space-y-4 md:space-y-6 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 overflow-hidden">
                      <div className="space-y-4 md:space-y-6 overflow-hidden">
                        <FinancialOverview />
                        <TaskManager />
                      </div>
                      <div className="space-y-4 md:space-y-6 overflow-hidden">
                        <CalendarWidget />
                        <ExternalToolsWidget />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Public profile view (for other users) */}
          {!isOwnProfile && profile && (
            <div className="gradient-card p-4 md:p-8 overflow-hidden">
              <ReviewsList 
                reviews={reviews || []}
                isLoading={reviewsLoading}
                error={reviewsError}
                showTitle={true}
              />
            </div>
          )}

          {/* Add bottom padding for mobile navigation */}
          <div className="h-20 md:h-0"></div>
        </div>
      </div>
    </div>
  );
};