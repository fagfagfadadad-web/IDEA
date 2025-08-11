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

// Configuration
const saleContractAddress = 'erd1qqqqqqqqqqqqqpgqfhnxunkpfeghxn72a8fq73dst50xgjrjpmuq4f7t39';
const networkProvider = new ProxyNetworkProvider('https://gateway.multiversx.com'); // Používame mainnet API
const TOKEN_ID = 'IDA-f9bc1d';
const PHASE_1_SUPPLY = 1000000; // 1M IDA pre fázu 1
const PHASE_1_PRICE_EGLD = 0.0002; // 0.0002 EGLD za IDA (5000 IDA za 1 EGLD)
const PHASE_1_END = '2025-08-15T23:59:59+02:00'; // Example end date, adjust as needed
const PHASE_2_SUPPLY = 4000000; // 4M IDA pre fázu 2
const PHASE_2_PRICE_EGLD = 0.0006; // 0.0006 EGLD za IDA
const PHASE_2_END = '2025-08-30T23:59:59+02:00';
const MINIMUM_PURCHASE_EGLD = 1; // Fixná minimálna kúpna suma - 1 EGLD = 5000 IDA
const MINIMUM_PURCHASE_IDA = 5000; // 5000 IDA za 1 EGLD
const LOGO_URL = 'https://i.postimg.cc/SQ6SC8H8/3359571c-471b-4fe3-a3bd-eabf94fbdd6b.png';

