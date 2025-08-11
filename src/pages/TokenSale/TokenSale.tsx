import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, BarChart3, ArrowRight, ShieldCheck, Zap, Shield, Award, Coins } from 'lucide-react';
import { Button } from 'components';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useGetAccount, useGetNetworkConfig, Transaction, Address, SmartContract, ContractFunction } from 'lib';
import { signAndSendTransactions } from '../../helpers';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers';
import axios from 'axios';

// Configuration
const saleContractAddress = 'erd1qqqqqqqqqqqqqpgqfhnxunkpfeghxn72a8fq73dst50xgjrjpmuq4f7t39';
const networkProvider = new ProxyNetworkProvider('https://gateway.multiversx.com');
const TOTAL_PUBLIC_SALE_SUPPLY = 1000000; // 1 million IDA tokens for Public Sale
const TOKEN_ID = 'IDA-f9bc1d';
const TOKEN_PRICE_EGLD = 0.0002; // Price per IDA in EGLD (1 EGLD = 5000 IDA)
const MINIMUM_PURCHASE_EGLD = 1; // Minimum purchase amount in EGLD
const MINIMUM_PURCHASE_IDA = MINIMUM_PURCHASE_EGLD / TOKEN_PRICE_EGLD; // 5000 IDA
const LOGO_URL = 'https://i.postimg.cc/SQ6SC8H8/3359571c-471b-4fe3-a3bd-eabf94fbdd6b.png';
const PUBLIC_SALE_END = '2025-08-17T23:59:59+02:00'; // End of week (Sunday, August 17, 2025, 23:59:59 CEST)

// Utility function to shorten hash
const shortenHash = (hash: string, length: number = 8): string => {
  if (!hash || hash.length <= length * 2) return hash;
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
};

// Custom hook for countdown timer
const useCountdown = (targetDate: string) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const distance = target - now;

      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
};

// Flip Countdown Component
const FlipCountdown: React.FC<{ targetDate: string; isMobile: boolean }> = ({ targetDate, isMobile }) => {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  return (
    <div className={`flex ${isMobile ? 'gap-2' : 'gap-4'} justify-center`}>
      {isExpired ? (
        <p className={`text-gray-600 ${isMobile ? 'text-base' : 'text-lg'} font-bold`}>
          Public Sale Has Ended
        </p>
      ) : (
        <>
          <div className="text-center" style={{ width: isMobile ? '60px' : '88px' }}>
            <div
              className={`bg-gradient-to-b from-gray-700 to-gray-900 rounded-md shadow-inner ${
                isMobile ? 'h-8 leading-8 text-2xl' : 'h-10 leading-10 text-4xl'
              } font-bold text-white mb-1 flex items-center justify-center`}
            >
              {days}
            </div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 uppercase`}>
              Days
            </p>
          </div>
          <div className="text-center" style={{ width: isMobile ? '60px' : '88px' }}>
            <div
              className={`bg-gradient-to-b from-gray-700 to-gray-900 rounded-md shadow-inner ${
                isMobile ? 'h-8 leading-8 text-2xl' : 'h-10 leading-10 text-4xl'
              } font-bold text-white mb-1 flex items-center justify-center`}
            >
              {hours}
            </div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 uppercase`}>
              Hours
            </p>
          </div>
          <div className="text-center" style={{ width: isMobile ? '60px' : '88px' }}>
            <div
              className={`bg-gradient-to-b from-gray-700 to-gray-900 rounded-md shadow-inner ${
                isMobile ? 'h-8 leading-8 text-2xl' : 'h-10 leading-10 text-4xl'
              } font-bold text-white mb-1 flex items-center justify-center`}
            >
              {minutes}
            </div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 uppercase`}>
              Mins
            </p>
          </div>
          <div className="text-center" style={{ width: isMobile ? '60px' : '88px' }}>
            <div
              className={`bg-gradient-to-b from-purple-700 to-purple-900 rounded-md shadow-inner ${
                isMobile ? 'h-8 leading-8 text-2xl' : 'h-10 leading-10 text-4xl'
              } font-bold text-white mb-1 flex items-center justify-center`}
            >
              {seconds}
            </div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 uppercase`}>
              Secs
            </p>
          </div>
        </>
      )}
    </div>
  );
};

interface StatBoxProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  secondaryText: string;
  isMobile: boolean;
  children?: React.ReactNode;
}

