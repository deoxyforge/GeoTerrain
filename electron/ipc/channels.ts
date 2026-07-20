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
