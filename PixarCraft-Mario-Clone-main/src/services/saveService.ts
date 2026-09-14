import type { GameSaveData, SaveStatusState, WeaponType, GameConfig } from '../types/save';
import { authService } from './authService';

const SAVE_STORAGE_KEY = 'mario_cloud_save_local_cache';
const PENDING_SYNC_KEY = 'mario_pending_offline_sync';

export function createDefaultSave(): GameSaveData {
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
      wins: 0,
      bossDefeated: false,
      bossDefeatsCount: 0
    },
    saveVersion: 1,
    updatedAt: new Date().toISOString()
  };
}

class SaveService {
  private statusListeners: Array<(status: SaveStatusState, message?: string) => void> = [];
  private currentStatus: SaveStatusState = 'saved';
  private debounceTimer: number | null = null;
  private pendingSave: GameSaveData | null = null;
  private isSaving: boolean = false;

  constructor() {
    // Listen for online events to flush any pending offline saves
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.syncPendingOfflineSave();
      });
      window.addEventListener('offline', () => {
        this.setStatus('offline', 'מצב לא מקוון - ההתקדמות נשמרת מקומית');
      });
    }
  }

  public subscribeStatus(listener: (status: SaveStatusState, message?: string) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.currentStatus);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  private setStatus(status: SaveStatusState, message?: string) {
    this.currentStatus = status;
    this.statusListeners.forEach(l => l(status, message));
  }

  /**
   * Retrieves the local save data, falling back to legacy localStorage keys if needed.
   */
  public getLocalSave(): GameSaveData {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
          ...createDefaultSave(),
          ...parsed
        };
      } catch {
        // Continue to legacy fallback
      }
    }

    // Fallback to existing individual localStorage keys if present
    const legacyCurrency = localStorage.getItem('currency');
    const legacyWeapons = localStorage.getItem('unlockedWeapons');
    const defaultData = createDefaultSave();

    if (legacyCurrency !== null) {
      defaultData.currency = parseInt(legacyCurrency, 10) || 0;
    }
    if (legacyWeapons) {
      try {
        const weapons = JSON.parse(legacyWeapons);
        if (Array.isArray(weapons) && weapons.length > 0) {
          defaultData.unlockedWeapons = weapons as WeaponType[];
        }
      } catch {
        // Use default
      }
    }

    return defaultData;
  }

  /**
   * Updates local storage and legacy keys.
   */
  public setLocalSave(save: GameSaveData) {
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(save));
    // Keep legacy keys in sync for backward compatibility
    localStorage.setItem('currency', save.currency.toString());
    localStorage.setItem('unlockedWeapons', JSON.stringify(save.unlockedWeapons));
  }

  /**
   * Clears local save cache.
   */
  public clearLocalSave() {
    localStorage.removeItem(SAVE_STORAGE_KEY);
    localStorage.removeItem(PENDING_SYNC_KEY);
    localStorage.removeItem('currency');
    localStorage.removeItem('unlockedWeapons');
  }

  /**
   * Queues a debounced cloud save (1.5 seconds) for frequent events like picking up coins.
   */
  public queueDebouncedSave(save: GameSaveData) {
    this.setLocalSave(save);
    this.pendingSave = save;

    if (!authService.getToken()) {
      this.setStatus('saved');
      return;
    }

    if (!navigator.onLine) {
      this.markPendingOfflineSync(save);
      this.setStatus('offline', 'ההתקדמות נשמרת מקומית (לא מקוון)');
      return;
    }

    this.setStatus('saving', 'שומר התקדמות...');

    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(async () => {
      if (this.pendingSave) {
        await this.performCloudSave(this.pendingSave);
      }
    }, 1500);
  }

  /**
   * Immediately saves progress to the cloud for critical events (purchases, checkpoints, level complete).
   */
  public async saveNow(save: GameSaveData, force: boolean = false): Promise<boolean> {
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.pendingSave = null;
    this.setLocalSave(save);

    if (!authService.getToken()) {
      this.setStatus('saved');
      return true;
    }

    if (!navigator.onLine) {
      this.markPendingOfflineSync(save);
      this.setStatus('offline', 'ההתקדמות נשמרת מקומית (לא מקוון)');
      return false;
    }

    return await this.performCloudSave(save, force);
  }

  private async performCloudSave(save: GameSaveData, force: boolean = false): Promise<boolean> {
    const token = authService.getToken();
    if (!token) {
      this.setStatus('saved');
      return true;
    }

    if (this.isSaving) {
      this.pendingSave = save;
      return true;
    }

    this.isSaving = true;
    this.setStatus('saving', 'שומר בענן...');

    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ progressData: save, force })
      });

      if (!res.ok) {
        if (res.status === 409) {
          // Cloud has newer save
          this.setStatus('error', 'זוהתה שמירה חדשה יותר בענן');
          return false;
        }
        throw new Error('Server error');
      }

      const data = await res.json();
      if (data.save) {
        this.setLocalSave(data.save);
      }
      this.clearPendingOfflineSync();
      this.setStatus('saved', 'ההתקדמות נשמרה בענן!');
      return true;
    } catch {
      this.markPendingOfflineSync(save);
      this.setStatus('error', 'שגיאת רשת - ההתקדמות שמורה מקומית');
      return false;
    } finally {
      this.isSaving = false;
      if (this.pendingSave) {
        const next = this.pendingSave;
        this.pendingSave = null;
        this.performCloudSave(next, force);
      }
    }
  }

  private markPendingOfflineSync(save: GameSaveData) {
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(save));
  }

  private clearPendingOfflineSync() {
    localStorage.removeItem(PENDING_SYNC_KEY);
  }

  /**
   * Syncs any pending offline save when internet returns.
   */
  public async syncPendingOfflineSave(): Promise<void> {
    const raw = localStorage.getItem(PENDING_SYNC_KEY);
    if (!raw || !authService.getToken()) return;

    try {
      const pending: GameSaveData = JSON.parse(raw);
      await this.saveNow(pending);
    } catch {
      this.clearPendingOfflineSync();
    }
  }

  /**
   * Fetches the latest cloud save from the server.
   */
  public async fetchCloudSave(): Promise<GameSaveData | null> {
    const token = authService.getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/save', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.save;
    } catch {
      return null;
    }
  }
}

export const saveService = new SaveService();
