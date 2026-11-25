import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Response, NextFunction } from 'express';
import { AuthRequest, User } from './types.js';
import { pool } from './db.js';

if (!process.env.JWT_SECRET!) {
  throw new Error('Falta variable de entorno: JWT_SECRET');
}

const JWT_SECRET = process.env.JWT_SECRET!;
const EXPIRES_IN = '8h';

export interface JwtPayload {
  userId: number;
  role: string;
}

export function generateToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    role: user.rol,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export async function hashPassword(plainText: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(plainText, saltRounds);
}

/**
 * Middleware para proteger rutas.
 * Verifica token, obtiene usuario de DB para asegurar 'active' y rol actualizado.
 */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token no proporcionado o inválido' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token!, JWT_SECRET) as JwtPayload;
    
    // Obtener usuario de la base de datos para verificar active y roles actuales
    const [rows] = await pool.query(
      'SELECT id, full_name, username, email, role, phone, address, active FROM users WHERE id = ?',
      [decoded.userId]
    );

    const users = rows as any[];
    if (users.length === 0) {
      res.status(401).json({ message: 'Usuario no encontrado' });
      return;
    }

    const dbUser = users[0];

    if (!dbUser.active) {
      res.status(401).json({ message: 'Usuario inactivo' });
      return;
    }

    // Mapear a nuestra interfaz User
    const user: User = {
      id: dbUser.id,
      nombre: dbUser.full_name,
      nombre_completo: dbUser.full_name,
      usuario: dbUser.username || dbUser.email.split('@')[0],
      correo: dbUser.email,
      rol: dbUser.role,
      telefono: dbUser.phone || '',
      direccion: dbUser.address || '',
    };

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token expirado o inválido' });
  }
}

/**
 * Helper para verificar roles específicos
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }
    if (!roles.includes(req.user.rol)) {
      res.status(403).json({ message: 'Acceso denegado por rol' });
      return;
    }
    next();
  };
}