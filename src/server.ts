import './env';

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import { DatabaseConfig } from './config/database';
import optionRouter from './router/OptionRouter';
import reportRouter from './router/ReportRouter';

import { CORS_ORIGIN } from './constants/shared';
import { globalErrorHandler } from './middleware/errorHandler';
import { gracefulShutdown } from './shutdown';
import { validateApiKey } from './middleware/validateApiKey';


const app = express();
const server = createServer(app);

// Trust proxy if behind reverse proxy
app.set('trust proxy', 1);

// Debug logging
console.log('Environment:', process.env.NODE_ENV);
console.log('CORS Origins:', CORS_ORIGIN);

// CORS must come BEFORE helmet and other middleware
const corsOptions = {
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }),
);

app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(validateApiKey);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    worker: process.pid,
  });
});


app.use(optionRouter);
app.use(reportRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(globalErrorHandler);


async function main() {
  const db = DatabaseConfig.getInstance();
  await db.connectMongoDB();

  const PORT = Number(process.env.PORT) || 8080;
  const HOST = process.env.HOST || 'localhost';

  server.listen(PORT, HOST, () => {
    console.log(`Server running on port ${PORT} (Worker: ${process.pid})`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });

  gracefulShutdown.add(async () => {
    await new Promise((resolve) => {
      server.close((err) => {
        if (err) {
          console.error('Error closing server:', err);
        }
        resolve(void 0);
      });
    });

    await db.close();
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
