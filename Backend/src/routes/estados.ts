import { Router } from 'express';
import { requiere } from '../auth.js';
import { anotarHistorial, ESTADOS, type EstadoDb } from '../pedidos.js';
import type { AuthRequest, Rol } from '../types.js';
import { HttpError, transaccion } from '../utils.js';

const router = Router();

// Quien puede mover un pedido, y desde que estado
const TRANSICIONES: Record<Rol, Partial<Record<EstadoDb, EstadoDb[]>>> = {
  // ACEPTADO->EN_LAVANDERIA y TERMINADO->ENTREGADO son solo para pedidos que se dejan en el local
  negocio: {
    RECIBIDO: ['ACEPTADO', 'CANCELADO'], ACEPTADO: ['EN_LAVANDERIA'],
    EN_PROCESO: ['TERMINADO'], TERMINADO: ['ENTREGADO'],
  },
  delivery: { RECOGIENDO: ['EN_LAVANDERIA'], EN_CAMINO: ['ENTREGADO'] },
  cliente: { RECIBIDO: ['CANCELADO'], ACEPTADO: ['CANCELADO'] },
};

const PROPIETARIO: Record<Rol, string> = {
  negocio: 's.owner_id = ?',
  delivery: `IF(o.status = 'RECOGIENDO', o.pickup_user_id, o.delivery_user_id) = ?`,
  cliente: 'c.user_id = ?',
};

router.patch('/pedidos/:id/estado', requiere(), async (req: AuthRequest, res) => {
  const { id: userId, rol } = req.user!;
  const pedidoId = Number(req.params.id);
  const destino = (Object.keys(ESTADOS) as EstadoDb[]).find((e) => ESTADOS[e] === req.body?.estado);
  if (!destino) throw new HttpError(400, 'Estado no válido');

  await transaccion(async (conn) => {
    const [filas] = await conn.query<any[]>(
      `SELECT o.status, o.total, o.payment_method, o.delivery_user_id, o.delivery_mode,
              CONCAT(c.first_name, ' ', c.last_name) AS cliente
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
    const soloLocal = rol === 'negocio' && (actual === 'ACEPTADO' || actual === 'TERMINADO');
    if (soloLocal && pedido.delivery_mode !== 'local') {
      throw new HttpError(409, 'Ese pedido lo traslada un repartidor');
    }

    await conn.query('UPDATE orders SET status = ? WHERE id = ?', [destino, pedidoId]);
    await anotarHistorial(conn, pedidoId, actual, destino, userId);

    if (destino === 'ENTREGADO') {
      await conn.query(
        'INSERT INTO deliveries (order_id, delivered_by, received_by_name) VALUES (?, ?, ?)',
        [pedidoId, pedido.delivery_user_id ?? userId, pedido.cliente]);
      // El repartidor cobra en efectivo el saldo. QR, transferencia y tarjeta los verifica la lavanderia
      if (rol === 'delivery' && pedido.payment_method === 'efectivo') {
        const [sumas] = await conn.query<any[]>(
          'SELECT COALESCE(SUM(amount), 0) AS pagado FROM payments WHERE order_id = ? AND voided_at IS NULL',
          [pedidoId]);
        const saldo = Math.round((Number(pedido.total) - Number(sumas[0].pagado)) * 100) / 100;
        if (saldo > 0) {
          await conn.query(
            `INSERT INTO payments (order_id, amount, payment_method, created_by) VALUES (?, ?, 'EFECTIVO', ?)`,
            [pedidoId, saldo, userId]);
        }
      }
    }
  });

  res.json({ estado: ESTADOS[destino] });
});

export default router;
