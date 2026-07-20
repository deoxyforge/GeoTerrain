import type Database from 'better-sqlite3';
import type { Project } from '../../src/types/project';

interface ProjectRow {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  last_opened: string | null;
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastOpened: row.last_opened,
  };
}

export class ProjectRepository {
  constructor(private readonly db: Database.Database) {}

  insert(project: Project): Project {
    this.db
      .prepare(
        `INSERT INTO projects (id, name, description, created_at, updated_at, last_opened)
         VALUES (@id, @name, @description, @createdAt, @updatedAt, @lastOpened)`
      )
      .run({
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        lastOpened: project.lastOpened,
      });
    return project;
  }

  findAll(): Project[] {
    const rows = this.db
      .prepare(`SELECT * FROM projects ORDER BY updated_at DESC`)
      .all() as ProjectRow[];
    return rows.map(toProject);
  }

  findById(id: string): Project | null {
    const row = this.db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id) as
      ProjectRow | undefined;
    return row ? toProject(row) : null;
  }

  findByName(name: string): Project | null {
    const row = this.db.prepare(`SELECT * FROM projects WHERE LOWER(name) = LOWER(?)`).get(name) as
      ProjectRow | undefined;
    return row ? toProject(row) : null;
  }

  update(id: string, name: string, description: string, updatedAt: string): Project | null {
    this.db
      .prepare(`UPDATE projects SET name = ?, description = ?, updated_at = ? WHERE id = ?`)
      .run(name, description, updatedAt, id);
    return this.findById(id);
  }

  touchLastOpened(id: string, lastOpened: string): void {
    this.db.prepare(`UPDATE projects SET last_opened = ? WHERE id = ?`).run(lastOpened, id);
  }

  delete(id: string): void {
    this.db.prepare(`DELETE FROM projects WHERE id = ?`).run(id);
  }
}
