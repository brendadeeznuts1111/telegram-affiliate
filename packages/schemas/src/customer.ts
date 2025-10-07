/**
 * Customer Schemas
 * Zod validation for customer-related operations
 */

import { z } from 'zod';

/**
 * Customer creation schema
 */
export const createCustomerSchema = z.object({
  customer_name: z.string()
    .min(2, 'Customer name must be at least 2 characters')
    .max(100, 'Customer name must be at most 100 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Customer name can only contain letters, spaces, hyphens, and apostrophes'),
  
  customer_email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be at most 255 characters')
    .toLowerCase(),
  
  customer_phone: z.string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must be at most 20 characters')
    .regex(/^\+?[0-9\s\-()]+$/, 'Invalid phone number format'),
  
  referred_by: z.number()
    .int('Referrer ID must be an integer')
    .positive('Referrer ID must be positive'),
  
  user_id: z.number()
    .int('User ID must be an integer')
    .positive('User ID must be positive')
    .optional(),
});

/**
 * Customer update schema (all fields optional)
 */
export const updateCustomerSchema = z.object({
  customer_name: z.string().min(2).max(100).optional(),
  customer_email: z.string().email().max(255).toLowerCase().optional(),
  customer_phone: z.string().min(10).max(20).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

/**
 * Customer status schema
 */
export const customerStatusSchema = z.enum(['active', 'inactive', 'suspended']);

/**
 * Customer query params schema
 */
export const customerQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  status: customerStatusSchema.optional(),
  referred_by: z.number().int().positive().optional(),
  search: z.string().max(100).optional(),
});

/**
 * Customer paid status update schema
 */
export const customerPaidSchema = z.object({
  customer_id: z.number()
    .int('Customer ID must be an integer')
    .positive('Customer ID must be positive'),
  
  amount: z.number()
    .positive('Amount must be positive')
    .max(1000000, 'Amount too large'),
  
  agent_id: z.number()
    .int('Agent ID must be an integer')
    .positive('Agent ID must be positive'),
});

/**
 * Parse customer data from text input
 * Format: "Name: John Doe\nPhone: +1234567890\nEmail: john@example.com"
 */
export function parseCustomerText(text: string): z.infer<typeof createCustomerSchema> | null {
  const lines = text.split('\n').map(l => l.trim());
  const data: Record<string, string> = {};
  
  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      const cleanKey = key.trim().toLowerCase();
      const value = valueParts.join(':').trim();
      data[cleanKey] = value;
    }
  }
  
  // Return parsed data (without referred_by - that's added by handler)
  return {
    customer_name: data['name'] || '',
    customer_email: data['email'] || '',
    customer_phone: data['phone'] || '',
    referred_by: 0, // Will be set by handler
  } as z.infer<typeof createCustomerSchema>;
}

// Export types
export type CreateCustomer = z.infer<typeof createCustomerSchema>;
export type UpdateCustomer = z.infer<typeof updateCustomerSchema>;
export type CustomerStatus = z.infer<typeof customerStatusSchema>;
export type CustomerQuery = z.infer<typeof customerQuerySchema>;
export type CustomerPaid = z.infer<typeof customerPaidSchema>;