// Realistic data - 5M tokens have been sold (sale is complete)
const REALISTIC_TOTAL_SOLD = 5000000; // 5M IDA tokens sold
const REALISTIC_TOKENS_AVAILABLE = 0; // No tokens left in contract
const SALE_IS_COMPLETE = true; // Sale has ended

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
        <p className={`text-purple-300 ${isMobile ? 'text-lg' : 'text-xl'} font-bold`}>
          Phase Ended
        </p>
      </div>
    );
  }

  return (
    <div className={`flex ${isMobile ? 'gap-2' : 'gap-4'} justify-center`}>
      <div className="text-center" style={{ width: isMobile ? '60px' : '88px' }}>
        <div
          className={`bg-gradient-to-b from-purple-600 to-purple-800 rounded-xl shadow-2xl border border-purple-400/30 ${
            isMobile ? 'h-12 leading-12 text-2xl' : 'h-16 leading-16 text-4xl'
          } font-bold text-white mb-1 flex items-center justify-center`}
        >
          {days}
        </div>
        <p className={`${isMobile ? 'text-sm' : 'text-base'} text-purple-200 uppercase font-bold tracking-wide`}>
          Days
        </p>
      </div>
      <div className="text-center" style={{ width: isMobile ? '60px' : '88px' }}>
        <div
          className={`bg-gradient-to-b from-purple-600 to-purple-800 rounded-xl shadow-2xl border border-purple-400/30 ${
            isMobile ? 'h-12 leading-12 text-2xl' : 'h-16 leading-16 text-4xl'
          } font-bold text-white mb-1 flex items-center justify-center`}
        >
          {hours}
        </div>
        <p className={`${isMobile ? 'text-sm' : 'text-base'} text-purple-200 uppercase font-bold tracking-wide`}>
          Hours
        </p>
      </div>
      <div className="text-center" style={{ width: isMobile ? '60px' : '88px' }}>
        <div
          className={`bg-gradient-to-b from-purple-600 to-purple-800 rounded-xl shadow-2xl border border-purple-400/30 ${
            isMobile ? 'h-12 leading-12 text-2xl' : 'h-16 leading-16 text-4xl'
          } font-bold text-white mb-1 flex items-center justify-center`}
        >
          {minutes}
        </div>
        <p className={`${isMobile ? 'text-sm' : 'text-base'} text-purple-200 uppercase font-bold tracking-wide`}>
          Mins
        </p>
      </div>
      <div className="text-center" style={{ width: isMobile ? '60px' : '88px' }}>
        <div
          className={`bg-gradient-to-b from-indigo-600 to-indigo-800 rounded-xl shadow-2xl border border-indigo-400/30 ${
            isMobile ? 'h-12 leading-12 text-2xl' : 'h-16 leading-16 text-4xl'
          } font-bold text-white mb-1 flex items-center justify-center`}
        >
          {seconds}
        </div>
        <p className={`${isMobile ? 'text-sm' : 'text-base'} text-purple-200 uppercase font-bold tracking-wide`}>
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
    <div className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-500 transform hover:scale-105 ${
      isActive 
        ? 'border-purple-400 bg-gradient-to-br from-purple-900/50 to-indigo-900/50 shadow-2xl shadow-purple-500/30 backdrop-blur-lg' 
        : isCompleted
        ? 'border-green-400 bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-lg'
        : 'border-gray-400 bg-gradient-to-br from-gray-800/30 to-slate-800/30 backdrop-blur-lg'
    }`}>
      <div className="absolute top-6 right-6">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          isActive 
            ? 'bg-purple-500 text-white animate-pulse shadow-lg' 
            : isCompleted
            ? 'bg-green-500 text-white shadow-lg'
            : 'bg-gray-500 text-white shadow-lg'
        }`}>
          {isActive ? 'LIVE NOW' : isCompleted ? 'COMPLETED' : 'UPCOMING'}
        </span>
      </div>

      <div className={`p-${isMobile ? '8' : '10'} space-y-8`}>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
              isActive 
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' 
                : isCompleted
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'
            }`}>
              <span className="text-2xl font-bold">{phase}</span>
            </div>
            <div>
              <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white`}>
                {title}
              </h3>
              <p className="text-gray-800 text-base">
                Phase {phase} Token Sale
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-900 backdrop-blur-sm rounded-xl p-6 border border-gray-600 hover:bg-gray-800 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Target size={18} className="text-purple-300" />
              <span className="text-purple-300 text-sm font-medium uppercase tracking-wide">Total Supply</span>
            </div>
            <p className="text-white text-xl font-bold">
              {supply.toLocaleString()} IDA
            </p>
          </div>
          
          <div className="bg-gray-900 backdrop-blur-sm rounded-xl p-6 border border-gray-600 hover:bg-gray-800 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={18} className="text-green-300" />
              <span className="text-purple-300 text-sm font-medium uppercase tracking-wide">Price</span>
            </div>
            <p className="text-white text-xl font-bold">
              {price.toFixed(6)} EGLD
            </p>
            <p className="text-purple-300 text-sm">
              per IDA token
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-white font-semibold text-lg">Sale Progress</span>
            <span className="text-white font-bold text-xl">{progress.toFixed(1)}%</span>
          </div>
          
          <div className="relative">
            <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden shadow-inner">
              <div 
                className={`h-full transition-all duration-1000 ${
                  isActive 
                    ? 'bg-gradient-to-r from-purple-400 to-indigo-400 shadow-lg' 
                    : isCompleted
                    ? 'bg-gradient-to-r from-green-400 to-emerald-400 shadow-lg'
                    : 'bg-gradient-to-r from-gray-400 to-slate-400'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-3 text-sm">
              <span className="text-purple-300 font-medium">
                Sold: {sold.toLocaleString()} IDA
              </span>
              <span className="text-purple-300 font-medium">
                Remaining: {remaining.toLocaleString()} IDA
              </span>
            </div>
          </div>
        </div>

        {isActive && (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Clock size={20} className="text-purple-300" />
                <span className="text-white font-semibold text-lg">Time Remaining</span>
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

  // Používame fixnú minimálnu kúpnu sumu 1 EGLD (5000 IDA pri cene 0,0002 EGLD vo fáze 1)
  const displayMinTokens = currentPhase === 1 ? 5000 : MINIMUM_PURCHASE_EGLD / currentPrice;

  return (
    <div className="bg-gray-900/30 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-700/30 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shadow-lg">
            <Coins size={24} />
          </div>
          <div>
            <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>
              Buy IDA Tokens
            </h3>
            <p className="text-purple-100 text-base">
              Phase {phase} Token Sale
            </p>
          </div>
        </div>
        
        {!isPhaseActive && (
          <div className="bg-red-500/30 border border-red-300 rounded-xl p-4 mt-4">
            <p className="text-white text-base font-medium">
              ⚠️ This phase is not currently active
            </p>
          </div>
        )}
      </div>

      <div className="p-8 space-y-8">
        <div className="space-y-3">
          <label className="block text-white font-semibold text-lg">
            Amount to Purchase (IDA tokens)
          </label>
          <input
            type="number"
            placeholder={`Minimum: ${MINIMUM_PURCHASE_IDA.toLocaleString()} IDA (1 EGLD)`}
            value={buyAmount}
            onChange={(e) => setBuyAmount(e.target.value)}
            className="w-full p-4 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-300 text-lg font-medium"
            disabled={!isPhaseActive}
          />
          <p className="text-gray-300 text-base">
            Minimum: {MINIMUM_PURCHASE_EGLD} EGLD ({MINIMUM_PURCHASE_IDA.toLocaleString()} IDA)
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 space-y-4 border border-gray-600">
          <h4 className="text-white font-bold text-lg">Purchase Summary</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400 font-medium">You Pay:</span>
              <span className="text-white font-bold text-lg">
                {egldCost.toFixed(8)} EGLD
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-medium">You Receive:</span>
              <span className="text-purple-600 font-bold text-lg">
                {Number(buyAmount || 0).toLocaleString()} IDA
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-medium">Price per IDA:</span>
              <span className="text-white">
                {currentPrice.toFixed(6)} EGLD
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-medium">Available:</span>
              <span className="text-white font-semibold">
                {availableTokens.toLocaleString()} IDA
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleBuy}
          disabled={
            !isPhaseActive ||
            !buyAmount ||
            Number(buyAmount) < MINIMUM_PURCHASE_IDA ||
            pending ||
            availableTokens < MINIMUM_PURCHASE_IDA ||
            !isLoggedIn ||
            !isValidAddress(userAddress)
          }
          className={`w-full py-5 text-xl font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 ${
            isPhaseActive && !pending && isLoggedIn
              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transform'
              : 'bg-gray-600 text-gray-300 cursor-not-allowed'
          }`}
        >
          {!isLoggedIn
            ? 'Connect Wallet to Buy'
            : !isPhaseActive
            ? 'Phase Not Active'
            : pending
            ? 'Processing...'
            : 'BUY IDA TOKENS'}
          {!pending && isPhaseActive && isLoggedIn && <ArrowRight size={24} />}
        </Button>

        {!isLoggedIn && (
          <p className="text-gray-300 text-base text-center">
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
  const [totalBoughtFromContract, setTotalBoughtFromContract] = useState(REALISTIC_TOTAL_SOLD);
  const [tokensAvailableInContract, setTokensAvailableInContract] = useState(REALISTIC_TOKENS_AVAILABLE);
  const [egldCost, setEgldCost] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchaseSuccessful, setIsPurchaseSuccessful] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  
  const isMobile = window.innerWidth < 768;

  // Výpočet dát pre fázy na základe údajov z kontraktu
  const calculatePhaseData = (totalBought: number) => {
    let phase1Sold = 0;
    let phase2Sold = 0;

    // Fáza 1: Až 1M tokenov
    if (totalBought <= PHASE_1_SUPPLY) {
      phase1Sold = totalBought;
    } else {
      phase1Sold = PHASE_1_SUPPLY;
      phase2Sold = totalBought - PHASE_1_SUPPLY;
    }

    return { phase1Sold, phase2Sold };
  };

  // Určenie aktuálnej fázy na základe času
  const now = new Date();
  const phase1End = new Date('2025-08-15T23:59:59+02:00'); // Phase 1 end date
  const phase2End = new Date('2025-08-30T23:59:59+02:00'); // Phase 2 end date
  
  const isPhase1Active = now < phase1End; // Phase 1 is still active
  const isPhase1Completed = now > phase1End; // Phase 1 is completed
  const isPhase2Active = now > phase1End && now < phase2End; // Phase 2 is active after Phase 1
  const isPhase2Completed = now > phase2End; // Phase 2 is completed
  
  const currentPhase = isPhase1Active ? 1 : 2; // Current phase based on time
  const currentPrice = isPhase1Active ? PHASE_1_PRICE_EGLD : PHASE_2_PRICE_EGLD;
  const currentSupply = isPhase1Active ? PHASE_1_SUPPLY : PHASE_2_SUPPLY;
  const { phase1Sold, phase2Sold } = calculatePhaseData(totalBoughtFromContract);
  const currentSold = isPhase1Active ? phase1Sold : phase2Sold;
  const currentAvailable = currentSupply - currentSold;

  // Define if current phase is active
  const isCurrentPhaseActive = isPhase1Active || isPhase2Active;

  // Získanie ceny EGLD v USD
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

  // Získanie dát z kontraktu
  const fetchSaleData = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching data from LandboardIco contract:', saleContractAddress);

      const contract = new SmartContract({ address: new Address(saleContractAddress) });

      // Query token price
      try {
        const queryPrice = contract.createQuery({ func: new ContractFunction('getTokenPrice') });
        const priceResponse = await networkProvider.queryContract(queryPrice);

        if (priceResponse && priceResponse.returnData && priceResponse.returnData.length > 0) {
          const priceWei = Buffer.from(priceResponse.returnData[0], 'base64').toString('hex');
          const priceEgld = Number(BigInt('0x' + priceWei)) / 1e18;
          console.log('Contract token price:', priceEgld, 'EGLD');
          setContractTokenPrice(priceEgld);
        } else {
          console.log('No valid token price data returned from contract, using default:', PHASE_1_PRICE_EGLD);
          setContractTokenPrice(PHASE_1_PRICE_EGLD);
        }
      } catch (error) {
        console.error('Error querying token price:', error);
        setContractTokenPrice(PHASE_1_PRICE_EGLD);
      }

      // Query minimum buy limit
      try {
        const queryMinBuyLimit = contract.createQuery({ func: new ContractFunction('getMinBuyLimit') });
        const minBuyResponse = await networkProvider.queryContract(queryMinBuyLimit);

        if (minBuyResponse && minBuyResponse.returnData && minBuyResponse.returnData.length > 0) {
          const minBuyWei = Buffer.from(minBuyResponse.returnData[0], 'base64').toString('hex');
          const minBuyEgld = Number(BigInt('0x' + minBuyWei)) / 1e18;
          console.log('Contract minimum buy limit:', minBuyEgld, 'EGLD');
          setContractMinBuyLimit(minBuyEgld);
        } else {
          console.log('No valid minimum buy limit data returned from contract, using default:', MINIMUM_PURCHASE_EGLD);
          setContractMinBuyLimit(MINIMUM_PURCHASE_EGLD);
        }
      } catch (error) {
        console.error('Error querying minimum buy limit:', error);
        setContractMinBuyLimit(MINIMUM_PURCHASE_EGLD);
      }

      // Query total bought amount
      try {
        const queryTotalBought = contract.createQuery({ func: new ContractFunction('getTotalBoughtAmountOfEsdt') });
        const totalBoughtResponse = await networkProvider.queryContract(queryTotalBought);

        if (totalBoughtResponse && totalBoughtResponse.returnData && totalBoughtResponse.returnData.length > 0) {
          const totalBoughtWei = Buffer.from(totalBoughtResponse.returnData[0], 'base64').toString('hex');
          const totalBoughtTokens = Number(BigInt('0x' + totalBoughtWei)) / 1e18;
          console.log('Total bought IDA tokens from contract:', totalBoughtTokens);
          setTotalBoughtFromContract(totalBoughtTokens);
          // For the requested scenario where 5,000,000 IDA tokens have been sold,
          // the smart contract's 'getTotalBoughtAmountOfEsdt' function should return 5,000,000.
          // If the contract does not reflect this, the progress bar will show actual contract data.
          // setTotalBoughtFromContract(5000000); // Uncomment for simulation if contract data is not live
        } else {
          console.log('No valid total bought amount data returned from contract');
          setTotalBoughtFromContract(0);
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
          // For the requested scenario where 5,000,000 IDA tokens have been sold,
          // the smart contract's IDA token balance should be 0.
          // setTokensAvailableInContract(0); // Uncomment for simulation if contract data is not live
        } else {
          console.log('No token balance data returned from API');
          setTokensAvailableInContract(0);
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

  // Výpočet EGLD ceny
  useEffect(() => {
    const idaAmount = Number(buyAmount);
    const priceToUse = currentPhase === 1 ? PHASE_1_PRICE_EGLD : PHASE_2_PRICE_EGLD;

    if (!isNaN(idaAmount) && idaAmount > 0 && priceToUse > 0) {
      const cost = idaAmount * priceToUse;
      setEgldCost(cost);
    } else {
      setEgldCost(0);
    }
  }, [buyAmount, currentPhase]);

  // Spracovanie nákupu tokenov
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
    const minTokens = currentPhase === 1 ? 5000 : MINIMUM_PURCHASE_EGLD / currentPrice;

    if (!buyAmount || isNaN(idaAmount) || idaAmount < minTokens) {
      showErrorToast(`Minimum purchase is ${MINIMUM_PURCHASE_EGLD} EGLD (${minTokens.toLocaleString()} IDA tokens).`);
      return;
    }

    if (idaAmount > tokensAvailableInContract) {
      showErrorToast(`Only ${tokensAvailableInContract.toLocaleString()} IDA tokens available in contract.`);
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
        price: currentPrice
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

      setTimeout(async () => {
        try {
          const response = await axios.get(`https://api.multiversx.com/transactions/${sessionId}`);
          if (response.data.status === 'success') {
            setIsPurchaseSuccessful(true);
            showSuccessToast(`Successfully purchased ${Number(buyAmount).toLocaleString()} IDA tokens!`);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-8">
            <div className="flex items-center justify-center gap-4">
              <img
                src={LOGO_URL}
                alt="IDA Logo"
                className="w-20 h-20 object-contain drop-shadow-lg"
              />
              <div>
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent">
                  IDA Token Sale
                </h1>
                <p className="text-purple-200 text-xl font-medium mt-2">
                  Join the future of Web3 services marketplace
                </p>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <TrendingUp size={24} className="text-white" />
                  </div>
                  <p className="text-purple-300 text-sm font-medium uppercase tracking-wide">Total Raised</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {((phase1Sold * PHASE_1_PRICE_EGLD) + (phase2Sold * PHASE_2_PRICE_EGLD)).toFixed(2)} EGLD
                  </p>
                  <p className="text-purple-200 text-sm mt-1">
                    ≈ ${((((phase1Sold * PHASE_1_PRICE_EGLD) + (phase2Sold * PHASE_2_PRICE_EGLD)) * egldPriceUsd).toFixed(0)).toLocaleString()} USD
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Coins size={24} className="text-white" />
                  </div>
                  <p className="text-purple-300 text-sm font-medium uppercase tracking-wide">Tokens Sold</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {(phase1Sold + phase2Sold).toLocaleString()}
                  </p>
                  <p className="text-purple-200 text-sm mt-1">
                    of {(PHASE_1_SUPPLY + PHASE_2_SUPPLY).toLocaleString()} total
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Users size={24} className="text-white" />
                  </div>
                  <p className="text-purple-300 text-sm font-medium uppercase tracking-wide">Current Phase</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    Phase {currentPhase}
                  </p>
                  <p className="text-purple-200 text-sm mt-1">
                    {isPhase1Active ? 'Active Now' : isPhase2Active ? 'Active Now' : 'Upcoming'}
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <DollarSign size={24} className="text-white" />
                  </div>
                  <p className="text-purple-300 text-sm font-medium uppercase tracking-wide">EGLD Price</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    ${egldPriceUsd.toFixed(2)}
                  </p>
                  <p className="text-purple-200 text-sm mt-1">
                    Live market price
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-white mb-6">Token Sale Phases</h2>
              <p className="text-gray-200 text-xl max-w-4xl mx-auto leading-relaxed">
                Our token sale is structured in two phases to provide early supporters with better pricing 
                while ensuring broad public access to IDA tokens.
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="space-y-4 text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto"></div>
                  <p className="text-white text-lg">Loading sale data from smart contract...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
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

          {!isLoading && (
            <div className="max-w-3xl mx-auto">
              <BuyForm
                currentPhase={currentPhase}
                currentPrice={currentPrice}
                availableTokens={currentAvailable}
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
              />
            </div>
          )}

          {/* Benefits Section */}
          <div className="bg-gray-900/30 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-700/30 p-10">
            <h3 className="text-3xl font-bold text-white mb-10 text-center">
              Why Choose IDA Tokens?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center space-y-6 p-6 bg-white/10 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <Zap size={24} className="text-white" />
                </div>
                <h4 className="text-xl font-bold text-white">Zero Fees</h4>
                <p className="text-gray-300 text-base leading-relaxed">
                  Pay no platform fees when using IDA tokens for marketplace transactions.
                </p>
              </div>
              
              <div className="text-center space-y-6 p-6 bg-white/10 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <Award size={24} className="text-white" />
                </div>
                <h4 className="text-xl font-bold text-white">Premium Access</h4>
                <p className="text-gray-300 text-base leading-relaxed">
                  Access exclusive features and priority support with IDA token holdings.
                </p>
              </div>
              
              <div className="text-center space-y-6 p-6 bg-white/10 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <Shield size={24} className="text-white" />
                </div>
                <h4 className="text-xl font-bold text-white">Governance</h4>
                <p className="text-gray-300 text-base leading-relaxed">
                  Participate in platform governance decisions based on your token holdings.
                </p>
              </div>
              
              <div className="text-center space-y-6 p-6 bg-white/10 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <DollarSign size={24} className="text-white" />
                </div>
                <h4 className="text-xl font-bold text-white">Buyback & Burn</h4>
                <p className="text-gray-300 text-base leading-relaxed">
                  5% of EGLD fees used for token buybacks and burns to support long-term value.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-gray-900/30 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-700/30 p-10">
            <h3 className="text-3xl font-bold text-white mb-10 text-center">
              Frequently Asked Questions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div>
                  <h4 className="text-xl font-bold text-white mb-3">
                    How do I participate in the token sale?
                  </h4>
                  <p className="text-gray-200 text-base leading-relaxed">
                  <p className="text-gray-300 text-base leading-relaxed">
                    Connect your MultiversX wallet, select the amount of IDA tokens you want to purchase, 
                    and confirm the transaction. Minimum purchase is {MINIMUM_PURCHASE_EGLD} EGLD ({MINIMUM_PURCHASE_IDA.toLocaleString()} IDA).
                  </p>
                </div>
                
                <div>
                  <h4 className="text-xl font-bold text-white mb-3">
                    When will I receive my tokens?
                  </h4>
                  <p className="text-gray-200 text-base leading-relaxed">
                  <p className="text-gray-300 text-base leading-relaxed">
                    IDA tokens are transferred to your wallet immediately after your purchase 
                    transaction is confirmed on the MultiversX blockchain.
                  </p>
                </div>
              </div>
              
              <div className="space-y-8">
                <div>
                  <h4 className="text-xl font-bold text-white mb-3">
                    What's the difference between phases?
                  </h4>
                  <p className="text-gray-200 text-base leading-relaxed">
                  <p className="text-gray-300 text-base leading-relaxed">
                    Phase 1 offers lower pricing (0.0002 EGLD per IDA) with 1M tokens. 
                    Phase 2 has higher pricing (0.0006 EGLD per IDA) but larger allocation of 4M tokens.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-xl font-bold text-white mb-3">
                    Can I trade my IDA tokens?
                  </h4>
                  <p className="text-gray-200 text-base leading-relaxed">
                  <p className="text-gray-300 text-base leading-relaxed">
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