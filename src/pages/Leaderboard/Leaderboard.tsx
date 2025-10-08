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
        return <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">{rank}</div>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 border-yellow-400 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 border-gray-400 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-amber-600 border-amber-500 text-white';
      default:
        return 'bg-purple-600 border-purple-500 text-white';
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
    <div className="page-bg font-inter min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-4xl">
        <div className="space-y-4 sm:space-y-8">
          {/* Header */}
          <div className="text-center space-y-2 sm:space-y-4 px-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-inter font-bold gradient-text">
              Pet Care Champions
            </h1>
            <p className="text-gray-700 text-sm sm:text-base md:text-lg font-inter">
              See how you rank against other pet care enthusiasts
            </p>
          </div>

          {/* Tabs */}
          <div className="cute-card overflow-hidden">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap border-b border-primary-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-0 px-2 sm:px-4 py-3 sm:py-4 font-inter text-xs sm:text-sm font-bold transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-b-2 border-purple-400'
                      : 'text-gray-700 hover:text-purple-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <span className="text-sm sm:text-base">{getFieldIcon(tab.field)}</span>
                    <span className="truncate">{tab.label}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-3 sm:p-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400"></div>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {leaderboard.map((entry, index) => {
                    const rank = index + 1;
                    const isCurrentUser = entry.userId === user?.id;
                    const currentTab = tabs[activeTab];
                    
                    return (
                      <div
                        key={entry.userId}
                        className={`p-3 sm:p-4 rounded-xl border transition-all duration-300 hover:transform hover:scale-[1.02] ${
                          isCurrentUser
                            ? 'border-yellow-400 bg-yellow-500 shadow-lg text-white'
                            : getRankBg(rank)
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                            <div className="flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 flex-shrink-0">
                              {getRankIcon(rank)}
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden relative bg-gradient-to-r from-primary-400 to-primary-600 flex-shrink-0">
                                <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl">
                                  {entry.user?.avatarUrl || '🐕'}
                                </div>
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="font-inter font-bold text-sm sm:text-base truncate text-white">
                                  {entry.user?.username || 'Anonymous'}
                                  {isCurrentUser && (
                                    <span className="ml-1 sm:ml-2 text-yellow-200 text-xs sm:text-sm font-inter">(You)</span>
                                  )}
                                </div>
                                <div className="text-white/80 text-xs sm:text-sm font-inter">
                                  Level {entry.miningLevel}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <div className="flex items-center gap-1 text-sm sm:text-lg font-inter font-bold text-white whitespace-nowrap">
                              <span className="hidden sm:inline">{getFieldIcon(currentTab.field)}</span>
                              {formatValue(entry[currentTab.field as keyof GameStats] as number || 0, currentTab.field)}
                              {(currentTab.field === 'zenBalance' || currentTab.field === 'totalMined') && (
                                <span className="text-yellow-300 ml-1 font-inter hidden sm:inline">Food</span>
                              )}
                            </div>
                            <div className="text-white/80 text-xs sm:text-sm font-inter">
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