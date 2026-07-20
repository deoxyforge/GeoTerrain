import { ipcMain } from 'electron';
import { IPC_CHANNELS, type IpcResponse } from '../../src/types/ipc';
import type { SettingService } from '../services/SettingService';

export function registerSettingHandlers(settingService: SettingService): void {
  ipcMain.handle(
    IPC_CHANNELS.SETTING_GET,
    async (_event, key: string): Promise<IpcResponse<string | null>> => {
      try {
        const val = settingService.getSetting(key);
        return { success: true, data: val };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.SETTING_SET,
    async (_event, key: string, value: string): Promise<IpcResponse<void>> => {
      try {
        settingService.setSetting(key, value);
        return { success: true };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.SETTING_GET_ALL,
    async (_event): Promise<IpcResponse<Record<string, string>>> => {
      try {
        const all = settingService.getAllSettings();
        return { success: true, data: all };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    }
  );
}
