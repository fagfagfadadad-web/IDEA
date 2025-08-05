import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  Star, 
  Edit, 
  MapPin, 
  Calendar, 
  Globe, 
  Github, 
  Linkedin, 
  Twitter,
  Mail,
  X,
  Check,
  Briefcase,
  DollarSign,
  Clock,
  Eye,
  MessageSquare,
  Plus,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { Button, Card, EmailNotificationsToggle, ReviewsList } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useProfile, useUpdateProfile } from 'hooks';
import { useAuth } from '../../context/AuthContext';
import { useGigs, useDeleteGig, useUpdateGigStatus } from '../hooks/useGigs';
import { useOrders } from '../hooks/useOrders';
import { useNotifications, useMarkAllNotificationsAsRead } from '../hooks/useNotifications';
import { useReviewsForProvider } from '../hooks/useReviews';

export const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  
  // Use the id from params if viewing someone else's profile, otherwise use current user
  const { data: profile, isLoading, error, refetch } = useProfile(id);
  
  // Determine if this is the user's own profile
  const isOwnProfile = !id || (user?.id === profile?.id);

  // Only load additional data for own profile
  const { data: gigs, refetch: refetchGigs } = useGigs();
  const { data: orders } = useOrders();
  const { data: notifications } = useNotifications();
  const { data: providerReviews, isLoading: reviewsLoading, error: reviewsError } = useReviewsForProvider(profile?.id || '');

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
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

  // Initialize edit form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        username: profile.username || '',
        full_name: profile.full_name || '',
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
      await updateProfile.mutateAsync(editForm);
      setIsEditModalOpen(false);
      refetch();
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`Error updating profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteGig = async (gigId: string) => {
    if (!confirm('Are you sure you want to delete this gig?')) return;
    
    try {
      await deleteGig.mutateAsync(gigId, {
        onSuccess: () => {
          refetchGigs();
        }
      });
      alert('Gig deleted successfully');
    } catch (error) {
      alert('Error deleting gig');
    }
  };

  const handleUpdateGigStatus = async (gigId: string, status: string) => {
    try {
      await updateGigStatus.mutateAsync({ id: gigId, status });
      refetchGigs();
      alert(`Gig status updated to ${status}`);
    } catch (error) {
      alert('Error updating gig status');
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

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

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

  if (isLoading) {
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

  if (error || !profile) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Profile Not Found" reference="#">
          <div className="bg-red-900 border border-red-500 rounded-md p-4">
            <div className="flex items-center">
              <span className="text-red-400 mr-2">⚠️</span>
              <span className="text-white">
                {error ? `Error: ${error.message}` : 'Profile not found'}
              </span>
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
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-2xl text-white">
              {profile.username?.charAt(0)?.toUpperCase() || "U"}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {profile.full_name || profile.username}
                  </h1>
                  <p className="text-gray-400 mb-2">@{profile.username}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                {isOwnProfile && (
                  <Button
                    onClick={() => setIsEditModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Edit size={16} />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Me */}
            <Card className="p-6" title="About Me" reference="#">
              <h3 className="text-lg font-bold text-white mb-4">About Me</h3>
              {profile.bio ? (
                <p className="text-gray-300 whitespace-pre-wrap">{profile.bio}</p>
              ) : (
                <p className="text-gray-400 italic">
                  {isOwnProfile ? 'Add a bio to tell others about yourself' : 'No bio available'}
                </p>
              )}
            </Card>

            {/* Social Media Links */}
            <Card className="p-6" title="Social Media" reference="#">
              <h3 className="text-lg font-bold text-white mb-4">Social Media Links</h3>
              <div className="space-y-3">
                {profile.twitter_url && (
                  <a
                    href={profile.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-blue-400 hover:text-blue-300 transition-colors"
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
                    className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
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
                    className="flex items-center gap-3 text-blue-400 hover:text-blue-300 transition-colors"
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
                    className="flex items-center gap-3 text-green-400 hover:text-green-300 transition-colors"
                  >
                    <Globe size={20} />
                    <span>Website</span>
                  </a>
                )}
                
                {!profile.twitter_url && !profile.github_url && !profile.linkedin_url && !profile.website_url && (
                  <p className="text-gray-400 italic">
                    {isOwnProfile ? 'Add your social media links to connect with others' : 'No social media links available'}
                  </p>
                )}
              </div>
            </Card>

            {/* Reviews Section - Show for public profiles */}
            {!isOwnProfile && (
              <Card className="p-6" title="Reviews" reference="#">
                <ReviewsList 
                  reviews={providerReviews || []}
                  isLoading={reviewsLoading}
                  error={reviewsError}
                  showTitle={true}
                />
              </Card>
            )}

            {/* My Gigs - Only for own profile */}
            {isOwnProfile && (
              <Card className="p-6" title="My Gigs" reference="#">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white">My Gigs</h3>
                  <Button
                    onClick={() => navigate('/create-gig')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Create Gig
                  </Button>
                </div>
                
                {gigs?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">You haven't created any gigs yet.</p>
                    <Button
                      onClick={() => navigate('/create-gig')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
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
                        className="bg-gray-800 bg-opacity-50 rounded-lg overflow-hidden border border-gray-600 hover:border-blue-500 transition-all duration-300 relative group"
                      >
                        {/* Gig Actions Menu */}
                        <div className="absolute top-2 right-2 z-10">
                          <div className="relative">
                            <button className="p-1 bg-gray-800 bg-opacity-75 hover:bg-opacity-100 rounded text-gray-300 hover:text-white transition-colors">
                              <MoreVertical size={16} />
                            </button>
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
                              <h4 className="text-white font-bold line-clamp-2 flex-1 mr-2">
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
                            
                            <p className="text-gray-400 text-sm line-clamp-2">
                              {gig.description.split('\n\nPackage Includes:')[0]}
                            </p>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-blue-400 font-bold">
                                {gig.price} {gig.payment_token === 'EGLD' ? 'EGLD' : 'IDEA'}
                              </span>
                              <span className="text-gray-400 text-sm">
                                {gig.duration} days
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* My Orders - Only for own profile */}
            {isOwnProfile && (
              <Card className="p-6" title="My Orders" reference="#">
                <h3 className="text-lg font-bold text-white mb-6">Recent Orders</h3>
                
                {orders?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No orders yet.</p>
                    <Button
                      onClick={() => navigate('/gigs')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                      Browse Gigs
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders?.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-600 hover:border-blue-500 transition-all duration-300 cursor-pointer"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-white font-medium mb-1">
                              {order.gig?.title || 'Custom Project'}
                            </h4>
                            <p className="text-gray-400 text-sm">
                              {order.amount} {order.payment_token || 'EGLD'} • {order.status}
                            </p>
                          </div>
                          <span className="text-gray-400 text-sm">
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Right Column - Only for own profile */}
          {isOwnProfile && (
            <div className="space-y-8">
              {/* Settings */}
              <Card className="p-6" title="Settings" reference="#">
                <h3 className="text-lg font-bold text-white mb-4">Settings</h3>
                <div className="space-y-4">
                  <EmailNotificationsToggle enabled={profile.email_notifications_enabled || false} />
                </div>
              </Card>

              {/* Notifications */}
              <Card className="p-6" title="Notifications" reference="#">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button
                      onClick={handleMarkAllAsRead}
                      className="text-blue-400 hover:text-blue-300 bg-transparent border-none text-sm"
                    >
                      Mark all as read ({unreadCount})
                    </Button>
                  )}
                </div>
                
                {notifications?.length === 0 ? (
                  <p className="text-gray-400">No notifications</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {notifications?.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-700 transition-colors ${
                          !notification.read 
                            ? 'bg-gray-800 border-blue-500' 
                            : 'bg-gray-800 bg-opacity-50 border-gray-600'
                        }`}
                      >
                        <div className="space-y-1">
                          <p className={`text-sm ${
                            !notification.read ? 'text-white font-medium' : 'text-gray-300'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-gray-400 text-xs line-clamp-2">
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
              </Card>
            </div>
          )}
        </div>
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
    </div>
  );
};