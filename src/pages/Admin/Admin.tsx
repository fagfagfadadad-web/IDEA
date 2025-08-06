import React, { useState } from 'react';
import { Card, AdminDisputes, AdminUsers, AdminGigs } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useAdminStats } from '../../hooks/useUsers';
import { useAuth } from '../../context/AuthContext';

export const Admin: React.FC = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const { user, loading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading, error: statsError } = useAdminStats();
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 0, label: 'Disputes Management', component: AdminDisputes },
    { id: 1, label: 'User Management', component: AdminUsers },
    { id: 2, label: 'Gig Management', component: AdminGigs },
    { id: 3, label: 'System Settings', component: () => <div className="p-8 text-white">System settings coming soon...</div> }
  ];

  // Show loading while auth is still loading
  if (authLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Loading Authentication" reference="#">
          <div className="flex justify-center">
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-white">Loading authentication...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show access denied if not logged in
  if (!user) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Access Denied" reference="#">
          <div className="bg-red-900 border border-red-500 rounded-md p-4 mb-4">
            <div className="flex items-center">
              <span className="text-red-400 mr-2">⚠️</span>
              <span className="text-white">Please log in to access admin panel.</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show access denied if not admin
  if (!user.is_admin) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Admin Access Required" reference="#">
          <div className="bg-red-900 border border-red-500 rounded-md p-4 mb-4">
            <div className="flex items-center">
              <span className="text-red-400 mr-2">⚠️</span>
              <span className="text-white">Access denied. Admin privileges required.</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="space-y-8">
        <Card className="p-8" title="Admin Dashboard" reference="#">
          <div className="bg-green-900 border border-green-500 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <span className="text-green-400 mr-2">✅</span>
              <span className="text-white">Welcome Admin! Dashboard loaded in optimized mode.</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-6">Admin Dashboard</h1>
          
          {statsError ? (
            <div className="bg-red-900 border border-red-500 rounded-md p-4 mb-6">
              <div className="flex items-center">
                <span className="text-red-400 mr-2">⚠️</span>
                <span className="text-white">Error loading statistics: {(statsError as Error)?.message}</span>
              </div>
            </div>
          ) : statsLoading ? (
            <div className="flex justify-center py-4">
              <div className="space-y-2 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-white text-sm">Loading statistics...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-white text-2xl font-bold">{stats?.totalUsers || 0}</p>
                <p className="text-gray-400 text-xs">Registered users</p>
              </div>

              <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Total Gigs</p>
                <p className="text-white text-2xl font-bold">{stats?.totalGigs || 0}</p>
                <p className="text-gray-400 text-xs">Active gigs</p>
              </div>

              <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Total Orders</p>
                <p className="text-white text-2xl font-bold">{stats?.totalOrders || 0}</p>
                <p className="text-gray-400 text-xs">All orders</p>
              </div>

              <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Pending Disputes</p>
                <p className="text-red-400 text-2xl font-bold">{stats?.pendingDisputes || 0}</p>
                <p className="text-gray-400 text-xs">Need attention</p>
              </div>

              <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Completed Orders</p>
                <p className="text-green-400 text-2xl font-bold">{stats?.completedOrders || 0}</p>
                <p className="text-gray-400 text-xs">Successful orders</p>
              </div>
            </div>
          )}
        </Card>

        {/* Tabs Section */}
        <div className="bg-white rounded-xl">
          <div className="bg-gray-800 p-2 rounded-t-xl">
            <div className="flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-400 bg-gray-700'
                      : 'text-gray-400 hover:text-blue-400 hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-0">
            {/* Active Tab Content */}
            <div className="p-8">
              {React.createElement(tabs[activeTab].component)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};