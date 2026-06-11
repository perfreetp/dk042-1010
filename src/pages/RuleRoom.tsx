import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { NeonButton } from '@/components/layout/NeonButton';
import { NeonCard } from '@/components/layout/NeonCard';
import { NeonToggle } from '@/components/layout/NeonToggle';
import { GlowSlider } from '@/components/layout/GlowSlider';
import { TRAP_TEMPLATES } from '@/data/traps';
import { ArrowLeft, ArrowRight, Save, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export const RuleRoom: React.FC = () => {
  const { setScreen, rules, updateRules, toggleTrap, presets, savePreset, loadPreset, deletePreset } = useGameStore();
  const [presetName, setPresetName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const roundOptions = [1, 3, 5];
  const winConditionOptions = [
    { value: 'ko', label: 'KO 制', desc: '累计击杀达到指定次数获胜' },
    { value: 'hp', label: '生命制', desc: '消灭对方全部斗士获胜' },
    { value: 'time', label: '时间制', desc: '时间结束时血量多者获胜' },
  ] as const;

  const handleSavePreset = () => {
    if (presetName.trim()) {
      savePreset(presetName.trim());
      setPresetName('');
      setShowSaveInput(false);
    }
  };

  return (
    <div className="w-full h-full bg-noise bg-grid overflow-auto">
      <div className="min-h-full p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <NeonButton variant="cyan" size="sm" onClick={() => setScreen('select')}>
            <span className="flex items-center gap-2">
              <ArrowLeft size={20} />
              返回选人
            </span>
          </NeonButton>
          
          <h1 className="font-orbitron text-4xl font-black">
            <span className="text-arena-purpleLight text-shadow-purple">规则</span>
            <span className="text-white mx-2">房间</span>
            <span className="text-arena-orange text-shadow-orange">配置</span>
          </h1>

          <NeonButton variant="gold" size="sm" onClick={() => setScreen('workshop')}>
            <span className="flex items-center gap-2">
              道具工坊
              <ArrowRight size={20} />
            </span>
          </NeonButton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 pb-6">
          <div className="lg:col-span-2 space-y-6">
            <NeonCard color="purple" className="p-6">
              <h2 className="font-orbitron text-2xl font-bold text-arena-purpleLight mb-6">⚙️ 基础规则</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="font-zcool text-white/80 text-lg mb-3 block">战斗回合数</label>
                  <div className="flex gap-2">
                    {roundOptions.map(round => (
                      <button
                        key={round}
                        onClick={() => updateRules({ rounds: round })}
                        className={cn(
                          'flex-1 py-3 rounded-xl font-orbitron font-bold text-xl transition-all',
                          rules.rounds === round
                            ? 'bg-arena-purpleLight text-white shadow-[0_0_15px_rgba(168,85,247,0.6)]'
                            : 'bg-arena-darker text-white/60 hover:text-white border border-white/20 hover:border-arena-purpleLight/50'
                        )}
                      >
                        {round} 回合
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-zcool text-white/80 text-lg mb-3 block">胜利条件</label>
                  <div className="flex flex-col gap-2">
                    {winConditionOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updateRules({ winCondition: opt.value, winValue: opt.value === 'ko' ? 2 : opt.value === 'time' ? 120 : 1 })}
                        className={cn(
                          'p-3 rounded-xl text-left transition-all',
                          rules.winCondition === opt.value
                            ? 'bg-arena-purpleLight/30 border-2 border-arena-purpleLight shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                            : 'bg-arena-darker border border-white/20 hover:border-arena-purpleLight/50'
                        )}
                      >
                        <div className="font-orbitron font-bold text-white">{opt.label}</div>
                        <div className="font-zcool text-white/60 text-sm">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {rules.winCondition === 'ko' && (
                  <div className="md:col-span-2">
                    <GlowSlider
                      label="KO 次数目标"
                      value={rules.winValue}
                      onChange={(v) => updateRules({ winValue: v })}
                      min={1}
                      max={10}
                      color="purple"
                    />
                  </div>
                )}

                {rules.winCondition === 'time' && (
                  <div className="md:col-span-2">
                    <GlowSlider
                      label="战斗时长 (秒)"
                      value={rules.winValue}
                      onChange={(v) => updateRules({ winValue: v, battleTime: v })}
                      min={30}
                      max={300}
                      step={10}
                      color="purple"
                    />
                  </div>
                )}
              </div>
            </NeonCard>

            <NeonCard color="orange" className="p-6">
              <h2 className="font-orbitron text-2xl font-bold text-arena-orange mb-6">🤖 AI 行为设置</h2>
              
              <div className="space-y-6">
                <GlowSlider
                  label="AI 激进程度"
                  value={rules.aiAggression}
                  onChange={(v) => updateRules({ aiAggression: v })}
                  color="orange"
                />
                <div className="flex justify-between text-sm font-zcool text-white/50">
                  <span>🛡️ 保守防御</span>
                  <span>⚖️ 均衡</span>
                  <span>⚔️ 激进进攻</span>
                </div>
              </div>
            </NeonCard>

            <NeonCard color="cyan" className="p-6">
              <h2 className="font-orbitron text-2xl font-bold text-arena-cyan mb-6">🪤 擂台机关</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {TRAP_TEMPLATES.map(trap => (
                  <div
                    key={trap.id}
                    className={cn(
                      'p-4 rounded-xl text-center transition-all cursor-pointer border-2',
                      rules.traps[trap.id]
                        ? 'bg-arena-cyan/10 border-arena-cyan shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                        : 'bg-arena-darker border-white/20 hover:border-arena-cyan/50'
                    )}
                    onClick={() => toggleTrap(trap.id)}
                  >
                    <div className="text-4xl mb-2">{trap.icon}</div>
                    <div className="font-zcool text-white text-sm mb-1">{trap.name}</div>
                    <div className="font-zcool text-white/50 text-xs">
                      {trap.damage ? `伤害: ${trap.damage}` : '特殊效果'}
                    </div>
                    <div className={cn(
                      'mt-2 font-orbitron text-xs font-bold',
                      rules.traps[trap.id] ? 'text-arena-cyan' : 'text-white/40'
                    )}>
                      {rules.traps[trap.id] ? '● 已启用' : '○ 已禁用'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                <NeonToggle
                  label="🎁 随机道具生成"
                  enabled={rules.randomItems}
                  onChange={(v) => updateRules({ randomItems: v })}
                  color="cyan"
                />
                {rules.randomItems && (
                  <GlowSlider
                    label="道具生成频率"
                    value={rules.itemSpawnRate}
                    onChange={(v) => updateRules({ itemSpawnRate: v })}
                    color="cyan"
                  />
                )}
                <NeonToggle
                  label="⚔️ 场景武器掉落"
                  enabled={rules.weaponSpawn}
                  onChange={(v) => updateRules({ weaponSpawn: v })}
                  color="cyan"
                />
              </div>
            </NeonCard>
          </div>

          <div className="space-y-6">
            <NeonCard color="gold" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-orbitron text-2xl font-bold text-arena-gold">💾 规则预设</h2>
                {!showSaveInput && (
                  <button
                    onClick={() => setShowSaveInput(true)}
                    className="p-2 rounded-lg bg-arena-gold/20 text-arena-gold hover:bg-arena-gold/30 transition-all"
                  >
                    <Plus size={20} />
                  </button>
                )}
              </div>

              {showSaveInput && (
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="输入预设名称..."
                    className="flex-1 px-4 py-2 rounded-lg bg-arena-darker border border-arena-gold/50 text-white font-zcool focus:outline-none focus:border-arena-gold"
                    onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                  />
                  <NeonButton variant="gold" size="sm" onClick={handleSavePreset}>
                    <Save size={18} />
                  </NeonButton>
                </div>
              )}

              {presets.length === 0 ? (
                <div className="text-center py-8 text-white/50 font-zcool">
                  <p className="text-4xl mb-2">📋</p>
                  <p>暂无保存的预设</p>
                  <p className="text-sm">点击上方 + 保存当前规则</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-auto pr-2">
                  {presets.map(preset => (
                    <div
                      key={preset.id}
                      className="p-3 rounded-xl bg-arena-darker border border-white/20 hover:border-arena-gold/50 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-orbitron font-bold text-white">{preset.name}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => loadPreset(preset.id)}
                            className="p-1.5 rounded bg-arena-cyan/20 text-arena-cyan hover:bg-arena-cyan/30"
                            title="加载预设"
                          >
                            <ArrowRight size={14} />
                          </button>
                          <button
                            onClick={() => deletePreset(preset.id)}
                            className="p-1.5 rounded bg-arena-red/20 text-arena-red hover:bg-arena-red/30"
                            title="删除预设"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-zcool text-white/60">
                        <span>{preset.rules.rounds} 回合</span>
                        <span>{preset.rules.winCondition === 'ko' ? 'KO制' : preset.rules.winCondition === 'hp' ? '生命制' : '时间制'}</span>
                        <span>AI: {preset.rules.aiAggression}%</span>
                        <span>{Object.values(preset.rules.traps).filter(Boolean).length} 机关</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </NeonCard>

            <div className="sticky bottom-0">
              <NeonButton variant="gold" size="lg" className="w-full text-xl" onClick={() => setScreen('workshop')}>
                <span className="flex items-center justify-center gap-3">
                  前往道具工坊
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
