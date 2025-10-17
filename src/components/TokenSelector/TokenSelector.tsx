import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, ChevronDown } from 'lucide-react';
import { Token, POPULAR_TOKENS, BNB_TOKEN, PUPFI_TOKEN } from '../../services/pancakeSwapService';

interface TokenSelectorProps {
  selectedToken: Token | null;
  onSelectToken: (token: Token) => void;
  label?: string;
  disabled?: boolean;
}

const QUICK_SELECT_TOKENS = [BNB_TOKEN, PUPFI_TOKEN, POPULAR_TOKENS[2], POPULAR_TOKENS[3]];

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  onSelectToken,
  label = 'Select Token',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const allTokens = [BNB_TOKEN, ...POPULAR_TOKENS];

  const filteredTokens = allTokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectToken = (token: Token) => {
    onSelectToken(token);
    setIsOpen(false);
    setSearchQuery('');
  };

  const modalContent = isOpen && !disabled && (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-md max-h-[85vh] bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border-2 border-purple-500 z-[9999] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
              <h3 className="text-xl font-inter font-bold text-white">Select Token</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4 space-y-3 flex-shrink-0">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name or paste address"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-700 bg-gray-800 text-white focus:border-purple-500 outline-none font-inter placeholder-gray-500 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <p className="text-xs font-inter font-semibold text-gray-400 mb-2">Popular tokens</p>
                <div className="flex gap-2 flex-wrap">
                  {QUICK_SELECT_TOKENS.map((token) => (
                    <button
                      key={token.address}
                      onClick={() => handleSelectToken(token)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-purple-500 transition-all"
                    >
                      {token.logoURI && (
                        <img
                          src={token.logoURI}
                          alt={token.symbol}
                          className="w-5 h-5 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <span className="font-inter font-bold text-white text-xs">
                        {token.symbol}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 border-t border-gray-700">
              {filteredTokens.length === 0 ? (
                <div className="p-8 text-center text-gray-400 font-inter text-sm">
                  No tokens found
                </div>
              ) : (
                filteredTokens.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => handleSelectToken(token)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-b-0 ${
                      selectedToken?.address === token.address
                        ? 'bg-gray-800'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {token.logoURI && (
                        <img
                          src={token.logoURI}
                          alt={token.symbol}
                          className="w-9 h-9 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="text-left">
                        <div className="font-inter font-bold text-white text-sm">
                          {token.symbol}
                        </div>
                        <div className="text-xs font-inter text-gray-400">
                          {token.name}
                        </div>
                      </div>
                    </div>
                    {selectedToken?.address === token.address && (
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
  );

  return (
    <>
      <div className="relative">
        <label className="block text-sm font-inter font-bold text-gray-700 mb-2">
          {label}
        </label>

        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
            disabled
              ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
              : 'bg-white border-purple-300 hover:border-purple-400 cursor-pointer'
          }`}
        >
          {selectedToken ? (
            <div className="flex items-center gap-3">
              {selectedToken.logoURI && (
                <img
                  src={selectedToken.logoURI}
                  alt={selectedToken.symbol}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="text-left">
                <div className="font-inter font-bold text-gray-900">
                  {selectedToken.symbol}
                </div>
                <div className="text-xs font-inter text-gray-600">
                  {selectedToken.name}
                </div>
              </div>
            </div>
          ) : (
            <span className="text-gray-600 font-inter font-semibold">Select a token</span>
          )}
          {!disabled && <ChevronDown size={20} className="text-gray-600" />}
        </button>
      </div>

      {typeof window !== 'undefined' && modalContent && createPortal(modalContent, document.body)}
    </>
  );
};
