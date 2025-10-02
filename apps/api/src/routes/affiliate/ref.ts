/**
 * Affiliate Link Tracking & Redirect
 * Tracks clicks and redirects to landing page
 */

import { Hono } from 'hono';

type Bindings = {
  AFFILIATE_KV: KVNamespace;
  DEFAULT_LANDING_URL?: string;
  TELEGRAM_BOT_USERNAME?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

/**
 * GET /affiliate/ref/:code
 * Track click and redirect to landing page or Telegram bot
 */
app.get('/:code', async (c) => {
  const code = c.req.param('code');
  const ua = c.req.header('User-Agent') || 'unknown';
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const referrer = c.req.header('Referer') || 'direct';

  try {
    // Track click event
    const clickKey = `click:${code}:${Date.now()}`;
    await c.env.AFFILIATE_KV.put(
      clickKey,
      JSON.stringify({
        ua,
        ip,
        referrer,
        timestamp: Date.now(),
      }),
      { expirationTtl: 86400 * 30 } // 30 days retention
    );

    // Increment click count
    const currentClicks = await c.env.AFFILIATE_KV.get(`clicks:${code}`) || '0';
    const newClicks = parseInt(currentClicks) + 1;
    await c.env.AFFILIATE_KV.put(`clicks:${code}`, newClicks.toString());

    // Get custom landing page or use default
    const customLanding = await c.env.AFFILIATE_KV.get(`landing:${code}`);
    const defaultLanding = c.env.DEFAULT_LANDING_URL || 'https://my-app.com';
    const telegramBot = c.env.TELEGRAM_BOT_USERNAME || 'your_bot';
    
    // Prefer Telegram bot deep link
    const redirectUrl = customLanding || `https://t.me/${telegramBot}?start=ref${code}`;

    return c.redirect(redirectUrl, 302);
  } catch (error) {
    // Fallback redirect even if tracking fails
    const telegramBot = c.env.TELEGRAM_BOT_USERNAME || 'your_bot';
    return c.redirect(`https://t.me/${telegramBot}?start=ref${code}`, 302);
  }
});

/**
 * GET /affiliate/ref/:code/stats
 * Get click statistics for a referral code
 */
app.get('/:code/stats', async (c) => {
  const code = c.req.param('code');

  try {
    const clicks = await c.env.AFFILIATE_KV.get(`clicks:${code}`) || '0';
    
    // Get recent click events (last 10)
    const clicksList = await c.env.AFFILIATE_KV.list({ prefix: `click:${code}:`, limit: 10 });
    const recentClicks = [];
    
    for (const key of clicksList.keys) {
      const data = await c.env.AFFILIATE_KV.get(key.name, 'json');
      if (data) recentClicks.push(data);
    }

    return c.json({
      code,
      totalClicks: parseInt(clicks),
      recentClicks: recentClicks.slice(0, 10),
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

/**
 * POST /affiliate/ref/:code/landing
 * Set custom landing URL for a referral code
 */
app.post('/:code/landing', async (c) => {
  const code = c.req.param('code');
  const body = await c.req.json();
  const landingUrl = body.url;

  if (!landingUrl || !isValidUrl(landingUrl)) {
    return c.json({ error: 'Invalid URL' }, 400);
  }

  try {
    await c.env.AFFILIATE_KV.put(`landing:${code}`, landingUrl);
    return c.json({ success: true, code, landingUrl });
  } catch (error) {
    return c.json({ error: 'Failed to set landing URL' }, 500);
  }
});

/**
 * Helper: Validate URL
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export default app;

