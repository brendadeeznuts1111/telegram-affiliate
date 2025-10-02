import { Hono } from 'hono';
import { webhookCallback } from 'grammy';

type Bindings = {
  BOT_TOKEN: string;
  ADMIN_IDS: string;
  DB: D1Database;
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
    // Import the bot instance
    // Note: You'll need to refactor the bot to be importable
    // For now, this is a placeholder structure
    
    const update = await c.req.json();
    
    // Log the update for debugging
    console.log('Received Telegram update:', JSON.stringify(update, null, 2));
    
    // TODO: Process the update with your bot instance
    // const bot = createBot(botToken);
    // await bot.handleUpdate(update);
    
    return c.json({ ok: true });
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

