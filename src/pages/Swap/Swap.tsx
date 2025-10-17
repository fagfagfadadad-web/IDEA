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
    const fetchBalances = async () => {
      if (!address || !tokenIn || !tokenOut) return;
      try {
        const [balIn, balOut] = await Promise.all([
          BscWalletService.getTokenBalance(address, tokenIn.address),
          BscWalletService.getTokenBalance(address, tokenOut.address),
        ]);
        setBalanceIn(balIn);
        setBalanceOut(balOut);
      } catch (e) {
        console.error('Balance fetch error', e);
      }
    };
    fetchBalances();
  }, [address, tokenIn, tokenOut]);

  const handleQuote = async (amount: string) => {
    if (!tokenIn || !tokenOut || !amount) return;
    try {
      setIsLoadingQuote(true);
      const quoteData = await PancakeSwapService.getQuote(tokenIn, tokenOut, amount);
      setQuote(quoteData);
      setAmountOut(quoteData.amountOut);
    } catch (err) {
      console.error('Quote error:', err);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const handleSwap = async () => {
    if (!tokenIn || !tokenOut || !amountIn) return;
    try {
      setIsSwapping(true);
      const tx = await PancakeSwapService.executeSwap(tokenIn, tokenOut, amountIn, slippage);
      setTxHash(tx.hash);
      success('Swap completed!');
    } catch (err: any) {
      showError(err.message || 'Swap failed');
    } finally {
      setIsSwapping(false);
    }
  };

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

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 pb-20 sm:pb-8 px-3 sm:px-4">
      <div className="container mx-auto py-6 sm:py-8 max-w-sm sm:max-w-lg">
        <div className="text-center mb-5 sm:mb-6 space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-inter font-bold text-white drop-shadow-lg">Token Swap</h1>
          <p className="text-white text-sm sm:text-base font-inter font-semibold drop-shadow">
            Powered by PancakeSwap
          </p>
          <div className="text-xs sm:text-sm font-inter text-white font-semibold drop-shadow opacity-90 break-all">
            {BscWalletService.formatBscAddress(address || '')}
          </div>
        </div>

        {/* === SWAP CARD === */}
        <div className="bg-white/90 rounded-2xl shadow-xl p-5 sm:p-6 space-y-4">
          {/* --- Token In --- */}
          <div className="flex flex-col items-center space-y-2 w-full">
            <TokenSelector
              selectedToken={tokenIn}
              onSelectToken={setTokenIn}
              balance={balanceIn}
              onAmountChange={(value) => {
                setAmountIn(value);
                handleQuote(value);
              }}
              amount={amountIn}
            />
          </div>

          <div className="flex justify-center">
            <ArrowDown className="text-orange-500" size={22} />
          </div>

          {/* --- Token Out --- */}
          <div className="flex flex-col items-center space-y-2 w-full">
            <TokenSelector
              selectedToken={tokenOut}
              onSelectToken={setTokenOut}
              balance={balanceOut}
              disabled
              amount={amountOut}
            />
          </div>

          {/* --- Slippage / Settings --- */}
          <div className="flex justify-center">
            <SwapSettings slippage={slippage} setSlippage={setSlippage} />
          </div>

          {/* --- Swap Button --- */}
          <Button
            onClick={handleSwap}
            disabled={isSwapping || !amountIn || !tokenIn || !tokenOut}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold py-3 rounded-xl font-inter"
          >
            {isSwapping ? (
              <div className="flex items-center justify-center gap-2">
                <Loader className="animate-spin" size={18} /> Swapping...
              </div>
            ) : (
              'Swap'
            )}
          </Button>

          {/* --- Transaction Link --- */}
          {txHash && (
            <div className="text-center text-xs sm:text-sm mt-3 break-all">
              <a
                href={`https://bscscan.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 font-semibold inline-flex items-center gap-1"
              >
                View on BscScan <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
