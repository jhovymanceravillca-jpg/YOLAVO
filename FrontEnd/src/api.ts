import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

// Se puede cambiar con VITE_API_URL en un archivo .env del frontend
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api',
  timeout: 10000,
});

// sessionStorage: cada pestaña puede tener una cuenta distinta (útil para la demostración)
export const CLAVE_TOKEN = 'yolavo_token';

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(CLAVE_TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function mensajeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? 'No hay conexión con el servidor';
  }
  return 'Ocurrió un error inesperado';
}

/** Carga datos del servidor y los refresca cada 4 segundos */
export function useDatos<T>(ruta: string) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState('');

  const recargar = useCallback(async () => {
    try {
      const res = await api.get<T>(ruta);
      setDatos(res.data);
      setError('');
    } catch (e) {
      setError(mensajeError(e));
    }
  }, [ruta]);

  useEffect(() => {
    void recargar();
    const intervalo = setInterval(() => void recargar(), 4000);
    return () => clearInterval(intervalo);
  }, [recargar]);

  return { datos, error, recargar };
}
