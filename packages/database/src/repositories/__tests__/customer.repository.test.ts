/**
 * CustomerRepository Unit Tests
 * Tests the unified customer repository with MockAdapter
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { CustomerRepository } from '../customer.repository';
import { MockAdapter } from '../../adapters/mock';

describe('CustomerRepository', () => {
  let db: MockAdapter;
  let customerRepository: CustomerRepository;

  beforeEach(async () => {
    db = new MockAdapter();
    customerRepository = new CustomerRepository(db);

    // Create customers table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        agent_id INTEGER NOT NULL,
        status TEXT DEFAULT 'active',
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (agent_id) REFERENCES users(user_id)
      )
    `);
  });

  describe('create', () => {
    test('should create a new customer', async () => {
      const customerData = {
        customer_name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+1234567890',
        agent_id: 123,
      };

      const customer = await customerRepository.create(customerData);

      expect(customer).toBeDefined();
      expect(customer.customer_name).toBe('Jane Doe');
      expect(customer.email).toBe('jane@example.com');
      expect(customer.phone).toBe('+1234567890');
      expect(customer.agent_id).toBe(123);
      expect(customer.status).toBe('active');
    });

    test('should create customer without email', async () => {
      const customerData = {
        customer_name: 'John Smith',
        email: null,
        phone: '+0987654321',
        agent_id: 456,
      };

      const customer = await customerRepository.create(customerData);

      expect(customer).toBeDefined();
      expect(customer.customer_name).toBe('John Smith');
      expect(customer.email).toBeNull();
    });
  });

  describe('getById', () => {
    test('should retrieve customer by ID', async () => {
      // Create customer
      const created = await customerRepository.create({
        customer_name: 'Test Customer',
        email: 'test@example.com',
        phone: '+1111111111',
        agent_id: 123,
      });

      // Retrieve customer
      const customer = await customerRepository.getById(created.customer_id!);

      expect(customer).toBeDefined();
      expect(customer?.customer_name).toBe('Test Customer');
      expect(customer?.email).toBe('test@example.com');
    });

    test('should return null for non-existent customer', async () => {
      const customer = await customerRepository.getById(999999);

      expect(customer).toBeNull();
    });
  });

  describe('getByAgent', () => {
    test('should retrieve customers for an agent', async () => {
      // Create customers for agent 123
      await customerRepository.create({
        customer_name: 'Customer 1',
        email: 'customer1@example.com',
        phone: '+1111111111',
        agent_id: 123,
      });
      await customerRepository.create({
        customer_name: 'Customer 2',
        email: 'customer2@example.com',
        phone: '+2222222222',
        agent_id: 123,
      });
      // Create customer for different agent
      await customerRepository.create({
        customer_name: 'Customer 3',
        email: 'customer3@example.com',
        phone: '+3333333333',
        agent_id: 456,
      });

      const customers = await customerRepository.getByAgent(123);

      expect(customers).toHaveLength(2);
      expect(customers.every((c) => c.agent_id === 123)).toBe(true);
    });

    test('should return empty array for agent with no customers', async () => {
      const customers = await customerRepository.getByAgent(999);

      expect(customers).toEqual([]);
    });
  });

  describe('getCountByAgent', () => {
    test('should return customer count for agent', async () => {
      // Create customers
      await customerRepository.create({
        customer_name: 'Customer 1',
        email: 'c1@example.com',
        phone: '+1111',
        agent_id: 123,
      });
      await customerRepository.create({
        customer_name: 'Customer 2',
        email: 'c2@example.com',
        phone: '+2222',
        agent_id: 123,
      });

      const count = await customerRepository.getCountByAgent(123);

      expect(count).toBe(2);
    });

    test('should return 0 for agent with no customers', async () => {
      const count = await customerRepository.getCountByAgent(999);

      expect(count).toBe(0);
    });
  });

  describe('updateStatus', () => {
    test('should update customer status', async () => {
      // Create customer
      const customer = await customerRepository.create({
        customer_name: 'Test Customer',
        email: 'test@example.com',
        phone: '+1111',
        agent_id: 123,
      });

      // Update status
      await customerRepository.updateStatus(customer.customer_id!, 'inactive');

      // Verify
      const updated = await customerRepository.getById(customer.customer_id!);
      expect(updated?.status).toBe('inactive');
    });
  });

  describe('search', () => {
    test('should search customers by name', async () => {
      // Create customers
      await customerRepository.create({
        customer_name: 'John Smith',
        email: 'john@example.com',
        phone: '+1111',
        agent_id: 123,
      });
      await customerRepository.create({
        customer_name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+2222',
        agent_id: 123,
      });
      await customerRepository.create({
        customer_name: 'John Doe',
        email: 'johndoe@example.com',
        phone: '+3333',
        agent_id: 123,
      });

      const results = await customerRepository.search('john');

      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.some((c) => c.customer_name.toLowerCase().includes('john'))).toBe(true);
    });

    test('should return empty array when no matches', async () => {
      const results = await customerRepository.search('nonexistent');

      expect(results).toEqual([]);
    });
  });

  describe('getRecent', () => {
    test('should retrieve recent customers', async () => {
      // Create customers
      await customerRepository.create({
        customer_name: 'Recent Customer',
        email: 'recent@example.com',
        phone: '+1111',
        agent_id: 123,
      });

      const recent = await customerRepository.getRecent(7);

      expect(recent.length).toBeGreaterThan(0);
    });
  });

  describe('existsByEmail', () => {
    test('should return true when email exists', async () => {
      await customerRepository.create({
        customer_name: 'Test',
        email: 'test@example.com',
        phone: '+1111',
        agent_id: 123,
      });

      const exists = await customerRepository.existsByEmail('test@example.com');

      expect(exists).toBe(true);
    });

    test('should return false when email does not exist', async () => {
      const exists = await customerRepository.existsByEmail('nonexistent@example.com');

      expect(exists).toBe(false);
    });
  });

  describe('existsByPhone', () => {
    test('should return true when phone exists', async () => {
      await customerRepository.create({
        customer_name: 'Test',
        email: 'test@example.com',
        phone: '+1234567890',
        agent_id: 123,
      });

      const exists = await customerRepository.existsByPhone('+1234567890');

      expect(exists).toBe(true);
    });

    test('should return false when phone does not exist', async () => {
      const exists = await customerRepository.existsByPhone('+9999999999');

      expect(exists).toBe(false);
    });
  });

  describe('getTotalCount', () => {
    test('should return total customer count', async () => {
      await customerRepository.create({
        customer_name: 'Customer 1',
        email: 'c1@example.com',
        phone: '+1111',
        agent_id: 123,
      });
      await customerRepository.create({
        customer_name: 'Customer 2',
        email: 'c2@example.com',
        phone: '+2222',
        agent_id: 456,
      });

      const count = await customerRepository.getTotalCount();

      expect(count).toBe(2);
    });
  });

  describe('getActiveCount', () => {
    test('should return count of active customers', async () => {
      await customerRepository.create({
        customer_name: 'Active',
        email: 'active@example.com',
        phone: '+1111',
        agent_id: 123,
      });
      const inactive = await customerRepository.create({
        customer_name: 'Inactive',
        email: 'inactive@example.com',
        phone: '+2222',
        agent_id: 123,
      });
      await customerRepository.updateStatus(inactive.customer_id!, 'inactive');

      const count = await customerRepository.getActiveCount();

      expect(count).toBe(1);
    });
  });
});
