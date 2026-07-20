import type {
  Project,
  CreateProjectInput,
  RenameProjectInput,
  UpdateProjectInput,
} from './project';
import type { Coordinate, AddCoordinateInput, UpdateCoordinateInput } from './coordinate';
import type { PolygonResult } from './result';
import type { ValidationResult } from './validation';
import type { PolygonGeometry } from './geometry';
import type { MeasurementResult } from './measurement';

// IPC channel names — single source of truth
export const IPC_CHANNELS = {
  // Project CRUD
  PROJECT_CREATE: 'project:create',
  PROJECT_GET_ALL: 'project:getAll',
  PROJECT_GET_BY_ID: 'project:getById',
  PROJECT_RENAME: 'project:rename',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',
  PROJECT_OPEN: 'project:open',
  // Coordinate
  COORDINATE_ADD: 'coordinate:add',
  COORDINATE_GET_BY_PROJECT: 'coordinate:getByProject',
  COORDINATE_UPDATE: 'coordinate:update',
  COORDINATE_DELETE: 'coordinate:delete',
  COORDINATE_REORDER: 'coordinate:reorder',
  COORDINATE_SYNC: 'coordinate:sync',
  // Validation
  VALIDATION_COORDINATE: 'validation:coordinate',
  VALIDATION_LIST: 'validation:list',
  // Geometry
  GEOMETRY_CONSTRUCT: 'geometry:construct',
  // Measurement
  MEASUREMENT_CALCULATE: 'measurement:calculate',
  // Import/Export
  IMPORT_FILE: 'import:file',
  // Export
  EXPORT_FILE: 'export:file',
  // Calculation
  CALCULATION_RUN: 'calculation:run',
  CALCULATION_GET_RESULT: 'calculation:getResult',
  // Report
  REPORT_EXPORT: 'report:export',
  // Settings
  SETTING_GET: 'setting:get',
  SETTING_SET: 'setting:set',
  SETTING_GET_ALL: 'setting:getAll',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

export interface IpcResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ElectronAPI {
  // Project
  createProject: (input: CreateProjectInput) => Promise<IpcResponse<Project>>;
  getAllProjects: () => Promise<IpcResponse<Project[]>>;
  getProjectById: (id: string) => Promise<IpcResponse<Project>>;
  renameProject: (input: RenameProjectInput) => Promise<IpcResponse<Project>>;
  updateProject: (input: UpdateProjectInput) => Promise<IpcResponse<Project>>;
  deleteProject: (id: string) => Promise<IpcResponse<void>>;
  openProject: (id: string) => Promise<IpcResponse<Project>>;
  // Coordinate
  addCoordinate: (input: AddCoordinateInput) => Promise<IpcResponse<Coordinate>>;
  getCoordinatesByProject: (projectId: string) => Promise<IpcResponse<Coordinate[]>>;
  updateCoordinate: (input: UpdateCoordinateInput) => Promise<IpcResponse<Coordinate>>;
  deleteCoordinate: (id: string) => Promise<IpcResponse<void>>;
  reorderCoordinates: (projectId: string, orderedIds: string[]) => Promise<IpcResponse<void>>;
  // Validation
  validateCoordinate: (
    latitude: number,
    longitude: number
  ) => Promise<IpcResponse<ValidationResult>>;
  validateCoordinateList: (projectId: string) => Promise<IpcResponse<ValidationResult>>;
  // Geometry
  constructGeometry: (projectId: string) => Promise<IpcResponse<PolygonGeometry>>;
  // Measurement
  calculateMeasurements: (projectId: string) => Promise<IpcResponse<MeasurementResult>>;
  // Import/Export
  importFromFile: (
    format: 'json' | 'csv' | 'geojson',
    activeProjectId?: string
  ) => Promise<IpcResponse<Project | Coordinate[]>>;
  exportToFile: (
    projectId: string,
    format: 'json' | 'csv' | 'geojson'
  ) => Promise<IpcResponse<void>>;
  // Calculation
  runCalculation: (projectId: string) => Promise<IpcResponse<PolygonResult>>;
  getCalculationResult: (projectId: string) => Promise<IpcResponse<PolygonResult>>;
  // Report
  exportReportPDF: (payload: ExportReportPayload) => Promise<IpcResponse<void>>;
  // Coordinates Sync
  syncCoordinates: (projectId: string, coordinates: Coordinate[]) => Promise<IpcResponse<void>>;
  // Settings
  getSetting: (key: string) => Promise<IpcResponse<string | null>>;
  setSetting: (key: string, value: string) => Promise<IpcResponse<void>>;
  getAllSettings: () => Promise<IpcResponse<Record<string, string>>>;
}

export interface ExportReportPayload {
  project: Project;
  coordinates: Coordinate[];
  measurements: MeasurementResult | null;
  mapImageBase64?: string;
  version: string;
}
