import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-primary hover:bg-blue-600 disabled:bg-neutral-300 text-white',
    secondary: 'bg-accent hover:bg-orange-600 disabled:bg-neutral-300 text-white',
    danger: 'bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 text-white',
    success: 'bg-green-600 hover:bg-green-700 disabled:bg-neutral-300 text-white',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

