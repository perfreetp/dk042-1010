import { create } from 'zustand';
import {
  GameState,
  ScreenType,
  GameRules,
  Difficulty,
  RankingRecord,
  Title,
  Emote,
  Proficiency,
  RulePreset,
  BattleResult,
} from '@/engine/types';
import { FIGHTERS } from '@/data/fighters';
import { ITEMS } from '@/data/items';
import { WEAPONS } from '@/data/weapons';
import { TRAP_TEMPLATES } from '@/data/traps';
import { TITLES, EMOTES } from '@/data/titles';
import { loadFromStorage, saveToStorage } from '@/utils/storage';
import { generateId } from '@/utils/math';

const DEFAULT_RULES: GameRules = {
  rounds: 3,
  winCondition: 'ko',
  winValue: 2,
  aiAggression: 50,
  aiDifficulty: 'normal',
  traps: TRAP_TEMPLATES.reduce((acc, trap) => {
    acc[trap.id] = trap.enabled;
    return acc;
  }, {} as { [key: string]: boolean }),
  randomItems: true,
  itemSpawnRate: 50,
  weaponSpawn: true,
  playerCount: 2,
  battleTime: 120,
};

const DEFAULT_ITEM_RATES = ITEMS.reduce((acc, item) => {
  acc[item.id] = item.spawnRate;
  return acc;
}, {} as { [itemId: string]: number });

const DEFAULT_WEAPON_ENABLED = WEAPONS.reduce((acc, weapon) => {
  acc[weapon.id] = true;
  return acc;
}, {} as { [weaponId: string]: boolean });

const DEFAULT_RANKINGS: RankingRecord[] = FIGHTERS.map(f => ({
  fighterId: f.id,
  wins: 0,
  losses: 0,
  totalDamage: 0,
  kills: 0,
  deaths: 0,
}));

const DEFAULT_PROFICIENCIES: Proficiency[] = FIGHTERS.map(f => ({
  fighterId: f.id,
  level: 1,
  exp: 0,
  expToNext: 100,
}));

const getInitialState = (): GameState => {
  const savedPresets = loadFromStorage<RulePreset[]>('arena_presets', []);
  const savedRankings = loadFromStorage<RankingRecord[]>('arena_rankings', DEFAULT_RANKINGS);
  const savedTitles = loadFromStorage<Title[]>('arena_titles', TITLES);
  const savedEmotes = loadFromStorage<Emote[]>('arena_emotes', EMOTES);
  const savedProficiencies = loadFromStorage<Proficiency[]>('arena_proficiencies', DEFAULT_PROFICIENCIES);
  const savedItemRates = loadFromStorage<{ [itemId: string]: number }>('arena_item_rates', DEFAULT_ITEM_RATES);

  return {
    screen: 'menu',
    selectedFighters: [],
    playerTeams: {},
    aiDifficulty: 'normal',
    rules: DEFAULT_RULES,
    presets: savedPresets,
    rankings: savedRankings,
    titles: savedTitles,
    emotes: savedEmotes,
    proficiencies: savedProficiencies,
    itemRates: savedItemRates,
    weaponEnabled: DEFAULT_WEAPON_ENABLED,
    battleResult: null,
    isPaused: false,
    currentRound: 1,
    roundWins: { 0: 0, 1: 0, 2: 0, 3: 0 },
  };
};

interface GameStore extends GameState {
  setScreen: (screen: ScreenType) => void;
  selectFighter: (fighterId: string, team?: number) => void;
  deselectFighter: (fighterId: string) => void;
  clearSelectedFighters: () => void;
  setAIDifficulty: (difficulty: Difficulty) => void;
  updateRules: (rules: Partial<GameRules>) => void;
  toggleTrap: (trapId: string) => void;
  updateItemRate: (itemId: string, rate: number) => void;
  toggleWeapon: (weaponId: string) => void;
  savePreset: (name: string) => void;
  loadPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => void;
  setPaused: (paused: boolean) => void;
  setCurrentRound: (round: number) => void;
  addRoundWin: (team: number) => void;
  setBattleResult: (result: BattleResult | null) => void;
  updateRankings: (winnerTeam: number, fighterStats: any) => void;
  updateTitles: (stats: any) => string[];
  updateEmotes: () => string[];
  updateProficiencies: (expGained: { [fighterId: string]: number }) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...getInitialState(),

  setScreen: (screen) => set({ screen }),

  selectFighter: (fighterId, team = 0) => set((state) => {
    if (state.selectedFighters.includes(fighterId)) return state;
    if (state.selectedFighters.length >= 4) return state;
    const teamAssignment = state.selectedFighters.length < 2 
      ? state.selectedFighters.length % 2 
      : state.selectedFighters.length % 2;
    return {
      selectedFighters: [...state.selectedFighters, fighterId],
      playerTeams: { ...state.playerTeams, [fighterId]: team },
    };
  }),

  deselectFighter: (fighterId) => set((state) => {
    const newTeams = { ...state.playerTeams };
    delete newTeams[fighterId];
    return {
      selectedFighters: state.selectedFighters.filter(id => id !== fighterId),
      playerTeams: newTeams,
    };
  }),

  clearSelectedFighters: () => set({
    selectedFighters: [],
    playerTeams: {},
  }),

  setAIDifficulty: (difficulty) => set({ aiDifficulty: difficulty }),

  updateRules: (rules) => set((state) => ({
    rules: { ...state.rules, ...rules },
  })),

  toggleTrap: (trapId) => set((state) => ({
    rules: {
      ...state.rules,
      traps: {
        ...state.rules.traps,
        [trapId]: !state.rules.traps[trapId],
      },
    },
  })),

