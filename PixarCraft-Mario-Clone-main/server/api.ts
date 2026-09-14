import express from 'express';
import { db } from './db';
import { 
  hashPassword, 
  verifyPassword, 
  createSession, 
  revokeSession, 
  requireAuth, 
  createPasswordResetCode, 
  resetPasswordWithCode,
  type AuthenticatedRequest 
} from './auth';

export const apiRouter = express.Router();
apiRouter.use(express.json());

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_WEAPONS = new Set([
  'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 'w10',
  'w11', 'w12', 'w13', 'w14', 'w15', 'w16', 'w17', 'w18', 'w19', 'w20'
]);
const VALID_COLLECTIBLES = new Set(['coins', 'diamonds', 'rabbits']);
const VALID_ENEMIES = new Set(['slimes', 'zombies', 'rabbits', 'ghosts', 'skeletons', 'creepers']);
const VALID_POWERUPS = new Set(['doubleJump', 'dash', 'fireball']);

export interface GameSavePayload {
  currency: number;
  unlockedWeapons: string[];
  equippedWeapon?: string;
  config?: {
    collectible: string;
    enemy: string;
    powerUp: string;
    speed: number;
    weapon: string;
  };
  stats?: {
    highScore?: number;
    maxLevelReached?: number;
    completedLevels?: number[];
    totalCoinsEarned?: number;
    enemiesDefeated?: number;
    gamesPlayed?: number;
    wins?: number;
  };
  saveVersion?: number;
  updatedAt?: string;
}

/**
 * Creates the initial default save data for a new player.
 */
export function createDefaultSaveData(): GameSavePayload {
  return {
    currency: 0,
    unlockedWeapons: ['w1'],
    equippedWeapon: 'w1',
    config: {
      collectible: 'coins',
      enemy: 'slimes',
      powerUp: 'doubleJump',
      speed: 5,
      weapon: 'w1'
    },
    stats: {
      highScore: 0,
      maxLevelReached: 1,
      completedLevels: [],
      totalCoinsEarned: 0,
      enemiesDefeated: 0,
      gamesPlayed: 0,
      wins: 0
    },
    saveVersion: 1,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Validates and sanitizes game save data received from the client.
 */
export function validateAndSanitizeSave(data: any): { valid: boolean; error?: string; cleanData?: GameSavePayload } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'נתוני שמירה לא תקינים' };
  }

  // Currency validation
  const rawCurrency = Number(data.currency);
  if (isNaN(rawCurrency) || rawCurrency < 0 || !Number.isInteger(rawCurrency)) {
    return { valid: false, error: 'ערך מטבעות לא תקין' };
  }
  const currency = Math.min(rawCurrency, 1_000_000); // Sanity cap

  // Unlocked weapons validation
  let unlockedWeapons: string[] = ['w1'];
  if (Array.isArray(data.unlockedWeapons)) {
    unlockedWeapons = Array.from(new Set(
      data.unlockedWeapons.filter((w: any) => typeof w === 'string' && VALID_WEAPONS.has(w))
    ));
    if (!unlockedWeapons.includes('w1')) {
      unlockedWeapons.unshift('w1');
    }
  }

  // Equipped weapon validation
  let equippedWeapon = typeof data.equippedWeapon === 'string' && VALID_WEAPONS.has(data.equippedWeapon) 
    ? data.equippedWeapon 
    : 'w1';
  if (!unlockedWeapons.includes(equippedWeapon)) {
    equippedWeapon = 'w1';
  }

  // Config validation
  const cleanConfig = {
    collectible: VALID_COLLECTIBLES.has(data.config?.collectible) ? data.config.collectible : 'coins',
    enemy: VALID_ENEMIES.has(data.config?.enemy) ? data.config.enemy : 'slimes',
    powerUp: VALID_POWERUPS.has(data.config?.powerUp) ? data.config.powerUp : 'doubleJump',
    speed: Math.max(1, Math.min(10, Number(data.config?.speed) || 5)),
    weapon: equippedWeapon
  };

  // Stats validation
  const stats = {
    highScore: Math.max(0, Math.floor(Number(data.stats?.highScore) || 0)),
    maxLevelReached: Math.max(1, Math.min(10, Math.floor(Number(data.stats?.maxLevelReached) || 1))),
    completedLevels: Array.isArray(data.stats?.completedLevels) 
      ? data.stats.completedLevels.filter((lvl: any) => Number.isInteger(lvl) && lvl > 0)
      : [],
    totalCoinsEarned: Math.max(0, Math.floor(Number(data.stats?.totalCoinsEarned) || 0)),
    enemiesDefeated: Math.max(0, Math.floor(Number(data.stats?.enemiesDefeated) || 0)),
    gamesPlayed: Math.max(0, Math.floor(Number(data.stats?.gamesPlayed) || 0)),
    wins: Math.max(0, Math.floor(Number(data.stats?.wins) || 0))
  };

  return {
    valid: true,
    cleanData: {
      currency,
      unlockedWeapons,
      equippedWeapon,
      config: cleanConfig,
      stats,
      saveVersion: 1,
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString()
    }
  };
}

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------

