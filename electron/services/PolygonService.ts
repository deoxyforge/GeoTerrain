import type { Coordinate } from '../../src/types/coordinate';

// ponytail: polygon logic stubs — implementation in Phase 2 using @turf/turf
// Ceiling: replace stub bodies with turf.polygon() + turf.area() calls

export interface TurfPolygon {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: Record<string, unknown>;
}

export class PolygonService {
  // Converts ordered coordinates to a closed GeoJSON polygon feature
  createPolygon(_coordinates: Coordinate[]): TurfPolygon | null {
    // ponytail: stub — Phase 2 implements turf.polygon()
    return null;
  }

  // Ensures the last point equals the first (closes the ring)
  closePolygon(_coordinates: Coordinate[]): Coordinate[] {
    // ponytail: stub — Phase 2 appends first coord if needed
    return [];
  }

  // Returns a simplified preview-ready coordinate array
  generatePreview(_coordinates: Coordinate[]): Array<{ lat: number; lon: number }> {
    // ponytail: stub — Phase 2 returns simplified ring for SVG preview
    return [];
  }
}
