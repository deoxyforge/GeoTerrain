import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../src/types/ipc';
import type { ElectronAPI } from '../src/types/ipc';

const api: ElectronAPI = {
  // Project
  createProject: (input) => ipcRenderer.invoke(IPC_CHANNELS.PROJECT_CREATE, input),
  getAllProjects: () => ipcRenderer.invoke(IPC_CHANNELS.PROJECT_GET_ALL),
  getProjectById: (id) => ipcRenderer.invoke(IPC_CHANNELS.PROJECT_GET_BY_ID, id),
  openProject: (id) => ipcRenderer.invoke(IPC_CHANNELS.PROJECT_OPEN, id),
  renameProject: (input) => ipcRenderer.invoke(IPC_CHANNELS.PROJECT_RENAME, input),
  updateProject: (input) => ipcRenderer.invoke(IPC_CHANNELS.PROJECT_UPDATE, input),
  deleteProject: (id) => ipcRenderer.invoke(IPC_CHANNELS.PROJECT_DELETE, id),

  // Coordinate
  addCoordinate: (input) => ipcRenderer.invoke(IPC_CHANNELS.COORDINATE_ADD, input),
  getCoordinatesByProject: (projectId) =>
    ipcRenderer.invoke(IPC_CHANNELS.COORDINATE_GET_BY_PROJECT, projectId),
  updateCoordinate: (input) => ipcRenderer.invoke(IPC_CHANNELS.COORDINATE_UPDATE, input),
  deleteCoordinate: (id) => ipcRenderer.invoke(IPC_CHANNELS.COORDINATE_DELETE, id),
  reorderCoordinates: (projectId, orderedIds) =>
    ipcRenderer.invoke(IPC_CHANNELS.COORDINATE_REORDER, projectId, orderedIds),

  // Validation
  validateCoordinate: (latitude, longitude) =>
    ipcRenderer.invoke(IPC_CHANNELS.VALIDATION_COORDINATE, latitude, longitude),
  validateCoordinateList: (projectId) =>
    ipcRenderer.invoke(IPC_CHANNELS.VALIDATION_LIST, projectId),

  // Geometry
  constructGeometry: (projectId) => ipcRenderer.invoke(IPC_CHANNELS.GEOMETRY_CONSTRUCT, projectId),

  // Measurement
  calculateMeasurements: (projectId) =>
    ipcRenderer.invoke(IPC_CHANNELS.MEASUREMENT_CALCULATE, projectId),

  // Import/Export
  importFromFile: (format, activeProjectId) =>
    ipcRenderer.invoke(IPC_CHANNELS.IMPORT_FILE, format, activeProjectId),
  exportToFile: (projectId, format) =>
    ipcRenderer.invoke(IPC_CHANNELS.EXPORT_FILE, projectId, format),

  // Calculation
  runCalculation: (projectId) => ipcRenderer.invoke(IPC_CHANNELS.CALCULATION_RUN, projectId),
  getCalculationResult: (projectId) =>
    ipcRenderer.invoke(IPC_CHANNELS.CALCULATION_GET_RESULT, projectId),
  // Report
  exportReportPDF: (payload) => ipcRenderer.invoke(IPC_CHANNELS.REPORT_EXPORT, payload),
  // Coordinates Sync
  syncCoordinates: (projectId, coordinates) =>
    ipcRenderer.invoke(IPC_CHANNELS.COORDINATE_SYNC, projectId, coordinates),
  // Settings
  getSetting: (key) => ipcRenderer.invoke(IPC_CHANNELS.SETTING_GET, key),
  setSetting: (key, value) => ipcRenderer.invoke(IPC_CHANNELS.SETTING_SET, key, value),
  getAllSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTING_GET_ALL),
};

contextBridge.exposeInMainWorld('electronAPI', api);
