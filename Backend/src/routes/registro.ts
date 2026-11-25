import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { hashPassword } from '../auth.js';
import { RegisterBody, User } from '../types.js';

const router = Router();

router.post('/registro', async (req: Request, res: Response) => {
  const conn = await pool.getConnection();
  
  try {
    const { 
      nombre_completo, 
      usuario, 
      correo, 
      contrasena, 
      contrasena2, 
      rol, 
      telefono, 
      direccion 
    }: RegisterBody = req.body;

    // Validaciones básicas
    if (!nombre_completo || !usuario || !correo || !contrasena || !contrasena2 || !rol) {
      res.status(400).json({ message: 'Faltan datos obligatorios' });
      return;
    }

    if (contrasena !== contrasena2) {
      res.status(400).json({ message: 'Las contraseñas no coinciden' });
      return;
    }

    // Validar rol permitido
    const allowedRoles = ['cliente', 'negocio', 'delivery'];
    if (!allowedRoles.includes(rol.toLowerCase())) {
      res.status(400).json({ message: 'Rol no válido. Solo cliente, negocio o delivery.' });
      return;
    }

    // Mapear rol frontend a DB
    let dbRole: string;
    switch (rol.toLowerCase()) {
      case 'cliente':
        dbRole = 'CLIENT';
        break;
      case 'negocio':
        dbRole = 'STAFF';
        break;
      case 'delivery':
        dbRole = 'DELIVERY';
        break;
      default:
        res.status(400).json({ message: 'Rol inválido' });
        return;
    }

    await conn.beginTransaction();

    // Verificar duplicados
    const [existingUsers] = await conn.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [correo, usuario]
    );

    if ((existingUsers as any[]).length > 0) {
      await conn.rollback();
      res.status(409).json({ message: 'El correo o usuario ya existe' });
      return;
    }

    // Hash contraseña
    const passwordHash = await hashPassword(contrasena);

    // Insertar Usuario
    const [insertResult] = await conn.query(
      'INSERT INTO users (full_name, email, username, password_hash, role, phone, address, active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      [nombre_completo, correo, usuario, passwordHash, dbRole, telefono || null, direccion || null]
    );

    const userId = (insertResult as any).insertId;

    // Si es cliente, crear fila en customers
    if (dbRole === 'CLIENT') {
      // Dividir nombre completo para first_name y last_name
      const nameParts = nombre_completo.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await conn.query(
        'INSERT INTO customers (first_name, last_name, phone, address, email, user_id) VALUES (?, ?, ?, ?, ?, ?)',
        [firstName, lastName, telefono || null, direccion || null, correo, userId]
      );
    }

    await conn.commit();

    const newUser: User = {
      id: userId,
      nombre: nombre_completo,
      nombre_completo: nombre_completo,
      usuario: usuario,
      correo: correo,
      rol: dbRole as any,
      telefono: telefono || '',
      direccion: direccion || '',
    };

    res.status(201).json(newUser);

  } catch (error) {
    await conn.rollback();
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error al registrar usuario' });
  } finally {
    conn.release();
  }
});

export default router;