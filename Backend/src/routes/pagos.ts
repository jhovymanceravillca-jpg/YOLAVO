// Tarifas, QR de cobro y pagos. No hay pasarela: la lavanderia verifica y registra cada pago.
import { Router } from 'express';
import { requiere } from '../auth.js';
import type { AuthRequest } from '../types.js';
import { consultar, ejecutar, HttpError, numero, texto, transaccion } from '../utils.js';

const router = Router();
const UNIDADES = ['PRENDA', 'KILOGRAMO', 'FIJO'];

export async function listarServicios(soloActivos = true) {
  const filas = await consultar(
    `SELECT id, name AS nombre, unit_type AS unidad, base_price AS precio, active AS activo, is_extra AS extra
       FROM services ${soloActivos ? 'WHERE active = 1' : ''} ORDER BY is_extra, id`);
  return filas.map((s) => ({ ...s, precio: Number(s.precio), activo: !!s.activo, extra: !!s.extra }));
}

router.get('/servicios', requiere(), async (_req, res) => {
  const prendas = await consultar(
    `SELECT id, name AS nombre FROM garment_types WHERE active = 1 AND name <> 'Ropa por kilo' ORDER BY id`);
  res.json({ servicios: await listarServicios(), prendas });
});

/** El catalogo es de la lavanderia principal (alcance: un solo establecimiento) */
export async function administraTarifas(userId: number) {
  const [principal] = await consultar('SELECT owner_id FROM laundry_shops WHERE active = 1 ORDER BY id LIMIT 1');
  return principal?.owner_id === userId;
}

async function exigirTarifas(userId: number) {
  if (!(await administraTarifas(userId))) throw new HttpError(403, 'Solo la lavandería principal edita las tarifas');
}

router.patch('/negocio/servicios/:id', requiere('negocio'), async (req: AuthRequest, res) => {
  await exigirTarifas(req.user!.id);
  const precio = numero(req.body?.precio, 'El precio', 0.5, 1000);
  const r = await ejecutar('UPDATE services SET base_price = ?, active = ? WHERE id = ?',
    [precio, req.body?.activo === false ? 0 : 1, Number(req.params.id)]);
  if (!r.affectedRows) throw new HttpError(404, 'Servicio no encontrado');
  res.json({ ok: true });
});

router.post('/negocio/servicios', requiere('negocio'), async (req: AuthRequest, res) => {
  await exigirTarifas(req.user!.id);
  const nombre = texto(req.body?.nombre, 'nombre', 100);
  const unidad = String(req.body?.unidad);
  if (!UNIDADES.includes(unidad)) throw new HttpError(400, 'Forma de cobro no válida');
  const precio = numero(req.body?.precio, 'El precio', 0.5, 1000);
  const [repetido] = await consultar('SELECT id FROM services WHERE name = ?', [nombre]);
  if (repetido) throw new HttpError(409, 'Ya existe un servicio con ese nombre');
  const r = await ejecutar('INSERT INTO services (name, unit_type, base_price) VALUES (?, ?, ?)',
    [nombre, unidad, precio]);
  res.status(201).json({ id: r.insertId });
});

router.put('/negocio/qr', requiere('negocio'), async (req: AuthRequest, res) => {
  const imagen = String(req.body?.imagen ?? '');
  if (!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(imagen)) {
    throw new HttpError(400, 'Sube una imagen PNG o JPG');
  }
  if (imagen.length > 1_500_000) throw new HttpError(400, 'La imagen es muy grande (máximo 1 MB)');
  await ejecutar('UPDATE laundry_shops SET qr_image = ? WHERE owner_id = ?', [imagen, req.user!.id]);
  res.json({ ok: true });
});

router.get('/negocios/:id/qr', requiere(), async (req, res) => {
  const [local] = await consultar('SELECT qr_image FROM laundry_shops WHERE id = ?', [Number(req.params.id)]);
  res.json({ imagen: local?.qr_image ?? null });
});

// El cliente avisa que pago (numero de comprobante); NO cuenta como pagado hasta que se verifique
router.post('/pedidos/:id/aviso-pago', requiere('cliente'), async (req: AuthRequest, res) => {
  const referencia = texto(req.body?.referencia, 'número de comprobante', 100);
  const r = await ejecutar(
    `UPDATE orders o JOIN customers c ON c.id = o.customer_id
        SET o.payment_note = ? WHERE o.id = ? AND c.user_id = ? AND o.status <> 'CANCELADO'`,
    [referencia, Number(req.params.id), req.user!.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Pedido no encontrado');
  res.json({ ok: true });
});

router.post('/pedidos/:id/pagos', requiere('negocio'), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const monto = Math.round(numero(req.body?.monto, 'El monto', 0.01, 100000) * 100) / 100;
  const metodo = String(req.body?.metodo).toUpperCase();
  if (!['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'QR'].includes(metodo)) throw new HttpError(400, 'Método no válido');
  const referencia = String(req.body?.referencia ?? '').trim().slice(0, 120) || null;

  await transaccion(async (conn) => {
    const [filas] = await conn.query<any[]>(
      `SELECT o.total FROM orders o JOIN laundry_shops s ON s.id = o.shop_id
        WHERE o.id = ? AND s.owner_id = ? AND o.status <> 'CANCELADO' FOR UPDATE`, [id, req.user!.id]);
    if (!filas[0]) throw new HttpError(404, 'Pedido no encontrado');
    const [sumas] = await conn.query<any[]>(
      'SELECT COALESCE(SUM(amount), 0) AS pagado FROM payments WHERE order_id = ? AND voided_at IS NULL', [id]);
    const saldo = Math.round((Number(filas[0].total) - Number(sumas[0].pagado)) * 100) / 100;
    if (monto > saldo) throw new HttpError(409, `El monto supera el saldo (Bs ${saldo.toFixed(2)})`);
    await conn.query(
      'INSERT INTO payments (order_id, amount, payment_method, reference, created_by) VALUES (?, ?, ?, ?, ?)',
      [id, monto, metodo, referencia, req.user!.id]);
    await conn.query('UPDATE orders SET payment_note = NULL WHERE id = ?', [id]);
  });
  res.status(201).json({ ok: true });
});

export default router;
