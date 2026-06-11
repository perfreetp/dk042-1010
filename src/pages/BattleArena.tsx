import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GameEngine, ARENA_WIDTH, ARENA_HEIGHT, GROUND_Y, FIGHTER_WIDTH, FIGHTER_HEIGHT, EngineState } from '@/engine/GameEngine';
import { getFighterById } from '@/data/fighters';
import { getItemById } from '@/data/items';
import { getWeaponById } from '@/data/weapons';
import { TITLES, EMOTES } from '@/data/titles';
import { NeonButton } from '@/components/layout/NeonButton';
import { NeonCard } from '@/components/layout/NeonCard';
import { FighterState, BattleRecord, RoundResult } from '@/engine/types';
import { ArrowLeft, Home, Play, Pause, RotateCcw, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateId } from '@/utils/math';

export const BattleArena: React.FC = () => {
  const { 
    setScreen, 
    rules, 
    selectedFighters, 
    playerTeams,
    itemRates,
    weaponEnabled,
    isPaused,
    setPaused,
    currentRound,
    roundWins,
    setCurrentRound,
    addRoundWin,
    battleResult,
    setBattleResult,
    updateRankings,
    updateTitles,
    updateEmotes,
    updateProficiencies,
    resetGame,
    addBattleRecord,
  } = useGameStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const engineStateRef = useRef<EngineState | null>(null);
  const animationRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const [roundCountdown, setRoundCountdown] = useState<number | null>(3);
  const [battleEnded, setBattleEnded] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [selectedUnlock, setSelectedUnlock] = useState<{ type: 'title' | 'emote'; id: string } | null>(null);
  
  const allRoundResultsRef = useRef<RoundResult[]>([]);
  
  const cumulativeStatsRef = useRef<{ [fighterId: string]: any }>({});
  const totalTimeRef = useRef<number>(0);
  const roundProcessedRef = useRef<boolean>(false);
  const battleResultSavedRef = useRef<boolean>(false);

  const initEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new GameEngine(rules, selectedFighters, playerTeams, itemRates, weaponEnabled);
      engineStateRef.current = engineRef.current.state;
      
      engineRef.current.subscribe((state) => {
        engineStateRef.current = state;
      });
    }
  }, [rules, selectedFighters, playerTeams, itemRates, weaponEnabled]);

  const startRound = useCallback(() => {
    roundProcessedRef.current = false;
    setRoundCountdown(3);
    const countdownInterval = setInterval(() => {
      setRoundCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setRoundCountdown(0);
          setTimeout(() => {
            setRoundCountdown(null);
            if (engineRef.current) {
              engineRef.current.start();
            }
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    initEngine();
    startRound();

    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initEngine, startRound, currentRound]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        setPaused(!isPaused);
        if (engineRef.current) {
          engineRef.current.state.isRunning = !isPaused;
          if (!isPaused) {
            engineRef.current.stop();
          } else {
            engineRef.current.start();
          }
        }
      }

      if (!isPaused && roundCountdown === null && engineRef.current) {
        const key = e.key.toLowerCase();
        if (key === 'j') engineRef.current.playerAttack('light');
        if (key === 'k') engineRef.current.playerAttack('heavy');
        if (key === 'l') engineRef.current.playerDodge();
        if (key === 'u') engineRef.current.playerSpecial();
        if (key === ' ' || key === 'spacebar') {
          e.preventDefault();
          engineRef.current.playerJump();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPaused, roundCountdown, setPaused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (!engineStateRef.current) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      if (!isPaused && roundCountdown === null && engineRef.current) {
        let moveDir: 'left' | 'right' | 'none' = 'none';
        if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) moveDir = 'left';
        if (keysRef.current.has('d') || keysRef.current.has('arrowright')) moveDir = 'right';
        engineRef.current.playerMove(moveDir);
      }

      drawGame(ctx, engineStateRef.current);
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, roundCountdown]);

  useEffect(() => {
    if (!engineRef.current || battleEnded) return;

    const checkInterval = setInterval(() => {
      if (engineRef.current?.isRoundEnded() && !battleEnded && !roundProcessedRef.current) {
        const roundWinner = engineRef.current.getWinner();
        if (roundWinner !== null) {
          roundProcessedRef.current = true;
          handleRoundEnd(roundWinner);
        }
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [battleEnded, currentRound]);

  const handleRoundEnd = (roundWinner: number) => {
    if (engineRef.current) {
      engineRef.current.stop();
      
      const roundDetails = engineRef.current.getRoundDetails(currentRound, roundWinner);
      const roundStats = engineRef.current.getFighterStats();
      
      allRoundResultsRef.current.push({
        round: currentRound,
        winner: roundWinner,
        timeElapsed: roundDetails.timeElapsed,
        koCount: roundDetails.koCount,
        teamStats: roundDetails.teamStats,
        events: roundDetails.events,
      });
      
      totalTimeRef.current += roundDetails.timeElapsed;
      
      Object.entries(roundStats).forEach(([fid, stats]: [string, any]) => {
        if (!cumulativeStatsRef.current[fid]) {
          cumulativeStatsRef.current[fid] = {
            damageDealt: 0,
            damageTaken: 0,
            kills: 0,
            deaths: 0,
            specialUsed: 0,
            itemsUsed: 0,
          };
        }
        cumulativeStatsRef.current[fid].damageDealt += stats.damageDealt;
        cumulativeStatsRef.current[fid].damageTaken += stats.damageTaken;
        cumulativeStatsRef.current[fid].kills += stats.kills;
        cumulativeStatsRef.current[fid].deaths += stats.deaths;
        cumulativeStatsRef.current[fid].specialUsed += stats.specialUsed;
        cumulativeStatsRef.current[fid].itemsUsed += stats.itemsUsed;
      });
    }
    
    addRoundWin(roundWinner);

    const winsNeeded = Math.ceil(rules.rounds / 2);
    const currentWins = (roundWins[roundWinner] || 0) + 1;

    if (currentWins >= winsNeeded || currentRound >= rules.rounds) {
      handleBattleEnd(roundWinner);
    } else {
      setTimeout(() => {
        setCurrentRound(currentRound + 1);
        engineRef.current = null;
        initEngine();
        startRound();
      }, 2000);
    }
  };

  const handleBattleEnd = (winnerTeam: number) => {
    if (battleResultSavedRef.current) return;
    battleResultSavedRef.current = true;
    
    setBattleEnded(true);
    setWinner(winnerTeam);
    setShowResult(true);

    if (engineRef.current) {
      const finalStats = cumulativeStatsRef.current;
      const expGained: { [fighterId: string]: number } = {};
      selectedFighters.forEach(fid => {
        const isWinner = playerTeams[fid] === winnerTeam;
        const baseExp = isWinner ? 100 : 50;
        const bonusExp = Math.floor((finalStats[fid]?.damageDealt || 0) / 100);
        expGained[fid] = baseExp + bonusExp;
      });

      const fighters = engineRef.current.state.fighters;
      const winnerFighters = fighters.filter(f => f.team === winnerTeam);
      const minHpPercent = winnerFighters.length > 0
        ? winnerFighters.reduce((min, f) => Math.min(min, f.hp / f.maxHp), 1)
        : 1;
      const survivedLowHp = minHpPercent > 0 && minHpPercent <= 0.1;

      updateRankings(winnerTeam, finalStats);
      
      const newTitles = updateTitles({
        won: true,
        maxDamage: Math.max(...Object.values(finalStats).map((s: any) => s.damageDealt)),
        minDamageTaken: Math.min(...Object.values(finalStats).map((s: any) => s.damageTaken)),
        maxKills: Math.max(...Object.values(finalStats).map((s: any) => s.kills)),
        survivedLowHp,
        itemsUsed: Object.values(finalStats).reduce((sum: number, s: any) => sum + s.itemsUsed, 0),
      });
      const newEmotes = updateEmotes();

      const battleRecordId = generateId();
      updateProficiencies(expGained, battleRecordId, finalStats, playerTeams, winnerTeam);

      const battleRecord: BattleRecord = {
        id: battleRecordId,
        createdAt: Date.now(),
        winnerTeam,
        roundResults: allRoundResultsRef.current,
        fighterStats: finalStats,
        fighterIds: [...selectedFighters],
        fighterTeams: { ...playerTeams },
        totalTime: totalTimeRef.current,
        rules: { ...rules },
        newTitles,
        newEmotes,
        expGained,
      };
      addBattleRecord(battleRecord);

      setBattleResult({
        winnerTeam,
        roundResults: allRoundResultsRef.current,
        fighterStats: finalStats,
        newTitles,
        newEmotes,
        expGained,
        totalTime: totalTimeRef.current,
      });
    }
  };

  const drawGame = (ctx: CanvasRenderingContext2D, state: EngineState) => {
    const canvas = canvasRef.current!;
    const scaleX = canvas.width / ARENA_WIDTH;
    const scaleY = canvas.height / ARENA_HEIGHT;

    ctx.save();
    if (state.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * state.screenShake * 20;
      const shakeY = (Math.random() - 0.5) * state.screenShake * 20;
      ctx.translate(shakeX, shakeY);
    }
    ctx.scale(scaleX, scaleY);

    drawBackground(ctx);
    drawTraps(ctx, state.traps);
    drawItems(ctx, state.itemSpawns);
    drawWeapons(ctx, state.weaponSpawns);
    drawFighters(ctx, state.fighters);
    drawParticles(ctx, state.particles);
    drawDamageNumbers(ctx, state.damageNumbers);
    drawAllianceIndicators(ctx, state.fighters);

    ctx.restore();
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, ARENA_HEIGHT);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(0.5, '#1a0a2e');
    gradient.addColorStop(1, '#0a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < ARENA_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ARENA_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < ARENA_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ARENA_WIDTH, y);
      ctx.stroke();
    }

    const groundGradient = ctx.createLinearGradient(0, GROUND_Y, 0, ARENA_HEIGHT);
    groundGradient.addColorStop(0, '#2a1a4a');
    groundGradient.addColorStop(1, '#1a0a2a');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, GROUND_Y, ARENA_WIDTH, ARENA_HEIGHT - GROUND_Y);

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(ARENA_WIDTH, GROUND_Y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 50, ARENA_WIDTH - 60, ARENA_HEIGHT - 100);
  };

  const drawTraps = (ctx: CanvasRenderingContext2D, traps: any[]) => {
    traps.forEach(trap => {
      ctx.save();
      if (trap.active) {
        ctx.shadowColor = trap.color;
        ctx.shadowBlur = 20;
      }
      
      ctx.fillStyle = trap.active ? trap.color + '80' : trap.color + '30';
      ctx.fillRect(trap.position.x, trap.position.y, trap.width, trap.height);
      
      ctx.strokeStyle = trap.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(trap.position.x, trap.position.y, trap.width, trap.height);

      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(trap.icon, trap.position.x + trap.width / 2, trap.position.y + trap.height / 2);
      
      ctx.restore();
    });
  };

  const drawItems = (ctx: CanvasRenderingContext2D, spawns: any[]) => {
    spawns.forEach(spawn => {
      const item = getItemById(spawn.itemId);
      if (!item) return;

      const bounce = Math.sin(Date.now() / 200) * 5;
      ctx.save();
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 15;
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.icon, spawn.position.x, spawn.position.y + bounce);
      ctx.restore();
    });
  };

  const drawWeapons = (ctx: CanvasRenderingContext2D, spawns: any[]) => {
    spawns.forEach(spawn => {
      const weapon = getWeaponById(spawn.weaponId);
      if (!weapon) return;

      ctx.save();
      ctx.shadowColor = weapon.color;
      ctx.shadowBlur = 20;
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(weapon.icon, spawn.position.x, spawn.position.y);
      ctx.restore();
    });
  };

  const drawFighters = (ctx: CanvasRenderingContext2D, fighters: FighterState[]) => {
    fighters.forEach(fighter => {
      const fighterData = getFighterById(fighter.fighterId);
      if (!fighterData) return;

      const x = fighter.position.x;
      const y = fighter.position.y;
      const w = FIGHTER_WIDTH;
      const h = FIGHTER_HEIGHT;

      ctx.save();

      if (fighter.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }

      if (fighter.state === 'ko') {
        ctx.globalAlpha = 0.3;
      }

      if (fighter.state === 'special') {
        ctx.shadowColor = fighterData.color;
        ctx.shadowBlur = 40;
      } else if (fighter.state === 'attack_light' || fighter.state === 'attack_heavy') {
        ctx.shadowColor = fighterData.color;
        ctx.shadowBlur = 20;
      }

      const bodyGradient = ctx.createRadialGradient(x + w/2, y + h/2, 0, x + w/2, y + h/2, w);
      bodyGradient.addColorStop(0, fighterData.color + 'cc');
      bodyGradient.addColorStop(1, fighterData.color + '44');
      
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 10);
      ctx.fill();

      ctx.strokeStyle = fighterData.color;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fighterData.avatar, x + w / 2, y + h / 2);

      if (fighter.heldWeaponId) {
        const weapon = getWeaponById(fighter.heldWeaponId);
        if (weapon) {
          ctx.font = '24px sans-serif';
          ctx.fillText(weapon.icon, x + w / 2 + 15, y + h / 2 - 10);
        }
      }

      ctx.restore();
    });
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, particles: any[]) => {
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  };

  const drawDamageNumbers = (ctx: CanvasRenderingContext2D, dmgNums: any[]) => {
    dmgNums.forEach(d => {
      ctx.save();
      ctx.globalAlpha = d.life / d.maxLife;
      ctx.font = d.isCritical ? 'bold 28px Orbitron, sans-serif' : 'bold 20px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = d.color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(d.value.toString(), d.position.x, d.position.y);
      ctx.fillText(d.value.toString(), d.position.x, d.position.y);
      ctx.restore();
    });
  };

  const drawAllianceIndicators = (ctx: CanvasRenderingContext2D, fighters: FighterState[]) => {
    fighters.forEach(f => {
      if (f.allies.length > 0) {
        ctx.save();
        ctx.fillStyle = '#22c55e';
        ctx.font = '14px sans-serif';
        ctx.fillText('🤝', f.position.x + FIGHTER_WIDTH - 5, f.position.y - 5);
        ctx.restore();
      }
    });
  };

  const handleExit = () => {
    allRoundResultsRef.current = [];
    cumulativeStatsRef.current = {};
    totalTimeRef.current = 0;
    roundProcessedRef.current = false;
    battleResultSavedRef.current = false;
    resetGame();
    setScreen('menu');
  };

  const handleRestart = () => {
    allRoundResultsRef.current = [];
    cumulativeStatsRef.current = {};
    totalTimeRef.current = 0;
    roundProcessedRef.current = false;
    battleResultSavedRef.current = false;
    resetGame();
    setBattleEnded(false);
    setShowResult(false);
    setWinner(null);
    setCurrentRound(1);
    engineRef.current = null;
    initEngine();
    startRound();
  };

  const fighters = engineStateRef.current?.fighters || [];
  const playerFighter = fighters.find(f => f.isPlayer);
  const playerData = playerFighter ? getFighterById(playerFighter.fighterId) : null;

  return (
    <div className="w-full h-full bg-arena-darker flex flex-col">
      <div className="p-4 flex items-center justify-between bg-arena-dark/80 backdrop-blur-sm border-b border-arena-cyan/30">
        <div className="flex items-center gap-4">
          <NeonButton variant="cyan" size="sm" onClick={handleExit}>
            <span className="flex items-center gap-2">
              <Home size={18} />
              退出
            </span>
          </NeonButton>
          <div className="font-orbitron text-xl">
            <span className="text-white/60">回合</span>
            <span className="text-arena-cyan font-bold mx-2 text-shadow-cyan">{currentRound}</span>
            <span className="text-white/60">/ {rules.rounds}</span>
          </div>
          <div className="flex items-center gap-2">
            {[0, 1].map(team => (
              <div key={team} className={cn(
                'px-3 py-1 rounded-lg font-orbitron font-bold',
                team === 0 ? 'bg-arena-cyan/20 text-arena-cyan' : 'bg-arena-orange/20 text-arena-orange'
              )}>
                队伍{team + 1}: {roundWins[team] || 0}胜
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {engineStateRef.current && (
            <div className="font-orbitron text-lg text-white/80">
              ⏱️ {Math.floor(engineStateRef.current.timeElapsed)}s
            </div>
          )}
          <NeonButton
            variant={isPaused ? 'gold' : 'purple'}
            size="sm"
            onClick={() => {
              setPaused(!isPaused);
              if (engineRef.current) {
                if (isPaused) {
                  engineRef.current.start();
                } else {
                  engineRef.current.stop();
                }
              }
            }}
          >
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
          </NeonButton>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl" style={{ aspectRatio: `${ARENA_WIDTH}/${ARENA_HEIGHT}` }}>
            <canvas
              ref={canvasRef}
              width={ARENA_WIDTH}
              height={ARENA_HEIGHT}
              className="w-full h-full rounded-xl border-2 border-arena-cyan/50"
              style={{ imageRendering: 'pixelated' }}
            />

            {roundCountdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
                <div className="text-center">
                  <div className="font-orbitron text-8xl font-black text-arena-cyan text-shadow-cyan animate-pulse">
                    {roundCountdown > 0 ? roundCountdown : 'FIGHT!'}
                  </div>
                  <div className="font-zcool text-2xl text-white/80 mt-4">
                    第 {currentRound} 回合即将开始...
                  </div>
                </div>
              </div>
            )}

            {isPaused && roundCountdown === null && !showResult && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-xl">
                <NeonCard color="purple" className="p-8 min-w-[400px]">
                  <h2 className="font-orbitron text-3xl font-bold text-arena-purpleLight text-center mb-6">
                    ⏸️ 游戏暂停
                  </h2>
                  
                  <div className="space-y-4 mb-6">
                    <h3 className="font-orbitron text-xl text-arena-cyan">伤害统计</h3>
                    <div className="space-y-2">
                      {fighters.map(f => {
                        const fd = getFighterById(f.fighterId);
                        return (
                          <div key={f.id} className="flex items-center justify-between p-2 bg-arena-darker rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{fd?.avatar}</span>
                              <span className="font-zcool text-white">{fd?.name}</span>
                              <span className={cn(
                                'text-xs px-2 py-0.5 rounded',
                                f.team === 0 ? 'bg-arena-cyan/30 text-arena-cyan' : 'bg-arena-orange/30 text-arena-orange'
                              )}>
                                队{f.team + 1}
                              </span>
                            </div>
                            <div className="flex gap-4 font-orbitron text-sm">
                              <span className="text-arena-red">伤害: {f.damageDealt}</span>
                              <span className="text-arena-cyan">击杀: {f.kills}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <NeonButton variant="cyan" size="md" className="flex-1" onClick={() => {
                      setPaused(false);
                      engineRef.current?.start();
                    }}>
                      <span className="flex items-center justify-center gap-2">
                        <Play size={20} />
                        继续游戏
                      </span>
                    </NeonButton>
                    <NeonButton variant="orange" size="md" className="flex-1" onClick={handleRestart}>
                      <span className="flex items-center justify-center gap-2">
                        <RotateCcw size={20} />
                        重新开始
                      </span>
                    </NeonButton>
                  </div>
                </NeonCard>
              </div>
            )}

            {showResult && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-xl overflow-auto">
                <NeonCard color="gold" className="p-8 min-w-[600px] max-w-[800px] text-center my-8">
                  <div className="text-6xl mb-4">🏆</div>
                  <h2 className="font-orbitron text-4xl font-black text-arena-gold text-shadow-gold mb-4">
                    战斗结束！
                  </h2>
                  <p className="font-zcool text-2xl text-white mb-2">
                    <span className={winner === 0 ? 'text-arena-cyan' : 'text-arena-orange'}>
                      队伍 {winner !== null ? winner + 1 : '?'}
                    </span>
                    {' '}获得胜利！
                  </p>
                  <p className="font-zcool text-sm text-white/50 mb-6">
                    总用时: {Math.floor(totalTimeRef.current / 60)}分{Math.floor(totalTimeRef.current % 60)}秒
                  </p>

                  <div className="mb-6">
                    <h3 className="font-orbitron text-xl text-arena-cyan mb-4 text-left">📋 每回合胜负</h3>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {allRoundResultsRef.current.map((result, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'px-4 py-2 rounded-lg border-2 font-orbitron text-sm',
                            result.winner === 0 
                              ? 'border-arena-cyan bg-arena-cyan/20 text-arena-cyan' 
                              : 'border-arena-orange bg-arena-orange/20 text-arena-orange'
                          )}
                        >
                          第{result.round}回合 · 队{result.winner + 1}胜
                          <span className="text-white/50 ml-2 text-xs">
                            ({Math.floor(result.timeElapsed)}秒)
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center gap-8 mt-4">
                      <div className="text-center">
                        <div className="text-3xl font-orbitron font-bold text-arena-cyan">
                          {roundWins[0] || 0}
                        </div>
                        <div className="text-sm text-white/50 font-zcool">队1胜场</div>
                      </div>
                      <div className="text-3xl text-white/30 font-orbitron">:</div>
                      <div className="text-center">
                        <div className="text-3xl font-orbitron font-bold text-arena-orange">
                          {roundWins[1] || 0}
                        </div>
                        <div className="text-sm text-white/50 font-zcool">队2胜场</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 text-left">
                    {fighters.map(f => {
                      const fd = getFighterById(f.fighterId);
                      const isWinner = f.team === winner;
                      const cumulative = cumulativeStatsRef.current[f.fighterId] || {
                        damageDealt: f.damageDealt,
                        damageTaken: f.damageTaken,
                        kills: f.kills,
                        deaths: f.deaths,
                      };
                      return (
                        <div
                          key={f.id}
                          className={cn(
                            'p-3 rounded-lg border-2',
                            isWinner ? 'border-arena-gold bg-arena-gold/10' : 'border-white/20 bg-arena-darker'
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{fd?.avatar}</span>
                            <span className="font-zcool text-white">{fd?.name}</span>
                            {isWinner && <Trophy className="text-arena-gold" size={18} />}
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-xs font-orbitron text-white/70">
                            <span className="text-arena-red">总伤害: {cumulative.damageDealt}</span>
                            <span className="text-arena-cyan">总承伤: {cumulative.damageTaken}</span>
                            <span className="text-arena-orange">总击杀: {cumulative.kills}</span>
                            <span className="text-arena-purpleLight">总死亡: {cumulative.deaths}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {(battleResult?.newTitles && battleResult.newTitles.length > 0 || battleResult?.newEmotes && battleResult.newEmotes.length > 0) && (
                    <div className="mb-6">
                      <h3 className="font-orbitron text-xl text-arena-gold mb-4 text-left">🎉 新解锁内容</h3>
                      <div className="flex flex-wrap gap-3 justify-center">
                        {battleResult?.newTitles?.map(tid => {
                          const title = TITLES.find(t => t.id === tid);
                          if (!title) return null;
                          return (
                            <div
                              key={tid}
                              onClick={() => setSelectedUnlock({ type: 'title', id: tid })}
                              className="px-4 py-3 rounded-lg bg-arena-gold/15 border-2 border-arena-gold hover:bg-arena-gold/25 cursor-pointer transition-all animate-pulse-neon"
                            >
                              <div className="text-3xl text-center mb-1">{title.icon}</div>
                              <div className="font-zcool text-arena-gold text-sm text-center">{title.name}</div>
                              <div className="text-xs text-white/50 text-center">称号</div>
                            </div>
                          );
                        })}
                        {battleResult?.newEmotes?.map(eid => {
                          const emote = EMOTES.find(e => e.id === eid);
                          if (!emote) return null;
                          return (
                            <div
                              key={eid}
                              onClick={() => setSelectedUnlock({ type: 'emote', id: eid })}
                              className="px-4 py-3 rounded-lg bg-arena-purpleLight/15 border-2 border-arena-purpleLight hover:bg-arena-purpleLight/25 cursor-pointer transition-all animate-pulse-neon"
                            >
                              <div className="text-3xl text-center mb-1">{emote.icon}</div>
                              <div className="font-zcool text-arena-purpleLight text-sm text-center">{emote.name}</div>
                              <div className="text-xs text-white/50 text-center">表情</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="font-orbitron text-xl text-arena-purpleLight mb-4 text-left">🎯 战斗统计</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {(() => {
                        const totalItems = Object.values(cumulativeStatsRef.current).reduce((sum: number, s: any) => sum + (s.itemsUsed || 0), 0);
                        const totalKills = Object.values(cumulativeStatsRef.current).reduce((sum: number, s: any) => sum + (s.kills || 0), 0);
                        const totalDamage = Object.values(cumulativeStatsRef.current).reduce((sum: number, s: any) => sum + (s.damageDealt || 0), 0);
                        const totalSpecials = Object.values(cumulativeStatsRef.current).reduce((sum: number, s: any) => sum + (s.specialUsed || 0), 0);
                        return (
                          <>
                            <div className="p-2 rounded bg-arena-darker border border-white/10 text-center">
                              <div className="text-2xl">🎒</div>
                              <div className="font-orbitron text-white text-lg">{totalItems}</div>
                              <div className="text-xs text-white/50 font-zcool">道具使用</div>
                            </div>
                            <div className="p-2 rounded bg-arena-darker border border-white/10 text-center">
                              <div className="text-2xl">⚔️</div>
                              <div className="font-orbitron text-white text-lg">{totalKills}</div>
                              <div className="text-xs text-white/50 font-zcool">总击杀</div>
                            </div>
                            <div className="p-2 rounded bg-arena-darker border border-white/10 text-center">
                              <div className="text-2xl">💥</div>
                              <div className="font-orbitron text-white text-lg">{totalDamage}</div>
                              <div className="text-xs text-white/50 font-zcool">总伤害</div>
                            </div>
                            <div className="p-2 rounded bg-arena-darker border border-white/10 text-center">
                              <div className="text-2xl">⚡</div>
                              <div className="font-orbitron text-white text-lg">{totalSpecials}</div>
                              <div className="text-xs text-white/50 font-zcool">必杀次数</div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {selectedUnlock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10 rounded-xl" onClick={() => setSelectedUnlock(null)}>
                      <NeonCard
                        color={selectedUnlock.type === 'title' ? 'gold' : 'purple'}
                        className="p-6 max-w-sm text-center"
                      >
                        {(() => {
                          if (selectedUnlock.type === 'title') {
                            const t = TITLES.find(x => x.id === selectedUnlock.id);
                            if (!t) return null;
                            return (
                              <>
                                <div className="text-6xl mb-3">{t.icon}</div>
                                <h3 className="font-orbitron text-2xl font-bold text-arena-gold mb-2">{t.name}</h3>
                                <p className="font-zcool text-white/80 mb-3">{t.description}</p>
                                <div className="p-3 rounded bg-black/30 text-left">
                                  <div className="text-xs text-white/60 font-zcool mb-1">解锁条件：{t.condition}</div>
                                  <div className="text-xs text-arena-cyan font-orbitron">进度：{t.progress} / {t.target}</div>
                                </div>
                              </>
                            );
                          } else {
                            const e = EMOTES.find(x => x.id === selectedUnlock.id);
                            if (!e) return null;
                            return (
                              <>
                                <div className="text-6xl mb-3">{e.icon}</div>
                                <h3 className="font-orbitron text-2xl font-bold text-arena-purpleLight mb-2">{e.name}</h3>
                                <p className="font-zcool text-white/80 mb-3">表情收藏已解锁！</p>
                                <div className="p-3 rounded bg-black/30 text-left">
                                  <div className="text-xs text-white/60 font-zcool">在排行榜的表情收藏页查看和使用</div>
                                </div>
                              </>
                            );
                          }
                        })()}
                        <NeonButton variant="cyan" size="sm" className="mt-4 w-full" onClick={() => setSelectedUnlock(null)}>
                          关闭
                        </NeonButton>
                      </NeonCard>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <NeonButton variant="cyan" size="lg" className="flex-1" onClick={handleRestart}>
                      <span className="flex items-center justify-center gap-2">
                        <RotateCcw size={22} />
                        再来一局
                      </span>
                    </NeonButton>
                    <NeonButton variant="gold" size="lg" className="flex-1" onClick={() => setScreen('ranking')}>
                      <span className="flex items-center justify-center gap-2">
                        <Trophy size={22} />
                        排行榜
                      </span>
                    </NeonButton>
                    <NeonButton variant="purple" size="lg" className="flex-1" onClick={handleExit}>
                      <span className="flex items-center justify-center gap-2">
                        <ArrowLeft size={22} />
                        主菜单
                      </span>
                    </NeonButton>
                  </div>
                </NeonCard>
              </div>
            )}
          </div>
        </div>

        {playerFighter && playerData && roundCountdown === null && (
          <>
            <div className="absolute top-4 left-4 w-64">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{playerData.avatar}</span>
                <span className="font-zcool text-white text-lg">{playerData.name}</span>
                <span className="px-2 py-0.5 bg-arena-cyan/30 text-arena-cyan text-xs rounded font-orbitron">YOU</span>
              </div>
              <div className="h-4 bg-arena-darker rounded-full overflow-hidden border border-arena-red/50">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${(playerFighter.hp / playerFighter.maxHp) * 100}%`,
                    background: 'linear-gradient(90deg, #ef4444, #f97316)',
                    boxShadow: '0 0 10px #ef4444',
                  }}
                />
              </div>
              <div className="flex justify-between text-xs font-orbitron mt-1">
                <span className="text-arena-red">HP</span>
                <span className="text-white">{playerFighter.hp} / {playerFighter.maxHp}</span>
              </div>
              <div className="h-3 bg-arena-darker rounded-full overflow-hidden border border-arena-gold/50 mt-2">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${(playerFighter.energy / playerFighter.maxEnergy) * 100}%`,
                    background: 'linear-gradient(90deg, #fbbf24, #f97316)',
                    boxShadow: playerFighter.energy >= playerFighter.maxEnergy ? '0 0 15px #fbbf24' : '0 0 5px #fbbf24',
                  }}
                />
              </div>
              <div className="flex justify-between text-xs font-orbitron mt-1">
                <span className="text-arena-gold">能量 [U]</span>
                <span className={playerFighter.energy >= playerFighter.maxEnergy ? 'text-arena-gold animate-pulse' : 'text-white'}>
                  {Math.floor(playerFighter.energy)}%
                </span>
              </div>
              {playerFighter.buffs.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {playerFighter.buffs.map((buff, i) => (
                    <div key={i} className="px-2 py-0.5 bg-arena-purple/30 rounded text-xs font-orbitron text-arena-purpleLight">
                      {buff.type === 'power' ? '💪' : buff.type === 'speed' ? '⚡' : buff.type === 'shield' ? '🛡️' : '🐌'}
                      {Math.ceil(buff.remainingTime)}s
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="flex gap-3 p-3 bg-arena-dark/80 backdrop-blur-sm rounded-xl border border-arena-cyan/30">
                {[
                  { key: 'A/D', label: '移动', icon: '🏃' },
                  { key: '空格', label: '跳跃', icon: '⬆️' },
                  { key: 'J', label: '轻击', icon: '👊' },
                  { key: 'K', label: '重击', icon: '💥' },
                  { key: 'L', label: '闪避', icon: '💨' },
                  { key: 'U', label: '必杀', icon: '✨' },
                  { key: 'P/ESC', label: '暂停', icon: '⏸️' },
                ].map(ctrl => (
                  <div key={ctrl.key} className="text-center">
                    <div className="text-2xl">{ctrl.icon}</div>
                    <div className="font-orbitron text-xs text-arena-cyan font-bold">{ctrl.key}</div>
                    <div className="font-zcool text-xs text-white/60">{ctrl.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {fighters.filter(f => !f.isPlayer).map(f => {
            const fd = getFighterById(f.fighterId);
            if (!fd) return null;
            return (
              <div key={f.id} className="w-48 p-2 bg-arena-dark/80 backdrop-blur-sm rounded-lg border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{fd.avatar}</span>
                  <span className="font-zcool text-white text-sm truncate">{fd.name}</span>
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded ml-auto',
                    f.team === 0 ? 'bg-arena-cyan/30 text-arena-cyan' : 'bg-arena-orange/30 text-arena-orange'
                  )}>
                    AI
                  </span>
                </div>
                <div className="h-2 bg-arena-darker rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(f.hp / f.maxHp) * 100}%`,
                      background: f.team === 0 ? '#06b6d4' : '#f97316',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
