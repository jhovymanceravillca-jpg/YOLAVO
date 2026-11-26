import { Router } from 'express';
import { requiere } from '../auth.js';
import { listarPedidos } from '../pedidos.js';
import type { AuthRequest } from '../types.js';
import { consultar, ejecutar, HttpError, numero, texto } from '../utils.js';

const router = Router();
const soloNegocio = requiere('negocio');

async function localDe(userId: number) {
  const [local] = await consultar(
    'SELECT * FROM laundry_shops WHERE owner_id = ? ORDER BY id LIMIT 1', [userId]);
  if (!local) throw new HttpError(404, 'Tu cuenta no tiene una lavandería asignada');
  return local;
}

/** Todo el panel del negocio en una sola respuesta */
router.get('/negocio/panel', soloNegocio, async (req: AuthRequest, res) => {
  const local = await localDe(req.user!.id);
  const [r] = await consultar(
    `SELECT COUNT(*) AS pedidos,
            COALESCE(SUM(status NOT IN ('ENTREGADO','CANCELADO')), 0) AS activos,
            COALESCE(SUM(CASE WHEN status = 'ENTREGADO' THEN total END), 0) AS ingresos
       FROM orders WHERE shop_id = ?`, [local.id]);
  const maquinas = await consultar(
    `SELECT id, code AS codigo, type AS tipo, capacity_kg AS capacidad_kg,
            IF(status = 'ocupada' AND ends_at <= NOW(), 'disponible', status) AS estado,
            GREATEST(0, CEIL(TIMESTAMPDIFF(SECOND, NOW(), ends_at) / 60)) AS minutos
       FROM machines WHERE shop_id = ? ORDER BY code`, [local.id]);
  const productos = await consultar(
    'SELECT id, name AS nombre, type AS tipo, price AS precio, stock, icon AS icono FROM products WHERE shop_id = ? ORDER BY name',
    [local.id]);

  res.json({
    local: { nombre: local.name, direccion: local.address, precio_kilo: Number(local.price_per_kg) },
    resumen: { pedidos: Number(r!.pedidos), activos: Number(r!.activos), ingresos: Number(r!.ingresos) },
    pedidos: await listarPedidos('o.shop_id = ?', [local.id]),
    maquinas: maquinas.map((m) => ({ ...m, minutos: m.estado === 'ocupada' ? Number(m.minutos) : 0 })),
    productos: productos.map((p) => ({ ...p, precio: Number(p.precio) })),
  });
});

router.patch('/negocio/local', soloNegocio, async (req: AuthRequest, res) => {
  const local = await localDe(req.user!.id);
  const precio = numero(req.body?.precio_kilo, 'El precio por kilo', 1, 500);
  await ejecutar('UPDATE laundry_shops SET price_per_kg = ? WHERE id = ?', [precio, local.id]);
  res.json({ precio_kilo: precio });
});

router.post('/negocio/maquinas', soloNegocio, async (req: AuthRequest, res) => {
  const local = await localDe(req.user!.id);
  const codigo = texto(req.body?.codigo, 'código', 20).toUpperCase();
  const tipo = req.body?.tipo === 'secadora' ? 'secadora' : 'lavadora';
  const capacidad = numero(req.body?.capacidad_kg, 'La capacidad', 1, 100);
  const [repetida] = await consultar('SELECT id FROM machines WHERE shop_id = ? AND code = ?', [local.id, codigo]);
  if (repetida) throw new HttpError(409, 'Ya existe un equipo con ese código');
  const r = await ejecutar(
    'INSERT INTO machines (shop_id, code, type, capacity_kg) VALUES (?, ?, ?, ?)',
    [local.id, codigo, tipo, capacidad]);
  res.status(201).json({ id: r.insertId });
});

router.patch('/negocio/maquinas/:id', soloNegocio, async (req: AuthRequest, res) => {
  const local = await localDe(req.user!.id);
  const estado = String(req.body?.estado);
  if (!['disponible', 'ocupada', 'mantenimiento'].includes(estado)) throw new HttpError(400, 'Estado no válido');
  const r = await ejecutar(
    `UPDATE machines SET status = ?, ends_at = IF(? = 'ocupada', NOW() + INTERVAL 35 MINUTE, NULL)
      WHERE id = ? AND shop_id = ?`,
    [estado, estado, Number(req.params.id), local.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Equipo no encontrado');
  res.json({ estado });
});

router.post('/negocio/productos', soloNegocio, async (req: AuthRequest, res) => {
  const local = await localDe(req.user!.id);
  const nombre = texto(req.body?.nombre, 'nombre');
  const tipo = texto(req.body?.tipo, 'categoría', 40);
  const precio = numero(req.body?.precio, 'El precio', 0, 10000);
  const stock = Math.round(numero(req.body?.stock, 'El stock', 0, 100000));
  const r = await ejecutar(
    'INSERT INTO products (shop_id, name, type, price, stock) VALUES (?, ?, ?, ?, ?)',
    [local.id, nombre, tipo, precio, stock]);
  res.status(201).json({ id: r.insertId });
});

router.patch('/negocio/productos/:id', soloNegocio, async (req: AuthRequest, res) => {
  const local = await localDe(req.user!.id);
  const stock = Math.round(numero(req.body?.stock, 'El stock', 0, 100000));
  const r = await ejecutar(
    'UPDATE products SET stock = ? WHERE id = ? AND shop_id = ?', [stock, Number(req.params.id), local.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Producto no encontrado');
  res.json({ stock });
});

export default router;
