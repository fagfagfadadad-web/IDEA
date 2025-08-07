import React, { useState } from 'react';
import { Search, MoreVertical, Trash2, Edit, Eye, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { Button, Card } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useAllGigs, useDeleteGig, useUpdateGigStatus } from '../hooks/useGigs';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AdminGigs: React.FC = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGig, setSelectedGig] = useState<any>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const pageSize = 10;
  
  const { data: allGigs, isLoading, error } = useAllGigs();
  const deleteGig = useDeleteGig();
  const updateGigStatus = useUpdateGigStatus();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleViewGig = (gigId: string) => {
    window.location.href = `/gigs/${gigId}`;
  };

  const handleEditGig = (gigId: string) => {
    window.location.href = `/gigs/${gigId}/edit`;
  };

  const confirmDeleteGig = (gig: any) => {
    setSelectedGig(gig);
    setShowDeleteModal(true);
    setShowMenu(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedGig) return;
    
    try {
      await deleteGig.mutateAsync(selectedGig.id, {
        onSuccess: () => {
          showSuccessToast('Gig deleted successfully');
          setShowDeleteModal(false);
          setSelectedGig(null);
        }
      });
      setShowDeleteModal(false);
      setSelectedGig(null);
    } catch (error) {
      console.error('Failed to delete gig:', error);
      showErrorToast('Failed to delete gig');
    }
  };

  const handleUpdateGigStatus = async (gigId: string, status: string) => {
    try {
      await updateGigStatus.mutateAsync({ id: gigId, status });
      showSuccessToast(`Gig status updated to ${status}`);
      setShowMenu(null);
    } catch (error) {
      console.error('Failed to update gig status:', error);
      showErrorToast('Failed to update gig status');
    }
  };

  // Filter and paginate gigs
  const filteredGigs = React.useMemo(() => {
    if (!allGigs) return [];
    
    return allGigs.filter(gig => {
      const matchesSearch = !searchTerm || 
        gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gig.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gig.provider?.username?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || gig.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [allGigs, searchTerm, statusFilter]);

  const paginatedGigs = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredGigs.slice(startIndex, startIndex + pageSize);
  }, [filteredGigs, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredGigs.length / pageSize);

  if (!user?.is_admin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <span className="text-red-500 mr-2">⚠️</span>
          <span className="text-red-700 font-medium">Access denied. Admin privileges required.</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-700">Loading gigs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <span className="text-red-500 mr-2">⚠️</span>
          <span className="text-red-700 font-medium">Error loading gigs: {error?.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gig Management</h2>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2">
          <span className="text-indigo-800 font-medium">
            {filteredGigs.length} gig{filteredGigs.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by title, description, or provider"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </form>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800 w-full md:w-48 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      
      {/* Gigs Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-gray-700 font-medium">Gig</th>
                <th className="text-left p-4 text-gray-700 font-medium">Provider</th>
                <th className="text-left p-4 text-gray-700 font-medium">Price</th>
                <th className="text-left p-4 text-gray-700 font-medium">Category</th>
                <th className="text-left p-4 text-gray-700 font-medium">Status</th>
                <th className="text-left p-4 text-gray-700 font-medium">Created</th>
                <th className="text-left p-4 text-gray-700 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedGigs.map((gig) => (
                <tr key={gig.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                        alt={gig.title}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <p className="text-gray-800 font-medium line-clamp-1">{gig.title}</p>
                        <p className="text-gray-600 text-sm line-clamp-1">{gig.description.substring(0, 50)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-400 to-pink-400">
                        {gig.provider?.avatar_url ? (
                          <>
                            <img
                              src={gig.provider.avatar_url}
                              alt={gig.provider.username || "Provider"}
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
                              className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-sm font-bold text-white absolute inset-0"
                              style={{ display: 'none' }}
                            >
                              {gig.provider?.username?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-sm font-bold text-white">
                            {gig.provider?.username?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                        )}
                      </div>
                      <span className="text-gray-700 text-sm">{gig.provider?.username}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} className="text-gray-600" />
                      <span className="text-gray-700 text-sm">{gig.price} {gig.payment_token || 'EGLD'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {gig.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      gig.status === 'active' ? 'bg-green-100 text-green-800' :
                      gig.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {gig.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-700 text-sm">
                      {new Date(gig.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="relative">
                      <button
                        onClick={() => setShowMenu(showMenu === gig.id ? null : gig.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical size={16} className="text-gray-600" />
                      </button>
                      
                      {showMenu === gig.id && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                          <button
                            onClick={() => {
                              handleViewGig(gig.id);
                              setShowMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                          >
                            <Eye size={16} />
                            View Gig
                          </button>
                          <button
                            onClick={() => {
                              handleEditGig(gig.id);
                              setShowMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Edit size={16} />
                            Edit Gig
                          </button>
                          <button
                            onClick={() => confirmDeleteGig(gig)}
                            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 size={16} />
                            Delete Gig
                          </button>
                          <hr className="border-gray-200" />
                          {gig.status !== 'active' && (
                            <button
                              onClick={() => handleUpdateGigStatus(gig.id, 'active')}
                              className="w-full text-left px-4 py-2 text-green-600 hover:bg-green-50 flex items-center gap-2"
                            >
                              <CheckCircle size={16} />
                              Set Active
                            </button>
                          )}
                          {gig.status !== 'paused' && (
                            <button
                              onClick={() => handleUpdateGigStatus(gig.id, 'paused')}
                              className="w-full text-left px-4 py-2 text-yellow-600 hover:bg-yellow-50 flex items-center gap-2"
                            >
                              <XCircle size={16} />
                              Set Paused
                            </button>
                          )}
                          {gig.status !== 'inactive' && (
                            <button
                              onClick={() => handleUpdateGigStatus(gig.id, 'inactive')}
                              className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                            >
                              <XCircle size={16} />
                              Set Inactive
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Previous
            </Button>
            <span className="text-gray-800 font-medium">
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Gig</h3>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete "{selectedGig?.title}"?
            </p>
            <p className="text-red-600 mb-4 text-sm">
              This action cannot be undone. All related orders and messages will also be deleted.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg"
                disabled={deleteGig.isLoading}
              >
                {deleteGig.isLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowMenu(null)}
        />
      )}
    </div>
  );
};