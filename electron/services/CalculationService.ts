import type { Coordinate } from '../../src/types/coordinate';
import type { PolygonResult } from '../../src/types/result';

// ponytail: calculation stubs — Phase 2 wires up turf.area(), turf.length(), turf.centroid()
// Ceiling: each method gets real turf implementation; interface stays the same

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export class CalculationService {
  calculateArea(_coordinates: Coordinate[]): number {
    // ponytail: stub — returns 0 until Phase 2 turf.area() integration
    return 0;
  }

  calculatePerimeter(_coordinates: Coordinate[]): number {
    // ponytail: stub — returns 0 until Phase 2 turf.length() integration
    return 0;
  }

  calculateCentroid(_coordinates: Coordinate[]): { lat: number; lon: number } | null {
    // ponytail: stub — Phase 2 uses turf.centroid()
    return null;
  }

  calculateBoundingBox(_coordinates: Coordinate[]): BoundingBox | null {
    // ponytail: stub — Phase 2 uses turf.bbox()
    return null;
  }

  // Runs the full calculation pipeline as defined in TRD Section 5.5
  runFullCalculation(projectId: string, coordinates: Coordinate[]): PolygonResult {
    const now = new Date().toISOString();
    return {
      projectId,
      areaSqMeters: this.calculateArea(coordinates),
      areaHectares: 0,
      areaSqKilometers: 0,
      areaAcres: 0,
      perimeter: this.calculatePerimeter(coordinates),
      vertexCount: coordinates.length,
      centroidLat: null,
      centroidLon: null,
      calculatedAt: now,
    };
  }
}
