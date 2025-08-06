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
  Plus,
  Briefcase,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  FileText,
  Bell
} from 'lucide-react';
import { Button, Card, EmailNotificationsToggle, ReviewsList, StarRating, GigViewsStats } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useGigs, useUpdateGigStatus, useDeleteGig } from '../../hooks/useGigs';
import { useOrders } from '../../hooks/useOrders';
import { useReviewsForProvider } from '../../hooks/useReviews';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  
  // Determine if viewing own profile or someone else's
  const isOwnProfile = !id || (user && id === user.id);
  const profileId = id || user?.id;
  
  // Get initial tab from URL params
  const initialTab = searchParams.get('tab');
  const getInitialTabIndex = () => {
    switch (initialTab) {
      case 'gigs': return 1;
      case 'orders': return 2;
      case 'reviews': return 3;
      case 'notifications': return 4;
      case 'settings': return 5;
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
    website_url: ''
  });

  // Hooks
  const { data: profile, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useProfile(profileId);
  const { data: gigs, isLoading: gigsLoading, refetch: refetchGigs } = useGigs();
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useOrders();
  const { data: reviews, isLoading: reviewsLoading } = useReviewsForProvider(profileId || '');
  const { data: notifications, isLoading: notificationsLoading } = useNotifications(user?.id);
  const updateProfile = useUpdateProfile();
  const updateGigStatus = useUpdateGigStatus();
  const deleteGig = useDeleteGig();

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
        website_url: profile.website_url || ''
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync(editForm);
      setIsEditing(false);
      refetchProfile();
      success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Error updating profile');
    }
  };

  const handleGigStatusUpdate = async (gigId: string, status: string) => {
    try {
      await updateGigStatus.mutateAsync({ id: gigId, status });
      refetchGigs();
      success(`Gig ${status} successfully!`);
    } catch (error) {
      console.error('Error updating gig status:', error);
      showError('Error updating gig status');
    }
  };

  const handleDeleteGig = async (gigId: string) => {
    if (!confirm('Are you sure you want to delete this gig?')) return;
    
    try {
      await deleteGig.mutateAsync(gigId);
      refetchGigs();
      success('Gig deleted successfully!');
    } catch (error) {
      console.error('Error deleting gig:', error);
      showError('Error deleting gig');
    }
  };

  // Filter orders that need action from the user
  const getPendingOrders = () => {
    if (!orders || !isOwnProfile) return [];
    
    return orders.filter(order => {
      const isClient = user?.id === order.client?.id;
      const isProvider = user?.id === order.gig?.provider_id || 
                        user?.wallet_address === order.provider_address;
      
      // Client needs to pay
      if (isClient && order.payment_status === 'pending' && 
          (order.status === 'pending_approval' || order.status === 'in_progress')) {
        return true;
      }
      
      // Client needs to release payment
      if (isClient && order.status === 'delivered' && order.payment_status === 'escrowed') {
        return true;
      }
      
      // Provider needs to submit work
      if (isProvider && order.status === 'in_progress' && 
          order.payment_status === 'escrowed' && order.work_status !== 'submitted') {
        return true;
      }
      
      // Client can write review
      if (isClient && order.status === 'completed' && order.payment_status === 'released') {
        return true;
      }
      
      return false;
    });
  };

  const getActionType = (order: any) => {
    const isClient = user?.id === order.client?.id;
    const isProvider = user?.id === order.gig?.provider_id || 
                      user?.wallet_address === order.provider_address;
    
    if (isClient && order.payment_status === 'pending') {
      return { type: 'payment', label: 'Payment Required', color: 'red', icon: <DollarSign size={16} /> };
    }
    
    if (isClient && order.status === 'delivered') {
      return { type: 'release', label: 'Review & Release Payment', color: 'green', icon: <CheckCircle size={16} /> };
    }
    
    if (isProvider && order.status === 'in_progress' && order.work_status !== 'submitted') {
      return { type: 'submit', label: 'Submit Work', color: 'blue', icon: <FileText size={16} /> };
    }
    
    if (isClient && order.status === 'completed') {
      return { type: 'review', label: 'Write Review', color: 'yellow', icon: <Star size={16} /> };
    }
    
    return { type: 'unknown', label: 'Action Required', color: 'gray', icon: <Bell size={16} /> };
  };

  const pendingOrders = getPendingOrders();

  const tabs = [
    { id: 0, label: 'Overview', icon: <User size={16} /> },
    ...(isOwnProfile ? [
      { id: 1, label: 'My Gigs', icon: <Briefcase size={16} /> },
      { id: 2, label: 'My Orders', icon: <Clock size={16} /> },
      { id: 3, label: 'Reviews', icon: <Star size={16} /> },
      { id: 4, label: 'Notifications', icon: <Bell size={16} /> },
      { id: 5, label: 'Settings', icon: <Settings size={16} /> }
    ] : [
      { id: 1, label: 'Gigs', icon: <Briefcase size={16} /> },
      { id: 3, label: 'Reviews', icon: <Star size={16} /> }
    ])
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertTriangle className="text-red-500 mr-3" size={20} />
              <span className="text-red-700 font-medium">
                {profileError ? `Error: ${profileError.message}` : 'Profile not found'}
              </span>
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
              <div className="w-24 h-24 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-3xl font-bold text-white">
                {profile.username?.charAt(0)?.toUpperCase() || "U"}
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                    {profile.full_name || profile.username}
                  </h1>
                  {isOwnProfile && (
                    <Button
                      onClick={() => setIsEditing(!isEditing)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit size={16} />
                      {isEditing ? 'Cancel' : 'Edit Profile'}
                    </Button>
                  )}
                </div>
                
                <p className="text-gray-600">@{profile.username}</p>
                
                {profile.bio && (
                  <p className="text-gray-700 max-w-2xl">
                    {profile.bio}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Social Links */}
                {(profile.twitter_url || profile.github_url || profile.linkedin_url || profile.website_url) && (
                  <div className="flex gap-3 pt-2">
                    {profile.twitter_url && (
                      <a
                        href={profile.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-blue-500 transition-colors"
                      >
                        <Twitter size={20} />
                      </a>
                    )}
                    {profile.github_url && (
                      <a
                        href={profile.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        <Github size={20} />
                      </a>
                    )}
                    {profile.linkedin_url && (
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        <Linkedin size={20} />
                      </a>
                    )}
                    {profile.website_url && (
                      <a
                        href={profile.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-indigo-600 transition-colors"
                      >
                        <Globe size={20} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          {isEditing && isOwnProfile && (
            <div className="gradient-card p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Edit Profile</h2>
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
                      className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                      className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Tell us about yourself..."
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
                      className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                      className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                      className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                      className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    <X size={16} />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfile.isLoading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Save size={16} />
                    {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          )}

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
              {/* Overview Tab */}
              {activeTab === 0 && (
                <div className="space-y-8">
                  {/* Orders Waiting for Action - Only for own profile */}
                  {isOwnProfile && pendingOrders.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-800">Orders Waiting for Action</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingOrders.map((order) => {
                          const action = getActionType(order);
                          const tokenSymbol = order.payment_token === 'EGLD' ? 'EGLD' : 'IDEA';
                          
                          return (
                            <div
                              key={order.id}
                              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => navigate(`/orders/${order.id}`)}
                            >
                              <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium text-gray-800 line-clamp-1">
                                    {order.gig?.title || 'Custom Project'}
                                  </h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    action.color === 'red' ? 'bg-red-100 text-red-800' :
                                    action.color === 'green' ? 'bg-green-100 text-green-800' :
                                    action.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                    action.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {action.label}
                                  </span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600 text-sm">
                                    {order.amount} {tokenSymbol}
                                  </span>
                                  <span className="text-gray-500 text-xs">
                                    {new Date(order.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                
                                <div className={`flex items-center gap-2 text-sm ${
                                  action.color === 'red' ? 'text-red-600' :
                                  action.color === 'green' ? 'text-green-600' :
                                  action.color === 'blue' ? 'text-blue-600' :
                                  action.color === 'yellow' ? 'text-yellow-600' :
                                  'text-gray-600'
                                }`}>
                                  {action.icon}
                                  <span className="font-medium">{action.label}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recent Orders - Only for own profile */}
                  {isOwnProfile && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-800">Recent Orders</h3>
                      {ordersLoading ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                      ) : !orders || orders.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Briefcase size={24} className="text-gray-400" />
                          </div>
                          <h4 className="text-lg font-medium text-gray-800 mb-2">No orders yet</h4>
                          <p className="text-gray-600">
                            Your orders will appear here once you start using the platform.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {orders.slice(0, 6).map((order) => {
                            const tokenSymbol = order.payment_token === 'EGLD' ? 'EGLD' : 'IDEA';
                            
                            return (
                              <div
                                key={order.id}
                                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate(`/orders/${order.id}`)}
                              >
                                <div className="space-y-3">
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-medium text-gray-800 line-clamp-1">
                                      {order.gig?.title || 'Custom Project'}
                                    </h4>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                      order.status === 'delivered' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600 text-sm">
                                      {order.amount} {tokenSymbol}
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                      {new Date(order.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stats for public profiles */}
                  {!isOwnProfile && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h4 className="text-lg font-medium text-gray-800 mb-2">Active Gigs</h4>
                        <p className="text-3xl font-bold text-indigo-600">
                          {gigs?.filter(g => g.status === 'active').length || 0}
                        </p>
                      </div>
                      
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h4 className="text-lg font-medium text-gray-800 mb-2">Total Reviews</h4>
                        <p className="text-3xl font-bold text-green-600">
                          {reviews?.length || 0}
                        </p>
                      </div>
                      
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h4 className="text-lg font-medium text-gray-800 mb-2">Average Rating</h4>
                        <div className="flex items-center gap-2">
                          <p className="text-3xl font-bold text-yellow-600">
                            {reviews && reviews.length > 0 
                              ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
                              : '0.0'
                            }
                          </p>
                          <StarRating 
                            rating={reviews && reviews.length > 0 
                              ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
                              : 0
                            }
                            size={20}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* My Gigs Tab */}
              {activeTab === 1 && isOwnProfile && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">My Gigs</h3>
                    <Button
                      onClick={() => navigate('/create-gig')}
                      variant="gradient"
                      size="sm"
                    >
                      <Plus size={16} />
                      Create New Gig
                    </Button>
                  </div>
                  
                  {gigsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : !gigs || gigs.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase size={24} className="text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-800 mb-2">No gigs yet</h4>
                      <p className="text-gray-600 mb-4">
                        Create your first gig to start offering your services.
                      </p>
                      <Button
                        onClick={() => navigate('/create-gig')}
                        variant="gradient"
                        size="md"
                      >
                        <Plus size={16} />
                        Create Your First Gig
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {gigs.map((gig) => (
                        <div
                          key={gig.id}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <img
                            src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                            alt={gig.title}
                            className="w-full h-32 object-cover"
                          />
                          
                          <div className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-gray-800 line-clamp-2">
                                {gig.title}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                gig.status === 'active' ? 'bg-green-100 text-green-800' :
                                gig.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {gig.status}
                              </span>
                            </div>
                            
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
                            
                            <div className="flex gap-2 pt-2">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/gigs/${gig.id}`);
                                }}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                              >
                                View
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/gigs/${gig.id}/edit`);
                                }}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                              >
                                Edit
                              </Button>
                            </div>
                            
                            <GigViewsStats gigId={gig.id} className="pt-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Public Gigs Tab (for viewing other profiles) */}
              {activeTab === 1 && !isOwnProfile && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800">Public Gigs</h3>
                  
                  {gigsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : !gigs || gigs.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase size={24} className="text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-800 mb-2">No public gigs</h4>
                      <p className="text-gray-600">
                        This user hasn't published any gigs yet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {gigs.filter(g => g.status === 'active').map((gig) => (
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
                          
                          <div className="p-4 space-y-3">
                            <h4 className="font-medium text-gray-800 line-clamp-2">
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
                  <h3 className="text-xl font-bold text-gray-800">My Orders</h3>
                  
                  {ordersLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : !orders || orders.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock size={24} className="text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-800 mb-2">No orders yet</h4>
                      <p className="text-gray-600">
                        Your orders will appear here once you start using the platform.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => {
                        const tokenSymbol = order.payment_token === 'EGLD' ? 'EGLD' : 'IDEA';
                        
                        return (
                          <div
                            key={order.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                              <div className="space-y-2">
                                <h4 className="font-medium text-gray-800">
                                  {order.gig?.title || 'Custom Project'}
                                </h4>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>{order.amount} {tokenSymbol}</span>
                                  <span>•</span>
                                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                  order.status === 'delivered' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                                
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  order.payment_status === 'released' ? 'bg-green-100 text-green-800' :
                                  order.payment_status === 'escrowed' ? 'bg-blue-100 text-blue-800' :
                                  order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  Payment: {order.payment_status}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 3 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800">
                    {isOwnProfile ? 'Reviews I Received' : 'Reviews'}
                  </h3>
                  
                  <ReviewsList 
                    reviews={reviews || []}
                    isLoading={reviewsLoading}
                    error={null}
                    showTitle={false}
                  />
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 4 && isOwnProfile && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800">Notifications</h3>
                  
                  {notificationsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : !notifications || notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell size={24} className="text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-800 mb-2">No notifications</h4>
                      <p className="text-gray-600">
                        You're all caught up! New notifications will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border rounded-lg ${
                            notification.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
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
                            </div>
                            <span className="text-gray-500 text-xs">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </span>
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
                  <h3 className="text-xl font-bold text-gray-800">Settings</h3>
                  
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-medium text-gray-800 mb-4">Email Notifications</h4>
                    <EmailNotificationsToggle enabled={profile?.email_notifications_enabled || false} />
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-medium text-gray-800 mb-4">Account Information</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">User ID:</span>
                        <span className="text-gray-800 font-mono">{profile.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Wallet Address:</span>
                        <span className="text-gray-800 font-mono">
                          {profile.wallet_address ? 
                            `${profile.wallet_address.substring(0, 8)}...${profile.wallet_address.substring(profile.wallet_address.length - 4)}` 
                            : 'Not connected'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Member Since:</span>
                        <span className="text-gray-800">{new Date(profile.created_at).toLocaleDateString()}</span>
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