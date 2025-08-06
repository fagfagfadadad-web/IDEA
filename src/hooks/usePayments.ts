import { useState } from 'react';
import { Transaction, Address, useGetIsLoggedIn, useGetAccount, useGetNetworkConfig } from 'lib';
import { signAndSendTransactions } from '../helpers';
import axios from 'axios';
import { supabase } from '../lib/supabase';

// Helper function to validate MultiversX address
const isValidAddress = (addr: string | undefined): boolean => {
  if (!addr) return false;
  try {
    new Address(addr);
    return true;
  } catch {
    return false;
  }
};

export const usePayments = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();
  const { network } = useGetNetworkConfig();
  const [isLoading, setIsLoading] = useState(false);

  // Konštanta pre adresu kontraktu
  const ESCROW_ADDRESS = 'erd1qqqqqqqqqqqqqpgqvesht6c8ard8zzj5n02fmfae0kuy2z4vpmuqw5q9v0';

  // Pomocná funkcia na konverziu UUID na hex
  const uuidToHex = (uuid: string): string => {
    const cleanUuid = uuid.replace(/-/g, '');
    if (cleanUuid.length !== 32) {
      throw new Error('Neplatný formát UUID, musí mať 32 hex znakov bez pomlčiek');
    }
    console.log('UUID konverzia:', { original: uuid, clean: cleanUuid, hex: cleanUuid });
    return cleanUuid;
  };

  // Konverzia bech32 adresy na hex
  const addressToHex = (bech32Address: string): string => {
    try {
      const addressObj = new Address(bech32Address);
      if (addressObj.bech32() === 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu') {
        throw new Error('Adresa nemôže byť nulová');
      }
      return addressObj.hex();
    } catch (error) {
      console.error('Chyba pri konverzii adresy na hex:', error);
      throw new Error(`Neplatný formát adresy: ${bech32Address}`);
    }
  };

  // Generovanie deadline (7 dní od teraz)
  const getDeadlineTimestamp = (): number => {
    const currentTime = Math.floor(Date.now() / 1000);
    const deadline = currentTime + 7 * 24 * 60 * 60; // 7 dní
    if (deadline <= currentTime + 86_400) {
      throw new Error('Deadline musí byť aspoň 1 deň v budúcnosti');
    }
    return deadline;
  };

  // Kontrola zostatku peňaženky (EGLD alebo ESDT, napr. IDA-f9bc1d)
  const checkWalletBalance = async (walletAddress: string, requiredAmount: number, tokenId: string = 'EGLD') => {
    try {
      console.log('🔍 Kontrola zostatku peňaženky:', { walletAddress, requiredAmount, tokenId });

      if (!isValidAddress(walletAddress)) {
        throw new Error('Neplatná adresa peňaženky');
      }

      let balance = 0;

      if (tokenId === 'EGLD') {
        console.log('💰 Kontrola EGLD zostatku...');
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
            const tokenDecimals = 18; // Potvrdené pre IDA-f9bc1d
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
          console.error(`⚠️ Chyba pri kontrole ESDT zostatku:`, error instanceof Error ? error.message : String(error));
          balance = 0;
        }
      }

      // Úprava pre 10% poplatok pri EGLD
      const effectiveAmount = tokenId === 'EGLD' ? requiredAmount * 1.1111 : requiredAmount; // 10% poplatok
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
      console.error('💥 Chyba pri kontrole zostatku:', error instanceof Error ? error.message : String(error));
      return {
        hasEnoughFunds: false,
        balance: 0,
        required: requiredAmount,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  // Odoslanie EGLD platby
  const sendPayment = async (
    orderId: string,
    amount: number,
    escrowAddress: string = ESCROW_ADDRESS,
    paymentToken: string = 'EGLD',
    providerAddress?: string
  ) => {
    setIsLoading(true);
    try {
      if (!isLoggedIn || !address) {
        throw new Error('Prosím, pripojte svoju peňaženku');
      }

      if (!providerAddress) {
        throw new Error('Adresa poskytovateľa je povinná');
      }

      // Kontrola zostatku s ohľadom na 10% poplatok
      const balanceCheck = await checkWalletBalance(address, amount, paymentToken);
      if (!balanceCheck.hasEnoughFunds) {
        const errorMsg = `Nedostatok prostriedkov. Potrebujete aspoň ${balanceCheck.required.toFixed(4)} ${paymentToken} (vrátane 10% poplatku pre EGLD), ale máte iba ${balanceCheck.balance.toFixed(4)} ${paymentToken}.`;
        throw new Error(errorMsg);
      }

      if (paymentToken !== 'EGLD') {
        return await sendEsdtPayment(orderId, amount, escrowAddress, providerAddress, paymentToken);
      }

      const hexOrderId = uuidToHex(orderId);
      const providerAddressHex = addressToHex(providerAddress);
      const deadline = getDeadlineTimestamp();
      const deadlineHex = deadline.toString(16);
      const value = BigInt(Math.round(amount * 1e18));

      const data = `deposit@${hexOrderId}@${providerAddressHex}@${deadlineHex}`;

      const transaction = new Transaction({
        value: value,
        data: Buffer.from(data),
        receiver: new Address(escrowAddress),
        gasLimit: BigInt(20000000),
        sender: new Address(address),
        chainID: network.chainId
      });

      console.log('Vytváranie EGLD transakcie:', { hexOrderId, providerAddressHex, deadlineHex, value: value.toString(), data, escrowAddress });

      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Spracováva sa platba...',
          errorMessage: 'Platba zlyhala',
          successMessage: 'Platba úspešná'
        }
      });

      console.log('Platba úspešná, session ID:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('Platba zlyhala:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Odoslanie ESDT platby (napr. IDA-f9bc1d)
  const sendEsdtPayment = async (
    orderId: string,
    amount: number,
    escrowAddress: string = ESCROW_ADDRESS,
    providerAddress: string,
    tokenId: string
  ) => {
    setIsLoading(true);
    try {
      if (!isLoggedIn || !address) {
        throw new Error('Prosím, pripojte svoju peňaženku');
      }

      // Kontrola zostatku
      const balanceCheck = await checkWalletBalance(address, amount, tokenId);
      if (!balanceCheck.hasEnoughFunds) {
        const errorMsg = `Nedostatok prostriedkov. Potrebujete aspoň ${balanceCheck.required.toFixed(4)} ${tokenId}, ale máte iba ${balanceCheck.balance.toFixed(4)} ${tokenId}.`;
        throw new Error(errorMsg);
      }

      const hexOrderId = uuidToHex(orderId);
      const providerAddressHex = addressToHex(providerAddress);
      const deadline = getDeadlineTimestamp();
      const deadlineHex = deadline.toString(16);
      const value = BigInt(Math.round(amount * 1e18));
      const tokenIdHex = Buffer.from(tokenId, 'utf8').toString('hex');
      const amountHex = value.toString(16).padStart(16, '0');

      const functionNameHex = Buffer.from('depositEsdt', 'utf8').toString('hex');
      const data = `ESDTTransfer@${tokenIdHex}@${amountHex}@${functionNameHex}@${hexOrderId}@${providerAddressHex}@${deadlineHex}`;

      const transaction = new Transaction({
        value: BigInt(0),
        data: Buffer.from(data),
        receiver: new Address(escrowAddress),
        gasLimit: BigInt(20000000),
        sender: new Address(address),
        chainID: network.chainId
      });

      console.log('Vytváranie ESDT transakcie:', { hexOrderId, providerAddressHex, deadlineHex, tokenId, tokenIdHex, amountHex, data, escrowAddress });

      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: `Spracováva sa ${tokenId} platba...`,
          errorMessage: `${tokenId} platba zlyhala`,
          successMessage: `${tokenId} platba úspešná`
        }
      });

      console.log(`${tokenId} platba úspešná, session ID:`, sessionId);
      return sessionId;
    } catch (error) {
      console.error(`${tokenId} platba zlyhala:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Uvoľnenie platby
  const releasePayment = async (orderId: string) => {
    setIsLoading(true);
    try {
      if (!isLoggedIn || !address) {
        throw new Error('Prosím, pripojte svoju peňaženku');
      }

      const hexOrderId = uuidToHex(orderId);

      const transaction = new Transaction({
        value: BigInt(0),
        data: Buffer.from(`release@${hexOrderId}`),
        receiver: new Address(ESCROW_ADDRESS),
        gasLimit: BigInt(20000000),
        sender: new Address(address),
        chainID: network.chainId
      });

      console.log('Vytváranie release transakcie:', { hexOrderId, escrowAddress: ESCROW_ADDRESS });

      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Uvoľňuje sa platba...',
          errorMessage: 'Uvoľnenie zlyhalo',
          successMessage: 'Platba úspešne uvoľnená'
        }
      });

      console.log('Platba uvoľnená, session ID:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('Uvoľnenie zlyhalo:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Vyžiadanie platby
  const claimPayment = async (orderId: string) => {
    setIsLoading(true);
    try {
      if (!isLoggedIn || !address) {
        throw new Error('Prosím, pripojte svoju peňaženku');
      }

      const hexOrderId = uuidToHex(orderId);

      const transaction = new Transaction({
        value: BigInt(0),
        data: Buffer.from(`claim@${hexOrderId}`),
        receiver: new Address(ESCROW_ADDRESS),
        gasLimit: BigInt(20000000),
        sender: new Address(address),
        chainID: network.chainId
      });

      console.log('Vytváranie claim transakcie:', { hexOrderId, escrowAddress: ESCROW_ADDRESS });

      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Vyžaduje sa platba...',
          errorMessage: 'Vyžadovanie zlyhalo',
          successMessage: 'Platba úspešne vyžiadaná'
        }
      });

      console.log('Platba vyžiadaná, session ID:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('Vyžadovanie zlyhalo:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Spor o platbu
  const disputePayment = async (orderId: string, reason: string) => {
    setIsLoading(true);
    try {
      if (!isLoggedIn || !address) {
        throw new Error('Prosím, pripojte svoju peňaženku');
      }

      const hexOrderId = uuidToHex(orderId);

      const transaction = new Transaction({
        value: BigInt(0),
        data: Buffer.from(`dispute@${hexOrderId}`),
        receiver: new Address(ESCROW_ADDRESS),
        gasLimit: BigInt(20000000),
        sender: new Address(address),
        chainID: network.chainId
      });

      console.log('Vytváranie dispute transakcie:', { hexOrderId, reason, escrowAddress: ESCROW_ADDRESS });

      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Vytvára sa spor...',
          errorMessage: 'Vytvorenie sporu zlyhalo',
          successMessage: 'Spor úspešne vytvorený'
        }
      });

      console.log('Spor vytvorený, session ID:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('Vytvorenie sporu zlyhalo:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Riešenie sporu
  const resolveDispute = async (orderId: string, refundToClient: boolean) => {
    setIsLoading(true);
    try {
      if (!isLoggedIn || !address) {
        throw new Error('Prosím, pripojte svoju peňaženku');
      }

      const hexOrderId = uuidToHex(orderId);
      const refundFlag = refundToClient ? '01' : '00';

      const transaction = new Transaction({
        value: BigInt(0),
        data: Buffer.from(`resolveDispute@${hexOrderId}@${refundFlag}`),
        receiver: new Address(ESCROW_ADDRESS),
        gasLimit: BigInt(20000000),
        sender: new Address(address),
        chainID: network.chainId
      });

      console.log('Vytváranie resolveDispute transakcie:', { hexOrderId, refundToClient, refundFlag, escrowAddress: ESCROW_ADDRESS });

      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Rieši sa spor...',
          errorMessage: 'Riešenie sporu zlyhalo',
          successMessage: 'Spor úspešne vyriešený'
        }
      });

      console.log('Spor vyriešený, session ID:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('Riešenie sporu zlyhalo:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Kontrola stavu platby
  const checkOrderPaymentStatus = async (orderId: string) => {
    try {
      console.log('Kontrola stavu platby pre objednávku:', orderId);
      const hexOrderId = uuidToHex(orderId);
      const response = await axios.get(
        `https://api.multiversx.com/accounts/${address}/transactions?size=20&status=success`,
        { timeout: 15000 }
      );
      const tx = response.data.find((t: any) => t.data && Buffer.from(t.data, 'base64').toString('utf8').includes(hexOrderId));
      return {
        isPaid: !!tx && ['success', 'executed'].includes(tx.status),
        txHash: tx?.txHash || null,
        error: null
      };
    } catch (error) {
      console.error('Chyba pri kontrole stavu platby:', error);
      return {
        isPaid: false,
        txHash: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  // Odoslanie práce
  const submitWork = async (orderId: string) => {
    setIsLoading(true);
    try {
      if (!isLoggedIn || !address) {
        throw new Error('Please connect your wallet');
      }
      console.log('Submitting work for order:', orderId);
      return 'work-submitted';
    } catch (error) {
      console.error('Work submission failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendPayment,
    sendEsdtPayment,
    releasePayment,
    claimPayment,
    disputePayment,
    resolveDispute,
    checkOrderPaymentStatus,
    checkWalletBalance,
    submitWork,
    isLoading
  };
};