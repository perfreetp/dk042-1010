import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { NeonButton } from '@/components/layout/NeonButton';
import { Swords, Trophy, Settings, Play } from 'lucide-react';

export const MainMenu: React.FC = () => {
  const { setScreen } = useGameStore();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-noise bg-grid relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-arena-purple/10 via-transparent to-arena-cyan/10" />
      
      <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-arena-cyan/20 blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-arena-orange/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 rounded-full bg-arena-purpleLight/20 blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />

      <div className="relative z-10 text-center mb-16">
        <div className="text-8xl mb-4 animate-float">
          ⚔️
        </div>
        <h1 className="font-orbitron text-6xl md:text-7xl font-black mb-4">
          <span className="text-arena-cyan text-shadow-cyan">AI</span>
          <span className="text-white mx-2">大乱斗</span>
          <span className="text-arena-orange text-shadow-orange">PARTY</span>
        </h1>
        <p className="font-zcool text-xl text-white/70 tracking-widest">
          🎮 本地多人派对格斗 · AI 智能体对战 🎮
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <span className="text-2xl animate-float" style={{ animationDelay: '0s' }}>🔥</span>
          <span className="text-2xl animate-float" style={{ animationDelay: '0.2s' }}>💥</span>
          <span className="text-2xl animate-float" style={{ animationDelay: '0.4s' }}>⚡</span>
          <span className="text-2xl animate-float" style={{ animationDelay: '0.6s' }}>🛡️</span>
          <span className="text-2xl animate-float" style={{ animationDelay: '0.8s' }}>❄️</span>
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-5 w-80">
        <NeonButton
          variant="cyan"
          size="lg"
          onClick={() => setScreen('select')}
          className="text-xl"
        >
          <span className="flex items-center justify-center gap-3">
            <Play size={28} fill="currentColor" />
            开始游戏
          </span>
        </NeonButton>

        <NeonButton
          variant="gold"
          size="lg"
          onClick={() => setScreen('ranking')}
          className="text-xl"
        >
          <span className="flex items-center justify-center gap-3">
            <Trophy size={28} />
            赛季排行榜
          </span>
        </NeonButton>

        <NeonButton
          variant="purple"
          size="lg"
          onClick={() => {}}
          className="text-xl"
        >
          <span className="flex items-center justify-center gap-3">
            <Settings size={28} />
            游戏设置
          </span>
        </NeonButton>
      </div>

      <div className="absolute bottom-6 text-white/40 font-zcool text-sm">
        <p>使用 WASD 移动 · J 轻击 · K 重击 · L 闪避 · 空格跳跃 · U 必杀技</p>
      </div>

      <div className="scanline-overlay" />
    </div>
  );
};
