import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('leiloes.db');

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS brain_files (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS analysis_history (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    report TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;
