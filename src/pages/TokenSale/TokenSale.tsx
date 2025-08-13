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

// Mobile Flip Countdown Component
const MobileFlipCountdown: React.FC<{ targetDate: string }> = ({ targetDate }) => {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  if (isExpired) {
    return (
      <div className="text-center">
        <p className="text-white text-lg font-bold">Phase Ended</p>
      </div>
    );
  }

  return (
    <div className="flex gap-2 justify-center">
      <div className="text-center" style={{ width: '60px' }}>
        <div className="bg-gradient-to-b from-indigo-600 to-pink-600 rounded-xl shadow-2xl border border-indigo-400 h-12 leading-12 text-2xl font-bold text-white mb-1 flex items-center justify-center">
          {days}
        </div>
        <p className="text-sm text-white uppercase font-bold tracking-wide">Days</p>
      </div>
      <div className="text-center" style={{ width: '60px' }}>
        <div className="bg-gradient-to-b from-indigo-600 to-pink-600 rounded-xl shadow-2xl border border-indigo-400 h-12 leading-12 text-2xl font-bold text-white mb-1 flex items-center justify-center">
          {hours}
        </div>
        <p className="text-sm text-white uppercase font-bold tracking-wide">Hours</p>
      </div>
      <div className="text-center" style={{ width: '60px' }}>
        <div className="bg-gradient-to-b from-indigo-600 to-pink-600 rounded-xl shadow-2xl border border-indigo-400 h-12 leading-12 text-2xl font-bold text-white mb-1 flex items-center justify-center">
          {minutes}
        </div>
        <p className="text-sm text-white uppercase font-bold tracking-wide">Mins</p>
      </div>
      <div className="text-center" style={{ width: '60px' }}>
        <div className="bg-gradient-to-b from-indigo-600 to-pink-600 rounded-xl shadow-2xl border border-indigo-400 h-12 leading-12 text-2xl font-bold text-white mb-1 flex items-center justify-center">
          {seconds}
        </div>
        <p className="text-sm text-white uppercase font-bold tracking-wide">Secs</p>
      </div>
    </div>
  );
};

