import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from './db.js';

/** Error con codigo HTTP; Express 5 lo envia al manejador global. */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function consultar(sql: string, params: unknown[] = []): Promise<RowDataPacket[]> {
  const [filas] = await pool.query<RowDataPacket[]>(sql, params);
  return filas;
}

export async function ejecutar(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
  const [resultado] = await pool.query<ResultSetHeader>(sql, params);
  return resultado;
}

export async function transaccion<T>(trabajo: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await trabajo(conn);
    await conn.commit();
    return resultado;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export function texto(valor: unknown, campo: string, max = 120): string {
  const limpio = typeof valor === 'string' ? valor.trim() : '';
  if (!limpio) throw new HttpError(400, `Falta el campo: ${campo}`);
  if (limpio.length > max) throw new HttpError(400, `El campo ${campo} es demasiado largo`);
  return limpio;
}

export function numero(valor: unknown, campo: string, min: number, max: number): number {
  const n = Number(valor);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new HttpError(400, `${campo} debe estar entre ${min} y ${max}`);
  }
  return n;
}
