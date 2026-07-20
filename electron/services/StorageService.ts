import type Database from 'better-sqlite3';

// ponytail: StorageService wraps DB connection lifecycle and backup utilities
// Ceiling: Phase 3 can add encrypted backup, auto-save, crash recovery here

export class StorageService {
  constructor(private readonly db: Database.Database) {}

  // Verifies DB connection is alive
  healthCheck(): boolean {
    try {
      this.db.prepare('SELECT 1').get();
      return true;
    } catch {
      return false;
    }
  }

  // Runs a safe checkpoint to flush WAL to main DB file
  checkpoint(): void {
    this.db.pragma('wal_checkpoint(TRUNCATE)');
  }
}