  updateItemRate: (itemId, rate) => set((state) => {
    const newRates = { ...state.itemRates, [itemId]: rate };
    saveToStorage('arena_item_rates', newRates);
    return { itemRates: newRates };
  }),

  toggleWeapon: (weaponId) => set((state) => ({
    weaponEnabled: {
      ...state.weaponEnabled,
      [weaponId]: !state.weaponEnabled[weaponId],
    },
  })),

  savePreset: (name) => set((state) => {
    const newPreset: RulePreset = {
      id: generateId(),
      name,
      rules: { ...state.rules },
      itemRates: { ...state.itemRates },
      createdAt: Date.now(),
    };
    const newPresets = [...state.presets, newPreset];
    saveToStorage('arena_presets', newPresets);
    return { presets: newPresets };
  }),

  loadPreset: (presetId) => set((state) => {
    const preset = state.presets.find(p => p.id === presetId);
    if (!preset) return state;
    return {
      rules: { ...preset.rules },
      itemRates: { ...preset.itemRates },
    };
  }),

  deletePreset: (presetId) => set((state) => {
    const newPresets = state.presets.filter(p => p.id !== presetId);
    saveToStorage('arena_presets', newPresets);
    return { presets: newPresets };
  }),

  setPaused: (paused) => set({ isPaused: paused }),

  setCurrentRound: (round) => set({ currentRound: round }),

  addRoundWin: (team) => set((state) => ({
    roundWins: {
      ...state.roundWins,
      [team]: (state.roundWins[team] || 0) + 1,
    },
  })),

  setBattleResult: (result) => set({ battleResult: result }),

  updateRankings: (winnerTeam, fighterStats) => set((state) => {
    const newRankings = state.rankings.map(r => {
      const fighter = state.selectedFighters.find(fid => {
        const stats = fighterStats[fid];
        return fid === r.fighterId && stats;
      });
      if (!fighter) return r;
      const stats = fighterStats[fighter];
      const isWinner = state.playerTeams[fighter] === winnerTeam;
      return {
        ...r,
        wins: r.wins + (isWinner ? 1 : 0),
        losses: r.losses + (isWinner ? 0 : 1),
        totalDamage: r.totalDamage + (stats?.damageDealt || 0),
        kills: r.kills + (stats?.kills || 0),
        deaths: r.deaths + (stats?.deaths || 0),
      };
    });
    saveToStorage('arena_rankings', newRankings);
    return { rankings: newRankings };
  }),

  updateTitles: (stats) => {
    const state = get();
    const newTitles: Title[] = [];
    const unlockedIds: string[] = [];
    
    state.titles.forEach(title => {
      if (title.unlocked) {
        newTitles.push(title);
        return;
      }
      let progress = title.progress;
      let shouldUnlock = false;
      
      switch (title.id) {
        case 'title_first_win':
        case 'title_veteran':
        case 'title_legend':
          progress = state.rankings.reduce((sum, r) => sum + r.wins, 0) + (stats.won ? 1 : 0);
          shouldUnlock = progress >= title.target;
          break;
        case 'title_berserker':
          progress = Math.max(progress, stats.maxDamage || 0);
          shouldUnlock = progress >= title.target;
          break;
        case 'title_untouchable':
          progress = stats.minDamageTaken !== undefined ? Math.min(progress || 999, stats.minDamageTaken) : progress;
          shouldUnlock = stats.minDamageTaken !== undefined && stats.minDamageTaken <= title.target;
          break;
        case 'title_killer':
          progress = Math.max(progress, stats.maxKills || 0);
          shouldUnlock = progress >= title.target;
          break;
        case 'title_survivor':
          if (stats.survivedLowHp) progress = 1;
          shouldUnlock = progress >= title.target;
          break;
        case 'title_tactician':
          progress = (progress || 0) + (stats.itemsUsed || 0);
          shouldUnlock = progress >= title.target;
          break;
      }
      
      if (shouldUnlock && !title.unlocked) {
        unlockedIds.push(title.id);
      }
      
      newTitles.push({
        ...title,
        progress: Math.min(progress, title.target),
        unlocked: title.unlocked || shouldUnlock,
      });
    });
    
    saveToStorage('arena_titles', newTitles);
    set({ titles: newTitles });
    return unlockedIds;
  },

  updateEmotes: () => {
    const state = get();
    const totalWins = state.rankings.reduce((sum, r) => sum + r.wins, 0);
    const newEmotes = state.emotes.map(emote => {
      if (emote.unlocked) return emote;
      const index = EMOTES.findIndex(e => e.id === emote.id);
      const unlockThreshold = index * 3;
      if (totalWins >= unlockThreshold) {
        return { ...emote, unlocked: true };
      }
      return emote;
    });
    const newlyUnlocked = newEmotes.filter((e, i) => e.unlocked && !state.emotes[i].unlocked).map(e => e.id);
    saveToStorage('arena_emotes', newEmotes);
    set({ emotes: newEmotes });
    return newlyUnlocked;
  },

  updateProficiencies: (expGained) => set((state) => {
    const newProficiencies = state.proficiencies.map(p => {
      const gained = expGained[p.fighterId] || 0;
      if (gained === 0) return p;
      let exp = p.exp + gained;
      let level = p.level;
      let expToNext = p.expToNext;
      while (exp >= expToNext) {
        exp -= expToNext;
        level++;
        expToNext = Math.floor(expToNext * 1.5);
      }
      return { ...p, exp, level, expToNext };
    });
    saveToStorage('arena_proficiencies', newProficiencies);
    return { proficiencies: newProficiencies };
  }),

  resetGame: () => set({
    currentRound: 1,
    roundWins: { 0: 0, 1: 0, 2: 0, 3: 0 },
    battleResult: null,
    isPaused: false,
  }),
}));
