import { useState } from 'react';
import { api, mensajeError, useDatos } from '../api';
import { bs, detalle, fechaHora, NOMBRE_ESTADO, NOMBRE_PAGO, quePasa } from '../formato';
import type { Avisar, Estado, Negocio, Pedido, Usuario } from '../types';
import { Banner, Cargando, Contacto, EtiquetaEstado, Mapa, Titulo, Vacio } from './Comunes';
import NuevoPedido from './NuevoPedido';
import { PagoCliente } from './Pago';

interface Props {
  usuario: Usuario;
  avisar: Avisar;
  cambiarEstado: (id: number, estado: Estado) => Promise<void>;
}

function Calificar({ pedido, avisar, alTerminar }: { pedido: Pedido; avisar: Avisar; alTerminar: () => void }) {
  const calificar = async (estrellas: number) => {
    try {
      await api.post(`/pedidos/${pedido.id}/calificar`, { estrellas });
      avisar('¡Gracias por calificar!', '⭐');
      alTerminar();
    } catch (error) {
      avisar(mensajeError(error), '⚠️');
    }
  };
  if (pedido.calificacion) return <p>Tu calificación: {'⭐'.repeat(pedido.calificacion)}</p>;
  return (
    <div>
      <p style={{ marginBottom: '0.4rem' }}>¿Cómo fue el servicio?</p>
      <div style={{ display: 'flex', gap: '0.35rem' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} className="btn-ghost btn-sm" aria-label={`${n} estrellas`} onClick={() => void calificar(n)}>{n}⭐</button>
        ))}
      </div>
    </div>
  );
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
        <Banner etiqueta="Panel del cliente" titulo={`¡Hola, ${usuario.nombre}! 👋`} nota="Pide el lavado y sigue tu ropa paso a paso." />

        <Titulo icono="📦" texto="Mis pedidos" nota="Se actualiza solo cada pocos segundos" />
        {pedidos.datos.length === 0 && <Vacio>Todavía no tienes pedidos. Elige una lavandería más abajo.</Vacio>}
        <div className="cards-grid">
          {pedidos.datos.map((p) => (
            <div key={p.id} className="order-card card-accent-border">
              <div className="order-meta-row">
                <span className="badge badge-orange">Pedido #{p.id}</span>
                <span className="order-price">{bs(p.precio_total)}</span>
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>🏪 {p.nombre_negocio}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{detalle(p)} • {NOMBRE_PAGO[p.metodo_pago]} • {fechaHora(p.fecha)}</p>
              </div>
              <EtiquetaEstado estado={p.estado} />
              <p><strong>{quePasa(p)}</strong></p>
              {p.historial.length > 0 && (
                <ul className="linea-tiempo">
                  {p.historial.map((h, i) => (
                    <li key={i}><span>{NOMBRE_ESTADO[h.estado]}</span><small>{fechaHora(h.fecha)}</small></li>
                  ))}
                </ul>
              )}
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.modalidad === 'local' ? '🏪 Dejas y recoges en el local' : `📍 ${p.direccion_entrega}`}</p>
              {p.estado !== 'cancelado' && <PagoCliente pedido={p} avisar={avisar} alCambiar={() => void pedidos.recargar()} />}
              {p.estado !== 'entregado' && p.estado !== 'cancelado' && (
                <div className="order-actions" style={{ flexWrap: 'wrap' }}>
                  <Contacto nombre="Lavandería" telefono={p.telefono_negocio} />
                  {p.repartidor && <Contacto nombre={p.repartidor.nombre} telefono={p.repartidor.telefono} />}
                </div>
              )}
              {(p.estado === 'solicitado' || p.estado === 'aceptado') && (
                <button className="btn-ghost btn-sm" onClick={() => { if (window.confirm('¿Cancelar este pedido?')) void mover(p.id, 'cancelado'); }}>✕ Cancelar pedido</button>
              )}
              {p.estado === 'entregado' && <Calificar pedido={p} avisar={avisar} alTerminar={() => void pedidos.recargar()} />}
            </div>
          ))}
        </div>

        <Titulo icono="🗺️" texto="Lavanderías en Cochabamba">
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
                {n.horario && <div className="laundry-address">🕗 {n.horario}</div>}
                <div>{n.total_resenas ? `⭐ ${n.puntaje} (${n.total_resenas} calificaciones)` : 'Sin calificaciones todavía'}</div>
                <div className="price-tag-pill">{bs(n.precio_kilo)} / kg</div>
                <Mapa direccion={`${n.direccion}, ${n.distrito}`} />
                <Contacto nombre="Llamar" telefono={n.telefono} />
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
