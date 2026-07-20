import { ipcMain } from 'electron';
import { IPC_CHANNELS, type IpcResponse } from '../../src/types/ipc';
import type { ValidationResult } from '../../src/types/validation';
import type { ValidationService } from '../services/ValidationService';
import type { CoordinateService } from '../services/CoordinateService';

export function registerValidationHandlers(
  validationService: ValidationService,
  coordinateService: CoordinateService
): void {
  ipcMain.handle(
    IPC_CHANNELS.VALIDATION_COORDINATE,
    (_event, latitude: number, longitude: number): IpcResponse<ValidationResult> => {
      try {
        const result = validationService.validateCoordinate(latitude, longitude);
        return { success: true, data: result };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.VALIDATION_LIST,
    (_event, projectId: string): IpcResponse<ValidationResult> => {
      try {
        const coordinates = coordinateService.getPoints(projectId);
        const result = validationService.validatePolygonInput(coordinates, projectId);
        return { success: true, data: result };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    }
  );
}
