export type Personality = 'aggressive' | 'defensive' | 'balanced' | 'tricky' | 'loyal' | 'betrayer';

export interface Fighter {
  id: string;
  name: string;
  avatar: string;
  color: string;
  personality: Personality;
  personalityDesc: string;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    energy: number;
  };
  specialName: string;
  specialDesc: string;
}

export type FighterStateType = 'idle' | 'walk' | 'jump' | 'attack_light' | 'attack_heavy' | 'dodge' | 'hurt' | 'ko' | 'special';

export interface FighterState {
  id: string;
  fighterId: string;
  isPlayer: boolean;
  team: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  facing: 'left' | 'right';
  state: FighterStateType;
  stateTimer: number;
  invincible: boolean;
  invincibleTimer: number;
  heldItemId: string | null;
  heldWeaponId: string | null;
  buffs: Buff[];
  allies: string[];
  betrayalRisk: number;
  damageDealt: number;
  damageTaken: number;
  kills: number;
  deaths: number;
  specialUsed: number;
  itemsUsed: number;
  isAI: boolean;
  aiAggression: number;
  lastActionTime: number;
  attackCooldown: number;
  onGround: boolean;
}

export type ItemType = 'heal' | 'power' | 'speed' | 'shield' | 'bomb' | 'smoke';

export interface Item {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: ItemType;
  value: number;
  duration?: number;
  spawnRate: number;
  color: string;
}

export interface ItemSpawn {
  id: string;
  itemId: string;
  position: { x: number; y: number };
  spawnTime: number;
}

export type WeaponType = 'sword' | 'hammer' | 'bow' | 'shield' | 'staff';

export interface Weapon {
  id: string;
  name: string;
  icon: string;
  damage: number;
  range: number;
  type: WeaponType;
  color: string;
}

export interface WeaponSpawn {
  id: string;
  weaponId: string;
  position: { x: number; y: number };
}

export type BuffType = 'power' | 'speed' | 'shield' | 'slow';

export interface Buff {
  id: string;
  type: BuffType;
  value: number;
  duration: number;
  remainingTime: number;
}

export type TrapType = 'spike' | 'spring' | 'lava' | 'rock' | 'portal';

export interface ArenaTrap {
  id: string;
  name: string;
  icon: string;
  type: TrapType;
  enabled: boolean;
  position: { x: number; y: number };
  width: number;
  height: number;
  cooldown: number;
  currentCooldown: number;
  damage?: number;
  color: string;
  active: boolean;
  activeTimer: number;
}

export type WinCondition = 'ko' | 'hp' | 'time';
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface GameRules {
  rounds: number;
  winCondition: WinCondition;
  winValue: number;
  aiAggression: number;
  aiDifficulty: Difficulty;
  traps: { [key: string]: boolean };
  randomItems: boolean;
  itemSpawnRate: number;
  weaponSpawn: boolean;
  playerCount: number;
  battleTime: number;
}

export interface RulePreset {
  id: string;
  name: string;
  rules: GameRules;
  itemRates: { [itemId: string]: number };
  createdAt: number;
}

export interface RankingRecord {
  fighterId: string;
  wins: number;
  losses: number;
  totalDamage: number;
  kills: number;
  deaths: number;
}

export interface Title {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  condition: string;
  progress: number;
  target: number;
}

export interface Emote {
  id: string;
  name: string;
  icon: string;
  unlocked: boolean;
}

export interface Proficiency {
  fighterId: string;
  level: number;
  exp: number;
  expToNext: number;
}

export interface BattleRecord {
  id: string;
  createdAt: number;
  winnerTeam: number;
  roundResults: RoundResult[];
  fighterStats: { [fighterId: string]: FighterBattleStats };
  fighterIds: string[];
  fighterTeams: { [fighterId: string]: number };
  totalTime: number;
  rules: GameRules;
  newTitles: string[];
  newEmotes: string[];
  expGained: { [fighterId: string]: number };
}

export interface ProficiencyLog {
  id: string;
  fighterId: string;
  timestamp: number;
  expGained: number;
  sources: {
    winBonus: number;
    damageBonus: number;
    participation: number;
  };
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  battleRecordId?: string;
}

export type UnlockSourceType = 'battle' | 'title' | 'emote' | 'proficiency';

export interface UnlockDetail {
  id: string;
  type: UnlockSourceType;
  name: string;
  icon: string;
  description: string;
  unlockedAt: number;
  source?: string;
  progress?: number;
  target?: number;
}

export type ScreenType = 'menu' | 'select' | 'rules' | 'workshop' | 'battle' | 'result' | 'ranking';

export interface RoundFighterStats {
  damageDealt: number;
  damageTaken: number;
  kills: number;
  deaths: number;
  specialUsed: number;
  itemsUsed: number;
}

export interface RoundTeamStats {
  totalDamage: number;
  koCount: number;
  itemsUsed: number;
  specialUsed: number;
  fighterStats: { [fighterId: string]: RoundFighterStats };
}

export type BattleEventType = 
  | 'ko' 
  | 'special' 
  | 'item_pickup' 
  | 'item_use' 
  | 'weapon_pickup' 
  | 'trap_trigger' 
  | 'respawn'
  | 'critical_hit'
  | 'betrayal'
  | 'ally_buff';

export interface BattleEvent {
  id: string;
  type: BattleEventType;
  timestamp: number;
  fighterId?: string;
  fighterName?: string;
  targetId?: string;
  targetName?: string;
  description: string;
  team?: number;
  value?: number;
}

export interface RoundResult {
  round: number;
  winner: number;
  timeElapsed: number;
  koCount: { [team: number]: number };
  teamStats: { [team: number]: RoundTeamStats };
  events: BattleEvent[];
}

export interface FighterBattleStats {
  damageDealt: number;
  damageTaken: number;
  kills: number;
  deaths: number;
  specialUsed: number;
  itemsUsed: number;
}

export interface BattleResult {
  winnerTeam: number;
  roundResults: RoundResult[];
  fighterStats: { [fighterStateId: string]: FighterBattleStats };
  newTitles: string[];
  newEmotes: string[];
  expGained: { [fighterId: string]: number };
  totalTime: number;
}

export interface GameState {
  screen: ScreenType;
  selectedFighters: string[];
  playerTeams: { [fighterId: string]: number };
  aiDifficulty: Difficulty;
  rules: GameRules;
  presets: RulePreset[];
  rankings: RankingRecord[];
  titles: Title[];
  emotes: Emote[];
  proficiencies: Proficiency[];
  itemRates: { [itemId: string]: number };
  weaponEnabled: { [weaponId: string]: boolean };
  battleResult: BattleResult | null;
  isPaused: boolean;
  currentRound: number;
  roundWins: { [team: number]: number };
  battleRecords: BattleRecord[];
  proficiencyLogs: ProficiencyLog[];
  selectedBattleRecord: BattleRecord | null;
}

export interface Particle {
  id: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface DamageNumber {
  id: string;
  position: { x: number; y: number };
  value: number;
  color: string;
  life: number;
  maxLife: number;
  isCritical: boolean;
}

export interface GameEvent {
  type: 'hit' | 'ko' | 'item_pickup' | 'trap_trigger' | 'alliance' | 'betrayal' | 'special' | 'round_end' | 'battle_end';
  data: any;
  timestamp: number;
}
