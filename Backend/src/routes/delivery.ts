import { Router } from 'express';
import { requiere } from '../auth.js';
import { listarPedidos } from '../pedidos.js';
import type { AuthRequest } from '../types.js';
import { HttpError, transaccion } from '../utils.js';

const router = Router();
const soloDelivery = requiere('delivery');

router.get('/delivery/panel', soloDelivery, async (req: AuthRequest, res) => {
  const mios = await listarPedidos('o.delivery_user_id = ?', [req.user!.id]);
  const entregados = mios.filter((p) => p.estado === 'entregado');
  res.json({
    resumen: {
      entregas: entregados.length,
      ganancias: entregados.reduce((suma, p) => suma + p.pago_delivery, 0),
    },
    activos: mios.filter((p) => p.estado === 'en_camino'),
    disponibles: await listarPedidos(`o.status = 'TERMINADO' AND o.delivery_user_id IS NULL`, []),
  });
});

router.post('/delivery/pedidos/:id/aceptar', soloDelivery, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  await transaccion(async (conn) => {
    // La condicion evita que dos repartidores tomen la misma carrera
    const [r] = await conn.query<any>(
      `UPDATE orders SET delivery_user_id = ?, status = 'EN_CAMINO'
        WHERE id = ? AND status = 'TERMINADO' AND delivery_user_id IS NULL`,
      [req.user!.id, id]);
    if (!r.affectedRows) throw new HttpError(409, 'La carrera ya no está disponible');
    await conn.query(
      `INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by)
       VALUES (?, 'TERMINADO', 'EN_CAMINO', ?)`, [id, req.user!.id]);
  });
  res.json({ estado: 'en_camino' });
});

export default router;
