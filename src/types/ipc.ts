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

import { IPC_CHANNELS } from '../../electron/ipc/channels';

export { IPC_CHANNELS };

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
