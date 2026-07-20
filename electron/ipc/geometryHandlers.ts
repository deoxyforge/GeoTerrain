import { ipcMain } from 'electron';
import { IPC_CHANNELS } from './channels';
import type { IpcResponse } from '../../src/types/ipc';
import type { PolygonGeometry } from '../../src/types/geometry';
import type { GeometryService } from '../services/GeometryService';
import type { CoordinateService } from '../services/CoordinateService';

export function registerGeometryHandlers(
  geometryService: GeometryService,
  coordinateService: CoordinateService
): void {
  ipcMain.handle(
    IPC_CHANNELS.GEOMETRY_CONSTRUCT,
    (_event, projectId: string): IpcResponse<PolygonGeometry> => {
      try {
        const coordinates = coordinateService.getPoints(projectId);
        const result = geometryService.constructPolygon(coordinates, projectId);
        return { success: true, data: result };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    }
  );
}
