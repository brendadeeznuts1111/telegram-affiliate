import { Database } from 'bun:sqlite';
import { resolve } from 'node:path';

// Get absolute path to database
const DB_PATH = resolve(import.meta.dir, '../../../../data/affiliate_system.db');

console.log('Database path:', DB_PATH);

export const db = new Database(DB_PATH);

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

