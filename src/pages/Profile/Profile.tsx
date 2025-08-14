import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Edit, 
  Save, 
  X, 
  Mail, 
  Globe, 
  Github, 
  Linkedin, 
  Twitter,
  Calendar,
  Star,
  Briefcase,
  DollarSign,
  Clock,
  Award,
  Settings,
  Bell,
  Shield,
  Camera,
  Upload
} from 'lucide-react';
import { Button, Card, ReviewsList, StarRating, EmailNotificationsToggle } from 'components';
import { TaskManager, CalendarWidget, FinancialOverview, ExternalToolsWidget } from 'components/ProfileDashboard';
import { Button, Card, EmailNotificationsToggle, ReviewsList, TaskManager, CalendarWidget, FinancialOverview, ExternalToolsWidget } from 'components';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useGigs, useDeleteGig, useUpdateGigStatus } from '../../hooks/useGigs';
import { useOrders } from '../../hooks/useOrders';
import { useNotifications, useMarkAllNotificationsAsRead } from '../../hooks/useNotifications';
import { useReviewsForProvider } from '../../hooks/useReviews';
import { usePayments } from '../../hooks/usePayments';
import { useFileUpload } from '../../hooks/useFileUpload';
  '👨‍💼', '👩‍💼', '🧑‍💼', '👨‍🔬', '👩‍🔬', '🧑‍🔬',
  '🦸‍♂️', '🦸‍♀️', '🦸', '🧙‍♂️', '🧙‍♀️', '🧙',
  '👑', '🎯', '🚀', '⭐', '💎', '🔥'
];

// Function to get consistent emoji based on user ID
const getEmojiAvatar = (userId: string) => {
  if (!userId) return '👤';
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return emojiAvatars[Math.abs(hash) % emojiAvatars.length];
};

