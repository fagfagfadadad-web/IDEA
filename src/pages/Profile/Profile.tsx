import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  ExternalLink, 
  Edit, 
  Save, 
  X, 
  Star, 
  Briefcase, 
  DollarSign,
  Eye,
  Clock,
  CheckCircle,
  Settings,
  Bell,
  BellOff,
  Github,
  Twitter,
  Linkedin,
  Globe,
  MessageSquare,
  Award,
  TrendingUp,
  Plus,
  Coins
} from 'lucide-react';
import { Button, Card, ReviewModal, EmailNotificationsToggle } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useReviewsForProvider } from '../../hooks/useReviews';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TaskManager } from '../../components/ProfileDashboard/TaskManager';
import { CalendarWidget } from '../../components/ProfileDashboard/CalendarWidget';
import { FinancialOverview } from '../../components/ProfileDashboard/FinancialOverview';
import { ExternalToolsWidget } from '../../components/ProfileDashboard/ExternalToolsWidget';
import { getAvatarColor, getUserInitials } from '../../utils/avatars';

export const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [searchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab');
  
  // Determine if viewing own profile or someone else's
  const isOwnProfile = !id || (user && id === user.id);
  const profileId = isOwnProfile ? undefined : id;
  
  const { data: profile, isLoading, error, refetch } = useProfile(profileId);
  const { data: reviews, isLoading: reviewsLoading } = useReviewsForProvider(profileId || user?.id || '');
  const updateProfile = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    bio: '',
    email: '',
    twitter_url: '',
    github_url: '',
    linkedin_url: '',
    website_url: '',
    email_notifications_enabled: false
  });

  // Set active tab based on URL parameter
  useEffect(() => {
    if (activeTabParam === 'settings') {
      setActiveTab(3);
    } else if (activeTabParam === 'dashboard') {
      setActiveTab(4);
    } else {
      setActiveTab(0);
    }
  }, [activeTabParam]);

  // Initialize edit form when profile loads
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
        email_notifications_enabled: profile.email_notifications_enabled || false
      });
    }
  }, [profile, isOwnProfile]);

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
        email_notifications_enabled: profile.email_notifications_enabled || false
      });
    }
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleReviewOrder = (order: any) => {
    setSelectedOrder(order);
    setShowReviewModal(true);
  };

  // Calculate review statistics
  const reviewStats = React.useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / totalReviews;
    
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      const rating = review.rating as keyof typeof ratingDistribution;
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
      }
    });

    return {
      averageRating,
      totalReviews,
      ratingDistribution
    };
  }, [reviews]);

  // Get user's orders for review section
  const userOrders = profile?.orders || [];
  const completedOrders = userOrders.filter((order: any) => order.status === 'completed');
  const ordersWithoutReviews = completedOrders.filter((order: any) => 
    !order.reviews || order.reviews.length === 0
  );

  const tabs = [
    { id: 0, label: 'Overview', icon: <User size={16} /> },
    { id: 1, label: 'Reviews', icon: <Star size={16} /> },
    { id: 2, label: 'Portfolio', icon: <Briefcase size={16} /> },
    ...(isOwnProfile ? [
      { id: 3, label: 'Settings', icon: <Settings size={16} /> },
      { id: 4, label: 'Dashboard', icon: <TrendingUp size={16} /> }
    ] : [])
  ];

  if (!isLoggedIn && isOwnProfile) {
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
            <div className="text-center">
              <User size={48} className="text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Profile Not Found</h2>
              <p className="text-gray-600 mb-6">
                {error ? `Error: ${error.message}` : 'The requested profile could not be found.'}
              </p>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="gradient-card p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center md:items-start space-y-4">
                <div 
                  className="w-32 h-32 rounded-full border-4 border-gray-300 overflow-hidden relative flex items-center justify-center text-white font-bold text-3xl shadow-lg"
                  style={{ backgroundColor: getAvatarColor(profile.id || '') }}
                >
                  {/* Always show initials as background */}
                  <span className="relative z-10">
                    {getUserInitials(profile.username, profile.full_name)}
                  </span>
                  
                  {/* Conditionally show avatar image on top */}
                  {profile.avatar_url && profile.avatar_url.trim() !== '' && (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username || 'Profile'}
                      className="w-full h-full object-cover absolute inset-0 z-20"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                </div>

                {/* Quick Stats */}
                <div className="text-center md:text-left space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} />
                    <span className="text-sm">
                      Member since {new Date(profile.created_at || '').toLocaleDateString()}
                    </span>
                  </div>
                  
                  {reviewStats && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Star size={16} />
                      <span className="text-sm">
                        {(() => {
                          return reviewStats.averageRating > 0 ? reviewStats.averageRating.toFixed(1) : '0.0';
                        })()} stars • {(() => {
                          return `${reviewStats.totalReviews} review${reviewStats.totalReviews !== 1 ? 's' : ''}`;
                        })()}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <Briefcase size={16} />
                    <span className="text-sm">
                      {profile.gigs?.length || 0} active gigs
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="flex-1 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          name="username"
                          value={editForm.username}
                          onChange={handleChange}
                          placeholder="Username"
                          className="text-2xl font-bold bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          name="full_name"
                          value={editForm.full_name}
                          onChange={handleChange}
                          placeholder="Full Name"
                          className="text-lg bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    ) : (
                      <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                          {profile.full_name || profile.username}
                        </h1>
                        <p className="text-gray-600 text-lg">
                          @{profile.username}
                        </p>
                      </div>
                    )}
                  </div>

                  {isOwnProfile && (
                    <div className="flex gap-3">
                      {isEditing ? (
                        <>
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
                            variant="gradient"
                            size="sm"
                            disabled={updateProfile.isLoading}
                          >
                            <Save size={16} />
                            {updateProfile.isLoading ? 'Saving...' : 'Save'}
                          </Button>
                        </>
                      ) : (
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
                  )}
                </div>

                {/* Bio */}
                <div>
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={editForm.bio}
                      onChange={handleChange}
                      placeholder="Tell others about yourself, your skills, and experience..."
                      rows={4}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed">
                      {profile.bio || 'No bio available.'}
                    </p>
                  )}
                </div>

                {/* Social Links */}
                <div className="flex flex-wrap gap-4">
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Twitter size={16} className="text-blue-400" />
                          <input
                            type="url"
                            name="twitter_url"
                            value={editForm.twitter_url}
                            onChange={handleChange}
                            placeholder="https://twitter.com/username"
                            className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Github size={16} className="text-gray-800" />
                          <input
                            type="url"
                            name="github_url"
                            value={editForm.github_url}
                            onChange={handleChange}
                            placeholder="https://github.com/username"
                            className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Linkedin size={16} className="text-blue-600" />
                          <input
                            type="url"
                            name="linkedin_url"
                            value={editForm.linkedin_url}
                            onChange={handleChange}
                            placeholder="https://linkedin.com/in/username"
                            className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe size={16} className="text-green-600" />
                          <input
                            type="url"
                            name="website_url"
                            value={editForm.website_url}
                            onChange={handleChange}
                            placeholder="https://yourwebsite.com"
                            className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {profile.twitter_url && (
                        <a
                          href={profile.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-400 hover:text-blue-500 transition-colors"
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
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
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
                          className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
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

            <div className="p-8">
              {/* Overview Tab */}
              {activeTab === 0 && (
                <div className="space-y-8">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Briefcase size={20} className="text-blue-600" />
                        <span className="text-blue-800 font-medium">Active Gigs</span>
                      </div>
                      <p className="text-blue-800 text-2xl font-bold">
                        {profile.gigs?.filter((gig: any) => gig.status === 'active').length || 0}
                      </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle size={20} className="text-green-600" />
                        <span className="text-green-800 font-medium">Completed Orders</span>
                      </div>
                      <p className="text-green-800 text-2xl font-bold">
                        {completedOrders.length}
                      </p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Star size={20} className="text-yellow-600" />
                        <span className="text-yellow-800 font-medium">Rating</span>
                      </div>
                      <p className="text-yellow-800 text-2xl font-bold">
                        {(() => {
                          return reviewStats.averageRating > 0 ? reviewStats.averageRating.toFixed(1) : '0.0';
                        })()}
                      </p>
                      <p className="text-yellow-600 text-sm">
                        {(() => {
                          return `${reviewStats.totalReviews} review${reviewStats.totalReviews !== 1 ? 's' : ''}`;
                        })()}
                      </p>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 p-6 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Eye size={20} className="text-purple-600" />
                        <span className="text-purple-800 font-medium">Total Views</span>
                      </div>
                      <p className="text-purple-800 text-2xl font-bold">
                        {profile.gigs?.reduce((sum: number, gig: any) => sum + (gig.view_count || 0), 0) || 0}
                      </p>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800">Recent Activity</h2>
                    
                    {/* Recent Orders */}
                    {userOrders.length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-800">Recent Orders</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {userOrders.slice(0, 4).map((order: any) => (
                            <div
                              key={order.id}
                              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => navigate(`/orders/${order.id}`)}
                            >
                              <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-gray-800 line-clamp-1">
                                    {order.gig?.title || 'Custom Project'}
                                  </h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                    order.status === 'delivered' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {order.status.replace('_', ' ')}
                                  </span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <DollarSign size={14} className="text-green-600" />
                                    <span className="text-green-600 font-bold">
                                      {order.amount} {order.payment_token || 'EGLD'}
                                    </span>
                                  </div>
                                  <span className="text-gray-500 text-sm">
                                    {new Date(order.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Briefcase size={48} className="text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-800 mb-2">No orders yet</h3>
                        <p className="text-gray-600">
                          {isOwnProfile ? 'Start by creating your first gig!' : 'This user has no completed orders yet.'}
                        </p>
                        {isOwnProfile && (
                          <Button
                            onClick={() => navigate('/create-gig')}
                            variant="gradient"
                            size="md"
                            className="mt-4"
                          >
                            <Plus size={16} />
                            Create Your First Gig
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 1 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Reviews</h2>
                    {isOwnProfile && ordersWithoutReviews.length > 0 && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                        {ordersWithoutReviews.length} order{ordersWithoutReviews.length !== 1 ? 's' : ''} awaiting review
                      </span>
                    )}
                  </div>

                  {/* Review Statistics */}
                  {reviewStats && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Review Statistics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-gray-800 mb-2">
                              {(() => {
                                return reviewStats.averageRating > 0 ? reviewStats.averageRating.toFixed(1) : '0.0';
                              })()}
                            </div>
                            <div className="flex justify-center mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={20}
                                  fill={star <= Math.round(reviewStats.averageRating) ? '#FFD700' : 'transparent'}
                                  color={star <= Math.round(reviewStats.averageRating) ? '#FFD700' : '#D1D5DB'}
                                />
                              ))}
                            </div>
                            <p className="text-gray-600">
                              {(() => {
                                return `${reviewStats.totalReviews} review${reviewStats.totalReviews !== 1 ? 's' : ''}`;
                              })()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {(() => {
                            return reviewStats.totalReviews > 0 ? (
                              <>
                                {[5, 4, 3, 2, 1].map((rating) => {
                                  const count = reviewStats.ratingDistribution[rating as keyof typeof reviewStats.ratingDistribution] || 0;
                                  const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0;
                                  
                                  return (
                                    <div key={rating} className="flex items-center gap-3">
                                      <span className="text-sm text-gray-600 w-8">{rating} ⭐</span>
                                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div
                                          className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                          style={{ width: `${percentage}%` }}
                                        />
                                      </div>
                                      <span className="text-sm text-gray-600 w-8">{count}</span>
                                    </div>
                                  );
                                })}
                              </>
                            ) : (
                              <div className="text-center py-8">
                                <Star size={32} className="text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600">No reviews yet</p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reviews List */}
                  {reviewsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="space-y-4 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="text-gray-700">Loading reviews...</p>
                      </div>
                    </div>
                  ) : reviews && reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-10 h-10 rounded-full border border-gray-300 overflow-hidden relative flex items-center justify-center text-white font-bold text-sm"
                                  style={{ backgroundColor: getAvatarColor(review.order?.client?.id || '') }}
                                >
                                  <span className="relative z-10">
                                    {getUserInitials(review.order?.client?.username, review.order?.client?.full_name)}
                                  </span>
                                  {review.order?.client?.avatar_url && (
                                    <img
                                      src={review.order.client.avatar_url}
                                      alt={review.order.client.username || "Client"}
                                      className="w-full h-full object-cover absolute inset-0 z-20"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  )}
                                </div>
                                <div>
                                  <p className="text-gray-800 font-medium">
                                    {review.order?.client?.full_name || review.order?.client?.username || "Anonymous"}
                                  </p>
                                  <p className="text-gray-600 text-sm">
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={16}
                                    fill={star <= review.rating ? '#FFD700' : 'transparent'}
                                    color={star <= review.rating ? '#FFD700' : '#D1D5DB'}
                                  />
                                ))}
                              </div>
                            </div>
                            
                            <p className="text-gray-700 leading-relaxed">
                              {review.comment}
                            </p>
                            
                            <div className="border-t border-gray-200 pt-3">
                              <p className="text-gray-500 text-sm">
                                Review for: <span className="font-medium">{review.order?.gig?.title || 'Custom Project'}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Star size={48} className="text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No reviews yet</h3>
                      <p className="text-gray-600">
                        {isOwnProfile ? 'Complete some orders to start receiving reviews!' : 'This user has no reviews yet.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Portfolio Tab */}
              {activeTab === 2 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Portfolio</h2>
                    {isOwnProfile && (
                      <Button
                        onClick={() => navigate('/create-gig')}
                        variant="gradient"
                        size="sm"
                      >
                        <Plus size={16} />
                        Create New Gig
                      </Button>
                    )}
                  </div>

                  {/* Gigs Grid */}
                  {profile.gigs && profile.gigs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {profile.gigs.map((gig: any) => (
                        <div
                          key={gig.id}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => navigate(`/gigs/${gig.id}`)}
                        >
                          <img
                            src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                            alt={gig.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <h3 className="text-lg font-bold text-gray-800 line-clamp-2">
                                {gig.title}
                              </h3>
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
                              <div className="flex items-center gap-1">
                                {gig.payment_token === 'EGLD' ? (
                                  <DollarSign size={14} className="text-green-600" />
                                ) : (
                                  <Coins size={14} className="text-purple-600" />
                                )}
                                <span className="text-green-600 font-bold">
                                  {gig.price} {gig.payment_token === 'EGLD' ? 'EGLD' : 'IDEA'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye size={14} className="text-gray-400" />
                                <span className="text-gray-500 text-sm">
                                  {gig.view_count || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Briefcase size={48} className="text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No gigs yet</h3>
                      <p className="text-gray-600 mb-4">
                        {isOwnProfile ? 'Create your first gig to start offering your services!' : 'This user has no gigs available.'}
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
                  )}
                </div>
              )}

              {/* Settings Tab (Own Profile Only) */}
              {activeTab === 3 && isOwnProfile && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-800">Account Settings</h2>
                  
                  {/* Email Settings */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Email Notifications</h3>
                    <EmailNotificationsToggle
                      enabled={profile.email_notifications_enabled || false}
                      currentEmail={profile.email || ''}
                      onEmailUpdated={(email) => {
                        setEditForm(prev => ({ ...prev, email }));
                        refetch();
                      }}
                    />
                  </div>

                  {/* Account Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Account Information</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">
                            Username
                          </label>
                          <input
                            type="text"
                            name="username"
                            value={editForm.username}
                            onChange={handleChange}
                            className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            name="full_name"
                            value={editForm.full_name}
                            onChange={handleChange}
                            className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Bio
                        </label>
                        <textarea
                          name="bio"
                          value={editForm.bio}
                          onChange={handleChange}
                          rows={4}
                          className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">
                            Twitter URL
                          </label>
                          <input
                            type="url"
                            name="twitter_url"
                            value={editForm.twitter_url}
                            onChange={handleChange}
                            placeholder="https://twitter.com/username"
                            className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">
                            GitHub URL
                          </label>
                          <input
                            type="url"
                            name="github_url"
                            value={editForm.github_url}
                            onChange={handleChange}
                            placeholder="https://github.com/username"
                            className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">
                            LinkedIn URL
                          </label>
                          <input
                            type="url"
                            name="linkedin_url"
                            value={editForm.linkedin_url}
                            onChange={handleChange}
                            placeholder="https://linkedin.com/in/username"
                            className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">
                            Website URL
                          </label>
                          <input
                            type="url"
                            name="website_url"
                            value={editForm.website_url}
                            onChange={handleChange}
                            placeholder="https://yourwebsite.com"
                            className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <Button
                          onClick={handleSave}
                          variant="gradient"
                          size="md"
                          disabled={updateProfile.isLoading}
                        >
                          <Save size={16} />
                          {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Wallet Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Wallet Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Wallet Address
                        </label>
                        <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
                          <code className="text-gray-800 text-sm break-all">
                            {profile.wallet_address || 'Not connected'}
                          </code>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">
                            IDA Balance
                          </label>
                          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <span className="text-purple-800 font-bold">
                              {(profile.ida_balance || 0).toLocaleString()} IDA
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">
                            Total Earned
                          </label>
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <span className="text-green-800 font-bold">
                              {(profile.total_earned || 0).toLocaleString()} IDA
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">
                            Level
                          </label>
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <span className="text-blue-800 font-bold">
                              Level {profile.level || 1}
                            </span>
                            <div className="text-xs text-blue-600 mt-1">
                              {profile.xp || 0} XP
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dashboard Tab (Own Profile Only) */}
              {activeTab === 4 && isOwnProfile && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-800">Workspace Dashboard</h2>
                  
                  {/* Dashboard Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* Orders Awaiting Review (Own Profile Only) */}
          {isOwnProfile && ordersWithoutReviews.length > 0 && (
            <div className="gradient-card p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Orders Awaiting Your Review</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ordersWithoutReviews.map((order: any) => (
                  <div
                    key={order.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-gray-800">
                          {order.gig?.title || 'Custom Project'}
                        </h3>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          Completed
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full border border-gray-300 overflow-hidden relative flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: getAvatarColor(order.gig?.provider?.id || '') }}
                        >
                          <span className="relative z-10">
                            {getUserInitials(order.gig?.provider?.username, order.gig?.provider?.full_name)}
                          </span>
                          {order.gig?.provider?.avatar_url && (
                            <img
                              src={order.gig.provider.avatar_url}
                              alt={order.gig.provider.username || "Provider"}
                              className="w-full h-full object-cover absolute inset-0 z-20"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-gray-800 font-medium">
                            {order.gig?.provider?.username}
                          </p>
                          <p className="text-gray-600 text-sm">
                            Service Provider
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <DollarSign size={14} className="text-green-600" />
                          <span className="text-green-600 font-bold">
                            {order.amount} {order.payment_token || 'EGLD'}
                          </span>
                        </div>
                        <span className="text-gray-500 text-sm">
                          Completed {new Date(order.status_updated_at || order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <Button
                        onClick={() => handleReviewOrder(order)}
                        variant="gradient"
                        size="sm"
                        fullWidth
                      >
                        <Star size={16} />
                        Leave Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mobile Reviews Section */}
          <div className="md:hidden">
            {reviewStats && (
              <div className="gradient-card p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Reviews</h2>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-800 mb-2">
                      {(() => {
                        return reviewStats.averageRating > 0 ? reviewStats.averageRating.toFixed(1) : '0.0';
                      })()}
                    </div>
                    <div className="flex justify-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          fill={star <= Math.round(reviewStats.averageRating) ? '#FFD700' : 'transparent'}
                          color={star <= Math.round(reviewStats.averageRating) ? '#FFD700' : '#D1D5DB'}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm">
                      {(() => {
                        return `${reviewStats.totalReviews} review${reviewStats.totalReviews !== 1 ? 's' : ''}`;
                      })()}
                    </p>
                  </div>
                  
                  {(() => {
                    return reviewStats.totalReviews > 0 ? (
                      <div className="mt-4 space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => {
                          const count = reviewStats.ratingDistribution[rating as keyof typeof reviewStats.ratingDistribution] || 0;
                          const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0;
                          
                          return (
                            <div key={rating} className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 w-6">{rating}⭐</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-yellow-400 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600 w-6">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Review Modal */}
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          order={selectedOrder}
          onReviewSubmitted={() => {
            refetch();
            setShowReviewModal(false);
          }}
        />

        {/* Add bottom padding for mobile navigation */}
        <div className="h-20 md:h-0"></div>
      </div>
    </div>
  );
};