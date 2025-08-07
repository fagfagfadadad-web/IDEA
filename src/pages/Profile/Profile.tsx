import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Edit, 
  Save, 
  X, 
  Star, 
  Calendar, 
  MapPin, 
  Globe, 
  Github, 
  Linkedin, 
  Twitter,
  Settings,
  Briefcase,
  DollarSign,
  Clock,
  Eye,
  Plus,
  Coins
} from 'lucide-react';
import { Button, Card, EmailNotificationsToggle, ReviewsList, GigViewsStats } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useGigs } from '../../hooks/useGigs';
import { useReviewsForProvider } from '../../hooks/useReviews';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const Profile = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { user: currentUser } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  
  // Determine if this is own profile or viewing someone else's
  const isOwnProfile = !id || id === currentUser?.id;
  const profileId = isOwnProfile ? undefined : id;
  
  // Get active tab from URL params
  const activeTabParam = searchParams.get('tab');
  const getInitialTab = () => {
    if (activeTabParam === 'settings') return 2;
    if (activeTabParam === 'gigs') return 1;
    return 0; // overview
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    bio: '',
    twitter_url: '',
    github_url: '',
    linkedin_url: '',
    website_url: ''
  });

  // Real hooks
  const { data: profile, isLoading, error, refetch } = useProfile(profileId);
  const { data: userGigs, isLoading: gigsLoading } = useGigs();
  const { data: reviews, isLoading: reviewsLoading, error: reviewsError } = useReviewsForProvider(profileId || currentUser?.id || '');
  const updateProfile = useUpdateProfile();

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [activeTabParam]);

  // Initialize edit form when profile loads
  useEffect(() => {
    if (profile && isOwnProfile) {
      setEditForm({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        twitter_url: profile.twitter_url || '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        website_url: profile.website_url || ''
      });
    }
  }, [profile, isOwnProfile]);

  const handleTabChange = (tabIndex: number) => {
    setActiveTab(tabIndex);
    const tabNames = ['overview', 'gigs', 'settings'];
    const newParams = new URLSearchParams(searchParams);
    if (tabIndex === 0) {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tabNames[tabIndex]);
    }
    navigate(`${window.location.pathname}?${newParams.toString()}`, { replace: true });
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form to original values
      if (profile) {
        setEditForm({
          username: profile.username || '',
          full_name: profile.full_name || '',
          bio: profile.bio || '',
          twitter_url: profile.twitter_url || '',
          github_url: profile.github_url || '',
          linkedin_url: profile.linkedin_url || '',
          website_url: profile.website_url || ''
        });
      }
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(editForm);
      setIsEditing(false);
      showSuccessToast('Profile updated successfully');
      refetch();
    } catch (error) {
      console.error('Error updating profile:', error);
      showErrorToast('Error updating profile');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const formatUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  const tabs = [
    { id: 0, label: 'Overview', icon: <User size={16} /> },
    { id: 1, label: 'Gigs', icon: <Briefcase size={16} /> },
  ];

  // Add settings tab only for own profile
  if (isOwnProfile) {
    tabs.push({ id: 2, label: 'Settings', icon: <Settings size={16} /> });
  }

  if (!isLoggedIn && isOwnProfile) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="gradient-card p-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-yellow-600 mr-2">⚠️</span>
              <span className="text-yellow-800 font-medium">Please log in to view your profile.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="gradient-card p-8">
          <div className="flex justify-center">
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-700">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || (!profile && !isOwnProfile)) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="gradient-card p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <span className="text-red-700 font-medium">
                {error ? `Error: ${error.message}` : 'Profile not found'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayProfile = profile || currentUser;
  const averageRating = calculateAverageRating();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="gradient-card p-8">
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-24 h-24 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-400 to-pink-400 flex-shrink-0">
                  {displayProfile?.avatar_url ? (
                    <>
                      <img
                        src={displayProfile.avatar_url}
                        alt={displayProfile.username || "User"}
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
                        className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-2xl font-bold text-white absolute inset-0"
                        style={{ display: 'none' }}
                      >
                        {displayProfile?.username?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-2xl font-bold text-white">
                      {displayProfile?.username?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            name="username"
                            value={editForm.username}
                            onChange={handleInputChange}
                            placeholder="Username"
                            className="text-2xl font-bold bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <input
                            type="text"
                            name="full_name"
                            value={editForm.full_name}
                            onChange={handleInputChange}
                            placeholder="Full Name"
                            className="text-lg bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      ) : (
                        <div>
                          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                            {displayProfile?.username || 'Unknown User'}
                          </h1>
                          {displayProfile?.full_name && (
                            <p className="text-lg text-gray-600">{displayProfile.full_name}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {isOwnProfile && (
                      <div className="flex gap-3">
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
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          >
                            <Edit size={16} />
                            Edit Profile
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  <div>
                    {isEditing ? (
                      <textarea
                        name="bio"
                        value={editForm.bio}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself..."
                        rows={3}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    ) : (
                      <p className="text-gray-700">
                        {displayProfile?.bio || 'No bio available'}
                      </p>
                    )}
                  </div>

                  {/* Social Links */}
                  <div className="flex flex-wrap gap-4">
                    {isEditing ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <input
                          type="url"
                          name="website_url"
                          value={editForm.website_url}
                          onChange={handleInputChange}
                          placeholder="Website URL"
                          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <input
                          type="url"
                          name="twitter_url"
                          value={editForm.twitter_url}
                          onChange={handleInputChange}
                          placeholder="Twitter URL"
                          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <input
                          type="url"
                          name="github_url"
                          value={editForm.github_url}
                          onChange={handleInputChange}
                          placeholder="GitHub URL"
                          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <input
                          type="url"
                          name="linkedin_url"
                          value={editForm.linkedin_url}
                          onChange={handleInputChange}
                          placeholder="LinkedIn URL"
                          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    ) : (
                      <>
                        {displayProfile?.website_url && (
                          <a
                            href={formatUrl(displayProfile.website_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors"
                          >
                            <Globe size={16} />
                            Website
                          </a>
                        )}
                        {displayProfile?.twitter_url && (
                          <a
                            href={formatUrl(displayProfile.twitter_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors"
                          >
                            <Twitter size={16} />
                            Twitter
                          </a>
                        )}
                        {displayProfile?.github_url && (
                          <a
                            href={formatUrl(displayProfile.github_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-gray-800 hover:text-gray-900 transition-colors"
                          >
                            <Github size={16} />
                            GitHub
                          </a>
                        )}
                        {displayProfile?.linkedin_url && (
                          <a
                            href={formatUrl(displayProfile.linkedin_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-700 hover:text-blue-800 transition-colors"
                          >
                            <Linkedin size={16} />
                            LinkedIn
                          </a>
                        )}
                      </>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">{userGigs?.length || 0}</p>
                      <p className="text-gray-600 text-sm">Active Gigs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">{reviews?.length || 0}</p>
                      <p className="text-gray-600 text-sm">Reviews</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">
                        {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                      </p>
                      <p className="text-gray-600 text-sm">Avg Rating</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">
                        {displayProfile?.created_at ? new Date(displayProfile.created_at).getFullYear() : 'N/A'}
                      </p>
                      <p className="text-gray-600 text-sm">Member Since</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="gradient-card overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="flex overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-indigo-600'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-8">
              {/* Overview Tab */}
              {activeTab === 0 && (
                <div className="space-y-8">
                  {/* Recent Gigs */}
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-800">
                        {isOwnProfile ? 'My Gigs' : 'Gigs'}
                      </h3>
                      {isOwnProfile && (
                        <Button
                          onClick={() => navigate('/create-gig')}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                          <Plus size={16} />
                          Create Gig
                        </Button>
                      )}
                    </div>

                    {gigsLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : !userGigs || userGigs.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Briefcase size={24} className="text-gray-400" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-800 mb-2">
                          {isOwnProfile ? 'No gigs yet' : 'No gigs available'}
                        </h4>
                        <p className="text-gray-600">
                          {isOwnProfile 
                            ? 'Create your first gig to start offering your services.' 
                            : 'This user hasn\'t created any gigs yet.'}
                        </p>
                        {isOwnProfile && (
                          <Button
                            onClick={() => navigate('/create-gig')}
                            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
                          >
                            <Plus size={16} />
                            Create Your First Gig
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userGigs.slice(0, 6).map((gig) => {
                          const paymentToken = gig.payment_token || 'EGLD';
                          const tokenSymbol = paymentToken === 'EGLD' ? 'EGLD' : 'IDEA';
                          const tokenIcon = paymentToken === 'EGLD' ? <DollarSign size={14} /> : <Coins size={14} />;

                          return (
                            <div
                              key={gig.id}
                              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
                              onClick={() => navigate(`/gigs/${gig.id}`)}
                            >
                              <img
                                src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                                alt={gig.title}
                                className="w-full h-32 object-cover"
                              />
                              <div className="p-4 space-y-3">
                                <h4 className="text-lg font-bold text-gray-800 line-clamp-2">
                                  {gig.title}
                                </h4>
                                <p className="text-gray-600 text-sm line-clamp-2">
                                  {gig.description}
                                </p>
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-1">
                                    {tokenIcon}
                                    <span className="text-indigo-600 font-bold">
                                      {gig.price} {tokenSymbol}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock size={14} className="text-gray-400" />
                                    <span className="text-gray-600 text-sm">
                                      {gig.duration} days
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    gig.status === 'active' ? 'bg-green-100 text-green-800' :
                                    gig.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {gig.status}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Eye size={14} className="text-gray-400" />
                                    <span className="text-gray-600 text-sm">
                                      {gig.view_count || 0}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Reviews */}
                  <div>
                    <ReviewsList 
                      reviews={reviews || []}
                      isLoading={reviewsLoading}
                      error={reviewsError}
                      showTitle={true}
                    />
                  </div>
                </div>
              )}

              {/* Gigs Tab */}
              {activeTab === 1 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">
                      {isOwnProfile ? 'My Gigs' : `${displayProfile?.username}'s Gigs`}
                    </h3>
                    {isOwnProfile && (
                      <Button
                        onClick={() => navigate('/create-gig')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Create New Gig
                      </Button>
                    )}
                  </div>

                  {gigsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : !userGigs || userGigs.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase size={24} className="text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-800 mb-2">No gigs available</h4>
                      <p className="text-gray-600">
                        {isOwnProfile 
                          ? 'Start by creating your first gig to showcase your skills.' 
                          : 'This user hasn\'t created any gigs yet.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userGigs.map((gig) => {
                        const paymentToken = gig.payment_token || 'EGLD';
                        const tokenSymbol = paymentToken === 'EGLD' ? 'EGLD' : 'IDEA';
                        const tokenIcon = paymentToken === 'EGLD' ? <DollarSign size={14} /> : <Coins size={14} />;

                        return (
                          <div
                            key={gig.id}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200"
                          >
                            <img
                              src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                              alt={gig.title}
                              className="w-full h-48 object-cover cursor-pointer"
                              onClick={() => navigate(`/gigs/${gig.id}`)}
                            />
                            <div className="p-4 space-y-3">
                              <h4 className="text-lg font-bold text-gray-800 line-clamp-2">
                                {gig.title}
                              </h4>
                              <p className="text-gray-600 text-sm line-clamp-2">
                                {gig.description}
                              </p>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1">
                                  {tokenIcon}
                                  <span className="text-indigo-600 font-bold">
                                    {gig.price} {tokenSymbol}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock size={14} className="text-gray-400" />
                                  <span className="text-gray-600 text-sm">
                                    {gig.duration} days
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  gig.status === 'active' ? 'bg-green-100 text-green-800' :
                                  gig.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {gig.status}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Eye size={14} className="text-gray-400" />
                                  <span className="text-gray-600 text-sm">
                                    {gig.view_count || 0} views
                                  </span>
                                </div>
                              </div>
                              
                              {isOwnProfile && (
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    onClick={() => navigate(`/gigs/${gig.id}`)}
                                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-lg text-sm"
                                  >
                                    View
                                  </Button>
                                  <Button
                                    onClick={() => navigate(`/gigs/${gig.id}/edit`)}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-lg text-sm"
                                  >
                                    Edit
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab - Only for own profile */}
              {activeTab === 2 && isOwnProfile && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Account Settings</h3>
                    
                    <div className="space-y-6">
                      {/* Email Notifications */}
                      <div className="bg-gray-800 rounded-lg p-6">
                        <h4 className="text-lg font-bold text-white mb-4">Email Notifications</h4>
                        <EmailNotificationsToggle 
                          enabled={displayProfile?.email_notifications_enabled || false}
                          currentEmail={displayProfile?.email || ''}
                          onEmailUpdated={(newEmail) => {
                            // Refresh profile data after email update
                            refetch();
                          }}
                        />
                      </div>

                      {/* Account Information */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-bold text-gray-800 mb-4">Account Information</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">
                              User ID
                            </label>
                            <p className="text-gray-600 text-sm font-mono bg-gray-100 p-2 rounded">
                              {displayProfile?.id}
                            </p>
                          </div>
                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">
                              Wallet Address
                            </label>
                            <p className="text-gray-600 text-sm font-mono bg-gray-100 p-2 rounded">
                              {displayProfile?.wallet_address || 'Not connected'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">
                              Member Since
                            </label>
                            <p className="text-gray-600 text-sm">
                              {displayProfile?.created_at 
                                ? new Date(displayProfile.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })
                                : 'Unknown'
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Gig Analytics - Only show if user has gigs */}
                      {userGigs && userGigs.length > 0 && (
                        <div className="bg-gray-800 rounded-lg p-6">
                          <h4 className="text-lg font-bold text-white mb-4">Gig Analytics</h4>
                          <div className="space-y-6">
                            {userGigs.slice(0, 3).map((gig) => (
                              <div key={gig.id} className="border-b border-gray-600 last:border-b-0 pb-4 last:pb-0">
                                <div className="flex justify-between items-center mb-2">
                                  <h5 className="text-white font-medium">{gig.title}</h5>
                                  <Button
                                    onClick={() => navigate(`/gigs/${gig.id}`)}
                                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                                  >
                                    View
                                  </Button>
                                </div>
                                <GigViewsStats gigId={gig.id} showDetailed={false} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};