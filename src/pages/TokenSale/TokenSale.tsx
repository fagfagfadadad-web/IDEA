import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, BarChart3, ArrowRight, Zap, Shield, Award, Coins, Clock, TrendingUp, Users, Target } from 'lucide-react';
import { Button, Card } from 'components';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useGetAccount, useGetNetworkConfig, Transaction, Address, SmartContract, ContractFunction } from 'lib';
import { signAndSendTransactions } from '../../helpers';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers';
import axios from 'axios';

// Configuration - Using the correct smart contract address
const saleContractAddress = 'erd1qqqqqqqqqqqqqpgqfhnxunkpfeghxn72a8fq73dst50xgjrjpmuq4f7t39';
const networkProvider = new ProxyNetworkProvider('https://gateway.multiversx.com');

// Phase 1 - Public Sale Phase 1 (starts at 0 as requested)
const PHASE_1_SUPPLY = 1000000; // 1 million IDA tokens for Phase 1
const PHASE_1_PRICE_EGLD = 0.0002; // Public Sale Phase 1 price
const PHASE_1_END = '2025-08-15T23:59:59+02:00';

// Phase 2 - Public Sale Phase 2
const PHASE_2_SUPPLY = 3780000; // 3.78 million IDA tokens for Phase 2
const PHASE_2_PRICE_EGLD = 0.0006; // Higher price for Phase 2
const PHASE_2_END = '2025-08-30T23:59:59+02:00';

const TOKEN_ID = 'IDA-f9bc1d';
const MINIMUM_PURCHASE_EGLD = 1; // Minimum purchase amount in EGLD
const LOGO_URL = 'https://i.postimg.cc/SQ6SC8H8/3359571c-471b-4fe3-a3bd-eabf94fbdd6b.png';

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

  if (isExpired) {
    return (
      <div className="text-center">
        <p className={`text-gray-600 ${isMobile ? 'text-base' : 'text-lg'} font-bold`}>
          Phase Ended
        </p>
      </div>
    );
  }

  return (
    <div className={`flex ${isMobile ? 'gap-2' : 'gap-4'} justify-center`}>
      <div className="text-center" style={{ width: isMobile ? '60px' : '88px' }}>
        <div
          className={`bg-gradient-to-b from-gray-700 to-gray-900 rounded-md shadow-inner ${
            isMobile ? 'h-8 leading-8 text-2xl' : 'h-12 leading-12 text-4xl'
          } font-bold text-white mb-1 flex items-center justify-center`}
        >
          {days}
        </div>
        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 uppercase font-medium`}>
          Days
        </p>
      </div>
      <div className="text-center" style={{ width: isMobile ? '60px' : '88px' }}>
        <div
          className={`bg-gradient-to-b from-gray-700 to-gray-900 rounded-md shadow由内 ${
            isMobile ? 'h-8 leading-8 text-2xl' : 'h-12 leading-12 text-4xl'
          } font-bold text-white mb-1 flex items-center justify-center`}
        >
          {hours}
        </div>
        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 uppercase font-medium`}>
          Hours
        </p>
      </div>
      <div className="text-center" style={{ width: isMobile ? '60px' : '88px' }}>
        <div
          className={`bg-gradient-to-b from-gray-700 to-gray-900 rounded-md shadow-inner ${
            isMobile ? 'h-8 leading-8 text-2xl' : 'h-12 leading-12 text-4xl'
          } font-bold text-white mb-1 flex items-center justify-center`}
        >
          {minutes}
        </div>
        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 uppercase font-medium`}>
          Mins
        </p>
      </div>
      <div className="text-center" style={{ width: isMobile ? '60px' : '88px' }}>
        <div
          className={`bg-gradient-to-b from-purple-700 to-purple-900 rounded-md shadow-inner ${
            isMobile ? 'h-8 leading-8 text-2xl' : 'h-12 leading-12 text-4xl'
          } font-bold text-white mb-1 flex items-center justify-center`}
        >
          {seconds}
        </div>
        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 uppercase font-medium`}>
          Secs
        </p>
      </div>
    </div>
  );
};

