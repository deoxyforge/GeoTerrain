import { dialog } from 'electron';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type { Project } from '../../src/types/project';
import type { Coordinate } from '../../src/types/coordinate';
import type { ProjectRepository } from '../repositories/ProjectRepository';
import type { CoordinateRepository } from '../repositories/CoordinateRepository';
import type { ValidationService } from './ValidationService';
import { ImportEngine } from '../utils/ImportEngine';

export class ImportService {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly coordinateRepo: CoordinateRepository,
    private readonly validationService: ValidationService
  ) {}

  async importFromFile(
    format: 'json' | 'csv' | 'geojson',
    activeProjectId?: string
  ): Promise<{ success: boolean; data?: Project | Coordinate[]; error?: string }> {
    let extension = '';
    let filterName = '';

    if (format === 'json') {
      extension = 'json';
      filterName = 'GeoTerrain Project JSON';
    } else if (format === 'geojson') {
      extension = 'geojson';
      filterName = 'GeoJSON Polygon';
    } else if (format === 'csv') {
      extension = 'csv';
      filterName = 'CSV Coordinates List';
    } else {
      return { success: false, error: 'Unsupported import format' };
    }

    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: `Import Coordinates Boundary (${format.toUpperCase()})`,
      filters: [{ name: filterName, extensions: [extension] }],
      properties: ['openFile'],
    });

    if (canceled || filePaths.length === 0) {
      return { success: false, error: 'Import cancelled' };
    }

    const filePath = filePaths[0];
    let content = '';
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
      return { success: false, error: `Failed to read file from disk: ${(e as Error).message}` };
    }

    try {
      if (format === 'json') {
        const parsed = ImportEngine.parseNativeJSON(content);

        // Deduplicate project name
        const name = parsed.project.name;
        let suffixCount = 0;
        let finalName = name;
        while (this.projectRepo.findByName(finalName)) {
          suffixCount++;
          finalName = `${name} (${suffixCount})`;
        }

        // Create new project
        const projectId = uuidv4();
        const now = new Date().toISOString();
        const project: Project = {
          id: projectId,
          name: finalName,
          description: parsed.project.description,
          createdAt: now,
          updatedAt: now,
          lastOpened: null,
        };

        // Validate and map coordinates
        const dbCoords: Coordinate[] = parsed.coordinates.map((c) => {
          const val = this.validationService.validateCoordinate(c.latitude, c.longitude);
          if (!val.valid) {
            throw new Error(`Coordinate validation failed: ${val.errors[0].message}`);
          }
          return {
            id: uuidv4(),
            projectId,
            latitude: c.latitude,
            longitude: c.longitude,
            pointOrder: c.pointOrder ?? 0,
            createdAt: now,
            updatedAt: now,
          };
        });

        // Save project and coordinates inside a database transaction sequence
        this.projectRepo.insert(project);
        dbCoords.forEach((dbc) => this.coordinateRepo.insert(dbc));

        return { success: true, data: project };
      } else {
        // CSV or GeoJSON: Imports coordinates into the current active project
        if (!activeProjectId) {
          return { success: false, error: 'No active project selected to import coordinates into' };
        }

        const activeProject = this.projectRepo.findById(activeProjectId);
        if (!activeProject) {
          return { success: false, error: 'Active project not found' };
        }

        const parsedCoords =
          format === 'csv' ? ImportEngine.parseCSV(content) : ImportEngine.parseGeoJSON(content);

        const now = new Date().toISOString();

        // Validate coordinates
        const dbCoords: Coordinate[] = parsedCoords.map((c, i) => {
          const val = this.validationService.validateCoordinate(c.latitude, c.longitude);
          if (!val.valid) {
            throw new Error(`Coordinate validation failed: ${val.errors[0].message}`);
          }
          return {
            id: uuidv4(),
            projectId: activeProjectId,
            latitude: c.latitude,
            longitude: c.longitude,
            pointOrder: i + 1,
            createdAt: now,
            updatedAt: now,
          };
        });

        // Replace coordinates in active project
        const existing = this.coordinateRepo.findByProject(activeProjectId);
        existing.forEach((ec) => this.coordinateRepo.delete(ec.id));
        dbCoords.forEach((dbc) => this.coordinateRepo.insert(dbc));

        // Touch the updated timestamp of the project
        this.projectRepo.update(
          activeProjectId,
          activeProject.name,
          activeProject.description,
          now
        );

        return { success: true, data: dbCoords };
      }
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  }
}
