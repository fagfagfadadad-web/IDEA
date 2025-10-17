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
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-4xl md:text-5xl font-inter font-bold text-white drop-shadow-lg">
            Token Swap
          </h1>
          <p className="text-white text-lg font-inter font-semibold drop-shadow">
            Powered by PancakeSwap
          </p>
          <div className="text-sm font-inter text-white font-semibold drop-shadow">
            {BscWalletService.formatBscAddress(address || '')}
          </div>
        </div>

        <div className="cute-card p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-inter font-bold text-gray-900">Swap Tokens</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={loadQuote}
                disabled={!amountIn || isLoadingQuote}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Refresh Quote"
              >
                <RefreshCw
                  size={20}
                  className={`text-gray-600 ${isLoadingQuote ? 'animate-spin' : ''}`}
                />
              </button>
              <SwapSettings slippage={slippage} onSlippageChange={setSlippage} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="bg-orange-50 rounded-xl p-4 space-y-3 border-2 border-orange-200">
              <div className="flex items-center justify-between">
                <label className="text-sm font-inter font-bold text-gray-800">
                  From
                </label>
                <div className="text-sm font-inter text-gray-700 font-semibold">
                  Balance: {PancakeSwapService.formatTokenAmount(balanceIn)}
                  {parseFloat(balanceIn) > 0 && (
                    <button
                      onClick={handleMaxClick}
                      className="ml-2 text-orange-600 hover:text-orange-700 font-bold"
                    >
                      MAX
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-2xl font-inter font-bold outline-none text-gray-900"
                />
                <div className="w-40">
                  <TokenSelector
                    selectedToken={tokenIn}
                    onSelectToken={setTokenIn}
                    label=""
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center -my-2 relative z-10">
              <button
                onClick={handleReverseTokens}
                className="bg-white p-2 rounded-lg border-4 border-orange-200 hover:border-orange-300 transition-colors shadow-md"
              >
                <ArrowDown size={20} className="text-orange-600" />
              </button>
            </div>

            <div className="bg-orange-50 rounded-xl p-4 space-y-3 border-2 border-orange-200">
              <div className="flex items-center justify-between">
                <label className="text-sm font-inter font-bold text-gray-800">
                  To
                </label>
                <div className="text-sm font-inter text-gray-700 font-semibold">
                  Balance: {PancakeSwapService.formatTokenAmount(balanceOut)}
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  {isLoadingQuote ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader size={20} className="animate-spin" />
                      <span className="text-lg font-inter">Loading...</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-inter font-bold text-gray-900">
                      {amountOut ? PancakeSwapService.formatTokenAmount(amountOut) : '0.0'}
                    </div>
                  )}
                </div>
                <div className="w-40">
                  <TokenSelector
                    selectedToken={tokenOut}
                    onSelectToken={setTokenOut}
                    label=""
                  />
                </div>
              </div>
            </div>
          </div>

          {quote && (
            <div className="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-xl p-4 space-y-2 text-sm font-inter border-2 border-orange-200">
              <div className="flex justify-between">
                <span className="text-gray-700 font-semibold">Rate:</span>
                <span className="font-bold text-gray-900">
                  1 {tokenIn?.symbol} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {tokenOut?.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-semibold">Minimum Received:</span>
                <span className="font-bold text-gray-900">
                  {PancakeSwapService.formatTokenAmount(quote.minimumReceived)} {tokenOut?.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-semibold">Slippage Tolerance:</span>
                <span className="font-bold text-gray-900">{slippage}%</span>
              </div>
            </div>
          )}

          {needsApproval && tokenIn?.address !== 'BNB' && (
            <Button
              onClick={handleApprove}
              disabled={isApproving || !isValidInput}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-4 rounded-xl font-inter font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-4 rounded-xl font-inter font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="font-inter font-bold text-green-900">
                    Transaction Successful!
                  </div>
                  <a
                    href={BscWalletService.getExplorerUrl(txHash, chainId || undefined)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-inter"
                  >
                    View on BscScan
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-white text-sm font-inter font-semibold drop-shadow">
          <p>Trade tokens in an instant with the best rates on BNB Smart Chain</p>
        </div>
      </div>
    </div>
  );
};
