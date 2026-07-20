import type Database from 'better-sqlite3';
import type { PolygonResult } from '../../src/types/result';

interface ResultRow {
  project_id: string;
  area: number;
  perimeter: number;
  vertices: number;
  calculated_at: string;
}

// ponytail: TRD schema stores area/perimeter/vertices only; derived units computed in service.
// Ceiling: if per-unit storage needed, add columns in a migration.
function toResult(row: ResultRow): PolygonResult {
  return {
    projectId: row.project_id,
    areaSqMeters: row.area,
    areaHectares: row.area / 10000,
    areaSqKilometers: row.area / 1_000_000,
    areaAcres: row.area / 4046.856422,
    perimeter: row.perimeter,
    vertexCount: row.vertices,
    centroidLat: null,
    centroidLon: null,
    calculatedAt: row.calculated_at,
  };
}

export class ResultRepository {
  constructor(private readonly db: Database.Database) {}

  upsert(result: PolygonResult): PolygonResult {
    this.db
      .prepare(
        `INSERT INTO results (project_id, area, perimeter, vertices, calculated_at)
         VALUES (@projectId, @area, @perimeter, @vertices, @calculatedAt)
         ON CONFLICT(project_id) DO UPDATE SET
           area = excluded.area,
           perimeter = excluded.perimeter,
           vertices = excluded.vertices,
           calculated_at = excluded.calculated_at`
      )
      .run({
        projectId: result.projectId,
        area: result.areaSqMeters,
        perimeter: result.perimeter,
        vertices: result.vertexCount,
        calculatedAt: result.calculatedAt,
      });
    return result;
  }

  findByProject(projectId: string): PolygonResult | null {
    const row = this.db.prepare(`SELECT * FROM results WHERE project_id = ?`).get(projectId) as
      ResultRow | undefined;
    return row ? toResult(row) : null;
  }
}
