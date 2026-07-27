// ============================================
// ArcDoc Enterprise - Authentication Service (Turso/SQLite)
// ============================================

import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db';
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/lib/auth';
import { sendTransactionalEmail } from '@/lib/email';
import type { User, JwtPayload, LoginResponse, UserProfile } from '@/types';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;

export async function loginUser(email: string, password: string, rememberMe = false): Promise<LoginResponse> {
  const users = await query<User>('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  const user = users.rows[0];
  if (!user) throw new Error('Email sau parolă incorecte.');
  if (!user.is_active) throw new Error('Contul este dezactivat. Contactați administratorul.');

  const valid = await verifyPassword(user.password_hash, password);
  if (!valid) {
    const attempts = await incrementLoginAttempts(user.id);
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      await query(`UPDATE users SET locked_until = datetime('now', '+${LOCKOUT_MINUTES} minutes') WHERE id = $1`, [user.id]);
      await sendTransactionalEmail('account-locked', {}, user.email, user.first_name);
      throw new Error(`Cont blocat temporar (${LOCKOUT_MINUTES} min) din cauza prea multor încercări eșuate.`);
    }
    throw new Error(`Email sau parolă incorecte. (${MAX_LOGIN_ATTEMPTS - attempts} încercări rămase)`);
  }

  await query('UPDATE users SET login_attempts = 0, locked_until = NULL, last_login_at = datetime(\'now\') WHERE id = $1', [user.id]);

  const roles = await getUserRoles(user.id);
  const permissions = await getUserPermissions(user.id);
  const payload: JwtPayload = { sub: user.id, email: user.email, type: user.user_type, roles, permissions };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const days = rememberMe ? '30' : '7';
  await query(
    `INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, datetime('now', '+${days} days'))`,
    [uuidv4(), user.id, refreshToken]
  );

  const profile: UserProfile = {
    id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name,
    userType: user.user_type, companyId: user.company_id, roles, permissions,
  };

  return { accessToken, refreshToken, expiresIn: 900, user: profile };
}

export async function refreshAccessToken(refreshTokenStr: string): Promise<LoginResponse> {
  const payload = verifyRefreshToken(refreshTokenStr);
  const tokens = await query<{ id: string }>(
    'SELECT id FROM refresh_tokens WHERE user_id = $1 AND token = $2 AND expires_at > datetime(\'now\') AND is_revoked = 0',
    [payload.sub, refreshTokenStr]
  );
  if (tokens.rowCount === 0) throw new Error('Refresh token invalid sau expirat.');

  await query('UPDATE refresh_tokens SET is_revoked = 1, revoked_at = datetime(\'now\') WHERE id = $1', [tokens.rows[0].id]);

  const users = await query<User>('SELECT * FROM users WHERE id = $1', [payload.sub]);
  const user = users.rows[0];
  if (!user || !user.is_active) throw new Error('Utilizatorul nu mai este activ.');

  const roles = await getUserRoles(user.id);
  const permissions = await getUserPermissions(user.id);
  const newPayload: JwtPayload = { sub: user.id, email: user.email, type: user.user_type, roles, permissions };

  const accessToken = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken(newPayload);

  await query(
    'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, datetime(\'now\', \'+7 days\'))',
    [uuidv4(), user.id, newRefreshToken]
  );

  return {
    accessToken, refreshToken: newRefreshToken, expiresIn: 900,
    user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, userType: user.user_type, companyId: user.company_id, roles, permissions },
  };
}

export async function logoutUser(userId: string, tokenStr?: string) {
  if (tokenStr) {
    await query('UPDATE refresh_tokens SET is_revoked = 1, revoked_at = datetime(\'now\') WHERE user_id = $1 AND token = $2', [userId, tokenStr]);
  } else {
    await query('UPDATE refresh_tokens SET is_revoked = 1, revoked_at = datetime(\'now\') WHERE user_id = $1', [userId]);
  }
}

export async function forgotPassword(email: string) {
  const users = await query<User>('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  if (users.rowCount === 0) return;
  const user = users.rows[0];
  const resetToken = uuidv4();
  await query('UPDATE users SET reset_token = $1, reset_token_expires = datetime(\'now\', \'+1 hour\') WHERE id = $2', [resetToken, user.id]);
  await sendTransactionalEmail('password-reset', { token: resetToken }, user.email, user.first_name);
}

export async function resetPassword(token: string, newPassword: string) {
  const users = await query<User>('SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > datetime(\'now\')', [token]);
  if (users.rowCount === 0) throw new Error('Token invalid sau expirat.');
  const hash = await hashPassword(newPassword);
  await query('UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, password_changed_at = datetime(\'now\'), login_attempts = 0, locked_until = NULL WHERE id = $2', [hash, users.rows[0].id]);
  await query('UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = $1', [users.rows[0].id]);
  await sendTransactionalEmail('password-changed', {}, users.rows[0].email, users.rows[0].first_name);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const users = await query<User>('SELECT * FROM users WHERE id = $1', [userId]);
  if (users.rowCount === 0) throw new Error('Utilizator negăsit.');
  const valid = await verifyPassword(users.rows[0].password_hash, currentPassword);
  if (!valid) throw new Error('Parola curentă este incorectă.');
  const hash = await hashPassword(newPassword);
  await query('UPDATE users SET password_hash = $1, password_changed_at = datetime(\'now\') WHERE id = $2', [hash, userId]);
  await query('UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = $1', [userId]);
  await sendTransactionalEmail('password-changed', {}, users.rows[0].email, users.rows[0].first_name);
}

export async function getMe(userId: string): Promise<UserProfile | null> {
  const users = await query<User>('SELECT * FROM users WHERE id = $1', [userId]);
  if (users.rowCount === 0) return null;
  const user = users.rows[0];
  const roles = await getUserRoles(user.id);
  const permissions = await getUserPermissions(user.id);
  return { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, userType: user.user_type, companyId: user.company_id, roles, permissions };
}

async function incrementLoginAttempts(userId: string): Promise<number> {
  await query('UPDATE users SET login_attempts = COALESCE(login_attempts, 0) + 1 WHERE id = $1', [userId]);
  const r = await query<{ login_attempts: number }>('SELECT login_attempts FROM users WHERE id = $1', [userId]);
  return r.rows[0]?.login_attempts || 0;
}

async function getUserRoles(userId: string): Promise<string[]> {
  const r = await query<{ slug: string }>('SELECT r.slug FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = $1', [userId]);
  return r.rows.map(r => r.slug);
}

async function getUserPermissions(userId: string): Promise<string[]> {
  const r = await query<{ slug: string }>(
    'SELECT DISTINCT p.slug FROM user_roles ur JOIN role_permissions rp ON rp.role_id = ur.role_id JOIN permissions p ON p.id = rp.permission_id WHERE ur.user_id = $1', [userId]
  );
  return r.rows.map(r => r.slug);
}

export default { loginUser, refreshAccessToken, logoutUser, forgotPassword, resetPassword, changePassword, getMe };