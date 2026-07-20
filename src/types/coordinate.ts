// Coordinate data model — TRD Section 7 & Coordinates management
export interface Coordinate {
  id: string; // UUID
  projectId: string; // UUID FK → projects.id
  pointOrder: number; // 1-based ordering
  latitude: number; // -90 to 90
  longitude: number; // -180 to 180
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface AddCoordinateInput {
  projectId: string;
  latitude: number;
  longitude: number;
}

export interface UpdateCoordinateInput {
  id: string;
  latitude: number;
  longitude: number;
}
