/**
 * Customer Service - Worker Version
 * Business logic for customer management
 */

import type { CustomerRepository } from '@affiliate/database/index.workers';
import type { Customer } from '@affiliate/database/index.workers';

export class CustomerService {
  constructor(private customerRepository: CustomerRepository) {}

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  static validatePhone(phone: string): boolean {
    // Remove spaces, dashes, parentheses
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    // Check if it's a valid phone (10-15 digits, optional + prefix)
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(cleaned);
  }

  /**
   * Normalize phone number
   */
  static normalizePhone(phone: string): string {
    return phone.replace(/[\s\-\(\)]/g, '');
  }

  /**
   * Check for duplicate customer
   */
  async checkDuplicate(
    agentId: number,
    email: string,
    phone: string
  ): Promise<Customer | null> {
    const customers = await this.customerRepository.getByAgent(agentId);
    
    const normalizedPhone = CustomerService.normalizePhone(phone);
    
    return customers.find(c => 
      c.email.toLowerCase() === email.toLowerCase() ||
      CustomerService.normalizePhone(c.phone) === normalizedPhone
    ) || null;
  }

  /**
   * Create new customer
   */
  async createCustomer(data: {
    agentId: number;
    name: string;
    email: string;
    phone: string;
  }): Promise<Customer> {
    // Check for duplicates
    const existing = await this.checkDuplicate(
      data.agentId,
      data.email,
      data.phone
    );

    if (existing) {
      throw new Error(
        `Customer already exists with this ${
          existing.email.toLowerCase() === data.email.toLowerCase()
            ? 'email'
            : 'phone number'
        }\n\n` +
        `Name: ${existing.name}\n` +
        `Email: ${existing.email}\n` +
        `Phone: ${existing.phone}`
      );
    }

    // Create customer
    return await this.customerRepository.create({
      agent_id: data.agentId,
      name: data.name,
      email: data.email,
      phone: CustomerService.normalizePhone(data.phone),
      status: 'active',
      telegram_id: null,
    });
  }

  /**
   * Get customers by agent
   */
  async getByAgent(agentId: number): Promise<Customer[]> {
    return await this.customerRepository.getByAgent(agentId);
  }

  /**
   * Format single customer for display
   */
  static formatCustomer(customer: Customer): string {
    const createdDate = new Date(customer.created_at * 1000).toLocaleDateString();
    
    return (
      `👤 *${customer.name}*\n` +
      `📧 ${customer.email}\n` +
      `📱 ${customer.phone}\n` +
      `📅 Added: ${createdDate}\n` +
      `🆔 ID: ${customer.customer_id}`
    );
  }

  /**
   * Format customer list for display
   */
  static formatCustomerList(customers: Customer[]): string {
    let message = `📋 *Your Customers* (${customers.length})\n\n`;

    customers.forEach((customer, index) => {
      const createdDate = new Date(customer.created_at * 1000).toLocaleDateString();
      message += 
        `${index + 1}. *${customer.name}*\n` +
        `   📧 ${customer.email}\n` +
        `   📱 ${customer.phone}\n` +
        `   📅 ${createdDate}\n\n`;
    });

    return message;
  }
}
