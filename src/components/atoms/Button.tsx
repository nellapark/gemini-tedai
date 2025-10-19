import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-6',
    lg: 'py-4 px-8 text-lg',
  };
  
  const baseStyles = 'font-semibold rounded-lg transition-colors flex items-center justify-center disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-primary hover:bg-blue-600 disabled:bg-neutral-300 text-white',
    secondary: 'bg-accent hover:bg-orange-600 disabled:bg-neutral-300 text-white',
    danger: 'bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 text-white',
    success: 'bg-green-600 hover:bg-green-700 disabled:bg-neutral-300 text-white',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

