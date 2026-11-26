import { useDatos } from '../api';
import { Cifra } from './Comunes';

interface Resumen { lavanderias: number; clientes: number; pedidos: number; entregados: number }

const PASOS = [
  ['🧼', '1. Solicita y cotiza', 'Elige lavado por kilo o por prenda. El precio se calcula en bolivianos antes de confirmar.'],
  ['🫧', '2. La lavandería trabaja', 'La lavandería acepta tu pedido, lo lava y lo marca como listo.'],
  ['🛵', '3. Entrega en tu puerta', 'Un repartidor toma la carrera y te lleva la ropa. Sigues cada estado en tu panel.'],
] as const;

export default function Explorar({ alEmpezar }: { alEmpezar: () => void }) {
  const { datos } = useDatos<Resumen>('/resumen');

  return (
    <main>
      <section className="hero-section">
        <div className="hero-tag"><span>Lavanderías a domicilio en La Paz, Bolivia</span></div>
        <h1 className="hero-heading">
          Tu ropa impecable, <br />
          <span className="text-gradient-orange">en tu puerta</span> con <span className="text-gradient-blue">Yo Lavo</span>
        </h1>
        <p className="hero-description">
          Conectamos a clientes, lavanderías y repartidores en un solo lugar.
        </p>
        <div className="hero-action-buttons">
          <button className="btn-primary" onClick={alEmpezar}>🧺 Empezar ahora</button>
        </div>
      </section>

      {datos && (
        <section className="features-banner">
          <Cifra icono="🏪" valor={datos.lavanderias} nombre="Lavanderías afiliadas" />
          <Cifra icono="👥" valor={datos.clientes} nombre="Clientes registrados" />
          <Cifra icono="📦" valor={datos.pedidos} nombre="Pedidos realizados" />
          <Cifra icono="✅" valor={datos.entregados} nombre="Pedidos entregados" />
        </section>
      )}

      <section className="dashboard-container">
        <div className="cards-grid">
          {PASOS.map(([icono, titulo, texto]) => (
            <div key={titulo} className="card-base card-accent-border">
              <div style={{ fontSize: '2.75rem', marginBottom: '0.85rem' }}>{icono}</div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.6rem' }}>{titulo}</h3>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6 }}>{texto}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
