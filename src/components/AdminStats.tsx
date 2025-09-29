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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-inter font-bold text-gray-800">Pet Care Statistics</h2>
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="cute-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-primary-200 rounded-full flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-inter">Total Pet Owners</p>
              <p className="text-gray-800 text-2xl font-inter font-bold">{stats?.totalUsers || 0}</p>
            </div>
          </div>
          <p className="text-gray-600 text-xs font-inter">
            +{stats?.newUsersThisWeek || 0} this week
          </p>
        </div>

        <div className="cute-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center">
              <span className="text-2xl">🍖</span>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-inter">Total Food Given</p>
              <p className="text-gray-800 text-2xl font-inter font-bold">
                {stats?.totalZenMined?.toLocaleString() || 0}
              </p>
            </div>
          </div>
          <p className="text-gray-600 text-xs font-inter">
            {stats?.totalZenBalance?.toLocaleString() || 0} in circulation
          </p>
        </div>

        <div className="cute-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-accent-200 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-inter">Active Tasks</p>
              <p className="text-gray-800 text-2xl font-inter font-bold">{stats?.activeTasks || 0}</p>
            </div>
          </div>
          <p className="text-gray-600 text-xs font-inter">
            {stats?.completedTasks || 0} completed
          </p>
        </div>

        <div className="cute-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-warning rounded-full flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-inter">Avg Care Level</p>
              <p className="text-gray-800 text-2xl font-inter font-bold">{stats?.averageLevel || 1}</p>
            </div>
          </div>
          <p className="text-gray-600 text-xs font-inter">
            {stats?.totalShips || 0} total dogs
          </p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="cute-card p-6">
          <h3 className="text-lg font-inter font-bold text-gray-800 mb-4">
            Friends Program Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 font-inter">Total Friends:</span>
              <span className="text-gray-800 font-inter font-bold">{stats?.totalReferrals || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-inter">Friend Rate:</span>
              <span className="text-gray-800 font-inter font-bold">
                {stats?.totalUsers && stats.totalUsers > 0 ? Math.round((stats.totalReferrals / stats.totalUsers) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="cute-card p-6">
          <h3 className="text-lg font-inter font-bold text-gray-800 mb-4">
            Pet Care Activity
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 font-inter">Total Dogs:</span>
              <span className="text-gray-800 font-inter font-bold">{stats?.totalShips || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-inter">Dogs per Owner:</span>
              <span className="text-gray-800 font-inter font-bold">
                {stats?.totalUsers && stats.totalUsers > 0 ? Math.round((stats.totalShips / stats.totalUsers) * 10) / 10 : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};