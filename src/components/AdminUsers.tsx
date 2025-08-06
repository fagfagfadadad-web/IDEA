import React, { useState } from 'react';
import { Search, MoreVertical, Ban, CheckCircle, Edit, User, Shield } from 'lucide-react';
import { Button, Card } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useUsers, useUpdateUser } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AdminUsers: React.FC = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    email: '',
    is_admin: false
  });
  const pageSize = 10;
  
  const { data: usersData, isLoading, error, refetch } = useUsers(searchTerm, currentPage, pageSize);
  const updateUser = useUpdateUser();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetch();
  };

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    try {
      await updateUser.mutateAsync({
        userId,
        updates: { is_banned: isBanned }
      });
      showSuccessToast(`User ${isBanned ? 'banned' : 'unbanned'} successfully`);
      refetch();
    } catch (error) {
      console.error('Failed to update ban status:', error);
      showErrorToast('Failed to update user ban status');
    }
  };

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      await updateUser.mutateAsync({
        userId,
        updates: { is_admin: isAdmin }
      });
      showSuccessToast(`Admin privileges ${isAdmin ? 'granted' : 'removed'} successfully`);
      refetch();
    } catch (error) {
      console.error('Failed to update admin status:', error);
      showErrorToast('Failed to update admin privileges');
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username || '',
      full_name: user.full_name || '',
      email: user.email || '',
      is_admin: user.is_admin || false
    });
    setShowEditModal(true);
    setShowMenu(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    
    try {
      await updateUser.mutateAsync({
        userId: selectedUser.id,
        updates: editForm
      });
      
      showSuccessToast('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      refetch();
    } catch (error) {
      console.error('Failed to save user edits:', error);
      showErrorToast('Failed to update user');
    }
  };

  const confirmBanUser = (user: any) => {
    setSelectedUser(user);
    setShowConfirmModal(true);
    setShowMenu(null);
  };

  const handleConfirmBan = async () => {
    if (!selectedUser) return;
    
    try {
      await handleBanUser(selectedUser.id, !selectedUser.is_banned);
      setShowConfirmModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to ban/unban user:', error);
    }
  };

  const totalPages = usersData ? Math.ceil(usersData.count / pageSize) : 0;

  if (!user?.is_admin) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Access Denied" reference="#">
          <div className="bg-red-900 border border-red-500 rounded-md p-4">
            <div className="flex items-center">
              <span className="text-red-400 mr-2">⚠️</span>
              <span className="text-white">Access denied. Admin privileges required.</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Loading Users" reference="#">
          <div className="flex justify-center py-8">
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-white">Loading users...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Error Loading Users" reference="#">
          <div className="bg-red-900 border border-red-500 rounded-md p-4">
            <div className="flex items-center">
              <span className="text-red-400 mr-2">⚠️</span>
              <span className="text-white">Error loading users: {(error as Error)?.message}</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <Card className="p-8" title="User Management" reference="#">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Admin - User Management</h2>
          
          {/* Search */}
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by username, wallet address, or name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </form>
          
          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left p-3 text-gray-400">User</th>
                  <th className="text-left p-3 text-gray-400">Wallet Address</th>
                  <th className="text-left p-3 text-gray-400">Email</th>
                  <th className="text-left p-3 text-gray-400">Joined</th>
                  <th className="text-left p-3 text-gray-400">Admin</th>
                  <th className="text-left p-3 text-gray-400">Status</th>
                  <th className="text-left p-3 text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersData?.data.map((user) => (
                  <tr key={user.id} className="border-b border-gray-700">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden relative bg-gray-600">
                          {user.avatar_url ? (
                            <>
                              <img
                                src={user.avatar_url}
                                alt={user.username || "User"}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const fallback = parent.querySelector('.fallback-avatar') as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }
                                }}
                              />
                              <div 
                                className="fallback-avatar w-full h-full bg-gray-600 flex items-center justify-center text-xs text-white absolute inset-0"
                                style={{ display: 'none' }}
                              >
                                {user.username?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-gray-600 flex items-center justify-center text-xs text-white">
                              {user.username?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.username}</p>
                          {user.full_name && (
                            <p className="text-gray-400 text-sm">{user.full_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-gray-400 text-sm">
                        {user.wallet_address ? (
                          <span title={user.wallet_address}>
                            {user.wallet_address.substring(0, 8)}...{user.wallet_address.substring(user.wallet_address.length - 4)}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-gray-400 text-sm">
                        {user.email || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-gray-400 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={user.is_admin}
                          onChange={() => handleToggleAdmin(user.id, !user.is_admin)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.is_banned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.is_banned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="relative">
                        <button
                          onClick={() => setShowMenu(showMenu === user.id ? null : user.id)}
                          className="p-1 hover:bg-gray-700 rounded"
                        >
                          <MoreVertical size={16} className="text-gray-400" />
                        </button>
                        
                        {showMenu === user.id && (
                          <div className="absolute right-0 top-8 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-10 min-w-48">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Edit size={16} />
                              Edit User
                            </button>
                            <button
                              onClick={() => confirmBanUser(user)}
                              className={`w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-2 ${
                                user.is_banned ? 'text-green-400' : 'text-red-400'
                              }`}
                            >
                              {user.is_banned ? <CheckCircle size={16} /> : <Ban size={16} />}
                              {user.is_banned ? 'Unban User' : 'Ban User'}
                            </button>
                            <button
                              onClick={() => handleToggleAdmin(user.id, !user.is_admin)}
                              className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 flex items-center gap-2"
                            >
                              {user.is_admin ? <User size={16} /> : <Shield size={16} />}
                              {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  Previous
                </Button>
                <span className="text-white">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Ban/Unban Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4" title="Confirm Action" reference="#">
            <h3 className="text-xl font-bold text-white mb-4">
              {selectedUser?.is_banned ? 'Unban User' : 'Ban User'}
            </h3>
            <p className="text-gray-400 mb-4">
              Are you sure you want to {selectedUser?.is_banned ? 'unban' : 'ban'} {selectedUser?.username}?
            </p>
            {!selectedUser?.is_banned && (
              <p className="text-red-300 mb-4 text-sm">
                This will prevent the user from accessing the platform.
              </p>
            )}
            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmBan}
                className={`flex-1 py-2 px-4 rounded-lg ${
                  selectedUser?.is_banned 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } text-white`}
              >
                {selectedUser?.is_banned ? 'Unban' : 'Ban'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4" title="Edit User" reference="#">
            <h3 className="text-xl font-bold text-white mb-4">Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_admin}
                    onChange={(e) => setEditForm({...editForm, is_admin: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
                <span className="text-white">Admin Privileges</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
                disabled={updateUser.isLoading}
              >
                {updateUser.isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Click outside to close menus */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowMenu(null)}
        />
      )}
    </div>
  );
};