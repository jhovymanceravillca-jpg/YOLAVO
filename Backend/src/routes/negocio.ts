import { Router } from 'express';
import { requiere } from '../auth.js';
import { administraTarifas, listarServicios } from './pagos.js';
import { anotarHistorial, listarPedidos } from '../pedidos.js';
import type { AuthRequest } from '../types.js';
import { consultar, ejecutar, HttpError, numero, texto, transaccion } from '../utils.js';

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
            COALESCE(SUM(status = 'ENTREGADO'), 0) AS entregados,
            COALESCE(SUM(status = 'CANCELADO'), 0) AS cancelados,
            COALESCE(SUM(CASE WHEN status <> 'CANCELADO' THEN total END), 0) AS facturado,
            COALESCE(SUM(CASE WHEN status <> 'CANCELADO' THEN GREATEST(CAST(total AS DECIMAL(12,2)) - (
              SELECT COALESCE(SUM(amount), 0) FROM payments p WHERE p.order_id = orders.id AND p.voided_at IS NULL), 0) END), 0) AS saldo
       FROM orders WHERE shop_id = ?`, [local.id]);
  const porMetodo = await consultar(
    `SELECT p.payment_method AS metodo, SUM(p.amount) AS monto
       FROM payments p JOIN orders o ON o.id = p.order_id
      WHERE o.shop_id = ? AND p.voided_at IS NULL GROUP BY p.payment_method`, [local.id]);
  const cobros = porMetodo.map((m) => ({ metodo: String(m.metodo).toLowerCase(), monto: Number(m.monto) }));
  const maquinas = await consultar(
    `SELECT id, code AS codigo, type AS tipo, capacity_kg AS capacidad_kg,
            IF(status = 'ocupada' AND ends_at <= NOW(), 'disponible', status) AS estado,
            GREATEST(0, CEIL(TIMESTAMPDIFF(SECOND, NOW(), ends_at) / 60)) AS minutos
       FROM machines WHERE shop_id = ? ORDER BY code`, [local.id]);
  const productos = await consultar(
    'SELECT id, name AS nombre, type AS tipo, price AS precio, stock, icon AS icono FROM products WHERE shop_id = ? ORDER BY name',
    [local.id]);

  res.json({
    local: {
      nombre: local.name,
      direccion: local.address,
      zona: local.district,
      telefono: local.phone || '',
      horario: local.opening_hours || '',
      tiene_qr: !!local.qr_image,
      id: local.id,
    },
    resumen: {
      pedidos: Number(r!.pedidos), activos: Number(r!.activos), entregados: Number(r!.entregados),
      cancelados: Number(r!.cancelados), facturado: Number(r!.facturado), saldo: Number(r!.saldo),
      cobrado: cobros.reduce((s, c) => s + c.monto, 0), cobros,
    },
    servicios: await listarServicios(false),
    puede_tarifas: await administraTarifas(req.user!.id),
    pedidos: await listarPedidos('o.shop_id = ?', [local.id]),
    maquinas: maquinas.map((m) => ({ ...m, minutos: m.estado === 'ocupada' ? Number(m.minutos) : 0 })),
    productos: productos.map((p) => ({ ...p, precio: Number(p.precio) })),
  });
});

router.patch('/negocio/local', soloNegocio, async (req: AuthRequest, res) => {
  const local = await localDe(req.user!.id);
  const b = req.body ?? {};
  await ejecutar(
    'UPDATE laundry_shops SET name = ?, address = ?, district = ?, phone = ?, opening_hours = ? WHERE id = ?',
    [texto(b.nombre, 'nombre'), texto(b.direccion, 'dirección', 255), texto(b.zona, 'zona', 80),
      texto(b.telefono, 'teléfono', 40), texto(b.horario, 'horario', 80), local.id]);
  res.json({ ok: true });
});

// La ropa llego: se confirma el peso real, se recalcula el total y empieza el lavado
router.post('/negocio/pedidos/:id/pesar', soloNegocio, async (req: AuthRequest, res) => {
  const local = await localDe(req.user!.id);
  const id = Number(req.params.id);
  const cantidad = numero(req.body?.cantidad, 'La cantidad', 0.5, 100);
  await transaccion(async (conn) => {
    const [r] = await conn.query<any>(
      `UPDATE orders SET quantity = ?, subtotal = ROUND(? * unit_price + extras_total, 2),
                         total = ROUND(? * unit_price + extras_total, 2), status = 'EN_PROCESO'
        WHERE id = ? AND shop_id = ? AND status = 'EN_LAVANDERIA'`,
      [cantidad, cantidad, cantidad, id, local.id]);
    if (!r.affectedRows) throw new HttpError(409, 'Ese pedido no está esperando en la lavandería');
    await conn.query(
      `UPDATE order_items i JOIN orders o ON o.id = i.order_id
          SET i.quantity = o.quantity, i.weight_kg = IF(o.quote_type = 'por_kilo', o.quantity, NULL),
              i.subtotal = ROUND(o.quantity * i.unit_price, 2)
        WHERE o.id = ?`, [id]);
    await anotarHistorial(conn, id, 'EN_LAVANDERIA', 'EN_PROCESO', req.user!.id);
  });
  res.json({ estado: 'en_proceso' });
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
