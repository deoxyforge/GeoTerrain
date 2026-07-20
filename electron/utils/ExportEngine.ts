import type { Project } from '../../src/types/project';
import type { Coordinate } from '../../src/types/coordinate';
import type { PolygonResult } from '../../src/types/result';

export class ExportEngine {
  static toNativeJSON(
    project: Project,
    coordinates: Coordinate[],
    result: PolygonResult | null
  ): string {
    const payload = {
      schemaVersion: '1.0.0',
      appVersion: '1.0.0',
      exportTimestamp: new Date().toISOString(),
      data: {
        project: {
          name: project.name,
          description: project.description,
        },
        coordinates: coordinates.map((c) => ({
          latitude: c.latitude,
          longitude: c.longitude,
          pointOrder: c.pointOrder,
        })),
        result: result
          ? {
              areaSqMeters: result.areaSqMeters,
              areaHectares: result.areaHectares,
              areaSqKilometers: result.areaSqKilometers,
              areaAcres: result.areaAcres,
              perimeter: result.perimeter,
              vertexCount: result.vertexCount,
              centroidLat: result.centroidLat,
              centroidLon: result.centroidLon,
            }
          : null,
      },
    };
    return JSON.stringify(payload, null, 2);
  }

  static toGeoJSON(
    project: Project,
    coordinates: Coordinate[],
    result: PolygonResult | null
  ): string {
    if (coordinates.length < 3) {
      throw new Error('Cannot export GeoJSON: polygon requires at least 3 coordinates');
    }

    // Sort coordinates by pointOrder
    const sorted = [...coordinates].sort((a, b) => a.pointOrder - b.pointOrder);

    // Build closed loop: GeoJSON requires [longitude, latitude]
    const ring = sorted.map((c) => [c.longitude, c.latitude]);
    ring.push([sorted[0].longitude, sorted[0].latitude]); // close the loop

    const featureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [ring],
          },
          properties: {
            projectId: project.id,
            projectName: project.name,
            projectDescription: project.description,
            exportTimestamp: new Date().toISOString(),
            measurements: result
              ? {
                  areaSqMeters: result.areaSqMeters,
                  areaHectares: result.areaHectares,
                  areaSqKilometers: result.areaSqKilometers,
                  areaAcres: result.areaAcres,
                  perimeterMeters: result.perimeter,
                  vertexCount: result.vertexCount,
                  centroid: {
                    latitude: result.centroidLat,
                    longitude: result.centroidLon,
                  },
                }
              : null,
          },
        },
      ],
    };

    return JSON.stringify(featureCollection, null, 2);
  }

  static toCSV(coordinates: Coordinate[]): string {
    const sorted = [...coordinates].sort((a, b) => a.pointOrder - b.pointOrder);
    const header = 'Point Number,Latitude,Longitude\n';
    const rows = sorted
      .map((c) => `${c.pointOrder},${c.latitude.toFixed(6)},${c.longitude.toFixed(6)}`)
      .join('\n');
    return header + rows;
  }
}
