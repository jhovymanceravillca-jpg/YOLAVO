import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { requiere } from '../auth.js';
import { listarPedidos } from '../pedidos.js';
import type { AuthRequest } from '../types.js';
import { consultar, HttpError, numero, texto, transaccion } from '../utils.js';

const router = Router();

// Tarifas en bolivianos. El total SIEMPRE se calcula en el servidor.
export const TARIFAS = { prenda: 12, suavizante: 3.5, express: 10 };

router.get('/tarifas', (_req, res) => {
  res.json(TARIFAS);
});

router.get('/negocios', requiere('cliente'), async (_req, res) => {
  const filas = await consultar(`
    SELECT s.*, (SELECT COUNT(*) FROM machines m WHERE m.shop_id = s.id
                  AND (m.status = 'disponible' OR (m.status = 'ocupada' AND m.ends_at <= NOW()))) AS libres
      FROM laundry_shops s WHERE s.active = 1 ORDER BY s.name`);
  res.json(filas.map((s) => ({
    id: s.id,
    nombre_negocio: s.name,
    direccion: s.address,
    distrito: s.district,
    precio_kilo: Number(s.price_per_kg),
    servicios: String(s.services_summary || '').split(',').map((x) => x.trim()).filter(Boolean),
    lavadoras_disponibles: Number(s.libres),
    icono: s.icon,
  })));
});

router.get('/cliente/pedidos', requiere('cliente'), async (req: AuthRequest, res) => {
  res.json(await listarPedidos('c.user_id = ?', [req.user!.id]));
});

router.post('/pedidos', requiere('cliente'), async (req: AuthRequest, res) => {
  const b = req.body ?? {};
  const tipo = b.tipo_cotizacion === 'por_prenda' ? 'por_prenda' : 'por_kilo';
  const cantidad = numero(b.cantidad, 'La cantidad', 1, 100);
  const direccion = texto(b.direccion, 'dirección', 255);
  const metodo = ['qr', 'efectivo', 'tarjeta'].includes(b.metodo_pago) ? b.metodo_pago : 'efectivo';
  const extras = [b.suavizante ? 'Con suavizante' : '', b.express ? 'Express' : ''];
  const notas = [...extras, String(b.notas ?? '').trim()].filter(Boolean).join('. ').slice(0, 1000);

  const [local] = await consultar(
    'SELECT id, price_per_kg FROM laundry_shops WHERE id = ? AND active = 1', [Number(b.negocio_id)]);
  if (!local) throw new HttpError(404, 'Lavandería no encontrada');
  const [cliente] = await consultar('SELECT id FROM customers WHERE user_id = ?', [req.user!.id]);
  if (!cliente) throw new HttpError(409, 'Tu cuenta no tiene ficha de cliente');

  const unitario = tipo === 'por_kilo' ? Number(local.price_per_kg) : TARIFAS.prenda;
  const total = cantidad * unitario
    + (b.suavizante ? TARIFAS.suavizante : 0)
    + (b.express ? TARIFAS.express : 0);
  const horas = b.express ? 3 : 24;

  const id = await transaccion(async (conn) => {
    const [nuevo] = await conn.query<any>(
      `INSERT INTO orders (order_code, customer_id, created_by, expected_delivery_at, subtotal, total, notes,
                           shop_id, quote_type, quantity, payment_method, pickup_address, delivery_address)
       VALUES (?, ?, ?, NOW() + INTERVAL ? HOUR, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [`YL-${randomUUID().slice(0, 12)}`, cliente.id, req.user!.id, horas, total, total, notas,
        local.id, tipo, cantidad, metodo, direccion, direccion]);
    await conn.query(
      `INSERT INTO order_status_history (order_id, new_status, changed_by) VALUES (?, 'RECIBIDO', ?)`,
      [nuevo.insertId, req.user!.id]);
    return nuevo.insertId as number;
  });

  const [pedido] = await listarPedidos('o.id = ?', [id]);
  res.status(201).json(pedido);
});

export default router;
