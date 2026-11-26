// Estados y consulta de pedidos, compartido por cliente, negocio y delivery
import type { PoolConnection } from 'mysql2/promise';
import { consultar } from './utils.js';

export const ESTADOS = {
  RECIBIDO: 'solicitado',
  ACEPTADO: 'aceptado',
  RECOGIENDO: 'recogiendo',
  EN_LAVANDERIA: 'en_lavanderia',
  EN_PROCESO: 'en_proceso',
  TERMINADO: 'listo',
  EN_CAMINO: 'en_camino',
  ENTREGADO: 'entregado',
  CANCELADO: 'cancelado',
} as const;

export type EstadoDb = keyof typeof ESTADOS;

export async function anotarHistorial(
  conn: PoolConnection, pedidoId: number, antes: EstadoDb | null, despues: EstadoDb, userId: number,
) {
  await conn.query(
    'INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
    [pedidoId, antes, despues, userId]);
}

export async function listarPedidos(condicion: string, params: unknown[]) {
  const filas = await consultar(
    `SELECT o.*, CONCAT(c.first_name, ' ', c.last_name) AS cliente_nombre, c.phone AS cliente_telefono,
            s.name AS nombre_negocio, s.address AS direccion_negocio, s.district AS zona_negocio,
            s.phone AS telefono_negocio,
            r.full_name AS recojo_nombre, r.phone AS recojo_telefono,
            e.full_name AS entrega_nombre, e.phone AS entrega_telefono,
            (SELECT COALESCE(SUM(amount), 0) FROM payments p WHERE p.order_id = o.id AND p.voided_at IS NULL) AS pagado
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       JOIN laundry_shops s ON s.id = o.shop_id
       LEFT JOIN users r ON r.id = o.pickup_user_id
       LEFT JOIN users e ON e.id = o.delivery_user_id
      WHERE ${condicion}
      ORDER BY o.id DESC
      LIMIT 100`,
    params,
  );
  if (!filas.length) return [];

  const historial = await consultar(
    'SELECT order_id, new_status, changed_at FROM order_status_history WHERE order_id IN (?) ORDER BY id',
    [filas.map((f) => f.id)],
  );

  return filas.map((f) => {
    // El repartidor visible es el de la entrega; antes de eso, el del recojo
    const nombre = f.entrega_nombre && f.status !== 'RECOGIENDO' ? f.entrega_nombre : f.recojo_nombre;
    const telefono = f.entrega_nombre && f.status !== 'RECOGIENDO' ? f.entrega_telefono : f.recojo_telefono;
    return {
      id: f.id,
      cliente_nombre: String(f.cliente_nombre).trim(),
      cliente_telefono: f.cliente_telefono || '',
      nombre_negocio: f.nombre_negocio,
      direccion_negocio: `${f.direccion_negocio}, ${f.zona_negocio}`,
      telefono_negocio: f.telefono_negocio || '',
      repartidor: nombre ? { nombre, telefono: telefono || '' } : null,
      negocio_id: f.shop_id,
      modalidad: f.delivery_mode,
      servicio: f.service_name,
      extras: f.extras_names,
      pagado: Number(f.pagado),
      saldo: f.status === 'CANCELADO' ? 0 : Math.max(0, Math.round((Number(f.total) - Number(f.pagado)) * 100) / 100),
      aviso_pago: f.payment_note,
      tipo_cotizacion: f.quote_type,
      cantidad: Number(f.quantity),
      precio_total: Number(f.total),
      pago_delivery: Number(f.delivery_fee),
      estado: ESTADOS[f.status as EstadoDb],
      metodo_pago: f.payment_method,
      direccion_entrega: f.delivery_address,
      referencia: f.pickup_reference,
      notas: f.notes || '',
      fecha: f.received_at,
      calificacion: f.rating,
      historial: historial
        .filter((h) => h.order_id === f.id)
        .map((h) => ({ estado: ESTADOS[h.new_status as EstadoDb], fecha: h.changed_at })),
    };
  });
}
