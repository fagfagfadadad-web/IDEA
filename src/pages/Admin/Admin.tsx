import React from 'react';
import { Card } from 'components';
import { useGetIsLoggedIn } from 'lib';

// Mock hook for admin stats
const useAdminStats = () => {
  // Mock data - replace with real API call
  return {
    data: {
      totalUsers: 150,
      totalGigs: 45,
      totalOrders: 89,
      pendingDisputes: 3,
      completedOrders: 67
    },
    isLoading: false,
    error: null
  };
};

// Mock user data - replace with real auth context
const mockUser = {
  id: 'admin1',
  username: 'admin',
  is_admin: true
};

export const Admin: React.FC = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const { data: stats, isLoading: statsLoading, error: statsError } = useAdminStats();
  
  // Mock auth loading and user - replace with real auth context
  const authLoading = false;
  const user = isLoggedIn ? mockUser : null;

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
              <button className="px-4 py-2 text-blue-400 bg-gray-700 rounded-lg">
                Disputes Management
              </button>
              <button className="px-4 py-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg">
                User Management
              </button>
              <button className="px-4 py-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg">
                Gig Management
              </button>
              <button className="px-4 py-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg">
                System Settings
              </button>
            </div>
          </div>

          <div className="p-0">
            {/* Active Tab Content - Disputes Management */}
            <div className="p-8">
              <AdminDisputes />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mock AdminDisputes component
const AdminDisputes = () => {
  // Mock disputes data
  const disputes = [
    {
      id: '1',
      reason: 'Work not delivered as promised',
      created_at: new Date().toISOString(),
      order_id: {
        id: 'order1',
        amount: '100',
        gig_id: {
          title: 'Web Development Project',
          provider_id: { username: 'developer123', avatar_url: '' }
        },
        client_id: { username: 'client456', avatar_url: '' }
      },
      created_by: { username: 'client456', avatar_url: '' }
    }
  ];

  const isLoading = false;
  const error = null;

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Loading Disputes" reference="#">
          <div className="flex justify-center py-8">
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-white">Loading disputes...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8 text-center" title="Error Loading Disputes" reference="#">
          <p className="text-red-400">Error loading disputes: {(error as Error)?.message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <Card className="p-8" title="Dispute Management" reference="#">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Admin - Dispute Management</h2>
          
          {disputes?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-lg">
                No pending disputes at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes?.map((dispute) => (
                <div
                  key={dispute.id}
                  className="bg-gray-800 bg-opacity-50 p-6 rounded-xl border border-gray-600"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        Pending Dispute
                      </span>
                      <span className="text-gray-400 text-sm">
                        {new Date(dispute.created_at).toLocaleString()}
                      </span>
                    </div>

                    <hr className="border-gray-600" />

                    <div className="space-y-3">
                      <div>
                        <p className="text-white font-bold mb-2">
                          Order Details:
                        </p>
                        <p className="text-white">
                          Gig: {dispute.order_id.gig_id.title}
                        </p>
                        <p className="text-white">
                          Amount: {dispute.order_id.amount} EGLD
                        </p>
                        <p className="text-gray-400 text-sm">
                          Order ID: {dispute.order_id.id}
                        </p>
                      </div>

                      <div>
                        <p className="text-white font-bold mb-2">
                          Parties Involved:
                        </p>
                        <div className="flex gap-4">
                          <div className="space-y-1 text-center">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white mx-auto">
                              {dispute.order_id.client_id.username.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-white text-sm">
                              Client: {dispute.order_id.client_id.username}
                            </p>
                          </div>
                          <div className="space-y-1 text-center">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white mx-auto">
                              {dispute.order_id.gig_id.provider_id.username.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-white text-sm">
                              Provider: {dispute.order_id.gig_id.provider_id.username}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-white font-bold mb-2">
                          Dispute Reason:
                        </p>
                        <div className="bg-gray-700 p-3 rounded-md">
                          <p className="text-white">{dispute.reason}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-white font-bold mb-2">
                          Reported by:
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white">
                            {dispute.created_by.username.charAt(0).toUpperCase()}
                          </div>
                          <p className="text-white">{dispute.created_by.username}</p>
                        </div>
                      </div>
                    </div>

                    <hr className="border-gray-600" />

                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium">
                      Resolve Dispute
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};