import crypto from 'crypto';
import { db } from './db';
import type { Request, Response, NextFunction } from 'express';

const SESSION_EXPIRY_DAYS = 30;

export interface AuthenticatedUser {
  id: number;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Hashes a password using crypto.scrypt with a unique cryptographically secure salt.
 */
export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

/**
 * Verifies that a plain text password matches the stored salt and hash.
 */
export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Creates a persistent session token for a given user.
 */
export function createSession(userId: number): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const stmt = db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)');
  stmt.run(token, userId, expiresAt);

  return token;
}

/**
 * Revokes a session token.
 */
export function revokeSession(token: string): void {
  const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
  stmt.run(token);
}

/**
 * Retrieves the user associated with a valid, non-expired session token.
 */
export function getUserBySession(token: string): AuthenticatedUser | null {
  if (!token) return null;

  const stmt = db.prepare(`
    SELECT users.id, users.email, sessions.expires_at 
    FROM sessions 
    JOIN users ON sessions.user_id = users.id 
    WHERE sessions.token = ?
  `);
  
  const row = stmt.get(token) as { id: number; email: string; expires_at: string } | undefined;
  if (!row) return null;

  if (new Date(row.expires_at).getTime() < Date.now()) {
    revokeSession(token);
    return null;
  }

  return { id: row.id, email: row.email };
}

/**
 * Express middleware to authenticate the user from Authorization header or cookie/query.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers['x-auth-token']) {
    token = String(req.headers['x-auth-token']).trim();
  }

  const anyRes = res as any;
  if (!anyRes.status) {
    anyRes.status = function(code: number) { this.statusCode = code; return this; };
  }
  if (!anyRes.json) {
    anyRes.json = function(data: any) { this.setHeader('Content-Type', 'application/json'); this.end(JSON.stringify(data)); return this; };
  }

  if (!token) {
    anyRes.status(401).json({ error: 'לא מחובר. אנא התחבר כדי להמשיך.' });
    return;
  }

  const user = getUserBySession(token);
  if (!user) {
    anyRes.status(401).json({ error: 'פג תוקף ההתחברות. אנא התחבר מחדש.' });
    return;
  }

  req.user = user;
  next();
}

/**
 * Generates a 6-digit password reset code expiring in 15 minutes.
 */
export function createPasswordResetCode(email: string): string | null {
  const userStmt = db.prepare('SELECT id FROM users WHERE email = ?');
  const user = userStmt.get(email.toLowerCase().trim()) as { id: number } | undefined;
  if (!user) return null;

  // Generate 6 digit numeric code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Invalidate previous codes
  db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(user.id);

  db.prepare('INSERT INTO password_resets (user_id, code, expires_at, used) VALUES (?, ?, ?, 0)')
    .run(user.id, code, expiresAt);

  return code;
}

/**
 * Resets a password using a valid reset code.
 */
export function resetPasswordWithCode(email: string, code: string, newPassword: string): boolean {
  const userStmt = db.prepare('SELECT id FROM users WHERE email = ?');
  const user = userStmt.get(email.toLowerCase().trim()) as { id: number } | undefined;
  if (!user) return false;

  const resetStmt = db.prepare(`
    SELECT id, expires_at, used 
    FROM password_resets 
    WHERE user_id = ? AND code = ? AND used = 0
  `);
  const resetRow = resetStmt.get(user.id, code.trim()) as { id: number; expires_at: string; used: number } | undefined;
  if (!resetRow) return false;

  if (new Date(resetRow.expires_at).getTime() < Date.now()) {
    return false;
  }

  const { salt, hash } = hashPassword(newPassword);

  const updateUser = db.transaction(() => {
    db.prepare('UPDATE users SET password_hash = ?, salt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(hash, salt, user.id);
    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(resetRow.id);
    // Invalidate existing sessions for security
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
  });

  updateUser();
  return true;
}
