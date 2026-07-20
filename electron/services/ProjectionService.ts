import { ProjectionEngine } from '../utils/ProjectionEngine';

export class ProjectionService {
  // Projects WGS84 coordinates into UTM based on the bounding center coordinate
  projectCoordinates(coords: Array<{ latitude: number; longitude: number }>): {
    projected: [number, number][];
    projString: string;
  } {
    if (coords.length === 0) {
      return { projected: [], projString: '' };
    }

    let sumLat = 0;
    let sumLon = 0;
    coords.forEach((c) => {
      sumLat += c.latitude;
      sumLon += c.longitude;
    });
    const centerLat = sumLat / coords.length;
    const centerLon = sumLon / coords.length;

    const projString = ProjectionEngine.getUTMProjectionString(centerLat, centerLon);
    const projected = coords.map((c) =>
      ProjectionEngine.projectCoordinate(c.latitude, c.longitude, projString)
    );

    return { projected, projString };
  }
}
