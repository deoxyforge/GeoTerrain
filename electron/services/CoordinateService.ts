import { v4 as uuidv4 } from 'uuid';
import type {
  Coordinate,
  AddCoordinateInput,
  UpdateCoordinateInput,
} from '../../src/types/coordinate';
import type { CoordinateRepository } from '../repositories/CoordinateRepository';
import type { ValidationService } from './ValidationService';

export class CoordinateService {
  constructor(
    private readonly coordinateRepo: CoordinateRepository,
    private readonly validationService: ValidationService
  ) {}

  addPoint(input: AddCoordinateInput): Coordinate {
    const lat = input.latitude;
    const lon = input.longitude;

    const val = this.validationService.validateCoordinate(lat, lon);
    if (!val.valid) {
      throw new Error(val.errors.map((e) => e.message).join(', '));
    }

    const remaining = this.coordinateRepo.findByProject(input.projectId);
    const now = new Date().toISOString();

    const coordinate: Coordinate = {
      id: uuidv4(),
      projectId: input.projectId,
      latitude: lat,
      longitude: lon,
      pointOrder: remaining.length + 1,
      createdAt: now,
      updatedAt: now,
    };

    return this.coordinateRepo.insert(coordinate);
  }

  getPoints(projectId: string): Coordinate[] {
    return this.coordinateRepo.findByProject(projectId);
  }

  editPoint(input: UpdateCoordinateInput): Coordinate | null {
    const lat = input.latitude;
    const lon = input.longitude;

    const val = this.validationService.validateCoordinate(lat, lon);
    if (!val.valid) {
      throw new Error(val.errors.map((e) => e.message).join(', '));
    }

    const now = new Date().toISOString();
    return this.coordinateRepo.update(input.id, lat, lon, now);
  }

  deletePoint(id: string): void {
    const coord = this.coordinateRepo.findById(id);
    if (!coord) return;

    const projectId = coord.projectId;
    this.coordinateRepo.delete(id);

    // Re-index remaining coordinates to heal gaps in pointOrder
    const remaining = this.coordinateRepo.findByProject(projectId);
    const orderedIds = remaining.map((c) => c.id);
    this.coordinateRepo.reorder(projectId, orderedIds);
  }

  movePoint(projectId: string, orderedIds: string[]): void {
    this.coordinateRepo.reorder(projectId, orderedIds);
  }

  syncPoints(projectId: string, coordinates: Coordinate[]): void {
    // Validate each coordinate before saving
    coordinates.forEach((c) => {
      const val = this.validationService.validateCoordinate(c.latitude, c.longitude);
      if (!val.valid) {
        throw new Error(
          `Invalid coordinate vertex (order ${c.pointOrder}): ${val.errors[0].message}`
        );
      }
    });
    this.coordinateRepo.syncCoordinates(projectId, coordinates);
  }
}
