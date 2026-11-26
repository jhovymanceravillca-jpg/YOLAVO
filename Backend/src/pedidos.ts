// Consulta y formato de pedidos, compartido por cliente, negocio y delivery
import { consultar } from './utils.js';

export const ESTADOS = {
  RECIBIDO: 'solicitado',
  EN_PROCESO: 'en_proceso',
  TERMINADO: 'listo',
  EN_CAMINO: 'en_camino',
  ENTREGADO: 'entregado',
  CANCELADO: 'cancelado',
} as const;

export type EstadoDb = keyof typeof ESTADOS;

export async function listarPedidos(condicion: string, params: unknown[]) {
  const filas = await consultar(
    `SELECT o.*, CONCAT(c.first_name, ' ', c.last_name) AS cliente_nombre, c.phone AS cliente_telefono,
            s.name AS nombre_negocio, s.address AS direccion_negocio
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       JOIN laundry_shops s ON s.id = o.shop_id
      WHERE ${condicion}
      ORDER BY o.id DESC
      LIMIT 100`,
    params,
  );
  return filas.map((f) => ({
    id: f.id,
    cliente_nombre: String(f.cliente_nombre).trim(),
    cliente_telefono: f.cliente_telefono || '',
    nombre_negocio: f.nombre_negocio,
    direccion_negocio: f.direccion_negocio,
    tipo_cotizacion: f.quote_type,
    cantidad: Number(f.quantity),
    precio_total: Number(f.total),
    pago_delivery: Number(f.delivery_fee),
    estado: ESTADOS[f.status as EstadoDb],
    metodo_pago: f.payment_method,
    direccion_entrega: f.delivery_address,
    notas: f.notes || '',
    fecha: f.received_at,
  }));
}
