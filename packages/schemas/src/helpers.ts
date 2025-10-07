/**
 * Schema Helpers
 * Utility functions for working with Zod schemas
 */

import { z } from 'zod';

/**
 * Format Zod error for user-friendly display
 */
export function formatZodError(error: z.ZodError): string {
  const errors = error.errors.map(err => {
    const path = err.path.join('.');
    return `  • ${path || 'root'}: ${err.message}`;
  });
  
  return `Validation failed:\n${errors.join('\n')}`;
}

/**
 * Format Zod error for Telegram message (with markdown)
 */
export function formatZodErrorForTelegram(error: z.ZodError): string {
  const errors = error.errors.map(err => {
    const path = err.path.join('.');
    const field = path ? `\`${path}\`` : 'Input';
    return `  • ${field}: ${err.message}`;
  });
  
  return `❌ *Validation Error*\n\n${errors.join('\n')}`;
}

/**
 * Safe parse with formatted error
 */
export function safeParseWithError<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    error: formatZodError(result.error),
  };
}

/**
 * Validate and throw on error
 */
export function validateOrThrow<T extends z.ZodType>(
  schema: T,
  data: unknown,
  errorPrefix: string = 'Invalid input'
): z.infer<T> {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw new Error(`${errorPrefix}: ${formatZodError(result.error)}`);
  }
  
  return result.data;
}

/**
 * Create a partial schema (all fields optional)
 */
export function createPartialSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
): z.ZodObject<{ [K in keyof T]: z.ZodOptional<T[K]> }> {
  return schema.partial();
}

/**
 * Merge multiple schemas
 */
export function mergeSchemas<
  T extends z.ZodRawShape,
  U extends z.ZodRawShape
>(
  schema1: z.ZodObject<T>,
  schema2: z.ZodObject<U>
): z.ZodObject<T & U> {
  return schema1.merge(schema2);
}

/**
 * Create enum from array
 */
export function createEnumSchema<T extends string>(
  values: readonly [T, ...T[]]
): z.ZodEnum<[T, ...T[]]> {
  return z.enum(values);
}

/**
 * Create nullable version of schema
 */
export function makeNullable<T extends z.ZodType>(
  schema: T
): z.ZodNullable<T> {
  return schema.nullable();
}

/**
 * Create optional version of schema
 */
export function makeOptional<T extends z.ZodType>(
  schema: T
): z.ZodOptional<T> {
  return schema.optional();
}
