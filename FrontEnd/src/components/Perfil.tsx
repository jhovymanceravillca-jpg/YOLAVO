import { useState, type FormEvent } from 'react';
import { api, mensajeError } from '../api';
import type { Avisar, Usuario } from '../types';

interface Props {
  usuario: Usuario;
  alCerrar: () => void;
  alGuardar: (u: Usuario) => void;
  avisar: Avisar;
}

export default function Perfil({ usuario, alCerrar, alGuardar, avisar }: Props) {
  const [form, setForm] = useState({ nombre: usuario.nombre, telefono: usuario.telefono, direccion: usuario.direccion });

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.patch<Usuario>('/perfil', form);
      alGuardar(res.data);
      avisar('Datos actualizados', '✅');
    } catch (error) {
      avisar(mensajeError(error), '⚠️');
    }
  };

  return (
    <div className="modal-overlay" onClick={alCerrar}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: '1.25rem' }}>Mis datos</h2>
        <form onSubmit={guardar}>
          {([['nombre', 'Nombre completo'], ['telefono', 'Celular'], ['direccion', 'Dirección']] as const).map(([clave, etiqueta]) => (
            <div key={clave} className="form-group">
              <label className="form-label" htmlFor={`perfil-${clave}`}>{etiqueta}</label>
              <input id={`perfil-${clave}`} className="input-field" required value={form[clave]} onChange={(e) => setForm({ ...form, [clave]: e.target.value })} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button className="btn-primary" style={{ flex: 1 }}>Guardar</button>
            <button type="button" className="btn-ghost" onClick={alCerrar}>Cerrar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
