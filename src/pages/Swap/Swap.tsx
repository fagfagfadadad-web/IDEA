import React, { useState, useEffect } from 'react';
import { ArrowDown, RefreshCw, Wallet, ExternalLink, AlertCircle, CheckCircle, Loader } from 'lucide-react';
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
  const [mevProtect, setMevProtect] = useState(false);

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
      if (!walletState.signer) {
        throw new Error('Wallet not connected');
      }

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
      if (!walletState.signer) {
        throw new Error('Wallet not connected');
      }

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
    if (tokenIn?.address === 'BNB') {
      const maxAmount = Math.max(0, parseFloat(balanceIn) - 0.01);
      setAmountIn(maxAmount.toString());
    } else {
      setAmountIn(balanceIn);
    }
  };

  const isValidInput = amountIn && parseFloat(amountIn) > 0 && parseFloat(amountIn) <= parseFloat(balanceIn);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 flex items-center justify-center pb-24 md:pb-8 px-4">
        <div className="cute-card p-8 max-w-md w-full text-center space-y-6">
          <Wallet size={64} className="mx-auto text-orange-600" />
          <h2 className="text-2xl font-inter font-bold text-gray-900">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 font-inter">
            Connect your MetaMask wallet to start swapping tokens on PancakeSwap
          </p>
          <Button
            onClick={connectWallet}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-4 rounded-xl font-inter font-bold"
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (!BscWalletService.isBscChain(chainId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 flex items-center justify-center pb-24 md:pb-8 px-4">
        <div className="cute-card p-8 max-w-md w-full text-center space-y-6">
          <AlertCircle size={64} className="mx-auto text-red-600" />
          <h2 className="text-2xl font-inter font-bold text-gray-900">
            Wrong Network
          </h2>
          <p className="text-gray-600 font-inter">
            Please switch to BNB Smart Chain to use PancakeSwap
          </p>
          <Button
            onClick={() => switchNetwork(BSC_CHAIN_IDS.MAINNET)}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-4 rounded-xl font-inter font-bold"
          >
            Switch to BSC
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 pb-24 md:pb-8 px-4">
      <div className="container mx-auto py-8 max-w-lg">
        <div className="text-center mb-6 space-y-2">
          <h1 className="text-3xl md:text-4xl font-inter font-bold text-white drop-shadow-lg">
            Token Swap
          </h1>
          <p className="text-white text-base font-inter font-semibold drop-shadow">
            Powered by PancakeSwap
          </p>
          <div className="text-sm font-inter text-white font-semibold drop-shadow opacity-90">
            {BscWalletService.formatBscAddress(address || '')}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-3xl p-1 shadow-2xl">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-inter font-bold text-white">Swap Tokens</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadQuote}
                  disabled={!amountIn || isLoadingQuote}
                  className="p-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  title="Refresh Quote"
                >
                  <RefreshCw
                    size={18}
                    className={`text-gray-300 ${isLoadingQuote ? 'animate-spin' : ''}`}
                  />
                </button>
                <SwapSettings slippage={slippage} onSlippageChange={setSlippage} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl p-4 space-y-3 border border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <label className="text-xs font-inter font-bold text-gray-300">
                      From:
                    </label>
                    {tokenIn?.logoURI && (
                      <img
                        src={tokenIn.logoURI}
                        alt={tokenIn.symbol}
                        className="w-5 h-5 rounded-full"
                      />
                    )}
                    <span className="text-sm font-inter font-bold text-white">{tokenIn?.symbol}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-inter text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="text-gray-500">⚖</span>
                      {PancakeSwapService.formatTokenAmount(balanceIn)}
                    </span>
                    {parseFloat(balanceIn) > 0 && (
                      <button
                        onClick={handleMaxClick}
                        className="text-orange-400 hover:text-orange-300 font-bold transition-colors"
                      >
                        MAX
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 items-center justify-between">
                  <input
                    type="number"
                    value={amountIn}
                    onChange={(e) => setAmountIn(e.target.value)}
                    placeholder="0.0"
                    className="flex-1 bg-transparent text-3xl font-inter font-bold outline-none text-white placeholder-gray-600"
                  />
                  <TokenSelector
                    selectedToken={tokenIn}
                    onSelectToken={setTokenIn}
                    label=""
                  />
                </div>
              </div>

              <div className="flex justify-center -my-1 relative z-10">
                <button
                  onClick={handleReverseTokens}
                  className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-2.5 rounded-xl border-2 border-cyan-400 hover:border-cyan-300 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <ArrowDown size={20} className="text-white" />
                </button>
              </div>

              <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl p-4 space-y-3 border border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <label className="text-xs font-inter font-bold text-gray-300">
                      To:
                    </label>
                    {tokenOut?.logoURI && (
                      <img
                        src={tokenOut.logoURI}
                        alt={tokenOut.symbol}
                        className="w-5 h-5 rounded-full"
                      />
                    )}
                    <span className="text-sm font-inter font-bold text-white">{tokenOut?.symbol}</span>
                  </div>
                  <div className="text-xs font-inter text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="text-gray-500">⚖</span>
                      {PancakeSwapService.formatTokenAmount(balanceOut)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 items-center justify-between">
                  <div className="flex-1">
                    {isLoadingQuote ? (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Loader size={18} className="animate-spin" />
                        <span className="text-base font-inter">Searching For The Best Price...</span>
                      </div>
                    ) : (
                      <div className="text-3xl font-inter font-bold text-white">
                        {amountOut ? PancakeSwapService.formatTokenAmount(amountOut) : '0.00'}
                      </div>
                    )}
                  </div>
                  <TokenSelector
                    selectedToken={tokenOut}
                    onSelectToken={setTokenOut}
                    label=""
                  />
                </div>
              </div>
            </div>

            {tokenIn && tokenOut && quote?.priceImpact !== undefined && (
              <div className="bg-gradient-to-r from-orange-900/30 to-yellow-900/30 rounded-xl p-3 flex items-center gap-2 border border-orange-700/50">
                <AlertCircle size={16} className="text-orange-400 flex-shrink-0" />
                <span className="text-xs font-inter text-orange-300 font-semibold">
                  {quote.priceImpact > 5 ? 'High' : quote.priceImpact > 2 ? 'Medium' : 'Low'} Risk detected for input token: {tokenIn.symbol}
                </span>
              </div>
            )}

            {quote && (
              <div className="bg-gray-800/50 rounded-xl p-3 space-y-2 text-xs font-inter border border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Rate:</span>
                  <span className="font-bold text-white">
                    1 {tokenIn?.symbol} ≈ {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {tokenOut?.symbol}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Minimum Received:</span>
                  <span className="font-bold text-white">
                    {PancakeSwapService.formatTokenAmount(quote.minimumReceived)} {tokenOut?.symbol}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Slippage Tolerance:</span>
                  <span className="font-bold text-orange-400">{slippage}%</span>
                </div>
              </div>
            )}

            <div className="bg-gray-800/30 rounded-xl p-3 flex items-center justify-between border border-gray-700">
              <span className="text-xs font-inter text-gray-400">Slippage Tolerance</span>
              <span className="text-sm font-inter font-bold text-orange-400 flex items-center gap-1">
                Auto: {slippage}%
                <span className="text-orange-500">✏️</span>
              </span>
            </div>

            <div className="bg-gray-800/30 rounded-xl p-4 flex items-center justify-between border border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">\ud83d\udd12</span>
                </div>
                <span className="text-sm font-inter font-bold text-white">Enable MEV Protect</span>
              </div>
              <button
                onClick={() => setMevProtect(!mevProtect)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  mevProtect ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    mevProtect ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {isLoadingQuote && (
              <div className="bg-gray-800/30 rounded-xl p-4 text-center border border-gray-700">
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Loader size={20} className="animate-spin" />
                  <span className="text-sm font-inter">Searching For The Best Price...</span>
                </div>
              </div>
            )}

            {needsApproval && tokenIn?.address !== 'BNB' && (
              <Button
                onClick={handleApprove}
                disabled={isApproving || !isValidInput}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3.5 rounded-xl font-inter font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
              >
                {isApproving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader size={20} className="animate-spin" />
                    Approving...
                  </span>
                ) : (
                  `Approve ${tokenIn?.symbol}`
                )}
              </Button>
            )}

            <Button
              onClick={handleSwap}
              disabled={!isValidInput || isSwapping || needsApproval || isLoadingQuote}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-3.5 rounded-xl font-inter font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all hover:shadow-xl"
            >
              {isSwapping ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader size={20} className="animate-spin" />
                  Swapping...
                </span>
              ) : !isValidInput ? (
                'Enter Amount'
              ) : needsApproval ? (
                'Approve Token First'
              ) : (
                'Swap'
              )}
            </Button>

            {txHash && (
              <div className="bg-green-900/30 border border-green-700 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="font-inter font-bold text-green-300">
                      Transaction Successful!
                    </div>
                    <a
                      href={BscWalletService.getExplorerUrl(txHash, chainId || undefined)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 font-inter transition-colors"
                    >
                      View on BscScan
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-white/80 text-sm font-inter font-semibold drop-shadow">
            Trade tokens in an instant with the best rates on BNB Smart Chain
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-white/60">
            <span>🔒 Secure</span>
            <span>•</span>
            <span>⚡ Fast</span>
            <span>•</span>
            <span>💰 Best Rates</span>
          </div>
        </div>
      </div>
    </div>
  );
};
