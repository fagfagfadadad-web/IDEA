export enum GameMode {
  FREE_FOR_ALL = 'ffa',
  TEAM_BATTLE = 'team',
  SURVIVAL = 'survival',
  BATTLE_ROYALE = 'battle_royale',
  TRAINING = 'training',
}

export enum CharacterClass {
  SCOUT = 'scout',
  TANK = 'tank',
  BLASTER = 'blaster',
  TRICKSTER = 'trickster',
  SNIPER = 'sniper',
  ENGINEER = 'engineer',
  HEALER = 'healer',
  ASSASSIN = 'assassin',
}

export enum WeaponType {
  PILLOW_BLASTER = 'pillow_blaster',
  LASER_SHOT = 'laser_shot',
  GRENADE_LAUNCHER = 'grenade_launcher',
  MINE_DROPPER = 'mine_dropper',
  BOOMERANG = 'boomerang',
  SHOCKWAVE_GUN = 'shockwave_gun',
  SNIPER_SHOT = 'sniper_shot',
  PLASMA_BALL = 'plasma_ball',
  DUAL_BLASTER = 'dual_blaster',
  ROCKET_LAUNCHER = 'rocket_launcher',
  ELECTRIC_CHAIN = 'electric_chain',
  ICE_BLASTER = 'ice_blaster',
}

export enum PowerUpType {
  HEALTH_PACK = 'health_pack',
  SHIELD_BOOST = 'shield_boost',
  MEGA_HEALTH = 'mega_health',
  DAMAGE_UP = 'damage_up',
  RAPID_FIRE = 'rapid_fire',
  EXPLOSIVE_AURA = 'explosive_aura',
  CRITICAL_HITS = 'critical_hits',
  SPEED_BOOST = 'speed_boost',
  TELEPORT_CRYSTAL = 'teleport_crystal',
  JUMP_BOOST = 'jump_boost',
  MAGNET_FIELD = 'magnet_field',
  VISION_BOOST = 'vision_boost',
  TIME_SLOW = 'time_slow',
  RANDOM_EFFECT = 'random_effect',
  INVINCIBILITY = 'invincibility',
}

export enum MapType {
  CLASSIC_ARENA = 'classic_arena',
  SPACE_STATION = 'space_station',
  JUNGLE_TEMPLE = 'jungle_temple',
  LAVA_BASE = 'lava_base',
  CYBER_GRID = 'cyber_grid',
  VERTICAL_TOWER = 'vertical_tower',
  FROZEN_CAVE = 'frozen_cave',
  DESERT_RUINS = 'desert_ruins',
  UNDERWATER_LAB = 'underwater_lab',
  ROOFTOP_CHASE = 'rooftop_chase',
  HAUNTED_MANSION = 'haunted_mansion',
  CHAMPIONSHIP_ARENA = 'championship_arena',
}

export enum MatchStatus {
  WAITING = 'waiting',
  STARTING = 'starting',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
  CANCELLED = 'cancelled',
}

export interface CharacterStats {
  hp: number;
  speed: number;
  specialAbility: string;
  startingWeapon: WeaponType;
}

export interface WeaponStats {
  damage: number;
  fireRate: number;
  range: string;
  ammo: number | 'unlimited';
  special: string;
}

export interface PowerUpEffect {
  type: PowerUpType;
  value: number;
  duration: number;
}

export interface PlayerPosition {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  direction: 'up' | 'down' | 'left' | 'right';
}

export interface ArenaPlayer {
  userId: string;
  username: string;
  character: CharacterClass;
  team?: 'A' | 'B';
  hp: number;
  maxHp: number;
  shield: number;
  kills: number;
  deaths: number;
  score: number;
  position: PlayerPosition;
  currentWeapon: WeaponType;
  secondaryWeapon?: WeaponType;
  activePowerUps: PowerUpEffect[];
  isAlive: boolean;
  respawnTime?: number;
}

export interface ArenaMatch {
  matchId: string;
  mode: GameMode;
  map: MapType;
  status: MatchStatus;
  players: ArenaPlayer[];
  maxPlayers: number;
  hostId: string;
  startTime?: number;
  endTime?: number;
  duration: number;
  winnerId?: string;
  winnerTeam?: 'A' | 'B';
  createdAt: number;
  updatedAt: number;
}

export interface MatchResult {
  matchId: string;
  mode: GameMode;
  map: MapType;
  duration: number;
  playerStats: {
    userId: string;
    username: string;
    kills: number;
    deaths: number;
    damage: number;
    score: number;
    placement: number;
    team?: 'A' | 'B';
    pupfiEarned: number;
    xpEarned: number;
  }[];
  winnerId?: string;
  winnerTeam?: 'A' | 'B';
  timestamp: number;
}

export interface PlayerArenaStats {
  userId: string;
  username: string;
  level: number;
  xp: number;
  rank: string;
  mmr: number;
  totalMatches: number;
  wins: number;
  losses: number;
  totalKills: number;
  totalDeaths: number;
  totalDamage: number;
  totalPlaytime: number;
  favoriteCharacter: CharacterClass;
  favoriteWeapon: WeaponType;
  highestKillStreak: number;
  pupfiEarned: number;
  unlockedCharacters: CharacterClass[];
  unlockedWeapons: WeaponType[];
  unlockedSkins: string[];
  lastPlayed: number;
  createdAt: number;
}

