import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Zap, Target, TrendingUp, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminService, AdminStats as AdminStatsType } from '../services/adminService';

export const AdminStats: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchStats();
    }
  }, [user?.isAdmin]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const adminStats = await AdminService.getAdminStats();
      setStats(adminStats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-orbitron font-bold text-white">Game Statistics</h2>
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-700/50 p-6 rounded-xl border border-cyan-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
              <Users size={24} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Players</p>
              <p className="text-white text-2xl font-orbitron font-bold">{stats?.totalUsers || 0}</p>
            </div>
          </div>
          <p className="text-gray-400 text-xs">
            +{stats?.newUsersThisWeek || 0} this week
          </p>
        </div>

        <div className="bg-slate-700/50 p-6 rounded-xl border border-purple-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
              <Zap size={24} className="text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total ZEN Mined</p>
              <p className="text-white text-2xl font-orbitron font-bold">
                {stats?.totalZenMined?.toLocaleString() || 0}
              </p>
            </div>
          </div>
          <p className="text-gray-400 text-xs">
            {stats?.totalZenBalance?.toLocaleString() || 0} in circulation
          </p>
        </div>

        <div className="bg-slate-700/50 p-6 rounded-xl border border-green-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <Target size={24} className="text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Active Tasks</p>
              <p className="text-white text-2xl font-orbitron font-bold">{stats?.activeTasks || 0}</p>
            </div>
          </div>
          <p className="text-gray-400 text-xs">
            {stats?.completedTasks || 0} completed
          </p>
        </div>

        <div className="bg-slate-700/50 p-6 rounded-xl border border-orange-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
              <Star size={24} className="text-orange-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Avg Level</p>
              <p className="text-white text-2xl font-orbitron font-bold">{stats?.averageLevel || 1}</p>
            </div>
          </div>
          <p className="text-gray-400 text-xs">
            {stats?.totalShips || 0} total ships
          </p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-700/50 p-6 rounded-xl border border-gray-600/50">
          <h3 className="text-lg font-orbitron font-bold text-white mb-4">
            Referral Program Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Referrals:</span>
              <span className="text-white font-orbitron font-bold">{stats?.totalReferrals || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Referral Rate:</span>
              <span className="text-white font-orbitron font-bold">
                {stats?.totalUsers && stats.totalUsers > 0 ? Math.round((stats.totalReferrals / stats.totalUsers) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-700/50 p-6 rounded-xl border border-gray-600/50">
          <h3 className="text-lg font-orbitron font-bold text-white mb-4">
            Mining Activity
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Ships:</span>
              <span className="text-white font-orbitron font-bold">{stats?.totalShips || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Ships per Player:</span>
              <span className="text-white font-orbitron font-bold">
                {stats?.totalUsers && stats.totalUsers > 0 ? Math.round((stats.totalShips / stats.totalUsers) * 10) / 10 : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};