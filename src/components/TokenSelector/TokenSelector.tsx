import React, { useState } from 'react';
import { X, Search, ChevronDown } from 'lucide-react';
import { Token, POPULAR_TOKENS, BNB_TOKEN } from '../../services/pancakeSwapService';

interface TokenSelectorProps {
  selectedToken: Token | null;
  onSelectToken: (token: Token) => void;
  label?: string;
  disabled?: boolean;
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  onSelectToken,
  label = 'Select Token',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const allTokens = [BNB_TOKEN, ...POPULAR_TOKENS];

  const filteredTokens = allTokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectToken = (token: Token) => {
    onSelectToken(token);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
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

      {isOpen && !disabled && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-2xl border-2 border-purple-400 z-50 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-purple-400">
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-200"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search token name or symbol"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-purple-300 bg-white focus:border-yellow-300 outline-none font-inter placeholder-gray-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-80">
              {filteredTokens.length === 0 ? (
                <div className="p-8 text-center text-white font-inter font-semibold">
                  No tokens found
                </div>
              ) : (
                filteredTokens.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => handleSelectToken(token)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-400 transition-colors border-b border-purple-400 last:border-b-0 ${
                      selectedToken?.address === token.address
                        ? 'bg-purple-400'
                        : ''
                    }`}
                  >
                    {token.logoURI && (
                      <img
                        src={token.logoURI}
                        alt={token.symbol}
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 text-left">
                      <div className="font-inter font-bold text-white">
                        {token.symbol}
                      </div>
                      <div className="text-sm font-inter text-purple-100">
                        {token.name}
                      </div>
                    </div>
                    {selectedToken?.address === token.address && (
                      <div className="w-2 h-2 bg-yellow-300 rounded-full" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
