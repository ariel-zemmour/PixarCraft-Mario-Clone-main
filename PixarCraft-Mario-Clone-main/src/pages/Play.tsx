import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, ShoppingCart, User as UserIcon, X, LogIn, Save, ArrowRight, Shield, Swords, Wand2, Zap, Heart,
  Download, Smartphone, Settings, LogOut
} from 'lucide-react';
import { authService } from '../services/authService';
import { saveService, createDefaultSave } from '../services/saveService';
import type { 
  CollectibleType, 
  EnemyType, 
  PowerUpType, 
  WeaponType, 
  GameConfig, 
  GameStats, 
  GameSaveData, 
  User, 
  ConflictData 
} from '../types/save';
import { AuthModal } from '../components/AuthModal';
import { ConflictModal } from '../components/ConflictModal';
import { UserMenu } from '../components/UserMenu';
import { SaveIndicator } from '../components/SaveIndicator';
import { VictoryModal } from '../components/VictoryModal';

// --- Weapon Definitions ---
interface WeaponInfo {
  id: WeaponType;
  name: string;
  cost: number;
  desc: string;
  cooldown: number;
  speed: number;
  count: number;
  color: string;
  type: 'pistol' | 'smg' | 'rifle' | 'shotgun' | 'heavy' | 'sci-fi';
}

// --- Game Engine ---
const DEFAULT_GRAVITY = 0.8;
const DEFAULT_JUMP_FORCE = -14;
const DEFAULT_MAX_FALL_SPEED = 18;

const WEAPONS: WeaponInfo[] = [
  { id: 'w1', name: 'אקדח חלוד', cost: 0, desc: 'הכי גרוע שיש, איטי מאוד', cooldown: 1000, speed: 10, count: 1, color: '#444', type: 'pistol' },
  { id: 'w2', name: 'אקדח ישן', cost: 10, desc: 'קצת יותר מהיר', cooldown: 800, speed: 11, count: 1, color: '#555', type: 'pistol' },
  { id: 'w3', name: 'אקדח סטנדרטי', cost: 25, desc: 'קצב סביר', cooldown: 600, speed: 12, count: 1, color: '#666', type: 'pistol' },
  { id: 'w4', name: 'אקדח משופר', cost: 50, desc: 'קצב טוב', cooldown: 450, speed: 13, count: 1, color: '#777', type: 'pistol' },
  { id: 'w5', name: 'אקדח כפול', cost: 80, desc: 'יורה 2 כדורים', cooldown: 600, speed: 12, count: 2, color: '#888', type: 'pistol' },
  { id: 'w6', name: 'תת מקלע קל', cost: 120, desc: 'מתחיל להיות מהיר', cooldown: 300, speed: 14, count: 1, color: '#333', type: 'smg' },
  { id: 'w7', name: 'תת מקלע טקטי', cost: 180, desc: 'קצב אש טוב', cooldown: 200, speed: 15, count: 1, color: '#222', type: 'smg' },
  { id: 'w8', name: 'רובה סער', cost: 250, desc: 'חזק ומהיר', cooldown: 150, speed: 16, count: 1, color: '#111', type: 'rifle' },
  { id: 'w9', name: 'רובה סער משופר', cost: 350, desc: 'קצב אש מצוין', cooldown: 120, speed: 17, count: 1, color: '#000', type: 'rifle' },
  { id: 'w10', name: 'רובה ציד בסיסי', cost: 500, desc: '3 כדורים במכה', cooldown: 800, speed: 13, count: 3, color: '#8B4513', type: 'shotgun' },
  { id: 'w11', name: 'רובה ציד קרבי', cost: 700, desc: '4 כדורים, קצב בינוני', cooldown: 600, speed: 14, count: 4, color: '#5D4037', type: 'shotgun' },
  { id: 'w12', name: 'מכונת ירייה קלה', cost: 1000, desc: 'מהיר מאוד', cooldown: 80, speed: 18, count: 1, color: '#455A64', type: 'heavy' },
  { id: 'w13', name: 'מכונת ירייה כבדה', cost: 1500, desc: 'קצב אש מטורף', cooldown: 60, speed: 19, count: 1, color: '#263238', type: 'heavy' },
  { id: 'w14', name: 'רובה פלזמה', cost: 2200, desc: 'מהיר וחזק', cooldown: 50, speed: 22, count: 1, color: '#6200EA', type: 'sci-fi' },
  { id: 'w15', name: 'רובה על', cost: 3000, desc: '2 כדורים מהירים מאוד', cooldown: 100, speed: 25, count: 2, color: '#311B92', type: 'sci-fi' },
  { id: 'w16', name: 'רובה ציד אולטרה', cost: 4000, desc: '5 כדורים בבת אחת', cooldown: 500, speed: 20, count: 5, color: '#1B5E20', type: 'shotgun' },
  { id: 'w17', name: 'מיניגאן', cost: 5500, desc: 'הכי מהיר שיש (כדור 1)', cooldown: 30, speed: 22, count: 1, color: '#212121', type: 'heavy' },
  { id: 'w18', name: 'תותח לייזר', cost: 7500, desc: '3 כדורים מהירים מאוד', cooldown: 80, speed: 30, count: 3, color: '#00B8D4', type: 'sci-fi' },
  { id: 'w19', name: 'רובה יום הדין', cost: 10000, desc: '4 כדורים בקצב מטורף', cooldown: 60, speed: 35, count: 4, color: '#D50000', type: 'heavy' },
  { id: 'w20', name: 'נשק האלים', cost: 25000, desc: 'הנשק הכי חזק במשחק', cooldown: 20, speed: 50, count: 6, color: '#FFD700', type: 'sci-fi' },
];

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Player extends Rect {
  vx: number;
  vy: number;
  isGrounded: boolean;
  canDoubleJump: boolean;
  facingRight: boolean;
  airplaneTimer: number;
}

const ALL_ENEMIES: EnemyType[] = ['slimes', 'zombies', 'rabbits', 'ghosts', 'skeletons', 'creepers'];

interface Bullet extends Rect {
  vx: number;
  vy: number;
  isFireball?: boolean;
  subType?: EnemyType;
}

interface Entity extends Rect {
  type: string;
  subType?: EnemyType;
  vx?: number;
  vy?: number;
  isGrounded?: boolean;
  collected?: boolean;
  dead?: boolean;
  timer?: number;
  state?: string;
  health?: number;
}

interface Boss extends Rect {
  active: boolean;
  introTimer: number;
  introComplete: boolean;
  name: string;
  maxHealth: number;
  health: number;
  displayHealth: number;
  phase: 1 | 2 | 3;
  phaseBannerTimer: number;
  phaseBannerText: string;
  vx: number;
  vy: number;
  baseY: number;
  hoverAngle: number;
  attackTimer: number;
  currentAttack: 'idle' | 'barrage' | 'slam' | 'meteor' | 'shield';
  attackStateTimer: number;
  telegraphTimer: number;
  telegraphType?: 'slam' | 'meteor' | 'barrage';
  slamTargetX?: number;
  slamGroundY?: number;
  shieldActive: boolean;
  shieldTimer: number;
  hitFlash: number;
  dead: boolean;
  deathTimer: number;
}

interface BossProjectile extends Rect {
  type: 'orb' | 'shockwave' | 'meteor';
  vx: number;
  vy: number;
  targetX?: number;
  targetY?: number;
  telegraphTimer?: number;
}

interface ArenaBarrier {
  x: number;
  locked: boolean;
  minCameraX: number;
  maxCameraX: number;
  arenaStartX: number;
  arenaEndX: number;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [conflictData, setConflictData] = useState<ConflictData | null>(null);

