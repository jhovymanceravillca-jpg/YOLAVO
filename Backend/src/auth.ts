import jwt from 'jsonwebtoken';
import type { Response, NextFunction } from 'express';
import type { AuthRequest, Rol, RolDb, UsuarioSesion } from './types.js';
import { consultar, HttpError } from './utils.js';

const JWT_SECRET = process.env.JWT_SECRET ?? '';
if (!JWT_SECRET) throw new Error('Falta variable de entorno: JWT_SECRET');

const ROLES: Record<RolDb, Rol> = {
  CLIENT: 'cliente',
  STAFF: 'negocio',
  ADMIN: 'negocio',
  DELIVERY: 'delivery',
};

export function aSesion(fila: Record<string, any>): UsuarioSesion {
  return {
    id: fila.id,
    nombre: fila.full_name,
    usuario: fila.username || String(fila.email).split('@')[0] || '',
    correo: fila.email,
    rol: ROLES[fila.role as RolDb],
    telefono: fila.phone || '',
    direccion: fila.address || '',
  };
}

export function generarToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '8h' });
}

/** Exige un token valido y un usuario activo; opcionalmente limita por rol. */
export function requiere(...roles: Rol[]) {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace(/^Bearer /, '');
    if (!token) throw new HttpError(401, 'Debes iniciar sesión');

    let userId: number;
    try {
      userId = (jwt.verify(token, JWT_SECRET) as { userId: number }).userId;
    } catch {
      throw new HttpError(401, 'La sesión expiró, vuelve a ingresar');
    }

    const [fila] = await consultar('SELECT * FROM users WHERE id = ? AND active = 1', [userId]);
    if (!fila) throw new HttpError(401, 'Usuario no disponible');

    const usuario = aSesion(fila);
    if (roles.length && !roles.includes(usuario.rol)) {
      throw new HttpError(403, 'Tu cuenta no tiene permiso para esta acción');
    }
    req.user = usuario;
    next();
  };
}
