import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User, 
  Settings, 
  Star, 
  Edit, 
  Trash2, 
  Plus, 
  DollarSign, 
  Clock, 
  Calendar,
  Briefcase,
  Bell,
  Mail,
  Shield,
  Eye,
  MessageCircle,
  Award,
  TrendingUp,
  MoreVertical,
  Edit2,
  X
} from 'lucide-react';
import { Button, Card } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useAuth } from '../../context/AuthContext';
import { useDeleteGig } from '../../hooks/useGigs';
import { usePayments } from '../../hooks/usePayments';
import { useWindowSize } from '../../hooks/useWindowSize';
import { EmailNotificationsToggle } from '../../components/EmailNotificationsToggle';
import { ReviewModal } from '../../components/ReviewModal';
import { supabase } from '../../lib/supabase';

export const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading, refetch } = useProfile(id || user?.id);
  const updateProfile = useUpdateProfile();
  const deleteGig = useDeleteGig();
  const { claimPayment } = usePayments();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [searchParams] = useSearchParams();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [gigToDelete, setGigToDelete] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletedGigIds, setDeletedGigIds] = useState<string[]>([]);
  const [timeLeftMap, setTimeLeftMap] = useState<Record<string, string>>({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);

  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    avatar_url: '',
    bio: '',
  });

  // Check if we're still loading authentication or profile data
  const isLoading = authLoading || profileLoading;

  // Countdown timer for orders
  useEffect(() => {
    const updateTimeLeft = () => {
      if (profile?.orders) {
        const newTimeLeftMap: Record<string, string> = {};
        
        profile.orders.forEach((order: any) => {
          // For pending_release orders, calculate time until claimable
          if (order.payment_status === 'pending_release' && order.release_at) {
            const now = new Date();
            const releaseTime = new Date(order.release_at);
            const timeDiff = releaseTime.getTime() - now.getTime();
            
            if (timeDiff > 0) {
              const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
              const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
              
              if (days > 0) {
                newTimeLeftMap[order.id] = `${days}d ${hours}h ${minutes}m`;
              } else if (hours > 0) {
                newTimeLeftMap[order.id] = `${hours}h ${minutes}m`;
              } else {
                newTimeLeftMap[order.id] = `${minutes}m`;
              }
            } else {
              newTimeLeftMap[order.id] = 'Ready to claim';
            }
          }
        });
        
        setTimeLeftMap(newTimeLeftMap);
      }
    };
    
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [profile?.orders]);

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        full_name: profile.full_name || '',
        avatar_url: profile.avatar_url || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  // Real-time subscription for gigs
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('public:gigs')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'gigs',
          filter: `provider_id=eq.${user.id}`,
        },
        (payload) => {
          setDeletedGigIds(prev => [...prev, payload.old.id]);
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [refetch, user?.id]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const orderId = searchParams.get('order');

    if (tab === 'orders' && orderId) {
      navigate(`/orders/${orderId}`);
    }
  }, [searchParams, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync(formData);
      alert('Profile updated successfully');
      setIsEditModalOpen(false);
    } catch (error) {
      alert('Error updating profile: ' + (error instanceof Error ? error.message : 'Please try again later'));
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, gigId: string) => {
    e.stopPropagation();
    setGigToDelete(gigId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!gigToDelete) {
      return;
    }

    try {
      await deleteGig.mutateAsync(gigToDelete, {
        onSuccess: async () => {
          setDeletedGigIds(prev => [...prev, gigToDelete]);
          await refetch();
        },
      });
      alert('Gig deleted successfully');
    } catch (error) {
      alert('Error deleting gig: ' + (error instanceof Error ? error.message : 'Please try again later'));
    } finally {
      setGigToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent, gigId: string) => {
    e.stopPropagation();
    navigate(`/gigs/${gigId}/edit`);
  };

  const handleClaimPayment = async (orderId: string) => {
    try {
      await claimPayment(orderId);
      alert('Payment claimed successfully');
    } catch (error) {
      alert('Failed to claim payment: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#01c3a8';
      case 'in_progress':
        return '#1890ff';
      case 'cancelled':
        return '#a63d2a';
      default:
        return '#ffb741';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'programming & tech':
        return '#01c3a8';
      case 'graphics & design':
        return '#1890ff';
      case 'digital marketing':
        return '#ffb741';
      case 'writing & translation':
        return '#ff6f61';
      case 'video & animation':
        return '#a259ff';
      case 'ai services':
        return '#00ddeb';
      case 'music & audio':
        return '#ffcc33';
      case 'business':
        return '#2ecc71';
      case 'consulting':
        return '#e91e63';
      default:
        return '#a63d2a';
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'completed':
        return 100;
      case 'in_progress':
        return 50;
      case 'cancelled':
        return 100;
      default:
        return 25;
    }
  };

  // Show loading spinner while authentication or profile is loading
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Loading Profile" reference="#">
          <div className="flex justify-center">
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-white">
                {authLoading ? 'Setting up your profile...' : 'Loading profile data...'}
              </p>
              <p className="text-gray-400 text-sm">
                Please wait while we prepare everything for you
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Calculate statistics
  const completedOrders = profile?.orders?.filter(order => order.status === 'completed') || [];
  
  // Calculate earnings for both EGLD and IDA tokens
  const egldEarnings = completedOrders
    .filter(order => (order.payment_token || 'EGLD') === 'EGLD')
    .reduce((sum, order) => sum + (Number(order.amount) * 0.9), 0); // 10% fee deducted
  
  const idaEarnings = completedOrders
    .filter(order => order.payment_token === 'IDA-f9bc1d')
    .reduce((sum, order) => sum + Number(order.amount), 0); // No fees for IDA
  
  const totalEarnings = egldEarnings + idaEarnings;
  
  const reviews = completedOrders.flatMap(order => order.reviews || []);
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 'N/A';

  // Filter out deleted gigs client-side
  const filteredGigs = profile?.gigs?.filter(gig => !deletedGigIds.includes(gig.id)) || [];

  if (!profile) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Profile Not Found" reference="#">
          <p className="text-white">Profile not found</p>
        </Card>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-md px-4 py-6">
          {/* Profile Header - Mobile */}
          <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-xl text-white">
                {profile?.username?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-800">
                  {profile?.full_name || profile?.username}
                </h1>
                <p className="text-gray-600 text-sm">Web3 Developer</p>
                <p className="text-blue-600 text-xs">
                  Member since {new Date(profile.created_at!).toLocaleDateString()}
                </p>
              </div>
            </div>

            <p className="text-gray-700 text-sm mb-4">
              {profile?.bio || 'No bio yet'}
            </p>

            {isOwnProfile && (
              <Button
                onClick={() => setIsEditModalOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
              >
                <Edit size={16} />
                Edit Profile
              </Button>
            )}
          </div>

          {/* Statistics - Always Visible on Mobile */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp size={20} className="text-green-600" />
              </div>
              <p className="text-gray-600 text-xs mb-1">Total Earned</p>
              <div className="space-y-1">
                {egldEarnings > 0 && (
                  <p className="text-lg font-bold text-green-600">
                    {egldEarnings.toFixed(2)} EGLD
                  </p>
                )}
                {idaEarnings > 0 && (
                  <p className="text-sm font-bold text-purple-600">
                    {idaEarnings.toFixed(2)} IDA
                  </p>
                )}
                {totalEarnings === 0 && (
                  <p className="text-lg font-bold text-gray-800">0</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm text-center">
              <div className="flex items-center justify-center mb-2">
                <Briefcase size={20} className="text-blue-600" />
              </div>
              <p className="text-gray-600 text-xs mb-1">Completed</p>
              <p className="text-lg font-bold text-blue-600">
                {completedOrders.length}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm text-center">
              <div className="flex items-center justify-center mb-2">
                <Star size={20} className="text-yellow-500" />
              </div>
              <p className="text-gray-600 text-xs mb-1">Rating</p>
              <p className="text-lg font-bold text-yellow-600">
                {averageRating}
              </p>
            </div>
          </div>

          {/* Tabbed Panel - Mobile */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <div className="flex overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setActiveTab(0)}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 0
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-blue-600'
                  }`}
                >
                  My Gigs
                </button>
                {isOwnProfile && (
                  <button
                    onClick={() => setActiveTab(1)}
                    className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === 1
                        ? 'border-blue-600 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    My Orders
                  </button>
                )}
                {isOwnProfile && (
                  <button
                    onClick={() => setActiveTab(2)}
                    className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === 2
                        ? 'border-blue-600 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Settings
                  </button>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {/* My Gigs Tab */}
              {activeTab === 0 && (
                <div className="space-y-4">
                  {filteredGigs.length > 0 ? (
                    filteredGigs.map((gig) => {
                      const categoryColor = getCategoryColor(gig.category);
                      const paymentToken = gig.payment_token || 'EGLD';
                      const tokenSymbol = paymentToken === 'EGLD' ? 'EGLD' : 'IDA';

                      return (
                        <div
                          key={gig.id}
                          className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => navigate(`/gigs/${gig.id}`)}
                        >
                          {/* Header with date and category */}
                          <div 
                            className="flex justify-between items-center p-3 border-b border-gray-100"
                            style={{ backgroundColor: `${categoryColor}10` }}
                          >
                            <span className="text-xs text-gray-500">
                              {new Date(gig.created_at).toLocaleDateString()}
                            </span>
                            <span 
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                            >
                              {gig.category}
                            </span>
                          </div>

                          {/* Gig Image */}
                          <div className="relative h-32">
                            <img
                              src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                              alt={gig.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Content */}
                          <div className="p-4 space-y-3">
                            <h3 className="text-lg font-bold text-gray-800 line-clamp-2">
                              {gig.title}
                            </h3>
                            
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {gig.description}
                            </p>

                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">
                                Duration: {gig.duration} days
                              </span>
                              <div className="flex items-center gap-1">
                                <DollarSign size={16} className="text-gray-600" />
                                <span className="font-bold" style={{ color: categoryColor }}>
                                  {gig.price} {tokenSymbol}
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            {isOwnProfile && (
                              <div className="flex gap-2 pt-2">
                                <Button
                                  onClick={(e) => handleEditClick(e, gig.id)}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm"
                                >
                                  <Edit2 size={14} />
                                  Edit
                                </Button>
                                <Button
                                  onClick={(e) => handleDeleteClick(e, gig.id)}
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">No gigs yet</p>
                      {isOwnProfile && (
                        <Button
                          onClick={() => navigate('/create-gig')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
                        >
                          <Plus size={16} />
                          Create your first gig
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* My Orders Tab */}
              {activeTab === 1 && isOwnProfile && (
                <div className="space-y-4">
                  {profile?.orders?.length > 0 ? (
                    profile.orders.map((order) => {
                      const statusColor = getStatusColor(order.status);
                      const progressValue = getProgressValue(order.status);
                      const isProvider = order.gig?.provider_id === user?.id;
                      const canClaim = order.payment_status === 'pending_release' && 
                                       order.release_at && 
                                       new Date(order.release_at) <= new Date() &&
                                       isProvider;

                      return (
                        <div
                          key={order.id}
                          className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          {/* Header */}
                          <div className="flex justify-between items-center p-3 border-b border-gray-100">
                            <span className="text-xs text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                            <span 
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                            >
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="p-4 space-y-3">
                            <h3 className="text-lg font-bold text-gray-800">
                              {order.gig?.title || "Custom Project"}
                            </h3>
                            
                            <p className="text-gray-600 text-sm">
                              Order #{order.id.slice(0, 8)}
                            </p>

                            {/* Progress */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-600 text-xs">Progress</span>
                                <span className="text-gray-800 text-xs font-medium">{progressValue}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${progressValue}%`,
                                    backgroundColor: statusColor
                                  }}
                                ></div>
                              </div>
                            </div>

                            {/* Payment Status */}
                            {order.payment_status === 'pending_release' && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-yellow-800 text-sm font-medium">
                                      Payment Ready
                                    </p>
                                    <p className="text-yellow-700 text-xs">
                                      {timeLeftMap[order.id] === 'Ready to claim' ? 
                                        'Ready to claim now' : 
                                        `Available in ${timeLeftMap[order.id] || 'calculating...'}`
                                      }
                                    </p>
                                  </div>
                                  {canClaim && (
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleClaimPayment(order.id);
                                      }}
                                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                                    >
                                      <DollarSign size={12} />
                                      Claim
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Amount */}
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm">Amount:</span>
                              <span className="font-bold text-gray-800">
                                {order.amount} {order.payment_token || 'EGLD'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No orders yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 2 && isOwnProfile && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Notification Settings</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <EmailNotificationsToggle enabled={profile?.email_notifications_enabled ?? true} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom padding for mobile navigation */}
          <div className="h-20"></div>
        </div>

        {/* Edit Profile Modal - Mobile */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Edit Profile</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Avatar URL</label>
                  <input
                    type="url"
                    name="avatar_url"
                    value={formData.avatar_url}
                    onChange={handleChange}
                    placeholder="Enter avatar URL"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about yourself"
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg"
                    disabled={updateProfile.isLoading}
                  >
                    {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal - Mobile */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Gig</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this gig? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteConfirm}
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
    );
  }

  // Desktop Layout (unchanged)
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="space-y-8">
        {/* Profile Header */}
        <Card className="p-8" title="Profile Header" reference="#">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex gap-4 items-center mb-4">
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-2xl text-white">
                  {profile?.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-white">
                    {profile?.full_name || profile?.username}
                  </h1>
                  <p className="text-gray-400">Web3 Developer</p>
                  <p className="text-blue-400 text-sm">
                    Member since {new Date(profile.created_at!).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <p className="text-gray-300 text-lg mb-6">
                {profile?.bio || 'No bio yet'}
              </p>

              {isOwnProfile && (
                <Button
                  onClick={() => setIsEditModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
                >
                  <Edit size={18} />
                  Edit Profile
                </Button>
              )}
            </div>

            <div className="bg-gray-800 bg-opacity-50 p-6 rounded-xl min-w-64">
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">Total Earnings</p>
                  <div className="space-y-1">
                    {egldEarnings > 0 && (
                      <p className="text-2xl font-bold text-green-400">
                        {egldEarnings.toFixed(2)} EGLD
                      </p>
                    )}
                    {idaEarnings > 0 && (
                      <p className="text-xl font-bold text-purple-400">
                        {idaEarnings.toFixed(2)} IDA
                      </p>
                    )}
                    {totalEarnings === 0 && (
                      <p className="text-2xl font-bold text-white">0</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Completed Gigs</p>
                  <p className="text-2xl font-bold text-white">
                    {completedOrders.length}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Average Rating</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-white">
                      {averageRating}
                    </p>
                    {averageRating !== 'N/A' && (
                      <Star fill="yellow" color="yellow" size={20} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Edit Profile Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="p-6 max-w-md w-full mx-4" title="Edit Profile" reference="#">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">Edit Profile</h3>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter username"
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Avatar URL</label>
                    <input
                      type="url"
                      name="avatar_url"
                      value={formData.avatar_url}
                      onChange={handleChange}
                      placeholder="Enter avatar URL"
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell us about yourself"
                      rows={4}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg"
                      disabled={updateProfile.isLoading}
                    >
                      {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}

        {/* Profile Content - Desktop Tabs */}
        <Card className="p-8" title="Profile Content" reference="#">
          <div className="border-b border-gray-700 mb-6">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab(0)}
                className={`pb-4 text-lg font-medium border-b-2 transition-colors ${
                  activeTab === 0
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-blue-400'
                }`}
              >
                Active Gigs ({filteredGigs.length})
              </button>
              {isOwnProfile && (
                <button
                  onClick={() => setActiveTab(1)}
                  className={`pb-4 text-lg font-medium border-b-2 transition-colors ${
                    activeTab === 1
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-blue-400'
                  }`}
                >
                  Orders ({profile?.orders?.length || 0})
                </button>
              )}
              <button
                onClick={() => setActiveTab(2)}
                className={`pb-4 text-lg font-medium border-b-2 transition-colors ${
                  activeTab === 2
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-blue-400'
                }`}
              >
                Reviews ({reviews.length})
              </button>
              {isOwnProfile && (
                <button
                  onClick={() => setActiveTab(3)}
                  className={`pb-4 text-lg font-medium border-b-2 transition-colors ${
                    activeTab === 3
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-blue-400'
                  }`}
                >
                  Settings
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {/* Active Gigs Tab */}
            {activeTab === 0 && (
              <div>
                {filteredGigs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGigs.map((gig) => {
                      const categoryColor = getCategoryColor(gig.category);
                      const paymentToken = gig.payment_token || 'EGLD';
                      const tokenSymbol = paymentToken === 'EGLD' ? 'EGLD' : 'IDA';
                      const hasNoFees = paymentToken !== 'EGLD';

                      return (
                        <div
                          key={gig.id}
                          className="bg-gray-800 bg-opacity-50 rounded-lg overflow-hidden border border-gray-600 hover:border-blue-500 transition-all duration-300 cursor-pointer"
                          onClick={() => navigate(`/gigs/${gig.id}`)}
                          style={{
                            borderTopColor: categoryColor,
                            borderTopWidth: '3px'
                          }}
                        >
                          {/* Delete Button */}
                          {isOwnProfile && (
                            <button
                              onClick={(e) => handleDeleteClick(e, gig.id)}
                              className="absolute top-2 right-2 z-10 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full"
                            >
                              <X size={16} />
                            </button>
                          )}

                          {/* Card Header */}
                          <div className="flex justify-between items-center p-3 border-b border-gray-600">
                            <span className="text-gray-400 text-xs">
                              {new Date(gig.created_at).toLocaleDateString()}
                            </span>
                            <div className="flex gap-2">
                              <span
                                className="px-2 py-1 rounded-full text-xs font-medium"
                                style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                              >
                                {gig.category}
                              </span>
                              {hasNoFees && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  No Fees
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Gig Image */}
                          <div className="relative h-48">
                            <img
                              src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                              alt={gig.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Card Content */}
                          <div className="p-4 space-y-3">
                            <h3 className="text-lg font-bold text-white line-clamp-2">
                              {gig.title}
                            </h3>
                            
                            <p className="text-gray-300 text-sm line-clamp-3">
                              {gig.description}
                            </p>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 text-sm">
                                Duration: {gig.duration} days
                              </span>
                              <div className="flex items-center gap-1">
                                <DollarSign size={16} className="text-gray-400" />
                                <span className="text-lg font-bold" style={{ color: categoryColor }}>
                                  {gig.price} {tokenSymbol}
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            {isOwnProfile && (
                              <div className="flex gap-2 pt-2">
                                <Button
                                  onClick={(e) => handleEditClick(e, gig.id)}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2"
                                >
                                  <Edit2 size={16} />
                                  Edit
                                </Button>
                                <Button
                                  onClick={(e) => handleDeleteClick(e, gig.id)}
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2"
                                >
                                  <Trash2 size={16} />
                                  Delete
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  }
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No gigs yet</p>
                    {isOwnProfile && (
                      <Button
                        onClick={() => navigate('/create-gig')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
                      >
                        <Plus size={18} />
                        Create your first gig
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 1 && isOwnProfile && (
              <div>
                {profile?.orders?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profile.orders.map((order) => {
                      const statusColor = getStatusColor(order.status);
                      const progressValue = getProgressValue(order.status);
                      const isProvider = order.gig?.provider_id === user?.id;
                      const canClaim = order.payment_status === 'pending_release' && 
                                       order.release_at && 
                                       new Date(order.release_at) <= new Date() &&
                                       isProvider;

                      return (
                        <div
                          key={order.id}
                          className="bg-gray-800 bg-opacity-50 rounded-lg overflow-hidden border border-gray-600 hover:border-blue-500 transition-all duration-300 cursor-pointer relative"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          {/* Payment Status Badge */}
                          {order.payment_status === 'pending_release' && (
                            <div className="absolute top-2 left-2 right-2 z-10">
                              <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                                canClaim ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {canClaim ? <DollarSign size={12} /> : <Clock size={12} />}
                                {canClaim ? 'Ready to claim' : `Available in ${timeLeftMap[order.id] || 'calculating...'}`}
                              </div>
                            </div>
                          )}

                          {/* Card Header */}
                          <div className="flex justify-between items-center p-4 border-b border-gray-600">
                            <span className="text-gray-400 text-xs">
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                            <MoreVertical size={16} className="text-gray-400" />
                          </div>

                          {/* Card Content */}
                          <div className="p-4 space-y-4">
                            <h3 className="text-lg font-bold text-white">
                              {order.gig?.title || "Custom Project"}
                            </h3>
                            
                            <p className="text-gray-400 text-sm">
                              Order #{order.id.slice(0, 8)}
                            </p>

                            {/* Progress */}
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-white text-sm font-medium">Progress</span>
                                <span className="text-white text-sm">{progressValue}%</span>
                              </div>
                              <div className="w-full bg-gray-600 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${progressValue}%`,
                                    backgroundColor: statusColor
                                  }}
                                ></div>
                              </div>
                            </div>

                            {/* Payment Status */}
                            {order.payment_status === 'pending_release' && (
                              <div className="bg-gray-700 p-3 rounded-md">
                                <p className="text-white text-sm font-medium mb-1">Payment Status</p>
                                <p className="text-gray-300 text-xs">
                                  {timeLeftMap[order.id] === 'Ready to claim' ? 
                                    '🟢 Ready to claim' : 
                                    `⏰ Available in ${timeLeftMap[order.id] || 'calculating...'}`
                                  }
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Card Footer */}
                          <div className="flex justify-between items-center p-4 border-t border-gray-600 bg-gray-900">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white">
                                {order.gig?.provider?.username?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white">
                                {order.client?.username?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                            </div>
                            
                            {/* Payment Action */}
                            {order.payment_status === 'pending_release' && canClaim ? (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClaimPayment(order.id);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                              >
                                <DollarSign size={12} />
                                Claim Payment
                              </Button>
                            ) : (
                              <span className="bg-gray-700 text-white rounded-full px-3 py-1 text-xs">
                                {order.amount} {order.payment_token || 'EGLD'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  }
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No orders yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 2 && (
              <div>
                {reviews.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-gray-800 bg-opacity-50 p-6 rounded-xl border border-gray-600"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white">
                                {review.order?.client?.username?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">
                                  {review.order?.client?.username}
                                </p>
                                <p className="text-gray-400 text-xs">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex">
                              {Array(5)
                                .fill('')
                                .map((_, i) => (
                                  <Star
                                    key={i}
                                    size={16}
                                    fill={i < review.rating ? '#FFD700' : 'transparent'}
                                    color={i < review.rating ? '#FFD700' : '#A0AEC0'}
                                  />
                                ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-gray-400 text-xs mb-1">
                              Order: {review.order?.gig?.title}
                            </p>
                            <p className="text-white text-sm">{review.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No reviews yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 3 && isOwnProfile && (
              <div>
                <div className="bg-gray-800 bg-opacity-50 p-6 rounded-xl border border-gray-600">
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white mb-4">Notification Settings</h3>
                    <EmailNotificationsToggle enabled={profile?.email_notifications_enabled ?? true} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="p-6 max-w-md w-full mx-4" title="Delete Gig" reference="#">
              <h3 className="text-xl font-bold text-white mb-4">Delete Gig</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete this gig? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg"
                  disabled={deleteGig.isLoading}
                >
                  {deleteGig.isLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && selectedOrder && (
          <ReviewModal
            isOpen={showReviewModal}
            onClose={() => setShowReviewModal(false)}
            order={selectedOrder}
            onReviewSubmitted={() => {
              setShowReviewModal(false);
              refetch();
            }}
          />
        )}
      </div>
    </div>
  );
};