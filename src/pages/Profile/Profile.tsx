import React, { useState } from 'react';
import { User, Edit, Save, X, Zap, Trophy, Star, Users, Camera, Heart } from 'lucide-react';
import { Button } from 'components';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { UserService } from '../../services/userService';

// Dog avatar options
const dogAvatars = [
  '🐕', '🐶', '🦮', '🐕‍🦺', '🐩', '🐺', '🦊', '🐾',
  '🐕‍🦺', '🦴', '🎾', '🥎', '🏆', '⭐', '💎', '👑'
];

export const Profile = () => {
  const { user, refreshUser } = useAuth();
  const { gameStats, ships } = useGame();
  const { success, error } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '🐕',
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

      // Refresh user data in context
      await refreshUser();
      
      success('Profile updated successfully!');
      setIsEditing(false);
      setShowAvatarPicker(false);
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
      avatarUrl: user?.avatarUrl || '🐕',
      twitterUrl: user?.twitterUrl || '',
      githubUrl: user?.githubUrl || '',
      linkedinUrl: user?.linkedinUrl || '',
      websiteUrl: user?.websiteUrl || ''
    });
    setIsEditing(false);
    setShowAvatarPicker(false);
  };

  const selectAvatar = (avatar: string) => {
    setFormData({ ...formData, avatarUrl: avatar });
    // Don't close picker immediately, let user see the selection
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
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      {user?.avatarUrl || '🐕'}
                    </div>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                      className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-600 transition-colors"
                    >
                      <Camera size={16} />
                    </button>
                  )}
                  
                  {/* Avatar Picker */}
                  {showAvatarPicker && (
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl border-2 border-primary-500 p-6 z-50 min-w-[280px]">
                      <h3 className="text-gray-800 font-bold mb-4 text-center font-inter text-lg">Choose Your Avatar</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {dogAvatars.map((avatar, index) => (
                          <button
                            key={index}
                            onClick={() => selectAvatar(avatar)}
                            className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl hover:bg-primary-100 transition-all duration-200 hover:scale-110 ${
                              formData.avatarUrl === avatar ? 'bg-primary-200 border-2 border-primary-500' : 'border border-gray-300'
                            }`}
                          >
                            {avatar}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowAvatarPicker(false)}
                        className="mt-4 w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200"
                      >
                        Close
                      </button>
                    </div>
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
                      <p className="text-gray-600 font-inter">Wallet Address</p>
                      <p className="text-primary-600 font-mono text-sm">
                        {user?.walletAddress ? (
                          <span title={user.walletAddress}>
                            {user.walletAddress.substring(0, 12)}...{user.walletAddress.substring(user.walletAddress.length - 8)}
                          </span>
                        ) : (
                          'Not connected'
                        )}
                      </p>
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