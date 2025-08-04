import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { MoreVertical, Plus, Star, X, Edit2, Clock, DollarSign, Coins } from 'lucide-react';
import { Button, Card } from 'components';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useAuth } from '../../context/AuthContext';
import { EmailNotificationsToggle } from '../../components/EmailNotificationsToggle';
import { TwitterShareButton } from '../../components/TwitterShareButton';
import { useDeleteGig } from '../../hooks/useGigs';
import { usePayments } from '../../hooks/usePayments';
import { supabase } from '../../lib/supabase';
import { useCustomToast } from '../../hooks/useCustomToast';
import { useOrders } from '../../hooks/useOrders';

export const Profile = () => {
  const { id } = useParams();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading, refetch } = useProfile(id || user?.id);
  const updateProfile = useUpdateProfile();
  const deleteGig = useDeleteGig();
  const { claimPayment } = usePayments();
  const { showToast } = useCustomToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [gigToDelete, setGigToDelete] = useState<string | null>(null);
  const [deletedGigIds, setDeletedGigIds] = useState<string[]>([]);
  const [timeLeftMap, setTimeLeftMap] = useState<Record<string, string>>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
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
      showToast('Profile updated successfully', { type: 'success' });
      setIsEditModalOpen(false);
      await refetch();
    } catch (error) {
      showToast(
        `Error updating profile: ${error instanceof Error ? error.message : 'Please try again later'}`,
        { type: 'error' }
      );
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, gigId: string) => {
    e.stopPropagation();
    setGigToDelete(gigId);
    setIsDeleteAlertOpen(true);
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
      showToast('Gig deleted successfully', { type: 'success' });
    } catch (error) {
      showToast(
        `Error deleting gig: ${error instanceof Error ? error.message : 'Please try again later'}`,
        { type: 'error' }
      );
    } finally {
      setGigToDelete(null);
      setIsDeleteAlertOpen(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent, gigId: string) => {
    e.stopPropagation();
    navigate(`/gigs/${gigId}/edit`);
  };

  const handleClaimPayment = async (orderId: string) => {
    try {
      await claimPayment(orderId);
      showToast('Payment claimed successfully', { type: 'success' });
    } catch (error) {
      showToast(
        `Failed to claim payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { type: 'error' }
      );
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

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'in_progress':
        return 'blue';
      case 'cancelled':
        return 'red';
      default:
        return 'yellow';
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

  const getPaymentStatusBadge = (order: any) => {
    if (order.payment_status === 'pending_release') {
      const canClaim = order.release_at && new Date(order.release_at) <= new Date();
      return (
        <div className={`absolute top-2 left-4 right-4 z-10 px-2 py-1 rounded text-xs flex items-center gap-1 ${
          canClaim ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {canClaim ? <DollarSign size={10} /> : <Clock size={10} />}
          {canClaim ? 'Ready to claim' : `Available in ${timeLeftMap[order.id] || 'calculating...'}`}
        </div>
      );
    }
    return null;
  };

  // Show loading spinner while authentication or profile is loading
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Loading Profile" reference="#">
          <div className="flex justify-center">
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-white text-lg">
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
  const completedOrders = profile?.orders?.filter((order: any) => order.status === 'completed') || [];
  const totalEarningsEGLD = completedOrders
    .filter((order: any) => order.payment_token === 'EGLD' || !order.payment_token)
    .reduce((sum: number, order: any) => sum + Number(order.amount), 0);
  const totalEarningsIDA = completedOrders
    .filter((order: any) => order.payment_token === 'IDA')
    .reduce((sum: number, order: any) => sum + Number(order.amount), 0);
  const reviews = completedOrders.flatMap((order: any) => order.reviews || []);
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 'N/A';

  // Filter out deleted gigs client-side
  const filteredGigs = profile?.gigs?.filter((gig: any) => !deletedGigIds.includes(gig.id)) || [];

  // Separate orders by role
  const clientOrders = profile?.orders?.filter((order: any) => order.client_id === user?.id) || [];
  const providerOrders = profile?.orders?.filter((order: any) => order.provider_id === user?.id) || [];

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

  const tabs = [
    { id: 0, label: 'Active Gigs' },
    ...(isOwnProfile ? [{ id: 1, label: 'Orders' }] : []),
    { id: 2, label: 'Reviews' },
    ...(isOwnProfile ? [{ id: 3, label: 'Settings' }] : []),
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
      {/* Profile Header */}
      <Card className="p-4 md:p-6 mb-4 md:mb-6" title="Profile Header" reference="#">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          <div className="flex-1">
            <div className="flex gap-3 items-center mb-3 md:mb-4">
              <div className="w-12 md:w-16 h-12 md:h-16 rounded-full overflow-hidden relative">
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
                          const fallback = parent.querySelector('.fallback-avatar') as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }
                      }}
                    />
                    <div 
                      className="fallback-avatar w-full h-full bg-gray-600 rounded-full flex items-center justify-center text-lg md:text-xl text-white absolute inset-0"
                      style={{ display: 'none' }}
                    >
                      {profile?.username?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-600 rounded-full flex items-center justify-center text-lg md:text-xl text-white">
                    {profile?.username?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h1 className="text-lg md:text-xl font-bold text-grey">{profile?.full_name || profile?.username}</h1>
                <p className="text-gray-400 text-xs md:text-sm">Web3 Developer</p>
                <p className="text-blue-400 text-xs">
                  Member since {new Date(profile.created_at!).toLocaleDateString()}
                </p>
              </div>
            </div>

            <p className="text-white mb-3 text-xs md:text-sm">
              {profile?.bio || 'No bio yet'}
            </p>

            {isOwnProfile && (
              <Button
                onClick={() => setIsEditModalOpen(true)}
                className="border border-blue-600 text-white hover:bg-blue-50 px-3 md:px-4 py-2 rounded-lg text-sm md:text-base"
              >
                Edit Profile
              </Button>
            )}
          </div>

          <div className="bg-gray-800 p-2 md:p-3 rounded-xl w-full md:w-40">
            <div className="grid grid-cols-3 md:grid-cols-1 gap-2 md:gap-2 md:space-y-2">
              <div>
                <p className="text-gray-400 text-xs">Total Earnings</p>
                <p className="text-sm font-bold text-blue-400">
                  {totalEarningsEGLD} EGLD
                  {totalEarningsIDA > 0 && ` + ${totalEarningsIDA} IDA`}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-xs">Completed Gigs</p>
                <p className="text-sm font-bold text-white">
                  {completedOrders.length}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-xs">Average Rating</p>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-bold text-white">
                    {averageRating}
                  </p>
                  {averageRating !== 'N/A' && (
                    <Star className="text-yellow-400 fill-current" size={12} />
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
          {/* Wrapper div to constrain Card width to 640px */}
          <div className="w-[40rem] min-w-[32rem] mx-auto" data-debug="modal-wrapper">
            <Card
              className="p-4 sm:p-6 !w-[40rem] !min-w-[32rem] !flex-none !bg-gray-900 mx-auto max-h-[90vh] overflow-y-auto"
              style={{ width: '640px', minWidth: '512px', flex: '0 0 auto', backgroundColor: '#111827' }}
              reference="#" // Remove title to avoid duplicate "Edit Profile"
              data-debug="edit-profile-card"
            >
              {/* Inner wrapper to keep content compact at 576px */}
              <div className="w-full max-w-[36rem] mx-auto space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-white">Edit Profile</h3>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Username
                      </label>
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
                      <label className="block text-white text-sm font-medium mb-2">
                        Full Name
                      </label>
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
                      <label className="block text-white text-sm font-medium mb-2">
                        Avatar URL
                      </label>
                      <input
                        type="text"
                        name="avatar_url"
                        value={formData.avatar_url}
                        onChange={handleChange}
                        placeholder="Enter avatar URL"
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Tell us about yourself"
                        rows={4}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
                      disabled={updateProfile.isLoading}
                    >
                      {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Profile Content */}
      <Card className="p-4 md:p-6" title="Profile Content" reference="#">
        {/* Tab Navigation */}
        <div className="border-b border-gray-700 mb-4 md:mb-6">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-blue-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 0 && (
            <div>
              {filteredGigs.length ? (
                <>
                  {/* Mobile Carousel */}
                  <div className="md:hidden px-2">
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {filteredGigs.map((gig: any, index: number) => {
                        const statusColor = getStatusColor(gig.category?.toLowerCase() || '');
                        const paymentToken = gig.payment_token || 'EGLD';
                        const tokenSymbol = paymentToken === 'EGLD' ? 'EGLD' : 'IDA';
                        const hasNoFees = paymentToken !== 'EGLD';

                        return (
                          <div
                            key={`${gig.id}-${index}`}
                            className="min-w-[260px] w-[260px] rounded-lg bg-white border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer relative flex-shrink-0"
                            onClick={() => navigate(`/gigs/${gig.id}`)}
                          >
                            {/* Delete Button */}
                            {isOwnProfile && (
                              <button
                                onClick={(e) => handleDeleteClick(e, gig.id)}
                                className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center z-10"
                              >
                                <X size={12} className="text-white" />
                              </button>
                            )}

                            <div className="flex justify-between items-center p-2 border-b border-gray-100">
                              <span className="text-xs text-gray-500 truncate">
                                {new Date(gig.created_at).toLocaleDateString()}
                              </span>
                              <div className="flex gap-1 flex-wrap">
                                <span
                                  className="px-1.5 py-0.5 rounded-full text-xs font-medium"
                                  style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                                >
                                  {gig.category.substring(0, 8)}...
                                </span>
                                {hasNoFees && (
                                  <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    No Fees
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="relative h-28">
                              <img
                                src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                                alt={gig.title}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="p-2 space-y-2">
                              <h3 className="text-sm font-bold text-gray-800 line-clamp-2 h-8">
                                {gig.title}
                              </h3>
                              <p className="text-xs text-gray-600 line-clamp-2 h-6">
                                {gig.description}
                              </p>
                              <p className="text-xs text-gray-800">
                                Duration: {gig.duration} days
                              </p>
                            </div>

                            <div className="flex justify-between items-center p-2 border-t border-gray-100">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full overflow-hidden relative">
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
                                            const fallback = parent.querySelector('.fallback-avatar') as HTMLElement;
                                            if (fallback) fallback.style.display = 'flex';
                                          }
                                        }}
                                      />
                                      <div 
                                        className="fallback-avatar w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-xs absolute inset-0"
                                        style={{ display: 'none' }}
                                      >
                                        {profile?.username?.charAt(0)?.toUpperCase() || "?"}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-xs">
                                      {profile?.username?.charAt(0)?.toUpperCase() || "?"}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-gray-800 truncate max-w-[60px]">
                                  {(profile?.username || "Unknown").substring(0, 6)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {isOwnProfile && (
                                  <button
                                    onClick={(e) => handleEditClick(e, gig.id)}
                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                                  >
                                    <Edit2 size={8} />
                                  </button>
                                )}
                                <span className="text-xs font-bold" style={{ color: statusColor }}>
                                  {gig.price} {tokenSymbol}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Desktop Grid */}
                  <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                    {filteredGigs.map((gig: any, index: number) => {
                      const statusColor = getStatusColor(gig.category?.toLowerCase() || '');
                      const paymentToken = gig.payment_token || 'EGLD';
                      const tokenSymbol = paymentToken === 'EGLD' ? 'EGLD' : 'IDA';
                      const hasNoFees = paymentToken !== 'EGLD';

                      return (
                        <div
                          key={`${gig.id}-${index}`}
                          className="max-w-80 w-full rounded-lg bg-white border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer relative"
                          onClick={() => navigate(`/gigs/${gig.id}`)}
                        >
                          {/* Delete Button */}
                          {isOwnProfile && (
                            <button
                              onClick={(e) => handleDeleteClick(e, gig.id)}
                              className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center z-10"
                            >
                              <X size={14} className="text-white" />
                            </button>
                          )}

                          <div className="flex justify-between items-center p-3 border-b border-gray-100">
                            <span className="text-xs text-gray-500">
                              {new Date(gig.created_at).toLocaleDateString()}
                            </span>
                            <div className="flex gap-2">
                              <span
                                className="px-2 py-1 rounded-full text-xs font-medium"
                                style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
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

                          <div className="relative h-32">
                            <img
                              src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                              alt={gig.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="p-3 space-y-3">
                            <h3 className="text-sm font-bold text-gray-800 line-clamp-2 h-10">
                              {gig.title}
                            </h3>
                            <p className="text-xs text-gray-600 line-clamp-2 h-8">
                              {gig.description}
                            </p>
                            <p className="text-xs text-gray-800">
                              Duration: {gig.duration} days
                            </p>
                          </div>

                          <div className="flex justify-between items-center p-3 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full overflow-hidden relative">
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
                                          const fallback = parent.querySelector('.fallback-avatar') as HTMLElement;
                                          if (fallback) fallback.style.display = 'flex';
                                        }
                                      }}
                                    />
                                    <div 
                                      className="fallback-avatar w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-xs absolute inset-0"
                                      style={{ display: 'none' }}
                                    >
                                      {profile?.username?.charAt(0)?.toUpperCase() || "?"}
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-xs">
                                    {profile?.username?.charAt(0)?.toUpperCase() || "?"}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-gray-800">
                                {profile?.username || "Unknown"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isOwnProfile && (
                                <button
                                  onClick={(e) => handleEditClick(e, gig.id)}
                                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  <Edit2 size={12} />
                                  Edit
                                </button>
                              )}
                              <span className="text-sm font-bold" style={{ color: statusColor }}>
                                {gig.price} {tokenSymbol}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-gray-400">No active gigs yet</p>
              )}
            </div>
          )}

          {isOwnProfile && activeTab === 1 && (
            <div>
              {profile?.orders?.length ? (
                <>
                  {/* Mobile Carousel */}
                  <div className="md:hidden px-2">
                    {(clientOrders.length === 0 && providerOrders.length === 0) ? (
                      <p className="text-gray-400">No orders yet</p>
                    ) : (
                      <div className="space-y-6">
                        {/* Client Orders */}
                        {clientOrders.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="text-md font-semibold text-gray-700">As Client ({clientOrders.length})</h4>
                            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                              {clientOrders.map((order) => {
                                const paymentToken = order.payment_token || 'EGLD';
                                const tokenSymbol = paymentToken === 'EGLD' ? 'EGLD' : 'IDA';
                                const tokenIcon = paymentToken === 'EGLD' ? <DollarSign size={14} /> : <Coins size={14} />;
                                const statusColor = getOrderStatusColor(order.status);
                                
                                return (
                                  <div
                                    key={order.id}
                                    className="min-w-[260px] w-[260px] gradient-card cursor-pointer p-3 flex-shrink-0"
                                    onClick={() => navigate(`/orders/${order.id}`)}
                                  >
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          statusColor === 'green' ? 'bg-green-100 text-green-800' :
                                          statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                                          statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                          statusColor === 'red' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          {tokenIcon}
                                          <span className="text-sm font-bold text-gray-800">
                                            {order.amount} {tokenSymbol}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">
                                        {order.gig?.title || 'Custom Project'}
                                      </h4>
                                      
                                      <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full overflow-hidden relative">
                                          <img
                                            src={order.gig?.provider?.avatar_url || "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg"}
                                            alt={order.gig?.provider?.username || "Provider"}
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
                                            className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-xs text-white absolute inset-0"
                                            style={{ display: 'none' }}
                                          >
                                            {order.gig?.provider?.username?.charAt(0)?.toUpperCase() || "P"}
                                          </div>
                                        </div>
                                        <span className="text-xs text-gray-800 truncate max-w-[60px]">
                                          Provider: {(order.gig?.provider?.username || "Unknown").substring(0, 6)}
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center gap-1">
                                        <Clock size={12} className="text-gray-400" />
                                        <span className="text-xs text-gray-500">
                                          {new Date(order.created_at).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Provider Orders */}
                        {providerOrders.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="text-md font-semibold text-gray-700">As Provider ({providerOrders.length})</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {providerOrders.slice(0, 4).map((order) => {
                                const paymentToken = order.payment_token || 'EGLD';
                                const tokenSymbol = paymentToken === 'EGLD' ? 'EGLD' : 'IDA';
                                const tokenIcon = paymentToken === 'EGLD' ? <DollarSign size={14} /> : <Coins size={14} />;
                                const statusColor = getOrderStatusColor(order.status);
                                
                                return (
                                  <div
                                    key={order.id}
                                    className="gradient-card cursor-pointer p-3"
                                    onClick={() => navigate(`/orders/${order.id}`)}
                                  >
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          statusColor === 'green' ? 'bg-green-100 text-green-800' :
                                          statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                                          statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                          statusColor === 'red' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          {tokenIcon}
                                          <span className="text-sm font-bold text-gray-800">
                                            {order.amount} {tokenSymbol}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">
                                        {order.gig?.title || 'Custom Project'}
                                      </h4>
                                      
                                      <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full overflow-hidden relative">
                                          <img
                                            src={order.client?.avatar_url || "https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg"}
                                            alt={order.client?.username || "Client"}
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
                                            className="fallback-avatar w-full h-full bg-gradient-to-r from-blue-400 to-green-400 rounded-full flex items-center justify-center text-xs text-white absolute inset-0"
                                            style={{ display: 'none' }}
                                          >
                                            {order.client?.username?.charAt(0)?.toUpperCase() || "C"}
                                          </div>
                                        </div>
                                        <span className="text-xs text-gray-800 truncate max-w-[60px]">
                                          Client: {(order.client?.username || "Unknown").substring(0, 6)}
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center gap-1">
                                        <Clock size={12} className="text-gray-400" />
                                        <span className="text-xs text-gray-500">
                                          {new Date(order.created_at).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Desktop Layout */}
                        <div className="hidden md:block">
                          {/* Client Orders Desktop */}
                          {clientOrders.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="text-md font-semibold text-gray-700">As Client ({clientOrders.length})</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {clientOrders.slice(0, 4).map((order) => {
                                  const paymentToken = order.payment_token || 'EGLD';
                                  const tokenSymbol = paymentToken === 'EGLD' ? 'EGLD' : 'IDA';
                                  const tokenIcon = paymentToken === 'EGLD' ? <DollarSign size={14} /> : <Coins size={14} />;
                                  const statusColor = getOrderStatusColor(order.status);
                                  
                                  return (
                                    <div
                                      key={order.id}
                                      className="gradient-card cursor-pointer p-3"
                                      onClick={() => navigate(`/orders/${order.id}`)}
                                    >
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            statusColor === 'green' ? 'bg-green-100 text-green-800' :
                                            statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                                            statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                            statusColor === 'red' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                          </span>
                                          <div className="flex items-center gap-1">
                                            {tokenIcon}
                                            <span className="text-sm font-bold text-gray-800">
                                              {order.amount} {tokenSymbol}
                                            </span>
                                          </div>
                                        </div>
                                        
                                        <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">
                                          {order.gig?.title || 'Custom Project'}
                                        </h4>
                                        
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full overflow-hidden relative">
                                            <img
                                              src={order.gig?.provider?.avatar_url || "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg"}
                                              alt={order.gig?.provider?.username || "Provider"}
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
                                              className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-xs text-white absolute inset-0"
                                              style={{ display: 'none' }}
                                            >
                                              {order.gig?.provider?.username?.charAt(0)?.toUpperCase() || "P"}
                                            </div>
                                          </div>
                                          <span className="text-xs text-gray-800 truncate max-w-[60px]">
                                            Provider: {(order.gig?.provider?.username || "Unknown").substring(0, 6)}
                                          </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-1">
                                          <Clock size={12} className="text-gray-400" />
                                          <span className="text-xs text-gray-500">
                                            {new Date(order.created_at).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Desktop Grid */}
                  <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                    {profile.orders.map((order: any, index: number) => {
                      const statusColor = getStatusColor(order.status);
                      const progressValue = getProgressValue(order.status);
                      const paymentToken = order.payment_token || 'EGLD';
                      const tokenSymbol = paymentToken === 'EGLD' ? 'EGLD' : 'IDA';
                      const hasNoFees = paymentToken !== 'EGLD';

                      return (
                        <div
                          key={`${order.id}-${index}`}
                          className="max-w-80 w-full rounded-lg bg-white border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer relative"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          {/* Payment Status Badge */}
                          {getPaymentStatusBadge(order)}

                          <div className="flex justify-between items-center p-3 border-b border-gray-100">
                            <span className="text-xs text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                            <div className="flex gap-2">
                              <span
                                className="px-2 py-1 rounded-full text-xs font-medium"
                                style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                              >
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                              {hasNoFees && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  No Fees
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="relative h-32">
                            <img
                              src={order.gig?.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                              alt={order.gig?.title || "Order Image"}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="p-3 space-y-3">
                            <h3 className="text-sm font-bold text-gray-800 line-clamp-2 h-10">
                              {order.gig?.title || "Custom Project"}
                            </h3>
                            <p className="text-xs text-gray-600 line-clamp-2 h-8">
                              Order #{order.id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-gray-800">
                              Progress: {progressValue}%
                            </p>
                          </div>

                          <div className="flex justify-between items-center p-3 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full overflow-hidden relative">
                                {order.client?.avatar_url ? (
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
                                      className="fallback-avatar w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-xs absolute inset-0"
                                      style={{ display: 'none' }}
                                    >
                                      {order.client?.username?.charAt(0)?.toUpperCase() || "?"}
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-xs">
                                    {order.client?.username?.charAt(0)?.toUpperCase() || "?"}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-gray-800">
                                {order.client?.username || "Unknown"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {order.payment_status === 'pending_release' && timeLeftMap[order.id] === 'Ready to claim' && (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClaimPayment(order.id);
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                                >
                                  <DollarSign size={10} />
                                  Claim
                                </Button>
                              )}
                              <span className="text-sm font-bold" style={{ color: statusColor }}>
                                {order.amount} {tokenSymbol}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-gray-400">No orders yet</p>
              )}
            </div>
          )}

          {activeTab === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {reviews.length > 0 ? (
                reviews.map((review: any, index: number) => (
                  <Card
                    key={`${review.id}-${index}`}
                    className="bg-gray-800 p-3 md:p-4 rounded-xl"
                    title="Review"
                    reference="#"
                  >
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-5 md:w-6 h-5 md:h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white">
                            {review.order?.client?.username?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="text-white font-medium text-xs md:text-sm">
                              {review.order?.client?.username || 'Anonymous'}
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
                                size={12}
                                className={i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}
                              />
                            ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs mb-1">
                          Order: {review.order?.gig?.title || "Custom Project"}
                        </p>
                        <p className="text-white text-xs md:text-sm">{review.comment}</p>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-gray-400">No reviews yet</p>
              )}
            </div>
          )}

          {isOwnProfile && activeTab === 3 && (
            <Card className="bg-gray-800 p-4 rounded-xl" title="Settings" reference="#">
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-bold text-white mb-2">
                  Notification Settings
                </h3>
                <EmailNotificationsToggle enabled={profile?.email_notifications_enabled ?? true} />
              </div>
            </Card>
          )}
        </div>
      </Card>

      {/* Add bottom padding for mobile navigation */}
      <div className="h-20 md:h-0"></div>

      {/* Delete Confirmation Dialog */}
      {isDeleteAlertOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {/* Wrapper div to constrain Card width to 640px */}
          <div className="w-[40rem] min-w-[32rem] mx-auto" data-debug="modal-wrapper">
            <Card
              className="p-4 sm:p-6 !w-[40rem] !min-w-[32rem] !flex-none !bg-gray-900 mx-auto max-h-[90vh] overflow-y-auto"
              style={{ width: '640px', minWidth: '512px', flex: '0 0 auto', backgroundColor: '#111827' }}
              reference="#" // Remove title to avoid duplicate "Delete Gig"
              data-debug="delete-gig-card"
            >
              {/* Inner wrapper to keep content compact at 576px */}
              <div className="w-full max-w-[36rem] mx-auto space-y-6">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Delete Gig</h3>
                <p className="text-gray-400 mb-4">
                  Are you sure you want to delete this gig? This action cannot be undone.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => setIsDeleteAlertOpen(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-sm sm:text-base"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteConfirm}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm sm:text-base"
                    disabled={deleteGig.isLoading}
                  >
                    {deleteGig.isLoading ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};