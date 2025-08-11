import React from 'react';
import { DollarSign, TrendingUp, Calendar, Briefcase, Eye, Plus, Clock, CheckCircle } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { useGigs } from '../../hooks/useGigs';
import { useAuth } from '../../context/AuthContext';

export const FinancialOverview: React.FC = () => {
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: gigs, isLoading: gigsLoading } = useGigs();
  const { user } = useAuth();

  const isLoading = ordersLoading || gigsLoading;

  // Calculate financial stats
  const stats = React.useMemo(() => {
    if (!orders || !gigs) return null;

    // Filter orders where user is the provider
    const providerOrders = orders.filter(order => {
      const isProvider = user?.id === order.gig?.provider?.id || 
                        user?.id === order.gig?.provider_id ||
                        (user?.wallet_address && order.provider_address && user.wallet_address === order.provider_address);
      return isProvider;
    });

    const completedOrders = providerOrders.filter(order => order.status === 'completed');
    const pendingOrders = providerOrders.filter(order => 
      order.status === 'in_progress' || 
      order.status === 'delivered' || 
      order.status === 'pending_approval'
    );
    
    // Calculate earnings with proper fee deduction
    const egldEarnings = completedOrders
      .filter(order => order.payment_token === 'EGLD')
      .reduce((sum, order) => sum + (order.amount * 0.9), 0); // 90% after 10% fee
      
    const idaEarnings = completedOrders
      .filter(order => order.payment_token !== 'EGLD')
      .reduce((sum, order) => sum + order.amount, 0); // 100% for IDA tokens
    
    const totalEarnings = egldEarnings + idaEarnings;
    
    const pendingEarnings = pendingOrders.reduce((sum, order) => {
      if (order.payment_token === 'EGLD') {
        return sum + (order.amount * 0.9); // After fee
      }
      return sum + order.amount;
    }, 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const thisMonthOrders = completedOrders.filter(order => 
      new Date(order.created_at) >= thisMonth
    );
    const thisMonthEarnings = thisMonthOrders.reduce((sum, order) => {
      if (order.payment_token === 'EGLD') {
        return sum + (order.amount * 0.9); // After fee
      }
      return sum + order.amount;
    }, 0);

    const totalViews = gigs.reduce((sum, gig) => sum + (gig.view_count || 0), 0);
    const activeGigs = gigs.filter(gig => gig.status === 'active').length;
    
    // Orders ready to claim (completed + 3 days passed)
    const ordersReadyToClaim = providerOrders.filter(order => {
      if (order.status !== 'completed') return false;
      const completionDate = new Date(order.status_updated_at);
      const threeDaysLater = new Date(completionDate.getTime() + 3 * 24 * 60 * 60 * 1000);
      return new Date() >= threeDaysLater;
    }).length;

    return {
      totalEarnings,
      egldEarnings,
      idaEarnings,
      pendingEarnings,
      thisMonthEarnings,
      completedOrdersCount: completedOrders.length,
      pendingOrdersCount: pendingOrders.length,
      ordersReadyToClaim,
      totalViews,
      activeGigs,
      totalGigs: gigs.length
    };
  }, [orders, gigs, user]);

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
              {stats.totalEarnings.toFixed(2)}
            </p>
            <p className="text-green-600 text-xs">
              EGLD: {stats.egldEarnings.toFixed(2)} | IDA: {stats.idaEarnings.toFixed(2)}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-blue-600" />
              <span className="text-blue-800 font-medium text-sm">Pending</span>
            </div>
            <p className="text-blue-800 text-xl font-bold">
              {stats.pendingEarnings.toFixed(2)}
            </p>
            <p className="text-blue-600 text-xs">
              {stats.pendingOrdersCount} active orders
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-purple-600" />
              <span className="text-purple-800 font-medium text-sm">Ready to Claim</span>
            </div>
            <p className="text-purple-800 text-xl font-bold">
              {stats.ordersReadyToClaim}
            </p>
            <p className="text-purple-600 text-xs">
              orders ready for claim
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-orange-600" />
              <span className="text-orange-800 font-medium text-sm">This Month</span>
            </div>
            <p className="text-orange-800 text-xl font-bold">
              {stats.thisMonthEarnings.toFixed(2)}
            </p>
            <p className="text-orange-600 text-xs">
              earnings this month
            </p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-gray-600" />
                <span className="text-gray-700 font-medium text-sm">Total Views</span>
              </div>
              <span className="text-gray-800 font-bold">{stats.totalViews}</span>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-gray-600" />
                <span className="text-gray-700 font-medium text-sm">Active Gigs</span>
              </div>
              <span className="text-gray-800 font-bold">{stats.activeGigs}/{stats.totalGigs}</span>
            </div>
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