import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User, 
  Edit, 
  Settings, 
  Bell, 
  Star, 
  DollarSign, 
  Coins,
  Calendar, 
  MapPin, 
  Mail, 
  Globe, 
  Briefcase, 
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  MoreVertical,
  Trash2,
  Eye,
  Pause,
  Play,
  X
} from 'lucide-react';
import { Button, Card, EmailNotificationsToggle, NotificationsMenu, ReviewsList } from 'components';
import { useGetIsLoggedIn, useGetAccount } from 'lib';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useGigs, useDeleteGig, useUpdateGigStatus } from '../../hooks/useGigs';
import { useOrders } from '../../hooks/useOrders';
import { useNotifications, useMarkAllNotificationsAsRead } from '../../hooks/useNotifications';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();
  const { user: authUser } = useAuth();
  
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useProfile(id);
  const { data: gigs, refetch: refetchGigs } = useGigs();
  const { data: orders } = useOrders();
  const { data: notifications } = useNotifications();
  const updateProfile = useUpdateProfile();
  const deleteGig = useDeleteGig();
  const updateGigStatus = useUpdateGigStatus();

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showGigMenu, setShowGigMenu] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGig, setSelectedGig] = useState<any>(null);
  
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    bio: '',
    avatar_url: ''
  });

  const isOwnProfile = !id || (authUser?.id === profile?.id);

  // Initialize tab from URL params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'gigs', 'orders', 'notifications', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab !== 'overview') {
      setSearchParams({ tab: activeTab });
    } else {
      setSearchParams({});
    }
  }, [activeTab, setSearchParams]);

  // Initialize edit form when profile loads
  useEffect(() => {
    if (profile && isOwnProfile) {
      setEditForm({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile, isOwnProfile]);

  // Calculate earnings from completed orders
  const calculateEarnings = () => {
    if (!orders) return { egld: 0, ida: 0 };
    
    const completedOrders = orders.filter(order => order.status === 'completed');
    
    const egldEarnings = completedOrders
      .filter(order => order.payment_token === 'EGLD')
      .reduce((sum, order) => sum + (order.amount * 0.9), 0); // 90% after 10% fee
    
    const idaEarnings = completedOrders
      .filter(order => order.payment_token === 'IDA-f9bc1d')
      .reduce((sum, order) => sum + order.amount, 0); // 100% no fees
    
    return { egld: egldEarnings, ida: idaEarnings };
  };

  const earnings = calculateEarnings();

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync(editForm);
      setIsEditing(false);
      refetchProfile();
      alert('Profile updated successfully');
    } catch (error) {
      alert('Error updating profile. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
    if (profile) {
      setEditForm({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  };

  const handleEditGig = (gigId: string) => {
    navigate(`/gigs/${gigId}/edit`);
    setShowGigMenu(null);
  };

  const handleViewGig = (gigId: string) => {
    navigate(`/gigs/${gigId}`);
    setShowGigMenu(null);
  };

  const confirmDeleteGig = (gig: any) => {
    setSelectedGig(gig);
    setShowDeleteModal(true);
    setShowGigMenu(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedGig) return;
    
    try {
      await deleteGig.mutateAsync(selectedGig.id, {
        onSuccess: () => {
          refetchGigs();
        }
      });
      setShowDeleteModal(false);
      setSelectedGig(null);
      alert('Gig deleted successfully');
    } catch (error) {
      alert('Error deleting gig. Please try again.');
    }
  };

  const handleUpdateGigStatus = async (gigId: string, status: string) => {
    try {
      await updateGigStatus.mutateAsync({ id: gigId, status });
      refetchGigs();
      setShowGigMenu(null);
      alert(`Gig status updated to ${status}`);
    } catch (error) {
      alert('Error updating gig status. Please try again.');
    }
  };

  const getStatusColor = (category: string) => {
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

  const completedOrders = orders?.filter(order => order.status === 'completed') || [];
  const averageRating = completedOrders.length > 0 
    ? completedOrders.reduce((sum, order) => {
        const review = order.reviews?.[0];
        return sum + (review?.rating || 0);
      }, 0) / completedOrders.length 
    : 0;

  const unreadNotifications = notifications?.filter(n => !n.read) || [];

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="space-y-8">
        {/* Profile Header */}
        <Card className="p-8" title="Profile Header" reference="#">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center">
                  {profile.avatar_url ? (
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
                  ) : (
                    <span className="text-4xl text-white font-bold">
                      {profile.username?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}
                  {profile.avatar_url && (
                    <div 
                      className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-4xl text-white font-bold absolute inset-0"
                      style={{ display: 'none' }}
                    >
                      {profile.username?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Avatar URL</label>
                      <input
                        type="url"
                        value={editForm.avatar_url}
                        onChange={(e) => setEditForm({...editForm, avatar_url: e.target.value})}
                        placeholder="https://example.com/avatar.jpg"
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
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
                        disabled={updateProfile.isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                      >
                        {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h1 className="text-2xl font-bold text-white">{profile.full_name || profile.username}</h1>
                        <p className="text-gray-400">@{profile.username}</p>
                        {profile.bio && (
                          <p className="text-gray-300 mt-2">{profile.bio}</p>
                        )}
                      </div>
                      {isOwnProfile && (
                        <Button
                          onClick={handleEditProfile}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                          <Edit size={16} />
                          Edit Profile
                        </Button>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
                        <p className="text-gray-400 text-sm">Total Earned</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <DollarSign size={14} className="text-yellow-400" />
                            <p className="text-white text-lg font-bold">{earnings.egld.toFixed(2)} EGLD</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Coins size={14} className="text-blue-400" />
                            <p className="text-white text-lg font-bold">{earnings.ida.toFixed(2)} IDA</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
                        <p className="text-gray-400 text-sm">Active Gigs</p>
                        <p className="text-white text-xl font-bold">{gigs?.filter(g => g.status === 'active').length || 0}</p>
                      </div>

                      <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
                        <p className="text-gray-400 text-sm">Completed Orders</p>
                        <p className="text-white text-xl font-bold">{completedOrders.length}</p>
                      </div>

                      <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
                        <p className="text-gray-400 text-sm">Average Rating</p>
                        <div className="flex items-center gap-1">
                          <Star size={16} className="text-yellow-400 fill-current" />
                          <p className="text-white text-xl font-bold">
                            {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-gray-400 text-sm">
                      <p>Member since {new Date(profile.created_at).toLocaleDateString()}</p>
                      {profile.wallet_address && (
                        <p className="mt-1">
                          Wallet: {profile.wallet_address.substring(0, 8)}...{profile.wallet_address.substring(profile.wallet_address.length - 4)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Card className="overflow-hidden" title="Profile Tabs" reference="#">
          <div className="border-b border-gray-700">
            <div className="flex overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: <User size={16} /> },
                { id: 'gigs', label: 'Gigs', icon: <Briefcase size={16} /> },
                ...(isOwnProfile ? [
                  { id: 'orders', label: 'Orders', icon: <Clock size={16} /> },
                  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
                  { id: 'settings', label: 'Settings', icon: <Settings size={16} /> }
                ] : [])
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400 bg-gray-800'
                      : 'border-transparent text-gray-400 hover:text-blue-400'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.id === 'notifications' && unreadNotifications.length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                      {unreadNotifications.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Profile Overview</h2>
                
                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
                  {orders?.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex justify-between items-center py-3 border-b border-gray-700">
                      <div>
                        <p className="text-white">{order.gig?.title || 'Custom Project'}</p>
                        <p className="text-gray-400 text-sm">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  )) || (
                    <p className="text-gray-400">No recent activity</p>
                  )}
                </div>
              </div>
            )}

            {/* Gigs Tab */}
            {activeTab === 'gigs' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">
                    {isOwnProfile ? 'My Gigs' : `${profile.username}'s Gigs`} ({gigs?.length || 0})
                  </h2>
                  {isOwnProfile && (
                    <Button
                      onClick={() => navigate('/create-gig')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Briefcase size={16} />
                      Create New Gig
                    </Button>
                  )}
                </div>

                {gigs?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">
                      {isOwnProfile ? "You haven't created any gigs yet." : "This user hasn't created any gigs yet."}
                    </p>
                    {isOwnProfile && (
                      <Button
                        onClick={() => navigate('/create-gig')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                      >
                        Create Your First Gig
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gigs?.map((gig) => {
                      const statusColor = getStatusColor(gig.category);
                      const paymentToken = gig.payment_token || 'EGLD';
                      const tokenSymbol = paymentToken === 'EGLD' ? 'EGLD' : 'IDA';
                      const tokenIcon = paymentToken === 'EGLD' ? <DollarSign size={16} /> : <Coins size={16} />;
                      const hasNoFees = paymentToken !== 'EGLD';

                      return (
                        <div
                          key={gig.id}
                          className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer relative"
                          style={{
                            borderTopColor: statusColor,
                            borderTopWidth: '3px'
                          }}
                          onClick={() => navigate(`/gigs/${gig.id}`)}
                        >
                          {/* Gig Menu for Own Profile */}
                          {isOwnProfile && (
                            <div className="absolute top-2 right-2 z-10">
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowGigMenu(showGigMenu === gig.id ? null : gig.id);
                                  }}
                                  className="p-1 bg-white bg-opacity-90 hover:bg-opacity-100 rounded shadow-sm"
                                >
                                  <MoreVertical size={16} className="text-gray-600" />
                                </button>
                                
                                {showGigMenu === gig.id && (
                                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-48">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewGig(gig.id);
                                      }}
                                      className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <Eye size={16} />
                                      View Gig
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditGig(gig.id);
                                      }}
                                      className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <Edit size={16} />
                                      Edit Gig
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        confirmDeleteGig(gig);
                                      }}
                                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <Trash2 size={16} />
                                      Delete Gig
                                    </button>
                                    <hr className="border-gray-200" />
                                    {gig.status !== 'active' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateGigStatus(gig.id, 'active');
                                        }}
                                        className="w-full text-left px-4 py-2 text-green-600 hover:bg-gray-100 flex items-center gap-2"
                                      >
                                        <Play size={16} />
                                        Set Active
                                      </button>
                                    )}
                                    {gig.status !== 'paused' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateGigStatus(gig.id, 'paused');
                                        }}
                                        className="w-full text-left px-4 py-2 text-yellow-600 hover:bg-gray-100 flex items-center gap-2"
                                      >
                                        <Pause size={16} />
                                        Set Paused
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
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
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                gig.status === 'active' ? 'bg-green-100 text-green-800' :
                                gig.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {gig.status}
                              </span>
                            </div>
                          </div>

                          <div className="relative h-48">
                            <img
                              src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                              alt={gig.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="p-4 space-y-3">
                            <h3 className="text-lg font-bold text-gray-800 line-clamp-2">
                              {gig.title}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-3">
                              {gig.description.split('\n\nPackage Includes:\n')[0]}
                            </p>
                            <p className="text-sm text-gray-800">
                              Duration: {gig.duration} days
                            </p>
                          </div>

                          <div className="flex justify-between items-center p-4 border-t border-gray-100">
                            <div className="flex items-center gap-1">
                              {tokenIcon}
                              <span className="text-lg font-bold" style={{ color: statusColor }}>
                                {gig.price} {tokenSymbol}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && isOwnProfile && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">My Orders ({orders?.length || 0})</h2>
                
                {orders?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No orders yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders?.map((order) => (
                      <div
                        key={order.id}
                        className="bg-gray-800 bg-opacity-50 p-6 rounded-lg border border-gray-600 cursor-pointer hover:border-blue-500 transition-colors"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <h3 className="text-white font-bold">
                              {order.gig?.title || 'Custom Project'}
                            </h3>
                            <p className="text-gray-400">
                              Amount: {order.amount} {order.payment_token || 'EGLD'}
                            </p>
                            <p className="text-gray-400 text-sm">
                              Created: {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'delivered' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              order.payment_status === 'escrowed' ? 'bg-green-100 text-green-800' :
                              order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.payment_status === 'released' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              Payment: {order.payment_status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && isOwnProfile && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">
                    Notifications ({notifications?.length || 0})
                  </h2>
                  {unreadNotifications.length > 0 && (
                    <Button
                      onClick={async () => {
                        try {
                          const markAllAsRead = useMarkAllNotificationsAsRead();
                          await markAllAsRead.mutateAsync();
                          alert('All notifications marked as read');
                        } catch (error) {
                          alert('Error marking notifications as read');
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Mark All as Read ({unreadNotifications.length})
                    </Button>
                  )}
                </div>
                
                {notifications?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No notifications yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications?.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border cursor-pointer hover:bg-gray-800 transition-colors ${
                          !notification.read 
                            ? 'bg-gray-800 border-blue-500 border-l-4' 
                            : 'bg-gray-800 bg-opacity-50 border-gray-600'
                        }`}
                        onClick={() => {
                          // Handle notification click
                          if (notification.data?.order_id) {
                            navigate(`/orders/${notification.data.order_id}`);
                          }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <p className={`font-medium ${
                                !notification.read ? 'text-white' : 'text-gray-300'
                              }`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && isOwnProfile && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Account Settings</h2>
                
                <div className="space-y-6">
                  <EmailNotificationsToggle enabled={profile.email_notifications_enabled || false} />
                  
                  <hr className="border-gray-600" />
                  
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Account Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-400 text-sm">Username</p>
                        <p className="text-white">{profile.username}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Wallet Address</p>
                        <p className="text-white font-mono text-sm">
                          {profile.wallet_address}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Member Since</p>
                        <p className="text-white">
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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="p-6 max-w-md w-full mx-4" title="Delete Gig" reference="#">
              <h3 className="text-xl font-bold text-white mb-4">Delete Gig</h3>
              <p className="text-gray-400 mb-4">
                Are you sure you want to delete "{selectedGig?.title}"?
              </p>
              <p className="text-red-300 mb-4 text-sm">
                This action cannot be undone. All related orders and messages will also be deleted.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg"
                  disabled={deleteGig.isLoading}
                >
                  {deleteGig.isLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Click outside to close menu */}
        {showGigMenu && (
          <div 
            className="fixed inset-0 z-5" 
            onClick={() => setShowGigMenu(null)}
          />
        )}
      </div>
    </div>
  );
};