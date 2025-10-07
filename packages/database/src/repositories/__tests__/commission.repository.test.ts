/**
 * CommissionRepository Unit Tests
 * Tests the unified commission repository with MockAdapter
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { CommissionRepository } from '../commission.repository';
import { MockAdapter } from '../../adapters/mock';

describe('CommissionRepository', () => {
  let db: MockAdapter;
  let commissionRepository: CommissionRepository;

  beforeEach(async () => {
    db = new MockAdapter();
    commissionRepository = new CommissionRepository(db);

    // Create commissions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS commissions (
        commission_id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        percentage REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        paid_at INTEGER,
        FOREIGN KEY (agent_id) REFERENCES users(user_id),
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
      )
    `);
  });

  describe('create', () => {
    test('should create a new commission', async () => {
      const commission = await commissionRepository.create(
        123, // agentId
        456, // customerId
        50.00, // amount
        0.05 // percentage
      );

      expect(commission).toBeDefined();
      expect(commission.agent_id).toBe(123);
      expect(commission.customer_id).toBe(456);
      expect(commission.amount).toBe(50);
      expect(commission.percentage).toBe(0.05);
      expect(commission.status).toBe('pending');
    });
  });

  describe('getById', () => {
    test('should retrieve commission by ID', async () => {
      const created = await commissionRepository.create(123, 456, 50, 0.05);

      const commission = await commissionRepository.getById(created.commission_id!);

      expect(commission).toBeDefined();
      expect(commission?.agent_id).toBe(123);
      expect(commission?.amount).toBe(50);
    });

    test('should return null for non-existent commission', async () => {
      const commission = await commissionRepository.getById(999999);

      expect(commission).toBeNull();
    });
  });

  describe('getByAgent', () => {
    test('should retrieve all commissions for an agent', async () => {
      // Create commissions for agent 123
      await commissionRepository.create(123, 1, 50, 0.05);
      await commissionRepository.create(123, 2, 75, 0.05);
      // Create commission for different agent
      await commissionRepository.create(456, 3, 100, 0.05);

      const commissions = await commissionRepository.getByAgent(123);

      expect(commissions).toHaveLength(2);
      expect(commissions.every((c) => c.agent_id === 123)).toBe(true);
    });
  });

  describe('getPendingByAgent', () => {
    test('should retrieve only pending commissions', async () => {
      // Create pending and paid commissions
      const pending1 = await commissionRepository.create(123, 1, 50, 0.05);
      const pending2 = await commissionRepository.create(123, 2, 75, 0.05);
      const paid = await commissionRepository.create(123, 3, 100, 0.05);
      
      await commissionRepository.updateStatus(paid.commission_id!, 'paid');

      const pending = await commissionRepository.getPendingByAgent(123);

      expect(pending).toHaveLength(2);
      expect(pending.every((c) => c.status === 'pending')).toBe(true);
    });
  });

  describe('getPaidByAgent', () => {
    test('should retrieve only paid commissions', async () => {
      const pending = await commissionRepository.create(123, 1, 50, 0.05);
      const paid1 = await commissionRepository.create(123, 2, 75, 0.05);
      const paid2 = await commissionRepository.create(123, 3, 100, 0.05);

      await commissionRepository.updateStatus(paid1.commission_id!, 'paid');
      await commissionRepository.updateStatus(paid2.commission_id!, 'paid');

      const paidCommissions = await commissionRepository.getPaidByAgent(123);

      expect(paidCommissions).toHaveLength(2);
      expect(paidCommissions.every((c) => c.status === 'paid')).toBe(true);
    });
  });

  describe('markAsPaid', () => {
    test('should mark commissions as paid', async () => {
      // Create pending commissions
      await commissionRepository.create(123, 1, 50, 0.05);
      await commissionRepository.create(123, 2, 75, 0.05);
      await commissionRepository.create(123, 3, 100, 0.05);

      const count = await commissionRepository.markAsPaid(123, 2);

      expect(count).toBe(2);

      const paid = await commissionRepository.getPaidByAgent(123);
      expect(paid).toHaveLength(2);
    });
  });

  describe('updateStatus', () => {
    test('should update commission status', async () => {
      const commission = await commissionRepository.create(123, 456, 50, 0.05);

      await commissionRepository.updateStatus(commission.commission_id!, 'paid');

      const updated = await commissionRepository.getById(commission.commission_id!);
      expect(updated?.status).toBe('paid');
    });
  });

  describe('getStatsByAgent', () => {
    test('should return commission statistics', async () => {
      // Create commissions with different statuses
      const pending1 = await commissionRepository.create(123, 1, 50, 0.05);
      const pending2 = await commissionRepository.create(123, 2, 75, 0.05);
      const paid1 = await commissionRepository.create(123, 3, 100, 0.05);

      await commissionRepository.updateStatus(paid1.commission_id!, 'paid');

      const stats = await commissionRepository.getStatsByAgent(123);

      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThanOrEqual(225);
      expect(stats.pending).toBeGreaterThanOrEqual(125);
      expect(stats.paid).toBeGreaterThanOrEqual(100);
      expect(stats.count).toBeGreaterThanOrEqual(3);
    });
  });

  describe('getTotalPaid', () => {
    test('should return total paid amount across all agents', async () => {
      const comm1 = await commissionRepository.create(123, 1, 50, 0.05);
      const comm2 = await commissionRepository.create(456, 2, 100, 0.05);

      await commissionRepository.updateStatus(comm1.commission_id!, 'paid');
      await commissionRepository.updateStatus(comm2.commission_id!, 'paid');

      const total = await commissionRepository.getTotalPaid();

      expect(total).toBeGreaterThanOrEqual(150);
    });
  });

  describe('getTotalPending', () => {
    test('should return total pending amount across all agents', async () => {
      await commissionRepository.create(123, 1, 50, 0.05);
      await commissionRepository.create(456, 2, 100, 0.05);
      const paid = await commissionRepository.create(789, 3, 75, 0.05);

      await commissionRepository.updateStatus(paid.commission_id!, 'paid');

      const total = await commissionRepository.getTotalPending();

      expect(total).toBeGreaterThanOrEqual(150);
    });
  });

  describe('delete', () => {
    test('should delete a commission', async () => {
      const commission = await commissionRepository.create(123, 456, 50, 0.05);

      await commissionRepository.delete(commission.commission_id!);

      const deleted = await commissionRepository.getById(commission.commission_id!);
      expect(deleted).toBeNull();
    });
  });

  describe('getByCustomer', () => {
    test('should retrieve commissions for a customer', async () => {
      await commissionRepository.create(123, 456, 50, 0.05);
      await commissionRepository.create(789, 456, 75, 0.05);
      await commissionRepository.create(123, 999, 100, 0.05);

      const commissions = await commissionRepository.getByCustomer(456);

      expect(commissions).toHaveLength(2);
      expect(commissions.every((c) => c.customer_id === 456)).toBe(true);
    });
  });
});
