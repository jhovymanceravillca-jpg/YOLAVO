import 'dotenv/config';
import mysql from 'mysql2/promise';

for (const clave of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
  if (!process.env[clave]) throw new Error(`Falta variable de entorno: ${clave}`);
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  charset: 'utf8mb4',
  connectionLimit: 10,
  decimalNumbers: true,
});

export async function checkDbConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('Conexión a MySQL exitosa');
    conn.release();
  } catch (error) {
    console.error('Error al conectar a MySQL:', error);
    process.exit(1);
  }
}
