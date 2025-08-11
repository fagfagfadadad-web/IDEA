import React from 'react';
import { DollarSign, TrendingUp, Calendar, Briefcase, Eye } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { useGigs } from '../../hooks/useGigs';

export const FinancialOverview: React.FC = () => {
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: gigs, isLoading: gigsLoading } = useGigs();

  const isLoading = ordersLoading || gigsLoading;

  // Calculate financial stats
  const stats = React.useMemo(() => {
    if (!orders || !gigs) return null;

    const completedOrders = orders.filter(order => order.status === 'completed');
    const totalEarnings = completedOrders.reduce((sum, order) => sum + order.amount, 0);
    const pendingOrders = orders.filter(order => order.status === 'in_progress' || order.status === 'delivered');
    const pendingEarnings = pendingOrders.reduce((sum, order) => sum + order.amount, 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const thisMonthOrders = completedOrders.filter(order => 
      new Date(order.created_at) >= thisMonth
    );
    const thisMonthEarnings = thisMonthOrders.reduce((sum, order) => sum + order.amount, 0);

    const totalViews = gigs.reduce((sum, gig) => sum + (gig.view_count || 0), 0);
    const activeGigs = gigs.filter(gig => gig.status === 'active').length;

    return {
      totalEarnings,
      pendingEarnings,
      thisMonthEarnings,
      completedOrdersCount: completedOrders.length,
      pendingOrdersCount: pendingOrders.length,
      totalViews,
      activeGigs,
      totalGigs: gigs.length
    };
  }, [orders, gigs]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="text-center py-8">
          <DollarSign size={32} className="text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No financial data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-bold text-gray-800">Financial Overview</h3>
          <p className="text-gray-600 text-sm">Your earnings and performance metrics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-green-600" />
              <span className="text-green-800 font-medium text-sm">Total Earnings</span>
            </div>
            <p className="text-green-800 text-xl font-bold">
              {stats.totalEarnings.toFixed(2)} EGLD
            </p>
            <p className="text-green-600 text-xs">
              {stats.completedOrdersCount} completed orders
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-blue-600" />
              <span className="text-blue-800 font-medium text-sm">Pending</span>
            </div>
            <p className="text-blue-800 text-xl font-bold">
              {stats.pendingEarnings.toFixed(2)} EGLD
            </p>
            <p className="text-blue-600 text-xs">
              {stats.pendingOrdersCount} active orders
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-purple-600" />
              <span className="text-purple-800 font-medium text-sm">This Month</span>
            </div>
            <p className="text-purple-800 text-xl font-bold">
              {stats.thisMonthEarnings.toFixed(2)} EGLD
            </p>
            <p className="text-purple-600 text-xs">
              Current month earnings
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase size={16} className="text-orange-600" />
              <span className="text-orange-800 font-medium text-sm">Active Gigs</span>
            </div>
            <p className="text-orange-800 text-xl font-bold">
              {stats.activeGigs}
            </p>
            <p className="text-orange-600 text-xs">
              of {stats.totalGigs} total gigs
            </p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-gray-600" />
              <span className="text-gray-700 font-medium">Total Profile Views</span>
            </div>
            <span className="text-gray-800 font-bold">{stats.totalViews}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-md font-semibold text-gray-700 mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => window.location.href = '/create-gig'}
              className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Plus size={16} className="text-indigo-600" />
                <span className="text-indigo-800 font-medium text-sm">Create Gig</span>
              </div>
            </button>
            
            <button
              onClick={() => window.location.href = '/my-requests'}
              className="p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-green-600" />
                <span className="text-green-800 font-medium text-sm">View Orders</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};