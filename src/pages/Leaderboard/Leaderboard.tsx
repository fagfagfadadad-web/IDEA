import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, TrendingUp, Zap, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GameService, GameStats } from '../../services/gameService';
import { UserService } from '../../services/userService';

interface LeaderboardEntry extends GameStats {
  user?: {
    username: string;
    avatarUrl?: string;
  };
}

export const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 0, label: 'Total Fed', field: 'totalMined' },
    { id: 1, label: 'Food Balance', field: 'zenBalance' },
    { id: 2, label: 'Care Level', field: 'miningLevel' },
    { id: 3, label: 'Friends', field: 'totalReferrals' }
  ];

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      
      const currentTab = tabs[activeTab];
      const gameStats = await GameService.getLeaderboard(currentTab.field);
      
      // Get user data for each entry
      const leaderboardWithUsers = await Promise.all(
        gameStats.map(async (stats) => {
          const userData = await UserService.getUser(stats.userId);
          return {
            ...stats,
            user: userData ? {
              username: userData.username,
              avatarUrl: userData.avatarUrl
            } : undefined
          };
        })
      );

      setLeaderboard(leaderboardWithUsers);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="text-yellow-500" size={24} />;
      case 2:
        return <Medal className="text-gray-400" size={24} />;
      case 3:
        return <Medal className="text-amber-600" size={24} />;
      default:
        return <div className="w-6 h-6 bg-primary-200 rounded-full flex items-center justify-center text-gray-700 text-sm font-bold">{rank}</div>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-400';
      case 2:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-400';
      case 3:
        return 'bg-gradient-to-r from-amber-100 to-amber-200 border-amber-500';
      default:
        return 'bg-white border-gray-300';
    }
  };

  const formatValue = (value: number, field: string) => {
    if (field === 'zenBalance' || field === 'totalMined') {
      return value.toLocaleString();
    }
    return value.toString();
  };

  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'totalMined':
        return <span className="text-primary-400 text-lg">🍖</span>;
      case 'zenBalance':
        return <span className="text-success text-lg">🍖</span>;
      case 'miningLevel':
        return <Star className="text-accent-500" size={16} />;
      case 'totalReferrals':
        return <TrendingUp className="text-warning" size={16} />;
      default:
        return <Trophy className="text-gray-600" size={16} />;
    }
  };

  return (
    <div className="page-bg font-inter">
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="title-responsive font-inter font-bold gradient-text">
              Pet Care Champions
            </h1>
            <p className="text-gray-700 text-lg font-inter">
              See how you rank against other pet care enthusiasts
            </p>
          </div>

          {/* Tabs */}
          <div className="cute-card overflow-hidden">
            <div className="flex flex-wrap border-b border-primary-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[120px] px-4 py-4 font-inter font-bold transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary-200 to-primary-300 text-primary-700 border-b-2 border-primary-500'
                      : 'text-gray-600 hover:text-primary-600'
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboard.map((entry, index) => {
                    const rank = index + 1;
                    const isCurrentUser = entry.userId === user?.id;
                    const currentTab = tabs[activeTab];
                    
                    return (
                      <div
                        key={entry.userId}
                        className={`p-4 rounded-xl border transition-all duration-300 hover:transform hover:scale-[1.02] ${
                          isCurrentUser 
                            ? 'border-primary-400 bg-primary-100 shadow-lg'
                            : getRankBg(rank)
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12">
                              {getRankIcon(rank)}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden relative bg-gradient-to-r from-primary-400 to-primary-600">
                                <div className="w-full h-full flex items-center justify-center text-2xl">
                                  {entry.user?.avatarUrl || '🐕'}
                                </div>
                              </div>
                              
                              <div>
                                <div className={`font-inter font-bold ${
                                  isCurrentUser ? 'text-primary-600' : 'text-gray-800'
                                }`}>
                                  {entry.user?.username || 'Anonymous'}
                                  {isCurrentUser && (
                                    <span className="ml-2 text-primary-600 text-sm font-inter">(You)</span>
                                  )}
                                </div>
                                <div className="text-gray-600 text-sm font-inter">
                                  Level {entry.miningLevel}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-1 text-lg font-inter font-bold text-gray-800">
                              {getFieldIcon(currentTab.field)}
                              {formatValue(entry[currentTab.field as keyof GameStats] as number || 0, currentTab.field)}
                              {(currentTab.field === 'zenBalance' || currentTab.field === 'totalMined') && (
                                <span className="text-primary-600 ml-1 font-inter">Food</span>
                              )}
                            </div>
                            <div className="text-gray-600 text-sm font-inter">
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