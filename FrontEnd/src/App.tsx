import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:3001/api';

export interface User {
  id: number;
  nombre: string;
  nombre_completo?: string;
  usuario: string;
  correo: string;
  rol: 'cliente' | 'negocio' | 'delivery';
  telefono?: string;
  direccion?: string;
}

export interface Negocio {
  id: number;
  nombre_negocio: string;
  direccion: string;
  distancia?: string;
  puntaje: number;
  total_resenas: number;
  precio_kilo: number;
  servicios: string[];
  lavadoras_disponibles: number;
  icono?: string;
}

export interface Pedido {
  id: number;
  cliente_id?: number;
  cliente_nombre: string;
  cliente_telefono?: string;
  negocio_id?: number;
  nombre_negocio?: string;
  delivery_id?: number | null;
  tipo_cotizacion: 'por_kilo' | 'por_prenda';
  cantidad: number;
  precio_total: number;
  estado: 'solicitado' | 'aceptado' | 'en_proceso' | 'listo' | 'en_camino' | 'entregado' | 'cancelado';
  metodo_pago: 'qr' | 'efectivo' | 'tarjeta';
  direccion_recojo: string;
  direccion_entrega: string;
  notas?: string;
  fecha?: string;
}

export interface Lavadora {
  id: number;
  numero_lavadora: string;
  tipo: 'lavadora' | 'secadora';
  capacidad_kg: number;
  estado: 'disponible' | 'ocupada' | 'mantenimiento';
  tiempo_restante?: number;
}

export interface Producto {
  id: number;
  nombre: string;
  tipo: string;
  precio: number;
  stock: number;
  icono?: string;
}

const MOCK_NEGOCIOS: Negocio[] = [
  {
    id: 1,
    nombre_negocio: 'Lavandería Burbujas Express',
    direccion: 'Av. Las Palmeras 482, San Isidro',
    distancia: '0.8 km',
    puntaje: 4.9,
    total_resenas: 142,
    precio_kilo: 7.50,
    servicios: ['Por Kilo', 'Lavado en Seco', 'Secado Express', 'Zapatillas'],
    lavadoras_disponibles: 4,
    icono: '🫧'
  },
  {
    id: 2,
    nombre_negocio: 'EcoLavado Inteligente',
    direccion: 'Calle Los Sauces 112, Miraflores',
    distancia: '1.4 km',
    puntaje: 4.8,
    total_resenas: 98,
    precio_kilo: 8.00,
    servicios: ['Detergente Ecológico', 'Por Kilo', 'Vapor Planchado', 'Edredones'],
    lavadoras_disponibles: 6,
    icono: '🌿'
  },
  {
    id: 3,
    nombre_negocio: 'Master Clean & Tintorería',
    direccion: 'Av. Primavera 920, Surco',
    distancia: '2.1 km',
    puntaje: 4.95,
    total_resenas: 215,
    precio_kilo: 9.00,
    servicios: ['Ternos y Vestidos', 'Desmanchado', 'Entrega en 3h', 'Por Prenda'],
    lavadoras_disponibles: 2,
    icono: '👔'
  },
  {
    id: 4,
    nombre_negocio: 'LavaFlash 24 Horas',
    direccion: 'Jr. Huancavelica 304, Centro',
    distancia: '3.0 km',
    puntaje: 4.7,
    total_resenas: 84,
    precio_kilo: 6.90,
    servicios: ['Económico', 'Lavado Rápido', 'Ropa de Cama'],
    lavadoras_disponibles: 5,
    icono: '⚡'
  }
];

const MOCK_PEDIDOS: Pedido[] = [
  {
    id: 101,
    cliente_nombre: 'Camila Rodriguez',
    cliente_telefono: '+51 987 654 321',
    nombre_negocio: 'Lavandería Burbujas Express',
    tipo_cotizacion: 'por_kilo',
    cantidad: 6.5,
    precio_total: 48.75,
    estado: 'en_camino',
    metodo_pago: 'qr',
    direccion_recojo: 'Av. Benavides 1240, Dpto 301',
    direccion_entrega: 'Av. Benavides 1240, Dpto 301',
    notas: 'Separar camisas blancas y planchar con vapor',
    fecha: 'Hoy, 10:30 AM'
  },
  {
    id: 102,
    cliente_nombre: 'Marco Antonio Vidal',
    cliente_telefono: '+51 912 345 678',
    nombre_negocio: 'Lavandería Burbujas Express',
    tipo_cotizacion: 'por_kilo',
    cantidad: 4.0,
    precio_total: 30.00,
    estado: 'en_proceso',
    metodo_pago: 'efectivo',
    direccion_recojo: 'Calle Schell 450',
    direccion_entrega: 'Calle Schell 450',
    notas: 'Detergente hipoalergénico por favor',
    fecha: 'Hoy, 11:15 AM'
  },
  {
    id: 103,
    cliente_nombre: 'Valeria Morales',
    cliente_telefono: '+51 945 678 123',
    nombre_negocio: 'EcoLavado Inteligente',
    tipo_cotizacion: 'por_prenda',
    cantidad: 5,
    precio_total: 62.00,
    estado: 'solicitado',
    metodo_pago: 'tarjeta',
    direccion_recojo: 'Av. Larco 890, Int 5',
    direccion_entrega: 'Av. Larco 890, Int 5',
    notas: '2 Edredones y 3 casacas de pluma',
    fecha: 'Hoy, 12:00 PM'
  }
];

const MOCK_LAVADORAS: Lavadora[] = [
  { id: 1, numero_lavadora: 'LAV-01', tipo: 'lavadora', capacidad_kg: 15, estado: 'ocupada', tiempo_restante: 18 },
  { id: 2, numero_lavadora: 'LAV-02', tipo: 'lavadora', capacidad_kg: 15, estado: 'disponible' },
  { id: 3, numero_lavadora: 'LAV-03', tipo: 'lavadora', capacidad_kg: 20, estado: 'ocupada', tiempo_restante: 32 },
  { id: 4, numero_lavadora: 'SEC-01', tipo: 'secadora', capacidad_kg: 18, estado: 'disponible' },
  { id: 5, numero_lavadora: 'SEC-02', tipo: 'secadora', capacidad_kg: 18, estado: 'ocupada', tiempo_restante: 12 },
  { id: 6, numero_lavadora: 'LAV-04', tipo: 'lavadora', capacidad_kg: 12, estado: 'mantenimiento' }
];

const MOCK_PRODUCTOS: Producto[] = [
  { id: 1, nombre: 'Detergente Líquido Industrial', tipo: 'detergente', precio: 28.50, stock: 45, icono: '🧴' },
  { id: 2, nombre: 'Suavizante Floral Intense 5L', tipo: 'suavizante', precio: 22.00, stock: 8, icono: '🌸' },
  { id: 3, nombre: 'Quitamanchas Activo O2', tipo: 'quitamanchas', precio: 19.90, stock: 24, icono: '✨' },
  { id: 4, nombre: 'Fundas Protectoras x50', tipo: 'otro', precio: 15.00, stock: 60, icono: '🛍️' }
];

