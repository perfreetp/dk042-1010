import {
  FighterState,
  ArenaTrap,
  ItemSpawn,
  WeaponSpawn,
  Particle,
  DamageNumber,
  GameRules,
  FighterStateType,
  Buff,
  GameEvent,
} from './types';
import { getFighterById } from '@/data/fighters';
import { getItemById, ITEMS } from '@/data/items';
import { getWeaponById, WEAPONS } from '@/data/weapons';
import { TRAP_TEMPLATES } from '@/data/traps';
import { clamp, distance, generateId, randomChoice, randomInt, randomRange, shuffle } from '@/utils/math';
import { checkAABBCollision, Rect } from '@/utils/collision';

export const ARENA_WIDTH = 1000;
export const ARENA_HEIGHT = 500;
export const GROUND_Y = 420;
export const GRAVITY = 0.8;
export const FIGHTER_WIDTH = 50;
export const FIGHTER_HEIGHT = 80;

export interface EngineState {
  fighters: FighterState[];
  traps: ArenaTrap[];
  itemSpawns: ItemSpawn[];
  weaponSpawns: WeaponSpawn[];
  particles: Particle[];
  damageNumbers: DamageNumber[];
  events: GameEvent[];
  timeElapsed: number;
  koCount: { [team: number]: number };
  isRunning: boolean;
  screenShake: number;
  slowMotion: number;
}

export class GameEngine {
  state: EngineState;
  rules: GameRules;
  playerTeams: { [fighterId: string]: number };
  selectedFighterIds: string[];
  itemRates: { [itemId: string]: number };
  weaponEnabled: { [weaponId: string]: boolean };
  private lastTime: number = 0;
  private itemSpawnTimer: number = 0;
  private weaponSpawnTimer: number = 0;
  private listeners: ((state: EngineState) => void)[] = [];
  private roundEnded: boolean = false;
  private respawnTimers: Map<string, number> = new Map();

  constructor(
    rules: GameRules, 
    selectedFighterIds: string[], 
    playerTeams: { [fighterId: string]: number },
    itemRates: { [itemId: string]: number } = {},
    weaponEnabled: { [weaponId: string]: boolean } = {}
  ) {
    this.rules = rules;
    this.selectedFighterIds = selectedFighterIds;
    this.playerTeams = playerTeams;
    this.itemRates = itemRates;
    this.weaponEnabled = weaponEnabled;
    this.state = this.createInitialState();
  }

  private createInitialState(): EngineState {
    const fighters: FighterState[] = [];
    
    this.selectedFighterIds.forEach((fighterId, index) => {
      const fighterData = getFighterById(fighterId);
      if (!fighterData) return;
      
      const team = this.playerTeams[fighterId] ?? (index % 2);
      const isPlayer = index === 0;
      const startX = team === 0 ? 150 + (index * 50) : ARENA_WIDTH - 150 - (index * 50);
      
      const betrayalRiskMap = {
        aggressive: 30,
        defensive: 10,
        balanced: 20,
        tricky: 60,
        loyal: 0,
        betrayer: 80,
      };
      
      fighters.push({
        id: generateId(),
        fighterId,
        isPlayer,
        team,
        position: { x: startX, y: GROUND_Y - FIGHTER_HEIGHT },
        velocity: { x: 0, y: 0 },
        hp: fighterData.stats.hp,
        maxHp: fighterData.stats.hp,
        energy: 0,
        maxEnergy: 100,
        facing: team === 0 ? 'right' : 'left',
        state: 'idle',
        stateTimer: 0,
        invincible: false,
        invincibleTimer: 0,
        heldItemId: null,
        heldWeaponId: null,
        buffs: [],
        allies: [],
        betrayalRisk: betrayalRiskMap[fighterData.personality],
        damageDealt: 0,
        damageTaken: 0,
        kills: 0,
        deaths: 0,
        specialUsed: 0,
        itemsUsed: 0,
        isAI: !isPlayer,
        aiAggression: this.rules.aiAggression,
        lastActionTime: 0,
        attackCooldown: 0,
        onGround: true,
      });
    });

    const traps: ArenaTrap[] = [];
    TRAP_TEMPLATES.forEach((template, index) => {
      if (this.rules.traps[template.id]) {
        const xPositions = [250, 500, 750];
        traps.push({
          ...template,
          position: { 
            x: xPositions[index % xPositions.length] - template.width / 2,
            y: GROUND_Y - template.height + 5,
          },
          active: false,
          activeTimer: 0,
          currentCooldown: 0,
        });
      }
    });

    return {
      fighters,
      traps,
      itemSpawns: [],
      weaponSpawns: [],
      particles: [],
      damageNumbers: [],
      events: [],
      timeElapsed: 0,
      koCount: { 0: 0, 1: 0, 2: 0, 3: 0 },
      isRunning: true,
      screenShake: 0,
      slowMotion: 0,
    };
  }

