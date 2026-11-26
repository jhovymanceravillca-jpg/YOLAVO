import { Router } from 'express';
import { requiere } from '../auth.js';
import { anotarHistorial, listarPedidos } from '../pedidos.js';
import type { AuthRequest } from '../types.js';
import { consultar, HttpError, transaccion } from '../utils.js';

const router = Router();
const soloDelivery = requiere('delivery');

// Cada tramo completado (recojo o entrega) se paga por separado
router.get('/delivery/panel', soloDelivery, async (req: AuthRequest, res) => {
  const yo = req.user!.id;
  const [r] = await consultar(
    `SELECT
       COALESCE(SUM(pickup_user_id = ? AND status NOT IN ('RECOGIENDO','ACEPTADO','CANCELADO')), 0)
       + COALESCE(SUM(delivery_user_id = ? AND status = 'ENTREGADO'), 0) AS viajes,
       COALESCE(SUM(CASE WHEN pickup_user_id = ? AND status NOT IN ('RECOGIENDO','ACEPTADO','CANCELADO')
                         THEN delivery_fee ELSE 0 END), 0)
       + COALESCE(SUM(CASE WHEN delivery_user_id = ? AND status = 'ENTREGADO'
                           THEN delivery_fee ELSE 0 END), 0) AS ganancias
     FROM orders`, [yo, yo, yo, yo]);

  res.json({
    resumen: { viajes: Number(r!.viajes), ganancias: Number(r!.ganancias) },
    activos: await listarPedidos(
      `(o.status = 'RECOGIENDO' AND o.pickup_user_id = ?) OR (o.status = 'EN_CAMINO' AND o.delivery_user_id = ?)`,
      [yo, yo]),
    disponibles: await listarPedidos(
      `o.delivery_mode = 'domicilio' AND ((o.status = 'ACEPTADO' AND o.pickup_user_id IS NULL)
        OR (o.status = 'TERMINADO' AND o.delivery_user_id IS NULL))`,
      []),
  });
});

router.post('/delivery/pedidos/:id/aceptar', soloDelivery, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const yo = req.user!.id;
  await transaccion(async (conn) => {
    // FOR UPDATE evita que dos repartidores tomen la misma carrera
    const [filas] = await conn.query<any[]>(
      `SELECT status, pickup_user_id, delivery_user_id FROM orders
        WHERE id = ? AND delivery_mode = 'domicilio' FOR UPDATE`, [id]);
    const p = filas[0];
    if (p?.status === 'ACEPTADO' && !p.pickup_user_id) {
      await conn.query(`UPDATE orders SET pickup_user_id = ?, status = 'RECOGIENDO' WHERE id = ?`, [yo, id]);
      await anotarHistorial(conn, id, 'ACEPTADO', 'RECOGIENDO', yo);
    } else if (p?.status === 'TERMINADO' && !p.delivery_user_id) {
      await conn.query(`UPDATE orders SET delivery_user_id = ?, status = 'EN_CAMINO' WHERE id = ?`, [yo, id]);
      await anotarHistorial(conn, id, 'TERMINADO', 'EN_CAMINO', yo);
    } else {
      throw new HttpError(409, 'La carrera ya no está disponible');
    }
  });
  res.json({ ok: true });
});

export default router;
