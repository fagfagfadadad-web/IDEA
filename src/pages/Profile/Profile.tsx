import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Star, 
  Briefcase, 
  Settings, 
  Bell, 
  Edit,
  ExternalLink,
  Github,
  Twitter,
  Linkedin,
  Globe,
  MessageSquare,
  Eye,
  TrendingUp
} from 'lucide-react';
import { Button, Card, EmailNotificationsToggle, ReviewsList, GigViewsStats } from 'components';
import { useGetIsLoggedIn, useGetAccount } from 'lib';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useGigs } from '../../hooks/useGigs';
import { useOrders } from '../../hooks/useOrders';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const Profile = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();
  const { user } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  
  // Determine if viewing own profile or someone else's
  const isOwnProfile = !id || (user && id === user.id);
  const profileUserId = isOwnProfile ? user?.id : id;
  
  // Get initial tab from URL params
  const initialTab = searchParams.get('tab');
  const getInitialTabIndex = () => {
    switch (initialTab) {
      case 'gigs': return 1;
      case 'orders': return 2;
      case 'reviews': return 3;
      case 'analytics': return 4;
      case 'notifications': return 5;
      case 'settings': return 6;
      default: return 0;
    }
  };

  const [activeTab, setActiveTab] = useState(getInitialTabIndex());
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

  // Hooks for data
  const { data: profile, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useProfile(profileUserId);
  const { data: gigs, isLoading: gigsLoading } = useGigs();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: notifications, isLoading: notificationsLoading } = useNotifications(isOwnProfile ? user?.id : undefined);
  const updateProfile = useUpdateProfile();

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getInitialTabIndex());
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
      });
    }
  }, [profile, isOwnProfile]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // Reset form when canceling
      setEditForm({
        username: profile?.username || '',
        full_name: profile?.full_name || '',
        bio: profile?.bio || '',
        twitter_url: profile?.twitter_url || '',
        github_url: profile?.github_url || '',
        linkedin_url: profile?.linkedin_url || '',
        website_url: profile?.website_url || '',
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync(editForm);
      showSuccessToast('Profile updated successfully');
      setIsEditing(false);
      refetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      showErrorToast('Error updating profile');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // Calculate stats
  const completedOrders = orders?.filter(order => order.status === 'completed').length || 0;
  const averageRating = profile?.reviewsReceived && profile.reviewsReceived.length > 0 
    ? profile.reviewsReceived.reduce((sum: number, review: any) => sum + review.rating, 0) / profile.reviewsReceived.length 
    : 0;

  const tabs = [
    { id: 0, label: 'Overview', icon: <User size={16} /> },
    { id: 1, label: 'Gigs', icon: <Briefcase size={16} /> },
    { id: 2, label: 'Orders', icon: <Briefcase size={16} /> },
    { id: 3, label: 'Reviews', icon: <Star size={16} /> },
    ...(isOwnProfile ? [
      { id: 4, label: 'Analytics', icon: <TrendingUp size={16} /> },
      { id: 5, label: 'Notifications', icon: <Bell size={16} /> },
      { id: 6, label: 'Settings', icon: <Settings size={16} /> }
    ] : [])
  ];

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="flex justify-center py-8">
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-700">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="gradient-card p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-red-500 mr-3">⚠️</span>
                <span className="text-red-700 font-medium">
                  {profileError ? `Error: ${profileError.message}` : 'Profile not found'}
                </span>
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
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-24 h-24 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-400 to-pink-400 flex-shrink-0">
                  {profile.avatar_url ? (
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
                        {profile.username?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-2xl font-bold text-white">
                      {profile.username?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          name="username"
                          value={editForm.username}
                          onChange={handleInputChange}
                          placeholder="Username"
                          className="text-2xl font-bold bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 w-full md:w-auto"
                        />
                        <input
                          type="text"
                          name="full_name"
                          value={editForm.full_name}
                          onChange={handleInputChange}
                          placeholder="Full Name"
                          className="text-lg bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-600 w-full md:w-auto"
                        />
                      </div>
                    ) : (
                      <>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                          {profile.full_name || profile.username}
                        </h1>
                        {profile.full_name && (
                          <p className="text-lg text-gray-600">@{profile.username}</p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                    </div>
                    {averageRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star size={16} className="text-yellow-500" />
                        <span>{averageRating.toFixed(1)} ({profile.reviewsReceived?.length || 0} reviews)</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Briefcase size={16} />
                      <span>{completedOrders} completed orders</span>
                    </div>
                  </div>

                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={editForm.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 resize-none"
                    />
                  ) : (
                    <p className="text-gray-700 max-w-2xl">
                      {profile.bio || 'No bio available.'}
                    </p>
                  )}

                  {/* Social Links */}
                  {(profile.twitter_url || profile.github_url || profile.linkedin_url || profile.website_url || isEditing) && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-800">Links</h3>
                      <div className="flex flex-wrap gap-3">
                        {isEditing ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                            <input
                              type="url"
                              name="twitter_url"
                              value={editForm.twitter_url}
                              onChange={handleInputChange}
                              placeholder="Twitter URL"
                              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700"
                            />
                            <input
                              type="url"
                              name="github_url"
                              value={editForm.github_url}
                              onChange={handleInputChange}
                              placeholder="GitHub URL"
                              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700"
                            />
                            <input
                              type="url"
                              name="linkedin_url"
                              value={editForm.linkedin_url}
                              onChange={handleInputChange}
                              placeholder="LinkedIn URL"
                              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700"
                            />
                            <input
                              type="url"
                              name="website_url"
                              value={editForm.website_url}
                              onChange={handleInputChange}
                              placeholder="Website URL"
                              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700"
                            />
                          </div>
                        ) : (
                          <>
                            {profile.twitter_url && (
                              <a
                                href={profile.twitter_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                              >
                                <Twitter size={16} />
                                <span className="text-sm">Twitter</span>
                                <ExternalLink size={12} />
                              </a>
                            )}
                            {profile.github_url && (
                              <a
                                href={profile.github_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-gray-800 hover:text-gray-900 transition-colors"
                              >
                                <Github size={16} />
                                <span className="text-sm">GitHub</span>
                                <ExternalLink size={12} />
                              </a>
                            )}
                            {profile.linkedin_url && (
                              <a
                                href={profile.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-700 hover:text-blue-800 transition-colors"
                              >
                                <Linkedin size={16} />
                                <span className="text-sm">LinkedIn</span>
                                <ExternalLink size={12} />
                              </a>
                            )}
                            {profile.website_url && (
                              <a
                                href={profile.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors"
                              >
                                <Globe size={16} />
                                <span className="text-sm">Website</span>
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {isOwnProfile && (
                  <div className="flex flex-col gap-3">
                    {isEditing ? (
                      <>
                        <Button
                          onClick={handleSaveProfile}
                          disabled={updateProfile.isLoading}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                          <span>{updateProfile.isLoading ? 'Saving...' : 'Save Changes'}</span>
                        </Button>
                        <Button
                          onClick={handleEditToggle}
                          variant="outline"
                          className="px-4 py-2 rounded-lg"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleEditToggle}
                        variant="outline"
                        className="px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <Edit size={16} />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                )}
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
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
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
              {/* Overview Tab */}
              {activeTab === 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Briefcase size={20} className="text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{gigs?.length || 0}</p>
                          <p className="text-gray-600 text-sm">Active Gigs</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Star size={20} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-800">
                            {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                          </p>
                          <p className="text-gray-600 text-sm">Average Rating</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Briefcase size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{completedOrders}</p>
                          <p className="text-gray-600 text-sm">Completed Orders</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
                    {orders && orders.length > 0 ? (
                      <div className="space-y-3">
                        {orders.slice(0, 5).map((order) => (
                          <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                            <div>
                              <p className="text-gray-800 font-medium">
                                {order.gig?.title || 'Custom Project'}
                              </p>
                              <p className="text-gray-600 text-sm">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">No recent activity</p>
                    )}
                  </div>
                </div>
              )}

              {/* Gigs Tab */}
              {activeTab === 1 && (
                <div>
                  {gigsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : !gigs || gigs.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase size={24} className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No gigs yet</h3>
                      <p className="text-gray-600 mb-4">
                        {isOwnProfile ? "You haven't created any gigs yet." : "This user hasn't created any gigs yet."}
                      </p>
                      {isOwnProfile && (
                        <Button
                          onClick={() => navigate('/create-gig')}
                          variant="gradient"
                        >
                          Create Your First Gig
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {gigs.map((gig) => (
                        <div
                          key={gig.id}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                          onClick={() => navigate(`/gigs/${gig.id}`)}
                        >
                          <img
                            src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                            alt={gig.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-4">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">{gig.title}</h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{gig.description}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-indigo-600 font-bold">
                                {gig.price} {gig.payment_token === 'EGLD' ? 'EGLD' : 'IDEA'}
                              </span>
                              <span className="text-gray-500 text-sm">{gig.duration} days</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 2 && isOwnProfile && (
                <div>
                  {ordersLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : !orders || orders.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase size={24} className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No orders yet</h3>
                      <p className="text-gray-600">You don't have any orders yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-gray-800">
                                {order.gig?.title || 'Custom Project'}
                              </h3>
                              <p className="text-gray-600">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status}
                              </span>
                              <span className="text-indigo-600 font-bold">
                                {order.amount} {order.payment_token === 'EGLD' ? 'EGLD' : 'IDEA'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Tab - Show only reviews received by this provider */}
              {activeTab === 3 && (
                <div>
                  <ReviewsList 
                    reviews={profile.reviewsReceived || []}
                    isLoading={false}
                    error={null}
                    showTitle={true}
                  />
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 4 && isOwnProfile && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800">Analytics Overview</h3>
                  
                  {gigs && gigs.length > 0 ? (
                    <div className="space-y-6">
                      {gigs.map((gig) => (
                        <div key={gig.id} className="bg-white rounded-lg border border-gray-200 p-6">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-bold text-gray-800">{gig.title}</h4>
                            <Button
                              onClick={() => navigate(`/gigs/${gig.id}`)}
                              variant="outline"
                              size="sm"
                            >
                              <Eye size={16} />
                              View Gig
                            </Button>
                          </div>
                          <GigViewsStats gigId={gig.id} showDetailed={true} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUp size={24} className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No analytics data</h3>
                      <p className="text-gray-600 mb-4">Create some gigs to see analytics data.</p>
                      <Button
                        onClick={() => navigate('/create-gig')}
                        variant="gradient"
                      >
                        Create Your First Gig
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 5 && isOwnProfile && (
                <div>
                  {notificationsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : !notifications || notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell size={24} className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No notifications</h3>
                      <p className="text-gray-600">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border transition-all duration-200 ${
                            !notification.read 
                              ? 'bg-indigo-50 border-indigo-200' 
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800">{notification.title}</h4>
                              <p className="text-gray-600 text-sm mt-1">{notification.content}</p>
                              <p className="text-gray-500 text-xs mt-2">
                                {new Date(notification.created_at).toLocaleString()}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-2"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 6 && isOwnProfile && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800">Account Settings</h3>
                  
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 className="text-lg font-medium text-gray-800 mb-4">Email Notifications</h4>
                    <EmailNotificationsToggle enabled={profile.email_notifications_enabled || false} />
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 className="text-lg font-medium text-gray-800 mb-4">Account Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Wallet Address:</span>
                        <span className="text-gray-800 font-mono text-sm">
                          {profile.wallet_address ? 
                            `${profile.wallet_address.substring(0, 8)}...${profile.wallet_address.substring(profile.wallet_address.length - 4)}` 
                            : 'Not connected'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Member Since:</span>
                        <span className="text-gray-800">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add bottom padding for mobile navigation */}
        <div className="h-20 md:h-0"></div>
      </div>
    </div>
  );
};