import { useState, type FormEvent } from 'react';
import { api, mensajeError } from '../api';
import { ZONAS } from '../formato';
import type { Avisar, Rol, Usuario } from '../types';
import { SelectorZona } from './Comunes';

interface Props {
  alCerrar: () => void;
  alEntrar: (usuario: Usuario, token: string) => void;
  avisar: Avisar;
}

const INICIAL = {
  nombre_completo: '', usuario: '', correo: '', contrasena: '', contrasena2: '',
  telefono: '', direccion: '', nombre_negocio: '',
};

const ROLES: [Rol, string][] = [['cliente', '🧺 Cliente'], ['negocio', '🏪 Negocio'], ['delivery', '🛵 Delivery']];

export default function AuthModal({ alCerrar, alEntrar, avisar }: Props) {
  const [registro, setRegistro] = useState(false);
  const [rol, setRol] = useState<Rol>('cliente');
  const [form, setForm] = useState(INICIAL);
  const [zona, setZona] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const res = await api.post(registro ? '/registro' : '/login', { ...form, rol, zona });
      alEntrar(res.data.user, res.data.token);
    } catch (error) {
      avisar(mensajeError(error), '⚠️');
      setEnviando(false);
    }
  };

  const campo = (clave: keyof typeof INICIAL, etiqueta: string, tipo = 'text', ejemplo = '') => (
    <div className="form-group">
      <label className="form-label" htmlFor={clave}>{etiqueta}</label>
      <input id={clave} className="input-field" type={tipo} required placeholder={ejemplo}
        value={form[clave]} onChange={(e) => setForm({ ...form, [clave]: e.target.value })} />
    </div>
  );

  return (
    <div className="modal-overlay" onClick={alCerrar}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem' }}>🧺</div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 900 }}>{registro ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
        </div>

        <form onSubmit={enviar}>
          {registro && (
            <>
              <div className="form-group">
                <span className="form-label">¿Qué eres?</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {ROLES.map(([valor, nombre]) => (
                    <button key={valor} type="button" className={rol === valor ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'} onClick={() => setRol(valor)}>
                      {nombre}
                    </button>
                  ))}
                </div>
              </div>
              {campo('nombre_completo', 'Nombre completo', 'text', 'Nombre y apellido')}
              {rol === 'negocio' && campo('nombre_negocio', 'Nombre de la lavandería', 'text', 'Nombre de tu lavandería')}
              {campo('usuario', 'Usuario', 'text', 'usuario')}
              {campo('telefono', 'Celular', 'tel', '70012345')}
              {campo('direccion', 'Dirección', 'text', 'Calle y número')}
              {rol === 'negocio' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="zona">Zona</label>
                  <SelectorZona id="zona" valor={zona} cambiar={setZona} zonas={ZONAS} />
                </div>
              )}
            </>
          )}
          {campo('correo', 'Correo electrónico', 'email', 'correo@ejemplo.com')}
          {campo('contrasena', 'Contraseña', 'password')}
          {registro && campo('contrasena2', 'Confirmar contraseña', 'password')}

          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={enviando}>
            {enviando ? 'Un momento…' : registro ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setRegistro(!registro)}>
            {registro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  );
}
