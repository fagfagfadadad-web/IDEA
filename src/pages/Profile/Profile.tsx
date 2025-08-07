import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User, 
  Settings, 
  Star, 
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
  Check,
  Mail,
  Bell,
  Shield,
  Briefcase,
  DollarSign,
  Clock,
  Eye,
  MessageSquare,
  Plus,
  FileText,
  Award,
  TrendingUp
} from 'lucide-react';
import { Button, Card, ReviewsList, EmailNotificationsToggle, GigViewsStats } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useProfile, useUpdateProfile } from 'hooks/useProfile';
import { useGigs } from 'hooks/useGigs';
import { useOrders } from 'hooks/useOrders';
import { useReviewsForProvider } from 'hooks/useReviews';
import { useNotifications } from 'hooks/useNotifications';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  
  // Determine if viewing own profile or someone else's
  const isOwnProfile = !id || (user && id === user.id);
  const profileId = id || user?.id;
  
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
    website_url: ''
  });

  // Hooks for data
  const { data: profile, isLoading, error, refetch } = useProfile(profileId);
  const { data: gigs, isLoading: gigsLoading } = useGigs();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: providerReviews, isLoading: reviewsLoading, error: reviewsError } = useReviewsForProvider(profileId || '');
  const { data: notifications, isLoading: notificationsLoading } = useNotifications(isOwnProfile ? user?.id : undefined);
  const updateProfile = useUpdateProfile();

  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        twitter_url: profile.twitter_url || '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        website_url: profile.website_url || ''
      });
    }
  }, [profile]);

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [activeTabParam]);

  const handleTabChange = (tabIndex: number) => {
    setActiveTab(tabIndex);
    const tabNames = ['overview', 'gigs', 'orders', 'reviews', 'notifications', 'settings'];
    const newParams = new URLSearchParams(searchParams);
    if (tabIndex === 0) {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tabNames[tabIndex]);
    }
    navigate(`${window.location.pathname}?${newParams.toString()}`, { replace: true });
  };

  const handleSaveProfile = async () => {
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

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
    if (profile) {
      setEditForm({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        twitter_url: profile.twitter_url || '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        website_url: profile.website_url || ''
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCompletedOrdersCount = () => {
    return orders?.filter(order => order.status === 'completed').length || 0;
  };

  const getAverageRating = () => {
    if (!providerReviews || providerReviews.length === 0) return 0;
    const sum = providerReviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / providerReviews.length;
  };

  const getTotalEarnings = () => {
    const completedOrders = orders?.filter(order => 
      order.status === 'completed' && order.payment_status === 'released'
    ) || [];
    return completedOrders.reduce((sum, order) => sum + order.amount, 0);
  };

  if (isLoading) {
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

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <span className="text-red-500 mr-3">⚠️</span>
              <span className="text-red-700 font-medium">
                {error ? `Error: ${error.message}` : 'Profile not found'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 0, label: 'Overview', icon: <User size={16} /> },
    { id: 1, label: `Gigs (${gigs?.length || 0})`, icon: <Briefcase size={16} /> },
    { id: 2, label: `Orders (${orders?.length || 0})`, icon: <FileText size={16} /> },
    { id: 3, label: `Reviews (${providerReviews?.length || 0})`, icon: <Star size={16} /> },
    ...(isOwnProfile ? [
      { id: 4, label: `Notifications (${notifications?.filter(n => !n.read).length || 0})`, icon: <Bell size={16} /> },
      { id: 5, label: 'Settings', icon: <Settings size={16} /> }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="gradient-card p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-400 to-pink-400 flex-shrink-0">
                {profile.avatar_url ? (
                  <>
                    <img
                      src={profile.avatar_url}
                      alt={profile.username || "User"}
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                      {profile.full_name || profile.username}
                    </h1>
                    {profile.full_name && (
                      <p className="text-gray-600">@{profile.username}</p>
                    )}
                  </div>
                  
                  {isOwnProfile && (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit size={16} />
                      Edit Profile
                    </Button>
                  )}
                </div>
                
                {profile.bio && (
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {profile.bio}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>Joined {formatDate(profile.created_at)}</span>
                  </div>
                  
                  {profile.twitter_url && (
                    <a 
                      href={profile.twitter_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-indigo-600 transition-colors"
                    >
                      <Twitter size={16} />
                      <span>Twitter</span>
                    </a>
                  )}
                  
                  {profile.github_url && (
                    <a 
                      href={profile.github_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-indigo-600 transition-colors"
                    >
                      <Github size={16} />
                      <span>GitHub</span>
                    </a>
                  )}
                  
                  {profile.linkedin_url && (
                    <a 
                      href={profile.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-indigo-600 transition-colors"
                    >
                      <Linkedin size={16} />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  
                  {profile.website_url && (
                    <a 
                      href={profile.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-indigo-600 transition-colors"
                    >
                      <Globe size={16} />
                      <span>Website</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="gradient-card p-6 text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Briefcase size={24} className="text-indigo-600" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{gigs?.length || 0}</p>
              <p className="text-gray-600 text-sm">Active Gigs</p>
            </div>
            
            <div className="gradient-card p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award size={24} className="text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{getCompletedOrdersCount()}</p>
              <p className="text-gray-600 text-sm">Completed Orders</p>
            </div>
            
            <div className="gradient-card p-6 text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star size={24} className="text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {getAverageRating() > 0 ? getAverageRating().toFixed(1) : '0.0'}
              </p>
              <p className="text-gray-600 text-sm">Average Rating</p>
            </div>
            
            <div className="gradient-card p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp size={24} className="text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {getTotalEarnings().toFixed(2)}
              </p>
              <p className="text-gray-600 text-sm">Total Earnings (EGLD)</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="gradient-card overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="flex overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
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
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">About</h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <p className="text-gray-700 leading-relaxed">
                        {profile.bio || 'No bio available yet.'}
                      </p>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      {orders?.slice(0, 3).map((order) => (
                        <div key={order.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {order.gig?.title || 'Custom Project'}
                              </h4>
                              <p className="text-gray-600 text-sm">
                                {formatDate(order.created_at)}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'delivered' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      {(!orders || orders.length === 0) && (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Gigs Tab */}
              {activeTab === 1 && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">
                      {isOwnProfile ? 'My Gigs' : `${profile.username}'s Gigs`}
                    </h3>
                    {isOwnProfile && (
                      <Button
                        onClick={() => navigate('/create-gig')}
                        variant="gradient"
                        size="sm"
                      >
                        <Plus size={16} />
                        Create Gig
                      </Button>
                    )}
                  </div>
                  
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
                          size="md"
                        >
                          <Plus size={18} />
                          Create your first gig
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {gigs.map((gig) => (
                        <div
                          key={gig.id}
                          className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                          onClick={() => navigate(`/gigs/${gig.id}`)}
                        >
                          <img
                            src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                            alt={gig.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-4 space-y-3">
                            <h4 className="text-lg font-bold text-gray-800 line-clamp-2">
                              {gig.title}
                            </h4>
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {gig.description}
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="text-indigo-600 font-bold">
                                {gig.price} {gig.payment_token === 'EGLD' ? 'EGLD' : 'IDEA'}
                              </span>
                              <span className="text-gray-500 text-sm">
                                {gig.duration} days
                              </span>
                            </div>
                            
                            {isOwnProfile && (
                              <div className="pt-2 border-t border-gray-200">
                                <GigViewsStats gigId={gig.id} showDetailed={false} />
                              </div>
                            )}
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
                  <h3 className="text-xl font-bold text-gray-800 mb-6">My Orders</h3>
                  
                  {ordersLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : !orders || orders.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText size={24} className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No orders yet</h3>
                      <p className="text-gray-600 mb-4">
                        You haven't placed any orders yet.
                      </p>
                      <Button
                        onClick={() => navigate('/gigs')}
                        variant="gradient"
                        size="md"
                      >
                        <Eye size={18} />
                        Browse Gigs
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <h4 className="text-lg font-bold text-gray-800">
                                {order.gig?.title || 'Custom Project'}
                              </h4>
                              <p className="text-gray-600">
                                Order placed on {formatDate(order.created_at)}
                              </p>
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <DollarSign size={16} className="text-green-600" />
                                  <span className="font-medium">{order.amount} {order.payment_token}</span>
                                </span>
                                {order.deadline && (
                                  <span className="flex items-center gap-1">
                                    <Clock size={16} className="text-orange-600" />
                                    <span className="text-sm">Due {formatDate(order.deadline)}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'delivered' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                order.payment_status === 'released' ? 'bg-green-100 text-green-800' :
                                order.payment_status === 'escrowed' ? 'bg-blue-100 text-blue-800' :
                                order.payment_status === 'disputed' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                Payment: {order.payment_status}
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
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6">
                    {isOwnProfile ? 'Reviews I Received' : `Reviews for ${profile.username}`}
                  </h3>
                  
                  <ReviewsList 
                    reviews={providerReviews || []}
                    isLoading={reviewsLoading}
                    error={reviewsError}
                    showTitle={false}
                  />
                </div>
              )}

              {/* Notifications Tab - Only for own profile */}
              {activeTab === 4 && isOwnProfile && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Notifications</h3>
                  
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
                      <p className="text-gray-600">
                        You're all caught up! New notifications will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border ${
                            notification.read 
                              ? 'bg-gray-50 border-gray-200' 
                              : 'bg-indigo-50 border-indigo-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <h4 className="font-medium text-gray-800">
                                {notification.title}
                              </h4>
                              <p className="text-gray-600 text-sm">
                                {notification.content}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {formatDate(notification.created_at)}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab - Only for own profile */}
              {activeTab === 5 && isOwnProfile && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Account Settings</h3>
                  
                  <div className="space-y-8">
                    {/* Profile Information */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-bold text-gray-800">Profile Information</h4>
                        {!isEditing && (
                          <Button
                            onClick={() => setIsEditing(true)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit size={16} />
                            Edit
                          </Button>
                        )}
                      </div>
                      
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              placeholder="Tell others about yourself..."
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-gray-700 text-sm font-medium mb-2">
                                Twitter URL
                              </label>
                              <input
                                type="url"
                                value={editForm.twitter_url}
                                onChange={(e) => setEditForm({...editForm, twitter_url: e.target.value})}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="https://twitter.com/username"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-gray-700 text-sm font-medium mb-2">
                                GitHub URL
                              </label>
                              <input
                                type="url"
                                value={editForm.github_url}
                                onChange={(e) => setEditForm({...editForm, github_url: e.target.value})}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="https://github.com/username"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-gray-700 text-sm font-medium mb-2">
                                LinkedIn URL
                              </label>
                              <input
                                type="url"
                                value={editForm.linkedin_url}
                                onChange={(e) => setEditForm({...editForm, linkedin_url: e.target.value})}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="https://linkedin.com/in/username"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-gray-700 text-sm font-medium mb-2">
                                Website URL
                              </label>
                              <input
                                type="url"
                                value={editForm.website_url}
                                onChange={(e) => setEditForm({...editForm, website_url: e.target.value})}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="https://yourwebsite.com"
                              />
                            </div>
                          </div>
                          
                          <div className="flex gap-3 pt-4">
                            <Button
                              onClick={handleCancelEdit}
                              variant="outline"
                              className="flex-1"
                            >
                              <X size={16} />
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSaveProfile}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                              disabled={updateProfile.isLoading}
                            >
                              <Save size={16} />
                              {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-gray-600 text-sm font-medium mb-1">
                                Username
                              </label>
                              <p className="text-gray-800 font-medium">{profile.username}</p>
                            </div>
                            
                            <div>
                              <label className="block text-gray-600 text-sm font-medium mb-1">
                                Full Name
                              </label>
                              <p className="text-gray-800 font-medium">
                                {profile.full_name || 'Not set'}
                              </p>
                            </div>
                            
                            <div className="md:col-span-2">
                              <label className="block text-gray-600 text-sm font-medium mb-1">
                                Bio
                              </label>
                              <p className="text-gray-800">
                                {profile.bio || 'No bio set'}
                              </p>
                            </div>
                            
                            <div>
                              <label className="block text-gray-600 text-sm font-medium mb-1">
                                Wallet Address
                              </label>
                              <p className="text-gray-800 font-mono text-sm break-all">
                                {profile.wallet_address || 'Not connected'}
                              </p>
                            </div>
                            
                            <div>
                              <label className="block text-gray-600 text-sm font-medium mb-1">
                                Member Since
                              </label>
                              <p className="text-gray-800">
                                {formatDate(profile.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Email Notifications */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4">Email Notifications</h4>
                      <EmailNotificationsToggle enabled={profile.email_notifications_enabled || false} />
                    </div>

                    {/* Account Security */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4">Account Security</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-800 font-medium">Wallet Connected</p>
                            <p className="text-gray-600 text-sm">
                              Your MultiversX wallet is securely connected
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield size={16} className="text-green-600" />
                            <span className="text-green-600 font-medium">Secured</span>
                          </div>
                        </div>
                        
                        {profile.is_admin && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                              <Shield size={16} className="text-purple-600" />
                              <span className="text-purple-800 font-medium">Admin Account</span>
                            </div>
                            <p className="text-purple-700 text-sm mt-1">
                              You have administrative privileges on this platform.
                            </p>
                          </div>
                        )}
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