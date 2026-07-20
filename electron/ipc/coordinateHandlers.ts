import { ipcMain } from 'electron';
import { IPC_CHANNELS, type IpcResponse } from '../../src/types/ipc';
import type { Coordinate } from '../../src/types/coordinate';
import type { CoordinateService } from '../services/CoordinateService';

export function registerCoordinateHandlers(coordinateService: CoordinateService): void {
  ipcMain.handle(IPC_CHANNELS.COORDINATE_ADD, (_event, input): IpcResponse<Coordinate> => {
    try {
      return { success: true, data: coordinateService.addPoint(input) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.COORDINATE_GET_BY_PROJECT,
    (_event, projectId: string): IpcResponse<Coordinate[]> => {
      try {
        return { success: true, data: coordinateService.getPoints(projectId) };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    }
  );

  ipcMain.handle(IPC_CHANNELS.COORDINATE_UPDATE, (_event, input): IpcResponse<Coordinate> => {
    try {
      const coord = coordinateService.editPoint(input);
      if (!coord) return { success: false, error: 'Coordinate not found' };
      return { success: true, data: coord };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.COORDINATE_DELETE, (_event, id: string): IpcResponse<void> => {
    try {
      coordinateService.deletePoint(id);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.COORDINATE_REORDER,
    (_event, projectId: string, orderedIds: string[]): IpcResponse<void> => {
      try {
        coordinateService.movePoint(projectId, orderedIds);
        return { success: true };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.COORDINATE_SYNC,
    async (_event, projectId: string, coordinates: Coordinate[]): Promise<IpcResponse<void>> => {
      try {
        coordinateService.syncPoints(projectId, coordinates);
        return { success: true };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    }
  );
}
