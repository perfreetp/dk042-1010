import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { NeonButton } from '@/components/layout/NeonButton';
import { NeonCard } from '@/components/layout/NeonCard';
import { GlowSlider } from '@/components/layout/GlowSlider';
import { NeonToggle } from '@/components/layout/NeonToggle';
import { ITEMS } from '@/data/items';
import { WEAPONS } from '@/data/weapons';
import { ArrowLeft, ArrowRight, Swords, Package } from 'lucide-react';

export const ItemWorkshop: React.FC = () => {
  const { setScreen, itemRates, updateItemRate, weaponEnabled, toggleWeapon, selectedFighters } = useGameStore();

  return (
    <div className="w-full h-full bg-noise bg-grid overflow-auto">
      <div className="min-h-full p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <NeonButton variant="cyan" size="sm" onClick={() => setScreen('rules')}>
            <span className="flex items-center gap-2">
              <ArrowLeft size={20} />
              返回规则
            </span>
          </NeonButton>
          
          <h1 className="font-orbitron text-4xl font-black">
            <span className="text-arena-green text-shadow-cyan">道具</span>
            <span className="text-white mx-2">&</span>
            <span className="text-arena-orange text-shadow-orange">武器工坊</span>
          </h1>

          <NeonButton 
            variant="gold" 
            size="sm" 
            onClick={() => setScreen('battle')}
            disabled={selectedFighters.length < 2}
          >
            <span className="flex items-center gap-2">
              开始战斗！
              <Swords size={20} />
            </span>
          </NeonButton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 pb-6">
          <NeonCard color="cyan" className="p-6">
            <h2 className="font-orbitron text-2xl font-bold text-arena-green mb-6 flex items-center gap-3">
              <Package size={28} />
              道具出现频率
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ITEMS.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-arena-darker/50 border border-white/10"
                  style={{ borderColor: item.color + '40' }}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                      style={{
                        backgroundColor: item.color + '20',
                        border: `2px solid ${item.color}`,
                        boxShadow: `0 0 10px ${item.color}40`,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-orbitron font-bold text-white text-lg" style={{ color: item.color }}>
                        {item.name}
                      </div>
                      <div className="font-zcool text-white/60 text-sm leading-tight">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <GlowSlider
                    value={itemRates[item.id] ?? item.spawnRate}
                    onChange={(v) => updateItemRate(item.id, v)}
                    color="green"
                    max={100}
                  />
                </div>
              ))}
            </div>
          </NeonCard>

          <div className="space-y-6">
            <NeonCard color="orange" className="p-6">
              <h2 className="font-orbitron text-2xl font-bold text-arena-orange mb-6 flex items-center gap-3">
                <Swords size={28} />
                场景武器
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WEAPONS.map(weapon => (
                  <div
                    key={weapon.id}
                    className="p-4 rounded-xl transition-all"
                    style={{
                      backgroundColor: weaponEnabled[weapon.id] ? weapon.color + '15' : 'rgba(0,0,0,0.3)',
                      border: `2px solid ${weaponEnabled[weapon.id] ? weapon.color : 'rgba(255,255,255,0.1)'}`,
                      boxShadow: weaponEnabled[weapon.id] ? `0 0 15px ${weapon.color}30` : 'none',
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                          style={{
                            backgroundColor: weapon.color + '20',
                            border: `2px solid ${weapon.color}`,
                          }}
                        >
                          {weapon.icon}
                        </div>
                        <div>
                          <div className="font-orbitron font-bold text-white" style={{ color: weapon.color }}>
                            {weapon.name}
                          </div>
                          <div className="font-zcool text-white/50 text-xs">
                            伤害 +{weapon.damage} | 范围 {weapon.range}
                          </div>
                        </div>
                      </div>
                      <NeonToggle
                        enabled={weaponEnabled[weapon.id] ?? true}
                        onChange={() => toggleWeapon(weapon.id)}
                        color="orange"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </NeonCard>

            <NeonCard color="purple" className="p-6">
              <h2 className="font-orbitron text-2xl font-bold text-arena-purpleLight mb-4">
                📋 当前配置概览
              </h2>
              <div className="space-y-3 font-zcool text-white/80">
                <div className="flex justify-between">
                  <span>参赛斗士</span>
                  <span className="text-arena-cyan font-orbitron font-bold">{selectedFighters.length} 人</span>
                </div>
                <div className="flex justify-between">
                  <span>启用道具</span>
                  <span className="text-arena-green font-orbitron font-bold">
                    {ITEMS.filter(i => (itemRates[i.id] ?? i.spawnRate) > 0).length} 种
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>启用武器</span>
                  <span className="text-arena-orange font-orbitron font-bold">
                    {WEAPONS.filter(w => weaponEnabled[w.id]).length} 种
                  </span>
                </div>
              </div>
            </NeonCard>

            <div className="sticky bottom-0">
              <NeonButton variant="gold" size="lg" className="w-full text-xl" onClick={() => setScreen('battle')}>
                <span className="flex items-center justify-center gap-3">
                  ⚔️ 进入擂台，开始战斗！
                  <ArrowRight size={24} />
                </span>
              </NeonButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
