import type { Coordinate } from './coordinate';

export interface PolygonGeometry {
  projectId: string;
  vertices: Coordinate[];
  closedRing: Coordinate[];
  vertexCount: number;
  isClosed: boolean;
  createdAt: string;
}
