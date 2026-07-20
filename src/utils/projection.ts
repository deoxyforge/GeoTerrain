// Coordinate projection utilities (WGS84 → projected cartesian meters)
export interface ProjectedCoord {
  x: number;
  y: number;
}

/**
 * Projects WGS84 lat/lon to aspect-ratio corrected cartesian coordinates in meters.
 * Employs local equirectangular scaling centered at centerLat.
 */
export function toProjected(lat: number, lon: number, centerLat: number): ProjectedCoord {
  const rad = centerLat * (Math.PI / 180);
  const cosLat = Math.cos(rad);
  const mPerDeg = 111319.9; // Approximate meters per degree latitude/longitude at equator
  return {
    x: lon * mPerDeg * cosLat,
    y: lat * mPerDeg,
  };
}

/**
 * Detects the appropriate UTM zone for a given longitude.
 */
export function getUtmZone(lon: number): number {
  return Math.floor((lon + 180) / 6) + 1;
}
