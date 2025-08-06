import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  Github, 
  Twitter, 
  Linkedin, 
  Globe,
  Edit,
  Save,
  X,
  Settings,
  Bell,
  Star,
  Briefcase,
  DollarSign,
  Clock,
  Eye,
  Shield
} from 'lucide-react';
import { Button, Card, EmailNotificationsToggle, ReviewsList, GigViewsStats } from 'components';
import { useGetIsLoggedIn, useGetAccount } from 'lib';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useGigs } from '../../hooks/useGigs';
import { useOrders } from '../../hooks/useOrders';
import { useReviewsForProvider } from '../../hooks/useReviews';
import { useNotifications, useMarkAllNotificationsAsRead } from '../../hooks/useNotifications';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const Profile = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  
  // Determine if viewing own profile or someone else's
  const isOwnProfile = !id || (user && id === user.id);
  
  // Use appropriate profile hook
  const { data: profile, isLoading, error, refetch } = useProfile(isOwnProfile ? undefined : id);
  const { data: gigs } = useGigs();
  const { data: orders } = useOrders();
  const { data: reviews } = useReviewsForProvider(id || user?.id || '');
  const { data: notifications } = useNotifications();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const updateProfile = useUpdateProfile();

  // Get active tab from URL params
  const activeTabParam = searchParams.get('tab');
  const getInitialTab = () => {
    switch (activeTabParam) {
      case 'gigs': return 1;
      case 'orders': return 2;
      case 'reviews': return 3;
      case 'notifications': return 4;
      case 'settings': return 5;
      default: return 0;
    }
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    bio: '',
    twitter_url: '',
    github_url: '',
    linkedin_url: '',
    website_url: '',
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        twitter_url: profile.twitter_url || '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        website_url: profile.website_url || '',
      });
    }
  }, [profile]);

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [activeTabParam]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync(editForm);
      success('Profile updated successfully');
      setIsEditing(false);
      refetch();
    } catch (error) {
      showError('Failed to update profile');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadCount = notifications?.filter(n => !n.read).length || 0;
      
      if (unreadCount === 0) {
        showError('All notifications are already read');
        return;
      }

      await markAllAsRead.mutateAsync();
      success('All notifications marked as read');
    } catch (error) {
      showError('Failed to mark notifications as read');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const formatSocialUrl = (url: string, platform: string) => {
    if (!url) return '';
    
    // If it's already a full URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Add the appropriate platform prefix
    switch (platform) {
      case 'twitter':
        return `https://twitter.com/${url.replace('@', '')}`;
      case 'github':
        return `https://github.com/${url}`;
      case 'linkedin':
        return url.includes('linkedin.com') ? `https://${url}` : `https://linkedin.com/in/${url}`;
      default:
        return url.startsWith('www.') ? `https://${url}` : `https://www.${url}`;
    }
  };

  const tabs = [
    { id: 0, label: 'Overview', icon: <User size={16} /> },
    ...(isOwnProfile ? [
      { id: 1, label: 'My Gigs', icon: <Briefcase size={16} /> },
      { id: 2, label: 'My Orders', icon: <DollarSign size={16} /> },
      { id: 3, label: 'Reviews', icon: <Star size={16} /> },
      { id: 4, label: 'Notifications', icon: <Bell size={16} /> },
      { id: 5, label: 'Settings', icon: <Settings size={16} /> },
    ] : [
      { id: 1, label: 'Gigs', icon: <Briefcase size={16} /> },
      { id: 3, label: 'Reviews', icon: <Star size={16} /> },
    ])
  ];

  if (!isOwnProfile && !id) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Profile Not Found" reference="#">
          <p className="text-white">Profile not found.</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Loading Profile" reference="#">
          <div className="flex justify-center">
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-white">Loading profile...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Profile Error" reference="#">
          <p className="text-white">{error ? `Error: ${error.message}` : 'Profile not found'}</p>
        </Card>
      </div>
    );
  }

  // Calculate profile stats
  const totalGigs = gigs?.length || 0;
  const totalOrders = orders?.length || 0;
  const completedOrders = orders?.filter(order => order.status === 'completed').length || 0;
  const averageRating = reviews && reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;
  const unreadNotifications = notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="space-y-8">
        {/* Profile Header */}
        <Card className="p-8" title="Profile Header" reference="#">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-2xl text-white">
                  {profile.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{profile.full_name || profile.username}</h1>
                  <p className="text-gray-400">@{profile.username}</p>
                  <p className="text-gray-400 text-sm">
                    Member since {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {isOwnProfile && (
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  {isEditing ? <X size={16} /> : <Edit size={16} />}
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={editForm.username}
                      onChange={handleChange}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      value={editForm.full_name}
                      onChange={handleChange}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={editForm.bio}
                    onChange={handleChange}
                    rows={3}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Twitter</label>
                    <input
                      type="text"
                      name="twitter_url"
                      value={editForm.twitter_url}
                      onChange={handleChange}
                      placeholder="@username or full URL"
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">GitHub</label>
                    <input
                      type="text"
                      name="github_url"
                      value={editForm.github_url}
                      onChange={handleChange}
                      placeholder="username or full URL"
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">LinkedIn</label>
                    <input
                      type="text"
                      name="linkedin_url"
                      value={editForm.linkedin_url}
                      onChange={handleChange}
                      placeholder="username or full URL"
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Website</label>
                    <input
                      type="text"
                      name="website_url"
                      value={editForm.website_url}
                      onChange={handleChange}
                      placeholder="https://yourwebsite.com"
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfile.isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Save size={16} />
                    {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.bio && (
                  <p className="text-white text-lg">{profile.bio}</p>
                )}
                
                {/* Social Links */}
                <div className="flex gap-4 flex-wrap">
                  {profile.twitter_url && (
                    <a
                      href={formatSocialUrl(profile.twitter_url, 'twitter')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Twitter size={16} />
                      Twitter
                    </a>
                  )}
                  {profile.github_url && (
                    <a
                      href={formatSocialUrl(profile.github_url, 'github')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Github size={16} />
                      GitHub
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a
                      href={formatSocialUrl(profile.linkedin_url, 'linkedin')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Linkedin size={16} />
                      LinkedIn
                    </a>
                  )}
                  {profile.website_url && (
                    <a
                      href={formatSocialUrl(profile.website_url, 'website')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Globe size={16} />
                      Website
                    </a>
                  )}
                </div>

                {/* Profile Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-white">{totalGigs}</p>
                    <p className="text-gray-400 text-sm">Gigs</p>
                  </div>
                  <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-white">{completedOrders}</p>
                    <p className="text-gray-400 text-sm">Completed</p>
                  </div>
                  <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star size={16} className="text-yellow-400" />
                      <p className="text-2xl font-bold text-white">{averageRating.toFixed(1)}</p>
                    </div>
                    <p className="text-gray-400 text-sm">Rating</p>
                  </div>
                  <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-white">{reviews?.length || 0}</p>
                    <p className="text-gray-400 text-sm">Reviews</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <Card className="overflow-hidden" title="Profile Tabs" reference="#">
          <div className="border-b border-gray-700">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400 bg-gray-800'
                      : 'border-transparent text-gray-400 hover:text-blue-400'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.id === 4 && unreadNotifications > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Profile Overview</h2>
                
                {profile.bio ? (
                  <p className="text-white">{profile.bio}</p>
                ) : (
                  <p className="text-gray-400">No bio available.</p>
                )}

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {gigs?.slice(0, 3).map((gig) => (
                      <div key={gig.id} className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-medium">{gig.title}</p>
                            <p className="text-gray-400 text-sm">
                              Created {new Date(gig.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye size={14} className="text-gray-400" />
                            <span className="text-gray-400 text-sm">{gig.view_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* My Gigs Tab */}
            {activeTab === 1 && isOwnProfile && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">My Gigs ({totalGigs})</h2>
                  <Button
                    onClick={() => window.location.href = '/create-gig'}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Briefcase size={16} />
                    Create New Gig
                  </Button>
                </div>
                
                {gigs?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">You haven't created any gigs yet.</p>
                    <Button
                      onClick={() => window.location.href = '/create-gig'}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                      Create Your First Gig
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gigs?.map((gig) => (
                      <div
                        key={gig.id}
                        className="bg-gray-800 bg-opacity-50 rounded-lg overflow-hidden cursor-pointer hover:bg-opacity-70 transition-all"
                        onClick={() => window.location.href = `/gigs/${gig.id}`}
                      >
                        <img
                          src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                          alt={gig.title}
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-4 space-y-2">
                          <h3 className="text-white font-bold">{gig.title}</h3>
                          <p className="text-gray-400 text-sm line-clamp-2">{gig.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-400 font-bold">
                              {gig.price} {gig.payment_token === 'EGLD' ? 'EGLD' : 'IDEA'}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              gig.status === 'active' ? 'bg-green-100 text-green-800' :
                              gig.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {gig.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">{gig.duration} days</span>
                            <div className="flex items-center gap-1">
                              <Eye size={12} className="text-gray-400" />
                              <span className="text-gray-400">{gig.view_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Orders Tab */}
            {activeTab === 2 && isOwnProfile && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">My Orders ({totalOrders})</h2>
                
                {orders?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No orders yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders?.map((order) => (
                      <div
                        key={order.id}
                        className="bg-gray-800 bg-opacity-50 p-4 rounded-lg cursor-pointer hover:bg-opacity-70 transition-all"
                        onClick={() => window.location.href = `/orders/${order.id}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-medium">{order.gig?.title || 'Custom Project'}</p>
                            <p className="text-gray-400 text-sm">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-blue-400 font-bold">
                              {order.amount} {order.payment_token === 'EGLD' ? 'EGLD' : 'IDEA'}
                            </p>
                            <span className={`px-2 py-1 rounded text-xs ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'delivered' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Reviews</h2>
                <ReviewsList 
                  reviews={reviews || []} 
                  isLoading={false} 
                  error={null}
                  showTitle={false}
                />
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 4 && isOwnProfile && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">
                    Notifications {unreadNotifications > 0 && `(${unreadNotifications} unread)`}
                  </h2>
                  {unreadNotifications > 0 && (
                    <Button
                      onClick={handleMarkAllAsRead}
                      disabled={markAllAsRead.isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      {markAllAsRead.isLoading ? 'Marking...' : 'Mark All as Read'}
                    </Button>
                  )}
                </div>
                
                {notifications?.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell size={48} className="text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No notifications yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications?.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border transition-all ${
                          !notification.read 
                            ? 'bg-blue-900 bg-opacity-20 border-blue-500' 
                            : 'bg-gray-800 bg-opacity-50 border-gray-600'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`font-medium ${
                                !notification.read ? 'text-white' : 'text-gray-300'
                              }`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm mb-2">
                              {notification.content}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 5 && isOwnProfile && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Account Settings</h2>
                
                <div className="space-y-6">
                  <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Email Notifications</h3>
                    <EmailNotificationsToggle enabled={profile.email_notifications_enabled || false} />
                  </div>

                  <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Account Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Wallet Address:</span>
                        <span className="text-white font-mono text-sm">
                          {profile.wallet_address ? (
                            `${profile.wallet_address.substring(0, 8)}...${profile.wallet_address.substring(profile.wallet_address.length - 4)}`
                          ) : 'Not connected'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Member Since:</span>
                        <span className="text-white">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {profile.is_admin && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Account Type:</span>
                          <span className="text-purple-400 flex items-center gap-1">
                            <Shield size={14} />
                            Administrator
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};