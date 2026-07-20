import type { BoundingBox } from '../../src/types/measurement';

export class MeasurementEngine {
  // Computes area of a flat polygon using the Shoelace formula (coordinates in meters)
  static calculateArea(coords: [number, number][]): number {
    let area = 0;
    const n = coords.length;
    if (n < 4) return 0; // Unclosed shape or insufficient vertices

    for (let i = 0; i < n - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];
      area += p1[0] * p2[1] - p2[0] * p1[1];
    }
    return Math.abs(area / 2);
  }

  // Computes perimeter by summing distance between consecutive coordinates
  static calculatePerimeter(coords: [number, number][]): number {
    let perimeter = 0;
    const n = coords.length;
    if (n < 2) return 0;

    for (let i = 0; i < n - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    return perimeter;
  }

  // Computes the geometric centroid of a projected polygon
  static calculateCentroid(coords: [number, number][]): [number, number] {
    const n = coords.length;
    if (n < 4) {
      // Fallback: simple average if not a closed polygon
      let sx = 0,
        sy = 0;
      const count = Math.max(1, n);
      coords.forEach(([x, y]) => {
        sx += x;
        sy += y;
      });
      return [sx / count, sy / count];
    }

    let signedArea = 0;
    let cx = 0;
    let cy = 0;

    for (let i = 0; i < n - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const factor = p1[0] * p2[1] - p2[0] * p1[1];
      signedArea += factor;
      cx += (p1[0] + p2[0]) * factor;
      cy += (p1[1] + p2[1]) * factor;
    }

    signedArea = signedArea / 2;
    if (Math.abs(signedArea) < 1e-9) {
      // Fallback for collinear/degenerate cases
      let sx = 0,
        sy = 0;
      coords.forEach(([x, y]) => {
        sx += x;
        sy += y;
      });
      return [sx / n, sy / n];
    }

    cx = cx / (6 * signedArea);
    cy = cy / (6 * signedArea);

    return [cx, cy];
  }

  // Computes bounding box directly in WGS84 degrees
  static calculateBoundingBox(coords: Array<{ latitude: number; longitude: number }>): BoundingBox {
    if (coords.length === 0) {
      return { minLat: 0, minLon: 0, maxLat: 0, maxLon: 0 };
    }

    let minLat = Infinity;
    let minLon = Infinity;
    let maxLat = -Infinity;
    let maxLon = -Infinity;

    coords.forEach((c) => {
      if (c.latitude < minLat) minLat = c.latitude;
      if (c.longitude < minLon) minLon = c.longitude;
      if (c.latitude > maxLat) maxLat = c.latitude;
      if (c.longitude > maxLon) maxLon = c.longitude;
    });

    return {
      minLat,
      minLon,
      maxLat,
      maxLon,
    };
  }
}
