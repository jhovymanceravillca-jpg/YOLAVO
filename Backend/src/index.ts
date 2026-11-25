import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { checkDbConnection } from './db.js';
import loginRoutes from './routes/login.js';
import registroRoutes from './routes/registro.js';
import negociosRoutes from './routes/negocios.js';
import pedidosRoutes from './routes/pedidos.js';
import productosRoutes from './routes/productos.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas públicas y protegidas bajo /api
app.use('/api', loginRoutes);
app.use('/api', registroRoutes);
app.use('/api', negociosRoutes);
app.use('/api', pedidosRoutes);
app.use('/api', productosRoutes);

// Rutas existentes (conservar)
app.get('/', (req, res) => {
  res.send('Backend YO LAVO funcionando');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Manejo de errores global simple
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

async function startServer() {
  try {
    await checkDbConnection();
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Fallo al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();