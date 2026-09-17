import type { GameSaveData, SaveStatusState, WeaponType, GameConfig } from '../types/save';
import { authService } from './authService';
import { db, auth } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

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
  private firestoreUnsubscribe: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.syncPendingOfflineSave();
      });
      window.addEventListener('offline', () => {
        this.setStatus('offline', 'מצב לא מקוון - ההתקדמות נשמרת מקומית');
      });
    }

    // Optional: Real-time listener to sync across multiple tabs
    // Note: To sync across separate devices in real-time, this needs to be called when auth state changes.
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

  public setLocalSave(save: GameSaveData) {
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(save));
    localStorage.setItem('currency', save.currency.toString());
    localStorage.setItem('unlockedWeapons', JSON.stringify(save.unlockedWeapons));
  }

  public clearLocalSave() {
    localStorage.removeItem(SAVE_STORAGE_KEY);
    localStorage.removeItem(PENDING_SYNC_KEY);
    localStorage.removeItem('currency');
    localStorage.removeItem('unlockedWeapons');
  }

  public queueDebouncedSave(save: GameSaveData) {
    this.setLocalSave(save);
    this.pendingSave = save;

    if (!auth.currentUser) {
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

  public async saveNow(save: GameSaveData, force: boolean = false): Promise<boolean> {
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.pendingSave = null;
    this.setLocalSave(save);

    if (!auth.currentUser) {
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
    const user = auth.currentUser;
    if (!user) {
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
      const docRef = doc(db, 'saves', user.uid);
      
      if (!force) {
        // Optional conflict resolution can go here by reading first, 
        // but for a single player game, overwriting is usually fine unless 
        // we strictly want to check timestamps.
      }

      await setDoc(docRef, {
        progressData: save,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      this.clearPendingOfflineSync();
      this.setStatus('saved', 'ההתקדמות נשמרה בענן!');
      return true;
    } catch (err) {
      console.error("Cloud Save Error:", err);
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

  public async syncPendingOfflineSave(): Promise<void> {
    const raw = localStorage.getItem(PENDING_SYNC_KEY);
    if (!raw || !auth.currentUser) return;

    try {
      const pending: GameSaveData = JSON.parse(raw);
      await this.saveNow(pending);
    } catch {
      this.clearPendingOfflineSync();
    }
  }

  public async fetchCloudSave(): Promise<GameSaveData | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const docRef = doc(db, 'saves', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().progressData) {
        const data = docSnap.data().progressData as GameSaveData;
        this.setLocalSave(data);
        return data;
      }
      return null;
    } catch (err) {
      console.error("Error fetching cloud save:", err);
      return null;
    }
  }
}

export const saveService = new SaveService();
