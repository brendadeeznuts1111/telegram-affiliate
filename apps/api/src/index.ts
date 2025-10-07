/**
 * Bun Local Server Entry Point
 * Uses the shared app from app.ts
 */

import { getConfig } from '@affiliate/config';
import { createApp } from './app';

// Get validated configuration
const config = getConfig(process.env);

// Create the Hono app
const app = createApp();

// Development logging
if (config.env !== 'production') {
  console.log(`🚀 API Server starting...`);
  console.log(`📡 Port: ${config.api.port}`);
  console.log(`🔗 URL: http://${config.api.host}:${config.api.port}`);
  console.log(`🌍 Environment: ${config.env}`);
  console.log(`💚 Bun ${Bun.version}`);
  console.log(`\n✅ Configuration validated successfully`);
}

// Export for Bun server
export default {
  port: config.api.port,
  fetch: app.fetch,
};
