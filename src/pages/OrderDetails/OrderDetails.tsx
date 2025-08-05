import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, AlertTriangle, DollarSign, Clock, Check, FileText, XCircle } from 'lucide-react';
import { Button, Card, OrderChat } from 'components';
import { useGetIsLoggedIn, useGetAccount, useGetNetworkConfig, Transaction, Address } from 'lib';
import { signAndSendTransactions } from '../../helpers/signAndSendTransactions';
import { useOrderById } from '../../hooks/useOrders';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import axios from 'axios';

const ESCROW_ADDRESS = 'erd1qqqqqqqqqqqqqpgqvesht6c8ard8zzj5n02fmfae0kuy2z4vpmuqw5q9v0';

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
    if (!isValidAddress(bech32Address)) {
      throw new Error('Neplatná adresa: adresa nie je v správnom Bech32 formáte');
    }
    const address = new Address(bech32Address);
    const hex = address.hex();
    const zeroAddress = '0000000000000000000000000000000000000000000000000000000000000000';
    if (hex === zeroAddress) {
      throw new Error('Adresa nemôže byť nulová');
    }
    return hex;
  } catch (error) {
    console.error('Failed to convert address to hex:', error);
    throw new Error(`Neplatný formát adresy: ${bech32Address}`);
  }
};

const uuidToHex = (uuid: string): string => {
  const cleanUuid = uuid.replace(/-/g, '');
  if (cleanUuid.length !== 32) {
    throw new Error('Neplatný formát UUID, musí mať 32 hex znakov bez pomlčiek');
  }
  console.log('UUID conversion:', { original: uuid, clean: cleanUuid, hex: cleanUuid });
  return cleanUuid;
};

const getDeadlineTimestamp = (): number => {
  const currentTime = Math.floor(Date.now() / 1000);
  const deadline = currentTime + 7 * 24 * 60 * 60;
  if (deadline <= currentTime + 86_400) {
    throw new Error('Deadline musí byť aspoň 1 deň v budúcnosti');
  }
  console.log('Vygenerovaný deadline:', { currentTime, deadline });
  return deadline;
};

