import React, { useState } from 'react';
import { Button, Card } from 'components';
import { useGetIsLoggedIn } from 'lib';

// Mock data for demonstration
const mockDisputes = [
  {
    id: "1",
    reason: "Work not delivered as promised",
    created_at: new Date().toISOString(),
    order_id: {
      id: "order1",
      amount: 100,
      gig_id: {
        title: "Web Development Project",
        provider_id: { username: "developer123", avatar_url: "" }
      },
      client_id: { username: "client456", avatar_url: "" }
    },
    created_by: { username: "client456", avatar_url: "" }
  }
];

const useDisputes = () => {
  // Mock implementation - replace with real API call
  return {
    data: mockDisputes,
    isLoading: false,
    error: null as Error | null
  };
};

const useResolveDispute = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async ({ disputeId, orderId, refundToClient }: { 
    disputeId: string; 
    orderId: string; 
    refundToClient: boolean 
  }) => {
    setIsLoading(true);
    try {
      // Mock API call - replace with real implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Resolving dispute:', { disputeId, orderId, refundToClient });
      alert('Dispute resolved successfully');
      return 'mock-tx-hash';
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

export const AdminDisputes: React.FC = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const { data: disputes, isLoading, error } = useDisputes();
  const resolveDispute = useResolveDispute();
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [refundToClient, setRefundToClient] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);

  // Mock user - replace with real auth context
  const user = isLoggedIn ? { id: 'admin1', username: 'admin', is_admin: true } : null;

  const handleResolve = async () => {
    if (!selectedDispute) return;

    try {
      await resolveDispute.mutateAsync({
        disputeId: selectedDispute.id,
        orderId: selectedDispute.order_id.id,
        refundToClient,
      });
      setShowModal(false);
    } catch (error) {
      console.error('Error resolving dispute:', error);
    }
  };

  if (!user || !user.is_admin) {
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
              <p className="text-white">Loading disputes...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8 text-center" title="Error" reference="#">
          <p className="text-red-400">Error loading disputes: {error.message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <Card className="p-8" title="Dispute Management" reference="#">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Admin - Dispute Management</h2>
          
          {disputes?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-lg">
                No pending disputes at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes?.map((dispute) => (
                <div
                  key={dispute.id}
                  className="bg-gray-800 bg-opacity-50 p-6 rounded-xl border border-gray-600"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        Pending Dispute
                      </span>
                      <span className="text-gray-400 text-sm">
                        {new Date(dispute.created_at).toLocaleString()}
                      </span>
                    </div>

                    <hr className="border-gray-600" />

                    <div className="space-y-3">
                      <div>
                        <p className="text-white font-bold mb-2">
                          Order Details:
                        </p>
                        <p className="text-white">
                          Gig: {dispute.order_id.gig_id.title}
                        </p>
                        <p className="text-white">
                          Amount: {dispute.order_id.amount} EGLD
                        </p>
                        <p className="text-gray-400 text-sm">
                          Order ID: {dispute.order_id.id}
                        </p>
                      </div>

                      <div>
                        <p className="text-white font-bold mb-2">
                          Parties Involved:
                        </p>
                        <div className="flex gap-4">
                          <div className="space-y-1 text-center">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white mx-auto">
                              {dispute.order_id.client_id.username.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-white text-sm">
                              Client: {dispute.order_id.client_id.username}
                            </p>
                          </div>
                          <div className="space-y-1 text-center">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white mx-auto">
                              {dispute.order_id.gig_id.provider_id.username.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-white text-sm">
                              Provider: {dispute.order_id.gig_id.provider_id.username}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-white font-bold mb-2">
                          Dispute Reason:
                        </p>
                        <div className="bg-gray-700 p-3 rounded-md">
                          <p className="text-white">{dispute.reason}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-white font-bold mb-2">
                          Reported by:
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white">
                            {dispute.created_by.username.charAt(0).toUpperCase()}
                          </div>
                          <p className="text-white">{dispute.created_by.username}</p>
                        </div>
                      </div>
                    </div>

                    <hr className="border-gray-600" />

                    <Button
                      onClick={() => {
                        setSelectedDispute(dispute);
                        setShowModal(true);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium"
                      disabled={resolveDispute.isLoading}
                    >
                      Resolve Dispute (Smart Contract)
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Resolve Dispute Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-lg w-full mx-4" title="Resolve Dispute" reference="#">
            <h3 className="text-xl font-bold text-white mb-4">Resolve Dispute via Smart Contract</h3>
            
            <div className="space-y-4">
              <div className="bg-blue-900 border border-blue-500 rounded-md p-3 mb-4">
                <div className="flex items-center">
                  <span className="text-blue-400 mr-2">ℹ️</span>
                  <span className="text-white text-sm">
                    This will execute the resolveDispute function on the smart contract and automatically transfer funds.
                  </span>
                </div>
              </div>

              <div>
                <p className="text-white font-bold mb-2">
                  Order: {selectedDispute?.order_id?.gig_id?.title || 'Unknown Gig'}
                </p>
                <p className="text-gray-400">
                  Amount: {selectedDispute?.order_id?.amount || 'N/A'} EGLD
                </p>
              </div>

              <div>
                <p className="text-white font-bold mb-2">
                  Dispute Reason:
                </p>
                <div className="bg-gray-800 p-3 rounded-md">
                  <p className="text-white">{selectedDispute?.reason || 'No reason provided'}</p>
                </div>
              </div>

              <p className="text-white font-bold">
                Choose resolution (this will trigger smart contract):
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => setRefundToClient(true)}
                  className={`w-full py-3 px-4 rounded-lg font-medium ${
                    refundToClient 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'border border-gray-600 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  🔄 Refund to Client (Smart Contract)
                </Button>
                <Button
                  onClick={() => setRefundToClient(false)}
                  className={`w-full py-3 px-4 rounded-lg font-medium ${
                    !refundToClient 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'border border-gray-600 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  💰 Release to Provider (Smart Contract)
                </Button>
              </div>

              <div className="bg-orange-900 border border-orange-500 rounded-md p-3">
                <div className="flex items-start">
                  <span className="text-orange-400 mr-2 mt-0.5">⚠️</span>
                  <span className="text-white text-sm">
                    You will need to sign this transaction with your admin wallet. Make sure you have enough EGLD for gas fees.
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolve}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
                disabled={resolveDispute.isLoading}
              >
                {resolveDispute.isLoading ? 'Executing Smart Contract...' : 'Execute Smart Contract'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};