export const Profile = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();
  const { user } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const { uploadFile, isUploading } = useFileUpload();

  // Determine if this is own profile or viewing someone else's
  const isOwnProfile = !id || (user && id === user.id);
  const profileId = isOwnProfile ? undefined : id;

  const { data: profile, isLoading, error, refetch } = useProfile(profileId);
  const { data: reviews, isLoading: reviewsLoading, error: reviewsError } = useReviewsForProvider(profileId || user?.id || '');
  const updateProfile = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const { uploadFile } = useFileUpload();
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    bio: '',
    email: '',
    twitter_url: '',
    github_url: '',
    linkedin_url: '',
    website_url: '',
    avatar_url: ''
  });

  // Initialize active tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'settings') setActiveTab(1);
    else if (tab === 'dashboard') setActiveTab(2);
    else setActiveTab(0);
  }, [searchParams]);

  // Load profile data into form when editing
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
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile, isOwnProfile]);

  const handleAvatarUpload = async (file: File) => {
    try {
      const avatarUrl = await uploadFile(file, 'avatars', 'profile-pictures');
      
      // Update the form and immediately save
      const updatedForm = { ...editForm, avatar_url: avatarUrl };
      setEditForm(updatedForm);
      
      await updateProfile.mutateAsync({ avatar_url: avatarUrl });
      showSuccessToast('Profile picture updated successfully!');
      refetch();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showErrorToast('Failed to upload profile picture');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showErrorToast('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast('Image must be smaller than 5MB');
        return;
      }
      
      handleAvatarUpload(file);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(editForm);
      setIsEditing(false);
      showSuccessToast('Profile updated successfully!');
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
        website_url: profile.website_url || '',
        avatar_url: profile.avatar_url || ''
      });
    }
    setIsEditing(false);
  };

  // Calculate profile stats
  const profileStats = React.useMemo(() => {
    if (!profile) return null;

    const completedOrders = profile.orders?.filter((order: any) => order.status === 'completed') || [];
    const totalEarnings = completedOrders.reduce((sum: number, order: any) => sum + order.amount, 0);
    const averageRating = reviews && reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    return {
      totalGigs: profile.gigs?.length || 0,
      activeGigs: profile.gigs?.filter((gig: any) => gig.status === 'active').length || 0,
      completedOrders: completedOrders.length,
      totalEarnings: totalEarnings.toFixed(2),
      averageRating: averageRating.toFixed(1),
      totalReviews: reviews?.length || 0,
      memberSince: new Date(profile.created_at).toLocaleDateString()
    };
  }, [profile, reviews]);

  if (!isOwnProfile && isLoading) {
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

  if (!isOwnProfile && (error || !profile)) {
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

  if (isOwnProfile && !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="gradient-card p-8">
            <div className="text-center">
              <User size={48} className="text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
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

  if (isOwnProfile && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="gradient-card p-8">
            <div className="flex justify-center">
              <div className="space-y-4 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-700">Loading your profile...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = isOwnProfile ? [
    { id: 0, label: 'Profile', icon: <User size={20} /> },
    { id: 1, label: 'Settings', icon: <Settings size={20} /> },
    { id: 2, label: 'Dashboard', icon: <Briefcase size={20} /> }
  ] : [
    { id: 0, label: 'Profile', icon: <User size={20} /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="gradient-card p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar Section */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden relative bg-gray-200 flex items-center justify-center text-4xl">
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
                            const fallback = parent.querySelector('.emoji-fallback') as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }
                        }}
                      />
                      <div 
                        className="emoji-fallback w-full h-full bg-gray-200 flex items-center justify-center text-4xl absolute inset-0"
                        style={{ display: 'none' }}
                      >
                        {getEmojiAvatar(profile.id)}
                      </div>
                    </>
                  ) : (
                    <span className="text-4xl">
                      {getEmojiAvatar(profile?.id || user?.id || '')}
                    </span>
                  )}
                </div>
                
                {/* Upload Button for Own Profile */}
                {isOwnProfile && (
                  <div className="absolute bottom-0 right-0">
                    <button
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={isUploading}
                      className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50"
                      title="Change profile picture"
                    >
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Camera size={16} />
                      )}
                    </button>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                    {profile?.full_name || profile?.username || 'Anonymous User'}
                  </h1>
                  {profile?.username && profile?.full_name && (
                    <p className="text-gray-600">@{profile.username}</p>
                  )}
                  {profile?.bio && (
                    <p className="text-gray-700 mt-2">{profile.bio}</p>
                  )}
                </div>

                {/* Stats */}
                {profileStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-indigo-600">{profileStats.totalGigs}</p>
                      <p className="text-gray-600 text-sm">Total Gigs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{profileStats.completedOrders}</p>
                      <p className="text-gray-600 text-sm">Completed</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <p className="text-2xl font-bold text-yellow-600">{profileStats.averageRating}</p>
                        <Star size={20} className="text-yellow-500 fill-current" />
                      </div>
                      <p className="text-gray-600 text-sm">{profileStats.totalReviews} Reviews</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{profileStats.totalEarnings}</p>
                      <p className="text-gray-600 text-sm">EGLD Earned</p>
                    </div>
                  </div>
                )}

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

                {/* Edit Button for Own Profile */}
                {isOwnProfile && !isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="md"
                  >
                    <Edit size={16} />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          {isOwnProfile && (
            <div className="gradient-card overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="flex overflow-x-auto scrollbar-hide">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
                {/* Profile Tab */}
                {activeTab === 0 && (
                  <div className="space-y-8">
                    {isEditing ? (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h2 className="text-2xl font-bold text-gray-800">Edit Profile</h2>
                          <div className="flex gap-3">
                            <Button
                              onClick={handleCancel}
                              variant="outline"
                              size="sm"
                            >
                              <X size={16} />
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSave}
                              disabled={updateProfile.isLoading}
                              variant="gradient"
                              size="sm"
                            >
                              <Save size={16} />
                              {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-gray-800 text-sm font-medium mb-2">
                              Username
                            </label>
                            <input
                              type="text"
                              value={editForm.username}
                              onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                              className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                              className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-gray-800 text-sm font-medium mb-2">
                              Bio
                            </label>
                            <textarea
                              value={editForm.bio}
                              onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                              rows={4}
                              className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Tell others about yourself, your skills, and experience..."
                            />
                          </div>

                          <div>
                            <label className="block text-gray-800 text-sm font-medium mb-2">
                              Email
                            </label>
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                              className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-800 text-sm font-medium mb-2">
                              Website
                            </label>
                            <input
                              type="url"
                              value={editForm.website_url}
                              onChange={(e) => setEditForm({...editForm, website_url: e.target.value})}
                              className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="https://yourwebsite.com"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-800 text-sm font-medium mb-2">
                              Twitter
                            </label>
                            <input
                              type="url"
                              value={editForm.twitter_url}
                              onChange={(e) => setEditForm({...editForm, twitter_url: e.target.value})}
                              className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="https://twitter.com/username"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-800 text-sm font-medium mb-2">
                              GitHub
                            </label>
                            <input
                              type="url"
                              value={editForm.github_url}
                              onChange={(e) => setEditForm({...editForm, github_url: e.target.value})}
                              className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="https://github.com/username"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-800 text-sm font-medium mb-2">
                              LinkedIn
                            </label>
                            <input
                              type="url"
                              value={editForm.linkedin_url}
                              onChange={(e) => setEditForm({...editForm, linkedin_url: e.target.value})}
                              className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="https://linkedin.com/in/username"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* Profile Information */}
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Information</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <p className="text-gray-600 text-sm font-medium">Username</p>
                              <p className="text-gray-800 text-lg">{profile?.username || 'Not set'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-sm font-medium">Full Name</p>
                              <p className="text-gray-800 text-lg">{profile?.full_name || 'Not set'}</p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-gray-600 text-sm font-medium">Bio</p>
                              <p className="text-gray-800">{profile?.bio || 'No bio available'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-sm font-medium">Member Since</p>
                              <p className="text-gray-800">{profileStats?.memberSince}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-sm font-medium">Wallet Address</p>
                              <p className="text-gray-800 font-mono text-sm">
                                {profile?.wallet_address ? 
                                  `${profile.wallet_address.slice(0, 8)}...${profile.wallet_address.slice(-8)}` : 
                                  'Not connected'
                                }
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Gigs Section */}
                        {profile?.gigs && profile.gigs.length > 0 && (
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-4">
                              Active Gigs ({profileStats?.activeGigs}/{profileStats?.totalGigs})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {profile.gigs.slice(0, 6).map((gig: any) => (
                                <div
                                  key={gig.id}
                                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                                  onClick={() => navigate(`/gigs/${gig.id}`)}
                                >
                                  <img
                                    src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                                    alt={gig.title}
                                    className="w-full h-32 object-cover"
                                  />
                                  <div className="p-4">
                                    <h4 className="font-bold text-gray-800 mb-2 line-clamp-2">{gig.title}</h4>
                                    <div className="flex justify-between items-center">
                                      <span className="text-indigo-600 font-bold">
                                        {gig.price} {gig.payment_token || 'EGLD'}
                                      </span>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        gig.status === 'active' ? 'bg-green-100 text-green-800' :
                      Profile Picture
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {gig.status}
                                      </span>
                                    </div>
                          <>
                            <img
                              src={editForm.avatar_url}
                              alt="Avatar preview"
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
                              className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-xl text-white absolute inset-0"
                              style={{ display: 'none' }}
                            >
                              {editForm.username?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                          </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 1 && isOwnProfile && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h2>
                      
                      {/* Email Notifications */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                      {/* Upload controls */}
                        <EmailNotificationsToggle
                        <div className="space-y-3">
                          <Button
                            onClick={() => document.getElementById('avatar-upload-input')?.click()}
                            disabled={isUploadingAvatar}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2"
                          >
                            {isUploadingAvatar ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload size={16} />
                                Upload New Picture
                              </>
                            )}
                          </Button>
                          
                          <input
                            id="avatar-upload-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          
                          {editForm.avatar_url && (
                            <Button
                              onClick={() => setEditForm(prev => ({ ...prev, avatar_url: '' }))}
                              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                            >
                              <X size={16} />
                              Remove Picture
                            </Button>
                          )}
                        </div>
                        
                      </div>

                      {/* Account Information */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Account Information</h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-gray-600 text-sm font-medium">User ID</p>
                            <p className="text-gray-800 font-mono text-sm">{user?.id}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm font-medium">Wallet Address</p>
                            <p className="text-gray-800 font-mono text-sm">{user?.wallet_address}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm font-medium">Account Created</p>
                            <p className="text-gray-800">{new Date(profile?.created_at || '').toLocaleDateString()}</p>
                          Upload an image file (max 5MB). Supported formats: JPG, PNG, GIF
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dashboard Tab */}
                {activeTab === 2 && isOwnProfile && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-6">Workspace Dashboard</h2>
                      <p className="text-gray-600 mb-8">
                        Manage your tasks, calendar, and get an overview of your financial performance.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Financial Overview */}
                      <FinancialOverview />
                      
                      {/* Task Manager */}
                      <TaskManager />
                      
                      {/* Calendar Widget */}
                      <CalendarWidget />
                      
                      {/* External Tools */}
                      <ExternalToolsWidget />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          {reviews && reviews.length > 0 && (
            <div className="gradient-card p-8">
              <ReviewsList 
                reviews={reviews}
                isLoading={reviewsLoading}
                error={reviewsError}
                showTitle={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};