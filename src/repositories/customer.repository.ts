/**
 * Customer Repository - Data access layer for customers
 */

import { db } from '@/core/database';
import type { Customer, CreateCustomerInput } from '@/types/customer';
import { logger } from '@/utils/logger';
import { userRepository } from './user.repository';

export class CustomerRepository {
  /**
   * Get customer by ID
   */
  getById(customerId: number): Customer | null {
    return db.queryOne<Customer>(
      'SELECT * FROM customers WHERE customer_id = ?',
      [customerId]
    );
  }

  /**
   * Create new customer
   */
  create(input: CreateCustomerInput): Customer {
    const customerId = db.transaction(() => {
      // Insert customer
      db.run(
        `INSERT INTO customers (user_id, customer_name, customer_phone, customer_email, referred_by)
         VALUES (?, ?, ?, ?, ?)`,
        [input.referred_by, input.customer_name, input.customer_phone, input.customer_email, input.referred_by]
      );

      const id = db.getLastInsertId();

      // Update agent's customer count
      userRepository.incrementCustomerCount(input.referred_by);

      return id;
    });

    const customer = this.getById(customerId);
    if (!customer) {
      throw new Error('Failed to create customer');
    }

    logger.info(`Customer created: ${customerId} by agent ${input.referred_by}`);
    return customer;
  }

  /**
   * Get all customers for an agent
   */
  getByAgent(agentId: number): Customer[] {
    return db.query<Customer>(
      'SELECT * FROM customers WHERE referred_by = ? ORDER BY created_at DESC',
      [agentId]
    );
  }

  /**
   * Get customer count for an agent
   */
  getCountByAgent(agentId: number): number {
    const result = db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM customers WHERE referred_by = ?',
      [agentId]
    );
    return result?.count || 0;
  }

  /**
   * Update customer status
   */
  updateStatus(customerId: number, status: 'active' | 'inactive'): void {
    db.run(
      'UPDATE customers SET status = ? WHERE customer_id = ?',
      [status, customerId]
    );
    
    logger.info(`Customer ${customerId} status updated to ${status}`);
  }

  /**
   * Get total customer count
   */
  getTotalCount(): number {
    const result = db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM customers'
    );
    return result?.count || 0;
  }

  /**
   * Get active customer count
   */
  getActiveCount(): number {
    const result = db.queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM customers WHERE status = 'active'"
    );
    return result?.count || 0;
  }

  /**
   * Search customers by name, phone, or email
   */
  search(query: string): Customer[] {
    const searchPattern = `%${query}%`;
    return db.query<Customer>(
      `SELECT * FROM customers 
       WHERE customer_name LIKE ? 
          OR customer_phone LIKE ? 
          OR customer_email LIKE ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [searchPattern, searchPattern, searchPattern]
    );
  }

  /**
   * Get recent customers (last N days)
   */
  getRecent(days: number = 7): Customer[] {
    const timestamp = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
    return db.query<Customer>(
      'SELECT * FROM customers WHERE created_at >= ? ORDER BY created_at DESC',
      [timestamp]
    );
  }

  /**
   * Check if customer email exists
   */
  existsByEmail(email: string): boolean {
    const result = db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM customers WHERE customer_email = ?',
      [email]
    );
    return (result?.count || 0) > 0;
  }

  /**
   * Check if customer phone exists
   */
  existsByPhone(phone: string): boolean {
    const result = db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM customers WHERE customer_phone = ?',
      [phone]
    );
    return (result?.count || 0) > 0;
  }
}

// Export singleton instance
export const customerRepository = new CustomerRepository();

