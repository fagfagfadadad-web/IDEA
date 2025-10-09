import React, { useState, useRef } from 'react';
import { User, Edit, Save, X, Zap, Trophy, Star, Users, Camera, Heart, Wallet, Upload, Loader } from 'lucide-react';
import { Button } from 'components';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { UserService } from '../../services/userService';
import { StorageService } from '../../services/storageService';
import { UnlockPanelManager } from 'lib';

export const Profile = () => {
  const { user, refreshUser } = useAuth();
  const { gameStats, ships } = useGame();
  const { success, error } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [isLinkingWallet, setIsLinkingWallet] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '',
    twitterUrl: user?.twitterUrl || '',
    githubUrl: user?.githubUrl || '',
    linkedinUrl: user?.linkedinUrl || '',
    websiteUrl: user?.websiteUrl || ''
  });

  const handleSave = async () => {
    if (!user?.id) {
      error('User not found. Please try logging in again.');
      return;
    }

    try {
      await UserService.updateUser(user?.id || '', formData);
      await refreshUser();

      success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      fullName: user?.fullName || '',
      bio: user?.bio || '',
      avatarUrl: user?.avatarUrl || '',
      twitterUrl: user?.twitterUrl || '',
      githubUrl: user?.githubUrl || '',
      linkedinUrl: user?.linkedinUrl || '',
      websiteUrl: user?.websiteUrl || ''
    });
    setIsEditing(false);
    setShowAvatarUpload(false);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setIsUploadingAvatar(true);

    try {
      const downloadURL = await StorageService.uploadAvatar(user.id, file);

      await UserService.updateUser(user.id, { avatarUrl: downloadURL });
      await refreshUser();

      setFormData({ ...formData, avatarUrl: downloadURL });
      success('Profile picture updated successfully!');
      setShowAvatarUpload(false);
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      error(err.message || 'Failed to upload profile picture');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleLinkWallet = async () => {
    if (!user?.id) {
      error('User not found. Please try logging in again.');
      return;
    }

    setIsLinkingWallet(true);
    try {
      const unlockPanelManager = UnlockPanelManager.init({
        loginHandler: async () => {
          console.log('🔗 Profile: Wallet connection initiated');

          setTimeout(async () => {
            await refreshUser();
            success('Wallet linked successfully!');
            setIsLinkingWallet(false);
          }, 1500);
        },
        onClose: () => {
          setIsLinkingWallet(false);
        }
      });

      await unlockPanelManager.openUnlockPanel();
    } catch (err: any) {
      console.error('Error linking wallet:', err);
      error(err.message || 'Failed to link wallet');
      setIsLinkingWallet(false);
    }
  };

  const achievements = [
    {
      title: 'First Feeding',
      description: 'Feed your first dog',
      unlocked: (gameStats?.totalMined || 0) > 0,
      icon: '🍖'
    },
    {
      title: 'Dog Lover',
      description: 'Own 3 or more dogs',
      unlocked: ships.length >= 3,
      icon: '🐕'
    },
    {
      title: 'Food Collector',
      description: 'Collect 1,000,000 food points',
      unlocked: (gameStats?.totalMined || 0) >= 1000000,
      icon: '🏆'
    },
    {
      title: 'Friend Maker',
      description: 'Invite 10 friends to play',
      unlocked: (gameStats?.totalReferrals || 0) >= 10,
      icon: '👥'
    }
  ];

  return (
    <div className="page-bg font-inter">
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="title-responsive font-inter font-bold gradient-text">
              Your Profile
            </h1>
            <p className="text-gray-700 text-lg font-inter">
              Manage your account and view your pet care achievements
            </p>
          </div>

          {/* Profile Card */}
          <div className="cute-card p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden relative bg-gradient-to-r from-primary-400 to-primary-600 border-4 border-white shadow-lg">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-6xl">👤</div>';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        👤
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAvatarUpload(true)}
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-600 transition-colors"
                  >
                    <Camera size={16} />
                  </button>

                  {/* Avatar Upload Modal */}
                  {showAvatarUpload && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm"
                        onClick={() => !isUploadingAvatar && setShowAvatarUpload(false)}
                      />

                      {/* Modal */}
                      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md rounded-2xl shadow-2xl z-50 overflow-hidden" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/20">
                          <div>
                            <h3 className="text-white font-bold text-xl font-inter">Change Profile Picture</h3>
                            <p className="text-white/80 text-sm font-inter mt-1">Upload a photo (JPG, PNG, GIF, WebP)</p>
                          </div>
                          <button
                            onClick={() => !isUploadingAvatar && setShowAvatarUpload(false)}
                            disabled={isUploadingAvatar}
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            <X size={20} className="text-white" />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                          <div
                            onClick={triggerFileInput}
                            className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center cursor-pointer hover:border-white/50 hover:bg-white/5 transition-all"
                          >
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                                {isUploadingAvatar ? (
                                  <Loader size={32} className="text-white animate-spin" />
                                ) : (
                                  <Upload size={32} className="text-white" />
                                )}
                              </div>
                              <div>
                                <p className="text-white font-semibold font-inter mb-1">
                                  {isUploadingAvatar ? 'Uploading...' : 'Click to upload photo'}
                                </p>
                                <p className="text-white/70 text-sm font-inter">
                                  Maximum file size: 5MB
                                </p>
                              </div>
                            </div>
                          </div>

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={isUploadingAvatar}
                          />
                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-3 p-6 border-t border-white/20 bg-black/10">
                          <button
                            onClick={() => !isUploadingAvatar && setShowAvatarUpload(false)}
                            disabled={isUploadingAvatar}
                            className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors duration-200 font-inter disabled:opacity-50"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="text-center">
                  <h2 className="text-2xl font-inter font-bold text-gray-800">
                    {user?.username}
                  </h2>
                  <p className="text-gray-600 font-inter">
                    Level {gameStats?.miningLevel || 1} Pet Caretaker
                  </p>
                </div>
              </div>

              {/* Profile Details */}
              <div className="flex-1 space-y-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-800 text-sm font-medium mb-2 font-inter">
                        Username
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        className="cute-input"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-800 text-sm font-medium mb-2 font-inter">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        className="cute-input"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-800 text-sm font-medium mb-2 font-inter">
                        Bio
                      </label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        className="cute-input"
                        rows={3}
                        placeholder="Tell us about your pet care journey..."
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleSave}
                        className="cute-button px-6 py-2"
                      >
                        <Save size={16} />
                        Save Changes
                      </Button>
                      <Button
                        onClick={handleCancel}
                        className="cute-button-outline px-6 py-2"
                      >
                        <X size={16} />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <p className="text-gray-600 font-inter">Full Name</p>
                        <p className="text-gray-800 text-lg font-inter">{user?.fullName || 'Not set'}</p>
                      </div>
                      <Button
                        onClick={() => setIsEditing(true)}
                        className="cute-button-outline px-4 py-2"
                      >
                        <Edit size={16} />
                        Edit Profile
                      </Button>
                    </div>

                    <div>
                      <p className="text-gray-600 font-inter">Bio</p>
                      <p className="text-gray-800 font-inter">{user?.bio || 'Pet lover and caretaker 🐕'}</p>
                    </div>

                    <div>
                      <p className="text-gray-600 font-inter mb-2">Wallet Address</p>
                      {user?.walletAddress ? (
                        <p className="text-primary-600 font-mono text-sm break-all">
                          <span title={user.walletAddress}>
                            {user.walletAddress.substring(0, 12)}...{user.walletAddress.substring(user.walletAddress.length - 8)}
                          </span>
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-gray-500 font-inter text-sm mb-3">
                            Link your MultiversX wallet to access blockchain features
                          </p>
                          <Button
                            onClick={handleLinkWallet}
                            disabled={isLinkingWallet}
                            className="cute-button px-4 py-2 flex items-center gap-2"
                          >
                            <Wallet size={16} />
                            {isLinkingWallet ? 'Connecting...' : 'Link Wallet'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pet Care Stats */}
          <div className="cute-card p-6">
            <h2 className="text-2xl font-inter font-bold text-gray-800 mb-6">Pet Care Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-primary-500 text-xl">🍖</span>
                  <span className="text-gray-600 font-medium font-inter">Food Points</span>
                </div>
                <div className="text-2xl md:text-3xl font-inter font-bold text-primary-600">
                  {gameStats?.zenBalance?.toLocaleString() || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Heart className="text-accent-500" size={20} />
                  <span className="text-gray-600 font-medium font-inter">Love Given</span>
                </div>
                <div className="text-2xl md:text-3xl font-inter font-bold text-accent-600">
                  {gameStats?.totalMined?.toLocaleString() || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="text-success" size={20} />
                  <span className="text-gray-600 font-medium font-inter">Care Level</span>
                </div>
                <div className="text-2xl md:text-3xl font-inter font-bold text-success">
                  {gameStats?.miningLevel || 1}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="text-warning" size={20} />
                  <span className="text-gray-600 font-medium font-inter">Friends</span>
                </div>
                <div className="text-2xl md:text-3xl font-inter font-bold text-warning">
                  {gameStats?.totalReferrals || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="cute-card p-6">
            <h2 className="text-2xl font-inter font-bold text-gray-800 mb-6">Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    achievement.unlocked
                      ? 'border-primary-400'
                      : 'border-primary-300/40'
                  }`}
                  style={{
                    background: achievement.unlocked ? '#7C3AED' : 'rgba(124, 58, 237, 0.3)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-inter font-bold text-white">
                        {achievement.title}
                      </h3>
                      <p className="text-white/90 text-sm font-inter">
                        {achievement.description}
                      </p>
                    </div>
                    {achievement.unlocked && (
                      <div className="text-secondary-400">
                        <Trophy size={20} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dog Pack Overview */}
          <div className="cute-card p-6">
            <h2 className="text-2xl font-inter font-bold text-gray-800 mb-6">My Dog Pack</h2>
            {ships.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 text-6xl mb-4">🐕</div>
                <h3 className="text-xl font-inter font-bold text-gray-600 mb-2">No Dogs Yet</h3>
                <p className="text-gray-500 font-inter">You don't have any dogs yet. Adopt your first dog to start the pet care journey!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ships.map((ship) => (
                  <div
                    key={ship.id}
                    className="rounded-lg p-4 border-2 border-primary-400"
                    style={{ background: '#7C3AED' }}
                  >
                    <h3 className="text-white font-inter font-bold mb-2">{ship.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/90 font-inter">Level:</span>
                        <span className="text-white font-bold font-inter">{ship.level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/90 font-inter">Appetite:</span>
                        <span className="text-secondary-400 font-bold font-inter">{ship.miningPower}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/90 font-inter">Happiness:</span>
                        <span className="text-secondary-400 font-bold font-inter">
                          {ship.currentEnergy}/{ship.energyCapacity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
