import { Hono } from 'hono';
import { createWorkerBot, getWebhookHandler } from '../bot/worker-bot';

type Bindings = {
  BOT_TOKEN: string;
  ADMIN_IDS: string;
  DB: D1Database;
  AFFILIATE_KV: KVNamespace;
  PUBLIC_URL?: string;
  TELEGRAM_BOT_USERNAME?: string;
};

export const telegram = new Hono<{ Bindings: Bindings }>();

/**
 * Telegram webhook endpoint
 * This receives updates from Telegram when configured via setWebhook
 */
telegram.post('/webhook', async (c) => {
  const botToken = c.env.BOT_TOKEN;
  
  if (!botToken) {
    console.error('BOT_TOKEN not configured');
    return c.json({ error: 'Bot not configured' }, 500);
  }

  try {
    // Create bot instance with environment
    const bot = createWorkerBot({
      BOT_TOKEN: c.env.BOT_TOKEN,
      ADMIN_IDS: c.env.ADMIN_IDS,
      DB: c.env.DB,
      AFFILIATE_KV: c.env.AFFILIATE_KV,
      PUBLIC_URL: c.env.PUBLIC_URL,
      TELEGRAM_BOT_USERNAME: c.env.TELEGRAM_BOT_USERNAME,
    });

    // Get webhook callback for Hono
    const handleUpdate = getWebhookHandler(bot);
    
    // Process the update
    return await handleUpdate(c);
  } catch (error) {
    console.error('Error processing webhook:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Health check for webhook
 */
telegram.get('/webhook', (c) => {
  return c.json({ 
    status: 'ok',
    message: 'Telegram webhook endpoint is running'
  });
});

/**
 * Set webhook URL (for convenience)
 * Call this endpoint to register your webhook with Telegram
 */
telegram.post('/set-webhook', async (c) => {
  const botToken = c.env.BOT_TOKEN;
  const webhookUrl = c.req.query('url');
  
  if (!botToken) {
    return c.json({ error: 'BOT_TOKEN not configured' }, 500);
  }
  
  if (!webhookUrl) {
    return c.json({ error: 'webhook url parameter required' }, 400);
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`
    );
    
    const data = await response.json();
    
    return c.json(data);
  } catch (error) {
    console.error('Error setting webhook:', error);
    return c.json({ error: 'Failed to set webhook' }, 500);
  }
});

/**
 * Get webhook info
 */
telegram.get('/webhook-info', async (c) => {
  const botToken = c.env.BOT_TOKEN;
  
  if (!botToken) {
    return c.json({ error: 'BOT_TOKEN not configured' }, 500);
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getWebhookInfo`
    );
    
    const data = await response.json();
    
    return c.json(data);
  } catch (error) {
    console.error('Error getting webhook info:', error);
    return c.json({ error: 'Failed to get webhook info' }, 500);
  }
});

/**
 * Delete webhook (switch back to polling)
 */
telegram.post('/delete-webhook', async (c) => {
  const botToken = c.env.BOT_TOKEN;
  
  if (!botToken) {
    return c.json({ error: 'BOT_TOKEN not configured' }, 500);
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/deleteWebhook`
    );
    
    const data = await response.json();
    
    return c.json(data);
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return c.json({ error: 'Failed to delete webhook' }, 500);
  }
});

export default telegram;

