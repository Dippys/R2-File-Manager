import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fileUpload from 'express-fileupload';
import { config } from './config';
import fileRoutes from './routes/fileRoutes';
import { R2Client } from './r2Client';

const app = express();

// Initialize R2 client
export const r2Client = new R2Client(config.r2);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  useTempFiles: true,
  tempFileDir: '/tmp/',
}));

// Serve static files
app.use(express.static('public'));

// API Routes
app.use('/api', fileRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server and preload root directory
app.listen(config.server.port, async () => {
  console.log(`Server running on http://localhost:${config.server.port}`);
  console.log(`API available at http://localhost:${config.server.port}/api`);
  
  // Preload root directory in background
  console.log('\n🚀 Starting background preload of root directory...');
  r2Client.preloadRootDirectory().catch(err => {
    console.error('Failed to preload root directory:', err);
  });
});

export default app;
