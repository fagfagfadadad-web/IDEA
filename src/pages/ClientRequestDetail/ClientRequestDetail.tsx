import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Check, Star, MessageCircle, DollarSign, Coins, AlertTriangle, Calendar, Clock, Send, FileText, CheckCheck, X } from 'lucide-react';
import { Button, Card } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { errorParse } from 'utils/errorParse';

// Mock data for demonstration
const mockRequest = {
  id: "1",
  title: "Need a Mobile App Developer",
  description: "Looking for an experienced React Native developer to build a mobile app for our startup. The app should include user authentication, real-time messaging, and payment integration.",
  category: "Programming & Tech",
  status: "open",
  budget_min: 200,
  budget_max: 500,
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
  skills_needed: ["React Native", "Node.js", "MongoDB", "Payment Integration"],
  client: {
    id: "client1",
    username: "startup_founder",
    full_name: "John Startup",
    avatar_url: "",
    created_at: new Date().toISOString()
  },
  proposals: [
    {
      id: "proposal1",
      title: "Professional Mobile App Development",
      description: "I have 5+ years of experience in React Native development and have built similar apps for startups. I can deliver a high-quality mobile app with all the features you need.",
      proposed_amount: 350,
      proposed_duration: 21,
      payment_token: "EGLD",
      status: "pending",
      created_at: new Date().toISOString(),
      deliverables: ["Source code", "App store deployment", "Documentation", "3 months support"],
      provider_id: "provider1",
      provider: {
        id: "provider1",
        username: "mobile_dev_pro",
        full_name: "Jane Developer",
        avatar_url: ""
      }
    }
  ],
  selected_proposal_id: null,
  selected_proposal: null
};

