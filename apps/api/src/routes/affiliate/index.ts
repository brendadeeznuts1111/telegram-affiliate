/**
 * Affiliate Routes
 * Main router for all affiliate-related endpoints
 */

import { Hono } from 'hono';
import qrRoutes from './qr';
import refRoutes from './ref';
import withdrawRoutes from './withdraw';
import broadcastRoutes from './broadcast';

type Bindings = {
  AFFILIATE_KV: KVNamespace;
  DB?: D1Database;
  PUBLIC_URL?: string;
  TELEGRAM_BOT_USERNAME?: string;
  TELEGRAM_BOT_TOKEN?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Mount sub-routes
app.route('/qr', qrRoutes);
app.route('/ref', refRoutes);
app.route('/withdraw', withdrawRoutes);
app.route('/broadcast', broadcastRoutes);

// Health check for affiliate system
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'affiliate-api',
    timestamp: Date.now(),
  });
});

export default app;

