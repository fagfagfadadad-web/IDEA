import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, Ban, CheckCircle, User, Shield, Zap } from 'lucide-react';
import { Button } from 'components';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AdminService } from '../services/adminService';
import { User as UserType } from '../services/userService';

export const AdminUsers: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [users, setUsers] = useState<(UserType & { gameStats?: any })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMenu, setShowMenu] = useState<string | null>(null);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchUsers();
    }
  }, [user?.isAdmin]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const allUsers = await AdminService.getAllUsersWithStats();
      
      // Filter by search term if provided
      const filteredUsers = searchTerm 
        ? allUsers.filter(u => 
            u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.walletAddress?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : allUsers;
      
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    try {
      await AdminService.banUser(userId, isBanned);
      success(`User ${isBanned ? 'banned' : 'unbanned'} successfully`);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update ban status:', err);
      error('Failed to update user ban status');
    }
  };

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      await AdminService.toggleAdminStatus(userId, isAdmin);
      success(`Admin privileges ${isAdmin ? 'granted' : 'removed'} successfully`);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update admin status:', err);
      error('Failed to update admin privileges');
    }
  };

  const handleAwardZen = async (userId: string, amount: number) => {
    try {
      await AdminService.awardZenTokens(userId, amount);
      success(`Awarded ${amount} ZEN tokens successfully`);
      fetchUsers();
    } catch (err) {
      console.error('Failed to award ZEN:', err);
      error('Failed to award ZEN tokens');
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (user?.isAdmin) {
        fetchUsers();
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  if (!user?.isAdmin) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-inter font-bold text-red-600 mb-2">Access Denied</h3>
        <p className="text-gray-700 font-inter">Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-inter font-bold text-gray-800">User Management</h2>
      </div>
      
      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-600" />
        </div>
        <input
          type="text"
          placeholder="Search by username or wallet address"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="cute-input pl-10"
        />
      </div>
      
      {/* Users Table */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400"></div>
        </div>
      ) : (
        <div className="cute-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="cute-table">
              <thead>
                <tr>
                  <th className="text-left p-4">Pet Owner</th>
                  <th className="text-left p-4">Food Balance</th>
                  <th className="text-left p-4">Care Level</th>
                  <th className="text-left p-4">Total Fed</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userData) => (
                  <tr key={userData.id}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden relative bg-gradient-to-r from-primary-400 to-primary-600">
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            {userData.avatarUrl || '🐕'}
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-800 font-medium font-inter">{userData.username}</p>
                          <p className="text-gray-600 text-xs font-inter">
                            {userData.walletAddress ? (
                              <span title={userData.walletAddress}>
                                {userData.walletAddress.substring(0, 8)}...{userData.walletAddress.substring(userData.walletAddress.length - 4)}
                              </span>
                            ) : (
                              'No wallet'
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-primary-600 font-inter font-bold">
                        <span>🍖</span>
                        {userData.gameStats?.zenBalance?.toLocaleString() || 0}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-accent-600 font-inter font-bold">
                        {userData.gameStats?.miningLevel || 1}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-success font-inter font-bold">
                        {userData.gameStats?.totalMined?.toLocaleString() || 0}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          userData.isBanned ? 'bg-red-100 text-red-600' : 'bg-green-100 text-success'
                        }`}>
                          {userData.isBanned ? 'Banned' : 'Active'}
                        </span>
                        {userData.isAdmin && (
                          <span className="px-2 py-1 bg-accent-100 text-accent-600 rounded-full text-xs font-medium">
                            Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="relative">
                        <button
                         onClick={() => setShowMenu(showMenu === userData.id ? null : userData.id || null)}
                          className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
                        >
                          <MoreVertical size={16} className="text-gray-600" />
                        </button>
                        
                        {showMenu === userData.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setShowMenu(null)}
                            />
                            <div className="absolute right-0 top-8 bg-white border border-gray-300 rounded-lg shadow-lg z-20 min-w-48">
                              <button
                                onClick={() => {
                                  handleAwardZen(userData.id!, 1000);
                                  setShowMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-primary-600 hover:bg-primary-100 flex items-center gap-2 font-inter"
                              >
                                <span>🍖</span>
                                Award 1000 Food
                              </button>
                              <button
                                onClick={() => {
                                  handleToggleAdmin(userData.id!, !userData.isAdmin);
                                  setShowMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-2 font-inter"
                              >
                                {userData.isAdmin ? <User size={16} /> : <Shield size={16} />}
                                {userData.isAdmin ? 'Remove Admin' : 'Make Admin'}
                              </button>
                              <button
                                onClick={() => {
                                  handleBanUser(userData.id!, !userData.isBanned);
                                  setShowMenu(null);
                                }}
                                className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 font-inter ${
                                  userData.isBanned ? 'text-success' : 'text-red-600'
                                }`}
                              >
                                {userData.isBanned ? <CheckCircle size={16} /> : <Ban size={16} />}
                                {userData.isBanned ? 'Unban User' : 'Ban User'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};