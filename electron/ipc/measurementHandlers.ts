import { ipcMain } from 'electron';
import { IPC_CHANNELS } from './channels';
import type { IpcResponse } from '../../src/types/ipc';
import type { MeasurementResult } from '../../src/types/measurement';
import type { GeometryService } from '../services/GeometryService';
import type { CoordinateService } from '../services/CoordinateService';
import type { MeasurementService } from '../services/MeasurementService';

export function registerMeasurementHandlers(
  measurementService: MeasurementService,
  geometryService: GeometryService,
  coordinateService: CoordinateService
): void {
  ipcMain.handle(
    IPC_CHANNELS.MEASUREMENT_CALCULATE,
    (_event, projectId: string): IpcResponse<MeasurementResult> => {
      try {
        const coordinates = coordinateService.getPoints(projectId);
        const geometry = geometryService.constructPolygon(coordinates, projectId);
        const result = measurementService.calculateMeasurements(geometry);
        return { success: true, data: result };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    }
  );
}
