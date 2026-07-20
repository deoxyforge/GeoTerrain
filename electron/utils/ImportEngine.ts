interface ParsedImportCoordinate {
  latitude: number;
  longitude: number;
  pointOrder?: number;
}

interface NativeImportPayload {
  project: {
    name: string;
    description: string;
  };
  coordinates: ParsedImportCoordinate[];
}

interface GeoJsonInput {
  type: string;
  features?: Array<{
    geometry?: {
      type: string;
      coordinates: number[][][];
    };
  }>;
  geometry?: {
    type: string;
    coordinates: number[][][];
  };
  coordinates?: number[][][];
}

interface NativeImportCoordinate {
  latitude: number | string;
  longitude: number | string;
  pointOrder?: number;
}

export class ImportEngine {
  static parseCSV(content: string): ParsedImportCoordinate[] {
    const lines = content.split(/\r?\n/);
    if (lines.length < 2) {
      throw new Error('CSV file is empty or missing data rows');
    }

    const header = lines[0].split(',');
    const latIndex = header.findIndex((h) => h.trim().toLowerCase() === 'latitude');
    const lonIndex = header.findIndex((h) => h.trim().toLowerCase() === 'longitude');

    if (latIndex === -1 || lonIndex === -1) {
      throw new Error("CSV file must contain 'Latitude' and 'Longitude' columns");
    }

    const coords: ParsedImportCoordinate[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty rows

      const cols = line.split(',');
      const latVal = parseFloat(cols[latIndex]);
      const lonVal = parseFloat(cols[lonIndex]);

      if (isNaN(latVal) || isNaN(lonVal)) {
        throw new Error(`CSV row ${i + 1} contains invalid coordinate numbers`);
      }

      coords.push({
        latitude: latVal,
        longitude: lonVal,
        pointOrder: coords.length + 1,
      });
    }

    if (coords.length === 0) {
      throw new Error('CSV file contains no valid coordinate rows');
    }

    return coords;
  }

  static parseGeoJSON(content: string): ParsedImportCoordinate[] {
    let geojson: GeoJsonInput;
    try {
      geojson = JSON.parse(content) as GeoJsonInput;
    } catch {
      throw new Error('Invalid GeoJSON format: failed to parse JSON');
    }

    let coordinatesRing: number[][] | null = null;

    if (geojson.type === 'FeatureCollection' && geojson.features) {
      const polygonFeature = geojson.features.find(
        (f) => f.geometry && f.geometry.type === 'Polygon'
      );
      if (polygonFeature && polygonFeature.geometry) {
        coordinatesRing = polygonFeature.geometry.coordinates[0];
      }
    } else if (
      geojson.type === 'Feature' &&
      geojson.geometry &&
      geojson.geometry.type === 'Polygon'
    ) {
      coordinatesRing = geojson.geometry.coordinates[0];
    } else if (geojson.type === 'Polygon' && geojson.coordinates) {
      coordinatesRing = geojson.coordinates[0];
    }

    if (!coordinatesRing || coordinatesRing.length === 0) {
      throw new Error('GeoJSON must contain at least one valid Polygon geometry');
    }

    // GeoJSON coordinates are in [longitude, latitude] format
    const coords: ParsedImportCoordinate[] = coordinatesRing.map(
      (ringPt: number[], idx: number) => {
        const lon = parseFloat(ringPt[0].toString());
        const lat = parseFloat(ringPt[1].toString());

        if (isNaN(lat) || isNaN(lon)) {
          throw new Error(`GeoJSON coordinate vertex index #${idx} is not a valid number`);
        }

        return {
          latitude: lat,
          longitude: lon,
        };
      }
    );

    // Remove the closing point if it is duplicate of the first point
    if (coords.length > 1) {
      const first = coords[0];
      const last = coords[coords.length - 1];
      if (
        Math.abs(first.latitude - last.latitude) < 1e-7 &&
        Math.abs(first.longitude - last.longitude) < 1e-7
      ) {
        coords.pop();
      }
    }

    if (coords.length === 0) {
      throw new Error('GeoJSON contains no coordinate points');
    }

    return coords.map((c, i) => ({ ...c, pointOrder: i + 1 }));
  }

  static parseNativeJSON(content: string): NativeImportPayload {
    let payload: {
      schemaVersion?: string;
      data?: {
        project?: {
          name?: string;
          description?: string;
        };
        coordinates?: NativeImportCoordinate[];
      };
    };

    try {
      payload = JSON.parse(content);
    } catch {
      throw new Error('Invalid JSON format: failed to parse file');
    }

    if (payload.schemaVersion !== '1.0.0') {
      throw new Error(`Unsupported schema version: ${payload.schemaVersion ?? 'unknown'}`);
    }

    const data = payload.data;
    if (!data || !data.project || !data.project.name || !data.coordinates) {
      throw new Error('Native JSON is corrupted or missing critical metadata');
    }

    const coords: ParsedImportCoordinate[] = data.coordinates.map(
      (c: NativeImportCoordinate, idx: number) => {
        const lat = parseFloat(c.latitude.toString());
        const lon = parseFloat(c.longitude.toString());

        if (isNaN(lat) || isNaN(lon)) {
          throw new Error(`JSON coordinate point index #${idx} contains invalid numbers`);
        }

        return {
          latitude: lat,
          longitude: lon,
          pointOrder: c.pointOrder ?? idx + 1,
        };
      }
    );

    return {
      project: {
        name: data.project.name.trim(),
        description: (data.project.description || '').trim(),
      },
      coordinates: coords.sort((a, b) => (a.pointOrder ?? 0) - (b.pointOrder ?? 0)),
    };
  }
}
