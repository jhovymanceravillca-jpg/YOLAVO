import { api, mensajeError, useDatos } from '../api';
import { bs, detalle, enlaceMapa, NOMBRE_PAGO } from '../formato';
import type { Avisar, Estado, PanelDelivery, Pedido, Usuario } from '../types';
import { Banner, Cargando, Cifra, Contacto, Mapa, Titulo, Vacio } from './Comunes';

interface Props {
  usuario: Usuario;
  avisar: Avisar;
  cambiarEstado: (id: number, estado: Estado) => Promise<void>;
}

// "recojo": del cliente a la lavanderia. En otro caso: de la lavanderia al cliente
const esRecojo = (p: Pedido) => p.estado === 'aceptado' || p.estado === 'recogiendo';

function Ruta({ p }: { p: Pedido }) {
  const cliente = `${p.cliente_nombre}, ${p.direccion_entrega}`;
  const local = `${p.nombre_negocio}, ${p.direccion_negocio}`;
  return (
    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
      <span className={`badge ${esRecojo(p) ? 'badge-yellow' : 'badge-green'}`}>{esRecojo(p) ? 'RECOJO de ropa sucia' : 'ENTREGA de ropa limpia'}</span>
      <div style={{ marginTop: '0.6rem' }}>🅰️ <strong>Desde:</strong> {esRecojo(p) ? cliente : local}</div>
      <div>🅱️ <strong>Hasta:</strong> {esRecojo(p) ? local : cliente}</div>
      {p.referencia && <div>📌 <strong>Referencia del cliente:</strong> {p.referencia}</div>}
      <div>{detalle(p)}{esRecojo(p) ? '' : p.saldo === 0 ? ' • Ya está pagado'
        : p.metodo_pago === 'efectivo' ? ` • Cobrar ${bs(p.saldo)} en efectivo`
          : ` • Pago por ${NOMBRE_PAGO[p.metodo_pago]}: lo verifica la lavandería`}</div>
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

  const completar = async (p: Pedido) => {
    await cambiarEstado(p.id, esRecojo(p) ? 'en_lavanderia' : 'entregado');
    await recargar();
  };

  return (
    <main className="dashboard-container">
      <Banner etiqueta="Panel del repartidor" titulo={`${usuario.nombre} 🛵`} nota="Recoge la ropa sucia y entrega la ropa limpia." />

      <div className="stats-grid">
        <Cifra icono="💵" valor={bs(datos.resumen.ganancias)} nombre="Ganancias acumuladas" />
        <Cifra icono="✅" valor={datos.resumen.viajes} nombre="Viajes completados" />
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
            <Mapa direccion={p.direccion_entrega} />
            <div className="order-actions" style={{ flexWrap: 'wrap' }}>
              <a className="btn-secondary btn-sm" href={enlaceMapa(p.direccion_entrega)} target="_blank" rel="noreferrer">Abrir en Google Maps</a>
              <Contacto nombre="Cliente" telefono={p.cliente_telefono} />
              <Contacto nombre="Lavandería" telefono={p.telefono_negocio} />
            </div>
            <button className="btn-primary btn-sm" onClick={() => void completar(p)}>
              {esRecojo(p) ? '✅ Dejé la ropa en la lavandería' : p.metodo_pago === 'efectivo' && p.saldo > 0 ? '✅ Entregado y cobrado' : '✅ Entregado'}
            </button>
          </div>
        ))}
      </div>

      <Titulo icono="📦" texto="Carreras disponibles" nota="Recojos aceptados y entregas listas" />
      {datos.disponibles.length === 0 && <Vacio>No hay carreras por ahora.</Vacio>}
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