// Desktop Flip Countdown Component
const DesktopFlipCountdown: React.FC<{ targetDate: string }> = ({ targetDate }) => {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  if (isExpired) {
    return (
      <div className="text-center">
        <p className="text-white text-xl font-bold">Phase Ended</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 justify-center">
      <div className="text-center" style={{ width: '100px' }}>
        <div className="bg-gradient-to-b from-indigo-600 to-pink-600 rounded-2xl shadow-2xl border border-indigo-400 h-20 text-4xl font-bold text-white mb-3 flex items-center justify-center">
          {days}
        </div>
        <p className="text-base text-white uppercase font-bold tracking-wide">Days</p>
      </div>
      <div className="text-center" style={{ width: '100px' }}>
        <div className="bg-gradient-to-b from-indigo-600 to-pink-600 rounded-2xl shadow-2xl border border-indigo-400 h-20 text-4xl font-bold text-white mb-3 flex items-center justify-center">
          {hours}
        </div>
        <p className="text-base text-white uppercase font-bold tracking-wide">Hours</p>
      </div>
      <div className="text-center" style={{ width: '100px' }}>
        <div className="bg-gradient-to-b from-indigo-600 to-pink-600 rounded-2xl shadow-2xl border border-indigo-400 h-20 text-4xl font-bold text-white mb-3 flex items-center justify-center">
          {minutes}
        </div>
        <p className="text-base text-white uppercase font-bold tracking-wide">Minutes</p>
      </div>
      <div className="text-center" style={{ width: '100px' }}>
        <div className="bg-gradient-to-b from-indigo-600 to-pink-600 rounded-2xl shadow-2xl border border-indigo-400 h-20 text-4xl font-bold text-white mb-3 flex items-center justify-center">
          {seconds}
        </div>
        <p className="text-base text-white uppercase font-bold tracking-wide">Seconds</p>
      </div>
    </div>
  );
};

// Mobile Phase Card Component
const MobilePhaseCard: React.FC<{
  phase: number;
  title: string;
  supply: number;
  price: number;
  sold: number;
  isActive: boolean;
  isCompleted: boolean;
  endDate: string;
}> = ({ phase, title, supply, price, sold, isActive, isCompleted, endDate }) => {
  const progress = (sold / supply) * 100;
  const remaining = supply - sold;

  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-500 ${
      isActive 
        ? 'border-indigo-400 bg-gradient-to-br from-indigo-900 to-pink-900 shadow-2xl shadow-indigo-500/30' 
        : isCompleted
        ? 'border-green-400 bg-gradient-to-br from-green-900 to-emerald-900 shadow-xl'
        : 'border-gray-400 bg-gradient-to-br from-gray-800 to-slate-800 shadow-xl'
    }`}>
      <div className="absolute top-4 right-4">
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
          isActive 
            ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white animate-pulse shadow-lg' 
            : isCompleted
            ? 'bg-green-500 text-white shadow-lg'
            : 'bg-gray-500 text-white shadow-lg'
        }`}>
          {isActive ? 'LIVE' : isCompleted ? 'DONE' : 'SOON'}
        </span>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
              isActive 
                ? 'bg-gray-700 text-grey border-2 border-indigo-400' 
                : isCompleted
                ? 'bg-gray-700 text-white border-2 border-green-400'
                : 'bg-gray-700 text-white border-2 border-gray-400'
            }`}>
              <span className="text-xl font-bold">{phase}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-grey">{title}</h3>
              <p className="text-grey text-sm font-medium">Phase {phase} Sale</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <Target size={16} className="text-indigo-400" />
              <span className="text-indigo-300 text-xs font-medium uppercase tracking-wide">Supply</span>
            </div>
            <p className="text-white text-lg font-bold">{supply.toLocaleString()} IDA</p>
          </div>
          
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} className="text-green-400" />
              <span className="text-green-300 text-xs font-medium uppercase tracking-wide">Price</span>
            </div>
            <p className="text-white text-lg font-bold">{price.toFixed(6)} EGLD</p>
            <p className="text-gray-300 text-xs">per IDA token</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-bold text-sm">Progress</span>
            <span className="text-gray-400 font-bold text-lg">{progress.toFixed(1)}%</span>
          </div>
          
          <div className="relative">
            <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden shadow-inner border border-gray-600">
              <div 
                className="h-full transition-all duration-1000 shadow-lg"
                style={{ 
                  width: `${Math.min(progress, 100)}%`,
                  background: 'linear-gradient(to right, #6366f1, #ec4899)',
                  boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)'
                }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-gray-400 font-medium">
                Sold: {sold.toLocaleString()}
              </span>
              <span className="text-gray-400 font-medium">
                Left: {remaining.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {isActive && (
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-600 shadow-lg">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Clock size={16} className="text-indigo-400" />
                <span className="text-white font-semibold text-sm">Time Left</span>
              </div>
              <MobileFlipCountdown targetDate={endDate} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Desktop Phase Card Component
const DesktopPhaseCard: React.FC<{
  phase: number;
  title: string;
  supply: number;
  price: number;
  sold: number;
  isActive: boolean;
  isCompleted: boolean;
  endDate: string;
}> = ({ phase, title, supply, price, sold, isActive, isCompleted, endDate }) => {
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
        <span className={`px-4 py-2 rounded-full text-sm font-bold ${
          isActive 
            ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white animate-pulse shadow-lg' 
            : isCompleted
            ? 'bg-green-500 text-white shadow-lg'
            : 'bg-gray-500 text-white shadow-lg'
        }`}>
          {isActive ? 'LIVE NOW' : isCompleted ? 'COMPLETED' : 'UPCOMING'}
        </span>
      </div>

      <div className="p-10 space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${
              isActive 
                ? 'bg-gray-700 text-white border-2 border-indigo-400' 
                : isCompleted
                ? 'bg-gray-700 text-white border-2 border-green-400'
                : 'bg-gray-700 text-white border-2 border-gray-400'
            }`}>
              <span className="text-3xl font-bold">{phase}</span>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-grey-600">{title}</h3>
              <p className="text-gray-500 text-lg font-medium">Phase {phase} Token Sale</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-600 hover:bg-gray-800 transition-all duration-300 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target size={20} className="text-indigo-400" />
              <span className="text-indigo-300 text-sm font-medium uppercase tracking-wide">Total Supply</span>
            </div>
            <p className="text-white text-2xl font-bold">{supply.toLocaleString()} IDA</p>
          </div>
          
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-600 hover:bg-gray-800 transition-all duration-300 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={20} className="text-green-400" />
              <span className="text-green-300 text-sm font-medium uppercase tracking-wide">Price</span>
            </div>
            <p className="text-white text-2xl font-bold">{price.toFixed(6)} EGLD</p>
            <p className="text-gray-300 text-sm">per IDA token</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-bold text-xl">Sale Progress</span>
            <span className="text-gray-600 font-bold text-2xl">{progress.toFixed(1)}%</span>
          </div>
          
          <div className="relative">
            <div className="w-full bg-gray-800 rounded-full h-6 overflow-hidden shadow-inner border border-gray-600">
              <div 
                className="h-full transition-all duration-1000 shadow-lg"
                style={{ 
                  width: `${Math.min(progress, 100)}%`,
                  background: 'linear-gradient(to right, #6366f1, #ec4899)',
                  boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)'
                }}
              />
            </div>
            <div className="flex justify-between mt-3 text-sm">
              <span className="text-gray-600 font-medium">
                Sold: {sold.toLocaleString()} IDA
              </span>
              <span className="text-gray-600 font-medium">
                Remaining: {remaining.toLocaleString()} IDA
              </span>
            </div>
          </div>
        </div>

        {isActive && (
          <div className="bg-gray-900 rounded-xl p-8 border border-gray-600 shadow-lg">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center gap-3">
                <Clock size={24} className="text-indigo-400" />
                <span className="text-white font-semibold text-xl">Time Remaining</span>
              </div>
              <DesktopFlipCountdown targetDate={endDate} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Mobile Buy Form Component
const MobileBuyForm: React.FC<{
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

  return (
    <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-pink-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shadow-lg">
            <Coins size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Buy IDA Tokens</h3>
            <p className="text-gray-100 text-sm">Phase {currentPhase} Sale</p>
          </div>
        </div>
        
        {!isPhaseActive && (
          <div className="bg-red-600 border border-red-400 rounded-xl p-3 mt-3">
            <p className="text-white text-sm font-medium">⚠️ This phase is not active</p>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-3">
          <label className="block text-white font-semibold text-base">
            Amount (IDA tokens)
          </label>
          <input
            type="number"
            placeholder={`Min: ${MINIMUM_PURCHASE_IDA.toLocaleString()} IDA`}
            value={buyAmount}
            onChange={(e) => setBuyAmount(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 text-base font-medium"
            disabled={!isPhaseActive}
          />
          <p className="text-gray-300 text-sm">
            Minimum: {MINIMUM_PURCHASE_EGLD} EGLD ({MINIMUM_PURCHASE_IDA.toLocaleString()} IDA)
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 space-y-3 border border-gray-600 shadow-lg">
          <h4 className="text-white font-bold text-base">Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300 font-medium text-sm">You Pay:</span>
              <span className="text-white font-bold text-base">{egldCost.toFixed(8)} EGLD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300 font-medium text-sm">You Get:</span>
              <span className="text-indigo-400 font-bold text-base">{Number(buyAmount || 0).toLocaleString()} IDA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300 font-medium text-sm">Available:</span>
              <span className="text-white text-sm">{availableTokens.toLocaleString()} IDA</span>
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
          className={`w-full py-4 text-lg font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
            isPhaseActive && !pending && isLoggedIn
              ? 'bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white shadow-xl'
              : 'bg-gray-600 text-gray-300 cursor-not-allowed'
          }`}
        >
          {!isLoggedIn
            ? 'Connect Wallet'
            : !isPhaseActive
            ? 'Phase Not Active'
            : pending
            ? 'Processing...'
            : 'BUY IDA TOKENS'}
          {!pending && isPhaseActive && isLoggedIn && <ArrowRight size={20} />}
        </Button>

        {!isLoggedIn && (
          <p className="text-gray-300 text-sm text-center">
            Connect your MultiversX wallet to participate
          </p>
        )}
      </div>
    </div>
  );
};

// Desktop Buy Form Component
const DesktopBuyForm: React.FC<{
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

  return (
    <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 overflow-hidden h-fit">
      <div className="bg-gradient-to-r from-indigo-600 to-pink-600 p-8 text-white">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shadow-lg">
            <Coins size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Buy IDA Tokens</h3>
            <p className="text-gray-100 text-lg">Phase {currentPhase} Token Sale</p>
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
        <div className="space-y-4">
          <label className="block text-white font-semibold text-xl">
            Amount to Purchase (IDA tokens)
          </label>
          <input
            type="number"
            placeholder={`Minimum: ${MINIMUM_PURCHASE_IDA.toLocaleString()} IDA (1 EGLD)`}
            value={buyAmount}
            onChange={(e) => setBuyAmount(e.target.value)}
            className="w-full p-4 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 text-xl font-medium"
            disabled={!isPhaseActive}
          />
          <p className="text-gray-300 text-lg">
            Minimum: {MINIMUM_PURCHASE_EGLD} EGLD ({MINIMUM_PURCHASE_IDA.toLocaleString()} IDA)
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-8 space-y-6 border border-gray-600 shadow-lg">
          <h4 className="text-white font-bold text-xl">Purchase Summary</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-medium text-lg">You Pay:</span>
              <span className="text-white font-bold text-xl">{egldCost.toFixed(8)} EGLD</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-medium text-lg">You Receive:</span>
              <span className="text-indigo-400 font-bold text-xl">{Number(buyAmount || 0).toLocaleString()} IDA</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-medium text-lg">Price per IDA:</span>
              <span className="text-white text-lg">{currentPrice.toFixed(6)} EGLD</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-medium text-lg">Available:</span>
              <span className="text-white font-semibold text-lg">{availableTokens.toLocaleString()} IDA</span>
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
          className={`w-full py-6 text-2xl font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 ${
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
          {!pending && isPhaseActive && isLoggedIn && <ArrowRight size={28} />}
        </Button>

        {!isLoggedIn && (
          <p className="text-gray-300 text-lg text-center">
            Connect your MultiversX wallet to participate in the token sale
          </p>
        )}
      </div>
    </div>
  );
};

// Mobile Stats Overview Component
const MobileStatsOverview: React.FC<{
  phase1Sold: number;
  phase2Sold: number;
  egldPriceUsd: number;
}> = ({ phase1Sold, phase2Sold, egldPriceUsd }) => {
  return (
    <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
            <TrendingUp size={16} className="text-white" />
          </div>
          <p className="text-indigo-300 text-xs font-medium uppercase tracking-wide">Total Raised</p>
          <p className="text-lg font-bold text-white mt-1">
            {((phase1Sold * PHASE_1_PRICE_EGLD) + (phase2Sold * PHASE_2_PRICE_EGLD)).toFixed(2)} EGLD
          </p>
          <p className="text-gray-300 text-xs mt-1">
            ≈ ${((((phase1Sold * PHASE_1_PRICE_EGLD) + (phase2Sold * PHASE_2_PRICE_EGLD)) * egldPriceUsd).toFixed(0)).toLocaleString()} USD
          </p>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
            <Coins size={16} className="text-white" />
          </div>
          <p className="text-green-300 text-xs font-medium uppercase tracking-wide">Tokens Sold</p>
          <p className="text-lg font-bold text-white mt-1">
            {(phase1Sold + phase2Sold).toLocaleString()}
          </p>
          <p className="text-gray-300 text-xs mt-1">
            of {(PHASE_1_SUPPLY + PHASE_2_SUPPLY).toLocaleString()} total
          </p>
        </div>
      </div>
    </div>
  );
};

// Desktop Stats Overview Component
const DesktopStatsOverview: React.FC<{
  phase1Sold: number;
  phase2Sold: number;
  egldPriceUsd: number;
  currentPhase: number;
  isPhase1Active: boolean;
  isPhase2Active: boolean;
}> = ({ phase1Sold, phase2Sold, egldPriceUsd, currentPhase, isPhase1Active, isPhase2Active }) => {
  return (
    <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 p-10">
      <div className="grid grid-cols-4 gap-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <TrendingUp size={32} className="text-white" />
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
            <Coins size={32} className="text-white" />
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
            <Users size={32} className="text-white" />
          </div>
          <p className="text-blue-300 text-sm font-medium uppercase tracking-wide">Current Phase</p>
          <p className="text-3xl font-bold text-white mt-2">Phase {currentPhase}</p>
          <p className="text-gray-300 text-sm mt-1">
            {isPhase1Active ? 'Active Now' : isPhase2Active ? 'Active Now' : 'Upcoming'}
          </p>
        </div>
        
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <DollarSign size={32} className="text-white" />
          </div>
          <p className="text-orange-300 text-sm font-medium uppercase tracking-wide">EGLD Price</p>
          <p className="text-3xl font-bold text-white mt-2">${egldPriceUsd.toFixed(2)}</p>
          <p className="text-gray-300 text-sm mt-1">Live market price</p>
        </div>
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
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Update mobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="space-y-6">
            {/* Mobile Hero Section */}
            <div className="gradient-card p-6 text-center">
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={LOGO_URL}
                    alt="IDA Logo"
                    className="w-12 h-12 object-contain drop-shadow-lg"
                  />
                  <div>
                    <h1 className="text-2xl font-bold gradient-text">IDA Token Sale</h1>
                    <p className="text-gray-600 text-sm font-medium">
                      Web3 services marketplace
                    </p>
                  </div>
                </div>

                {/* Mobile Stats Overview */}
                {!isLoading && (
                  <MobileStatsOverview 
                    phase1Sold={phase1Sold} 
                    phase2Sold={phase2Sold} 
                    egldPriceUsd={egldPriceUsd} 
                  />
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="space-y-4 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
                  <p className="text-gray-700 text-base">Loading sale data...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile Phase Cards */}
                <div className="space-y-4">
                  <MobilePhaseCard
                    phase={1}
                    title="Early Bird"
                    supply={PHASE_1_SUPPLY}
                    price={PHASE_1_PRICE_EGLD}
                    sold={Math.min(totalBoughtFromContract, PHASE_1_SUPPLY)}
                    isActive={isPhase1Active}
                    isCompleted={isPhase1Completed}
                    endDate={PHASE_1_END}
                  />
                  
                  <MobilePhaseCard
                    phase={2}
                    title="Public Sale"
                    supply={PHASE_2_SUPPLY}
                    price={PHASE_2_PRICE_EGLD}
                    sold={Math.max(0, totalBoughtFromContract - PHASE_1_SUPPLY)}
                    isActive={isPhase2Active}
                    isCompleted={isPhase2Completed}
                    endDate={PHASE_2_END}
                  />
                </div>

                {/* Mobile Buy Form */}
                <MobileBuyForm
                  currentPhase={currentPhase}
                  currentPrice={currentPrice}
                  availableTokens={tokensAvailableInContract}
                  buyAmount={buyAmount}
                  setBuyAmount={setBuyAmount}
                  egldCost={egldCost}
                  pending={pending}
                  isLoggedIn={isAuthenticated}
                  userAddress={address}
                  handleBuy={handleBuy}
                  transactionHash={transactionHash}
                  isPurchaseSuccessful={isPurchaseSuccessful}
                  isPhaseActive={isCurrentPhaseActive}
                />

                {/* Mobile Transaction Status */}
                {transactionHash && (
                  <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-6">
                    <div className="text-center space-y-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <BarChart3 size={20} className="text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Transaction Status</h3>
                      <div className="space-y-3">
                        <p className="text-gray-300 text-sm">Transaction Hash:</p>
                        <p className="text-indigo-400 font-mono text-xs break-all">
                          {shortenHash(transactionHash)}
                        </p>
                        <a
                          href={`https://explorer.multiversx.com/transactions/${transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors text-sm"
                        >
                          View on Explorer <ArrowRight size={14} />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Mobile bottom padding */}
            <div className="h-20"></div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-12">
          {/* Desktop Hero Section */}
          <div className="gradient-card p-12 text-center">
            <div className="space-y-10">
              <div className="flex items-center justify-center gap-6">
                <img
                  src={LOGO_URL}
                  alt="IDA Logo"
                  className="w-24 h-24 object-contain drop-shadow-lg"
                />
                <div>
                  <h1 className="text-6xl font-bold gradient-text">IDA Token Sale</h1>
                  <p className="text-gray-600 text-xl font-medium mt-2">
                    Join the future of Web3 services marketplace
                  </p>
                </div>
              </div>

              {/* Desktop Stats Overview */}
              {!isLoading && (
                <DesktopStatsOverview 
                  phase1Sold={phase1Sold} 
                  phase2Sold={phase2Sold} 
                  egldPriceUsd={egldPriceUsd}
                  currentPhase={currentPhase}
                  isPhase1Active={isPhase1Active}
                  isPhase2Active={isPhase2Active}
                />
              )}
            </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Fee Reduction</h3>
              <p className="text-gray-600">Users paying with IDEA tokens enjoy zero platform fees, compared to the standard 10% fee when paying with EGLD.</p>
          {/* Desktop Content */}
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="text-5xl font-bold gradient-text mb-8">Token Sale Phases</h2>
              <p className="text-gray-600 text-xl max-w-4xl mx-auto leading-relaxed">
                Our token sale is structured in two phases to provide early supporters with better pricing 
              <h3 className="text-xl font-bold text-gray-800 mb-2">Governance</h3>
              <p className="text-gray-600">IDEA token holders can participate in platform governance decisions through voting.</p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="space-y-6 text-center">
                  <div className="animate-spin rounded-full h-20 w-20 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
                  <p className="text-gray-700 text-xl">Loading sale data from smart contract...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                {/* Desktop Phase Cards */}
                <div className="space-y-8">
                  <DesktopPhaseCard
                    phase={1}
                    title="Early Bird Phase"
                    supply={PHASE_1_SUPPLY}
                    price={PHASE_1_PRICE_EGLD}
                    sold={Math.min(totalBoughtFromContract, PHASE_1_SUPPLY)}
                    isActive={isPhase1Active}
                    isCompleted={isPhase1Completed}
                    endDate={PHASE_1_END}
                  />
                  
                  <DesktopPhaseCard
                    phase={2}
                    title="Public Sale Phase"
                    supply={PHASE_2_SUPPLY}
                    price={PHASE_2_PRICE_EGLD}
                    sold={Math.max(0, totalBoughtFromContract - PHASE_1_SUPPLY)}
                    isActive={isPhase2Active}
                    isCompleted={isPhase2Completed}
                    endDate={PHASE_2_END}
                  />
                </div>

                {/* Desktop Right Column */}
                <div className="space-y-8">
                  {/* Desktop Buy Form */}
                  <DesktopBuyForm
                    currentPhase={currentPhase}
                    currentPrice={currentPrice}
                    availableTokens={tokensAvailableInContract}
                    buyAmount={buyAmount}
                    setBuyAmount={setBuyAmount}
                    egldCost={egldCost}
                    pending={pending}
                    isLoggedIn={isAuthenticated}
                    userAddress={address}
                    handleBuy={handleBuy}
                    transactionHash={transactionHash}
                    isPurchaseSuccessful={isPurchaseSuccessful}
                    isPhaseActive={isCurrentPhaseActive}
                  />

                  {/* Desktop Transaction Status */}
                  {transactionHash && (
                    <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 p-8">
                      <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                          <BarChart3 size={24} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Transaction Status</h3>
                        <div className="space-y-4">
                          <p className="text-gray-300 text-lg">Transaction Hash:</p>
                          <p className="text-indigo-400 font-mono text-sm break-all">
                            {shortenHash(transactionHash)}
                          </p>
                          <a
                            href={`https://explorer.multiversx.com/transactions/${transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors text-lg"
                          >
                            View on Explorer <ArrowRight size={18} />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Desktop Token Information */}
                  <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 p-8">
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <Award size={24} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Token Information</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gray-800 rounded-xl border border-gray-600">
                          <span className="text-gray-300 font-medium text-base">Token Symbol:</span>
                          <span className="text-white font-bold text-base">IDA</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-4 bg-gray-800 rounded-xl border border-gray-600">
                          <span className="text-gray-300 font-medium text-base">Token ID:</span>
                          <span className="text-white font-mono text-sm">{TOKEN_ID}</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-4 bg-gray-800 rounded-xl border border-gray-600">
                          <span className="text-gray-300 font-medium text-base">Total Supply:</span>
                          <span className="text-white font-bold text-base">{(PHASE_1_SUPPLY + PHASE_2_SUPPLY).toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-4 bg-gray-800 rounded-xl border border-gray-600">
                          <span className="text-gray-300 font-medium text-base">Contract:</span>
                          <span className="text-white font-mono text-sm">{shortenHash(saleContractAddress)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Key Features */}
                  <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 p-8">
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <Zap size={24} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Key Features</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-gray-800 rounded-xl border border-gray-600">
                          <Shield size={20} className="text-indigo-400 mt-1 flex-shrink-0" />
                          <div>
                            <h4 className="text-white font-semibold text-base">Secure Smart Contract</h4>
                            <p className="text-gray-300 text-sm">Built on MultiversX blockchain with audited smart contracts</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4 p-4 bg-gray-800 rounded-xl border border-gray-600">
                          <DollarSign size={20} className="text-green-400 mt-1 flex-shrink-0" />
                          <div>
                            <h4 className="text-white font-semibold text-base">Fair Pricing</h4>
                            <p className="text-gray-300 text-sm">Transparent pricing with early bird discounts</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4 p-4 bg-gray-800 rounded-xl border border-gray-600">
                          <Users size={20} className="text-blue-400 mt-1 flex-shrink-0" />
                          <div>
                            <h4 className="text-white font-semibold text-base">Community Driven</h4>
                            <p className="text-gray-300 text-sm">Token holders participate in governance decisions</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Staking Rewards</h3>
              <p className="text-gray-600">Stake IDEA tokens to earn a share of platform fees and additional token rewards.</p>
            </div>
          </div>
        </div>

        {/* Utilization of EGLD Payment Fees */}
        <div className="gradient-card p-8">
          <h2 className="text-2xl md:text-3xl font-bold gradient-text mb-8 text-center">
            Utilization of EGLD Payment Fees
          </h2>
          <p className="text-gray-600 text-lg mb-8 text-center">
            A 10% platform fee is deducted from payments made in EGLD (MultiversX native token) to support the IDEA ecosystem and its long-term sustainability. Payments made with IDEA tokens incur zero fees.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Buy-back and Burn Program (5%)</h3>
              <p className="text-gray-600">5% of the EGLD fee is used to buy back IDEA tokens from the market. These tokens are subsequently burned, reducing the total supply and supporting the token's long-term value.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Platform Operations (5%)</h3>
              <p className="text-gray-600">5% of the EGLD fee is allocated to platform operations, including maintenance of the serverless infrastructure, MultiversX SDK integration, and ongoing technical support.</p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <h4 className="text-lg font-bold text-blue-800 mb-3">Example:</h4>
            <p className="text-blue-700">
              For a 100 EGLD payment, 10 EGLD is deducted as a fee, with 5 EGLD used for the buy-back and burn program and 5 EGLD for platform operations.
            )}
          </div>
        </div>
      </div>
    </div>
  );
};