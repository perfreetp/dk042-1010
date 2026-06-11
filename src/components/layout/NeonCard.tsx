import React from 'react';
import { cn } from '@/lib/utils';

interface NeonCardProps {
  children: React.ReactNode;
  className?: string;
  color?: 'cyan' | 'purple' | 'orange' | 'gold';
  glow?: boolean;
  onClick?: () => void;
}

export const NeonCard: React.FC<NeonCardProps> = ({
  children,
  className = '',
  color = 'cyan',
  glow = true,
  onClick,
}) => {
  const colorClasses = {
    cyan: glow ? 'border-glow-cyan border-arena-cyan' : 'border-arena-cyan/50',
    purple: glow ? 'border-glow-purple border-arena-purpleLight' : 'border-arena-purpleLight/50',
    orange: glow ? 'border-glow-orange border-arena-orange' : 'border-arena-orange/50',
    gold: glow ? 'border border-arena-gold' : 'border border-arena-gold/50',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative bg-arena-dark/80 backdrop-blur-sm rounded-xl border-2 p-4 transition-all duration-300',
        colorClasses[color],
        onClick && 'cursor-pointer hover:scale-105',
        className
      )}
      style={{
        boxShadow: glow
          ? color === 'cyan'
            ? '0 0 15px rgba(6, 182, 212, 0.3), inset 0 0 15px rgba(6, 182, 212, 0.05)'
            : color === 'purple'
            ? '0 0 15px rgba(168, 85, 247, 0.3), inset 0 0 15px rgba(168, 85, 247, 0.05)'
            : color === 'orange'
            ? '0 0 15px rgba(249, 115, 22, 0.3), inset 0 0 15px rgba(249, 115, 22, 0.05)'
            : '0 0 15px rgba(251, 191, 36, 0.3), inset 0 0 15px rgba(251, 191, 36, 0.05)'
          : 'none',
      }}
    >
      {children}
    </div>
  );
};
