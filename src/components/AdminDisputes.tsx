import React, { useState } from 'react';
import { AlertTriangle, Shield, CheckCircle, DollarSign, Clock, User, MessageSquare, Eye, X } from 'lucide-react';
import { Button, Card } from 'components';
import { OrderChat } from './OrderChat';
import { useGetIsLoggedIn } from 'lib';
import { useDisputes, useResolveDispute } from '../hooks/useDisputes';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AdminDisputes: React.FC = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const { data: disputes, isLoading, error, refetch } = useDisputes();
  const resolveDispute = useResolveDispute();
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<any>(null);
  const [refundToClient, setRefundToClient] = useState(true);

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
      refetch();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      showErrorToast('Error resolving dispute. Please try again.');
    }
  };

  const handleViewChat = (order: any) => {
    setSelectedOrderForChat(order);
    setShowChatModal(true);
  };

  if (!user || !user.is_admin) {
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
          <p className="text-gray-700">Loading disputes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <span className="text-red-500 mr-2">⚠️</span>
          <span className="text-red-700 font-medium">Error loading disputes: {error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg md:text-2xl font-bold text-gray-800">Dispute Management</h2>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-2 md:px-4 py-1 md:py-2">
          <span className="text-indigo-800 font-medium text-xs md:text-sm">
            {disputes?.length || 0} pending dispute{(disputes?.length || 0) !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {disputes?.length === 0 ? (
        <div className="text-center py-12 bg-green-50 border border-green-200 rounded-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={24} className="text-green-600" />
          </div>
          <h3 className="text-base md:text-lg font-medium text-gray-800 mb-2">No pending disputes</h3>
          <p className="text-gray-600 text-sm">All disputes have been resolved. Great job!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {disputes?.map((dispute) => (
            <div
              key={dispute.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
            >
              <div className="bg-red-50 border-b border-red-200 p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 flex-wrap">
                    <AlertTriangle size={20} className="text-red-600" />
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      Pending Dispute
                    </span>
                  </div>
                  <span className="text-gray-600 text-xs">
                    {new Date(dispute.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                {/* Order Details */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4">
                  <h4 className="text-base md:text-lg font-bold text-gray-800 mb-3">Order Details</h4>
                  <div className="grid grid-cols-1 gap-3 md:gap-4">
                    <div>
                      <p className="text-gray-600 text-xs md:text-sm">Gig Title</p>
                      <p className="text-gray-800 font-medium text-sm md:text-base">
                        {dispute.order?.gig?.title || 'Custom Project'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs md:text-sm">Amount</p>
                      <p className="text-gray-800 font-medium text-sm md:text-base">
                        {dispute.order?.amount} {dispute.order?.payment_token || 'EGLD'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs md:text-sm">Order ID</p>
                      <p className="text-gray-800 font-mono text-xs break-all">
                        {dispute.order?.id.substring(0, 20)}...
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs md:text-sm">Order Status</p>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {dispute.order?.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Parties Involved */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4">
                  <h4 className="text-base md:text-lg font-bold text-gray-800 mb-4">Parties Involved</h4>
                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    <div className="text-center">
                      <div className="w-12 md:w-16 h-12 md:h-16 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-400 to-pink-400 mx-auto mb-3">
                        {dispute.order?.client?.avatar_url ? (
                          <>
                            <img
                              src={dispute.order.client.avatar_url}
                              alt={dispute.order.client.username || 'Client'}
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
                              className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-lg font-bold text-white absolute inset-0"
                              style={{ display: 'none' }}
                            >
                              {dispute.order?.client?.username?.charAt(0)?.toUpperCase() || 'C'}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-lg font-bold text-white">
                            {dispute.order?.client?.username?.charAt(0)?.toUpperCase() || 'C'}
                          </div>
                        )}
                      </div>
                      <p className="text-gray-800 font-bold text-sm md:text-base">Client</p>
                      <p className="text-gray-600 text-xs">
                        {dispute.order?.client?.username || 'Unknown'}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="w-12 md:w-16 h-12 md:h-16 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-400 to-pink-400 mx-auto mb-3">
                        {dispute.order?.gig?.provider?.avatar_url ? (
                          <>
                            <img
                              src={dispute.order.gig.provider.avatar_url}
                              alt={dispute.order.gig.provider.username || 'Provider'}
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
                              className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-lg font-bold text-white absolute inset-0"
                              style={{ display: 'none' }}
                            >
                              {dispute.order?.gig?.provider?.username?.charAt(0)?.toUpperCase() || 'P'}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-lg font-bold text-white">
                            {dispute.order?.gig?.provider?.username?.charAt(0)?.toUpperCase() || 'P'}
                          </div>
                        )}
                      </div>
                      <p className="text-gray-800 font-bold text-sm md:text-base">Provider</p>
                      <p className="text-gray-600 text-xs">
                        {dispute.order?.gig?.provider?.username || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dispute Reason */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 md:p-4">
                  <h4 className="text-base md:text-lg font-bold text-gray-800 mb-3">Dispute Reason</h4>
                  <div className="bg-white border border-orange-200 p-3 md:p-4 rounded-lg">
                    <p className="text-gray-800 text-sm md:text-base">{dispute.reason || 'No reason provided'}</p>
                  </div>
                </div>

                {/* Reported by */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
                  <h4 className="text-base md:text-lg font-bold text-gray-800 mb-3">Reported by</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-8 md:w-10 h-8 md:h-10 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-400 to-pink-400">
                      {dispute.created_by_user?.avatar_url ? (
                        <>
                          <img
                            src={dispute.created_by_user.avatar_url}
                            alt={dispute.created_by_user.username || 'User'}
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
                            {dispute.created_by_user?.username?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-sm font-bold text-white">
                          {dispute.created_by_user?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-800 font-medium text-sm md:text-base">
                        {dispute.created_by_user?.username || 'Unknown'}
                      </p>
                      <p className="text-gray-600 text-xs">
                        {dispute.created_by_user?.full_name || 'No full name'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => handleViewChat(dispute.order)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 md:py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 text-sm md:text-base"
                  >
                    <MessageSquare size={18} />
                    View Order Chat
                  </Button>
                  
                  <Button
                    onClick={() => window.open(`/orders/${dispute.order?.id}`, '_blank')}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 md:py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 text-sm md:text-base"
                  >
                    <Eye size={18} />
                    View Order Details
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setSelectedDispute(dispute);
                      setShowModal(true);
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 md:py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 text-sm md:text-base"
                    disabled={resolveDispute.isLoading}
                  >
                    <Shield size={18} />
                    Resolve Dispute
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Chat Modal */}
      {showChatModal && selectedOrderForChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-full md:max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-gray-800">Order Chat</h3>
                  <p className="text-gray-600 text-xs md:text-sm">
                    {selectedOrderForChat.gig?.title || 'Custom Project'} • Order #{selectedOrderForChat.id?.substring(0, 8)}
                  </p>
                </div>
                <button
                  onClick={() => setShowChatModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-3 md:p-6 max-h-[70vh] overflow-y-auto">
              <OrderChat orderId={selectedOrderForChat.id} />
            </div>
          </div>
        </div>
      )}

      {/* Resolve Dispute Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 max-w-full md:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 md:w-12 h-10 md:h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Shield size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-800">Resolve Dispute</h3>
                  <p className="text-gray-600 text-xs md:text-sm">Execute smart contract resolution</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-blue-600" />
                  <span className="text-blue-800 font-medium text-sm md:text-base">Smart Contract Action</span>
                </div>
                <p className="text-blue-700 text-xs md:text-sm">
                  This will execute the resolveDispute function on the smart contract and automatically transfer funds.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-gray-800 font-bold text-sm md:text-base">Order Details:</h4>
                <div className="bg-gray-50 border border-gray-200 p-3 md:p-4 rounded-lg space-y-2">
                  <p className="text-gray-800 text-sm md:text-base">
                    <span className="font-medium">Gig:</span>{' '}
                    {selectedDispute?.order?.gig?.title || 'Custom Project'}
                  </p>
                  <p className="text-gray-800 text-sm md:text-base">
                    <span className="font-medium">Amount:</span>{' '}
                    {selectedDispute?.order?.amount || 'N/A'}{' '}
                    {selectedDispute?.order?.payment_token || 'EGLD'}
                  </p>
                  <p className="text-gray-600 text-xs break-all">
                    Order ID: {selectedDispute?.order?.id.substring(0, 30)}...
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-gray-800 font-bold text-sm md:text-base">Choose resolution (this will trigger smart contract):</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => setRefundToClient(true)}
                    className={`w-full py-3 md:py-4 px-4 md:px-6 rounded-lg font-medium transition-all border-2 text-sm md:text-base ${
                      refundToClient
                        ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 bg-white'
                    }`}
                  >
                    🔄 Refund to Client (Smart Contract)
                  </button>
                  <button
                    onClick={() => setRefundToClient(false)}
                    className={`w-full py-3 md:py-4 px-4 md:px-6 rounded-lg font-medium transition-all border-2 text-sm md:text-base ${
                      !refundToClient
                        ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 bg-white'
                    }`}
                  >
                    💰 Release to Provider (Smart Contract)
                  </button>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 md:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-orange-600" />
                  <span className="text-orange-800 font-medium text-sm md:text-base">Important Notice</span>
                </div>
                <p className="text-orange-700 text-xs md:text-sm">
                  You will need to sign this transaction with your admin wallet. Make sure you have
                  enough EGLD for gas fees.
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-3 pt-4">
                <Button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 md:py-3 px-4 rounded-lg text-sm md:text-base"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleResolve}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 md:py-3 px-4 rounded-lg text-sm md:text-base"
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