import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User, 
  Settings, 
  Bell, 
  Briefcase, 
  Star, 
  Calendar, 
  DollarSign, 
  Clock, 
  Edit, 
  Save, 
  X, 
  Check,
  Eye,
  MessageSquare,
  Award,
  TrendingUp,
  Package,
  Coins
} from 'lucide-react';
import { Button, Card, EmailNotificationsToggle } from 'components';
import { useGetIsLoggedIn, useGetAccount } from 'lib';
import { useProfile, useUpdateProfile } from 'hooks/useProfile';
import { useOrders } from 'hooks/useOrders';
import { useGigs } from 'hooks/useGigs';
import { useNotifications, useMarkAllNotificationsAsRead } from 'hooks/useNotifications';
import { useAuth } from 'context/AuthContext';

export const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();
  const { user } = useAuth();
  
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useProfile(id);
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: gigs, isLoading: gigsLoading } = useGigs();
  const { data: notifications } = useNotifications();
  const updateProfile = useUpdateProfile();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    bio: '',
    email_notifications_enabled: true
  });

  // Calculate earnings from completed orders
  const calculateEarnings = () => {
    if (!orders) return { egld: 0, ida: 0 };
    
    const completedOrders = orders.filter((order: any) => order.status === 'completed');
    
    const egldEarnings = completedOrders
      .filter((order: any) => order.payment_token === 'EGLD')
      .reduce((sum: number, order: any) => {
        // For EGLD, provider gets 90% (10% platform fee)
        return sum + (order.amount * 0.9);
      }, 0);
    
    const idaEarnings = completedOrders
      .filter((order: any) => order.payment_token === 'IDA-f9bc1d')
      .reduce((sum: number, order: any) => {
        // For IDA, provider gets 100% (no fees)
        return sum + order.amount;
      }, 0);
    
    return { egld: egldEarnings, ida: idaEarnings };
  };

  // Calculate review statistics
  const calculateReviewStats = () => {
    if (!orders) return { totalReviews: 0, averageRating: 0 };
    
    const reviewedOrders = orders.filter((order: any) => order.reviews && order.reviews.length > 0);
    const totalReviews = reviewedOrders.length;
    
    if (totalReviews === 0) return { totalReviews: 0, averageRating: 0 };
    
    const totalRating = reviewedOrders.reduce((sum: number, order: any) => {
      return sum + order.reviews[0].rating;
    }, 0);
    
    const averageRating = totalRating / totalReviews;
    
    return { totalReviews, averageRating };
  };

  const earnings = calculateEarnings();
  const reviewStats = calculateReviewStats();

  const isOwnProfile = !id || (user && profile && user.id === profile.id);

  // Initialize tab from URL params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'gigs') setActiveTab(1);
    else if (tab === 'orders') setActiveTab(2);
    else if (tab === 'notifications') setActiveTab(3);
    else if (tab === 'settings') setActiveTab(4);
    else setActiveTab(0);
  }, [searchParams]);

  // Initialize edit form when profile loads
  useEffect(() => {
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 overflow-x-hidden">
        <div className="w-full max-w-full px-3 py-4">
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        email_notifications_enabled: profile.email_notifications_enabled ?? true
      });
    }
  }, [profile]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // Reset form when canceling
      setEditForm({
        username: profile?.username || '',
        full_name: profile?.full_name || '',
        bio: profile?.bio || '',
        email_notifications_enabled: profile?.email_notifications_enabled ?? true
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync(editForm);
      setIsEditing(false);
      refetchProfile();
      alert('Profile updated successfully');
    } catch (error) {
      alert('Error updating profile');
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      alert('All notifications marked as read');
    } catch (error) {
      alert('Error marking notifications as read');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'pending_approval': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'escrowed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'released': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'disputed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGigStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const tabs = [
    { id: 0, label: 'Overview', icon: <User size={18} />, color: 'indigo' },
    { id: 1, label: 'My Gigs', icon: <Package size={18} />, color: 'purple' },
    { id: 2, label: 'Orders', icon: <Briefcase size={18} />, color: 'blue' },
    { id: 3, label: 'Notifications', icon: <Bell size={18} />, color: 'green' },
    { id: 4, label: 'Settings', icon: <Settings size={18} />, color: 'gray' }
  ];

  if (!isLoggedIn && !id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 py-8">
        <div className="container mx-auto max-w-4xl px-6">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-amber-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-amber-800">Authentication Required</h3>
                <p className="text-amber-700">Please log in to view your profile.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 py-8">
        <div className="container mx-auto max-w-4xl px-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex justify-center items-center space-y-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading profile...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 overflow-x-hidden">
        <div className="w-full max-w-full px-3 py-4">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">Profile Not Found</h3>
                <p className="text-red-700">The requested profile could not be found.</p>
              </div>
            </div>
          </div>
        </div>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 overflow-x-hidden">
      <div className="w-full max-w-full px-3 py-4 space-y-4">
  }

  const unreadNotifications = notifications?.filter(n => !n.read) || [];
  const clientOrders = orders?.filter(order => order.client_id === profile.id) || [];
  const providerOrders = orders?.filter(order => 
    order.gig?.provider?.id === profile.id || 
    order.provider_address === profile.wallet_address
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 py-8">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-32"></div>
            <div className="relative px-8 pb-8">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username}
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
                    ) : null}
                    <div 
                      className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-3xl font-bold text-white"
                      style={{ display: profile.avatar_url ? 'none' : 'flex' }}
                    >
                      {profile.username?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                          <input
                            type="text"
                            value={editForm.username}
                            onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <input
                            type="text"
                            value={editForm.full_name}
                            onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea
                          value={editForm.bio}
                          onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold text-gray-900">
                        {profile.full_name || profile.username}
                      </h1>
                      {profile.full_name && (
                        <p className="text-lg text-gray-600">@{profile.username}</p>
                      )}
                      <p className="text-gray-700 max-w-2xl">
                        {profile.bio || "No bio available"}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                        </div>
                        {profile.wallet_address && (
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span>Wallet Connected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {isOwnProfile && (
                  <div className="flex gap-3">
                    {isEditing ? (
                      <>
                        <Button
                          onClick={handleSaveProfile}
                          disabled={updateProfile.isLoading}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                          <Save size={16} />
                          {updateProfile.isLoading ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          onClick={handleEditToggle}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        <div className="gradient-card p-4 w-full max-w-full overflow-hidden">
                          <X size={16} />
            <div className="flex flex-col items-center gap-4 text-center">
                        </Button>
              <div className="relative flex-shrink-0">
                    ) : (
                      <Button
                        onClick={handleEditToggle}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
                        <Edit size={16} />
                        Edit Profile
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold">
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Gigs</p>
                  <p className="text-2xl font-bold text-indigo-600">{gigs?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-600">{orders?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {reviewStats.averageRating > 0 ? reviewStats.averageRating.toFixed(1) : '0.0'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                ({reviewStats.totalReviews} reviews)
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earned</p>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-blue-600">{earnings.egld.toFixed(2)} EGLD</p>
                    <p className="text-lg font-bold text-purple-600">{earnings.ida.toFixed(2)} IDA</p>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? `border-${tab.color}-500 text-${tab.color}-600 bg-white`
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.id === 3 && unreadNotifications.length > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                        {unreadNotifications.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 0 && (
                <div className="space-y-6">
                  {/* Earnings breakdown */}
                  {(earnings.egld > 0 || earnings.ida > 0) && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Coins className="w-5 h-5 text-indigo-600" />
                        Earnings Breakdown
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DollarSign className="text-blue-600" size={16} />
                              <span className="font-medium text-gray-800">EGLD Earnings</span>
                            </div>
                            <span className="text-xl font-bold text-blue-600">
                              {earnings.egld.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            After 10% platform fee
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Coins className="text-purple-600" size={16} />
                              <span className="font-medium text-gray-800">IDA Earnings</span>
                            </div>
                            <span className="text-xl font-bold text-purple-600">
                              {earnings.ida.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            No platform fees
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reviews summary */}
                  {reviewStats.totalReviews > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-600" />
                        Reviews Summary
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={20}
                                className={star <= reviewStats.averageRating ? "text-yellow-400 fill-current" : "text-gray-300"}
                              />
                            ))}
                          </div>
                          <span className="text-xl font-bold text-gray-800">
                            {reviewStats.averageRating.toFixed(1)} / 5.0
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-800">
                            {reviewStats.totalReviews}
                          </div>
                          <div className="text-sm text-gray-600">
                            Total Reviews
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Orders */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                        Recent Orders
                      </h3>
                      {orders?.slice(0, 3).map((order) => (
                        <div
                          key={order.id}
                          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-semibold text-gray-900 line-clamp-1">
                              {order.gig?.title || 'Custom Project'}
                            </h4>
                            <div className="flex gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                {order.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          
                          {/* Both Client and Provider */}
                          <div className="space-y-2 mb-3">
                            {/* Client */}
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-r from-blue-400 to-green-400 flex items-center justify-center">
                                {order.client?.avatar_url ? (
                                  <img
                                    src={order.client.avatar_url}
                                    alt={order.client.username || "Client"}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        const fallback = parent.querySelector('.fallback-client-avatar') as HTMLElement;
                                        if (fallback) fallback.style.display = 'flex';
                                      }
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className="fallback-client-avatar w-full h-full bg-gradient-to-r from-blue-400 to-green-400 flex items-center justify-center text-xs text-white"
                                  style={{ display: profile.avatar_url ? 'none' : 'flex' }}
                                >
                                  {order.client?.username?.charAt(0)?.toUpperCase() || "C"}
                                </div>
                              </div>
                              <span className="text-sm text-gray-700">
                                Client: {order.client?.username || "Unknown"}
                              </span>
                            </div>
                            
                            {/* Provider */}
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center">
                                {order.gig?.provider?.avatar_url ? (
                                  <img
                                    src={order.gig.provider.avatar_url}
                                    alt={order.gig.provider.username || "Provider"}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        const fallback = parent.querySelector('.fallback-provider-avatar') as HTMLElement;
                                        if (fallback) fallback.style.display = 'flex';
                                      }
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className="fallback-provider-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-xs text-white"
                                  style={{ display: order.gig?.provider?.avatar_url ? 'none' : 'flex' }}
                                >
                                  {order.gig?.provider?.username?.charAt(0)?.toUpperCase() || "P"}
                                </div>
                              </div>
                              <span className="text-sm text-gray-700">
                                Provider: {order.gig?.provider?.username || "Unknown"}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {order.payment_token === 'EGLD' ? (
                                <DollarSign className="w-4 h-4 text-green-600" />
                              ) : (
                                <Coins className="w-4 h-4 text-purple-600" />
                              )}
                              <span className="font-semibold text-gray-900">
                                {order.amount} {order.payment_token === 'EGLD' ? 'EGLD' : 'IDA'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8 text-gray-500">
                          <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No orders yet</p>
                        </div>
                      )}
                    </div>

                    {/* Recent Gigs */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Package className="w-5 h-5 text-purple-600" />
                        Recent Gigs
                      </h3>
                      {gigs?.slice(0, 3).map((gig) => (
                        <div
                          key={gig.id}
                          className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                          onClick={() => navigate(`/gigs/${gig.id}`)}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-semibold text-gray-900 line-clamp-1">
                              {gig.title}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getGigStatusColor(gig.status)}`}>
                              {gig.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {gig.description}
                          </p>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {gig.payment_token === 'EGLD' ? (
                                <DollarSign className="w-4 h-4 text-green-600" />
                              ) : (
                                <Coins className="w-4 h-4 text-purple-600" />
                              )}
                              <span className="font-semibold text-gray-900">
                                {gig.price} {gig.payment_token === 'EGLD' ? 'EGLD' : 'IDA'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {gig.duration} days
                            </span>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8 text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No gigs yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* My Gigs Tab */}
              {activeTab === 1 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">My Gigs</h3>
                    {isOwnProfile && (
                      <Button
                        onClick={() => navigate('/create-gig')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <Package size={16} />
                        Create New Gig
                      </Button>
                    )}
                  </div>

                  {gigsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                  ) : gigs?.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No gigs yet</h4>
                      <p className="text-gray-600 mb-4">Start offering your services to the community</p>
                      {isOwnProfile && (
                        <Button
                          onClick={() => navigate('/create-gig')}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg"
                        >
                          Create Your First Gig
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {gigs?.map((gig) => (
                        <div
                          key={gig.id}
                          className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group cursor-pointer"
                          onClick={() => navigate(`/gigs/${gig.id}`)}
                        >
                          <div className="relative h-48">
                            <img
                              src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                              alt={gig.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          <div className="gradient-card p-3 text-center min-w-0">
                            <div className="absolute top-3 right-3">
              <Briefcase size={16} className="text-white" />
                                {gig.status}
            <p className="text-lg font-bold text-gray-800 mb-1">{gigs?.length || 0}</p>
            <p className="text-gray-600 text-xs">Gigs</p>
                          </div>
                          
                          <div className="p-4 space-y-3">
          <div className="gradient-card p-3 text-center min-w-0">
                              {gig.title}
              <ShoppingCart size={16} className="text-white" />
                            <p className="text-sm text-gray-600 line-clamp-2">
            <p className="text-lg font-bold text-gray-800 mb-1">{orders?.length || 0}</p>
            <p className="text-gray-600 text-xs">Orders</p>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1">
                                {gig.payment_token === 'EGLD' ? (
          <div className="gradient-card p-3 text-center min-w-0">
                                ) : (
              <Star size={16} className="text-white" />
                                )}
            <div className="flex items-center justify-center gap-1 mb-1 flex-wrap">
              <p className="text-lg font-bold text-gray-800">{averageRating.toFixed(1)}</p>
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
                                {gig.duration} days
                    size={12}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
            <p className="text-gray-600 text-xs">({userReviews.length})</p>
              )}

              {/* Orders Tab */}
          <div className="gradient-card p-3 text-center min-w-0">
                <div className="space-y-6">
              <DollarSign size={16} className="text-white" />

            <div className="space-y-1 min-w-0">
              <div className="flex items-center justify-center gap-1 flex-wrap">
                <DollarSign size={12} className="text-gray-600" />
                <p className="text-sm font-bold text-gray-800 truncate">{egldEarnings.toFixed(1)}</p>
                  ) : orders?.length === 0 ? (
              <div className="flex items-center justify-center gap-1 flex-wrap">
                <Coins size={12} className="text-gray-600" />
                <p className="text-sm font-bold text-gray-800 truncate">{idaEarnings.toFixed(1)}</p>
                      <p className="text-gray-600">Your orders will appear here</p>
                    </div>
            <p className="text-gray-600 text-xs">Earned</p>
                    <div className="space-y-6">
                      {/* As Client */}
                      {clientOrders.length > 0 && (
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <div className="grid grid-cols-1 gap-3 w-full max-w-full">
                            As Client ({clientOrders.length})
            <div className="gradient-card p-4 w-full max-w-full overflow-hidden">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold">EGLD Earnings</h3>
                  <DollarSign size={20} />
                                className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                <p className="text-xl font-bold mb-1 break-words">{egldEarnings.toFixed(2)} EGLD</p>
                <p className="text-blue-100 text-xs">After 10% fee</p>
                                <div className="flex justify-between items-start mb-3">
                                  <h4 className="font-semibold text-gray-900 line-clamp-1">
                                    {order.gig?.title || 'Custom Project'}
                                  </h4>
            <div className="gradient-card p-4 w-full max-w-full overflow-hidden">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold">IDA Earnings</h3>
                  <Coins size={20} />
                                </div>
                <p className="text-xl font-bold mb-1 break-words">{idaEarnings.toFixed(2)} IDA</p>
                <p className="text-purple-100 text-xs">No fees!</p>
                                <div className="space-y-2 mb-3">
                                  {/* Client */}
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-r from-blue-400 to-green-400 flex items-center justify-center">
                                      {order.client?.avatar_url ? (
                                        <img
        <div className="gradient-card overflow-hidden w-full max-w-full">
                                          alt={order.client.username || "Client"}
          <div className="border-b border-gray-200 bg-gray-50 overflow-x-auto">
            <div className="flex min-w-max">
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent) {
                  className={`flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                                              if (fallback) fallback.style.display = 'flex';
                                            }
                                          }}
                                        />
                                      ) : null}
                                      <div 
                  <span>{tab.label}</span>
                                        style={{ display: order.client?.avatar_url ? 'none' : 'flex' }}
                                      >
                                        {order.client?.username?.charAt(0)?.toUpperCase() || "C"}
                                      </div>
                                    </div>
                                    <span className="text-xs text-gray-600">
                                      Client: {order.client?.username || "Unknown"}
                                    </span>
                                  </div>
                                  
                                  {/* Provider */}
          <div className="p-4 w-full max-w-full overflow-hidden">
                                    <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center">
              <div className="space-y-4 w-full max-w-full">
                                        <img
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Profile Overview</h3>
                                          alt={order.gig.provider.username || "Provider"}
                    <p className="text-gray-700 text-sm leading-relaxed break-words">{profile.bio}</p>
                                          onError={(e) => {
                    <p className="text-gray-500 italic text-sm">No bio available</p>
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent) {
                                              const fallback = parent.querySelector('.fallback-provider-avatar') as HTMLElement;
                                              if (fallback) fallback.style.display = 'flex';
                  <h4 className="text-base font-bold text-gray-800 mb-3">Recent Activity</h4>
                                          }}
                    <div key={order.id} className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200 w-full max-w-full overflow-hidden">
                      <div className="space-y-2">
                        <div className="w-full">
                          <p className="font-medium text-gray-800 text-sm break-words">
                                        style={{ display: order.gig?.provider?.avatar_url ? 'none' : 'flex' }}
                                      >
                          <p className="text-gray-600 text-xs break-words">
                                      </div>
                                    </div>
                                    <span className="text-xs text-gray-600">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                                    </span>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    {order.payment_token === 'EGLD' ? (
                                      <DollarSign className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <Coins className="w-4 h-4 text-purple-600" />
                                    )}
                                    <span className="font-semibold text-gray-900">
                                      {order.amount} {order.payment_token === 'EGLD' ? 'EGLD' : 'IDA'}
                                    </span>
                                  </div>
              <div className="space-y-4 w-full max-w-full">
                <h3 className="text-lg font-bold text-gray-800">My Gigs</h3>
                                  </span>
                                </div>
                    <p className="text-gray-500 mb-4 text-sm">No gigs created yet</p>
                            ))}
                          </div>
                        </div>
                      )}
                        size="sm"
                        fullWidth

                      {/* As Provider */}
                      {providerOrders.length > 0 && (
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-purple-600" />
                  <div className="space-y-3 w-full max-w-full">
                          </h4>
                      <div key={gig.id} className="gradient-card cursor-pointer w-full max-w-full overflow-hidden" onClick={() => navigate(`/gigs/${gig.id}`)}>
                            {providerOrders.map((order) => (
                              <div
                                key={order.id}
                                className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                                onClick={() => navigate(`/orders/${order.id}`)}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <h4 className="font-semibold text-gray-900 line-clamp-1">
                          <h4 className="text-base font-bold text-gray-800 break-words">{gig.title}</h4>
                          <p className="text-gray-600 line-clamp-2 text-sm break-words">{gig.description}</p>
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <span className="text-indigo-600 font-bold text-sm break-words">
                                      {order.status.replace('_', ' ')}
                                    </span>
                            <span className="text-gray-500 text-xs">{gig.duration} days</span>
                                </div>
                                
                                {/* Both Client and Provider */}
                                <div className="space-y-2 mb-3">
                                  {/* Client */}
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-r from-blue-400 to-green-400 flex items-center justify-center">
                                      {order.client?.avatar_url ? (
                                        <img
                                          src={order.client.avatar_url}
              <div className="space-y-4 w-full max-w-full">
                <h3 className="text-lg font-bold text-gray-800">My Orders</h3>
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                    <p className="text-gray-500 text-sm">No orders yet</p>
                                            const parent = target.parentElement;
                                            if (parent) {
                  <div className="space-y-3 w-full max-w-full">
                                              if (fallback) fallback.style.display = 'flex';
                      <div key={order.id} className="gradient-card p-4 cursor-pointer w-full max-w-full overflow-hidden" onClick={() => navigate(`/orders/${order.id}`)}>
                        <div className="space-y-3">
                                        />
                          <div className="space-y-2">
                            <h4 className="text-base font-bold text-gray-800 break-words">
                                        className="fallback-client-avatar w-full h-full bg-gradient-to-r from-blue-400 to-green-400 flex items-center justify-center text-xs text-white"
                                        style={{ display: order.client?.avatar_url ? 'none' : 'flex' }}
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-indigo-600 font-bold text-sm break-words">
                                      </div>
                                    </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      Client: {order.client?.username || "Unknown"}
                                    </span>
                                  </div>
                                  
                                  {/* Provider */}
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center">
                                      {order.gig?.provider?.avatar_url ? (
                                        <img
                                          src={order.gig.provider.avatar_url}
                                          alt={order.gig.provider.username || "Provider"}
                          <div className="space-y-2">
                                          onError={(e) => {
                            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 w-full max-w-full overflow-hidden">
                              <div className="flex items-center gap-2">
                                            const parent = target.parentElement;
                                            if (parent) {
                                              const fallback = parent.querySelector('.fallback-provider-avatar') as HTMLElement;
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-800 text-sm">Client</p>
                                  <p className="text-gray-600 text-xs truncate">{order.client?.username || 'Unknown'}</p>
                                        />
                                      ) : null}
                                      <div 
                                        className="fallback-provider-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-xs text-white"
                                        style={{ display: order.gig?.provider?.avatar_url ? 'none' : 'flex' }}
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 w-full max-w-full overflow-hidden">
                              <div className="flex items-center gap-2">
                                      </div>
                                    </div>
                                    <span className="text-xs text-gray-600">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-800 text-sm">Provider</p>
                                  <p className="text-gray-600 text-xs truncate">{order.gig?.provider?.username || 'Unknown'}</p>
                                </div>

                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    {order.payment_token === 'EGLD' ? (
                          <p className="text-gray-500 text-xs">
                                    ) : (
                                      <Coins className="w-4 h-4 text-purple-600" />
                                    )}
                                    <span className="font-semibold text-gray-900">
                                      {order.amount} {order.payment_token === 'EGLD' ? 'EGLD' : 'IDA'}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {new Date(order.created_at).toLocaleDateString()}
                                  </span>
                                </div>
              <div className="space-y-4 w-full max-w-full">
                <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
                          </div>
                        </div>
                    <p className="text-gray-500 text-sm">No notifications</p>
                    </div>
                  )}
                  <div className="space-y-3 w-full max-w-full">
              )}
                      <div key={notification.id} className={`bg-gray-50 rounded-lg p-3 border w-full max-w-full overflow-hidden ${!notification.read ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200'}`}>
                        <div className="space-y-2">
                          <div className="w-full">
                            <p className={`font-medium text-sm break-words ${!notification.read ? 'text-indigo-800' : 'text-gray-800'}`}>
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">Notifications</h3>
                            <p className="text-gray-600 text-xs mt-1 break-words">{notification.content}</p>
                            <p className="text-gray-500 text-xs mt-1">
                        onClick={handleMarkAllNotificationsAsRead}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <Check size={16} />
                            <span className="bg-indigo-500 text-white text-xs px-2 py-1 rounded-full inline-block">New</span>
                      </Button>
                    )}
                  </div>

                  {notifications?.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No notifications</h4>
                      <p className="text-gray-600">You're all caught up!</p>
                    </div>
              <div className="space-y-4 w-full max-w-full">
                <h3 className="text-lg font-bold text-gray-800">Settings</h3>
                      {notifications?.map((notification) => (
                        <div
                  <form onSubmit={handleEditSubmit} className="space-y-4 w-full max-w-full">
                          className={`rounded-lg p-4 border transition-all duration-200 cursor-pointer hover:shadow-md ${
                      <label className="block text-gray-700 text-sm font-medium mb-2">Username</label>
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 border-l-4 border-l-blue-500' 
                              : 'bg-gray-50 border-gray-200'
                          }`}
                          onClick={() => {
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                              navigate(`/orders/${notification.data.order_id}`);
                            }
                          }}
                        >
                      <label className="block text-gray-700 text-sm font-medium mb-2">Full Name</label>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                  {notification.title}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                {!notification.read && (
                                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                                    New
                                  </span>
                      <label className="block text-gray-700 text-sm font-medium mb-2">Bio</label>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {notification.content}
                              </p>
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                                {new Date(notification.created_at).toLocaleString()}
                              </p>
                            </div>
                    <div className="flex gap-2 w-full">
                        </div>
                      ))}
                    </div>
                  )}
                        className="flex-1 text-sm"
                        size="sm"
              )}

              {/* Settings Tab */}
              {activeTab === 4 && isOwnProfile && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">Settings</h3>
                        className="flex-1 text-sm"
                        size="sm"
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-6 border border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-gray-600" />
                      Email Notifications
                    </h4>
                    <EmailNotificationsToggle enabled={profile.email_notifications_enabled || false} />
                  </div>
                  <div className="space-y-4 w-full max-w-full">
                    <div className="bg-gray-50 rounded-lg p-4 w-full max-w-full overflow-hidden">
                      <h4 className="text-base font-bold text-gray-800 mb-3">Profile Information</h4>
                      <div className="space-y-2">
                      Account Information
                          <p className="text-gray-600 text-xs">Username</p>
                          <p className="text-gray-800 font-medium text-sm break-words">{profile.username}</p>
                      <div className="flex justify-between">
                  <p className="text-base text-white text-opacity-90 mb-2 break-words">{profile.full_name}</p>
                          <p className="text-gray-600 text-xs">Full Name</p>
                          <p className="text-gray-800 font-medium text-sm break-words">{profile.full_name || 'Not set'}</p>
                  <p className="text-sm text-white text-opacity-80 mb-3 break-words">{profile.bio}</p>
                        <span className="text-gray-600">Member since:</span>
                          <p className="text-gray-600 text-xs">Bio</p>
                          <p className="text-gray-800 font-medium text-sm break-words">{profile.bio || 'No bio set'}</p>
                        </span>
                      </div>
                      {profile.wallet_address && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Wallet:</span>
                <div className="w-full">
                  <Button
                      fullWidth
                      size="sm"
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-indigo-600 w-full"
                    size="sm"
                  >
                    <Edit size={14} />
                    Edit
                  </Button>
                </div>
              )}
            </div>
          </div>
        <div className="h-20"></div>
      </div>
    </div>
        <div className="grid grid-cols-2 gap-3 w-full max-w-full">
};