import React, { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
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
  Plus,
  Briefcase,
  CheckCircle,
  AlertTriangle,
  Eye,
  MessageSquare,
  Coins
} from 'lucide-react';
import { Button, Card, EmailNotificationsToggle, ReviewModal } from 'components';
import { useGetIsLoggedIn, useGetAccount } from 'lib';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import { useGigs } from '../hooks/useGigs';
import { useOrders } from '../hooks/useOrders';
import { useNotifications, useMarkNotificationAsRead } from '../hooks/useNotifications';
import { useAuth } from '../context/AuthContext';

export const Profile = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();
  const { user: authUser } = useAuth();
  
  // Get profile data
  const { data: profile, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useProfile(id);
  const { data: gigs, isLoading: gigsLoading, refetch: refetchGigs } = useGigs();
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useOrders();
  const { data: notifications, isLoading: notificationsLoading, refetch: refetchNotifications } = useNotifications();
  const updateProfile = useUpdateProfile();

  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    bio: '',
    email_notifications_enabled: false
  });

  // State for tabs
  const [activeTab, setActiveTab] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

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
        email_notifications_enabled: profile.email_notifications_enabled || false
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
        email_notifications_enabled: profile?.email_notifications_enabled || false
      });
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(editForm);
      setIsEditing(false);
      refetchProfile();
      alert('Profile updated successfully');
    } catch (error) {
      alert('Error updating profile');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleNotificationClick = async (notification: any) => {
    try {
      if (!notification.read) {
        await markAsRead.mutateAsync(notification.id);
        refetchNotifications();
      }
      
      // Navigate based on notification type
      if (notification.type === 'message' && notification.data?.order_id) {
        window.location.href = `/orders/${notification.data.order_id}`;
      } else if (notification.type === 'proposal_message' && notification.data?.proposal_id) {
        window.location.href = `/proposals/${notification.data.proposal_id}`;
      } else if (notification.type === 'proposal_accepted' && notification.data?.proposal_id) {
        window.location.href = `/proposals/${notification.data.proposal_id}`;
      } else if (notification.data?.order_id) {
        window.location.href = `/orders/${notification.data.order_id}`;
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleOrderClick = (orderId: string) => {
    window.location.href = `/orders/${orderId}`;
  };

  const handleGigClick = (gigId: string) => {
    window.location.href = `/gigs/${gigId}`;
  };

  const handleReviewClick = (order: any) => {
    setSelectedOrder(order);
    setShowReviewModal(true);
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
      case 'resolved':
        return 'purple';
      default:
        return 'gray';
    }
  };

  // Check if this is the current user's profile
  const isOwnProfile = !id || (authUser && profile && authUser.id === profile.id);

  // Filter orders based on user role
  const clientOrders = orders?.filter(order => order.client_id === authUser?.id) || [];
  const providerOrders = orders?.filter(order => 
    order.gig?.provider_id === authUser?.id || 
    order.provider_address === address
  ) || [];

  const tabs = [
    { id: 0, label: 'Profile', icon: <User size={16} /> },
    { id: 1, label: 'My Gigs', icon: <Briefcase size={16} /> },
    { id: 2, label: 'Orders', icon: <Calendar size={16} /> },
    { id: 3, label: 'Notifications', icon: <Bell size={16} /> },
    { id: 4, label: 'Settings', icon: <Settings size={16} /> },
  ];

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

  if (profileError) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Error Loading Profile" reference="#">
          <div className="bg-red-900 border border-red-500 rounded-md p-4">
            <div className="flex items-center">
              <span className="text-red-400 mr-2">⚠️</span>
              <span className="text-white">Error loading profile: {profileError.message}</span>
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
          <div className="bg-yellow-900 border border-yellow-500 rounded-md p-4">
            <div className="flex items-center">
              <span className="text-yellow-400 mr-2">⚠️</span>
              <span className="text-white">Profile not found or not accessible.</span>
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
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center text-2xl text-white">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  profile.username?.charAt(0)?.toUpperCase() || "?"
                )}
              </div>
              
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      name="username"
                      value={editForm.username}
                      onChange={handleChange}
                      placeholder="Username"
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      name="full_name"
                      value={editForm.full_name}
                      onChange={handleChange}
                      placeholder="Full Name"
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <textarea
                      name="bio"
                      value={editForm.bio}
                      onChange={handleChange}
                      placeholder="Bio"
                      rows={3}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                      {profile.full_name || profile.username}
                    </h1>
                    <p className="text-gray-400 mb-2">@{profile.username}</p>
                    <p className="text-white">
                      {profile.bio || "No bio available"}
                    </p>
                  </div>
                )}
              </div>
              
              {isOwnProfile && (
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleSave}
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
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Edit size={16} />
                      Edit Profile
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{gigs?.length || 0}</p>
                <p className="text-gray-400">Active Gigs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{orders?.length || 0}</p>
                <p className="text-gray-400">Total Orders</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {orders?.filter(o => o.status === 'completed').length || 0}
                </p>
                <p className="text-gray-400">Completed</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        {isOwnProfile && (
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
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-6">
              {/* Profile Tab */}
              {activeTab === 0 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Profile Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Username</p>
                        <p className="text-white">{profile.username}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Full Name</p>
                        <p className="text-white">{profile.full_name || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Member Since</p>
                        <p className="text-white">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Wallet Address</p>
                        <p className="text-white text-xs">
                          {profile.wallet_address ? 
                            `${profile.wallet_address.substring(0, 8)}...${profile.wallet_address.substring(profile.wallet_address.length - 4)}` 
                            : 'Not connected'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Gigs Tab */}
              {activeTab === 1 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">My Gigs ({gigs?.length || 0})</h3>
                    <Button
                      onClick={() => window.location.href = '/create-gig'}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Create Gig
                    </Button>
                  </div>
                  
                  {gigsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : gigs?.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400 mb-4">You haven't created any gigs yet.</p>
                      <Button
                        onClick={() => window.location.href = '/create-gig'}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                      >
                        Create your first gig
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {gigs?.map((gig) => (
                        <Card
                          key={gig.id}
                          className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
                          title="Gig"
                          reference="#"
                          onClick={() => handleGigClick(gig.id)}
                        >
                          <div className="relative h-32">
                            <img
                              src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                              alt={gig.title}
                              className="w-full h-full object-cover"
                            />
                            <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                              gig.status === 'active' ? 'bg-green-100 text-green-800' :
                              gig.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {gig.status}
                            </span>
                          </div>
                          
                          <div className="p-4 space-y-3">
                            <h4 className="text-lg font-bold text-gray-800 line-clamp-2">
                              {gig.title}
                            </h4>
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {gig.description}
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="text-blue-600 font-bold">
                                {gig.price} {gig.payment_token === 'EGLD' ? 'EGLD' : 'IDEA'}
                              </span>
                              <span className="text-gray-600 text-sm">
                                {gig.duration} days
                              </span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-white">My Orders</h3>
                  
                  {ordersLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : orders?.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No orders yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* As Client Section */}
                      {clientOrders.length > 0 && (
                        <div>
                          <h4 className="text-md font-bold text-white mb-4">As Client ({clientOrders.length})</h4>
                          
                          {/* Mobile Layout */}
                          <div className="md:hidden space-y-4">
                            {clientOrders.map((order) => {
                              const statusColor = getStatusColor(order.status);
                              const paymentStatusColor = getPaymentStatusColor(order.payment_status);
                              const tokenSymbol = order.payment_token === 'EGLD' ? 'EGLD' : 'IDEA';
                              const tokenIcon = order.payment_token === 'EGLD' ? <DollarSign size={14} /> : <Coins size={14} />;

                              return (
                                <div
                                  key={order.id}
                                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all duration-200"
                                  onClick={() => handleOrderClick(order.id)}
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
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        statusColor === 'green' ? 'bg-green-100 text-green-800' :
                                        statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                                        statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                        statusColor === 'red' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {order.status}
                                      </span>
                                      
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        paymentStatusColor === 'green' ? 'bg-green-100 text-green-800' :
                                        paymentStatusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                        paymentStatusColor === 'red' ? 'bg-red-100 text-red-800' :
                                        paymentStatusColor === 'purple' ? 'bg-purple-100 text-purple-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {order.payment_status}
                                      </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-1">
                                        {tokenIcon}
                                        <span className="text-sm font-bold text-gray-800">
                                          {order.amount} {tokenSymbol}
                                        </span>
                                      </div>
                                      <span className="text-xs text-gray-600">
                                        {new Date(order.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="text-left p-3 text-gray-700">Order</th>
                                  <th className="text-left p-3 text-gray-700">Participants</th>
                                  <th className="text-left p-3 text-gray-700">Amount</th>
                                  <th className="text-left p-3 text-gray-700">Status</th>
                                  <th className="text-left p-3 text-gray-700">Payment</th>
                                  <th className="text-left p-3 text-gray-700">Date</th>
                                  <th className="text-left p-3 text-gray-700">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {clientOrders.map((order) => {
                                  const statusColor = getStatusColor(order.status);
                                  const paymentStatusColor = getPaymentStatusColor(order.payment_status);
                                  const tokenSymbol = order.payment_token === 'EGLD' ? 'EGLD' : 'IDEA';
                                  const tokenIcon = order.payment_token === 'EGLD' ? <DollarSign size={14} /> : <Coins size={14} />;

                                  return (
                                    <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                                      <td className="p-3">
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
                                      </td>
                                      <td className="p-3">
                                        <div className="flex items-center gap-1">
                                          {tokenIcon}
                                          <span className="font-bold text-gray-800">
                                            {order.amount} {tokenSymbol}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                          statusColor === 'green' ? 'bg-green-100 text-green-800' :
                                          statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                                          statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                          statusColor === 'red' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {order.status}
                                        </span>
                                      </td>
                                      <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                          paymentStatusColor === 'green' ? 'bg-green-100 text-green-800' :
                                          paymentStatusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                          paymentStatusColor === 'red' ? 'bg-red-100 text-red-800' :
                                          paymentStatusColor === 'purple' ? 'bg-purple-100 text-purple-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {order.payment_status}
                                        </span>
                                      </td>
                                      <td className="p-3">
                                        <span className="text-gray-600 text-xs">
                                          {new Date(order.created_at).toLocaleDateString()}
                                        </span>
                                      </td>
                                      <td className="p-3">
                                        <div className="flex gap-2">
                                          <Button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOrderClick(order.id);
                                            }}
                                            className="text-blue-600 hover:text-blue-800 bg-transparent border-none p-1"
                                          >
                                            <Eye size={14} />
                                          </Button>
                                          {order.status === 'completed' && !order.reviews?.length && (
                                            <Button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleReviewClick(order);
                                              }}
                                              className="text-yellow-600 hover:text-yellow-800 bg-transparent border-none p-1"
                                            >
                                              <Star size={14} />
                                            </Button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* As Provider Section */}
                      {providerOrders.length > 0 && (
                        <div>
                          <h4 className="text-md font-bold text-white mb-4">As Provider ({providerOrders.length})</h4>
                          
                          {/* Mobile Layout */}
                          <div className="md:hidden space-y-4">
                            {providerOrders.map((order) => {
                              const statusColor = getStatusColor(order.status);
                              const paymentStatusColor = getPaymentStatusColor(order.payment_status);
                              const tokenSymbol = order.payment_token === 'EGLD' ? 'EGLD' : 'IDEA';
                              const tokenIcon = order.payment_token === 'EGLD' ? <DollarSign size={14} /> : <Coins size={14} />;

                              return (
                                <div
                                  key={order.id}
                                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all duration-200"
                                  onClick={() => handleOrderClick(order.id)}
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
                                      </td>
                                      <td className="p-3">
                                        <div className="flex items-center gap-1">
                                          {tokenIcon}
                                          <span className="font-bold text-gray-800">
                                            {order.amount} {tokenSymbol}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                          statusColor === 'green' ? 'bg-green-100 text-green-800' :
                                          statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                                          statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                          statusColor === 'red' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {order.status}
                                        </span>
                                      </td>
                                      <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                          paymentStatusColor === 'green' ? 'bg-green-100 text-green-800' :
                                          paymentStatusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                          paymentStatusColor === 'red' ? 'bg-red-100 text-red-800' :
                                          paymentStatusColor === 'purple' ? 'bg-purple-100 text-purple-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {order.payment_status}
                                        </span>
                                      </td>
                                      <td className="p-3">
                                        <span className="text-gray-600 text-xs">
                                          {new Date(order.created_at).toLocaleDateString()}
                                        </span>
                                      </td>
                                      <td className="p-3">
                                        <div className="flex gap-2">
                                          <Button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOrderClick(order.id);
                                            }}
                                            className="text-blue-600 hover:text-blue-800 bg-transparent border-none p-1"
                                          >
                                            <Eye size={14} />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* No orders message */}
                      {clientOrders.length === 0 && providerOrders.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-400">No orders yet.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-white">Notifications</h3>
                  
                  {notificationsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : notifications?.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No notifications yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications?.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-4 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors ${
                            !notification.read ? 'bg-gray-750 border-l-4 border-l-blue-500' : 'bg-gray-800'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <p className={`text-sm flex-1 ${
                                !notification.read ? 'text-white font-medium' : 'text-gray-300'
                              }`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm">
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
              )}

              {/* Settings Tab */}
              {activeTab === 4 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-white">Settings</h3>
                  
                  <div className="space-y-6">
                    <EmailNotificationsToggle 
                      enabled={profile.email_notifications_enabled || false}
                    />
                    
                    <hr className="border-gray-600" />
                    
                    <div>
                      <h4 className="text-white font-medium mb-4">Account Information</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-gray-400 text-sm">User ID</p>
                          <p className="text-white text-xs font-mono">{profile.id}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Wallet Address</p>
                          <p className="text-white text-xs font-mono">
                            {profile.wallet_address || 'Not connected'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Account Created</p>
                          <p className="text-white text-sm">
                            {new Date(profile.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Public Profile View */}
        {!isOwnProfile && (
          <div className="space-y-8">
            {/* Gigs */}
            <Card className="p-8" title="Gigs" reference="#">
              <h3 className="text-lg font-bold text-white mb-4">
                Gigs by {profile.username} ({gigs?.length || 0})
              </h3>
              
              {gigsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : gigs?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No gigs available.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gigs?.filter(gig => gig.status === 'active').map((gig) => (
                    <Card
                      key={gig.id}
                      className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
                      title="Gig"
                      reference="#"
                      onClick={() => handleGigClick(gig.id)}
                    >
                      <div className="relative h-32">
                        <img
                          src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                          alt={gig.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="p-4 space-y-3">
                        <h4 className="text-lg font-bold text-gray-800 line-clamp-2">
                          {gig.title}
                        </h4>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {gig.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-600 font-bold">
                            {gig.price} {gig.payment_token === 'EGLD' ? 'EGLD' : 'IDEA'}
                          </span>
                          <span className="text-gray-600 text-sm">
                            {gig.duration} days
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
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
              refetchOrders();
              setShowReviewModal(false);
            }}
          />
        )}

        {/* Add bottom padding for mobile navigation */}
        <div className="h-20 md:h-0"></div>
      </div>
    </div>
  );
};