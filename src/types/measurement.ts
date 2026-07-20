export interface Centroid {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}

export interface MeasurementResult {
  projectId: string;
  areaSqMeters: number;
  areaSqKilometers: number;
  areaHectares: number;
  areaAcres: number;
  perimeterMeters: number;
  perimeterKilometers: number;
  centroid: Centroid;
  boundingBox: BoundingBox;
  calculatedAt: string;
}
