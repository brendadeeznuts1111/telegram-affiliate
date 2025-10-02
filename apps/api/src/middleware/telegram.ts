import type { Context, Next } from 'hono';
import { createHmac } from 'node:crypto';

export async function telegramAuth(c: Context, next: Next) {
  const initData = c.req.header('X-Telegram-Init-Data');
  
  // Allow bypass in development
  if (process.env.NODE_ENV === 'development' && !initData) {
    // Mock user for development
    c.set('userId', 8013171035);
    c.set('username', 'billabongwanger');
    c.set('isAdmin', true);
    await next();
    return;
  }
  
  if (!initData) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // Verify Telegram WebApp data
  const isValid = verifyTelegramWebAppData(initData);
  
  if (!isValid) {
    return c.json({ error: 'Invalid Telegram data' }, 401);
  }
  
  // Parse user data from init data
  const params = new URLSearchParams(initData);
  const userJson = params.get('user');
  
  if (!userJson) {
    return c.json({ error: 'No user data' }, 401);
  }
  
  const user = JSON.parse(userJson);
  
  // Set user context
  c.set('userId', user.id);
  c.set('username', user.username);
  c.set('isAdmin', isAdmin(user.id));
  
  await next();
}

function verifyTelegramWebAppData(initData: string): boolean {
  const BOT_TOKEN = process.env.BOT_TOKEN || '';
  
  if (!BOT_TOKEN) {
    console.warn('BOT_TOKEN not set, skipping verification');
    return true; // Allow in dev
  }
  
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');
  
  // Sort params and create data-check-string
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  // Create secret key from bot token
  const secretKey = createHmac('sha256', 'WebAppData')
    .update(BOT_TOKEN)
    .digest();
  
  // Calculate hash
  const calculatedHash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  return calculatedHash === hash;
}

function isAdmin(userId: number): boolean {
  const adminIds = process.env.ADMIN_IDS?.split(',').map(Number) || [8013171035];
  return adminIds.includes(userId);
}

