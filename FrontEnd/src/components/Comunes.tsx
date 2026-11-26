import type { ReactNode } from 'react';
import { NOMBRE_ESTADO } from '../formato';
import type { Estado } from '../types';

export function Titulo({ icono, texto, nota, children }: { icono: string; texto: string; nota?: string; children?: ReactNode }) {
  return (
    <div className="section-header" style={{ marginTop: '2.5rem' }}>
      <div>
        <h2 className="section-title"><span>{icono}</span> {texto}</h2>
        {nota && <p className="section-subtitle">{nota}</p>}
      </div>
      {children}
    </div>
  );
}

export function Banner({ etiqueta, titulo, nota, children }: { etiqueta: string; titulo: string; nota: string; children?: ReactNode }) {
  return (
    <div className="card-base" style={{ background: 'linear-gradient(135deg, var(--blue-950) 0%, var(--bg-surface-2) 100%)', borderColor: 'var(--blue-border)', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <span className="badge badge-orange">{etiqueta}</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.6rem' }}>{titulo}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{nota}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Cifra({ icono, valor, nombre }: { icono: string; valor: string | number; nombre: string }) {
  return (
    <div className="stat-card">
      <div className="stat-icon-wrapper stat-icon-orange">{icono}</div>
      <div className="stat-info">
        <span className="stat-value">{valor}</span>
        <span className="stat-label">{nombre}</span>
      </div>
    </div>
  );
}

export function EtiquetaEstado({ estado }: { estado: Estado }) {
  const color = estado === 'solicitado' ? 'badge-yellow' : estado === 'en_proceso' ? 'badge-blue' : 'badge-green';
  return <span className={`badge ${color}`}>{NOMBRE_ESTADO[estado]}</span>;
}

export function Vacio({ children }: { children: ReactNode }) {
  return <div className="card-base" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{children}</div>;
}

export function Cargando({ error }: { error: string }) {
  return (
    <main className="dashboard-container">
      <Vacio>{error ? `⚠️ ${error}` : 'Cargando…'}</Vacio>
    </main>
  );
}
