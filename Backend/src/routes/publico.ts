import { Router } from 'express';
import { consultar } from '../utils.js';

const router = Router();

// Cifras reales para la portada
router.get('/resumen', async (_req, res) => {
  const [r] = await consultar(`
    SELECT
      (SELECT COUNT(*) FROM laundry_shops WHERE active = 1) AS lavanderias,
      (SELECT COUNT(*) FROM users WHERE role = 'CLIENT' AND active = 1) AS clientes,
      (SELECT COUNT(*) FROM orders WHERE shop_id IS NOT NULL) AS pedidos,
      (SELECT COUNT(*) FROM orders WHERE status = 'ENTREGADO') AS entregados`);
  res.json(r);
});

export default router;
