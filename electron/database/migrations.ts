import type Database from 'better-sqlite3';

export function runMigrations(db: Database.Database): void {
  interface ColumnPragmaRow {
    name: string;
    type: string;
  }
  try {
    const coordCols = db.pragma('table_info(coordinates)') as ColumnPragmaRow[];
    const idCol = coordCols.find((c) => c.name === 'id');
    if (idCol && idCol.type.toUpperCase() === 'INTEGER') {
      db.exec(`DROP TABLE IF EXISTS coordinates;`);
    }
  } catch {
    // Table doesn't exist yet
  }

  // Initial schema — safe to run every startup
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at  DATETIME NOT NULL,
      updated_at  DATETIME NOT NULL,
      last_opened DATETIME
    );

    CREATE TABLE IF NOT EXISTS coordinates (
      id           TEXT PRIMARY KEY,
      project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      latitude     REAL NOT NULL,
      longitude    REAL NOT NULL,
      point_order  INTEGER NOT NULL,
      created_at   DATETIME NOT NULL,
      updated_at   DATETIME NOT NULL
    );

    CREATE TABLE IF NOT EXISTS results (
      project_id    TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
      area          REAL NOT NULL,
      perimeter     REAL NOT NULL,
      vertices      INTEGER NOT NULL,
      calculated_at DATETIME NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key           TEXT PRIMARY KEY,
      value         TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_coordinates_project
      ON coordinates(project_id, point_order);
  `);

  interface TableColumnInfo {
    name: string;
  }
  const columns = db.pragma('table_info(projects)') as TableColumnInfo[];
  const columnNames = columns.map((c) => c.name);

  if (!columnNames.includes('description')) {
    db.exec(`ALTER TABLE projects ADD COLUMN description TEXT NOT NULL DEFAULT ''`);
  }
  if (!columnNames.includes('last_opened')) {
    db.exec(`ALTER TABLE projects ADD COLUMN last_opened DATETIME`);
  }
}
