import type Database from 'better-sqlite3';

export class SettingRepository {
  constructor(private readonly db: Database.Database) {}

  get(key: string): string | null {
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
      { value: string } | undefined;
    return row ? row.value : null;
  }

  set(key: string, value: string): void {
    this.db
      .prepare(
        `INSERT INTO settings (key, value)
         VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = ?`
      )
      .run(key, value, value);
  }

  getAll(): Record<string, string> {
    const rows = this.db.prepare('SELECT * FROM settings').all() as Array<{
      key: string;
      value: string;
    }>;
    const settings: Record<string, string> = {};
    rows.forEach((row) => {
      settings[row.key] = row.value;
    });
    return settings;
  }
}
