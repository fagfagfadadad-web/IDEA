import React, { useState } from 'react';
import { Search, MoreVertical, Trash2, Edit, Eye, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { Button, Card } from 'components';
import { useGetIsLoggedIn } from 'lib';

// Mock data for demonstration
const mockGigs = [
  {
    id: "1",
    title: "Professional Web Development",
    description: "I will create a modern, responsive website for your business",
    category: "Programming & Tech",
    price: "100",
    duration: "7",
    payment_token: "EGLD",
    status: "active",
    created_at: new Date().toISOString(),
    media_urls: {
      images: ["https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"]
    },
    provider: {
      id: "provider1",
      username: "webdev_pro",
      avatar_url: "",
      full_name: "John Developer"
    }
  },
  {
    id: "2",
    title: "Logo Design & Branding",
    description: "Professional logo design with complete brand identity package",
    category: "Graphics & Design",
    price: "50",
    duration: "3",
    payment_token: "IDEA",
    status: "paused",
    created_at: new Date().toISOString(),
    media_urls: {
      images: ["https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"]
    },
    provider: {
      id: "provider2",
      username: "designer_jane",
      avatar_url: "",
      full_name: "Jane Designer"
    }
  }
];

const useAllGigs = () => {
  // Mock implementation - replace with real API call
  return {
    data: mockGigs,
    isLoading: false,
    error: null as Error | null
  };
};

const useAdminDeleteGig = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async (gigId: string) => {
    setIsLoading(true);
    try {
      // Mock API call - replace with real implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Deleting gig:', gigId);
      alert('Gig deleted successfully');
      return gigId;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mutateAsync,
    isLoading
  };
};

const useAdminUpdateGigStatus = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async ({ gigId, status }: { gigId: string; status: string }) => {
    setIsLoading(true);
    try {
      // Mock API call - replace with real implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Updating gig status:', { gigId, status });
      alert(`Gig status updated to ${status}`);
      return { gigId, status };
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mutateAsync,
    isLoading
  };
};

export const AdminGigs: React.FC = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGig, setSelectedGig] = useState<any>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const pageSize = 10;
  
  const { data: allGigs, isLoading, error } = useAllGigs();
  const deleteGig = useAdminDeleteGig();
  const updateGigStatus = useAdminUpdateGigStatus();

  // Mock user - replace with real auth context
  const user = isLoggedIn ? { id: 'admin1', username: 'admin', is_admin: true } : null;

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
      await deleteGig.mutateAsync(selectedGig.id);
      setShowDeleteModal(false);
      setSelectedGig(null);
    } catch (error) {
      console.error('Failed to delete gig:', error);
    }
  };

  const handleUpdateGigStatus = async (gigId: string, status: string) => {
    try {
      await updateGigStatus.mutateAsync({ gigId, status });
      setShowMenu(null);
    } catch (error) {
      console.error('Failed to update gig status:', error);
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
        <Card className="p-8" title="Loading" reference="#">
          <div className="flex justify-center py-8">
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-white">Loading gigs...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Error" reference="#">
          <div className="bg-red-900 border border-red-500 rounded-md p-4">
            <div className="flex items-center">
              <span className="text-red-400 mr-2">⚠️</span>
              <span className="text-white">Error loading gigs: {error?.message}</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <Card className="p-8" title="Gig Management" reference="#">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Admin - Gig Management</h2>
          
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
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </form>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white w-full md:w-48"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          {/* Gigs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left p-3 text-gray-400">Gig</th>
                  <th className="text-left p-3 text-gray-400">Provider</th>
                  <th className="text-left p-3 text-gray-400">Price</th>
                  <th className="text-left p-3 text-gray-400">Category</th>
                  <th className="text-left p-3 text-gray-400">Status</th>
                  <th className="text-left p-3 text-gray-400">Created</th>
                  <th className="text-left p-3 text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedGigs.map((gig) => (
                  <tr key={gig.id} className="border-b border-gray-700">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                          alt={gig.title}
                          className="w-10 h-10 object-cover rounded-md"
                        />
                        <div>
                          <p className="text-white font-medium line-clamp-1">{gig.title}</p>
                          <p className="text-gray-400 text-xs line-clamp-1">{gig.description.substring(0, 50)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white">
                          {gig.provider?.username?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="text-gray-400 text-sm">{gig.provider?.username}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} className="text-gray-400" />
                        <span className="text-gray-400 text-sm">{gig.price} {gig.payment_token || 'EGLD'}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {gig.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        gig.status === 'active' ? 'bg-green-100 text-green-800' :
                        gig.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {gig.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-gray-400 text-sm">
                        {new Date(gig.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="relative">
                        <button
                          onClick={() => setShowMenu(showMenu === gig.id ? null : gig.id)}
                          className="p-1 hover:bg-gray-700 rounded"
                        >
                          <MoreVertical size={16} className="text-gray-400" />
                        </button>
                        
                        {showMenu === gig.id && (
                          <div className="absolute right-0 top-8 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-10 min-w-48">
                            <button
                              onClick={() => {
                                handleViewGig(gig.id);
                                setShowMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Eye size={16} />
                              View Gig
                            </button>
                            <button
                              onClick={() => {
                                handleEditGig(gig.id);
                                setShowMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Edit size={16} />
                              Edit Gig
                            </button>
                            <button
                              onClick={() => confirmDeleteGig(gig)}
                              className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Trash2 size={16} />
                              Delete Gig
                            </button>
                            <hr className="border-gray-600" />
                            {gig.status !== 'active' && (
                              <button
                                onClick={() => handleUpdateGigStatus(gig.id, 'active')}
                                className="w-full text-left px-4 py-2 text-green-400 hover:bg-gray-700 flex items-center gap-2"
                              >
                                <CheckCircle size={16} />
                                Set Active
                              </button>
                            )}
                            {gig.status !== 'paused' && (
                              <button
                                onClick={() => handleUpdateGigStatus(gig.id, 'paused')}
                                className="w-full text-left px-4 py-2 text-yellow-400 hover:bg-gray-700 flex items-center gap-2"
                              >
                                <XCircle size={16} />
                                Set Paused
                              </button>
                            )}
                            {gig.status !== 'inactive' && (
                              <button
                                onClick={() => handleUpdateGigStatus(gig.id, 'inactive')}
                                className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700 flex items-center gap-2"
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4" title="Delete Gig" reference="#">
            <h3 className="text-xl font-bold text-white mb-4">Delete Gig</h3>
            <p className="text-gray-400 mb-4">
              Are you sure you want to delete "{selectedGig?.title}"?
            </p>
            <p className="text-red-300 mb-4 text-sm">
              This action cannot be undone. All related orders and messages will also be deleted.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
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
          </Card>
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