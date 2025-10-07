/**
 * Customer Repository
 * Consolidated data access layer for customers
 * Works with both SQLite and D1
 */

import { BaseRepository } from './base.repository';
import type { IDatabaseAdapter } from '../interface';
import { NotFoundError, DatabaseError } from '@affiliate/errors';

export interface Customer {
  customer_id: number;
  user_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  referred_by: number;
  created_at: number;
  status: 'active' | 'inactive';
}

export interface CreateCustomerInput {
  referred_by: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
}

export interface CustomerListItem {
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  created_at: number;
  status: string;
}

export class CustomerRepository extends BaseRepository {
  constructor(db: IDatabaseAdapter) {
    super(db);
  }

  /**
   * Get customer by ID
   */
  async getById(customerId: number): Promise<Customer | null> {
    return this.findById<Customer>('customers', 'customer_id', customerId);
  }

  /**
   * Get customer by ID or throw
   */
  async getByIdOrThrow(customerId: number): Promise<Customer> {
    const customer = await this.getById(customerId);
    if (!customer) {
      throw new NotFoundError('Customer', customerId);
    }
    return customer;
  }

  /**
   * Create new customer
   */
  async create(input: CreateCustomerInput): Promise<Customer> {
    try {
      return await this.transaction(async () => {
        // Insert customer
        await this.db.run(
          `INSERT INTO customers (user_id, customer_name, customer_phone, customer_email, referred_by)
           VALUES (?, ?, ?, ?, ?)`,
          [input.referred_by, input.customer_name, input.customer_phone, input.customer_email, input.referred_by]
        );

        const customerId = await this.db.getLastInsertId();

        // Update agent's customer count
        await this.db.run(
          'UPDATE users SET total_customers = total_customers + 1 WHERE user_id = ?',
          [input.referred_by]
        );

        const customer = await this.getById(customerId);
        if (!customer) {
          throw new DatabaseError('Failed to create customer');
        }

        return customer;
      });
    } catch (error) {
      throw new DatabaseError('Failed to create customer', {
        input,
        error: String(error)
      });
    }
  }

  /**
   * Get all customers for an agent
   */
  async getByAgent(agentId: number): Promise<Customer[]> {
    return this.findWhere<Customer>(
      'customers',
      'referred_by = ?',
      [agentId]
    );
  }

  /**
   * Get customer count for an agent
   */
  async getCountByAgent(agentId: number): Promise<number> {
    return this.count('customers', 'referred_by = ?', [agentId]);
  }

  /**
   * Update customer status
   */
  async updateStatus(customerId: number, status: 'active' | 'inactive'): Promise<void> {
    await this.update('customers', 'customer_id', customerId, { status });
  }

  /**
   * Get total customer count
   */
  async getTotalCount(): Promise<number> {
    return this.count('customers');
  }

  /**
   * Get active customer count
   */
  async getActiveCount(): Promise<number> {
    return this.count('customers', "status = 'active'");
  }

  /**
   * Search customers by name, phone, or email
   */
  async search(query: string): Promise<Customer[]> {
    const searchPattern = `%${query}%`;
    return this.db.query<Customer>(
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
  async getRecent(days: number = 7): Promise<Customer[]> {
    const timestamp = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
    return this.db.query<Customer>(
      'SELECT * FROM customers WHERE created_at >= ? ORDER BY created_at DESC',
      [timestamp]
    );
  }

  /**
   * Check if customer email exists
   */
  async existsByEmail(email: string): Promise<boolean> {
    return this.exists('customers', 'customer_email = ?', [email]);
  }

  /**
   * Check if customer phone exists
   */
  async existsByPhone(phone: string): Promise<boolean> {
    return this.exists('customers', 'customer_phone = ?', [phone]);
  }
}
