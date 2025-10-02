/**
 * /qr Command Handler (Worker Version)
 * Generates and sends QR code for referral link
 */

import type { WorkerContext } from '../worker-bot';

export async function qrHandler(ctx: WorkerContext) {
  const user = ctx.from;
  if (!user) return;

  try {
    const workerUrl = ctx.env.PUBLIC_URL || 'https://telegram-affiliate-api.workers.dev';
    const qrUrl = `${workerUrl}/api/affiliate/qr/${user.id}`;

    await ctx.reply(
      `📱 *Your QR Code*\n\n` +
      `View your QR code here:\n${qrUrl}\n\n` +
      `Share this QR code for quick referrals!\n` +
      `People can scan it to start with your referral link.`,
      { parse_mode: 'Markdown' }
    );

    console.log(`QR code requested by user ${user.id}`);
  } catch (error) {
    console.error('QR handler error:', error);
    await ctx.reply('❌ Failed to generate QR code. Please try again.');
  }
}

