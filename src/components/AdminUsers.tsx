import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, Ban, CheckCircle, Edit, User, Shield, Zap } from 'lucide-react';
import { Button } from 'components';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';

export const AdminUsers: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    if (user?.is_admin) {
      fetchUsers();
    }
  }, [user?.is_admin, searchTerm, currentPage]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('users')
        .select(`
          *,
          game_stats(zen_balance, total_mined, mining_level, total_referrals)
        `, { count: 'exact' });

      // Apply search filter if provided
      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,wallet_address.ilike.%${searchTerm}%`);
      }

      // Apply pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Order by created_at descending
      query = query.order('created_at', { ascending: false });

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_banned: isBanned })
        .eq('id', userId);

      if (updateError) throw updateError;
      success(`User ${isBanned ? 'banned' : 'unbanned'} successfully`);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update ban status:', err);
      error('Failed to update user ban status');
    }
  };

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_admin: isAdmin })
        .eq('id', userId);

      if (updateError) throw updateError;
      success(`Admin privileges ${isAdmin ? 'granted' : 'removed'} successfully`);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update admin status:', err);
      error('Failed to update admin privileges');
    }
  };

  const handleAwardZen = async (userId: string, amount: number) => {
    try {
      const { error: updateError } = await supabase
        .from('game_stats')
        .update({
          zen_balance: supabase.sql`zen_balance + ${amount}`
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;
      success(`Awarded ${amount} ZEN tokens successfully`);
      fetchUsers();
    } catch (err) {
      console.error('Failed to award ZEN:', err);
      error('Failed to award ZEN tokens');
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-orbitron font-bold text-white mb-2">Access Denied</h3>
        <p className="text-gray-400">Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-orbitron font-bold text-white">User Management</h2>
      </div>
      
      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by username or wallet address"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
        />
      </div>
      
      {/* Users Table */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left p-4 text-gray-300 font-orbitron">Player</th>
                  <th className="text-left p-4 text-gray-300 font-orbitron">ZEN Balance</th>
                  <th className="text-left p-4 text-gray-300 font-orbitron">Level</th>
                  <th className="text-left p-4 text-gray-300 font-orbitron">Total Mined</th>
                  <th className="text-left p-4 text-gray-300 font-orbitron">Status</th>
                  <th className="text-left p-4 text-gray-300 font-orbitron">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userData) => (
                  <tr key={userData.id} className="border-b border-gray-700/50 hover:bg-slate-700/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden relative bg-gradient-to-r from-cyan-400 to-purple-500">
                          {userData.avatar_url ? (
                            <img
                              src={userData.avatar_url}
                              alt={userData.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-orbitron font-bold">
                              {userData.username?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{userData.username}</p>
                          <p className="text-gray-400 text-xs">
                            {userData.wallet_address ? (
                              <span title={userData.wallet_address}>
                                {userData.wallet_address.substring(0, 8)}...{userData.wallet_address.substring(userData.wallet_address.length - 4)}
                              </span>
                            ) : (
                              'No wallet'
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-cyan-400 font-orbitron font-bold">
                        <Zap size={14} />
                        {userData.game_stats?.[0]?.zen_balance?.toLocaleString() || 0}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-purple-400 font-orbitron font-bold">
                        {userData.game_stats?.[0]?.mining_level || 1}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-green-400 font-orbitron font-bold">
                        {userData.game_stats?.[0]?.total_mined?.toLocaleString() || 0}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          userData.is_banned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {userData.is_banned ? 'Banned' : 'Active'}
                        </span>
                        {userData.is_admin && (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
                            Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="relative">
                        <button
                          onClick={() => setShowMenu(showMenu === userData.id ? null : userData.id)}
                          className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                        >
                          <MoreVertical size={16} className="text-gray-400" />
                        </button>
                        
                        {showMenu === userData.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setShowMenu(null)}
                            />
                            <div className="absolute right-0 top-8 bg-slate-800 border border-gray-600 rounded-lg shadow-lg z-20 min-w-48">
                              <button
                                onClick={() => {
                                  handleAwardZen(userData.id, 1000);
                                  setShowMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-cyan-400 hover:bg-slate-700 flex items-center gap-2"
                              >
                                <Zap size={16} />
                                Award 1000 ZEN
                              </button>
                              <button
                                onClick={() => {
                                  handleToggleAdmin(userData.id, !userData.is_admin);
                                  setShowMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-white hover:bg-slate-700 flex items-center gap-2"
                              >
                                {userData.is_admin ? <User size={16} /> : <Shield size={16} />}
                                {userData.is_admin ? 'Remove Admin' : 'Make Admin'}
                              </button>
                              <button
                                onClick={() => {
                                  handleBanUser(userData.id, !userData.is_banned);
                                  setShowMenu(null);
                                }}
                                className={`w-full text-left px-4 py-2 hover:bg-slate-700 flex items-center gap-2 ${
                                  userData.is_banned ? 'text-green-400' : 'text-red-400'
                                }`}
                              >
                                {userData.is_banned ? <CheckCircle size={16} /> : <Ban size={16} />}
                                {userData.is_banned ? 'Unban User' : 'Ban User'}
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