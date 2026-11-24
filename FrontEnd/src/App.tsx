import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:3001/api';

// Data Interfaces
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
  distrito: string;
  distancia: string;
  puntaje: number;
  total_resenas: number;
  precio_kilo: number;
  servicios: string[];
  lavadoras_disponibles: number;
  icono: string;
  tiempo_entrega: string;
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
  estado: 'solicitado' | 'en_proceso' | 'listo' | 'en_camino' | 'entregado' | 'cancelado';
  metodo_pago: 'qr' | 'efectivo' | 'tarjeta';
  direccion_recojo: string;
  direccion_entrega: string;
  notas?: string;
  fecha?: string;
  tiempo_estimado?: string;
}

export interface Lavadora {
  id: number;
  numero_lavadora: string;
  tipo: 'lavadora' | 'secadora';
  capacidad_kg: number;
  estado: 'disponible' | 'ocupada' | 'mantenimiento';
  tiempo_restante?: number;
  ciclo_nombre?: string;
}

export interface Producto {
  id: number;
  nombre: string;
  tipo: string;
  precio: number;
  stock: number;
  icono: string;
}

// Mock initial data with high realism
const MOCK_NEGOCIOS: Negocio[] = [
  {
    id: 1,
    nombre_negocio: 'Lavandería Burbujas Express',
    direccion: 'Av. Las Palmeras 482',
    distrito: 'San Isidro',
    distancia: '0.8 km',
    puntaje: 4.9,
    total_resenas: 142,
    precio_kilo: 7.50,
    servicios: ['Por Kilo', 'Lavado en Seco', 'Secado Express', 'Zapatillas'],
    lavadoras_disponibles: 4,
    icono: '🫧',
    tiempo_entrega: '30-45 min'
  },
  {
    id: 2,
    nombre_negocio: 'EcoLavado Inteligente',
    direccion: 'Calle Los Sauces 112',
    distrito: 'Miraflores',
    distancia: '1.4 km',
    puntaje: 4.8,
    total_resenas: 98,
    precio_kilo: 8.00,
    servicios: ['Detergente Ecológico', 'Por Kilo', 'Vapor Planchado', 'Edredones'],
    lavadoras_disponibles: 6,
    icono: '🌿',
    tiempo_entrega: '40-50 min'
  },
  {
    id: 3,
    nombre_negocio: 'Master Clean & Tintorería',
    direccion: 'Av. Primavera 920',
    distrito: 'Surco',
    distancia: '2.1 km',
    puntaje: 4.95,
    total_resenas: 215,
    precio_kilo: 9.00,
    servicios: ['Ternos y Vestidos', 'Desmanchado', 'Entrega en 3h', 'Por Prenda'],
    lavadoras_disponibles: 2,
    icono: '👔',
    tiempo_entrega: '25-35 min'
  },
  {
    id: 4,
    nombre_negocio: 'LavaFlash 24 Horas',
    direccion: 'Jr. Huancavelica 304',
    distrito: 'Centro de Lima',
    distancia: '3.0 km',
    puntaje: 4.7,
    total_resenas: 84,
    precio_kilo: 6.90,
    servicios: ['Económico', 'Lavado Rápido', 'Ropa de Cama'],
    lavadoras_disponibles: 5,
    icono: '⚡',
    tiempo_entrega: '45-60 min'
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
    fecha: 'Hoy, 10:30 AM',
    tiempo_estimado: '15 min para entrega'
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
    fecha: 'Hoy, 11:15 AM',
    tiempo_estimado: 'Lavado en tambor'
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
    fecha: 'Hoy, 12:00 PM',
    tiempo_estimado: 'Buscando repartidor'
  }
];

