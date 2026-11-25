import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { authenticate, requireRole } from '../auth.js';
import { PedidoResponse } from '../types.js';
import { AuthRequest } from '../types.js';

const router = Router();

// Estados de la base -> estados que entiende el frontend
const ESTADOS: Record<string, string> = {
  RECIBIDO: 'solicitado',
  EN_PROCESO: 'en_proceso',
  TERMINADO: 'listo',
  EN_CAMINO: 'en_camino',
  ENTREGADO: 'entregado',
  CANCELADO: 'cancelado',
};

// Helper para formatear fecha
function formatFecha(dateStr: string | Date | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  // Formato legible simple: YYYY-MM-DD HH:mm
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// GET /api/negocio/pedidos (rol negocio)
router.get('/negocio/pedidos', authenticate, requireRole('STAFF'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Encontrar las lavanderías propiedad del usuario
    const [shopsRows] = await pool.query(
      'SELECT id FROM laundry_shops WHERE owner_id = ?',
      [userId]
    );
    const shopIds = (shopsRows as any[]).map(s => s.id);

    if (shopIds.length === 0) {
      res.json([]);
      return;
    }

    const placeholders = shopIds.map(() => '?').join(',');

    const [ordersRows] = await pool.query(`
      SELECT 
        o.id,
        c.id AS cliente_id,
        CONCAT(c.first_name, ' ', c.last_name) AS cliente_nombre,
        c.phone AS cliente_telefono,
        ls.id AS negocio_id,
        ls.name AS nombre_negocio,
        o.delivery_user_id AS delivery_id,
        o.quote_type AS tipo_cotizacion,
        o.quantity AS cantidad,
        o.total AS precio_total,
        o.status AS estado,
        o.payment_method AS metodo_pago,
        o.pickup_address AS direccion_recojo,
        o.delivery_address AS direccion_entrega,
        o.notes AS notas,
        o.received_at AS fecha,
        '' AS tiempo_estimado
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      JOIN laundry_shops ls ON o.shop_id = ls.id
      WHERE o.shop_id IN (${placeholders})
      ORDER BY o.received_at DESC
    `, shopIds);

    const pedidos: PedidoResponse[] = (ordersRows as any[]).map((row) => ({
      id: row.id,
      cliente_id: row.cliente_id,
      cliente_nombre: row.cliente_nombre || 'Desconocido',
      cliente_telefono: row.cliente_telefono || '',
      negocio_id: row.negocio_id,
      nombre_negocio: row.nombre_negocio,
      delivery_id: row.delivery_id,
      tipo_cotizacion: row.tipo_cotizacion,
      cantidad: Number(row.cantidad),
      precio_total: Number(row.precio_total),
      estado: ESTADOS[row.estado] ?? 'solicitado',
      metodo_pago: row.metodo_pago,
      direccion_recojo: row.direccion_recojo || '',
      direccion_entrega: row.direccion_entrega || '',
      notas: row.notas || '',
      fecha: formatFecha(row.fecha),
      tiempo_estimado: row.tiempo_estimado,
    }));

    res.json(pedidos);
  } catch (error) {
    console.error('Error en pedidos negocio:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

// GET /api/delivery/mis-pedidos (rol delivery)
router.get('/delivery/mis-pedidos', authenticate, requireRole('DELIVERY'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const [ordersRows] = await pool.query(`
      SELECT 
        o.id,
        c.id AS cliente_id,
        CONCAT(c.first_name, ' ', c.last_name) AS cliente_nombre,
        c.phone AS cliente_telefono,
        ls.id AS negocio_id,
        ls.name AS nombre_negocio,
        o.delivery_user_id AS delivery_id,
        o.quote_type AS tipo_cotizacion,
        o.quantity AS cantidad,
        o.total AS precio_total,
        o.status AS estado,
        o.payment_method AS metodo_pago,
        o.pickup_address AS direccion_recojo,
        o.delivery_address AS direccion_entrega,
        o.notes AS notas,
        o.received_at AS fecha,
        '' AS tiempo_estimado
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      JOIN laundry_shops ls ON o.shop_id = ls.id
      WHERE o.delivery_user_id = ?
      ORDER BY o.received_at DESC
    `, [userId]);

    const pedidos: PedidoResponse[] = (ordersRows as any[]).map((row) => ({
      id: row.id,
      cliente_id: row.cliente_id,
      cliente_nombre: row.cliente_nombre || 'Desconocido',
      cliente_telefono: row.cliente_telefono || '',
      negocio_id: row.negocio_id,
      nombre_negocio: row.nombre_negocio,
      delivery_id: row.delivery_id,
      tipo_cotizacion: row.tipo_cotizacion,
      cantidad: Number(row.cantidad),
      precio_total: Number(row.precio_total),
      estado: ESTADOS[row.estado] ?? 'solicitado',
      metodo_pago: row.metodo_pago,
      direccion_recojo: row.direccion_recojo || '',
      direccion_entrega: row.direccion_entrega || '',
      notas: row.notas || '',
      fecha: formatFecha(row.fecha),
      tiempo_estimado: row.tiempo_estimado,
    }));

    res.json(pedidos);
  } catch (error) {
    console.error('Error en pedidos delivery:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

export default router;