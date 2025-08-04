import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  Bell, 
  Star, 
  Calendar, 
  DollarSign, 
  Clock, 
  Edit, 
  Save, 
  X, 
  CheckCircle,
  AlertTriangle,
  Briefcase,
  Package,
  Eye,
  MessageSquare
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
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();
  const { user: authUser } = useAuth();
  
  // Determine if viewing own profile or someone else's
  const isOwnProfile = !id || id === authUser?.id;
  const profileId = isOwnProfile ? undefined : id;
  
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useProfile(profileId);
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
    email_notifications_enabled: false
  });

  // Initialize edit form when profile loads
  useEffect(() => {
    if (profile && isOwnProfile) {
      setEditForm({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        email_notifications_enabled: profile.email_notifications_enabled || false
      });
    }
  }, [profile, isOwnProfile]);

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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'escrowed':
        return 'green';
      case 'pending_release':
        return 'yellow';
      case 'released':
        return 'green';
      case 'disputed':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Filter orders based on current user's role
  const clientOrders = orders?.filter(order => order.client_id === authUser?.id) || [];
  const providerOrders = orders?.filter(order => 
    order.provider_address === address || 
    order.gig?.provider?.wallet_address === address
  ) || [];

  const unreadNotifications = notifications?.filter(n => !n.read) || [];

  const tabs = [
    { id: 0, label: 'Overview', icon: <User size={16} /> },
    { id: 1, label: 'Orders', icon: <Briefcase size={16} /> },
    { id: 2, label: 'Gigs', icon: <Package size={16} /> },
    ...(isOwnProfile ? [
      { id: 3, label: 'Notifications', icon: <Bell size={16} /> },
      { id: 4, label: 'Settings', icon: <Settings size={16} /> }
    ] : [])
  ];

  if (!isLoggedIn && isOwnProfile) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Login Required" reference="#">
          <div className="bg-yellow-900 border border-yellow-500 rounded-md p-4">
            <div className="flex items-center">
              <span className="text-yellow-400 mr-2">⚠️</span>
              <span className="text-white">Please log in to view your profile.</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Loading Profile" reference="#">
          <div className="flex justify-center">
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-white">Loading profile...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Profile Not Found" reference="#">
          <div className="bg-red-900 border border-red-500 rounded-md p-4">
            <div className="flex items-center">
              <span className="text-red-400 mr-2">⚠️</span>
              <span className="text-white">Profile not found.</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="space-y-8">
        {/* Profile Header */}
        <Card className="p-8" title="Profile Header" reference="#">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden relative bg-gray-600">
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
                        className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-xl text-white absolute inset-0"
                        style={{ display: 'none' }}
                      >
                        {profile.username?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-xl text-white">
                      {profile.username?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {profile.full_name || profile.username}
                  </h1>
                  <p className="text-gray-400">@{profile.username}</p>
                  <p className="text-gray-400 text-sm">
                    Member since {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {isOwnProfile && (
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Edit size={16} />
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              )}
            </div>

            {profile.bio && (
              <div>
                <p className="text-white">{profile.bio}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <Card className="overflow-hidden" title="Profile Tabs" reference="#">
          <div className="border-b border-gray-700">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400 bg-gray-800'
                      : 'border-transparent text-gray-400 hover:text-blue-400'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.label === 'Notifications' && unreadNotifications.length > 0 && (
                    <span className="ml-1 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                      {unreadNotifications.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 0 && (
              <div className="space-y-6">
                {isEditing && isOwnProfile ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Username</label>
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Full Name</label>
                      <input
                        type="text"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Bio</label>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                        rows={4}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleSaveProfile}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        disabled={updateProfile.isLoading}
                      >
                        <Save size={16} />
                        {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        onClick={() => setIsEditing(false)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <X size={16} />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Total Gigs</p>
                      <p className="text-white text-2xl font-bold">{gigs?.length || 0}</p>
                    </div>
                    <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Orders as Client</p>
                      <p className="text-white text-2xl font-bold">{clientOrders.length}</p>
                    </div>
                    <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Orders as Provider</p>
                      <p className="text-white text-2xl font-bold">{providerOrders.length}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Orders</h2>
                
                {ordersLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="space-y-4 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-white">Loading orders...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Orders as Client */}
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4">As Client ({clientOrders.length})</h3>
                      {clientOrders.length === 0 ? (
                        <p className="text-gray-400">No orders as client yet.</p>
                      ) : (
                        <>
                          {/* Mobile Layout */}
                          <div className="md:hidden space-y-4">
                            {clientOrders.map((order) => {
                              const statusColor = getStatusColor(order.status);
                              const paymentStatusColor = getPaymentStatusColor(order.payment_status);
                              
                              return (
                                <div
                                  key={order.id}
                                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all duration-200"
                                  onClick={() => navigate(`/orders/${order.id}`)}
                                >
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                      <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">
                                        {order.gig?.title || 'Custom Project'}
                                      </h4>
                                      
                                      {/* Both Client and Provider */}
                                      <div className="space-y-2">
                                        {/* Client */}
                                        <div className="flex items-center gap-2">
                                          <div className="w-5 h-5 rounded-full overflow-hidden relative">
                                            {order.client?.avatar_url ? (
                                              <img
                                                src={order.client.avatar_url}
                                                alt={order.client.username || "Client"}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement;
                                                  target.src = "https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg";
                                                }}
                                              />
                                            ) : (
                                              <img
                                                src="https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg"
                                                alt="Client"
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
                                            )}
                                            <div 
                                              className="fallback-client-avatar w-full h-full bg-gradient-to-r from-blue-400 to-green-400 rounded-full flex items-center justify-center text-xs text-white absolute inset-0"
                                              style={{ display: 'none' }}
                                            >
                                              {order.client?.username?.charAt(0)?.toUpperCase() || "C"}
                                            </div>
                                          </div>
                                          <span className="text-xs text-gray-600 truncate max-w-[60px]">
                                            Client: {(order.client?.username || "Unknown").substring(0, 6)}
                                          </span>
                                        </div>
                                        
                                        {/* Provider */}
                                        <div className="flex items-center gap-2">
                                          <div className="w-5 h-5 rounded-full overflow-hidden relative">
                                            {order.gig?.provider?.avatar_url ? (
                                              <img
                                                src={order.gig.provider.avatar_url}
                                                alt={order.gig.provider.username || "Provider"}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement;
                                                  target.src = "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg";
                                                }}
                                              />
                                            ) : (
                                              <img
                                                src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg"
                                                alt="Provider"
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
                                            )}
                                            <div 
                                              className="fallback-provider-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-xs text-white absolute inset-0"
                                              style={{ display: 'none' }}
                                            >
                                              {order.gig?.provider?.username?.charAt(0)?.toUpperCase() || "P"}
                                            </div>
                                          </div>
                                          <span className="text-xs text-gray-600 truncate max-w-[60px]">
                                            Provider: {(order.gig?.provider?.username || "Unknown").substring(0, 6)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        statusColor === 'green' ? 'bg-green-100 text-green-800' :
                                        statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                                        statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                        statusColor === 'red' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {order.status}
                                      </span>
                                      
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        paymentStatusColor === 'green' ? 'bg-green-100 text-green-800' :
                                        paymentStatusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                        paymentStatusColor === 'red' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {order.payment_status}
                                      </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-bold text-gray-800">
                                        {order.amount} {order.payment_token || 'EGLD'}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(order.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {clientOrders.map((order) => {
                              const statusColor = getStatusColor(order.status);
                              const paymentStatusColor = getPaymentStatusColor(order.payment_status);
                              
                              return (
                                <div
                                  key={order.id}
                                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all duration-200"
                                  onClick={() => navigate(`/orders/${order.id}`)}
                                >
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                      <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">
                                        {order.gig?.title || 'Custom Project'}
                                      </h4>
                                      
                                      {/* Both Client and Provider */}
                                      <div className="space-y-2">
                                        {/* Client */}
                                        <div className="flex items-center gap-2">
                                          <div className="w-5 h-5 rounded-full overflow-hidden relative">
                                            {order.client?.avatar_url ? (
                                              <img
                                                src={order.client.avatar_url}
                                                alt={order.client.username || "Client"}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement;
                                                  target.src = "https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg";
                                                }}
                                              />
                                            ) : (
                                              <img
                                                src="https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg"
                                                alt="Client"
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
                                            )}
                                            <div 
                                              className="fallback-client-avatar w-full h-full bg-gradient-to-r from-blue-400 to-green-400 rounded-full flex items-center justify-center text-xs text-white absolute inset-0"
                                              style={{ display: 'none' }}
                                            >
                                              {order.client?.username?.charAt(0)?.toUpperCase() || "C"}
                                            </div>
                                          </div>
                                          <span className="text-xs text-gray-600 truncate max-w-[60px]">
                                            Client: {(order.client?.username || "Unknown").substring(0, 6)}
                                          </span>
                                        </div>
                                        
                                        {/* Provider */}
                                        <div className="flex items-center gap-2">
                                          <div className="w-5 h-5 rounded-full overflow-hidden relative">
                                            {order.gig?.provider?.avatar_url ? (
                                              <img
                                                src={order.gig.provider.avatar_url}
                                                alt={order.gig.provider.username || "Provider"}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement;
                                                  target.src = "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg";
                                                }}
                                              />
                                            ) : (
                                              <img
                                                src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg"
                                                alt="Provider"
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
                                            )}
                                            <div 
                                              className="fallback-provider-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-xs text-white absolute inset-0"
                                              style={{ display: 'none' }}
                                            >
                                              {order.gig?.provider?.username?.charAt(0)?.toUpperCase() || "P"}
                                            </div>
                                          </div>
                                          <span className="text-xs text-gray-600 truncate max-w-[60px]">
                                            Provider: {(order.gig?.provider?.username || "Unknown").substring(0, 6)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        statusColor === 'green' ? 'bg-green-100 text-green-800' :
                                        statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                                        statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                        statusColor === 'red' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {order.status}
                                      </span>
                                      
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        paymentStatusColor === 'green' ? 'bg-green-100 text-green-800' :
                                        paymentStatusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                        paymentStatusColor === 'red' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {order.payment_status}
                                      </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-bold text-gray-800">
                                        {order.amount} {order.payment_token || 'EGLD'}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(order.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Orders as Provider */}
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4">As Provider ({providerOrders.length})</h3>
                      {providerOrders.length === 0 ? (
                        <p className="text-gray-400">No orders as provider yet.</p>
                      ) : (
                        <>
                          {/* Mobile Layout */}
                          <div className="md:hidden space-y-4">
                            {providerOrders.map((order) => {
                              const statusColor = getStatusColor(order.status);
                              const paymentStatusColor = getPaymentStatusColor(order.payment_status);
                              
                              return (
                                <div
                                  key={order.id}
                                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all duration-200"
                                  onClick={() => navigate(`/orders/${order.id}`)}
                                >
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                      <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">
                                        {order.gig?.title || 'Custom Project'}
                                      </h4>
                                      
                                      {/* Both Client and Provider */}
                                      <div className="space-y-2">
                                        {/* Client */}
                                        <div className="flex items-center gap-2">
                                          <div className="w-5 h-5 rounded-full overflow-hidden relative">
                                            {order.client?.avatar_url ? (
                                              <img
                                                src={order.client.avatar_url}
                                                alt={order.client.username || "Client"}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement;
                                                  target.src = "https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg";
                                                }}
                                              />
                                            ) : (
                                              <img
                                                src="https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg"
                                                alt="Client"
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
                                            )}
                                            <div 
                                              className="fallback-client-avatar w-full h-full bg-gradient-to-r from-blue-400 to-green-400 rounded-full flex items-center justify-center text-xs text-white absolute inset-0"
                                              style={{ display: 'none' }}
                                            >
                                              {order.client?.username?.charAt(0)?.toUpperCase() || "C"}
                                            </div>
                                          </div>
                                          <span className="text-xs text-gray-600 truncate max-w-[60px]">
                                            Client: {(order.client?.username || "Unknown").substring(0, 6)}
                                          </span>
                                        </div>
                                        
                                        {/* Provider */}
                                        <div className="flex items-center gap-2">
                                          <div className="w-5 h-5 rounded-full overflow-hidden relative">
                                            {order.gig?.provider?.avatar_url ? (
                                              <img
                                                src={order.gig.provider.avatar_url}
                                                alt={order.gig.provider.username || "Provider"}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement;
                                                  target.src = "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg";
                                                }}
                                              />
                                            ) : (
                                              <img
                                                src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg"
                                                alt="Provider"
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
                                            )}
                                            <div 
                                              className="fallback-provider-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-xs text-white absolute inset-0"
                                              style={{ display: 'none' }}
                                            >
                                              {order.gig?.provider?.username?.charAt(0)?.toUpperCase() || "P"}
                                            </div>
                                          </div>
                                          <span className="text-xs text-gray-600 truncate max-w-[60px]">
                                            Provider: {(order.gig?.provider?.username || "Unknown").substring(0, 6)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        statusColor === 'green' ? 'bg-green-100 text-green-800' :
                                        statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                                        statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                        statusColor === 'red' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {order.status}
                                      </span>
                                      
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        paymentStatusColor === 'green' ? 'bg-green-100 text-green-800' :
                                        paymentStatusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                        paymentStatusColor === 'red' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {order.payment_status}
                                      </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-bold text-gray-800">
                                        {order.amount} {order.payment_token || 'EGLD'}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(order.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Gigs Tab */}
            {activeTab === 2 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">My Gigs</h2>
                  {isOwnProfile && (
                    <Button
                      onClick={() => navigate('/create-gig')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                      Create New Gig
                    </Button>
                  )}
                </div>
                
                {gigsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="space-y-4 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-white">Loading gigs...</p>
                    </div>
                  </div>
                ) : gigs?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">
                      {isOwnProfile ? "You haven't created any gigs yet." : "This user hasn't created any gigs yet."}
                    </p>
                    {isOwnProfile && (
                      <Button
                        onClick={() => navigate('/create-gig')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                      >
                        Create your first gig
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-4">
                      {gigs?.map((gig) => (
                        <div
                          key={gig.id}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
                          onClick={() => navigate(`/gigs/${gig.id}`)}
                        >
                          <div className="relative h-32">
                            <img
                              src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                              alt={gig.title}
                              className="w-full h-full object-cover"
                            />
                            <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                              gig.status === 'active' ? 'bg-green-100 text-green-800' :
                              gig.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {gig.status}
                            </span>
                          </div>
                          
                          <div className="p-4 space-y-3">
                            <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">
                              {gig.title}
                            </h4>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-gray-800">
                                {gig.price} {gig.payment_token || 'EGLD'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {gig.duration} days
                              </span>
                            </div>
                            
                            {isOwnProfile && (
                              <div className="flex gap-2 pt-2">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/gigs/${gig.id}`);
                                  }}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs flex items-center justify-center gap-1"
                                >
                                  <Eye size={12} />
                                  View
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/gigs/${gig.id}/edit`);
                                  }}
                                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-1 px-2 rounded text-xs flex items-center justify-center gap-1"
                                >
                                  <Edit size={12} />
                                  Edit
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {gigs?.map((gig) => (
                        <div
                          key={gig.id}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
                          onClick={() => navigate(`/gigs/${gig.id}`)}
                        >
                          <div className="relative h-48">
                            <img
                              src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                              alt={gig.title}
                              className="w-full h-full object-cover"
                            />
                            <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                              gig.status === 'active' ? 'bg-green-100 text-green-800' :
                              gig.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {gig.status}
                            </span>
                          </div>
                          
                          <div className="p-6 space-y-4">
                            <h4 className="text-xl font-semibold text-gray-800 line-clamp-2">
                              {gig.title}
                            </h4>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-xl font-bold text-gray-800">
                                {gig.price} {gig.payment_token || 'EGLD'}
                              </span>
                              <span className="text-sm text-gray-500">
                                {gig.duration} days
                              </span>
                            </div>
                            
                            {isOwnProfile && (
                              <div className="flex gap-3 pt-4">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/gigs/${gig.id}`);
                                  }}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                                >
                                  <Eye size={16} />
                                  View Gig
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/gigs/${gig.id}/edit`);
                                  }}
                                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                                >
                                  <Edit size={16} />
                                  Edit
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 3 && isOwnProfile && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Notifications</h2>
                  {unreadNotifications.length > 0 && (
                    <Button
                      onClick={handleMarkAllNotificationsAsRead}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
                
                {notifications?.length === 0 ? (
                  <p className="text-gray-400">No notifications yet.</p>
                ) : (
                  <div className="space-y-4">
                    {notifications?.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border ${
                          notification.read 
                            ? 'bg-gray-800 border-gray-600' 
                            : 'bg-blue-900 border-blue-500'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className={`font-medium ${
                              notification.read ? 'text-gray-300' : 'text-white'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {notification.content}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 4 && isOwnProfile && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Settings</h2>
                
                <div className="space-y-6">
                  <EmailNotificationsToggle 
                    enabled={profile.email_notifications_enabled || false}
                  />
                  
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-white font-medium mb-2">Wallet Address</h3>
                    <p className="text-gray-400 text-sm break-all">
                      {profile.wallet_address || 'Not connected'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-white font-medium mb-2">Account Information</h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-400">
                        <span className="text-white">User ID:</span> {profile.id}
                      </p>
                      <p className="text-gray-400">
                        <span className="text-white">Member since:</span> {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};