import { useState, type FormEvent } from 'react';
import { api, mensajeError, useDatos } from '../api';
import { bs, NOMBRE_PAGO } from '../formato';
import type { Avisar, MetodoPago, Negocio } from '../types';

interface Props {
  negocio: Negocio;
  direccionInicial: string;
  alCerrar: () => void;
  alCrear: () => void;
  avisar: Avisar;
}

interface Tarifas { prenda: number; suavizante: number; express: number }

export default function NuevoPedido({ negocio, direccionInicial, alCerrar, alCrear, avisar }: Props) {
  const { datos: tarifas } = useDatos<Tarifas>('/tarifas');
  const [tipo, setTipo] = useState<'por_kilo' | 'por_prenda'>('por_kilo');
  const [cantidad, setCantidad] = useState(4);
  const [suavizante, setSuavizante] = useState(false);
  const [express, setExpress] = useState(false);
  const [direccion, setDireccion] = useState(direccionInicial);
  const [notas, setNotas] = useState('');
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo');
  const [enviando, setEnviando] = useState(false);

  if (!tarifas) return null;

  // Solo es una vista previa: el servidor vuelve a calcular el total
  const total = cantidad * (tipo === 'por_kilo' ? negocio.precio_kilo : tarifas.prenda)
    + (suavizante ? tarifas.suavizante : 0) + (express ? tarifas.express : 0);

  const confirmar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const res = await api.post('/pedidos', {
        negocio_id: negocio.id, tipo_cotizacion: tipo, cantidad, suavizante, express,
        direccion, notas, metodo_pago: metodo,
      });
      avisar(`Pedido #${res.data.id} registrado`, '🧺');
      alCrear();
    } catch (error) {
      avisar(mensajeError(error), '⚠️');
      setEnviando(false);
    }
  };

  const extra = (marcado: boolean, cambiar: (v: boolean) => void, texto: string, precio: number) => (
    <label className="addon-card-label" style={{ marginBottom: '0.75rem' }}>
      <span>{texto}</span>
      <span>+{bs(precio)} <input type="checkbox" checked={marcado} onChange={(e) => cambiar(e.target.checked)} /></span>
    </label>
  );

  return (
    <div className="modal-overlay" onClick={alCerrar}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.45rem' }}>{negocio.nombre_negocio}</h2>
          <button type="button" className="btn-ghost btn-sm" onClick={alCerrar}>✕</button>
        </div>

        <form onSubmit={confirmar}>
          <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1rem' }}>
            <button type="button" style={{ flex: 1 }} className={tipo === 'por_kilo' ? 'btn-primary' : 'btn-ghost'} onClick={() => setTipo('por_kilo')}>⚖️ Por kilo</button>
            <button type="button" style={{ flex: 1 }} className={tipo === 'por_prenda' ? 'btn-primary' : 'btn-ghost'} onClick={() => setTipo('por_prenda')}>👕 Por prenda</button>
          </div>

          <div className="quote-counter-box">
            <div>{tipo === 'por_kilo' ? `${bs(negocio.precio_kilo)} por kilo` : `${bs(tarifas.prenda)} por prenda`}</div>
            <div className="counter-controls">
              <button type="button" className="counter-btn" onClick={() => setCantidad(Math.max(1, cantidad - 1))}>−</button>
              <span className="counter-value">{cantidad}{tipo === 'por_kilo' ? ' kg' : ''}</span>
              <button type="button" className="counter-btn" onClick={() => setCantidad(Math.min(100, cantidad + 1))}>+</button>
            </div>
          </div>

          {extra(suavizante, setSuavizante, '🌸 Suavizante', tarifas.suavizante)}
          {extra(express, setExpress, '⚡ Express (3 horas)', tarifas.express)}

          <div className="form-group">
            <label className="form-label" htmlFor="direccion">📍 Dirección de entrega</label>
            <input id="direccion" className="input-field" required value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="notas">📝 Instrucciones (opcional)</label>
            <input id="notas" className="input-field" value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>

          <div className="form-group">
            <span className="form-label">💳 Pago al recibir</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {(Object.keys(NOMBRE_PAGO) as MetodoPago[]).map((m) => (
                <button key={m} type="button" className={metodo === m ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'} onClick={() => setMetodo(m)}>
                  {NOMBRE_PAGO[m]}
                </button>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--orange-400)', textAlign: 'right', margin: '1rem 0' }}>
            Total: {bs(total)}
          </p>
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={enviando}>
            {enviando ? 'Registrando…' : '🚀 Confirmar pedido'}
          </button>
        </form>
      </div>
    </div>
  );
}
