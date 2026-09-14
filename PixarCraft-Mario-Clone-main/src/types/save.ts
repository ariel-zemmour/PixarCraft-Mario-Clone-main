export type CollectibleType = 'coins' | 'diamonds' | 'rabbits';
export type EnemyType = 'slimes' | 'zombies' | 'rabbits' | 'ghosts' | 'skeletons' | 'creepers';
export type PowerUpType = 'doubleJump' | 'dash' | 'fireball';
export type WeaponType = 'w1' | 'w2' | 'w3' | 'w4' | 'w5' | 'w6' | 'w7' | 'w8' | 'w9' | 'w10' | 'w11' | 'w12' | 'w13' | 'w14' | 'w15' | 'w16' | 'w17' | 'w18' | 'w19' | 'w20';

export interface GameConfig {
  collectible: CollectibleType;
  enemy: EnemyType;
  powerUp: PowerUpType;
  speed: number;
  weapon: WeaponType;
}

export interface GameStats {
  highScore: number;
  maxLevelReached: number;
  completedLevels: number[];
  totalCoinsEarned: number;
  enemiesDefeated: number;
  gamesPlayed: number;
  wins: number;
}

export interface GameSaveData {
  currency: number;
  unlockedWeapons: WeaponType[];
  equippedWeapon: WeaponType;
  config: GameConfig;
  stats: GameStats;
  saveVersion: number;
  updatedAt: string;
}

export interface User {
  id: number;
  email: string;
}

export type SaveStatusState = 'saved' | 'saving' | 'offline' | 'error' | 'idle';

export interface ConflictData {
  localSave: GameSaveData;
  cloudSave: GameSaveData;
}
