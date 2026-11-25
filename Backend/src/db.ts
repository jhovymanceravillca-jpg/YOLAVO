import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Asegurar que dotenv está cargado antes de usar process.env aquí si se importa db directamente
// Pero el requisito dice que index.ts importa dotenv/config primero.
// Para ser robustos, verificamos variables aquí también o asumimos orden de carga.

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Falta variable de entorno: ${key}`);
  }
}

if (!process.env.DB_PORT) {
  process.env.DB_PORT = '3306';
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST!,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true, // CRÍTICO: Para que DECIMAL sea número, no string
});

export async function checkDbConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('Conexión a MySQL exitosa');
    conn.release();
  } catch (err) {
    console.error('Error al conectar a MySQL:', err);
    process.exit(1);
  }
}