import React from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ 
  value, 
  onChange, 
  label 
}) => {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-20 rounded-lg border border-gray-600 bg-gray-800 cursor-pointer"
      />
      <div className="flex-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#4f46e5"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      {label && (
        <span className="text-sm text-gray-400 min-w-0 flex-shrink-0">
          {label}
        </span>
      )}
    </div>
  );
};