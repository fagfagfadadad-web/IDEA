import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, TrendingUp, Zap, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 0, label: 'Total Mined', field: 'total_mined' },
    { id: 1, label: 'ZEN Balance', field: 'zen_balance' },
    { id: 2, label: 'Mining Level', field: 'mining_level' },
    { id: 3, label: 'Referrals', field: 'total_referrals' }
  ];

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      
      const currentTab = tabs[activeTab];
      const { data, error } = await supabase
        .from('game_stats')
        .select(`
          *,
          user:users!game_stats_user_id_fkey(
            id,
            username,
            avatar_url
          )
        `)
        .order(currentTab.field, { ascending: false })
        .limit(100);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="text-yellow-400" size={24} />;
      case 2:
        return <Medal className="text-gray-300" size={24} />;
      case 3:
        return <Medal className="text-amber-600" size={24} />;
      default:
        return <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-gray-400 text-sm font-bold">{rank}</div>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/50';
      default:
        return 'bg-slate-700/30 border-gray-600/50';
    }
  };

  const formatValue = (value: number, field: string) => {
    if (field === 'zen_balance' || field === 'total_mined') {
      return value.toLocaleString();
    }
    return value.toString();
  };

  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'total_mined':
        return <Zap className="text-cyan-400" size={16} />;
      case 'zen_balance':
        return <Zap className="text-green-400" size={16} />;
      case 'mining_level':
        return <Star className="text-purple-400" size={16} />;
      case 'total_referrals':
        return <TrendingUp className="text-orange-400" size={16} />;
      default:
        return <Trophy className="text-gray-400" size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 font-inter">
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-orbitron font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Leaderboard
            </h1>
            <p className="text-gray-400 text-lg">
              See how you rank against other miners in the galaxy
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-cyan-500/20 overflow-hidden">
            <div className="flex flex-wrap border-b border-gray-700">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[120px] px-4 py-4 font-orbitron font-bold transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border-b-2 border-cyan-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {getFieldIcon(tab.field)}
                    {tab.label}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboard.map((entry, index) => {
                    const rank = index + 1;
                    const isCurrentUser = entry.user_id === user?.id;
                    const currentTab = tabs[activeTab];
                    
                    return (
                      <div
                        key={entry.user_id}
                        className={`p-4 rounded-xl border transition-all duration-300 hover:transform hover:scale-[1.02] ${
                          isCurrentUser 
                            ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
                            : getRankBg(rank)
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12">
                              {getRankIcon(rank)}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden relative bg-gradient-to-r from-cyan-400 to-purple-500">
                                {entry.user?.avatar_url ? (
                                  <img
                                    src={entry.user.avatar_url}
                                    alt={entry.user.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-white font-orbitron font-bold">
                                    {entry.user?.username?.charAt(0)?.toUpperCase() || '?'}
                                  </div>
                                )}
                              </div>
                              
                              <div>
                                <div className={`font-orbitron font-bold ${
                                  isCurrentUser ? 'text-cyan-400' : 'text-white'
                                }`}>
                                  {entry.user?.username || 'Anonymous'}
                                  {isCurrentUser && (
                                    <span className="ml-2 text-cyan-400 text-sm">(You)</span>
                                  )}
                                </div>
                                <div className="text-gray-400 text-sm">
                                  Level {entry.mining_level}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-1 text-lg font-orbitron font-bold text-white">
                              {getFieldIcon(currentTab.field)}
                              {formatValue(entry[currentTab.field] || 0, currentTab.field)}
                              {(currentTab.field === 'zen_balance' || currentTab.field === 'total_mined') && (
                                <span className="text-cyan-400 ml-1">ZEN</span>
                              )}
                            </div>
                            <div className="text-gray-400 text-sm">
                              Rank #{rank}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};