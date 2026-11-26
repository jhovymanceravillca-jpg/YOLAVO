import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { aSesion, generarToken, requiere } from '../auth.js';
import type { AuthRequest } from '../types.js';
import { consultar, HttpError, texto, transaccion } from '../utils.js';

const router = Router();

// El rol lo decide la cuenta, no el usuario al ingresar
router.post('/login', async (req, res) => {
  const correo = texto(req.body?.correo, 'correo', 190);
  const contrasena = texto(req.body?.contrasena, 'contraseña');
  const [fila] = await consultar('SELECT * FROM users WHERE email = ? AND active = 1', [correo]);
  if (!fila || !(await bcrypt.compare(contrasena, fila.password_hash))) {
    throw new HttpError(401, 'Correo o contraseña incorrectos');
  }
  res.json({ token: generarToken(fila.id), user: aSesion(fila) });
});

router.get('/sesion', requiere(), (req: AuthRequest, res) => {
  res.json(req.user);
});

const ROLES_DB: Record<string, string> = { cliente: 'CLIENT', negocio: 'STAFF', delivery: 'DELIVERY' };

router.post('/registro', async (req, res) => {
  const b = req.body ?? {};
  const nombre = texto(b.nombre_completo, 'nombre completo');
  const usuario = texto(b.usuario, 'usuario', 60);
  const correo = texto(b.correo, 'correo', 190);
  const telefono = texto(b.telefono, 'teléfono', 40);
  const direccion = texto(b.direccion, 'dirección', 255);
  const contrasena = texto(b.contrasena, 'contraseña', 72);
  const rol = ROLES_DB[String(b.rol)];
  if (!rol) throw new HttpError(400, 'Rol no válido');
  if (contrasena.length < 6) throw new HttpError(400, 'La contraseña debe tener al menos 6 caracteres');
  if (contrasena !== b.contrasena2) throw new HttpError(400, 'Las contraseñas no coinciden');
  const nombreLocal = rol === 'STAFF' ? texto(b.nombre_negocio, 'nombre de la lavandería') : '';
  const hash = await bcrypt.hash(contrasena, 10);

  const id = await transaccion(async (conn) => {
    const [repetidos] = await conn.query<any[]>(
      'SELECT id FROM users WHERE email = ? OR username = ?', [correo, usuario]);
    if (repetidos.length) throw new HttpError(409, 'Ese correo o usuario ya está registrado');

    const [nuevo] = await conn.query<any>(
      `INSERT INTO users (full_name, email, username, password_hash, role, phone, address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre, correo, usuario, hash, rol, telefono, direccion]);

    if (rol === 'CLIENT') {
      const [primero = '', ...resto] = nombre.split(/\s+/);
      await conn.query(
        'INSERT INTO customers (first_name, last_name, phone, address, email, user_id) VALUES (?, ?, ?, ?, ?, ?)',
        [primero, resto.join(' '), telefono, direccion, correo, nuevo.insertId]);
    }
    if (rol === 'STAFF') {
      // Coordenadas del centro de La Paz como valor inicial
      await conn.query(
        `INSERT INTO laundry_shops (name, address, phone, latitude, longitude, services_summary, owner_id,
                                    district, price_per_kg)
         VALUES (?, ?, ?, -16.4955, -68.1336, 'Por Kilo,Por Prenda', ?, 'La Paz', 10)`,
        [nombreLocal, direccion, telefono, nuevo.insertId]);
    }
    return nuevo.insertId as number;
  });

  const [fila] = await consultar('SELECT * FROM users WHERE id = ?', [id]);
  res.status(201).json({ token: generarToken(id), user: aSesion(fila!) });
});

export default router;
