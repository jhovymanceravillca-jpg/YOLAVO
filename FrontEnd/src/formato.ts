import type { Estado, Pedido } from './types';

export const bs = (monto: number) => `Bs ${monto.toFixed(2)}`;

export const NOMBRE_ESTADO: Record<Estado, string> = {
  solicitado: 'Pedido enviado',
  aceptado: 'Aceptado',
  recogiendo: 'Recogiendo tu ropa',
  en_lavanderia: 'En la lavandería',
  en_proceso: 'Lavando',
  listo: 'Lista para entregar',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

// Lo que se le explica al cliente en cada paso
export const QUE_PASA: Record<Estado, string> = {
  solicitado: 'Esperando que la lavandería acepte tu pedido.',
  aceptado: 'Buscando un repartidor para recoger tu ropa. Tenla lista en una bolsa.',
  recogiendo: 'El repartidor va a tu domicilio a recoger la ropa.',
  en_lavanderia: 'Tu ropa llegó. La lavandería va a pesarla y confirmar el total.',
  en_proceso: 'Estamos lavando tu ropa.',
  listo: 'Tu ropa está limpia. Buscando repartidor para la entrega.',
  en_camino: 'Tu ropa va en camino. Ten listo el pago.',
  entregado: 'Pedido completado. ¡Gracias!',
  cancelado: 'Este pedido fue cancelado.',
};

export const ZONAS = [
  'Centro', 'Queru Queru', 'Cala Cala', 'Sarco', 'La Recoleta', 'Muyurina', 'Las Cuadras',
  'Hipódromo', 'Villa Busch', 'Zona Sud', 'Pacata', 'Temporal',
];

// La hora siempre se muestra en horario de Bolivia
export const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-BO', {
    timeZone: 'America/La_Paz', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });

export const NOMBRE_PAGO = { efectivo: 'Efectivo', qr: 'QR', transferencia: 'Transferencia', tarjeta: 'Tarjeta' };

export const detalle = (p: Pedido) => {
  const medida = p.tipo_cotizacion === 'por_kilo' ? ` — ${p.cantidad} kg`
    : p.tipo_cotizacion === 'por_prenda' ? ` — ${p.cantidad} prendas` : '';
  return `🧺 ${p.servicio || 'Lavado'}${medida}${p.extras ? ` + ${p.extras}` : ''}`;
};

// Cuando el cliente lleva y recoge la ropa en el local, no hay repartidor
export const quePasa = (p: Pedido) => {
  if (p.modalidad === 'local') {
    if (p.estado === 'aceptado') return 'Pedido aceptado. Lleva tu ropa al local.';
    if (p.estado === 'listo') return 'Tu ropa está limpia. Pasa a recogerla por el local.';
  }
  return QUE_PASA[p.estado];
};

export const enlaceMapa = (direccion: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${direccion}, Cochabamba, Bolivia`)}`;
