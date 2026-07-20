import { dialog } from 'electron';
import * as fs from 'fs';
import { ReportEngine, type ReportPayload } from '../utils/ReportEngine';

export class ReportService {
  async exportReportPDF(payload: ReportPayload): Promise<{ success: boolean; error?: string }> {
    try {
      const { project } = payload;
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: 'Export Project PDF Report',
        defaultPath: `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`,
        filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
      });

      if (canceled || !filePath) {
        return { success: false, error: 'Report export cancelled' };
      }

      const pdfBuffer = ReportEngine.generatePDF(payload);
      fs.writeFileSync(filePath, pdfBuffer);

      return { success: true };
    } catch (err) {
      return { success: false, error: `Failed to generate PDF: ${(err as Error).message}` };
    }
  }
}
