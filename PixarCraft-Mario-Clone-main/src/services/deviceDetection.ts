export type PlatformType = 'computer' | 'phone';
export type DetectedOS = 'windows' | 'mac' | 'linux' | 'android' | 'ios' | 'unknown';

/**
 * מזהה האם המכשיר הנוכחי הוא מכשיר נייד (סמארטפון/טאבלט)
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // 1. בדיקת מחרוזת ה-User Agent
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua);
  if (isMobileUA) {
    return true;
  }

  // 2. זיהוי iPadOS שבו ה-UA מזדהה כ-Macintosh אך כולל מסך מגע רב-נקודתי
  if (/Macintosh/i.test(ua) && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1) {
    return true;
  }

  // 3. זיהוי לפי אמצעי הצבעה עיקרי ומסך מגע
  if (typeof window.matchMedia === 'function') {
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const isSmallScreen = window.innerWidth <= 850;
    if (hasCoarsePointer && isSmallScreen) {
      return true;
    }
  }

  return false;
}

/**
 * מזהה באופן אוטומטי את פלטפורמת המשחק ('computer' מול 'phone')
 * ללא צורך בבחירה ידנית של המשתמש.
 */
export function detectDevicePlatform(): PlatformType {
  // אם האפליקציה רצה בתוך מעטפת Electron שולחנית, זהו מחשב
  if (typeof window !== 'undefined' && 'updateAPI' in window) {
    return 'computer';
  }

  return isMobileDevice() ? 'phone' : 'computer';
}

/**
 * מזהה את מערכת ההפעלה המדויקת של המשתמש לצורך הדגשת ההורדה המתאימה
 */
export function detectOS(): DetectedOS {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'unknown';
  }

  const ua = navigator.userAgent || '';
  if (/Windows/i.test(ua)) return 'windows';
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'mac';
  if (/Linux/i.test(ua)) return 'linux';
  return 'unknown';
}

/**
 * קישורי ההורדה הייעודיים והתואמים לכל פלטפורמה
 */
export const DOWNLOAD_URLS = {
  windows: "https://github.com/ariel-zemmour/PixarCraft-Mario-Clone-main/releases/latest/download/Mario-Clone-Setup.exe",
  mac: "https://github.com/ariel-zemmour/PixarCraft-Mario-Clone-main/releases/latest/download/Mario-Clone.dmg",
  mobile: "https://github.com/ariel-zemmour/PixarCraft-Mario-Clone-main/releases/latest/download/Mario-Clone.apk",
} as const;

