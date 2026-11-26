import { useState } from 'react';
import { useDatos } from '../api';
import { bs, detalle, NOMBRE_ESTADO, NOMBRE_PAGO } from '../formato';
import type { Avisar, Estado, Negocio, Pedido, Usuario } from '../types';
import { Banner, Cargando, EtiquetaEstado, Titulo, Vacio } from './Comunes';
import NuevoPedido from './NuevoPedido';

const PASOS: Estado[] = ['solicitado', 'en_proceso', 'listo', 'en_camino', 'entregado'];

interface Props {
  usuario: Usuario;
  avisar: Avisar;
  cambiarEstado: (id: number, estado: Estado) => Promise<void>;
}

export default function Cliente({ usuario, avisar, cambiarEstado }: Props) {
  const locales = useDatos<Negocio[]>('/negocios');
  const pedidos = useDatos<Pedido[]>('/cliente/pedidos');
  const [elegido, setElegido] = useState<Negocio | null>(null);
  const [busqueda, setBusqueda] = useState('');

  if (!locales.datos || !pedidos.datos) return <Cargando error={locales.error || pedidos.error} />;

  const filtrados = locales.datos.filter((n) =>
    `${n.nombre_negocio} ${n.direccion} ${n.distrito}`.toLowerCase().includes(busqueda.toLowerCase()));

  const mover = async (id: number, estado: Estado) => {
    await cambiarEstado(id, estado);
    await pedidos.recargar();
  };

  return (
    <>
    <main className="dashboard-container">
      <Banner etiqueta="Panel del cliente" titulo={`¡Hola, ${usuario.nombre}! 👋`} nota="Elige una lavandería y sigue el estado de tu ropa." />

      <Titulo icono="📦" texto="Mis pedidos" nota="Se actualiza solo cada pocos segundos" />
      {pedidos.datos.length === 0 && <Vacio>Todavía no tienes pedidos.</Vacio>}
      <div className="cards-grid">
        {pedidos.datos.map((p) => {
          const paso = PASOS.indexOf(p.estado);
          return (
            <div key={p.id} className="order-card card-accent-border">
              <div className="order-meta-row">
                <span className="badge badge-orange">Pedido #{p.id}</span>
                <span className="order-price">{bs(p.precio_total)}</span>
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>🏪 {p.nombre_negocio}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{detalle(p)} • Pago: {NOMBRE_PAGO[p.metodo_pago]}</p>
              </div>
              {p.estado === 'cancelado' ? <EtiquetaEstado estado={p.estado} /> : (
                <div className="stepper-container">
                  <div className="stepper-progress-line">
                    <div className="stepper-progress-fill" style={{ width: `${(paso / (PASOS.length - 1)) * 100}%` }} />
                  </div>
                  {PASOS.map((estado, i) => (
                    <div key={estado} className={`stepper-step ${i <= paso ? 'completed' : ''} ${i === paso ? 'active' : ''}`}>
                      <div className="stepper-dot">{i + 1}</div>
                      <span>{NOMBRE_ESTADO[estado]}</span>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 {p.direccion_entrega}</p>
              <div className="order-actions">
                {p.estado === 'solicitado' && (
                  <button className="btn-ghost btn-sm" onClick={() => void mover(p.id, 'cancelado')}>✕ Cancelar</button>
                )}
                {p.estado === 'en_camino' && (
                  <button className="btn-primary btn-sm" onClick={() => void mover(p.id, 'entregado')}>✅ Confirmar recibido</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Titulo icono="🗺️" texto="Lavanderías disponibles">
        <input className="input-field" style={{ maxWidth: 280 }} placeholder="🔍 Buscar por nombre o zona" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </Titulo>
      {filtrados.length === 0 && <Vacio>No hay lavanderías que coincidan.</Vacio>}
      <div className="cards-grid">
        {filtrados.map((n) => (
          <div key={n.id} className="laundry-card">
            <div className="laundry-card-banner">
              <span>{n.icono}</span>
              <div className="laundry-card-badge"><span className="badge badge-green">{n.lavadoras_disponibles} máquinas libres</span></div>
              <div className="laundry-card-distance">📍 {n.distrito}</div>
            </div>
            <div className="laundry-card-body">
              <h3 className="laundry-title">{n.nombre_negocio}</h3>
              <div className="laundry-address">🏠 {n.direccion}</div>
              <div className="price-tag-pill">{bs(n.precio_kilo)} / kg</div>
              <div className="services-chips">{n.servicios.map((s) => <span key={s} className="chip">{s}</span>)}</div>
              <button className="btn-primary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => setElegido(n)}>
                🧺 Cotizar y pedir
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>

      {/* El modal va fuera de <main> para quedar encima del pie de pagina */}
      {elegido && (
        <NuevoPedido negocio={elegido} direccionInicial={usuario.direccion} avisar={avisar}
          alCerrar={() => setElegido(null)}
          alCrear={() => { setElegido(null); void pedidos.recargar(); }} />
      )}
    </>
  );
}
