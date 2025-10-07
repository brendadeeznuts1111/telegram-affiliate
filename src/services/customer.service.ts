/**
 * Customer Service
 * Business logic for customer management
 */

import { customerRepository } from '@/core/bot-database';
import { logger } from '@/utils/logger';
import type { Customer, CreateCustomerInput } from '@/types/customer';

export class CustomerService {
  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format (basic validation)
   */
  static validatePhone(phone: string): boolean {
    // Allow international formats: +1234567890, (123) 456-7890, etc.
    const phoneRegex = /^[\d\s\(\)\-\+]+$/;
    const cleanPhone = phone.replace(/[\s\(\)\-]/g, '');
    return phoneRegex.test(phone) && cleanPhone.length >= 10 && cleanPhone.length <= 15;
  }

  /**
   * Normalize phone number (remove formatting, keep +)
   */
  static normalizePhone(phone: string): string {
    // Keep leading + if present, remove other non-digits
    if (phone.startsWith('+')) {
      return '+' + phone.substring(1).replace(/[^\d]/g, '');
    }
    return phone.replace(/[^\d]/g, '');
  }

  /**
   * Check if customer already exists for this agent
   */
  static async checkDuplicate(
    agentId: number,
    email?: string,
    phone?: string
  ): Promise<Customer | null> {
    try {
      // Get all customers for this agent
      const customers = await customerRepository.getByAgent(agentId);

      // Check for duplicate email or phone
      const duplicate = customers.find(c => {
        if (email && c.customer_email === email) return true;
        if (phone && c.customer_phone === phone) return true;
        return false;
      });

      return duplicate || null;
    } catch (error) {
      logger.error('Error checking duplicate customer:', error);
      return null;
    }
  }

  /**
   * Create a new customer
   */
  static async createCustomer(data: {
    agentId: number;
    name: string;
    email: string;
    phone: string;
  }): Promise<Customer> {
    // Normalize phone
    const normalizedPhone = this.normalizePhone(data.phone);

    // Check for duplicates
    const duplicate = await this.checkDuplicate(data.agentId, data.email, normalizedPhone);
    if (duplicate) {
      throw new Error(
        `Customer already exists: ${duplicate.customer_name} (ID: ${duplicate.customer_id})`
      );
    }

    // Create customer
    const customer = await customerRepository.create({
      referred_by: data.agentId,
      customer_name: data.name,
      customer_email: data.email,
      customer_phone: normalizedPhone,
    });

    logger.info(`Customer created: ${customer.customer_id} by agent ${data.agentId}`);
    return customer;
  }

  /**
   * Get customer by ID
   */
  static async getById(customerId: number): Promise<Customer | null> {
    return await customerRepository.getById(customerId);
  }

  /**
   * Get all customers for an agent
   */
  static async getByAgent(agentId: number): Promise<Customer[]> {
    return await customerRepository.getByAgent(agentId);
  }

  /**
   * Get customer count for an agent
   */
  static async getCountByAgent(agentId: number): Promise<number> {
    return await customerRepository.getCountByAgent(agentId);
  }

  /**
   * Format customer for display
   */
  static formatCustomer(customer: Customer): string {
    return (
      `👤 *${customer.customer_name}*\n` +
      `📧 ${customer.customer_email}\n` +
      `📱 ${customer.customer_phone}\n` +
      `🆔 ID: ${customer.customer_id}\n` +
      `📅 Added: ${new Date(customer.created_at * 1000).toLocaleDateString()}`
    );
  }

  /**
   * Format customer list for display
   */
  static formatCustomerList(customers: Customer[]): string {
    if (customers.length === 0) {
      return '📋 No customers yet. Use /addcustomer to add one!';
    }

    let message = `📋 *Your Customers (${customers.length})*\n\n`;

    customers.slice(0, 10).forEach((customer, index) => {
      message +=
        `${index + 1}. ${customer.customer_name}\n` +
        `   📧 ${customer.customer_email}\n` +
        `   📱 ${customer.customer_phone}\n` +
        `   🆔 ID: ${customer.customer_id}\n\n`;
    });

    if (customers.length > 10) {
      message += `\n_... and ${customers.length - 10} more_`;
    }

    return message;
  }
}
