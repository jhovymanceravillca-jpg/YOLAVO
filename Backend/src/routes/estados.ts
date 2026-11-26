import { Router } from 'express';
import { requiere } from '../auth.js';
import { ESTADOS, type EstadoDb } from '../pedidos.js';
import type { AuthRequest, Rol } from '../types.js';
import { HttpError, transaccion } from '../utils.js';

const router = Router();

// Quien puede mover un pedido, y desde que estado
const TRANSICIONES: Record<Rol, Partial<Record<EstadoDb, EstadoDb[]>>> = {
  negocio: { RECIBIDO: ['EN_PROCESO', 'CANCELADO'], EN_PROCESO: ['TERMINADO'] },
  delivery: { EN_CAMINO: ['ENTREGADO'] },
  cliente: { RECIBIDO: ['CANCELADO'], EN_CAMINO: ['ENTREGADO'] },
};

const PROPIETARIO: Record<Rol, string> = {
  negocio: 's.owner_id = ?',
  delivery: 'o.delivery_user_id = ?',
  cliente: 'c.user_id = ?',
};

router.patch('/pedidos/:id/estado', requiere(), async (req: AuthRequest, res) => {
  const { id: userId, rol } = req.user!;
  const pedidoId = Number(req.params.id);
  const destino = (Object.keys(ESTADOS) as EstadoDb[]).find((e) => ESTADOS[e] === req.body?.estado);
  if (!destino) throw new HttpError(400, 'Estado no válido');

  await transaccion(async (conn) => {
    const [filas] = await conn.query<any[]>(
      `SELECT o.status, o.total, o.payment_method, CONCAT(c.first_name, ' ', c.last_name) AS cliente
         FROM orders o
         JOIN customers c ON c.id = o.customer_id
         JOIN laundry_shops s ON s.id = o.shop_id
        WHERE o.id = ? AND ${PROPIETARIO[rol]} FOR UPDATE`,
      [pedidoId, userId]);
    const pedido = filas[0];
    if (!pedido) throw new HttpError(404, 'Pedido no encontrado');
    const actual = pedido.status as EstadoDb;
    if (!TRANSICIONES[rol][actual]?.includes(destino)) {
      throw new HttpError(409, 'Ese cambio de estado no está permitido');
    }

    await conn.query('UPDATE orders SET status = ? WHERE id = ?', [destino, pedidoId]);
    await conn.query(
      'INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
      [pedidoId, actual, destino, userId]);

    if (destino === 'ENTREGADO') {
      await conn.query(
        'INSERT INTO deliveries (order_id, delivered_by, received_by_name) VALUES (?, ?, ?)',
        [pedidoId, userId, pedido.cliente]);
      if (Number(pedido.total) > 0) {
        await conn.query(
          'INSERT INTO payments (order_id, amount, payment_method, created_by) VALUES (?, ?, ?, ?)',
          [pedidoId, pedido.total, String(pedido.payment_method).toUpperCase(), userId]);
      }
    }
  });

  res.json({ estado: ESTADOS[destino] });
});

export default router;
