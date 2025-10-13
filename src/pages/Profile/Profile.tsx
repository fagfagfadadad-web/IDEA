import React, { useState, useRef, useEffect } from 'react';
import { User, Edit, Save, X, Zap, Trophy, Star, Users, Camera, Heart, Wallet, Store, XCircle } from 'lucide-react';
import { Button } from 'components';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { UserService } from '../../services/userService';
import { UnlockPanelManager } from 'lib';
import { PetService } from '../../services/petService';
import { Pet } from '../../types/pet.types';

export const Profile = () => {
  const { user, refreshUser } = useAuth();
  const { gameStats } = useGame();
  const { success, error } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLinkingWallet, setIsLinkingWallet] = useState(false);
  const [listingPet, setListingPet] = useState<string | null>(null);
  const [listingPrice, setListingPrice] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);
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
    setShowEmojiPicker(false);
  };

  const availableEmojis = [
    '🐶', '🐕', '🦴', '🐾', '🎾', '🦮', '🐕‍🦺', '🐩',
    '🐱', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮',
    '🌟', '⭐', '💎', '🏆', '🎮', '🎯', '🚀', '💫',
    '🔥', '⚡', '💪', '🎪', '🎨', '🎭', '🎡', '🎢',
    '👑', '💰', '🌈', '☀️', '🌙', '✨', '💝', '🎁',
    '🍕', '🍔', '🍰', '🍦', '🍩', '🎂', '🧁', '🍪',
    '🎸', '🎹', '🎤', '🎧', '🎵', '🎶', '🎺', '🥁'
  ];

  const handleEmojiSelect = async (emoji: string) => {
    if (!user?.id) return;

    try {
      await UserService.updateUser(user.id, { avatarUrl: emoji });
      await refreshUser();

      setFormData({ ...formData, avatarUrl: emoji });
      success('Avatar updated successfully!');
      setShowEmojiPicker(false);
    } catch (err: any) {
      console.error('Error updating avatar:', err);
      error('Failed to update avatar');
    }
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

  useEffect(() => {
    if (user?.id) {
      loadPets();
    }
  }, [user?.id]);

  const loadPets = async () => {
    if (!user?.id) return;
    try {
      setPetsLoading(true);
      const userPets = await PetService.getUserPets(user.id);
      setPets(userPets);
    } catch (err) {
      console.error('Error loading pets:', err);
    } finally {
      setPetsLoading(false);
    }
  };

  const handleListPet = async (petDocId: string) => {
    if (!user?.id || !petDocId) return;

    const price = parseFloat(listingPrice);
    if (isNaN(price) || price <= 0) {
      error('Please enter a valid price');
      return;
    }

    setActionLoading(petDocId);
    try {
      await PetService.listPetOnMarket(petDocId, user.id, user.username || 'Unknown', price);
      await loadPets();
      success('Pet listed on marketplace!');
      setListingPet(null);
      setListingPrice('');
    } catch (err: any) {
      console.error('Error listing pet:', err);
      error(err.message || 'Failed to list pet');
    } finally {
      setActionLoading(null);
    }
  };

  const achievements = [
    {
      title: 'First Pet',
      description: 'Adopt your first pet',
      unlocked: pets.length > 0,
      icon: '🐕'
    },
    {
      title: 'Pet Lover',
      description: 'Own 3 or more pets',
      unlocked: pets.length >= 3,
      icon: '🐾'
    },
    {
      title: 'Pet Collector',
      description: 'Own 10 or more pets',
      unlocked: pets.length >= 10,
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
                  <div className="w-32 h-32 rounded-full overflow-hidden relative bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 border-4 border-white shadow-lg">
                    <div className="w-full h-full flex items-center justify-center text-7xl">
                      {user?.avatarUrl || '👤'}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEmojiPicker(true)}
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-600 transition-colors"
                  >
                    <Camera size={16} />
                  </button>

                  {/* Avatar Upload Modal */}
                  {showEmojiPicker && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm"
                        onClick={() => setShowEmojiPicker(false)}
                      />

                      {/* Modal */}
                      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-2xl rounded-3xl shadow-2xl z-50 overflow-hidden" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/20">
                          <div>
                            <h3 className="text-white font-bold text-2xl font-inter">Choose Your Avatar</h3>
                            <p className="text-white/90 text-sm font-inter mt-1">Pick an emoji that represents you! 56 options available</p>
                          </div>
                          <button
                            onClick={() => setShowEmojiPicker(false)}
                            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110"
                          >
                            <X size={24} className="text-white" />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <div className="grid grid-cols-10 gap-2">
                            {availableEmojis.map((emoji, index) => (
                              <button
                                key={index}
                                onClick={() => handleEmojiSelect(emoji)}
                                className={`w-10 h-10 rounded-lg bg-white/10 hover:bg-white/25 hover:scale-110 flex items-center justify-center text-xl transition-all duration-150 cursor-pointer ${
                                  formData.avatarUrl === emoji ? 'ring-2 ring-white scale-110 bg-white/30' : ''
                                }`}
                                title={emoji}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-3 p-6 border-t border-white/20 bg-black/10">
                          <button
                            onClick={() => setShowEmojiPicker(false)}
                            className="flex-1 py-4 px-6 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold transition-all duration-200 font-inter hover:scale-105"
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
                    Pet Collector
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

          {/* Pet Collection Stats */}
          <div className="cute-card p-6">
            <h2 className="text-2xl font-inter font-bold text-gray-800 mb-6">My Pet Collection</h2>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-primary-500 text-xl">🐕</span>
                  <span className="text-gray-600 font-medium font-inter">Total Pets</span>
                </div>
                <div className="text-2xl md:text-3xl font-inter font-bold text-primary-600">
                  {pets.length}
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

          {/* My Pets Overview */}
          <div className="cute-card p-6">
            <h2 className="text-2xl font-inter font-bold text-gray-800 mb-6">My Pets</h2>
            {petsLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">⏳</div>
                <p className="text-gray-500 font-inter">Loading pets...</p>
              </div>
            ) : pets.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 text-6xl mb-4">🐕</div>
                <h3 className="text-xl font-inter font-bold text-gray-600 mb-2">No Pets Yet</h3>
                <p className="text-gray-500 font-inter">You don't have any pets yet. Visit the NFT Market to adopt your first pet!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pets.map((pet) => (
                  <div
                    key={pet.id}
                    className="rounded-lg p-4 border-2 border-primary-400"
                    style={{ background: '#7C3AED' }}
                  >
                    <h3 className="text-white font-inter font-bold mb-2">{pet.name}</h3>
                    <div className="space-y-2 text-sm mb-3">
                      <div className="flex justify-between">
                        <span className="text-white/90 font-inter">Level:</span>
                        <span className="text-white font-bold font-inter">{pet.level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/90 font-inter">Breed:</span>
                        <span className="text-secondary-400 font-bold font-inter">{pet.breedType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/90 font-inter">Stage:</span>
                        <span className="text-secondary-400 font-bold font-inter">
                          {pet.evolutionStage}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/90 font-inter">Value:</span>
                        <span className="text-yellow-400 font-bold font-inter">
                          {pet.marketValue?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>

                    {listingPet === pet.id ? (
                      <div className="space-y-2">
                        <input
                          type="number"
                          value={listingPrice}
                          onChange={(e) => setListingPrice(e.target.value)}
                          placeholder="Enter price"
                          className="w-full px-3 py-2 rounded-lg text-gray-800 text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => pet.id && handleListPet(pet.id)}
                            disabled={actionLoading === pet.id}
                            className="flex-1 py-2 px-3 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {actionLoading === pet.id ? 'Listing...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => {
                              setListingPet(null);
                              setListingPrice('');
                            }}
                            className="flex-1 py-2 px-3 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => pet.id && setListingPet(pet.id)}
                        className="w-full py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Store size={16} />
                        List on Market
                      </button>
                    )}
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
