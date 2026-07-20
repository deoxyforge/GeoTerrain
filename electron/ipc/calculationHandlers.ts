import { ipcMain } from 'electron';
import { IPC_CHANNELS, type IpcResponse } from '../../src/types/ipc';
import type { PolygonResult } from '../../src/types/result';
import type { CalculationService } from '../services/CalculationService';
import type { CoordinateService } from '../services/CoordinateService';
import type { ResultRepository } from '../repositories/ResultRepository';

export function registerCalculationHandlers(
  calculationService: CalculationService,
  coordinateService: CoordinateService,
  resultRepo: ResultRepository
): void {
  ipcMain.handle(
    IPC_CHANNELS.CALCULATION_RUN,
    (_event, projectId: string): IpcResponse<PolygonResult> => {
      try {
        const coordinates = coordinateService.getPoints(projectId);
        const result = calculationService.runFullCalculation(projectId, coordinates);
        resultRepo.upsert(result);
        return { success: true, data: result };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.CALCULATION_GET_RESULT,
    (_event, projectId: string): IpcResponse<PolygonResult> => {
      try {
        const result = resultRepo.findByProject(projectId);
        if (!result) return { success: false, error: 'No result found for this project' };
        return { success: true, data: result };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    }
  );
}
