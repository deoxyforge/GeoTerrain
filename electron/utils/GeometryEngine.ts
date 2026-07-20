import type { Coordinate } from '../../src/types/coordinate';
import type { PolygonGeometry } from '../../src/types/geometry';

export class PolygonBuilder {
  static sortCoordinates(coordinates: Coordinate[]): Coordinate[] {
    return [...coordinates].sort((a, b) => a.pointOrder - b.pointOrder);
  }

  static closeRing(coordinates: Coordinate[]): Coordinate[] {
    const closed = [...coordinates];
    if (coordinates.length > 0) {
      const first = coordinates[0];
      closed.push({
        ...first,
        id: `${first.id}-closed`,
        pointOrder: coordinates.length + 1,
      });
    }
    return closed;
  }
}

export class GeometryEngine {
  static build(coordinates: Coordinate[], projectId: string): PolygonGeometry {
    const sorted = PolygonBuilder.sortCoordinates(coordinates);
    const closedRing = PolygonBuilder.closeRing(sorted);

    return {
      projectId,
      vertices: sorted,
      closedRing,
      vertexCount: sorted.length,
      isClosed: sorted.length >= 3,
      createdAt: new Date().toISOString(),
    };
  }
}
