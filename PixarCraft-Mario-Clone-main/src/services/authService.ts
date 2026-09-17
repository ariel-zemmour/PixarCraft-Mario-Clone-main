import type { User, GameSaveData } from '../types/save';
import { createDefaultSave } from './saveService';

const TOKEN_KEY = 'mario_auth_token';
const MOCK_DB_KEY = 'mario_mock_db'; // Stores { users: [], sessions: {} }

// --- MOCK BACKEND HELPERS ---
const getMockDb = () => {
  try {
    const db = localStorage.getItem(MOCK_DB_KEY);
    return db ? JSON.parse(db) : { users: [], sessions: {} };
  } catch {
    return { users: [], sessions: {} };
  }
};

const saveMockDb = (db: any) => {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db));
};

const generateMockToken = () => Math.random().toString(36).substring(2) + Date.now().toString(36);
const generateMockCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// ---------------------------

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async getCurrentUser(): Promise<{ user: User | null; save: GameSaveData | null }> {
    const token = this.getToken();
    if (!token) return { user: null, save: null };

    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      // Mock Backend
      const db = getMockDb();
      const session = db.sessions[token];
      if (!session) {
        this.clearToken();
        return { user: null, save: null };
      }
      const user = db.users.find((u: any) => u.id === session.userId);
      if (!user) return { user: null, save: null };
      return { user: { id: user.id, email: user.email }, save: user.save };
    }

    try {
      const res = await fetch(`${apiUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status === 401) {
          this.clearToken();
        }
        return { user: null, save: null };
      }

      const data = await res.json();
      return { user: data.user, save: data.save };
    } catch {
      return { user: null, save: null };
    }
  },

  async signUp(
    email: string, 
    password: string, 
    confirmPassword: string, 
    guestSave?: GameSaveData | null
  ): Promise<{ user: User; save: GameSaveData }> {
    if (password !== confirmPassword) throw new Error('הסיסמאות אינן תואמות.');
    if (password.length < 6) throw new Error('הסיסמה חייבת להכיל לפחות 6 תווים.');

    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      // Mock Backend
      const db = getMockDb();
      if (db.users.find((u: any) => u.email === email.toLowerCase())) {
        throw new Error('כתובת האימייל הזו כבר רשומה במערכת.');
      }
      
      const newUser = {
        id: Date.now(),
        email: email.toLowerCase(),
        password, // Mock storage
        save: guestSave || createDefaultSave(),
        resetCode: null,
      };
      db.users.push(newUser);
      
      const token = generateMockToken();
      db.sessions[token] = { userId: newUser.id };
      saveMockDb(db);
      
      this.setToken(token);
      return { user: { id: newUser.id, email: newUser.email }, save: newUser.save };
    }

    const res = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, confirmPassword, guestSave: guestSave || undefined })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'שגיאה ביצירת החשבון.');

    this.setToken(data.token);
    return { user: data.user, save: data.save };
  },

  async login(email: string, password: string): Promise<{ user: User; save: GameSaveData }> {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      // Mock Backend
      const db = getMockDb();
      const user = db.users.find((u: any) => u.email === email.toLowerCase() && u.password === password);
      if (!user) throw new Error('אימייל או סיסמה שגויים.');
      
      const token = generateMockToken();
      db.sessions[token] = { userId: user.id };
      saveMockDb(db);
      
      this.setToken(token);
      return { user: { id: user.id, email: user.email }, save: user.save };
    }

    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'שגיאה בהתחברות.');

    this.setToken(data.token);
    return { user: data.user, save: data.save };
  },

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        const db = getMockDb();
        delete db.sessions[token];
        saveMockDb(db);
      } else {
        try {
          await fetch(`${apiUrl}/api/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } catch {}
      }
    }
    this.clearToken();
  },

  async requestPasswordReset(email: string): Promise<{ message: string; code?: string }> {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      // Mock Backend
      const db = getMockDb();
      const user = db.users.find((u: any) => u.email === email.toLowerCase());
      if (user) {
        const code = generateMockCode();
        user.resetCode = code;
        saveMockDb(db);
        // Simulate email delivery by showing an alert to the user so they know what code to type
        setTimeout(() => {
          alert(`📧 הדמיית אימייל נשלחה!\n\nהודעה חדשה בתיבת המייל של ${user.email}:\n"קוד איפוס הסיסמה שלך למשחק אריאל הוא: ${code}"`);
        }, 500);
      }
      return { success: true, message: 'אם החשבון קיים, קוד איפוס סיסמה נוצר בהצלחה וישלח למייל.' } as any;
    }

    const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'שגיאה בשליחת בקשת איפוס.');
    
    // In actual dev backend, code might be returned for convenience
    if (data.code) {
      setTimeout(() => {
        alert(`📧 הודעת מערכת (פיתוח):\nקוד האיפוס שנוצר הוא: ${data.code}`);
      }, 500);
    }
    return data;
  },

  async resetPassword(email: string, code: string, newPassword: string, confirmPassword: string): Promise<string> {
    if (newPassword !== confirmPassword) throw new Error('הסיסמאות אינן תואמות.');
    if (newPassword.length < 6) throw new Error('הסיסמה חייבת להכיל לפחות 6 תווים.');

    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      // Mock Backend
      const db = getMockDb();
      const user = db.users.find((u: any) => u.email === email.toLowerCase());
      if (!user) throw new Error('שגיאה באיפוס הסיסמה.');
      
      if (user.resetCode !== code.trim()) {
        throw new Error('קוד האיפוס שגוי או שפג תוקפו.');
      }
      
      user.password = newPassword;
      user.resetCode = null;
      // Invalidate all sessions
      Object.keys(db.sessions).forEach(k => {
        if (db.sessions[k].userId === user.id) delete db.sessions[k];
      });
      saveMockDb(db);
      
      return 'הסיסמה שונתה בהצלחה!';
    }

    const res = await fetch(`${apiUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword, confirmPassword })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'שגיאה באיפוס הסיסמה.');

    return data.message || 'הסיסמה שונתה בהצלחה!';
  }
};
