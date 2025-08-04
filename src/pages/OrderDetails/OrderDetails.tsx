import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, AlertTriangle, DollarSign, Clock, Check, FileText, XCircle } from 'lucide-react';
import { Button, Card } from 'components';
import { 
  useGetIsLoggedIn, 
  useGetAccount, 
  useGetNetworkConfig, 
  Transaction, 
  Address,
  parseAmount,
  getAccountProvider,
  TransactionManager,
  SignedTransactionType
} from 'lib';
import { signAndSendTransactions } from '../../helpers/signAndSendTransactions';
import { useOrderById } from '../../hooks/useOrders';
import { useAuth } from '../../context/AuthContext';
import { OrderChat } from '../../components/OrderChat';
import { supabase } from '../../lib/supabase';
import axios from 'axios';

export const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();
  const { network } = useGetNetworkConfig();
  const { user } = useAuth();
  
  // Real hooks
  const { data: order, isLoading, error } = useOrderById(id || '');

  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isReleaseLoading, setIsReleaseLoading] = useState(false);
  const [isSubmitWorkLoading, setIsSubmitWorkLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Utility functions similar to your code
  const isValidAddress = (addr: string | undefined): boolean => {
    if (!addr) return false;
    try {
      new Address(addr);
      return true;
    } catch {
      return false;
    }
  };

  const addressToHex = (bech32Address: string): string => {
    try {
      const address = new Address(bech32Address);
      return address.hex();
    } catch (error) {
      console.error('Failed to convert address to hex:', error);
      throw new Error(`Invalid address format: ${bech32Address}`);
    }
  };

  const uuidToHex = (uuid: string): string => {
    const cleanUuid = uuid.replace(/-/g, '');
    console.log('UUID conversion:', { original: uuid, clean: cleanUuid, hex: cleanUuid });
    return cleanUuid;
  };

  const getDeadlineTimestamp = (): number => {
    return Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days from now
  };

  // Check wallet balance
  const checkWalletBalance = async (walletAddress: string, requiredAmount: number) => {
    try {
      if (!isValidAddress(walletAddress)) {
        throw new Error('Invalid wallet address');
      }

      const accountResponse = await axios.get(
        `https://api.multiversx.com/accounts/${walletAddress}`,
        { timeout: 15000 }
      );

      const egldBalance = accountResponse.data.balance
        ? parseFloat(accountResponse.data.balance) / Math.pow(10, 18)
        : 0;

      console.log('Wallet balance check:', {
        address: walletAddress,
        egldBalance,
        requiredAmount,
      });

      return {
        hasEnoughFunds: egldBalance >= requiredAmount,
        balance: egldBalance,
        required: requiredAmount,
      };
    } catch (error) {
      console.error('Error checking wallet balance:', error);
      return {
        hasEnoughFunds: false,
        balance: 0,
        required: requiredAmount,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  // Monitor transaction status
  const monitorTransactionStatus = async (txHash: string, maxAttempts = 20) => {
    console.log('Starting transaction monitoring for hash:', txHash);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Monitoring attempt ${attempt}/${maxAttempts} for transaction:`, txHash);

        const response = await axios.get(
          `https://api.multiversx.com/transactions/${txHash}`,
          { timeout: 15000 }
        );

        const txData = response.data;
        console.log('Transaction status response:', {
          hash: txHash,
          status: txData.status,
          nonce: txData.nonce,
          round: txData.round,
          timestamp: txData.timestamp,
        });

        if (['success', 'executed'].includes(txData.status)) {
          console.log('Transaction confirmed as successful:', txHash);
          return { success: true, data: txData };
        } else if (['fail', 'invalid', 'not_executed'].includes(txData.status)) {
          console.error('Transaction failed:', txHash, txData.status);
          return { success: false, error: `Transaction failed with status: ${txData.status}` };
        } else {
          console.log(`Transaction still ${txData.status}, waiting...`);
          await new Promise((resolve) => setTimeout(resolve, 6000));
          continue;
        }
      } catch (error) {
        console.log(`Attempt ${attempt} failed:`, error instanceof Error ? error.message : error);

        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            console.log('Transaction not found yet, waiting...');
          } else if (error.response?.status === 429) {
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`Rate limit hit, waiting ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }

        if (attempt === maxAttempts) {
          throw new Error(`Transaction monitoring failed after ${maxAttempts} attempts`);
        }

        await new Promise((resolve) => setTimeout(resolve, 6000));
      }
    }

    throw new Error('Transaction monitoring timeout');
  };

  // Main payment function using new SDK
  const handlePayment = async () => {
    console.log('Payment button clicked!');
    console.log('Address:', address);
    console.log('Order:', order);

    if (!address || !order) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setIsPaymentLoading(true);
      console.log('Creating transaction...');

      // Check wallet balance first
      const balanceCheck = await checkWalletBalance(address, order.amount);
      if (!balanceCheck.hasEnoughFunds) {
        throw new Error(
          `Insufficient funds. You need at least ${order.amount} EGLD but have only ${balanceCheck.balance.toFixed(4)} EGLD in your wallet.`
        );
      }

      const escrowAddress = 'erd1qqqqqqqqqqqqqpgqvesht6c8ard8zzj5n02fmfae0kuy2z4vpmuqw5q9v0';
      // TODO: Replace with actual mainnet escrow contract address
      // This is currently a placeholder address - you need to deploy your escrow contract to mainnet
      // and update this address with the real mainnet contract address
      const amount = parseAmount(order.amount.toString());
      const hexOrderId = uuidToHex(order.id);
      const deadline = getDeadlineTimestamp();
      const providerAddressHex = addressToHex(order.provider_address || order.gig?.provider?.wallet_address || '');

      console.log('Transaction details:', {
        amount: amount.toString(),
        escrowAddress,
        orderId: order.id,
        hexOrderId,
        deadline,
        providerAddressHex
      });

      const transaction = new Transaction({
        value: BigInt(amount),
        data: Buffer.from(`deposit@${hexOrderId}@${providerAddressHex}@${deadline.toString(16)}`),
        receiver: new Address(escrowAddress),
        gasLimit: BigInt(20000000),
        sender: new Address(address),
        chainID: network.chainId
      });

      // Use signAndSendTransactions helper
      console.log('Calling signAndSendTransactions...');
      try {
        const sessionId = await signAndSendTransactions({
          transactions: [transaction],
          transactionsDisplayInfo: {
            processingMessage: 'Processing payment...',
            errorMessage: 'Payment failed',
            successMessage: 'Payment successful'
          }
        });

        console.log('Transaction successful, session ID:', sessionId);
        
        // Wait a bit for transaction to be processed
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Update order status in database
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

        console.log('Payment successful and database updated');
        alert('Payment successful! Order is now in progress.');
        setShowPaymentModal(false);
        
        // Refresh the page to show updated status
        window.location.reload();
      } catch (signError) {
        console.error('❌ Payment signing error:', signError);
        
        // Provide more specific error messages
        let errorMessage = 'Payment failed';
        if (signError instanceof Error) {
          if (signError.message.includes('timeout')) {
            errorMessage = 'Transaction signing timed out. Please try again and make sure your wallet is unlocked.';
          } else if (signError.message.includes('User rejected')) {
            errorMessage = 'Transaction was cancelled by user.';
          } else if (signError.message.includes('Insufficient funds')) {
            errorMessage = 'Insufficient funds in wallet.';
          } else {
            errorMessage = `Payment failed: ${signError.message}`;
          }
        }
        
        alert(errorMessage);
        throw signError;
      }
      
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

      const escrowAddress = 'erd1qqqqqqqqqqqqqpgqvesht6c8ard8zzj5n02fmfae0kuy2z4vpmuqw5q9v0';
      const hexOrderId = uuidToHex(order.id);
      
      const transaction = new Transaction({
        value: BigInt(0),
        data: Buffer.from(`release@${hexOrderId}`),
        receiver: new Address(escrowAddress),
        gasLimit: BigInt(20000000),
        sender: new Address(address),
        chainID: network.chainId
      });

      const provider = getAccountProvider();
      const txManager = TransactionManager.getInstance();

      const signedTransactions = await provider.signTransactions([transaction]);
      const sentTransactions = (await txManager.send(signedTransactions as Transaction[])) as SignedTransactionType[];
      
      await txManager.track(sentTransactions as SignedTransactionType[], {
        transactionsDisplayInfo: {
          processingMessage: 'Releasing payment...',
          errorMessage: 'Release failed',
          successMessage: 'Payment released successfully'
        }
      });

      const txHash = sentTransactions[0]?.hash;
      if (txHash) {
        const verification = await monitorTransactionStatus(txHash);
        
        if (verification.success) {
          const releaseTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
          
          await supabase
            .from('orders')
            .update({
              payment_status: 'pending_release',
              release_at: releaseTime,
              status: 'completed',
              status_updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);

          alert('Payment released successfully!');
          setShowReviewModal(true);
        }
      }
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

      const { error } = await supabase
        .from('orders')
        .update({
          work_status: 'submitted',
          status: 'delivered',
          status_updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

      // Add notification for client
      await supabase.from('notifications').insert({
        user_id: order.client_id,
        type: 'work_delivered',
        title: 'Work Delivered',
        content: 'The provider has delivered the work for your order. Please review and release payment if satisfied.',
        data: { order_id: order.id },
        read: false,
      });

      // Add system message to chat
      await supabase.from('messages').insert({
        order_id: order.id,
        sender_id: user?.id || order.client_id,
        content: JSON.stringify({
          type: 'work_delivered',
          message: '✅ Work has been delivered! The client can now review and release payment.',
        }),
        attachments: [],
      });

      alert('Work submitted successfully! The client has been notified.');
      window.location.reload();
    } catch (error) {
      console.error('Submit work error:', error);
      alert(`Submit work failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitWorkLoading(false);
    }
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

  // Determine if user is client or provider
  const isClient = user?.id === order?.client?.id;
  const isProvider = user?.id === order?.gig?.provider?.id;

  // Determine payment actions based on status and role
  const canPay = isClient && (order?.status === 'pending_approval' || order?.status === 'in_progress') && order?.payment_status === 'pending';
  const canRelease = isClient && order?.status === 'delivered' && order?.payment_status === 'escrowed';
  const canSubmitWork = isProvider && 
                       order?.status === 'in_progress' && 
                       order?.payment_status === 'escrowed' &&
                       order?.work_status !== 'submitted';
  const canDispute = (isClient || isProvider) && 
                    order?.payment_status === 'escrowed' && 
                    order?.status !== 'completed' && 
                    order?.status !== 'cancelled' &&
                    order?.payment_status !== 'disputed';

  // Check if dispute was resolved
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

            {/* Dispute Resolution Alert */}
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

            {/* Payment Action Buttons */}
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

            {/* Order Progress */}
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

        {/* Chat Section */}
        <div className="bg-gray-800 p-8 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-6">Communication</h2>
          <OrderChat orderId={order.id} />
        </div>
      </div>

      {/* Payment Modal */}
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
                      {order.amount} {order.payment_token}
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