import kinks from '@turf/kinks';
import { polygon } from '@turf/helpers';
import type { Coordinate } from '../../src/types/coordinate';
import type { ValidationError, ValidationResult } from '../../src/types/validation';

export class ValidationService {
  validateCoordinate(latitude: number, longitude: number): ValidationResult {
    const errors: ValidationError[] = [];

    if (latitude === undefined || latitude === null) {
      errors.push({ code: 'REQUIRED_FIELD', message: 'Latitude is required', field: 'latitude' });
    } else if (typeof latitude !== 'number' || isNaN(latitude)) {
      errors.push({
        code: 'INVALID_NUMERIC',
        message: 'Latitude must be a valid number',
        field: 'latitude',
      });
    } else if (!isFinite(latitude)) {
      errors.push({
        code: 'INFINITE_VALUE',
        message: 'Latitude cannot be infinity',
        field: 'latitude',
      });
    } else if (latitude < -90 || latitude > 90) {
      errors.push({
        code: 'OUT_OF_RANGE',
        message: 'Latitude must be between -90 and 90',
        field: 'latitude',
      });
    }

    if (longitude === undefined || longitude === null) {
      errors.push({ code: 'REQUIRED_FIELD', message: 'Longitude is required', field: 'longitude' });
    } else if (typeof longitude !== 'number' || isNaN(longitude)) {
      errors.push({
        code: 'INVALID_NUMERIC',
        message: 'Longitude must be a valid number',
        field: 'longitude',
      });
    } else if (!isFinite(longitude)) {
      errors.push({
        code: 'INFINITE_VALUE',
        message: 'Longitude cannot be infinity',
        field: 'longitude',
      });
    } else if (longitude < -180 || longitude > 180) {
      errors.push({
        code: 'OUT_OF_RANGE',
        message: 'Longitude must be between -180 and 180',
        field: 'longitude',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateCoordinateList(coordinates: Coordinate[], projectId: string): ValidationResult {
    const errors: ValidationError[] = [];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Project check
    if (!projectId || !uuidRegex.test(projectId)) {
      errors.push({
        code: 'INVALID_PROJECT',
        message: 'Selected project has an invalid identifier',
      });
    }

    if (!coordinates || coordinates.length === 0) {
      errors.push({ code: 'EMPTY_LIST', message: 'Coordinate list cannot be empty' });
      return { valid: false, errors };
    }

    const seenOrders = new Set<number>();
    const seenCoords = new Map<string, Coordinate>();

    for (const c of coordinates) {
      // Basic checks
      if (!c.id || !uuidRegex.test(c.id)) {
        errors.push({
          code: 'INVALID_COORDINATE_ID',
          message: `Point has an invalid identifier`,
          itemId: c.id,
        });
      }
      if (c.projectId !== projectId) {
        errors.push({
          code: 'PROJECT_MISMATCH',
          message: `Point belongs to a different project`,
          itemId: c.id,
        });
      }

      // Lat/lon bounds
      const itemVal = this.validateCoordinate(c.latitude, c.longitude);
      if (!itemVal.valid) {
        itemVal.errors.forEach((err) => {
          errors.push({
            code: err.code,
            message: `Point #${c.pointOrder}: ${err.message}`,
            field: err.field,
            itemId: c.id,
          });
        });
      }

      // Order validation
      if (c.pointOrder === undefined || c.pointOrder === null) {
        errors.push({
          code: 'MISSING_POINT_ORDER',
          message: `Point is missing an order index`,
          itemId: c.id,
        });
      } else if (seenOrders.has(c.pointOrder)) {
        errors.push({
          code: 'DUPLICATE_POINT_ORDER',
          message: `Multiple points share index #${c.pointOrder}`,
          itemId: c.id,
        });
      } else {
        seenOrders.add(c.pointOrder);
      }

      // Duplicate coordinate check (using 6 decimals threshold)
      const coordKey = `${c.latitude.toFixed(6)},${c.longitude.toFixed(6)}`;
      if (seenCoords.has(coordKey)) {
        const dup = seenCoords.get(coordKey)!;
        errors.push({
          code: 'DUPLICATE_COORDINATE',
          message: `Point #${c.pointOrder} is duplicate of Point #${dup.pointOrder}`,
          itemId: c.id,
        });
      } else {
        seenCoords.set(coordKey, c);
      }
    }

    // Gap check in ordering
    const sortedOrders = Array.from(seenOrders).sort((a, b) => a - b);
    for (let i = 0; i < sortedOrders.length; i++) {
      if (sortedOrders[i] !== i + 1) {
        errors.push({
          code: 'BROKEN_ORDER_SEQUENCE',
          message: 'Point ordering sequence contains gaps or index errors',
        });
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validatePolygonInput(coordinates: Coordinate[], projectId: string): ValidationResult {
    const listVal = this.validateCoordinateList(coordinates, projectId);
    const errors = [...listVal.errors];
    const warnings: ValidationError[] = [];

    // Polygons require at least 3 points
    if (coordinates.length < 3) {
      errors.push({
        code: 'INSUFFICIENT_POINTS',
        message: `A polygon requires at least 3 vertices to construct. Got: ${coordinates.length}`,
      });
      return { valid: false, errors, warnings };
    }

    if (errors.length > 0) {
      return { valid: false, errors, warnings };
    }

    // Geometry validation (self-intersection & collinearity)
    const ring = coordinates.map((c) => [c.longitude, c.latitude]);
    // Close the ring for turf
    ring.push([coordinates[0].longitude, coordinates[0].latitude]);

    // 1. Self intersection check
    try {
      const poly = polygon([ring]);
      const selfIntersections = kinks(poly);
      if (selfIntersections.features.length > 0) {
        errors.push({
          code: 'SELF_INTERSECTION',
          message: 'Boundary lines self-intersect. A polygon boundary must not cross itself.',
        });
      }
    } catch {
      errors.push({
        code: 'INVALID_GEOMETRY',
        message: 'Could not construct closed polygon boundary.',
      });
    }

    // Build wrap-around ring for collinear checks to test all corner triplets
    const collinearRing = [...ring];
    if (coordinates.length >= 2) {
      collinearRing.push([coordinates[1].longitude, coordinates[1].latitude]);
    }

    // 2. Collinear warning check
    for (let i = 0; i < collinearRing.length - 2; i++) {
      const p1 = collinearRing[i];
      const p2 = collinearRing[i + 1];
      const p3 = collinearRing[i + 2];

      // Area of triangle: 0.5 * |x1(y2 - y3) + x2(y3 - y1) + x3(y1 - y2)|
      const area =
        0.5 * Math.abs(p1[0] * (p2[1] - p3[1]) + p2[0] * (p3[1] - p1[1]) + p3[0] * (p1[1] - p2[1]));

      // Warn if area is extremely small
      if (area < 1e-8) {
        const midIdx = (i + 1) % coordinates.length;
        const midCoord = coordinates[midIdx];
        warnings.push({
          code: 'COLLINEAR_POINTS',
          message: `Point #${midCoord.pointOrder} is collinear with its adjacent points.`,
          itemId: midCoord.id,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
