/**
 * UserRepository Unit Tests
 * Tests the unified user repository with MockAdapter
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { UserRepository } from '../user.repository';
import { MockAdapter } from '../../adapters/mock';

describe('UserRepository', () => {
  let db: MockAdapter;
  let userRepository: UserRepository;

  beforeEach(async () => {
    db = new MockAdapter();
    userRepository = new UserRepository(db);

    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        username TEXT,
        first_name TEXT NOT NULL,
        last_name TEXT,
        is_agent INTEGER DEFAULT 0,
        is_super_agent INTEGER DEFAULT 0,
        parent_agent_id INTEGER,
        level TEXT DEFAULT 'agent',
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
  });

  describe('create', () => {
    test('should create a new user', async () => {
      const userData = {
        user_id: 123456789,
        username: 'john_doe',
        first_name: 'John',
        last_name: 'Doe',
      };

      const user = await userRepository.create(userData);

      expect(user).toBeDefined();
      expect(user.user_id).toBe(123456789);
      expect(user.username).toBe('john_doe');
      expect(user.first_name).toBe('John');
      expect(user.last_name).toBe('Doe');
      expect(user.is_agent).toBe(0);
      expect(user.is_super_agent).toBe(0);
    });

    test('should create user without username', async () => {
      const userData = {
        user_id: 987654321,
        username: null,
        first_name: 'Jane',
        last_name: null,
      };

      const user = await userRepository.create(userData);

      expect(user).toBeDefined();
      expect(user.user_id).toBe(987654321);
      expect(user.username).toBeNull();
      expect(user.first_name).toBe('Jane');
    });
  });

  describe('getById', () => {
    test('should retrieve user by ID', async () => {
      // Create user
      await userRepository.create({
        user_id: 123,
        username: 'test',
        first_name: 'Test',
        last_name: 'User',
      });

      // Retrieve user
      const user = await userRepository.getById(123);

      expect(user).toBeDefined();
      expect(user?.user_id).toBe(123);
      expect(user?.username).toBe('test');
    });

    test('should return null for non-existent user', async () => {
      const user = await userRepository.getById(999999);

      expect(user).toBeNull();
    });
  });

  describe('getAll', () => {
    test('should retrieve all users', async () => {
      // Create multiple users
      await userRepository.create({
        user_id: 1,
        username: 'user1',
        first_name: 'User',
        last_name: 'One',
      });
      await userRepository.create({
        user_id: 2,
        username: 'user2',
        first_name: 'User',
        last_name: 'Two',
      });

      const users = await userRepository.getAll();

      expect(users).toHaveLength(2);
      expect(users[0].user_id).toBe(1);
      expect(users[1].user_id).toBe(2);
    });

    test('should return empty array when no users exist', async () => {
      const users = await userRepository.getAll();

      expect(users).toEqual([]);
    });
  });

  describe('makeAgent', () => {
    test('should promote user to agent', async () => {
      // Create user
      await userRepository.create({
        user_id: 123,
        username: 'test',
        first_name: 'Test',
        last_name: 'User',
      });

      // Make agent
      await userRepository.makeAgent(123, null);

      // Verify
      const user = await userRepository.getById(123);
      expect(user?.is_agent).toBe(1);
      expect(user?.parent_agent_id).toBeNull();
    });

    test('should set parent agent ID', async () => {
      // Create parent and child
      await userRepository.create({
        user_id: 100,
        username: 'parent',
        first_name: 'Parent',
        last_name: 'Agent',
      });
      await userRepository.create({
        user_id: 200,
        username: 'child',
        first_name: 'Child',
        last_name: 'Agent',
      });

      // Make agent with parent
      await userRepository.makeAgent(200, 100);

      // Verify
      const user = await userRepository.getById(200);
      expect(user?.is_agent).toBe(1);
      expect(user?.parent_agent_id).toBe(100);
    });
  });

  describe('makeSuperAgent', () => {
    test('should promote agent to super agent', async () => {
      // Create agent
      await userRepository.create({
        user_id: 123,
        username: 'test',
        first_name: 'Test',
        last_name: 'User',
      });
      await userRepository.makeAgent(123, null);

      // Make super agent
      await userRepository.makeSuperAgent(123);

      // Verify
      const user = await userRepository.getById(123);
      expect(user?.is_super_agent).toBe(1);
    });
  });

  describe('getAgentStats', () => {
    test('should return agent statistics', async () => {
      // Create agent
      await userRepository.create({
        user_id: 123,
        username: 'agent',
        first_name: 'Agent',
        last_name: 'User',
      });
      await userRepository.makeAgent(123, null);

      // Get stats
      const stats = await userRepository.getAgentStats(123);

      expect(stats).toBeDefined();
      expect(stats.customers).toBe(0);
      expect(stats.commission).toBe(0);
      expect(stats.sub_agents).toBe(0);
    });
  });

  describe('getAllAgents', () => {
    test('should retrieve all agents', async () => {
      // Create regular user and agents
      await userRepository.create({
        user_id: 1,
        username: 'regular',
        first_name: 'Regular',
        last_name: 'User',
      });
      await userRepository.create({
        user_id: 2,
        username: 'agent1',
        first_name: 'Agent',
        last_name: 'One',
      });
      await userRepository.create({
        user_id: 3,
        username: 'agent2',
        first_name: 'Agent',
        last_name: 'Two',
      });

      await userRepository.makeAgent(2, null);
      await userRepository.makeAgent(3, null);

      // Get all agents
      const agents = await userRepository.getAllAgents();

      expect(agents).toHaveLength(2);
      expect(agents.every((a) => a.is_agent === 1)).toBe(true);
    });
  });

  describe('count', () => {
    test('should return total user count', async () => {
      // Create users
      await userRepository.create({
        user_id: 1,
        username: 'user1',
        first_name: 'User',
        last_name: 'One',
      });
      await userRepository.create({
        user_id: 2,
        username: 'user2',
        first_name: 'User',
        last_name: 'Two',
      });

      const count = await userRepository.count();

      expect(count).toBe(2);
    });

    test('should return 0 when no users exist', async () => {
      const count = await userRepository.count();

      expect(count).toBe(0);
    });
  });
});
