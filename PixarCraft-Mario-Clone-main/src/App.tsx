import React, { useState, useEffect, useRef } from 'react';
import { Settings, Play, RefreshCw, Pause } from 'lucide-react';

// --- Types ---
type CollectibleType = 'coins' | 'diamonds' | 'rabbits';
type EnemyType = 'slimes' | 'zombies' | 'rabbits' | 'ghosts' | 'skeletons' | 'creepers';
type PowerUpType = 'doubleJump' | 'dash' | 'fireball';
type WeaponType = 'w1' | 'w2' | 'w3' | 'w4' | 'w5' | 'w6' | 'w7' | 'w8' | 'w9' | 'w10' | 'w11' | 'w12' | 'w13' | 'w14' | 'w15' | 'w16' | 'w17' | 'w18' | 'w19' | 'w20';

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

interface GameConfig {
  collectible: CollectibleType;
  enemy: EnemyType;
  powerUp: PowerUpType;
  speed: number;
  weapon: WeaponType;
}

// --- Game Engine ---
const GRAVITY = 0.8;
const JUMP_FORCE = -14;
const MAX_FALL_SPEED = 18;

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

interface Bullet extends Rect {
  vx: number;
  vy: number;
  isFireball?: boolean;
}

interface Entity extends Rect {
  type: string;
  vx?: number;
  vy?: number;
  collected?: boolean;
  dead?: boolean;
  timer?: number;
  state?: string;
  health?: number;
}

