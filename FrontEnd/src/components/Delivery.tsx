import { api, mensajeError, useDatos } from '../api';
import { bs, detalle, enlaceMapa, NOMBRE_PAGO } from '../formato';
import type { Avisar, Estado, PanelDelivery, Pedido, Usuario } from '../types';
import { Banner, Cargando, Cifra, Titulo, Vacio } from './Comunes';

interface Props {
  usuario: Usuario;
  avisar: Avisar;
  cambiarEstado: (id: number, estado: Estado) => Promise<void>;
}

function Ruta({ p }: { p: Pedido }) {
  return (
    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
      <div>🏪 <strong>Recoger:</strong> {p.nombre_negocio}, {p.direccion_negocio}</div>
      <div>🏁 <strong>Entregar a:</strong> {p.cliente_nombre}, {p.direccion_entrega}</div>
      <div>{detalle(p)} • Cobrar {bs(p.precio_total)} ({NOMBRE_PAGO[p.metodo_pago]})</div>
    </div>
  );
}

export default function Delivery({ usuario, avisar, cambiarEstado }: Props) {
  const { datos, error, recargar } = useDatos<PanelDelivery>('/delivery/panel');
  if (!datos) return <Cargando error={error} />;

  const aceptar = async (id: number) => {
    try {
      await api.post(`/delivery/pedidos/${id}/aceptar`);
      avisar('Carrera asignada', '🛵');
    } catch (e) {
      avisar(mensajeError(e), '⚠️');
    }
    await recargar();
  };

  const entregar = async (id: number) => {
    await cambiarEstado(id, 'entregado');
    await recargar();
  };

  return (
    <main className="dashboard-container">
      <Banner etiqueta="Panel del repartidor" titulo={`${usuario.nombre} 🛵`} nota="Toma carreras de pedidos listos y entrégalos." />

      <div className="stats-grid">
        <Cifra icono="💵" valor={bs(datos.resumen.ganancias)} nombre="Ganancias acumuladas" />
        <Cifra icono="✅" valor={datos.resumen.entregas} nombre="Entregas completadas" />
        <Cifra icono="🛵" valor={datos.activos.length} nombre="Carreras en curso" />
      </div>

      <Titulo icono="⚡" texto="Mis carreras en curso" />
      {datos.activos.length === 0 && <Vacio>No tienes carreras en curso.</Vacio>}
      <div className="cards-grid">
        {datos.activos.map((p) => (
          <div key={p.id} className="order-card card-accent-border">
            <div className="order-meta-row">
              <span className="badge badge-blue">Pedido #{p.id}</span>
              <span className="delivery-pay-badge">+{bs(p.pago_delivery)}</span>
            </div>
            <Ruta p={p} />
            <div className="order-actions">
              <a className="btn-secondary btn-sm" href={enlaceMapa(p.direccion_entrega)} target="_blank" rel="noreferrer">🗺️ Ver mapa</a>
              <a className="btn-ghost btn-sm" href={`tel:${p.cliente_telefono}`}>📞 Llamar</a>
              <button className="btn-primary btn-sm" onClick={() => void entregar(p.id)}>✅ Entregado</button>
            </div>
          </div>
        ))}
      </div>

      <Titulo icono="📦" texto="Carreras disponibles" nota="Pedidos que la lavandería marcó como listos" />
      {datos.disponibles.length === 0 && <Vacio>No hay pedidos listos por ahora.</Vacio>}
      <div className="cards-grid">
        {datos.disponibles.map((p) => (
          <div key={p.id} className="order-card card-blue-border">
            <div className="order-meta-row">
              <span className="badge badge-orange">Pedido #{p.id}</span>
              <span className="delivery-pay-badge">+{bs(p.pago_delivery)}</span>
            </div>
            <Ruta p={p} />
            <button className="btn-primary btn-sm" onClick={() => void aceptar(p.id)}>🛵 Aceptar carrera</button>
          </div>
        ))}
      </div>
    </main>
  );
}
