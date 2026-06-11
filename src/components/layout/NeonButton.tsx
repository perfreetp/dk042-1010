import React from 'react';
import { cn } from '@/lib/utils';

interface NeonButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'cyan' | 'orange' | 'purple' | 'gold' | 'red';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  onClick,
  variant = 'cyan',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
}) => {
  const variantClasses = {
    cyan: 'neon-btn',
    orange: 'neon-btn neon-btn-orange',
    purple: 'neon-btn neon-btn-purple',
    gold: 'neon-btn neon-btn-gold',
    red: 'neon-btn neon-btn-orange',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed hover:transform-none',
        'font-orbitron font-bold uppercase tracking-wider rounded-lg transition-all duration-300',
        className
      )}
    >
      {children}
    </button>
  );
};
