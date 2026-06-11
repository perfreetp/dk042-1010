import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { NeonButton } from '@/components/layout/NeonButton';
import { NeonCard } from '@/components/layout/NeonCard';
import { getFighterById } from '@/data/fighters';
import { ArrowLeft, Trophy, Medal, Award, Star, Smile, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'ranking' | 'titles' | 'emotes' | 'proficiency';

export const SeasonRanking: React.FC = () => {
  const { setScreen, rankings, titles, emotes, proficiencies } = useGameStore();
  const [activeTab, setActiveTab] = useState<TabType>('ranking');

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'ranking', label: '胜率排行', icon: <Trophy size={20} /> },
    { id: 'titles', label: '称号收集', icon: <Award size={20} /> },
    { id: 'emotes', label: '表情收藏', icon: <Smile size={20} /> },
    { id: 'proficiency', label: '角色熟练度', icon: <TrendingUp size={20} /> },
  ];

  const sortedRankings = [...rankings].sort((a, b) => {
    const winRateA = a.wins / (a.wins + a.losses) || 0;
    const winRateB = b.wins / (b.wins + b.losses) || 0;
    if (winRateB !== winRateA) return winRateB - winRateA;
    return b.wins - a.wins;
  });

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
            <span className="text-arena-gold text-shadow-gold">🏆 赛季</span>
            <span className="text-white mx-2">排行榜</span>
          </h1>

          <div className="w-[140px]" />
        </div>

        <div className="flex gap-2 mb-6 justify-center">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-xl font-orbitron font-bold transition-all',
                activeTab === tab.id
                  ? 'bg-arena-gold/20 text-arena-gold border-2 border-arena-gold shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                  : 'bg-arena-darker text-white/60 border-2 border-white/10 hover:border-white/30 hover:text-white'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          {activeTab === 'ranking' && (
            <NeonCard color="gold" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-orbitron text-2xl font-bold text-arena-gold flex items-center gap-3">
                  <Trophy size={28} />
                  斗士胜率榜
                </h2>
                <div className="text-white/60 font-zcool">
                  共 {rankings.length} 位斗士
                </div>
              </div>

              <div className="space-y-3">
                {sortedRankings.map((record, index) => {
                  const fighter = getFighterById(record.fighterId);
                  if (!fighter) return null;
                  const totalGames = record.wins + record.losses;
                  const winRate = totalGames > 0 ? ((record.wins / totalGames) * 100).toFixed(1) : '0.0';
                  const kda = record.deaths > 0 ? ((record.kills + record.totalDamage / 100) / record.deaths).toFixed(2) : record.kills.toFixed(2);

                  const rankIcons = ['🥇', '🥈', '🥉'];
                  const isTop3 = index < 3;

                  return (
                    <div
                      key={record.fighterId}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-xl transition-all',
                        isTop3
                          ? 'bg-gradient-to-r from-arena-gold/20 to-transparent border-2 border-arena-gold/50'
                          : 'bg-arena-darker/50 border border-white/10 hover:border-white/30'
                      )}
                    >
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center font-orbitron font-black text-2xl',
                        isTop3
                          ? 'bg-arena-gold/30 text-arena-gold'
                          : 'bg-arena-darker text-white/50'
                      )}>
                        {isTop3 ? rankIcons[index] : index + 1}
                      </div>

                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl"
                        style={{
                          backgroundColor: fighter.color + '20',
                          border: `2px solid ${fighter.color}`,
                          boxShadow: `0 0 15px ${fighter.color}40`,
                        }}
                      >
                        {fighter.avatar}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-orbitron font-bold text-xl text-white">{fighter.name}</h3>
                          <span className="font-zcool text-sm" style={{ color: fighter.color }}>
                            {fighter.personality === 'aggressive' ? '激进' : fighter.personality === 'defensive' ? '防御' : fighter.personality === 'balanced' ? '均衡' : fighter.personality === 'tricky' ? '狡猾' : fighter.personality === 'loyal' ? '忠诚' : '背叛'}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-white/50 font-zcool">胜场 </span>
                            <span className="text-arena-green font-orbitron font-bold">{record.wins}</span>
                          </div>
                          <div>
                            <span className="text-white/50 font-zcool">败场 </span>
                            <span className="text-arena-red font-orbitron font-bold">{record.losses}</span>
                          </div>
                          <div>
                            <span className="text-white/50 font-zcool">胜率 </span>
                            <span className="text-arena-gold font-orbitron font-bold">{winRate}%</span>
                          </div>
                          <div>
                            <span className="text-white/50 font-zcool">KDA </span>
                            <span className="text-arena-cyan font-orbitron font-bold">{kda}</span>
                          </div>
                        </div>
                      </div>

                      <div className="w-32">
                        <div className="text-right text-xs font-zcool text-white/50 mb-1">胜率</div>
                        <div className="h-3 bg-arena-darker rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${winRate}%`,
                              background: `linear-gradient(90deg, ${fighter.color}, #fbbf24)`,
                              boxShadow: `0 0 10px ${fighter.color}`,
                            }}
                          />
                        </div>
                        <div className="text-right font-orbitron font-bold text-arena-gold mt-1">{winRate}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </NeonCard>
          )}

          {activeTab === 'titles' && (
            <NeonCard color="purple" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-orbitron text-2xl font-bold text-arena-purpleLight flex items-center gap-3">
                  <Award size={28} />
                  称号收集
                </h2>
                <div className="text-white/60 font-zcool">
                  已解锁 {titles.filter(t => t.unlocked).length} / {titles.length}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {titles.map(title => (
                  <div
                    key={title.id}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all',
                      title.unlocked
                        ? 'bg-arena-purple/20 border-arena-purpleLight shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'bg-arena-darker/50 border-white/10 opacity-60'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-14 h-14 rounded-xl flex items-center justify-center text-3xl',
                        title.unlocked ? 'bg-arena-purple/30' : 'bg-arena-darker grayscale'
                      )}>
                        {title.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className={cn(
                          'font-orbitron font-bold text-lg mb-1',
                          title.unlocked ? 'text-arena-purpleLight' : 'text-white/50'
                        )}>
                          {title.name}
                          {title.unlocked && <Medal className="inline ml-2 text-arena-gold" size={16} />}
                        </h3>
                        <p className="font-zcool text-white/60 text-sm mb-2">{title.description}</p>
                        <div className="h-2 bg-arena-darker rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-arena-purpleLight transition-all"
                            style={{ width: `${Math.min(100, (title.progress / title.target) * 100)}%` }}
                          />
                        </div>
                        <div className="text-xs font-orbitron text-white/50 mt-1">
                          {title.condition}: {title.progress} / {title.target}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </NeonCard>
          )}

          {activeTab === 'emotes' && (
            <NeonCard color="orange" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-orbitron text-2xl font-bold text-arena-orange flex items-center gap-3">
                  <Smile size={28} />
                  表情收藏
                </h2>
                <div className="text-white/60 font-zcool">
                  已解锁 {emotes.filter(e => e.unlocked).length} / {emotes.length}
                </div>
              </div>

              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {emotes.map(emote => (
                  <div
                    key={emote.id}
                    className={cn(
                      'aspect-square rounded-xl flex flex-col items-center justify-center border-2 transition-all p-2',
                      emote.unlocked
                        ? 'bg-arena-orange/10 border-arena-orange hover:scale-105 cursor-pointer shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                        : 'bg-arena-darker/50 border-white/10 grayscale opacity-50'
                    )}
                  >
                    <div className="text-4xl mb-1">{emote.icon}</div>
                    <div className={cn(
                      'text-xs font-zcool text-center',
                      emote.unlocked ? 'text-white' : 'text-white/30'
                    )}>
                      {emote.unlocked ? emote.name : '???'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-arena-darker/50 rounded-xl border border-white/10">
                <p className="font-zcool text-white/70 text-center">
                  💡 提示：赢得更多战斗可解锁新表情，每赢 3 场解锁一个新表情！
                </p>
              </div>
            </NeonCard>
          )}

          {activeTab === 'proficiency' && (
            <NeonCard color="cyan" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-orbitron text-2xl font-bold text-arena-cyan flex items-center gap-3">
                  <Star size={28} />
                  角色熟练度
                </h2>
                <div className="text-white/60 font-zcool">
                  使用角色获得经验提升等级
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {proficiencies.map(prof => {
                  const fighter = getFighterById(prof.fighterId);
                  if (!fighter) return null;
                  const expPercent = (prof.exp / prof.expToNext) * 100;

                  return (
                    <div
                      key={prof.fighterId}
                      className="p-4 rounded-xl bg-arena-darker/50 border border-white/10 hover:border-arena-cyan/50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl relative"
                          style={{
                            backgroundColor: fighter.color + '20',
                            border: `2px solid ${fighter.color}`,
                          }}
                        >
                          {fighter.avatar}
                          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-arena-gold flex items-center justify-center font-orbitron font-bold text-sm text-arena-darker shadow-lg">
                            {prof.level}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-orbitron font-bold text-white text-lg">{fighter.name}</h3>
                            <div className="flex items-center gap-1">
                              <Star className="text-arena-gold" size={16} fill="#fbbf24" />
                              <span className="font-orbitron font-bold text-arena-gold">Lv.{prof.level}</span>
                            </div>
                          </div>
                          <div className="h-3 bg-arena-darker rounded-full overflow-hidden border border-arena-cyan/30">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${expPercent}%`,
                                background: `linear-gradient(90deg, ${fighter.color}, #06b6d4)`,
                                boxShadow: `0 0 10px ${fighter.color}`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-xs font-orbitron mt-1">
                            <span className="text-white/50">经验值</span>
                            <span className="text-arena-cyan">{prof.exp} / {prof.expToNext}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </NeonCard>
          )}
        </div>
      </div>
    </div>
  );
};
