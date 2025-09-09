import React, { useState } from 'react';
import { User, Edit, Save, X, Zap, Trophy, Star, Users } from 'lucide-react';
import { Button } from 'components';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';

export const Profile = () => {
  const { user } = useAuth();
  const { gameStats, ships } = useGame();
  const { success, error } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    full_name: user?.full_name || '',
    bio: user?.bio || '',
    twitter_url: user?.twitter_url || '',
    github_url: user?.github_url || '',
    linkedin_url: user?.linkedin_url || '',
    website_url: user?.website_url || ''
  });

  const handleSave = async () => {
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update(formData)
        .eq('id', user?.id);

      if (updateError) throw updateError;

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
      full_name: user?.full_name || '',
      bio: user?.bio || '',
      twitter_url: user?.twitter_url || '',
      github_url: user?.github_url || '',
      linkedin_url: user?.linkedin_url || '',
      website_url: user?.website_url || ''
    });
    setIsEditing(false);
  };

  const achievements = [
    { 
      title: 'First Miner', 
      description: 'Complete your first mining operation',
      unlocked: (gameStats?.total_mined || 0) > 0,
      icon: '⛏️'
    },
    { 
      title: 'Fleet Commander', 
      description: 'Own 3 or more ships',
      unlocked: ships.length >= 3,
      icon: '🚀'
    },
    { 
      title: 'ZEN Millionaire', 
      description: 'Accumulate 1,000,000 ZEN tokens',
      unlocked: (gameStats?.total_mined || 0) >= 1000000,
      icon: '💎'
    },
    { 
      title: 'Referral Master', 
      description: 'Refer 10 new players',
      unlocked: (gameStats?.total_referrals || 0) >= 10,
      icon: '👥'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 font-inter">
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-orbitron font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Player Profile
            </h1>
            <p className="text-gray-400 text-lg">
              Manage your account and view your mining achievements
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-cyan-500/20">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center space-y-4">
                <div className="w-32 h-32 rounded-full overflow-hidden relative bg-gradient-to-r from-cyan-400 to-purple-500">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-orbitron font-bold text-4xl">
                      {user?.username?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <h2 className="text-2xl font-orbitron font-bold text-white">
                    {user?.username}
                  </h2>
                  <p className="text-gray-400">
                    Level {gameStats?.mining_level || 1} Miner
                  </p>
                </div>
              </div>

              {/* Profile Details */}
              <div className="flex-1 space-y-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        className="w-full p-3 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        className="w-full p-3 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Bio
                      </label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        className="w-full p-3 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleSave}
                        className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-2 rounded-lg font-orbitron font-bold"
                      >
                        <Save size={16} />
                        Save Changes
                      </Button>
                      <Button
                        onClick={handleCancel}
                        className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg"
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
                        <p className="text-gray-400">Full Name</p>
                        <p className="text-white text-lg">{user?.full_name || 'Not set'}</p>
                      </div>
                      <Button
                        onClick={() => setIsEditing(true)}
                        className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg"
                      >
                        <Edit size={16} />
                        Edit Profile
                      </Button>
                    </div>
                    
                    <div>
                      <p className="text-gray-400">Bio</p>
                      <p className="text-white">{user?.bio || 'No bio set'}</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-400">Wallet Address</p>
                      <p className="text-cyan-400 font-mono text-sm">
                        {user?.wallet_address ? (
                          <span title={user.wallet_address}>
                            {user.wallet_address.substring(0, 12)}...{user.wallet_address.substring(user.wallet_address.length - 8)}
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

          {/* Game Stats */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-cyan-500/20">
            <h2 className="text-2xl font-orbitron font-bold text-white mb-6">Mining Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="text-cyan-400" size={20} />
                  <span className="text-gray-400 font-medium">ZEN Balance</span>
                </div>
                <div className="text-2xl md:text-3xl font-orbitron font-bold text-cyan-400">
                  {gameStats?.zen_balance?.toLocaleString() || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="text-purple-400" size={20} />
                  <span className="text-gray-400 font-medium">Total Mined</span>
                </div>
                <div className="text-2xl md:text-3xl font-orbitron font-bold text-purple-400">
                  {gameStats?.total_mined?.toLocaleString() || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="text-green-400" size={20} />
                  <span className="text-gray-400 font-medium">Mining Level</span>
                </div>
                <div className="text-2xl md:text-3xl font-orbitron font-bold text-green-400">
                  {gameStats?.mining_level || 1}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="text-orange-400" size={20} />
                  <span className="text-gray-400 font-medium">Referrals</span>
                </div>
                <div className="text-2xl md:text-3xl font-orbitron font-bold text-orange-400">
                  {gameStats?.total_referrals || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-cyan-500/20">
            <h2 className="text-2xl font-orbitron font-bold text-white mb-6">Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    achievement.unlocked
                      ? 'border-green-500/50 bg-green-500/10'
                      : 'border-gray-600/50 bg-slate-700/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h3 className={`font-orbitron font-bold ${
                        achievement.unlocked ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {achievement.title}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {achievement.description}
                      </p>
                    </div>
                    {achievement.unlocked && (
                      <div className="text-green-400">
                        <Trophy size={20} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fleet Overview */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-cyan-500/20">
            <h2 className="text-2xl font-orbitron font-bold text-white mb-6">Fleet Overview</h2>
            {ships.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 text-6xl mb-4">🚀</div>
                <h3 className="text-xl font-orbitron font-bold text-gray-400 mb-2">No Ships</h3>
                <p className="text-gray-500">You don't have any ships yet. Get your first ship to start mining!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ships.map((ship) => (
                  <div
                    key={ship.id}
                    className="bg-slate-700/50 rounded-lg p-4 border border-gray-600/50"
                  >
                    <h3 className="text-white font-orbitron font-bold mb-2">{ship.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Level:</span>
                        <span className="text-white font-bold">{ship.level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Mining Power:</span>
                        <span className="text-cyan-400 font-bold">{ship.mining_power}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Energy:</span>
                        <span className="text-green-400 font-bold">
                          {ship.current_energy}/{ship.energy_capacity}
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