const StatBox: React.FC<StatBoxProps> = ({ icon, title, value, secondaryText, isMobile, children }) => (
  <div
    className={`bg-white bg-opacity-10 ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-white border-opacity-20 
    hover:border-purple-500 hover:shadow-purple-500/20 ${isMobile ? 'hover:shadow-md' : 'hover:shadow-lg'} 
    transition-all duration-300 ease-in-out`}
  >
    <div className="flex items-center mb-4">
      {icon}
      <p className={`ml-2 ${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-800`}>
        {title}
      </p>
    </div>
    <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-purple-600`}>
      {value}
    </p>
    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
      {secondaryText}
    </p>
    {children && <div className="mt-2">{children}</div>}
  </div>
);

interface BuyFormProps {
  buyAmount: string;
  setBuyAmount: (value: string) => void;
  egldCost: number;
  tokenPriceEgld: number;
  pending: boolean;
  tokensAvailable: number;
  isLoggedIn: boolean;
  userAddress: string | undefined;
  handleBuy: () => void;
  transactionHash: string | null;
  isPurchaseSuccessful: boolean;
  isMobile: boolean;
  isPresaleStarted: boolean;
  isPresaleEnded: boolean;
}

const BuyForm: React.FC<BuyFormProps> = ({
  buyAmount,
  setBuyAmount,
  egldCost,
  tokenPriceEgld,
  pending,
  tokensAvailable,
  isLoggedIn,
  userAddress,
  handleBuy,
  transactionHash,
  isPurchaseSuccessful,
  isMobile,
  isPresaleStarted,
  isPresaleEnded,
}) => {
  const isValidAddress = (address?: string): boolean => {
    if (!address) return false;
    try {
      new Address(address);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div
      className={`bg-white bg-opacity-10 ${isMobile ? 'p-6' : 'p-8'} rounded-xl border border-white border-opacity-20 
      hover:border-purple-500 hover:shadow-purple-500/20 ${isMobile ? 'hover:shadow-md' : 'hover:shadow-lg'} 
      transition-all duration-300 ease-in-out h-full`}
    >
      <div className={`space-y-${isMobile ? '4' : '6'} flex flex-col`}>
        <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-800`}>
          Join IDA Token Public Sale
        </h3>
        <hr className="border-white border-opacity-20" />
        <div className={`space-y-${isMobile ? '3' : '4'} flex-1`}>
          <p className="text-gray-800 font-medium">
            Amount to Purchase (IDA tokens)
          </p>
          <input
            placeholder={`Enter at least ${MINIMUM_PURCHASE_EGLD} EGLD (${MINIMUM_PURCHASE_IDA} IDA)`}
            value={buyAmount}
            onChange={(e) => setBuyAmount(e.target.value)}
            type="number"
            className={`w-full ${isMobile ? 'p-3' : 'p-4'} bg-white bg-opacity-10 border border-white border-opacity-20 
            rounded-lg text-gray-800 placeholder-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 
            focus:ring-opacity-50 transition-all duration-200`}
            disabled={!isPresaleStarted || isPresaleEnded}
          />
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
            Minimum purchase: {MINIMUM_PURCHASE_EGLD} EGLD ({MINIMUM_PURCHASE_IDA} IDA tokens)
          </p>
          <div className={`bg-white bg-opacity-10 ${isMobile ? 'p-3' : 'p-4'} rounded-md`}>
            <div className={`space-y-${isMobile ? '2' : '3'}`}>
              <div className="flex justify-between">
                <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  You Pay:
                </p>
                <p className={`text-gray-800 font-bold ${isMobile ? 'text-sm' : 'text-base'}`}>
                  {egldCost.toFixed(8)} EGLD
                </p>
              </div>
              <div className="flex justify-between">
                <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  You Receive:
                </p>
                <p className={`text-purple-600 font-bold ${isMobile ? 'text-sm' : 'text-base'}`}>
                  {Number(buyAmount || 0).toLocaleString()} IDA
                </p>
              </div>
              <div className="flex justify-between">
                <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  Price per IDA:
                </p>
                <p className={`text-gray-800 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {tokenPriceEgld.toFixed(9)} EGLD
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={handleBuy}
            disabled={
              !isPresaleStarted ||
              isPresaleEnded ||
              !buyAmount ||
              Number(buyAmount) < MINIMUM_PURCHASE_IDA ||
              pending ||
              tokensAvailable < MINIMUM_PURCHASE_IDA ||
              !isLoggedIn ||
              !isValidAddress(userAddress)
            }
            className={`w-full ${isMobile ? 'py-3' : 'py-4'} ${isMobile ? 'text-sm' : 'text-base'} 
            bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold 
            disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 
            flex items-center justify-center gap-2 token-sale-button`}
          >
            {!isLoggedIn
              ? 'Connect Wallet to Join'
              : !isPresaleStarted
              ? 'Presale Not Started'
              : isPresaleEnded
              ? 'Presale Ended'
              : 'BUY IDA'}
            <ArrowRight size={isMobile ? 14 : 16} />
          </Button>
          {!isLoggedIn && (
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 text-center`}>
              You need to connect your MultiversX wallet to participate
            </p>
          )}
        </div>
        {pending && (
          <div
            className={`${isMobile ? 'mt-2' : 'mt-4'} ${isMobile ? 'p-3' : 'p-4'} 
            bg-white bg-opacity-10 rounded-md animate-fade-in`}
          >
            <div className="flex items-center gap-3">
              <div className={`animate-spin rounded-full ${isMobile ? 'h-4 w-4' : 'h-5 w-5'} border-b-2 border-purple-500`}></div>
              <p className={`text-gray-800 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {`Processing transaction${transactionHash ? `: ${shortenHash(transactionHash, 8)}` : '...'}`}
              </p>
            </div>
          </div>
        )}
        {isPurchaseSuccessful && (
          <div
            className={`${isMobile ? 'mt-2' : 'mt-4'} ${isMobile ? 'p-3' : 'p-4'} 
            bg-green-900 rounded-md animate-fade-in`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={isMobile ? 16 : 20} className="text-green-400" />
              <p className={`text-white font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                Purchase successful! Tokens will appear in your wallet shortly.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const TokenSale: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { address } = useGetAccount();
  const { network } = useGetNetworkConfig();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  
  const [buyAmount, setBuyAmount] = useState('');
  const [tokenPriceEgld, setTokenPriceEgld] = useState(TOKEN_PRICE_EGLD);
  const [egldPriceUsd, setEgldPriceUsd] = useState(0);
  const [tokensAvailable, setTokensAvailable] = useState(TOTAL_PUBLIC_SALE_SUPPLY);
  const [totalBoughtIda, setTotalBoughtIda] = useState(0);
  const [egldCost, setEgldCost] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchaseSuccessful, setIsPurchaseSuccessful] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isTransactionConfirmed, setIsTransactionConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  
  const isMobile = window.innerWidth < 768;

  // Countdown timers
  const presaleStart = '2025-08-10T08:00:00+02:00';
  const { days: startDays, hours: startHours, minutes: startMinutes, seconds: startSeconds, isExpired: isPresaleStarted } = useCountdown(presaleStart);
  const { days: endDays, hours: endHours, minutes: endMinutes, seconds: endSeconds, isExpired: isPresaleEnded } = useCountdown(PUBLIC_SALE_END);

  // Fetch EGLD price dynamically using CoinGecko API
  const fetchEgldPrice = async () => {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=elrond-erd-2&vs_currencies=usd'
      );
      const priceUsd = response.data['elrond-erd-2'].usd;
      setEgldPriceUsd(priceUsd);
      setTokenPriceEgld(TOKEN_PRICE_EGLD);
    } catch (error) {
      console.error('Error fetching EGLD price:', error);
      setTokenPriceEgld(TOKEN_PRICE_EGLD);
      setEgldPriceUsd(0);
      showErrorToast('Unable to fetch EGLD price. USD price display is disabled.');
    }
  };

  // Validate MultiversX address
  const isValidAddress = (address?: string): boolean => {
    if (!address) return false;
    try {
      new Address(address);
      return true;
    } catch {
      return false;
    }
  };

  // Fetch data from contract with retry logic
  const fetchSaleData = async (retries = 3, delay = 1000) => {
    if (!saleContractAddress) {
      console.error('Sale contract address is not defined!');
      setIsLoading(false);
      return;
    }

    console.log('Fetching data from contract:', saleContractAddress);
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const contract = new SmartContract({ address: new Address(saleContractAddress) });

        // Query token price
        const queryPrice = contract.createQuery({ func: new ContractFunction('getTokenPrice') });
        let tokenPriceValue = TOKEN_PRICE_EGLD;
        try {
          const priceResponse = await networkProvider.queryContract(queryPrice);
          console.log('Raw price response (getTokenPrice):', priceResponse.returnData);

          if (priceResponse.returnData && priceResponse.returnData.length > 0 && priceResponse.returnData[0]) {
            const priceBase64 = priceResponse.returnData[0];
            const priceHex = Buffer.from(priceBase64, 'base64').toString('hex');
            if (priceHex && priceHex !== '0x') {
              const priceWei = BigInt(`0x${priceHex}`).toString();
              tokenPriceValue = Number(priceWei) / 1e18;
              console.log('Price in base64:', priceBase64);
              console.log('Price in hex:', priceHex);
              console.log('Price in wei:', priceWei);
              console.log('Decoded token price (EGLD):', tokenPriceValue);

              if (tokenPriceValue !== TOKEN_PRICE_EGLD) {
                console.warn(`Price does not match expected value of ${TOKEN_PRICE_EGLD} EGLD, using expected value`);
                tokenPriceValue = TOKEN_PRICE_EGLD;
              }
            } else {
              console.warn('Invalid or empty price hex, using default price:', TOKEN_PRICE_EGLD);
            }
          } else {
            console.warn(`Token price not fetched, using default value ${TOKEN_PRICE_EGLD}`);
          }
        } catch (error) {
          console.error('Error querying getTokenPrice:', error);
          console.warn(`Falling back to default price ${TOKEN_PRICE_EGLD}`);
        }
        setTokenPriceEgld(tokenPriceValue);

        // Query total bought amount
        const queryTotalBought = contract.createQuery({ func: new ContractFunction('getTotalBoughtAmountOfEsdt') });
        let totalBoughtValue = 0;
        try {
          const totalBoughtResponse = await networkProvider.queryContract(queryTotalBought);
          console.log('Raw total bought response (getTotalBoughtAmountOfEsdt):', totalBoughtResponse.returnData);

          if (totalBoughtResponse.returnData && totalBoughtResponse.returnData.length > 0 && totalBoughtResponse.returnData[0]) {
            const totalBoughtBase64 = totalBoughtResponse.returnData[0];
            const totalBoughtHex = Buffer.from(totalBoughtBase64, 'base64').toString('hex');
            if (totalBoughtHex && totalBoughtHex !== '0x') {
              const totalBoughtWei = BigInt(`0x${totalBoughtHex}`).toString();
              totalBoughtValue = Number(totalBoughtWei) / 1e18;
              console.log('Total bought IDA in wei:', totalBoughtWei);
              console.log('Total bought IDA:', totalBoughtValue);
            } else {
              console.warn('Invalid or empty total bought hex, using default value 0');
            }
          } else {
            console.warn('Total bought amount not fetched, using default value 0');
          }
        } catch (error) {
          console.error('Error querying getTotalBoughtAmountOfEsdt:', error);
          console.warn('Falling back to default total bought value 0');
        }
        setTotalBoughtIda(totalBoughtValue);

        // Fetch token balance with retry
        const apiUrl = `https://api.multiversx.com/accounts/${saleContractAddress}/tokens/${TOKEN_ID}`;
        let balanceIda = TOTAL_PUBLIC_SALE_SUPPLY;
        try {
          const response = await axios.get(apiUrl, { timeout: 15000 });
          const balanceWei = BigInt(response.data.balance);
          balanceIda = Number(balanceWei) / 1e18;
          console.log('Balance (IDA wei):', balanceWei.toString());
          console.log('Balance (IDA):', balanceIda);
        } catch (error) {
          console.error(`Error fetching token balance for ${TOKEN_ID}:`, error);
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            console.warn(
              `Token ${TOKEN_ID} not found for contract ${saleContractAddress}. Verify token ID and network (mainnet vs. testnet). Using default balance ${TOTAL_PUBLIC_SALE_SUPPLY}`
            );
            showErrorToast(`Token ${TOKEN_ID} not found. Please verify the token ID and contract address.`);
          } else if (axios.isAxiosError(error) && error.response?.status === 429) {
            console.warn(`Rate limit hit for ${apiUrl}, retrying after ${delay}ms...`);
            if (attempt < retries) {
              await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt)));
              continue;
            }
          } else {
            console.warn('Falling back to default balance due to API error');
          }
        }
        setTokensAvailable(balanceIda);
        console.log('Tokens available for sale (IDA):', balanceIda);

        // Verify contract exists on mainnet
        try {
          await axios.get(`https://api.multiversx.com/accounts/${saleContractAddress}`);
          console.log('Contract address exists on mainnet');
        } catch (error) {
          console.error('Contract address verification failed:', error);
          showErrorToast(`Contract ${saleContractAddress} may not exist on mainnet. Please verify the address.`);
        }

        setIsLoading(false);
        return; // Success, exit retry loop
      } catch (error) {
        console.error(`Unexpected error in fetchSaleData (attempt ${attempt}/${retries}):`, error);
        if (attempt < retries) {
          console.log(`Retrying after ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt)));
        } else {
          console.error('Max retries reached, setting default values');
          setTokensAvailable(TOTAL_PUBLIC_SALE_SUPPLY);
          setTotalBoughtIda(0);
          setTokenPriceEgld(TOKEN_PRICE_EGLD);
          showErrorToast('Unable to fetch sale data. Displaying default values.');
          setIsLoading(false);
        }
      }
    }
  };

  // Calculate EGLD cost
  const calculateEgldCost = (amount: string) => {
    const idaAmount = Number(amount);
    if (!isNaN(idaAmount) && idaAmount >= MINIMUM_PURCHASE_IDA && tokenPriceEgld > 0) {
      const cost = idaAmount * tokenPriceEgld;
      setEgldCost(cost);
    } else {
      setEgldCost(0);
    }
  };

  useEffect(() => {
    calculateEgldCost(buyAmount);
  }, [buyAmount, tokenPriceEgld]);

  // Fetch latest transaction hash
  const fetchLatestTransactionHash = async (address: string): Promise<string | null> => {
    if (!isValidAddress(address)) {
      console.error('Invalid address provided to fetchLatestTransactionHash:', address);
      return null;
    }

    try {
      console.log('Fetching latest transaction for address:', address);
      const response = await axios.get(`https://api.multiversx.com/accounts/${address}/transactions?size=1`, { timeout: 15000 });
      const transaction = response.data[0];

      if (transaction?.txHash) {
        console.log('Found transaction:', {
          hash: transaction.txHash,
          timestamp: new Date(transaction.timestamp * 1000).toISOString(),
          receiver: transaction.receiver,
          function: transaction.function,
          data: transaction.data,
          decodedData: transaction.data ? Buffer.from(transaction.data, 'base64').toString('utf8') : null,
        });

        const timestamp = new Date(transaction.timestamp * 1000);
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        if (timestamp > fiveMinutesAgo && transaction.receiver === saleContractAddress && transaction.function === 'buy') {
          return transaction.txHash;
        } else {
          console.log('Ignoring transaction: does not match criteria (time, receiver, or function)', transaction.txHash);
          return null;
        }
      }
      console.log('No transactions found for address:', address);
      return null;
    } catch (error) {
      console.error('Error fetching latest transaction:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          console.log('Error 400 – check the address and API parameters:', address);
          showErrorToast('Failed to fetch transaction due to an invalid request. Check your wallet connection.');
        } else if (error.response?.status === 404) {
          console.log('Address has no transactions or does not exist:', address);
        } else if (error.response?.status === 429) {
          console.log('Rate limit hit, please try again later');
        }
      }
      return null;
    }
  };

  // Check transaction status
  const checkTransactionStatus = async (hash: string) => {
    try {
      if (!hash || hash.length !== 64 || !/^[0-9a-fA-F]+$/.test(hash)) {
        throw new Error('Invalid transaction hash format');
      }

      console.log('Checking transaction status for hash:', hash);
      const statusResponse = await axios.get(`https://api.multiversx.com/transactions/${hash}`, { timeout: 15000 });
      const status = statusResponse.data.status;
      console.log('Transaction status:', status, 'Details:', statusResponse.data);

      if (status === 'success') {
        setIsTransactionConfirmed(true);
        setIsPurchaseSuccessful(true);
        showSuccessToast(
          isMobile
            ? `Bought ${Number(buyAmount).toLocaleString()} IDA for ${egldCost.toFixed(8)} EGLD!`
            : `You've successfully purchased ${Number(buyAmount).toLocaleString()} IDA tokens for ${egldCost.toFixed(8)} EGLD.`
        );

        setTimeout(() => {
          setIsPurchaseSuccessful(false);
          setIsTransactionConfirmed(false);
          setTransactionHash(null);
          setBuyAmount('');
          fetchSaleData();
        }, 3000);
      } else if (status === 'pending' || status === 'executing') {
        console.log('Transaction still pending, retrying in 10 seconds...');
        setTimeout(() => checkTransactionStatus(hash), 10000);
      } else {
        throw new Error(`Transaction failed with status: ${status}`);
      }
    } catch (error) {
      console.error('Error checking transaction status:', error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log('Transaction not found yet, retrying in 10 seconds...');
        setTimeout(() => checkTransactionStatus(hash), 10000);
      } else {
        showErrorToast(error instanceof Error ? error.message : 'Unknown error occurred');
        setTransactionHash(null);
        setIsTransactionConfirmed(false);
      }
    }
  };

  // Handle token purchase
  const handleBuy = async () => {
    if (!isAuthenticated || !address || !isValidAddress(address)) {
      showErrorToast('Please connect your MultiversX wallet to proceed with the purchase.');
      return;
    }

    if (!isPresaleStarted) {
      showErrorToast('The IDA Token Public Sale has not yet started. Please wait until the countdown ends.');
      return;
    }

    if (isPresaleEnded) {
      showErrorToast('The IDA Token Public Sale has ended. No further purchases are possible.');
      return;
    }

    const idaAmount = Number(buyAmount);
    if (!buyAmount || isNaN(idaAmount) || idaAmount < MINIMUM_PURCHASE_IDA || idaAmount > tokensAvailable) {
      showErrorToast(`Minimum purchase is ${MINIMUM_PURCHASE_EGLD} EGLD (${MINIMUM_PURCHASE_IDA} IDA tokens). Available: ${tokensAvailable.toLocaleString()} IDA.`);
      return;
    }

    const paymentInEGLD = idaAmount * tokenPriceEgld;
    setTransactionHash(null);
    setIsPurchaseSuccessful(false);
    setIsTransactionConfirmed(false);
    setPending(true);

    let checkInterval: NodeJS.Timeout | null = null;
    let attempts = 0;
    const maxAttempts = 120;

    try {
      const paymentAtomic = BigInt(Math.floor(paymentInEGLD * 10 ** 18));
      
      const transaction = new Transaction({
        value: paymentAtomic,
        data: Buffer.from('buy'),
        receiver: new Address(saleContractAddress),
        gasLimit: BigInt(10000000),
        sender: new Address(address),
        chainID: network.chainId
      });

      console.log('Sending transaction:', {
        value: paymentAtomic.toString(),
        receiver: saleContractAddress,
        sender: address,
        data: 'buy'
      });

      showSuccessToast('Please confirm the transaction in your wallet.');

      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Processing IDA token purchase...',
          errorMessage: 'IDA token purchase failed',
          successMessage: 'IDA token purchase successful'
        }
      });

      console.log('Transaction sent, session ID:', sessionId);
      setTransactionHash(sessionId);
      
      // Check transaction status
      await checkTransactionStatus(sessionId);
      
    } catch (error) {
      console.error('Error during purchase:', error);
      showErrorToast(error instanceof Error ? error.message : 'Unknown error occurred');
      setTransactionHash(null);
      setIsTransactionConfirmed(false);
    } finally {
      setPending(false);
    }
  };

  useEffect(() => {
    console.log('TokenSale.tsx loaded');
    fetchEgldPrice();
    if (isPresaleStarted && !isPresaleEnded) {
      fetchSaleData();
    }
    const interval = setInterval(fetchEgldPrice, 60000);
    return () => clearInterval(interval);
  }, [isPresaleStarted, isPresaleEnded]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className={`container mx-auto ${isMobile ? 'max-w-sm' : 'max-w-7xl'} px-6 py-8`}>
        <div
          className={`bg-white rounded-xl overflow-hidden ${
            isMobile ? 'shadow-lg' : 'shadow-2xl'
          } animate-fade-in`}
        >
          <div
            className={`bg-gradient-to-r from-purple-500/20 to-indigo-500/20 ${
              isMobile ? 'p-4' : 'p-6'
            } border-b border-white border-opacity-20`}
          >
            <div className={`space-y-${isMobile ? '2' : '4'} text-center`}>
              <div className={`flex items-center justify-center ${isMobile ? 'gap-2' : 'gap-4'}`}>
                <img
                  src={LOGO_URL}
                  alt="IDA Logo"
                  className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} object-contain`}
                />
                <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-800`}>
                  IDA Token Public Sale
                </h1>
              </div>
              <div className="space-y-2">
                {isAuthenticated && address && (
                  <span className="inline-block bg-teal-100 text-teal-800 text-sm px-3 py-1 rounded-full">
                    {shortenHash(address, 8)}
                  </span>
                )}
                <div>
                  <span
                    className={`inline-block ${isMobile ? 'text-xs px-2' : 'text-sm px-3'} py-1 rounded-full 
                    bg-purple-600 text-white font-medium`}
                  >
                    {isPresaleEnded ? 'Public Sale Ended' : isPresaleStarted ? 'Public Sale Live' : 'Presale Starts Soon'}
                  </span>
                </div>
                {!isPresaleStarted ? (
                  <div className={`space-y-${isMobile ? '1' : '2'}`}>
                    <p className={`text-gray-800 ${isMobile ? 'text-base' : 'text-lg'} font-bold`}>
                      Presale Starts In:
                    </p>
                    <FlipCountdown targetDate={presaleStart} isMobile={isMobile} />
                  </div>
                ) : (
                  <div className={`space-y-${isMobile ? '1' : '2'}`}>
                    <p className={`text-gray-800 ${isMobile ? 'text-base' : 'text-lg'} font-bold`}>
                      Public Sale Ends In:
                    </p>
                    <FlipCountdown targetDate={PUBLIC_SALE_END} isMobile={isMobile} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {isLoading && isPresaleStarted && !isPresaleEnded ? (
            <div className={`flex justify-center items-center ${isMobile ? 'p-8' : 'p-12'}`}>
              <div className="space-y-4 text-center">
                <div className={`animate-spin rounded-full ${isMobile ? 'h-12 w-12' : 'h-16 w-16'} border-b-4 border-purple-500`}></div>
                <p className={`text-gray-800 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  Loading public sale data...
                </p>
              </div>
            </div>
          ) : isPresaleEnded ? (
            <div className={`flex justify-center items-center ${isMobile ? 'p-8' : 'p-12'}`}>
              <p className={`text-gray-800 ${isMobile ? 'text-base' : 'text-lg'} font-bold text-center`}>
                The IDA Token Public Sale has ended. Thank you for your participation!
              </p>
            </div>
          ) : (
            <div className={isMobile ? 'p-4' : 'p-6'}>
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} ${isMobile ? 'gap-4' : 'gap-6'}`}>
                <div>
                  <div className={`space-y-${isMobile ? '4' : '6'}`}>
                    <StatBox
                      icon={<DollarSign size={isMobile ? 16 : 20} className="text-purple-600" />}
                      title="Price per IDA"
                      value={`${tokenPriceEgld.toFixed(9)} EGLD`}
                      secondaryText={`${(1 / tokenPriceEgld).toLocaleString()} IDA per EGLD${egldPriceUsd ? ` (~$${egldPriceUsd.toFixed(2)}/EGLD, ~$${(tokenPriceEgld * egldPriceUsd).toFixed(6)}/IDA)` : ' (USD price unavailable)'}`}
                      isMobile={isMobile}
                    />
                    <StatBox
                      icon={<Coins size={isMobile ? 16 : 20} className="text-purple-600" />}
                      title="Available IDA"
                      value={`${tokensAvailable.toLocaleString()} IDA`}
                      secondaryText={`${((tokensAvailable / TOTAL_PUBLIC_SALE_SUPPLY) * 100).toFixed(2)}% of Public Sale allocation`}
                      isMobile={isMobile}
                    />
                    <StatBox
                      icon={<BarChart3 size={isMobile ? 16 : 20} className="text-purple-600" />}
                      title="Public Sale Progress"
                      value={`${((totalBoughtIda / TOTAL_PUBLIC_SALE_SUPPLY) * 100).toFixed(2)}% sold`}
                      secondaryText={`${totalBoughtIda.toLocaleString()} / ${TOTAL_PUBLIC_SALE_SUPPLY.toLocaleString()}`}
                      isMobile={isMobile}
                    >
                      <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mt-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(totalBoughtIda / TOTAL_PUBLIC_SALE_SUPPLY) * 100}%` }}
                        ></div>
                      </div>
                    </StatBox>
                  </div>
                </div>

                <div>
                  <BuyForm
                    buyAmount={buyAmount}
                    setBuyAmount={setBuyAmount}
                    egldCost={egldCost}
                    tokenPriceEgld={tokenPriceEgld}
                    pending={pending}
                    tokensAvailable={tokensAvailable}
                    isLoggedIn={isAuthenticated}
                    userAddress={address}
                    handleBuy={handleBuy}
                    transactionHash={transactionHash}
                    isPurchaseSuccessful={isPurchaseSuccessful}
                    isMobile={isMobile}
                    isPresaleStarted={isPresaleStarted}
                    isPresaleEnded={isPresaleEnded}
                  />
                </div>
              </div>

              <div
                className={`${isMobile ? 'mt-6' : 'mt-8'} ${isMobile ? 'p-4' : 'p-6'} 
                bg-white bg-opacity-10 rounded-xl border border-white border-opacity-20`}
              >
                <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-800 mb-4`}>
                  Benefits of IDA Tokens
                </h3>
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} ${isMobile ? 'gap-4' : 'gap-6'}`}>
                  <div className={`${isMobile ? 'p-3' : 'p-4'} bg-white bg-opacity-10 rounded-lg`}>
                    <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'} ${isMobile ? 'mb-2' : 'mb-3'}`}>
                      <Zap size={isMobile ? 16 : 20} className="text-purple-600" />
                      <h4 className="text-sm font-bold text-purple-600">
                        Zero Platform Fees
                      </h4>
                    </div>
                    <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Pay no platform fees when using IDA tokens for transactions on the marketplace.
                    </p>
                  </div>
                  <div className={`${isMobile ? 'p-3' : 'p-4'} bg-white bg-opacity-10 rounded-lg`}>
                    <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'} ${isMobile ? 'mb-2' : 'mb-3'}`}>
                      <Award size={isMobile ? 16 : 20} className="text-purple-600" />
                      <h4 className="text-sm font-bold text-purple-600">
                        Exclusive Features
                      </h4>
                    </div>
                    <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Access premium features and priority support with IDA token holdings.
                    </p>
                  </div>
                  <div className={`${isMobile ? 'p-3' : 'p-4'} bg-white bg-opacity-10 rounded-lg`}>
                    <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'} ${isMobile ? 'mb-2' : 'mb-3'}`}>
                      <Shield size={isMobile ? 16 : 20} className="text-purple-600" />
                      <h4 className="text-sm font-bold text-purple-600">
                        Governance Rights
                      </h4>
                    </div>
                    <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Participate in platform governance decisions based on your token holdings.
                    </p>
                  </div>
                  <div className={`${isMobile ? 'p-3' : 'p-4'} bg-white bg-opacity-10 rounded-lg`}>
                    <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'} ${isMobile ? 'mb-2' : 'mb-3'}`}>
                      <DollarSign size={isMobile ? 16 : 20} className="text-purple-600" />
                      <h4 className="text-sm font-bold text-purple-600">
                        Buy-back and Burn (5%)
                      </h4>
                    </div>
                    <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      5% of EGLD fees are used to buy back IDA tokens from the market, which are then burned to reduce total supply and support long-term value.
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`${isMobile ? 'mt-6' : 'mt-8'} ${isMobile ? 'p-4' : 'p-6'} 
                bg-white bg-opacity-10 rounded-xl border border-white border-opacity-20`}
              >
                <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-800 mb-4`}>
                  Frequently Asked Questions
                </h3>
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} ${isMobile ? 'gap-4' : 'gap-6'}`}>
                  <div>
                    <h4 className="text-sm font-bold text-purple-600 mb-2">
                      How do I participate in the Public Sale?
                    </h4>
                    <p className={`text-gray-600 ${isMobile ? 'mb-2' : 'mb-4'} ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Connect your MultiversX wallet, enter at least {MINIMUM_PURCHASE_EGLD} EGLD ({MINIMUM_PURCHASE_IDA} IDA tokens), and confirm the transaction.
                    </p>
                    <h4 className="text-sm font-bold text-purple-600 mb-2">
                      When will I receive my tokens?
                    </h4>
                    <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      IDA tokens are transferred to your wallet immediately after your purchase transaction is confirmed.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-purple-600 mb-2">
                      Is there a minimum purchase amount?
                    </h4>
                    <p className={`text-gray-600 ${isMobile ? 'mb-2' : 'mb-4'} ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Yes, the minimum purchase amount is {MINIMUM_PURCHASE_EGLD} EGLD ({MINIMUM_PURCHASE_IDA} IDA tokens).
                    </p>
                    <h4 className="text-sm font-bold text-purple-600 mb-2">
                      Can I sell my IDA tokens?
                    </h4>
                    <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Yes, IDA tokens can be traded on supported MultiversX DEXes or transferred to other users.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Add bottom padding for mobile navigation */}
        <div className="h-20 md:h-0"></div>
      </div>
    </div>
  );
};