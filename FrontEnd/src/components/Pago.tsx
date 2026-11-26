import { useState, type FormEvent } from 'react';
import { api, mensajeError } from '../api';
import { bs } from '../formato';
import type { Avisar, Pedido } from '../types';

/** Pago del cliente: ve el QR de la lavanderia y avisa con su numero de comprobante */
export function PagoCliente({ pedido, avisar, alCambiar }: { pedido: Pedido; avisar: Avisar; alCambiar: () => void }) {
  const [qr, setQr] = useState<string | null>(null);
  const [referencia, setReferencia] = useState('');
  const digital = pedido.metodo_pago === 'qr' || pedido.metodo_pago === 'transferencia';

  const verQr = async () => {
    const res = await api.get<{ imagen: string | null }>(`/negocios/${pedido.negocio_id}/qr`);
    if (res.data.imagen) setQr(res.data.imagen);
    else avisar('La lavandería todavía no subió su QR', '⚠️');
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/pedidos/${pedido.id}/aviso-pago`, { referencia });
      setReferencia('');
      avisar('Aviso enviado. La lavandería verificará tu pago', '💳');
      alCambiar();
    } catch (error) {
      avisar(mensajeError(error), '⚠️');
    }
  };

  return (
    <div>
      <p>Pagado: <strong>{bs(pedido.pagado)}</strong> • Saldo: <strong>{bs(pedido.saldo)}</strong></p>
      {digital && pedido.saldo > 0 && (
        <>
          <button type="button" className="btn-secondary btn-sm" onClick={() => (qr ? setQr(null) : void verQr())}>
            {qr ? 'Ocultar QR' : '📱 Ver QR de cobro'}
          </button>
          {qr && <img src={qr} alt="QR de cobro de la lavandería" className="imagen-qr" />}
          {pedido.aviso_pago
            ? <p>⏳ Comprobante {pedido.aviso_pago} en verificación</p>
            : (
              <form onSubmit={enviar} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <input className="input-field" style={{ flex: 1 }} required placeholder="N.º de comprobante" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
                <button className="btn-primary btn-sm">Ya pagué</button>
              </form>
            )}
        </>
      )}
    </div>
  );
}
