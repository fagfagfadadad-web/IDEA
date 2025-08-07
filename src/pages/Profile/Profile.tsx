import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Edit, 
  MapPin, 
  Calendar, 
  Star, 
  Briefcase, 
  DollarSign, 
  Clock, 
  User, 
  Settings, 
  Github, 
  Twitter, 
  Linkedin, 
  Globe, 
  Mail,
  Eye,
  MessageSquare,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Coins
} from 'lucide-react';
import { Button, Card, ReviewsList, StarRating, EmailNotificationsToggle, GigViewsStats } from 'components';
import { useGetIsLoggedIn, useGetAccount } from 'lib';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useGigs } from '../../hooks/useGigs';
import { useReviewsForProvider } from '../../hooks/useReviews';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();
  const { user } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  
  // Determine if viewing own profile or someone else's
  const isOwnProfile = !id || (user && id === user.id);
  const profileId = isOwnProfile ? undefined : id;
  
  // Get initial tab from URL params
  const initialTab = searchParams.get('tab');
  const getInitialTabIndex = () => {
    switch (initialTab) {
      case 'gigs': return 1;
      case 'orders': return 2;
      case 'reviews': return 3;
      case 'settings': return 4;
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
  const { data: profile, isLoading, error, refetch } = useProfile(profileId);
  const { data: gigs, refetch: refetchGigs } = useGigs();
  const { data: providerReviews, refetch: refetchReviews } = useReviewsForProvider(profileId || user?.id || '');
  const updateProfile = useUpdateProfile();

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
      refetch();
    } catch (error) {
      console.error('Error updating profile:', error);
      showErrorToast('Error updating profile');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'delivered':
        return 'yellow';
      case 'in_progress':
        return 'blue';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getOrderTitle = (order: any) => {
    if (order.gig?.title) {
      return order.gig.title;
    }
    if (order.requirements?.description) {
      return order.requirements.description.substring(0, 50) + '...';
    }
    return 'Custom Project';
  };

  const getTokenDisplayName = (paymentToken: string) => {
    if (paymentToken === 'EGLD') return 'EGLD';
    if (paymentToken === 'IDA-f9bc1d') return 'IDA';
    return paymentToken;
  };

  // Calculate average rating
  const averageRating = providerReviews && providerReviews.length > 0 
    ? providerReviews.reduce((sum, review) => sum + review.rating, 0) / providerReviews.length 
    : 0;

  // Get orders for display - show ALL orders, not just first 5
  const recentOrders = profile?.orders || [];
  const clientOrders = recentOrders.filter((order: any) => order.client_id === (profileId || user?.id));
  const providerOrders = recentOrders.filter((order: any) => 
    order.gig?.provider_id === (profileId || user?.id) || 
    order.provider_address === profile?.wallet_address
  );

  if (!isLoggedIn && isOwnProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="gradient-card p-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="text-yellow-600 mr-3" size={20} />
                <span className="text-yellow-800 font-medium">Please log in to view your profile.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="gradient-card p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="text-red-500 mr-3" size={20} />
                <span className="text-red-700 font-medium">
                  {error ? `Error: ${error.message}` : 'Profile not found'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 0, label: 'Overview', icon: <User size={16} /> },
    { id: 1, label: `Gigs (${gigs?.length || 0})`, icon: <Briefcase size={16} /> },
    { id: 2, label: `Orders (${recentOrders.length || 0})`, icon: <Clock size={16} /> },
    { id: 3, label: `Reviews (${providerReviews?.length || 0})`, icon: <Star size={16} /> },
  ];

  // Add settings tab only for own profile
  if (isOwnProfile) {
    tabs.push({ id: 4, label: 'Settings', icon: <Settings size={16} /> });
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
                      <p className="text-gray-600">@{profile.username}</p>
                      {profile.bio && (
                        <p className="text-gray-700 mt-2">{profile.bio}</p>
                      )}
                    </div>
                    
                    {isOwnProfile && (
                      <Button
                        onClick={handleEditToggle}
                        variant="outline"
                        size="md"
                      >
                        <Edit size={16} />
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>Joined {formatDate(profile.created_at)}</span>
                    </div>
                    
                    {providerReviews && providerReviews.length > 0 && (
                      <div className="flex items-center gap-2">
                        <StarRating 
                          rating={averageRating}
                          size={16}
                          showText={true}
                          showCount={true}
                          reviewCount={providerReviews.length}
                        />
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  {(profile.twitter_url || profile.github_url || profile.linkedin_url || profile.website_url) && (
                    <div className="flex gap-3">
                      {profile.twitter_url && (
                        <a
                          href={profile.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-blue-600 transition-colors"
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
                          className="text-gray-600 hover:text-blue-700 transition-colors"
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
              </div>

              {/* Edit Form */}
              {isEditing && isOwnProfile && (
                <div className="border-t border-gray-200 pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-800 text-sm font-medium mb-2">Username</label>
                      <input
                        type="text"
                        name="username"
                        value={editForm.username}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-800 text-sm font-medium mb-2">Full Name</label>
                      <input
                        type="text"
                        name="full_name"
                        value={editForm.full_name}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-800 text-sm font-medium mb-2">Bio</label>
                    <textarea
                      name="bio"
                      value={editForm.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-800 text-sm font-medium mb-2">Twitter URL</label>
                      <input
                        type="url"
                        name="twitter_url"
                        value={editForm.twitter_url}
                        onChange={handleInputChange}
                        placeholder="https://twitter.com/username"
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-800 text-sm font-medium mb-2">GitHub URL</label>
                      <input
                        type="url"
                        name="github_url"
                        value={editForm.github_url}
                        onChange={handleInputChange}
                        placeholder="https://github.com/username"
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-800 text-sm font-medium mb-2">LinkedIn URL</label>
                      <input
                        type="url"
                        name="linkedin_url"
                        value={editForm.linkedin_url}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-800 text-sm font-medium mb-2">Website URL</label>
                      <input
                        type="url"
                        name="website_url"
                        value={editForm.website_url}
                        onChange={handleInputChange}
                        placeholder="https://yourwebsite.com"
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleEditToggle}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                      disabled={updateProfile.isLoading}
                    >
                      {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
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

            <div className="bg-white p-8">
              {/* Overview Tab */}
              {activeTab === 0 && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-indigo-50 to-pink-50 p-6 rounded-xl border border-indigo-200">
                      <div className="flex items-center gap-3 mb-2">
                        <Briefcase size={20} className="text-indigo-600" />
                        <span className="text-indigo-800 font-medium">Active Gigs</span>
                      </div>
                      <p className="text-2xl font-bold text-indigo-900">{gigs?.length || 0}</p>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle size={20} className="text-green-600" />
                        <span className="text-green-800 font-medium">Completed Orders</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">
                        {recentOrders.filter((order: any) => order.status === 'completed').length}
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                      <div className="flex items-center gap-3 mb-2">
                        <Star size={20} className="text-yellow-600" />
                        <span className="text-yellow-800 font-medium">Average Rating</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-900">
                        {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h3>
                    {recentOrders.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Clock size={24} className="text-gray-400" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-800 mb-2">No recent activity</h4>
                        <p className="text-gray-600">
                          {isOwnProfile ? "You haven't placed or received any orders yet." : "This user hasn't had any recent activity."}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentOrders.slice(0, 5).map((order: any) => {
                          const statusColor = getStatusColor(order.status);
                          const tokenDisplayName = getTokenDisplayName(order.payment_token);
                          const isClientOrder = order.client_id === (profileId || user?.id);
                          
                          return (
                            <div
                              key={order.id}
                              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => navigate(`/orders/${order.id}`)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                  <h4 className="font-medium text-gray-800">
                                    {getOrderTitle(order)}
                                  </h4>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <DollarSign size={14} />
                                      {order.amount} {tokenDisplayName}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar size={14} />
                                      {formatDate(order.created_at)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <User size={14} />
                                      {isClientOrder ? 'As Client' : 'As Provider'}
                                    </span>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  statusColor === 'green' ? 'bg-green-100 text-green-800' :
                                  statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                                  statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                  statusColor === 'red' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        
                        {recentOrders.length > 5 && (
                          <div className="text-center">
                            <Button
                              onClick={() => setActiveTab(2)}
                              variant="outline"
                              size="sm"
                            >
                              View All Orders ({recentOrders.length})
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Gigs Tab */}
              {activeTab === 1 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">
                      {isOwnProfile ? 'My Gigs' : `${profile.username}'s Gigs`}
                    </h3>
                    {isOwnProfile && (
                      <Button
                        onClick={() => navigate('/create-gig')}
                        variant="gradient"
                        size="md"
                      >
                        <Plus size={16} />
                        Create New Gig
                      </Button>
                    )}
                  </div>

                  {!gigs || gigs.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase size={24} className="text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-800 mb-2">No gigs yet</h4>
                      <p className="text-gray-600 mb-4">
                        {isOwnProfile ? "You haven't created any gigs yet." : "This user hasn't created any gigs yet."}
                      </p>
                      {isOwnProfile && (
                        <Button
                          onClick={() => navigate('/create-gig')}
                          variant="gradient"
                          size="md"
                        >
                          <Plus size={16} />
                          Create Your First Gig
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {gigs.map((gig: any) => {
                        const paymentToken = gig.payment_token || 'EGLD';
                        const tokenDisplayName = getTokenDisplayName(paymentToken);
                        const tokenIcon = paymentToken === 'EGLD' ? <DollarSign size={16} /> : <Coins size={16} />;
                        
                        return (
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
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold text-gray-800 line-clamp-2">{gig.title}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                                  gig.status === 'active' ? 'bg-green-100 text-green-800' :
                                  gig.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {gig.status}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm line-clamp-2">{gig.description}</p>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1">
                                  {tokenIcon}
                                  <span className="font-bold text-indigo-600">
                                    {gig.price} {tokenDisplayName}
                                  </span>
                                </div>
                                <span className="text-gray-500 text-sm">{gig.duration} days</span>
                              </div>
                              
                              {isOwnProfile && (
                                <div className="pt-2 border-t border-gray-200">
                                  <GigViewsStats gigId={gig.id} className="text-sm" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Orders Tab - Show ALL orders */}
              {activeTab === 2 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800">
                    {isOwnProfile ? 'All Orders' : `${profile.username}'s Orders`} ({recentOrders.length})
                  </h3>

                  {recentOrders.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock size={24} className="text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-800 mb-2">No orders yet</h4>
                      <p className="text-gray-600">
                        {isOwnProfile ? "You haven't placed or received any orders yet." : "This user hasn't had any orders yet."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Show ALL orders, not just first 5 */}
                      {recentOrders.map((order: any) => {
                        const statusColor = getStatusColor(order.status);
                        const tokenDisplayName = getTokenDisplayName(order.payment_token);
                        const isClientOrder = order.client_id === (profileId || user?.id);
                        
                        return (
                          <div
                            key={order.id}
                            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                              <div className="space-y-3 flex-1">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-bold text-gray-800 text-lg">
                                    {getOrderTitle(order)}
                                  </h4>
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ml-4 ${
                                    statusColor === 'green' ? 'bg-green-100 text-green-800' :
                                    statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                                    statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                    statusColor === 'red' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                  </span>
                                </div>
                                
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <DollarSign size={14} />
                                    {order.amount} {tokenDisplayName}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    {formatDate(order.created_at)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <User size={14} />
                                    {isClientOrder ? 'As Client' : 'As Provider'}
                                  </span>
                                  {order.payment_status && (
                                    <span className="flex items-center gap-1">
                                      <CheckCircle size={14} />
                                      Payment: {order.payment_status}
                                    </span>
                                  )}
                                </div>

                                {order.requirements?.description && (
                                  <p className="text-gray-600 text-sm line-clamp-2">
                                    {order.requirements.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/orders/${order.id}`);
                                  }}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Eye size={16} />
                                  View Details
                                </Button>
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
                <div>
                  <ReviewsList 
                    reviews={providerReviews || []}
                    isLoading={false}
                    error={null}
                    showTitle={true}
                  />
                </div>
              )}

              {/* Settings Tab - Only for own profile */}
              {activeTab === 4 && isOwnProfile && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Account Settings</h3>
                    
                    <div className="space-y-6">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-bold text-gray-800 mb-4">Wallet Information</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-gray-600 text-sm font-medium mb-1">Wallet Address</label>
                            <div className="bg-white border border-gray-300 rounded-lg p-3">
                              <code className="text-gray-800 text-sm break-all">
                                {profile.wallet_address || 'Not connected'}
                              </code>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-bold text-gray-800 mb-4">Email Notifications</h4>
                        <EmailNotificationsToggle enabled={profile.email_notifications_enabled || false} />
                      </div>

                      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h4 className="text-lg font-bold text-red-800 mb-4">Danger Zone</h4>
                        <p className="text-red-700 text-sm mb-4">
                          Account deletion and other destructive actions will be available in future updates.
                        </p>
                        <Button
                          onClick={() => alert('Account deletion feature coming soon')}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                          disabled
                        >
                          Delete Account (Coming Soon)
                        </Button>
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