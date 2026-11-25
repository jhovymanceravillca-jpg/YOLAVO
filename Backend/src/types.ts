import type { Request } from 'express';

export interface User {
  id: number;
  nombre: string;
  nombre_completo: string;
  usuario: string;
  correo: string;
  rol: 'CLIENT' | 'STAFF' | 'ADMIN' | 'DELIVERY';
  telefono: string;
  direccion: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface LoginBody {
  correo: string;
  contrasena: string;
  rol: string; // 'cliente', 'negocio', 'delivery'
}

export interface RegisterBody {
  nombre_completo: string;
  usuario: string;
  correo: string;
  contrasena: string;
  contrasena2: string;
  rol: string; // 'cliente', 'negocio', 'delivery'
  telefono: string;
  direccion: string;
}

export interface LaundryShopResponse {
  id: number;
  nombre_negocio: string;
  direccion: string;
  distrito: string;
  distancia: string;
  puntaje: number;
  total_resenas: number;
  precio_kilo: number;
  servicios: string[];
  lavadoras_disponibles: number;
  icono: string;
  tiempo_entrega: string;
}

export interface PedidoResponse {
  id: number;
  cliente_id: number;
  cliente_nombre: string;
  cliente_telefono: string;
  negocio_id: number;
  nombre_negocio: string;
  delivery_id: number | null;
  tipo_cotizacion: string;
  cantidad: number;
  precio_total: number;
  estado: string;
  metodo_pago: string;
  direccion_recojo: string;
  direccion_entrega: string;
  notas: string;
  fecha: string;
  tiempo_estimado: string;
}

export interface ProductoResponse {
  id: number;
  nombre: string;
  tipo: string;
  precio: number;
  stock: number;
  icono: string;
}