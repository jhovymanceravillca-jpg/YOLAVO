export type Rol = 'cliente' | 'negocio' | 'delivery';
export type Estado =
  | 'solicitado' | 'aceptado' | 'recogiendo' | 'en_lavanderia' | 'en_proceso'
  | 'listo' | 'en_camino' | 'entregado' | 'cancelado';
export type MetodoPago = 'qr' | 'efectivo' | 'tarjeta' | 'transferencia';

export interface Servicio {
  id: number;
  nombre: string;
  unidad: 'PRENDA' | 'KILOGRAMO' | 'FIJO';
  precio: number;
  activo: boolean;
  extra: boolean;
}

export interface Catalogo { servicios: Servicio[]; prendas: { id: number; nombre: string }[] }

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
  telefono: string;
  horario: string;
  puntaje: number;
  total_resenas: number;
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
  telefono_negocio: string;
  repartidor: { nombre: string; telefono: string } | null;
  referencia: string;
  calificacion: number | null;
  historial: { estado: Estado; fecha: string }[];
  negocio_id: number;
  modalidad: 'domicilio' | 'local';
  servicio: string;
  extras: string;
  pagado: number;
  saldo: number;
  aviso_pago: string | null;
  tipo_cotizacion: 'por_kilo' | 'por_prenda' | 'fijo';
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
  local: { id: number; nombre: string; direccion: string; zona: string; telefono: string; horario: string; tiene_qr: boolean };
  resumen: {
    pedidos: number; activos: number; entregados: number; cancelados: number;
    facturado: number; cobrado: number; saldo: number; cobros: { metodo: MetodoPago; monto: number }[];
  };
  servicios: Servicio[];
  puede_tarifas: boolean;
  pedidos: Pedido[];
  maquinas: Maquina[];
  productos: Producto[];
}

export interface PanelDelivery {
  resumen: { viajes: number; ganancias: number };
  activos: Pedido[];
  disponibles: Pedido[];
}

export type Avisar = (texto: string, icono?: string) => void;
