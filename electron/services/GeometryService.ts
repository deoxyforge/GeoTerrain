import type { Coordinate } from '../../src/types/coordinate';
import type { PolygonGeometry } from '../../src/types/geometry';
import { GeometryEngine } from '../utils/GeometryEngine';
import type { ValidationService } from './ValidationService';

export class GeometryService {
  constructor(private readonly validationService: ValidationService) {}

  constructPolygon(coordinates: Coordinate[], projectId: string): PolygonGeometry {
    // 1. Run validation first
    const valResult = this.validationService.validatePolygonInput(coordinates, projectId);
    if (!valResult.valid) {
      throw new Error(
        `Cannot construct polygon geometry: validation failed. ${valResult.errors
          .map((e) => e.message)
          .join(', ')}`
      );
    }

    // 2. Build polygon geometry using GeometryEngine
    return GeometryEngine.build(coordinates, projectId);
  }
}
