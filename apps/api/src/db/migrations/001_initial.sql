-- Migration: 001_initial.sql
-- Description: Initial database schema for Telegram affiliate bot
-- Created: 2025-01-01

-- Users table (agents and customers)
CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY,
  username TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT,
  is_agent INTEGER DEFAULT 0,
  is_super_agent INTEGER DEFAULT 0,
  parent_agent_id INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  total_commission REAL DEFAULT 0,
  total_customers INTEGER DEFAULT 0,
  level INTEGER DEFAULT 0,
  net_deposited REAL DEFAULT 0,
  FOREIGN KEY (parent_agent_id) REFERENCES users(user_id)
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
  referred_by INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT UNIQUE,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (referred_by) REFERENCES users(user_id)
);

-- Commissions table
CREATE TABLE IF NOT EXISTS commissions (
  commission_id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  percentage REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  event_type TEXT DEFAULT 'deposit',
  created_at INTEGER DEFAULT (unixepoch()),
  paid_at INTEGER,
  FOREIGN KEY (agent_id) REFERENCES users(user_id),
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- Deposits table
CREATE TABLE IF NOT EXISTS deposits (
  deposit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (agent_id) REFERENCES users(user_id),
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- Agent tree (closure table for efficient hierarchy queries)
CREATE TABLE IF NOT EXISTS agent_tree (
  ancestor_id INTEGER NOT NULL,
  descendant_id INTEGER NOT NULL,
  depth INTEGER NOT NULL,
  PRIMARY KEY (ancestor_id, descendant_id),
  FOREIGN KEY (ancestor_id) REFERENCES users(user_id),
  FOREIGN KEY (descendant_id) REFERENCES users(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_parent ON users(parent_agent_id);
CREATE INDEX IF NOT EXISTS idx_users_is_agent ON users(is_agent);
CREATE INDEX IF NOT EXISTS idx_customers_referred_by ON customers(referred_by);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(customer_email);
CREATE INDEX IF NOT EXISTS idx_commissions_agent ON commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_event_type ON commissions(event_type);
CREATE INDEX IF NOT EXISTS idx_deposits_agent ON deposits(agent_id);
CREATE INDEX IF NOT EXISTS idx_deposits_customer ON deposits(customer_id);
CREATE INDEX IF NOT EXISTS idx_agent_tree_ancestor ON agent_tree(ancestor_id);
CREATE INDEX IF NOT EXISTS idx_agent_tree_descendant ON agent_tree(descendant_id);

