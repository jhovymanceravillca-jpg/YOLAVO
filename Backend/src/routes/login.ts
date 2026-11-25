import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { verifyPassword, generateToken } from '../auth.js';
import { LoginBody, User } from '../types.js';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { correo, contrasena, rol }: LoginBody = req.body;

    if (!correo || !contrasena || !rol) {
      res.status(400).json({ message: 'Correo, contraseña y rol son requeridos' });
      return;
    }

    // Buscar usuario por correo
    const [rows] = await pool.query(
      'SELECT id, full_name, username, email, password_hash, role, phone, address, active FROM users WHERE email = ?',
      [correo]
    );

    const users = rows as any[];
    if (users.length === 0) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    const dbUser = users[0];

    // Verificar si está activo
    if (!dbUser.active) {
      res.status(401).json({ message: 'Usuario inactivo' });
      return;
    }

    // Verificar contraseña
    const isMatch = await verifyPassword(contrasena, dbUser.password_hash);
    if (!isMatch) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    // Mapear rol frontend a rol base de datos
    let expectedDbRole: string;
    switch (rol.toLowerCase()) {
      case 'cliente':
        expectedDbRole = 'CLIENT';
        break;
      case 'negocio':
        expectedDbRole = 'STAFF'; // El documento dice STAFF y ADMIN=negocio, pero login suele ser STAFF para dueños/cajeros. 
                                  // Revisando contrato: "rol solo puede ser cliente, negocio (STAFF) o delivery".
                                  // Si el usuario registrado es ADMIN, ¿puede entrar como negocio? 
                                  // La instrucción dice: "403 si rol no coincide".
                                  // Asumiremos que 'negocio' acepta STAFF o ADMIN? 
                                  // Mejor seguir estrictamente: Frontend manda 'negocio'. Backend espera STAFF o ADMIN?
                                  // El registro dice: "rol solo puede ser cliente, negocio (STAFF) o delivery. Nunca ADMIN."
                                  // Entonces un usuario registrado como 'negocio' tiene rol STAFF en DB.
                                  // Un usuario registrado como 'admin' (si existiera vía seed) tendría ADMIN.
                                  // Si el frontend pide 'negocio', debe coincidir con STAFF.
        expectedDbRole = 'STAFF';
        break;
      case 'delivery':
        expectedDbRole = 'DELIVERY';
        break;
      default:
        res.status(400).json({ message: 'Rol no válido' });
        return;
    }

    // Verificar coincidencia de rol
    // Nota: Si el usuario en DB es ADMIN y intenta entrar como 'negocio' (STAFF), fallará según la lógica estricta de roles únicos.
    // Sin embargo, usualmente ADMIN tiene permisos superiores. Pero el contrato dice "403 si rol no coincide".
    // Vamos a comparar exactamente lo esperado.
    if (dbUser.role !== expectedDbRole) {
       // Excepción posible: Si alguien quiere entrar como negocio pero es Admin? 
       // El doc no lo especifica claramente para login, solo para registro.
       // Para seguridad, mantengamos la comparación estricta salvo que ADMIN pueda actuar como negocio.
       // Dado que el seed crea 'caja@yolavo.com' con rol STAFF (implícito en migración/update? No, update sets password, insert sets role CLIENT/DELIVERY. Seed original probablemente tenía roles).
       // Asumamos comparación estricta.
       res.status(403).json({ message: 'El rol seleccionado no coincide con la cuenta' });
       return;
    }

    const user: User = {
      id: dbUser.id,
      nombre: dbUser.full_name,
      nombre_completo: dbUser.full_name,
      usuario: dbUser.username || dbUser.email.split('@')[0],
      correo: dbUser.email,
      rol: dbUser.role,
      telefono: dbUser.phone || '',
      direccion: dbUser.address || '',
    };

    const token = generateToken(user);

    // El frontend espera 'cliente' | 'negocio' | 'delivery', no el rol de la base
    res.status(200).json({ token, user: { ...user, rol: rol.toLowerCase() } });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

export default router;