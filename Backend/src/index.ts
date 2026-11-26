import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { checkDbConnection } from './db.js';
import { HttpError } from './utils.js';
import cuentas from './routes/cuentas.js';
import publico from './routes/publico.js';
import cliente from './routes/cliente.js';
import negocio from './routes/negocio.js';
import delivery from './routes/delivery.js';
import estados from './routes/estados.js';
import pagos from './routes/pagos.js';

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors());
// 2 MB para poder subir la imagen del QR
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', publico, cuentas, cliente, negocio, delivery, estados, pagos);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

async function iniciar() {
  await checkDbConnection();
  app.listen(PORT, '0.0.0.0', () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
}

iniciar();
