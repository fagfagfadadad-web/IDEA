import React, { useState } from 'react';
import { AdminDisputes, AdminUsers, AdminGigs } from 'components';
import { AdminTasks } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useAdminStats } from '../../hooks/useUsers';
import { useAuth } from '../../context/AuthContext';
import { Users, AlertTriangle, Briefcase, Settings } from 'lucide-react';
import { CheckSquare } from 'lucide-react';

export const Admin: React.FC = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const { user, loading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading, error: statsError } = useAdminStats();
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 0, label: 'Disputes Management', component: AdminDisputes, icon: <AlertTriangle size={20} /> },
    { id: 1, label: 'User Management', component: AdminUsers, icon: <Users size={20} /> },
    { id: 2, label: 'Gig Management', component: AdminGigs, icon: <Briefcase size={20} /> },
    { id: 3, label: 'Task Management', component: AdminTasks, icon: <CheckSquare size={20} /> },
    { id: 4, label: 'System Settings', component: () => <div className="p-8 text-gray-800">System settings coming soon...</div>, icon: <Settings size={20} /> }
  ];

  // Show loading while auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="gradient-card p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Loading Authentication</h2>
            <div className="flex justify-center">
              <div className="space-y-4 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-700">Loading authentication...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="gradient-card p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Access Denied</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <span className="text-red-700 font-medium">Please log in to access admin panel.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!user.is_admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="gradient-card p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Admin Access Required</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <span className="text-red-700 font-medium">Access denied. Admin privileges required.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="gradient-card p-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                <span className="text-green-800 font-medium">Welcome Admin! Dashboard loaded in optimized mode.</span>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
            
            {statsError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <span className="text-red-700 font-medium">Error loading statistics: {(statsError as Error)?.message}</span>
                </div>
              </div>
            ) : statsLoading ? (
              <div className="flex justify-center py-4">
                <div className="space-y-2 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-gray-700 text-sm">Loading statistics...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                  <p className="text-gray-600 text-sm font-medium">Total Users</p>
                  <p className="text-gray-800 text-3xl font-bold">{stats?.total_users || 0}</p>
                  <p className="text-gray-500 text-xs mt-1">Registered users</p>
                </div>

                <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                  <p className="text-gray-600 text-sm font-medium">Total Gigs</p>
                  <p className="text-gray-800 text-3xl font-bold">{stats?.total_gigs || 0}</p>
                  <p className="text-gray-500 text-xs mt-1">Active gigs</p>
                </div>

                <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                  <p className="text-gray-600 text-sm font-medium">Total Orders</p>
                  <p className="text-gray-800 text-3xl font-bold">{stats?.total_orders || 0}</p>
                  <p className="text-gray-500 text-xs mt-1">All orders</p>
                </div>

                <div className="bg-white border border-red-200 p-6 rounded-xl shadow-sm">
                  <p className="text-gray-600 text-sm font-medium">Pending Disputes</p>
                  <p className="text-red-600 text-3xl font-bold">{stats?.pending_disputes || 0}</p>
                  <p className="text-gray-500 text-xs mt-1">Need attention</p>
                </div>

                <div className="bg-white border border-green-200 p-6 rounded-xl shadow-sm">
                  <p className="text-gray-600 text-sm font-medium">Completed Orders</p>
                  <p className="text-green-600 text-3xl font-bold">{stats?.completed_orders || 0}</p>
                  <p className="text-gray-500 text-xs mt-1">Successful orders</p>
                </div>

                {/* Additional stats from the new view */}
                <div className="bg-white border border-blue-200 p-6 rounded-xl shadow-sm">
                  <p className="text-gray-600 text-sm font-medium">Active Orders</p>
                  <p className="text-blue-600 text-3xl font-bold">{stats?.active_orders || 0}</p>
                  <p className="text-gray-500 text-xs mt-1">In progress</p>
                </div>

                <div className="bg-white border border-purple-200 p-6 rounded-xl shadow-sm">
                  <p className="text-gray-600 text-sm font-medium">New Users (30d)</p>
                  <p className="text-purple-600 text-3xl font-bold">{stats?.new_users_this_month || 0}</p>
                  <p className="text-gray-500 text-xs mt-1">This month</p>
                </div>

                <div className="bg-white border border-orange-200 p-6 rounded-xl shadow-sm">
                  <p className="text-gray-600 text-sm font-medium">New Orders (30d)</p>
                  <p className="text-orange-600 text-3xl font-bold">{stats?.new_orders_this_month || 0}</p>
                  <p className="text-gray-500 text-xs mt-1">This month</p>
                </div>
              </div>
            )}
            
            {/* Debug info for development */}
            {process.env.NODE_ENV === 'development' && stats && (
              <div className="mt-6 bg-gray-100 border border-gray-300 rounded-lg p-4">
                <h3 className="text-gray-800 font-bold mb-2">Debug Info (Development Only)</h3>
                <pre className="text-xs text-gray-600 overflow-auto">
                  {JSON.stringify(stats, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Tabs Section */}
          <div className="gradient-card overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="flex overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white">
              {/* Active Tab Content */}
              <div className="p-8">
                {React.createElement(tabs[activeTab].component)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};