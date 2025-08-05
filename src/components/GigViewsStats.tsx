import React, { useEffect } from 'react';
import { Eye, TrendingUp, Calendar, Clock } from 'lucide-react';
import { useGigViewsStats } from '../hooks/useGigViews';

interface GigViewsStatsProps {
  gigId: string;
  showDetailed?: boolean;
  className?: string;
}

export const GigViewsStats: React.FC<GigViewsStatsProps> = ({
  gigId,
  showDetailed = false,
  className = ''
}) => {
  const { data: stats, isLoading, error, refetch } = useGigViewsStats(gigId);

  useEffect(() => {
    if (gigId) {
      refetch();
    }
  }, [gigId, refetch]);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Eye size={16} className="text-gray-400" />
        <span className="text-gray-400 text-sm">Loading...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Eye size={16} className="text-gray-400" />
        <span className="text-gray-400 text-sm">0 views</span>
      </div>
    );
  }

  if (!showDetailed) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Eye size={16} className="text-gray-400" />
        <span className="text-gray-400 text-sm">
          {stats.totalViews} view{stats.totalViews !== 1 ? 's' : ''}
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-bold text-white mb-4">Views Analytics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={16} className="text-blue-400" />
            <span className="text-gray-400 text-sm">Total Views</span>
          </div>
          <p className="text-white text-xl font-bold">{stats.totalViews}</p>
        </div>

        <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-green-400" />
            <span className="text-gray-400 text-sm">Unique Viewers</span>
          </div>
          <p className="text-white text-xl font-bold">{stats.uniqueViewers}</p>
        </div>

        <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-yellow-400" />
            <span className="text-gray-400 text-sm">Today</span>
          </div>
          <p className="text-white text-xl font-bold">{stats.viewsToday}</p>
        </div>

        <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-purple-400" />
            <span className="text-gray-400 text-sm">This Month</span>
          </div>
          <p className="text-white text-xl font-bold">{stats.viewsThisMonth}</p>
        </div>
      </div>

      <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
        <h4 className="text-white font-medium mb-2">Quick Stats</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">This Week:</span>
            <span className="text-white">{stats.viewsThisWeek} views</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Avg. Daily Views:</span>
            <span className="text-white">
              {stats.viewsThisMonth > 0 ? Math.round(stats.viewsThisMonth / 30) : 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">View Rate:</span>
            <span className="text-white">
              {stats.totalViews > 0 ? Math.round((stats.uniqueViewers / stats.totalViews) * 100) : 0}% unique
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};