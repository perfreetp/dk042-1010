import React from 'react';
import { Fighter } from '@/engine/types';
import { NeonCard } from '@/components/layout/NeonCard';
import { cn } from '@/lib/utils';

interface FighterCardProps {
  fighter: Fighter;
  selected?: boolean;
  onClick?: () => void;
  team?: number;
  showStats?: boolean;
}

const personalityLabels: Record<string, { label: string; color: string }> = {
  aggressive: { label: '激进', color: 'text-arena-red' },
  defensive: { label: '防御', color: 'text-arena-cyan' },
  balanced: { label: '均衡', color: 'text-arena-green' },
  tricky: { label: '狡猾', color: 'text-arena-purpleLight' },
  loyal: { label: '忠诚', color: 'text-arena-gold' },
  betrayer: { label: '背叛', color: 'text-arena-orange' },
};

const teamColors = ['border-arena-cyan', 'border-arena-orange', 'border-arena-green', 'border-arena-purpleLight'];
const teamBgColors = ['bg-arena-cyan/20', 'bg-arena-orange/20', 'bg-arena-green/20', 'bg-arena-purpleLight/20'];

export const FighterCard: React.FC<FighterCardProps> = ({
  fighter,
  selected = false,
  onClick,
  team,
  showStats = true,
}) => {
  const personality = personalityLabels[fighter.personality];

  return (
    <NeonCard
      onClick={onClick}
      color={selected ? (team !== undefined ? (['cyan', 'orange', 'purple', 'gold'] as const)[Math.min(team, 3)] : 'gold') : 'cyan'}
      className={cn(
        'w-full h-full min-h-[280px]',
        selected && team !== undefined && teamColors[team] && teamBgColors[team],
        'hover:scale-[1.02]'
      )}
    >
      <div className="flex flex-col items-center gap-3 h-full">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-5xl animate-float"
          style={{
            backgroundColor: fighter.color + '30',
            boxShadow: `0 0 20px ${fighter.color}60`,
            border: `3px solid ${fighter.color}`,
          }}
        >
          {fighter.avatar}
        </div>

        <h3 className="font-orbitron font-bold text-xl text-white text-center" style={{ textShadow: `0 0 10px ${fighter.color}` }}>
          {fighter.name}
        </h3>

        <span className={cn('font-zcool text-sm', personality.color)}>
          【{personality.label}】
        </span>

        <p className="text-white/60 font-zcool text-xs text-center leading-relaxed">
          {fighter.personalityDesc}
        </p>

        {showStats && (
          <div className="w-full space-y-2 mt-2">
            <StatBar label="生命" value={fighter.stats.hp} max={1200} color="#ef4444" />
            <StatBar label="攻击" value={fighter.stats.attack} max={100} color="#f97316" />
            <StatBar label="防御" value={fighter.stats.defense} max={100} color="#3b82f6" />
            <StatBar label="速度" value={fighter.stats.speed} max={100} color="#22c55e" />
            <StatBar label="能量" value={fighter.stats.energy} max={100} color="#a855f7" />
          </div>
        )}

        <div className="mt-auto pt-2 border-t border-white/10 w-full">
          <p className="text-arena-gold font-orbitron text-sm font-bold text-center">
            ✦ {fighter.specialName}
          </p>
          <p className="text-white/50 font-zcool text-xs text-center mt-1">
            {fighter.specialDesc}
          </p>
        </div>
      </div>
    </NeonCard>
  );
};

const StatBar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => {
  const percent = (value / max) * 100;
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/70 font-zcool text-xs w-8">{label}</span>
      <div className="flex-1 h-2 bg-arena-darker rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: color, boxShadow: `0 0 5px ${color}` }}
        />
      </div>
      <span className="text-white/70 font-orbitron text-xs w-8 text-right">{value}</span>
    </div>
  );
};
