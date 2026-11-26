import { useState, type FormEvent } from 'react';
import { bs, NOMBRE_PAGO } from '../formato';
import type { MetodoPago, Pedido } from '../types';

interface Props {
  pedido: Pedido;
  alRegistrar: (pago: { monto: string; metodo: MetodoPago; referencia: string }) => Promise<boolean>;
}

/** La lavanderia registra adelantos o el pago total */
export default function Cobro({ pedido, alRegistrar }: Props) {
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState<MetodoPago>(pedido.metodo_pago);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await alRegistrar({ monto: monto || String(pedido.saldo), metodo, referencia: pedido.aviso_pago ?? '' });
    if (ok) setMonto('');
  };

  return (
    <div>
      <p>Pagado {bs(pedido.pagado)} • Saldo <strong>{bs(pedido.saldo)}</strong></p>
      {pedido.aviso_pago && <p style={{ color: 'var(--orange-300)' }}>🔔 El cliente avisa pago, comprobante {pedido.aviso_pago}. Revisa tu banco antes de registrar.</p>}
      {pedido.saldo > 0 && (
        <form onSubmit={enviar} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input className="input-field" style={{ width: 110 }} type="number" min="0.01" step="0.01" max={pedido.saldo} aria-label={`Monto del pedido ${pedido.id}`}
            placeholder={String(pedido.saldo)} value={monto} onChange={(e) => setMonto(e.target.value)} />
          <select className="input-field" style={{ width: 150 }} aria-label="Método de pago" value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPago)}>
            {(Object.keys(NOMBRE_PAGO) as MetodoPago[]).map((m) => <option key={m} value={m}>{NOMBRE_PAGO[m]}</option>)}
          </select>
          <button className="btn-secondary btn-sm">💰 Registrar pago</button>
        </form>
      )}
    </div>
  );
}
