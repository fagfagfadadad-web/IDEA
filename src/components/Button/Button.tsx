import { MouseEvent, PropsWithChildren } from 'react';
import { WithClassnameType } from 'types';

interface ButtonType extends WithClassnameType, PropsWithChildren {
  onClick?: (e: MouseEvent) => void;
  disabled?: boolean;
  dataTestId?: string;
  dataCy?: string;
  id?: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'gradient' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = ({
  children,
  onClick,
  disabled = false,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  id,
  className,
  ...otherProps
}: ButtonType) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'gradient':
        return 'gradient-button';
      case 'secondary':
        return 'mobile-button-secondary';
      case 'outline':
        return 'border-2 border-indigo-600 text-indigo-600 bg-transparent hover:bg-indigo-50';
      default:
        return 'mobile-button-primary';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2 text-sm';
      case 'lg':
        return 'px-8 py-4 text-lg';
      default:
        return 'px-6 py-3 text-base';
    }
  };

  const baseClasses = `
    inline-flex items-center justify-center gap-2 font-semibold rounded-lg
    transition-all duration-200 touch-manipulation
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
    ${fullWidth ? 'w-full' : 'w-auto'}
    ${getSizeClasses()}
    ${getVariantClasses()}
  `;

  if (variant === 'gradient') {
    return (
      <div className={`${baseClasses} ${className || ''}`}>
        <button
          id={id}
          {...otherProps}
          disabled={disabled}
          onClick={onClick}
          className="gradient-button-inner"
          type={type}
        >
          {children}
          <svg
            aria-hidden="true"
            viewBox="0 0 10 10"
            height="10"
            width="10"
            fill="none"
            className="gradient-button-arrow"
          >
            <path
              d="M0 5h7"
              className="gradient-button-arrow-line"
            />
            <path
              d="M1 1l4 4-4 4"
              className="gradient-button-arrow-path"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <button
      id={id}
      {...otherProps}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${className || ''}`}
      type={type}
    >
      {children}
    </button>
  );
};