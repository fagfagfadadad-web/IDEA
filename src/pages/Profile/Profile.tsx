import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Settings, Edit, Star, Calendar, CheckCircle, DollarSign, Eye, Plus, Clock, BarChart3, ArrowLeft, Coins } from 'lucide-react';
import { Button, Card, EmailNotificationsToggle, ReviewsList, TaskManager, CalendarWidget, FinancialOverview, ExternalToolsWidget } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useProfile, useUpdateProfile } from 'hooks';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useGigs, useDeleteGig, useUpdateGigStatus } from 'hooks';
import { useOrders } from 'hooks';
import { useNotifications, useMarkAllNotificationsAsRead } from 'hooks';
import { useReviewsForProvider } from 'hooks';
import { usePayments } from 'hooks';

// Helper function to calculate earnings from orders
const calculateEarnings = (orders: any[]) => {
  const completedOrders = orders?.filter(order => order.status === 'completed') || [];
  
  const egldEarnings = completedOrders
    .filter(order => order.payment_token === 'EGLD')
    .reduce((sum, order) => sum + (order.amount * 0.9), 0); // 90% after 10% fee
    
  const idaEarnings = completedOrders
    .filter(order => order.payment_token !== 'EGLD')
    .reduce((sum, order) => sum + order.amount, 0); // 100% for IDA tokens
    
  return {
    egld: egldEarnings,
    ida: idaEarnings,
    totalOrders: completedOrders.length,
    totalEarnings: egldEarnings + idaEarnings
  };
};

