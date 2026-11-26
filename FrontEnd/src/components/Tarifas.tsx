import { useState, type FormEvent } from 'react';
import { api } from '../api';
import type { Servicio } from '../types';

interface Props {
  servicios: Servicio[];
  accion: (peticion: () => Promise<unknown>, mensaje: string) => Promise<boolean>;
}

const NUEVO = { nombre: '', unidad: 'PRENDA', precio: '' };
const UNIDAD = { PRENDA: 'por prenda', KILOGRAMO: 'por kilo', FIJO: 'precio fijo' };

export default function Tarifas({ servicios, accion }: Props) {
  const [precios, setPrecios] = useState<Record<number, string>>({});
  const [nuevo, setNuevo] = useState(NUEVO);

  const guardar = (s: Servicio, activo: boolean) =>
    accion(() => api.patch(`/negocio/servicios/${s.id}`, { precio: precios[s.id] ?? s.precio, activo }), `Tarifa de ${s.nombre} guardada`);

  const crear = async (e: FormEvent) => {
    e.preventDefault();
    if (await accion(() => api.post('/negocio/servicios', nuevo), 'Servicio creado')) setNuevo(NUEVO);
  };

  return (
    <>
      <div className="cards-grid">
        {servicios.map((s) => (
          <div key={s.id} className="card-base">
            <h4>{s.nombre}</h4>
            <p style={{ color: 'var(--text-muted)' }}>{s.extra ? 'adicional' : UNIDAD[s.unidad]}{s.activo ? '' : ' • oculto'}</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input className="input-field" style={{ width: 100 }} type="number" min="0.5" step="0.5" aria-label={`Precio de ${s.nombre}`}
                value={precios[s.id] ?? s.precio} onChange={(e) => setPrecios({ ...precios, [s.id]: e.target.value })} />
              <button className="btn-primary btn-sm" onClick={() => void guardar(s, s.activo)}>Guardar</button>
              <button className="btn-ghost btn-sm" onClick={() => void guardar(s, !s.activo)}>{s.activo ? 'Ocultar' : 'Mostrar'}</button>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={crear} style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '1rem' }}>
        <input className="input-field" style={{ width: 220 }} required placeholder="Nuevo servicio" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
        <select className="input-field" style={{ width: 160 }} value={nuevo.unidad} onChange={(e) => setNuevo({ ...nuevo, unidad: e.target.value })}>
          <option value="PRENDA">Por prenda</option>
          <option value="KILOGRAMO">Por kilo</option>
          <option value="FIJO">Precio fijo</option>
        </select>
        <input className="input-field" style={{ width: 120 }} type="number" min="0.5" step="0.5" required placeholder="Precio Bs" value={nuevo.precio} onChange={(e) => setNuevo({ ...nuevo, precio: e.target.value })} />
        <button className="btn-secondary btn-sm">➕ Agregar servicio</button>
      </form>
    </>
  );
}
