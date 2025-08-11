import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Edit, 
  Star, 
  Briefcase, 
  Settings, 
  Calendar,
  CheckSquare,
  BarChart3,
  ExternalLink,
  Save,
  X,
  Mail,
  Twitter,
  Github,
  Linkedin,
  Globe,
  MessageSquare,
  Shield
} from 'lucide-react';
import { Button, EmailNotificationsToggle, ReviewsList, StarRating } from 'components';
import { TaskManager, CalendarWidget, FinancialOverview, ExternalToolsWidget } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useReviewsForProvider } from '../../hooks/useReviews';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const Profile = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  
  const isOwnProfile = !id || id === user?.id;
  const profileId = isOwnProfile ? undefined : id;
  
  const { data: profile, isLoading, error, refetch } = useProfile(profileId);
  const { data: reviews, isLoading: reviewsLoading, error: reviewsError } = useReviewsForProvider(profileId || user?.id || '');
  const updateProfile = useUpdateProfile();

  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    bio: '',
    twitter_url: '',
    github_url: '',
    linkedin_url: '',
    website_url: '',
    discord_username: '',
    telegram_username: ''
  });

  // Set active tab from URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'reviews') setActiveTab(1);
    else if (tab === 'dashboard') setActiveTab(2);
    else if (tab === 'settings') setActiveTab(3);
    else setActiveTab(0);
  }, [searchParams]);

  // Initialize edit form when profile loads
  useEffect(() => {
    if (profile && isOwnProfile) {
      setEditForm({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        twitter_url: profile.twitter_url || '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        website_url: profile.website_url || '',
        discord_username: profile.discord_username || '',
        telegram_username: profile.telegram_username || ''
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
      showErrorToast('Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditForm({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        twitter_url: profile.twitter_url || '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        website_url: profile.website_url || '',
        discord_username: profile.discord_username || '',
        telegram_username: profile.telegram_username || ''
      });
    }
    setIsEditing(false);
  };

  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  const averageRating = calculateAverageRating();

  const tabs = [
    { id: 0, label: 'Profile', icon: <User size={16} /> },
    { id: 1, label: 'Reviews', icon: <Star size={16} /> },
    { id: 2, label: 'Dashboard', icon: <BarChart3 size={16} /> },
    { id: 3, label: 'Settings', icon: <Settings size={16} /> }
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
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-yellow-500 mr-2">⚠️</span>
                <span className="text-yellow-700 font-medium">Profile not found</span>
              </div>
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-blue-500 mr-2">ℹ️</span>
                <span className="text-blue-700 font-medium">Please log in to view your profile</span>
              </div>
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
          {/* Profile Header */}
          <div className="gradient-card p-8">
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
                    {profile?.username?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                    {profile?.full_name || profile?.username || user?.username || 'User'}
                  </h1>
                  <p className="text-gray-600">
                    @{profile?.username || user?.username || 'username'}
                  </p>
                  {profile?.bio && (
                    <p className="text-gray-700 mt-2">
                      {profile.bio}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{profile?.gigs?.length || 0}</p>
                    <p className="text-gray-600 text-sm">Active Gigs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{profile?.orders?.length || 0}</p>
                    <p className="text-gray-600 text-sm">Total Orders</p>
                  </div>
                  {reviews && reviews.length > 0 && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <p className="text-2xl font-bold text-gray-800">{averageRating.toFixed(1)}</p>
                        <Star size={20} fill="#FFD700" color="#FFD700" />
                      </div>
                      <p className="text-gray-600 text-sm">{reviews.length} Reviews</p>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">
                      {new Date(profile?.created_at || user?.created_at || '').getFullYear()}
                    </p>
                    <p className="text-gray-600 text-sm">Member Since</p>
                  </div>
                </div>

                {/* Social Links */}
                {(profile?.twitter_url || profile?.github_url || profile?.linkedin_url || profile?.website_url) && (
                  <div className="flex gap-3">
                    {profile.twitter_url && (
                      <a
                        href={profile.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-blue-500 transition-colors"
                      >
                        <Twitter size={20} />
                      </a>
                    )}
                    {profile.github_url && (
                      <a
                        href={profile.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <Github size={20} />
                      </a>
                    )}
                    {profile.linkedin_url && (
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <Linkedin size={20} />
                      </a>
                    )}
                    {profile.website_url && (
                      <a
                        href={profile.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-indigo-600 transition-colors"
                      >
                        <Globe size={20} />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {isOwnProfile && (
                <div className="flex-shrink-0">
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      size="md"
                    >
                      <Edit size={16} />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={updateProfile.isLoading}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <Save size={16} />
                        {updateProfile.isLoading ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        size="md"
                      >
                        <X size={16} />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="gradient-card overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="flex overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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

            <div className="bg-white p-8">
              {/* Profile Tab */}
              {activeTab === 0 && (
                <div className="space-y-8">
                  {isEditing && isOwnProfile ? (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-800">Edit Profile</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">
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
                          <label className="block text-gray-700 text-sm font-medium mb-2">
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
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Bio
                        </label>
                        <textarea
                          value={editForm.bio}
                          onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                          rows={4}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Tell others about yourself and your skills..."
                        />
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Social Links</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                              <Twitter size={16} className="inline mr-2" />
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
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                              <Github size={16} className="inline mr-2" />
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

                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                              <Linkedin size={16} className="inline mr-2" />
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
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                              <Globe size={16} className="inline mr-2" />
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

                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                              <MessageSquare size={16} className="inline mr-2" />
                              Discord Username
                            </label>
                            <input
                              type="text"
                              value={editForm.discord_username}
                              onChange={(e) => setEditForm({...editForm, discord_username: e.target.value})}
                              placeholder="username#1234"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                              <Send size={16} className="inline mr-2" />
                              Telegram Username
                            </label>
                            <input
                              type="text"
                              value={editForm.telegram_username}
                              onChange={(e) => setEditForm({...editForm, telegram_username: e.target.value})}
                              placeholder="@username"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">About</h2>
                        <p className="text-gray-700 leading-relaxed">
                          {profile?.bio || 'No bio available yet.'}
                        </p>
                      </div>

                      {/* Gigs Section */}
                      {profile?.gigs && profile.gigs.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 mb-4">Active Gigs</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {profile.gigs.slice(0, 6).map((gig: any) => (
                              <div
                                key={gig.id}
                                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => navigate(`/gigs/${gig.id}`)}
                              >
                                <img
                                  src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                                  alt={gig.title}
                                  className="w-full h-32 object-cover"
                                />
                                <div className="p-4">
                                  <h4 className="font-bold text-gray-800 mb-2">{gig.title}</h4>
                                  <p className="text-gray-600 text-sm line-clamp-2">{gig.description}</p>
                                  <div className="flex justify-between items-center mt-3">
                                    <span className="text-indigo-600 font-bold">
                                      {gig.price} {gig.payment_token === 'EGLD' ? 'EGLD' : 'IDEA'}
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
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 1 && (
                <div>
                  <ReviewsList 
                    reviews={reviews || []}
                    isLoading={reviewsLoading}
                    error={reviewsError}
                    showTitle={true}
                  />
                </div>
              )}

              {/* Dashboard Tab */}
              {activeTab === 2 && isOwnProfile && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h2>
                    <p className="text-gray-600">Manage your tasks, calendar, and tools in one place</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Row */}
                    <FinancialOverview />
                    <TaskManager />
                    
                    {/* Bottom Row */}
                    <CalendarWidget />
                    <ExternalToolsWidget />
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 3 && isOwnProfile && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Account Settings</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Email Notifications</h3>
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

                    {user?.is_admin && (
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Shield size={24} className="text-purple-600" />
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">Admin Access</h3>
                            <p className="text-gray-600 text-sm">You have administrator privileges</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => navigate('/admin')}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                          <Shield size={16} />
                          Access Admin Panel
                        </Button>
                      </div>
                    )}

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Account Information</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">User ID:</span>
                          <span className="text-gray-800 font-mono text-sm">{user?.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Wallet Address:</span>
                          <span className="text-gray-800 font-mono text-sm">
                            {profile?.wallet_address ? 
                              `${profile.wallet_address.substring(0, 8)}...${profile.wallet_address.substring(profile.wallet_address.length - 4)}` 
                              : 'Not connected'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Member Since:</span>
                          <span className="text-gray-800">
                            {new Date(profile?.created_at || '').toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};