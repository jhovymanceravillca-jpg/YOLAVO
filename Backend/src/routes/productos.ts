import { Router, Response } from 'express';
import { pool } from '../db.js';
import { authenticate, requireRole } from '../auth.js';
import { AuthRequest, ProductoResponse } from '../types.js';

const router = Router();

// GET /api/negocio/productos (rol negocio)
router.get('/negocio/productos', authenticate, requireRole('STAFF'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Encontrar las lavanderías propiedad del usuario
    const [shopsRows] = await pool.query(
      'SELECT id FROM laundry_shops WHERE owner_id = ?',
      [userId]
    );
    const shopIds = (shopsRows as any[]).map(s => s.id);

    if (shopIds.length === 0) {
      res.json([]);
      return;
    }

    const placeholders = shopIds.map(() => '?').join(',');

    const [productsRows] = await pool.query(`
      SELECT 
        id, 
        name AS nombre, 
        type AS tipo, 
        price AS precio, 
        stock, 
        icon 
      FROM products 
      WHERE shop_id IN (${placeholders})
    `, shopIds);

    const productos: ProductoResponse[] = (productsRows as any[]).map((row) => ({
      id: row.id,
      nombre: row.nombre,
      tipo: row.tipo,
      precio: Number(row.precio),
      stock: Number(row.stock),
      icono: row.icon || '🧴',
    }));

    res.json(productos);
  } catch (error) {
    console.error('Error en productos:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

export default router;