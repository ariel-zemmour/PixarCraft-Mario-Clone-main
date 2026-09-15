import type { User, GameSaveData } from '../types/save';

const TOKEN_KEY = 'mario_auth_token';

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

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me`, {
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
      // Network error or offline
      return { user: null, save: null };
    }
  },

  async signUp(
    email: string, 
    password: string, 
    confirmPassword: string, 
    guestSave?: GameSaveData | null
  ): Promise<{ user: User; save: GameSaveData }> {
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        confirmPassword,
        guestSave: guestSave || undefined
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'שגיאה ביצירת החשבון.');
    }

    this.setToken(data.token);
    return { user: data.user, save: data.save };
  },

  async login(email: string, password: string): Promise<{ user: User; save: GameSaveData }> {
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'שגיאה בהתחברות.');
    }

    this.setToken(data.token);
    return { user: data.user, save: data.save };
  },

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch {
        // Ignore logout request failure
      }
    }
    this.clearToken();
  },

  async requestPasswordReset(email: string): Promise<{ message: string; code?: string }> {
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'שגיאה בשליחת בקשת איפוס.');
    }

    return data;
  },

  async resetPassword(email: string, code: string, newPassword: string, confirmPassword: string): Promise<string> {
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword, confirmPassword })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'שגיאה באיפוס הסיסמה.');
    }

    return data.message || 'הסיסמה שונתה בהצלחה!';
  }
};
