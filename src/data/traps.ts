import { ArenaTrap } from '@/engine/types';

export const TRAP_TEMPLATES: Omit<ArenaTrap, 'position' | 'active' | 'activeTimer' | 'currentCooldown'>[] = [
  {
    id: 'trap_spike',
    name: '地刺陷阱',
    icon: '📌',
    type: 'spike',
    enabled: true,
    width: 80,
    height: 20,
    cooldown: 3,
    damage: 30,
    color: '#ef4444',
  },
  {
    id: 'trap_spring',
    name: '弹射弹簧',
    icon: '🌀',
    type: 'spring',
    enabled: false,
    width: 60,
    height: 20,
    cooldown: 5,
    color: '#22c55e',
  },
  {
    id: 'trap_lava',
    name: '熔岩池',
    icon: '🌋',
    type: 'lava',
    enabled: false,
    width: 100,
    height: 30,
    cooldown: 1,
    damage: 15,
    color: '#f97316',
  },
  {
    id: 'trap_rock',
    name: '落石区',
    icon: '🪨',
    type: 'rock',
    enabled: false,
    width: 80,
    height: 80,
    cooldown: 4,
    damage: 40,
    color: '#78716c',
  },
  {
    id: 'trap_portal',
    name: '传送门',
    icon: '🌀',
    type: 'portal',
    enabled: false,
    width: 50,
    height: 80,
    cooldown: 8,
    color: '#a855f7',
  },
];

export const getTrapTemplateById = (id: string) => {
  return TRAP_TEMPLATES.find(t => t.id === id);
};
