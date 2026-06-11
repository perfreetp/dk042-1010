import { Weapon } from '@/engine/types';

export const WEAPONS: Weapon[] = [
  {
    id: 'weapon_sword',
    name: '霓虹光剑',
    icon: '⚔️',
    damage: 25,
    range: 70,
    type: 'sword',
    color: '#06b6d4',
  },
  {
    id: 'weapon_hammer',
    name: '雷霆战锤',
    icon: '🔨',
    damage: 45,
    range: 55,
    type: 'hammer',
    color: '#f97316',
  },
  {
    id: 'weapon_bow',
    name: '能量战弓',
    icon: '🏹',
    damage: 20,
    range: 200,
    type: 'bow',
    color: '#22c55e',
  },
  {
    id: 'weapon_shield',
    name: '反射护盾',
    icon: '🛡️',
    damage: 10,
    range: 45,
    type: 'shield',
    color: '#3b82f6',
  },
  {
    id: 'weapon_staff',
    name: '魔法法杖',
    icon: '🪄',
    damage: 35,
    range: 150,
    type: 'staff',
    color: '#a855f7',
  },
];

export const getWeaponById = (id: string): Weapon | undefined => {
  return WEAPONS.find(w => w.id === id);
};