const checkWalletBalance = async (walletAddress: string, requiredAmount: number, tokenId: string = 'EGLD') => {
  try {
    console.log('🔍 Kontrola zostatku peňaženky:', { walletAddress, requiredAmount, tokenId });
    if (!isValidAddress(walletAddress)) {
      throw new Error('Neplatná adresa peňaženky');
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
      console.log('💰 Výsledok EGLD zostatku:', { raw: response.data.balance, formatted: balance });
    } else {
      console.log(`🪙 Kontrola ESDT zostatku pre: ${tokenId}`);
      try {
        const response = await axios.get(
          `https://api.multiversx.com/accounts/${walletAddress}/tokens/${tokenId}`,
          { timeout: 15000 }
        );
        if (response.data && response.data.balance) {
          const tokenDecimals = 18;
          balance = parseFloat(response.data.balance) / Math.pow(10, tokenDecimals);
          console.log(`✅ Nájdený zostatok pre ${tokenId}:`, {
            raw: response.data.balance,
            decimals: tokenDecimals,
            formatted: balance
          });
        } else {
          console.log(`❌ Žiadny zostatok pre ${tokenId}`);
          balance = 0;
        }
      } catch (error) {
        console.error(`⚠️ Chyba pri kontrole ESDT zostatku:`, error);
        balance = 0;
      }
    }

    const effectiveAmount = tokenId === 'EGLD' ? requiredAmount * 1.1111 : requiredAmount;
    console.log('🏁 Výsledok kontroly zostatku:', {
      address: walletAddress,
      tokenId,
      balance,
      requiredAmount: effectiveAmount,
      hasEnoughFunds: balance >= effectiveAmount
    });

    return {
      hasEnoughFunds: balance >= effectiveAmount,
      balance,
      required: effectiveAmount,
      error: null
    };
  } catch (error) {
    console.error('💥 Chyba pri kontrole zostatku:', error);
    return {
      hasEnoughFunds: false,
      balance: 0,
      required: requiredAmount,
      error: error instanceof Error ? error.message : 'Unknown error'
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
        timestamp: txData.timestamp
      });

      if (['success', 'executed'].includes(txData.status)) {
        console.log('Transaction confirmed as successful:', txHash);
        return { success: true, data: txData };
      } else if (['fail', 'invalid', 'not_executed'].includes(txData.status)) {
        console.error('Transaction failed:', txHash, txData.status);
        return { success: false, error: `Transakcia zlyhala so stavom: ${txData.status}` };
      } else {
        console.log(`Transakcia stále ${txData.status}, čaká sa...`);
        await new Promise((resolve) => setTimeout(resolve, 6000));
        continue;
      }
    } catch (error) {
      console.log(`Pokus ${attempt} zlyhal:`, error instanceof Error ? error.message : error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.log('Transakcia ešte nebola nájdená, čaká sa...');
        } else if (error.response?.status === 429) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Limit prekročený, čaká sa ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          console.error('Axios error:', error.response?.status, error.response?.data);
        }
      }
      if (attempt === maxAttempts) {
        throw new Error(`Monitorovanie transakcie zlyhalo po ${maxAttempts} pokusoch`);
      }
      await new Promise((resolve) => setTimeout(resolve, 6000));
    }
  }
  throw new Error('Časový limit monitorovania transakcie');
};

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();
  const { network } = useGetNetworkConfig();
  const { user } = useAuth();
  
  const { data: order, isLoading, error } = useOrderById(id || '');

  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isReleaseLoading, setIsReleaseLoading] = useState(false);
  const [isSubmitWorkLoading, setIsSubmitWorkLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [providerAddressError, setProviderAddressError] = useState<string | null>(null);

  const ESCROW_ADDRESS = 'erd1qqqqqqqqqqqqqpgqvesht6c8ard8zzj5n02fmfae0kuy2z4vpmuqw5q9v0';

  const fetchProviderAddress = async (gigId: string): Promise<string | null> => {
    try {
      console.log('Fetching provider address for gig:', { gigId });
      const { data, error } = await supabase
        .from('gigs')
        .select('provider_id, users!provider_id(wallet_address)')
        .eq('id', gigId)
        .single();
      
      if (error) {
        console.error('Supabase error fetching provider address:', error);
        return null;
      }
      
      const walletAddress = data?.users?.[0]?.wallet_address;
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

  // Helper function to get display token name
  const getTokenDisplayName = (paymentToken: string) => {
    if (paymentToken === 'EGLD') return 'EGLD';
    if (paymentToken === 'IDA-f9bc1d') return 'IDA';
    return paymentToken; // fallback for other tokens
  };

  // Helper function to calculate fees
  const calculateFees = (amount: number, paymentToken: string) => {
    if (paymentToken === 'EGLD') {
      // For EGLD: client pays full amount, provider gets 90%, platform gets 10%
      return {
        clientPays: amount,
        providerGets: amount * 0.9,
        platformFee: amount * 0.1,
        feePercentage: 10
      };
    } else {
      // For IDA: no fees, client pays amount, provider gets full amount
      return {
        clientPays: amount,
        providerGets: amount,
        platformFee: 0,
        feePercentage: 0
      };
    }
  };
  const handlePayment = async () => {
    console.log('Payment button clicked!', { address, order });
    if (!address || !order) {
      alert('Prosím, pripojte svoju peňaženku');
      return;
    }

    // Check if payment was already made
    if (order.payment_status !== 'pending') {
      alert('Platba už bola spracovaná alebo je v inom stave');
      return;
    }

    const paymentToken = order.payment_token;
    const tokenDisplayName = getTokenDisplayName(paymentToken);
    
    try {
      setIsPaymentLoading(true);
      console.log('Creating transaction...', { orderData: JSON.stringify(order, null, 2) });

      // Validate client address
      if (!isValidAddress(address)) {
        throw new Error('Neplatná adresa klienta');
      }

      let providerAddress = order.provider_address || order.gig?.users?.wallet_address;
      if (!isValidAddress(providerAddress) && order.gig_id) {
        console.log('Provider address not found in order, fetching from database...', { gigId: order.gig_id });
        providerAddress = await fetchProviderAddress(order.gig_id);
        if (!providerAddress || !isValidAddress(providerAddress)) {
          throw new Error('Nepodarilo sa načítať platnú adresu poskytovateľa z databázy. Skontrolujte údaje gig-u.');
        }
        
        // Update the order with provider address before creating transaction
        const { error: updateError } = await supabase
          .from('orders')
          .update({ provider_address: providerAddress })
          .eq('id', order.id);
        if (updateError) {
          console.error('Error updating provider_address:', updateError);
          throw new Error(`Failed to update provider_address: ${updateError.message}`);
        }
      }
      if (!isValidAddress(providerAddress)) {
        throw new Error('Neplatná alebo chýbajúca adresa poskytovateľa. Skontrolujte údaje objednávky.');
      }

      // Update client address in order before payment
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
        const feeText = paymentToken === 'EGLD' ? ' (vrátane 10% poplatku)' : '';
        throw new Error(
          `Nedostatok prostriedkov. Potrebujete aspoň ${balanceCheck.required.toFixed(4)} ${tokenDisplayName}${feeText}, ale máte iba ${balanceCheck.balance.toFixed(4)} ${tokenDisplayName}.`
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
        amount: order.amount
      });

      let transaction;
      if (paymentToken === 'EGLD') {
        // For EGLD: client pays the full amount, 10% fee is deducted on smart contract side
        const amount = BigInt(Math.round(order.amount * 1e18));
        const data = `deposit@${hexOrderId}@${clientAddressHex}@${providerAddressHex}@${deadlineHex}`;
        transaction = new Transaction({
          value: amount,
          data: Buffer.from(data),
          receiver: new Address(ESCROW_ADDRESS),
          gasLimit: BigInt(20000000),
          sender: new Address(address),
          chainID: network.chainId
        });
        console.log('Vytváranie EGLD transakcie:', { orderId: order.id, hexOrderId, clientAddressHex, providerAddress, providerAddressHex, deadline, deadlineHex, amount: amount.toString(), data, escrowAddress: ESCROW_ADDRESS });
      } else {
        // For IDA: no fees, client pays exact amount
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
          chainID: network.chainId
        });
        console.log('Vytváranie ESDT transakcie:', { orderId: order.id, hexOrderId, providerAddress, providerAddressHex, deadline, deadlineHex, tokenId: paymentToken, tokenIdHex, paddedAmountHex, data, escrowAddress: ESCROW_ADDRESS });
      }

      console.log('Calling signAndSendTransactions...');
      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: `Spracováva sa ${tokenDisplayName} platba...`,
          errorMessage: `${tokenDisplayName} platba zlyhala`,
          successMessage: `${tokenDisplayName} platba úspešná`
        },
        timeout: 300000
      });

      console.log(`${tokenDisplayName} platba úspešná, session ID:`, sessionId);

      const verification = await monitorTransactionStatus(sessionId);
      if (!verification.success) {
        throw new Error(verification.error || 'Transakcia zlyhala pri overovaní');
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'escrowed',
          status: 'in_progress',
          status_updated_at: new Date().toISOString(),
          provider_address: providerAddress,
          client_address: address,
          transaction_hash: sessionId
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('Error updating order:', updateError);
        throw new Error(`Aktualizácia databázy zlyhala: ${updateError.message}`);
      }

      console.log('Platba úspešná a databáza aktualizovaná');
      setShowPaymentModal(false);
      window.location.reload();
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error
        ? error.message.includes('timeout')
          ? 'Časový limit podpisu transakcie vypršal. Skúste znova a uistite sa, že je peňaženka odomknutá.'
          : error.message.includes('User rejected')
          ? 'Transakcia bola zrušená používateľom.'
          : error.message.includes('Insufficient funds')
          ? 'Nedostatok prostriedkov v peňaženke.'
          : error.message.includes('fail')
          ? 'Transakcia zlyhala na smart kontrakte. Možno už existuje platba pre túto objednávku alebo sú neplatné parametre.'
          : `${tokenDisplayName} platba zlyhala: ${error.message}`
        : `${tokenDisplayName} platba zlyhala: Neznáma chyba`;
      setProviderAddressError(errorMessage);
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleReleasePayment = async () => {
    try {
      setIsReleaseLoading(true);
      if (!address || !order) {
        alert('Prosím, pripojte svoju peňaženku');
        return;
      }

      const hexOrderId = uuidToHex(order.id);
      const transaction = new Transaction({
        value: BigInt(0),
        data: Buffer.from(`release@${hexOrderId}`),
        receiver: new Address(ESCROW_ADDRESS),
        gasLimit: BigInt(20000000),
        sender: new Address(address),
        chainID: network.chainId
      });

      console.log('Vytváranie release transakcie:', { orderId: order.id, hexOrderId, escrowAddress: ESCROW_ADDRESS });

      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Uvoľňuje sa platba...',
          errorMessage: 'Uvoľnenie zlyhalo',
          successMessage: 'Platba úspešne uvoľnená'
        },
        timeout: 120000
      });

      console.log('Platba uvoľnená, session ID:', sessionId);
      const verification = await monitorTransactionStatus(sessionId);
      if (!verification.success) {
        throw new Error(verification.error || 'Uvoľnenie zlyhalo pri overovaní');
      }

      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'released',
          status: 'completed',
          status_updated_at: new Date().toISOString(),
          work_status: 'completed'
        })
        .eq('id', order.id);

      if (error) {
        console.error('Error updating order:', error);
        throw new Error(`Aktualizácia databázy zlyhala: ${error.message}`);
      }

      // Send notification to provider
      try {
        await supabase.from('notifications').insert({
          user_id: order.gig?.provider?.id || order.gig?.users?.id,
          type: 'payment_released',
          title: 'Payment Released',
          content: `Platba za objednávku "${order.gig?.title || 'Custom Project'}" bola úspešne uvoľnená.`,
          data: { order_id: order.id },
          read: false
        });
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't fail the whole process if notification fails
      }

      // Add system message to chat
      try {
        await supabase.from('messages').insert({
          order_id: order.id,
          sender_id: user?.id || order.client?.id,
          content: JSON.stringify({
            type: 'payment_released',
            message: '💰 Platba bola úspešne uvoľnená! Objednávka je dokončená.',
          }),
          attachments: [],
        });
      } catch (messageError) {
        console.error('Error adding system message:', messageError);
        // Don't fail the whole process if message fails
      }

      
      // Force refresh the order data
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
        alert('Prosím, pripojte svoju peňaženku');
        return;
      }

      const hexOrderId = uuidToHex(order.id);
      const transaction = new Transaction({
        value: BigInt(0),
        data: Buffer.from(`dispute@${hexOrderId}`),
        receiver: new Address(ESCROW_ADDRESS),
        gasLimit: BigInt(20000000),
        sender: new Address(address),
        chainID: network.chainId
      });

      console.log('Vytváranie dispute transakcie:', { orderId: order.id, hexOrderId, reason, escrowAddress: ESCROW_ADDRESS });

      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Vytvára sa spor...',
          errorMessage: 'Vytvorenie sporu zlyhalo',
          successMessage: 'Spor úspešne vytvorený'
        },
        timeout: 120000
      });

      console.log('Spor vytvorený, session ID:', sessionId);
      const verification = await monitorTransactionStatus(sessionId);
      if (!verification.success) {
        throw new Error(verification.error || 'Vytvorenie sporu zlyhalo pri overovaní');
      }

      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'disputed',
          status_updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) {
        console.error('Error updating order:', error);
        throw new Error(`Aktualizácia databázy zlyhala: ${error.message}`);
      }

      await supabase.from('notifications').insert({
        user_id: order.client_id,
        type: 'dispute_created',
        title: 'Order Disputed',
        content: `Spor bol vytvorený pre objednávku ${order.id}. Dôvod: ${reason}`,
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
        alert('Objednávka nenájdená');
        return;
      }

      const { error } = await supabase
        .from('orders')
        .update({
          work_status: 'submitted',
          status: 'delivered',
          status_updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) {
        throw new Error(`Aktualizácia objednávky zlyhala: ${error.message}`);
      }

      await supabase.from('notifications').insert({
        user_id: order.client_id,
        type: 'work_delivered',
        title: 'Work Delivered',
        content: 'Poskytovateľ odovzdal prácu pre vašu objednávku. Prosím, skontrolujte a uvoľnite platbu, ak ste spokojní.',
        data: { order_id: order.id },
        read: false
      });

      await supabase.from('messages').insert({
        order_id: order.id,
        sender_id: user?.id || order.client_id,
        content: JSON.stringify({
          type: 'work_delivered',
          message: '✅ Práca bola odovzdaná! Klient môže teraz skontrolovať a uvoľniť platbu.',
        }),
        attachments: [],
      });

      showToast('Práca bola úspešne odovzdaná', 'success');
      window.location.reload();
    } catch (error) {
      console.error('Submit work error:', error);
      showToast(error instanceof Error ? error.message : 'Chyba pri odovzdávaní práce', 'error');
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
    if (diff <= 0) return 'Termín vypršal';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days} dní zostáva`;
    return `${hours} hodín zostáva`;
  };

  const isClient = user?.id === order?.client?.id;
  const isProvider = user?.id === order?.gig?.provider_id || 
                    user?.id === order?.gig?.provider?.id ||
                    (user?.wallet_address && order?.provider_address && user.wallet_address === order.provider_address) ||
                    (user?.wallet_address && order?.gig?.provider?.wallet_address && user.wallet_address === order.gig.provider.wallet_address);

  const canPay = isClient && 
                 (order?.status === 'pending_approval' || order?.status === 'in_progress') && 
                 order?.payment_status === 'pending' && 
                 !providerAddressError;
  const canRelease = isClient && order?.status === 'delivered' && order?.payment_status === 'escrowed';
  const canSubmitWork = isProvider && 
                        order?.status === 'in_progress' && 
                        order?.payment_status === 'escrowed' && 
                        order?.work_status !== 'submitted';
  const canDispute = (isClient || isProvider) && order?.payment_status === 'escrowed' && order?.status !== 'completed' && order?.status !== 'cancelled' && order?.payment_status !== 'disputed';
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
      workStatus: order?.work_status
    });
    
    if (order && !isLoading) {
      const providerAddress = order.provider_address || order.gig?.users?.wallet_address;
      if (!isValidAddress(providerAddress) && order.gig_id) {
        fetchProviderAddress(order.gig_id).then((address) => {
          if (!address) {
            setProviderAddressError('Neplatná alebo chýbajúca adresa poskytovateľa. Skontrolujte údaje gig-u.');
          }
        });
      }
    }
  }, [order, isLoading]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Načítavanie detailov objednávky" reference="#">
          <div className="flex justify-center">
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-white">Načítavanie detailov objednávky...</p>
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
          <p className="text-white">{error ? `Chyba: ${error.message}` : 'Objednávka nenájdená'}</p>
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
        <Card className="p-8" title="Detaily objednávky" reference="#">
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h1 className="text-2xl font-bold text-white">{order.gig?.title || 'Vlastný projekt'}</h1>
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
                  Platba: {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)} ({tokenDisplayName})
                </span>
                {wasDisputed && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                    isDisputeResolved ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {isDisputeResolved ? (
                      <>
                        <Shield size={14} />
                        Vyriešené adminom
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={14} />
                        Spor
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
                  🏛️ Spor vyriešený administráciou
                </h3>
                <p className="text-gray-300 max-w-sm mx-auto">
                  Tento spor bol oficiálne vyriešený administráciou platformy. Rozhodnutie je konečné a prostriedky boli distribuované.
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
                    <h3 className="text-gray-800 font-bold">Vyžaduje sa platba</h3>
                    <p className="text-gray-800">
                      Prosím, zaplaťte {feeInfo.clientPays} {tokenDisplayName} na začatie objednávky.
                    </p>
                    {paymentToken === 'EGLD' && (
                      <p className="text-gray-600 text-sm mt-1">
                        Poskytovateľ dostane {feeInfo.providerGets} EGLD (po odpočítaní {feeInfo.feePercentage}% poplatku)
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    disabled={!!providerAddressError}
                  >
                    <DollarSign size={16} />
                    Zaplatiť teraz
                  </Button>
                </div>
              </div>
            )}

            {canSubmitWork && (
              <div className="bg-blue-100 border border-blue-500 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-gray-800 font-bold">Práca pripravená na odovzdanie?</h3>
                    <p className="text-gray-800">
                      Po dokončení práce kliknite na tlačidlo pre notifikáciu klienta.
                    </p>
                  </div>
                  <Button
                    onClick={handleSubmitWork}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    disabled={isSubmitWorkLoading}
                  >
                    <FileText size={16} />
                    Odovzdať prácu
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
                      The provider has delivered the work. Please review and release payment if you're satisfied.
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

            {canDispute && (
              <div className="bg-red-100 border border-red-500 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-gray-800 font-bold">Problém s objednávkou?</h3>
                    <p className="text-gray-800">
                      Ak máte problém, môžete vytvoriť spor, ktorý preskúma administrácia.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowDisputeModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <AlertTriangle size={16} />
                    Vytvoriť spor
                  </Button>
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Pokrok objednávky</span>
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
                <span>Objednávka vytvorená</span>
                <span>V priebehu</span>
                <span>Odovzdaná</span>
                <span>Dokončená</span>
              </div>
            </div>

            <hr className="border-gray-600" />

            <div>
              <p className="text-gray-400 mb-2">Požiadavky objednávky:</p>
              <p className="text-white">
                {order.requirements?.description || 'Žiadne špecifické požiadavky'}
              </p>
            </div>

            <hr className="border-gray-600" />

            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-400 mb-2">Klient</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden relative bg-gray-600">
                    {order.client?.avatar_url ? (
                      <>
                        <img
                          src={order.client.avatar_url}
                          alt={order.client.username || "Client"}
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
                          {order.client?.username?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gray-600 flex items-center justify-center text-xs text-white">
                        {order.client?.username?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                  <span className="text-white">{order.client?.username || "Neznámy"}</span>
                </div>
              </div>
              <div>
                <p className="text-gray-400 mb-2">Suma</p>
                <p className="text-blue-400 text-xl font-bold">
                  {order.amount} {tokenDisplayName}
                </p>
                {paymentToken === 'EGLD' && (
                  <p className="text-gray-400 text-sm">
                    Poskytovateľ dostane: {feeInfo.providerGets} EGLD
                  </p>
                )}
                {isDisputeResolved && (
                  <p className="text-purple-300 text-sm mt-1">
                    ✅ Vyriešené adminom
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="bg-gray-800 p-8 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-6">Komunikácia</h2>
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
                      {feeInfo.platformFee > 0 ? `${feeInfo.platformFee.toFixed(2)} ${tokenDisplayName} (${feeInfo.feePercentage}%)` : `0 ${tokenDisplayName} (0%)`}
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

export { OrderDetails };