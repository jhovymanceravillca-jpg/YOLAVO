import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { requiere } from '../auth.js';
import { anotarHistorial, listarPedidos } from '../pedidos.js';
import type { AuthRequest } from '../types.js';
import { consultar, HttpError, numero, texto, transaccion } from '../utils.js';

const router = Router();

router.get('/negocios', requiere('cliente'), async (_req, res) => {
  const filas = await consultar(`
    SELECT s.*, (SELECT MIN(base_price) FROM services
                  WHERE unit_type = 'KILOGRAMO' AND active = 1 AND is_extra = 0) AS kilo, (SELECT COUNT(*) FROM machines m WHERE m.shop_id = s.id
                  AND (m.status = 'disponible' OR (m.status = 'ocupada' AND m.ends_at <= NOW()))) AS libres
      FROM laundry_shops s WHERE s.active = 1 ORDER BY s.name`);
  res.json(filas.map((s) => ({
    id: s.id,
    nombre_negocio: s.name,
    direccion: s.address,
    distrito: s.district,
    telefono: s.phone || '',
    horario: s.opening_hours || '',
    puntaje: Number(s.rating),
    total_resenas: Number(s.reviews_count),
    precio_kilo: Number(s.kilo ?? 0),
    servicios: String(s.services_summary || '').split(',').map((x) => x.trim()).filter(Boolean),
    lavadoras_disponibles: Number(s.libres),
    icono: s.icon,
  })));
});

router.get('/cliente/pedidos', requiere('cliente'), async (req: AuthRequest, res) => {
  res.json(await listarPedidos('c.user_id = ?', [req.user!.id]));
});

// El total SIEMPRE se calcula en el servidor con los precios de la tabla services
router.post('/pedidos', requiere('cliente'), async (req: AuthRequest, res) => {
  const b = req.body ?? {};
  const [servicio] = await consultar(
    'SELECT * FROM services WHERE id = ? AND active = 1 AND is_extra = 0', [Number(b.servicio_id)]);
  if (!servicio) throw new HttpError(400, 'Elige un servicio');
  const tipo = servicio.unit_type === 'KILOGRAMO' ? 'por_kilo' : servicio.unit_type === 'PRENDA' ? 'por_prenda' : 'fijo';
  const cantidad = tipo === 'fijo' ? 1 : numero(b.cantidad, 'La cantidad', 1, 100);
  const modalidad = b.modalidad === 'local' ? 'local' : 'domicilio';

  let direccion = '';
  let referencia = '';
  if (modalidad === 'domicilio') {
    const zona = texto(b.zona, 'zona', 60);
    direccion = `${texto(b.direccion, 'dirección', 190)}, ${zona}`;
    referencia = texto(b.referencia, 'referencia', 255);
  }
  const metodo = ['qr', 'efectivo', 'tarjeta', 'transferencia'].includes(b.metodo_pago) ? b.metodo_pago : 'efectivo';
  const notas = String(b.notas ?? '').trim().slice(0, 1000);

  const ids = Array.isArray(b.extras) ? b.extras.map(Number) : [];
  const extras = ids.length
    ? await consultar('SELECT name, base_price FROM services WHERE id IN (?) AND active = 1 AND is_extra = 1', [ids])
    : [];
  const cargos = extras.reduce((suma, x) => suma + Number(x.base_price), 0);
  const unitario = Number(servicio.base_price);
  const total = Math.round((cantidad * unitario + cargos) * 100) / 100;
  const nombresExtras = extras.map((x) => x.name).join(', ');

  const [local] = await consultar(
    'SELECT id FROM laundry_shops WHERE id = ? AND active = 1', [Number(b.negocio_id)]);
  if (!local) throw new HttpError(404, 'Lavandería no encontrada');
  const [cliente] = await consultar('SELECT id FROM customers WHERE user_id = ?', [req.user!.id]);
  if (!cliente) throw new HttpError(409, 'Tu cuenta no tiene ficha de cliente');

  const [prenda] = await consultar(
    tipo === 'por_kilo'
      ? `SELECT id FROM garment_types WHERE name = 'Ropa por kilo'`
      : 'SELECT id FROM garment_types WHERE id = ?',
    [Number(b.prenda_id)]);
  if (!prenda) throw new HttpError(400, 'Elige el tipo de prenda');

  const id = await transaccion(async (conn) => {
    const [nuevo] = await conn.query<any>(
      'INSERT INTO orders SET ?, expected_delivery_at = NOW() + INTERVAL 24 HOUR',
      [{
        order_code: `YL-${randomUUID().slice(0, 12)}`,
        customer_id: cliente.id,
        created_by: req.user!.id,
        shop_id: local.id,
        service_id: servicio.id,
        service_name: servicio.name,
        extras_names: nombresExtras,
        extras_total: cargos,
        unit_price: unitario,
        quote_type: tipo,
        quantity: cantidad,
        subtotal: total,
        total,
        notes: notas,
        payment_method: metodo,
        delivery_mode: modalidad,
        delivery_fee: modalidad === 'local' ? 0 : 8,
        pickup_address: direccion,
        delivery_address: direccion,
        pickup_reference: referencia,
      }]);
    await conn.query('INSERT INTO order_items SET ?', [{
      order_id: nuevo.insertId,
      garment_type_id: prenda.id,
      service_id: servicio.id,
      quantity: cantidad,
      weight_kg: tipo === 'por_kilo' ? cantidad : null,
      unit_price: unitario,
      subtotal: Math.round(cantidad * unitario * 100) / 100,
    }]);
    await anotarHistorial(conn, nuevo.insertId, null, 'RECIBIDO', req.user!.id);
    return nuevo.insertId as number;
  });

  const [pedido] = await listarPedidos('o.id = ?', [id]);
  res.status(201).json(pedido);
});

router.post('/pedidos/:id/calificar', requiere('cliente'), async (req: AuthRequest, res) => {
  const estrellas = Math.round(numero(req.body?.estrellas, 'La calificación', 1, 5));
  const comentario = String(req.body?.comentario ?? '').trim().slice(0, 255);
  await transaccion(async (conn) => {
    const [filas] = await conn.query<any[]>(
      `SELECT o.shop_id FROM orders o JOIN customers c ON c.id = o.customer_id
        WHERE o.id = ? AND c.user_id = ? AND o.status = 'ENTREGADO' AND o.rating IS NULL FOR UPDATE`,
      [Number(req.params.id), req.user!.id]);
    if (!filas[0]) throw new HttpError(409, 'Ese pedido no se puede calificar');
    await conn.query('UPDATE orders SET rating = ?, review = ? WHERE id = ?',
      [estrellas, comentario, Number(req.params.id)]);
    await conn.query(
      `UPDATE laundry_shops SET
         rating = (SELECT AVG(rating) FROM orders WHERE shop_id = ? AND rating IS NOT NULL),
         reviews_count = (SELECT COUNT(rating) FROM orders WHERE shop_id = ?)
       WHERE id = ?`,
      [filas[0].shop_id, filas[0].shop_id, filas[0].shop_id]);
  });
  res.status(201).json({ estrellas });
});

export default router;
