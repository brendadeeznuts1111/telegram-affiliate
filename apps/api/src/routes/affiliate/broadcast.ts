/**
 * Broadcast API
 * Allows super agents to broadcast messages to their downline
 */

import { Hono } from 'hono';
import { z } from 'zod';

type Bindings = {
  TELEGRAM_BOT_TOKEN: string;
  AFFILIATE_KV: KVNamespace;
  DB?: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

const broadcastSchema = z.object({
  superAgentId: z.string().or(z.number()),
  message: z.string().min(1).max(4000),
  targetType: z.enum(['all_downline', 'direct_agents', 'custom']).optional(),
  customTargets: z.array(z.string()).optional(),
});

/**
 * POST /affiliate/broadcast
 * Send broadcast message to downline
 */
app.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = broadcastSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error }, 400);
  }
  
  const { superAgentId, message, targetType = 'direct_agents', customTargets } = parsed.data;

  try {
    // Verify super agent status
    // TODO: Query from D1 database
    const isSuperAgent = await verifySuperAgent(String(superAgentId), c.env.DB);
    
    if (!isSuperAgent) {
      return c.json({ error: 'Unauthorized: Not a super agent' }, 403);
    }

    // Get target agents
    const targets = await getTargetAgents(
      String(superAgentId), 
      targetType, 
      customTargets,
      c.env.DB
    );

    if (targets.length === 0) {
      return c.json({ error: 'No target agents found' }, 400);
    }

    // Send messages via Telegram Bot API
    const results = await sendBroadcast(
      targets, 
      message, 
      c.env.TELEGRAM_BOT_TOKEN
    );

    // Store broadcast record
    const broadcastId = crypto.randomUUID();
    await c.env.AFFILIATE_KV.put(
      `broadcast:${broadcastId}`,
      JSON.stringify({
        id: broadcastId,
        superAgentId,
        message,
        targetType,
        targetCount: targets.length,
        successCount: results.successCount,
        failedCount: results.failedCount,
        timestamp: Date.now(),
      }),
      { expirationTtl: 86400 * 30 } // 30 days retention
    );

    return c.json({
      success: true,
      broadcastId,
      sent: results.successCount,
      failed: results.failedCount,
      total: targets.length,
    });
  } catch (error) {
    return c.json({ 
      error: 'Failed to send broadcast', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /affiliate/broadcast/:broadcastId
 * Get broadcast details
 */
app.get('/:broadcastId', async (c) => {
  const broadcastId = c.req.param('broadcastId');

  try {
    const broadcast = await c.env.AFFILIATE_KV.get(
      `broadcast:${broadcastId}`,
      'json'
    );

    if (!broadcast) {
      return c.json({ error: 'Broadcast not found' }, 404);
    }

    return c.json(broadcast);
  } catch (error) {
    return c.json({ error: 'Failed to fetch broadcast' }, 500);
  }
});

/**
 * GET /affiliate/broadcast/user/:superAgentId
 * Get broadcast history for super agent
 */
app.get('/user/:superAgentId', async (c) => {
  const superAgentId = c.req.param('superAgentId');

  try {
    const broadcasts = await c.env.AFFILIATE_KV.list({ 
      prefix: 'broadcast:' 
    });

    const userBroadcasts = [];
    for (const key of broadcasts.keys) {
      const data = await c.env.AFFILIATE_KV.get(key.name, 'json') as any;
      if (data && String(data.superAgentId) === superAgentId) {
        userBroadcasts.push(data);
      }
    }

    return c.json({
      superAgentId,
      broadcasts: userBroadcasts.sort((a: any, b: any) => b.timestamp - a.timestamp),
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch broadcast history' }, 500);
  }
});

/**
 * Helper: Verify super agent status
 */
async function verifySuperAgent(userId: string, db?: D1Database): Promise<boolean> {
  if (!db) {
    // Fallback: assume verified if no DB
    return true;
  }

  try {
    const result = await db
      .prepare('SELECT is_super_agent FROM users WHERE user_id = ?')
      .bind(userId)
      .first();
    
    return result?.is_super_agent === 1;
  } catch {
    return false;
  }
}

/**
 * Helper: Get target agents based on type
 */
async function getTargetAgents(
  superAgentId: string,
  targetType: string,
  customTargets?: string[],
  db?: D1Database
): Promise<string[]> {
  if (targetType === 'custom' && customTargets) {
    return customTargets;
  }

  if (!db) {
    return [];
  }

  try {
    if (targetType === 'direct_agents') {
      const result = await db
        .prepare('SELECT user_id FROM users WHERE parent_agent_id = ?')
        .bind(superAgentId)
        .all();
      
      return result.results?.map((r: any) => String(r.user_id)) || [];
    } else if (targetType === 'all_downline') {
      // Recursive: get all agents in downline
      // For simplicity, just get direct agents (TODO: implement recursive)
      const result = await db
        .prepare('SELECT user_id FROM users WHERE parent_agent_id = ?')
        .bind(superAgentId)
        .all();
      
      return result.results?.map((r: any) => String(r.user_id)) || [];
    }
  } catch (error) {
    console.error('Failed to get target agents:', error);
  }

  return [];
}

/**
 * Helper: Send broadcast via Telegram Bot API
 */
async function sendBroadcast(
  targets: string[],
  message: string,
  botToken: string
): Promise<{ successCount: number; failedCount: number }> {
  let successCount = 0;
  let failedCount = 0;

  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  for (const targetId of targets) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetId,
          text: `📢 *Message from your Super Agent:*\n\n${message}`,
          parse_mode: 'Markdown',
        }),
      });

      if (response.ok) {
        successCount++;
      } else {
        failedCount++;
        console.error(`Failed to send to ${targetId}:`, await response.text());
      }
    } catch (error) {
      failedCount++;
      console.error(`Error sending to ${targetId}:`, error);
    }

    // Rate limiting: wait 50ms between messages
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return { successCount, failedCount };
}

export default app;

