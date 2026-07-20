import proj4 from 'proj4';

export class ProjectionEngine {
  // Select appropriate UTM projection string based on a lat/lon center point
  static getUTMProjectionString(lat: number, lon: number): string {
    const zone = Math.floor((lon + 180) / 6) + 1;
    const hemisphere = lat >= 0 ? 'north' : 'south';
    return `+proj=utm +zone=${zone} +${hemisphere} +ellps=WGS84 +datum=WGS84 +units=m +no_defs`;
  }

  // Projects WGS84 coordinate [lon, lat] to UTM meters [x, y]
  static projectCoordinate(lat: number, lon: number, projString: string): [number, number] {
    return proj4('EPSG:4326', projString, [lon, lat]);
  }

  // Unprojects UTM meters [x, y] back to WGS84 coordinate [lon, lat]
  static unprojectCoordinate(x: number, y: number, projString: string): [number, number] {
    return proj4(projString, 'EPSG:4326', [x, y]);
  }
}