export interface DailyMission {
  missionId: string;
  userId: string;
  description: string;
  requirement: number;
  progress: number;
  reward: number;
  completed: boolean;
  date: string;
}

export interface Leaderboard {
  userId: string;
  username: string;
  rank: number;
  mmr: number;
  wins: number;
  kills: number;
  kd: number;
  season: string;
}

export interface GameEvent {
  eventId: string;
  matchId: string;
  type: 'kill' | 'death' | 'powerup' | 'weapon_pickup' | 'respawn';
  playerId: string;
  targetId?: string;
  data: any;
  timestamp: number;
}

export const CHARACTER_CONFIGS: Record<CharacterClass, CharacterStats> = {
  [CharacterClass.SCOUT]: {
    hp: 80,
    speed: 1.5,
    specialAbility: 'Double Jump',
    startingWeapon: WeaponType.PILLOW_BLASTER,
  },
  [CharacterClass.TANK]: {
    hp: 150,
    speed: 0.8,
    specialAbility: '20% Damage Reduction',
    startingWeapon: WeaponType.SHOCKWAVE_GUN,
  },
  [CharacterClass.BLASTER]: {
    hp: 100,
    speed: 1.0,
    specialAbility: '+15% Weapon Damage',
    startingWeapon: WeaponType.DUAL_BLASTER,
  },
  [CharacterClass.TRICKSTER]: {
    hp: 90,
    speed: 1.2,
    specialAbility: 'Teleport Dash (5s CD)',
    startingWeapon: WeaponType.MINE_DROPPER,
  },
  [CharacterClass.SNIPER]: {
    hp: 85,
    speed: 0.95,
    specialAbility: 'Zoom Vision',
    startingWeapon: WeaponType.SNIPER_SHOT,
  },
  [CharacterClass.ENGINEER]: {
    hp: 100,
    speed: 0.9,
    specialAbility: 'Deployable Turret',
    startingWeapon: WeaponType.GRENADE_LAUNCHER,
  },
  [CharacterClass.HEALER]: {
    hp: 95,
    speed: 1.1,
    specialAbility: 'AoE Heal (10s CD)',
    startingWeapon: WeaponType.PLASMA_BALL,
  },
  [CharacterClass.ASSASSIN]: {
    hp: 75,
    speed: 1.3,
    specialAbility: 'Invisibility (3s, 15s CD)',
    startingWeapon: WeaponType.BOOMERANG,
  },
};

export const WEAPON_CONFIGS: Record<WeaponType, WeaponStats> = {
  [WeaponType.PILLOW_BLASTER]: {
    damage: 15,
    fireRate: 0.5,
    range: 'medium',
    ammo: 'unlimited',
    special: 'Knockback',
  },
  [WeaponType.LASER_SHOT]: {
    damage: 30,
    fireRate: 2.0,
    range: 'long',
    ammo: 'unlimited',
    special: 'Instant Hit',
  },
  [WeaponType.GRENADE_LAUNCHER]: {
    damage: 40,
    fireRate: 1.5,
    range: 'medium',
    ammo: 6,
    special: 'AoE Explosion',
  },
  [WeaponType.MINE_DROPPER]: {
    damage: 50,
    fireRate: 2.0,
    range: 'melee',
    ammo: 3,
    special: 'Proximity Detonation',
  },
  [WeaponType.BOOMERANG]: {
    damage: 20,
    fireRate: 1.0,
    range: 'medium',
    ammo: 'unlimited',
    special: 'Can Hit Twice',
  },
  [WeaponType.SHOCKWAVE_GUN]: {
    damage: 25,
    fireRate: 0.8,
    range: 'short',
    ammo: 'unlimited',
    special: 'Pushes Back',
  },
  [WeaponType.SNIPER_SHOT]: {
    damage: 60,
    fireRate: 3.0,
    range: 'very_long',
    ammo: 4,
    special: 'Pierces Enemies',
  },
  [WeaponType.PLASMA_BALL]: {
    damage: 35,
    fireRate: 2.0,
    range: 'medium',
    ammo: 'unlimited',
    special: 'Passes Through Walls',
  },
  [WeaponType.DUAL_BLASTER]: {
    damage: 24,
    fireRate: 0.3,
    range: 'medium',
    ammo: 'unlimited',
    special: 'Twin Shots',
  },
  [WeaponType.ROCKET_LAUNCHER]: {
    damage: 70,
    fireRate: 4.0,
    range: 'long',
    ammo: 2,
    special: 'Massive Explosion',
  },
  [WeaponType.ELECTRIC_CHAIN]: {
    damage: 10,
    fireRate: 0.1,
    range: 'short',
    ammo: 100,
    special: 'Chains to Nearby',
  },
  [WeaponType.ICE_BLASTER]: {
    damage: 18,
    fireRate: 0.6,
    range: 'medium',
    ammo: 'unlimited',
    special: 'Slows Enemy',
  },
};
