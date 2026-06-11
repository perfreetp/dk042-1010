import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { FIGHTERS } from '@/data/fighters';
import { FighterCard } from '@/components/fighter/FighterCard';
import { NeonButton } from '@/components/layout/NeonButton';
import { NeonCard } from '@/components/layout/NeonCard';
import { NeonToggle } from '@/components/layout/NeonToggle';
import { ArrowLeft, ArrowRight, Users, Bot, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { shuffle, randomChoice } from '@/utils/math';

export const CharacterSelect: React.FC = () => {
  const { setScreen, selectedFighters, playerTeams, selectFighter, deselectFighter, clearSelectedFighters, aiDifficulty, setAIDifficulty, updateRules } = useGameStore();
  const [showDifficulty, setShowDifficulty] = useState(false);

  const maxFighters = 4;
  const minFighters = 2;

  const handleFighterClick = (fighterId: string) => {
    if (selectedFighters.includes(fighterId)) {
      deselectFighter(fighterId);
    } else if (selectedFighters.length < maxFighters) {
      const team = selectedFighters.length % 2;
      selectFighter(fighterId, team);
    }
  };

  const handleRandomSelect = () => {
    clearSelectedFighters();
    const shuffled = shuffle([...FIGHTERS]);
    const count = Math.min(4, Math.max(2, Math.floor(Math.random() * 3) + 2));
    shuffled.slice(0, count).forEach((f, i) => {
      selectFighter(f.id, i % 2);
    });
  };

  const handleStart = () => {
    if (selectedFighters.length >= minFighters) {
      updateRules({ playerCount: selectedFighters.length });
      setScreen('rules');
    }
  };

  const canStart = selectedFighters.length >= minFighters;

  return (
    <div className="w-full h-full bg-noise bg-grid overflow-auto">
      <div className="min-h-full p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <NeonButton variant="cyan" size="sm" onClick={() => setScreen('menu')}>
            <span className="flex items-center gap-2">
              <ArrowLeft size={20} />
              返回主菜单
            </span>
          </NeonButton>
          
          <h1 className="font-orbitron text-4xl font-black">
            <span className="text-arena-cyan text-shadow-cyan">选择</span>
            <span className="text-white mx-2">你的</span>
            <span className="text-arena-orange text-shadow-orange">斗士</span>
          </h1>

          <div className="flex items-center gap-3">
            <NeonButton variant="purple" size="sm" onClick={handleRandomSelect}>
              <span className="flex items-center gap-2">
                <Shuffle size={20} />
                随机选人
              </span>
            </NeonButton>
            <NeonButton
              variant="gold"
              size="sm"
              onClick={handleStart}
              disabled={!canStart}
            >
              <span className="flex items-center gap-2">
                下一步
                <ArrowRight size={20} />
              </span>
            </NeonButton>
          </div>
        </div>

        <div className="mb-6">
          <NeonCard color="cyan" className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <Users className="text-arena-cyan" size={24} />
                  <span className="font-zcool text-white text-lg">
                    已选择: <span className="text-arena-cyan font-orbitron font-bold">{selectedFighters.length}</span> / {maxFighters} 名斗士
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[0, 1].map(team => (
                    <div key={team} className={cn(
                      'flex items-center gap-2 px-4 py-1 rounded-full',
                      team === 0 ? 'bg-arena-cyan/20 border border-arena-cyan' : 'bg-arena-orange/20 border border-arena-orange'
                    )}>
                      <span className={cn('font-orbitron font-bold', team === 0 ? 'text-arena-cyan' : 'text-arena-orange')}>
                        队伍 {team + 1}
                      </span>
                      <span className="text-white font-bold">
                        {selectedFighters.filter(f => playerTeams[f] === team).length}人
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <NeonToggle
                  label={<span className="flex items-center gap-2"><Bot size={18} />AI 对战模式</span> as any}
                  enabled={showDifficulty}
                  onChange={setShowDifficulty}
                  color="purple"
                />
                {showDifficulty && (
                  <div className="flex items-center gap-2">
                    {(['easy', 'normal', 'hard'] as const).map(diff => (
                      <button
                        key={diff}
                        onClick={() => setAIDifficulty(diff)}
                        className={cn(
                          'px-4 py-1 rounded-lg font-orbitron font-bold text-sm transition-all',
                          aiDifficulty === diff
                            ? 'bg-arena-purpleLight text-white shadow-[0_0_10px_rgba(168,85,247,0.6)]'
                            : 'bg-arena-darker text-white/60 hover:text-white border border-white/20'
                        )}
                      >
                        {diff === 'easy' ? '简单' : diff === 'normal' ? '普通' : '困难'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </NeonCard>
        </div>

        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
          {FIGHTERS.map(fighter => {
            const isSelected = selectedFighters.includes(fighter.id);
            const team = isSelected ? playerTeams[fighter.id] : undefined;
            return (
              <FighterCard
                key={fighter.id}
                fighter={fighter}
                selected={isSelected}
                team={team}
                onClick={() => handleFighterClick(fighter.id)}
              />
            );
          })}
        </div>

        {!canStart && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
            <div className="bg-arena-red/20 border-2 border-arena-red rounded-xl px-6 py-3">
              <p className="font-zcool text-arena-red text-lg">
                ⚠️ 至少选择 {minFighters} 名斗士才能开始对战（当前已选 {selectedFighters.length} 名）
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