export default function App() {
  const [config, setConfig] = useState<GameConfig>({
    collectible: 'coins',
    enemy: 'slimes',
    powerUp: 'doubleJump',
    speed: 5,
    weapon: 'w1',
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [showConfig, setShowConfig] = useState(true);
  const [showShop, setShowShop] = useState(false);
  const [unlockedWeapons, setUnlockedWeapons] = useState<WeaponType[]>(() => {
    const saved = localStorage.getItem('unlockedWeapons');
    return saved ? JSON.parse(saved) : ['w1'];
  });
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('currency');
    return saved ? parseInt(saved) : 0;
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Game State Refs (to avoid dependency issues in loop)
  const playerRef = useRef<Player>({ x: 50, y: 100, w: 30, h: 40, vx: 0, vy: 0, isGrounded: false, canDoubleJump: false, facingRight: true, airplaneTimer: 0 });
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const cameraRef = useRef({ x: 0, y: 0 });
  const bulletsRef = useRef<Bullet[]>([]);
  const enemyBulletsRef = useRef<Bullet[]>([]);
  const spikesRef = useRef<Rect[]>([]);
  const lastShotRef = useRef<number>(0);
  const lastFireballRef = useRef<number>(0);
  const currencyRef = useRef(0);
  
  // Sync currencyRef with initial state
  useEffect(() => {
    currencyRef.current = currency;
  }, []);

  // Save to localStorage whenever currency or unlockedWeapons changes
  useEffect(() => {
    localStorage.setItem('currency', currencyRef.current.toString());
    localStorage.setItem('unlockedWeapons', JSON.stringify(unlockedWeapons));
  }, [currency, unlockedWeapons]);

  const livesRef = useRef(3);
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

  // Initialize Level
  const initLevel = (level: number, resetLives = false) => {
    if (resetLives) {
      livesRef.current = 3;
      lastCheckpointRef.current = null;
    }
    levelRef.current = level;
    playerRef.current = { x: 50, y: 100, w: 30, h: 40, vx: 0, vy: 0, isGrounded: false, canDoubleJump: false, facingRight: true, airplaneTimer: 0 };
    cameraRef.current = { x: 0, y: 0 };
    scoreRef.current = 0;
    bulletsRef.current = [];
    enemyBulletsRef.current = [];
    
    platformsRef.current = [];
    spikesRef.current = [];
    collectiblesRef.current = [];
    blueCoinsRef.current = [];
    heartsRef.current = [];
    enemiesRef.current = [];
    checkpointsRef.current = [];
    
    // Seeded random for consistent map generation
    let seed = level * 1234567;
    const nextRandom = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
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
      
      if (nextRandom() > (isLevel2 ? 0.4 : 0.6)) {
        enemiesRef.current.push({ x: currentX + platW/2, y: platY - 30, w: 30, h: 30, type: 'enemy', vx: (nextRandom() > 0.5 ? 1 : -1) * (isLevel2 ? 2.5 : 1.5) });
      }
      
      if (nextRandom() > (isLevel2 ? 0.5 : 0.7) && platW > 200) {
        spikesRef.current.push({ x: currentX + platW/2 - 50, y: platY - 20, w: 100, h: 20 });
      }
      
      if (nextRandom() > 0.97) {
        blueCoinsRef.current.push({ x: currentX + platW/2, y: platY - 150, w: 20, h: 20, type: 'blueCoin' });
      }

      if (nextRandom() > 0.92) {
        heartsRef.current.push({ x: currentX + platW/2 + 50, y: platY - 100, w: 20, h: 20, type: 'heart' });
      }
      
      currentX += platW;
    }
    
    // Goal
    const lastPlatY = platformsRef.current[platformsRef.current.length - 1].y;
    goalRef.current = { x: currentX, y: lastPlatY - 100, w: 60, h: 100 };
    platformsRef.current.push({ x: currentX - 100, y: lastPlatY, w: 300, h: 50 }); // Safe platform for goal
  };

  const handleDeath = () => {
    keysRef.current = {}; // Clear stuck keys
    livesRef.current -= 1;
    
    // Sync currency to state and localStorage on death to ensure it's saved
    setCurrency(currencyRef.current);
    localStorage.setItem('currency', currencyRef.current.toString());

    if (livesRef.current <= 0) {
      setIsPlaying(false);
      setShowConfig(true);
      scoreRef.current = 0;
      initLevel(1, true);
    } else {
      // Respawn at last checkpoint or start
      if (lastCheckpointRef.current) {
        playerRef.current.x = lastCheckpointRef.current.x;
        playerRef.current.y = lastCheckpointRef.current.y;
      } else {
        playerRef.current.x = 50;
        playerRef.current.y = 100;
      }
      playerRef.current.vx = 0;
      playerRef.current.vy = 0;
      cameraRef.current.x = Math.max(0, playerRef.current.x - 200);
    }
  };

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      
      // Jump logic
      if ((e.code === 'Space' || e.code === 'ArrowUp') && isPlaying) {
        if (playerRef.current.airplaneTimer > 0) {
          // In airplane mode, space/up moves up continuously
        } else {
          if (playerRef.current.isGrounded) {
            playerRef.current.vy = JUMP_FORCE;
            playerRef.current.isGrounded = false;
            playerRef.current.canDoubleJump = config.powerUp === 'doubleJump';
          } else if (playerRef.current.canDoubleJump) {
            playerRef.current.vy = JUMP_FORCE;
            playerRef.current.canDoubleJump = false;
          }
        }
      }
      
      // Shoot logic
      if (e.code === 'KeyR' && isPlaying) {
        const now = Date.now();
        const weaponId = config.weapon;
        const weapon = WEAPONS.find(w => w.id === weaponId);
        
        if (weapon && now - lastShotRef.current > weapon.cooldown) {
          lastShotRef.current = now;
          const p = playerRef.current;
          const dir = p.facingRight ? 1 : -1;
          const startX = p.facingRight ? p.x + p.w : p.x - 10;
          const startY = p.y + 18;

          if (weapon.count > 1) {
            for (let i = 0; i < weapon.count; i++) {
              const offset = (i - (weapon.count - 1) / 2) * 5;
              bulletsRef.current.push({ 
                x: startX, 
                y: startY + offset, 
                w: 12, 
                h: 4, 
                vx: dir * weapon.speed, 
                vy: offset * 0.2 
              });
            }
          } else {
            bulletsRef.current.push({ 
              x: startX, 
              y: startY, 
              w: 12, 
              h: 4, 
              vx: dir * weapon.speed, 
              vy: 0 
            });
          }

          // Add muzzle flash and smoke for machine guns (fast cooldown)
          const isMachineGun = weapon.cooldown < 200;
          muzzleFlashesRef.current.push({
            x: startX,
            y: startY,
            timer: 60,
            size: isMachineGun ? 18 : 12,
            angle: (Math.random() - 0.5) * 0.5
          });

          if (isMachineGun) {
            for (let i = 0; i < 2; i++) {
              smokeParticlesRef.current.push({
                x: startX,
                y: startY,
                vx: -dir * (Math.random() * 2 + 1),
                vy: (Math.random() - 0.5) * 2,
                timer: 500,
                size: 5,
                opacity: 0.6
              });
            }
          }
        }
      }

      // Fireball logic
      if (e.code === 'KeyF' && isPlaying && config.powerUp === 'fireball') {
        const now = Date.now();
        if (now - lastFireballRef.current > 7000) {
          lastFireballRef.current = now;
          const p = playerRef.current;
          const dir = p.facingRight ? 1 : -1;
          bulletsRef.current.push({
            x: p.facingRight ? p.x + p.w : p.x - 20,
            y: p.y + 10,
            w: 20,
            h: 20,
            vx: dir * 12,
            vy: 0,
            isFireball: true
          });
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    const handleBlur = () => { keysRef.current = {}; }; // Clear keys when window loses focus
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isPlaying, config]);

  // Game Loop
  const update = () => {
    if (!isPlaying) return;
    
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
      p.vy += GRAVITY;
      if (p.vy > MAX_FALL_SPEED) p.vy = MAX_FALL_SPEED;
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
        handleDeath();
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
        handleDeath();
        enemyBulletsRef.current.splice(i, 1);
      }
    }
    
    // Enemies update
    enemiesRef.current.forEach(enemy => {
      if (enemy.dead) return;
      if (Math.abs(enemy.x - p.x) > 2000) return;

      if (config.enemy === 'ghosts') {
        // Ghosts fly towards player
        const dx = p.x - enemy.x;
        const dy = p.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 400) {
          enemy.vx = (dx / dist) * 1.5;
          enemy.vy = (dy / dist) * 1.5;
        } else {
          enemy.vx = 0;
          enemy.vy = 0;
        }
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
      } else if (config.enemy === 'skeletons') {
        // Skeletons patrol and shoot
        enemy.x += enemy.vx || 0;
        let hitWall = false;
        for (const plat of platformsRef.current) {
          if (checkCollision(enemy, plat)) {
            hitWall = true;
            break;
          }
        }
        if (hitWall) enemy.vx = -(enemy.vx || 0);

        // Shooting logic
        enemy.timer = (enemy.timer || 0) + 16;
        if (enemy.timer > 2000) {
          enemy.timer = 0;
          const dx = p.x - enemy.x;
          if (Math.abs(dx) < 500) {
            enemyBulletsRef.current.push({
              x: enemy.x + enemy.w / 2,
              y: enemy.y + 10,
              w: 15,
              h: 4,
              vx: dx > 0 ? 5 : -5,
              vy: 0
            });
          }
        }
      } else if (config.enemy === 'creepers') {
        // Creepers charge when player is close
        const dx = p.x - enemy.x;
        const dist = Math.abs(dx);
        if (dist < 250 && Math.abs(p.y - enemy.y) < 100) {
          enemy.vx = (dx > 0 ? 3.5 : -3.5);
          enemy.state = 'charging';
        } else {
          if (enemy.state === 'charging') {
            enemy.vx = (enemy.vx || 0) > 0 ? 1.5 : -1.5;
            enemy.state = 'patrol';
          }
          enemy.x += enemy.vx || 0;
          let hitWall = false;
          for (const plat of platformsRef.current) {
            if (checkCollision(enemy, plat)) {
              hitWall = true;
              break;
            }
          }
          if (hitWall) enemy.vx = -(enemy.vx || 0);
        }
        if (enemy.state === 'charging') {
          enemy.x += enemy.vx || 0;
        }
      } else {
        // Simple patrol for others
        enemy.x += enemy.vx || 0;
        let hitWall = false;
        for (const plat of platformsRef.current) {
          if (checkCollision(enemy, plat)) {
            hitWall = true;
            break;
          }
        }
        if (hitWall) enemy.vx = -(enemy.vx || 0);
      }
      
      // Player collision
      if (checkCollision(p, enemy)) {
        if (p.vy > 0 && p.y + p.h < enemy.y + 15 && config.enemy !== 'ghosts') {
          // Stomp
          enemy.dead = true;
          p.vy = JUMP_FORCE * 0.8;
          scoreRef.current += 100;
        } else {
          // Player dies
          handleDeath();
        }
      }
    });
    
    // Collectibles update
    collectiblesRef.current.forEach(c => {
      if (c.collected) return;
      if (Math.abs(c.x - p.x) > 1500) return;
      if (checkCollision(p, c)) {
        c.collected = true;
        scoreRef.current += 10;
        currencyRef.current += 1;
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
          // Visual feedback could be added here
        }
      }
    });
    
    // Goal collision
    if (checkCollision(p, goalRef.current)) {
      keysRef.current = {}; // Clear stuck keys
      
      // Sync currency on level completion
      setCurrency(currencyRef.current);
      localStorage.setItem('currency', currencyRef.current.toString());

      if (levelRef.current === 1) {
        initLevel(2, false);
      } else {
        setIsPlaying(false);
        setShowConfig(true);
        initLevel(1, true);
        alert("כל הכבוד! סיימת את המשחק!");
      }
    }
    
    // Camera follow
    cameraRef.current.x = p.x - 400 + p.w / 2;
    if (cameraRef.current.x < 0) cameraRef.current.x = 0;
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    // Clear & Background
    if (levelRef.current === 1) {
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
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(b.x, b.y, b.w, b.h);
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
      if (config.enemy === 'slimes') {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.fillRect(e.x, e.y, e.w, e.h);
        // Eyes
        ctx.fillStyle = 'black';
        ctx.fillRect(e.x + 5, e.y + 5, 5, 5);
        ctx.fillRect(e.x + 20, e.y + 5, 5, 5);
      } else if (config.enemy === 'zombies') {
        // Minecraft Zombie
        ctx.fillStyle = '#00A86B'; // Zombie green
        ctx.fillRect(e.x + 5, e.y, e.w - 10, 15);
        ctx.fillStyle = 'black';
        ctx.fillRect(e.x + 8, e.y + 5, 4, 4);
        ctx.fillRect(e.x + 18, e.y + 5, 4, 4);
        ctx.fillStyle = '#00CCCC'; // Cyan shirt
        ctx.fillRect(e.x, e.y + 15, e.w, 10);
        ctx.fillStyle = '#3C44AA'; // Blue pants
        ctx.fillRect(e.x + 2, e.y + 25, e.w - 4, 5);
      } else if (config.enemy === 'rabbits') {
        // Evil Rabbits
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(e.x + e.w/2, e.y + e.h - 10, e.w/2, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(e.x + e.w/2, e.y + e.h - 15, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(e.x + 5, e.y, 4, 15);
        ctx.fillRect(e.x + e.w - 9, e.y, 4, 15);
        ctx.fillStyle = 'red';
        ctx.fillRect(e.x + 8, e.y + 18, 3, 3);
        ctx.fillRect(e.x + 19, e.y + 18, 3, 3);
      } else if (config.enemy === 'ghosts') {
        // Ghosts
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
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
      } else if (config.enemy === 'skeletons') {
        // Skeletons
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(e.x + 5, e.y, e.w - 10, 15); // Head
        ctx.fillRect(e.x + 10, e.y + 15, 10, 20); // Body
        ctx.fillStyle = 'black';
        ctx.fillRect(e.x + 8, e.y + 5, 4, 4);
        ctx.fillRect(e.x + 18, e.y + 5, 4, 4);
        // Bow
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x + (e.vx! > 0 ? e.w : 0), e.y + 15, 10, -Math.PI/2, Math.PI/2);
        ctx.stroke();
      } else if (config.enemy === 'creepers') {
        // Creepers
        ctx.fillStyle = e.state === 'charging' ? '#FF0000' : '#00FF00';
        ctx.fillRect(e.x + 5, e.y, e.w - 10, 15); // Head
        ctx.fillRect(e.x + 8, e.y + 15, 14, 20); // Body
        ctx.fillRect(e.x, e.y + 30, 10, 10); // Left foot
        ctx.fillRect(e.x + 20, e.y + 30, 10, 10); // Right foot
        ctx.fillStyle = 'black';
        ctx.fillRect(e.x + 8, e.y + 5, 4, 4);
        ctx.fillRect(e.x + 18, e.y + 5, 4, 4);
        ctx.fillRect(e.x + 12, e.y + 10, 6, 5); // Mouth
      }
    });

    // Draw Enemy Bullets
    enemyBulletsRef.current.forEach(b => {
      ctx.fillStyle = config.enemy === 'skeletons' ? '#A0A0A0' : '#FF0000';
      ctx.fillRect(b.x, b.y, b.w, b.h);
    });
    
    // Draw Player (Pixar style Bear or Airplane)
    const p = playerRef.current;
    
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
    
    // Draw Gun based on equipped weapon
    const currentWeapon = WEAPONS.find(w => w.id === config.weapon);
    if (currentWeapon) {
      ctx.save();
      ctx.fillStyle = currentWeapon.color;
      
      const gunX = p.facingRight ? p.x + p.w - 5 : p.x + 5;
      const gunY = p.y + 20;
      
      ctx.translate(gunX, gunY);
      if (!p.facingRight) ctx.scale(-1, 1);
      
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

    // Draw Goal
    ctx.fillStyle = levelRef.current === 1 ? '#00FF00' : '#FF00FF';
    ctx.fillRect(goalRef.current.x, goalRef.current.y, goalRef.current.w, goalRef.current.h);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('סיום!', goalRef.current.x + 10, goalRef.current.y + 50);

    ctx.restore();
    
    // UI Overlay
    ctx.fillStyle = 'black';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText(`Score: ${scoreRef.current}`, 20, 30);
    
    ctx.fillStyle = '#FFD700';
    const currencyName = config.collectible === 'coins' ? 'מטבעות' : config.collectible === 'diamonds' ? 'יהלומים' : 'ארנבים';
    ctx.fillText(`${currencyName}: ${currencyRef.current}`, 20, 60);
    
    ctx.fillStyle = '#FF0000';
    ctx.fillText(`חיים: ${'❤️'.repeat(livesRef.current)}`, 20, 90);
    
    if (playerRef.current.airplaneTimer > 0) {
      ctx.fillStyle = '#4169E1';
      ctx.fillText(`מטוס: ${Math.ceil(playerRef.current.airplaneTimer / 1000)}s`, 20, 120);
    }
    
    if (config.powerUp === 'fireball') {
      const timeSinceLastFireball = Date.now() - lastFireballRef.current;
      const yPos = playerRef.current.airplaneTimer > 0 ? 150 : 120;
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

  useEffect(() => {
    initLevel(1, true);
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, config]);

  const startGame = () => {
    keysRef.current = {}; // Clear stuck keys
    initLevel(1, true);
    setIsPlaying(true);
    setShowConfig(false);
    setShowShop(false);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 flex flex-col items-center justify-center p-4 font-sans" dir="rtl">
      
      <div className="max-w-4xl w-full">
        <header className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2">
            יוצר המשחקים - סגנון מריו
          </h1>
          <p className="text-zinc-400">
            תכנן את המשחק שלך! בחר את האפשרויות למטה ושחק.
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Game Canvas Container */}
            <div className="flex-1 bg-zinc-800 p-2 rounded-xl shadow-2xl border border-zinc-700 relative overflow-hidden">
              {/* Pause/Play Toggle Button */}
              {!showConfig && (
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
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
                className="w-full h-auto bg-black rounded-lg block"
                style={{ aspectRatio: '800/400' }}
              />
            
            {!isPlaying && !showConfig && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button 
                  onClick={() => setIsPlaying(true)}
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
                  onClick={() => {
                    if (confirm('האם אתה בטוח שברצונך לאפס את כל ההתקדמות? (מטבעות ונשקים)')) {
                      localStorage.clear();
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
                            onClick={() => setConfig({...config, weapon: w.id as WeaponType})}
                            className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-3 py-1 rounded transition-colors"
                          >
                            צייד
                          </button>
                        ) : (
                          <button 
                            disabled={currency < w.cost}
                            onClick={() => {
                              if (currency >= w.cost) {
                                currencyRef.current -= w.cost;
                                setCurrency(currencyRef.current);
                                setUnlockedWeapons([...unlockedWeapons, w.id as WeaponType]);
                                setConfig({...config, weapon: w.id as WeaponType});
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
              <h3 className="font-bold text-lg mb-2 border-b border-zinc-700 pb-2">מקשים</h3>
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
                <li><kbd className="bg-zinc-900 px-2 py-1 rounded border border-zinc-700">R</kbd> - ירייה באקדח</li>
              </ul>
              
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setShowConfig(true);
                }}
                className="mt-auto bg-zinc-700 hover:bg-zinc-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Settings size={16} />
                חזור להגדרות
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
