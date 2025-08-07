import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User, 
  Edit, 
  Save, 
  X, 
  Star, 
  Calendar, 
  MapPin, 
  Globe, 
  Github, 
  Linkedin, 
  Twitter,
  Settings,
  Bell,
  Shield,
  Briefcase,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  MessageSquare
} from 'lucide-react';
import { Button, Card, EmailNotificationsToggle, ReviewsList, StarRating } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useReviewsForProvider } from '../../hooks/useReviews';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNotifications, useMarkAllNotificationsAsRead } from '../../hooks/useNotifications';

export const Profile = () => {
  const { id: profileId } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get the active tab from URL params
  const activeTabParam = searchParams.get('tab');
  const getInitialTab = () => {
    switch (activeTabParam) {
      case 'orders': return 1;
      case 'reviews': return 2;
      case 'settings': return 3;
      case 'notifications': return 4;
      default: return 0;
    }
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    bio: '',
    avatar_url: '',
    twitter_url: '',
    github_url: '',
    linkedin_url: '',
    website_url: '',
  });

  // Determine if we're viewing our own profile or someone else's
  const isOwnProfile = !profileId || profileId === user?.id;
  
  // Use different variable names to avoid conflicts
  const { data: ownProfile, isLoading, error, refetch } = useProfile(profileId);
  
  // For notifications (only for own profile)
  const { data: notifications } = useNotifications(isOwnProfile ? user?.id : undefined);
  const markAllAsRead = useMarkAllNotificationsAsRead();
  
  // For provider reviews - use the profile ID we're viewing
  const reviewsUserId = profileId || user?.id || '';
  const { data: viewedProviderReviews, isLoading: reviewsLoading, error: reviewsError } = useReviewsForProvider(reviewsUserId);
  
  const updateProfile = useUpdateProfile();

  // Use ownProfile for display
  const displayProfile = ownProfile;

  // Update URL when tab changes
  useEffect(() => {
    const tabNames = ['profile', 'orders', 'reviews', 'settings', 'notifications'];
    const newTab = tabNames[activeTab];
    
    if (newTab && newTab !== 'profile') {
      const params = new URLSearchParams(searchParams);
      params.set('tab', newTab);
      setSearchParams(params);
    } else {
      const params = new URLSearchParams(searchParams);
      params.delete('tab');
      setSearchParams(params);
    }
  }, [activeTab, searchParams, setSearchParams]);

  // Initialize edit form when profile data is loaded
  useEffect(() => {
    if (displayProfile && isOwnProfile) {
      setEditForm({
        username: displayProfile.username || '',
        full_name: displayProfile.full_name || '',
        bio: displayProfile.bio || '',
        avatar_url: displayProfile.avatar_url || '',
        twitter_url: displayProfile.twitter_url || '',
        github_url: displayProfile.github_url || '',
        linkedin_url: displayProfile.linkedin_url || '',
        website_url: displayProfile.website_url || '',
      });
    }
  }, [displayProfile, isOwnProfile]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form to original values when canceling
      if (displayProfile) {
        setEditForm({
          username: displayProfile.username || '',
          full_name: displayProfile.full_name || '',
          bio: displayProfile.bio || '',
          avatar_url: displayProfile.avatar_url || '',
          twitter_url: displayProfile.twitter_url || '',
          github_url: displayProfile.github_url || '',
          linkedin_url: displayProfile.linkedin_url || '',
          website_url: displayProfile.website_url || '',
        });
      }
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(editForm);
      setIsEditing(false);
      showSuccessToast('Profile updated successfully');
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

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      showSuccessToast('All notifications marked as read');
    } catch (error) {
      showErrorToast('Error marking notifications as read');
    }
  };

  const getAverageRating = () => {
    if (!viewedProviderReviews || viewedProviderReviews.length === 0) return 0;
    const total = viewedProviderReviews.reduce((sum: number, review: any) => sum + review.rating, 0);
    return total / viewedProviderReviews.length;
  };

  const unreadNotificationsCount = notifications?.filter(n => !n.read).length || 0;

  const tabs = [
    { id: 0, label: 'Profile', icon: <User size={16} /> },
    { id: 1, label: 'Orders', icon: <Briefcase size={16} /> },
    { id: 2, label: 'Reviews', icon: <Star size={16} /> },
    ...(isOwnProfile ? [
      { id: 3, label: 'Settings', icon: <Settings size={16} /> },
      { 
        id: 4, 
        label: `Notifications${unreadNotificationsCount > 0 ? ` (${unreadNotificationsCount})` : ''}`, 
        icon: <Bell size={16} /> 
      }
    ] : [])
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
                <AlertTriangle className="text-red-500 mr-3" size={20} />
                <span className="text-red-700 font-medium">Error loading profile: {error.message}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!displayProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="gradient-card p-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="text-yellow-600 mr-3" size={20} />
                <span className="text-yellow-800 font-medium">Profile not found</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const averageRating = getAverageRating();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="gradient-card p-8">
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-400 to-pink-400">
                    {displayProfile.avatar_url ? (
                      <>
                        <img
                          src={displayProfile.avatar_url}
                          alt={displayProfile.username || "Profile"}
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
                          {displayProfile.username?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-2xl font-bold text-white">
                        {displayProfile.username?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                      {displayProfile.full_name || displayProfile.username}
                    </h1>
                    <p className="text-gray-600">@{displayProfile.username}</p>
                    {displayProfile.bio && (
                      <p className="text-gray-700 max-w-md">{displayProfile.bio}</p>
                    )}
                    
                    {/* Rating Display for Providers */}
                    {viewedProviderReviews && viewedProviderReviews.length > 0 && (
                      <div className="flex items-center gap-2">
                        <StarRating 
                          rating={averageRating}
                          size={16}
                          showText={true}
                          showCount={true}
                          reviewCount={viewedProviderReviews.length}
                          className="text-gray-700"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {isOwnProfile && (
                  <div className="flex gap-3">
                    {isEditing ? (
                      <>
                        <Button
                          onClick={handleEditToggle}
                          variant="outline"
                          size="md"
                        >
                          <X size={16} />
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={updateProfile.isLoading}
                          variant="gradient"
                          size="md"
                        >
                          <Save size={16} />
                          {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleEditToggle}
                        variant="gradient"
                        size="md"
                      >
                        <Edit size={16} />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Social Links */}
              {(displayProfile.twitter_url || displayProfile.github_url || displayProfile.linkedin_url || displayProfile.website_url) && (
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  {displayProfile.twitter_url && (
                    <a
                      href={displayProfile.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-blue-500 transition-colors"
                    >
                      <Twitter size={20} />
                    </a>
                  )}
                  {displayProfile.github_url && (
                    <a
                      href={displayProfile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <Github size={20} />
                    </a>
                  )}
                  {displayProfile.linkedin_url && (
                    <a
                      href={displayProfile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Linkedin size={20} />
                    </a>
                  )}
                  {displayProfile.website_url && (
                    <a
                      href={displayProfile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                      <Globe size={20} />
                    </a>
                  )}
                </div>
              )}

              {/* Profile Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{displayProfile.gigs?.length || 0}</p>
                  <p className="text-gray-600 text-sm">Active Gigs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{displayProfile.orders?.length || 0}</p>
                  <p className="text-gray-600 text-sm">Total Orders</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{viewedProviderReviews?.length || 0}</p>
                  <p className="text-gray-600 text-sm">Reviews</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">
                    {new Date(displayProfile.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600 text-sm">Member Since</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
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
                        : 'border-transparent text-gray-500 hover:text-indigo-600'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-6">
              {/* Profile Tab */}
              {activeTab === 0 && (
                <div className="space-y-6">
                  {isEditing && isOwnProfile ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-gray-800 text-sm font-bold mb-2">
                            Username
                          </label>
                          <input
                            type="text"
                            name="username"
                            value={editForm.username}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-800 text-sm font-bold mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            name="full_name"
                            value={editForm.full_name}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-800 text-sm font-bold mb-2">
                          Bio
                        </label>
                        <textarea
                          name="bio"
                          value={editForm.bio}
                          onChange={handleChange}
                          rows={4}
                          className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Tell others about yourself, your skills, and experience..."
                        />
                      </div>

                      <div>
                        <label className="block text-gray-800 text-sm font-bold mb-2">
                          Avatar URL
                        </label>
                        <input
                          type="url"
                          name="avatar_url"
                          value={editForm.avatar_url}
                          onChange={handleChange}
                          className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="https://example.com/avatar.jpg"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-gray-800 text-sm font-bold mb-2">
                            Twitter URL
                          </label>
                          <input
                            type="url"
                            name="twitter_url"
                            value={editForm.twitter_url}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="https://twitter.com/username"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-800 text-sm font-bold mb-2">
                            GitHub URL
                          </label>
                          <input
                            type="url"
                            name="github_url"
                            value={editForm.github_url}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="https://github.com/username"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-800 text-sm font-bold mb-2">
                            LinkedIn URL
                          </label>
                          <input
                            type="url"
                            name="linkedin_url"
                            value={editForm.linkedin_url}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="https://linkedin.com/in/username"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-800 text-sm font-bold mb-2">
                            Website URL
                          </label>
                          <input
                            type="url"
                            name="website_url"
                            value={editForm.website_url}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {displayProfile.bio ? (
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 mb-3">About</h3>
                          <p className="text-gray-700 leading-relaxed">{displayProfile.bio}</p>
                        </div>
                      ) : isOwnProfile ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <User className="text-blue-600 mr-3" size={20} />
                            <div>
                              <p className="text-blue-800 font-medium">Complete your profile</p>
                              <p className="text-blue-700 text-sm">Add a bio and social links to help clients learn more about you.</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">This user hasn't added a bio yet.</p>
                        </div>
                      )}

                      {/* Contact Information */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-3">Contact Information</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-gray-500" />
                              <span className="text-gray-700">
                                Member since {new Date(displayProfile.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {displayProfile.wallet_address && (
                              <div className="flex items-center gap-2">
                                <Shield size={16} className="text-gray-500" />
                                <span className="text-gray-700 text-sm font-mono">
                                  {displayProfile.wallet_address.substring(0, 8)}...{displayProfile.wallet_address.substring(displayProfile.wallet_address.length - 4)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 1 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800">Order History</h3>
                  
                  {!displayProfile.orders || displayProfile.orders.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase size={24} className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No orders yet</h3>
                      <p className="text-gray-600">
                        {isOwnProfile ? "You haven't placed any orders yet." : "This user hasn't placed any orders yet."}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {displayProfile.orders.map((order: any) => (
                        <div
                          key={order.id}
                          className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          <div className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <h4 className="text-lg font-bold text-gray-800 line-clamp-2">
                                {order.gig?.title || 'Custom Project'}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'delivered' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1">
                                <DollarSign size={14} className="text-green-600" />
                                <span className="text-gray-800 font-medium">
                                  {order.amount} {order.payment_token === 'EGLD' ? 'EGLD' : 'IDEA'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={14} className="text-gray-500" />
                                <span className="text-gray-600 text-sm">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            {/* Client info for provider orders, provider info for client orders */}
                            {order.client && (
                              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                                <div className="w-6 h-6 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-400 to-pink-400">
                                  {order.client.avatar_url ? (
                                    <>
                                      <img
                                        src={order.client.avatar_url}
                                        alt={order.client.username || "Client"}
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
                                        className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-xs text-white absolute inset-0"
                                        style={{ display: 'none' }}
                                      >
                                        {order.client.username?.charAt(0)?.toUpperCase() || "C"}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-xs text-white">
                                      {order.client.username?.charAt(0)?.toUpperCase() || "C"}
                                    </div>
                                  )}
                                </div>
                                <span className="text-gray-600 text-sm">
                                  Client: {order.client.username}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 2 && (
                <div>
                  <ReviewsList 
                    reviews={viewedProviderReviews || []}
                    isLoading={reviewsLoading}
                    error={reviewsError}
                    showTitle={true}
                  />
                </div>
              )}

              {/* Settings Tab (only for own profile) */}
              {activeTab === 3 && isOwnProfile && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800">Account Settings</h3>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-4">Email Notifications</h4>
                    <EmailNotificationsToggle enabled={displayProfile.email_notifications_enabled || false} />
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-4">Account Information</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Wallet Address:</span>
                        <span className="text-gray-800 font-mono text-sm">
                          {displayProfile.wallet_address ? (
                            `${displayProfile.wallet_address.substring(0, 8)}...${displayProfile.wallet_address.substring(displayProfile.wallet_address.length - 4)}`
                          ) : 'Not connected'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Member Since:</span>
                        <span className="text-gray-800">
                          {new Date(displayProfile.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {displayProfile.is_admin && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Account Type:</span>
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium flex items-center gap-1">
                            <Shield size={14} />
                            Administrator
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab (only for own profile) */}
              {activeTab === 4 && isOwnProfile && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">Notifications</h3>
                    {unreadNotificationsCount > 0 && (
                      <Button
                        onClick={handleMarkAllNotificationsAsRead}
                        disabled={markAllAsRead.isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        {markAllAsRead.isLoading ? 'Marking...' : `Mark all ${unreadNotificationsCount} as read`}
                      </Button>
                    )}
                  </div>
                  
                  {!notifications || notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell size={24} className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No notifications</h3>
                      <p className="text-gray-600">
                        You're all caught up! New notifications will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200 ${
                            !notification.read ? 'border-l-4 border-l-indigo-500 bg-indigo-50' : ''
                          }`}
                          onClick={() => {
                            // Handle notification click - navigate to relevant page
                            if (notification.data?.order_id) {
                              navigate(`/orders/${notification.data.order_id}`);
                            } else if (notification.data?.proposal_id) {
                              navigate(`/proposals/${notification.data.proposal_id}`);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                  {notification.title}
                                </h4>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                )}
                              </div>
                              <p className={`text-sm ${!notification.read ? 'text-gray-700' : 'text-gray-600'}`}>
                                {notification.content}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(notification.created_at).toLocaleString()}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {notification.type === 'message' && <MessageSquare size={16} className="text-blue-500" />}
                              {notification.type === 'order_created' && <Briefcase size={16} className="text-green-500" />}
                              {notification.type === 'payment_released' && <DollarSign size={16} className="text-green-500" />}
                              {notification.type === 'dispute_created' && <AlertTriangle size={16} className="text-red-500" />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Add bottom padding for mobile navigation */}
          <div className="h-20 md:h-0"></div>
        </div>
      </div>
    </div>
  );
};