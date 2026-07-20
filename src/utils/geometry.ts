// Geometry utilities — turf.js wrappers
// ponytail: stubs — Phase 2 replaces bodies with turf calls
// Ceiling: import turf functions individually (@turf/area, @turf/length, etc.)

export interface LatLon {
  lat: number;
  lon: number;
}

/**
 * Constructs a GeoJSON polygon ring from ordered lat/lon pairs.
 * Phase 2: used as input to turf.polygon().
 */
export function toGeoJsonRing(points: LatLon[]): number[][] {
  if (points.length < 3) return [];
  const ring = points.map((p) => [p.lon, p.lat]);
  // Close the ring
  ring.push(ring[0]);
  return ring;
}

/**
 * Calculates the approximate bounding box for a set of points.
 * Pure math — no turf needed.
 */
export function computeBbox(points: LatLon[]): [number, number, number, number] | null {
  if (points.length === 0) return null;
  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
}
