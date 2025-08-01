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
  FileText
} from 'lucide-react';
import { Button, Card } from 'components';
import { useGetIsLoggedIn } from 'lib';

// Mock data for demonstration
const mockMyRequests = [
  {
    id: "1",
    title: "Need a Mobile App Developer",
    description: "Looking for an experienced React Native developer to build a mobile app for our startup.",
    category: "Programming & Tech",
    status: "open",
    budget_min: 200,
    budget_max: 500,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    proposals: [{ id: "p1" }, { id: "p2" }]
  }
];

const mockMyProposals = [
  {
    id: "1",
    title: "Professional Mobile App Development",
    description: "I have 5+ years of experience in React Native development...",
    proposed_amount: 350,
    proposed_duration: 21,
    payment_token: "EGLD",
    status: "pending",
    created_at: new Date().toISOString(),
    request: {
      id: "req1",
      title: "Need a Mobile App Developer",
      category: "Programming & Tech",
      status: "open"
    },
    orderId: null
  }
];

export const MyRequests = () => {
  // Mock data - replace with real hooks
  const myRequests = mockMyRequests;
  const myProposals = mockMyProposals;
  const requestsLoading = false;
  const proposalsLoading = false;
  const requestsError = null;
  const proposalsError = null;
  
  const isLoggedIn = useGetIsLoggedIn();
  const navigate = useNavigate();
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleCreateRequest = () => {
    navigate('/create-request');
  };

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;
    
    try {
      // Mock success
      alert('Request deleted successfully');
      setShowDeleteModal(false);
    } catch (error) {
      alert('Error deleting request. Please try again later.');
    }
  };

  const confirmDelete = (requestId: string) => {
    setRequestToDelete(requestId);
    setShowDeleteModal(true);
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
      default:
        return '#a63d2a';
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

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="bg-yellow-900 border border-yellow-500 rounded-md p-4">
          <div className="flex items-center">
            <span className="text-yellow-400 mr-2">⚠️</span>
            <span className="text-white">Please log in to view your requests and proposals.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold gradient-text mb-2">My Requests & Proposals</h1>
            <p className="text-gray-400">
              Manage your project requests and submitted proposals
            </p>
          </div>
          
          <Button
            onClick={handleCreateRequest}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 text-lg"
          >
            <Plus size={18} />
            Create Request
          </Button>
        </div>

        {/* Tabs */}
        <Card className="overflow-hidden" title="My Requests & Proposals" reference="#">
          <div className="border-b border-gray-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab(0)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 0
                    ? 'border-blue-500 text-blue-400 bg-gray-800'
                    : 'border-transparent text-gray-400 hover:text-blue-400'
                }`}
              >
                My Requests
              </button>
              <button
                onClick={() => setActiveTab(1)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 1
                    ? 'border-blue-500 text-blue-400 bg-gray-800'
                    : 'border-transparent text-gray-400 hover:text-blue-400'
                }`}
              >
                My Proposals
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {activeTab === 0 && (
              <div>
                {requestsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="space-y-4 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-white">Loading your requests...</p>
                    </div>
                  </div>
                ) : requestsError ? (
                  <div className="bg-red-900 border border-red-500 rounded-md p-4">
                    <div className="flex items-center">
                      <span className="text-red-400 mr-2">⚠️</span>
                      <span className="text-white">Error loading your requests. Please try again later.</span>
                    </div>
                  </div>
                ) : myRequests?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">
                      You haven't created any requests yet.
                    </p>
                    <Button
                      onClick={handleCreateRequest}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
                    >
                      <Plus size={18} />
                      Create your first request
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myRequests?.map((request) => {
                      const statusColor = getStatusColor(request.status);
                      const categoryColor = getCategoryColor(request.category);
                      const proposalsCount = request.proposals?.length || 0;
                      
                      return (
                        <Card
                          key={request.id}
                          className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden relative"
                          title="Request"
                          reference="#"
                          onClick={() => navigate(`/requests/${request.id}`)}
                          style={{
                            borderTopColor: categoryColor,
                            borderTopWidth: '3px'
                          }}
                        >
                          {/* Menu Button */}
                          <div className="absolute top-2 right-2 z-10">
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Toggle menu - simplified for this example
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <MoreVertical size={16} className="text-gray-600" />
                              </button>
                            </div>
                          </div>
                          
                          <div 
                            className="py-2 px-4 border-b border-gray-200"
                            style={{ backgroundColor: `${categoryColor}20` }}
                          >
                            <div className="flex justify-between items-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                            <div className="space-y-3">
                              <h3 className="text-lg font-bold text-gray-800 line-clamp-2">
                                {request.title}
                              </h3>
                              
                              <p className="text-gray-600 text-sm line-clamp-3">
                                {request.description}
                              </p>
                              
                              <hr className="border-gray-200" />
                              
                              <div className="flex gap-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs flex items-center gap-1">
                                  <TagIcon size={12} />
                                  {request.category}
                                </span>
                                
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1">
                                  <DollarSign size={12} />
                                  {formatBudget(request.budget_min, request.budget_max)}
                                </span>
                              </div>
                              
                              <div className="flex gap-2">
                                {request.deadline && (
                                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs flex items-center gap-1">
                                    <Calendar size={12} />
                                    {formatDeadline(request.deadline)}
                                  </span>
                                )}
                                
                                <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                                  proposalsCount > 0 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  <Briefcase size={12} />
                                  {proposalsCount} proposal{proposalsCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                              
                              <hr className="border-gray-200" />
                              
                              <div className="flex items-center gap-1">
                                <Clock size={14} className="text-gray-400" />
                                <span className="text-gray-500 text-xs">
                                  Expires {new Date(request.expires_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
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
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-white">Loading your proposals...</p>
                    </div>
                  </div>
                ) : proposalsError ? (
                  <div className="bg-red-900 border border-red-500 rounded-md p-4">
                    <div className="flex items-center">
                      <span className="text-red-400 mr-2">⚠️</span>
                      <span className="text-white">Error loading your proposals. Please try again later.</span>
                    </div>
                  </div>
                ) : myProposals?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">
                      You haven't submitted any proposals yet.
                    </p>
                    <Link
                      to="/requests"
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                    >
                      <Briefcase size={18} />
                      Browse Requests
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myProposals?.map((proposal) => {
                      const statusColor = 
                        proposal.status === 'pending' ? 'blue' : 
                        proposal.status === 'accepted' ? 'green' : 
                        proposal.status === 'rejected' ? 'red' : 
                        proposal.status === 'withdrawn' ? 'gray' : 'gray';
                      
                      const requestStatusColor = getStatusColor(proposal.request?.status || 'open');
                      const categoryColor = getCategoryColor(proposal.request?.category || '');
                      
                      return (
                        <Card
                          key={proposal.id}
                          className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
                          title="Proposal"
                          reference="#"
                          onClick={() => navigate(`/proposals/${proposal.id}`)}
                          style={{
                            borderTopColor: categoryColor,
                            borderTopWidth: '3px'
                          }}
                        >
                          <div 
                            className="py-2 px-4 border-b border-gray-200"
                            style={{ backgroundColor: `${categoryColor}20` }}
                          >
                            <div className="flex justify-between items-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                                'bg-gray-100 text-gray-800'
                              }`}>
                                Request: {proposal.request?.status.charAt(0).toUpperCase() + proposal.request?.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="p-4">
                            <div className="space-y-3">
                              <h3 className="text-lg font-bold text-gray-800 line-clamp-2">
                                {proposal.title}
                              </h3>
                              
                              <p className="text-gray-600 text-sm line-clamp-1">
                                For: {proposal.request?.title}
                              </p>
                              
                              <p className="text-gray-600 text-sm line-clamp-2">
                                {proposal.description}
                              </p>
                              
                              <hr className="border-gray-200" />
                              
                              <div className="flex gap-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs flex items-center gap-1">
                                  <TagIcon size={12} />
                                  {proposal.request?.category}
                                </span>
                              </div>
                              
                              <div className="flex gap-2">
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1">
                                  <DollarSign size={12} />
                                  {proposal.proposed_amount} {proposal.payment_token || 'EGLD'}
                                </span>
                                
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs flex items-center gap-1">
                                  <Clock size={12} />
                                  {proposal.proposed_duration} days
                                </span>
                              </div>
                              
                              <hr className="border-gray-200" />
                              
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-xs">
                                  Submitted {new Date(proposal.created_at).toLocaleDateString()}
                                </span>
                                <div className="flex items-center gap-1">
                                  {proposal.status === 'accepted' && proposal.orderId ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/orders/${proposal.orderId}`);
                                      }}
                                      className="text-xs bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1"
                                    >
                                      <FileText size={12} />
                                      View Order
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <FileText size={14} className="text-gray-400" />
                                      <span className="text-gray-500 text-xs">View Details</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="p-6 max-w-md w-full mx-4" title="Delete Request" reference="#">
              <h3 className="text-xl font-bold text-white mb-4">Delete Request</h3>
              <p className="text-gray-400 mb-4">
                Are you sure you want to delete this request? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteRequest}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg"
                >
                  Delete
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};