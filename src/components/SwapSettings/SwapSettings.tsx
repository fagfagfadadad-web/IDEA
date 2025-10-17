import React, { useState } from 'react';
import { Settings, X } from 'lucide-react';

interface SwapSettingsProps {
  slippage: number;
  onSlippageChange: (slippage: number) => void;
}

export const SwapSettings: React.FC<SwapSettingsProps> = ({
  slippage,
  onSlippageChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customSlippage, setCustomSlippage] = useState(slippage.toString());

  const presetSlippages = [0.1, 0.5, 1.0];

  const handlePresetClick = (value: number) => {
    onSlippageChange(value);
    setCustomSlippage(value.toString());
  };

  const handleCustomChange = (value: string) => {
    setCustomSlippage(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 50) {
      onSlippageChange(numValue);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg hover:bg-purple-100 transition-colors"
        title="Swap Settings"
      >
        <Settings size={20} className="text-gray-600" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-inter font-bold text-gray-900">
                Swap Settings
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="font-inter font-bold text-gray-900">
                    Slippage Tolerance
                  </label>
                  <div className="text-sm font-inter text-gray-600">
                    {slippage}%
                  </div>
                </div>

                <div className="flex gap-2 mb-3">
                  {presetSlippages.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handlePresetClick(preset)}
                      className={`flex-1 px-4 py-2 rounded-lg font-inter font-bold transition-all ${
                        slippage === preset
                          ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    value={customSlippage}
                    onChange={(e) => handleCustomChange(e.target.value)}
                    placeholder="Custom"
                    min="0"
                    max="50"
                    step="0.1"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-purple-500 outline-none font-inter"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-inter">
                    %
                  </span>
                </div>

                <div className="mt-2 text-xs font-inter text-gray-500">
                  Your transaction will revert if the price changes unfavorably by more than this percentage.
                </div>
              </div>

              {slippage > 5 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-sm font-inter text-yellow-800">
                    <span className="font-bold">High Slippage Warning:</span> Your transaction may be frontrun due to high slippage tolerance.
                  </div>
                </div>
              )}

              {slippage < 0.1 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm font-inter text-red-800">
                    <span className="font-bold">Low Slippage Warning:</span> Your transaction may fail due to low slippage tolerance.
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-inter font-bold transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
