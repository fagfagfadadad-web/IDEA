import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Check, Star, MessageCircle, DollarSign, Coins, AlertTriangle, Calendar, Clock, Send, FileText, CheckCheck, X, Tag as TagIcon, User } from 'lucide-react';
import { Button, Card } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useClientRequestById, useSelectProposal } from '../../hooks/useClientRequests';
import { useCreateProposal, useWithdrawProposal } from '../../hooks/useProposals';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const ClientRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  
  const { data: request, isLoading, error, refetch } = useClientRequestById(id || '');
  const createProposal = useCreateProposal();
  const withdrawProposal = useWithdrawProposal();
  const selectProposal = useSelectProposal();

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
      showError('Please login to submit a proposal');
      return;
    }

    // Validate required fields
    if (!proposalForm.title.trim()) {
      showError('Please provide a title for your proposal');
      return;
    }

    if (!proposalForm.description.trim()) {
      showError('Please provide a description for your proposal');
      return;
    }

    if (!proposalForm.proposed_amount) {
      showError('Please provide a proposed amount');
      return;
    }

    if (!proposalForm.proposed_duration) {
      showError('Please provide a proposed duration');
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
        deliverables: deliverables,
      });

      success('Proposal submitted successfully');
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
      refetch();
    } catch (error) {
      showError('Error submitting proposal. Please try again later.');
    }
  };

  const handleWithdrawProposal = async (proposalId: string) => {
    try {
      await withdrawProposal.mutateAsync({ id: proposalId, requestId: id! });
      success('Proposal withdrawn successfully');
      refetch();
    } catch (error) {
      showError('Error withdrawing proposal. Please try again later.');
    }
  };

  const handleSelectProposal = async (proposalId: string) => {
    try {
      const result = await selectProposal.mutateAsync({ requestId: id!, proposalId });
      success('Proposal accepted and order created');
      navigate(`/orders/${result.orderId}`);
    } catch (error) {
      showError('Error accepting proposal. Please try again later.');
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
  
  const canSubmitProposal = isLoggedIn && !isClient && !userProposal &&
                           (request?.status === 'open' || request?.status === 'in_review');
  
  const canWithdrawProposal = userProposal && userProposal.status === 'pending';
  const canSelectProposal = isClient && (request?.status === 'open' || request?.status === 'in_review');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
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
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertTriangle className="text-red-500 mr-3" size={20} />
              <span className="text-red-700">{error ? `Error: ${error.message}` : 'Request not found'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const categoryColor = getCategoryColor(request.category);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
        <div className="space-y-6 md:space-y-8">
          {/* Request Header */}
          <div className="gradient-card p-6 md:p-8">
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{request.title}</h1>
                  <p className="text-gray-600 mb-4">
                    Request ID: <span className="font-mono text-sm">{request.id}</span>
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
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

              {/* Client Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-lg text-white">
                  {request.client?.username?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium">
                    {request.client?.full_name || request.client?.username}
                  </p>
                  <p className="text-gray-600 text-sm">
                    Client • Member since {new Date(request.client?.created_at || request.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  to={`/profile/${request.client?.id}`}
                  className="text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <User size={20} />
                </Link>
              </div>

              {/* Project Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Project Description</h3>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {request.description}
                  </p>
                </div>
              </div>

              {/* Project Requirements */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TagIcon size={16} style={{ color: categoryColor }} />
                    <span className="text-gray-600 text-sm font-medium">Category</span>
                  </div>
                  <p className="text-gray-800 font-bold">{request.category}</p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={16} className="text-green-600" />
                    <span className="text-gray-600 text-sm font-medium">Budget</span>
                  </div>
                  <p className="text-gray-800 font-bold">{formatBudget(request.budget_min, request.budget_max)}</p>
                </div>

                {request.deadline && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={16} className="text-orange-600" />
                      <span className="text-gray-600 text-sm font-medium">Deadline</span>
                    </div>
                    <p className="text-gray-800 font-bold">{formatDeadline(request.deadline)}</p>
                  </div>
                )}

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-blue-600" />
                    <span className="text-gray-600 text-sm font-medium">Expires</span>
                  </div>
                  <p className="text-gray-800 font-bold">{new Date(request.expires_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Required Skills */}
              {request.skills_needed && request.skills_needed.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-800">Required Skills</h3>
                  <div className="flex gap-2 flex-wrap">
                    {request.skills_needed.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {canSubmitProposal && (
                  <Button
                    onClick={() => setIsProposalModalOpen(true)}
                    variant="gradient"
                    className="flex items-center gap-2"
                  >
                    <Send size={16} />
                    Submit Proposal
                  </Button>
                )}

                {canWithdrawProposal && (
                  <Button
                    onClick={() => handleWithdrawProposal(userProposal.id)}
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <X size={16} />
                    Withdraw My Proposal
                  </Button>
                )}

                {!isLoggedIn && (
                  <Button
                    onClick={() => navigate('/unlock')}
                    variant="gradient"
                  >
                    Login to Submit Proposal
                  </Button>
                )}

                {userProposal && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCheck className="text-blue-600" size={16} />
                      <span className="text-blue-800 font-medium">You have already submitted a proposal for this request</span>
                    </div>
                    <Button
                      onClick={() => navigate(`/proposals/${userProposal.id}`)}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      View My Proposal
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Proposals Section */}
          {(request.status === 'open' || request.status === 'in_review') && (
            <div className="gradient-card p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                  Proposals ({request.proposals?.length || 0})
                </h2>
                {request.proposals && request.proposals.length > 0 && (
                  <span className="text-gray-600 text-sm">
                    {request.proposals.filter(p => p.status === 'pending').length} pending
                  </span>
                )}
              </div>
              
              {!request.proposals || request.proposals.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg mb-2">No proposals yet</p>
                  <p className="text-gray-500">Be the first to submit a proposal for this project!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {request.proposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      {/* Proposal Header */}
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-lg text-white">
                              {proposal.provider?.username?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="text-gray-800 font-bold text-lg">
                                {proposal.provider?.full_name || proposal.provider?.username}
                              </p>
                              <p className="text-gray-600 text-sm">
                                Service Provider
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
                              <DollarSign size={14} />
                              {proposal.proposed_amount} {proposal.payment_token || 'EGLD'}
                            </span>
                            
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-1">
                              <Clock size={14} />
                              {proposal.proposed_duration} days
                            </span>

                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              proposal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Proposal Content */}
                      <div className="p-6 space-y-4">
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
                            <p className="text-gray-800 font-medium mb-3">
                              What you'll get:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {proposal.deliverables.map((deliverable: string, index: number) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Check className="text-green-500 flex-shrink-0" size={16} />
                                  <span className="text-gray-700">{deliverable}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Proposal Actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-200">
                          <span className="text-gray-500 text-sm">
                            Submitted {new Date(proposal.created_at).toLocaleDateString()}
                          </span>
                          
                          <div className="flex gap-3">
                            <Button
                              onClick={() => navigate(`/proposals/${proposal.id}`)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <FileText size={16} />
                              View Details
                            </Button>
                            
                            {canSelectProposal && proposal.status === 'pending' && (
                              <Button
                                onClick={() => handleSelectProposal(proposal.id)}
                                disabled={selectProposal.isLoading}
                                variant="gradient"
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <CheckCheck size={16} />
                                {selectProposal.isLoading ? 'Accepting...' : 'Accept Proposal'}
                              </Button>
                            )}

                            {proposal.provider_id === user?.id && proposal.status === 'pending' && (
                              <Button
                                onClick={() => handleWithdrawProposal(proposal.id)}
                                variant="outline"
                                size="sm"
                                className="border-red-600 text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <X size={16} />
                                Withdraw
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Proposal Modal */}
        {isProposalModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">Submit a Proposal</h3>
                  <button
                    onClick={() => setIsProposalModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="text-indigo-800 font-medium mb-2">Submitting proposal for:</h4>
                  <p className="text-indigo-700 font-bold">{request.title}</p>
                  <p className="text-indigo-600 text-sm">Budget: {formatBudget(request.budget_min, request.budget_max)}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-800 text-sm font-medium mb-2">
                      Proposal Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={proposalForm.title}
                      onChange={handleChange}
                      placeholder="e.g., Professional Mobile App Development"
                      className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-800 text-sm font-medium mb-2">
                      Proposal Description *
                    </label>
                    <textarea
                      name="description"
                      value={proposalForm.description}
                      onChange={handleChange}
                      placeholder="Describe your approach, experience, and why you're the best fit for this project..."
                      rows={6}
                      className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-800 text-sm font-medium mb-2">
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
                      <label className="block text-gray-800 text-sm font-medium mb-2">
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
                    <label className="block text-gray-800 text-sm font-medium mb-2">
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
                    <label className="block text-gray-800 text-sm font-medium mb-2">
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
                        type="button"
                        variant="outline"
                        className="px-4"
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
                      <p className="text-gray-800 font-medium mb-3">
                        Deliverables:
                      </p>
                      <div className="space-y-2">
                        {deliverables.map((deliverable, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Check className="text-green-500" size={16} />
                              <span className="text-gray-800">{deliverable}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveDeliverable(deliverable)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                  <Button
                    onClick={() => setIsProposalModalOpen(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitProposal}
                    disabled={createProposal.isLoading}
                    variant="gradient"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Send size={16} />
                    {createProposal.isLoading ? 'Submitting...' : 'Submit Proposal'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add bottom padding for mobile navigation */}
        <div className="h-20 md:h-0"></div>
      </div>
    </div>
  );
};