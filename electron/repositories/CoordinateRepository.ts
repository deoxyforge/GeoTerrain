import type Database from 'better-sqlite3';
import type { Coordinate } from '../../src/types/coordinate';

interface CoordinateRow {
  id: string;
  project_id: string;
  latitude: number;
  longitude: number;
  point_order: number;
  created_at: string;
  updated_at: string;
}

function toCoordinate(row: CoordinateRow): Coordinate {
  return {
    id: row.id,
    projectId: row.project_id,
    latitude: row.latitude,
    longitude: row.longitude,
    pointOrder: row.point_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class CoordinateRepository {
  constructor(private readonly db: Database.Database) {}

  insert(coordinate: Coordinate): Coordinate {
    this.db
      .prepare(
        `INSERT INTO coordinates (id, project_id, latitude, longitude, point_order, created_at, updated_at)
         VALUES (@id, @projectId, @latitude, @longitude, @pointOrder, @createdAt, @updatedAt)`
      )
      .run({
        id: coordinate.id,
        projectId: coordinate.projectId,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        pointOrder: coordinate.pointOrder,
        createdAt: coordinate.createdAt,
        updatedAt: coordinate.updatedAt,
      });
    return coordinate;
  }

  findByProject(projectId: string): Coordinate[] {
    const rows = this.db
      .prepare(`SELECT * FROM coordinates WHERE project_id = ? ORDER BY point_order ASC`)
      .all(projectId) as CoordinateRow[];
    return rows.map(toCoordinate);
  }

  findById(id: string): Coordinate | null {
    const row = this.db.prepare(`SELECT * FROM coordinates WHERE id = ?`).get(id) as
      CoordinateRow | undefined;
    return row ? toCoordinate(row) : null;
  }

  update(id: string, latitude: number, longitude: number, updatedAt: string): Coordinate | null {
    this.db
      .prepare(`UPDATE coordinates SET latitude = ?, longitude = ?, updated_at = ? WHERE id = ?`)
      .run(latitude, longitude, updatedAt, id);
    return this.findById(id);
  }

  delete(id: string): void {
    this.db.prepare(`DELETE FROM coordinates WHERE id = ?`).run(id);
  }

  reorder(projectId: string, orderedIds: string[]): void {
    const update = this.db.prepare(
      `UPDATE coordinates SET point_order = ?, updated_at = ? WHERE id = ? AND project_id = ?`
    );
    const reorderAll = this.db.transaction((ids: string[], now: string) => {
      ids.forEach((id, index) => {
        update.run(index + 1, now, id, projectId);
      });
    });
    reorderAll(orderedIds, new Date().toISOString());
  }

  syncCoordinates(projectId: string, coordinates: Coordinate[]): void {
    const deleteStmt = this.db.prepare('DELETE FROM coordinates WHERE project_id = ?');
    const insertStmt = this.db.prepare(`
      INSERT INTO coordinates (id, project_id, latitude, longitude, point_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const syncAll = this.db.transaction((coords: Coordinate[]) => {
      deleteStmt.run(projectId);
      coords.forEach((c) => {
        insertStmt.run(
          c.id,
          projectId,
          c.latitude,
          c.longitude,
          c.pointOrder,
          c.createdAt,
          c.updatedAt
        );
      });
    });

    syncAll(coordinates);
  }
}
