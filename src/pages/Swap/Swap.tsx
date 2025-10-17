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

  if (!isConnected) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 flex items-center justify-center px-4 py-12">
        <div className="cute-card p-6 sm:p-8 max-w-sm sm:max-w-md w-full text-center space-y-6 rounded-2xl shadow-xl bg-white/90">
          <Wallet size={48} className="mx-auto text-orange-600" />
          <h2 className="text-xl sm:text-2xl font-inter font-bold text-gray-900">Connect Your Wallet</h2>
          <p className="text-gray-600 font-inter text-sm sm:text-base">
            Connect your MetaMask wallet to start swapping tokens on PancakeSwap
          </p>
          <Button
            onClick={connectWallet}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-inter font-bold text-base sm:text-lg"
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (!BscWalletService.isBscChain(chainId)) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 flex items-center justify-center px-4 py-12">
        <div className="cute-card p-6 sm:p-8 max-w-sm sm:max-w-md w-full text-center space-y-6 rounded-2xl shadow-xl bg-white/90">
          <AlertCircle size={48} className="mx-auto text-red-600" />
          <h2 className="text-xl sm:text-2xl font-inter font-bold text-gray-900">Wrong Network</h2>
          <p className="text-gray-600 font-inter text-sm sm:text-base">
            Please switch to BNB Smart Chain to use PancakeSwap
          </p>
          <Button
            onClick={() => switchNetwork(BSC_CHAIN_IDS.MAINNET)}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-inter font-bold text-base sm:text-lg"
          >
            Switch to BSC
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 pb-20 sm:pb-8 px-3 sm:px-4">
      <div className="container mx-auto py-4 sm:py-8 max-w-sm sm:max-w-lg">
        <div className="text-center mb-5 sm:mb-6 space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-inter font-bold text-white drop-shadow-lg">
            Token Swap
          </h1>
          <p className="text-white text-sm sm:text-base font-inter font-semibold drop-shadow">
            Powered by PancakeSwap
          </p>
          <div className="text-xs sm:text-sm font-inter text-white font-semibold drop-shadow opacity-90 break-all">
            {BscWalletService.formatBscAddress(address || '')}
          </div>
        </div>

        {/* Swap Card */}
        <div className="bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg sm:text-xl font-inter font-bold text-white drop-shadow">
                Swap Tokens
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadQuote}
                  disabled={!amountIn || isLoadingQuote}
                  className="p-2 sm:p-2.5 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    size={18}
                    className={`text-white ${isLoadingQuote ? 'animate-spin' : ''}`}
                  />
                </button>
                <SwapSettings slippage={slippage} onSlippageChange={setSlippage} />
              </div>
            </div>

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
              {/* ✅ FIXED ALIGNMENT */}
              <div className="flex items-center justify-between gap-2">
                <input
                  type="number"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-2xl font-inter font-bold outline-none text-white placeholder-purple-300"
                />
                <div className="flex items-center justify-center min-w-fit">
                  <TokenSelector selectedToken={tokenIn} onSelectToken={setTokenIn} label="" />
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center -my-2 relative z-10">
              <button
                onClick={handleReverseTokens}
                className="bg-gradient-to-br from-purple-600 to-purple-700 p-2 sm:p-2.5 rounded-xl border-3 border-purple-500 hover:border-purple-400 transition-all shadow-lg hover:scale-105"
              >
                <ArrowDown size={18} className="text-white" />
              </button>
            </div>

            {/* To */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-3 sm:p-4 border-2 border-purple-500 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-inter font-bold text-white">To</label>
                <div className="text-xs sm:text-sm font-inter text-white">
                  Balance: {PancakeSwapService.formatTokenAmount(balanceOut)}
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex-1 min-w-0">
                  {isLoadingQuote ? (
                    <div className="flex items-center gap-2 text-purple-200">
                      <Loader size={16} className="animate-spin" />
                      <span className="text-sm font-inter">Loading...</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-inter font-bold text-white break-all">
                      {amountOut ? PancakeSwapService.formatTokenAmount(amountOut) : '0.0'}
                    </div>
                  )}
                </div>
                <TokenSelector selectedToken={tokenOut} onSelectToken={setTokenOut} label="" />
              </div>
            </div>

            {/* Approve / Swap Button */}
            {needsApproval && tokenIn?.address !== 'BNB' && (
              <Button
                onClick={handleApprove}
                disabled={isApproving || !isValidInput}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-4 rounded-2xl font-inter font-bold text-lg disabled:opacity-50 shadow-lg"
              >
                {isApproving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader size={18} className="animate-spin" /> Approving...
                  </span>
                ) : (
                  `Approve ${tokenIn?.symbol}`
                )}
              </Button>
            )}

            <Button
              onClick={handleSwap}
              disabled={!isValidInput || isSwapping || needsApproval || isLoadingQuote}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-4 rounded-2xl font-inter font-bold text-lg disabled:opacity-50 shadow-lg"
            >
              {isSwapping ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader size={18} className="animate-spin" /> Swapping...
                </span>
              ) : !isValidInput ? (
                'Enter Amount'
              ) : needsApproval ? (
                'Approve Token First'
              ) : (
                'Swap'
              )}
            </Button>

            {/* Transaction Info */}
            {txHash && (
              <div className="bg-green-100 border border-green-300 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-green-600 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="font-inter font-bold text-green-900 text-sm">
                      Transaction Successful!
                    </div>
                    <a
                      href={BscWalletService.getExplorerUrl(txHash, chainId || undefined)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 break-all"
                    >
                      View on BscScan <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-1">
          <p className="text-white/80 text-xs sm:text-sm font-inter font-semibold">
            Trade tokens in an instant with the best rates on BNB Smart Chain
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-white/60 flex-wrap">
            <span>🔒 Secure</span>•<span>⚡ Fast</span>•<span>💰 Best Rates</span>
          </div>
        </div>
      </div>
    </div>
  );
};
