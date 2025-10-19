import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', size = 'md' }) => {
  const baseStyles = 'rounded-full font-medium';
  
  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-1 text-sm',
  };

  const variantStyles = {
    primary: 'bg-primary text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    danger: 'bg-red-500 text-white',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`}>
      {children}
    </span>
  );
};

