import React from 'react';
import { cn } from '@/lib/utils';

interface NeonToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  color?: 'cyan' | 'orange' | 'purple' | 'green';
  className?: string;
}

export const NeonToggle: React.FC<NeonToggleProps> = ({
  enabled,
  onChange,
  label,
  color = 'cyan',
  className = '',
}) => {
  const colorStyles = {
    cyan: {
      bg: 'bg-arena-cyan',
      glow: 'shadow-[0_0_10px_rgba(6,182,212,0.6)]',
      text: 'text-arena-cyan',
    },
    orange: {
      bg: 'bg-arena-orange',
      glow: 'shadow-[0_0_10px_rgba(249,115,22,0.6)]',
      text: 'text-arena-orange',
    },
    purple: {
      bg: 'bg-arena-purpleLight',
      glow: 'shadow-[0_0_10px_rgba(168,85,247,0.6)]',
      text: 'text-arena-purpleLight',
    },
    green: {
      bg: 'bg-arena-green',
      glow: 'shadow-[0_0_10px_rgba(34,197,94,0.6)]',
      text: 'text-arena-green',
    },
  };

  const styles = colorStyles[color];

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      {label && <span className="text-white/80 font-zcool text-base">{label}</span>}
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={cn(
          'relative w-14 h-7 rounded-full transition-all duration-300',
          enabled ? styles.bg : 'bg-arena-darker border border-white/20',
          enabled && styles.glow
        )}
      >
        <div
          className={cn(
            'absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300',
            enabled ? 'left-8' : 'left-1',
            enabled && styles.glow
          )}
        />
      </button>
    </div>
  );
};
