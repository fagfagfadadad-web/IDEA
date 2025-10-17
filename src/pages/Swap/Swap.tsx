import React, { useState, useEffect } from 'react';
import {
  ArrowDown,
  RefreshCw,
  Wallet,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Loader,
} from 'lucide-react';
import { Button } from 'components';
import { TokenSelector } from '../../components/TokenSelector';
import { SwapSettings } from '../../components/SwapSettings';
import { useBscWallet } from '../../hooks/useBscWallet';
import { BscWalletService, BSC_CHAIN_IDS } from '../../services/bscWalletService';
import {
  PancakeSwapService,
  Token,
  SwapQuote,
  BNB_TOKEN,
  POPULAR_TOKENS,
} from '../../services/pancakeSwapService';
import { useToast } from '../../context/ToastContext';

export const Swap: React.FC = () => {
  const { address, chainId, isConnected, connectWallet, switchNetwork } = useBscWallet();
  const { success, error: showError } = useToast();

  const [tokenIn, setTokenIn] = useState<Token | null>(BNB_TOKEN);
  const [tokenOut, setTokenOut] = useState<Token | null>(POPULAR_TOKENS[0]);
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [balanceIn, setBalanceIn] = useState('0');
  const [balanceOut, setBalanceOut] = useState('0');
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address && tokenIn && tokenOut) {
      loadBalances();
      checkApproval();
    }
  }, [isConnected, address, tokenIn, tokenOut]);

  useEffect(() => {
    if (amountIn && tokenIn && tokenOut && isConnected) {
      const debounce = setTimeout(() => {
        loadQuote();
      }, 500);
      return () => clearTimeout(debounce);
    } else {
      setAmountOut('');
      setQuote(null);
    }
  }, [amountIn, tokenIn, tokenOut, isConnected]);

  const loadBalances = async () => {
    if (!address || !tokenIn || !tokenOut) return;

    try {
      const walletState = BscWalletService.getWalletState();
      if (!walletState.provider) return;

      const balIn = await PancakeSwapService.getTokenBalance(
        tokenIn.address,
        address,
        walletState.provider
      );
      const balOut = await PancakeSwapService.getTokenBalance(
        tokenOut.address,
        address,
        walletState.provider
      );

      setBalanceIn(balIn);
      setBalanceOut(balOut);
    } catch (err) {
      console.error('Error loading balances:', err);
    }
  };

  const checkApproval = async () => {
    if (!address || !tokenIn || tokenIn.address === 'BNB') {
      setNeedsApproval(false);
      return;
    }

    try {
      const walletState = BscWalletService.getWalletState();
      if (!walletState.provider) return;

      const allowance = await PancakeSwapService.checkAllowance(
        tokenIn.address,
        address,
        walletState.provider
      );

      const amountWei = amountIn
        ? parseFloat(amountIn) * Math.pow(10, tokenIn.decimals)
        : 0;
      setNeedsApproval(parseFloat(allowance) < amountWei);
    } catch (err) {
      console.error('Error checking approval:', err);
    }
  };

  const loadQuote = async () => {
    if (!tokenIn || !tokenOut || !amountIn || parseFloat(amountIn) <= 0) return;

    setIsLoadingQuote(true);
    try {
      const walletState = BscWalletService.getWalletState();
      if (!walletState.provider) return;

      const quoteData = await PancakeSwapService.getSwapQuote(
        tokenIn,
        tokenOut,
        amountIn,
        walletState.provider
      );

      if (quoteData) {
        setQuote(quoteData);
        setAmountOut(quoteData.amountOut);
      }
    } catch (err) {
      console.error('Error loading quote:', err);
      showError('Failed to get swap quote');
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const handleApprove = async () => {
    if (!tokenIn || tokenIn.address === 'BNB' || !amountIn) return;

    setIsApproving(true);
    try {
      const walletState = BscWalletService.getWalletState();
      if (!walletState.signer) throw new Error('Wallet not connected');

      await PancakeSwapService.approveToken(
        tokenIn.address,
        amountIn,
        tokenIn.decimals,
        walletState.signer
      );

      success('Token approved successfully!');
      setNeedsApproval(false);
    } catch (err: any) {
      console.error('Approval error:', err);
      showError(err.message || 'Failed to approve token');
    } finally {
      setIsApproving(false);
    }
  };

  const handleSwap = async () => {
    if (!tokenIn || !tokenOut || !amountIn || !address) return;

    if (!BscWalletService.isBscChain(chainId)) {
      showError('Please switch to BSC network');
      return;
    }

    if (parseFloat(amountIn) > parseFloat(balanceIn)) {
      showError('Insufficient balance');
      return;
    }

    setIsSwapping(true);
    setTxHash(null);

    try {
      const walletState = BscWalletService.getWalletState();
      if (!walletState.signer) throw new Error('Wallet not connected');

      const hash = await PancakeSwapService.executeSwap(
        tokenIn,
        tokenOut,
        amountIn,
        slippage / 100,
        address,
        walletState.signer
      );

      setTxHash(hash);
      success('Swap successful!');
      setAmountIn('');
      setAmountOut('');
      setQuote(null);
      await loadBalances();
    } catch (err: any) {
      console.error('Swap error:', err);
      showError(err.message || 'Swap failed');
    } finally {
      setIsSwapping(false);
    }
  };

  const handleReverseTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn('');
    setAmountOut('');
    setQuote(null);
  };

  const handleMaxClick = () => {
    if (!balanceIn || parseFloat(balanceIn) === 0) {
      showError('No balance available');
      return;
    }
    const maxAmount = parseFloat(balanceIn).toFixed(8);
    setAmountIn(maxAmount);
  };

  const isValidInput =
    amountIn && parseFloat(amountIn) > 0 && parseFloat(amountIn) <= parseFloat(balanceIn);

  // ---------- UI --------------

  if (!isConnected) return (/* unchanged ... */);

  if (!BscWalletService.isBscChain(chainId)) return (/* unchanged ... */);

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 pb-20 sm:pb-8 px-3 sm:px-4">
      <div className="container mx-auto py-4 sm:py-8 max-w-sm sm:max-w-lg">
        {/* ... */}
        <div className="bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl">
          <div className="space-y-3 sm:space-y-4">

            {/* From */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-3 sm:p-4 border-2 border-purple-500 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-inter font-bold text-white">From</label>
                <div className="text-xs sm:text-sm font-inter text-white">
                  Balance: {PancakeSwapService.formatTokenAmount(balanceIn)}
                  {parseFloat(balanceIn) > 0 && (
                    <button
                      onClick={handleMaxClick}
                      className="ml-2 text-yellow-300 hover:text-yellow-200 font-bold text-xs sm:text-sm"
                    >
                      MAX
                    </button>
                  )}
                </div>
              </div>

              {/* 🔧 Upravený layout */}
              <div className="flex items-center justify-between gap-2">
                <input
                  type="number"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-2xl font-inter font-bold outline-none text-white placeholder-purple-300"
                />
                <div className="flex-shrink-0">
                  <TokenSelector selectedToken={tokenIn} onSelectToken={setTokenIn} label="" />
                </div>
              </div>
            </div>

            {/* ... ostatné časti kódu nezmenené */}
          </div>
        </div>
      </div>
    </div>
  );
};
