import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Check, Star, MessageCircle, DollarSign, Coins, AlertTriangle, Calendar, Clock, Send, FileText, CheckCheck, X } from 'lucide-react';
import { Button, Card } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useClientRequestById, useCreateProposal } from '../../hooks/useClientRequests';
import { useAuth } from '../../context/AuthContext';
import { errorParse } from 'utils/errorParse';

export const ClientRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  
  // Use real hooks
  const { data: request, isLoading, error, refetch } = useClientRequestById(id || '');
  const createProposal = useCreateProposal();

  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    title: '',
    description: '',
    proposed_amount: '',
    proposed_duration: '',
    payment_token: 'EGLD',
  });

  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [newDeliverable, setNewDeliverable] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProposalForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddDeliverable = () => {
    if (newDeliverable.trim() && !deliverables.includes(newDeliverable.trim())) {
      setDeliverables([...deliverables, newDeliverable.trim()]);
      setNewDeliverable('');
    }
  };

  const handleRemoveDeliverable = (deliverable: string) => {
    setDeliverables(deliverables.filter(d => d !== deliverable));
  };

  const handleSubmitProposal = async () => {
    if (!isLoggedIn || !user) {
      alert('Please login to submit a proposal');
      return;
    }

    // Validate required fields
    if (!proposalForm.title.trim()) {
      alert('Please provide a title for your proposal');
      return;
    }

    if (!proposalForm.description.trim()) {
      alert('Please provide a description for your proposal');
      return;
    }

    if (!proposalForm.proposed_amount) {
      alert('Please provide a proposed amount');
      return;
    }

    if (!proposalForm.proposed_duration) {
      alert('Please provide a proposed duration');
      return;
    }

    try {
      await createProposal.mutateAsync({
        request_id: id!,
        title: proposalForm.title,
        description: proposalForm.description,
        proposed_amount: parseFloat(proposalForm.proposed_amount),
        proposed_duration: parseInt(proposalForm.proposed_duration),
        payment_token: proposalForm.payment_token,
        deliverables: deliverables
      });

      alert('Proposal submitted successfully');
      setIsProposalModalOpen(false);
      
      // Reset form
      setProposalForm({
        title: '',
        description: '',
        proposed_amount: '',
        proposed_duration: '',
        payment_token: 'EGLD',
      });
      setDeliverables([]);
      
      // Refresh data
      refetch();
    } catch (error) {
      console.error('Error submitting proposal:', error);
      alert('Error submitting proposal');
    }
  };

  const handleWithdrawProposal = async (proposalId: string) => {
    try {
      // This would use a real hook
      alert('Proposal withdrawn successfully');
      refetch();
    } catch (error) {
      alert('Error withdrawing proposal');
    }
  };

  const handleSelectProposal = async (proposalId: string) => {
    try {
      // This would use a real hook
      alert('Proposal accepted and order created');
      navigate(`/orders/mock-order-id`);
    } catch (error) {
      alert('Error accepting proposal');
    }
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

  // Check if current user has already submitted a proposal
  const userProposal = request?.proposals?.find(p => p.provider_id === user?.id);
  const isClient = user?.id === request?.client?.id;
  
  const canSubmitProposal = isLoggedIn && !isClient && 
                           (request?.status === 'open' || request?.status === 'in_review') &&
                           !userProposal;
  
  const canWithdrawProposal = userProposal && userProposal.status === 'pending';
  const canSelectProposal = isClient && (request?.status === 'open' || request?.status === 'in_review');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="flex justify-center py-8">
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-700">Loading request details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertTriangle className="text-red-500 mr-3" size={20} />
              <span className="text-red-700 font-medium">
                {error ? `Error: ${errorParse(error)}` : 'Request not found'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const categoryColor = getCategoryColor(request.category);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-8">
          {/* Request Header */}
          <div className="gradient-card p-8">
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{request.title}</h1>
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: categoryColor }}
                    >
                      {request.category}
                    </span>
                    <span className="text-gray-500 text-sm">•</span>
                    <span className="text-gray-600 text-sm">
                      Posted {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    getStatusColor(request.status) === 'green' ? 'bg-green-100 text-green-800' :
                    getStatusColor(request.status) === 'blue' ? 'bg-blue-100 text-blue-800' :
                    getStatusColor(request.status) === 'purple' ? 'bg-purple-100 text-purple-800' :
                    getStatusColor(request.status) === 'red' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                  
                  {request.status === 'assigned' && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      Proposal Selected
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-pink-50 rounded-lg p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-xl font-bold text-white">
                      {request.client?.username?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        {request.client?.full_name || request.client?.username}
                      </h3>
                      <p className="text-gray-600">
                        Client • Member since {new Date(request.client?.created_at || '').toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                      <DollarSign size={18} className="text-green-600" />
                      <span className="font-bold text-gray-800">
                        {formatBudget(request.budget_min, request.budget_max)}
                      </span>
                    </div>
                    
                    {request.deadline && (
                      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                        <Calendar size={18} className="text-orange-600" />
                        <span className="font-medium text-gray-800">
                          Due {formatDeadline(request.deadline)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Project Description</h2>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                    {request.description}
                  </p>
                </div>
              </div>

              {request.skills_needed && request.skills_needed.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-800">Required Skills</h3>
                  <div className="flex gap-2 flex-wrap">
                    {request.skills_needed.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={16} />
                    <span className="text-sm">
                      Expires on {new Date(request.expires_at).toLocaleDateString()} • 
                      {Math.ceil((new Date(request.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                    </span>
                  </div>

                  <div className="flex gap-3">
                    {canSubmitProposal && (
                      <Button
                        onClick={() => setIsProposalModalOpen(true)}
                        variant="gradient"
                        size="md"
                      >
                        <Send size={16} />
                        Submit Proposal
                      </Button>
                    )}

                    {canWithdrawProposal && (
                      <Button
                        onClick={() => handleWithdrawProposal(userProposal.id)}
                        className="border-2 border-red-500 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <X size={16} />
                        Withdraw Proposal
                      </Button>
                    )}

                    {!isLoggedIn && (
                      <Button
                        onClick={() => navigate('/unlock')}
                        variant="gradient"
                        size="md"
                      >
                        Login to Submit Proposal
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Proposals Section */}
          {(request.status === 'open' || request.status === 'in_review') && (
            <div className="gradient-card p-8">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Proposals ({request.proposals?.length || 0})
                  </h2>
                  {request.proposals && request.proposals.length > 0 && (
                    <span className="text-gray-600 text-sm">
                      {request.proposals.filter((p: any) => p.status === 'pending').length} pending
                    </span>
                  )}
                </div>
                
                {!request.proposals || request.proposals.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                        <FileText size={24} className="text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2">No proposals yet</h3>
                        <p className="text-gray-600">
                          Be the first to submit a proposal for this project!
                        </p>
                      </div>
                      {canSubmitProposal && (
                        <Button
                          onClick={() => setIsProposalModalOpen(true)}
                          variant="gradient"
                          size="md"
                        >
                          <Send size={16} />
                          Submit First Proposal
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {request.proposals.map((proposal) => (
                      <div
                        key={proposal.id}
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                      >
                        <div className="p-6 space-y-4">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-lg font-bold text-white">
                                {proposal.provider?.username?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-gray-800">
                                  {proposal.provider?.full_name || proposal.provider?.username}
                                </h3>
                                <p className="text-gray-600 text-sm">
                                  Service Provider
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <DollarSign size={16} className="text-green-600" />
                                  <span className="font-bold text-green-800">
                                    {proposal.proposed_amount} {proposal.payment_token || 'EGLD'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Clock size={16} className="text-blue-600" />
                                  <span className="font-bold text-blue-800">
                                    {proposal.proposed_duration} days
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h4 className="text-lg font-bold text-gray-800 mb-2">
                                {proposal.title}
                              </h4>
                              <p className="text-gray-700 leading-relaxed">
                                {proposal.description}
                              </p>
                            </div>
                            
                            {proposal.deliverables && proposal.deliverables.length > 0 && (
                              <div>
                                <h4 className="text-md font-bold text-gray-800 mb-3">
                                  What's Included:
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {proposal.deliverables.map((deliverable: string, index: number) => (
                                    <div key={index} className="flex items-center bg-green-50 p-3 rounded-lg">
                                      <Check className="text-green-600 mr-3 flex-shrink-0" size={16} />
                                      <span className="text-gray-800">{deliverable}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-gray-200 pt-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                              <span className="text-gray-500 text-sm">
                                Submitted {new Date(proposal.created_at).toLocaleDateString()} at {new Date(proposal.created_at).toLocaleTimeString()}
                              </span>
                              
                              <div className="flex gap-3">
                                <Button
                                  onClick={() => navigate(`/proposals/${proposal.id}`)}
                                  variant="outline"
                                  size="sm"
                                >
                                  <FileText size={16} />
                                  View Details
                                </Button>
                                
                                {isClient && canSelectProposal && (
                                  <Button
                                    onClick={() => handleSelectProposal(proposal.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                                  >
                                    <CheckCheck size={16} />
                                    Accept Proposal
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Submit Proposal Modal */}
        {isProposalModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-800">Submit a Proposal</h3>
                  <Button
                    onClick={() => setIsProposalModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 bg-transparent border-none p-1"
                  >
                    <X size={24} />
                  </Button>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="font-bold text-indigo-800 mb-2">Proposing for:</h4>
                  <p className="text-indigo-700">{request.title}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-800 text-sm font-bold mb-2">
                      Proposal Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={proposalForm.title}
                      onChange={handleChange}
                      placeholder="e.g., Professional DeFi Dashboard Development"
                      className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-800 text-sm font-bold mb-2">
                      Proposal Description *
                    </label>
                    <textarea
                      name="description"
                      value={proposalForm.description}
                      onChange={handleChange}
                      placeholder="Describe your approach to this project, your experience with similar projects, and why you're the best fit."
                      rows={6}
                      className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-800 text-sm font-bold mb-2">
                        Proposed Amount *
                      </label>
                      <input
                        type="number"
                        name="proposed_amount"
                        min="0"
                        step="0.01"
                        value={proposalForm.proposed_amount}
                        onChange={handleChange}
                        placeholder="Amount"
                        className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-800 text-sm font-bold mb-2">
                        Duration (days) *
                      </label>
                      <input
                        type="number"
                        name="proposed_duration"
                        min="1"
                        value={proposalForm.proposed_duration}
                        onChange={handleChange}
                        placeholder="Days"
                        className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-800 text-sm font-bold mb-2">
                      Payment Token
                    </label>
                    <select
                      name="payment_token"
                      value={proposalForm.payment_token}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="EGLD">EGLD (10% platform fee)</option>
                      <option value="IDA-f9bc1d">IDA Token (No fees)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-800 text-sm font-bold mb-2">
                      Deliverables
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newDeliverable}
                        onChange={(e) => setNewDeliverable(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDeliverable())}
                        placeholder="e.g., Source code, Documentation, Design files"
                        className="flex-1 p-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <Button
                        onClick={handleAddDeliverable}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg"
                      >
                        Add
                      </Button>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                      Press Enter to add a deliverable
                    </p>
                  </div>

                  {deliverables.length > 0 && (
                    <div>
                      <p className="text-gray-800 font-bold mb-3">
                        Deliverables:
                      </p>
                      <div className="space-y-2">
                        {deliverables.map((deliverable, index) => (
                          <div key={index} className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                            <div className="flex items-center">
                              <Check className="text-green-600 mr-3" size={16} />
                              <span className="text-gray-800">{deliverable}</span>
                            </div>
                            <Button
                              onClick={() => handleRemoveDeliverable(deliverable)}
                              className="text-red-500 hover:text-red-700 bg-transparent border-none p-1"
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => setIsProposalModalOpen(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitProposal}
                    disabled={createProposal.isLoading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Send size={16} />
                    {createProposal.isLoading ? 'Submitting...' : 'Submit Proposal'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};