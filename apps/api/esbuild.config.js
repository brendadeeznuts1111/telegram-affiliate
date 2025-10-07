/**
 * esbuild configuration for Cloudflare Workers deployment
 * Excludes Bun-specific modules that aren't available in Workers
 */

export default {
  external: ['bun:sqlite'],
};
