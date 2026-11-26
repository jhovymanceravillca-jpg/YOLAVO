import type { Request } from 'express';

export type RolDb = 'CLIENT' | 'STAFF' | 'ADMIN' | 'DELIVERY';
export type Rol = 'cliente' | 'negocio' | 'delivery';

export interface UsuarioSesion {
  id: number;
  nombre: string;
  usuario: string;
  correo: string;
  rol: Rol;
  telefono: string;
  direccion: string;
}

export interface AuthRequest extends Request {
  user?: UsuarioSesion;
}