  subscribe(listener: (state: EngineState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.state));
  }

  start() {
    this.state.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop() {
    this.state.isRunning = false;
  }

  private gameLoop = () => {
    if (!this.state.isRunning) return;

    const now = performance.now();
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    const timeScale = this.state.slowMotion > 0 ? 0.3 : 1;
    this.update(deltaTime * timeScale);
    this.notify();

    requestAnimationFrame(this.gameLoop);
  };

  update(dt: number) {
    if (this.roundEnded) return;
    
    this.state.timeElapsed += dt;

    if (this.state.screenShake > 0) {
      this.state.screenShake = Math.max(0, this.state.screenShake - dt * 20);
    }
    if (this.state.slowMotion > 0) {
      this.state.slowMotion = Math.max(0, this.state.slowMotion - dt * 0.5);
    }

    this.updateFighters(dt);
    this.updateTraps(dt);
    this.updateItemSpawns(dt);
    this.updateWeaponSpawns(dt);
    this.updateParticles(dt);
    this.updateDamageNumbers(dt);
    this.checkWinCondition();
  }

  private updateFighters(dt: number) {
    this.state.fighters.forEach(fighter => {
      this.updateFighterBuffs(fighter, dt);

      if (fighter.invincible) {
        fighter.invincibleTimer -= dt;
        if (fighter.invincibleTimer <= 0) {
          fighter.invincible = false;
        }
      }

      if (fighter.attackCooldown > 0) {
        fighter.attackCooldown -= dt;
      }

      if (fighter.state === 'ko') {
        this.checkRespawn(fighter, dt);
        return;
      }

      if (fighter.stateTimer > 0) {
        fighter.stateTimer -= dt;
        if (fighter.stateTimer <= 0) {
          fighter.state = 'idle';
        }
      }

      if (fighter.isAI) {
        this.updateAI(fighter, dt);
      }

      this.applyPhysics(fighter, dt);
      this.checkFighterCollisions(fighter);
      this.checkTrapCollisions(fighter);
      this.checkItemPickup(fighter);
      this.checkWeaponPickup(fighter);
    });
  }

  private updateFighterBuffs(fighter: FighterState, dt: number) {
    fighter.buffs = fighter.buffs.filter(buff => {
      buff.remainingTime -= dt;
      return buff.remainingTime > 0;
    });
  }

  private applyPhysics(fighter: FighterState, dt: number) {
    const fighterData = getFighterById(fighter.fighterId);
    if (!fighterData) return;

    let speedMod = 1;
    const speedBuff = fighter.buffs.find(b => b.type === 'speed');
    if (speedBuff) speedMod += speedBuff.value;
    const slowBuff = fighter.buffs.find(b => b.type === 'slow');
    if (slowBuff) speedMod -= slowBuff.value;

    const baseSpeed = (fighterData.stats.speed / 100) * 300 * speedMod;

    if (fighter.state === 'walk') {
      const dir = fighter.facing === 'right' ? 1 : -1;
      fighter.velocity.x = dir * baseSpeed * dt * 60;
    } else if (fighter.state === 'dodge') {
      const dir = fighter.facing === 'right' ? 1 : -1;
      fighter.velocity.x = dir * baseSpeed * 2.5 * dt * 60;
    }

    fighter.velocity.y += GRAVITY;
    fighter.position.x += fighter.velocity.x;
    fighter.position.y += fighter.velocity.y;

    fighter.position.x = clamp(fighter.position.x, 20, ARENA_WIDTH - FIGHTER_WIDTH - 20);

    if (fighter.position.y >= GROUND_Y - FIGHTER_HEIGHT) {
      fighter.position.y = GROUND_Y - FIGHTER_HEIGHT;
      fighter.velocity.y = 0;
      fighter.onGround = true;
      if (fighter.state === 'jump') {
        fighter.state = 'idle';
      }
    } else {
      fighter.onGround = false;
    }

    fighter.velocity.x *= 0.85;
  }

  private checkFighterCollisions(fighter: FighterState) {
    this.state.fighters.forEach(other => {
      if (other.id === fighter.id || other.state === 'ko') return;
      if (fighter.state === 'ko') return;

      const fighterRect: Rect = {
        x: fighter.position.x,
        y: fighter.position.y,
        width: FIGHTER_WIDTH,
        height: FIGHTER_HEIGHT,
      };
      const otherRect: Rect = {
        x: other.position.x,
        y: other.position.y,
        width: FIGHTER_WIDTH,
        height: FIGHTER_HEIGHT,
      };

      if (checkAABBCollision(fighterRect, otherRect)) {
        const overlapX = Math.min(
          fighter.position.x + FIGHTER_WIDTH - other.position.x,
          other.position.x + FIGHTER_WIDTH - fighter.position.x
        );
        if (fighter.position.x < other.position.x) {
          fighter.position.x -= overlapX / 2;
        } else {
          fighter.position.x += overlapX / 2;
        }
      }
    });
  }

  private checkTrapCollisions(fighter: FighterState) {
    this.state.traps.forEach(trap => {
      if (!trap.active && trap.currentCooldown > 0) return;

      const fighterRect: Rect = {
        x: fighter.position.x,
        y: fighter.position.y,
        width: FIGHTER_WIDTH,
        height: FIGHTER_HEIGHT,
      };
      const trapRect: Rect = {
        x: trap.position.x,
        y: trap.position.y,
        width: trap.width,
        height: trap.height,
      };

      if (checkAABBCollision(fighterRect, trapRect)) {
        this.triggerTrap(trap, fighter);
      }
    });
  }

  private triggerTrap(trap: ArenaTrap, fighter: FighterState) {
    if (trap.currentCooldown > 0) return;

    trap.active = true;
    trap.activeTimer = 0.5;
    trap.currentCooldown = trap.cooldown;

    switch (trap.type) {
      case 'spike':
      case 'lava':
      case 'rock':
        if (trap.damage && !fighter.invincible) {
          this.applyDamage(fighter, trap.damage, trap.color);
        }
        break;
      case 'spring':
        fighter.velocity.y = -20;
        fighter.position.y -= 5;
        fighter.state = 'jump';
        break;
      case 'portal':
        const otherPortal = this.state.traps.find(t => t.type === 'portal' && t.id !== trap.id);
        if (otherPortal) {
          fighter.position.x = otherPortal.position.x;
          fighter.position.y = otherPortal.position.y - FIGHTER_HEIGHT;
        } else {
          fighter.position.x = randomRange(100, ARENA_WIDTH - 100);
        }
        break;
    }

    this.spawnParticles(trap.position.x + trap.width / 2, trap.position.y, trap.color, 15);
    this.addEvent('trap_trigger', { trapId: trap.id, fighterId: fighter.id });
  }

  private checkItemPickup(fighter: FighterState) {
    this.state.itemSpawns = this.state.itemSpawns.filter(spawn => {
      const fighterRect: Rect = {
        x: fighter.position.x,
        y: fighter.position.y,
        width: FIGHTER_WIDTH,
        height: FIGHTER_HEIGHT,
      };
      const itemRect: Rect = {
        x: spawn.position.x - 20,
        y: spawn.position.y - 20,
        width: 40,
        height: 40,
      };

      if (checkAABBCollision(fighterRect, itemRect)) {
        const item = getItemById(spawn.itemId);
        if (item) {
          this.applyItem(fighter, item);
          this.spawnParticles(spawn.position.x, spawn.position.y, item.color, 10);
          this.addEvent('item_pickup', { fighterId: fighter.id, itemId: spawn.itemId });
        }
        return false;
      }
      return true;
    });
  }

  private applyItem(fighter: FighterState, item: any) {
    fighter.itemsUsed++;
    
    switch (item.type) {
      case 'heal':
        const healAmount = Math.floor(fighter.maxHp * item.value);
        fighter.hp = Math.min(fighter.maxHp, fighter.hp + healAmount);
        this.addDamageNumber(fighter.position.x + FIGHTER_WIDTH / 2, fighter.position.y, healAmount, '#22c55e', false);
        break;
      case 'power':
        fighter.buffs.push({
          id: generateId(),
          type: 'power',
          value: item.value,
          duration: item.duration || 10,
          remainingTime: item.duration || 10,
        });
        break;
      case 'speed':
        fighter.buffs.push({
          id: generateId(),
          type: 'speed',
          value: item.value,
          duration: item.duration || 8,
          remainingTime: item.duration || 8,
        });
        break;
      case 'shield':
        const shieldAmount = Math.floor(fighter.maxHp * item.value);
        fighter.buffs.push({
          id: generateId(),
          type: 'shield',
          value: shieldAmount,
          duration: item.duration || 15,
          remainingTime: item.duration || 15,
        });
        break;
      case 'bomb':
        this.state.fighters.forEach(other => {
          if (other.id === fighter.id || other.state === 'ko') return;
          const dist = distance(
            fighter.position.x + FIGHTER_WIDTH / 2,
            fighter.position.y + FIGHTER_HEIGHT / 2,
            other.position.x + FIGHTER_WIDTH / 2,
            other.position.y + FIGHTER_HEIGHT / 2
          );
          if (dist < 150) {
            this.applyDamage(other, item.value, '#ef4444');
          }
        });
        this.state.screenShake = 0.5;
        this.spawnParticles(fighter.position.x + FIGHTER_WIDTH / 2, fighter.position.y + FIGHTER_HEIGHT / 2, '#ef4444', 30);
        break;
      case 'smoke':
        this.state.fighters.forEach(other => {
          if (other.id === fighter.id || other.state === 'ko') return;
          const dist = distance(
            fighter.position.x + FIGHTER_WIDTH / 2,
            fighter.position.y + FIGHTER_HEIGHT / 2,
            other.position.x + FIGHTER_WIDTH / 2,
            other.position.y + FIGHTER_HEIGHT / 2
          );
          if (dist < 200) {
            other.buffs.push({
              id: generateId(),
              type: 'slow',
              value: 0.5,
              duration: item.duration || 5,
              remainingTime: item.duration || 5,
            });
          }
        });
        this.spawnParticles(fighter.position.x + FIGHTER_WIDTH / 2, fighter.position.y + FIGHTER_HEIGHT / 2, '#9ca3af', 25);
        break;
    }
  }

  private checkWeaponPickup(fighter: FighterState) {
    if (fighter.heldWeaponId) return;
    
    this.state.weaponSpawns = this.state.weaponSpawns.filter(spawn => {
      const fighterRect: Rect = {
        x: fighter.position.x,
        y: fighter.position.y,
        width: FIGHTER_WIDTH,
        height: FIGHTER_HEIGHT,
      };
      const weaponRect: Rect = {
        x: spawn.position.x - 20,
        y: spawn.position.y - 20,
        width: 40,
        height: 40,
      };

      if (checkAABBCollision(fighterRect, weaponRect)) {
        fighter.heldWeaponId = spawn.weaponId;
        const weapon = getWeaponById(spawn.weaponId);
        if (weapon) {
          this.spawnParticles(spawn.position.x, spawn.position.y, weapon.color, 8);
        }
        return false;
      }
      return true;
    });
  }

  private checkRespawn(fighter: FighterState, dt: number) {
    if (fighter.state !== 'ko') return;
    
    if (fighter.deaths >= this.rules.winValue) {
      return;
    }
    
    const currentTimer = this.respawnTimers.get(fighter.id) ?? 2;
    const newTimer = currentTimer - dt;
    
    if (newTimer <= 0) {
      this.respawnTimers.delete(fighter.id);
      fighter.hp = fighter.maxHp;
      fighter.state = 'idle';
      fighter.invincible = true;
      fighter.invincibleTimer = 2;
      fighter.position.x = fighter.team === 0 ? 150 : ARENA_WIDTH - 150;
      fighter.position.y = GROUND_Y - FIGHTER_HEIGHT - 100;
      fighter.velocity.y = -5;
      fighter.energy = 0;
      fighter.heldItemId = null;
      fighter.heldWeaponId = null;
      fighter.buffs = [];
    } else {
      this.respawnTimers.set(fighter.id, newTimer);
    }
  }

  private updateTraps(dt: number) {
    this.state.traps.forEach(trap => {
      if (trap.currentCooldown > 0) {
        trap.currentCooldown -= dt;
      }
      if (trap.active) {
        trap.activeTimer -= dt;
        if (trap.activeTimer <= 0) {
          trap.active = false;
        }
      }
    });
  }

  private updateItemSpawns(dt: number) {
    if (!this.rules.randomItems) return;
    
    this.itemSpawnTimer += dt;
    const spawnInterval = 8 - (this.rules.itemSpawnRate / 100) * 5;
    
    if (this.itemSpawnTimer >= spawnInterval && this.state.itemSpawns.length < 5) {
      this.itemSpawnTimer = 0;
      this.spawnRandomItem();
    }
  }

  private spawnRandomItem() {
    const itemsWithWeight = ITEMS
      .map(item => {
        const rate = this.itemRates[item.id] ?? item.spawnRate;
        return { item, weight: rate };
      })
      .filter(({ weight }) => weight > 0);

    if (itemsWithWeight.length === 0) return;

    const totalWeight = itemsWithWeight.reduce((sum, { weight }) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedItem = itemsWithWeight[0].item;
    for (const { item, weight } of itemsWithWeight) {
      random -= weight;
      if (random <= 0) {
        selectedItem = item;
        break;
      }
    }

    this.state.itemSpawns.push({
      id: generateId(),
      itemId: selectedItem.id,
      position: {
        x: randomRange(100, ARENA_WIDTH - 100),
        y: randomRange(GROUND_Y - 200, GROUND_Y - 50),
      },
      spawnTime: this.state.timeElapsed,
    });
  }

  private updateWeaponSpawns(dt: number) {
    if (!this.rules.weaponSpawn) return;
    
    const enabledWeapons = WEAPONS.filter(w => this.weaponEnabled[w.id] !== false);
    if (enabledWeapons.length === 0) return;
    
    this.weaponSpawnTimer += dt;
    
    if (this.weaponSpawnTimer >= 15 && this.state.weaponSpawns.length < 2) {
      this.weaponSpawnTimer = 0;
      this.spawnRandomWeapon();
    }
  }

  private spawnRandomWeapon() {
    const availableWeapons = WEAPONS.filter(w => this.weaponEnabled[w.id] !== false);
    if (availableWeapons.length === 0) return;
    
    const weapon = randomChoice(availableWeapons);
    this.state.weaponSpawns.push({
      id: generateId(),
      weaponId: weapon.id,
      position: {
        x: randomRange(150, ARENA_WIDTH - 150),
        y: GROUND_Y - 40,
      },
    });
  }

  private updateParticles(dt: number) {
    this.state.particles = this.state.particles.filter(p => {
      p.position.x += p.velocity.x;
      p.position.y += p.velocity.y;
      p.velocity.y += 0.3;
      p.life -= dt;
      return p.life > 0;
    });
  }

  private updateDamageNumbers(dt: number) {
    this.state.damageNumbers = this.state.damageNumbers.filter(d => {
      d.position.y -= 50 * dt;
      d.life -= dt;
      return d.life > 0;
    });
  }

  spawnParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      this.state.particles.push({
        id: generateId(),
        position: { x, y },
        velocity: {
          x: randomRange(-5, 5),
          y: randomRange(-8, -2),
        },
        color,
        size: randomRange(3, 8),
        life: randomRange(0.5, 1.5),
        maxLife: 1.5,
      });
    }
  }

  addDamageNumber(x: number, y: number, value: number, color: string, isCritical: boolean) {
    this.state.damageNumbers.push({
      id: generateId(),
      position: { x, y },
      value,
      color,
      life: 1,
      maxLife: 1,
      isCritical,
    });
  }

  private addEvent(type: GameEvent['type'], data: any) {
    this.state.events.push({
      type,
      data,
      timestamp: this.state.timeElapsed,
    });
    if (this.state.events.length > 50) {
      this.state.events.shift();
    }
  }

  playerMove(direction: 'left' | 'right' | 'none') {
    const player = this.state.fighters.find(f => f.isPlayer);
    if (!player || player.state === 'ko') return;

    if (player.state === 'attack_light' || player.state === 'attack_heavy' || player.state === 'special' || player.state === 'hurt') {
      return;
    }

    if (direction === 'none') {
      if (player.state === 'walk') {
        player.state = 'idle';
      }
      return;
    }

    player.facing = direction;
    player.state = 'walk';
  }

  playerJump() {
    const player = this.state.fighters.find(f => f.isPlayer);
    if (!player || player.state === 'ko') return;

    if (player.onGround && player.state !== 'jump') {
      player.velocity.y = -15;
      player.state = 'jump';
    }
  }

  playerAttack(type: 'light' | 'heavy') {
    const player = this.state.fighters.find(f => f.isPlayer);
    if (!player || player.state === 'ko') return;
    if (player.attackCooldown > 0) return;

    this.performAttack(player, type);
  }

  playerDodge() {
    const player = this.state.fighters.find(f => f.isPlayer);
    if (!player || player.state === 'ko') return;
    if (!player.onGround) return;

    player.state = 'dodge';
    player.stateTimer = 0.3;
    player.invincible = true;
    player.invincibleTimer = 0.3;
    player.attackCooldown = 0.5;
  }

  playerSpecial() {
    const player = this.state.fighters.find(f => f.isPlayer);
    if (!player || player.state === 'ko') return;
    if (player.energy < player.maxEnergy) return;

    this.performSpecial(player);
  }

  private performAttack(fighter: FighterState, type: 'light' | 'heavy') {
    const fighterData = getFighterById(fighter.fighterId);
    if (!fighterData) return;

    fighter.state = type === 'light' ? 'attack_light' : 'attack_heavy';
    fighter.stateTimer = type === 'light' ? 0.25 : 0.45;
    fighter.attackCooldown = type === 'light' ? 0.35 : 0.6;

    const baseDamage = fighterData.stats.attack * (type === 'light' ? 0.6 : 1.2);
    let damage = baseDamage;

    const powerBuff = fighter.buffs.find(b => b.type === 'power');
    if (powerBuff) damage *= (1 + powerBuff.value);

    const weapon = fighter.heldWeaponId ? getWeaponById(fighter.heldWeaponId) : null;
    if (weapon) damage += weapon.damage;

    const range = weapon ? weapon.range : (type === 'light' ? 50 : 65);

    const attackX = fighter.facing === 'right'
      ? fighter.position.x + FIGHTER_WIDTH
      : fighter.position.x - range;

    const attackRect: Rect = {
      x: attackX,
      y: fighter.position.y + 10,
      width: range,
      height: FIGHTER_HEIGHT - 20,
    };

    this.state.fighters.forEach(target => {
      if (target.id === fighter.id || target.state === 'ko') return;
      if (target.invincible) return;

      const isAlly = fighter.allies.includes(target.id);
      const shouldTargetAlly = fighterData.personality === 'betrayer' && Math.random() * 100 < fighter.betrayalRisk;

      if (isAlly && !shouldTargetAlly && target.team === fighter.team) return;

      const targetRect: Rect = {
        x: target.position.x,
        y: target.position.y,
        width: FIGHTER_WIDTH,
        height: FIGHTER_HEIGHT,
      };

      if (checkAABBCollision(attackRect, targetRect)) {
        const isCritical = Math.random() < 0.15;
        const finalDamage = Math.floor(isCritical ? damage * 1.8 : damage);
        
        this.applyDamage(target, finalDamage, fighterData.color, isCritical);
        fighter.damageDealt += finalDamage;
        fighter.energy = Math.min(fighter.maxEnergy, fighter.energy + (type === 'light' ? 5 : 10));

        if (target.hp <= 0) {
          fighter.kills++;
          this.state.koCount[fighter.team]++;
          this.addEvent('ko', { killerId: fighter.id, victimId: target.id });
        }

        const knockback = type === 'light' ? 5 : 12;
        target.velocity.x = fighter.facing === 'right' ? knockback : -knockback;
        target.velocity.y = -3;

        if (isAlly && shouldTargetAlly) {
          this.addEvent('betrayal', { attackerId: fighter.id, victimId: target.id });
          fighter.allies = fighter.allies.filter(a => a !== target.id);
          target.allies = target.allies.filter(a => a !== fighter.id);
        }
      }
    });

    const hitX = fighter.facing === 'right' ? fighter.position.x + FIGHTER_WIDTH + 20 : fighter.position.x - 20;
    this.spawnParticles(hitX, fighter.position.y + FIGHTER_HEIGHT / 2, fighterData.color, type === 'light' ? 5 : 10);
    this.addEvent('hit', { attackerId: fighter.id, type });
  }

  private applyDamage(target: FighterState, damage: number, color: string, isCritical: boolean = false) {
    let actualDamage = damage;

    const shieldBuff = target.buffs.find(b => b.type === 'shield');
    if (shieldBuff) {
      if (shieldBuff.value >= actualDamage) {
        shieldBuff.value -= actualDamage;
        actualDamage = 0;
      } else {
        actualDamage -= shieldBuff.value;
        shieldBuff.remainingTime = 0;
      }
    }

    if (actualDamage <= 0) return;

    const targetData = getFighterById(target.fighterId);
    if (targetData) {
      const defenseMod = targetData.stats.defense / 200;
      actualDamage = Math.floor(actualDamage * (1 - defenseMod));
    }

    target.hp = Math.max(0, target.hp - actualDamage);
    target.damageTaken += actualDamage;
    target.state = 'hurt';
    target.stateTimer = 0.2;
    target.invincible = true;
    target.invincibleTimer = 0.3;

    if (target.hp <= 0) {
      target.hp = 0;
      target.state = 'ko';
      target.deaths++;
      target.energy = 0;
    }

    this.addDamageNumber(
      target.position.x + FIGHTER_WIDTH / 2,
      target.position.y,
      actualDamage,
      isCritical ? '#fbbf24' : color,
      isCritical
    );

    this.state.screenShake = Math.max(this.state.screenShake, isCritical ? 0.4 : 0.15);
  }

  private performSpecial(fighter: FighterState) {
    const fighterData = getFighterById(fighter.fighterId);
    if (!fighterData) return;

    fighter.energy = 0;
    fighter.state = 'special';
    fighter.stateTimer = 1;
    fighter.specialUsed++;
    fighter.invincible = true;
    fighter.invincibleTimer = 1;
    this.state.slowMotion = 0.5;
    this.state.screenShake = 0.8;

    const specialDamage = fighterData.stats.attack * 3;

    this.state.fighters.forEach(target => {
      if (target.id === fighter.id || target.state === 'ko') return;
      if (target.invincible) return;
      
      this.applyDamage(target, specialDamage, fighterData.color, true);
      fighter.damageDealt += specialDamage;
      fighter.energy = Math.min(fighter.maxEnergy, fighter.energy + 20);

      target.velocity.y = -10;
      target.velocity.x = target.position.x > fighter.position.x ? 15 : -15;

      if (target.hp <= 0) {
        fighter.kills++;
        this.state.koCount[fighter.team]++;
      }
    });

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.spawnParticles(
          randomRange(50, ARENA_WIDTH - 50),
          randomRange(100, GROUND_Y),
          fighterData.color,
          8
        );
      }, i * 80);
    }

    this.addEvent('special', { fighterId: fighter.id });
  }

  private updateAI(fighter: FighterState, dt: number) {
    if (fighter.state !== 'idle' && fighter.state !== 'walk' && fighter.state !== 'jump') {
      return;
    }

    fighter.lastActionTime += dt;

    const fighterData = getFighterById(fighter.fighterId);
    if (!fighterData) return;

    const difficultyDelay = {
      easy: 0.3,
      normal: 0.15,
      hard: 0.05,
    }[this.rules.aiDifficulty];

    if (fighter.lastActionTime < difficultyDelay) return;

    const enemies = this.state.fighters.filter(f => {
      if (f.id === fighter.id || f.state === 'ko') return false;
      const isAlly = fighter.allies.includes(f.id);
      return !isAlly;
    });

    const allies = this.state.fighters.filter(f => {
      if (f.id === fighter.id || f.state === 'ko') return false;
      return fighter.allies.includes(f.id) || f.team === fighter.team;
    });

    let nearestEnemy: FighterState | null = null;
    let minDist = Infinity;
    enemies.forEach(e => {
      const dist = distance(
        fighter.position.x + FIGHTER_WIDTH / 2,
        fighter.position.y + FIGHTER_HEIGHT / 2,
        e.position.x + FIGHTER_WIDTH / 2,
        e.position.y + FIGHTER_HEIGHT / 2
      );
      if (dist < minDist) {
        minDist = dist;
        nearestEnemy = e;
      }
    });

    if (!nearestEnemy) {
      fighter.state = 'idle';
      return;
    }

    const aggression = fighter.aiAggression / 100;
    const personalityFactor = {
      aggressive: 1.5,
      defensive: 0.5,
      balanced: 1,
      tricky: 1.2,
      loyal: 0.8,
      betrayer: 1.3,
    }[fighterData.personality];

    const effectiveAggression = aggression * personalityFactor;

    if (fighter.energy >= fighter.maxEnergy && Math.random() < 0.8) {
      this.performSpecial(fighter);
      fighter.lastActionTime = 0;
      return;
    }

    const hpPercent = fighter.hp / fighter.maxHp;
    
    if (hpPercent < 0.25 && fighterData.personality === 'defensive') {
      this.tryFindItem(fighter);
      fighter.lastActionTime = 0;
      return;
    }

    if (hpPercent < 0.3 && allies.length > 0 && fighterData.personality !== 'betrayer') {
      const nearestAlly = allies.reduce((nearest, a) => {
        const dist = distance(fighter.position.x, fighter.position.y, a.position.x, a.position.y);
        const nearestDist = distance(fighter.position.x, fighter.position.y, nearest.position.x, nearest.position.y);
        return dist < nearestDist ? a : nearest;
      }, allies[0]);
      
      if (!fighter.allies.includes(nearestAlly.id) && Math.random() < 0.3) {
        fighter.allies.push(nearestAlly.id);
        nearestAlly.allies.push(fighter.id);
        this.addEvent('alliance', { fighter1: fighter.id, fighter2: nearestAlly.id });
      }
    }

    if (fighterData.personality === 'betrayer' && allies.length > 0 && Math.random() * 100 < fighter.betrayalRisk * 0.1) {
      const allyToBetray = randomChoice(allies);
      nearestEnemy = allyToBetray;
    }

    const dx = nearestEnemy.position.x - fighter.position.x;
    fighter.facing = dx > 0 ? 'right' : 'left';

    const attackRange = fighter.heldWeaponId 
      ? (getWeaponById(fighter.heldWeaponId)?.range || 60) + 30
      : 70;

    if (Math.abs(dx) > attackRange) {
      fighter.state = 'walk';
      fighter.lastActionTime = 0;
    } else {
      const attackChance = 0.3 + effectiveAggression * 0.5;
      
      if (Math.random() < attackChance && fighter.attackCooldown <= 0) {
        const heavyChance = 0.2 + effectiveAggression * 0.3;
        this.performAttack(fighter, Math.random() < heavyChance ? 'heavy' : 'light');
      } else if (Math.random() < 0.2 && fighter.onGround && hpPercent < 0.5) {
        fighter.state = 'dodge';
        fighter.stateTimer = 0.3;
        fighter.invincible = true;
        fighter.invincibleTimer = 0.3;
      } else if (Math.random() < 0.1 && fighter.onGround) {
        fighter.velocity.y = -15;
        fighter.state = 'jump';
      }
      fighter.lastActionTime = 0;
    }
  }

  private tryFindItem(fighter: FighterState) {
    if (this.state.itemSpawns.length === 0) return;

    let nearestItem: ItemSpawn | null = null;
    let minDist = Infinity;
    
    this.state.itemSpawns.forEach(spawn => {
      const item = getItemById(spawn.itemId);
      if (!item || item.type !== 'heal') return;
      
      const dist = distance(
        fighter.position.x + FIGHTER_WIDTH / 2,
        fighter.position.y + FIGHTER_HEIGHT / 2,
        spawn.position.x,
        spawn.position.y
      );
      if (dist < minDist) {
        minDist = dist;
        nearestItem = spawn;
      }
    });

    if (nearestItem) {
      const dx = nearestItem.position.x - fighter.position.x;
      fighter.facing = dx > 0 ? 'right' : 'left';
      fighter.state = 'walk';
    }
  }

  private checkWinCondition() {
    if (this.roundEnded) return;

    let winner: number | null = null;

    switch (this.rules.winCondition) {
      case 'ko':
        Object.entries(this.state.koCount).forEach(([team, count]) => {
          if (count >= this.rules.winValue) {
            winner = parseInt(team);
          }
        });
        break;
      case 'hp':
        const teamHp: { [team: number]: number } = {};
        this.state.fighters.forEach(f => {
          teamHp[f.team] = (teamHp[f.team] || 0) + (f.hp / f.maxHp);
        });
        const aliveTeams = Object.entries(teamHp).filter(([_, hp]) => hp > 0);
        if (aliveTeams.length === 1) {
          winner = parseInt(aliveTeams[0][0]);
        }
        break;
      case 'time':
        if (this.state.timeElapsed >= this.rules.battleTime) {
          const teamHp: { [team: number]: number } = {};
          this.state.fighters.forEach(f => {
            teamHp[f.team] = (teamHp[f.team] || 0) + f.hp;
          });
          let maxHp = 0;
          Object.entries(teamHp).forEach(([team, hp]) => {
            if (hp > maxHp) {
              maxHp = hp;
              winner = parseInt(team);
            }
          });
        }
        break;
    }

    if (winner !== null) {
      this.roundEnded = true;
      this.state.isRunning = false;
      this.addEvent('round_end', { winner });
    }
  }

  isRoundEnded(): boolean {
    return this.roundEnded;
  }

  getWinner(): number | null {
    if (!this.roundEnded) return null;
    
    switch (this.rules.winCondition) {
      case 'ko':
        for (const [team, count] of Object.entries(this.state.koCount)) {
          if (count >= this.rules.winValue) return parseInt(team);
        }
        return null;
      case 'hp':
      case 'time':
        const teamHp: { [team: number]: number } = {};
        this.state.fighters.forEach(f => {
          teamHp[f.team] = (teamHp[f.team] || 0) + f.hp;
        });
        let winner = 0, maxHp = -1;
        Object.entries(teamHp).forEach(([team, hp]) => {
          if (hp > maxHp) {
            maxHp = hp;
            winner = parseInt(team);
          }
        });
        return winner;
      default:
        return null;
    }
  }

  getFighterStats() {
    const stats: { [fighterId: string]: any } = {};
    this.state.fighters.forEach(f => {
      stats[f.fighterId] = {
        damageDealt: f.damageDealt,
        damageTaken: f.damageTaken,
        kills: f.kills,
        deaths: f.deaths,
        specialUsed: f.specialUsed,
        itemsUsed: f.itemsUsed,
      };
    });
    return stats;
  }
}
