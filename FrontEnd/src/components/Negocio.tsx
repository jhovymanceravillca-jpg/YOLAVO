import { useState, type FormEvent } from 'react';
import { api, mensajeError, useDatos } from '../api';
import { bs, detalle, NOMBRE_PAGO } from '../formato';
import type { Avisar, Estado, Maquina, PanelNegocio } from '../types';
import { Banner, Cargando, Cifra, EtiquetaEstado, Titulo, Vacio } from './Comunes';

interface Props {
  avisar: Avisar;
  cambiarEstado: (id: number, estado: Estado) => Promise<void>;
}

const EQUIPO = { codigo: '', tipo: 'lavadora', capacidad_kg: '15' };
const PRODUCTO = { nombre: '', tipo: 'detergente', precio: '', stock: '' };

export default function Negocio({ avisar, cambiarEstado }: Props) {
  const { datos, error, recargar } = useDatos<PanelNegocio>('/negocio/panel');
  const [equipo, setEquipo] = useState(EQUIPO);
  const [producto, setProducto] = useState(PRODUCTO);
  const [precio, setPrecio] = useState('');

  if (!datos) return <Cargando error={error} />;

  // Ejecuta una accion en el servidor y vuelve a leer la base
  const accion = async (peticion: () => Promise<unknown>, mensaje: string) => {
    try {
      await peticion();
      avisar(mensaje, '✅');
      await recargar();
      return true;
    } catch (e) {
      avisar(mensajeError(e), '⚠️');
      return false;
    }
  };

  const mover = async (id: number, estado: Estado) => {
    await cambiarEstado(id, estado);
    await recargar();
  };

  const estadoMaquina = (m: Maquina, estado: Maquina['estado']) =>
    accion(() => api.patch(`/negocio/maquinas/${m.id}`, { estado }), `${m.codigo}: ${estado}`);

  const crearEquipo = async (e: FormEvent) => {
    e.preventDefault();
    if (await accion(() => api.post('/negocio/maquinas', equipo), 'Equipo registrado')) setEquipo(EQUIPO);
  };

  const crearProducto = async (e: FormEvent) => {
    e.preventDefault();
    if (await accion(() => api.post('/negocio/productos', producto), 'Producto registrado')) setProducto(PRODUCTO);
  };

  const guardarPrecio = async (e: FormEvent) => {
    e.preventDefault();
    if (await accion(() => api.patch('/negocio/local', { precio_kilo: precio }), 'Precio actualizado')) setPrecio('');
  };

  const fila = { display: 'flex', gap: '0.65rem', flexWrap: 'wrap' as const, marginBottom: '1rem' };

  return (
    <main className="dashboard-container">
      <Banner etiqueta="Panel de la lavandería" titulo={datos.local.nombre} nota={datos.local.direccion}>
        <form onSubmit={guardarPrecio} style={fila}>
          <input className="input-field" style={{ width: 220 }} type="number" min="1" step="0.5" required
            placeholder={`Precio/kg: ${bs(datos.local.precio_kilo)}`} value={precio} onChange={(e) => setPrecio(e.target.value)} />
          <button className="btn-secondary btn-sm">Cambiar precio</button>
        </form>
      </Banner>

      <div className="stats-grid">
        <Cifra icono="📊" valor={datos.resumen.pedidos} nombre="Pedidos totales" />
        <Cifra icono="⏳" valor={datos.resumen.activos} nombre="Pedidos en curso" />
        <Cifra icono="💰" valor={bs(datos.resumen.ingresos)} nombre="Ingresos por entregas" />
        <Cifra icono="🔄" valor={`${datos.maquinas.filter((m) => m.estado === 'ocupada').length} / ${datos.maquinas.length}`} nombre="Máquinas ocupadas" />
      </div>

      <Titulo icono="📥" texto="Pedidos" nota="Los nuevos aparecen solos" />
      {datos.pedidos.length === 0 && <Vacio>Aún no hay pedidos.</Vacio>}
      <div className="cards-grid">
        {datos.pedidos.map((p) => (
          <div key={p.id} className="order-card card-blue-border">
            <div className="order-meta-row">
              <span className="badge badge-orange">Pedido #{p.id}</span>
              <EtiquetaEstado estado={p.estado} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>👤 {p.cliente_nombre}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📞 {p.cliente_telefono} • 📍 {p.direccion_entrega}</p>
            </div>
            <p>{detalle(p)} • {NOMBRE_PAGO[p.metodo_pago]} • <strong style={{ color: 'var(--orange-400)' }}>{bs(p.precio_total)}</strong></p>
            {p.notas && <p style={{ fontSize: '0.82rem', color: 'var(--orange-300)' }}>📝 {p.notas}</p>}
            <div className="order-actions">
              {p.estado === 'solicitado' && (
                <>
                  <button className="btn-primary btn-sm" onClick={() => void mover(p.id, 'en_proceso')}>✓ Aceptar y lavar</button>
                  <button className="btn-ghost btn-sm" onClick={() => void mover(p.id, 'cancelado')}>Rechazar</button>
                </>
              )}
              {p.estado === 'en_proceso' && (
                <button className="btn-primary btn-sm" onClick={() => void mover(p.id, 'listo')}>✨ Marcar como listo</button>
              )}
              {p.estado === 'listo' && <span style={{ color: 'var(--text-muted)' }}>Esperando repartidor…</span>}
              <a className="btn-ghost btn-sm" href={`tel:${p.cliente_telefono}`}>📞 Llamar</a>
            </div>
          </div>
        ))}
      </div>

      <Titulo icono="🔄" texto="Lavadoras y secadoras" />
      <form onSubmit={crearEquipo} style={fila}>
        <input className="input-field" style={{ width: 160 }} required placeholder="Código (LAV-03)" value={equipo.codigo} onChange={(e) => setEquipo({ ...equipo, codigo: e.target.value })} />
        <select className="input-field" style={{ width: 150 }} value={equipo.tipo} onChange={(e) => setEquipo({ ...equipo, tipo: e.target.value })}>
          <option value="lavadora">Lavadora</option>
          <option value="secadora">Secadora</option>
        </select>
        <input className="input-field" style={{ width: 110 }} type="number" min="1" max="100" required title="Capacidad en kg" value={equipo.capacidad_kg} onChange={(e) => setEquipo({ ...equipo, capacidad_kg: e.target.value })} />
        <button className="btn-secondary btn-sm">➕ Agregar equipo</button>
      </form>
      <div className="cards-grid">
        {datos.maquinas.map((m) => (
          <div key={m.id} className="machine-card">
            <div className="machine-header">
              <div>
                <h3>{m.codigo}</h3>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{m.tipo} • {m.capacidad_kg} kg</span>
              </div>
              <span className={`badge ${m.estado === 'disponible' ? 'badge-green' : m.estado === 'ocupada' ? 'badge-blue' : 'badge-yellow'}`}>{m.estado}</span>
            </div>
            <div className={`machine-drum-housing ${m.estado === 'ocupada' ? 'running' : ''}`}>
              <div className="machine-drum-inner">{m.tipo === 'lavadora' ? '🫧' : '💨'}</div>
            </div>
            {m.estado === 'ocupada' && <p style={{ textAlign: 'center' }}>⏱️ Quedan {m.minutos} min</p>}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-primary btn-sm" style={{ flex: 1 }} onClick={() => void estadoMaquina(m, m.estado === 'disponible' ? 'ocupada' : 'disponible')}>
                {m.estado === 'disponible' ? '▶ Iniciar ciclo' : m.estado === 'ocupada' ? '⏹ Finalizar' : '🔧 Habilitar'}
              </button>
              {m.estado === 'disponible' && (
                <button className="btn-ghost btn-sm" onClick={() => void estadoMaquina(m, 'mantenimiento')}>Mantenimiento</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Titulo icono="🧴" texto="Inventario de insumos" />
      <form onSubmit={crearProducto} style={fila}>
        <input className="input-field" style={{ width: 220 }} required placeholder="Nombre del producto" value={producto.nombre} onChange={(e) => setProducto({ ...producto, nombre: e.target.value })} />
        <select className="input-field" style={{ width: 160 }} value={producto.tipo} onChange={(e) => setProducto({ ...producto, tipo: e.target.value })}>
          <option value="detergente">Detergente</option>
          <option value="suavizante">Suavizante</option>
          <option value="quitamanchas">Quitamanchas</option>
          <option value="otro">Otro</option>
        </select>
        <input className="input-field" style={{ width: 130 }} type="number" min="0" step="0.5" required placeholder="Precio Bs" value={producto.precio} onChange={(e) => setProducto({ ...producto, precio: e.target.value })} />
        <input className="input-field" style={{ width: 110 }} type="number" min="0" required placeholder="Stock" value={producto.stock} onChange={(e) => setProducto({ ...producto, stock: e.target.value })} />
        <button className="btn-secondary btn-sm">➕ Agregar producto</button>
      </form>
      <div className="cards-grid">
        {datos.productos.map((p) => (
          <div key={p.id} className="card-base">
            <h4>{p.icono} {p.nombre}</h4>
            <p style={{ color: 'var(--orange-400)', fontWeight: 900 }}>{bs(p.precio)}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button className="counter-btn" disabled={p.stock === 0} onClick={() => void accion(() => api.patch(`/negocio/productos/${p.id}`, { stock: p.stock - 1 }), 'Stock actualizado')}>−</button>
              <span className={`badge ${p.stock < 10 ? 'badge-yellow' : 'badge-green'}`}>Stock: {p.stock}</span>
              <button className="counter-btn" onClick={() => void accion(() => api.patch(`/negocio/productos/${p.id}`, { stock: p.stock + 1 }), 'Stock actualizado')}>+</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
