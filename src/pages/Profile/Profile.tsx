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
  X,
  Shield,
  FileText,
  ChevronLeft,
  ChevronRight,
  Twitter,
  Github,
  Linkedin,
  MessageSquare,
  Send
} from 'lucide-react';
import { Button, Card, EmailNotificationsToggle, NotificationsMenu, ReviewsList } from 'components';
import { useGetIsLoggedIn, useGetAccount } from 'lib';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useGigs, useDeleteGig, useUpdateGigStatus } from '../../hooks/useGigs';
import { useOrders } from '../../hooks/useOrders';
import { useNotifications, useMarkAllNotificationsAsRead } from '../../hooks/useNotifications';
import { useAuth } from '../../context/AuthContext';
import { useWindowSize } from '../../hooks/useWindowSize';
import { TwitterShareButton } from '../components/TwitterShareButton';

export const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();
  const { user: authUser } = useAuth();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  
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
  const [currentGigIndex, setCurrentGigIndex] = useState(0);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    bio: '',
    avatar_url: '',
    twitter_url: '',
    github_url: '',
    linkedin_url: '',
    website_url: '',
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
        avatar_url: profile.avatar_url || '',
        twitter_url: profile.twitter_url || '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        website_url: profile.website_url || '',
        discord_username: profile.discord_username || '',
        telegram_username: profile.telegram_username || '',
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
        avatar_url: profile.avatar_url || '',
        twitter_url: profile.twitter_url || '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        website_url: profile.website_url || '',
        discord_username: profile.discord_username || '',
        telegram_username: profile.telegram_username || '',
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
        return '#10b981'; // emerald-500
      case 'graphics & design':
        return '#3b82f6'; // blue-500
      case 'digital marketing':
        return '#f59e0b'; // amber-500
      case 'writing & translation':
        return '#ef4444'; // red-500
      case 'video & animation':
        return '#8b5cf6'; // violet-500
      case 'ai services':
        return '#06b6d4'; // cyan-500
      case 'music & audio':
        return '#eab308'; // yellow-500
      case 'business':
        return '#22c55e'; // green-500
      case 'consulting':
        return '#ec4899'; // pink-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981'; // emerald-500
      case 'in_progress':
        return '#3b82f6'; // blue-500
      case 'delivered':
        return '#f59e0b'; // amber-500
      case 'cancelled':
        return '#ef4444'; // red-500
      case 'pending_approval':
        return '#8b5cf6'; // violet-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'escrowed':
        return '#10b981'; // emerald-500
      case 'pending_release':
        return '#f59e0b'; // amber-500
      case 'released':
        return '#22c55e'; // green-500
      case 'disputed':
        return '#ef4444'; // red-500
      case 'resolved':
        return '#8b5cf6'; // violet-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  // Mobile carousel navigation
  const scrollGigsLeft = () => {
    if (currentGigIndex > 0) {
      setCurrentGigIndex(currentGigIndex - 1);
    }
  };

  const scrollGigsRight = () => {
    if (gigs && currentGigIndex < gigs.length - 1) {
      setCurrentGigIndex(currentGigIndex + 1);
    }
  };

  const scrollOrdersLeft = () => {
    if (currentOrderIndex > 0) {
      setCurrentOrderIndex(currentOrderIndex - 1);
    }
  };

  const scrollOrdersRight = () => {
    if (orders && currentOrderIndex < orders.length - 1) {
      setCurrentOrderIndex(currentOrderIndex + 1);
    }
  };

  if (!isLoggedIn && isOwnProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="text-yellow-600 mr-3" size={20} />
              <div>
                <h3 className="text-yellow-800 font-semibold">Login Required</h3>
                <p className="text-yellow-700">Please log in to view your profile.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-center">
              <div className="space-y-4 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-700 font-medium">Loading profile...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="text-red-600 mr-3" size={20} />
              <div>
                <h3 className="text-red-800 font-semibold">Profile Not Found</h3>
                <p className="text-red-700">The requested profile could not be found.</p>
              </div>
            </div>
          </div>
        </div>
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

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 py-4 px-3">
        <div className="max-w-sm mx-auto space-y-4">
          {/* Mobile Profile Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-20"></div>
            <div className="px-4 pb-6 -mt-10">
              <div className="flex flex-col items-center text-center space-y-3">
                {/* Profile Picture */}
                <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center">
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
                        className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-2xl text-white font-bold absolute inset-0"
                        style={{ display: 'none' }}
                      >
                        {profile.username?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    </>
                  ) : (
                    <span className="text-2xl text-white font-bold">
                      {profile.username?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>

                {/* Profile Info */}
                {isEditing ? (
                  <div className="w-full space-y-3">
                    <input
                      type="url"
                      value={editForm.avatar_url}
                      onChange={(e) => setEditForm({...editForm, avatar_url: e.target.value})}
                      placeholder="Avatar URL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white text-sm"
                    />
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                      placeholder="Username"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white text-sm"
                    />
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                      placeholder="Full Name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white text-sm"
                    />
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      placeholder="Bio"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white resize-vertical text-sm"
                    />
                    
                    {/* Social Media Section */}
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-700">Social Media Links</p>
                      
                      <input
                        type="url"
                        value={editForm.twitter_url}
                        onChange={(e) => setEditForm({...editForm, twitter_url: e.target.value})}
                        placeholder="Twitter URL"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white text-sm"
                      />
                      
                      <input
                        type="url"
                        value={editForm.github_url}
                        onChange={(e) => setEditForm({...editForm, github_url: e.target.value})}
                        placeholder="GitHub URL"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white text-sm"
                      />
                      
                      <input
                        type="url"
                        value={editForm.linkedin_url}
                        onChange={(e) => setEditForm({...editForm, linkedin_url: e.target.value})}
                        placeholder="LinkedIn URL"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white text-sm"
                      />
                      
                      <input
                        type="url"
                        value={editForm.website_url}
                        onChange={(e) => setEditForm({...editForm, website_url: e.target.value})}
                        placeholder="Website URL"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white text-sm"
                      />
                      
                      <input
                        type="text"
                        value={editForm.discord_username}
                        onChange={(e) => setEditForm({...editForm, discord_username: e.target.value})}
                        placeholder="Discord Username"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white text-sm"
                      />
                      
                      <input
                        type="text"
                        value={editForm.telegram_username}
                        onChange={(e) => setEditForm({...editForm, telegram_username: e.target.value})}
                        placeholder="Telegram Username"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white text-sm"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={updateProfile.isLoading}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm"
                      >
                        <CheckCircle size={14} />
                        {updateProfile.isLoading ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold text-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full space-y-3">
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">
                        {profile.full_name || profile.username}
                      </h1>
                      <p className="text-indigo-600 font-semibold">@{profile.username}</p>
                      {profile.bio && (
                        <p className="text-gray-700 mt-2 text-sm leading-relaxed">{profile.bio}</p>
                      )}
                    </div>

                    {/* Mobile Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 rounded-xl border border-emerald-200">
                        <p className="text-emerald-700 text-xs font-semibold mb-1">EGLD Earned</p>
                        <div className="flex items-center gap-1">
                          <DollarSign size={12} className="text-emerald-600" />
                          <p className="text-emerald-900 text-lg font-bold">{earnings.egld.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-200">
                        <p className="text-blue-700 text-xs font-semibold mb-1">IDA Earned</p>
                        <div className="flex items-center gap-1">
                          <Coins size={12} className="text-blue-600" />
                          <p className="text-blue-900 text-lg font-bold">{earnings.ida.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-xl border border-purple-200">
                        <p className="text-purple-700 text-xs font-semibold mb-1">Active Gigs</p>
                        <p className="text-purple-900 text-lg font-bold">{gigs?.filter(g => g.status === 'active').length || 0}</p>
                      </div>

                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 rounded-xl border border-amber-200">
                        <p className="text-amber-700 text-xs font-semibold mb-1">Rating</p>
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-amber-600 fill-current" />
                          <p className="text-amber-900 text-lg font-bold">
                            {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {isOwnProfile && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={handleEditProfile}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg font-semibold flex items-center justify-center gap-1 text-sm"
                        >
                          <Edit size={12} />
                          Edit
                        </Button>
                        <Button
                          onClick={() => navigate('/create-gig')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-semibold flex items-center justify-center gap-1 text-sm"
                        >
                          <Briefcase size={12} />
                          Create
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Mobile Tab Navigation */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex overflow-x-auto scrollbar-hide">
                {[
                  { id: 'overview', label: 'Overview', icon: <User size={14} /> },
                  { id: 'gigs', label: 'Gigs', icon: <Briefcase size={14} /> },
                  ...(isOwnProfile ? [
                    { id: 'orders', label: 'Orders', icon: <Clock size={14} /> },
                    { id: 'notifications', label: 'Notifications', icon: <Bell size={14} /> },
                    { id: 'settings', label: 'Settings', icon: <Settings size={14} /> }
                  ] : [])
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1 px-3 py-3 text-xs font-semibold border-b-2 transition-all duration-200 whitespace-nowrap min-w-0 ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600 bg-white'
                        : 'border-transparent text-gray-600 hover:text-indigo-600 hover:bg-white'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.id === 'notifications' && unreadNotifications.length > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full min-w-[16px] h-[16px] flex items-center justify-center">
                        {unreadNotifications.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Tab Content */}
            <div className="p-4">
              {/* Mobile Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900">Profile Overview</h2>
                  
                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-3">Recent Activity</h3>
                    <div className="space-y-2">
                      {orders?.slice(0, 3).map((order) => (
                        <div key={order.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 font-semibold text-sm truncate">{order.gig?.title || 'Custom Project'}</p>
                            <p className="text-gray-600 text-xs">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-semibold text-white ml-2 flex-shrink-0"
                            style={{ backgroundColor: getOrderStatusColor(order.status) }}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      )) || (
                        <p className="text-gray-600 text-sm">No recent activity</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Gigs Tab */}
              {activeTab === 'gigs' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">
                      {isOwnProfile ? 'My Gigs' : `${profile.username}'s Gigs`} ({gigs?.length || 0})
                    </h2>
                    {isOwnProfile && (
                      <Button
                        onClick={() => navigate('/create-gig')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg font-semibold flex items-center gap-1 text-xs"
                      >
                        <Briefcase size={12} />
                        Create
                      </Button>
                    )}
                  </div>

                  {gigs?.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                      <Briefcase size={32} className="text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-3 text-sm">
                        {isOwnProfile ? "You haven't created any gigs yet." : "This user hasn't created any gigs yet."}
                      </p>
                      {isOwnProfile && (
                        <Button
                          onClick={() => navigate('/create-gig')}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold text-sm"
                        >
                          Create Your First Gig
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {gigs?.map((gig) => {
                        const statusColor = getStatusColor(gig.category);
                        const paymentToken = gig.payment_token || 'EGLD';
                        const tokenSymbol = paymentToken === 'EGLD' ? 'EGLD' : 'IDA';
                        const tokenIcon = paymentToken === 'EGLD' ? <DollarSign size={14} /> : <Coins size={14} />;
                        const hasNoFees = paymentToken !== 'EGLD';

                        return (
                          <div
                            key={gig.id}
                            className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer relative"
                            onClick={() => navigate(`/gigs/${gig.id}`)}
                            style={{
                              borderTopColor: statusColor,
                              borderTopWidth: '3px'
                            }}
                          >
                            {/* Mobile Gig Menu */}
                            {isOwnProfile && (
                              <div className="absolute top-2 right-2 z-10">
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowGigMenu(showGigMenu === gig.id ? null : gig.id);
                                    }}
                                    className="p-1 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg shadow-md border border-gray-200"
                                  >
                                    <MoreVertical size={14} className="text-gray-700" />
                                  </button>
                                  
                                  {showGigMenu === gig.id && (
                                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 min-w-32">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewGig(gig.id);
                                        }}
                                        className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-t-lg text-xs"
                                      >
                                        <Eye size={12} />
                                        View
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditGig(gig.id);
                                        }}
                                        className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-xs"
                                      >
                                        <Edit size={12} />
                                        Edit
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          confirmDeleteGig(gig);
                                        }}
                                        className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg text-xs"
                                      >
                                        <Trash2 size={12} />
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex justify-between items-center p-3 border-b border-gray-100">
                              <span className="text-xs text-gray-500 font-medium">
                                {new Date(gig.created_at).toLocaleDateString()}
                              </span>
                              <div className="flex gap-1">
                                <span
                                  className="px-2 py-1 rounded-full text-xs font-semibold text-white"
                                  style={{ backgroundColor: statusColor }}
                                >
                                  {gig.category.substring(0, 8)}...
                                </span>
                                {hasNoFees && (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white">
                                    0%
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

                            <div className="p-3 space-y-2">
                              <h3 className="text-sm font-bold text-gray-900 line-clamp-2">
                                {gig.title}
                              </h3>
                              <p className="text-gray-600 text-xs line-clamp-2">
                                {gig.description.split('\n\nPackage Includes:\n')[0]}
                              </p>
                              <p className="text-gray-700 text-xs font-semibold">
                                Duration: {gig.duration} days
                              </p>
                            </div>

                            <div className="flex justify-between items-center p-3 border-t border-gray-100 bg-gray-50">
                              <div className="flex items-center gap-1">
                                {tokenIcon}
                                <span className="text-base font-bold text-gray-900">
                                  {gig.price} {tokenSymbol}
                                </span>
                              </div>
                              {isOwnProfile && (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditGig(gig.id);
                                  }}
                                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1"
                                >
                                  <Edit size={10} />
                                  Edit
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Orders Tab */}
              {activeTab === 'orders' && isOwnProfile && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900">My Orders ({orders?.length || 0})</h2>
                  
                  {orders?.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                      <Clock size={32} className="text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 text-sm">No orders yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders?.map((order) => {
                        const statusColor = getOrderStatusColor(order.status);
                        const paymentStatusColor = getPaymentStatusColor(order.payment_status);
                        const paymentToken = order.payment_token || 'EGLD';
                        const tokenSymbol = paymentToken === 'EGLD' ? 'EGLD' : 'IDA';
                        const tokenIcon = paymentToken === 'EGLD' ? <DollarSign size={14} /> : <Coins size={14} />;

                        return (
                          <div
                            key={order.id}
                            className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer relative"
                            onClick={() => navigate(`/orders/${order.id}`)}
                            style={{
                              borderTopColor: statusColor,
                              borderTopWidth: '3px'
                            }}
                          >
                            <div className="flex justify-between items-center p-3 border-b border-gray-100">
                              <span className="text-xs text-gray-500 font-medium">
                                {new Date(order.created_at).toLocaleDateString()}
                              </span>
                              <div className="flex gap-1">
                                <span
                                  className="px-2 py-1 rounded-full text-xs font-semibold text-white"
                                  style={{ backgroundColor: statusColor }}
                                >
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                                <span
                                  className="px-2 py-1 rounded-full text-xs font-semibold text-white"
                                  style={{ backgroundColor: paymentStatusColor }}
                                >
                                  Pay
                                </span>
                              </div>
                            </div>

                            <div className="p-3 space-y-2">
                              <h3 className="text-sm font-bold text-gray-900 line-clamp-2">
                                {order.gig?.title || 'Custom Project'}
                              </h3>
                              <p className="text-gray-600 text-xs">
                                Order #{order.id.slice(0, 8)}...
                              </p>
                              
                              {/* Progress Bar */}
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-gray-700 text-xs font-semibold">Progress</span>
                                  <span className="text-gray-600 text-xs">
                                    {order.status === 'completed' ? '100%' : 
                                     order.status === 'delivered' ? '75%' :
                                     order.status === 'in_progress' ? '50%' : '25%'}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className="h-1.5 rounded-full transition-all duration-300"
                                    style={{ 
                                      backgroundColor: statusColor,
                                      width: order.status === 'completed' ? '100%' : 
                                             order.status === 'delivered' ? '75%' :
                                             order.status === 'in_progress' ? '50%' : '25%'
                                    }}
                                  ></div>
                                </div>
                              </div>

                              {/* Client Info */}
                              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                <div className="w-6 h-6 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-xs text-white font-semibold">
                                  {order.client?.username?.charAt(0)?.toUpperCase() || "C"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-900 font-semibold text-xs truncate">
                                    {order.client?.username || "Client"}
                                  </p>
                                  <p className="text-gray-600 text-xs">Client</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-between items-center p-3 border-t border-gray-100 bg-gray-50">
                              <div className="flex items-center gap-1">
                                {tokenIcon}
                                <span className="text-base font-bold text-gray-900">
                                  {order.amount} {tokenSymbol}
                                </span>
                              </div>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/orders/${order.id}`);
                                }}
                                className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1"
                              >
                                <FileText size={10} />
                                View
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Notifications Tab */}
              {activeTab === 'notifications' && isOwnProfile && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">
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
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                      >
                        Mark All ({unreadNotifications.length})
                      </Button>
                    )}
                  </div>
                  
                  {notifications?.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                      <Bell size={32} className="text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 text-sm">No notifications yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications?.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-xl border cursor-pointer hover:shadow-md transition-all duration-200 ${
                            !notification.read 
                              ? 'bg-indigo-50 border-indigo-200 border-l-4 border-l-indigo-500' 
                              : 'bg-white border-gray-200'
                          }`}
                          onClick={() => {
                            if (notification.data?.order_id) {
                              navigate(`/orders/${notification.data.order_id}`);
                            }
                          }}
                        >
                          <div className="space-y-1">
                            <div className="flex justify-between items-start">
                              <p className={`text-sm flex-1 ${
                                !notification.read ? 'text-gray-900 font-medium' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="ml-2 px-2 py-1 bg-indigo-500 text-white text-xs rounded-full">
                                  New
                                </span>
                              )}
                            </div>
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
              )}

              {/* Mobile Settings Tab */}
              {activeTab === 'settings' && isOwnProfile && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900">Account Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <EmailNotificationsToggle enabled={profile.email_notifications_enabled || false} />
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <h3 className="text-base font-bold text-gray-900 mb-3">Account Information</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-gray-600 text-xs font-semibold mb-1">Username</p>
                          <p className="text-gray-900 font-medium text-sm">{profile.username}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs font-semibold mb-1">Wallet Address</p>
                          <p className="text-gray-900 font-mono text-xs break-all">
                            {profile.wallet_address}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs font-semibold mb-1">Member Since</p>
                          <p className="text-gray-900 font-medium text-sm">
                            {new Date(profile.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Add bottom padding for mobile navigation */}
          <div className="h-20"></div>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 py-6">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="space-y-6">
          {/* Desktop Profile Header */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-32"></div>
            <div className="px-8 pb-8">
              <div className="flex gap-6 -mt-16">
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center">
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
                          className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-4xl text-white font-bold absolute inset-0"
                          style={{ display: 'none' }}
                        >
                          {profile.username?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      </>
                    ) : (
                      <span className="text-4xl text-white font-bold">
                        {profile.username?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 mt-8">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Avatar URL</label>
                        <input
                          type="url"
                          value={editForm.avatar_url}
                          onChange={(e) => setEditForm({...editForm, avatar_url: e.target.value})}
                          placeholder="https://example.com/avatar.jpg"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Username</label>
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Full Name</label>
                        <input
                          type="text"
                          value={editForm.full_name}
                          onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Bio</label>
                        <textarea
                          value={editForm.bio}
                          onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white resize-vertical"
                        />
                      </div>
                      
                      {/* Social Media Section */}
                      <div>
                        <label className="block text-gray-700 text-lg font-bold mb-4">Social Media Links</label>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-gray-700 text-sm font-semibold mb-2">Twitter URL</label>
                            <input
                              type="url"
                              value={editForm.twitter_url}
                              onChange={(e) => setEditForm({...editForm, twitter_url: e.target.value})}
                              placeholder="https://twitter.com/yourusername"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 text-sm font-semibold mb-2">GitHub URL</label>
                            <input
                              type="url"
                              value={editForm.github_url}
                              onChange={(e) => setEditForm({...editForm, github_url: e.target.value})}
                              placeholder="https://github.com/yourusername"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 text-sm font-semibold mb-2">LinkedIn URL</label>
                            <input
                              type="url"
                              value={editForm.linkedin_url}
                              onChange={(e) => setEditForm({...editForm, linkedin_url: e.target.value})}
                              placeholder="https://linkedin.com/in/yourusername"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 text-sm font-semibold mb-2">Website URL</label>
                            <input
                              type="url"
                              value={editForm.website_url}
                              onChange={(e) => setEditForm({...editForm, website_url: e.target.value})}
                              placeholder="https://yourwebsite.com"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 text-sm font-semibold mb-2">Discord Username</label>
                            <input
                              type="text"
                              value={editForm.discord_username}
                              onChange={(e) => setEditForm({...editForm, discord_username: e.target.value})}
                              placeholder="yourusername#1234"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 text-sm font-semibold mb-2">Telegram Username</label>
                            <input
                              type="text"
                              value={editForm.telegram_username}
                              onChange={(e) => setEditForm({...editForm, telegram_username: e.target.value})}
                              placeholder="@yourusername"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={handleSaveProfile}
                          disabled={updateProfile.isLoading}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={16} />
                          {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                          {profile.full_name || profile.username}
                        </h1>
                        <p className="text-indigo-600 font-semibold text-lg">@{profile.username}</p>
                        {profile.bio && (
                          <p className="text-gray-700 mt-3 text-base leading-relaxed">{profile.bio}</p>
                        )}
                      </div>

                      {/* Desktop Stats */}
                      <div className="grid grid-cols-4 gap-4 mt-6">
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
                          <p className="text-emerald-700 text-sm font-semibold mb-1">EGLD Earned</p>
                          <div className="flex items-center gap-1">
                            <DollarSign size={16} className="text-emerald-600" />
                            <p className="text-emerald-900 text-xl font-bold">{earnings.egld.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                          <p className="text-blue-700 text-sm font-semibold mb-1">IDA Earned</p>
                          <div className="flex items-center gap-1">
                            <Coins size={16} className="text-blue-600" />
                            <p className="text-blue-900 text-xl font-bold">{earnings.ida.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                          <p className="text-purple-700 text-sm font-semibold mb-1">Active Gigs</p>
                          <p className="text-purple-900 text-xl font-bold">{gigs?.filter(g => g.status === 'active').length || 0}</p>
                        </div>

                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                          <p className="text-amber-700 text-sm font-semibold mb-1">Rating</p>
                          <div className="flex items-center gap-1">
                            <Star size={16} className="text-amber-600 fill-current" />
                            <p className="text-amber-900 text-xl font-bold">
                              {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {isOwnProfile && (
                        <div className="flex gap-3 mt-6">
                          <Button
                            onClick={handleEditProfile}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                          >
                            <Edit size={16} />
                            Edit Profile
                          </Button>
                          <Button
                            onClick={() => navigate('/create-gig')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                          >
                            <Briefcase size={16} />
                            Create Gig
                          </Button>
                        </div>
                      )}

                      <div className="text-gray-600 text-sm mt-4">
                        <p>Member since {new Date(profile.created_at).toLocaleDateString()}</p>
                        {profile.wallet_address && (
                          <p className="mt-1 font-mono">
                            {profile.wallet_address.substring(0, 12)}...{profile.wallet_address.substring(profile.wallet_address.length - 8)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Tabs */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Desktop Tab Navigation */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex">
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
                    className={`flex items-center gap-2 px-6 py-4 text-base font-semibold border-b-2 transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600 bg-white'
                        : 'border-transparent text-gray-600 hover:text-indigo-600 hover:bg-white'
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

            {/* Desktop Tab Content */}
            <div className="p-8">
              {/* Desktop Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Profile Overview</h2>
                  
                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {orders?.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
                          <div>
                            <p className="text-gray-900 font-semibold">{order.gig?.title || 'Custom Project'}</p>
                            <p className="text-gray-600 text-sm">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: getOrderStatusColor(order.status) }}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      )) || (
                        <p className="text-gray-600">No recent activity</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop Gigs Tab */}
              {activeTab === 'gigs' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {isOwnProfile ? 'My Gigs' : `${profile.username}'s Gigs`} ({gigs?.length || 0})
                    </h2>
                    {isOwnProfile && (
                      <Button
                        onClick={() => navigate('/create-gig')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                      >
                        <Briefcase size={16} />
                        Create New Gig
                      </Button>
                    )}
                  </div>

                  {gigs?.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                      <Briefcase size={48} className="text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4 text-lg">
                        {isOwnProfile ? "You haven't created any gigs yet." : "This user hasn't created any gigs yet."}
                      </p>
                      {isOwnProfile && (
                        <Button
                          onClick={() => navigate('/create-gig')}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold"
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
                            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative group"
                            onClick={() => navigate(`/gigs/${gig.id}`)}
                            style={{
                              borderTopColor: statusColor,
                              borderTopWidth: '4px'
                            }}
                          >
                            {/* Desktop Gig Menu */}
                            {isOwnProfile && (
                              <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowGigMenu(showGigMenu === gig.id ? null : gig.id);
                                    }}
                                    className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg shadow-md border border-gray-200"
                                  >
                                    <MoreVertical size={16} className="text-gray-700" />
                                  </button>
                                  
                                  {showGigMenu === gig.id && (
                                    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-20 min-w-48">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewGig(gig.id);
                                        }}
                                        className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                                      >
                                        <Eye size={16} />
                                        View Gig
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditGig(gig.id);
                                        }}
                                        className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                      >
                                        <Edit size={16} />
                                        Edit Gig
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          confirmDeleteGig(gig);
                                        }}
                                        className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                                      >
                                        <Trash2 size={16} />
                                        Delete Gig
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex justify-between items-center p-4 border-b border-gray-100">
                              <span className="text-xs text-gray-500 font-medium">
                                {new Date(gig.created_at).toLocaleDateString()}
                              </span>
                              <div className="flex gap-2">
                                <span
                                  className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                                  style={{ backgroundColor: statusColor }}
                                >
                                  {gig.category}
                                </span>
                                {hasNoFees && (
                                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white">
                                    No Fees
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="relative h-48">
                              <img
                                src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                                alt={gig.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            </div>

                            <div className="p-4 space-y-3">
                              <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                                {gig.title}
                              </h3>
                              <p className="text-gray-600 text-sm line-clamp-3">
                                {gig.description.split('\n\nPackage Includes:\n')[0]}
                              </p>
                              <p className="text-gray-700 text-sm font-semibold">
                                Duration: {gig.duration} days
                              </p>
                            </div>

                            <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50">
                              <div className="flex items-center gap-2">
                                {tokenIcon}
                                <span className="text-xl font-bold text-gray-900">
                                  {gig.price} {tokenSymbol}
                                </span>
                              </div>
                              {isOwnProfile && (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditGig(gig.id);
                                  }}
                                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1"
                                >
                                  <Edit size={14} />
                                  Edit
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Desktop Orders Tab */}
              {activeTab === 'orders' && isOwnProfile && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">My Orders ({orders?.length || 0})</h2>
                  
                  {orders?.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                      <Clock size={48} className="text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">No orders yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {orders?.map((order) => {
                        const statusColor = getOrderStatusColor(order.status);
                        const paymentStatusColor = getPaymentStatusColor(order.payment_status);
                        const paymentToken = order.payment_token || 'EGLD';
                        const tokenSymbol = paymentToken === 'EGLD' ? 'EGLD' : 'IDA';
                        const tokenIcon = paymentToken === 'EGLD' ? <DollarSign size={16} /> : <Coins size={16} />;

                        return (
                          <div
                            key={order.id}
                            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative group"
                            onClick={() => navigate(`/orders/${order.id}`)}
                            style={{
                              borderTopColor: statusColor,
                              borderTopWidth: '4px'
                            }}
                          >
                            <div className="flex justify-between items-center p-4 border-b border-gray-100">
                              <span className="text-xs text-gray-500 font-medium">
                                {new Date(order.created_at).toLocaleDateString()}
                              </span>
                              <div className="flex gap-2">
                                <span
                                  className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                                  style={{ backgroundColor: statusColor }}
                                >
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                                <span
                                  className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                                  style={{ backgroundColor: paymentStatusColor }}
                                >
                                  {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                                </span>
                              </div>
                            </div>

                            <div className="p-4 space-y-3">
                              <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                                {order.gig?.title || 'Custom Project'}
                              </h3>
                              <p className="text-gray-600 text-sm">
                                Order #{order.id.slice(0, 8)}...
                              </p>
                              
                              {/* Progress Bar */}
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-gray-700 text-sm font-semibold">Progress</span>
                                  <span className="text-gray-600 text-sm">
                                    {order.status === 'completed' ? '100%' : 
                                     order.status === 'delivered' ? '75%' :
                                     order.status === 'in_progress' ? '50%' : '25%'}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                      backgroundColor: statusColor,
                                      width: order.status === 'completed' ? '100%' : 
                                             order.status === 'delivered' ? '75%' :
                                             order.status === 'in_progress' ? '50%' : '25%'
                                    }}
                                  ></div>
                                </div>
                              </div>

                              {/* Client Info */}
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-sm text-white font-semibold">
                                  {order.client?.username?.charAt(0)?.toUpperCase() || "C"}
                                </div>
                                <div>
                                  <p className="text-gray-900 font-semibold text-sm">
                                    {order.client?.username || "Client"}
                                  </p>
                                  <p className="text-gray-600 text-xs">Client</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50">
                              <div className="flex items-center gap-2">
                                {tokenIcon}
                                <span className="text-xl font-bold text-gray-900">
                                  {order.amount} {tokenSymbol}
                                </span>
                              </div>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/orders/${order.id}`);
                                }}
                                className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1"
                              >
                                <FileText size={14} />
                                View
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Desktop Notifications Tab */}
              {activeTab === 'notifications' && isOwnProfile && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">
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
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                      >
                        Mark All as Read ({unreadNotifications.length})
                      </Button>
                    )}
                  </div>
                  
                  {notifications?.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                      <Bell size={48} className="text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">No notifications yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications?.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all duration-200 ${
                            !notification.read 
                              ? 'bg-indigo-50 border-indigo-200 border-l-4 border-l-indigo-500' 
                              : 'bg-white border-gray-200'
                          }`}
                          onClick={() => {
                            if (notification.data?.order_id) {
                              navigate(`/orders/${notification.data.order_id}`);
                            }
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <p className={`font-semibold text-base ${
                                  !notification.read ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <span className="px-2 py-1 bg-indigo-500 text-white text-xs rounded-full font-semibold">
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm leading-relaxed">
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

              {/* Desktop Settings Tab */}
              {activeTab === 'settings' && isOwnProfile && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                      <EmailNotificationsToggle enabled={profile.email_notifications_enabled || false} />
                    </div>
                    
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Account Information</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-gray-600 text-sm font-semibold mb-1">Username</p>
                          <p className="text-gray-900 font-medium">{profile.username}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm font-semibold mb-1">Wallet Address</p>
                          <p className="text-gray-900 font-mono text-sm break-all">
                            {profile.wallet_address}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm font-semibold mb-1">Member Since</p>
                          <p className="text-gray-900 font-medium">
                            {new Date(profile.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 size={24} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Delete Gig</h3>
                    <p className="text-gray-600 text-sm">This action cannot be undone</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete "<span className="font-semibold">{selectedGig?.title}</span>"?
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmDelete}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-semibold"
                    disabled={deleteGig.isLoading}
                  >
                    {deleteGig.isLoading ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Click outside to close menu */}
          {showGigMenu && (
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowGigMenu(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
};