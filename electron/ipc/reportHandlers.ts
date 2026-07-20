import { ipcMain } from 'electron';
import { IPC_CHANNELS, type IpcResponse } from '../../src/types/ipc';
import type { ReportService } from '../services/ReportService';
import type { ReportPayload } from '../utils/ReportEngine';

export function registerReportHandlers(reportService: ReportService): void {
  ipcMain.handle(
    IPC_CHANNELS.REPORT_EXPORT,
    async (_event, payload: ReportPayload): Promise<IpcResponse<void>> => {
      try {
        const res = await reportService.exportReportPDF(payload);
        return res;
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    }
  );
}
