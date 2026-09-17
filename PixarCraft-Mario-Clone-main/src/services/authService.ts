import type { User, GameSaveData } from '../types/save';
import { createDefaultSave } from './saveService';
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const TOKEN_KEY = 'mario_auth_token';

// Keep track of the current auth state
let currentFirebaseUser: any = null;

// Listen to auth changes
onAuthStateChanged(auth, (user) => {
  currentFirebaseUser = user;
});

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) || (currentFirebaseUser ? 'firebase-auth' : null);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async getCurrentUser(): Promise<{ user: User | null; save: GameSaveData | null }> {
    // Wait for auth to initialize if we don't know the state yet, but don't block forever
    if (auth.currentUser === null && this.getToken() === 'firebase-auth') {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const firebaseUser = auth.currentUser || currentFirebaseUser;
    
    if (!firebaseUser) {
      this.clearToken();
      return { user: null, save: null };
    }

    try {
      // Fetch user's save from Firestore
      const docRef = doc(db, 'saves', firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      
      let save = null;
      if (docSnap.exists()) {
        save = docSnap.data().progressData as GameSaveData;
      }
      
      return { 
        user: { id: firebaseUser.uid as unknown as number, email: firebaseUser.email || '' }, 
        save 
      };
    } catch (err) {
      console.error("Error fetching user data from Firestore:", err);
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

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.toLowerCase(), password);
      const firebaseUser = userCredential.user;
      
      const initialSave = guestSave || createDefaultSave();
      
      // Save initial data to Firestore
      await setDoc(doc(db, 'saves', firebaseUser.uid), {
        progressData: initialSave,
        updatedAt: new Date().toISOString()
      });

      this.setToken('firebase-auth');
      return { 
        user: { id: firebaseUser.uid as unknown as number, email: firebaseUser.email || '' }, 
        save: initialSave 
      };
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('כתובת האימייל הזו כבר רשומה במערכת.');
      }
      throw new Error('שגיאה ביצירת החשבון.');
    }
  },

  async login(email: string, password: string): Promise<{ user: User; save: GameSaveData }> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
      const firebaseUser = userCredential.user;
      
      this.setToken('firebase-auth');
      
      // Fetch save
      const docRef = doc(db, 'saves', firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      
      let save = createDefaultSave();
      if (docSnap.exists()) {
        save = docSnap.data().progressData as GameSaveData;
      } else {
        // Create document if it doesn't exist for some reason
        await setDoc(docRef, {
          progressData: save,
          updatedAt: new Date().toISOString()
        });
      }

      return { 
        user: { id: firebaseUser.uid as unknown as number, email: firebaseUser.email || '' }, 
        save 
      };
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        throw new Error('אימייל או סיסמה שגויים. (אם נרשמת בעבר, עליך להירשם מחדש כי עברנו לשרתי ענן חדשים!)');
      }
      throw new Error('שגיאה בהתחברות: ' + error.message);
    }
  },

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
    this.clearToken();
  },

  async requestPasswordReset(email: string): Promise<{ message: string; code?: string }> {
    try {
      await sendPasswordResetEmail(auth, email.toLowerCase());
      return { success: true, message: 'מייל איפוס סיסמה נשלח בהצלחה לכתובת שהזנת.' } as any;
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/missing-email') {
        throw new Error('חשבון זה לא קיים במערכת החדשה. כיוון שעברנו לשרתי Firebase, עליך להירשם מחדש!');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('כתובת אימייל לא תקינה.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('שגיאה ב-Firebase: לא הפעלת כניסת Email/Password בלשונית Authentication!');
      }
      throw new Error('שגיאה בשליחת המייל: ' + error.message);
    }
  },

  // Note: With Firebase, users click a link in their email to reset the password, they don't enter a code on the site.
  // The UI currently expects a code. We will throw an error telling them to check their email link instead.
  async resetPassword(email: string, code: string, newPassword: string, confirmPassword: string): Promise<string> {
    throw new Error('נא ללחוץ על הקישור המאובטח שנשלח לך במייל כדי לאפס את הסיסמה.');
  }
};
