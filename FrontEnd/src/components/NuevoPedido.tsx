import { useState, type FormEvent } from 'react';
import { api, mensajeError, useDatos } from '../api';
import { bs, NOMBRE_PAGO, ZONAS } from '../formato';
import { Mapa, SelectorZona } from './Comunes';
import type { Avisar, Catalogo, MetodoPago, Negocio } from '../types';

interface Props {
  negocio: Negocio;
  direccionInicial: string;
  alCerrar: () => void;
  alCrear: () => void;
  avisar: Avisar;
}

export default function NuevoPedido({ negocio, direccionInicial, alCerrar, alCrear, avisar }: Props) {
  const { datos } = useDatos<Catalogo>('/servicios');
  const [servicioId, setServicioId] = useState(0);
  const [prendaId, setPrendaId] = useState(0);
  const [cantidad, setCantidad] = useState(4);
  const [extras, setExtras] = useState<number[]>([]);
  const [modalidad, setModalidad] = useState<'domicilio' | 'local'>('domicilio');
  const [direccion, setDireccion] = useState(direccionInicial);
  const [zona, setZona] = useState('');
  const [referencia, setReferencia] = useState('');
  const [notas, setNotas] = useState('');
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo');
  const [enviando, setEnviando] = useState(false);

  if (!datos) return null;

  const principales = datos.servicios.filter((s) => !s.extra);
  const servicio = principales.find((s) => s.id === servicioId)
    ?? principales.find((s) => s.unidad === 'KILOGRAMO') ?? principales[0];
  if (!servicio) return null;
  const porKilo = servicio.unidad === 'KILOGRAMO';
  const fijo = servicio.unidad === 'FIJO';

  // Solo es una vista previa: el servidor vuelve a calcular el total
  const total = (fijo ? 1 : cantidad) * servicio.precio
    + datos.servicios.filter((s) => s.extra && extras.includes(s.id)).reduce((t, s) => t + s.precio, 0);

  const confirmar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const res = await api.post('/pedidos', {
        negocio_id: negocio.id, servicio_id: servicio.id, prenda_id: prendaId, cantidad, extras,
        modalidad, direccion, zona, referencia, notas, metodo_pago: metodo,
      });
      avisar(`Pedido #${res.data.id} registrado`, '🧺');
      alCrear();
    } catch (error) {
      avisar(mensajeError(error), '⚠️');
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={alCerrar}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.45rem' }}>{negocio.nombre_negocio}</h2>
          <button type="button" className="btn-ghost btn-sm" onClick={alCerrar}>✕</button>
        </div>

        <form onSubmit={confirmar}>
          <div className="form-group">
            <label className="form-label" htmlFor="servicio">🧺 Servicio</label>
            <select id="servicio" className="input-field" value={servicio.id} onChange={(e) => setServicioId(Number(e.target.value))}>
              {principales.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre} — {bs(s.precio)}{s.unidad === 'KILOGRAMO' ? ' / kg' : s.unidad === 'PRENDA' ? ' / prenda' : ' (fijo)'}</option>
              ))}
            </select>
          </div>
          {!porKilo && (
            <div className="form-group">
              <label className="form-label" htmlFor="prenda">👕 Tipo de prenda</label>
              <select id="prenda" className="input-field" required value={prendaId || ''} onChange={(e) => setPrendaId(Number(e.target.value))}>
                <option value="">Elige la prenda</option>
                {datos.prendas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          )}
          {!fijo && (
            <div className="quote-counter-box">
              <div>{porKilo ? 'Kilos aproximados' : 'Cantidad de prendas'}</div>
              <div className="counter-controls">
                <button type="button" className="counter-btn" onClick={() => setCantidad(Math.max(1, cantidad - 1))}>−</button>
                <span className="counter-value">{cantidad}{porKilo ? ' kg' : ''}</span>
                <button type="button" className="counter-btn" onClick={() => setCantidad(Math.min(100, cantidad + 1))}>+</button>
              </div>
            </div>
          )}
          {datos.servicios.filter((s) => s.extra).map((s) => (
            <label key={s.id} className="addon-card-label" style={{ marginBottom: '0.75rem' }}>
              <span>{s.nombre}</span>
              <span>+{bs(s.precio)} <input type="checkbox" checked={extras.includes(s.id)}
                onChange={(e) => setExtras(e.target.checked ? [...extras, s.id] : extras.filter((x) => x !== s.id))} /></span>
            </label>
          ))}

          <div style={{ display: 'flex', gap: '0.65rem', margin: '1rem 0' }}>
            <button type="button" style={{ flex: 1 }} className={modalidad === 'domicilio' ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'} onClick={() => setModalidad('domicilio')}>🛵 A domicilio</button>
            <button type="button" style={{ flex: 1 }} className={modalidad === 'local' ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'} onClick={() => setModalidad('local')}>🏪 Dejo y recojo en el local</button>
          </div>

          {modalidad === 'domicilio' && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="zona">📍 Zona de Cochabamba</label>
                <SelectorZona id="zona" valor={zona} cambiar={setZona} zonas={ZONAS} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="direccion">Calle y número (recojo y entrega)</label>
                <input id="direccion" className="input-field" required value={direccion} onChange={(e) => setDireccion(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="referencia">Referencia para el repartidor</label>
                <input id="referencia" className="input-field" required value={referencia} placeholder="Color de la puerta, qué hay al lado…" onChange={(e) => setReferencia(e.target.value)} />
                {direccion && zona && <div style={{ marginTop: '0.5rem' }}><Mapa direccion={`${direccion}, ${zona}`} /></div>}
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="notas">📝 Instrucciones (opcional)</label>
            <input id="notas" className="input-field" value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>

          <div className="form-group">
            <span className="form-label">💳 Método de pago</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {(Object.keys(NOMBRE_PAGO) as MetodoPago[]).map((m) => (
                <button key={m} type="button" className={metodo === m ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'} onClick={() => setMetodo(m)}>
                  {NOMBRE_PAGO[m]}
                </button>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--orange-400)', textAlign: 'right', margin: '1rem 0' }}>
            Estimado: {bs(total)}
          </p>
          {!fijo && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              El total final se confirma cuando la lavandería {porKilo ? 'pese' : 'cuente'} tu ropa.
            </p>
          )}
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={enviando}>
            {enviando ? 'Registrando…' : '🚀 Confirmar pedido'}
          </button>
        </form>
      </div>
    </div>
  );
}
