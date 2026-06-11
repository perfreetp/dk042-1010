import React from 'react';
import { cn } from '@/lib/utils';

interface GlowSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  color?: 'cyan' | 'orange' | 'purple' | 'green';
  className?: string;
}

export const GlowSlider: React.FC<GlowSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  color = 'cyan',
  className = '',
}) => {
  const colorStyles = {
    cyan: {
      track: 'bg-arena-cyan',
      glow: 'shadow-[0_0_10px_rgba(6,182,212,0.5)]',
      text: 'text-arena-cyan',
    },
    orange: {
      track: 'bg-arena-orange',
      glow: 'shadow-[0_0_10px_rgba(249,115,22,0.5)]',
      text: 'text-arena-orange',
    },
    purple: {
      track: 'bg-arena-purpleLight',
      glow: 'shadow-[0_0_10px_rgba(168,85,247,0.5)]',
      text: 'text-arena-purpleLight',
    },
    green: {
      track: 'bg-arena-green',
      glow: 'shadow-[0_0_10px_rgba(34,197,94,0.5)]',
      text: 'text-arena-green',
    },
  };

  const styles = colorStyles[color];
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-white/80 font-zcool text-sm">{label}</span>}
          {showValue && (
            <span className={cn('font-orbitron font-bold text-lg', styles.text)}>{value}</span>
          )}
        </div>
      )}
      <div className="relative h-3 bg-arena-darker rounded-full overflow-hidden">
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-150', styles.track, styles.glow)}
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full transition-all duration-150 pointer-events-none',
            styles.track,
            styles.glow
          )}
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
      </div>
    </div>
  );
};
