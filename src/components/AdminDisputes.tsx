import React, { useState } from 'react';
import { AlertTriangle, Shield, CheckCircle, DollarSign, Clock, User } from 'lucide-react';
import { Button, Card } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useDisputes, useResolveDispute } from '../hooks/useDisputes';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AdminDisputes: React.FC = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const { data: disputes, isLoading, error, refetch } = useDisputes();

  const handleResolve = async () => {
    if (!selectedDispute) return;

    try {
      await resolveDispute.mutateAsync({
        disputeId: selectedDispute.id,
        orderId: selectedDispute.order.id,
        refundToClient,
      });
      
      showSuccessToast('Dispute resolved successfully');
      setShowModal(false);
      setSelectedDispute(null);
      refetch(); // Refresh disputes list
    } catch (error) {
      console.error('Error resolving dispute:', error);
      showErrorToast('Error resolving dispute. Please try again.');
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
                          Gig: {dispute.order?.gig?.title || 'Custom Project'}
                        </p>
                        <p className="text-white">
                          Amount: {dispute.order?.amount} {dispute.order?.payment_token || 'EGLD'}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Order ID: {dispute.order?.id}
                        </p>
                      </div>

                      <div>
                        <p className="text-white font-bold mb-2">
                          Parties Involved:
                        </p>
                        <div className="flex gap-4">
                          <div className="space-y-1 text-center">
                            <div className="w-8 h-8 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-400 to-pink-400 mx-auto">
                              {dispute.order?.client?.avatar_url ? (
                                <>
                                  <img
                                    src={dispute.order.client.avatar_url}
                                    alt={dispute.order.client.username || "Client"}
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
                                    className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-xs text-white absolute inset-0"
                                    style={{ display: 'none' }}
                                  >
                                    {dispute.order?.client?.username?.charAt(0)?.toUpperCase() || "C"}
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-xs text-white">
                                  {dispute.order?.client?.username?.charAt(0)?.toUpperCase() || "C"}
                                </div>
                              )}
                            </div>
                            <p className="text-white text-sm">
                              Client: {dispute.order?.client?.username || 'Unknown'}
                            </p>
                          </div>
                          <div className="space-y-1 text-center">
                            <div className="w-8 h-8 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-400 to-pink-400 mx-auto">
                              {dispute.order?.gig?.provider?.avatar_url ? (
                                <>
                                  <img
                                    src={dispute.order.gig.provider.avatar_url}
                                    alt={dispute.order.gig.provider.username || "Provider"}
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
                                    className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-xs text-white absolute inset-0"
                                    style={{ display: 'none' }}
                                  >
                                    {dispute.order?.gig?.provider?.username?.charAt(0)?.toUpperCase() || "P"}
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-xs text-white">
                                  {dispute.order?.gig?.provider?.username?.charAt(0)?.toUpperCase() || "P"}
                                </div>
                              )}
                            </div>
                            <p className="text-white text-sm">
                              Provider: {dispute.order?.gig?.provider?.username || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-white font-bold mb-2">
                          Dispute Reason:
                        </p>
                        <div className="bg-gray-700 p-3 rounded-md">
                          <p className="text-white">{dispute.reason || 'No reason provided'}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-white font-bold mb-2">
                          Reported by:
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-400 to-pink-400">
                            {dispute.created_by_user?.avatar_url ? (
                              <>
                                <img
                                  src={dispute.created_by_user.avatar_url}
                                  alt={dispute.created_by_user.username || "User"}
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
                                  className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-xs text-white absolute inset-0"
                                  style={{ display: 'none' }}
                                >
                                  {dispute.created_by_user?.username?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-xs text-white">
                                {dispute.created_by_user?.username?.charAt(0)?.toUpperCase() || "U"}
                              </div>
                            )}
                          </div>
                          <p className="text-white">{dispute.created_by_user?.username || 'Unknown'}</p>
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
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Shield size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Resolve Dispute</h3>
                  <p className="text-gray-600 text-sm">Execute smart contract resolution</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-blue-600" />
                  <span className="text-blue-800 font-medium">Smart Contract Action</span>
                </div>
                <p className="text-blue-700 text-sm">
                  This will execute the resolveDispute function on the smart contract and automatically transfer funds.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-gray-800 font-bold">Order Details:</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-800">
                    <span className="font-medium">Gig:</span> {selectedDispute?.order?.gig?.title || 'Custom Project'}
                  </p>
                  <p className="text-gray-800">
                    <span className="font-medium">Amount:</span> {selectedDispute?.order?.amount || 'N/A'} {selectedDispute?.order?.payment_token || \'EGLD'}
                  </p>
                  <p className="text-gray-600 text-sm">
                    Order ID: {selectedDispute?.order?.id}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-gray-800 font-bold">Parties Involved:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-400 to-pink-400 mx-auto mb-2">
                      {selectedDispute?.order?.client?.avatar_url ? (
                        <>
                          <img
                            src={selectedDispute.order.client.avatar_url}
                            alt={selectedDispute.order.client.username || "Client"}
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
                            className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-sm text-white absolute inset-0"
                            style={{ display: 'none' }}
                          >
                            {selectedDispute?.order?.client?.username?.charAt(0)?.toUpperCase() || "C"}
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-sm text-white">
                          {selectedDispute?.order?.client?.username?.charAt(0)?.toUpperCase() || "C"}
                        </div>
                      )}
                    </div>
                    <p className="text-gray-800 font-medium text-sm">Client</p>
                    <p className="text-gray-600 text-xs">{selectedDispute?.order?.client?.username || 'Unknown'}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-400 to-pink-400 mx-auto mb-2">
                      {selectedDispute?.order?.gig?.provider?.avatar_url ? (
                        <>
                          <img
                            src={selectedDispute.order.gig.provider.avatar_url}
                            alt={selectedDispute.order.gig.provider.username || "Provider"}
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
                            className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-sm text-white absolute inset-0"
                            style={{ display: 'none' }}
                          >
                            {selectedDispute?.order?.gig?.provider?.username?.charAt(0)?.toUpperCase() || "P"}
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-sm text-white">
                          {selectedDispute?.order?.gig?.provider?.username?.charAt(0)?.toUpperCase() || "P"}
                        </div>
                      )}
                    </div>
                    <p className="text-gray-800 font-medium text-sm">Provider</p>
                    <p className="text-gray-600 text-xs">{selectedDispute?.order?.gig?.provider?.username || 'Unknown'}</p>
                  </div>
                </p>
              </div>

              <div>
                <h4 className="text-gray-800 font-bold mb-2">
                  Dispute Reason:
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-800">{selectedDispute?.reason || 'No reason provided'}</p>
                </div>
              </div>

              <div>
                <h4 className="text-gray-800 font-bold mb-3">
                Choose resolution (this will trigger smart contract):
                </h4>

                <div className="space-y-3">
                  <button
                  onClick={() => setRefundToClient(true)}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                    refundToClient 
                        ? 'bg-red-600 hover:bg-red-700 text-white border-2 border-red-600' 
                        : 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  >
                  🔄 Refund to Client (Smart Contract)
                  </button>
                  <button
                  onClick={() => setRefundToClient(false)}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                    !refundToClient 
                        ? 'bg-green-600 hover:bg-green-700 text-white border-2 border-green-600' 
                        : 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  >
                  💰 Release to Provider (Smart Contract)
                  </button>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-orange-600" />
                  <span className="text-orange-800 font-medium">Important Notice</span>
                </div>
                <p className="text-orange-700 text-sm">
                    You will need to sign this transaction with your admin wallet. Make sure you have enough EGLD for gas fees.
                </p>
              </div>
            
              <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolve}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg"
                disabled={resolveDispute.isLoading}
              >
                  {resolveDispute.isLoading ? 'Executing...' : 'Execute Resolution'}
              </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};