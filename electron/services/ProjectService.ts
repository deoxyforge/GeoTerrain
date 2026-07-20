import { v4 as uuidv4 } from 'uuid';
import type {
  Project,
  CreateProjectInput,
  RenameProjectInput,
  UpdateProjectInput,
} from '../../src/types/project';
import type { ProjectRepository } from '../repositories/ProjectRepository';

export class ProjectService {
  constructor(private readonly projectRepo: ProjectRepository) {}

  createProject(input: CreateProjectInput): Project {
    const name = input.name.trim();
    if (!name) throw new Error('Project name cannot be empty');

    const existing = this.projectRepo.findByName(name);
    if (existing) throw new Error(`A project named "${name}" already exists`);

    const now = new Date().toISOString();
    const project: Project = {
      id: uuidv4(),
      name,
      description: (input.description ?? '').trim(),
      createdAt: now,
      updatedAt: now,
      lastOpened: now,
    };
    return this.projectRepo.insert(project);
  }

  getAllProjects(): Project[] {
    return this.projectRepo.findAll();
  }

  getProjectById(id: string): Project | null {
    return this.projectRepo.findById(id);
  }

  openProject(id: string): Project | null {
    const project = this.projectRepo.findById(id);
    if (!project) return null;
    const now = new Date().toISOString();
    this.projectRepo.touchLastOpened(id, now);
    return this.projectRepo.findById(id);
  }

  renameProject(input: RenameProjectInput): Project | null {
    const project = this.projectRepo.findById(input.id);
    if (!project) return null;
    return this.updateProject({
      id: input.id,
      name: input.name,
      description: project.description,
    });
  }

  updateProject(input: UpdateProjectInput): Project | null {
    const name = input.name.trim();
    if (!name) throw new Error('Project name cannot be empty');

    const existing = this.projectRepo.findByName(name);
    if (existing && existing.id !== input.id) {
      throw new Error(`A project named "${name}" already exists`);
    }

    const updatedAt = new Date().toISOString();
    return this.projectRepo.update(input.id, name, input.description.trim(), updatedAt);
  }

  deleteProject(id: string): void {
    this.projectRepo.delete(id);
  }
}
