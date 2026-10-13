import bcrypt from 'bcryptjs';
import { query } from './db';
import { cookies } from 'next/headers';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  role: string | null;
  created_at: string;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const users = await query<UserRecord>(
    'SELECT id, email, password_hash, name, role, created_at FROM public."user" WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [email.trim()]
  );
  return users.length > 0 ? users[0] : null;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Erreur de comparaison du mot de passe:', error);
    return false;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role?: string;
}): Promise<UserRecord> {
  const hash = await hashPassword(data.password);
  const id = 'USR-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const role = (data.role || 'USER').toUpperCase();

  const res = await query<UserRecord>(
    `INSERT INTO public."user" (id, email, password_hash, name, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, password_hash, name, role, created_at`,
    [id, data.email.trim().toLowerCase(), hash, data.name.trim(), role]
  );
  return res[0];
}

export interface SessionData {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function getSessionUser(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('mffe_user_session');
  if (!sessionCookie?.value) return null;

  try {
    const raw = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && parsed.email) {
      return parsed as SessionData;
    }
    return null;
  } catch {
    return null;
  }
}

export function encodeSession(user: { id: string; email: string; name: string | null; role: string | null }): string {
  const data: SessionData = {
    id: user.id,
    email: user.email,
    name: user.name || 'Utilisateur',
    role: (user.role || 'USER').toUpperCase(),
  };
  return Buffer.from(JSON.stringify(data)).toString('base64');
}
