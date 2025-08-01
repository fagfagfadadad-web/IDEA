import React from 'react';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  Check, 
  Send, 
  FileText, 
  CheckCheck, 
  X,
  User
} from 'lucide-react';
import { Button, Card } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useProposalById, useWithdrawProposal, useSelectProposal } from 'hooks';

export const ProposalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { data: proposal, isLoading, error } = useProposalById(id || '');
  const { mutateAsync: selectProposalMutation } = useSelectProposal();
  const { mutateAsync: withdrawProposalMutation } = useWithdrawProposal();
  
  // Mock user - replace with real auth context
  const user = isLoggedIn ? { id: 'client1', username: 'testuser' } : null;

  const [activeTab, setActiveTab] = useState(0);

  const handleSelectProposal = async () => {
    if (!proposal?.request_id || !id) return;
    
    try {
      await selectProposalMutation({ requestId: proposal.request_id, proposalId: id });
      alert('Proposal accepted and order created');
      navigate(`/orders/${id}`);
    } catch (error) {
      alert('Error accepting proposal');
    }
  };

  const handleWithdrawProposal = async () => {
    if (!proposal?.request_id || !id) return;
    
    try {
      await withdrawProposalMutation({ id, requestId: proposal.request_id });
      alert('Proposal withdrawn successfully');
      navigate(`/requests/${proposal.request_id}`);
    } catch (error) {
      alert('Error withdrawing proposal');
    }
  };

  // Determine user roles correctly
  const isClient = user?.id === proposal.request?.client?.id;
  const isProvider = user?.id === proposal.provider_id;
  
  // Check if this proposal has been accepted and an order created
  const isAccepted = proposal.status === 'accepted';
  
  // Only allow actions if user is a participant and has the right role
  const canSelectProposal = isClient && proposal.status === 'pending' && 
                           (proposal.request?.status === 'open' || proposal.request?.status === 'in_review');
  const canWithdrawProposal = isProvider && proposal.status === 'pending';

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="flex justify-center py-8">
          <div className="space-y-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-white">Loading proposal details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="bg-red-900 border border-red-500 rounded-md p-4">
          <div className="flex items-center">
            <span className="text-red-400 mr-2">⚠️</span>
            <span className="text-white">{error ? `Error: ${error instanceof Error ? error.message : 'Unknown error'}` : 'Proposal not found'}</span>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 0, label: 'Proposal Details', icon: <FileText size={16} /> },
    { id: 1, label: 'Messages', icon: <Send size={16} /> },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="space-y-8">
        {/* Proposal Header */}
        <Card className="p-8" title="Proposal Header" reference="#">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-white">{proposal.title}</h1>
                <p className="text-gray-400">
                  Proposal for: <span className="text-blue-400">{proposal.request?.title}</span>
                </p>
              </div>
              
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                proposal.status === 'pending' ? 'bg-blue-100 text-blue-800' : 
                proposal.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                proposal.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                'bg-gray-100 text-gray-800'
              }`}>
                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
              </span>
            </div>

            <hr className="border-gray-600" />

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

              <div className="flex gap-4">
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
          </div>
        </Card>

        {/* Tabs for Proposal Details and Chat */}
        <Card className="p-8" title="Proposal Details" reference="#">
          {/* Tab Navigation */}
          <div className="border-b border-gray-700 mb-6">
            <div className="flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400 bg-gray-800'
                      : 'border-transparent text-gray-400 hover:text-blue-400'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Tab Content */}
          <div>
            {activeTab === 0 && (
              <div className="space-y-6">
                <div>
                  <p className="text-white text-lg whitespace-pre-wrap">
                    {proposal.description}
                  </p>
                </div>

                {proposal.deliverables && proposal.deliverables.length > 0 && (
                  <div>
                    <p className="text-white font-medium mb-2">
                      Deliverables:
                    </p>
                    <div className="space-y-2">
                      {proposal.deliverables.map((deliverable: string, index: number) => (
                        <div key={index} className="flex items-center">
                          <Check className="text-green-500 mr-3" size={16} />
                          <span className="text-white">{deliverable}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <hr className="border-gray-600" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <p className="text-gray-400">
                    Submitted {new Date(proposal.created_at).toLocaleDateString()}
                  </p>

                  <div className="flex gap-3">
                    {canWithdrawProposal && (
                      <Button
                        onClick={handleWithdrawProposal}
                        className="border border-red-600 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <X size={16} />
                        Withdraw Proposal
                      </Button>
                    )}

                    {canSelectProposal && (
                      <Button
                        onClick={handleSelectProposal}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <CheckCheck size={16} />
                        Accept Proposal
                      </Button>
                    )}
                    
                    {isAccepted && (
                      <Button
                        onClick={() => navigate(`/orders/${proposal.orderId || id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <FileText size={16} />
                        Go to Order Details
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 1 && (
              <div>
                {isAccepted ? (
                  <div className="bg-green-100 border border-green-500 rounded-md p-4 mb-4">
                    <div className="flex items-center">
                      <span className="text-green-800 mr-2">✅</span>
                      <div className="space-y-2 w-full">
                        <p className="text-green-800 text-sm">
                          This proposal has been accepted and an order has been created. You can view the order details in your orders section.
                        </p>
                        <Button
                          onClick={() => navigate(`/orders/${proposal.orderId || id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                          <FileText size={16} />
                          Go to Order Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-400">Chat functionality will be implemented here</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};