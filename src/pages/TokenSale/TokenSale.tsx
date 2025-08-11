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
const networkProvider = new ProxyNetworkProvider('https://gateway.multiversx.com');
const TOKEN_ID = 'IDA-f9bc1d';
const PHASE_1_SUPPLY = 1000000;
const PHASE_1_PRICE_EGLD = 0.0002;
const PHASE_1_END = '2025-08-15T23:59:59+02:00';
const PHASE_2_SUPPLY = 4000000;
const PHASE_2_PRICE_EGLD = 0.0006;
const PHASE_2_END = '2025-08-30T23:59:59+02:00';
const MINIMUM_PURCHASE_EGLD = 1;
const MINIMUM_PURCHASE_IDA = 5000;
const LOGO_URL = 'https://i.postimg.cc/SQ6SC8H8/3359571c-471b-4fe3-a3bd-eabf94fbdd6b.png';

// Realistic data
const REALISTIC_TOTAL_SOLD = 5000000;
const REALISTIC_TOKENS_AVAILABLE = 0;
const SALE_IS_COMPLETE = true;

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
        <p className={`text-white ${isMobile ? 'text-lg' : 'text-xl'} font-bold`}>
          Phase Ended
        </p>
      </div>
    );
  }

  return (
    <div className={`flex ${isMobile ? 'gap-2' : 'gap-4'} justify-center`}>
      <div className="text-center" style={{ width: isMobile ? '60px' : '88px' }}>
        <div
          className={`bg-gradient-to-b from-indigo-600 to-pink-600 rounded-xl shadow-2xl border border-indigo-400 ${
            isMobile ? 'h-12 leading-12 text-2xl' : 'h-16 leading-16 text-4xl'
          } font-bold text-white mb-1 flex items-center justify-center`}
        >
          {days}
        </div>
        <p className={`${isMobile ? 'text-sm' : 'text-base'} text-white uppercase font-bold tracking-wide`}>
          Days
        </p>
      </div>
      <div className="text-center" style={{ width: isMobile ? '60px' : '88px' }}>
        <div
          className={`bg-gradient-to-b from-indigo-600 to-pink-600 rounded-xl shadow-2xl border border-indigo-400 ${
            isMobile ? 'h-12 leading-12 text-2xl' : 'h-16 leading-16 text-4xl'
          } font-bold text-white mb-1 flex items-center justify-center`}
        >
          {hours}
        </div>
        <p className={`${isMobile ? 'text-sm' : 'text-base'} text-white uppercase font-bold tracking-wide`}>
          Hours
        </p>
      </div>
      <div className="text-center" style={{ width: isMobile ? '60px' : '88px' }}>
        <div
          className={`bg-gradient-to-b from-indigo-600 to-pink-600 rounded-xl shadow-2xl border border-indigo-400 ${
            isMobile ? 'h-12 leading-12 text-2xl' : 'h-16 leading-16 text-4xl'
          } font-bold text-white mb-1 flex items-center justify-center`}
        >
          {minutes}
        </div>
        <p className={`${isMobile ? 'text-sm' : 'text-base'} text-white uppercase font-bold tracking-wide`}>
          Mins
        </p>
      </div>
      <div className="text-center" style={{ width: isMobile ? '60px' : '88px' }}>
        <div
          className={`bg-gradient-to-b from-indigo-600 to-pink-600 rounded-xl shadow-2xl border border-indigo-400 ${
            isMobile ? 'h-12 leading-12 text-2xl' : 'h-16 leading-16 text-4xl'
          } font-bold text-white mb-1 flex items-center justify-center`}
        >
          {seconds}
        </div>
        <p className={`${isMobile ? 'text-sm' : 'text-base'} text-white uppercase font-bold tracking-wide`}>
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
        ? 'border-indigo-400 bg-gradient-to-br from-indigo-900 to-pink-900 shadow-2xl shadow-indigo-500/30' 
        : isCompleted
        ? 'border-green-400 bg-gradient-to-br from-green-900 to-emerald-900 shadow-xl'
        : 'border-gray-400 bg-gradient-to-br from-gray-800 to-slate-800 shadow-xl'
    }`}>
      <div className="absolute top-6 right-6">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          isActive 
            ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white animate-pulse shadow-lg' 
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
                ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white' 
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
              <p className="text-indigo-200 text-base font-medium">
                Phase {phase} Token Sale
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-600 hover:bg-gray-800 transition-all duration-300 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target size={18} className="text-indigo-400" />
              <span className="text-indigo-300 text-sm font-medium uppercase tracking-wide">Total Supply</span>
            </div>
            <p className="text-white text-xl font-bold">
              {supply.toLocaleString()} IDA
            </p>
          </div>
          
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-600 hover:bg-gray-800 transition-all duration-300 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={18} className="text-green-400" />
              <span className="text-green-300 text-sm font-medium uppercase tracking-wide">Price</span>
            </div>
            <p className="text-white text-xl font-bold">
              {price.toFixed(6)} EGLD
            </p>
            <p className="text-gray-300 text-sm">
              per IDA token
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-white font-bold text-lg bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">Sale Progress</span>
            <span className="text-white font-bold text-xl">{progress.toFixed(1)}%</span>
          </div>
          
          <div className="relative">
            <div className="w-full bg-gray-800 rounded-full h-6 overflow-hidden shadow-inner border border-gray-600">
              <div 
                className="h-full transition-all duration-1000 bg-gradient-to-r from-indigo-500 to-pink-500 shadow-lg"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-3 text-sm">
              <span className="text-indigo-200 font-medium">
                Sold: {sold.toLocaleString()} IDA
              </span>
              <span className="text-indigo-200 font-medium">
                Remaining: {remaining.toLocaleString()} IDA
              </span>
            </div>
          </div>
        </div>

        {isActive && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-600 shadow-lg">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Clock size={20} className="text-indigo-400" />
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

  const displayMinTokens = currentPhase === 1 ? 5000 : MINIMUM_PURCHASE_EGLD / currentPrice;

  return (
    <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-pink-600 p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shadow-lg">
            <Coins size={24} />
          </div>
          <div>
            <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>
              Buy IDA Tokens
            </h3>
            <p className="text-grey text-base">
              Phase {currentPhase} Token Sale
            </p>
          </div>
        </div>
        
        {!isPhaseActive && (
          <div className="bg-red-600 border border-red-400 rounded-xl p-4 mt-4">
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
            className="w-full p-4 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 text-lg font-medium"
            disabled={!isPhaseActive}
          />
          <p className="text-gray-300 text-base">
            Minimum: {MINIMUM_PURCHASE_EGLD} EGLD ({MINIMUM_PURCHASE_IDA.toLocaleString()} IDA)
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 space-y-4 border border-gray-600 shadow-lg">
          <h4 className="text-white font-bold text-lg">Purchase Summary</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300 font-medium">You Pay:</span>
              <span className="text-white font-bold text-lg">
                {egldCost.toFixed(8)} EGLD
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300 font-medium">You Receive:</span>
              <span className="text-indigo-400 font-bold text-lg">
                {Number(buyAmount || 0).toLocaleString()} IDA
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300 font-medium">Price per IDA:</span>
              <span className="text-white">
                {currentPrice.toFixed(6)} EGLD
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300 font-medium">Available:</span>
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
              ? 'bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transform'
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
  const phase1End = new Date('2025-08-15T23:59:59+02:00');
  const phase2End = new Date('2025-08-30T23:59:59+02:00');
  
  const isPhase1Active = now < phase1End;
  const isPhase1Completed = now > phase1End;
  const isPhase2Active = now > phase1End && now < phase2End;
  const isPhase2Completed = now > phase2End;
  
  const currentPhase = isPhase1Active ? 1 : 2;
  const currentPrice = isPhase1Active ? PHASE_1_PRICE_EGLD : PHASE_2_PRICE_EGLD;
  const currentSupply = isPhase1Active ? PHASE_1_SUPPLY : PHASE_2_SUPPLY;
  const { phase1Sold, phase2Sold } = calculatePhaseData(totalBoughtFromContract);
  const currentSold = isPhase1Active ? phase1Sold : phase2Sold;
  const currentAvailable = currentSupply - currentSold;

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="gradient-card p-8 text-center">
            <div className="space-y-8">
              <div className="flex items-center justify-center gap-4">
                <img
                  src={LOGO_URL}
                  alt="IDA Logo"
                  className="w-20 h-20 object-contain drop-shadow-lg"
                />
                <div>
                  <h1 className="text-5xl md:text-6xl font-bold gradient-text">
                    IDA Token Sale
                  </h1>
                  <p className="text-gray-600 text-xl font-medium mt-2">
                    Join the future of Web3 services marketplace
                  </p>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 p-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <TrendingUp size={24} className="text-white" />
                    </div>
                    <p className="text-indigo-300 text-sm font-medium uppercase tracking-wide">Total Raised</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {((phase1Sold * PHASE_1_PRICE_EGLD) + (phase2Sold * PHASE_2_PRICE_EGLD)).toFixed(2)} EGLD
                    </p>
                    <p className="text-gray-300 text-sm mt-1">
                      ≈ ${((((phase1Sold * PHASE_1_PRICE_EGLD) + (phase2Sold * PHASE_2_PRICE_EGLD)) * egldPriceUsd).toFixed(0)).toLocaleString()} USD
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Coins size={24} className="text-white" />
                    </div>
                    <p className="text-green-300 text-sm font-medium uppercase tracking-wide">Tokens Sold</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {(phase1Sold + phase2Sold).toLocaleString()}
                    </p>
                    <p className="text-gray-300 text-sm mt-1">
                      of {(PHASE_1_SUPPLY + PHASE_2_SUPPLY).toLocaleString()} total
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Users size={24} className="text-white" />
                    </div>
                    <p className="text-blue-300 text-sm font-medium uppercase tracking-wide">Current Phase</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      Phase {currentPhase}
                    </p>
                    <p className="text-gray-300 text-sm mt-1">
                      {isPhase1Active ? 'Active Now' : isPhase2Active ? 'Active Now' : 'Upcoming'}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <DollarSign size={24} className="text-white" />
                    </div>
                    <p className="text-orange-300 text-sm font-medium uppercase tracking-wide">EGLD Price</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      ${egldPriceUsd.toFixed(2)}
                    </p>
                    <p className="text-gray-300 text-sm mt-1">
                      Live market price
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold gradient-text mb-6">Token Sale Phases</h2>
              <p className="text-gray-600 text-xl max-w-4xl mx-auto leading-relaxed">
                Our token sale is structured in two phases to provide early supporters with better pricing 
                while ensuring broad public access to IDA tokens.
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="space-y-4 text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
                  <p className="text-gray-700 text-lg">Loading sale data from smart contract...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

          {/* Buy Form */}
          <div className="max-w-2xl mx-auto">
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

          {/* Success Message */}
          {isPurchaseSuccessful && transactionHash && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">
                  Purchase Successful!
                </h3>
                <p className="text-green-700 mb-4">
                  Your IDA tokens have been successfully purchased.
                </p>
                <p className="text-sm text-green-600">
                  Transaction: {shortenHash(transactionHash)}
                </p>
              </div>
            </div>
          )}

          {/* Benefits Section */}
          <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 p-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-6">Why Choose IDA Tokens?</h2>
              <p className="text-gray-300 text-xl max-w-4xl mx-auto leading-relaxed">
                IDA tokens power the future of decentralized services marketplace with exclusive benefits and utilities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-800 rounded-2xl p-8 border border-gray-600 hover:bg-gray-750 transition-all duration-300 shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Zap size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4 text-center">Platform Utility</h3>
                <p className="text-gray-300 text-center leading-relaxed">
                  Use IDA tokens for reduced fees, premium features, and exclusive access to top-tier service providers.
                </p>
              </div>
              
              <div className="bg-gray-800 rounded-2xl p-8 border border-gray-600 hover:bg-gray-750 transition-all duration-300 shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Shield size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4 text-center">Governance Rights</h3>
                <p className="text-gray-300 text-center leading-relaxed">
                  Participate in platform governance decisions and shape the future of the IDEA ecosystem.
                </p>
              </div>
              
              <div className="bg-gray-800 rounded-2xl p-8 border border-gray-600 hover:bg-gray-750 transition-all duration-300 shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Award size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4 text-center">Staking Rewards</h3>
                <p className="text-gray-300 text-center leading-relaxed">
                  Stake your IDA tokens to earn passive rewards and contribute to network security.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 p-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-6">Frequently Asked Questions</h2>
              <p className="text-gray-300 text-xl max-w-4xl mx-auto leading-relaxed">
                Everything you need to know about the IDA token sale.
              </p>
            </div>

            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-gray-800 rounded-2xl p-8 border border-gray-600 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-4">What is IDA token?</h3>
                <p className="text-gray-300 leading-relaxed">
                  IDA is the native utility token of the IDEA platform, designed to facilitate transactions, 
                  governance, and rewards within our decentralized services marketplace.
                </p>
              </div>
              
              <div className="bg-gray-800 rounded-2xl p-8 border border-gray-600 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-4">How do I participate in the token sale?</h3>
                <p className="text-gray-300 leading-relaxed">
                  Connect your MultiversX wallet, choose the amount of IDA tokens you want to purchase, 
                  and complete the transaction. The minimum purchase is 1 EGLD (5,000 IDA tokens).
                </p>
              </div>
              
              <div className="bg-gray-800 rounded-2xl p-8 border border-gray-600 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-4">When will I receive my tokens?</h3>
                <p className="text-gray-300 leading-relaxed">
                  IDA tokens are distributed immediately after your purchase transaction is confirmed on the MultiversX blockchain.
                </p>
              </div>
              
              <div className="bg-gray-800 rounded-2xl p-8 border border-gray-600 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-4">What are the token sale phases?</h3>
                <p className="text-gray-300 leading-relaxed">
                  Phase 1 offers 1M tokens at 0.0002 EGLD each until August 15th. 
                  Phase 2 offers 4M tokens at 0.0006 EGLD each until August 30th.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};