export const ClientRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  
  // Mock data - replace with real hooks
  const request = mockRequest;
  const isLoading = false;
  const error = null;

  // Mock user - replace with real auth context
  const user = isLoggedIn ? { id: 'user1', username: 'testuser' } : null;

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
      // Mock success
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
    } catch (error) {
      alert('Error submitting proposal');
    }
  };

  const handleWithdrawProposal = async (proposalId: string) => {
    try {
      alert('Proposal withdrawn successfully');
    } catch (error) {
      alert('Error withdrawing proposal');
    }
  };

  const handleSelectProposal = async (proposalId: string) => {
    try {
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
                           (request?.status === 'open' || request?.status === 'in_review');
  
  const canWithdrawProposal = userProposal && userProposal.status === 'pending';
  const canSelectProposal = isClient && (request?.status === 'open' || request?.status === 'in_review');

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="flex justify-center py-8">
          <div className="space-y-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-white">Loading request details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="bg-red-900 border border-red-500 rounded-md p-4">
          <div className="flex items-center">
            <span className="text-red-400 mr-2">⚠️</span>
            <span className="text-white">{error ? `Error: ${errorParse(error)}` : 'Request not found'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="space-y-8">
        {/* Request Header */}
        <Card className="p-8" title="Request Details" reference="#">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h1 className="text-2xl font-bold text-white">{request.title}</h1>
              <div className="flex gap-2">
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

            <hr className="border-gray-600" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-lg text-white">
                  {request.client?.username?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {request.client?.full_name || request.client?.username}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Client
                  </p>
                </div>
              </div>

              <div className="flex gap-4 flex-wrap">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {request.category}
                </span>
                
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm flex items-center gap-1">
                  <DollarSign size={14} />
                  {formatBudget(request.budget_min, request.budget_max)}
                </span>
                
                {request.deadline && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded text-sm flex items-center gap-1">
                    <Calendar size={14} />
                    Due by {formatDeadline(request.deadline)}
                  </span>
                )}
              </div>
            </div>

            <hr className="border-gray-600" />

            <div>
              <p className="text-white text-lg whitespace-pre-wrap">
                {request.description}
              </p>
            </div>

            {request.skills_needed && request.skills_needed.length > 0 && (
              <div>
                <p className="text-white font-medium mb-2">
                  Required Skills:
                </p>
                <div className="flex gap-2 flex-wrap">
                  {request.skills_needed.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <span className="text-gray-400">
                  Posted {new Date(request.created_at).toLocaleDateString()} • 
                  Expires {new Date(request.expires_at).toLocaleDateString()}
                </span>
              </div>

              {canSubmitProposal && (
                <Button
                  onClick={() => setIsProposalModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Send size={16} />
                  Submit Proposal
                </Button>
              )}

              {canWithdrawProposal && (
                <Button
                  onClick={() => handleWithdrawProposal(userProposal.id)}
                  className="border border-red-600 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <X size={16} />
                  Withdraw Proposal
                </Button>
              )}

              {!isLoggedIn && (
                <Button
                  onClick={() => navigate('/unlock')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Login to Submit Proposal
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Proposals Section */}
        {(request.status === 'open' || request.status === 'in_review') && (
          <Card className="p-8" title="Proposals" reference="#">
            <h2 className="text-xl font-bold text-white mb-6">All Proposals ({request.proposals?.length || 0})</h2>
            
            {request.proposals?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">
                  No proposals yet. Be the first to submit a proposal!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {request.proposals?.map((proposal) => (
                  <Card
                    key={proposal.id}
                    className="bg-gray-800 bg-opacity-50 rounded-lg overflow-hidden border border-gray-600 hover:border-blue-500 transition-all duration-300"
                    title="Proposal"
                    reference="#"
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-lg text-white">
                            {proposal.provider?.username?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {proposal.provider?.full_name || proposal.provider?.username}
                            </p>
                            <p className="text-gray-400 text-sm">
                              Provider
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm flex items-center gap-1">
                            <DollarSign size={14} />
                            {proposal.proposed_amount} {proposal.payment_token || 'EGLD'}
                          </span>
                          
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm flex items-center gap-1">
                            <Clock size={14} />
                            {proposal.proposed_duration} days
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-white font-medium mb-2">
                          {proposal.title}
                        </p>
                        <p className="text-white mb-4">
                          {proposal.description}
                        </p>
                      </div>
                      
                      {proposal.deliverables && proposal.deliverables.length > 0 && (
                        <div className="mb-4">
                          <p className="text-white font-medium mb-2">
                            Deliverables:
                          </p>
                          <ul className="space-y-2">
                            {proposal.deliverables.map((deliverable: string, index: number) => (
                              <li key={index} className="flex items-center">
                                <Check className="text-green-500 mr-3" size={16} />
                                <span className="text-white">{deliverable}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <hr className="border-gray-600" />

                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">
                          Submitted {new Date(proposal.created_at).toLocaleDateString()}
                        </span>
                        
                        <div className="flex gap-3">
                          <Button
                            onClick={() => navigate(`/proposals/${proposal.id}`)}
                            className="text-gray-300 hover:text-white bg-transparent border-none flex items-center gap-2"
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
                  </Card>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Submit Proposal Modal */}
      {isProposalModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" title="Submit Proposal" reference="#">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Submit a Proposal</h3>
                <Button
                  onClick={() => setIsProposalModalOpen(false)}
                  className="text-gray-400 hover:text-white bg-transparent border-none p-1"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Proposal Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={proposalForm.title}
                    onChange={handleChange}
                    placeholder="e.g., Professional DeFi Dashboard Development"
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Proposal Description *
                  </label>
                  <textarea
                    name="description"
                    value={proposalForm.description}
                    onChange={handleChange}
                    placeholder="Describe your approach to this project, your experience with similar projects, and why you're the best fit."
                    rows={6}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
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
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Duration (days) *
                    </label>
                    <input
                      type="number"
                      name="proposed_duration"
                      min="1"
                      value={proposalForm.proposed_duration}
                      onChange={handleChange}
                      placeholder="Days"
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Payment Token
                  </label>
                  <select
                    name="payment_token"
                    value={proposalForm.payment_token}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="EGLD">EGLD (10% platform fee)</option>
                    <option value="IDA-f9bc1d">IDA Token (No fees)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Deliverables
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDeliverable}
                      onChange={(e) => setNewDeliverable(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDeliverable())}
                      placeholder="e.g., Source code, Documentation, Design files"
                      className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Button
                      onClick={handleAddDeliverable}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md"
                    >
                      Add
                    </Button>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">
                    Press Enter to add a deliverable
                  </p>
                </div>

                {deliverables.length > 0 && (
                  <div>
                    <p className="text-white font-medium mb-2">
                      Deliverables:
                    </p>
                    <ul className="space-y-2">
                      {deliverables.map((deliverable, index) => (
                        <li key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Check className="text-green-500 mr-3" size={16} />
                            <span className="text-white">{deliverable}</span>
                          </div>
                          <Button
                            onClick={() => handleRemoveDeliverable(deliverable)}
                            className="text-red-400 hover:text-red-300 bg-transparent border-none p-1"
                          >
                            <X size={14} />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setIsProposalModalOpen(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitProposal}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  Submit Proposal
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};