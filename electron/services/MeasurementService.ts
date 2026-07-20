import type { PolygonGeometry } from '../../src/types/geometry';
import type { MeasurementResult } from '../../src/types/measurement';
import type { ResultRepository } from '../repositories/ResultRepository';
import { ProjectionEngine } from '../utils/ProjectionEngine';
import { MeasurementEngine } from '../utils/MeasurementEngine';
import type { ProjectionService } from './ProjectionService';

export class MeasurementService {
  constructor(
    private readonly projectionService: ProjectionService,
    private readonly resultRepo: ResultRepository
  ) {}

  calculateMeasurements(geometry: PolygonGeometry): MeasurementResult {
    if (!geometry.isClosed || geometry.vertices.length < 3) {
      throw new Error('Cannot compute measurements: polygon geometry is open or invalid');
    }

    // 1. Project coordinates to UTM space
    const { projected, projString } = this.projectionService.projectCoordinates(geometry.vertices);

    // Close the projected loop for Shoelace/Euclidean calculations
    const closedProjected = [...projected];
    if (projected.length > 0) {
      closedProjected.push(projected[0]);
    }

    // 2. Measure projected loop
    const areaSqMeters = MeasurementEngine.calculateArea(closedProjected);
    const perimeterMeters = MeasurementEngine.calculatePerimeter(closedProjected);
    const [centroidX, centroidY] = MeasurementEngine.calculateCentroid(closedProjected);

    // Unproject centroid back to WGS84
    const [centroidLon, centroidLat] = ProjectionEngine.unprojectCoordinate(
      centroidX,
      centroidY,
      projString
    );

    const boundingBox = MeasurementEngine.calculateBoundingBox(geometry.vertices);
    const calculatedAt = new Date().toISOString();

    const result: MeasurementResult = {
      projectId: geometry.projectId,
      areaSqMeters,
      areaSqKilometers: areaSqMeters / 1_000_000,
      areaHectares: areaSqMeters / 10_000,
      areaAcres: areaSqMeters / 4046.8564224,
      perimeterMeters,
      perimeterKilometers: perimeterMeters / 1000,
      centroid: { latitude: centroidLat, longitude: centroidLon },
      boundingBox,
      calculatedAt,
    };

    // 3. Persist results in SQLite
    this.resultRepo.upsert({
      projectId: result.projectId,
      areaSqMeters: result.areaSqMeters,
      areaHectares: result.areaHectares,
      areaSqKilometers: result.areaSqKilometers,
      areaAcres: result.areaAcres,
      perimeter: result.perimeterMeters,
      vertexCount: geometry.vertices.length,
      centroidLat,
      centroidLon,
      calculatedAt,
    });

    return result;
  }
}