const MOCK_LAVADORAS: Lavadora[] = [
  { id: 1, numero_lavadora: 'LAV-01', tipo: 'lavadora', capacidad_kg: 15, estado: 'ocupada', tiempo_restante: 18, ciclo_nombre: 'Lavado Profundo + Centrifugado' },
  { id: 2, numero_lavadora: 'LAV-02', tipo: 'lavadora', capacidad_kg: 15, estado: 'disponible' },
  { id: 3, numero_lavadora: 'LAV-03', tipo: 'lavadora', capacidad_kg: 20, estado: 'ocupada', tiempo_restante: 32, ciclo_nombre: 'Ciclo Edredones XXL' },
  { id: 4, numero_lavadora: 'SEC-01', tipo: 'secadora', capacidad_kg: 18, estado: 'disponible' },
  { id: 5, numero_lavadora: 'SEC-02', tipo: 'secadora', capacidad_kg: 18, estado: 'ocupada', tiempo_restante: 12, ciclo_nombre: 'Secado Aire Caliente Suave' },
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
      // fallback
    }
    return 'explorar';
  });

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState<{ text: string; icon: string } | null>(null);

  const showToast = (text: string, icon: string = '✨') => {
    setToastMsg({ text, icon });
    setTimeout(() => setToastMsg(null), 3600);
  };

  // Auth Modal State
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

  // Data states
  const [negocios, setNegocios] = useState<Negocio[]>(MOCK_NEGOCIOS);
  const [pedidos, setPedidos] = useState<Pedido[]>(MOCK_PEDIDOS);
  const [lavadoras, setLavadoras] = useState<Lavadora[]>(MOCK_LAVADORAS);
  const [productos, setProductos] = useState<Producto[]>(MOCK_PRODUCTOS);
  const [filtroServicio, setFiltroServicio] = useState<string>('todos');
  const [busquedaLocal, setBusquedaLocal] = useState<string>('');

  // Interactive Quote / Order Modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedNegocio, setSelectedNegocio] = useState<Negocio | null>(null);
  const [quoteType, setQuoteType] = useState<'por_kilo' | 'por_prenda'>('por_kilo');
  const [kilosCount, setKilosCount] = useState<number>(4);
  const [prendasCount, setPrendasCount] = useState<number>(3);
  const [includeSuavizante, setIncludeSuavizante] = useState(true);
  const [isExpress, setIsExpress] = useState(false);
  const [orderAddress, setOrderAddress] = useState('Av. Benavides 1240, Dpto 301, Miraflores');
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'efectivo' | 'tarjeta'>('qr');
  const [orderNotes, setOrderNotes] = useState('');

  // Delivery view active trip state
  const [activeDeliveryOrder, setActiveDeliveryOrder] = useState<Pedido | null>(MOCK_PEDIDOS[0]);

  // Sync with real backend if available
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

  // Auth Handlers
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
      showToast(`¡Bienvenido de nuevo, ${res.data.user.nombre}!`, '👋');
    } catch {
      // Offline fallback demo login
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
      showToast(`Sesión iniciada como ${demoUser.rol.toUpperCase()}`, '🔐');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regForm.contrasena !== regForm.contrasena2) {
      showToast('Las contraseñas no coinciden', '⚠️');
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/registro`, regForm);
      setUser(res.data);
      localStorage.setItem('yolavo_user', JSON.stringify(res.data));
      setVistaActiva(regForm.rol);
      setAuthModalOpen(false);
      showToast('¡Cuenta creada exitosamente!', '🎉');
    } catch {
      // Offline fallback
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
      showToast('¡Bienvenido a Yo Lavo!', '🚀');
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
    showToast(`Modo Demo: ${rol.toUpperCase()} activado`, '⚡');
  };

  const logout = () => {
    localStorage.removeItem('yolavo_user');
    localStorage.removeItem('yolavo_token');
    setUser(null);
    setToken(null);
    setVistaActiva('explorar');
    showToast('Sesión cerrada correctamente', '🚪');
  };

  // Order Calculation
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
      notas: orderNotes || (includeSuavizante ? 'Incluye suavizante floral' : ''),
      fecha: 'Justo ahora',
      tiempo_estimado: 'Repartidor asignándose'
    };

    setPedidos([nuevoPedido, ...pedidos]);
    setOrderModalOpen(false);
    showToast(`¡Pedido #${nuevoPedido.id} creado con éxito para ${selectedNegocio.nombre_negocio}!`, '🧺');
  };

  const handleToggleLavadora = (id: number) => {
    setLavadoras(lavadoras.map(m => {
      if (m.id === id) {
        if (m.estado === 'disponible') {
          showToast(`${m.numero_lavadora}: Ciclo iniciado (35 min)`, '▶️');
          return { ...m, estado: 'ocupada', tiempo_restante: 35, ciclo_nombre: 'Lavado Normal + Centrifugado' };
        } else if (m.estado === 'ocupada') {
          showToast(`${m.numero_lavadora}: Ciclo finalizado`, '⏹️');
          return { ...m, estado: 'disponible', tiempo_restante: undefined, ciclo_nombre: undefined };
        } else {
          showToast(`${m.numero_lavadora}: Mantenimiento concluido, disponible`, '🔧');
          return { ...m, estado: 'disponible' };
        }
      }
      return m;
    }));
  };

  const handleUpdatePedidoEstado = (pedidoId: number, nuevoEstado: Pedido['estado']) => {
    setPedidos(pedidos.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p));
    showToast(`Pedido #${pedidoId} actualizado a: ${nuevoEstado.toUpperCase()}`, '🔄');
  };

  const handleAceptarCarreraDelivery = (pedido: Pedido) => {
    setActiveDeliveryOrder(pedido);
    setPedidos(pedidos.map(p => p.id === pedido.id ? { ...p, estado: 'en_camino' } : p));
    showToast(`¡Carrera asignada! Recoger en ${pedido.nombre_negocio || 'la lavandería'}`, '🛵');
  };

  // Filtered laundry list
  const negociosFiltrados = negocios.filter(n => {
    const matchBusqueda = n.nombre_negocio.toLowerCase().includes(busquedaLocal.toLowerCase()) ||
                          n.direccion.toLowerCase().includes(busquedaLocal.toLowerCase()) ||
                          n.distrito.toLowerCase().includes(busquedaLocal.toLowerCase());
    if (!matchBusqueda) return false;

    if (filtroServicio === 'kilo') return n.servicios.some(s => s.toLowerCase().includes('kilo'));
    if (filtroServicio === 'express') return n.servicios.some(s => s.toLowerCase().includes('express') || s.toLowerCase().includes('3h'));
    if (filtroServicio === 'zapatillas') return n.servicios.some(s => s.toLowerCase().includes('zapatillas') || s.toLowerCase().includes('edredones'));
    return true;
  });

  return (
    <div className="app-wrapper">
      {/* Floating Modern Toast Notification */}
      {toastMsg && (
        <div className="toast-notification">
          <span style={{ fontSize: '1.4rem' }}>{toastMsg.icon}</span>
          <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{toastMsg.text}</span>
        </div>
      )}

      {/* Top Glass Navbar */}
      <header className="header-nav">
        <div className="brand-container" onClick={() => setVistaActiva('explorar')}>
          <div className="brand-icon-wrapper">
            <span>🧺</span>
          </div>
          <div className="brand-text-col">
            <div className="brand-title">
              YO<span>LAVO</span>
              <span className="brand-badge">PRO</span>
            </div>
          </div>
        </div>

        {/* Global Role Switcher Dock */}
        <nav className="role-switcher-toolbar" aria-label="Selección de modo">
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
        </nav>

        {/* User Pill & Auth Buttons */}
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
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button 
                className="btn-ghost btn-sm" 
                onClick={() => { setAuthModo('login'); setAuthModalOpen(true); }}
              >
                🔐 Iniciar Sesión
              </button>
              <button 
                className="btn-primary btn-sm" 
                onClick={() => { setAuthModo('registro'); setAuthModalOpen(true); }}
              >
                Registrarse
              </button>
            </div>
          )}
        </div>
      </header>

      {/* =========================================================================
          VIEW: EXPLORAR / LANDING
          ========================================================================= */}
      {vistaActiva === 'explorar' && (
        <main>
          <section className="hero-section">
            <div className="hero-tag">
              <span className="badge-pulse-dot" style={{ background: 'var(--orange-400)' }}></span>
              <span>Plataforma Inteligente de Lavanderías On-Demand en Perú</span>
            </div>
            <h1 className="hero-heading">
              Tu Ropa Impecable, <br />
              <span className="text-gradient-orange">En Tu Puerta</span> con <span className="text-gradient-blue">Yo Lavo</span>
            </h1>
            <p className="hero-description">
              Conectamos en tiempo real a clientes con las mejores lavanderías de la ciudad y repartidores certificados. Recojo programado, lavado por kilo o prenda y monitoreo en vivo de cada ciclo.
            </p>
            <div className="hero-action-buttons">
              <button 
                className="btn-primary" 
                onClick={() => handleQuickDemoLogin('cliente')}
              >
                🧺 Solicitar Lavado Ahora
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => handleQuickDemoLogin('negocio')}
              >
                🏪 Registrar mi Lavandería
              </button>
              <button 
                className="btn-ghost" 
                onClick={() => handleQuickDemoLogin('delivery')}
              >
                🛵 Quiero ser Repartidor
              </button>
            </div>
          </section>

          {/* KPI Metrics Cards */}
          <section className="features-banner">
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-orange">🧺</div>
              <div className="stat-info">
                <span className="stat-value">18,500+</span>
                <span className="stat-label">Kilos de Ropa Lavados</span>
                <span className="stat-trend" style={{ color: 'var(--emerald-400)' }}>↑ +24% este mes</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-blue">🏪</div>
              <div className="stat-info">
                <span className="stat-value">64 Locales</span>
                <span className="stat-label">Lavanderías Afiliadas</span>
                <span className="stat-trend" style={{ color: 'var(--blue-400)' }}>Lima, San Isidro, Miraflores</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-green">🛵</div>
              <div className="stat-info">
                <span className="stat-value">32 min</span>
                <span className="stat-label">Tiempo Promedio de Recojo</span>
                <span className="stat-trend" style={{ color: 'var(--emerald-400)' }}>Puntualidad 99.4%</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-orange">⭐</div>
              <div className="stat-info">
                <span className="stat-value">4.92 / 5</span>
                <span className="stat-label">Satisfacción de Clientes</span>
                <span className="stat-trend" style={{ color: 'var(--amber-400)' }}>Más de 1,400 valoraciones</span>
              </div>
            </div>
          </section>

          {/* Value Proposition Cards */}
          <section className="dashboard-container">
            <div className="section-header">
              <div>
                <h2 className="section-title">
                  <span>💎</span> ¿Cómo funciona el ecosistema Yo Lavo?
                </h2>
                <p className="section-subtitle">Tecnología diseñada para darte comodidad, rapidez y transparencia total.</p>
              </div>
            </div>

            <div className="cards-grid">
              <div className="card-base card-accent-border">
                <div style={{ fontSize: '2.75rem', marginBottom: '0.85rem' }}>🧼</div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.6rem' }}>
                  1. Solicita y Cotiza
                </h3>
                <p style={{ fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                  Elige lavado por kilo (ropa diaria) o por prenda delicada (ternos, edredones, vestidos). Agrega suavizante o servicio ultra express en 3 horas.
                </p>
                <span className="badge badge-orange">Cotización Transparente</span>
              </div>

              <div className="card-base card-blue-border">
                <div style={{ fontSize: '2.75rem', marginBottom: '0.85rem' }}>🛵</div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.6rem' }}>
                  2. Recojo en tu Puerta
                </h3>
                <p style={{ fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                  Un repartidor certificado recoge tu bolsa de ropa, verifica el pesaje y la entrega en la lavandería más cercana con total seguridad.
                </p>
                <span className="badge badge-blue">Rastreo GPS en Vivo</span>
              </div>

              <div className="card-base card-accent-border">
                <div style={{ fontSize: '2.75rem', marginBottom: '0.85rem' }}>✨</div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.6rem' }}>
                  3. Lavado & Entrega Impecable
                </h3>
                <p style={{ fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                  Sigue cada fase del lavado. Tu ropa regresa doblada, planchada y aromatizada, lista para usar en tu armario.
                </p>
                <span className="badge badge-green">Garantía de Satisfacción</span>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* =========================================================================
          VIEW: CLIENTE
          ========================================================================= */}
      {vistaActiva === 'cliente' && (
        <main className="dashboard-container">
          {/* Welcome Banner Card */}
          <div className="card-base" style={{ background: 'linear-gradient(135deg, var(--blue-950) 0%, var(--bg-surface-2) 100%)', borderColor: 'var(--blue-border)', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div>
                <span className="badge badge-orange">
                  <span className="badge-pulse-dot" style={{ background: 'var(--orange-400)' }}></span>
                  Panel del Cliente
                </span>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.6rem' }}>
                  ¡Hola, {user?.nombre || 'Valeria'}! 👋
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  ¿Listo para liberarte del lavado hoy? Encuentra tu lavandería favorita o cotiza al instante.
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
                  🧺 Solicitar Nuevo Lavado
                </button>
              </div>
            </div>
          </div>

          {/* Active Orders Tracker Cards */}
          <div className="section-header">
            <div>
              <h2 className="section-title">
                <span>📦</span> Mis Pedidos Activos
              </h2>
              <p className="section-subtitle">Sigue el estado de tu ropa en tiempo real</p>
            </div>
            <span className="badge badge-blue">{pedidos.length} Pedidos en Total</span>
          </div>

          <div className="cards-grid">
            {pedidos.slice(0, 3).map((p) => {
              // Calculate stepper percentage
              const stepIndex = ['solicitado', 'en_proceso', 'listo', 'en_camino', 'entregado'].indexOf(p.estado);
              const progressPercentage = Math.max(10, Math.min(100, ((stepIndex + 1) / 5) * 100));

              return (
                <div key={p.id} className="order-card card-accent-border">
                  <div className="order-meta-row">
                    <span className="badge badge-orange">Pedido #{p.id}</span>
                    <span className="order-price">S/ {p.precio_total.toFixed(2)}</span>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>
                      🏪 {p.nombre_negocio || 'Lavandería Burbujas Express'}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {p.tipo_cotizacion === 'por_kilo' ? `⚖️ ${p.cantidad} Kg de Ropa` : `👕 ${p.cantidad} Prendas`} • Pago: {p.metodo_pago.toUpperCase()}
                    </p>
                  </div>

                  {/* Progressive Stepper with glowing fill */}
                  <div className="stepper-container">
                    <div className="stepper-progress-line">
                      <div className="stepper-progress-fill" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <div className={`stepper-step ${stepIndex >= 0 ? 'completed' : ''}`}>
                      <div className="stepper-dot">1</div>
                      <span>Solicitado</span>
                    </div>
                    <div className={`stepper-step ${stepIndex >= 1 ? 'completed' : ''} ${stepIndex === 1 ? 'active' : ''}`}>
                      <div className="stepper-dot">2</div>
                      <span>Lavando</span>
                    </div>
                    <div className={`stepper-step ${stepIndex >= 2 ? 'completed' : ''} ${stepIndex === 2 ? 'active' : ''}`}>
                      <div className="stepper-dot">3</div>
                      <span>Listo</span>
                    </div>
                    <div className={`stepper-step ${stepIndex >= 3 ? 'completed' : ''} ${stepIndex === 3 ? 'active' : ''}`}>
                      <div className="stepper-dot">4</div>
                      <span>En Camino</span>
                    </div>
                    <div className={`stepper-step ${stepIndex >= 4 ? 'completed' : ''}`}>
                      <div className="stepper-dot">5</div>
                      <span>Entregado</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-base)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>📍 <strong>Destino:</strong> {p.direccion_entrega}</span>
                    </div>
                    <div style={{ color: 'var(--orange-400)', fontWeight: 700, fontSize: '0.8rem' }}>
                      ⏱️ {p.tiempo_estimado || 'Llegando pronto'}
                    </div>
                  </div>

                  <div className="order-actions">
                    <button 
                      className="btn-secondary btn-sm" 
                      style={{ flex: 1 }} 
                      onClick={() => showToast(`Conectando con ${p.nombre_negocio}...`, '📞')}
                    >
                      💬 Contactar Negocio
                    </button>
                    {p.estado === 'en_camino' && (
                      <button 
                        className="btn-primary btn-sm" 
                        style={{ flex: 1 }} 
                        onClick={() => handleUpdatePedidoEstado(p.id, 'entregado')}
                      >
                        ✅ Confirmar Recibido
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nearby Laundries Cards Header */}
          <div className="section-header" style={{ marginTop: '3.5rem' }}>
            <div>
              <h2 className="section-title">
                <span>🗺️</span> Lavanderías Disponibles en tu Zona
              </h2>
              <p className="section-subtitle">Filtra por tipo de servicio o busca por nombre o distrito</p>
            </div>
            
            {/* Search Input */}
            <div style={{ minWidth: '260px' }}>
              <input 
                type="text"
                className="input-field"
                placeholder="🔍 Buscar por nombre o distrito..."
                value={busquedaLocal}
                onChange={e => setBusquedaLocal(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="filter-bar">
            <button className={`filter-pill ${filtroServicio === 'todos' ? 'active' : ''}`} onClick={() => setFiltroServicio('todos')}>
              ✨ Todos los Locales ({negocios.length})
            </button>
            <button className={`filter-pill ${filtroServicio === 'kilo' ? 'active' : ''}`} onClick={() => setFiltroServicio('kilo')}>
              ⚖️ Lavado x Kilo
            </button>
            <button className={`filter-pill ${filtroServicio === 'express' ? 'active' : ''}`} onClick={() => setFiltroServicio('express')}>
              ⚡ Entrega Express 3h
            </button>
            <button className={`filter-pill ${filtroServicio === 'zapatillas' ? 'active' : ''}`} onClick={() => setFiltroServicio('zapatillas')}>
              👟 Zapatillas & Edredones
            </button>
          </div>

          {/* Laundry Cards Grid */}
          <div className="cards-grid">
            {negociosFiltrados.map((n) => (
              <div key={n.id} className="laundry-card">
                <div className="laundry-card-banner">
                  <span>{n.icono}</span>
                  <div className="laundry-card-badge">
                    <span className="badge badge-green">
                      <span className="badge-pulse-dot" style={{ background: 'var(--emerald-400)' }}></span>
                      {n.lavadoras_disponibles} Máquinas Libres
                    </span>
                  </div>
                  <div className="laundry-card-distance">
                    📍 {n.distancia} • {n.distrito}
                  </div>
                </div>

                <div className="laundry-card-body">
                  <h3 className="laundry-title">{n.nombre_negocio}</h3>
                  <div className="laundry-address">
                    <span>🏠 {n.direccion}</span>
                  </div>

                  <div className="laundry-rating-row">
                    <div className="rating-stars">
                      ⭐ {n.puntaje} <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}>({n.total_resenas} reseñas)</span>
                    </div>
                    <div className="price-tag-pill">
                      Desde S/ {n.precio_kilo.toFixed(2)} / kg
                    </div>
                  </div>

                  <div className="services-chips">
                    {n.servicios.map((s, idx) => (
                      <span key={idx} className="chip">{s}</span>
                    ))}
                  </div>

                  <button 
                    className="btn-primary" 
                    style={{ width: '100%', marginTop: 'auto' }}
                    onClick={() => {
                      setSelectedNegocio(n);
                      setOrderModalOpen(true);
                    }}
                  >
                    🧺 Cotizar y Solicitar Pedido
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* =========================================================================
          VIEW: NEGOCIO (LAVANDERÍA OWNER)
          ========================================================================= */}
      {vistaActiva === 'negocio' && (
        <main className="dashboard-container">
          {/* Header Banner */}
          <div className="card-base" style={{ background: 'linear-gradient(135deg, var(--blue-950) 0%, var(--bg-surface-2) 100%)', borderColor: 'var(--blue-border)', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div>
                <span className="badge badge-blue">
                  <span className="badge-pulse-dot" style={{ background: 'var(--blue-400)' }}></span>
                  Panel Administrativo
                </span>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.6rem' }}>
                  Lavandería Burbujas Express
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Monitoreo de tambores en tiempo real, gestión de turnos de lavado y flujo de caja diario.
                </p>
              </div>
              <div>
                <span className="badge badge-green" style={{ fontSize: '0.9rem', padding: '0.55rem 1.15rem' }}>
                  <span className="badge-pulse-dot" style={{ background: 'var(--emerald-400)' }}></span>
                  En Línea • Recibiendo Pedidos
                </span>
              </div>
            </div>
          </div>

          {/* Business KPI Stat Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-orange">📊</div>
              <div className="stat-info">
                <span className="stat-value">38 Pedidos</span>
                <span className="stat-label">Total Pedidos del Mes</span>
                <span className="stat-trend" style={{ color: 'var(--emerald-400)' }}>↑ +14% vs mes anterior</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-green">💰</div>
              <div className="stat-info">
                <span className="stat-value">S/ 2,490.50</span>
                <span className="stat-label">Ingresos del Mes</span>
                <span className="stat-trend" style={{ color: 'var(--emerald-400)' }}>+S/ 380.00 acumulado hoy</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-blue">🔄</div>
              <div className="stat-info">
                <span className="stat-value">4 / 6 Activas</span>
                <span className="stat-label">Capacidad de Máquinas</span>
                <span className="stat-trend" style={{ color: 'var(--blue-400)' }}>66% en ciclo de lavado</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-orange">⭐</div>
              <div className="stat-info">
                <span className="stat-value">4.9 / 5.0</span>
                <span className="stat-label">Calificación Promedio</span>
                <span className="stat-trend" style={{ color: 'var(--orange-400)' }}>142 valoraciones reales</span>
              </div>
            </div>
          </div>

          {/* Machine Monitoring Cards (Simulador de Tambores) */}
          <div className="section-header">
            <div>
              <h2 className="section-title">
                <span>🔄</span> Monitoreo en Vivo de Lavadoras & Secadoras
              </h2>
              <p className="section-subtitle">Haz clic en cualquier tambor para iniciar, pausar o finalizar ciclos</p>
            </div>
            <button className="btn-secondary btn-sm" onClick={() => showToast('Catálogo de equipos sincronizado', '✨')}>
              ➕ Registrar Nuevo Equipo
            </button>
          </div>

          <div className="cards-grid">
            {lavadoras.map((m) => (
              <div key={m.id} className="machine-card" style={{
                borderColor: m.estado === 'ocupada' ? 'var(--blue-border)' : m.estado === 'disponible' ? 'var(--emerald-border)' : 'var(--rose-border)'
              }}>
                <div className="machine-header">
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{m.numero_lavadora}</h3>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'capitalize' }}>
                      {m.tipo} industrial • Capacidad {m.capacidad_kg} Kg
                    </span>
                  </div>
                  <span className={`badge ${m.estado === 'disponible' ? 'badge-green' : m.estado === 'ocupada' ? 'badge-blue' : 'badge-yellow'}`}>
                    <span className="badge-pulse-dot"></span>
                    {m.estado.toUpperCase()}
                  </span>
                </div>

                {/* 3D Animated Drum */}
                <div className={`machine-drum-housing ${m.estado === 'ocupada' ? 'running' : ''}`}>
                  <div className="machine-drum-inner">
                    {m.tipo === 'lavadora' ? '🫧' : '💨'}
                  </div>
                </div>

                {m.estado === 'ocupada' ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      <span>{m.ciclo_nombre || 'Lavado en curso'}</span>
                      <strong style={{ color: 'var(--orange-400)' }}>⏱️ {m.tiempo_restante || 15} min</strong>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: '68%' }}></div>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textAlign: 'center' }}>
                    {m.estado === 'disponible' ? '✅ Tambor limpio y disponible para nueva carga' : '⚠️ En mantenimiento preventivo programado'}
                  </p>
                )}

                <button 
                  className={`btn-sm ${m.estado === 'disponible' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  onClick={() => handleToggleLavadora(m.id)}
                >
                  {m.estado === 'disponible' ? '▶ Iniciar Carga de Ropa' : m.estado === 'ocupada' ? '⏹ Finalizar Ciclo' : '🔧 Habilitar Máquina'}
                </button>
              </div>
            ))}
          </div>

          {/* Incoming Orders Cards */}
          <div className="section-header" style={{ marginTop: '3.5rem' }}>
            <div>
              <h2 className="section-title">
                <span>📥</span> Solicitudes & Pedidos Entrantes
              </h2>
              <p className="section-subtitle">Gestiona el flujo de trabajo de lavado y asignación a repartidores</p>
            </div>
            <span className="badge badge-orange">{pedidos.length} Pedidos Registrados</span>
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
                  <h3 style={{ fontSize: '1.2rem' }}>
                    👤 {p.cliente_nombre}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    📞 {p.cliente_telefono || '+51 900 000 000'} • 📍 {p.direccion_recojo}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {p.tipo_cotizacion === 'por_kilo' ? `⚖️ ${p.cantidad} Kg de Ropa` : `👕 ${p.cantidad} Prendas`}
                  </span>
                  <strong style={{ color: 'var(--orange-400)', fontSize: '1.15rem' }}>
                    S/ {p.precio_total.toFixed(2)}
                  </strong>
                </div>

                {p.notas && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--orange-300)', background: 'var(--orange-soft)', padding: '0.5rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--orange-border)' }}>
                    📝 <strong>Instrucciones:</strong> {p.notas}
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
                  <button className="btn-ghost btn-sm" onClick={() => showToast(`Llamando al cliente: ${p.cliente_telefono}`, '📞')}>
                    📞 Llamar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Inventory Cards */}
          <div className="section-header" style={{ marginTop: '3.5rem' }}>
            <div>
              <h2 className="section-title">
                <span>🧴</span> Inventario de Químicos e Insumos
              </h2>
              <p className="section-subtitle">Stock crítico y reposición de detergentes y suavizantes</p>
            </div>
          </div>

          <div className="cards-grid">
            {productos.map((prod) => (
              <div key={prod.id} className="card-base" style={{ padding: '1.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <span style={{ fontSize: '2.2rem' }}>{prod.icono}</span>
                  <div>
                    <h4 style={{ fontSize: '1.1rem' }}>{prod.nombre}</h4>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'capitalize' }}>Categoría: {prod.tipo}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                  <span style={{ color: 'var(--orange-400)', fontWeight: 900, fontSize: '1.25rem' }}>
                    S/ {prod.precio.toFixed(2)}
                  </span>
                  <span className={`badge ${prod.stock < 10 ? 'badge-yellow' : 'badge-green'}`}>
                    Stock: {prod.stock} unidades
                  </span>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* =========================================================================
          VIEW: DELIVERY (RIDER HUD)
          ========================================================================= */}
      {vistaActiva === 'delivery' && (
        <main className="dashboard-container">
          {/* Header Banner */}
          <div className="card-base" style={{ background: 'linear-gradient(135deg, var(--blue-950) 0%, var(--bg-surface-2) 100%)', borderColor: 'var(--orange-border)', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div>
                <span className="badge badge-orange">
                  <span className="badge-pulse-dot" style={{ background: 'var(--orange-400)' }}></span>
                  Panel del Conductor / Rider
                </span>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.6rem' }}>
                  {user?.nombre || 'Diego Navarro'} 🛵
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Acepta carreras con cobro por kilómetro, optimiza tus rutas y liquida tus ganancias diarias.
                </p>
              </div>
              <div>
                <span className="badge badge-green" style={{ fontSize: '0.9rem', padding: '0.55rem 1.15rem' }}>
                  <span className="badge-pulse-dot" style={{ background: 'var(--emerald-400)' }}></span>
                  Radar GPS Activo • Recibiendo Pedidos
                </span>
              </div>
            </div>
          </div>

          {/* Delivery KPI Stat Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-orange">💵</div>
              <div className="stat-info">
                <span className="stat-value">S/ 184.50</span>
                <span className="stat-label">Ganancia de Hoy</span>
                <span className="stat-trend" style={{ color: 'var(--emerald-400)' }}>+S/ 24.00 en propinas</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-blue">🛵</div>
              <div className="stat-info">
                <span className="stat-value">16 Carreras</span>
                <span className="stat-label">Entregas Completadas</span>
                <span className="stat-trend" style={{ color: 'var(--blue-400)' }}>100% efectividad de entrega</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-green">⏳</div>
              <div className="stat-info">
                <span className="stat-value">S/ 64.00</span>
                <span className="stat-label">Saldo Pendiente de Cobro</span>
                <span className="stat-trend" style={{ color: 'var(--amber-400)' }}>Retiro inmediato habilitado</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-orange">⭐</div>
              <div className="stat-info">
                <span className="stat-value">4.95 / 5</span>
                <span className="stat-label">Puntaje del Repartidor</span>
                <span className="stat-trend" style={{ color: 'var(--orange-400)' }}>Rider Categoría Diamante</span>
              </div>
            </div>
          </div>

          {/* Active Job Card */}
          {activeDeliveryOrder && (
            <div style={{ margin: '2.5rem 0' }}>
              <div className="section-header">
                <div>
                  <h2 className="section-title">
                    <span>⚡</span> Carrera Activa en Progreso
                  </h2>
                  <p className="section-subtitle">Ruta actual asignada para recojo y entrega inmediata</p>
                </div>
                <span className="badge badge-orange">
                  <span className="badge-pulse-dot" style={{ background: 'var(--orange-400)' }}></span>
                  En Camino 🛵
                </span>
              </div>

              <div className="delivery-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span className="badge badge-blue">Orden #{activeDeliveryOrder.id}</span>
                    <h3 style={{ fontSize: '1.45rem', marginTop: '0.45rem' }}>
                      {activeDeliveryOrder.nombre_negocio || 'Lavandería Burbujas Express'} → {activeDeliveryOrder.cliente_nombre}
                    </h3>
                  </div>
                  <div className="delivery-pay-badge">
                    Pago Carrera: +S/ 14.50
                  </div>
                </div>

                <div className="route-container">
                  <div className="route-point">
                    <div className="route-icon-dot start"></div>
                    <div>
                      <strong style={{ color: 'var(--text-white)' }}>Punto A (Recojo en Negocio):</strong>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{activeDeliveryOrder.direccion_recojo}</p>
                    </div>
                  </div>
                  <div className="route-point">
                    <div className="route-icon-dot end"></div>
                    <div>
                      <strong style={{ color: 'var(--text-white)' }}>Punto B (Entrega al Cliente):</strong>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{activeDeliveryOrder.direccion_entrega}</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                  <button 
                    className="btn-secondary" 
                    style={{ flex: 1 }} 
                    onClick={() => showToast('Abriendo ruta en Google Maps / Waze...', '🗺️')}
                  >
                    🗺️ Iniciar Navegación GPS
                  </button>
                  <button 
                    className="btn-ghost" 
                    onClick={() => showToast(`Llamando al cliente: ${activeDeliveryOrder.cliente_nombre}`, '📞')}
                  >
                    📞 Llamar al Cliente
                  </button>
                  <button 
                    className="btn-primary" 
                    style={{ flex: 1 }}
                    onClick={() => {
                      handleUpdatePedidoEstado(activeDeliveryOrder.id, 'entregado');
                      setActiveDeliveryOrder(null);
                      showToast('🎉 ¡Entrega finalizada! Se abonaron S/ 14.50 a tu billetera.', '💰');
                    }}
                  >
                    ✅ Confirmar Entrega Realizada
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Available Jobs Cards */}
          <div className="section-header" style={{ marginTop: '3.5rem' }}>
            <div>
              <h2 className="section-title">
                <span>📦</span> Radar de Carreras Disponibles
              </h2>
              <p className="section-subtitle">Pedidos en espera de recojo cerca de tu ubicación</p>
            </div>
            <button className="btn-ghost btn-sm" onClick={() => showToast('Radar actualizado con pedidos en vivo', '🔄')}>
              🔄 Actualizar Radar
            </button>
          </div>

          <div className="cards-grid">
            {pedidos.filter(p => p.id !== activeDeliveryOrder?.id).map((p) => (
              <div key={p.id} className="order-card card-accent-border">
                <div className="order-meta-row">
                  <span className="badge badge-orange">Pedido #{p.id}</span>
                  <span className="delivery-pay-badge" style={{ fontSize: '1rem', padding: '0.25rem 0.65rem' }}>+S/ 12.00</span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>
                    🏪 {p.nombre_negocio || 'EcoLavado Inteligente'}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Cliente: {p.cliente_nombre}
                  </p>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div>📍 <strong>Recoger:</strong> {p.direccion_recojo}</div>
                  <div style={{ marginTop: '4px' }}>🏁 <strong>Llevar:</strong> {p.direccion_entrega}</div>
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

      {/* =========================================================================
          MODAL: COTIZAR Y SOLICITAR LAVADO (CLIENTE)
          ========================================================================= */}
      {orderModalOpen && selectedNegocio && (
        <div className="modal-overlay" onClick={() => setOrderModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <span className="badge badge-orange">Cotizador Inteligente</span>
                <h2 style={{ fontSize: '1.45rem', marginTop: '5px' }}>
                  {selectedNegocio.nombre_negocio}
                </h2>
              </div>
              <button className="btn-ghost btn-sm" onClick={() => setOrderModalOpen(false)}>✕</button>
            </div>

            {/* Type selector tabs */}
            <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.5rem' }}>
              <button 
                type="button"
                className={`btn-secondary ${quoteType === 'por_kilo' ? 'active' : ''}`}
                style={{ flex: 1, borderColor: quoteType === 'por_kilo' ? 'var(--orange-500)' : 'var(--border-medium)', background: quoteType === 'por_kilo' ? 'var(--orange-soft)' : 'var(--bg-surface-2)' }}
                onClick={() => setQuoteType('por_kilo')}
              >
                ⚖️ Lavado Por Kilo
              </button>
              <button 
                type="button"
                className={`btn-secondary ${quoteType === 'por_prenda' ? 'active' : ''}`}
                style={{ flex: 1, borderColor: quoteType === 'por_prenda' ? 'var(--orange-500)' : 'var(--border-medium)', background: quoteType === 'por_prenda' ? 'var(--orange-soft)' : 'var(--bg-surface-2)' }}
                onClick={() => setQuoteType('por_prenda')}
              >
                👕 Por Prenda Delicada
              </button>
            </div>

            {/* Quantity Stepper Counter */}
            {quoteType === 'por_kilo' ? (
              <div className="quote-counter-box">
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--text-white)' }}>Peso Estimado de Ropa</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tarifa: S/ {selectedNegocio.precio_kilo.toFixed(2)} por Kilogramo</div>
                </div>
                <div className="counter-controls">
                  <button className="counter-btn" onClick={() => setKilosCount(Math.max(1, kilosCount - 1))}>−</button>
                  <span className="counter-value">{kilosCount} Kg</span>
                  <button className="counter-btn" onClick={() => setKilosCount(kilosCount + 1)}>+</button>
                </div>
              </div>
            ) : (
              <div className="quote-counter-box">
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--text-white)' }}>Prendas Especiales</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ternos, vestidos, casacas (S/ 12.00 c/u)</div>
                </div>
                <div className="counter-controls">
                  <button className="counter-btn" onClick={() => setPrendasCount(Math.max(1, prendasCount - 1))}>−</button>
                  <span className="counter-value">{prendasCount}</span>
                  <button className="counter-btn" onClick={() => setPrendasCount(prendasCount + 1)}>+</button>
                </div>
              </div>
            )}

            {/* Addons Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <label className="addon-card-label">
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  🌸 Suavizante Textil Aromático Hipoalergénico
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontWeight: 800, color: 'var(--orange-400)', fontSize: '0.85rem' }}>+S/ 3.50</span>
                  <input 
                    type="checkbox" 
                    checked={includeSuavizante} 
                    onChange={e => setIncludeSuavizante(e.target.checked)} 
                  />
                </div>
              </label>

              <label className="addon-card-label">
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  ⚡ Servicio Ultra Express con entrega en 3 horas
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontWeight: 800, color: 'var(--orange-400)', fontSize: '0.85rem' }}>+S/ 10.00</span>
                  <input 
                    type="checkbox" 
                    checked={isExpress} 
                    onChange={e => setIsExpress(e.target.checked)} 
                  />
                </div>
              </label>
            </div>

            {/* Address & Instructions */}
            <div className="form-group">
              <label className="form-label">📍 Dirección de Recojo y Entrega</label>
              <input 
                className="input-field" 
                value={orderAddress} 
                onChange={e => setOrderAddress(e.target.value)} 
                placeholder="Ej. Av. Benavides 1240, Dpto 301, Miraflores"
              />
            </div>

            <div className="form-group">
              <label className="form-label">📝 Instrucciones Especiales para el Lavado</label>
              <input 
                className="input-field" 
                value={orderNotes} 
                onChange={e => setOrderNotes(e.target.value)} 
                placeholder="Ej. Ropa blanca separada, no usar centrifugado fuerte"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="form-group">
              <label className="form-label">💳 Método de Pago</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                <button 
                  type="button" 
                  className={`btn-ghost ${paymentMethod === 'qr' ? 'active' : ''}`}
                  style={{ borderColor: paymentMethod === 'qr' ? 'var(--orange-500)' : 'var(--border-medium)', background: paymentMethod === 'qr' ? 'var(--orange-soft)' : 'transparent' }}
                  onClick={() => setPaymentMethod('qr')}
                >
                  📱 Yape / Plin
                </button>
                <button 
                  type="button" 
                  className={`btn-ghost ${paymentMethod === 'efectivo' ? 'active' : ''}`}
                  style={{ borderColor: paymentMethod === 'efectivo' ? 'var(--orange-500)' : 'var(--border-medium)', background: paymentMethod === 'efectivo' ? 'var(--orange-soft)' : 'transparent' }}
                  onClick={() => setPaymentMethod('efectivo')}
                >
                  💵 Efectivo
                </button>
                <button 
                  type="button" 
                  className={`btn-ghost ${paymentMethod === 'tarjeta' ? 'active' : ''}`}
                  style={{ borderColor: paymentMethod === 'tarjeta' ? 'var(--orange-500)' : 'var(--border-medium)', background: paymentMethod === 'tarjeta' ? 'var(--orange-soft)' : 'transparent' }}
                  onClick={() => setPaymentMethod('tarjeta')}
                >
                  💳 Tarjeta
                </button>
              </div>

              {/* QR Code preview when Yape/Plin is selected */}
              {paymentMethod === 'qr' && (
                <div style={{ textAlign: 'center', marginTop: '0.85rem' }}>
                  <div className="qr-preview-box">
                    <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
                      <rect width="100" height="100" fill="white" />
                      {/* Stylized QR Matrix Pattern */}
                      <rect x="10" y="10" width="24" height="24" fill="#0B0F19" />
                      <rect x="14" y="14" width="16" height="16" fill="white" />
                      <rect x="18" y="18" width="8" height="8" fill="#FF6A00" />

                      <rect x="66" y="10" width="24" height="24" fill="#0B0F19" />
                      <rect x="70" y="14" width="16" height="16" fill="white" />
                      <rect x="74" y="18" width="8" height="8" fill="#FF6A00" />

                      <rect x="10" y="66" width="24" height="24" fill="#0B0F19" />
                      <rect x="14" y="70" width="16" height="16" fill="white" />
                      <rect x="18" y="74" width="8" height="8" fill="#FF6A00" />

                      <circle cx="50" cy="50" r="10" fill="#2563EB" />
                      <rect x="42" y="15" width="8" height="8" fill="#0B0F19" />
                      <rect x="42" y="75" width="8" height="8" fill="#0B0F19" />
                      <rect x="75" y="45" width="8" height="8" fill="#0B0F19" />
                      <rect x="65" y="65" width="10" height="10" fill="#FF6A00" />
                    </svg>
                    <span style={{ color: '#0b0f19', fontSize: '0.75rem', fontWeight: 800 }}>
                      Escanea con Yape o Plin al entregar
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Total Summary Card */}
            <div style={{ background: 'linear-gradient(135deg, var(--blue-950) 0%, var(--bg-surface-3) 100%)', border: '1px solid var(--orange-border)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Estimado a Pagar:</span>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>Incluye recojo y entrega a domicilio</div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--orange-400)' }}>
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

      {/* =========================================================================
          MODAL: AUTHENTICATION (LOGIN / REGISTRO)
          ========================================================================= */}
      {authModalOpen && (
        <div className="modal-overlay" onClick={() => setAuthModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🧺</div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 900 }}>
                {authModo === 'login' ? 'Bienvenido a Yo Lavo' : 'Crear Cuenta Nueva'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                {authModo === 'login' ? 'Ingresa con tus credenciales o accede con 1 clic' : 'Regístrate como Cliente, Negocio o Delivery'}
              </p>
            </div>

            {/* 1-Click Fast Demo Switcher */}
            <div style={{ background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px dashed var(--orange-border)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--orange-400)', marginBottom: '0.65rem', textAlign: 'center', letterSpacing: '0.04em' }}>
                ⚡ ACCESO RÁPIDO PARA EVALUACIÓN (1 CLIC):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
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

            {/* Role Picker for Form */}
            <div className="form-group">
              <label className="form-label">Selecciona tu Rol</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  className={`btn-ghost ${authModo === 'login' ? (logForm.rol === 'cliente' ? 'active' : '') : (regForm.rol === 'cliente' ? 'active' : '')}`}
                  style={{
                    borderColor: (authModo === 'login' ? logForm.rol === 'cliente' : regForm.rol === 'cliente') ? 'var(--orange-500)' : 'var(--border-medium)',
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
                    borderColor: (authModo === 'login' ? logForm.rol === 'negocio' : regForm.rol === 'negocio') ? 'var(--orange-500)' : 'var(--border-medium)',
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
                    borderColor: (authModo === 'login' ? logForm.rol === 'delivery' : regForm.rol === 'delivery') ? 'var(--orange-500)' : 'var(--border-medium)',
                    background: (authModo === 'login' ? logForm.rol === 'delivery' : regForm.rol === 'delivery') ? 'var(--orange-soft)' : 'transparent'
                  }}
                  onClick={() => authModo === 'login' ? setLogForm({ ...logForm, rol: 'delivery' }) : setRegForm({ ...regForm, rol: 'delivery' })}
                >
                  🛵 Delivery
                </button>
              </div>
            </div>

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
                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.85rem' }}>
                  Iniciar Sesión
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit}>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
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
                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.85rem' }}>
                  Crear Cuenta Ahora
                </button>
              </form>
            )}

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button 
                type="button" 
                className="btn-ghost btn-sm"
                onClick={() => setAuthModo(authModo === 'login' ? 'registro' : 'login')}
              >
                {authModo === 'login' ? '¿No tienes cuenta? Regístrate gratis' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🧺</span>
            <div>
              <span style={{ fontWeight: 900, color: 'var(--text-white)', letterSpacing: '-0.02em' }}>YO LAVO</span>
              <span style={{ color: 'var(--text-muted)' }}> — Plataforma Unificada de Lavanderías On-Demand</span>
            </div>
          </div>
          <ul className="footer-links">
            <li><a href="#terminos" onClick={(e) => { e.preventDefault(); showToast('Términos y Condiciones actualizados', '📜'); }}>Términos de Servicio</a></li>
            <li><a href="#privacidad" onClick={(e) => { e.preventDefault(); showToast('Política de Privacidad certificada', '🔒'); }}>Privacidad</a></li>
            <li><a href="#soporte" onClick={(e) => { e.preventDefault(); showToast('Central de ayuda activa: soporte@yolavo.pe', '💬'); }}>Soporte 24/7</a></li>
          </ul>
        </div>
      </footer>
    </div>
  );
}

export default App;
