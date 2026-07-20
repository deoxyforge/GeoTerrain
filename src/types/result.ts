// Polygon Result data model — TRD Section 7
export interface PolygonResult {
  projectId: string; // UUID FK → projects.id
  areaSqMeters: number;
  areaHectares: number;
  areaSqKilometers: number;
  areaAcres: number;
  perimeter: number;
  vertexCount: number;
  centroidLat: number | null;
  centroidLon: number | null;
  calculatedAt: string; // ISO timestamp
}

// Lightweight version for display
export interface ResultSummary {
  areaSqMeters: number;
  areaHectares: number;
  areaSqKilometers: number;
  areaAcres: number;
  perimeter: number;
  vertexCount: number;
}
