import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User, 
  Edit, 
  Save, 
  X, 
  Star, 
  Briefcase, 
  DollarSign, 
  Bell, 
  Settings, 
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Coins,
  TrendingUp,
  Award,
  Target
} from 'lucide-react';
import { Button } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useOrders } from '../../hooks/useOrders';
import { useGigs } from '../../hooks/useGigs';
import { useNotifications, useMarkAllNotificationsAsRead } from '../../hooks/useNotifications';
import { useAuth } from '../../context/AuthContext';
import { useWindowSize } from '../../hooks/useWindowSize';

export const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  
  const { data: profile, isLoading, error, refetch } = useProfile(id);
  const { data: orders } = useOrders();
  const { data: gigs } = useGigs();
  const { data: notifications } = useNotifications();
  const updateProfile = useUpdateProfile();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    bio: '',
    avatar_url: '',
    email_notifications_enabled: false
  });

  const isOwnProfile = !id || (user?.id === profile?.id);

  // Set active tab from URL params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'notifications') setActiveTab(2);
    else if (tab === 'settings') setActiveTab(3);
    else setActiveTab(0);
  }, [searchParams]);

  // Initialize edit form when profile loads
  useEffect(() => {
    if (profile && isOwnProfile) {
      setEditForm({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
        email_notifications_enabled: profile.email_notifications_enabled || false
      });
    }
  }, [profile, isOwnProfile]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync(editForm);
      setIsEditing(false);
      refetch();
      alert('Profile updated successfully');
    } catch (error) {
      alert('Error updating profile');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      alert('All notifications marked as read');
    } catch (error) {
      alert('Error marking notifications as read');
    }
  };

  // Calculate statistics
  const totalGigs = gigs?.length || 0;
  const totalOrders = orders?.length || 0;
  const completedOrders = orders?.filter(order => order.status === 'completed').length || 0;
  const unreadNotifications = notifications?.filter(n => !n.read).length || 0;

  // Calculate earnings by token type
  const egldEarnings = orders?.filter(order => 
    order.status === 'completed' && 
    (order.payment_token === 'EGLD' || !order.payment_token)
  ).reduce((sum, order) => sum + (order.amount * 0.9), 0) || 0; // 10% fee deducted

  const idaEarnings = orders?.filter(order => 
    order.status === 'completed' && 
    order.payment_token === 'IDA-f9bc1d'
  ).reduce((sum, order) => sum + order.amount, 0) || 0; // No fees for IDA

  // Calculate average rating
  const allReviews = orders?.flatMap(order => order.reviews || []) || [];
  const averageRating = allReviews.length > 0 
    ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length 
    : 0;

  const tabs = [
    { id: 0, label: 'Overview', icon: <User size={isMobile ? 14 : 16} /> },
    { id: 1, label: 'Activity', icon: <Briefcase size={isMobile ? 14 : 16} /> },
    { id: 2, label: 'Notifications', icon: <Bell size={isMobile ? 14 : 16} /> },
    { id: 3, label: 'Settings', icon: <Settings size={isMobile ? 14 : 16} /> }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-2 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-8">
            <div className="flex justify-center py-8">
              <div className="space-y-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-700 text-sm md:text-base">Loading profile...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-2 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 md:p-6">
            <div className="flex items-center">
              <AlertTriangle className="text-red-500 mr-2" size={isMobile ? 16 : 20} />
              <span className="text-red-700 text-sm md:text-base">
                {error ? `Error: ${error.message}` : 'Profile not found'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 overflow-x-hidden">
      <div className="w-full max-w-6xl mx-auto p-2 md:p-6">
        <div className="space-y-4 md:space-y-6">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 md:p-8">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                <div className="relative">
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.parentElement?.querySelector('.fallback-avatar') as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-lg md:text-2xl font-bold text-white ${profile.avatar_url ? 'hidden' : 'flex'}`}
                    >
                      {profile.username?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 text-center md:text-left min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                    <h1 className="text-xl md:text-3xl font-bold text-white truncate">
                      {profile.full_name || profile.username}
                    </h1>
                    {profile.full_name && (
                      <span className="text-sm md:text-lg text-indigo-100">
                        @{profile.username}
                      </span>
                    )}
                  </div>
                  
                  {profile.bio && (
                    <p className="text-indigo-100 text-sm md:text-base mb-3 md:mb-4 break-words">
                      {profile.bio}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    <span className="px-2 md:px-3 py-1 bg-white bg-opacity-20 text-white rounded-full text-xs md:text-sm">
                      Member since {new Date(profile.created_at).toLocaleDateString()}
                    </span>
                    {averageRating > 0 && (
                      <span className="px-2 md:px-3 py-1 bg-yellow-400 bg-opacity-90 text-yellow-900 rounded-full text-xs md:text-sm flex items-center gap-1">
                        <Star size={12} fill="currentColor" />
                        {averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                {isOwnProfile && (
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                        size={isMobile ? "sm" : "md"}
                        className="bg-white bg-opacity-20 border-white text-white hover:bg-white hover:text-indigo-600"
                      >
                        <Edit size={isMobile ? 14 : 16} />
                        {!isMobile && "Edit"}
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveProfile}
                          disabled={updateProfile.isLoading}
                          variant="outline"
                          size={isMobile ? "sm" : "md"}
                          className="bg-green-500 border-green-500 text-white hover:bg-green-600"
                        >
                          <Save size={isMobile ? 14 : 16} />
                          {!isMobile && "Save"}
                        </Button>
                        <Button
                          onClick={() => setIsEditing(false)}
                          variant="outline"
                          size={isMobile ? "sm" : "md"}
                          className="bg-white bg-opacity-20 border-white text-white hover:bg-white hover:text-indigo-600"
                        >
                          <X size={isMobile ? 14 : 16} />
                          {!isMobile && "Cancel"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg md:rounded-xl p-3 md:p-6 border border-blue-200">
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Briefcase size={isMobile ? 16 : 24} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-blue-600 font-medium">Gigs</p>
                  <p className="text-lg md:text-2xl font-bold text-blue-800 truncate">{totalGigs}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg md:rounded-xl p-3 md:p-6 border border-green-200">
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <Target size={isMobile ? 16 : 24} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-green-600 font-medium">Orders</p>
                  <p className="text-lg md:text-2xl font-bold text-green-800 truncate">{totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg md:rounded-xl p-3 md:p-6 border border-yellow-200">
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Award size={isMobile ? 16 : 24} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-yellow-600 font-medium">Rating</p>
                  <div className="flex items-center gap-1">
                    <p className="text-lg md:text-2xl font-bold text-yellow-800">
                      {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                    </p>
                    <Star size={isMobile ? 12 : 16} className="text-yellow-500" fill="currentColor" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg md:rounded-xl p-3 md:p-6 border border-purple-200">
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <TrendingUp size={isMobile ? 16 : 24} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-purple-600 font-medium">Earned</p>
                  <div className="space-y-0.5">
                    {egldEarnings > 0 && (
                      <p className="text-sm md:text-lg font-bold text-purple-800 truncate">
                        {egldEarnings.toFixed(2)} EGLD
                      </p>
                    )}
                    {idaEarnings > 0 && (
                      <p className="text-sm md:text-lg font-bold text-purple-800 truncate">
                        {idaEarnings.toFixed(2)} IDA
                      </p>
                    )}
                    {egldEarnings === 0 && idaEarnings === 0 && (
                      <p className="text-lg md:text-2xl font-bold text-purple-800">0</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings Breakdown */}
          {(egldEarnings > 0 || idaEarnings > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              {egldEarnings > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg md:rounded-xl p-4 md:p-6 border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <DollarSign size={isMobile ? 20 : 24} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base md:text-lg font-bold text-blue-800">EGLD Earnings</h3>
                      <p className="text-xl md:text-2xl font-bold text-blue-600">{egldEarnings.toFixed(4)} EGLD</p>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-blue-600">
                    After 10% platform fee
                  </p>
                </div>
              )}

              {idaEarnings > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg md:rounded-xl p-4 md:p-6 border border-purple-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Coins size={isMobile ? 20 : 24} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base md:text-lg font-bold text-purple-800">IDA Earnings</h3>
                      <p className="text-xl md:text-2xl font-bold text-purple-600">{idaEarnings.toFixed(4)} IDA</p>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-purple-600">
                    No fees - 100% yours!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="flex overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1 md:gap-2 px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 min-w-0 ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                        : 'border-transparent text-gray-500 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                  >
                    {tab.icon}
                    <span className="truncate">{isMobile ? tab.label.substring(0, 8) : tab.label}</span>
                    {tab.id === 2 && unreadNotifications > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                        {unreadNotifications}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 md:p-6">
              {/* Overview Tab */}
              {activeTab === 0 && (
                <div className="space-y-4 md:space-y-6">
                  {isEditing && isOwnProfile ? (
                    <div className="space-y-4">
                      <h2 className="text-lg md:text-xl font-bold text-gray-800">Edit Profile</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Username
                          </label>
                          <input
                            type="text"
                            value={editForm.username}
                            onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                            className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={editForm.full_name}
                            onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                            className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bio
                        </label>
                        <textarea
                          value={editForm.bio}
                          onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                          rows={3}
                          className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base resize-none"
                          placeholder="Tell others about yourself..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Avatar URL
                        </label>
                        <input
                          type="url"
                          value={editForm.avatar_url}
                          onChange={(e) => setEditForm({...editForm, avatar_url: e.target.value})}
                          className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
                          placeholder="https://example.com/avatar.jpg"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 md:space-y-6">
                      <h2 className="text-lg md:text-xl font-bold text-gray-800">Profile Information</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-3 md:space-y-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Username</p>
                            <p className="text-sm md:text-base font-medium text-gray-800 break-words">
                              @{profile.username}
                            </p>
                          </div>
                          
                          {profile.full_name && (
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Full Name</p>
                              <p className="text-sm md:text-base font-medium text-gray-800 break-words">
                                {profile.full_name}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3 md:space-y-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Member Since</p>
                            <p className="text-sm md:text-base font-medium text-gray-800">
                              {new Date(profile.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          
                          {allReviews.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Reviews</p>
                              <div className="flex items-center gap-2">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      size={isMobile ? 14 : 16}
                                      className={star <= averageRating ? "text-yellow-400" : "text-gray-300"}
                                      fill={star <= averageRating ? "currentColor" : "none"}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm md:text-base font-medium text-gray-800">
                                  {averageRating.toFixed(1)} ({allReviews.length})
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {profile.bio && (
                        <div>
                          <p className="text-sm text-gray-500 mb-2">About</p>
                          <p className="text-sm md:text-base text-gray-700 break-words leading-relaxed">
                            {profile.bio}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 1 && (
                <div className="space-y-4 md:space-y-6">
                  <h2 className="text-lg md:text-xl font-bold text-gray-800">Recent Activity</h2>
                  
                  {orders && orders.length > 0 ? (
                    <div className="space-y-3 md:space-y-4">
                      {orders.slice(0, 5).map((order) => {
                        const isClient = order.client?.id === user?.id;
                        const isProvider = order.gig?.provider?.id === user?.id;
                        
                        return (
                          <div
                            key={order.id}
                            className="bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 p-3 md:p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            <div className="space-y-2 md:space-y-3">
                              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                                <h3 className="text-sm md:text-base font-semibold text-gray-800 break-words">
                                  {order.gig?.title || 'Custom Project'}
                                </h3>
                                <div className="flex flex-wrap gap-1 md:gap-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                    order.status === 'delivered' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {order.status}
                                  </span>
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                    {order.amount} {order.payment_token === 'IDA-f9bc1d' ? 'IDA' : 'EGLD'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                                <div className="flex flex-col md:flex-row gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <User size={12} />
                                    <span className="truncate">
                                      Client: {order.client?.username || 'Unknown'}
                                    </span>
                                  </div>
                                  {order.gig?.provider && (
                                    <div className="flex items-center gap-1">
                                      <Briefcase size={12} />
                                      <span className="truncate">
                                        Provider: {order.gig.provider.username || 'Unknown'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 md:py-8">
                      <p className="text-gray-500 text-sm md:text-base">No recent activity</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 2 && isOwnProfile && (
                <div className="space-y-4 md:space-y-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                    <h2 className="text-lg md:text-xl font-bold text-gray-800">Notifications</h2>
                    {unreadNotifications > 0 && (
                      <Button
                        onClick={handleMarkAllAsRead}
                        size="sm"
                        variant="outline"
                        className="w-full md:w-auto"
                      >
                        Mark all as read ({unreadNotifications})
                      </Button>
                    )}
                  </div>
                  
                  {notifications && notifications.length > 0 ? (
                    <div className="space-y-2 md:space-y-3 max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 md:p-4 rounded-lg border transition-all duration-200 ${
                            !notification.read 
                              ? 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500' 
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="space-y-1 md:space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className={`text-sm md:text-base font-medium break-words flex-1 ${
                                !notification.read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full flex-shrink-0">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-xs md:text-sm text-gray-600 break-words">
                              {notification.content}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 md:py-8">
                      <Bell size={isMobile ? 32 : 48} className="text-gray-300 mx-auto mb-3 md:mb-4" />
                      <p className="text-gray-500 text-sm md:text-base">No notifications yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 3 && isOwnProfile && (
                <div className="space-y-4 md:space-y-6">
                  <h2 className="text-lg md:text-xl font-bold text-gray-800">Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 p-3 md:p-4 bg-gray-50 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm md:text-base font-medium text-gray-800">Email Notifications</h3>
                        <p className="text-xs md:text-sm text-gray-600 break-words">
                          Receive email notifications for new orders and messages
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={editForm.email_notifications_enabled}
                          onChange={(e) => setEditForm({...editForm, email_notifications_enabled: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2 md:gap-3">
                        <div className="text-blue-500 mt-0.5 flex-shrink-0">ℹ️</div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm md:text-base font-medium text-blue-800 mb-1">Account Information</h4>
                          <p className="text-xs md:text-sm text-blue-700 break-words">
                            Your profile is linked to your MultiversX wallet. Some settings may require wallet confirmation.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom padding for mobile navigation */}
          <div className="h-20 md:h-0"></div>
        </div>
      </div>
    </div>
  );
};