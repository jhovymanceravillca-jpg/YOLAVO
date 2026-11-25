import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { authenticate, requireRole } from '../auth.js';
import { LaundryShopResponse } from '../types.js';

const router = Router();

// GET /api/negocios (rol cliente)
router.get('/negocios', authenticate, requireRole('CLIENT'), async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id, 
        name AS nombre_negocio, 
        address AS direccion, 
        district AS distrito, 
        rating AS puntaje, 
        reviews_count AS total_resenas, 
        price_per_kg AS precio_kilo, 
        services_summary, 
        available_washers AS lavadoras_disponibles, 
        icon AS icono, 
        delivery_time AS tiempo_entrega 
      FROM laundry_shops 
      WHERE active = 1
    `);

    const shops = rows as any[];

    const response: LaundryShopResponse[] = shops.map((shop) => {
      // Procesar servicios: separar por comas si existe, sino array vacío
      let servicios: string[] = [];
      if (shop.services_summary && shop.services_summary.trim() !== '') {
        servicios = shop.services_summary.split(',').map((s: string) => s.trim());
      }

      return {
        id: shop.id,
        nombre_negocio: shop.nombre_negocio,
        direccion: shop.direccion || '',
        distrito: shop.distrito || '',
        distancia: '—', // Según contrato
        puntaje: Number(shop.puntaje) || 0,
        total_resenas: Number(shop.total_resenas) || 0,
        precio_kilo: Number(shop.precio_kilo) || 0,
        servicios: servicios,
        lavadoras_disponibles: Number(shop.lavadoras_disponibles) || 0,
        icono: shop.icono || '🧺',
        tiempo_entrega: shop.tiempo_entrega || '30-45 min',
      };
    });

    res.json(response);
  } catch (error) {
    console.error('Error obteniendo negocios:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

export default router;