// Helper function to calculate review statistics
const calculateReviewStats = (reviews: any[]) => {
  if (!reviews || reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }
  
  const totalReviews = reviews.length;
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
  
  const ratingDistribution = reviews.reduce((dist, review) => {
    dist[review.rating] = (dist[review.rating] || 0) + 1;
    return dist;
  }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  
  return {
    averageRating,
    totalReviews,
    ratingDistribution
  };
};

export const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  const { success, error: showErrorToast } = useToast();
  
  // Use the id from params if viewing someone else's profile, otherwise use current user
  const { data: profile, isLoading, error, refetch } = useProfile(id);
  
  // Determine if this is the user's own profile
  const isOwnProfile = !id || (user?.id === profile?.id);

  // Real hooks for data fetching
  const { data: gigs, refetch: refetchGigs } = useGigs();
  const { data: orders, refetch: refetchOrders } = useOrders();
  const { data: notifications } = useNotifications(user?.id);
  const { data: providerReviews, isLoading: reviewsLoading, error: reviewsError } = useReviewsForProvider(profile?.id || '');

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showGigMenu, setShowGigMenu] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGig, setSelectedGig] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    avatar_url: '',
    bio: '',
    twitter_url: '',
    github_url: '',
    linkedin_url: '',
    website_url: '',
  });

  const updateProfile = useUpdateProfile();
  const deleteGig = useDeleteGig();
  const updateGigStatus = useUpdateGigStatus();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const { claimPayment } = usePayments();

  // Initialize edit form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        username: profile.username || '',
        full_name: profile.full_name || '',
        avatar_url: profile.avatar_url || '',
        bio: profile.bio || '',
        twitter_url: profile.twitter_url || '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        website_url: profile.website_url || '',
      });
    }
  }, [profile]);

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        ...editForm
      });
      setIsEditModalOpen(false);
      refetch();
      success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      showErrorToast('Error updating profile. Please try again later.');
    }
  };

  const handleEditGig = (gigId: string) => {
    navigate(`/create-gig?edit=${gigId}`);
    setShowGigMenu(null);
  };

  const handleDeleteGig = async () => {
    if (!selectedGig) return;
    
    try {
      await deleteGig.mutateAsync(selectedGig.id, {
        onSuccess: () => {
          success('Gig deleted successfully');
          refetchGigs();
        }
      });
      setShowDeleteModal(false);
      setSelectedGig(null);
    } catch (error) {
      console.error('Failed to delete gig:', error);
      showErrorToast('Failed to delete gig');
    }
  };

  const handleUpdateGigStatus = async (gigId: string, status: string) => {
    try {
      await updateGigStatus.mutateAsync({ id: gigId, status });
      success(`Gig ${status === 'active' ? 'activated' : status === 'paused' ? 'paused' : 'deactivated'} successfully`);
      refetchGigs();
      setShowGigMenu(null);
    } catch (error) {
      console.error('Failed to update gig status:', error);
      showErrorToast('Failed to update gig status');
    }
  };

  const confirmDeleteGig = (gig: any) => {
    setSelectedGig(gig);
    setShowDeleteModal(true);
    setShowGigMenu(null);
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (!user?.id) {
        showErrorToast('Please log in to mark notifications as read');
        return;
      }
      
      const unreadCount = notifications?.filter(n => !n.read).length || 0;
      if (unreadCount === 0) {
        success('All notifications are already read');
        return;
      }

      await markAllAsRead.mutateAsync();
      success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      showErrorToast('Error marking notifications as read');
    }
  };

  const handleClaimPayment = async (orderId: string) => {
    try {
      await claimPayment(orderId);
      
      // Refresh orders data to remove from waiting list
      await refetchOrders();
      success('Payment claimed successfully');
    } catch (error) {
      console.error('Error claiming payment:', error);
      showErrorToast(`Error claiming payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <User size={16} /> },
    { id: 'gigs', label: 'My Gigs', icon: <Briefcase size={16} /> },
    { id: 'reviews', label: 'Reviews', icon: <Star size={16} /> },
    { id: 'dashboard', label: 'Workspace', icon: <BarChart3 size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> }
  ];

  if (!isLoggedIn && isOwnProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="gradient-card p-8">
            <div className="bg-yellow-100 border border-yellow-400 rounded-md p-4">
              <div className="flex items-center">
                <span className="text-yellow-600 mr-2">⚠️</span>
                <span className="text-gray-800">Please log in to view your profile.</span>
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
            <div className="bg-red-100 border border-red-400 rounded-md p-4">
              <div className="flex items-center">
                <span className="text-red-600 mr-2">⚠️</span>
                <span className="text-gray-800">
                  {error ? `Error: ${error.message}` : 'Profile not found'}
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
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-2xl text-white">
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
                      className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-2xl text-white absolute inset-0"
                      style={{ display: 'none' }}
                    >
                      {profile.username?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  </>
                ) : (
                  <span>{profile.username?.charAt(0)?.toUpperCase() || "U"}</span>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                      {profile.full_name || profile.username}
                    </h1>
                    <p className="text-gray-600 mb-2">@{profile.username}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {isOwnProfile && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setIsEditModalOpen(true)}
                        variant="gradient"
                      >
                        <Edit size={16} />
                        Edit Profile
                      </Button>
                      <Button
                        onClick={() => setActiveTab('dashboard')}
                        variant="outline"
                        className="border-purple-600 text-purple-600 hover:bg-purple-50"
                      >
                        <BarChart3 size={16} />
                        Workspace
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          {activeTab === 'dashboard' ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Task Manager */}
                <TaskManager />
                
                {/* Calendar Widget */}
                <CalendarWidget />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Financial Overview */}
                <FinancialOverview />
                
                {/* External Tools */}
                <ExternalToolsWidget />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* About Me */}
              <div className="gradient-card p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">About Me</h3>
                {profile.bio ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
                ) : (
                  <p className="text-gray-500 italic">
                    {isOwnProfile ? 'Add a bio to tell others about yourself' : 'No bio available'}
                  </p>
                )}
              </div>

              {/* Social Media Links */}
              <div className="gradient-card p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Social Media Links</h3>
                <div className="space-y-3">
                  {profile.twitter_url && (
                    <a
                      href={profile.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Twitter size={20} />
                      <span>Twitter</span>
                    </a>
                  )}
                  
                  {profile.github_url && (
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      <Github size={20} />
                      <span>GitHub</span>
                    </a>
                  )}
                  
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Linkedin size={20} />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  
                  {profile.website_url && (
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-green-600 hover:text-green-700 transition-colors"
                    >
                      <Globe size={20} />
                      <span>Website</span>
                    </a>
                  )}
                  
                  {!profile.twitter_url && !profile.github_url && !profile.linkedin_url && !profile.website_url && (
                    <p className="text-gray-500 italic">
                      {isOwnProfile ? 'Add your social media links to connect with others' : 'No social media links available'}
                    </p>
                  )}
                </div>
              </div>

              {/* Statistics Overview - Mobile Only */}
              {isOwnProfile && (
                <div className="gradient-card p-6 lg:hidden">
                  <h3 className="text-lg font-bold text-gray-800 mb-6">Statistics Overview</h3>
                  
                  {/* Main Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Star size={16} className="text-yellow-500" />
                        <span className="text-gray-800 text-sm font-medium">Average Rating</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-800">
                        {(() => {
                          const stats = calculateReviewStats(providerReviews || []);
                          return stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0';
                        })()}
                      </p>
                      <p className="text-gray-600 text-xs">
                        {(() => {
                          const stats = calculateReviewStats(providerReviews || []);
                          return `${stats.totalReviews} review${stats.totalReviews !== 1 ? 's' : ''}`;
                        })()}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase size={16} className="text-green-600" />
                        <span className="text-gray-800 text-sm font-medium">Active Gigs</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-800">
                        {gigs?.filter(g => g.status === 'active').length || 0}
                      </p>
                      <p className="text-gray-600 text-xs">
                        of {gigs?.length || 0} total
                      </p>
                    </div>
                  </div>

                  {/* Earnings Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-bold text-gray-800">Earnings</h4>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign size={16} className="text-blue-600" />
                            <span className="text-gray-800 font-medium">EGLD Earnings</span>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-800">
                              {(() => {
                                const earnings = calculateEarnings(orders || []);
                                return earnings.egld.toFixed(2);
                              })()} EGLD
                            </p>
                            <p className="text-gray-600 text-xs">After 10% fee</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Coins size={16} className="text-purple-600" />
                            <span className="text-gray-800 font-medium">IDA Earnings</span>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-800">
                              {(() => {
                                const earnings = calculateEarnings(orders || []);
                                return earnings.ida.toFixed(2);
                              })()} IDA
                            </p>
                            <p className="text-gray-600 text-xs">No fees</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check size={16} className="text-gray-600" />
                          <span className="text-gray-800 font-medium">Completed Orders</span>
                        </div>
                        <p className="text-xl font-bold text-gray-800">
                          {(() => {
                            const earnings = calculateEarnings(orders || []);
                            return earnings.totalOrders;
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rating Distribution */}
                  {(() => {
                    const stats = calculateReviewStats(providerReviews || []);
                    return stats.totalReviews > 0 ? (
                      <div className="space-y-4">
                        <h4 className="text-md font-bold text-gray-800">Rating Distribution</h4>
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map((rating) => {
                            const count = stats.ratingDistribution[rating] || 0;
                            const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                            
                            return (
                              <div key={rating} className="flex items-center gap-3">
                                <div className="flex items-center gap-1 w-12">
                                  <span className="text-gray-800 text-sm">{rating}</span>
                                  <Star size={12} className="text-yellow-500" />
                                </div>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-gray-600 text-sm w-12 text-right">
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Reviews Section - Show for public profiles */}
              {!isOwnProfile && (
                <div className="gradient-card p-6">
                  <ReviewsList 
                    reviews={providerReviews || []}
                    isLoading={reviewsLoading}
                    error={reviewsError}
                    showTitle={true}
                  />
                </div>
              )}

              {/* My Reviews - Only for own profile */}
              {isOwnProfile && (
                <div className="gradient-card p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-6">My Reviews</h3>
                  <ReviewsList 
                    reviews={providerReviews || []}
                    isLoading={reviewsLoading}
                    error={reviewsError}
                    showTitle={false}
                  />
                </div>
              )}

              {/* My Gigs - Only for own profile */}
              {isOwnProfile && (
                <div className="gradient-card p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">My Gigs</h3>
                    <Button
                      onClick={() => navigate('/create-gig')}
                      variant="gradient"
                    >
                      <Plus size={16} />
                      Create Gig
                    </Button>
                  </div>
                  
                  {gigs?.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">You haven't created any gigs yet.</p>
                      <Button
                        onClick={() => navigate('/create-gig')}
                        variant="gradient"
                      >
                        <Plus size={16} />
                        Create your first gig
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gigs?.map((gig) => (
                        <div
                          key={gig.id}
                          className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-500 hover:shadow-lg transition-all duration-300 relative group"
                        >
                          {/* Gig Actions Menu */}
                          <div className="absolute top-2 right-2 z-10">
                            <div className="relative">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowGigMenu(showGigMenu === gig.id ? null : gig.id);
                                }}
                                className="p-1 bg-white bg-opacity-75 hover:bg-opacity-100 rounded text-gray-600 hover:text-gray-800 transition-colors shadow-sm"
                              >
                                <MoreVertical size={16} />
                              </button>
                              
                              {showGigMenu === gig.id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setShowGigMenu(null)}
                                  />
                                  <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-48">
                                    <button
                                      onClick={() => handleEditGig(gig.id)}
                                      className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                                    >
                                      <Edit size={16} />
                                      Edit Gig
                                    </button>
                                    <button
                                      onClick={() => navigate(`/gigs/${gig.id}`)}
                                      className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                      <Eye size={16} />
                                      View Gig
                                    </button>
                                    <hr className="border-gray-200" />
                                    {gig.status !== 'active' && (
                                      <button
                                        onClick={() => handleUpdateGigStatus(gig.id, 'active')}
                                        className="w-full text-left px-4 py-2 text-green-600 hover:bg-green-50 flex items-center gap-2"
                                      >
                                        <Play size={16} />
                                        Activate
                                      </button>
                                    )}
                                    {gig.status !== 'paused' && (
                                      <button
                                        onClick={() => handleUpdateGigStatus(gig.id, 'paused')}
                                        className="w-full text-left px-4 py-2 text-yellow-600 hover:bg-yellow-50 flex items-center gap-2"
                                      >
                                        <Pause size={16} />
                                        Pause
                                      </button>
                                    )}
                                    <button
                                      onClick={() => confirmDeleteGig(gig)}
                                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                                    >
                                      <Trash2 size={16} />
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <div
                            className="cursor-pointer"
                            onClick={() => navigate(`/gigs/${gig.id}`)}
                          >
                            <img
                              src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                              alt={gig.title}
                              className="w-full h-32 object-cover"
                            />
                            
                            <div className="p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <h4 className="text-gray-800 font-bold line-clamp-2 flex-1 mr-2">
                                  {gig.title}
                                </h4>
                                <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                                  gig.status === 'active' ? 'bg-green-100 text-green-800' :
                                  gig.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {gig.status}
                                </span>
                              </div>
                              
                              {/* Views counter */}
                              <div className="flex items-center gap-2">
                                <Eye size={14} className="text-gray-400" />
                                <span className="text-gray-500 text-sm">
                                  {gig.view_count || 0} views
                                </span>
                              </div>
                              
                              <p className="text-gray-600 text-sm line-clamp-2">
                                {gig.description.split('\n\nPackage Includes:')[0]}
                              </p>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-indigo-600 font-bold">
                                  {gig.price} {gig.payment_token === 'EGLD' ? 'EGLD' : 'IDEA'}
                                </span>
                                <span className="text-gray-600 text-sm">
                                  {gig.duration} days
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Task Manager */}
                    <TaskManager />
                    
                    {/* Calendar Widget */}
                    <CalendarWidget />
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Financial Overview */}
                    <FinancialOverview />
                    
                    {/* External Tools */}
                    <ExternalToolsWidget />
                  </div>
                </div>
              )}

              {/* My Orders - Only for own profile */}
              {isOwnProfile && (
                <div className="gradient-card p-6">
                  {/* Orders Waiting for Claim */}
                  <h3 className="text-lg font-bold text-gray-800 mb-6">Orders Waiting for Claim</h3>
                  {orders?.filter(order => {
                    const isCompleted = order.status === 'completed';
                    const completionDate = new Date(order.status_updated_at);
                    const threeDaysLater = new Date(completionDate.getTime() + 3 * 24 * 60 * 60 * 1000);
                    const now = new Date();
                    const canClaim = isCompleted && now >= threeDaysLater;
                    const isProvider = user?.id === order.gig?.provider?.id || user?.id === order.gig?.provider_id;
                    return isCompleted && canClaim && isProvider;
                  }).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">No orders ready to claim.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {orders?.filter(order => {
                        const isCompleted = order.status === 'completed';
                        const completionDate = new Date(order.status_updated_at);
                        const threeDaysLater = new Date(completionDate.getTime() + 3 * 24 * 60 * 60 * 1000);
                        const now = new Date();
                        const canClaim = isCompleted && now >= threeDaysLater;
                        const isProvider = user?.id === order.gig?.provider?.id || user?.id === order.gig?.provider_id;
                        return isCompleted && canClaim && isProvider;
                      }).map((order) => {
                        // Calculate claim status (already filtered, but included for consistency)
                        const isCompleted = order.status === 'completed';
                        const completionDate = new Date(order.status_updated_at);
                        const threeDaysLater = new Date(completionDate.getTime() + 3 * 24 * 60 * 60 * 1000);
                        const now = new Date();
                        const canClaim = isCompleted && now >= threeDaysLater;
                        const timeUntilClaim = isCompleted && !canClaim ? threeDaysLater.getTime() - now.getTime() : 0;
                        
                        // Format countdown (not used here but kept for consistency)
                        const formatCountdown = (ms: number) => {
                          const days = Math.floor(ms / (1000 * 60 * 60 * 24));
                          const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                          const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
                          return days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                        };
                        
                        return (
                          <div
                            key={order.id}
                            className="bg-white p-4 rounded-lg border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all duration-300 cursor-pointer"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="text-gray-800 font-medium mb-1">
                                  {order.gig?.title || 'Custom Project'}
                                </h4>
                                <p className="text-gray-600 text-sm">
                                  {order.amount} {order.payment_token || 'EGLD'} • {order.status}
                                </p>
                              </div>
                              <span className="text-gray-600 text-sm">
                                {new Date(order.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    💰 Ready to claim payment
                                  </p>
                                </div>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (canClaim) {
                                      handleClaimPayment(order.id);
                                    }
                                  }}
                                  disabled={!canClaim}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    canClaim 
                                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  }`}
                                >
                                  Claim Payment
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Recent Orders */}
                  <h3 className="text-lg font-bold text-gray-800 mb-6 mt-8">Recent Orders</h3>
                  {orders?.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">No orders yet.</p>
                      <Button
                        onClick={() => navigate('/gigs')}
                        variant="gradient"
                      >
                        Browse Gigs
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {orders?.map((order) => {
                        // Calculate if 3 days have passed since completion
                        const isCompleted = order.status === 'completed';
                        const completionDate = new Date(order.status_updated_at);
                        const threeDaysLater = new Date(completionDate.getTime() + 3 * 24 * 60 * 60 * 1000);
                        const now = new Date();
                        const canClaim = isCompleted && now >= threeDaysLater;
                        const timeUntilClaim = isCompleted && !canClaim ? threeDaysLater.getTime() - now.getTime() : 0;
                        const isProvider = user?.id === order.gig?.provider?.id || user?.id === order.gig?.provider_id;
                        
                        // Format countdown
                        const formatCountdown = (ms: number) => {
                          const days = Math.floor(ms / (1000 * 60 * 60 * 24));
                          const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                          const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
                          return days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                        };
                        
                        return (
                          <div
                            key={order.id}
                            className="bg-white p-4 rounded-lg border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all duration-300 cursor-pointer"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="text-gray-800 font-medium mb-1">
                                  {order.gig?.title || 'Custom Project'}
                                </h4>
                                <p className="text-gray-600 text-sm">
                                  {order.amount} {order.payment_token || 'EGLD'} • {order.status}
                                </p>
                                {/* Zobrazenie skráteného ID objednávky malým písmom */}
                                <p className="text-gray-500 text-xs mt-1">Order ID: {order.id.slice(0, 8)}...</p>
                              </div>
                              <span className="text-gray-600 text-sm">
                                {new Date(order.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {/* Claim Payment Section for Completed Orders */}
                            {isCompleted && isProvider && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">
                                      {canClaim ? '💰 Ready to claim payment' : '⏳ Payment claim available in:'}
                                    </p>
                                    {!canClaim && (
                                      <p className="text-xs text-gray-600">
                                        {formatCountdown(timeUntilClaim)}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (canClaim) {
                                        handleClaimPayment(order.id);
                                      }
                                    }}
                                    disabled={!canClaim}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                      canClaim 
                                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                  >
                                    {canClaim ? 'Claim Payment' : `Wait ${formatCountdown(timeUntilClaim)}`}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Only for own profile */}
            {isOwnProfile && (
              <div className="space-y-8">
                {/* Statistics Overview - Desktop Only */}
                <div className="gradient-card p-6 hidden lg:block">
                  <h3 className="text-lg font-bold text-gray-800 mb-6">Statistics Overview</h3>
                  
                  {/* Main Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Star size={16} className="text-yellow-500" />
                        <span className="text-gray-800 text-sm font-medium">Average Rating</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-800">
                        {(() => {
                          const stats = calculateReviewStats(providerReviews || []);
                          return stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0';
                        })()}
                      </p>
                      <p className="text-gray-600 text-xs">
                        {(() => {
                          const stats = calculateReviewStats(providerReviews || []);
                          return `${stats.totalReviews} review${stats.totalReviews !== 1 ? 's' : ''}`;
                        })()}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase size={16} className="text-green-600" />
                        <span className="text-gray-800 text-sm font-medium">Active Gigs</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-800">
                        {gigs?.filter(g => g.status === 'active').length || 0}
                      </p>
                      <p className="text-gray-600 text-xs">
                        of {gigs?.length || 0} total
                      </p>
                    </div>
                  </div>

                  {/* Earnings Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-bold text-gray-800">Earnings</h4>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign size={16} className="text-blue-600" />
                            <span className="text-gray-800 font-medium">EGLD Earnings</span>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-800">
                              {(() => {
                                const earnings = calculateEarnings(orders || []);
                                return earnings.egld.toFixed(2);
                              })()} EGLD
                            </p>
                            <p className="text-gray-600 text-xs">After 10% fee</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Coins size={16} className="text-purple-600" />
                            <span className="text-gray-800 font-medium">IDA Earnings</span>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-800">
                              {(() => {
                                const earnings = calculateEarnings(orders || []);
                                return earnings.ida.toFixed(2);
                              })()} IDA
                            </p>
                            <p className="text-gray-600 text-xs">No fees</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check size={16} className="text-gray-600" />
                          <span className="text-gray-800 font-medium">Completed Orders</span>
                        </div>
                        <p className="text-xl font-bold text-gray-800">
                          {(() => {
                            const earnings = calculateEarnings(orders || []);
                            return earnings.totalOrders;
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rating Distribution */}
                  {(() => {
                    const stats = calculateReviewStats(providerReviews || []);
                    return stats.totalReviews > 0 ? (
                      <div className="space-y-4">
                        <h4 className="text-md font-bold text-gray-800">Rating Distribution</h4>
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map((rating) => {
                            const count = stats.ratingDistribution[rating] || 0;
                            const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                            
                            return (
                              <div key={rating} className="flex items-center gap-3">
                                <div className="flex items-center gap-1 w-12">
                                  <span className="text-gray-800 text-sm">{rating}</span>
                                  <Star size={12} className="text-yellow-500" />
                                </div>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-gray-600 text-sm w-12 text-right">
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Settings */}
                <div className="gradient-card p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Settings</h3>
                  <div className="space-y-4">
                    <EmailNotificationsToggle 
                      enabled={profile.email_notifications_enabled || false}
                      currentEmail={profile.email || ''}
                      onEmailUpdated={(newEmail) => {
                        // Refresh profile data after email update
                        refetch();
                      }}
                    />
                  </div>
                </div>

                {/* Notifications */}
                <div className="gradient-card p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button
                        onClick={handleMarkAllAsRead}
                        variant="outline"
                        size="sm"
                      >
                        Mark all as read ({unreadCount})
                      </Button>
                    )}
                  </div>
                  
                  {notifications?.length === 0 ? (
                    <p className="text-gray-600">No notifications</p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {notifications?.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                            !notification.read 
                              ? 'bg-blue-50 border-blue-300' 
                              : 'bg-white border-gray-200'
                          }`}
                          onClick={() => {
                            // Navigate to notification target if available
                            if (notification.data?.order_id) {
                              navigate(`/orders/${notification.data.order_id}`);
                            } else if (notification.data?.proposal_id) {
                              navigate(`/proposals/${notification.data.proposal_id}`);
                            }
                          }}
                        >
                          <div className="space-y-1">
                            <p className={`text-sm ${
                              !notification.read ? 'text-gray-800 font-medium' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-gray-600 text-xs line-clamp-2">
                              {notification.content}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Statistics for Public Profiles */}
            {!isOwnProfile && (
              <div className="gradient-card p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Provider Statistics</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={16} className="text-yellow-500" />
                      <span className="text-gray-800 text-sm font-medium">Average Rating</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">
                      {(() => {
                        const stats = calculateReviewStats(providerReviews || []);
                        return stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0';
                      })()}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {(() => {
                        const stats = calculateReviewStats(providerReviews || []);
                        return `${stats.totalReviews} review${stats.totalReviews !== 1 ? 's' : ''}`;
                      })()}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase size={16} className="text-green-600" />
                      <span className="text-gray-800 text-sm font-medium">Total Gigs</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">
                      {/* For public profiles, we'd need to fetch their gigs separately */}
                      0
                    </p>
                    <p className="text-gray-600 text-xs">
                      available services
                    </p>
                  </div>
                </div>

                {/* Rating Distribution for Public Profile */}
                {(() => {
                  const stats = calculateReviewStats(providerReviews || []);
                  return stats.totalReviews > 0 ? (
                    <div className="space-y-4">
                      <h4 className="text-md font-bold text-gray-800">Rating Distribution</h4>
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => {
                          const count = stats.ratingDistribution[rating] || 0;
                          const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                          
                          return (
                            <div key={rating} className="flex items-center gap-3">
                              <div className="flex items-center gap-1 w-12">
                                <span className="text-gray-800 text-sm">{rating}</span>
                                <Star size={12} className="text-yellow-500" />
                              </div>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-gray-600 text-sm w-12 text-right">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600">No reviews yet</p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          )}
        </div>

        {/* Edit Profile Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto rounded-lg">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">Edit Profile</h3>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-gray-400 hover:text-gray-800"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-800 text-sm font-medium mb-2">
                      Profile Picture URL
                    </label>
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Current avatar preview */}
                      <div className="w-20 h-20 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-xl text-white flex-shrink-0">
                        {editForm.avatar_url ? (
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
                        ) : (
                          <span>{editForm.username?.charAt(0)?.toUpperCase() || "U"}</span>
                        )}
                      </div>
                      
                      {/* URL input */}
                      <div className="flex-1">
                        <input
                          type="url"
                          name="avatar_url"
                          value={editForm.avatar_url}
                          onChange={handleEditFormChange}
                          placeholder="https://example.com/your-avatar.jpg"
                          className="w-full p-3 border border-gray-300 rounded-md text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-gray-600 text-xs mt-1">
                          Enter a direct URL to your profile image
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-800 text-sm font-medium mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={editForm.username}
                      onChange={handleEditFormChange}
                      className="w-full p-3 border border-gray-300 rounded-md text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-800 text-sm font-medium mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={editForm.full_name}
                      onChange={handleEditFormChange}
                      className="w-full p-3 border border-gray-300 rounded-md text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-800 text-sm font-medium mb-2">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={editForm.bio}
                      onChange={handleEditFormChange}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-md text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tell others about yourself..."
                    />
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-3">Social Media Links</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-gray-800 text-sm font-medium mb-2">
                          Twitter URL
                        </label>
                        <input
                          type="url"
                          name="twitter_url"
                          value={editForm.twitter_url}
                          onChange={handleEditFormChange}
                          placeholder="https://twitter.com/yourusername"
                          className="w-full p-3 border border-gray-300 rounded-md text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-800 text-sm font-medium mb-2">
                          GitHub URL
                        </label>
                        <input
                          type="url"
                          name="github_url"
                          value={editForm.github_url}
                          onChange={handleEditFormChange}
                          placeholder="https://github.com/yourusername"
                          className="w-full p-3 border border-gray-300 rounded-md text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-800 text-sm font-medium mb-2">
                          LinkedIn URL
                        </label>
                        <input
                          type="url"
                          name="linkedin_url"
                          value={editForm.linkedin_url}
                          onChange={handleEditFormChange}
                          placeholder="https://linkedin.com/in/yourusername"
                          className="w-full p-3 border border-gray-300 rounded-md text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-800 text-sm font-medium mb-2">
                          Website URL
                        </label>
                        <input
                          type="url"
                          name="website_url"
                          value={editForm.website_url}
                          onChange={handleEditFormChange}
                          placeholder="https://yourwebsite.com"
                          className="w-full p-3 border border-gray-300 rounded-md text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfile.isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg"
                  >
                    {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Gig</h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete "{selectedGig?.title}"?
              </p>
              <p className="text-red-600 mb-4 text-sm">
                This action cannot be undone. All related orders and messages will also be deleted.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteGig}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg"
                  disabled={deleteGig.isLoading}
                >
                  {deleteGig.isLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};