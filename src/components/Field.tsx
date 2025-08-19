import React, { ReactNode } from 'react';

interface FieldProps {
  label: string;
  children: ReactNode;
  error?: string;
  required?: boolean;
  description?: string;
}

export const Field: React.FC<FieldProps> = ({ 
  label, 
  children, 
  error, 
  required = false,
  description 
}) => {
  return (
    <div className="mb-6">
      <label className="block mb-2">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-sm font-medium text-gray-300">
            {label}
          </span>
          {required && (
            <span className="text-red-400 text-sm">*</span>
          )}
        </div>
        {description && (
          <p className="text-xs text-gray-400 mb-2">{description}</p>
        )}
        <div className="w-full">
          {children}
        </div>
      </label>
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};