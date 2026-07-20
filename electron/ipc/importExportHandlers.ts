import { ipcMain } from 'electron';
import { IPC_CHANNELS } from './channels';
import type { IpcResponse } from '../../src/types/ipc';
import type { Project } from '../../src/types/project';
import type { Coordinate } from '../../src/types/coordinate';
import type { ImportService } from '../services/ImportService';
import type { ExportService } from '../services/ExportService';

export function registerImportExportHandlers(
  importService: ImportService,
  exportService: ExportService
): void {
  ipcMain.handle(
    IPC_CHANNELS.IMPORT_FILE,
    async (
      _event,
      format: 'json' | 'csv' | 'geojson',
      activeProjectId?: string
    ): Promise<IpcResponse<Project | Coordinate[]>> => {
      try {
        const res = await importService.importFromFile(format, activeProjectId);
        return res;
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.EXPORT_FILE,
    async (
      _event,
      projectId: string,
      format: 'json' | 'csv' | 'geojson'
    ): Promise<IpcResponse<void>> => {
      try {
        const res = await exportService.exportToFile(projectId, format);
        return res;
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    }
  );
}
