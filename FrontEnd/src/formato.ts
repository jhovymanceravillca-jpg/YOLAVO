import type { Estado, Pedido } from './types';

export const bs = (monto: number) => `Bs ${monto.toFixed(2)}`;

export const NOMBRE_ESTADO: Record<Estado, string> = {
  solicitado: 'Solicitado',
  en_proceso: 'Lavando',
  listo: 'Listo',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export const NOMBRE_PAGO = { qr: 'QR', efectivo: 'Efectivo', tarjeta: 'Tarjeta' };

export const detalle = (p: Pedido) =>
  p.tipo_cotizacion === 'por_kilo' ? `⚖️ ${p.cantidad} kg de ropa` : `👕 ${p.cantidad} prendas`;

export const enlaceMapa = (direccion: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${direccion}, La Paz, Bolivia`)}`;
