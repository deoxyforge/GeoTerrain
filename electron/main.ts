import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { getDatabase, closeDatabase } from './database/connection';
import { ProjectRepository } from './repositories/ProjectRepository';
import { CoordinateRepository } from './repositories/CoordinateRepository';
import { ResultRepository } from './repositories/ResultRepository';
import { ProjectService } from './services/ProjectService';
import { CoordinateService } from './services/CoordinateService';
import { CalculationService } from './services/CalculationService';
import { StorageService } from './services/StorageService';
import { ValidationService } from './services/ValidationService';
import { GeometryService } from './services/GeometryService';
import { ProjectionService } from './services/ProjectionService';
import { MeasurementService } from './services/MeasurementService';
import { ImportService } from './services/ImportService';
import { ExportService } from './services/ExportService';
import { ReportService } from './services/ReportService';
import { SettingService } from './services/SettingService';
import { SettingRepository } from './repositories/SettingRepository';
import { registerProjectHandlers } from './ipc/projectHandlers';
import { registerCoordinateHandlers } from './ipc/coordinateHandlers';
import { registerCalculationHandlers } from './ipc/calculationHandlers';
import { registerValidationHandlers } from './ipc/validationHandlers';
import { registerGeometryHandlers } from './ipc/geometryHandlers';
import { registerMeasurementHandlers } from './ipc/measurementHandlers';
import { registerImportExportHandlers } from './ipc/importExportHandlers';
import { registerReportHandlers } from './ipc/reportHandlers';
import { registerSettingHandlers } from './ipc/settingHandlers';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function bootstrapServices(): void {
  const db = getDatabase();

  // Repositories
  const projectRepo = new ProjectRepository(db);
  const coordinateRepo = new CoordinateRepository(db);
  const resultRepo = new ResultRepository(db);
  const settingRepo = new SettingRepository(db);

  // Services
  const validationService = new ValidationService();
  const projectService = new ProjectService(projectRepo);
  const coordinateService = new CoordinateService(coordinateRepo, validationService);
  const calculationService = new CalculationService();
  const geometryService = new GeometryService(validationService);
  const projectionService = new ProjectionService();
  const measurementService = new MeasurementService(projectionService, resultRepo);
  const importService = new ImportService(projectRepo, coordinateRepo, validationService);
  const exportService = new ExportService(projectRepo, coordinateRepo, resultRepo);
  const reportService = new ReportService();
  const settingService = new SettingService(settingRepo);
  new StorageService(db); // initialised for health-check availability

  // Register IPC handlers
  registerProjectHandlers(projectService);
  registerCoordinateHandlers(coordinateService);
  registerCalculationHandlers(calculationService, coordinateService, resultRepo);
  registerValidationHandlers(validationService, coordinateService);
  registerGeometryHandlers(geometryService, coordinateService);
  registerMeasurementHandlers(measurementService, geometryService, coordinateService);
  registerImportExportHandlers(importService, exportService);
  registerReportHandlers(reportService);
  registerSettingHandlers(settingService);
}

function createWindow(): void {
  const preloadPath = path.join(__dirname, 'preload.js');

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0f1117',
    show: false,
    titleBarStyle: 'default',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // required for preload to access node built-ins
    },
  });

  // Open external links in OS browser, not Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url).catch(console.error);
    return { action: 'deny' };
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  win.once('ready-to-show', () => win.show());
}

app.whenReady().then(() => {
  bootstrapServices();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  closeDatabase();
  if (process.platform !== 'darwin') app.quit();
});
