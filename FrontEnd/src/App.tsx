import { useEffect, useRef, useState } from 'react';
import { api, CLAVE_TOKEN, mensajeError } from './api';
import AuthModal from './components/AuthModal';
import Cliente from './components/Cliente';
import Delivery from './components/Delivery';
import Explorar from './components/Explorar';
import Negocio from './components/Negocio';
import Perfil from './components/Perfil';
import type { Estado, Usuario } from './types';
import './App.css';

const PANEL = { cliente: '🧺 Mi panel', negocio: '🏪 Mi lavandería', delivery: '🛵 Mis carreras' };

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [enInicio, setEnInicio] = useState(false);
  const [modal, setModal] = useState(false);
  const [perfil, setPerfil] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; icono: string } | null>(null);
  const temporizador = useRef<number | undefined>(undefined);

  const avisar = (texto: string, icono = '✨') => {
    window.clearTimeout(temporizador.current);
    setAviso({ texto, icono });
    temporizador.current = window.setTimeout(() => setAviso(null), 3500);
  };

  // Al recargar la pagina, el servidor confirma que la sesion sigue siendo valida
  useEffect(() => {
    if (!sessionStorage.getItem(CLAVE_TOKEN)) return;
    api.get<Usuario>('/sesion')
      .then((res) => setUsuario(res.data))
      .catch(() => sessionStorage.removeItem(CLAVE_TOKEN));
  }, []);

  const entrar = (nuevo: Usuario, token: string) => {
    sessionStorage.setItem(CLAVE_TOKEN, token);
    setUsuario(nuevo);
    setEnInicio(false);
    setModal(false);
    avisar(`¡Bienvenido, ${nuevo.nombre}!`, '👋');
  };

  const salir = () => {
    sessionStorage.removeItem(CLAVE_TOKEN);
    setUsuario(null);
    avisar('Sesión cerrada', '🚪');
  };

  const cambiarEstado = async (id: number, estado: Estado) => {
    try {
      await api.patch(`/pedidos/${id}/estado`, { estado });
      avisar(`Pedido #${id} actualizado`, '🔄');
    } catch (error) {
      avisar(mensajeError(error), '⚠️');
    }
  };

  const mostrarInicio = !usuario || enInicio;
  const comunes = { avisar, cambiarEstado };

  return (
    <div className="app-wrapper">
      {aviso && (
        <div className="toast-notification" role="status">
          <span style={{ fontSize: '1.4rem' }}>{aviso.icono}</span>
          <strong>{aviso.texto}</strong>
        </div>
      )}

      <header className="header-nav">
        <div className="brand-container" onClick={() => setEnInicio(true)}>
          <div className="brand-icon-wrapper"><span>🧺</span></div>
          <div className="brand-title">YO<span>LAVO</span></div>
        </div>

        {usuario && (
          <nav className="role-switcher-toolbar">
            <button className={`role-tab-btn ${enInicio ? 'active' : ''}`} onClick={() => setEnInicio(true)}>✨ Inicio</button>
            <button className={`role-tab-btn ${enInicio ? '' : 'active'}`} onClick={() => setEnInicio(false)}>{PANEL[usuario.rol]}</button>
          </nav>
        )}

        <div className="nav-actions">
          {usuario ? (
            <div className="user-pill">
              <div className="user-avatar">{usuario.nombre.charAt(0)}</div>
              <button className="boton-perfil" title="Editar mis datos" onClick={() => setPerfil(true)}>
                <span className="user-name">{usuario.nombre} ✏️</span>
                <span className="user-role-badge">Rol: {usuario.rol}</span>
              </button>
              <button className="btn-danger btn-sm" onClick={salir}>✕ Salir</button>
            </div>
          ) : (
            <button className="btn-primary btn-sm" onClick={() => setModal(true)}>🔐 Ingresar / Registrarse</button>
          )}
        </div>
      </header>

      {mostrarInicio && <Explorar alEmpezar={() => (usuario ? setEnInicio(false) : setModal(true))} />}
      {!mostrarInicio && usuario?.rol === 'cliente' && <Cliente usuario={usuario} {...comunes} />}
      {!mostrarInicio && usuario?.rol === 'negocio' && <Negocio {...comunes} />}
      {!mostrarInicio && usuario?.rol === 'delivery' && <Delivery usuario={usuario} {...comunes} />}

      {modal && !usuario && <AuthModal alCerrar={() => setModal(false)} alEntrar={entrar} avisar={avisar} />}

      {perfil && usuario && (
        <Perfil usuario={usuario} avisar={avisar} alCerrar={() => setPerfil(false)}
          alGuardar={(u) => { setUsuario(u); setPerfil(false); }} />
      )}

      <footer className="app-footer">
        <div className="footer-content">
          <span><strong>🧺 YO LAVO</strong> — Lavanderías a domicilio · Cochabamba, Bolivia</span>
        </div>
      </footer>
    </div>
  );
}
