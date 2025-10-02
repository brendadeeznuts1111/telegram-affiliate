import { Context, Next } from 'hono';

/**
 * Observability middleware for tracking requests
 */
export const observability = () => {
  return async (c: Context, next: Next) => {
    const start = Date.now();
    const requestId = crypto.randomUUID();
    
    // Add request ID to context and response headers
    c.set('requestId', requestId);
    c.header('X-Request-ID', requestId);
    
    // Log request
    console.log(`[${requestId}] ${c.req.method} ${c.req.path}`);
    
    try {
      await next();
      
      // Log response
      const duration = Date.now() - start;
      console.log(
        `[${requestId}] ${c.res.status} - ${duration}ms`
      );
      
      // Add duration header
      c.header('X-Response-Time', `${duration}ms`);
      
    } catch (error) {
      // Log error
      const duration = Date.now() - start;
      console.error(
        `[${requestId}] ERROR - ${duration}ms`,
        error
      );
      
      throw error;
    }
  };
};

/**
 * Request logger for development
 */
export const devLogger = () => {
  return async (c: Context, next: Next) => {
    if (process.env.NODE_ENV !== 'production') {
      const start = Date.now();
      
      console.log(`→ ${c.req.method} ${c.req.url}`);
      
      await next();
      
      const duration = Date.now() - start;
      console.log(`← ${c.res.status} (${duration}ms)`);
    } else {
      await next();
    }
  };
};

