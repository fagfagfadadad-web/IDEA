import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, AlertTriangle, DollarSign, Clock, Check, FileText, XCircle } from 'lucide-react';
import { Button, Card } from 'components';
import { useGetIsLoggedIn, useGetAccount, useGetNetworkConfig } from 'lib';
import { useOrderById } from '../../hooks/useOrders';
import { usePayments } from '../../hooks/usePayments'; // Import usePayments
import { useAuth } from '../../context/AuthContext';
import { OrderChat } from '../../components/OrderChat';
import { supabase } from '../../lib/supabase';

export const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();
  const { network } = useGetNetworkConfig();
  const { user } = useAuth();
  const { sendPayment, releasePayment, disputePayment, submitWork } = usePayments(); // Použitie usePayments

  const { data: order, isLoading, error } = useOrderById(id || '');

  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isReleaseLoading, setIsReleaseLoading] = useState(false);
  const [isSubmitWorkLoading, setIsSubmitWorkLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const isValidAddress = (addr: string | undefined): boolean => {
    if (!addr) return false;
    try {
      new Address(addr);
      return true;
    } catch {
      return false;
    }
  };

  const getRemainingTime = () => {
    if (!order?.deadline) return null;
    const now = new Date();
    const deadline = new Date(order.deadline);
    const diff = deadline.getTime() - now.getTime();
    if (diff <= 0) return 'Deadline passed';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days} days remaining`;
    return `${hours} hours remaining`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'delivered':
        return 'yellow';
      case 'in_progress':
        return 'blue';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'escrowed':
        return 'green';
      case 'pending_release':
        return 'yellow';
      case 'released':
        return 'green';
      case 'disputed':
        return 'red';
      case 'resolved':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'completed':
        return 100;
      case 'delivered':
        return 75;
      case 'in_progress':
        return 50;
      case 'cancelled':
        return 100;
      default:
        return 25;
    }
  };

  // Použitie usePayments pre platbu
  const handlePayment = async () => {
    console.log('Payment button clicked!', { address, order });
    if (!address || !order) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setIsPaymentLoading(true);

      const providerAddress = order.provider_address || order.gig?.provider?.wallet_address;
      if (!isValidAddress(providerAddress)) {
        throw new Error('Invalid or missing provider address');
      }

      console.log('Initiating payment with:', {
        orderId: order.id,
        amount: order.amount,
        paymentToken: order.payment_token,
        providerAddress
      });

      const sessionId = await sendPayment(
        order.id,
        order.amount,
        undefined, // Použije defaultnú ESCROW_ADDRESS z usePayments
        order.payment_token,
        providerAddress
      );

      console.log('Payment successful, session ID:', sessionId);

      // Aktualizácia stavu objednávky
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'escrowed',
          status: 'in_progress',
          status_updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('Error updating order:', updateError);
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      alert('Payment successful! Order is now in progress.');
      setShowPaymentModal(false);
      window.location.reload();
    } catch (error) {
      console.error('Payment error:', error);
      alert(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleReleasePayment = async () => {
    try {
      setIsReleaseLoading(true);
      if (!address || !order) {
        alert('Please connect your wallet first');
        return;
      }

      const sessionId = await releasePayment(order.id);
      console.log('Payment released, session ID:', sessionId);

      const releaseTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'pending_release',
          release_at: releaseTime,
          status: 'completed',
          status_updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) {
        console.error('Error updating order:', error);
        throw new Error(`Database update failed: ${error.message}`);
      }

      alert('Payment released successfully!');
      setShowReviewModal(true);
    } catch (error) {
      console.error('Release error:', error);
      alert(`Release failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsReleaseLoading(false);
    }
  };

  const handleSubmitWork = async () => {
    try {
      setIsSubmitWorkLoading(true);
      if (!order) return;

      await submitWork(order.id);
      window.location.reload();
    } catch (error) {
      console.error('Submit work error:', error);
      alert(`Submit work failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitWorkLoading(false);
    }
  };

  const isClient = user?.id === order?.client?.id;
  const isProvider = user?.id === order?.gig?.provider?.id;

  const canPay = isClient && (order?.status === 'pending_approval' || order?.status === 'in_progress') && order?.payment_status === 'pending';
  const canRelease = isClient && order?.status === 'delivered' && order?.payment_status === 'escrowed';
  const canSubmitWork = isProvider && order?.status === 'in_progress' && order?.payment_status === 'escrowed' && order?.work_status !== 'submitted';
  const canDispute = (isClient || isProvider) && order?.payment_status === 'escrowed' && order?.status !== 'completed' && order?.status !== 'cancelled' && order?.payment_status !== 'disputed';
  const wasDisputed = order?.payment_status === 'disputed' || order?.payment_status === 'resolved';
  const isDisputeResolved = order?.payment_status === 'resolved';

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Loading Order Details" reference="#">
          <div className="flex justify-center">
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-white">Loading order details...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="bg-gray-800 p-8 rounded-lg">
          <p className="text-white">{error ? `Error: ${error.message}` : 'Order not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="space-y-8">
        <Card className="p-8" title="Order Details" reference="#">
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h1 className="text-2xl font-bold text-white">{order.gig?.title || 'Custom Project'}</h1>
              <div className="flex gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  getStatusColor(order.status) === 'green' ? 'bg-green-100 text-green-800' :
                  getStatusColor(order.status) === 'blue' ? 'bg-blue-100 text-blue-800' :
                  getStatusColor(order.status) === 'red' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  getPaymentStatusColor(order.payment_status) === 'green' ? 'bg-green-100 text-green-800' :
                  getPaymentStatusColor(order.payment_status) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  getPaymentStatusColor(order.payment_status) === 'red' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  Payment: {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                </span>
                {wasDisputed && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                    isDisputeResolved ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {isDisputeResolved ? (
                      <>
                        <Shield size={14} />
                        Admin Resolved
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={14} />
                        Disputed
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>

            {isDisputeResolved && (
              <div className="bg-gradient-to-r from-purple-900 to-blue-900 border-2 border-purple-400 rounded-xl p-6 text-center">
                <div className="flex justify-center gap-3 mb-3">
                  <Shield size={24} className="text-purple-400" />
                  <CheckCircle size={24} className="text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  🏛️ Dispute Resolved by Administration
                </h3>
                <p className="text-gray-300 max-w-sm mx-auto">
                  This order had a dispute that was officially resolved by platform administration.
                  The decision is final and funds have been distributed accordingly.
                </p>
              </div>
            )}

            {canPay && (
              <div className="bg-blue-100 border border-blue-500 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-gray-800 font-bold">Payment Required</h3>
                    <p className="text-gray-800">
                      Please pay {order.amount} {order.payment_token} to start this order.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <DollarSign size={16} />
                    Pay Now
                  </Button>
                </div>
              </div>
            )}

            {canSubmitWork && (
              <div className="bg-blue-100 border border-blue-500 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-gray-800 font-bold">Work Ready to Submit?</h3>
                    <p className="text-gray-800">
                      When you've completed the work, click the button to notify the client.
                    </p>
                  </div>
                  <Button
                    onClick={handleSubmitWork}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    disabled={isSubmitWorkLoading}
                  >
                    <FileText size={16} />
                    Submit Work
                  </Button>
                </div>
              </div>
            )}

            {canRelease && (
              <div className="bg-green-100 border border-green-500 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-gray-800 font-bold">Work Delivered</h3>
                    <p className="text-gray-800">
                      The provider has delivered the work. Please review and release payment if satisfied.
                    </p>
                  </div>
                  <Button
                    onClick={handleReleasePayment}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    disabled={isReleaseLoading}
                  >
                    <Check size={16} />
                    Release Payment
                  </Button>
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Order Progress</span>
                {order.status === 'in_progress' && (
                  <span className="text-blue-400">{getRemainingTime()}</span>
                )}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    getStatusColor(order.status) === 'green' ? 'bg-green-500' :
                    getStatusColor(order.status) === 'blue' ? 'bg-blue-500' :
                    getStatusColor(order.status) === 'red' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`}
                  style={{ width: `${getProgressValue(order.status)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-gray-400 text-sm">
                <span>Order Placed</span>
                <span>In Progress</span>
                <span>Delivered</span>
                <span>Completed</span>
              </div>
            </div>

            <hr className="border-gray-600" />

            <div>
              <p className="text-gray-400 mb-2">Order Requirements:</p>
              <p className="text-white">
                {order.requirements?.description || 'No specific requirements provided'}
              </p>
            </div>

            <hr className="border-gray-600" />

            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-400 mb-2">Client</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white">
                    {order.client?.username?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <span className="text-white">{order.client?.username || "Unknown"}</span>
                </div>
              </div>
              <div>
                <p className="text-gray-400 mb-2">Amount</p>
                <p className="text-blue-400 text-xl font-bold">
                  {order.amount} {order.payment_token}
                </p>
                {isDisputeResolved && (
                  <p className="text-purple-300 text-sm mt-1">
                    ✅ Admin Resolved
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="bg-gray-800 p-8 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-6">Communication</h2>
          <OrderChat orderId={order.id} />
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 max-w-lg w-full mx-4 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">Complete Payment</h3>
            <div className="space-y-4">
              <div className="bg-blue-100 border border-blue-500 rounded-md p-3">
                <div className="flex items-center">
                  <span className="text-blue-800 mr-2">ℹ️</span>
                  <div>
                    <p className="text-blue-800 font-medium">Secure Escrow Payment</p>
                    <p className="text-blue-800 text-sm">
                      Your payment will be held in escrow until you approve the completed work.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-md">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order Amount:</span>
                    <span className="text-white font-bold">
                      {order.amount} {order.payment_token}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Service Fee:</span>
                    <span className="text-white">
                      {order.payment_token === 'EGLD' ? `${(order.amount * 0.1).toFixed(2)} EGLD (10%)` : '0 IDEA (0%)'}
                    </span>
                  </div>
                  <hr className="border-gray-600" />
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total:</span>
                    <span className="text-blue-400 font-bold">
                      {order.payment_token === 'EGLD' ? (order.amount * 1.1).toFixed(2) : order.amount} {order.payment_token}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                disabled={isPaymentLoading}
              >
                <DollarSign size={16} />
                {isPaymentLoading ? 'Processing...' : 'Pay Now'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};