function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('yolavo_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('yolavo_token');
    } catch {
      return null;
    }
  });
  const [vistaActiva, setVistaActiva] = useState<'explorar' | 'cliente' | 'negocio' | 'delivery'>(() => {
    try {
      const savedUser = localStorage.getItem('yolavo_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return parsed.rol || 'explorar';
      }
    } catch {
    }
    return 'explorar';
  });
  
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModo, setAuthModo] = useState<'login' | 'registro'>('login');
  const [logForm, setLogForm] = useState({ correo: '', contrasena: '', rol: 'cliente' as 'cliente' | 'negocio' | 'delivery' });
  const [regForm, setRegForm] = useState({
    nombre_completo: '',
    usuario: '',
    correo: '',
    contrasena: '',
    contrasena2: '',
    rol: 'cliente' as 'cliente' | 'negocio' | 'delivery',
    telefono: '',
    direccion: ''
  });
  const [regPaso, setRegPaso] = useState(1);

  const [negocios, setNegocios] = useState<Negocio[]>(MOCK_NEGOCIOS);
  const [pedidos, setPedidos] = useState<Pedido[]>(MOCK_PEDIDOS);
  const [lavadoras, setLavadoras] = useState<Lavadora[]>(MOCK_LAVADORAS);
  const [productos, setProductos] = useState<Producto[]>(MOCK_PRODUCTOS);
  const [filtroServicio, setFiltroServicio] = useState<string>('todos');

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedNegocio, setSelectedNegocio] = useState<Negocio | null>(null);
  const [quoteType, setQuoteType] = useState<'por_kilo' | 'por_prenda'>('por_kilo');
  const [kilosCount, setKilosCount] = useState<number>(4);
  const [prendasCount, setPrendasCount] = useState<number>(3);
  const [includeSuavizante, setIncludeSuavizante] = useState(true);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [isExpress, setIsExpress] = useState(false);
  const [orderAddress, setOrderAddress] = useState('Av. Benavides 1240, Dpto 301');
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'efectivo' | 'tarjeta'>('qr');
  const [orderNotes, setOrderNotes] = useState('');

  const [activeDeliveryOrder, setActiveDeliveryOrder] = useState<Pedido | null>(MOCK_PEDIDOS[0]);

  useEffect(() => {
    if (user) {
      const apiInstance = axios.create({
        baseURL: API_URL,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (user.rol === 'cliente') {
        apiInstance.get('/negocios')
          .then(res => { if (res.data && res.data.length > 0) setNegocios(res.data); })
          .catch(() => {});
      } else if (user.rol === 'negocio') {
        apiInstance.get('/negocio/pedidos')
          .then(res => { if (res.data && res.data.length > 0) setPedidos(res.data); })
          .catch(() => {});
        apiInstance.get('/negocio/productos')
          .then(res => { if (res.data && res.data.length > 0) setProductos(res.data); })
          .catch(() => {});
      } else if (user.rol === 'delivery') {
        apiInstance.get('/delivery/mis-pedidos')
          .then(res => { if (res.data && res.data.length > 0) setPedidos(res.data); })
          .catch(() => {});
      }
    }
  }, [user, token, vistaActiva]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/login`, logForm);
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('yolavo_user', JSON.stringify(res.data.user));
      localStorage.setItem('yolavo_token', res.data.token);
      setVistaActiva(res.data.user.rol);
      setAuthModalOpen(false);
    } catch {
      const demoUser: User = {
        id: Math.floor(Math.random() * 900) + 100,
        nombre: logForm.correo.split('@')[0] || 'Usuario Yo Lavo',
        usuario: logForm.correo.split('@')[0] || 'usuario',
        correo: logForm.correo,
        rol: logForm.rol,
        direccion: 'Calle Los Cedros 342, Lima'
      };
      setUser(demoUser);
      localStorage.setItem('yolavo_user', JSON.stringify(demoUser));
      setVistaActiva(demoUser.rol);
      setAuthModalOpen(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regForm.contrasena !== regForm.contrasena2) {
      alert('Las contraseñas no coinciden');
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/registro`, regForm);
      setUser(res.data);
      localStorage.setItem('yolavo_user', JSON.stringify(res.data));
      setVistaActiva(regForm.rol);
      setAuthModalOpen(false);
    } catch {
      const demoUser: User = {
        id: Math.floor(Math.random() * 900) + 100,
        nombre: regForm.nombre_completo || 'Nuevo Usuario',
        nombre_completo: regForm.nombre_completo,
        usuario: regForm.usuario,
        correo: regForm.correo,
        rol: regForm.rol,
        telefono: regForm.telefono,
        direccion: regForm.direccion
      };
      setUser(demoUser);
      localStorage.setItem('yolavo_user', JSON.stringify(demoUser));
      setVistaActiva(demoUser.rol);
      setAuthModalOpen(false);
    }
  };

  const handleQuickDemoLogin = (rol: 'cliente' | 'negocio' | 'delivery') => {
    const demoProfiles = {
      cliente: {
        id: 10,
        nombre: 'Valeria Mendoza',
        nombre_completo: 'Valeria Mendoza Flores',
        usuario: 'valeria.m',
        correo: 'valeria@cliente.com',
        rol: 'cliente' as const,
        telefono: '+51 987 111 222',
        direccion: 'Av. Benavides 1240, Dpto 301, Miraflores'
      },
      negocio: {
        id: 20,
        nombre: 'Carlos Gómez (Burbujas Express)',
        nombre_completo: 'Carlos Gómez Soto',
        usuario: 'burbujas.express',
        correo: 'admin@burbujasexpress.pe',
        rol: 'negocio' as const,
        telefono: '+51 999 444 555',
        direccion: 'Av. Las Palmeras 482, San Isidro'
      },
      delivery: {
        id: 30,
        nombre: 'Diego Navarro (Rider)',
        nombre_completo: 'Diego Navarro Rivas',
        usuario: 'diego.rider',
        correo: 'diego@delivery.pe',
        rol: 'delivery' as const,
        telefono: '+51 955 777 888',
        direccion: 'Av. Aviación 2810'
      }
    };
    const profile = demoProfiles[rol];
    setUser(profile);
    localStorage.setItem('yolavo_user', JSON.stringify(profile));
    setVistaActiva(rol);
    setAuthModalOpen(false);
  };

  const logout = () => {
    localStorage.removeItem('yolavo_user');
    localStorage.removeItem('yolavo_token');
    setUser(null);
    setToken(null);
    setVistaActiva('explorar');
  };

  const calculateTotal = () => {
    if (!selectedNegocio) return 0;
    let base = 0;
    if (quoteType === 'por_kilo') {
      base = kilosCount * selectedNegocio.precio_kilo;
    } else {
      base = prendasCount * 12.00;
    }
    if (includeSuavizante) base += 3.50;
    if (isExpress) base += 10.00;
    if (selectedProducto) base += selectedProducto.precio;
    return parseFloat(base.toFixed(2));
  };

  const handleCrearPedido = () => {
    if (!selectedNegocio) return;
    const nuevoPedido: Pedido = {
      id: Math.floor(Math.random() * 800) + 200,
      cliente_nombre: user?.nombre || 'Cliente Yo Lavo',
      cliente_telefono: user?.telefono || '+51 987 000 111',
      negocio_id: selectedNegocio.id,
      nombre_negocio: selectedNegocio.nombre_negocio,
      tipo_cotizacion: quoteType,
      cantidad: quoteType === 'por_kilo' ? kilosCount : prendasCount,
      precio_total: calculateTotal(),
      estado: 'solicitado',
      metodo_pago: paymentMethod,
      direccion_recojo: orderAddress,
      direccion_entrega: orderAddress,
      notas: orderNotes || (selectedProducto ? `Incluye ${selectedProducto.nombre}` : (includeSuavizante ? 'Incluye suavizante aromático' : '')),
      fecha: 'Justo ahora'
    };

    setPedidos([nuevoPedido, ...pedidos]);
    setOrderModalOpen(false);
    alert(`🎉 ¡Pedido #${nuevoPedido.id} creado con éxito para ${selectedNegocio.nombre_negocio}! Un repartidor recogerá tu ropa pronto.`);
  };

  const handleToggleLavadora = (id: number) => {
    setLavadoras(lavadoras.map(m => {
      if (m.id === id) {
        if (m.estado === 'disponible') {
          return { ...m, estado: 'ocupada', tiempo_restante: 35 };
        } else if (m.estado === 'ocupada') {
          return { ...m, estado: 'disponible', tiempo_restante: undefined };
        } else {
          return { ...m, estado: 'disponible' };
        }
      }
      return m;
    }));
  };

  const handleUpdatePedidoEstado = (pedidoId: number, nuevoEstado: Pedido['estado']) => {
    setPedidos(pedidos.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p));
  };

  const handleAceptarCarreraDelivery = (pedido: Pedido) => {
    setActiveDeliveryOrder(pedido);
    setPedidos(pedidos.map(p => p.id === pedido.id ? { ...p, estado: 'en_camino' } : p));
    alert(`🛵 ¡Carrera aceptada! Ruta iniciada hacia ${pedido.nombre_negocio || 'el negocio'}`);
  };

  return (
    <div className="app-wrapper">
      <header className="header-nav">
        <div className="brand-container" onClick={() => setVistaActiva('explorar')}>
          <div className="brand-icon">🧺</div>
          <div>
            <div className="brand-title">
              YO<span>LAVO</span>
              <span className="brand-badge">PRO</span>
            </div>
          </div>
        </div>

        <div className="role-switcher-toolbar">
          <button 
            className={`role-tab-btn ${vistaActiva === 'explorar' ? 'active' : ''}`}
            onClick={() => setVistaActiva('explorar')}
          >
            <span>✨</span> Explorar
          </button>
          <button 
            className={`role-tab-btn ${vistaActiva === 'cliente' ? 'active' : ''}`}
            onClick={() => {
              setVistaActiva('cliente');
              if (!user) handleQuickDemoLogin('cliente');
            }}
          >
            <span>🧺</span> Modo Cliente
          </button>
          <button 
            className={`role-tab-btn ${vistaActiva === 'negocio' ? 'active' : ''}`}
            onClick={() => {
              setVistaActiva('negocio');
              if (!user) handleQuickDemoLogin('negocio');
            }}
          >
            <span>🏪</span> Modo Negocio
          </button>
          <button 
            className={`role-tab-btn ${vistaActiva === 'delivery' ? 'active' : ''}`}
            onClick={() => {
              setVistaActiva('delivery');
              if (!user) handleQuickDemoLogin('delivery');
            }}
          >
            <span>🛵</span> Modo Delivery
          </button>
        </div>

        <div className="nav-actions">
          {user ? (
            <div className="user-pill">
              <div className="user-avatar">{user.nombre.charAt(0)}</div>
              <div>
                <div className="user-name">{user.nombre}</div>
                <div className="user-role-badge">Rol: {user.rol}</div>
              </div>
              <button className="btn-danger btn-sm" onClick={logout} title="Cerrar sesión">
                ✕ Salir
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn-ghost btn-sm" 
                onClick={() => { setAuthModo('login'); setAuthModalOpen(true); }}
              >
                🔐 Iniciar Sesión
              </button>
              <button 
                className="btn-primary btn-sm" 
                onClick={() => { setAuthModo('registro'); setRegPaso(1); setAuthModalOpen(true); }}
              >
                Registrarse
              </button>
            </div>
          )}
        </div>
      </header>

      {vistaActiva === 'explorar' && (
        <main>
          <section className="hero-section">
            <div className="hero-tag">
              <span>⚡ Plataforma On-Demand Inteligente</span>
            </div>
            <h1 className="hero-heading">
              Tu Ropa Impecable, <br />
              <span className="gradient-orange">A Un Solo Clic</span> con <span className="gradient-blue">Yo Lavo</span>
            </h1>
            <p className="hero-description">
              Conectamos en tiempo real a clientes exigentes con las mejores lavanderías de la ciudad y repartidores certificados. Recojo y entrega a domicilio con seguimiento en vivo.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                className="btn-primary" 
                onClick={() => {
                  handleQuickDemoLogin('cliente');
                }}
              >
                🧺 Solicitar Lavado Ahora
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => {
                  handleQuickDemoLogin('negocio');
                }}
              >
                🏪 Registrar mi Lavandería
              </button>
              <button 
                className="btn-ghost" 
                onClick={() => {
                  handleQuickDemoLogin('delivery');
                }}
              >
                🛵 Quiero ser Repartidor
              </button>
            </div>
          </section>

          <div className="features-banner">
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-orange">🧺</div>
              <div className="stat-info">
                <span className="stat-value">18,500+</span>
                <span className="stat-label">Kilos de Ropa Lavados</span>
                <span className="stat-trend" style={{ color: 'var(--success)' }}>↑ 24% este mes</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-blue">🏪</div>
              <div className="stat-info">
                <span className="stat-value">64</span>
                <span className="stat-label">Lavanderías Afiliadas</span>
                <span className="stat-trend" style={{ color: 'var(--blue-accent)' }}>Cobertura total en Lima</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-green">🛵</div>
              <div className="stat-info">
                <span className="stat-value">35 min</span>
                <span className="stat-label">Tiempo Promedio Recojo</span>
                <span className="stat-trend" style={{ color: 'var(--success)' }}>Puntualidad 99.2%</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-orange">⭐</div>
              <div className="stat-info">
                <span className="stat-value">4.9 / 5</span>
                <span className="stat-label">Satisfacción de Clientes</span>
                <span className="stat-trend" style={{ color: 'var(--orange-light)' }}>Más de 1,200 reseñas</span>
              </div>
            </div>
          </div>

          <section className="dashboard-container">
            <div className="section-header">
              <div>
                <h2 className="section-title">
                  <span>💎</span> ¿Por qué elegir el ecosistema Yo Lavo?
                </h2>
                <p className="section-subtitle">Diseñado con tecnología de punta para una experiencia sin fricciones.</p>
              </div>
            </div>

            <div className="cards-grid">
              <div className="card-base card-accent-border">
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🧼</div>
                <h3 style={{ color: 'var(--text-white)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                  Calidad de Lavado Profesional
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Cuidado especializado según tipo de tejido: por kilo, en seco, planchado a vapor, edredones y calzado deportivo.
                </p>
                <span className="badge badge-orange">Procesos Certificados</span>
              </div>

              <div className="card-base card-blue-border">
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📍</div>
                <h3 style={{ color: 'var(--text-white)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                  Rastreo y Monitoreo en Vivo
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Notificaciones en cada etapa: Solicitud, Lavado en máquina, Listo para envío y Repartidor en camino a tu puerta.
                </p>
                <span className="badge badge-blue">GPS & Timeline</span>
              </div>

              <div className="card-base card-accent-border">
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💳</div>
                <h3 style={{ color: 'var(--text-white)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                  Pagos Cómodos y Seguros
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Paga con código QR (Yape / Plin), Efectivo contra entrega o Tarjeta de débito/crédito con cotización transparente.
                </p>
                <span className="badge badge-green">Cero Costos Ocultos</span>
              </div>
            </div>
          </section>
        </main>
      )}

      {vistaActiva === 'cliente' && (
        <main className="dashboard-container">
          <div className="card-base" style={{ background: 'linear-gradient(135deg, #091a33, #0f172a)', borderColor: 'var(--blue-primary)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="badge badge-orange">🧺 Panel del Cliente</span>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-white)', marginTop: '0.5rem' }}>
                  Hola, {user?.nombre || 'Amigo(a)'} 👋
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                  Encuentra lavanderías recomendadas cerca de tu domicilio y cotiza en segundos.
                </p>
              </div>
              <div>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setSelectedNegocio(negocios[0]);
                    setOrderModalOpen(true);
                  }}
                >
                  ➕ Nueva Solicitud de Lavado
                </button>
              </div>
            </div>
          </div>

          <div className="section-header">
            <div>
              <h2 className="section-title">
                <span>📦</span> Mis Pedidos en Curso
              </h2>
              <p className="section-subtitle">Estado en tiempo real de tus servicios solicitados</p>
            </div>
            <span className="badge badge-blue">{pedidos.length} Pedidos Registrados</span>
          </div>

          <div className="cards-grid">
            {pedidos.slice(0, 3).map((p) => (
              <div key={p.id} className="order-card card-accent-border">
                <div className="order-meta-row">
                  <span className="badge badge-orange">Pedido #{p.id}</span>
                  <span className="price-tag">S/ {p.precio_total.toFixed(2)}</span>
                </div>

                <div>
                  <h4 style={{ color: 'var(--text-white)', fontSize: '1.1rem', marginBottom: '4px' }}>
                    🏪 {p.nombre_negocio || 'Lavandería Central'}
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {p.tipo_cotizacion === 'por_kilo' ? `⚖️ ${p.cantidad} Kg de Ropa` : `👕 ${p.cantidad} Prendas`} | Pago: {p.metodo_pago.toUpperCase()}
                  </p>
                </div>

                <div className="stepper-container">
                  <div className={`stepper-step ${['solicitado', 'en_proceso', 'listo', 'en_camino', 'entregado'].includes(p.estado) ? 'completed' : ''}`}>
                    <div className="stepper-dot">1</div>
                    <span>Solicitado</span>
                  </div>
                  <div className={`stepper-step ${['en_proceso', 'listo', 'en_camino', 'entregado'].includes(p.estado) ? 'completed' : ''} ${p.estado === 'en_proceso' ? 'active' : ''}`}>
                    <div className="stepper-dot">2</div>
                    <span>Lavando</span>
                  </div>
                  <div className={`stepper-step ${['listo', 'en_camino', 'entregado'].includes(p.estado) ? 'completed' : ''} ${p.estado === 'listo' ? 'active' : ''}`}>
                    <div className="stepper-dot">3</div>
                    <span>Listo</span>
                  </div>
                  <div className={`stepper-step ${['en_camino', 'entregado'].includes(p.estado) ? 'completed' : ''} ${p.estado === 'en_camino' ? 'active' : ''}`}>
                    <div className="stepper-dot">4</div>
                    <span>En Camino</span>
                  </div>
                  <div className={`stepper-step ${p.estado === 'entregado' ? 'completed' : ''}`}>
                    <div className="stepper-dot">5</div>
                    <span>Entregado</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', background: 'var(--bg-deep)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                  📍 <strong>Entrega:</strong> {p.direccion_entrega}
                </div>

                <div className="order-actions">
                  <button className="btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => alert(`📞 Conectando con la lavandería para el Pedido #${p.id}`)}>
                    💬 Contactar Negocio
                  </button>
                  {p.estado === 'en_camino' && (
                    <button className="btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleUpdatePedidoEstado(p.id, 'entregado')}>
                      ✅ Confirmar Recibido
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="section-header" style={{ marginTop: '2.5rem' }}>
            <div>
              <h2 className="section-title">
                <span>🗺️</span> Lavanderías Disponibles Cerca de Ti
              </h2>
              <p className="section-subtitle">Calificadas por los usuarios y listas para recibir tu ropa</p>
            </div>
          </div>

          <div className="filter-bar">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Filtrar por:</span>
            <button className={`filter-pill ${filtroServicio === 'todos' ? 'active' : ''}`} onClick={() => setFiltroServicio('todos')}>
              Todos los locales
            </button>
            <button className={`filter-pill ${filtroServicio === 'kilo' ? 'active' : ''}`} onClick={() => setFiltroServicio('kilo')}>
              ⚖️ Lavado x Kilo
            </button>
            <button className={`filter-pill ${filtroServicio === 'express' ? 'active' : ''}`} onClick={() => setFiltroServicio('express')}>
              ⚡ Entrega Express 3h
            </button>
            <button className={`filter-pill ${filtroServicio === 'zapatillas' ? 'active' : ''}`} onClick={() => setFiltroServicio('zapatillas')}>
              👟 Zapatillas & Delicados
            </button>
          </div>

          <div className="cards-grid">
            {negocios.map((n) => (
              <div key={n.id} className="laundry-card">
                <div className="laundry-card-banner">
                  <span>{n.icono || '🧺'}</span>
                  <div className="laundry-card-badge">
                    <span className="badge badge-green">Abierto Hoy</span>
                  </div>
                  <div className="laundry-card-distance">
                    📍 {n.distancia || '1.2 km'}
                  </div>
                </div>

                <div className="laundry-card-body">
                  <h3 className="laundry-title">{n.nombre_negocio}</h3>
                  <div className="laundry-address">
                    <span>🏠 {n.direccion}</span>
                  </div>

                  <div className="laundry-rating-row">
                    <div className="rating-stars">
                      ⭐ {n.puntaje} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>({n.total_resenas})</span>
                    </div>
                    <div className="price-tag">
                      S/ {n.precio_kilo.toFixed(2)} / kg
                    </div>
                  </div>

                  <div className="services-chips">
                    {n.servicios.map((s, idx) => (
                      <span key={idx} className="chip">{s}</span>
                    ))}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    🔄 {n.lavadoras_disponibles} lavadoras disponibles
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <button 
                      className="btn-primary" 
                      style={{ width: '100%' }}
                      onClick={() => {
                        setSelectedNegocio(n);
                        setOrderModalOpen(true);
                      }}
                    >
                      🧺 Cotizar y Solicitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {vistaActiva === 'negocio' && (
        <main className="dashboard-container">
          <div className="card-base" style={{ background: 'linear-gradient(135deg, #091a33, #0b121e)', borderColor: 'var(--blue-primary)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="badge badge-blue">🏪 Gestión de Lavandería</span>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-white)', marginTop: '0.5rem' }}>
                  Panel Administrativo: Lavandería Burbujas Express
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                  Control de turnos, máquinas lavadoras/secadoras, pedidos entrantes y flujo de caja diario.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <span className="badge badge-green" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                  🟢 Conectado & Recibiendo Pedidos
                </span>
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-orange">📊</div>
              <div className="stat-info">
                <span className="stat-value">38 Pedidos</span>
                <span className="stat-label">Total Pedidos del Mes</span>
                <span className="stat-trend" style={{ color: 'var(--success)' }}>+14% vs mes anterior</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-green">💰</div>
              <div className="stat-info">
                <span className="stat-value">S/ 2,490.50</span>
                <span className="stat-label">Ingresos Totales</span>
                <span className="stat-trend" style={{ color: 'var(--success)' }}>+S/ 380.00 hoy</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-blue">🔄</div>
              <div className="stat-info">
                <span className="stat-value">4 / 6 Activas</span>
                <span className="stat-label">Lavadoras y Secadoras</span>
                <span className="stat-trend" style={{ color: 'var(--blue-accent)' }}>66% de capacidad en uso</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-orange">⭐</div>
              <div className="stat-info">
                <span className="stat-value">4.9 / 5.0</span>
                <span className="stat-label">Calificación de Clientes</span>
                <span className="stat-trend" style={{ color: 'var(--orange-primary)' }}>142 valoraciones</span>
              </div>
            </div>
          </div>

          <div className="section-header">
            <div>
              <h2 className="section-title">
                <span>🔄</span> Monitoreo de Lavadoras y Secadoras
              </h2>
              <p className="section-subtitle">Haz clic en cualquier máquina para alternar su estado o iniciar ciclo</p>
            </div>
            <button className="btn-secondary btn-sm" onClick={() => alert('Para añadir una nueva lavadora se sincroniza con el catálogo de equipos')}>
              ➕ Añadir Equipo
            </button>
          </div>

          <div className="cards-grid">
            {lavadoras.map((m) => (
              <div key={m.id} className="machine-card" style={{
                borderColor: m.estado === 'ocupada' ? 'var(--blue-primary)' : m.estado === 'disponible' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
              }}>
                <div className="machine-header">
                  <div>
                    <h4 style={{ color: 'var(--text-white)', fontWeight: 700 }}>{m.numero_lavadora}</h4>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                      {m.tipo} • {m.capacidad_kg} Kg
                    </span>
                  </div>
                  <span className={`badge ${m.estado === 'disponible' ? 'badge-green' : m.estado === 'ocupada' ? 'badge-blue' : 'badge-yellow'}`}>
                    {m.estado.toUpperCase()}
                  </span>
                </div>

                <div className={`machine-drum ${m.estado === 'ocupada' ? 'spinning' : ''}`}>
                  {m.tipo === 'lavadora' ? '🫧' : '💨'}
                </div>

                {m.estado === 'ocupada' ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span>Ciclo en proceso</span>
                      <strong style={{ color: 'var(--orange-primary)' }}>{m.tiempo_restante || 15} min restantes</strong>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center' }}>
                    {m.estado === 'disponible' ? 'Listo para recibir carga de ropa' : 'En mantenimiento preventivo'}
                  </p>
                )}

                <button 
                  className={`btn-sm ${m.estado === 'disponible' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ width: '100%', marginTop: '0.25rem' }}
                  onClick={() => handleToggleLavadora(m.id)}
                >
                  {m.estado === 'disponible' ? '▶ Iniciar Lavado' : m.estado === 'ocupada' ? '⏹ Finalizar Ciclo' : '🔧 Habilitar'}
                </button>
              </div>
            ))}
          </div>

          <div className="section-header" style={{ marginTop: '2.5rem' }}>
            <div>
              <h2 className="section-title">
                <span>📥</span> Solicitudes y Pedidos de Clientes
              </h2>
              <p className="section-subtitle">Gestiona el progreso de lavado y asignación de delivery</p>
            </div>
            <span className="badge badge-orange">{pedidos.length} Pedidos Activos</span>
          </div>

          <div className="cards-grid">
            {pedidos.map((p) => (
              <div key={p.id} className="order-card card-blue-border">
                <div className="order-meta-row">
                  <span className="badge badge-orange">Pedido #{p.id}</span>
                  <span className={`badge ${p.estado === 'solicitado' ? 'badge-yellow' : p.estado === 'en_proceso' ? 'badge-blue' : 'badge-green'}`}>
                    {p.estado.toUpperCase()}
                  </span>
                </div>

                <div>
                  <h4 style={{ color: 'var(--text-white)', fontSize: '1.1rem' }}>
                    👤 {p.cliente_nombre}
                  </h4>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    📞 {p.cliente_telefono || '+51 900 000 000'} | 📍 {p.direccion_recojo}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '1px solid #1a2538', borderBottom: '1px solid #1a2538' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {p.tipo_cotizacion === 'por_kilo' ? `⚖️ ${p.cantidad} Kg` : `👕 ${p.cantidad} Prendas`}
                  </span>
                  <strong style={{ color: 'var(--orange-primary)', fontSize: '1rem' }}>
                    S/ {p.precio_total.toFixed(2)}
                  </strong>
                </div>

                {p.notas && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--orange-light)', background: 'rgba(255, 107, 0, 0.08)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                    📝 Nota: {p.notas}
                  </div>
                )}

                <div className="order-actions">
                  {p.estado === 'solicitado' && (
                    <button className="btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleUpdatePedidoEstado(p.id, 'en_proceso')}>
                      ✓ Aceptar y Lavar
                    </button>
                  )}
                  {p.estado === 'en_proceso' && (
                    <button className="btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleUpdatePedidoEstado(p.id, 'listo')}>
                      ✨ Marcar como Listo
                    </button>
                  )}
                  {p.estado === 'listo' && (
                    <button className="btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleUpdatePedidoEstado(p.id, 'en_camino')}>
                      🛵 Despachar a Delivery
                    </button>
                  )}
                  <button className="btn-ghost btn-sm" onClick={() => alert(`Llamando al cliente ${p.cliente_nombre}: ${p.cliente_telefono}`)}>
                    📞 Contactar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="section-header" style={{ marginTop: '2.5rem' }}>
            <div>
              <h2 className="section-title">
                <span>🧴</span> Catálogo e Insumos de Lavandería
              </h2>
              <p className="section-subtitle">Stock de detergentes, suavizantes y químicos de cuidado</p>
            </div>
          </div>

          <div className="cards-grid">
            {productos.map((prod) => (
              <div key={prod.id} className="card-base" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '2rem' }}>{prod.icono || '🧴'}</span>
                  <div>
                    <h4 style={{ color: 'var(--text-white)', fontSize: '1rem' }}>{prod.nombre}</h4>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'capitalize' }}>{prod.tipo}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ color: 'var(--orange-primary)', fontWeight: 800, fontSize: '1.1rem' }}>
                    S/ {prod.precio.toFixed(2)}
                  </span>
                  <span className={`badge ${prod.stock < 10 ? 'badge-yellow' : 'badge-green'}`}>
                    Stock: {prod.stock} un.
                  </span>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {vistaActiva === 'delivery' && (
        <main className="dashboard-container">
          <div className="card-base" style={{ background: 'linear-gradient(135deg, #091a33, #0b121e)', borderColor: 'var(--orange-border)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="badge badge-orange">🛵 Panel Repartidor</span>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-white)', marginTop: '0.5rem' }}>
                  Rider: {user?.nombre || 'Repartidor Yo Lavo'}
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                  Acepta carreras cercanas, optimiza tu ruta y cobra tus ganancias en tiempo real.
                </p>
              </div>
              <div>
                <span className="badge badge-green" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                  🟢 En Línea • Recibiendo Pedidos
                </span>
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-orange">💵</div>
              <div className="stat-info">
                <span className="stat-value">S/ 184.00</span>
                <span className="stat-label">Ganancia de Hoy</span>
                <span className="stat-trend" style={{ color: 'var(--success)' }}>+S/ 24.00 propinas</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-blue">🛵</div>
              <div className="stat-info">
                <span className="stat-value">16 Carreras</span>
                <span className="stat-label">Entregas Completadas</span>
                <span className="stat-trend" style={{ color: 'var(--blue-accent)' }}>100% efectividad</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-green">⏳</div>
              <div className="stat-info">
                <span className="stat-value">S/ 64.00</span>
                <span className="stat-label">Saldo Pendiente de Cobro</span>
                <span className="stat-trend" style={{ color: 'var(--warning)' }}>Retiro disponible hoy</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-orange">⭐</div>
              <div className="stat-info">
                <span className="stat-value">4.95 / 5</span>
                <span className="stat-label">Puntaje del Repartidor</span>
                <span className="stat-trend" style={{ color: 'var(--orange-primary)' }}>Nivel Gold Rider</span>
              </div>
            </div>
          </div>

          {activeDeliveryOrder && (
            <div style={{ margin: '2rem 0' }}>
              <div className="section-header">
                <div>
                  <h2 className="section-title">
                    <span>⚡</span> Carrera Activa en Progreso
                  </h2>
                  <p className="section-subtitle">Ruta actual asignada para recojo y entrega</p>
                </div>
                <span className="badge badge-orange">En Camino 🛵</span>
              </div>

              <div className="delivery-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span className="badge badge-blue">Orden #{activeDeliveryOrder.id}</span>
                    <h3 style={{ color: 'var(--text-white)', fontSize: '1.35rem', marginTop: '0.35rem' }}>
                      {activeDeliveryOrder.nombre_negocio || 'Lavandería Burbujas Express'} → {activeDeliveryOrder.cliente_nombre}
                    </h3>
                  </div>
                  <div className="delivery-pay-badge">
                    Pago Carrera: S/ 14.50
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-deep)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div className="route-point">
                    <div className="route-icon-dot start"></div>
                    <div>
                      <strong style={{ color: 'var(--text-white)' }}>Punto A (Recojo):</strong>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{activeDeliveryOrder.direccion_recojo}</p>
                    </div>
                  </div>
                  <div className="route-point">
                    <div className="route-icon-dot end"></div>
                    <div>
                      <strong style={{ color: 'var(--text-white)' }}>Punto B (Entrega al Cliente):</strong>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{activeDeliveryOrder.direccion_entrega}</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={() => alert('Abriendo navegación en Google Maps / Waze con la ruta optimizada')}>
                    🗺️ Abrir Navegación GPS
                  </button>
                  <button className="btn-ghost" onClick={() => alert(`Llamando al cliente ${activeDeliveryOrder.cliente_nombre}`)}>
                    📞 Llamar Cliente
                  </button>
                  <button 
                    className="btn-primary" 
                    style={{ flex: 1 }}
                    onClick={() => {
                      handleUpdatePedidoEstado(activeDeliveryOrder.id, 'entregado');
                      setActiveDeliveryOrder(null);
                      alert('🎉 ¡Entrega finalizada con éxito! Se han sumado S/ 14.50 a tu billetera.');
                    }}
                  >
                    ✅ Marcar Pedido como Entregado
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="section-header" style={{ marginTop: '2.5rem' }}>
            <div>
              <h2 className="section-title">
                <span>📦</span> Nuevas Solicitudes de Delivery Disponibles
              </h2>
              <p className="section-subtitle">Carreras listas en tu zona con cobro inmediato</p>
            </div>
            <button className="btn-ghost btn-sm" onClick={() => alert('Lista de pedidos actualizada')}>
              🔄 Actualizar Radar
            </button>
          </div>

          <div className="cards-grid">
            {pedidos.filter(p => p.id !== activeDeliveryOrder?.id).map((p) => (
              <div key={p.id} className="order-card card-accent-border">
                <div className="order-meta-row">
                  <span className="badge badge-orange">Pedido #{p.id}</span>
                  <span className="delivery-pay-badge" style={{ fontSize: '0.95rem' }}>+S/ 12.00</span>
                </div>

                <div>
                  <h4 style={{ color: 'var(--text-white)', fontSize: '1.05rem' }}>
                    🏪 {p.nombre_negocio || 'EcoLavado'}
                  </h4>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    Cliente: {p.cliente_nombre}
                  </p>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div>📍 <strong>Recoger:</strong> {p.direccion_recojo}</div>
                  <div style={{ marginTop: '3px' }}>🏁 <strong>Llevar:</strong> {p.direccion_entrega}</div>
                </div>

                <button 
                  className="btn-primary btn-sm" 
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  onClick={() => handleAceptarCarreraDelivery(p)}
                >
                  🛵 Aceptar Carrera (+S/ 12.00)
                </button>
              </div>
            ))}
          </div>
        </main>
      )}

      {orderModalOpen && selectedNegocio && (
        <div className="modal-overlay" onClick={() => setOrderModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-orange">Cotizador Inteligente</span>
                <h2 style={{ color: 'var(--text-white)', fontSize: '1.35rem', marginTop: '4px' }}>
                  {selectedNegocio.nombre_negocio}
                </h2>
              </div>
              <button className="btn-ghost btn-sm" onClick={() => setOrderModalOpen(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button 
                type="button"
                className={`btn-secondary ${quoteType === 'por_kilo' ? 'active' : ''}`}
                style={{ flex: 1, borderColor: quoteType === 'por_kilo' ? 'var(--orange-primary)' : 'var(--border-subtle)', background: quoteType === 'por_kilo' ? 'var(--orange-soft)' : 'var(--blue-dark)' }}
                onClick={() => setQuoteType('por_kilo')}
              >
                ⚖️ Lavado Por Kilo
              </button>
              <button 
                type="button"
                className={`btn-secondary ${quoteType === 'por_prenda' ? 'active' : ''}`}
                style={{ flex: 1, borderColor: quoteType === 'por_prenda' ? 'var(--orange-primary)' : 'var(--border-subtle)', background: quoteType === 'por_prenda' ? 'var(--orange-soft)' : 'var(--blue-dark)' }}
                onClick={() => setQuoteType('por_prenda')}
              >
                👕 Lavado Por Prenda
              </button>
            </div>

            {quoteType === 'por_kilo' ? (
              <div className="card-base" style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-deep)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-white)' }}>Peso Estimado en Kilogramos</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tarifa: S/ {selectedNegocio.precio_kilo.toFixed(2)} por Kg</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button className="btn-ghost btn-sm" onClick={() => setKilosCount(Math.max(1, kilosCount - 1))}>-</button>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--orange-primary)' }}>{kilosCount} Kg</span>
                    <button className="btn-ghost btn-sm" onClick={() => setKilosCount(kilosCount + 1)}>+</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card-base" style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-deep)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-white)' }}>Número de Prendas Delicadas</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ternos, vestidos, casacas (S/ 12.00 c/u)</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button className="btn-ghost btn-sm" onClick={() => setPrendasCount(Math.max(1, prendasCount - 1))}>-</button>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--orange-primary)' }}>{prendasCount}</span>
                    <button className="btn-ghost btn-sm" onClick={() => setPrendasCount(prendasCount + 1)}>+</button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="checkbox" 
                  checked={includeSuavizante} 
                  onChange={e => setIncludeSuavizante(e.target.checked)} 
                  style={{ accentColor: 'var(--orange-primary)', width: '18px', height: '18px' }}
                />
                <span>🌸 Añadir Suavizante Textil Hipoalergénico (+S/ 3.50)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="checkbox" 
                  checked={isExpress} 
                  onChange={e => setIsExpress(e.target.checked)} 
                  style={{ accentColor: 'var(--orange-primary)', width: '18px', height: '18px' }}
                />
                <span>⚡ Servicio Ultra Express con entrega en 3 horas (+S/ 10.00)</span>
              </label>

              <div className="form-group">
                <label className="form-label">🧴 Productos del Negocio (Ace/Enjuague)</label>
                <select
                  className="input-field"
                  value={selectedProducto ? String(selectedProducto.id) : ''}
                  onChange={e => {
                    const p = productos.find(x => String(x.id) === e.target.value) || null;
                    setSelectedProducto(p);
                  }}
                >
                  <option value="">Sin producto adicional</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} - S/ {p.precio.toFixed(2)} (Stock: {p.stock})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">📍 Dirección de Recojo y Entrega</label>
              <input 
                className="input-field" 
                value={orderAddress} 
                onChange={e => setOrderAddress(e.target.value)} 
                placeholder="Ej. Av. Larco 450, Dpto 201"
              />
            </div>

            <div className="form-group">
              <label className="form-label">📝 Notas o Instrucciones Especiales</label>
              <input 
                className="input-field" 
                value={orderNotes} 
                onChange={e => setOrderNotes(e.target.value)} 
                placeholder="Ej. Ropa de color separada, no usar secadora caliente"
              />
            </div>

            <div className="form-group">
              <label className="form-label">💳 Método de Pago</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  className={`btn-ghost ${paymentMethod === 'qr' ? 'active' : ''}`}
                  style={{ borderColor: paymentMethod === 'qr' ? 'var(--orange-primary)' : 'var(--border-subtle)', background: paymentMethod === 'qr' ? 'var(--orange-soft)' : 'transparent' }}
                  onClick={() => setPaymentMethod('qr')}
                >
                  📱 Yape / Plin
                </button>
                <button 
                  type="button" 
                  className={`btn-ghost ${paymentMethod === 'efectivo' ? 'active' : ''}`}
                  style={{ borderColor: paymentMethod === 'efectivo' ? 'var(--orange-primary)' : 'var(--border-subtle)', background: paymentMethod === 'efectivo' ? 'var(--orange-soft)' : 'transparent' }}
                  onClick={() => setPaymentMethod('efectivo')}
                >
                  💵 Efectivo
                </button>
                <button 
                  type="button" 
                  className={`btn-ghost ${paymentMethod === 'tarjeta' ? 'active' : ''}`}
                  style={{ borderColor: paymentMethod === 'tarjeta' ? 'var(--orange-primary)' : 'var(--border-subtle)', background: paymentMethod === 'tarjeta' ? 'var(--orange-soft)' : 'transparent' }}
                  onClick={() => setPaymentMethod('tarjeta')}
                >
                  💳 Tarjeta
                </button>
              </div>
            </div>

            {paymentMethod === 'qr' && (
              <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=YoLavo-Pago-${calculateTotal().toFixed(2)}`}
                  alt="QR de pago"
                  style={{ borderRadius: '8px', border: '2px solid var(--orange-border)' }}
                />
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.4rem' }}>Escanea para pagar con Yape o Plin</div>
              </div>
            )}

            <div style={{ background: 'linear-gradient(135deg, #0f1a2e, #13243f)', border: '1px solid var(--orange-border)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.25rem 0' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Estimado a Pagar:</span>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Incluye recojo a domicilio</div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--orange-primary)' }}>
                S/ {calculateTotal().toFixed(2)}
              </div>
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%' }}
              onClick={handleCrearPedido}
            >
              🚀 Confirmar Pedido de Lavado
            </button>
          </div>
        </div>
      )}

      {authModalOpen && (
        <div className="modal-overlay" onClick={() => setAuthModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🧺</div>
              <h2 style={{ color: 'var(--text-white)', fontSize: '1.5rem', fontWeight: 800 }}>
                {authModo === 'login' ? 'Bienvenido a Yo Lavo' : 'Crear Cuenta Nueva'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {authModo === 'login' ? 'Ingresa con tus credenciales o accede con 1 clic' : 'Regístrate como Cliente, Negocio o Delivery'}
              </p>
            </div>

            <div style={{ background: 'var(--bg-deep)', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px dashed var(--orange-border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--orange-light)', marginBottom: '0.5rem', textAlign: 'center' }}>
                ⚡ ACCESO RÁPIDO PARA PRUEBAS (1 CLIC):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                <button className="btn-secondary btn-sm" onClick={() => handleQuickDemoLogin('cliente')}>
                  🧺 Cliente
                </button>
                <button className="btn-secondary btn-sm" onClick={() => handleQuickDemoLogin('negocio')}>
                  🏪 Negocio
                </button>
                <button className="btn-secondary btn-sm" onClick={() => handleQuickDemoLogin('delivery')}>
                  🛵 Delivery
                </button>
              </div>
            </div>

            {(authModo === 'login' || (authModo === 'registro' && regPaso === 2)) && (
            <div className="form-group">
              <label className="form-label">Selecciona tu Rol</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  className={`btn-ghost ${authModo === 'login' ? (logForm.rol === 'cliente' ? 'active' : '') : (regForm.rol === 'cliente' ? 'active' : '')}`}
                  style={{
                    borderColor: (authModo === 'login' ? logForm.rol === 'cliente' : regForm.rol === 'cliente') ? 'var(--orange-primary)' : 'var(--border-subtle)',
                    background: (authModo === 'login' ? logForm.rol === 'cliente' : regForm.rol === 'cliente') ? 'var(--orange-soft)' : 'transparent'
                  }}
                  onClick={() => authModo === 'login' ? setLogForm({ ...logForm, rol: 'cliente' }) : setRegForm({ ...regForm, rol: 'cliente' })}
                >
                  🧺 Cliente
                </button>
                <button 
                  type="button" 
                  className={`btn-ghost ${authModo === 'login' ? (logForm.rol === 'negocio' ? 'active' : '') : (regForm.rol === 'negocio' ? 'active' : '')}`}
                  style={{
                    borderColor: (authModo === 'login' ? logForm.rol === 'negocio' : regForm.rol === 'negocio') ? 'var(--orange-primary)' : 'var(--border-subtle)',
                    background: (authModo === 'login' ? logForm.rol === 'negocio' : regForm.rol === 'negocio') ? 'var(--orange-soft)' : 'transparent'
                  }}
                  onClick={() => authModo === 'login' ? setLogForm({ ...logForm, rol: 'negocio' }) : setRegForm({ ...regForm, rol: 'negocio' })}
                >
                  🏪 Negocio
                </button>
                <button 
                  type="button" 
                  className={`btn-ghost ${authModo === 'login' ? (logForm.rol === 'delivery' ? 'active' : '') : (regForm.rol === 'delivery' ? 'active' : '')}`}
                  style={{
                    borderColor: (authModo === 'login' ? logForm.rol === 'delivery' : regForm.rol === 'delivery') ? 'var(--orange-primary)' : 'var(--border-subtle)',
                    background: (authModo === 'login' ? logForm.rol === 'delivery' : regForm.rol === 'delivery') ? 'var(--orange-soft)' : 'transparent'
                  }}
                  onClick={() => authModo === 'login' ? setLogForm({ ...logForm, rol: 'delivery' }) : setRegForm({ ...regForm, rol: 'delivery' })}
                >
                  🛵 Delivery
                </button>
              </div>
            </div>
            )}

            {authModo === 'login' ? (
              <form onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label className="form-label">Correo Electrónico</label>
                  <input 
                    type="email" 
                    required 
                    className="input-field" 
                    placeholder="usuario@yolavo.pe"
                    value={logForm.correo}
                    onChange={e => setLogForm({ ...logForm, correo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contraseña</label>
                  <input 
                    type="password" 
                    required 
                    className="input-field" 
                    placeholder="••••••••"
                    value={logForm.contrasena}
                    onChange={e => setLogForm({ ...logForm, contrasena: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.75rem' }}>
                  Iniciar Sesión
                </button>
              </form>
            ) : (
              <form onSubmit={(e) => {
                if (regPaso === 1) {
                  e.preventDefault();
                  if (regForm.contrasena !== regForm.contrasena2) { alert('Las contraseñas no coinciden'); return; }
                  setRegPaso(2);
                } else {
                  handleRegisterSubmit(e);
                }
              }}>
                {regPaso === 1 && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Nombre Completo</label>
                      <input 
                        required 
                        className="input-field" 
                        placeholder="Ej. Juan Pérez"
                        value={regForm.nombre_completo}
                        onChange={e => setRegForm({ ...regForm, nombre_completo: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Usuario</label>
                      <input 
                        required 
                        className="input-field" 
                        placeholder="juanperez"
                        value={regForm.usuario}
                        onChange={e => setRegForm({ ...regForm, usuario: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Correo Electrónico</label>
                      <input 
                        type="email" 
                        required 
                        className="input-field" 
                        placeholder="juan@yolavo.pe"
                        value={regForm.correo}
                        onChange={e => setRegForm({ ...regForm, correo: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <input 
                          type="password" 
                          required 
                          className="input-field" 
                          placeholder="••••••"
                          value={regForm.contrasena}
                          onChange={e => setRegForm({ ...regForm, contrasena: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Confirmar</label>
                        <input 
                          type="password" 
                          required 
                          className="input-field" 
                          placeholder="••••••"
                          value={regForm.contrasena2}
                          onChange={e => setRegForm({ ...regForm, contrasena2: e.target.value })}
                        />
                      </div>
                    </div>
                    <button type="button" className="btn-primary" style={{ width: '100%', marginTop: '0.75rem' }} onClick={() => {
                      if (regForm.contrasena !== regForm.contrasena2) { alert('Las contraseñas no coinciden'); return; }
                      setRegPaso(2);
                    }}>
                      Continuar
                    </button>
                  </>
                )}
                {regPaso === 2 && (
                  <>
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1rem' }}>¿Cómo quieres registrarte?</p>
                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.75rem' }}>
                      Crear Cuenta Ahora
                    </button>
                    <button type="button" className="btn-ghost btn-sm" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setRegPaso(1)}>
                      Volver
                    </button>
                  </>
                )}
              </form>
            )}

            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <button 
                type="button" 
                className="btn-ghost btn-sm"
                onClick={() => { setAuthModo(authModo === 'login' ? 'registro' : 'login'); setRegPaso(1); }}
              >
                {authModo === 'login' ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <div className="footer-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.3rem' }}>🧺</span>
            <span style={{ fontWeight: 800, color: 'var(--text-white)' }}>YO LAVO</span>
            <span>— Plataforma Unificada de Lavanderías On-Demand</span>
          </div>
          <ul className="footer-links">
            <li><a href="#terminos" onClick={(e) => { e.preventDefault(); alert('Yo Lavo - Términos y Condiciones'); }}>Términos</a></li>
            <li><a href="#privacidad" onClick={(e) => { e.preventDefault(); alert('Yo Lavo - Política de Privacidad'); }}>Privacidad</a></li>
            <li><a href="#soporte" onClick={(e) => { e.preventDefault(); alert('Soporte Yo Lavo: soporte@yolavo.pe'); }}>Soporte 24/7</a></li>
          </ul>
        </div>
      </footer>
    </div>
  );
}

export default App;
