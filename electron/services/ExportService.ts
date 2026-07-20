import { dialog } from 'electron';
import * as fs from 'fs';
import type { ProjectRepository } from '../repositories/ProjectRepository';
import type { CoordinateRepository } from '../repositories/CoordinateRepository';
import type { ResultRepository } from '../repositories/ResultRepository';
import { ExportEngine } from '../utils/ExportEngine';

export class ExportService {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly coordinateRepo: CoordinateRepository,
    private readonly resultRepo: ResultRepository
  ) {}

  async exportToFile(
    projectId: string,
    format: 'json' | 'csv' | 'geojson'
  ): Promise<{ success: boolean; error?: string }> {
    const project = this.projectRepo.findById(projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    const coordinates = this.coordinateRepo.findByProject(projectId);
    const result = this.resultRepo.findByProject(projectId);

    let content = '';
    let defaultExtension = '';
    let filterName = '';

    try {
      if (format === 'json') {
        content = ExportEngine.toNativeJSON(project, coordinates, result);
        defaultExtension = 'json';
        filterName = 'GeoTerrain Project JSON';
      } else if (format === 'geojson') {
        content = ExportEngine.toGeoJSON(project, coordinates, result);
        defaultExtension = 'geojson';
        filterName = 'GeoJSON Polygon';
      } else if (format === 'csv') {
        content = ExportEngine.toCSV(coordinates);
        defaultExtension = 'csv';
        filterName = 'CSV Coordinates List';
      } else {
        return { success: false, error: 'Unsupported export format' };
      }
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }

    const { filePath, canceled } = await dialog.showSaveDialog({
      title: `Export Project Data (${format.toUpperCase()})`,
      defaultPath: `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.${defaultExtension}`,
      filters: [{ name: filterName, extensions: [defaultExtension] }],
    });

    if (canceled || !filePath) {
      return { success: false, error: 'Export cancelled' };
    }

    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    } catch (e) {
      return { success: false, error: `Failed to write file to disk: ${(e as Error).message}` };
    }
  }
}
