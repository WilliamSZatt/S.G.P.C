import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import { prisma } from './lib/prisma.js';
import { errorHandler } from './middleware/errors.js';
import { authRouter } from './routes/auth.js';
import { homeRouter } from './routes/home.js';
import { clientsRouter } from './routes/clients.js';
import { inventoryRouter } from './routes/inventory.js';
import { salesRouter } from './routes/sales.js';
import { dashboardRouter } from './routes/dashboard.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.FRONTEND_URL }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/', (_request, response) => {
  response.json({
    service: 'ComércioOS API',
    status: 'ok',
    frontend: config.FRONTEND_URL,
    message: 'Abra o endereço do frontend para acessar a interface.'
  });
});

app.get('/health', (_request, response) => response.json({ status: 'ok' }));
app.use('/api/home', homeRouter);
app.use('/api/auth', authRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/sales', salesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use(errorHandler);

const server = app.listen(config.PORT, () => {
  console.log(`Backend ouvindo em http://localhost:${config.PORT}`);
});

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
