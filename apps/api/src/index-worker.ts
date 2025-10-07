/**
 * Cloudflare Workers Entry Point
 * Uses the shared app from app.ts
 */

import { createApp } from './app';

// Create and export the Hono app for Cloudflare Workers
const app = createApp();

export default app;

