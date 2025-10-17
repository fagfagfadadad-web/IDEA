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
            : 'bg-white border-orange-300 hover:border-orange-500 cursor-pointer'
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
              <div className="text-xs font-inter text-gray-500">
                {selectedToken.name}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-gray-500 font-inter">Select a token</span>
        )}
        {!disabled && <ChevronDown size={20} className="text-gray-400" />}
      </button>

      {isOpen && !disabled && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-orange-300 z-50 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search token name or symbol"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-orange-500 outline-none font-inter"
                  autoFocus
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-80">
              {filteredTokens.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-inter">
                  No tokens found
                </div>
              ) : (
                filteredTokens.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => handleSelectToken(token)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors ${
                      selectedToken?.address === token.address
                        ? 'bg-orange-100'
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
                      <div className="font-inter font-bold text-gray-900">
                        {token.symbol}
                      </div>
                      <div className="text-sm font-inter text-gray-500">
                        {token.name}
                      </div>
                    </div>
                    {selectedToken?.address === token.address && (
                      <div className="w-2 h-2 bg-orange-600 rounded-full" />
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