/**
 * POST /api/auth/register
 * Create account, optionally migrate guest save data, and return session token.
 */
apiRouter.post('/auth/register', (req, res) => {
  const { email, password, confirmPassword, guestSave } = req.body || {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    res.status(400).json({ error: 'כתובת אימייל לא תקינה.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: 'הסיסמה חייבת להכיל לפחות 6 תווים.' });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ error: 'הסיסמאות אינן תואמות.' });
    return;
  }

  // Check if email already exists
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existingUser) {
    res.status(409).json({ error: 'כתובת האימייל הזו כבר רשומה במערכת.' });
    return;
  }

  // Hash password securely
  const { salt, hash } = hashPassword(password);

  // Determine initial save data (migrate guest save if valid, else default)
  let initialSave: GameSavePayload = createDefaultSaveData();
  if (guestSave) {
    const validatedGuest = validateAndSanitizeSave(guestSave);
    if (validatedGuest.valid && validatedGuest.cleanData) {
      initialSave = validatedGuest.cleanData;
      initialSave.updatedAt = new Date().toISOString();
    }
  }

  const createUserTx = db.transaction(() => {
    const userResult = db.prepare(`
      INSERT INTO users (email, password_hash, salt) 
      VALUES (?, ?, ?)
    `).run(normalizedEmail, hash, salt);

    const userId = Number(userResult.lastInsertRowid);

    db.prepare(`
      INSERT INTO game_saves (user_id, save_version, progress_data, updated_at) 
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(userId, 1, JSON.stringify(initialSave));

    const token = createSession(userId);

    return { userId, token };
  });

  try {
    const { userId, token } = createUserTx();
    res.status(201).json({
      message: 'החשבון נוצר בהצלחה!',
      user: { id: userId, email: normalizedEmail },
      token,
      save: initialSave
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'אירעה שגיאה בעת יצירת החשבון. אנא נסה שוב.' });
  }
});

/**
 * POST /api/auth/login
 * Log in with email and password, returning session token and user's cloud save.
 */
apiRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    res.status(400).json({ error: 'נא להזין אימייל וסיסמה.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db.prepare('SELECT id, email, password_hash, salt FROM users WHERE email = ?')
    .get(normalizedEmail) as { id: number; email: string; password_hash: string; salt: string } | undefined;

  if (!user || !verifyPassword(String(password), user.salt, user.password_hash)) {
    res.status(401).json({ error: 'כתובת אימייל או סיסמה שגויים.' });
    return;
  }

  // Create session
  const token = createSession(user.id);

  // Retrieve user's save data
  let saveRow = db.prepare('SELECT progress_data FROM game_saves WHERE user_id = ?')
    .get(user.id) as { progress_data: string } | undefined;

  let saveData: GameSavePayload;
  if (!saveRow) {
    saveData = createDefaultSaveData();
    db.prepare('INSERT INTO game_saves (user_id, save_version, progress_data) VALUES (?, 1, ?)')
      .run(user.id, JSON.stringify(saveData));
  } else {
    try {
      saveData = JSON.parse(saveRow.progress_data);
    } catch {
      saveData = createDefaultSaveData();
    }
  }

  res.json({
    message: 'התחברת בהצלחה!',
    user: { id: user.id, email: user.email },
    token,
    save: saveData
  });
});

/**
 * POST /api/auth/logout
 * Revoke the current session token.
 */
apiRouter.post('/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers['x-auth-token']) {
    token = String(req.headers['x-auth-token']).trim();
  }

  if (token) {
    revokeSession(token);
  }

  res.json({ success: true, message: 'התנתקת בהצלחה.' });
});

/**
 * GET /api/auth/me
 * Validate current session and return user info + cloud save.
 */
apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const saveRow = db.prepare('SELECT progress_data, updated_at FROM game_saves WHERE user_id = ?')
    .get(user.id) as { progress_data: string; updated_at: string } | undefined;

  let saveData: GameSavePayload;
  if (saveRow) {
    try {
      saveData = JSON.parse(saveRow.progress_data);
      saveData.updatedAt = saveRow.updated_at;
    } catch {
      saveData = createDefaultSaveData();
    }
  } else {
    saveData = createDefaultSaveData();
  }

  res.json({
    user: { id: user.id, email: user.email },
    save: saveData
  });
});

/**
 * POST /api/auth/forgot-password
 * Send / return reset code.
 */
apiRouter.post('/auth/forgot-password', (req, res) => {
  const { email } = req.body || {};
  if (!email || !EMAIL_REGEX.test(String(email).trim())) {
    res.status(400).json({ error: 'נא להזין כתובת אימייל תקינה.' });
    return;
  }

  const code = createPasswordResetCode(String(email).trim());
  // In development / offline testing, provide the code in the response for convenience
  res.json({
    success: true,
    message: 'אם החשבון קיים, קוד איפוס סיסמה נוצר בהצלחה.',
    code: code || undefined
  });
});

/**
 * POST /api/auth/reset-password
 * Reset password using the 6-digit code.
 */
apiRouter.post('/auth/reset-password', (req, res) => {
  const { email, code, newPassword, confirmPassword } = req.body || {};

  if (!email || !code || !newPassword) {
    res.status(400).json({ error: 'חסרים פרטים נדרשים.' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'הסיסמה החדשה חייבת להכיל לפחות 6 תווים.' });
    return;
  }

  if (newPassword !== confirmPassword) {
    res.status(400).json({ error: 'הסיסמאות אינן תואמות.' });
    return;
  }

  const success = resetPasswordWithCode(String(email).trim(), String(code).trim(), newPassword);
  if (!success) {
    res.status(400).json({ error: 'קוד האיפוס אינו תקין או שפג תוקפו.' });
    return;
  }

  res.json({ success: true, message: 'הסיסמה שונתה בהצלחה! כעת תוכל להתחבר עם הסיסמה החדשה.' });
});

// ----------------------------------------------------
// CLOUD SAVE ENDPOINTS
// ----------------------------------------------------

/**
 * GET /api/save
 * Retrieve authenticated user's game save.
 */
apiRouter.get('/save', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const saveRow = db.prepare('SELECT progress_data, save_version, updated_at FROM game_saves WHERE user_id = ?')
    .get(user.id) as { progress_data: string; save_version: number; updated_at: string } | undefined;

  if (!saveRow) {
    const defaultSave = createDefaultSaveData();
    res.json({ save: defaultSave, saveVersion: 1, updatedAt: new Date().toISOString() });
    return;
  }

  try {
    const save = JSON.parse(saveRow.progress_data);
    save.updatedAt = saveRow.updated_at;
    res.json({ save, saveVersion: saveRow.save_version, updatedAt: saveRow.updated_at });
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בקריאת נתוני השמירה.' });
  }
});

/**
 * POST /api/save
 * Save/update progress for the authenticated user with server-side validation.
 */
apiRouter.post('/save', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { progressData, force } = req.body || {};

  const validation = validateAndSanitizeSave(progressData);
  if (!validation.valid || !validation.cleanData) {
    res.status(400).json({ error: validation.error || 'נתוני שמירה לא תקינים.' });
    return;
  }

  const sanitized = validation.cleanData;
  const now = new Date().toISOString();
  sanitized.updatedAt = now;

  // Check if save exists
  const existing = db.prepare('SELECT progress_data, updated_at FROM game_saves WHERE user_id = ?')
    .get(user.id) as { progress_data: string; updated_at: string } | undefined;

  if (existing && !force) {
    // Conflict check: if client sent an older timestamp than cloud, prevent blind overwrite
    try {
      const existingData = JSON.parse(existing.progress_data);
      const cloudTime = new Date(existing.updated_at).getTime();
      const clientTime = progressData.updatedAt ? new Date(progressData.updatedAt).getTime() : 0;
      
      // If client time is significantly older (> 5 seconds) than cloud time
      if (clientTime > 0 && cloudTime - clientTime > 5000) {
        res.status(409).json({
          error: 'נמצאה שמירה ענן חדשה יותר',
          cloudSave: existingData,
          cloudUpdatedAt: existing.updated_at
        });
        return;
      }
    } catch {
      // Continue if parsing existing fails
    }
  }

  // Update or insert
  db.prepare(`
    INSERT INTO game_saves (user_id, save_version, progress_data, updated_at) 
    VALUES (?, 1, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET 
      progress_data = excluded.progress_data,
      updated_at = CURRENT_TIMESTAMP
  `).run(user.id, JSON.stringify(sanitized));

  res.json({
    success: true,
    message: 'ההתקדמות נשמרה בענן בהצלחה!',
    save: sanitized,
    updatedAt: now
  });
});
