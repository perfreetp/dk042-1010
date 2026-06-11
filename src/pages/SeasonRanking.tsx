import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { NeonButton } from '@/components/layout/NeonButton';
import { NeonCard } from '@/components/layout/NeonCard';
import { getFighterById } from '@/data/fighters';
import { getItemById } from '@/data/items';
import { TITLES, EMOTES } from '@/data/titles';
import { ArrowLeft, Trophy, Medal, Award, Star, Smile, TrendingUp, FileText, X, Swords, Zap, Target, Clock, Heart, ChevronDown, ChevronUp, Flame, Shield, Sparkles, Bomb, AlertTriangle, RefreshCw, Skull, Frown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BattleRecord, Title, Emote, ProficiencyLog, RoundResult, BattleEvent } from '@/engine/types';

type TabType = 'ranking' | 'battles' | 'titles' | 'emotes' | 'proficiency';

export const SeasonRanking: React.FC = () => {
  const { 
    setScreen, 
    rankings, 
    titles, 
    emotes, 
    proficiencies,
    battleRecords,
    proficiencyLogs,
    selectedBattleRecord,
    setSelectedBattleRecord,
  } = useGameStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('ranking');
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);
  const [selectedEmote, setSelectedEmote] = useState<Emote | null>(null);
  const [selectedProfFighter, setSelectedProfFighter] = useState<string | null>(null);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'ranking', label: '胜率排行', icon: <Trophy size={20} /> },
    { id: 'battles', label: '最近战报', icon: <FileText size={20} /> },
    { id: 'titles', label: '称号收集', icon: <Award size={20} /> },
    { id: 'emotes', label: '表情收藏', icon: <Smile size={20} /> },
    { id: 'proficiency', label: '角色熟练度', icon: <TrendingUp size={20} /> },
  ];

  const sortedRankings = useMemo(() => [...rankings].sort((a, b) => {
    const winRateA = a.wins / (a.wins + a.losses) || 0;
    const winRateB = b.wins / (b.wins + b.losses) || 0;
    if (winRateB !== winRateA) return winRateB - winRateA;
    return b.wins - a.wins;
  }), [rankings]);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const fighterLogs = useMemo(() => {
    if (!selectedProfFighter) return [];
    return proficiencyLogs
      .filter(l => l.fighterId === selectedProfFighter)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);
  }, [selectedProfFighter, proficiencyLogs]);

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

        <div className="flex gap-2 mb-6 justify-center flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedBattleRecord(null);
                setSelectedProfFighter(null);
              }}
              className={cn(
                'flex items-center gap-2 px-5 py-3 rounded-xl font-orbitron font-bold transition-all',
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

          {activeTab === 'battles' && (
            selectedBattleRecord ? (
              <BattleDetailView 
                record={selectedBattleRecord} 
                onBack={() => setSelectedBattleRecord(null)}
                formatDate={formatDate}
              />
            ) : (
              <NeonCard color="cyan" className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-orbitron text-2xl font-bold text-arena-cyan flex items-center gap-3">
                    <FileText size={28} />
                    最近战报
                  </h2>
                  <div className="text-white/60 font-zcool">
                    共 {battleRecords.length} 场记录
                  </div>
                </div>

                {battleRecords.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">📋</div>
                    <p className="font-zcool text-xl text-white/60">暂无战斗记录</p>
                    <p className="font-zcool text-sm text-white/40 mt-2">去打一场比赛吧！</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {battleRecords.map(record => (
                      <div
                        key={record.id}
                        onClick={() => setSelectedBattleRecord(record)}
                        className="p-4 rounded-xl bg-arena-darker/50 border border-white/10 hover:border-arena-cyan/50 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            'w-14 h-14 rounded-xl flex items-center justify-center text-3xl',
                            record.winnerTeam === 0
                              ? 'bg-arena-cyan/20 border-2 border-arena-cyan'
                              : 'bg-arena-orange/20 border-2 border-arena-orange'
                          )}>
                            🏆
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className={cn(
                                'font-orbitron font-bold text-lg',
                                record.winnerTeam === 0 ? 'text-arena-cyan' : 'text-arena-orange'
                              )}>
                                队伍 {record.winnerTeam + 1} 获胜
                              </span>
                              <span className="text-white/40 font-zcool text-sm">
                                {formatDate(record.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-white/60 font-zcool">
                                <Clock size={14} className="inline mr-1" />
                                {Math.floor(record.totalTime / 60)}分{Math.floor(record.totalTime % 60)}秒
                              </span>
                              <span className="text-white/60 font-zcool">
                                <Swords size={14} className="inline mr-1" />
                                {record.roundResults.length} 回合
                              </span>
                              <span className="text-white/60 font-zcool">
                                <Target size={14} className="inline mr-1" />
                                {record.rules.winCondition === 'ko' ? `KO制 ${record.rules.winValue}` : record.rules.winCondition === 'hp' ? '生命制' : '时间制'}
                              </span>
                            </div>
                            <div className="flex gap-1 mt-2">
                              {record.roundResults.map((r, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    'w-8 h-6 rounded text-xs font-orbitron flex items-center justify-center',
                                    r.winner === 0 ? 'bg-arena-cyan/30 text-arena-cyan' : 'bg-arena-orange/30 text-arena-orange'
                                  )}
                                >
                                  R{r.round}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="text-white/40">
                            <ArrowLeft size={20} className="rotate-180" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </NeonCard>
            )
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
                    onClick={() => title.unlocked && setSelectedTitle(title)}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all',
                      title.unlocked
                        ? 'bg-arena-purple/20 border-arena-purpleLight shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-pointer hover:scale-[1.02]'
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
                    onClick={() => emote.unlocked && setSelectedEmote(emote)}
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
                  {selectedProfFighter ? `${getFighterById(selectedProfFighter)?.name || ''} - 最近参战` : '角色熟练度'}
                </h2>
                <div className="flex items-center gap-2">
                  {selectedProfFighter && (
                    <NeonButton variant="cyan" size="sm" onClick={() => setSelectedProfFighter(null)}>
                      <ArrowLeft size={16} className="mr-1" /> 返回列表
                    </NeonButton>
                  )}
                </div>
              </div>

              {selectedProfFighter ? (
                <ProficiencyLogsView 
                  logs={fighterLogs} 
                  fighterId={selectedProfFighter}
                  formatDate={formatDate}
                  onJumpToBattle={() => setActiveTab('battles')}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {proficiencies.map(prof => {
                    const fighter = getFighterById(prof.fighterId);
                    if (!fighter) return null;
                    const expPercent = (prof.exp / prof.expToNext) * 100;
                    const logs = proficiencyLogs.filter(l => l.fighterId === prof.fighterId);

                    return (
                      <div
                        key={prof.fighterId}
                        onClick={() => setSelectedProfFighter(prof.fighterId)}
                        className="p-4 rounded-xl bg-arena-darker/50 border border-white/10 hover:border-arena-cyan/50 transition-all cursor-pointer"
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
                            <div className="text-xs text-white/40 font-zcool mt-1">
                              参战记录: {logs.length} 场
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </NeonCard>
          )}
        </div>
      </div>

      {selectedTitle && (
        <Modal onClose={() => setSelectedTitle(null)}>
          <div className="text-center">
            <div className="text-7xl mb-4">{selectedTitle.icon}</div>
            <h2 className="font-orbitron text-3xl font-bold text-arena-purpleLight mb-2">
              {selectedTitle.name}
            </h2>
            <p className="font-zcool text-white/80 text-lg mb-2">{selectedTitle.description}</p>
            {selectedTitle.unlocked ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-arena-green/20 border border-arena-green text-arena-green font-orbitron text-sm mb-4">
                <Medal size={14} /> 已解锁
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/30 text-white/60 font-orbitron text-sm mb-4">
                未解锁
              </div>
            )}
            <div className="p-4 rounded-xl bg-black/40 text-left space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-white/60 font-zcool">解锁条件</span>
                <span className="text-arena-cyan font-orbitron text-right max-w-[60%]">{selectedTitle.condition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 font-zcool">条件说明</span>
                <span className="text-white/80 font-zcool text-right max-w-[60%] text-xs">
                  {selectedTitle.id === 'title_first_win' && '赢得任意一场比赛'}
                  {selectedTitle.id === 'title_veteran' && `累计赢得 ${selectedTitle.target} 场比赛（胜场称号）`}
                  {selectedTitle.id === 'title_legend' && `累计赢得 ${selectedTitle.target} 场比赛（胜场称号）`}
                  {selectedTitle.id === 'title_berserker' && `单场最高伤害达到 ${selectedTitle.target}（伤害称号）`}
                  {selectedTitle.id === 'title_untouchable' && `单场最低承伤低于 ${selectedTitle.target}（防御称号）`}
                  {selectedTitle.id === 'title_killer' && `单场最高击杀达到 ${selectedTitle.target}（击杀称号）`}
                  {selectedTitle.id === 'title_survivor' && `低于10%血量赢下一场（生存称号）`}
                  {selectedTitle.id === 'title_tactician' && `累计使用 ${selectedTitle.target} 次道具（战术称号）`}
                </span>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-white/60 font-zcool">当前进度</span>
                  <span className="text-arena-gold font-orbitron font-bold">{selectedTitle.progress} / {selectedTitle.target}</span>
                </div>
                <div className="h-3 bg-arena-darker rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-arena-purpleLight to-arena-gold transition-all"
                    style={{ width: `${Math.min(100, (selectedTitle.progress / selectedTitle.target) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-xs text-white/40 font-zcool pt-2 border-t border-white/10">
                💡 提示：称号进度在每场战斗结束后自动更新，胜场类称号按真实胜利场次累计
              </div>
            </div>
          </div>
        </Modal>
      )}

      {selectedEmote && (
        <Modal onClose={() => setSelectedEmote(null)}>
          <div className="text-center">
            <div className="text-7xl mb-4">{selectedEmote.icon}</div>
            <h2 className="font-orbitron text-3xl font-bold text-arena-orange mb-2">
              {selectedEmote.name}
            </h2>
            {selectedEmote.unlocked ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-arena-green/20 border border-arena-green text-arena-green font-orbitron text-sm mb-4">
                <Star size={14} fill="#10b981" /> 已解锁
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/30 text-white/60 font-orbitron text-sm mb-4">
                未解锁
              </div>
            )}
            <div className="p-4 rounded-xl bg-black/40 text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60 font-zcool">解锁条件</span>
                <span className="text-arena-orange font-orbitron">累计胜场解锁</span>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-white/60 font-zcool">需要胜场</span>
                  <span className="text-arena-gold font-orbitron font-bold">
                    {(() => {
                      const idx = EMOTES.findIndex(e => e.id === selectedEmote.id);
                      return idx >= 0 ? idx * 3 : 0;
                    })()} 场
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-white/60 font-zcool">当前胜场</span>
                  <span className="text-arena-cyan font-orbitron font-bold">
                    {rankings.reduce((sum, r) => sum + r.wins, 0)} 场
                  </span>
                </div>
              </div>
              <div className="text-xs text-white/40 font-zcool pt-2 border-t border-white/10">
                💡 每累计赢 3 场比赛解锁一个新表情，进度在战斗结算后立即更新
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const Modal: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    onClick={onClose}
  >
    <div 
      className="relative max-w-md w-full mx-4"
      onClick={e => e.stopPropagation()}
    >
      <NeonCard color="purple" className="p-8">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all"
        >
          <X size={18} />
        </button>
        {children}
      </NeonCard>
    </div>
  </div>
);

const BattleDetailView: React.FC<{
  record: BattleRecord;
  onBack: () => void;
  formatDate: (ts: number) => string;
}> = ({ record, onBack, formatDate }) => {
  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  const getEventIcon = (type: BattleEvent['type']) => {
    switch (type) {
      case 'ko': return <Skull size={14} className="text-arena-red" />;
      case 'special': return <Zap size={14} className="text-arena-gold" />;
      case 'item_pickup':
      case 'item_use': return <Sparkles size={14} className="text-arena-green" />;
      case 'weapon_pickup': return <Swords size={14} className="text-arena-orange" />;
      case 'trap_trigger': return <AlertTriangle size={14} className="text-arena-red" />;
      case 'respawn': return <RefreshCw size={14} className="text-arena-cyan" />;
      case 'critical_hit': return <Flame size={14} className="text-arena-orange" />;
      case 'betrayal': return <Frown size={14} className="text-arena-purpleLight" />;
      case 'ally_buff': return <Shield size={14} className="text-arena-cyan" />;
      default: return <Zap size={14} className="text-white/50" />;
    }
  };

  return (
    <NeonCard color="cyan" className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <NeonButton variant="cyan" size="sm" onClick={onBack}>
          <ArrowLeft size={16} className="mr-1" /> 返回列表
        </NeonButton>
        <h2 className="font-orbitron text-2xl font-bold text-arena-cyan flex items-center gap-3">
          <FileText size={28} />
          战报详情
        </h2>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-black/30 border border-white/10">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-arena-cyan font-orbitron text-2xl font-bold">
              {record.roundResults.filter(r => r.winner === 0).length}
            </div>
            <div className="text-white/60 font-zcool text-sm">队伍1胜场</div>
          </div>
          <div>
            <div className={cn(
              'font-orbitron text-3xl font-black',
              record.winnerTeam === 0 ? 'text-arena-cyan' : 'text-arena-orange'
            )}>
              🏆 队{record.winnerTeam + 1}
            </div>
            <div className="text-white/60 font-zcool text-sm">
              {formatDate(record.createdAt)}
            </div>
          </div>
          <div>
            <div className="text-arena-orange font-orbitron text-2xl font-bold">
              {record.roundResults.filter(r => r.winner === 1).length}
            </div>
            <div className="text-white/60 font-zcool text-sm">队伍2胜场</div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-orbitron text-lg text-arena-gold mb-3 flex items-center gap-2">
          <Swords size={20} /> 每回合详情 <span className="text-xs text-white/50 font-zcool">(点击展开)</span>
        </h3>
        <div className="space-y-2">
          {record.roundResults.map((r, i) => (
            <div key={i} className="rounded-lg bg-arena-darker/50 border border-white/10 overflow-hidden">
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 transition-all"
                onClick={() => setExpandedRound(expandedRound === i ? null : i)}
              >
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center font-orbitron font-bold',
                  r.winner === 0 ? 'bg-arena-cyan/30 text-arena-cyan' : 'bg-arena-orange/30 text-arena-orange'
                )}>
                  R{r.round}
                </div>
                <div className="flex-1">
                  <div className="font-orbitron font-bold text-white">
                    队伍 {r.winner + 1} 获胜
                  </div>
                  <div className="text-xs text-white/50 font-zcool flex gap-3">
                    <span>用时 {Math.floor(r.timeElapsed)}秒</span>
                    <span>KO 队1:{r.koCount[0] || 0} 队2:{r.koCount[1] || 0}</span>
                    {r.teamStats && (
                      <span>伤害 队1:{r.teamStats[0]?.totalDamage || 0} 队2:{r.teamStats[1]?.totalDamage || 0}</span>
                    )}
                  </div>
                </div>
                {expandedRound === i ? <ChevronUp size={20} className="text-white/50" /> : <ChevronDown size={20} className="text-white/50" />}
              </div>

              {expandedRound === i && r.teamStats && (
                <div className="p-4 border-t border-white/10 bg-black/20">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {[0, 1].map(team => (
                      <div key={team} className={cn(
                        'p-3 rounded-lg border-2',
                        team === r.winner ? 'border-arena-gold bg-arena-gold/10' : 'border-white/10 bg-arena-darker'
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn(
                            'font-orbitron font-bold',
                            team === 0 ? 'text-arena-cyan' : 'text-arena-orange'
                          )}>
                            队伍 {team + 1}
                          </span>
                          {team === r.winner && <Trophy className="text-arena-gold" size={14} />}
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs font-orbitron">
                          <span className="text-white/60">总伤害</span>
                          <span className="text-arena-red text-right">{r.teamStats[team]?.totalDamage || 0}</span>
                          <span className="text-white/60">KO数</span>
                          <span className="text-arena-orange text-right">{r.teamStats[team]?.koCount || 0}</span>
                          <span className="text-white/60">道具使用</span>
                          <span className="text-arena-green text-right">{r.teamStats[team]?.itemsUsed || 0}</span>
                          <span className="text-white/60">必杀技</span>
                          <span className="text-arena-gold text-right">{r.teamStats[team]?.specialUsed || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {r.events && r.events.length > 0 && (
                    <div>
                      <h4 className="font-orbitron text-sm text-white/70 mb-2 flex items-center gap-2">
                        <Clock size={14} /> 关键事件时间线
                      </h4>
                      <div className="max-h-40 overflow-y-auto space-y-1 pr-2">
                        {r.events.slice(0, 30).map((evt, j) => (
                          <div key={j} className="flex items-start gap-2 text-xs py-1 px-2 rounded bg-black/20">
                            <div className="mt-0.5">{getEventIcon(evt.type)}</div>
                            <span className="text-white/40 font-orbitron w-10 shrink-0">
                              [{Math.floor(evt.timestamp)}s]
                            </span>
                            <span className="text-white/80 font-zcool">
                              {evt.description || `${evt.fighterName || '?'} -> ${evt.type}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-orbitron text-lg text-arena-gold mb-3 flex items-center gap-2">
          <Target size={20} /> 斗士整场数据
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {record.fighterIds.map(fid => {
            const fighter = getFighterById(fid);
            if (!fighter) return null;
            const team = record.fighterTeams[fid];
            const stats = record.fighterStats[fid] as any || {};
            const isWinner = team === record.winnerTeam;
            return (
              <div
                key={fid}
                className={cn(
                  'p-3 rounded-lg border-2',
                  isWinner ? 'border-arena-gold bg-arena-gold/10' : 'border-white/10 bg-arena-darker'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{fighter.avatar}</span>
                  <span className="font-zcool text-white">{fighter.name}</span>
                  <span className={cn(
                    'text-xs font-orbitron px-2 py-0.5 rounded',
                    team === 0 ? 'bg-arena-cyan/20 text-arena-cyan' : 'bg-arena-orange/20 text-arena-orange'
                  )}>
                    队{team + 1}
                  </span>
                  {isWinner && <Trophy className="text-arena-gold" size={16} />}
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs font-orbitron text-white/70">
                  <span className="text-arena-red">伤害: {stats.damageDealt || 0}</span>
                  <span className="text-arena-cyan">承伤: {stats.damageTaken || 0}</span>
                  <span className="text-arena-orange">击杀: {stats.kills || 0}</span>
                  <span className="text-arena-purpleLight">死亡: {stats.deaths || 0}</span>
                  <span className="text-arena-green">道具: {stats.itemsUsed || 0}</span>
                  <span className="text-arena-gold">必杀: {stats.specialUsed || 0}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(record.newTitles.length > 0 || record.newEmotes.length > 0) && (
        <div className="mt-6">
          <h3 className="font-orbitron text-lg text-arena-gold mb-3 flex items-center gap-2">
            <Zap size={20} /> 本场解锁
          </h3>
          <div className="flex flex-wrap gap-2">
            {record.newTitles.map(tid => {
              const t = TITLES.find(x => x.id === tid);
              if (!t) return null;
              return (
                <div key={tid} className="px-3 py-2 rounded-lg bg-arena-purple/15 border border-arena-purpleLight">
                  <span className="text-xl mr-2">{t.icon}</span>
                  <span className="font-zcool text-arena-purpleLight text-sm">{t.name}</span>
                </div>
              );
            })}
            {record.newEmotes.map(eid => {
              const e = EMOTES.find(x => x.id === eid);
              if (!e) return null;
              return (
                <div key={eid} className="px-3 py-2 rounded-lg bg-arena-orange/15 border border-arena-orange">
                  <span className="text-xl mr-2">{e.icon}</span>
                  <span className="font-zcool text-arena-orange text-sm">{e.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </NeonCard>
  );
};

const ProficiencyLogsView: React.FC<{
  logs: ProficiencyLog[];
  fighterId: string;
  formatDate: (ts: number) => string;
  onJumpToBattle: (battleRecordId: string) => void;
}> = ({ logs, fighterId, formatDate, onJumpToBattle }) => {
  const { battleRecords, setSelectedBattleRecord } = useGameStore();

  const jumpToBattle = (battleRecordId?: string) => {
    if (!battleRecordId) return;
    const record = battleRecords.find(r => r.id === battleRecordId);
    if (record) {
      setSelectedBattleRecord(record);
      onJumpToBattle(battleRecordId);
    }
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📊</div>
        <p className="font-zcool text-xl text-white/60">暂无参战记录</p>
        <p className="font-zcool text-sm text-white/40 mt-2">使用这个角色去战斗吧！</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map(log => {
        const hasBattle = log.battleRecordId && battleRecords.some(r => r.id === log.battleRecordId);
        return (
          <div
            key={log.id}
            className={cn(
              'p-4 rounded-xl border-2 transition-all',
              log.leveledUp
                ? 'bg-arena-gold/10 border-arena-gold/50'
                : 'bg-arena-darker/50 border-white/10'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                {log.leveledUp && (
                  <span className="px-2 py-0.5 rounded bg-arena-gold/30 text-arena-gold font-orbitron text-xs font-bold animate-pulse">
                    ⬆️ 升级！
                  </span>
                )}
                {log.sources.winBonus > 0 && (
                  <span className="px-2 py-0.5 rounded bg-arena-green/20 text-arena-green font-orbitron text-xs">
                    🏆 胜利
                  </span>
                )}
                {log.sources.winBonus === 0 && (
                  <span className="px-2 py-0.5 rounded bg-arena-red/20 text-arena-red font-orbitron text-xs">
                    💔 败北
                  </span>
                )}
                <span className="font-zcool text-white/60 text-sm">
                  {formatDate(log.timestamp)}
                </span>
              </div>
              <div className="text-arena-green font-orbitron font-bold text-lg">
                +{log.expGained} EXP
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="p-2 rounded bg-black/30 text-center">
                <Trophy size={14} className="text-arena-gold mx-auto mb-1" />
                <div className="text-white font-orbitron text-sm">+{log.sources.winBonus}</div>
                <div className="text-white/40 text-xs font-zcool">
                  {log.sources.winBonus > 0 ? '胜利奖励' : '无胜利奖励'}
                </div>
              </div>
              <div className="p-2 rounded bg-black/30 text-center">
                <Swords size={14} className="text-arena-red mx-auto mb-1" />
                <div className="text-white font-orbitron text-sm">+{log.sources.damageBonus}</div>
                <div className="text-white/40 text-xs font-zcool">伤害奖励</div>
              </div>
              <div className="p-2 rounded bg-black/30 text-center">
                <Heart size={14} className="text-arena-cyan mx-auto mb-1" />
                <div className="text-white font-orbitron text-sm">+{log.sources.participation}</div>
                <div className="text-white/40 text-xs font-zcool">参战奖励</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white/50 font-zcool">等级:</span>
                <span className="text-arena-gold font-orbitron font-bold">Lv.{log.oldLevel}</span>
                <span className="text-white/30">→</span>
                <span className={cn(
                  'font-orbitron font-bold',
                  log.leveledUp ? 'text-arena-green' : 'text-arena-gold'
                )}>
                  Lv.{log.newLevel}
                </span>
              </div>

              {hasBattle && (
                <button
                  onClick={() => jumpToBattle(log.battleRecordId)}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-arena-cyan/20 border border-arena-cyan/50 text-arena-cyan font-orbitron text-xs hover:bg-arena-cyan/30 transition-all"
                >
                  <FileText size={12} />
                  查看战报
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