  // --- PWA Install State ---
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Fallback for iOS or already installed
      alert('להתקנה ב-iPhone: לחץ על כפתור השיתוף בתחתית המסך ובחר "Add to Home Screen".');
    }
  };
  
  // URL for the latest Windows installer (hosted on GitHub Releases)
  const windowsDownloadUrl = "https://github.com/ariel-zemmour/PixarCraft-Mario-Clone-main/releases/download/v1.0.2/Mario-Clone-Setup.exe";

  const [updateStatus, setUpdateStatus] = useState<{status: string, data?: any} | null>(null);

  useEffect(() => {
    if ((window as any).updateAPI) {
      (window as any).updateAPI.onUpdateStatus((status: string, data?: any) => {
        setUpdateStatus({ status, data });
      });
    }
  }, []);

  const [config, setConfig] = useState<GameConfig>(() => {
    const local = saveService.getLocalSave();
    return local.config || {
      collectible: 'coins',
      enemy: 'slimes',
      powerUp: 'doubleJump',
      speed: 5,
      weapon: 'w1',
      platform: 'computer'
    };
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [showConfig, setShowConfig] = useState(true);
  const [showShop, setShowShop] = useState(false);
  const [blackScreenMessage, setBlackScreenMessage] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);

  const [unlockedWeapons, setUnlockedWeapons] = useState<WeaponType[]>(() => {
    const local = saveService.getLocalSave();
    return local.unlockedWeapons || ['w1'];
  });

  const [currency, setCurrency] = useState(() => {
    const local = saveService.getLocalSave();
    return local.currency || 0;
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();

  // Refs that mirror React state — updated synchronously every render,
  // so fireWeapon() and the game loop always read the latest values.
  const isPlayingRef = useRef(isPlaying);
  const configRef = useRef(config);
  isPlayingRef.current = isPlaying;   // sync on every render, no useEffect delay
  configRef.current = config;         // sync on every render, no useEffect delay
  
  // Game State Refs (to avoid dependency issues in loop)
  const playerRef = useRef<Player>({ x: 50, y: 100, w: 30, h: 40, vx: 0, vy: 0, isGrounded: false, canDoubleJump: false, facingRight: true, airplaneTimer: 0 });
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const isMouseDownRef = useRef<boolean>(false);
  const mouseRef = useRef({ x: 0, y: 0 });
  const hasFiredForCurrentClickRef = useRef<boolean>(false);
  const cameraRef = useRef({ x: 0, y: 0 });
  const bulletsRef = useRef<Bullet[]>([]);
  const enemyBulletsRef = useRef<Bullet[]>([]);
  const spikesRef = useRef<Rect[]>([]);
  const lastShotRef = useRef<number>(0);
  const lastFireballRef = useRef<number>(0);
  const currencyRef = useRef(0);
  const statsRef = useRef<GameStats>({
    highScore: 0,
    maxLevelReached: 1,
    completedLevels: [],
    totalCoinsEarned: 0,
    enemiesDefeated: 0,
    gamesPlayed: 0,
    wins: 0
  });
  
  // Dynamic Spawner & Wave Tracking Ref
  const spawnerRef = useRef<{
    lastSpawnTime: number;
    checkpointWavesTriggered: Set<number>;
    lastAmbushX: number;
  }>({
    lastSpawnTime: 0,
    checkpointWavesTriggered: new Set(),
    lastAmbushX: 0
  });
  
  // Boss State Refs & Victory Modal State
  const bossRef = useRef<Boss | null>(null);
  const bossProjectilesRef = useRef<BossProjectile[]>([]);
  const arenaBarrierRef = useRef<ArenaBarrier | null>(null);
  const [victoryModalOpen, setVictoryModalOpen] = useState(false);
  const [victoryRewards, setVictoryRewards] = useState<{
    coins: number;
    score: number;
    unlockedWeapon?: string;
  }>({ coins: 10000, score: 25000, unlockedWeapon: 'נשק האלים (w20)' });
  
  // Sync currencyRef with initial state
  useEffect(() => {
    currencyRef.current = currency;
  }, []);

  // Helper to snapshot current game state for saving
  const getCurrentSaveSnapshot = useCallback((): GameSaveData => {
    return {
      currency: currencyRef.current,
      unlockedWeapons,
      equippedWeapon: config.weapon,
      config,
      stats: {
        highScore: Math.max(scoreRef.current, statsRef.current.highScore),
        maxLevelReached: Math.max(levelRef.current, statsRef.current.maxLevelReached),
        completedLevels: statsRef.current.completedLevels,
        totalCoinsEarned: statsRef.current.totalCoinsEarned,
        enemiesDefeated: statsRef.current.enemiesDefeated,
        gamesPlayed: statsRef.current.gamesPlayed,
        wins: statsRef.current.wins,
        bossDefeated: statsRef.current.bossDefeated || false,
        bossDefeatsCount: statsRef.current.bossDefeatsCount || 0
      },
      saveVersion: 1,
      updatedAt: new Date().toISOString()
    };
  }, [unlockedWeapons, config]);

  // Apply save data to state & refs
  const applySaveData = useCallback((save: GameSaveData) => {
    currencyRef.current = save.currency;
    setCurrency(save.currency);
    setUnlockedWeapons(save.unlockedWeapons);
    if (save.config) {
      setConfig(save.config);
    }
    if (save.stats) {
      statsRef.current = {
        highScore: save.stats.highScore || 0,
        maxLevelReached: save.stats.maxLevelReached || 1,
        completedLevels: save.stats.completedLevels || [],
        totalCoinsEarned: save.stats.totalCoinsEarned || 0,
        enemiesDefeated: save.stats.enemiesDefeated || 0,
        gamesPlayed: save.stats.gamesPlayed || 0,
        wins: save.stats.wins || 0,
        bossDefeated: save.stats.bossDefeated || false,
        bossDefeatsCount: save.stats.bossDefeatsCount || 0
      };
    }
    saveService.setLocalSave(save);
  }, []);

  // Initial user authentication & cloud save check on mount
  useEffect(() => {
    let mounted = true;
    async function initAuthAndSave() {
      try {
        const { user, save } = await authService.getCurrentUser();
        if (!mounted) return;

        if (user && save) {
          setCurrentUser(user);
          const localSave = saveService.getLocalSave();

          // Check if there's a significant conflict between local guest save and cloud save
          const hasLocalDifference = 
            localSave.currency > save.currency ||
            localSave.unlockedWeapons.some(w => !save.unlockedWeapons.includes(w));

          if (hasLocalDifference) {
            setConflictData({ localSave, cloudSave: save });
          } else {
            applySaveData(save);
          }
        } else {
          // Guest mode: load local save
          const localSave = saveService.getLocalSave();
          applySaveData(localSave);
        }
      } catch {
        const localSave = saveService.getLocalSave();
        applySaveData(localSave);
      }
    }

    initAuthAndSave();
    return () => {
      mounted = false;
    };
  }, [applySaveData]);

  // Periodic autosave during gameplay (every 20 seconds)
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      saveService.queueDebouncedSave(getCurrentSaveSnapshot());
    }, 20000);
    return () => clearInterval(interval);
  }, [isPlaying, getCurrentSaveSnapshot]);

  // Window beforeunload: save progress before closing or refreshing
  useEffect(() => {
    const handleUnload = () => {
      saveService.saveNow(getCurrentSaveSnapshot());
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [getCurrentSaveSnapshot]);

  const livesRef = useRef(3);
  const playerHeartsRef = useRef(3);
  const invincibilityTimerRef = useRef(0);
  const isPausedRef = useRef(false);
  const levelRef = useRef(1);
  const goalRef = useRef<Rect>({ x: 0, y: 0, w: 60, h: 100 });
  
  // Level Data
  const platformsRef = useRef<Rect[]>([]);
  const collectiblesRef = useRef<Entity[]>([]);
  const blueCoinsRef = useRef<Entity[]>([]);
  const heartsRef = useRef<Entity[]>([]);
  const enemiesRef = useRef<Entity[]>([]);
  const checkpointsRef = useRef<Entity[]>([]);
  const lastCheckpointRef = useRef<{x: number, y: number} | null>(null);
  const muzzleFlashesRef = useRef<{x: number, y: number, timer: number, size: number, angle: number}[]>([]);
  const smokeParticlesRef = useRef<{x: number, y: number, vx: number, vy: number, timer: number, size: number, opacity: number}[]>([]);
  const scoreRef = useRef(0);

  // Helper to determine exact dimensions matching each enemy's visual sprite
  const getEnemyDimensions = (eType?: EnemyType): { w: number; h: number } => {
    switch (eType) {
      case 'creepers': return { w: 28, h: 36 };
      case 'skeletons': return { w: 28, h: 36 };
      case 'zombies': return { w: 28, h: 36 };
      case 'rabbits': return { w: 28, h: 26 };
      case 'slimes': return { w: 30, h: 26 };
      case 'ghosts': return { w: 30, h: 30 };
      case 'fish': return { w: 24, h: 16 };
      case 'sharks': return { w: 40, h: 22 };
      case 'bats': return { w: 26, h: 20 };
      case 'spiders': return { w: 32, h: 20 };
      default: return { w: 28, h: 32 };
    }
  };

  // Raycasts downward to find the top surface of the platform directly beneath x..x+w
  const findGroundUnder = (x: number, w: number, fromY?: number): { groundY: number; platform: Rect } | null => {
    let bestGroundY = Infinity;
    let bestPlat: Rect | null = null;
    const checkFromY = fromY !== undefined ? fromY : -Infinity;

    for (const plat of platformsRef.current) {
      if (x + w > plat.x + 2 && x < plat.x + plat.w - 2) {
        if (plat.y >= checkFromY && plat.y < bestGroundY) {
          bestGroundY = plat.y;
          bestPlat = plat;
        }
      }
    }

    return bestPlat ? { groundY: bestGroundY, platform: bestPlat } : null;
  };

  // Finds a safe, grounded surface for newly spawned enemies, snapping to platform bounds if over a gap
  const findSpawnGround = (preferredX: number, w: number): { x: number; y: number } | null => {
    const direct = findGroundUnder(preferredX, w);
    if (direct) {
      return { x: preferredX, y: direct.groundY };
    }
    let closestPlat: Rect | null = null;
    let closestDist = Infinity;
    for (const plat of platformsRef.current) {
      const platCenterX = plat.x + plat.w / 2;
      const dist = Math.abs(platCenterX - preferredX);
      if (dist < closestDist) {
        closestDist = dist;
        closestPlat = plat;
      }
    }
    if (closestPlat) {
      const clampedX = Math.max(closestPlat.x + 12, Math.min(closestPlat.x + closestPlat.w - w - 12, preferredX));
      return { x: clampedX, y: closestPlat.y };
    }
    return null;
  };

  // Initialize Level
  const initLevel = (level: number, resetLives = false) => {
    if (resetLives) {
      livesRef.current = 3;
      playerHeartsRef.current = 3;
      lastCheckpointRef.current = null;
    }
    levelRef.current = level;
    playerRef.current = { x: 50, y: 100, w: 30, h: 40, vx: 0, vy: 0, isGrounded: false, canDoubleJump: false, facingRight: true, airplaneTimer: 0 };
    cameraRef.current = { x: 0, y: 0 };
    scoreRef.current = 0;
    bulletsRef.current = [];
    enemyBulletsRef.current = [];
    isMouseDownRef.current = false;
    hasFiredForCurrentClickRef.current = false;
    
    platformsRef.current = [];
    spikesRef.current = [];
    collectiblesRef.current = [];
    blueCoinsRef.current = [];
    heartsRef.current = [];
    enemiesRef.current = [];
    checkpointsRef.current = [];
    bossRef.current = null;
    bossProjectilesRef.current = [];
    arenaBarrierRef.current = null;
    
    // Reset dynamic enemy spawner
    spawnerRef.current = {
      lastSpawnTime: Date.now(),
      checkpointWavesTriggered: new Set(),
      lastAmbushX: 0
    };

    // Seeded random for consistent map generation
    let seed = level * 1234567;
    const nextRandom = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    // Helper to naturally mix enemy types with player preference
    const getPlatformEnemyType = (rnd: number): EnemyType => {
      const env = configRef.current.environment || 'day';
      if (env === 'water') {
        return rnd < 0.7 ? 'fish' : 'sharks';
      }
      if (env === 'tunnels') {
        return rnd < 0.6 ? 'spiders' : 'bats';
      }
      
      if (rnd < 0.65) return config.enemy;
      const otherEnemies = ALL_ENEMIES.filter(e => e !== config.enemy);
      return otherEnemies[Math.floor(rnd * 100) % otherEnemies.length];
    };

    // Start platform
    platformsRef.current.push({ x: 0, y: 350, w: 400, h: 50 });
    
    let currentX = 400;
    const targetX = level === 1 ? 40000 : 80000;
    let nextCheckpointPercent = 0.05;
    
    while (currentX < targetX) {
      const isLevel2 = level === 2;
      const gap = isLevel2 ? 100 + nextRandom() * 180 : 50 + nextRandom() * 120;
      const platW = isLevel2 ? 150 + nextRandom() * 300 : 250 + nextRandom() * 400;
      const platY = 200 + nextRandom() * 150;
      const progressFraction = currentX / targetX;
      
      currentX += gap;
      platformsRef.current.push({ x: currentX, y: platY, w: platW, h: 50 });
      
      // Checkpoint generation (every 5%)
      if (currentX / targetX >= nextCheckpointPercent) {
        checkpointsRef.current.push({
          x: currentX + 20,
          y: platY - 60,
          w: 40,
          h: 60,
          type: 'checkpoint',
          collected: false // used as 'activated'
        });
        nextCheckpointPercent += 0.05;
      }

      // Add elements on platform
      const coinCount = Math.floor(nextRandom() * 4) + 3; // 3 to 6 coins per platform
      for (let i = 0; i < coinCount; i++) {
        const offset = (i / (coinCount - 1)) * (platW - 60) + 30;
        collectiblesRef.current.push({ 
          x: currentX + offset, 
          y: platY - 40, 
          w: 20, 
          h: 20, 
          type: 'collectible' 
        });
      }
      
      // --- Significantly Increased Enemy Generation ---
      // 85% chance on Level 1, 95% chance on Level 2
      const spawnChance = isLevel2 ? 0.95 : 0.85;
      if (nextRandom() < spawnChance) {
        // Platform capacity: 1-2 on short, 2-3 on medium, 3-4 on wide platforms
        let count = platW < 220 ? (nextRandom() > 0.4 ? 2 : 1) : platW < 360 ? (nextRandom() > 0.3 ? 3 : 2) : 3 + (nextRandom() > 0.5 ? 1 : 0);
        // Gradually increase enemies further into the level
        if (progressFraction > 0.5 && nextRandom() > 0.4) {
          count = Math.min(4, count + 1);
        }

        for (let ei = 0; ei < count; ei++) {
          const eRnd = nextRandom();
          const enemyType = getPlatformEnemyType(eRnd);
          const isFlying = enemyType === 'ghosts' || enemyType === 'fish' || enemyType === 'sharks' || enemyType === 'bats';
          const dims = getEnemyDimensions(enemyType);
          const spacing = (platW - 40) / Math.max(1, count);
          const enemyX = currentX + 20 + ei * spacing;
          const enemyY = isFlying ? platY - 65 - (ei * 15) : platY - dims.h;
          const speedMultiplier = (isLevel2 ? 1.3 : 1.0) * (1 + progressFraction * 0.25);
          const patrolDirection = nextRandom() > 0.5 ? 1 : -1;

          enemiesRef.current.push({
            x: enemyX,
            y: enemyY,
            w: dims.w,
            h: dims.h,
            type: 'enemy',
            subType: enemyType,
            vx: patrolDirection * (enemyType === 'creepers' ? 1.6 : 2.0) * speedMultiplier,
            vy: isFlying ? (nextRandom() - 0.5) : 0,
            isGrounded: !isFlying,
            timer: nextRandom() * 1000,
            state: 'patrol'
          });
        }
      }
      
      if (nextRandom() > (isLevel2 ? 0.5 : 0.7) && platW > 200) {
        spikesRef.current.push({ x: currentX + platW/2 - 50, y: platY - 20, w: 100, h: 20 });
      }
      
      if (nextRandom() > 0.85) {
        blueCoinsRef.current.push({ x: currentX + platW/2, y: platY - 150, w: 20, h: 20, type: 'blueCoin' });
      }

      if (nextRandom() > 0.92) {
        heartsRef.current.push({ x: currentX + platW/2 + 50, y: platY - 100, w: 20, h: 20, type: 'heart' });
      }
      
      currentX += platW;
    }
    
    // Level End & Boss Arena Generation
    if (level === 1) {
      // Level 1: Goal Flag & Guardian Squad
      const lastPlatY = platformsRef.current[platformsRef.current.length - 1].y;
      goalRef.current = { x: currentX, y: lastPlatY - 100, w: 60, h: 100 };
      platformsRef.current.push({ x: currentX - 100, y: lastPlatY, w: 300, h: 50 }); // Safe platform for goal

      for (let gi = 0; gi < 4; gi++) {
        const gType = ALL_ENEMIES[gi % ALL_ENEMIES.length];
        const dims = getEnemyDimensions(gType);
        const isFlying = gType === 'ghosts';
        enemiesRef.current.push({
          x: currentX - 90 + gi * 40,
          y: isFlying ? lastPlatY - 70 : lastPlatY - dims.h,
          w: dims.w,
          h: dims.h,
          type: 'enemy',
          subType: gType,
          vx: (gi % 2 === 0 ? 1.5 : -1.5),
          vy: 0,
          isGrounded: !isFlying,
          timer: 0,
          state: 'patrol'
        });
      }
    } else {
      // Level 2: The Final Boss Arena (Obsidian Citadel of the Shadow Titan)
      const arenaStartX = currentX + 60;
      const arenaY = 350;

      // Main Arena Floor (solid 1400px obsidian)
      platformsRef.current.push({ x: arenaStartX, y: arenaY, w: 1400, h: 60 });

      // Tactical elevated platforms for maneuvering and jump shooting
      platformsRef.current.push({ x: arenaStartX + 180, y: 230, w: 160, h: 25 });
      platformsRef.current.push({ x: arenaStartX + 480, y: 160, w: 200, h: 25 });
      platformsRef.current.push({ x: arenaStartX + 820, y: 230, w: 160, h: 25 });

      // Arena Entrance Checkpoint (allows player to respawn right at the boss gates)
      checkpointsRef.current.push({
        x: arenaStartX + 40,
        y: arenaY - 60,
        w: 40,
        h: 60,
        type: 'checkpoint',
        collected: true
      });
      lastCheckpointRef.current = { x: arenaStartX + 50, y: arenaY - 60 };

      // Goal flag (at the far end of the arena)
      goalRef.current = { x: arenaStartX + 1250, y: arenaY - 100, w: 60, h: 100 };

      // Arena barrier bounds
      arenaBarrierRef.current = {
        x: arenaStartX + 70,
        locked: false,
        minCameraX: arenaStartX,
        maxCameraX: arenaStartX + 600,
        arenaStartX,
        arenaEndX: arenaStartX + 1400
      };

      // Final Boss Entity
      bossRef.current = {
        x: arenaStartX + 720,
        y: 120,
        w: 80,
        h: 90,
        active: false,
        introTimer: 0,
        introComplete: false,
        name: 'טיטאן הצללים',
        maxHealth: 3000,
        health: 3000,
        displayHealth: 3000,
        phase: 1,
        phaseBannerTimer: 0,
        phaseBannerText: '',
        vx: 0,
        vy: 0,
        baseY: 130,
        hoverAngle: 0,
        attackTimer: 2500,
        currentAttack: 'idle',
        attackStateTimer: 0,
        telegraphTimer: 0,
        shieldActive: false,
        shieldTimer: 0,
        hitFlash: 0,
        dead: false,
        deathTimer: 0
      };
    }
  };

  const takeDamage = (amount: number) => {
    if (invincibilityTimerRef.current > 0 || isPausedRef.current) return;
    
    playerHeartsRef.current -= amount;
    invincibilityTimerRef.current = 60; // Always set invincibility to prevent multiple hits in same frame
    
    if (playerHeartsRef.current <= 0) {
      handleDeath();
    }
  };

  const handleDeath = () => {
    if (isPausedRef.current) return; // Prevent multiple death triggers
    keysRef.current = {}; // Clear stuck keys
    livesRef.current -= 1;
    
    // Clear any active boss projectiles
    bossProjectilesRef.current = [];

    // Reset boss if fighting in arena
    if (bossRef.current) {
      bossRef.current.active = false;
      bossRef.current.health = bossRef.current.maxHealth;
      bossRef.current.displayHealth = bossRef.current.maxHealth;
      bossRef.current.phase = 1;
      bossRef.current.phaseBannerTimer = 0;
      bossRef.current.currentAttack = 'idle';
      bossRef.current.attackTimer = 2200;
      bossRef.current.attackStateTimer = 0;
      bossRef.current.telegraphTimer = 0;
      bossRef.current.shieldActive = false;
      bossRef.current.dead = false;
      bossRef.current.deathTimer = 0;
      bossRef.current.hitFlash = 0;
      bossRef.current.introComplete = false;
    }
    if (arenaBarrierRef.current) {
      arenaBarrierRef.current.locked = false;
    }

    // Give player brief breathing room on respawn before new waves spawn
    spawnerRef.current.lastSpawnTime = Date.now() + 2000;

    // Sync currency to state and save on death to ensure it's persisted
    setCurrency(currencyRef.current);
    saveService.saveNow(getCurrentSaveSnapshot());

    if (livesRef.current <= 0) {
      isPausedRef.current = true;
      setIsGameOver(true);
      setBlackScreenMessage("המשחק נגמר");
    } else {
      isPausedRef.current = true;
      setBlackScreenMessage(`נותרו ${livesRef.current} חיים`);
      setTimeout(() => {
        setBlackScreenMessage(null);
        isPausedRef.current = false;
        playerHeartsRef.current = 3;
        // Restart the current level but preserve the furthest checkpoint
        const currentScore = scoreRef.current;
        const savedCheckpoint = lastCheckpointRef.current;
        
        initLevel(levelRef.current, false); // Rebuilds the level, enemies, etc.
        
        if (savedCheckpoint) {
          lastCheckpointRef.current = savedCheckpoint; // Restore the farthest checkpoint
          playerRef.current.x = savedCheckpoint.x;
          playerRef.current.y = savedCheckpoint.y;
          // Position camera so player is visible
          cameraRef.current.x = Math.max(0, savedCheckpoint.x - 400); 
          
          // Visually update all checkpoints up to this one to be collected
          checkpointsRef.current.forEach(cp => {
            if (cp.x <= savedCheckpoint.x) {
              cp.collected = true;
            }
          });
        }
        
        scoreRef.current = currentScore;
      }, 2000);
    }
  };

  // Helper to check if a weapon is automatic (continuous fire while Left Mouse Button is held)
  const isWeaponAutomatic = (weapon?: WeaponInfo): boolean => {
    if (!weapon) return false;
    return weapon.type === 'smg' || weapon.type === 'rifle' || weapon.type === 'heavy' || weapon.type === 'sci-fi';
  };

  // Unified fire weapon handler using equipped weapon stats and cooldown
  const fireWeapon = () => {
    console.log('[fireWeapon] called. isPlayingRef.current=', isPlayingRef.current);
    if (!isPlayingRef.current) { console.log('[fireWeapon] BLOCKED: not playing'); return false; }
    const now = Date.now();
    const weaponId = configRef.current.weapon;
    const weapon = WEAPONS.find(w => w.id === weaponId);
    console.log('[fireWeapon] weaponId=', weaponId, 'weapon=', weapon?.name);
    if (!weapon) { console.log('[fireWeapon] BLOCKED: weapon not found'); return false; }

    const timeSince = now - lastShotRef.current;
    console.log('[fireWeapon] timeSince=', timeSince, 'cooldown=', weapon.cooldown);
    if (timeSince < weapon.cooldown) {
      console.log('[fireWeapon] BLOCKED: on cooldown, need', weapon.cooldown - timeSince, 'ms more');
      return false;
    }

    lastShotRef.current = now;
    const p = playerRef.current;
    
    const startX = p.facingRight ? p.x + p.w - 5 : p.x + 5;
    const startY = p.y + 20;

    const targetX = mouseRef.current.x;
    const targetY = mouseRef.current.y;
    const dx = targetX - startX;
    const dy = targetY - startY;
    const angle = Math.atan2(dy, dx);
    console.log('[fireWeapon] FIRING! bullets before=', bulletsRef.current.length, 'angle=', angle.toFixed(2));

    if (weapon.count > 1) {
      for (let i = 0; i < weapon.count; i++) {
        const spreadAngle = (i - (weapon.count - 1) / 2) * 0.1;
        const finalAngle = angle + spreadAngle;
        bulletsRef.current.push({ 
          x: startX + Math.cos(finalAngle) * 15, 
          y: startY + Math.sin(finalAngle) * 15, 
          w: 12, 
          h: 4, 
          vx: Math.cos(finalAngle) * weapon.speed, 
          vy: Math.sin(finalAngle) * weapon.speed 
        });
      }
    } else {
      bulletsRef.current.push({ 
        x: startX + Math.cos(angle) * 15, 
        y: startY + Math.sin(angle) * 15, 
        w: 12, 
        h: 4, 
        vx: Math.cos(angle) * weapon.speed, 
        vy: Math.sin(angle) * weapon.speed 
      });
    }
    console.log('[fireWeapon] bullets after=', bulletsRef.current.length);

    // Add muzzle flash and smoke for fast/machine weapons
    const isMachineGun = weapon.cooldown < 200;
    muzzleFlashesRef.current.push({
      x: startX + Math.cos(angle) * 15,
      y: startY + Math.sin(angle) * 15,
      timer: 60,
      size: isMachineGun ? 18 : 12,
      angle: angle + (Math.random() - 0.5) * 0.5
    });

    if (isMachineGun) {
      for (let i = 0; i < 2; i++) {
        smokeParticlesRef.current.push({
          x: startX + Math.cos(angle) * 15,
          y: startY + Math.sin(angle) * 15,
          vx: -Math.cos(angle) * (Math.random() * 2 + 1),
          vy: -Math.sin(angle) * (Math.random() * 2 + 1) + (Math.random() - 0.5) * 2,
          timer: 500,
          size: 5,
          opacity: 0.6
        });
      }
    }

    return true;
  };

  // ─── Keyboard Input (useEffect so we can add/remove properly) ───────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if ((e.code === 'Space' || e.code === 'ArrowUp') && isPlayingRef.current) {
        if (playerRef.current.airplaneTimer > 0) {
          // airplane mode handled in update
        } else {
          if (playerRef.current.isGrounded) {
            playerRef.current.vy = configRef.current.environment === 'water' ? -8 : DEFAULT_JUMP_FORCE;
            playerRef.current.isGrounded = false;
            playerRef.current.canDoubleJump = configRef.current.powerUp === 'doubleJump';
          } else if (playerRef.current.canDoubleJump) {
            playerRef.current.vy = configRef.current.environment === 'water' ? -8 : DEFAULT_JUMP_FORCE;
            playerRef.current.canDoubleJump = false;
          }
        }
      }
      // Fireball
      if (e.code === 'KeyF' && isPlayingRef.current && configRef.current.powerUp === 'fireball') {
        const now = Date.now();
        if (now - lastFireballRef.current > 7000) {
          lastFireballRef.current = now;
          const p = playerRef.current;
          const dir = p.facingRight ? 1 : -1;
          bulletsRef.current.push({
            x: p.facingRight ? p.x + p.w : p.x - 20,
            y: p.y + 10, w: 20, h: 20,
            vx: dir * 12, vy: 0, isFireball: true
          });
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    const handleBlur = () => {
      keysRef.current = {};
      isMouseDownRef.current = false;
      hasFiredForCurrentClickRef.current = false;
    };
    const handleWindowMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDownRef.current = false;
        hasFiredForCurrentClickRef.current = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, []); // stable — reads all values from refs, no deps needed

  // ─── Canvas Mouse Handlers (defined as component functions, fresh every render) ─
  // These are passed directly as JSX props — no stale-closure risk.
  const onCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('[mousedown] button=', e.button, 'isPlayingRef=', isPlayingRef.current);
    if (e.button !== 0) { console.log('[mousedown] IGNORED: not LMB'); return; }
    if (!isPlayingRef.current) { console.log('[mousedown] IGNORED: not playing'); return; }
    e.preventDefault();

    isMouseDownRef.current = true;
    hasFiredForCurrentClickRef.current = false;

    const rect = e.currentTarget.getBoundingClientRect();
    console.log('[mousedown] rect=', rect.width, 'x', rect.height);
    if (rect.width > 0 && rect.height > 0) {
      const cx = (e.clientX - rect.left) * (800 / rect.width);
      const cy = (e.clientY - rect.top)  * (400 / rect.height);
      mouseRef.current = {
        x: cx + cameraRef.current.x,
        y: cy + cameraRef.current.y,
      };
      playerRef.current.facingRight =
        mouseRef.current.x >= playerRef.current.x + playerRef.current.w / 2;
      console.log('[mousedown] mouseRef set to', mouseRef.current);
    }

    console.log('[mousedown] calling fireWeapon()');
    fireWeapon();
  };

  const onCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlayingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const cx = (e.clientX - rect.left) * (800 / rect.width);
      const cy = (e.clientY - rect.top)  * (400 / rect.height);
      mouseRef.current = {
        x: cx + cameraRef.current.x,
        y: cy + cameraRef.current.y,
      };
      playerRef.current.facingRight =
        mouseRef.current.x >= playerRef.current.x + playerRef.current.w / 2;
    }
  };

  // Game Loop
  const update = () => {
    if (!isPlaying) return;
    if (isPausedRef.current) return;
    
    if (invincibilityTimerRef.current > 0) {
      invincibilityTimerRef.current -= 1;
    }
    
    const p = playerRef.current;
    const currentMoveSpeed = config.speed * 1.2; // Increased base speed multiplier
    
    if (p.airplaneTimer > 0) {
      p.airplaneTimer -= 16; // approx 60fps
      if (p.airplaneTimer < 0) p.airplaneTimer = 0;
    }
    
    // Horizontal movement
    if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) {
      p.vx = -currentMoveSpeed;
      p.facingRight = false;
    } else if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) {
      p.vx = currentMoveSpeed;
      p.facingRight = true;
    } else {
      p.vx = 0;
    }

    // Continuous firing for automatic weapons while Left Mouse Button is held
    if (isMouseDownRef.current) {
      const weapon = WEAPONS.find(w => w.id === configRef.current.weapon);
      if (isWeaponAutomatic(weapon)) {
        fireWeapon();
      }
    }

    // Muzzle flashes update
    for (let i = muzzleFlashesRef.current.length - 1; i >= 0; i--) {
      muzzleFlashesRef.current[i].timer -= 16;
      if (muzzleFlashesRef.current[i].timer <= 0) {
        muzzleFlashesRef.current.splice(i, 1);
      }
    }

    // Smoke particles update
    for (let i = smokeParticlesRef.current.length - 1; i >= 0; i--) {
      const s = smokeParticlesRef.current[i];
      s.x += s.vx;
      s.y += s.vy;
      s.timer -= 16;
      s.opacity -= 0.02;
      s.size += 0.2;
      if (s.timer <= 0 || s.opacity <= 0) {
        smokeParticlesRef.current.splice(i, 1);
      }
    }
    
    // Dash powerup
    if (config.powerUp === 'dash' && keysRef.current['ShiftLeft']) {
      p.vx *= 2;
    }

    if (p.airplaneTimer > 0) {
      // Airplane movement
      if (keysRef.current['ArrowUp'] || keysRef.current['KeyW'] || keysRef.current['Space']) {
        p.vy = -currentMoveSpeed;
      } else if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) {
        p.vy = currentMoveSpeed;
      } else {
        p.vy = 0;
      }
    } else {
      // Apply gravity
      const gravity = configRef.current.environment === 'water' ? 0.3 : DEFAULT_GRAVITY;
      const maxFallSpeed = configRef.current.environment === 'water' ? 6 : DEFAULT_MAX_FALL_SPEED;
      p.vy += gravity;
      if (p.vy > maxFallSpeed) p.vy = maxFallSpeed;
    }
    
    // Move X
    p.x += p.vx;
    
    // Collision X
    for (const plat of platformsRef.current) {
      if (Math.abs(plat.x - p.x) > 1500) continue;
      if (checkCollision(p, plat)) {
        if (p.vx > 0) p.x = plat.x - p.w;
        else if (p.vx < 0) p.x = plat.x + plat.w;
        p.vx = 0;
      }
    }
    
    // Move Y
    p.y += p.vy;
    p.isGrounded = false;
    
    // Collision Y
    for (const plat of platformsRef.current) {
      if (Math.abs(plat.x - p.x) > 1500) continue;
      if (checkCollision(p, plat)) {
        if (p.vy > 0) {
          p.y = plat.y - p.h;
          p.isGrounded = true;
        } else if (p.vy < 0) {
          p.y = plat.y + plat.h;
        }
        p.vy = 0;
      }
    }
    
    // Death by falling
    if (p.y > 600) {
      handleDeath();
    }
    
    // Spikes collision
    for (const spike of spikesRef.current) {
      if (Math.abs(spike.x - p.x) > 1500) continue;
      if (checkCollision(p, spike)) {
        takeDamage(1);
        if (invincibilityTimerRef.current === 60) {
          p.vy = -10; // Bounce off spike
        }
      }
    }

    // Bullets update
    for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
      const b = bulletsRef.current[i];
      b.x += b.vx;
      b.y += b.vy;
      
      if (Math.abs(b.x - cameraRef.current.x) > 1000) {
        bulletsRef.current.splice(i, 1);
        continue;
      }
      
      let hit = false;
      for (const enemy of enemiesRef.current) {
        if (Math.abs(enemy.x - b.x) > 1000) continue;
        if (!enemy.dead && checkCollision(b, enemy)) {
          enemy.dead = true;
          scoreRef.current += 50;
          hit = true;
          break;
        }
      }
      
      // Boss hit collision
      if (!hit && bossRef.current && bossRef.current.active && !bossRef.current.dead && bossRef.current.introComplete) {
        const boss = bossRef.current;
        if (checkCollision(b, boss)) {
          hit = true;
          if (boss.shieldActive) {
            smokeParticlesRef.current.push({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 4,
              vy: -2,
              timer: 0,
              size: 6,
              opacity: 0.8
            });
          } else {
            const dmg = b.isFireball ? 45 : 20;
            boss.health = Math.max(0, boss.health - dmg);
            boss.hitFlash = 120;
            scoreRef.current += 25;
            for (let sp = 0; sp < 4; sp++) {
              smokeParticlesRef.current.push({
                x: b.x,
                y: b.y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                timer: 0,
                size: 4 + Math.random() * 3,
                opacity: 0.9
              });
            }
            if (boss.health <= 0) {
              boss.dead = true;
              boss.deathTimer = 2500;
              boss.shieldActive = false;
              bossProjectilesRef.current = [];
            }
          }
        }
      }

      if (hit) {
        bulletsRef.current.splice(i, 1);
      }
    }

    // Enemy bullets update
    for (let i = enemyBulletsRef.current.length - 1; i >= 0; i--) {
      const b = enemyBulletsRef.current[i];
      b.x += b.vx;
      b.y += b.vy;
      
      if (Math.abs(b.x - cameraRef.current.x) > 1000) {
        enemyBulletsRef.current.splice(i, 1);
        continue;
      }
      
      if (checkCollision(p, b)) {
        takeDamage(1);
        enemyBulletsRef.current.splice(i, 1);
      }
    }
    
    // Arena Barrier Boundary & Boss Trigger
    const arena = arenaBarrierRef.current;
    if (arena && levelRef.current === 2) {
      if (!arena.locked && p.x > arena.arenaStartX + 120 && bossRef.current && !bossRef.current.dead) {
        arena.locked = true;
        bossRef.current.active = true;
        bossRef.current.introTimer = 2200;
        bossRef.current.introComplete = false;
      }
      if (arena.locked) {
        if (p.x < arena.x + 10) {
          p.x = arena.x + 10;
          if (p.vx < 0) p.vx = 0;
        }
        if (p.x > arena.arenaEndX - 40) {
          p.x = arena.arenaEndX - 40;
          if (p.vx > 0) p.vx = 0;
        }
      }
    }

    // --- Dynamic Continuous Enemy Wave Spawner & Ambush System ---
    const now = Date.now();
    const isLevel2 = levelRef.current === 2;
    const targetX = isLevel2 ? 80000 : 40000;
    const progress = Math.min(1, Math.max(0, p.x / targetX));
    const isInsideArena = arena && arena.locked;

    // Routine dynamic wave spawn (only outside the boss arena)
    const waveInterval = (isLevel2 ? 2800 : 4200) * (1 - progress * 0.25);
    const maxLocalEnemies = isLevel2 ? 24 : 15;
    const localEnemiesCount = enemiesRef.current.filter(
      e => !e.dead && Math.abs(e.x - p.x) < 1100
    ).length;

    if (!isInsideArena && now - spawnerRef.current.lastSpawnTime > waveInterval && localEnemiesCount < maxLocalEnemies) {
      spawnerRef.current.lastSpawnTime = now;
      const waveSize = (isLevel2 ? 3 : 2) + (Math.random() > 0.4 ? 1 : 0) + (progress > 0.6 && Math.random() > 0.5 ? 1 : 0);
      
      for (let i = 0; i < waveSize; i++) {
        const rnd = Math.random();
        const eType: EnemyType = rnd < 0.6 ? config.enemy : ALL_ENEMIES[Math.floor(Math.random() * ALL_ENEMIES.length)];
        const isGhost = eType === 'ghosts';
        const dims = getEnemyDimensions(eType);
        
        // 80% spawn ahead of screen, 20% rear ambush
        const spawnAhead = Math.random() > 0.2;
        const prefX = spawnAhead 
          ? cameraRef.current.x + 850 + Math.random() * 200 + i * 40
          : cameraRef.current.x - 50 - Math.random() * 100 - i * 40;
        
        let spawnX = prefX;
        let spawnY = p.y - dims.h;

        if (isGhost) {
          spawnY = Math.max(80, Math.min(320, p.y + (Math.random() * 120 - 60)));
        } else {
          const ground = findSpawnGround(prefX, dims.w);
          if (ground) {
            spawnX = ground.x;
            spawnY = ground.y - dims.h;
          } else {
            const firstPlat = platformsRef.current[0];
            spawnY = (firstPlat ? firstPlat.y : 350) - dims.h;
          }
        }

        const patrolDir = spawnAhead ? -1 : 1;
        const speedMultiplier = (isLevel2 ? 1.25 : 1.0) * (1 + progress * 0.2);
        enemiesRef.current.push({
          x: spawnX,
          y: spawnY,
          w: dims.w,
          h: dims.h,
          type: 'enemy',
          subType: eType,
          vx: patrolDir * (eType === 'creepers' ? 1.8 : 2.2) * speedMultiplier,
          vy: 0,
          isGrounded: !isGhost,
          timer: Math.random() * 1000,
          state: 'patrol'
        });
      }
    }

    // Checkpoint Ambush Waves (triggered when player approaches a checkpoint)
    checkpointsRef.current.forEach((cp, idx) => {
      if (Math.abs(cp.x - p.x) < 250 && !spawnerRef.current.checkpointWavesTriggered.has(idx)) {
        spawnerRef.current.checkpointWavesTriggered.add(idx);
        const ambushCount = isLevel2 ? 4 : 3;
        const cpFloorY = cp.y + cp.h; // Surface of the platform checkpoint rests on
        for (let a = 0; a < ambushCount; a++) {
          const ambType = ALL_ENEMIES[(idx + a) % ALL_ENEMIES.length];
          const dims = getEnemyDimensions(ambType);
          const isGhost = ambType === 'ghosts';
          const ambX = a % 2 === 0 ? cp.x - 120 - a * 35 : cp.x + 120 + a * 35;
          const ambY = isGhost ? cp.y - 45 : cpFloorY - dims.h;
          enemiesRef.current.push({
            x: ambX,
            y: ambY,
            w: dims.w,
            h: dims.h,
            type: 'enemy',
            subType: ambType,
            vx: (a % 2 === 0 ? 1 : -1) * (isLevel2 ? 2.5 : 2.0),
            vy: 0,
            isGrounded: !isGhost,
            timer: 0,
            state: 'patrol'
          });
        }
      }
    });

    // Goal Guardian Ambush (spawns when player approaches within 750px of the goal)
    if (p.x > goalRef.current.x - 750 && spawnerRef.current.lastAmbushX < goalRef.current.x - 1000) {
      spawnerRef.current.lastAmbushX = goalRef.current.x;
      const guardianWaveCount = isLevel2 ? 6 : 4;
      const goalFloorY = goalRef.current.y + goalRef.current.h; // Surface of the platform
      for (let g = 0; g < guardianWaveCount; g++) {
        const gType = ALL_ENEMIES[g % ALL_ENEMIES.length];
        const dims = getEnemyDimensions(gType);
        const isGhost = gType === 'ghosts';
        enemiesRef.current.push({
          x: goalRef.current.x - 280 + g * 50,
          y: isGhost ? goalRef.current.y - 30 : goalFloorY - dims.h,
          w: dims.w,
          h: dims.h,
          type: 'enemy',
          subType: gType,
          vx: (g % 2 === 0 ? -1.8 : -2.4) * (isLevel2 ? 1.3 : 1.0),
          vy: 0,
          isGrounded: !isGhost,
          timer: 0,
          state: 'patrol'
        });
      }
    }

    // Performance Culling:
    // Remove dead enemies or enemies farther than 800px behind camera to maintain optimal 60 FPS
    if (enemiesRef.current.length > 25) {
      enemiesRef.current = enemiesRef.current.filter(
        e => !e.dead && (e.x >= cameraRef.current.x - 800)
      );
    }
    
    // Enemies update
    enemiesRef.current.forEach(enemy => {
      if (enemy.dead) return;
      if (Math.abs(enemy.x - p.x) > 2000) return;

      const eType = (enemy.subType || config.enemy) as EnemyType;

      if (eType === 'ghosts') {
        // Ghosts fly towards player in 2D
        const dx = p.x - enemy.x;
        const dy = p.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 400) {
          enemy.vx = (dx / dist) * (isLevel2 ? 2.0 : 1.5);
          enemy.vy = (dy / dist) * (isLevel2 ? 2.0 : 1.5);
        } else {
          enemy.vx = 0;
          enemy.vy = Math.sin((Date.now() + (enemy.timer || 0)) / 260) * 0.5;
        }
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
      } else {
        // Ground Enemies (skeletons, creepers, slimes, zombies, rabbits)
        // 1. Behavior / AI updates
        if (eType === 'skeletons') {
          // Shooting logic
          enemy.timer = (enemy.timer || 0) + 16;
          if (enemy.timer > (isLevel2 ? 1500 : 2000)) {
            enemy.timer = 0;
            const dx = p.x - enemy.x;
            if (Math.abs(dx) < 550) {
              enemyBulletsRef.current.push({
                x: enemy.x + enemy.w / 2,
                y: enemy.y + 12,
                w: 15,
                h: 4,
                vx: dx > 0 ? 5 : -5,
                vy: 0,
                subType: 'skeletons'
              });
            }
          }
        } else if (eType === 'creepers') {
          // Creepers charge when player is close
          const dx = p.x - enemy.x;
          const dist = Math.abs(dx);
          if (dist < 280 && Math.abs(p.y - enemy.y) < 120) {
            enemy.vx = (dx > 0 ? 3.8 : -3.8) * (isLevel2 ? 1.25 : 1.0);
            enemy.state = 'charging';
          } else {
            if (enemy.state === 'charging') {
              enemy.vx = (enemy.vx || 0) > 0 ? 1.6 : -1.6;
              enemy.state = 'patrol';
            }
          }
        }

        // 2. Ledge Lookahead (Patrol AI only; charging creepers continue pursuit)
        if (enemy.isGrounded && enemy.state !== 'charging') {
          const probeDist = (enemy.vx || 0) > 0 ? enemy.w + 4 : -4;
          const probeX = enemy.x + probeDist;
          // Check if there is platform beneath probeX within a short vertical reach
          const hasFloorAhead = platformsRef.current.some(plat => 
            probeX >= plat.x && 
            probeX <= plat.x + plat.w && 
            Math.abs(plat.y - (enemy.y + enemy.h)) <= 14
          );
          if (!hasFloorAhead) {
            enemy.vx = -(enemy.vx || 0);
          }
        }

        // 3. Move X & Wall Collision
        enemy.x += enemy.vx || 0;
        for (const plat of platformsRef.current) {
          if (Math.abs(plat.x - enemy.x) > 400) continue;
          if (checkCollision(enemy, plat)) {
            if ((enemy.vx || 0) > 0) {
              enemy.x = plat.x - enemy.w;
              enemy.vx = -(enemy.vx || 0);
            } else if ((enemy.vx || 0) < 0) {
              enemy.x = plat.x + plat.w;
              enemy.vx = -(enemy.vx || 0);
            }
            break;
          }
        }

        // 4. Vertical Physics & Gravity
        const gravity = configRef.current.environment === 'water' ? 0.3 : DEFAULT_GRAVITY;
        const maxFallSpeed = configRef.current.environment === 'water' ? 6 : DEFAULT_MAX_FALL_SPEED;
        enemy.vy = (enemy.vy || 0) + gravity;
        if (enemy.vy > maxFallSpeed) enemy.vy = maxFallSpeed;

        const prevY = enemy.y;
        enemy.y += enemy.vy;
        let grounded = false;

        for (const plat of platformsRef.current) {
          if (Math.abs(plat.x - enemy.x) > 400) continue;
          // Horizontal overlap check
          if (enemy.x + enemy.w > plat.x + 2 && enemy.x < plat.x + plat.w - 2) {
            const prevFoot = prevY + enemy.h;
            const newFoot = enemy.y + enemy.h;
            // Detect crossing onto or down into top of platform
            if (prevFoot <= plat.y + 12 && newFoot >= plat.y) {
              enemy.y = plat.y - enemy.h;
              enemy.vy = 0;
              grounded = true;
              break;
            }
          }
        }

        // 5. Uneven Terrain / Step Snapping (prevents micro-gaps and stutter when walking on uneven platforms)
        if (!grounded && wasGrounded) {
          for (const plat of platformsRef.current) {
            if (Math.abs(plat.x - enemy.x) > 300) continue;
            if (enemy.x + enemy.w > plat.x + 2 && enemy.x < plat.x + plat.w - 2) {
              const distToPlat = plat.y - (enemy.y + enemy.h);
              if (distToPlat >= 0 && distToPlat <= 8) {
                enemy.y = plat.y - enemy.h;
                enemy.vy = 0;
                grounded = true;
                break;
              }
            }
          }
        }

        enemy.isGrounded = grounded;

        // Despawn enemy if fallen deep into void below screen
        if (enemy.y > 650) {
          enemy.dead = true;
        }
      }
      
      // Player stomp / damage collision
      if (checkCollision(p, enemy)) {
        if (p.vy > 0 && p.y + p.h < enemy.y + enemy.h * 0.6 && eType !== 'ghosts') {
          // Stomp
          enemy.dead = true;
          const jumpForce = configRef.current.environment === 'water' ? -8 : DEFAULT_JUMP_FORCE;
          p.vy = jumpForce * 0.8;
          scoreRef.current += 100;
          statsRef.current.enemiesDefeated += 1;
        } else {
          // Player takes damage
          takeDamage(1);
        }
      }
    });
    
    // --- Final Boss AI & Combat Logic ---
    const boss = bossRef.current;
    if (boss && boss.active) {
      if (boss.dead) {
        // Boss Defeat Exploding Animation
        boss.deathTimer -= 16;
        if (Math.random() > 0.25) {
          muzzleFlashesRef.current.push({
            x: boss.x + Math.random() * boss.w,
            y: boss.y + Math.random() * boss.h,
            timer: 0,
            size: 25 + Math.random() * 25,
            angle: Math.random() * Math.PI * 2
          });
        }
        if (boss.deathTimer <= 0) {
          boss.active = false;
          // Grant Epic Rewards!
          const earnedCoins = 10000;
          const earnedScore = 25000;
          currencyRef.current += earnedCoins;
          setCurrency(currencyRef.current);
          scoreRef.current += earnedScore;

          // Unlock legendary weapon 'w20' ('נשק האלים')
          let unlockedName: string | undefined;
          if (!unlockedWeapons.includes('w20')) {
            const nextWeapons = [...unlockedWeapons, 'w20' as WeaponType];
            setUnlockedWeapons(nextWeapons);
            unlockedName = 'נשק האלים (w20)';
          } else {
            unlockedName = 'נשק האלים (כבר ברשותך!)';
          }

          if (!statsRef.current.completedLevels.includes(2)) {
            statsRef.current.completedLevels.push(2);
          }
          statsRef.current.bossDefeated = true;
          statsRef.current.bossDefeatsCount = (statsRef.current.bossDefeatsCount || 0) + 1;
          statsRef.current.wins += 1;

          saveService.saveNow(getCurrentSaveSnapshot());

          setVictoryRewards({
            coins: earnedCoins,
            score: earnedScore,
            unlockedWeapon: unlockedName
          });
          setVictoryModalOpen(true);
          setIsPlaying(false);
        }
      } else {
        // Alive Boss Update
        if (boss.introTimer > 0) {
          boss.introTimer -= 16;
          // Descend majestically from the sky into arena center
          const introProgress = 1 - Math.max(0, boss.introTimer / 2200);
          boss.y = -80 + (boss.baseY + 80) * introProgress;
          if (boss.introTimer <= 0) {
            boss.introComplete = true;
          }
        } else {
          boss.displayHealth += (boss.health - boss.displayHealth) * 0.08;
          if (boss.hitFlash > 0) boss.hitFlash -= 16;
          if (boss.phaseBannerTimer > 0) boss.phaseBannerTimer -= 16;

          // Phase transitions
          if (boss.health <= boss.maxHealth * 0.3 && boss.phase < 3) {
            boss.phase = 3;
            boss.phaseBannerTimer = 2200;
            boss.phaseBannerText = 'שלב 3: כוח עילאי!';
            boss.shieldActive = false;
            boss.currentAttack = 'idle';
            boss.attackTimer = 1000;
            // Phase 3 summons 2 shadow minions
            if (arena) {
              const skelDims = getEnemyDimensions('skeletons');
              const creepDims = getEnemyDimensions('creepers');
              enemiesRef.current.push({
                x: arena.arenaStartX + 280,
                y: 350 - skelDims.h,
                w: skelDims.w,
                h: skelDims.h,
                type: 'enemy',
                subType: 'skeletons',
                vx: 2.0,
                vy: 0,
                isGrounded: true,
                timer: 0,
                state: 'patrol'
              });
              enemiesRef.current.push({
                x: arena.arenaStartX + 950,
                y: 350 - creepDims.h,
                w: creepDims.w,
                h: creepDims.h,
                type: 'enemy',
                subType: 'creepers',
                vx: -2.2,
                vy: 0,
                isGrounded: true,
                timer: 0,
                state: 'patrol'
              });
            }
          } else if (boss.health <= boss.maxHealth * 0.6 && boss.phase < 2) {
            boss.phase = 2;
            boss.phaseBannerTimer = 2200;
            boss.phaseBannerText = 'שלב 2: זעם אפל!';
            boss.currentAttack = 'idle';
            boss.attackTimer = 1200;
          }

          // Shield timer
          if (boss.shieldActive) {
            boss.shieldTimer -= 16;
            if (boss.shieldTimer <= 0) {
              boss.shieldActive = false;
            }
          }

          // Hover movement
          boss.hoverAngle += (boss.phase === 3 ? 0.06 : boss.phase === 2 ? 0.05 : 0.035);
          if (boss.currentAttack !== 'slam') {
            boss.y = boss.baseY + Math.sin(boss.hoverAngle) * 22;
            if (arena) {
              const targetX = Math.max(arena.arenaStartX + 420, Math.min(arena.arenaStartX + 950, p.x + 220));
              boss.x += (targetX - boss.x) * (boss.phase === 3 ? 0.03 : 0.018);
            }
          }

          // Attack Cycle
          const attackCooldown = boss.phase === 3 ? 1600 : boss.phase === 2 ? 2400 : 3400;
          if (boss.currentAttack === 'idle') {
            boss.attackTimer -= 16;
            if (boss.attackTimer <= 0) {
              const roll = Math.random();
              if (boss.phase === 1) {
                boss.currentAttack = roll < 0.5 ? 'barrage' : 'slam';
              } else if (boss.phase === 2) {
                boss.currentAttack = roll < 0.35 ? 'barrage' : roll < 0.65 ? 'slam' : roll < 0.85 ? 'meteor' : 'shield';
              } else {
                boss.currentAttack = roll < 0.3 ? 'barrage' : roll < 0.6 ? 'slam' : roll < 0.85 ? 'meteor' : 'shield';
              }
              boss.telegraphTimer = boss.currentAttack === 'slam' ? 750 : boss.currentAttack === 'meteor' ? 900 : 600;
              boss.telegraphType = boss.currentAttack === 'slam' ? 'slam' : boss.currentAttack === 'meteor' ? 'meteor' : 'barrage';
              if (boss.currentAttack === 'slam') {
                boss.slamTargetX = p.x;
                boss.slamGroundY = 350;
              }
            }
          } else if (boss.telegraphTimer > 0) {
            boss.telegraphTimer -= 16;
            if (boss.currentAttack === 'slam' && boss.slamTargetX !== undefined) {
              boss.slamTargetX += (p.x - boss.slamTargetX) * 0.05;
              boss.x += (boss.slamTargetX - boss.w / 2 - boss.x) * 0.08;
            }
          } else {
            // Execute attack!
            if (boss.currentAttack === 'barrage') {
              const count = boss.phase === 1 ? 3 : 5;
              const angleSpread = 0.55;
              const baseAngle = Math.atan2((p.y + p.h / 2) - (boss.y + boss.h / 2), (p.x + p.w / 2) - (boss.x + boss.w / 2));
              for (let a = 0; a < count; a++) {
                const angle = baseAngle - angleSpread / 2 + (count > 1 ? (a / (count - 1)) * angleSpread : 0);
                const spd = boss.phase === 3 ? 6.5 : 5.0;
                bossProjectilesRef.current.push({
                  x: boss.x + boss.w / 2 - 10,
                  y: boss.y + boss.h / 2 - 10,
                  w: 18,
                  h: 18,
                  type: 'orb',
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd
                });
              }
              boss.currentAttack = 'idle';
              boss.attackTimer = attackCooldown;
            } else if (boss.currentAttack === 'slam') {
              boss.y += 14;
              if (boss.y + boss.h >= (boss.slamGroundY || 350)) {
                boss.y = (boss.slamGroundY || 350) - boss.h;
                // Floor shockwaves running left and right
                bossProjectilesRef.current.push({
                  x: boss.x - 25,
                  y: 328,
                  w: 30,
                  h: 24,
                  type: 'shockwave',
                  vx: -(boss.phase === 3 ? 7.0 : 5.5),
                  vy: 0
                });
                bossProjectilesRef.current.push({
                  x: boss.x + boss.w,
                  y: 328,
                  w: 30,
                  h: 24,
                  type: 'shockwave',
                  vx: (boss.phase === 3 ? 7.0 : 5.5),
                  vy: 0
                });
                for (let d = 0; d < 8; d++) {
                  smokeParticlesRef.current.push({
                    x: boss.x + boss.w / 2 + (Math.random() - 0.5) * 60,
                    y: 345,
                    vx: (Math.random() - 0.5) * 8,
                    vy: -Math.random() * 4,
                    timer: 0,
                    size: 8,
                    opacity: 0.9
                  });
                }
                boss.currentAttack = 'idle';
                boss.attackTimer = attackCooldown;
              }
            } else if (boss.currentAttack === 'meteor') {
              const meteorCount = boss.phase === 3 ? 6 : 4;
              if (arena) {
                const span = arena.arenaEndX - arena.arenaStartX - 300;
                for (let m = 0; m < meteorCount; m++) {
                  const targetX = arena.arenaStartX + 150 + (m / Math.max(1, meteorCount - 1)) * span + (Math.random() * 60 - 30);
                  bossProjectilesRef.current.push({
                    x: targetX - 15,
                    y: -60,
                    w: 30,
                    h: 30,
                    type: 'meteor',
                    vx: 0,
                    vy: boss.phase === 3 ? 9.5 : 7.5,
                    targetX,
                    targetY: 340,
                    telegraphTimer: 850
                  });
                }
              }
              boss.currentAttack = 'idle';
              boss.attackTimer = attackCooldown;
            } else if (boss.currentAttack === 'shield') {
              boss.shieldActive = true;
              boss.shieldTimer = 2500;
              boss.currentAttack = 'idle';
              boss.attackTimer = attackCooldown;
            }
          }

          // Direct collision with boss
          if (checkCollision(p, boss)) {
            takeDamage(1);
          }
        }
      }
    }

    // Boss Projectiles Update & Collision
    for (let i = bossProjectilesRef.current.length - 1; i >= 0; i--) {
      const bp = bossProjectilesRef.current[i];
      if (bp.type === 'meteor') {
        if (bp.telegraphTimer && bp.telegraphTimer > 0) {
          bp.telegraphTimer -= 16;
          continue;
        }
        bp.y += bp.vy;
        if (bp.y >= (bp.targetY || 340)) {
          bossProjectilesRef.current.splice(i, 1);
          muzzleFlashesRef.current.push({
            x: bp.x + bp.w / 2,
            y: 340,
            timer: 0,
            size: 24,
            angle: 0
          });
          if (Math.abs((p.x + p.w / 2) - (bp.x + bp.w / 2)) < 42 && p.y + p.h >= 320) {
            takeDamage(1);
          }
          continue;
        }
      } else {
        bp.x += bp.vx;
        bp.y += bp.vy;
      }

      // Bounds culling
      if (arena && (bp.x < arena.arenaStartX - 200 || bp.x > arena.arenaEndX + 200 || bp.y > 600)) {
        bossProjectilesRef.current.splice(i, 1);
        continue;
      }

      // Collision with player
      if (checkCollision(p, bp)) {
        takeDamage(1);
        bossProjectilesRef.current.splice(i, 1);
      }
    }
    
    // Collectibles update
    collectiblesRef.current.forEach(c => {
      if (c.collected) return;
      if (Math.abs(c.x - p.x) > 1500) return;
      if (checkCollision(p, c)) {
        c.collected = true;
        scoreRef.current += 10;
        currencyRef.current += 1;
        statsRef.current.totalCoinsEarned += 1;
        saveService.queueDebouncedSave(getCurrentSaveSnapshot());
      }
    });
    
    // Blue Coins update
    blueCoinsRef.current.forEach(bc => {
      if (bc.collected) return;
      if (Math.abs(bc.x - p.x) > 1500) return;
      if (checkCollision(p, bc)) {
        bc.collected = true;
        scoreRef.current += 50;
        p.airplaneTimer = 10000; // 10 seconds
      }
    });

    // Hearts update
    heartsRef.current.forEach(h => {
      if (h.collected) return;
      if (Math.abs(h.x - p.x) > 1500) return;
      if (checkCollision(p, h)) {
        h.collected = true;
        livesRef.current = Math.min(livesRef.current + 1, 5); // Max 5 lives
        scoreRef.current += 100;
      }
    });

    // Checkpoints update
    checkpointsRef.current.forEach(cp => {
      if (Math.abs(cp.x - p.x) > 1500) return;
      if (checkCollision(p, cp)) {
        if (!cp.collected) {
          cp.collected = true;
          lastCheckpointRef.current = { x: cp.x, y: cp.y };
          saveService.saveNow(getCurrentSaveSnapshot());
        }
      }
    });
    
    // Goal collision
    if (checkCollision(p, goalRef.current)) {
      keysRef.current = {}; // Clear stuck keys
      setCurrency(currencyRef.current);

      if (levelRef.current === 1) {
        if (!statsRef.current.completedLevels.includes(1)) {
          statsRef.current.completedLevels.push(1);
        }
        statsRef.current.maxLevelReached = Math.max(statsRef.current.maxLevelReached, 2);
        saveService.saveNow(getCurrentSaveSnapshot());
        initLevel(2, false);
      } else {
        // Level 2 Goal only passes once Boss is defeated!
        if (bossRef.current && !bossRef.current.dead) {
          return;
        }
        if (!statsRef.current.completedLevels.includes(2)) {
          statsRef.current.completedLevels.push(2);
        }
        statsRef.current.wins += 1;
        saveService.saveNow(getCurrentSaveSnapshot());
        setIsPlaying(false);
        setShowConfig(true);
        initLevel(1, true);
      }
    }
    
    // Camera follow
    cameraRef.current.x = p.x - 400 + p.w / 2;
    if (cameraRef.current.x < 0) cameraRef.current.x = 0;
    if (arena && arena.locked) {
      if (cameraRef.current.x < arena.minCameraX) cameraRef.current.x = arena.minCameraX;
      if (cameraRef.current.x > arena.maxCameraX) cameraRef.current.x = arena.maxCameraX;
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const boss = bossRef.current;
    const arena = arenaBarrierRef.current;

    // Clear & Background
    if (levelRef.current === 1) {
      const env = configRef.current.environment || 'day';
      
      if (env === 'day') {
        ctx.fillStyle = '#87CEEB'; // Minecraft sky blue
        ctx.fillRect(0, 0, 800, 400);
        
        ctx.save();
        ctx.translate(-cameraRef.current.x, -cameraRef.current.y);
        
        // Draw Minecraft Clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const cloudPositions = [
          { x: 100, y: 50, w: 120, h: 40 },
          { x: 400, y: 80, w: 150, h: 50 },
          { x: 700, y: 40, w: 100, h: 30 },
          { x: 1100, y: 60, w: 140, h: 40 },
        ];
        cloudPositions.forEach(c => {
          // Blocky clouds
          ctx.fillRect(c.x, c.y, c.w, c.h);
          ctx.fillRect(c.x + 20, c.y - 20, c.w - 40, c.h + 40);
        });
      } else if (env === 'water') {
        // Underwater Background
        const grad = ctx.createLinearGradient(0, 0, 0, 400);
        grad.addColorStop(0, '#0277BD'); // Light blue surface
        grad.addColorStop(1, '#012642'); // Dark deep water
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 800, 400);
        
        // Procedural Bubbles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        const time = Date.now() / 1000;
        for (let i = 0; i < 30; i++) {
          const startX = (i * 73) % 800;
          const speedY = 20 + (i % 30);
          const y = 400 - ((time * speedY + i * 11) % 400);
          const x = startX + Math.sin(time * 2 + i) * 15;
          const size = 2 + (i % 4);
          
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.save();
        ctx.translate(-cameraRef.current.x, -cameraRef.current.y);
      } else if (env === 'tunnels') {
        // Tunnels Background
        ctx.fillStyle = '#1a1a1a'; // Very dark gray cave
        ctx.fillRect(0, 0, 800, 400);
        
        // Procedural stone texture (subtle)
        ctx.fillStyle = '#222';
        for (let i = 0; i < 100; i++) {
          const rockX = (i * 91) % 800;
          const rockY = (i * 71) % 400;
          const w = 20 + (i % 40);
          const h = 20 + ((i*3) % 30);
          ctx.fillRect(rockX, rockY, w, h);
        }
        
        ctx.save();
        ctx.translate(-cameraRef.current.x, -cameraRef.current.y);
      }
    } else {
      // Level 2 Background (Cool Space/Neon)
      const grad = ctx.createLinearGradient(0, 0, 0, 400);
      grad.addColorStop(0, '#0B0B2A');
      grad.addColorStop(1, '#4A0E4E');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 400);
      
      // Static Stars
      ctx.fillStyle = 'white';
      for(let i=0; i<50; i++) {
        const starX = (i * 137) % 800;
        const starY = (i * 251) % 300;
        ctx.fillRect(starX, starY, 2, 2);
      }
      // Moon
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(700, 80, 40, 0, Math.PI*2);
      ctx.fill();
      
      ctx.save();
      ctx.translate(-cameraRef.current.x, -cameraRef.current.y);
    }
    
    // Draw Platforms (Minecraft Grass Block style)
    const drawStartX = cameraRef.current.x - 500;
    const drawEndX = cameraRef.current.x + 1500;
    
    platformsRef.current.forEach(plat => {
      if (plat.x + plat.w < drawStartX || plat.x > drawEndX) return;
      ctx.fillStyle = '#8B4513'; // Dirt brown
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      ctx.fillStyle = '#228B22'; // Grass green
      ctx.fillRect(plat.x, plat.y, plat.w, 10);
    });
    
    // Draw Spikes
    ctx.fillStyle = '#A9A9A9'; // Silver/Grey
    spikesRef.current.forEach(spike => {
      if (spike.x + spike.w < drawStartX || spike.x > drawEndX) return;
      const spikeWidth = 10;
      const numSpikes = spike.w / spikeWidth;
      for (let i = 0; i < numSpikes; i++) {
        ctx.beginPath();
        ctx.moveTo(spike.x + i * spikeWidth, spike.y + spike.h);
        ctx.lineTo(spike.x + i * spikeWidth + spikeWidth / 2, spike.y);
        ctx.lineTo(spike.x + i * spikeWidth + spikeWidth, spike.y + spike.h);
        ctx.fill();
      }
    });

    // Draw Bullets and Fireballs
    bulletsRef.current.forEach(b => {
      if (b.isFireball) {
        // Draw fireball
        ctx.fillStyle = '#FF4500'; // OrangeRed
        ctx.beginPath();
        ctx.arc(b.x + b.w/2, b.y + b.h/2, b.w/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFD700'; // Gold center
        ctx.beginPath();
        ctx.arc(b.x + b.w/2, b.y + b.h/2, b.w/4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Draw normal bullet
        ctx.save();
        ctx.fillStyle = '#FFFF00';
        ctx.translate(b.x + b.w/2, b.y + b.h/2);
        ctx.rotate(Math.atan2(b.vy, b.vx));
        ctx.fillRect(-b.w/2, -b.h/2, b.w, b.h);
        ctx.restore();
      }
    });
    
    // Draw Collectibles
    collectiblesRef.current.forEach(c => {
      if (c.collected) return;
      if (c.x + c.w < drawStartX || c.x > drawEndX) return;
      if (config.collectible === 'coins') {
        // Gold Coin
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(c.x + c.w/2, c.y + c.h/2, c.w/2, 0, Math.PI * 2);
        ctx.fill();

        // Bear emoji inside the coin
        ctx.save();
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐻', c.x + c.w/2, c.y + c.h/2 + 2);
        ctx.restore();
      } else if (config.collectible === 'diamonds') {
        // Beautiful Diamond
        ctx.fillStyle = '#00FFFF';
        ctx.beginPath();
        ctx.moveTo(c.x + c.w * 0.2, c.y + c.h * 0.3);
        ctx.lineTo(c.x + c.w * 0.8, c.y + c.h * 0.3);
        ctx.lineTo(c.x + c.w, c.y + c.h * 0.5);
        ctx.lineTo(c.x + c.w/2, c.y + c.h);
        ctx.lineTo(c.x, c.y + c.h * 0.5);
        ctx.closePath();
        ctx.fill();
        
        // Facets
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(c.x + c.w * 0.2, c.y + c.h * 0.3);
        ctx.lineTo(c.x + c.w/2, c.y + c.h * 0.5);
        ctx.lineTo(c.x + c.w * 0.8, c.y + c.h * 0.3);
        ctx.stroke();
        
        // Highlight
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(c.x + c.w * 0.3, c.y + c.h * 0.4, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Cute Rabbits
        ctx.fillStyle = 'white';
        const centerX = c.x + c.w/2;
        const centerY = c.y + c.h/2 + 3;
        // Body/Head
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        ctx.fill();
        // Ears
        ctx.fillRect(centerX - 5, centerY - 15, 3, 10);
        ctx.fillRect(centerX + 2, centerY - 15, 3, 10);
        // Eyes
        ctx.fillStyle = 'black';
        ctx.fillRect(centerX - 3, centerY - 2, 2, 2);
        ctx.fillRect(centerX + 1, centerY - 2, 2, 2);
        // Nose
        ctx.fillStyle = 'pink';
        ctx.fillRect(centerX - 1, centerY + 1, 2, 2);
      }
    });
    
    // Draw Blue Coins
    blueCoinsRef.current.forEach(bc => {
      if (bc.collected) return;
      if (bc.x + bc.w < drawStartX || bc.x > drawEndX) return;
      ctx.fillStyle = '#4169E1'; // Royal Blue
      ctx.beginPath();
      ctx.arc(bc.x + bc.w/2, bc.y + bc.h/2, bc.w/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText('✈️', bc.x + 2, bc.y + 14);
    });

    // Draw Hearts
    heartsRef.current.forEach(h => {
      if (h.collected) return;
      if (h.x + h.w < drawStartX || h.x > drawEndX) return;
      ctx.save();
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('❤️', h.x + h.w/2, h.y + h.h/2);
      ctx.restore();
    });

    // Draw Checkpoints
    checkpointsRef.current.forEach(cp => {
      if (cp.x + cp.w < drawStartX || cp.x > drawEndX) return;
      ctx.fillStyle = cp.collected ? '#00FF00' : '#FF0000'; // Green if activated, Red if not
      // Base
      ctx.fillRect(cp.x, cp.y + cp.h - 10, cp.w, 10);
      // Pole
      ctx.fillStyle = '#888';
      ctx.fillRect(cp.x + cp.w/2 - 2, cp.y, 4, cp.h);
      // Flag
      ctx.fillStyle = cp.collected ? '#00FF00' : '#FF0000';
      ctx.beginPath();
      ctx.moveTo(cp.x + cp.w/2, cp.y);
      ctx.lineTo(cp.x + cp.w, cp.y + 15);
      ctx.lineTo(cp.x + cp.w/2, cp.y + 30);
      ctx.fill();
    });

    // Draw Smoke Particles
    smokeParticlesRef.current.forEach(s => {
      ctx.fillStyle = `rgba(150, 150, 150, ${s.opacity})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Muzzle Flashes
    muzzleFlashesRef.current.forEach(f => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.angle);
      
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, f.size);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.4, 'rgba(255, 255, 0, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      // Star shape
      for (let i = 0; i < 8; i++) {
        const r = i % 2 === 0 ? f.size : f.size / 2;
        const angle = (i / 8) * Math.PI * 2;
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    
    // Draw Enemies
    enemiesRef.current.forEach(e => {
      if (e.dead) return;
      if (e.x + e.w < drawStartX || e.x > drawEndX) return;
      const eType = (e.subType || config.enemy) as EnemyType;
      if (eType === 'slimes') {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.85)';
        ctx.beginPath();
        ctx.roundRect(e.x, e.y, e.w, e.h, 6);
        ctx.fill();
        ctx.strokeStyle = '#00AA00';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Inner core
        ctx.fillStyle = 'rgba(0, 200, 0, 0.9)';
        ctx.fillRect(e.x + 6, e.y + 6, e.w - 12, e.h - 10);
        // Eyes
        ctx.fillStyle = 'black';
        ctx.fillRect(e.x + 5, e.y + 6, 4, 4);
        ctx.fillRect(e.x + e.w - 9, e.y + 6, 4, 4);
      } else if (eType === 'zombies') {
        // Minecraft Zombie (w: 28, h: 36)
        // Head (0..14)
        ctx.fillStyle = '#00A86B'; // Zombie green
        ctx.fillRect(e.x + 4, e.y, 20, 14);
        ctx.fillStyle = 'black';
        ctx.fillRect(e.x + 7, e.y + 4, 3, 3);
        ctx.fillRect(e.x + 16, e.y + 4, 3, 3);
        // Shirt (14..26)
        ctx.fillStyle = '#00CCCC'; // Cyan shirt
        ctx.fillRect(e.x + 2, e.y + 14, 24, 12);
        // Pants (26..33)
        ctx.fillStyle = '#3C44AA'; // Blue pants
        ctx.fillRect(e.x + 4, e.y + 26, 20, 7);
        // Shoes/Feet (33..36) -> aligns with e.y + e.h
        ctx.fillStyle = '#222222';
        ctx.fillRect(e.x + 4, e.y + 33, 9, 3);
        ctx.fillRect(e.x + 15, e.y + 33, 9, 3);
      } else if (eType === 'rabbits') {
        // Evil Rabbits (w: 28, h: 26)
        ctx.fillStyle = 'white';
        // Base body / feet (bottom reaches e.y + e.h)
        ctx.beginPath();
        ctx.ellipse(e.x + e.w/2, e.y + e.h - 7, e.w/2 - 2, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(e.x + e.w/2, e.y + e.h - 13, 8, 0, Math.PI * 2);
        ctx.fill();
        // Ears (sticking up from head to e.y)
        ctx.fillRect(e.x + 6, e.y, 3, 9);
        ctx.fillRect(e.x + e.w - 9, e.y, 3, 9);
        // Eyes
        ctx.fillStyle = 'red';
        ctx.fillRect(e.x + 8, e.y + 10, 3, 3);
        ctx.fillRect(e.x + 17, e.y + 10, 3, 3);
      } else if (eType === 'ghosts') {
        // Ghosts (w: 30, h: 30)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(e.x + e.w/2, e.y + e.h/2, e.w/2, Math.PI, 0);
        ctx.lineTo(e.x + e.w, e.y + e.h);
        // Wavy bottom
        for (let i = 0; i < 3; i++) {
          ctx.arc(e.x + e.w - (i * e.w/3) - e.w/6, e.y + e.h, e.w/6, 0, Math.PI);
        }
        ctx.lineTo(e.x, e.y + e.h/2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(e.x + e.w/2 - 5, e.y + e.h/2 - 2, 3, 0, Math.PI * 2);
        ctx.arc(e.x + e.w/2 + 5, e.y + e.h/2 - 2, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (eType === 'skeletons') {
        // Skeletons (w: 28, h: 36)
        // Head (0..13)
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(e.x + 4, e.y, 20, 13);
        ctx.fillStyle = 'black';
        ctx.fillRect(e.x + 7, e.y + 4, 3, 3);
        ctx.fillRect(e.x + 16, e.y + 4, 3, 3);
        // Ribcage / Spine (13..26)
        ctx.fillStyle = '#CCCCCC';
        ctx.fillRect(e.x + 8, e.y + 13, 12, 13);
        // Legs / Feet (26..36) -> aligns with e.y + e.h
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(e.x + 7, e.y + 26, 4, 10);
        ctx.fillRect(e.x + 17, e.y + 26, 4, 10);
        // Bow
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const bowFacingRight = (e.vx || 0) >= 0;
        ctx.arc(e.x + (bowFacingRight ? e.w - 2 : 2), e.y + 16, 9, -Math.PI/2, Math.PI/2);
        ctx.stroke();
      } else if (eType === 'creepers') {
        // Creepers (w: 28, h: 36)
        ctx.fillStyle = e.state === 'charging' ? '#FF2222' : '#00D000';
        // Head (0..14)
        ctx.fillRect(e.x + 4, e.y, 20, 14);
        // Face
        ctx.fillStyle = 'black';
        ctx.fillRect(e.x + 7, e.y + 4, 3, 3);
        ctx.fillRect(e.x + 16, e.y + 4, 3, 3);
        ctx.fillRect(e.x + 11, e.y + 8, 6, 4); // Mouth
        // Body (14..28)
        ctx.fillStyle = e.state === 'charging' ? '#CC1111' : '#00B000';
        ctx.fillRect(e.x + 6, e.y + 14, 16, 14);
        // Feet (28..36) -> aligns with e.y + e.h
        ctx.fillStyle = e.state === 'charging' ? '#990000' : '#008800';
        ctx.fillRect(e.x + 2, e.y + 28, 10, 8); // Left foot
        ctx.fillRect(e.x + 16, e.y + 28, 10, 8); // Right foot
      } else if (eType === 'fish') {
        // Fish (w: 24, h: 16)
        ctx.fillStyle = '#FFA500'; // Orange fish
        ctx.beginPath();
        ctx.ellipse(e.x + e.w/2, e.y + e.h/2, e.w/2, e.h/2, 0, 0, Math.PI*2);
        ctx.fill();
        // Tail
        ctx.beginPath();
        if (e.vx > 0) {
          ctx.moveTo(e.x, e.y + e.h/2);
          ctx.lineTo(e.x - 8, e.y);
          ctx.lineTo(e.x - 8, e.y + e.h);
        } else {
          ctx.moveTo(e.x + e.w, e.y + e.h/2);
          ctx.lineTo(e.x + e.w + 8, e.y);
          ctx.lineTo(e.x + e.w + 8, e.y + e.h);
        }
        ctx.fill();
        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(e.vx > 0 ? e.x + e.w - 6 : e.x + 6, e.y + 6, 2, 0, Math.PI*2);
        ctx.fill();
      } else if (eType === 'sharks') {
        // Sharks (w: 40, h: 22)
        ctx.fillStyle = '#778899'; // Slate gray
        ctx.beginPath();
        ctx.ellipse(e.x + e.w/2, e.y + e.h/2 + 2, e.w/2, e.h/2 - 2, 0, 0, Math.PI*2);
        ctx.fill();
        // Dorsal fin
        ctx.beginPath();
        ctx.moveTo(e.x + e.w/2, e.y + 2);
        ctx.lineTo(e.x + e.w/2 - (e.vx > 0 ? 8 : -8), e.y - 8);
        ctx.lineTo(e.x + e.w/2 + (e.vx > 0 ? 4 : -4), e.y + 10);
        ctx.fill();
        // Tail
        ctx.beginPath();
        if (e.vx > 0) {
          ctx.moveTo(e.x, e.y + e.h/2);
          ctx.lineTo(e.x - 10, e.y);
          ctx.lineTo(e.x - 10, e.y + e.h);
        } else {
          ctx.moveTo(e.x + e.w, e.y + e.h/2);
          ctx.lineTo(e.x + e.w + 10, e.y);
          ctx.lineTo(e.x + e.w + 10, e.y + e.h);
        }
        ctx.fill();
        // Eye & Teeth
        ctx.fillStyle = 'black';
        ctx.fillRect(e.vx > 0 ? e.x + e.w - 10 : e.x + 8, e.y + 8, 3, 3);
        ctx.fillStyle = 'white';
        ctx.fillRect(e.vx > 0 ? e.x + e.w - 12 : e.x + 8, e.y + 16, 6, 2);
      } else if (eType === 'bats') {
        // Bats (w: 26, h: 20)
        ctx.fillStyle = '#333333';
        // Body
        ctx.beginPath();
        ctx.ellipse(e.x + e.w/2, e.y + e.h/2, 6, 8, 0, 0, Math.PI*2);
        ctx.fill();
        // Wings (flapping based on time)
        const flap = Math.sin(Date.now() / 100) > 0;
        ctx.beginPath();
        if (flap) {
          ctx.moveTo(e.x + e.w/2, e.y + e.h/2);
          ctx.lineTo(e.x, e.y);
          ctx.lineTo(e.x, e.y + 10);
          ctx.moveTo(e.x + e.w/2, e.y + e.h/2);
          ctx.lineTo(e.x + e.w, e.y);
          ctx.lineTo(e.x + e.w, e.y + 10);
        } else {
          ctx.moveTo(e.x + e.w/2, e.y + e.h/2);
          ctx.lineTo(e.x - 4, e.y + e.h);
          ctx.lineTo(e.x - 4, e.y + e.h - 10);
          ctx.moveTo(e.x + e.w/2, e.y + e.h/2);
          ctx.lineTo(e.x + e.w + 4, e.y + e.h);
          ctx.lineTo(e.x + e.w + 4, e.y + e.h - 10);
        }
        ctx.fill();
        // Eyes
        ctx.fillStyle = 'red';
        ctx.fillRect(e.x + e.w/2 - 3, e.y + e.h/2 - 4, 2, 2);
        ctx.fillRect(e.x + e.w/2 + 1, e.y + e.h/2 - 4, 2, 2);
      } else if (eType === 'spiders') {
        // Spiders (w: 32, h: 20)
        ctx.fillStyle = '#1A1A1A';
        // Body
        ctx.beginPath();
        ctx.ellipse(e.x + e.w/2, e.y + 14, 10, 6, 0, 0, Math.PI*2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(e.vx > 0 ? e.x + e.w - 10 : e.x + 10, e.y + 12, 5, 0, Math.PI*2);
        ctx.fill();
        // Legs (animated)
        const walk = Math.sin(e.x / 5) > 0;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const centerX = e.x + e.w/2;
        const baseY = e.y + 14;
        for(let i=0; i<4; i++) {
          const offset = i * 4 - 6;
          // Left legs
          ctx.moveTo(centerX, baseY);
          ctx.lineTo(centerX - 10 + (walk ? 2 : -2), baseY - 6);
          ctx.lineTo(centerX - 16, e.y + 20);
          // Right legs
          ctx.moveTo(centerX, baseY);
          ctx.lineTo(centerX + 10 + (!walk ? 2 : -2), baseY - 6);
          ctx.lineTo(centerX + 16, e.y + 20);
        }
        ctx.stroke();
        // Eyes
        ctx.fillStyle = 'red';
        const eyeX = e.vx > 0 ? e.x + e.w - 8 : e.x + 6;
        ctx.fillRect(eyeX, e.y + 10, 2, 2);
        ctx.fillRect(eyeX + 3, e.y + 10, 2, 2);
      }
    });

    // Draw Enemy Bullets
    enemyBulletsRef.current.forEach(b => {
      ctx.fillStyle = (b.subType || config.enemy) === 'skeletons' ? '#A0A0A0' : '#FF0000';
      ctx.fillRect(b.x, b.y, b.w, b.h);
    });
    
    // Draw Player (Pixar style Bear or Airplane)
    const p = playerRef.current;
    
    if (invincibilityTimerRef.current > 0) {
      if (Math.floor(invincibilityTimerRef.current / 5) % 2 === 0) {
        ctx.globalAlpha = 0.3;
      }
    }
    
    if (p.airplaneTimer > 0) {
      // Draw Airplane below the bear
      ctx.fillStyle = '#C0C0C0'; // Silver plane
      
      // Fuselage
      ctx.beginPath();
      ctx.ellipse(p.x + p.w/2, p.y + p.h + 5, 30, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Wings
      ctx.fillStyle = '#A9A9A9';
      ctx.beginPath();
      ctx.ellipse(p.x + p.w/2, p.y + p.h + 5, 12, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Tail
      ctx.fillStyle = '#FF4500'; // Orange tail
      if (p.facingRight) {
        ctx.fillRect(p.x - 20, p.y + p.h - 10, 12, 15);
      } else {
        ctx.fillRect(p.x + p.w + 8, p.y + p.h - 10, 12, 15);
      }
    }
    
    // Bear body gradient (brown)
    const bodyGradient = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
    bodyGradient.addColorStop(0, '#8B5A2B'); // Lighter brown
    bodyGradient.addColorStop(1, '#5C3A21'); // Darker brown
    
    // Ears
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(p.x + 5, p.y + 5, 8, 0, Math.PI * 2); // Left ear
    ctx.arc(p.x + p.w - 5, p.y + 5, 8, 0, Math.PI * 2); // Right ear
    ctx.fill();
    
    // Inner ears
    ctx.fillStyle = '#D2B48C'; // Tan
    ctx.beginPath();
    ctx.arc(p.x + 5, p.y + 5, 4, 0, Math.PI * 2);
    ctx.arc(p.x + p.w - 5, p.y + 5, 4, 0, Math.PI * 2);
    ctx.fill();

    // Body/Head (Bear is mostly a round shape)
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.roundRect(p.x, p.y + 5, p.w, p.h - 5, 12);
    ctx.fill();
    
    // Snout
    ctx.fillStyle = '#D2B48C'; // Tan snout
    ctx.beginPath();
    ctx.ellipse(p.x + p.w/2, p.y + 22, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Nose
    ctx.fillStyle = '#3E2723'; // Dark brown/black nose
    ctx.beginPath();
    ctx.ellipse(p.x + p.w/2, p.y + 20, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes (Pixar style big eyes)
    const lookDir = p.vx > 0 ? 3 : p.vx < 0 ? -3 : 0;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(p.x + p.w/2 - 6 + lookDir, p.y + 12, 4, 0, Math.PI * 2);
    ctx.arc(p.x + p.w/2 + 6 + lookDir, p.y + 12, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(p.x + p.w/2 - 6 + lookDir, p.y + 12, 2, 0, Math.PI * 2);
    ctx.arc(p.x + p.w/2 + 6 + lookDir, p.y + 12, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Catchlight (sparkle in eye)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(p.x + p.w/2 - 7 + lookDir, p.y + 11, 0.8, 0, Math.PI * 2);
    ctx.arc(p.x + p.w/2 + 5 + lookDir, p.y + 11, 0.8, 0, Math.PI * 2);
    ctx.fill();
    
    // Environment Gear
    const env = configRef.current.environment || 'day';
    if (env === 'water') {
      // Diving goggles/mask
      ctx.fillStyle = 'rgba(0, 191, 255, 0.5)';
      ctx.beginPath();
      ctx.roundRect(p.x + p.w/2 - 12 + lookDir, p.y + 8, 24, 10, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Oxygen tank on back
      ctx.fillStyle = '#C0C0C0';
      const tankX = p.facingRight ? p.x - 6 : p.x + p.w + 2;
      ctx.beginPath();
      ctx.roundRect(tankX, p.y + 10, 6, 18, 3);
      ctx.fill();
      ctx.fillStyle = '#FF4500'; // Valve
      ctx.fillRect(tankX + 1, p.y + 8, 4, 3);
      
    } else if (env === 'tunnels') {
      // Miner helmet
      ctx.fillStyle = '#FFCC00'; // Yellow helmet
      ctx.beginPath();
      ctx.arc(p.x + p.w/2, p.y + 5, 14, Math.PI, 0); // Dome
      ctx.fill();
      ctx.fillRect(p.x + p.w/2 - 16, p.y + 5, 32, 3); // Brim
      
      // Headlamp
      ctx.fillStyle = '#EEEEEE';
      const lampX = p.facingRight ? p.x + p.w/2 + 10 : p.x + p.w/2 - 14;
      ctx.fillRect(lampX, p.y, 4, 6);
      ctx.fillStyle = '#FFFFCC'; // Light bulb
      ctx.fillRect(p.facingRight ? lampX + 4 : lampX - 2, p.y + 1, 2, 4);
      
      // Light beam
      ctx.fillStyle = 'rgba(255, 255, 150, 0.15)';
      ctx.beginPath();
      if (p.facingRight) {
        ctx.moveTo(lampX + 6, p.y + 3);
        ctx.lineTo(lampX + 80, p.y - 15);
        ctx.lineTo(lampX + 80, p.y + 25);
      } else {
        ctx.moveTo(lampX - 2, p.y + 3);
        ctx.lineTo(lampX - 80, p.y - 15);
        ctx.lineTo(lampX - 80, p.y + 25);
      }
      ctx.fill();
    }
    
    // Draw Gun based on equipped weapon
    const currentWeapon = WEAPONS.find(w => w.id === config.weapon);
    if (currentWeapon) {
      ctx.save();
      ctx.fillStyle = currentWeapon.color;
      
      const gunX = p.facingRight ? p.x + p.w - 5 : p.x + 5;
      const gunY = p.y + 20;
      
      ctx.translate(gunX, gunY);
      
      const dx = mouseRef.current.x - gunX;
      const dy = mouseRef.current.y - gunY;
      let angle = Math.atan2(dy, dx);
      
      if (!p.facingRight) {
        ctx.scale(-1, 1);
        angle = Math.atan2(dy, -dx); 
      }
      
      ctx.rotate(angle);
      
      switch (currentWeapon.type) {
        case 'pistol':
          // Barrel
          ctx.fillRect(0, -4, 15, 6);
          // Grip
          ctx.fillRect(0, -4, 5, 10);
          break;
        case 'smg':
          // Barrel
          ctx.fillRect(0, -4, 22, 7);
          // Magazine
          ctx.fillRect(8, 0, 4, 12);
          // Grip
          ctx.fillRect(0, -4, 5, 10);
          // Stock (optional)
          ctx.fillRect(-5, -4, 5, 4);
          break;
        case 'rifle':
          // Barrel
          ctx.fillRect(0, -4, 30, 8);
          // Magazine
          ctx.fillRect(10, 2, 5, 12);
          // Grip
          ctx.fillRect(0, -4, 6, 12);
          // Stock
          ctx.fillRect(-10, -4, 10, 10);
          break;
        case 'shotgun':
          // Thick Barrel
          ctx.fillRect(0, -5, 28, 10);
          // Grip/Stock combo
          ctx.fillRect(-8, -5, 12, 14);
          break;
        case 'heavy':
          // Large Body
          ctx.fillRect(-5, -8, 25, 16);
          // Large Barrel
          ctx.fillRect(20, -4, 15, 8);
          // Grip
          ctx.fillRect(0, 4, 6, 12);
          break;
        case 'sci-fi':
          // Sleek Body
          ctx.beginPath();
          ctx.roundRect(-5, -6, 30, 12, 5);
          ctx.fill();
          // Glowing parts
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.fillRect(5, -2, 15, 4);
          // Barrel
          ctx.fillStyle = currentWeapon.color;
          ctx.fillRect(25, -3, 10, 6);
          break;
      }
      
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // Arena Barrier & Posts (World Space)
    if (arena) {
      ctx.fillStyle = arena.locked ? 'rgba(255, 0, 85, 0.65)' : 'rgba(0, 255, 200, 0.35)';
      ctx.fillRect(arena.x - 6, 0, 12, 400);
      ctx.fillStyle = '#1A0033';
      ctx.fillRect(arena.x - 14, 180, 28, 170);
      ctx.strokeStyle = arena.locked ? '#FF0055' : '#00FFFF';
      ctx.lineWidth = 3;
      ctx.strokeRect(arena.x - 6, 0, 12, 400);
    }

    // Boss Telegraph Visuals (World Space)
    if (boss && boss.active && !boss.dead && boss.telegraphTimer > 0) {
      if (boss.telegraphType === 'slam' && boss.slamTargetX !== undefined) {
        const beamAlpha = 0.3 + Math.sin(Date.now() / 70) * 0.25;
        ctx.fillStyle = `rgba(255, 0, 50, ${beamAlpha})`;
        ctx.fillRect(boss.slamTargetX - 25, 0, 50, 350);
        ctx.strokeStyle = '#FF0033';
        ctx.lineWidth = 2;
        ctx.strokeRect(boss.slamTargetX - 25, 340, 50, 10);
      } else if (boss.telegraphType === 'barrage') {
        ctx.save();
        ctx.translate(boss.x + boss.w / 2, boss.y + boss.h / 2);
        ctx.rotate(Date.now() / 100);
        ctx.strokeStyle = '#BA55D3';
        ctx.lineWidth = 3;
        ctx.strokeRect(-28, -28, 56, 56);
        ctx.restore();
      }
    }

    // Meteor Landing Zone Telegraphs (World Space)
    bossProjectilesRef.current.forEach(bp => {
      if (bp.type === 'meteor' && bp.telegraphTimer && bp.telegraphTimer > 0) {
        const pulse = 0.4 + Math.sin(Date.now() / 80) * 0.3;
        ctx.fillStyle = `rgba(255, 50, 0, ${pulse})`;
        ctx.beginPath();
        ctx.ellipse(bp.targetX || bp.x, 348, 30, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Boss Projectiles (World Space)
    bossProjectilesRef.current.forEach(bp => {
      if (bp.type === 'orb') {
        const grad = ctx.createRadialGradient(bp.x + bp.w / 2, bp.y + bp.h / 2, 2, bp.x + bp.w / 2, bp.y + bp.h / 2, bp.w / 2);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.4, '#9400D3');
        grad.addColorStop(1, '#1A0033');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bp.x + bp.w / 2, bp.y + bp.h / 2, bp.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (bp.type === 'shockwave') {
        ctx.fillStyle = '#FF0055';
        ctx.beginPath();
        ctx.moveTo(bp.x, bp.y + bp.h);
        ctx.lineTo(bp.x + bp.w / 2, bp.y);
        ctx.lineTo(bp.x + bp.w, bp.y + bp.h);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (bp.type === 'meteor' && (!bp.telegraphTimer || bp.telegraphTimer <= 0)) {
        const mGrad = ctx.createRadialGradient(bp.x + bp.w / 2, bp.y + bp.h / 2, 3, bp.x + bp.w / 2, bp.y + bp.h / 2, bp.w / 2);
        mGrad.addColorStop(0, '#FFFF00');
        mGrad.addColorStop(0.5, '#FF4500');
        mGrad.addColorStop(1, '#8B0000');
        ctx.fillStyle = mGrad;
        ctx.beginPath();
        ctx.arc(bp.x + bp.w / 2, bp.y + bp.h / 2, bp.w / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Boss Entity (World Space)
    if (boss && boss.active) {
      ctx.save();
      // Aura
      const auraColor = boss.phase === 3 ? 'rgba(255, 0, 50, 0.45)' : boss.phase === 2 ? 'rgba(148, 0, 211, 0.35)' : 'rgba(75, 0, 130, 0.25)';
      const auraSize = boss.phase === 3 ? 18 : 10;
      ctx.fillStyle = auraColor;
      ctx.beginPath();
      ctx.roundRect(boss.x - auraSize, boss.y - auraSize, boss.w + auraSize * 2, boss.h + auraSize * 2, 16);
      ctx.fill();

      // Wings
      const wingFlap = Math.sin(Date.now() / 140) * 12;
      ctx.fillStyle = boss.phase === 3 ? '#8B0000' : '#2D0A4E';
      // Left wing
      ctx.beginPath();
      ctx.moveTo(boss.x + 15, boss.y + 35);
      ctx.lineTo(boss.x - 45, boss.y + 10 + wingFlap);
      ctx.lineTo(boss.x - 25, boss.y + 60 + wingFlap);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#9400D3';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Right wing
      ctx.beginPath();
      ctx.moveTo(boss.x + boss.w - 15, boss.y + 35);
      ctx.lineTo(boss.x + boss.w + 45, boss.y + 10 + wingFlap);
      ctx.lineTo(boss.x + boss.w + 25, boss.y + 60 + wingFlap);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Body (Obsidian Armor)
      ctx.fillStyle = boss.hitFlash > 0 ? '#FFFFFF' : boss.phase === 3 ? '#1A000A' : '#0D0221';
      ctx.beginPath();
      ctx.roundRect(boss.x, boss.y, boss.w, boss.h, 14);
      ctx.fill();
      ctx.strokeStyle = boss.phase === 3 ? '#FF0055' : '#8A2BE2';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Horns / Crown
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(boss.x + 10, boss.y);
      ctx.lineTo(boss.x + 5, boss.y - 18);
      ctx.lineTo(boss.x + 25, boss.y);
      ctx.lineTo(boss.x + boss.w / 2, boss.y - 25);
      ctx.lineTo(boss.x + boss.w - 25, boss.y);
      ctx.lineTo(boss.x + boss.w - 5, boss.y - 18);
      ctx.lineTo(boss.x + boss.w - 10, boss.y);
      ctx.closePath();
      ctx.fill();

      // Glowing Eyes
      ctx.fillStyle = boss.phase === 3 ? '#FF0000' : '#FF007F';
      ctx.fillRect(boss.x + 18, boss.y + 26, 12, 8);
      ctx.fillRect(boss.x + boss.w - 30, boss.y + 26, 12, 8);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(boss.x + 22, boss.y + 28, 4, 4);
      ctx.fillRect(boss.x + boss.w - 26, boss.y + 28, 4, 4);

      // Chest Power Core
      const corePulse = 0.7 + Math.sin(Date.now() / 160) * 0.3;
      ctx.fillStyle = boss.phase === 3 ? `rgba(255, 0, 50, ${corePulse})` : `rgba(186, 85, 211, ${corePulse})`;
      ctx.beginPath();
      ctx.arc(boss.x + boss.w / 2, boss.y + 55, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Shadow Shield
      if (boss.shieldActive) {
        ctx.save();
        ctx.translate(boss.x + boss.w / 2, boss.y + boss.h / 2);
        ctx.rotate(Date.now() / 250);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.85)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let s = 0; s < 6; s++) {
          const sAngle = (s / 6) * Math.PI * 2;
          const sx = Math.cos(sAngle) * 58;
          const sy = Math.sin(sAngle) * 58;
          if (s === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }

    // Draw Goal (Only in Level 1, or in Level 2 if Boss is defeated)
    if (levelRef.current === 1 || (levelRef.current === 2 && (!bossRef.current || bossRef.current.dead))) {
      ctx.fillStyle = levelRef.current === 1 ? '#00FF00' : '#FF00FF';
      ctx.fillRect(goalRef.current.x, goalRef.current.y, goalRef.current.w, goalRef.current.h);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('סיום!', goalRef.current.x + 10, goalRef.current.y + 50);
    }

    ctx.restore();
    
    // UI Overlay (Screen Space)
    // Boss Health Bar UI
    if (boss && boss.active && !boss.dead) {
      const barX = 175;
      const barY = 16;
      const barW = 450;
      const barH = 22;

      ctx.fillStyle = 'rgba(10, 10, 18, 0.88)';
      ctx.beginPath();
      ctx.roundRect(barX - 4, barY - 4, barW + 8, barH + 28, 8);
      ctx.fill();
      ctx.strokeStyle = boss.phase === 3 ? '#FF0055' : '#9400D3';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Boss Name & Phase
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 14px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${boss.name} — שלב ${boss.phase}`, barX + barW / 2, barY + 13);

      // Background bar
      ctx.fillStyle = '#262626';
      ctx.beginPath();
      ctx.roundRect(barX, barY + 18, barW, barH - 4, 4);
      ctx.fill();

      // Health fill
      const healthRatio = Math.max(0, Math.min(1, boss.displayHealth / boss.maxHealth));
      const fillW = Math.max(0, barW * healthRatio);
      const hpGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      hpGrad.addColorStop(0, '#8B0000');
      hpGrad.addColorStop(0.5, '#FF0055');
      hpGrad.addColorStop(1, boss.phase === 3 ? '#FF4500' : '#BA55D3');
      ctx.fillStyle = hpGrad;
      ctx.beginPath();
      ctx.roundRect(barX, barY + 18, fillW, barH - 4, 4);
      ctx.fill();

      // Phase tick marks (60% and 30%)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(barX + barW * 0.6, barY + 16, 2, barH);
      ctx.fillRect(barX + barW * 0.3, barY + 16, 2, barH);

      // HP text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillText(`${Math.round(boss.health)} / ${boss.maxHealth}`, barX + barW / 2, barY + 31);
      ctx.textAlign = 'left';
    }

    // Dramatic Intro Banner
    if (boss && boss.introTimer > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
      ctx.fillRect(0, 140, 800, 110);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 140, 800, 110);

      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 28px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('הבוס הסופי: טיטאן הצללים', 400, 185);

      ctx.fillStyle = '#FF0055';
      ctx.font = 'bold 18px "Inter", sans-serif';
      ctx.fillText('קרב הגמר החל — שרוד ונצח!', 400, 225);
      ctx.textAlign = 'left';
    }

    // Phase Transition Banner
    if (boss && boss.phaseBannerTimer > 0) {
      const bannerAlpha = Math.min(1, boss.phaseBannerTimer / 400);
      ctx.fillStyle = `rgba(0, 0, 0, ${0.75 * bannerAlpha})`;
      ctx.fillRect(150, 150, 500, 70);
      ctx.strokeStyle = boss.phase === 3 ? '#FF0055' : '#9400D3';
      ctx.lineWidth = 2;
      ctx.strokeRect(150, 150, 500, 70);

      ctx.fillStyle = boss.phase === 3 ? '#FF0055' : '#BA55D3';
      ctx.font = 'bold 24px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(boss.phaseBannerText, 400, 195);
      ctx.textAlign = 'left';
    }

    ctx.fillStyle = 'black';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText(`Score: ${scoreRef.current}`, 20, 30);
    
    ctx.fillStyle = '#FFD700';
    const currencyName = config.collectible === 'coins' ? 'מטבעות' : config.collectible === 'diamonds' ? 'יהלומים' : 'ארנבים';
    ctx.fillText(`${currencyName}: ${currencyRef.current}`, 20, 60);
    
    ctx.fillStyle = '#FF0000';
    ctx.fillText(`${'❤️'.repeat(playerHeartsRef.current)}`, 20, 90);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`חיים: ${livesRef.current}`, 20, 120);
    
    if (playerRef.current.airplaneTimer > 0) {
      ctx.fillStyle = '#4169E1';
      ctx.fillText(`מטוס: ${Math.ceil(playerRef.current.airplaneTimer / 1000)}s`, 20, 150);
    }
    
    if (config.powerUp === 'fireball') {
      const timeSinceLastFireball = Date.now() - lastFireballRef.current;
      const yPos = playerRef.current.airplaneTimer > 0 ? 180 : 150;
      if (timeSinceLastFireball < 7000) {
        const remaining = Math.ceil((7000 - timeSinceLastFireball) / 1000);
        ctx.fillStyle = '#FF4500';
        ctx.fillText(`כדור אש: ${remaining}s`, 20, yPos);
      } else {
        ctx.fillStyle = '#00FF00';
        ctx.fillText(`כדור אש: מוכן! (F)`, 20, yPos);
      }
    }
    
    if (!isPlaying) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, 800, 400);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 30px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('המשחק מושהה', 400, 200);
      ctx.textAlign = 'left';
    }
  };

  const checkCollision = (r1: Rect, r2: Rect) => {
    return (
      r1.x < r2.x + r2.w &&
      r1.x + r1.w > r2.x &&
      r1.y < r2.y + r2.h &&
      r1.y + r1.h > r2.y
    );
  };

  const loop = () => {
    update();
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) draw(ctx);
    }
    requestRef.current = requestAnimationFrame(loop);
  };

  // Run initLevel ONCE on mount so the background draws correctly
  const hasInitRef = useRef(false);
  useEffect(() => {
    if (!hasInitRef.current) {
      initLevel(1, true);
      hasInitRef.current = true;
    }
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, config]);

  const startGame = () => {
    keysRef.current = {}; // Clear stuck keys
    statsRef.current.gamesPlayed += 1;
    initLevel(1, true);
    setIsPlaying(true);
    setShowConfig(false);
    setShowShop(false);
  };

  const handleAuthSuccess = (user: User, cloudSave: GameSaveData) => {
    setCurrentUser(user);
    applySaveData(cloudSave);
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    const local = saveService.getLocalSave();
    applySaveData(local);
  };

  // --- Mobile Touch Controls Logic ---
  const [aimJoyActive, setAimJoyActive] = useState(false);
  const aimJoyCenter = useRef({ x: 0, y: 0 });

  const handleMobileMoveStart = (dir: 'left' | 'right') => {
    keysRef.current[dir === 'left' ? 'a' : 'd'] = true;
  };
  const handleMobileMoveEnd = (dir: 'left' | 'right') => {
    keysRef.current[dir === 'left' ? 'a' : 'd'] = false;
  };

  const handleMobileJumpStart = () => {
    keysRef.current['w'] = true;
  };
  const handleMobileJumpEnd = () => {
    keysRef.current['w'] = false;
  };

  const handleAimTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPlayingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    aimJoyCenter.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    setAimJoyActive(true);
    updateAimFromTouch(e.touches[0]);
  };

  const handleAimTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!aimJoyActive || !isPlayingRef.current) return;
    updateAimFromTouch(e.touches[0]);
  };

  const handleAimTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    setAimJoyActive(false);
    isMouseDownRef.current = false;
  };

  const updateAimFromTouch = (touch: React.Touch) => {
    const dx = touch.clientX - aimJoyCenter.current.x;
    const dy = touch.clientY - aimJoyCenter.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const p = playerRef.current;
    if (dist > 10) {
      const aimDirX = dx / dist;
      const aimDirY = dy / dist;
      mouseRef.current = {
        x: p.x + p.w / 2 + aimDirX * 400,
        y: p.y + p.h / 2 + aimDirY * 400
      };
      p.facingRight = aimDirX >= 0;
      isMouseDownRef.current = true;
    } else {
      isMouseDownRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 flex flex-col items-center justify-center p-4 font-sans" dir="rtl">
      
      <div className="max-w-4xl w-full">
        <header className="mb-4 text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2">
            יוצר המשחקים - סגנון מריו
          </h1>
          <p className="text-zinc-400">
            תכנן את המשחק שלך! בחר את האפשרויות למטה ושחק.
          </p>
        </header>

        {/* User Account & Cloud Save Header Bar */}
        <UserMenu 
          user={currentUser}
          currency={currency}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode || 'login');
            setAuthModalOpen(true);
          }}
          onLogout={handleLogout}
        />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Game Canvas Container */}
            <div className="flex-1 bg-zinc-800 p-2 rounded-xl shadow-2xl border border-zinc-700 relative overflow-hidden">
              {/* Pause/Play Toggle Button */}
              {!showConfig && (
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  onMouseUp={(e) => e.currentTarget.blur()}
                  onKeyDown={(e) => e.preventDefault()}
                  className="absolute top-4 right-4 bg-zinc-900/60 hover:bg-zinc-900/90 text-white p-2 rounded-lg backdrop-blur-sm transition-all z-20 border border-white/10"
                  title={isPlaying ? "עצור" : "המשך"}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
              )}

              <canvas
                ref={canvasRef}
                width={800}
                height={400}
                className={`w-full h-auto bg-black rounded-lg block ${(isPlaying && config.platform !== 'phone') ? 'cursor-crosshair' : 'cursor-default'}`}
                style={{ aspectRatio: '800/400', touchAction: 'none' }}
                onMouseDown={config.platform !== 'phone' ? onCanvasMouseDown : undefined}
                onMouseMove={config.platform !== 'phone' ? onCanvasMouseMove : undefined}
              />

              {/* Mobile Touch Controls Overlay */}
              {isPlaying && config.platform === 'phone' && (
                <div className="absolute inset-0 pointer-events-none z-10 flex justify-between items-end p-4 pb-8" dir="ltr">
                  {/* Left Side: Movement D-Pad */}
                  <div className="flex gap-4 pointer-events-auto">
                    <button
                      className="w-16 h-16 bg-white/20 active:bg-white/40 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 text-white text-2xl select-none"
                      onTouchStart={(e) => { e.preventDefault(); handleMobileMoveStart('left'); }}
                      onTouchEnd={(e) => { e.preventDefault(); handleMobileMoveEnd('left'); }}
                    >
                      ←
                    </button>
                    <button
                      className="w-16 h-16 bg-white/20 active:bg-white/40 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 text-white text-2xl select-none"
                      onTouchStart={(e) => { e.preventDefault(); handleMobileMoveStart('right'); }}
                      onTouchEnd={(e) => { e.preventDefault(); handleMobileMoveEnd('right'); }}
                    >
                      →
                    </button>
                  </div>

                  {/* Right Side: Jump and Aim */}
                  <div className="flex gap-6 items-end pointer-events-auto">
                    <button
                      className="w-16 h-16 bg-blue-500/40 active:bg-blue-500/60 rounded-full flex items-center justify-center backdrop-blur-sm border border-blue-400/50 text-white font-bold select-none mb-8"
                      onTouchStart={(e) => { e.preventDefault(); handleMobileJumpStart(); }}
                      onTouchEnd={(e) => { e.preventDefault(); handleMobileJumpEnd(); }}
                    >
                      Jump
                    </button>
                    
                    {/* Aim Joystick Area */}
                    <div 
                      className="w-24 h-24 bg-red-500/20 rounded-full border-2 border-red-500/30 relative flex items-center justify-center"
                      onTouchStart={handleAimTouchStart}
                      onTouchMove={handleAimTouchMove}
                      onTouchEnd={handleAimTouchEnd}
                    >
                      <div className={`w-10 h-10 bg-red-500/50 rounded-full absolute transition-opacity ${aimJoyActive ? 'opacity-100' : 'opacity-50'}`} />
                      <div className="absolute -top-6 text-white/50 text-xs tracking-widest font-bold">AIM & FIRE</div>
                    </div>
                  </div>
                </div>
              )}

              {blackScreenMessage && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-white rounded-lg p-8">
                  <h2 className="text-4xl font-bold mb-6 text-center">{blackScreenMessage}</h2>
                  {isGameOver && (
                    <button 
                      onClick={() => {
                        setIsGameOver(false);
                        setBlackScreenMessage(null);
                        isPausedRef.current = false;
                        scoreRef.current = 0;
                        initLevel(1, true); // Reset gameplay progress and lives
                        saveService.saveNow(getCurrentSaveSnapshot()); // Save immediately after reset
                        setIsPlaying(true);
                      }}
                      className="mt-4 px-8 py-3 bg-red-600 hover:bg-red-500 rounded text-xl font-bold transition-colors"
                    >
                      התחל מחדש
                    </button>
                  )}
                </div>
              )}
            
            {!isPlaying && !showConfig && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button 
                  onClick={() => setIsPlaying(true)}
                  onMouseUp={(e) => e.currentTarget.blur()}
                  onKeyDown={(e) => e.preventDefault()}
                  className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-105"
                >
                  <Play size={32} />
                </button>
              </div>
            )}
          </div>

          {/* Configuration Panel */}
          {showConfig && !showShop && (
            <div className="w-full lg:w-80 bg-zinc-800 rounded-xl p-6 shadow-xl border border-zinc-700 flex flex-col gap-6">
              <div className="flex items-center gap-2 border-b border-zinc-700 pb-4">
                <Settings className="text-blue-400" />
                <h2 className="text-xl font-semibold">אפשרויות משחק</h2>
              </div>

              {/* Environment Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-300">
                  באיזה סביבה לשחק?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['day', 'water', 'tunnels'] as const).map(env => (
                    <button
                      key={env}
                      onClick={() => setConfig({...config, environment: env})}
                      className={`py-2 px-1 rounded-lg text-sm border transition-colors ${
                        (config.environment || 'day') === env 
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300' 
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      {env === 'day' ? '☀️ יום' : env === 'water' ? '🌊 מים' : '🕳️ מנהרות'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-300">
                  איך אתה משחק?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['computer', 'phone'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setConfig({...config, platform: p})}
                      className={`py-2 px-1 rounded-lg text-sm border transition-colors ${
                        (config.platform || 'computer') === p 
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300' 
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      {p === 'computer' ? '💻 מחשב' : '📱 טלפון'}
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  {(!config.platform || config.platform === 'computer') && (
                    <a 
                      href={windowsDownloadUrl}
                      className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-lg font-bold"
                    >
                      <Download size={24} />
                      <span>הורדה למחשב</span>
                    </a>
                  )}
                  
                  {config.platform === 'phone' && (
                    <button 
                      onClick={handleInstallClick}
                      className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-lg font-bold"
                    >
                      <Smartphone size={24} />
                      <span>להוריד לטלפון</span>
                    </button>
                  )}

                  {updateStatus?.status === 'downloaded' && (
                    <button 
                      onClick={() => (window as any).updateAPI?.applyUpdate()}
                      className="w-full mt-3 flex flex-col items-center justify-center gap-1 py-3 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors text-sm font-bold animate-pulse shadow-lg"
                    >
                      <span>עדכון חדש מוכן! לחץ להפעלה מחדש</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Question 1 */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-300">
                  1. מה לאסוף במשחק?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['coins', 'diamonds', 'rabbits'] as CollectibleType[]).map(c => (
                    <button
                      key={c}
                      onClick={() => setConfig({...config, collectible: c})}
                      className={`py-2 px-1 rounded-lg text-sm border transition-colors ${
                        config.collectible === c 
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300' 
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      {c === 'coins' ? 'מטבעות' : c === 'diamonds' ? 'יהלומים' : 'ארנבים'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2 */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-300">
                  2. אילו אויבים תרצה?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['slimes', 'zombies', 'rabbits', 'ghosts', 'skeletons', 'creepers'] as EnemyType[]).map(e => (
                    <button
                      key={e}
                      onClick={() => setConfig({...config, enemy: e})}
                      className={`py-2 px-1 rounded-lg text-sm border transition-colors ${
                        config.enemy === e 
                          ? 'bg-green-500/20 border-green-500 text-green-300' 
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      {e === 'slimes' ? 'סליים' : e === 'zombies' ? 'זומבים' : e === 'rabbits' ? 'ארנבים' : e === 'ghosts' ? 'רוחות' : e === 'skeletons' ? 'שלדים' : 'קריפרים'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 3 */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-300">
                  3. מה הכוח המיוחד של הדמות?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['doubleJump', 'dash', 'fireball'] as PowerUpType[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setConfig({...config, powerUp: p})}
                      className={`py-2 px-1 rounded-lg text-sm border transition-colors ${
                        config.powerUp === p 
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300' 
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      {p === 'doubleJump' ? 'קפיצה כפולה' : p === 'dash' ? 'ריצה מהירה' : 'כדור אש'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 4 */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-300">
                  4. מהירות הדובי (1-10)
                </label>
                <div className="flex gap-1 h-8">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const level = i + 1;
                    const isActive = level <= config.speed;
                    return (
                      <button
                        key={level}
                        onClick={() => setConfig({...config, speed: level})}
                        className={`flex-1 rounded-sm transition-colors ${
                          isActive ? 'bg-blue-500' : 'bg-zinc-700 hover:bg-zinc-600'
                        }`}
                        title={`מהירות ${level}`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>לאט</span>
                  <span>מהר</span>
                </div>
              </div>

              <div className="mt-auto pt-4 flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCurrency(currencyRef.current);
                      setShowShop(true);
                    }}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    חנות נשקים
                  </button>
                  <button
                    onClick={startGame}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Play size={16} />
                    שחק!
                  </button>
                </div>
                <button
                  onClick={async () => {
                    if (confirm('האם אתה בטוח שברצונך לאפס את כל ההתקדמות? (מטבעות ונשקים)')) {
                      saveService.clearLocalSave();
                      if (currentUser) {
                        await saveService.saveNow(createDefaultSave(), true);
                      }
                      window.location.reload();
                    }
                  }}
                  className="w-full bg-zinc-900 hover:bg-red-900/30 text-zinc-500 hover:text-red-400 text-[10px] py-1 rounded transition-colors"
                >
                  איפוס התקדמות
                </button>
              </div>
            </div>
          )}

          {/* Shop Panel */}
          {showConfig && showShop && (
            <div className="w-full lg:w-80 bg-zinc-800 rounded-xl p-6 shadow-xl border border-zinc-700 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-zinc-700 pb-4">
                <h2 className="text-xl font-semibold text-yellow-400">חנות נשקים</h2>
                <span className="bg-zinc-900 px-3 py-1 rounded-full text-sm font-mono text-yellow-400">
                  {currency} {config.collectible === 'coins' ? 'מטבעות' : config.collectible === 'diamonds' ? 'יהלומים' : 'ארנבים'}
                </span>
              </div>

              <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px] pr-2">
                {WEAPONS.map(w => {
                  const isOwned = unlockedWeapons.includes(w.id as WeaponType);
                  const isEquipped = config.weapon === w.id;
                  return (
                    <div key={w.id} className={`border p-3 rounded-lg flex flex-col gap-2 ${isEquipped ? 'border-green-500 bg-green-500/10' : 'border-zinc-700 bg-zinc-900'}`}>
                      <div>
                        <h3 className="font-bold text-zinc-100">{w.name}</h3>
                        <p className="text-xs text-zinc-400">{w.desc}</p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        {!isOwned && <span className="text-sm font-bold text-yellow-500">מחיר: {w.cost}</span>}
                        {isOwned && !isEquipped && <span className="text-sm text-zinc-500">בבעלותך</span>}
                        
                        {isEquipped ? (
                          <span className="text-green-400 text-sm font-bold px-3 py-1">מצויד</span>
                        ) : isOwned ? (
                          <button 
                            onClick={() => {
                              const newConfig = { ...config, weapon: w.id as WeaponType };
                              setConfig(newConfig);
                              saveService.saveNow({
                                ...getCurrentSaveSnapshot(),
                                equippedWeapon: w.id as WeaponType,
                                config: newConfig
                              });
                            }}
                            className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-3 py-1 rounded transition-colors"
                          >
                            צייד
                          </button>
                        ) : (
                          <button 
                            disabled={currency < w.cost}
                            onClick={() => {
                              if (currency >= w.cost) {
                                const newCurrency = currencyRef.current - w.cost;
                                currencyRef.current = newCurrency;
                                setCurrency(newCurrency);
                                const newWeapons = [...unlockedWeapons, w.id as WeaponType];
                                setUnlockedWeapons(newWeapons);
                                const newConfig = { ...config, weapon: w.id as WeaponType };
                                setConfig(newConfig);
                                saveService.saveNow({
                                  ...getCurrentSaveSnapshot(),
                                  currency: newCurrency,
                                  unlockedWeapons: newWeapons,
                                  equippedWeapon: w.id as WeaponType,
                                  config: newConfig
                                });
                              }
                            }}
                            className={`text-xs px-3 py-1 rounded font-bold transition-colors ${currency >= w.cost ? 'bg-yellow-500 hover:bg-yellow-400 text-black' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                          >
                            קנה
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => setShowShop(false)}
                className="mt-auto bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 px-4 rounded-lg transition-colors w-full"
              >
                חזור להגדרות
              </button>
            </div>
          )}

          {/* Controls Info when playing */}
          {!showConfig && (
            <div className="w-full lg:w-64 bg-zinc-800 rounded-xl p-6 shadow-xl border border-zinc-700 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-zinc-700 pb-2">
                <h3 className="font-bold text-lg">מקשים</h3>
                <SaveIndicator isLoggedIn={!!currentUser} />
              </div>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li><kbd className="bg-zinc-900 px-2 py-1 rounded border border-zinc-700">חצים / A D</kbd> - תזוזה</li>
                <li><kbd className="bg-zinc-900 px-2 py-1 rounded border border-zinc-700">רווח / חץ למעלה</kbd> - קפיצה</li>
                {config.powerUp === 'doubleJump' && (
                  <li><kbd className="bg-zinc-900 px-2 py-1 rounded border border-zinc-700">רווח באוויר</kbd> - קפיצה כפולה</li>
                )}
                {config.powerUp === 'dash' && (
                  <li><kbd className="bg-zinc-900 px-2 py-1 rounded border border-zinc-700">Shift</kbd> - ריצה מהירה</li>
                )}
                {config.powerUp === 'fireball' && (
                  <li><kbd className="bg-zinc-900 px-2 py-1 rounded border border-zinc-700">F</kbd> - כדור אש</li>
                )}
                <li><kbd className="bg-zinc-900 px-2 py-1 rounded border border-zinc-700">עכבר שמאלי (LMB)</kbd> - ירייה בנשק</li>
              </ul>
              
              <div className="mt-auto flex flex-col gap-2 pt-2 border-t border-zinc-700/60">
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setShowConfig(true);
                  }}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Settings size={16} />
                  חזור להגדרות
                </button>
                {currentUser && (
                  <button
                    onClick={handleLogout}
                    className="text-xs text-zinc-400 hover:text-red-400 py-1 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <LogOut size={12} />
                    התנתק מהחשבון
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        guestSave={!currentUser ? getCurrentSaveSnapshot() : null}
        initialMode={authModalMode}
      />

      {/* Conflict Resolution Modal */}
      {conflictData && (
        <ConflictModal 
          isOpen={!!conflictData}
          localSave={conflictData.localSave}
          cloudSave={conflictData.cloudSave}
          onSelectCloud={() => {
            applySaveData(conflictData.cloudSave);
            saveService.setLocalSave(conflictData.cloudSave);
            setConflictData(null);
          }}
          onSelectLocal={async () => {
            applySaveData(conflictData.localSave);
            await saveService.saveNow(conflictData.localSave, true);
            setConflictData(null);
          }}
        />
      )}

      {/* Final Boss Victory Celebration Modal */}
      <VictoryModal
        isOpen={victoryModalOpen}
        onClose={() => setVictoryModalOpen(false)}
        onPlayAgain={() => {
          setVictoryModalOpen(false);
          initLevel(1, true);
          setIsPlaying(true);
        }}
        onOpenShop={() => {
          setVictoryModalOpen(false);
          setIsPlaying(false);
          setShowShop(true);
        }}
        rewardCoins={victoryRewards.coins}
        rewardScore={victoryRewards.score}
        weaponUnlockedName={victoryRewards.unlockedWeapon}
      />

      {/* Auto Updater Overlay */}
      {updateStatus && updateStatus.status !== 'not-available' && (
        <div className="fixed bottom-4 right-4 bg-zinc-900 border border-zinc-700 p-4 rounded-xl shadow-2xl z-50 text-white max-w-sm">
          {updateStatus.status === 'checking' && <p>Checking for updates...</p>}
          {updateStatus.status === 'available' && <p>New update available: v{updateStatus.data}</p>}
          {updateStatus.status === 'downloading' && (
            <div>
              <p>Downloading update...</p>
              <div className="w-full bg-zinc-700 h-2 mt-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, updateStatus.data || 0))}%` }}
                />
              </div>
            </div>
          )}
          {updateStatus.status === 'downloaded' && (
            <div>
              <p>Update downloaded (v{updateStatus.data}).</p>
              <button 
                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-bold w-full"
                onClick={() => (window as any).updateAPI.applyUpdate()}
              >
                Restart and Apply
              </button>
            </div>
          )}
          {updateStatus.status === 'error' && <p className="text-red-400 text-sm">Update failed: {updateStatus.data}</p>}
        </div>
      )}
    </div>
  );
}
