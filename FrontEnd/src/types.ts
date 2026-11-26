export type Rol = 'cliente' | 'negocio' | 'delivery';
export type Estado = 'solicitado' | 'en_proceso' | 'listo' | 'en_camino' | 'entregado' | 'cancelado';
export type MetodoPago = 'qr' | 'efectivo' | 'tarjeta';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  telefono: string;
  direccion: string;
}

export interface Negocio {
  id: number;
  nombre_negocio: string;
  direccion: string;
  distrito: string;
  precio_kilo: number;
  servicios: string[];
  lavadoras_disponibles: number;
  icono: string;
}

export interface Pedido {
  id: number;
  cliente_nombre: string;
  cliente_telefono: string;
  nombre_negocio: string;
  direccion_negocio: string;
  tipo_cotizacion: 'por_kilo' | 'por_prenda';
  cantidad: number;
  precio_total: number;
  pago_delivery: number;
  estado: Estado;
  metodo_pago: MetodoPago;
  direccion_entrega: string;
  notas: string;
  fecha: string;
}

export interface Maquina {
  id: number;
  codigo: string;
  tipo: 'lavadora' | 'secadora';
  capacidad_kg: number;
  estado: 'disponible' | 'ocupada' | 'mantenimiento';
  minutos: number;
}

export interface Producto {
  id: number;
  nombre: string;
  tipo: string;
  precio: number;
  stock: number;
  icono: string;
}

export interface PanelNegocio {
  local: { nombre: string; direccion: string; precio_kilo: number };
  resumen: { pedidos: number; activos: number; ingresos: number };
  pedidos: Pedido[];
  maquinas: Maquina[];
  productos: Producto[];
}

export interface PanelDelivery {
  resumen: { entregas: number; ganancias: number };
  activos: Pedido[];
  disponibles: Pedido[];
}

export type Avisar = (texto: string, icono?: string) => void;
