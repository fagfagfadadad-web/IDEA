import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, AlertTriangle, DollarSign, Clock, Check, FileText, XCircle, Star } from 'lucide-react';
import { Button, Card, OrderChat, DisputeModal, ReviewModal } from 'components';
import { useGetIsLoggedIn, useGetAccount, useGetNetworkConfig, Transaction, Address } from 'lib';
import { signAndSendTransactions } from '../../helpers/signAndSendTransactions';
import { useOrderById } from '../../hooks/useOrders';
import { useOrderReview } from '../../hooks/useReviews';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import axios from 'axios';

const ESCROW_ADDRESS = 'erd1qqqqqqqqqqqqqpgqvesht6c8ard8zzj5n02fmfae0kuy2z4vpmuqw5q9v0';

const isValidAddress = (addr: string | null | undefined): boolean => {
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
    if (!isValidAddress(bech32Address)) {
      throw new Error('Invalid address: address is not in correct Bech32 format');
    }
    const address = new Address(bech32Address);
    const hex = address.hex();
    const zeroAddress = '0000000000000000000000000000000000000000000000000000000000000000';
    if (hex === zeroAddress) {
      throw new Error('Address cannot be zero');
    }
    return hex;
  } catch (error) {
    console.error('Failed to convert address to hex:', error);
    throw new Error(`Invalid address format: ${bech32Address}`);
  }
};

const uuidToHex = (uuid: string): string => {
  const cleanUuid = uuid.replace(/-/g, '');
  if (cleanUuid.length !== 32) {
    throw new Error('Invalid UUID format, must have 32 hex characters without hyphens');
  }
  console.log('UUID conversion:', { original: uuid, clean: cleanUuid, hex: cleanUuid });
  return cleanUuid;
};

const getDeadlineTimestamp = (): number => {
  const currentTime = Math.floor(Date.now() / 1000);
  const deadline = currentTime + 7 * 24 * 60 * 60;
  if (deadline <= currentTime + 86_400) {
    throw new Error('Deadline must be at least 1 day in the future');
  }
  console.log('Generated deadline:', { currentTime, deadline });
  return deadline;
};

