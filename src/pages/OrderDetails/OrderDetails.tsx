import { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Transaction, TransactionManager } from 'lib';
import { supabase } from 'lib/supabase'; // Predpokladám, že máte Supabase klienta
import {
  isValidAddress,
  addressToHex,
  uuidToHex,
  getDeadlineTimestamp
} from 'utils'; // Predpokladané pomocné funkcie

// Konštanty
const ESCROW_ADDRESS = 'erd1qqqqqqqqqqqqqpgqvesht6c8ard8zzj5n02fmfae0kuy2z4vpmuqw5q9v0';
const network = { chainId: '1' }; // Mainnet: '1', Devnet: 'D'

interface Order {
  id: string;
  gig_id: string;
  client_id: string;
  status: string;
  amount: number;
  created_at: string;
  requirements: { timestamp: string; description: string };
  deadline: string | null;
  status_updated_at: string;
  transaction_hash: string | null;
  payment_status: string;
  release_at: string | null;
  work_status: string;
  client_address: string;
  provider_address: string | null;
  payment_token: string;
  gig?: {
    id: string;
    title: string;
    users?: { wallet_address: string };
  };
  client?: { email: string | null; username: string };
}

interface OrderDetailsProps {
  order: Order;
  address: string; // Adresa prihláseného používateľa
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order, address }) => {
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [providerAddressError, setProviderAddressError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Funkcia na načítanie adresy poskytovateľa z databázy
  const fetchProviderAddress = async (gigId: string): Promise<string> => {
    const { data, error } = await supabase
      .from('gigs')
      .select('users(wallet_address)')
      .eq('id', gigId)
      .single();
    if (error) {
      console.error('Error fetching provider address:', error);
      throw new Error(`Nepodarilo sa načítať adresu poskytovateľa: ${error.message}`);
    }
    return data?.users?.wallet_address;
  };

  // Funkcia na kontrolu zostatku peňaženky
  const checkWalletBalance = async (walletAddress: string, requiredAmount: number, tokenId: string) => {
    try {
      console.log('🔍 Kontrola zostatku peňaženky:', { walletAddress, requiredAmount, tokenId });
      const response = await axios.get(
        `https://api.multiversx.com/accounts/${walletAddress}/tokens/${tokenId}`,
        { timeout: 10000 }
      );
      const balance = parseFloat(response.data.balance) / 1e18;
      const required = requiredAmount * 1.1111; // Zahŕňa 10% poplatok
      console.log('💰 Výsledok EGLD zostatku:', { raw: response.data.balance, formatted: balance });
      return {
        address: walletAddress,
        tokenId,
        balance,
        required,
        hasEnoughFunds: balance >= required
      };
    } catch (error) {
      console.error('Error checking wallet balance:', error);
      throw new Error('Nepodarilo sa skontrolovať zostatok peňaženky');
    }
  };

  // Funkcia na monitorovanie stavu transakcie pomocou sessionId
  const monitorTransactionStatus = async (sessionId: string, maxAttempts = 20) => {
    console.log('Starting transaction monitoring for sessionId:', sessionId);
    const txManager = TransactionManager.getInstance();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Monitoring attempt ${attempt}/${maxAttempts} for sessionId:`, sessionId);
        // Predpokladáme, že TransactionManager má metódu getTransactionStatus
        const txStatus = await txManager.getTransactionStatus(sessionId);
        console.log('Transaction status response:', JSON.stringify(txStatus, null, 2));

        if (txStatus.status === 'success' || txStatus.status === 'executed') {
          console.log('Transaction confirmed as successful:', sessionId);
          return {
            success: true,
            data: txStatus,
            transactionHash: txStatus.hash || txStatus.transactionHash || null // Ak je hash dostupný
          };
        } else if (['fail', 'invalid', 'not_executed'].includes(txStatus.status)) {
          console.error('Transaction failed:', sessionId, txStatus.status);
          return { success: false, error: `Transakcia zlyhala so stavom: ${txStatus.status}` };
        } else {
          console.log(`Transakcia stále ${txStatus.status}, čaká sa...`);
          await new Promise((resolve) => setTimeout(resolve, 6000));
          continue;
        }
      } catch (error) {
        console.log(`Pokus ${attempt} zlyhal:`, error instanceof Error ? error.message : error);
        if (attempt === maxAttempts) {
          throw new Error(`Monitorovanie transakcie zlyhalo po ${maxAttempts} pokusoch`);
        }
        await new Promise((resolve) => setTimeout(resolve, 6000));
      }
    }
    throw new Error('Časový limit monitorovania transakcie');
  };

  // Funkcia na spracovanie platby
  const handlePayment = async () => {
    console.log('Payment button clicked!', { address, order });
    if (!address || !order) {
      toast.error('Prosím, pripojte svoju peňaženku');
      return;
    }

    const paymentToken = order.payment_token || 'EGLD';
    try {
      setIsPaymentLoading(true);
      console.log('Creating transaction...', { orderData: JSON.stringify(order, null, 2) });

      let providerAddress = order.provider_address || order.gig?.users?.wallet_address;
      if (!isValidAddress(providerAddress) && order.gig_id) {
        console.log('Provider address not found in order, fetching from database...', { gigId: order.gig_id });
        providerAddress = await fetchProviderAddress(order.gig_id);
        if (!providerAddress || !isValidAddress(providerAddress)) {
          throw new Error('Nepodarilo sa načítať platnú adresu poskytovateľa z databázy. Skontrolujte údaje gig-u.');
        }
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

      const balanceCheck = await checkWalletBalance(address, order.amount, paymentToken);
      console.log('🏁 Výsledok kontroly zostatku:', balanceCheck);
      if (!balanceCheck.hasEnoughFunds) {
        throw new Error(
          `Nedostatok prostriedkov. Potrebujete aspoň ${balanceCheck.required.toFixed(4)} ${paymentToken} (vrátane 10% poplatku pre EGLD), ale máte iba ${balanceCheck.balance.toFixed(4)} ${paymentToken}.`
        );
      }

      const hexOrderId = uuidToHex(order.id);
      console.log('UUID conversion:', { original: order.id, clean: hexOrderId, hex: hexOrderId });
      const providerAddressHex = addressToHex(providerAddress);
      const deadline = getDeadlineTimestamp();
      const deadlineHex = deadline.toString(16).padStart(16, '0');
      console.log('Vygenerovaný deadline:', { currentTime: Math.floor(Date.now() / 1000), deadline });

      let transaction;
      if (paymentToken === 'EGLD') {
        const amount = BigInt(Math.round(order.amount * 1e18 * 1.1111)); // Zahŕňa 10% poplatok
        const data = `deposit@${hexOrderId}@${providerAddressHex}@${deadlineHex}`;
        transaction = new Transaction({
          value: amount,
          data: Buffer.from(data),
          receiver: new Address(ESCROW_ADDRESS),
          gasLimit: BigInt(20000000),
          sender: new Address(address),
          chainID: network.chainId
        });
        console.log('Vytváranie EGLD transakcie:', {
          orderId: order.id,
          hexOrderId,
          providerAddress,
          providerAddressHex,
          deadline,
          deadlineHex,
          amount: amount.toString(),
          data,
          escrowAddress: ESCROW_ADDRESS
        });
        toast.info('10% poplatok bude odpočítaný z EGLD platby.');
      } else {
        const value = BigInt(Math.round(order.amount * 1e18));
        const tokenIdHex = Buffer.from(paymentToken, 'utf8').toString('hex');
        const amountHex = value.toString(16).padStart(2, '0');
        const data = `ESDTTransfer@${tokenIdHex}@${amountHex}@depositEsdt@${hexOrderId}@${providerAddressHex}@${deadlineHex}`;
        transaction = new Transaction({
          value: BigInt(0),
          data: Buffer.from(data),
          receiver: new Address(ESCROW_ADDRESS),
          gasLimit: BigInt(20000000),
          sender: new Address(address),
          chainID: network.chainId
        });
        console.log('Vytváranie ESDT transakcie:', {
          orderId: order.id,
          hexOrderId,
          providerAddress,
          providerAddressHex,
          deadline,
          deadlineHex,
          tokenId: paymentToken,
          tokenIdHex,
          amountHex,
          data,
          escrowAddress: ESCROW_ADDRESS
        });
      }

      toast.info(`Spracováva sa ${paymentToken} platba, potvrďte v peňaženke...`);
      console.log('Calling signAndSendTransactions...');
      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: `Spracováva sa ${paymentToken} platba...`,
          errorMessage: `${paymentToken} platba zlyhala`,
          successMessage: `${paymentToken} platba úspešná`
        }
      });

      console.log(`${paymentToken} platba odoslaná, session ID:`, sessionId);

      const verification = await monitorTransactionStatus(sessionId);
      if (!verification.success) {
        throw new Error(verification.error || 'Transakcia zlyhala pri overovaní');
      }

      // Uložiť hash transakcie, ak je dostupný
      const transactionHash = verification.transactionHash || null;
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'escrowed',
          status: 'in_progress',
          status_updated_at: new Date().toISOString(),
          provider_address: providerAddress,
          transaction_hash: transactionHash // Uložiť hash, ak je k dispozícii
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('Error updating order:', updateError);
        throw new Error(`Aktualizácia databázy zlyhala: ${updateError.message}`);
      }

      console.log('Platba úspešná a databáza aktualizovaná');
      toast.success(`${paymentToken} platba úspešná! Objednávka je teraz v priebehu.`);
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
          : `${paymentToken} platba zlyhala: ${error.message}`
        : `${paymentToken} platba zlyhala: Neznáma chyba`;
      toast.error(errorMessage);
      setProviderAddressError(errorMessage);
    } finally {
      setIsPaymentLoading(false);
    }
  };

  return (
    <div>
      <h2>Detaily objednávky</h2>
      <p>ID objednávky: {order.id}</p>
      <p>Stav: {order.status}</p>
      <p>Suma: {order.amount} {order.payment_token || 'EGLD'}</p>
      <p>Stav platby: {order.payment_status}</p>
      <p>Adresa klienta: {order.client_address}</p>
      {order.provider_address && <p>Adresa poskytovateľa: {order.provider_address}</p>}
      {order.gig && <p>Názov gig-u: {order.gig.title}</p>}
      {order.transaction_hash && <p>Hash transakcie: {order.transaction_hash}</p>}
      {providerAddressError && <p style={{ color: 'red' }}>Chyba: {providerAddressError}</p>}
      
      <button
        onClick={() => setShowPaymentModal(true)}
        disabled={isPaymentLoading || order.payment_status !== 'pending'}
      >
        {isPaymentLoading ? 'Spracováva sa...' : 'Zaplatiť teraz'}
      </button>

      {showPaymentModal && (
        <div className="modal">
          <h3>Potvrdenie platby</h3>
          <p>Suma: {order.amount} {order.payment_token || 'EGLD'}</p>
          <button onClick={handlePayment} disabled={isPaymentLoading}>
            {isPaymentLoading ? 'Spracováva sa...' : 'Potvrdiť platbu'}
          </button>
          <button onClick={() => setShowPaymentModal(false)}>Zrušiť</button>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;