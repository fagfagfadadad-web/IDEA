import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Clock, 
  DollarSign, 
  Calendar, 
  Briefcase, 
  MoreVertical, 
  Trash2, 
  Edit, 
  Eye,
  Tag as TagIcon,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Send
} from 'lucide-react';
import { Button, Card } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useMyClientRequests, useDeleteClientRequest } from '../../hooks/useClientRequests';
import { useMyProposals, useWithdrawProposal } from '../../hooks/useProposals';
import { useAuth } from '../../context/AuthContext';
import { errorParse } from '../../utils/errorParse';

export const MyRequests = () => {
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  
  // Real hooks for data
  const { data: myRequests, isLoading: requestsLoading, error: requestsError, refetch: refetchRequests } = useMyClientRequests();
  const { data: myProposals, isLoading: proposalsLoading, error: proposalsError, refetch: refetchProposals } = useMyProposals();
  const deleteRequest = useDeleteClientRequest();
  const withdrawProposal = useWithdrawProposal();
  
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [proposalToWithdraw, setProposalToWithdraw] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const handleCreateRequest = () => {
    navigate('/create-request');
  };

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;
    
    try {
      await deleteRequest.mutateAsync(requestToDelete);
      setShowDeleteModal(false);
      setRequestToDelete(null);
      refetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Error deleting request. Please try again later.');
    }
  };

  const handleWithdrawProposal = async () => {
    if (!proposalToWithdraw) return;
    
    try {
      await withdrawProposal.mutateAsync({
        id: proposalToWithdraw.id,
        requestId: proposalToWithdraw.request_id
      });
      setShowWithdrawModal(false);
      setProposalToWithdraw(null);
      refetchProposals();
    } catch (error) {
      console.error('Error withdrawing proposal:', error);
      alert('Error withdrawing proposal. Please try again later.');
    }
  };

  const confirmDelete = (requestId: string) => {
    setRequestToDelete(requestId);
    setShowDeleteModal(true);
    setShowMenu(null);
  };

  const confirmWithdraw = (proposal: any) => {
    setProposalToWithdraw(proposal);
    setShowWithdrawModal(true);
    setShowMenu(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'green';
      case 'in_review':
        return 'blue';
      case 'assigned':
        return 'purple';
      case 'completed':
        return 'gray';
      case 'cancelled':
        return 'red';
      case 'pending':
        return 'blue';
      case 'accepted':
        return 'green';
      case 'rejected':
        return 'red';
      case 'withdrawn':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'programming & tech':
        return '#01c3a8';
      case 'graphics & design':
        return '#1890ff';
      case 'digital marketing':
        return '#ffb741';
      case 'writing & translation':
        return '#ff6f61';
      case 'video & animation':
        return '#a259ff';
      case 'ai services':
        return '#00ddeb';
      case 'music & audio':
        return '#ffcc33';
      case 'business':
        return '#2ecc71';
      case 'consulting':
        return '#e91e63';
      default:
        return '#6b7280';
    }
  };

  const formatBudget = (min?: number, max?: number) => {
    if (min && max) {
      return `${min} - ${max} EGLD`;
    } else if (min) {
      return `From ${min} EGLD`;
    } else if (max) {
      return `Up to ${max} EGLD`;
    }
    return 'Budget not specified';
  };

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return 'No deadline';
    
    const date = new Date(deadline);
    return date.toLocaleDateString();
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="gradient-card p-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="text-yellow-600 mr-3" size={20} />
                <span className="text-yellow-800 font-medium">Please log in to view your requests and proposals.</span>
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">My Requests & Proposals</h1>
                <p className="text-gray-600">
                  Manage your project requests and submitted proposals
                </p>
              </div>
              
              <Button
                onClick={handleCreateRequest}
                variant="gradient"
                size="md"
              >
                <Plus size={18} />
                Create Request
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="gradient-card overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab(0)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 0
                      ? 'border-indigo-500 text-indigo-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-indigo-600'
                  }`}
                >
                  My Requests ({myRequests?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab(1)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 1
                      ? 'border-indigo-500 text-indigo-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-indigo-600'
                  }`}
                >
                  My Proposals ({myProposals?.length || 0})
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {activeTab === 0 && (
                <div>
                  {requestsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="space-y-4 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="text-gray-700">Loading your requests...</p>
                      </div>
                    </div>
                  ) : requestsError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="text-red-500 mr-3" size={20} />
                        <span className="text-red-700 font-medium">
                          Error loading your requests: {errorParse(requestsError)}
                        </span>
                      </div>
                    </div>
                  ) : !myRequests || myRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                          <Briefcase size={24} className="text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-800 mb-2">No requests yet</h3>
                          <p className="text-gray-600 mb-4">
                            You haven't created any project requests yet.
                          </p>
                          <Button
                            onClick={handleCreateRequest}
                            variant="gradient"
                            size="md"
                          >
                            <Plus size={18} />
                            Create your first request
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myRequests.map((request) => {
                        const statusColor = getStatusColor(request.status);
                        const categoryColor = getCategoryColor(request.category);
                        const proposalsCount = request.proposals?.length || 0;
                        
                        return (
                          <div
                            key={request.id}
                            className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer relative"
                            onClick={() => navigate(`/requests/${request.id}`)}
                            style={{
                              borderTopColor: categoryColor,
                              borderTopWidth: '3px'
                            }}
                          >
                            {/* Menu Button */}
                            <div className="absolute top-3 right-3 z-10">
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(showMenu === request.id ? null : request.id);
                                  }}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <MoreVertical size={16} className="text-gray-600" />
                                </button>
                                
                                {showMenu === request.id && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-10" 
                                      onClick={() => setShowMenu(null)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-48">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/requests/${request.id}`);
                                          setShowMenu(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                                      >
                                        <Eye size={16} />
                                        View Details
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/requests/${request.id}/edit`);
                                          setShowMenu(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-50 flex items-center gap-2"
                                      >
                                        <Edit size={16} />
                                        Edit Request
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          confirmDelete(request.id);
                                        }}
                                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                                      >
                                        <Trash2 size={16} />
                                        Delete Request
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div 
                              className="py-3 px-4 border-b border-gray-200"
                              style={{ backgroundColor: `${categoryColor}20` }}
                            >
                              <div className="flex justify-between items-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  statusColor === 'green' ? 'bg-green-100 text-green-800' :
                                  statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                                  statusColor === 'purple' ? 'bg-purple-100 text-purple-800' :
                                  statusColor === 'red' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                </span>
                                <span className="text-xs text-gray-600">
                                  {new Date(request.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            
                            <div className="p-4">
                              <div className="space-y-4">
                                <h3 className="text-lg font-bold text-gray-800 line-clamp-2">
                                  {request.title}
                                </h3>
                                
                                <p className="text-gray-600 text-sm line-clamp-3">
                                  {request.description}
                                </p>
                                
                                <div className="flex gap-2 flex-wrap">
                                  <span 
                                    className="px-3 py-1 rounded-full text-xs font-medium text-white"
                                    style={{ backgroundColor: categoryColor }}
                                  >
                                    {request.category}
                                  </span>
                                  
                                  {(request.budget_min || request.budget_max) && (
                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
                                      <DollarSign size={12} />
                                      {formatBudget(request.budget_min, request.budget_max)}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex gap-2 flex-wrap">
                                  {request.deadline && (
                                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium flex items-center gap-1">
                                      <Calendar size={12} />
                                      Due {formatDeadline(request.deadline)}
                                    </span>
                                  )}
                                  
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                                    proposalsCount > 0 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    <Briefcase size={12} />
                                    {proposalsCount} proposal{proposalsCount !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                
                                <div className="border-t border-gray-200 pt-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                      <Clock size={14} className="text-gray-400" />
                                      <span className="text-gray-500 text-xs">
                                        Expires {new Date(request.expires_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    
                                    {request.status === 'assigned' && (
                                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                        Proposal Selected
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 1 && (
                <div>
                  {proposalsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="space-y-4 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="text-gray-700">Loading your proposals...</p>
                      </div>
                    </div>
                  ) : proposalsError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="text-red-500 mr-3" size={20} />
                        <span className="text-red-700 font-medium">
                          Error loading your proposals: {errorParse(proposalsError)}
                        </span>
                      </div>
                    </div>
                  ) : !myProposals || myProposals.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                          <Send size={24} className="text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-800 mb-2">No proposals yet</h3>
                          <p className="text-gray-600 mb-4">
                            You haven't submitted any proposals yet.
                          </p>
                          <Link
                            to="/requests"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                          >
                            <Briefcase size={18} />
                            Browse Requests
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myProposals.map((proposal) => {
                        const statusColor = getStatusColor(proposal.status);
                        const requestStatusColor = getStatusColor(proposal.request?.status || 'open');
                        const categoryColor = getCategoryColor(proposal.request?.category || '');
                        
                        return (
                          <div
                            key={proposal.id}
                            className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer relative"
                            onClick={() => navigate(`/proposals/${proposal.id}`)}
                            style={{
                              borderTopColor: categoryColor,
                              borderTopWidth: '3px'
                            }}
                          >
                            {/* Menu Button */}
                            <div className="absolute top-3 right-3 z-10">
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(showMenu === proposal.id ? null : proposal.id);
                                  }}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <MoreVertical size={16} className="text-gray-600" />
                                </button>
                                
                                {showMenu === proposal.id && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-10" 
                                      onClick={() => setShowMenu(null)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-48">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/proposals/${proposal.id}`);
                                          setShowMenu(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                                      >
                                        <Eye size={16} />
                                        View Details
                                      </button>
                                      {proposal.status === 'pending' && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            confirmWithdraw(proposal);
                                          }}
                                          className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                                        >
                                          <XCircle size={16} />
                                          Withdraw Proposal
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div 
                              className="py-3 px-4 border-b border-gray-200"
                              style={{ backgroundColor: `${categoryColor}20` }}
                            >
                              <div className="flex justify-between items-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                                  statusColor === 'green' ? 'bg-green-100 text-green-800' :
                                  statusColor === 'red' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  requestStatusColor === 'green' ? 'bg-green-100 text-green-800' :
                                  requestStatusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                                  requestStatusColor === 'purple' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  Request: {proposal.request?.status?.charAt(0).toUpperCase() + proposal.request?.status?.slice(1)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="p-4">
                              <div className="space-y-4">
                                <h3 className="text-lg font-bold text-gray-800 line-clamp-2">
                                  {proposal.title}
                                </h3>
                                
                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                                  <p className="text-indigo-800 text-sm font-medium mb-1">
                                    Proposal for:
                                  </p>
                                  <p className="text-indigo-700 text-sm line-clamp-1">
                                    {proposal.request?.title}
                                  </p>
                                </div>
                                
                                <p className="text-gray-600 text-sm line-clamp-2">
                                  {proposal.description}
                                </p>
                                
                                <div className="flex gap-2 flex-wrap">
                                  <span 
                                    className="px-3 py-1 rounded-full text-xs font-medium text-white"
                                    style={{ backgroundColor: categoryColor }}
                                  >
                                    {proposal.request?.category}
                                  </span>
                                </div>
                                
                                <div className="flex gap-2 flex-wrap">
                                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
                                    <DollarSign size={12} />
                                    {proposal.proposed_amount} {proposal.payment_token || 'EGLD'}
                                  </span>
                                  
                                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1">
                                    <Clock size={12} />
                                    {proposal.proposed_duration} days
                                  </span>
                                </div>
                                
                                <div className="border-t border-gray-200 pt-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 text-xs">
                                      Submitted {new Date(proposal.created_at).toLocaleDateString()}
                                    </span>
                                    
                                    <div className="flex items-center gap-1">
                                      {proposal.status === 'accepted' ? (
                                        <div className="flex items-center gap-1">
                                          <CheckCircle size={14} className="text-green-600" />
                                          <span className="text-green-600 text-xs font-medium">Accepted</span>
                                        </div>
                                      ) : proposal.status === 'rejected' ? (
                                        <div className="flex items-center gap-1">
                                          <XCircle size={14} className="text-red-600" />
                                          <span className="text-red-600 text-xs font-medium">Rejected</span>
                                        </div>
                                      ) : proposal.status === 'withdrawn' ? (
                                        <div className="flex items-center gap-1">
                                          <XCircle size={14} className="text-gray-600" />
                                          <span className="text-gray-600 text-xs font-medium">Withdrawn</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <Clock size={14} className="text-blue-600" />
                                          <span className="text-blue-600 text-xs font-medium">Pending</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash2 size={24} className="text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Delete Request</h3>
                      <p className="text-gray-600 text-sm">This action cannot be undone</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700">
                    Are you sure you want to delete this request? All associated proposals will also be removed.
                  </p>
                  
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => setShowDeleteModal(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDeleteRequest}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      disabled={deleteRequest.isLoading}
                    >
                      {deleteRequest.isLoading ? 'Deleting...' : 'Delete Request'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Proposal Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <XCircle size={24} className="text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Withdraw Proposal</h3>
                      <p className="text-gray-600 text-sm">Remove your proposal from consideration</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700">
                    Are you sure you want to withdraw your proposal for "{proposalToWithdraw?.request?.title}"?
                  </p>
                  
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => setShowWithdrawModal(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleWithdrawProposal}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                      disabled={withdrawProposal.isLoading}
                    >
                      {withdrawProposal.isLoading ? 'Withdrawing...' : 'Withdraw Proposal'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};