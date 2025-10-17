import React, { useState, useEffect } from "react";
import {
  ArrowDown,
  Wallet,
  ExternalLink,
  Loader,
} from "lucide-react";
import { Button } from "components";
import { TokenSelector } from "../../components/TokenSelector";
import { SwapSettings } from "../../components/SwapSettings";
import { useBscWallet } from "../../hooks/useBscWallet";
import { BscWalletService } from "../../services/bscWalletService";
import {
  PancakeSwapService,
  Token,
  SwapQuote,
  BNB_TOKEN,
  POPULAR_TOKENS,
} from "../../services/pancakeSwapService";
import { useToast } from "../../context/ToastContext";

export const Swap: React.FC = () => {
  const { address, isConnected, connectWallet } = useBscWallet();
  const { success, error: showError } = useToast();

  const [tokenIn, setTokenIn] = useState<Token | null>(BNB_TOKEN);
  const [tokenOut, setTokenOut] = useState<Token | null>(POPULAR_TOKENS[0]);
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [balanceIn, setBalanceIn] = useState("0");
  const [balanceOut, setBalanceOut] = useState("0");
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
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
        console.error("Balance fetch error", e);
      }
    };
    fetchBalances();
  }, [address, tokenIn, tokenOut]);

  const handleQuote = async (value: string) => {
    if (!tokenIn || !tokenOut || !value) return;
    try {
      setIsLoadingQuote(true);
      const quote = await PancakeSwapService.getQuote(tokenIn, tokenOut, value);
      setAmountOut(quote.amountOut);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const handleMaxClick = () => {
    setAmountIn(balanceIn);
    handleQuote(balanceIn);
  };

  const handleSwap = async () => {
    if (!tokenIn || !tokenOut || !amountIn) return;
    try {
      setIsSwapping(true);
      const tx = await PancakeSwapService.executeSwap(
        tokenIn,
        tokenOut,
        amountIn,
        slippage
      );
      setTxHash(tx.hash);
      success("Swap completed!");
    } catch (err: any) {
      showError(err.message || "Swap failed");
    } finally {
      setIsSwapping(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 flex items-center justify-center px-4">
        <div className="bg-white/90 rounded-2xl shadow-xl p-8 text-center space-y-6">
          <Wallet size={48} className="mx-auto text-orange-600" />
          <h2 className="text-2xl font-bold text-gray-900 font-inter">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 text-sm font-inter">
            Connect your MetaMask wallet to start swapping tokens on PancakeSwap
          </p>
          <Button
            onClick={connectWallet}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold py-3 rounded-xl"
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 overflow-x-hidden px-3 pb-10">
      <div className="container mx-auto py-6 max-w-sm sm:max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            Token Swap
          </h1>
          <p className="text-sm text-white font-semibold">
            Powered by PancakeSwap
          </p>
          <div className="text-xs text-white opacity-80 break-all">
            {BscWalletService.formatBscAddress(address || "")}
          </div>
        </div>

        <div className="bg-white/90 rounded-2xl shadow-xl p-5 space-y-4">
          {/* === From === */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-3 border-2 border-purple-500 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white">From</label>
              <div className="text-xs text-white">
                Balance: {balanceIn}
                {parseFloat(balanceIn) > 0 && (
                  <button
                    onClick={handleMaxClick}
                    className="ml-2 text-yellow-300 hover:text-yellow-200 font-bold"
                  >
                    MAX
                  </button>
                )}
              </div>
            </div>

            {/* ✅ Zarovnanie opravené */}
            <div className="flex items-center justify-between gap-2">
              <input
                type="number"
                value={amountIn}
                onChange={(e) => {
                  setAmountIn(e.target.value);
                  handleQuote(e.target.value);
                }}
                placeholder="0.0"
                className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-purple-300"
              />
              <div className="flex items-center justify-center w-auto">
                <TokenSelector
                  selectedToken={tokenIn}
                  onSelectToken={setTokenIn}
                  label=""
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="text-orange-500" size={24} />
          </div>

          {/* === To === */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-3 border-2 border-purple-500 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white">To</label>
              <div className="text-xs text-white">Balance: {balanceOut}</div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={amountOut}
                readOnly
                placeholder="0.0"
                className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-purple-300"
              />
              <div className="flex items-center justify-center w-auto">
                <TokenSelector
                  selectedToken={tokenOut}
                  onSelectToken={setTokenOut}
                  label=""
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <SwapSettings slippage={slippage} setSlippage={setSlippage} />
          </div>

          <Button
            onClick={handleSwap}
            disabled={isSwapping || !amountIn}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold py-3 rounded-xl"
          >
            {isSwapping ? (
              <div className="flex items-center justify-center gap-2">
                <Loader className="animate-spin" size={18} /> Swapping...
              </div>
            ) : (
              "Enter Amount"
            )}
          </Button>

          {txHash && (
            <div className="text-center text-xs mt-3 break-all">
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
