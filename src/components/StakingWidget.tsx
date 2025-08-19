import React, { useState } from 'react';
import { DollarSign, TrendingUp, Clock, Shield } from 'lucide-react';
import { Button } from './Button';
import { useWallet } from '../lib/wallet';

interface StakingWidgetProps {
  contract: string;
  token: string;
  apyBps: number;
  minStake?: number;
  maxStake?: number;
  theme: {
    primary: string;
    background: string;
    text: string;
  };
}

export const StakingWidget: React.FC<StakingWidgetProps> = ({ 
  contract, 
  token, 
  apyBps,
  minStake = 1,
  maxStake = 1000,
  theme
}) => {
  const [amount, setAmount] = useState<number>(minStake);
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const { address, isConnected, login } = useWallet();

  const handleStake = async () => {
    if (!isConnected) {
      await login();
      return;
    }

    if (amount < minStake || amount > maxStake) {
      alert(`Amount must be between ${minStake} and ${maxStake} ${token}`);
      return;
    }

    setIsStaking(true);
    try {
      // Mock staking transaction - replace with real smart contract call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Successfully staked ${amount} ${token}!`);
    } catch (error) {
      alert('Staking failed. Please try again.');
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstake = async () => {
    if (!isConnected) {
      await login();
      return;
    }

    setIsUnstaking(true);
    try {
      // Mock unstaking transaction - replace with real smart contract call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Successfully unstaked ${amount} ${token}!`);
    } catch (error) {
      alert('Unstaking failed. Please try again.');
    } finally {
      setIsUnstaking(false);
    }
  };

  const apy = (apyBps / 100).toFixed(2);

  return (
    <div 
      className="rounded-2xl p-6 border backdrop-blur-sm"
      style={{ 
        backgroundColor: `${theme.primary}20`,
        borderColor: `${theme.primary}40`,
        color: theme.text
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold">Stake {token}</h3>
          <div className="flex items-center justify-center gap-2 text-sm opacity-80">
            <TrendingUp size={16} />
            <span>APY: {apy}%</span>
          </div>
        </div>

        {/* Contract Info */}
        <div className="bg-black/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className="text-green-400" />
            <span className="text-sm font-medium">Smart Contract</span>
          </div>
          <p className="text-xs font-mono opacity-80 break-all">
            {contract}
          </p>
        </div>

        {/* Staking Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Amount to Stake
            </label>
            <div className="relative">
              <input
                type="number"
                min={minStake}
                max={maxStake}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:border-transparent"
                style={{ focusRingColor: theme.primary }}
                placeholder={`Min: ${minStake}, Max: ${maxStake}`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="text-sm font-medium opacity-80">{token}</span>
              </div>
            </div>
            <div className="flex justify-between text-xs opacity-60 mt-1">
              <span>Min: {minStake} {token}</span>
              <span>Max: {maxStake} {token}</span>
            </div>
          </div>

          {/* Estimated Rewards */}
          <div className="bg-black/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-yellow-400" />
              <span className="text-sm font-medium">Estimated Annual Rewards</span>
            </div>
            <p className="text-lg font-bold">
              {(amount * (apyBps / 10000)).toFixed(4)} {token}
            </p>
            <p className="text-xs opacity-60">
              Based on {apy}% APY
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleStake}
              disabled={isStaking || isUnstaking || amount < minStake || amount > maxStake}
              className="py-3 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
              style={{ 
                backgroundColor: theme.primary,
                color: '#ffffff'
              }}
            >
              {isStaking ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Staking...
                </div>
              ) : (
                'Stake'
              )}
            </Button>
            
            <Button
              onClick={handleUnstake}
              disabled={isStaking || isUnstaking}
              className="py-3 px-4 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-all duration-200 disabled:opacity-50"
            >
              {isUnstaking ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Unstaking...
                </div>
              ) : (
                'Unstake'
              )}
            </Button>
          </div>

          {/* Connection Status */}
          {!isConnected && (
            <div className="text-center">
              <p className="text-sm opacity-60 mb-3">Connect your wallet to start staking</p>
              <Button
                onClick={login}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
              >
                Connect Wallet
              </Button>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="text-center">
          <p className="text-xs opacity-60">
            (Demo widget - connect to real smart contract for production)
          </p>
        </div>
      </div>
    </div>
  );
};