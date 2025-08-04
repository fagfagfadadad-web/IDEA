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
  Coins,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button, Card, EmailNotificationsToggle } from 'components';
import { useGetIsLoggedIn, useGetAccount } from 'lib';
import { useProfile, useUpdateProfile } from 'hooks/useProfile';
import { useOrders } from 'hooks/useOrders';
import { useGigs } from 'hooks/useGigs';
import { useNotifications, useMarkAllNotificationsAsRead } from 'hooks/useNotifications';
import { useAuth } from 'context/AuthContext';
import { useWindowSize } from 'hooks/useWindowSize';

export const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();
  const { user } = useAuth();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useProfile(id);
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: gigs, isLoading: gigsLoading } = useGigs();
  const { data: notifications } = useNotifications();
  const updateProfile = useUpdateProfile();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    stats: true,
    gigs: false,
    orders: false,
    notifications: false,
    settings: false
  });
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
    if (profile) {
      setEditForm({
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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

  // Mobile tabs
  const mobileTabs = [
    { id: 0, label: 'Gigs', icon: <Briefcase size={16} /> },
    { id: 1, label: 'Orders', icon: <ShoppingCart size={16} /> },
    { id: 2, label: 'Reviews', icon: <Star size={16} /> },
    { id: 3, label: 'Notifications', icon: <Bell size={16} /> },
    { id: 4, label: 'Settings', icon: <Settings size={16} /> },
  ];

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 py-8">
        <div className="container mx-auto max-w-4xl px-6">
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
      </div>
    );
  }

  const unreadNotifications = notifications?.filter(n => !n.read) || [];
  const clientOrders = orders?.filter(order => order.client_id === profile.id) || [];
  const providerOrders = orders?.filter(order => 
    order.gig?.provider?.id === profile.id || 
    order.provider_address === profile.wallet_address
  ) || [];

  // Mobile Component
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 pb-20">
        <div className="px-4 py-6 space-y-4">
          {/* Mobile Header */}
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-6 text-white">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 rounded-full overflow-hidden relative bg-white/20">
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
                      className="fallback-avatar w-full h-full bg-white/20 flex items-center justify-center text-2xl text-white absolute inset-0"
                      style={{ display: 'none' }}
                    >
                      {profile?.username?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center text-2xl text-white">
                    {profile?.username?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold">{profile?.username}</h1>
                {profile?.full_name && (
                  <p className="text-white/80">{profile.full_name}</p>
                )}
                {profile?.bio && (
                  <p className="text-white/70 text-sm mt-2">{profile.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Stats Section */}
          <div className="bg-white rounded-xl border border-gray-200">
            <button
              onClick={() => toggleSection('stats')}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <h2 className="text-lg font-bold text-gray-800">Statistics</h2>
              {expandedSections.stats ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.stats && (
              <div className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Package size={16} className="text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium">Gigs</span>
                    </div>
                    <p className="text-lg font-bold text-blue-800">{gigs?.length || 0}</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase size={16} className="text-green-600" />
                      <span className="text-xs text-green-600 font-medium">Orders</span>
                    </div>
                    <p className="text-lg font-bold text-green-800">{orders?.length || 0}</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={16} className="text-yellow-600" />
                    <span className="text-sm text-yellow-600 font-medium">Rating</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          fill={star <= reviewStats.averageRating ? '#FFD700' : 'transparent'}
                          color={star <= reviewStats.averageRating ? '#FFD700' : '#D1D5DB'}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-yellow-800">
                      {reviewStats.averageRating.toFixed(1)} ({reviewStats.totalReviews})
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-blue-600" />
                        <span className="text-sm text-blue-600 font-medium">EGLD Earned</span>
                      </div>
                      <span className="text-lg font-bold text-blue-800">{earnings.egld.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">After 10% platform fee</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins size={16} className="text-purple-600" />
                        <span className="text-sm text-purple-600 font-medium">IDA Earned</span>
                      </div>
                      <span className="text-lg font-bold text-purple-800">{earnings.ida.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-purple-600 mt-1">No fees - 100% yours!</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Gigs Section */}
          <div className="bg-white rounded-xl border border-gray-200">
            <button
              onClick={() => toggleSection('gigs')}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <h2 className="text-lg font-bold text-gray-800">My Gigs ({gigs?.length || 0})</h2>
              {expandedSections.gigs ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.gigs && (
              <div className="px-4 pb-4 space-y-3">
                {gigs?.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No gigs created yet</p>
                ) : (
                  gigs?.map((gig) => (
                    <div key={gig.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <h3 className="font-medium text-gray-800 text-sm">{gig.title}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-600">{gig.category}</span>
                        <div className="flex items-center gap-1">
                          {gig.payment_token === 'EGLD' ? <DollarSign size={12} /> : <Coins size={12} />}
                          <span className="text-sm font-bold text-blue-600">
                            {gig.price} {gig.payment_token === 'EGLD' ? 'EGLD' : 'IDA'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Mobile Orders Section */}
          <div className="bg-white rounded-xl border border-gray-200">
            <button
              onClick={() => toggleSection('orders')}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <h2 className="text-lg font-bold text-gray-800">My Orders ({orders?.length || 0})</h2>
              {expandedSections.orders ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.orders && (
              <div className="px-4 pb-4 space-y-3">
                {orders?.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No orders yet</p>
                ) : (
                  orders?.slice(0, 5).map((order) => (
                    <div key={order.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-800 text-sm line-clamp-1">
                          {order.gig?.title || 'Custom Project'}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'delivered' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          {order.payment_token === 'EGLD' ? <DollarSign size={12} /> : <Coins size={12} />}
                          <span className="text-sm font-bold text-blue-600">
                            {order.amount} {order.payment_token === 'EGLD' ? 'EGLD' : 'IDA'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Mobile Notifications Section */}
          <div className="bg-white rounded-xl border border-gray-200">
            <button
              onClick={() => toggleSection('notifications')}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-800">Notifications</h2>
                {unreadNotifications.length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-[20px] flex items-center justify-center">
                    {unreadNotifications.length}
                  </span>
                )}
              </div>
              {expandedSections.notifications ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.notifications && (
              <div className="px-4 pb-4 space-y-3">
                {unreadNotifications.length > 0 && (
                  <Button
                    onClick={handleMarkAllNotificationsAsRead}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm"
                    disabled={markAllAsRead.isLoading}
                  >
                    {markAllAsRead.isLoading ? 'Marking...' : `Mark all as read (${unreadNotifications.length})`}
                  </Button>
                )}
                {notifications?.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${
                      !notification.read 
                        ? 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-sm font-medium ${
                        !notification.read ? 'text-blue-800' : 'text-gray-800'
                      }`}>
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{notification.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Settings Section */}
          <div className="bg-white rounded-xl border border-gray-200">
            <button
              onClick={() => toggleSection('settings')}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <h2 className="text-lg font-bold text-gray-800">Settings</h2>
              {expandedSections.settings ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.settings && (
              <div className="px-4 pb-4 space-y-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">Username</label>
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">Full Name</label>
                      <input
                        type="text"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">Bio</label>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm"
                      >
                        <X size={14} />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm"
                        disabled={updateProfile.isLoading}
                      >
                        <Save size={14} />
                        {updateProfile.isLoading ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Username</p>
                      <p className="font-medium text-gray-800">{profile?.username}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Full Name</p>
                      <p className="font-medium text-gray-800">{profile?.full_name || 'Not set'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Bio</p>
                      <p className="font-medium text-gray-800">{profile?.bio || 'No bio yet'}</p>
                    </div>
                    <Button
                      onClick={() => {
                        setEditForm({
                          username: profile?.username || '',
                          full_name: profile?.full_name || '',
                          bio: profile?.bio || '',
                          email_notifications_enabled: profile?.email_notifications_enabled ?? true
                        });
                        setIsEditing(true);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm"
                    >
                      <Edit size={14} />
                      Edit Profile
                    </Button>
                    
                    <div className="pt-2">
                      <EmailNotificationsToggle enabled={profile?.email_notifications_enabled || false} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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
                        >
                          <X size={16} />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleEditToggle}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
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
                            />
                            <div className="absolute top-3 right-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getGigStatusColor(gig.status)}`}>
                                {gig.status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="p-4 space-y-3">
                            <h4 className="font-semibold text-gray-900 line-clamp-2">
                              {gig.title}
                            </h4>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {gig.description}
                            </p>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1">
                                {gig.payment_token === 'EGLD' ? (
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Coins className="w-4 h-4 text-purple-600" />
                                )}
                                <span className="font-bold text-gray-900">
                                  {gig.price} {gig.payment_token === 'EGLD' ? 'EGLD' : 'IDA'}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
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

              {/* Orders Tab */}
              {activeTab === 2 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">Orders</h3>

                  {ordersLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : orders?.length === 0 ? (
                    <div className="text-center py-12">
                      <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h4>
                      <p className="text-gray-600">Your orders will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* As Client */}
                      {clientOrders.length > 0 && (
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            As Client ({clientOrders.length})
                          </h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {clientOrders.map((order) => (
                              <div
                                key={order.id}
                                className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer"
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
                                    <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-r from-blue-400 to-green-400 flex items-center justify-center">
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
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center">
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
                                    <span className="text-xs text-gray-600">
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
          {/* Mobile Header */}
          <div className="gradient-card p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-xl text-white">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username || "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile?.username?.charAt(0)?.toUpperCase() || "U"
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-gray-800">{profile?.username || 'Loading...'}</h1>
                <p className="text-sm text-gray-600">{profile?.full_name || 'No name set'}</p>
                <p className="text-xs text-gray-500">{profile?.bio || 'No bio available'}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setActiveTab(4)}
                variant="primary"
                size="sm"
                fullWidth
              >
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Mobile Statistics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="gradient-card p-3 text-center">
              <Briefcase size={20} className="text-blue-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-blue-600">{profile?.gigs?.length || 0}</p>
              <p className="text-xs text-blue-600">Gigs Created</p>
            </div>
            <div className="gradient-card p-3 text-center">
              <ShoppingCart size={20} className="text-green-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-green-600">{profile?.orders?.length || 0}</p>
              <p className="text-xs text-green-600">Orders</p>
            </div>
            <div className="gradient-card p-3 text-center">
              <Star size={20} className="text-yellow-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-yellow-600">{averageRating.toFixed(1)}</p>
              <p className="text-xs text-yellow-600">Avg Rating</p>
            </div>
            <div className="gradient-card p-3 text-center">
              <MessageSquare size={20} className="text-purple-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-purple-600">{totalReviews}</p>
              <p className="text-xs text-purple-600">Reviews</p>
            </div>
          </div>

          {/* Mobile Earnings */}
          <div className="gradient-card p-4">
            <h3 className="text-base font-bold text-gray-800 mb-3 text-center">Total Earned</h3>
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign size={18} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">EGLD</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">
                    {totalEgldEarnings.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">After 10% platform fee</p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins size={18} className="text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">IDA</span>
                  </div>
                  <span className="text-xl font-bold text-purple-600">
                    {totalIdaEarnings.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-purple-600 mt-1">No fees - 100% yours!</p>
              </div>
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="gradient-card overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="flex overflow-x-auto scrollbar-hide">
                {mobileTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 min-w-[120px] ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                        : 'border-transparent text-gray-500 hover:text-indigo-600'
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              {activeTab === 0 && (
                <div className="space-y-3">
                  {profile?.gigs?.length === 0 ? (
                    <div className="text-center py-6">
                      <Briefcase size={32} className="text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-3">No gigs created yet</p>
                      <Button
                        onClick={() => navigate('/create-gig')}
                        variant="primary"
                        size="sm"
                        fullWidth
                      >
                        Create Your First Gig
                      </Button>
                    </div>
                  ) : (
                    profile?.gigs?.map((gig: any) => (
                      <div 
                        key={gig.id} 
                        className="bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => navigate(`/gigs/${gig.id}`)}
                      >
                        <h4 className="text-sm font-bold text-gray-800 mb-2">{gig.title}</h4>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-600">{gig.category}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            gig.status === 'active' ? 'bg-green-100 text-green-800' :
                            gig.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {gig.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">{gig.duration} days</span>
                          <span className="text-sm font-bold text-blue-600">
                            {gig.price} {gig.payment_token === 'EGLD' ? 'EGLD' : 'IDA'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 1 && (
                <div className="space-y-3">
                  {profile?.orders?.length === 0 ? (
                    <div className="text-center py-6">
                      <ShoppingCart size={32} className="text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No orders yet</p>
                    </div>
                  ) : (
                    profile?.orders?.map((order: any) => (
                      <div 
                        key={order.id} 
                        className="bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <h4 className="text-sm font-bold text-gray-800 mb-2">
                          {order.gig?.title || 'Custom Project'}
                        </h4>
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'delivered' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            {order.amount} {order.payment_token === 'EGLD' ? 'EGLD' : 'IDA'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                            <span className="text-xs text-gray-600">
                              {isCurrentUserClient(order) ? order.gig?.provider?.username : order.client?.username}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 2 && (
                <div className="space-y-3">
                  {allReviews.length === 0 ? (
                    <div className="text-center py-6">
                      <Star size={32} className="text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No reviews yet</p>
                    </div>
                  ) : (
                    allReviews.map((review: any) => (
                      <div key={review.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-600">
                            by {review.order?.client?.username}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 3 && (
                <div className="space-y-3">
                  {notifications?.length === 0 ? (
                    <div className="text-center py-6">
                      <Bell size={32} className="text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No notifications</p>
                    </div>
                  ) : (
                    notifications?.slice(0, 5).map((notification) => (
                      <div key={notification.id} className={`p-3 rounded-lg ${
                        !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'bg-gray-50'
                      }`}>
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'text-blue-800' : 'text-gray-800'
                          }`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{notification.content}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 4 && (
                <div className="space-y-4">
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
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Bio
                    </label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Avatar URL
                    </label>
                    <input
                      type="url"
                      value={editForm.avatar_url}
                      onChange={(e) => setEditForm({...editForm, avatar_url: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfile.isLoading}
                    variant="primary"
                    fullWidth
                  >
                    {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};