const checkWalletBalance = async (walletAddress: string, requiredAmount: number, tokenId: string = 'EGLD') => {
  try {
    console.log('🔍 Checking wallet balance:', { walletAddress, requiredAmount, tokenId });
    if (!isValidAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }

    let balance = 0;
    if (tokenId === 'EGLD') {
      const response = await axios.get(
        `https://api.multiversx.com/accounts/${walletAddress}`,
        { timeout: 15000 }
      );
      balance = response.data.balance
        ? parseFloat(response.data.balance) / Math.pow(10, 18)
        : 0;
      console.log('💰 EGLD balance result:', { raw: response.data.balance, formatted: balance });
    } else {
      console.log(`🪙 Checking ESDT balance for: ${tokenId}`);
      try {
        const response = await axios.get(
          `https://api.multiversx.com/accounts/${walletAddress}/tokens/${tokenId}`,
          { timeout: 15000 }
        );
        if (response.data && response.data.balance) {
          const tokenDecimals = 18;
          balance = parseFloat(response.data.balance) / Math.pow(10, tokenDecimals);
          console.log(`✅ Found balance for ${tokenId}:`, {
            raw: response.data.balance,
            decimals: tokenDecimals,
            formatted: balance,
          });
        } else {
          console.log(`❌ No balance for ${tokenId}`);
          balance = 0;
        }
      } catch (error) {
        console.error(`⚠️ Error checking ESDT balance:`, error);
        balance = 0;
      }
    }

    const effectiveAmount = tokenId === 'EGLD' ? requiredAmount * 1.1111 : requiredAmount;
    console.log('🏁 Balance check result:', {
      address: walletAddress,
      tokenId,
      balance,
      requiredAmount: effectiveAmount,
      hasEnoughFunds: balance >= effectiveAmount,
    });

    return {
      hasEnoughFunds: balance >= effectiveAmount,
      balance,
      required: effectiveAmount,
      error: null,
    };
  } catch (error) {
    console.error('💥 Error checking balance:', error);
    return {
      hasEnoughFunds: false,
      balance: 0,
      required: requiredAmount,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

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
          console.log('Transaction not yet found, waiting...');
        } else if (error.response?.status === 429) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Rate limit exceeded, waiting ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          console.error('Axios error:', error.response?.status, error.response?.data);
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

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();
  const { network } = useGetNetworkConfig();
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  const { data: order, isLoading, error } = useOrderById(id || '');

  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isReleaseLoading, setIsReleaseLoading] = useState(false);
  const [isSubmitWorkLoading, setIsSubmitWorkLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [providerAddressError, setProviderAddressError] = useState<string | null>(null);

  // Add review hook
  const { data: existingReview, refetch: refetchReview } = useOrderReview(order?.id || '');

  // Define the provider type explicitly
  interface Provider {
    id?: string;
    username?: string;
    avatar_url?: string;
    wallet_address: string;
  }

  const fetchProviderAddress = async (gigId: string): Promise<string | null> => {
    try {
      console.log('Fetching provider address for gig:', { gigId });
      const { data, error } = await supabase
        .from('gigs')
        .select('provider_id, provider:users!gigs_provider_id_fkey(id, username, avatar_url, wallet_address)')
        .eq('id', gigId)
        .single();

      if (error) {
        console.error('Supabase error fetching provider address:', error);
        return null;
      }

      // Use unknown as an intermediate type to safely assert to Provider
      const walletAddress = ((data?.provider as unknown) as Provider | null)?.wallet_address ?? null;

      console.log('Fetched provider data:', { data, walletAddress });

      if (!isValidAddress(walletAddress)) {
        console.error('Invalid provider address from database:', walletAddress);
        return null;
      }

      return walletAddress;
    } catch (error) {
      console.error('Error fetching provider address:', error);
      return null;
    }
  };

  const getTokenDisplayName = (paymentToken: string) => {
    if (paymentToken === 'EGLD') return 'EGLD';
    if (paymentToken === 'IDA-f9bc1d') return 'IDA';
    return paymentToken;
  };

  const calculateFees = (amount: number, paymentToken: string) => {
    if (paymentToken === 'EGLD') {
      return {
        clientPays: amount,
        providerGets: amount * 0.9,
        platformFee: amount * 0.1,
        feePercentage: 10,
      };
    } else {
      return {
        clientPays: amount,
        providerGets: amount,
        platformFee: 0,
        feePercentage: 0,
      };
    }
  };

  const handlePayment = async () => {
    console.log('Payment button clicked!', { address, order });
    if (!address || !order) {
      alert('Please connect your wallet');
      return;
    }

    if (order.payment_status !== 'pending') {
      alert('Payment has already been processed or is in another status');
      return;
    }

    const paymentToken = order.payment_token;
    const tokenDisplayName = getTokenDisplayName(paymentToken);

    try {
      setIsPaymentLoading(true);
      console.log('Creating transaction...', { orderData: JSON.stringify(order, null, 2) });

      if (!isValidAddress(address)) {
        throw new Error('Invalid client address');
      }

      let providerAddress = order.provider_address || order.gig?.provider?.wallet_address;
      if (!isValidAddress(providerAddress) && order.gig_id) {
        console.log('Provider address not found in order, fetching from database...', { gigId: order.gig_id });
        const fetchedAddress = await fetchProviderAddress(order.gig_id);
        if (!fetchedAddress || !isValidAddress(fetchedAddress)) {
          throw new Error('Failed to fetch a valid provider address from the database. Please check the gig details.');
        }
        providerAddress = fetchedAddress;

        const { error: updateError } = await supabase
          .from('orders')
          .update({ provider_address: providerAddress })
          .eq('id', order.id);
        if (updateError) {
          console.error('Error updating provider_address:', updateError);
          throw new Error(`Failed to update provider_address: ${updateError.message}`);
        }
      }
      if (!providerAddress || !isValidAddress(providerAddress)) {
        throw new Error('Invalid or missing provider address. Please check the order details.');
      }

      const { error: clientUpdateError } = await supabase
        .from('orders')
        .update({ client_address: address })
        .eq('id', order.id);

      if (clientUpdateError) {
        console.error('Error updating client_address:', clientUpdateError);
        throw new Error(`Failed to update client_address: ${clientUpdateError.message}`);
      }

      const balanceCheck = await checkWalletBalance(address, order.amount, paymentToken);
      if (!balanceCheck.hasEnoughFunds) {
        const feeText = paymentToken === 'EGLD' ? ' (including 10% fee)' : '';
        throw new Error(
          `Insufficient funds. You need at least ${balanceCheck.required.toFixed(4)} ${tokenDisplayName}${feeText}, but you only have ${balanceCheck.balance.toFixed(4)} ${tokenDisplayName}.`
        );
      }

      const hexOrderId = uuidToHex(order.id);
      const providerAddressHex = addressToHex(providerAddress);
      const clientAddressHex = addressToHex(address);
      const deadline = getDeadlineTimestamp();
      const deadlineHex = deadline.toString(16).padStart(16, '0');

      console.log('Transaction parameters:', {
        orderId: order.id,
        hexOrderId,
        clientAddress: address,
        clientAddressHex,
        providerAddress,
        providerAddressHex,
        deadline,
        deadlineHex,
        paymentToken,
        amount: order.amount,
      });

      let transaction;
      if (paymentToken === 'EGLD') {
        const amount = BigInt(Math.round(order.amount * 1e18));
        const data = `deposit@${hexOrderId}@${providerAddressHex}@${deadlineHex}`;
        transaction = new Transaction({
          value: amount,
          data: Buffer.from(data),
          receiver: new Address(ESCROW_ADDRESS),
          gasLimit: BigInt(20000000),
          sender: new Address(address),
          chainID: network.chainId,
        });
        console.log('Creating EGLD transaction:', {
          orderId: order.id,
          hexOrderId,
          clientAddressHex,
          providerAddress,
          providerAddressHex,
          deadline,
          deadlineHex,
          amount: amount.toString(),
          data,
          escrowAddress: ESCROW_ADDRESS,
        });
      } else {
        const value = BigInt(Math.round(order.amount * 1e18));
        const tokenIdHex = Buffer.from(paymentToken, 'utf8').toString('hex');
        const amountHex = value.toString(16);
        const paddedAmountHex = amountHex.length % 2 === 0 ? amountHex : '0' + amountHex;
        const functionNameHex = Buffer.from('depositEsdt', 'utf8').toString('hex');
        const data = `ESDTTransfer@${tokenIdHex}@${paddedAmountHex}@${functionNameHex}@${hexOrderId}@${providerAddressHex}@${deadlineHex}`;
        transaction = new Transaction({
          value: BigInt(0),
          data: Buffer.from(data),
          receiver: new Address(ESCROW_ADDRESS),
          gasLimit: BigInt(20000000),
          sender: new Address(address),
          chainID: network.chainId,
        });
        console.log('Creating ESDT transaction:', {
          orderId: order.id,
          hexOrderId,
          providerAddress,
          providerAddressHex,
          deadline,
          deadlineHex,
          tokenId: paymentToken,
          tokenIdHex,
          paddedAmountHex,
          data,
          escrowAddress: ESCROW_ADDRESS,
        });
      }

      console.log('Calling signAndSendTransactions...');
      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: `Processing ${tokenDisplayName} payment...`,
          errorMessage: `${tokenDisplayName} payment failed`,
          successMessage: `${tokenDisplayName} payment successful`,
        },
        timeout: 300000,
      });

      console.log(`${tokenDisplayName} payment successful, session ID:`, sessionId);

      const verification = await monitorTransactionStatus(sessionId);
      if (!verification.success) {
        throw new Error(verification.error || 'Transaction failed during verification');
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'escrowed',
          status: 'in_progress',
          status_updated_at: new Date().toISOString(),
          provider_address: providerAddress,
          client_address: address,
          transaction_hash: sessionId,
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('Error updating order:', updateError);
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      console.log('Payment successful and database updated');
      setShowPaymentModal(false);
      window.location.reload();
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error
        ? error.message.includes('timeout')
          ? 'Transaction signing timeout expired. Please try again and ensure your wallet is unlocked.'
          : error.message.includes('User rejected')
          ? 'Transaction was cancelled by the user.'
          : error.message.includes('Insufficient funds')
          ? 'Insufficient funds in the wallet.'
          : error.message.includes('fail')
          ? 'Transaction failed on the smart contract. There may already be a payment for this order or invalid parameters.'
          : `${tokenDisplayName} payment failed: ${error.message}`
        : `${tokenDisplayName} payment failed: Unknown error`;
      setProviderAddressError(errorMessage);
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleReleasePayment = async () => {
    try {
      setIsReleaseLoading(true);
      if (!address || !order) {
        alert('Please connect your wallet');
        return;
      }

      const hexOrderId = uuidToHex(order.id);
      const transaction = new Transaction({
        value: BigInt(0),
        data: Buffer.from(`release@${hexOrderId}`),
        receiver: new Address(ESCROW_ADDRESS),
        gasLimit: BigInt(20000000),
        sender: new Address(address),
        chainID: network.chainId,
      });

      console.log('Creating release transaction:', { orderId: order.id, hexOrderId, escrowAddress: ESCROW_ADDRESS });

      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Releasing payment...',
          errorMessage: 'Release failed',
          successMessage: 'Payment successfully released',
        },
        timeout: 120000,
      });

      console.log('Payment released, session ID:', sessionId);
      const verification = await monitorTransactionStatus(sessionId);
      if (!verification.success) {
        throw new Error(verification.error || 'Release failed during verification');
      }

      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'released',
          status: 'completed',
          status_updated_at: new Date().toISOString(),
          work_status: 'completed',
        })
        .eq('id', order.id);

      if (error) {
        console.error('Error updating order:', error);
        throw new Error(`Database update failed: ${error.message}`);
      }

      try {
        await supabase.from('notifications').insert({
          user_id: order.gig?.provider?.id || order.gig?.provider_id,
          type: 'payment_released',
          title: 'Payment Released',
          content: `Payment for order "${order.gig?.title || 'Custom Project'}" has been successfully released.`,
          data: { order_id: order.id },
          read: false,
        });
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
      }

      try {
        await supabase.from('messages').insert({
          order_id: order.id,
          sender_id: user?.id || order.client?.id,
          content: JSON.stringify({
            type: 'payment_released',
            message: '💰 Payment has been successfully released! The order is completed.',
          }),
          attachments: [],
        });
      } catch (messageError) {
        console.error('Error adding system message:', messageError);
      }

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Release error:', error);
    } finally {
      setIsReleaseLoading(false);
    }
  };

  const handleDisputePayment = async (reason: string) => {
    try {
      setIsPaymentLoading(true);
      if (!address || !order) {
        alert('Please connect your wallet');
        return;
      }

      const hexOrderId = uuidToHex(order.id);
      const transaction = new Transaction({
        value: BigInt(0),
        data: Buffer.from(`dispute@${hexOrderId}`),
        receiver: new Address(ESCROW_ADDRESS),
        gasLimit: BigInt(20000000),
        sender: new Address(address),
        chainID: network.chainId,
      });

      console.log('Creating dispute transaction:', { orderId: order.id, hexOrderId, reason, escrowAddress: ESCROW_ADDRESS });

      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Creating dispute...',
          errorMessage: 'Dispute creation failed',
          successMessage: 'Dispute successfully created',
        },
        timeout: 120000,
      });

      console.log('Dispute created, session ID:', sessionId);
      const verification = await monitorTransactionStatus(sessionId);
      if (!verification.success) {
        throw new Error(verification.error || 'Dispute creation failed during verification');
      }

      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'disputed',
          status_updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) {
        console.error('Error updating order:', error);
        throw new Error(`Database update failed: ${error.message}`);
      }

      await supabase.from('notifications').insert({
        user_id: order.client?.id,
        type: 'dispute_created',
        title: 'Order Disputed',
        content: `A dispute has been created for order ${order.id}. Reason: ${reason}`,
        data: { order_id: order.id },
        read: false,
      });

      setShowDisputeModal(false);
      window.location.reload();
    } catch (error) {
      console.error('Dispute error:', error);
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleSubmitWork = async () => {
    try {
      setIsSubmitWorkLoading(true);
      if (!order) {
        alert('Order not found');
        return;
      }

      const { error } = await supabase
        .from('orders')
        .update({
          work_status: 'submitted',
          status: 'delivered',
          status_updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) {
        throw new Error(`Order update failed: ${error.message}`);
      }

      await supabase.from('notifications').insert({
        user_id: order.client?.id,
        type: 'work_delivered',
        title: 'Work Delivered',
        content: 'The provider has delivered the work for your order. Please review and release the payment if you are satisfied.',
        data: { order_id: order.id },
        read: false,
      });

      await supabase.from('messages').insert({
        order_id: order.id,
        sender_id: user?.id || order.client?.id,
        content: JSON.stringify({
          type: 'work_delivered',
          message: '✅ Work has been delivered! The client can now review and release the payment.',
        }),
        attachments: [],
      });

      success('Work has been successfully delivered');
      window.location.reload();
    } catch (error) {
      console.error('Submit work error:', error);
      showError(error instanceof Error ? error.message : 'Error submitting work');
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
    if (diff <= 0) return 'Deadline expired';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days} days remaining`;
    return `${hours} hours remaining`;
  };

  const isClient = user?.id === order?.client?.id;
  const isProvider =
    user?.id === order?.gig?.provider_id ||
    user?.id === order?.gig?.provider?.id ||
    (user?.wallet_address && order?.provider_address && user.wallet_address === order.provider_address) ||
    (user?.wallet_address && order?.gig?.provider?.wallet_address && user.wallet_address === order.gig.provider.wallet_address);

  const canPay =
    isClient &&
    (order?.status === 'pending_approval' || order?.status === 'in_progress') &&
    order?.payment_status === 'pending' &&
    !providerAddressError;
  const canRelease = isClient && order?.status === 'delivered' && order?.payment_status === 'escrowed';
  const canSubmitWork =
    isProvider &&
    order?.status === 'in_progress' &&
    order?.payment_status === 'escrowed' &&
    order?.work_status !== 'submitted';
  const canReview = 
    isClient && 
    order?.status === 'completed' && 
    order?.payment_status === 'released';
  const canDispute =
    (isClient || isProvider) &&
    order?.payment_status === 'escrowed' &&
    order?.status !== 'completed' &&
    order?.status !== 'cancelled';
  const wasDisputed = order?.payment_status === 'disputed' || order?.payment_status === 'resolved';
  const isDisputeResolved = order?.payment_status === 'resolved';

  useEffect(() => {
    console.log('🔍 OrderDetails: Provider Debug info:', {
      userId: user?.id,
      userWalletAddress: user?.wallet_address,
      orderGigProviderId: order?.gig?.provider_id,
      orderGigProviderUserId: order?.gig?.provider?.id,
      orderProviderAddress: order?.provider_address,
      gigProviderWalletAddress: order?.gig?.provider?.wallet_address,
      isProvider,
      isClient,
      canSubmitWork,
      orderStatus: order?.status,
      paymentStatus: order?.payment_status,
      workStatus: order?.work_status,
    });

    if (order && !isLoading) {
      const providerAddress = order.provider_address || order.gig?.provider?.wallet_address;
      if (!isValidAddress(providerAddress) && order.gig_id) {
        fetchProviderAddress(order.gig_id).then((address) => {
          if (!address) {
            setProviderAddressError('Invalid or missing provider address. Please check the gig details.');
          }
        });
      }
    }
  }, [order, isLoading]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Loading order details" reference="#">
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

  const paymentToken = order.payment_token;
  const tokenDisplayName = getTokenDisplayName(paymentToken);
  const feeInfo = calculateFees(order.amount, paymentToken);
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="space-y-8">
        <Card className="p-8" title="Order Details" reference="#">
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h1 className="text-2xl font-bold text-white">{order.gig?.title || 'Custom Project'}</h1>
              <div className="flex gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getStatusColor(order.status) === 'green'
                      ? 'bg-green-100 text-green-800'
                      : getStatusColor(order.status) === 'blue'
                      ? 'bg-blue-100 text-blue-800'
                      : getStatusColor(order.status) === 'red'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getPaymentStatusColor(order.payment_status) === 'green'
                      ? 'bg-green-100 text-green-800'
                      : getPaymentStatusColor(order.payment_status) === 'yellow'
                      ? 'bg-yellow-100 text-yellow-800'
                      : getPaymentStatusColor(order.payment_status) === 'red'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Payment: {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)} (
                  {tokenDisplayName})
                </span>
                {wasDisputed && (
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                      isDisputeResolved ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {isDisputeResolved ? (
                      <>
                        <Shield size={14} className="text-purple-400" />
                        Resolved by Admin
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={14} className="text-red-800" />
                        Dispute
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
                <h3 className="text-lg font-bold text-grey mb-2">🏛️ Dispute Resolved by Administration</h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  This dispute has been officially resolved by the platform administration. The decision is final, and
                  funds have been distributed.
                </p>
              </div>
            )}

            {providerAddressError && (
              <div className="bg-red-100 border border-red-500 rounded-xl p-4">
                <div className="flex items-center">
                  <AlertTriangle size={20} className="text-red-800 mr-2" />
                  <p className="text-red-800">{providerAddressError}</p>
                </div>
              </div>
            )}

            {canPay && (
              <div className="bg-blue-100 border border-blue-500 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-gray-800 font-bold">Payment Required</h3>
                    <p className="text-gray-800">
                      Please pay {feeInfo.clientPays} {tokenDisplayName} to start the order.
                    </p>
                    {paymentToken === 'EGLD' && (
                      <p className="text-gray-600 text-sm mt-1">
                        Provider will receive {feeInfo.providerGets} EGLD (after deducting {feeInfo.feePercentage}% fee)
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    disabled={!!providerAddressError}
                  >
                    <DollarSign size={16} className="text-white" />
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
                      Once the work is completed, click the button to notify the client.
                    </p>
                  </div>
                  <Button
                    onClick={handleSubmitWork}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    disabled={isSubmitWorkLoading}
                  >
                    <FileText size={16} className="text-white" />
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
                      The provider has delivered the work. Please review and release the payment if you are satisfied.
                    </p>
                  </div>
                  <Button
                    onClick={handleReleasePayment}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    disabled={isReleaseLoading}
                  >
                    <Check size={16} className="text-white" />
                    Release Payment
                  </Button>
                </div>
              </div>
            )}

            {canReview && (
              <div className="bg-blue-100 border border-blue-500 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-gray-800 font-bold">
                      {existingReview ? 'Update Your Review' : 'Leave a Review'}
                    </h3>
                    <p className="text-gray-800">
                      {existingReview 
                        ? 'You can update your review for this completed order.' 
                        : 'Share your experience with this provider to help other clients.'}
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowReviewModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Star size={16} className="text-white" />
                    {existingReview ? 'Update Review' : 'Write Review'}
                  </Button>
                </div>
              </div>
            )}

            {canDispute && (
              <div className="bg-red-100 border border-red-500 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-gray-800 font-bold">Issue with the Order?</h3>
                    <p className="text-gray-800">
                      If you have an issue, you can create a dispute to be reviewed by the administration.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowDisputeModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    disabled={isPaymentLoading}
                  >
                    <AlertTriangle size={16} className="text-white" />
                    Create Dispute
                  </Button>
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Order Progress</span>
                {order.status === 'in_progress' && <span className="text-blue-400">{getRemainingTime()}</span>}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    getStatusColor(order.status) === 'green'
                      ? 'bg-green-500'
                      : getStatusColor(order.status) === 'blue'
                      ? 'bg-blue-500'
                      : getStatusColor(order.status) === 'red'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                  }`}
                  style={{ width: `${getProgressValue(order.status)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-gray-400 text-sm">
                <span>Order Created</span>
                <span>In Progress</span>
                <span>Delivered</span>
                <span>Completed</span>
              </div>
            </div>

            <hr className="border-gray-600" />

            <div>
              <p className="text-gray-400 mb-2">Order Requirements:</p>
              <p className="text-grey">{order.requirements?.description || 'No specific requirements'}</p>
            </div>

            <hr className="border-gray-600" />

            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-400 mb-2">Client</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden relative bg-gray-600">
                    {order.client?.avatar_url ? (
                      <>
                        <img
                          src={order.client.avatar_url}
                          alt={order.client.username || 'Client'}
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
                          className="fallback-avatar w-full h-full bg-gray-600 flex items-center justify-center text-xs text-white absolute inset-0"
                          style={{ display: 'none' }}
                        >
                          {order.client?.username?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gray-600 flex items-center justify-center text-xs text-white">
                        {order.client?.username?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <span className="text-grey">{order.client?.username || 'Unknown'}</span>
                </div>
              </div>
              <div>
                <p className="text-gray-400 mb-2">Amount</p>
                <p className="text-blue-400 text-xl font-bold">
                  {order.amount} {tokenDisplayName}
                </p>
                {paymentToken === 'EGLD' && (
                  <p className="text-gray-400 text-sm">Provider will receive: {feeInfo.providerGets} EGLD</p>
                )}
                {isDisputeResolved && <p className="text-purple-300 text-sm mt-1">✅ Resolved by Admin</p>}
              </div>
            </div>
          </div>
        </Card>

        <div className="bg-gray-800 p-8 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-6 p-4 sm:p-8">Communication</h2>
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
                    <p className="text-blue-800 font-medium">Secure escrow payment</p>
                    <p className="text-blue-800 text-sm">
                      Your payment will be held in escrow until approval of completed work.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-md">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order amount:</span>
                    <span className="text-white font-bold">
                      {order.amount} {tokenDisplayName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Service fee:</span>
                    <span className="text-white">
                      {feeInfo.platformFee > 0
                        ? `${feeInfo.platformFee.toFixed(2)} ${tokenDisplayName} (${feeInfo.feePercentage}%)`
                        : `0 ${tokenDisplayName} (0%)`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Provider will receive:</span>
                    <span className="text-white font-bold">
                      {feeInfo.providerGets} {tokenDisplayName}
                    </span>
                  </div>
                  <hr className="border-gray-600" />
                  <div className="flex justify-between">
                    <span className="text-gray-400">You will pay total:</span>
                    <span className="text-blue-400 font-bold">
                      {feeInfo.clientPays} {tokenDisplayName}
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
                disabled={isPaymentLoading || !!providerAddressError}
              >
                <DollarSign size={16} className="text-white" />
                {isPaymentLoading ? 'Processing...' : 'Pay Now'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <DisputeModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        order={order}
        onDisputeSubmitted={() => {
          setShowDisputeModal(false);
          window.location.reload();
        }}
      />

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        order={order}
        onReviewSubmitted={() => {
          setShowReviewModal(false);
          refetchReview();
          success('Review submitted successfully!');
        }}
      />
    </div>
  );
};

export { OrderDetails };