// Phase Card Component
const PhaseCard: React.FC<{
  phase: number;
  title: string;
  supply: number;
  price: number;
  sold: number;
  isActive: boolean;
  isCompleted: boolean;
  endDate: string;
  isMobile: boolean;
}> = ({ phase, title, supply, price, sold, isActive, isCompleted, endDate, isMobile }) => {
  const progress = (sold / supply) * 100;
  const remaining = supply - sold;

  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
      isActive 
        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-xl shadow-purple-500/20' 
        : isCompleted
        ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50'
        : 'border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50'
    }`}>
      {/* Phase Badge */}
      <div className="absolute top-4 right-4">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          isActive 
            ? 'bg-purple-600 text-white animate-pulse' 
            : isCompleted
            ? 'bg-green-600 text-white'
            : 'bg-gray-400 text-white'
        }`}>
          {isActive ? 'LIVE NOW' : isCompleted ? 'COMPLETED' : 'UPCOMING'}
        </span>
      </div>

      <div className={`p-${isMobile ? '6' : '8'} space-y-6`}>
        {/* Phase Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isActive 
                ? 'bg-purple-600 text-white' 
                : isCompleted
                ? 'bg-green-600 text-white'
                : 'bg-gray-400 text-white'
            }`}>
              <span className="text-xl font-bold">{phase}</span>
            </div>
            <div>
              <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-800`}>
                {title}
              </h3>
              <p className="text-gray-600 text-sm">
                Phase {phase} Token Sale
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-purple-600" />
              <span className="text-gray-600 text-sm font-medium">Total Supply</span>
            </div>
            <p className="text-gray-800 text-lg font-bold">
              {supply.toLocaleString()} IDA
            </p>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-green-600" />
              <span className="text-gray-600 text-sm font-medium">Price</span>
            </div>
            <p className="text-gray-800 text-lg font-bold">
              {price.toFixed(6)} EGLD
            </p>
            <p className="text-gray-500 text-xs">
              per IDA token
            </p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Sale Progress</span>
            <span className="text-gray-800 font-bold">{progress.toFixed(1)}%</span>
          </div>
          
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  isActive 
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500' 
                    : isCompleted
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gray-400'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-gray-600">
                Sold: {sold.toLocaleString()} IDA
              </span>
              <span className="text-gray-600">
                Remaining: {remaining.toLocaleString()} IDA
              </span>
            </div>
          </div>
        </div>

        {/* Countdown */}
        {isActive && (
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Clock size={16} className="text-purple-600" />
                <span className="text-gray-700 font-medium">Time Remaining</span>
              </div>
              <FlipCountdown targetDate={endDate} isMobile={isMobile} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Buy Form Component
const BuyForm: React.FC<{
  currentPhase: number;
  currentPrice: number;
  availableTokens: number;
  buyAmount: string;
  setBuyAmount: (value: string) => void;
  egldCost: number;
  pending: boolean;
  isLoggedIn: boolean;
  userAddress: string | undefined;
  handleBuy: () => void;
  transactionHash: string | null;
  isPurchaseSuccessful: boolean;
  isMobile: boolean;
  isPhaseActive: boolean;
  minimumPurchaseTokens: number;
  contractPrice: number;
  contractMinBuyLimit: number;
}> = ({
  currentPhase,
  currentPrice,
  availableTokens,
  buyAmount,
  setBuyAmount,
  egldCost,
  pending,
  isLoggedIn,
  userAddress,
  handleBuy,
  transactionHash,
  isPurchaseSuccessful,
  isMobile,
  isPhaseActive,
  minimumPurchaseTokens,
  contractPrice,
  contractMinBuyLimit,
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

  // Use contract price if available, otherwise use phase price
  const displayPrice = contractPrice > 0 ? contractPrice : currentPrice;
  const displayMinBuyLimit = contractMinBuyLimit > 0 ? contractMinBuyLimit : MINIMUM_PURCHASE_EGLD;
  const displayMinTokens = displayMinBuyLimit / displayPrice;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Coins size={20} />
          </div>
          <div>
            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold`}>
              Buy IDA Tokens
            </h3>
            <p className="text-purple-100 text-sm">
              Phase {currentPhase} - {displayPrice.toFixed(6)} EGLD per IDA
            </p>
          </div>
        </div>
        
        {!isPhaseActive && (
          <div className="bg-red-500/20 border border-red-300 rounded-lg p-3 mt-4">
            <p className="text-white text-sm font-medium">
              ⚠️ This phase is not currently active
            </p>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Amount Input */}
        <div className="space-y-3">
          <label className="block text-gray-800 font-medium">
            Amount to Purchase (IDA tokens)
          </label>
          <input
            type="number"
            placeholder={`Minimum: ${displayMinTokens.toLocaleString()} IDA`}
            value={buyAmount}
            onChange={(e) => setBuyAmount(e.target.value)}
            className="w-full p-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
            disabled={!isPhaseActive}
          />
          <p className="text-gray-600 text-sm">
            Minimum: {displayMinBuyLimit} EGLD ({displayMinTokens.toLocaleString()} IDA)
          </p>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-4 space-y-3">
          <h4 className="text-gray-800 font-bold">Purchase Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">You Pay:</span>
              <span className="text-gray-800 font-bold">
                {egldCost.toFixed(8)} EGLD
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">You Receive:</span>
              <span className="text-purple-600 font-bold">
                {Number(buyAmount || 0).toLocaleString()} IDA
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Price per IDA:</span>
              <span className="text-gray-800">
                {displayPrice.toFixed(6)} EGLD
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Available:</span>
              <span className="text-gray-800">
                {availableTokens.toLocaleString()} IDA
              </span>
            </div>
          </div>
        </div>

        {/* Buy Button */}
        <Button
          onClick={handleBuy}
          disabled={
            !isPhaseActive ||
            !buyAmount ||
            Number(buyAmount) < displayMinTokens ||
            pending ||
            availableTokens < displayMinTokens ||
            !isLoggedIn ||
            !isValidAddress(userAddress)
          }
          className={`w-full py-4 text-lg font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
            isPhaseActive && !pending
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 token-sale-button'
              : 'bg-gray-400 text-gray-600 cursor-not-allowed'
          }`}
        >
          {!isLoggedIn
            ? 'Connect Wallet to Buy'
            : !isPhaseActive
            ? 'Phase Not Active'
            : pending
            ? 'Processing...'
            : 'BUY IDA TOKENS'}
          {!pending && <ArrowRight size={20} />}
        </Button>

        {!isLoggedIn && (
          <p className="text-gray-600 text-sm text-center">
            Connect your MultiversX wallet to participate in the token sale
          </p>
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
  const [contractTokenPrice, setContractTokenPrice] = useState(0);
  const [contractMinBuyLimit, setContractMinBuyLimit] = useState(0);
  const [egldPriceUsd, setEgldPriceUsd] = useState(0);
  const [totalBoughtFromContract, setTotalBoughtFromContract] = useState(0);
  const [tokensAvailableInContract, setTokensAvailableInContract] = useState(0);
  const [egldCost, setEgldCost] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchaseSuccessful, setIsPurchaseSuccessful] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  
  const isMobile = window.innerWidth < 768;

  // Calculate phase data based on frontend logic
  const calculatePhaseData = () => {
    // For display purposes, Phase 1 starts at 0 (as requested)
    // We'll track phases separately from the contract's total
    const phase1Sold = 0; // Always start Phase 1 at 0 for display
    const phase2Sold = 0; // Phase 2 starts at 0 until Phase 1 is completed
    
    return { phase1Sold, phase2Sold };
  };

  const { phase1Sold, phase2Sold } = calculatePhaseData();

  // Determine current phase based on time and our frontend logic
  const now = new Date();
  const phase1End = new Date(PHASE_1_END);
  const phase2End = new Date(PHASE_2_END);
  
  const isPhase1Active = now < phase1End && phase1Sold < PHASE_1_SUPPLY;
  const isPhase1Completed = now >= phase1End || phase1Sold >= PHASE_1_SUPPLY;
  const isPhase2Active = isPhase1Completed && now < phase2End && phase2Sold < PHASE_2_SUPPLY;
  const isPhase2Completed = now >= phase2End || phase2Sold >= PHASE_2_SUPPLY;
  
  const currentPhase = isPhase1Active ? 1 : 2;
  const currentPrice = isPhase1Active ? PHASE_1_PRICE_EGLD : PHASE_2_PRICE_EGLD;
  const currentSupply = isPhase1Active ? PHASE_1_SUPPLY : PHASE_2_SUPPLY;
  const currentSold = isPhase1Active ? phase1Sold : phase2Sold;
  const currentAvailable = currentSupply - currentSold;
  const isCurrentPhaseActive = isPhase1Active || isPhase2Active;

  // Fetch EGLD price
  const fetchEgldPrice = async () => {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=elrond-erd-2&vs_currencies=usd'
      );
      const priceUsd = response.data['elrond-erd-2'].usd;
      setEgldPriceUsd(priceUsd);
    } catch (error) {
      console.error('Error fetching EGLD price:', error);
      setEgldPriceUsd(0);
    }
  };

  // Fetch sale data from smart contract using the provided ABI
  const fetchSaleData = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching data from LandboardIco contract:', saleContractAddress);

      const contract = new SmartContract({ address: new Address(saleContractAddress) });

      // Query token price using getTokenPrice from ABI
      try {
        const queryPrice = new ContractFunction('getTokenPrice');
        const priceResponse = await networkProvider.queryContract(
          contract,
          {
            func: queryPrice,
            args: [],
            caller: new Address(address || 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu'),
          }
        );

        if (priceResponse.firstResult) {
          const priceWei = priceResponse.firstResult.asBigUint.toString();
          const priceEgld = Number(priceWei) / 1e18;
          console.log('Contract token price:', priceEgld, 'EGLD');
          setContractTokenPrice(priceEgld);
        }
      } catch (error) {
        console.error('Error querying token price:', error);
        setContractTokenPrice(0);
      }

      // Query minimum buy limit using getMinBuyLimit from ABI
      try {
        const queryMinBuyLimit = new ContractFunction('getMinBuyLimit');
        const minBuyResponse = await networkProvider.queryContract(
          contract,
          {
            func: queryMinBuyLimit,
            args: [],
            caller: new Address(address || 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu'),
          }
        );

        if (minBuyResponse.firstResult) {
          const minBuyWei = minBuyResponse.firstResult.asBigUint.toString();
          const minBuyEgld = Number(minBuyWei) / 1e18;
          console.log('Contract minimum buy limit:', minBuyEgld, 'EGLD');
          setContractMinBuyLimit(minBuyEgld);
        }
      } catch (error) {
        console.error('Error querying minimum buy limit:', error);
        setContractMinBuyLimit(0);
      }

      // Query total bought amount using getTotalBoughtAmountOfEsdt from ABI
      try {
        const queryTotalBought = new ContractFunction('getTotalBoughtAmountOfEsdt');
        const totalBoughtResponse = await networkProvider.queryContract(
          contract,
          {
            func: queryTotalBought,
            args: [],
            caller: new Address(address || 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu'),
          }
        );

        if (totalBoughtResponse.firstResult) {
          const totalBoughtWei = totalBoughtResponse.firstResult.asBigUint.toString();
          const totalBoughtTokens = Number(totalBoughtWei) / 1e18;
          console.log('Total bought IDA tokens from contract:', totalBoughtTokens);
          setTotalBoughtFromContract(totalBoughtTokens);
        }
      } catch (error) {
        console.error('Error querying total bought amount:', error);
        setTotalBoughtFromContract(0);
      }

      // Query available tokens in contract
      try {
        const response = await axios.get(
          `https://api.multiversx.com/accounts/${saleContractAddress}/tokens/${TOKEN_ID}`,
          { timeout: 15000 }
        );
        
        if (response.data && response.data.balance) {
          const balanceWei = response.data.balance;
          const balanceTokens = Number(balanceWei) / 1e18;
          console.log('Available IDA tokens in contract:', balanceTokens);
          setTokensAvailableInContract(balanceTokens);
        }
      } catch (error) {
        console.error('Error fetching contract token balance:', error);
        setTokensAvailableInContract(0);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching sale data:', error);
      showErrorToast('Error loading sale data from smart contract');
      setIsLoading(false);
    }
  };

  // Calculate EGLD cost
  useEffect(() => {
    const idaAmount = Number(buyAmount);
    const priceToUse = contractTokenPrice > 0 ? contractTokenPrice : currentPrice;
    
    if (!isNaN(idaAmount) && idaAmount > 0 && priceToUse > 0) {
      const cost = idaAmount * priceToUse;
      setEgldCost(cost);
    } else {
      setEgldCost(0);
    }
  }, [buyAmount, contractTokenPrice, currentPrice]);

  // Handle token purchase
  const handleBuy = async () => {
    if (!isAuthenticated || !address) {
      showErrorToast('Please connect your MultiversX wallet to proceed.');
      return;
    }

    if (!isCurrentPhaseActive) {
      showErrorToast('No active token sale phase at the moment.');
      return;
    }

    const idaAmount = Number(buyAmount);
    const minTokens = contractMinBuyLimit > 0 ? contractMinBuyLimit / (contractTokenPrice > 0 ? contractTokenPrice : currentPrice) : MINIMUM_PURCHASE_EGLD / currentPrice;
    
    if (!buyAmount || isNaN(idaAmount) || idaAmount < minTokens) {
      const minEgld = contractMinBuyLimit > 0 ? contractMinBuyLimit : MINIMUM_PURCHASE_EGLD;
      showErrorToast(`Minimum purchase is ${minEgld} EGLD (${minTokens.toLocaleString()} IDA tokens).`);
      return;
    }

    if (idaAmount > currentAvailable) {
      showErrorToast(`Only ${currentAvailable.toLocaleString()} IDA tokens available in current phase.`);
      return;
    }

    try {
      setPending(true);
      setTransactionHash(null);
      setIsPurchaseSuccessful(false);

      const paymentAtomic = BigInt(Math.floor(egldCost * 1e18));
      
      const transaction = new Transaction({
        value: paymentAtomic,
        data: Buffer.from('buy'),
        receiver: new Address(saleContractAddress),
        gasLimit: BigInt(10000000),
        sender: new Address(address),
        chainID: network.chainId
      });

      console.log('Creating buy transaction:', {
        amount: egldCost,
        paymentAtomic: paymentAtomic.toString(),
        contractAddress: saleContractAddress,
        phase: currentPhase,
        price: contractTokenPrice > 0 ? contractTokenPrice : currentPrice
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

      setTransactionHash(sessionId);
      
      // Monitor transaction and update data
      setTimeout(async () => {
        try {
          // Check transaction status
          const response = await axios.get(`https://api.multiversx.com/transactions/${sessionId}`);
          if (response.data.status === 'success') {
            setIsPurchaseSuccessful(true);
            showSuccessToast(`Successfully purchased ${Number(buyAmount).toLocaleString()} IDA tokens!`);
            
            // Refresh sale data
            await fetchSaleData();
            
            setBuyAmount('');
            
            setTimeout(() => {
              setIsPurchaseSuccessful(false);
              setTransactionHash(null);
            }, 5000);
          }
        } catch (error) {
          console.error('Error checking transaction status:', error);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error during purchase:', error);
      showErrorToast(error instanceof Error ? error.message : 'Purchase failed');
    } finally {
      setPending(false);
    }
  };

  useEffect(() => {
    fetchEgldPrice();
    fetchSaleData();
    
    const interval = setInterval(() => {
      fetchEgldPrice();
      fetchSaleData();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-4">
              <img
                src={LOGO_URL}
                alt="IDA Logo"
                className="w-16 h-16 object-contain"
              />
              <div>
                <h1 className="text-4xl md:text-5xl font-bold gradient-text">
                  IDA Token Sale
                </h1>
                <p className="text-gray-600 text-lg">
                  Join the future of Web3 services marketplace
                </p>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp size={24} className="text-white" />
                  </div>
                  <p className="text-gray-600 text-sm font-medium">Total Raised</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {((phase1Sold * PHASE_1_PRICE_EGLD) + (phase2Sold * PHASE_2_PRICE_EGLD)).toFixed(2)} EGLD
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Coins size={24} className="text-white" />
                  </div>
                  <p className="text-gray-600 text-sm font-medium">Tokens Sold</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {(phase1Sold + phase2Sold).toLocaleString()}
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users size={24} className="text-white" />
                  </div>
                  <p className="text-gray-600 text-sm font-medium">Current Phase</p>
                  <p className="text-2xl font-bold text-gray-800">
                    Phase {currentPhase}
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <DollarSign size={24} className="text-white" />
                  </div>
                  <p className="text-gray-600 text-sm font-medium">EGLD Price</p>
                  <p className="text-2xl font-bold text-gray-800">
                    ${egldPriceUsd.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sale Phases */}
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Token Sale Phases</h2>
              <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                Our token sale is structured in two phases to provide early supporters with better pricing 
                while ensuring broad public access to IDA tokens.
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="space-y-4 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-700">Loading sale data from smart contract...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Phase 1 */}
                  <PhaseCard
                    phase={1}
                    title="Public Sale Phase 1"
                    supply={PHASE_1_SUPPLY}
                    price={PHASE_1_PRICE_EGLD}
                    sold={phase1Sold}
                    isActive={isPhase1Active}
                    isCompleted={isPhase1Completed}
                    endDate={PHASE_1_END}
                    isMobile={isMobile}
                  />

                  {/* Phase 2 */}
                  <PhaseCard
                    phase={2}
                    title="Public Sale Phase 2"
                    supply={PHASE_2_SUPPLY}
                    price={PHASE_2_PRICE_EGLD}
                    sold={phase2Sold}
                    isActive={isPhase2Active}
                    isCompleted={isPhase2Completed}
                    endDate={PHASE_2_END}
                    isMobile={isMobile}
                  />
                </div>
              )}
          </div>

          {/* Buy Form */}
          {!isLoading && (
            <div className="max-w-2xl mx-auto">
              <BuyForm
                currentPhase={currentPhase}
                currentPrice={currentPrice}
                availableTokens={Math.min(currentAvailable, tokensAvailableInContract)}
                buyAmount={buyAmount}
                setBuyAmount={setBuyAmount}
                egldCost={egldCost}
                pending={pending}
                isLoggedIn={isAuthenticated}
                userAddress={address}
                handleBuy={handleBuy}
                transactionHash={transactionHash}
                isPurchaseSuccessful={isPurchaseSuccessful}
                isMobile={isMobile}
                isPhaseActive={isCurrentPhaseActive}
                minimumPurchaseTokens={contractMinBuyLimit > 0 ? contractMinBuyLimit / (contractTokenPrice > 0 ? contractTokenPrice : currentPrice) : MINIMUM_PURCHASE_EGLD / currentPrice}
                contractPrice={contractTokenPrice}
                contractMinBuyLimit={contractMinBuyLimit}
              />
            </div>
          )}

          {/* Benefits Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">
              Why Choose IDA Tokens?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto">
                  <Zap size={24} className="text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-800">Zero Fees</h4>
                <p className="text-gray-600 text-sm">
                  Pay no platform fees when using IDA tokens for marketplace transactions.
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <Award size={24} className="text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-800">Premium Access</h4>
                <p className="text-gray-600 text-sm">
                  Access exclusive features and priority support with IDA token holdings.
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto">
                  <Shield size={24} className="text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-800">Governance</h4>
                <p className="text-gray-600 text-sm">
                  Participate in platform governance decisions based on your token holdings.
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto">
                  <DollarSign size={24} className="text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-800">Buyback & Burn</h4>
                <p className="text-gray-600 text-sm">
                  5% of EGLD fees used for token buybacks and burns to support long-term value.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">
              Frequently Asked Questions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-purple-600 mb-2">
                    How do I participate in the token sale?
                  </h4>
                  <p className="text-gray-700">
                    Connect your MultiversX wallet, select the amount of IDA tokens you want to purchase, 
                    and confirm the transaction. Minimum purchase is {contractMinBuyLimit > 0 ? contractMinBuyLimit : MINIMUM_PURCHASE_EGLD} EGLD.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-purple-600 mb-2">
                    When will I receive my tokens?
                  </h4>
                  <p className="text-gray-700">
                    IDA tokens are transferred to your wallet immediately after your purchase 
                    transaction is confirmed on the MultiversX blockchain.
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-purple-600 mb-2">
                    What's the difference between phases?
                  </h4>
                  <p className="text-gray-700">
                    Phase 1 offers lower pricing (0.0002 EGLD per IDA) with 1M tokens. 
                    Phase 2 has higher pricing (0.0006 EGLD per IDA) but larger allocation of 3.78M tokens.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-purple-600 mb-2">
                    Can I trade my IDA tokens?
                  </h4>
                  <p className="text-gray-700">
                    Yes, IDA tokens can be traded on supported MultiversX DEXes, 
                    transferred to other users, or used within the IDEA platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};